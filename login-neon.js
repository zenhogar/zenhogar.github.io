/* Zen Hogar Gestión · Bienvenida neón pastel.
   Se ejecuta únicamente cuando el flujo original de autenticación abre el panel.
   Sin Supabase, rastreadores, acceso a datos ni librerías. */
let zhNeonWelcomeToken=0;
let zhNeonWelcomeStartedAt=0;
let zhNeonWelcomeActive=false;
function zhNeonWelcomeStart(){
  const overlay=document.getElementById('zhNeonWelcome');
  if(!overlay)return;
  ++zhNeonWelcomeToken;
  zhNeonWelcomeStartedAt=Date.now();
  zhNeonWelcomeActive=true;
  overlay.classList.remove('is-leaving','is-playing');
  overlay.hidden=false;
  overlay.setAttribute('aria-hidden','false');
  // Reiniciar los trazos al ingresar de nuevo, sin reproducir desde mitad del ciclo.
  void overlay.offsetWidth;
  overlay.classList.add('is-playing');
}
function zhNeonWelcomeDismiss(){
  const overlay=document.getElementById('zhNeonWelcome');
  ++zhNeonWelcomeToken;
  zhNeonWelcomeActive=false;
  if(!overlay)return;
  overlay.classList.remove('is-playing','is-leaving');
  overlay.hidden=true;
  overlay.setAttribute('aria-hidden','true');
}
async function zhNeonWelcomeFinish(){
  if(!zhNeonWelcomeActive)return;
  const overlay=document.getElementById('zhNeonWelcome');
  if(!overlay)return;
  const token=zhNeonWelcomeToken;
  const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const minDuration=reduced?0:1950;
  const remaining=Math.max(0,minDuration-(Date.now()-zhNeonWelcomeStartedAt));
  if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
  if(token!==zhNeonWelcomeToken||!zhNeonWelcomeActive)return;
  if(!reduced){
    overlay.classList.add('is-leaving');
    await new Promise(resolve=>setTimeout(resolve,370));
    if(token!==zhNeonWelcomeToken||!zhNeonWelcomeActive)return;
  }
  zhNeonWelcomeDismiss();
}
