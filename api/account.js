/** Cadastro de responsáveis e sincronização de uma jornada por família.
 *  O navegador nunca recebe senha, token de sessão ou acesso direto ao banco. */
import { neon } from '@neondatabase/serverless';
import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE='__Host-astro_session';
const TTL=45*24*60*60;
const hash=s=>createHash('sha256').update(s).digest('hex');
const sql=()=>{
  if(!process.env.DATABASE_URL) throw Error('DATABASE_URL não configurado');
  return neon(process.env.DATABASE_URL);
};
const json=(res,status,body)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.status(status).end(JSON.stringify(body));};
const failure=(res,status,message)=>json(res,status,{ok:false,error:message});
const cookie=(res,val,maxAge)=>res.setHeader('Set-Cookie',`${COOKIE}=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
const readCookie=req=>{
  const pairs=String(req.headers.cookie||'').split(';').map(s=>s.trim());
  const raw=pairs.find(p=>p.startsWith(COOKIE+'='));
  const v=raw?raw.slice(COOKIE.length+1):'';
  return /^[0-9a-f]{64}$/.test(v)?v:null;
};
const saltedPassword=p=>{const salt=randomBytes(16).toString('hex');return `scrypt:${salt}:${scryptSync(p,salt,64).toString('hex')}`;};
const checkPassword=(p,stored)=>{
  const parts=String(stored||'').split(':');
  if(parts.length!==3||parts[0]!=='scrypt')return false;
  const actual=scryptSync(p,parts[1],64);
  const expected=Buffer.from(parts[2],'hex');
  return expected.length===actual.length&&timingSafeEqual(actual,expected);
};
const normalizeEmail=v=>String(v||'').trim().toLowerCase();
const validEmail=v=>v.length<=254&&/^[^\s@]{1,64}@[^\s@]+\.[^\s@]+$/.test(v);
const validState=s=>{
  if(!s||s.version!==1||typeof s!=='object'||Array.isArray(s))return false;
  const p=s.profile;
  if(!p||typeof p.nickname!=='string'||p.nickname.length<1||p.nickname.length>22||
    !['4','5-6','7-9','10-12'].includes(p.age)||!['lumi','nina','tito','astro'].includes(p.avatar)||
    typeof p.reward!=='string'||p.reward.length>100)return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s.startDate)||typeof s.days!=='object'||
     !s.days||Array.isArray(s.days)||typeof s.mistakes!=='object'||!s.mistakes||Array.isArray(s.mistakes))return false;
  if(Object.keys(s.days).length>30||Object.keys(s.mistakes).length>500)return false;
  if(Object.keys(s.days).some(k=>!/^(?:[0-9]|[12][0-9])$/.test(k)))return false;
  if(Object.values(s.days).some(d=>!d||typeof d!=='object'||![15,30].includes(d.answered)||
   !Number.isInteger(d.correct)||d.correct<0||d.correct>d.answered||d.wrong!==d.answered-d.correct||
   (d.date==='2026-11-07'&&d.answered!==30)))return false;
  return true;
};
async function sessionUser(db,req){
  const token=readCookie(req);
  if(!token)return null;
  const rows=await db`SELECT f.id, f.email FROM astro_sessions AS s JOIN astro_families AS f ON f.id=s.family_id WHERE s.token_hash=${hash(token)} AND s.expires_at>NOW() LIMIT 1`;
  return rows[0]||null;
}
async function issueSession(db,res,id){
  const token=randomBytes(32).toString('hex');
  await db`INSERT INTO astro_sessions(token_hash,family_id,expires_at) VALUES (${hash(token)},${id},NOW()+INTERVAL '45 days')`;
  cookie(res,token,TTL);
}
async function failLogin(db,emailHash){
  await db`INSERT INTO astro_auth_limits(email_hash,failures,window_started) VALUES (${emailHash},1,NOW()) ON CONFLICT (email_hash) DO UPDATE SET failures=CASE WHEN astro_auth_limits.window_started < NOW()-INTERVAL '15 minutes' THEN 1 ELSE astro_auth_limits.failures+1 END, window_started=CASE WHEN astro_auth_limits.window_started < NOW()-INTERVAL '15 minutes' THEN NOW() ELSE astro_auth_limits.window_started END`;
}
export default async function handler(req,res){
  if(!['GET','POST'].includes(req.method))return failure(res,405,'Método não permitido.');
  if(req.method==='POST'){
    const origin=req.headers.origin;
    const hostname=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
    if(!origin||!hostname||new URL(origin).host!==hostname)return failure(res,403,'Origem não autorizada.');
    const size=Number(req.headers['content-length']||0);
    if(size>220000)return failure(res,413,'Dados muito grandes.');
  }
  let db;
  try{db=sql();}catch{return failure(res,503,'Cadastro temporariamente indisponível.');}
  try{
    if(req.method==='GET'){
      const user=await sessionUser(db,req);
      if(!user)return json(res,200,{ok:true,authenticated:false});
      const game=await db`SELECT state,revision FROM astro_family_games WHERE family_id=${user.id} LIMIT 1`;
      return json(res,200,{ok:true,authenticated:true,email:user.email,state:game[0]?.state||null,revision:game[0]?.revision||0});
    }
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const action=String(body.action||'');
    if(['register','login'].includes(action)){
      const email=normalizeEmail(body.email),password=String(body.password||'');
      if(!validEmail(email)||password.length<10||password.length>128)return failure(res,400,'Informe um e-mail válido e senha de pelo menos 10 caracteres.');
      if(action==='register'){
        if(body.consent!==true)return failure(res,400,'É necessário o consentimento do responsável.');
        const existing=await db`SELECT id FROM astro_families WHERE email=${email} LIMIT 1`;
        if(existing.length)return failure(res,409,'Este e-mail já tem cadastro. Entre na sua conta.');
        const rows=await db`INSERT INTO astro_families(email,password_hash) VALUES (${email},${saltedPassword(password)}) RETURNING id`;
        await db`INSERT INTO astro_family_games(family_id,state,revision) VALUES (${rows[0].id},NULL,0)`;
        await issueSession(db,res,rows[0].id);
        return json(res,201,{ok:true,authenticated:true,email,state:null,revision:0});
      }
      const emailHash=hash(email),limit=await db`SELECT failures,window_started FROM astro_auth_limits WHERE email_hash=${emailHash} LIMIT 1`;
      if(limit[0]&&limit[0].failures>=6&&new Date(limit[0].window_started).getTime()>Date.now()-15*60*1000)return failure(res,429,'Muitas tentativas. Tente novamente em 15 minutos.');
      const rows=await db`SELECT id,password_hash FROM astro_families WHERE email=${email} LIMIT 1`;
      // Mesmo cálculo caso a conta não exista reduz diferença entre respostas.
      const valid=rows.length?checkPassword(password,rows[0].password_hash):checkPassword(password,'scrypt:00000000000000000000000000000000:'+('00'.repeat(64)));
      if(!valid){await failLogin(db,emailHash);return failure(res,401,'E-mail ou senha incorretos.');}
      await db`DELETE FROM astro_auth_limits WHERE email_hash=${emailHash}`;
      await issueSession(db,res,rows[0].id);
      const game=await db`SELECT state,revision FROM astro_family_games WHERE family_id=${rows[0].id} LIMIT 1`;
      return json(res,200,{ok:true,authenticated:true,email,state:game[0]?.state||null,revision:game[0]?.revision||0});
    }
    const user=await sessionUser(db,req);
    if(!user)return failure(res,401,'Entre na conta do responsável para continuar.');
    if(action==='logout'){
      const token=readCookie(req);if(token)await db`DELETE FROM astro_sessions WHERE token_hash=${hash(token)}`;
      cookie(res,'',0);return json(res,200,{ok:true});
    }
    if(action==='save'){
      const game=body.state;
      if(!validState(game)||JSON.stringify(game).length>200000)return failure(res,400,'Dados da jornada inválidos.');
      const revision=Number(body.revision);
      if(!Number.isInteger(revision)||revision<0)return failure(res,400,'Versão inválida.');
      // Atualização condicional impede sobrescrever acidentalmente mudanças de outro aparelho.
      const updated=await db`UPDATE astro_family_games SET state=${JSON.stringify(game)}::jsonb,revision=revision+1,updated_at=NOW() WHERE family_id=${user.id} AND revision=${revision} RETURNING revision`;
      if(!updated.length){const current=await db`SELECT state,revision FROM astro_family_games WHERE family_id=${user.id}`;return json(res,409,{ok:false,error:'Outro aparelho salvou alterações. Reabra sua conta para sincronizar.',state:current[0]?.state||null,revision:current[0]?.revision||0});}
      return json(res,200,{ok:true,revision:updated[0].revision});
    }
    if(action==='delete'){
      if(!checkPassword(String(body.password||''),(await db`SELECT password_hash FROM astro_families WHERE id=${user.id}`)[0]?.password_hash))return failure(res,401,'Senha incorreta.');
      await db`DELETE FROM astro_families WHERE id=${user.id}`;cookie(res,'',0);return json(res,200,{ok:true});
    }
    return failure(res,400,'Operação inválida.');
  }catch(err){
    // Nunca expor instruções SQL, senhas ou mensagens internas ao cliente.
    if(err?.code==='23505')return failure(res,409,'Este e-mail já tem cadastro. Entre na sua conta.');
    console.error('astromente-account',err?.code||err?.name||'unknown');
    return failure(res,500,'Não foi possível concluir esta operação agora.');
  }
}
