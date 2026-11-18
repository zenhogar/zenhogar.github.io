/* Zen Hogar Gestión · V6: rutas vectoriales exactas, puntos sincronizados y colores originales por capas.
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
  // Los tres puntos siguen las rutas originales del SVG (no órbitas inventadas).
  // beginElementAt permite sincronizarlos sin usar temporizadores del navegador.
  const svg=layer.querySelector('svg.zh-brand-mark');
  const motions=[...(svg?.querySelectorAll('animateMotion.zh-v6-motion')||[])];
  const reduce=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(!reduce&&motions.length===3&&motions.every(m=>typeof m.beginElementAt==='function')){
    layer.classList.remove('zh-v6-fallback');
    motions.forEach(m=>{
      try{m.endElement?.()}catch(_){}
      try{m.beginElementAt(Number(m.dataset.delay||0))}
      catch(_){layer.classList.add('zh-v6-fallback')}
    });
  }else if(!reduce){
    layer.classList.add('zh-v6-fallback');
    [['a',511,62],['b',500,150],['c',125,408]].forEach(([name,cx,cy])=>{
      const dot=svg?.querySelector('.zh-v6-dot-'+name);
      if(dot){dot.setAttribute('cx',String(cx));dot.setAttribute('cy',String(cy))}
    });
  }
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
  // V6: composición de 4,40 s y salida de 0,30 s; autenticación y datos intactos.
  const remaining=Math.max(0,(reduce?0:4400)-elapsed);
  if(remaining)await new Promise(done=>setTimeout(done,remaining));
  if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive)return;
  if(!reduce){
    layer.classList.add('is-leaving');
    await new Promise(done=>setTimeout(done,300));
    if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive)return;
  }
  zhBrandAssemblyDismiss();
}
