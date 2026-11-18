/* Zen Hogar Gestión · Motion de marca Zen Hogar: convergencia de discos y revelación.
   Solo presentación; no participa en autenticación ni modifica datos. */
let zhBrandAssemblyToken=0;
let zhBrandAssemblyStartedAt=0;
let zhBrandAssemblyActive=false;
function zhBrandAssemblyStart(){
  const layer=document.getElementById('zhBrandAssembly');
  if(!layer)return;
  ++zhBrandAssemblyToken;
  zhBrandAssemblyStartedAt=Date.now();
  zhBrandAssemblyActive=true;
  layer.classList.remove('is-playing','is-leaving');
  layer.hidden=false;
  layer.setAttribute('aria-hidden','false');
  // Reinicio limpio de los movimientos en cada ingreso.
  void layer.offsetWidth;
  layer.classList.add('is-playing');
}
function zhBrandAssemblyDismiss(){
  const layer=document.getElementById('zhBrandAssembly');
  ++zhBrandAssemblyToken;
  zhBrandAssemblyActive=false;
  if(!layer)return;
  layer.classList.remove('is-playing','is-leaving');
  layer.hidden=true;
  layer.setAttribute('aria-hidden','true');
}
async function zhBrandAssemblyFinish(){
  if(!zhBrandAssemblyActive)return;
  const layer=document.getElementById('zhBrandAssembly');
  if(!layer)return;
  const token=zhBrandAssemblyToken;
  const reduce=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const elapsed=Date.now()-zhBrandAssemblyStartedAt;
  // Tiempo mínimo solo si la carga es rápida; no bloquea la app si tarda más.
  const remaining=Math.max(0,(reduce?0:3050)-elapsed);
  if(remaining)await new Promise(done=>setTimeout(done,remaining));
  if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive)return;
  if(!reduce){
    layer.classList.add('is-leaving');
    await new Promise(done=>setTimeout(done,350));
    if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive)return;
  }
  zhBrandAssemblyDismiss();
}
