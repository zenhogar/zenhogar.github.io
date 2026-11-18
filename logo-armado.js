/* Zen Hogar Gestión · V8 Clean Orbit
   Tres puntos recorren exactamente las mismas rutas que dibujan.
   La animación solo es una bienvenida visual: no accede a auth ni a datos. */
let zhBrandAssemblyToken=0;
let zhBrandAssemblyStartedAt=0;
let zhBrandAssemblyActive=false;
let zhBrandAssemblyRaf=0;

function zhBrandAssemblyStopFrames(){
  if(zhBrandAssemblyRaf){
    cancelAnimationFrame(zhBrandAssemblyRaf);
    zhBrandAssemblyRaf=0;
  }
}
function zhBrandAssemblyStart(){
  const layer=document.getElementById('zhBrandAssembly');
  if(!layer)return;
  ++zhBrandAssemblyToken;
  const token=zhBrandAssemblyToken;
  zhBrandAssemblyStopFrames();
  zhBrandAssemblyStartedAt=Date.now();
  zhBrandAssemblyActive=true;
  layer.classList.remove('is-playing','is-leaving','zh-v8-css-fallback');
  layer.hidden=false;
  layer.setAttribute('aria-hidden','false');

  const reducedMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const svg=layer.querySelector('svg.zh-brand-mark');
  const dots=[...(svg?.querySelectorAll('.zh-v8-dot[data-route]')||[])];
  let routes=[];
  if(!reducedMotion){
    try{
      routes=dots.map(dot=>{
        const route=svg.querySelector('#'+dot.dataset.route);
        if(!route||typeof route.getTotalLength!=='function'||typeof route.getPointAtLength!=='function'){
          throw new Error('Ruta SVG no compatible');
        }
        const length=route.getTotalLength();
        if(!(length>0))throw new Error('Ruta SVG vacía');
        const start=Number(dot.dataset.start);
        const duration=Number(dot.dataset.duration);
        if(!Number.isFinite(start)||!(duration>0))throw new Error('Tiempo de movimiento inválido');
        route.style.strokeDashoffset='100';
        const p=route.getPointAtLength(0);
        dot.setAttribute('transform','translate('+p.x+' '+p.y+')');
        return {dot,route,length,start,duration};
      });
    }catch(_){
      routes=[];
    }
    if(routes.length!==3){
      layer.classList.add('zh-v8-css-fallback');
    }
  }

  // Reiniciar las animaciones CSS en cada inicio o reproducción.
  void layer.offsetWidth;
  layer.classList.add('is-playing');

  if(reducedMotion||routes.length!==3)return;
  const begun=performance.now();
  const update=(time)=>{
    if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive){
      zhBrandAssemblyRaf=0;
      return;
    }
    const elapsed=(time-begun)/1000;
    for(const item of routes){
      const raw=Math.min(1,Math.max(0,(elapsed-item.start)/item.duration));
      // Curva de inicio y fin suave, exactamente igual para punto y trazo.
      const progress=raw*raw*(3-2*raw);
      const p=item.route.getPointAtLength(item.length*progress);
      item.dot.setAttribute('transform','translate('+p.x.toFixed(2)+' '+p.y.toFixed(2)+')');
      item.route.style.strokeDashoffset=(100*(1-progress)).toFixed(3);
    }
    if(elapsed<2.5)zhBrandAssemblyRaf=requestAnimationFrame(update);
    else zhBrandAssemblyRaf=0;
  };
  zhBrandAssemblyRaf=requestAnimationFrame(update);
}
function zhBrandAssemblyDismiss(){
  const layer=document.getElementById('zhBrandAssembly');
  ++zhBrandAssemblyToken;
  zhBrandAssemblyActive=false;
  zhBrandAssemblyStopFrames();
  if(!layer)return;
  layer.classList.remove('is-playing','is-leaving','zh-v8-css-fallback');
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
  // V8: 4.55s de bienvenida y 0.34s de salida. Nunca bloquea el sistema.
  const remaining=Math.max(0,(reduce?0:4550)-elapsed);
  if(remaining)await new Promise(done=>setTimeout(done,remaining));
  if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive)return;
  if(!reduce){
    layer.classList.add('is-leaving');
    await new Promise(done=>setTimeout(done,340));
    if(token!==zhBrandAssemblyToken||!zhBrandAssemblyActive)return;
  }
  zhBrandAssemblyDismiss();
}
