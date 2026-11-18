/* Zen Hogar Gestión · V2 Premium Limpio: armado de siete capas completas y revelación suave.
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
  // V2: 3,58 s de composición y 0,22 s de salida (~3,8 s); si la carga tarda, no se añade espera.
  const remaining=Math.max(0,(reduce?0:3580)-elapsed);
  if(remaining)await new Promise(done=>setTimeout(done,remaining));
  if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive)return;
  if(!reduce){
    layer.classList.add('is-leaving');
    await new Promise(done=>setTimeout(done,220));
    if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive)return;
  }
  zhBrandAssemblyDismiss();
}
