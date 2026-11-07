/* Instalação PWA: banner educativo, sem solicitar permissão de notificações push. */
(() => {
  'use strict';
  const KEY='astromente-install-prompt-v1';
  let deferred=null;
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
  const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  const isMobile=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||window.matchMedia('(max-width: 720px)').matches;
  let banner;
  function dismiss(){if(banner){banner.remove();banner=null;}localStorage.setItem(KEY,String(Date.now()));}
  function show(){
    if(banner||isStandalone()||!isMobile())return;
    const last=Number(localStorage.getItem(KEY)||0);
    if(last && Date.now()-last<7*86400000)return;
    banner=document.createElement('section');
    banner.className='install-banner';banner.setAttribute('role','dialog');banner.setAttribute('aria-label','Instale o AstroMente no celular');
    banner.innerHTML=`<div class="install-banner-icon">🚀</div><div class="install-banner-content"><strong>Leve a aventura para a tela inicial!</strong><p>Instale o AstroMente no celular. É gratuito, sem anúncios e você volta para sua missão com um toque.</p><div class="install-banner-actions"><button type="button" class="install-action" id="install-now">Adicionar à tela inicial</button><button type="button" class="install-dismiss" id="install-later">Agora não</button></div><p id="install-guide" class="install-guide" hidden></p></div><button type="button" id="install-close" class="install-close" aria-label="Fechar">×</button>`;
    document.body.appendChild(banner);
    banner.querySelector('#install-close').addEventListener('click',dismiss);
    banner.querySelector('#install-later').addEventListener('click',dismiss);
    banner.querySelector('#install-now').addEventListener('click',async()=>{
      if(deferred){
        const prompt=deferred;deferred=null;
        prompt.prompt();const result=await prompt.userChoice;
        if(result?.outcome==='accepted'){dismiss();return;}
      }
      const guide=banner?.querySelector('#install-guide');if(!guide)return;
      guide.hidden=false;
      guide.textContent=isIOS()
        ? 'No Safari, toque em Compartilhar (quadrado com seta) e depois em “Adicionar à Tela de Início”.'
        : 'No menu do navegador (⋮), escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.';
    });
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;show();});
  window.addEventListener('appinstalled',()=>{deferred=null;dismiss();});
  window.addEventListener('load',()=>{
    if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
    setTimeout(show,1600);
  });
})();
