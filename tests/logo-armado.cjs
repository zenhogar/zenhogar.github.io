'use strict';
/* Pruebas de bienvenida motion ident Zen Hogar, sin navegador ni credenciales. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'logo-armado.css'),'utf8');
const js=fs.readFileSync(path.join(root,'logo-armado.js'),'utf8');

function fixture(reduced=false){
  let now=100;const delays=[];
  const layer={
    hidden:true,attributes:{},offsetWidth:140,
    classList:{
      members:new Set(),
      add(...xs){xs.forEach(x=>this.members.add(x))},
      remove(...xs){xs.forEach(x=>this.members.delete(x))},
      contains(x){return this.members.has(x)}
    },
    setAttribute(name,value){this.attributes[name]=value}
  };
  const api=new Function('document','window','Date','setTimeout',
    js+';return {start:zhBrandAssemblyStart,finish:zhBrandAssemblyFinish,dismiss:zhBrandAssemblyDismiss,info:()=>({active:zhBrandAssemblyActive,token:zhBrandAssemblyToken})};')(
    {getElementById:id=>id==='zhBrandAssembly'?layer:null},
    {matchMedia:()=>({matches:reduced})},
    {now:()=>now},
    (done,delay)=>{delays.push(delay);now+=delay;done()}
  );
  return {layer,delays,api};
}
(async()=>{
 try{
  new Function(js);
  const svg=html.match(/<svg class="zh-brand-mark"[\s\S]*?<\/svg>/)?.[0]||'';
  assert.ok(svg,'Se debe conservar el SVG del logo original');
  for(const name of ['outer','inner','house','leaf-left','leaf-right','sun','windows']){
    assert.equal((svg.match(new RegExp('class="zh-logo-layer zh-logo-'+name+'"','g'))||[]).length,1,'Falta capa completa '+name);
  }
  assert.equal((svg.match(/class="zh-logo-layer /g)||[]).length,7);
  assert.ok(svg.includes('href="#zhLogo-ring-dark"'),'Círculo exterior original completo');
  assert.ok(svg.includes('<circle cx="500" cy="496" r="346"'),'Círculo interior completo');
  assert.ok(!/<clipPath\b|<mask\b/.test(svg),'No deben recortarse las formas');
  console.log('✓ Logo Zen Hogar completo y aros sin cortes');

  assert.equal((svg.match(/class="zh-brand-disc zh-brand-disc-/g)||[]).length,2,'Deben converger dos discos');
  assert.ok(svg.includes('class="zh-brand-plate"'),'Debe revelarse el fondo claro del emblema');
  assert.ok(css.includes('@keyframes zhDuoLeft')&&css.includes('@keyframes zhDuoRight'));
  assert.ok(css.includes('mix-blend-mode:screen'),'Superposición cromática de círculos');
  assert.ok(css.includes('background:radial-gradient(')&&css.includes('#07151c'),'Fondo cinematográfico');
  assert.ok(!css.includes('zhLayerFitPremium')&&!css.includes('zhIdentRingLeft'),'No cargar animaciones anteriores');
  assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
  console.log('✓ Convergencia de círculos, identidad cromática y CSS consistente');

  assert.equal((html.match(/id="zhBrandAssembly"/g)||[]).length,1);
  assert.ok(html.includes('logo-armado.css?v=20261118-motion-duo'));
  assert.ok(html.includes('logo-armado.js?v=20261118-motion-duo'));
  assert.ok(!html.includes('class="brand-mark zh-gate-logo"'),'Acceso sin logo estático');
  assert.ok(html.includes('state.client.auth.signInWithPassword({email,password})'));
  assert.ok(html.includes('zhBrandAssemblyStart();')&&html.includes('await zhBrandAssemblyFinish();'));
  assert.ok(html.includes('onclick="zhBrandAssemblyDismiss()"'));
  console.log('✓ Acceso seguro y recursos actualizados');

  const normal=fixture();normal.api.start();
  assert.equal(normal.layer.hidden,false);
  assert.equal(normal.layer.attributes['aria-hidden'],'false');
  assert.ok(normal.layer.classList.contains('is-playing'));
  await normal.api.finish();
  assert.deepEqual(normal.delays,[3050,350]);
  assert.equal(normal.layer.hidden,true);
  assert.equal(normal.api.info().active,false);
  console.log('✓ Animación completa de 3,4 segundos y fundido final');

  const skip=fixture();skip.api.start();skip.api.dismiss();
  assert.equal(skip.layer.hidden,true);
  await skip.api.finish();
  assert.deepEqual(skip.delays,[]);
  console.log('✓ Omitir no bloquea el panel');

  const reduced=fixture(true);
  reduced.api.start();await reduced.api.finish();
  assert.deepEqual(reduced.delays,[]);
  assert.equal(reduced.layer.hidden,true);
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(css.includes('animation:none!important'));
  console.log('✓ Movimiento reducido sin espera');

  const replay=fixture();
  replay.api.start();await replay.api.finish();replay.api.start();
  assert.equal(replay.layer.hidden,false);
  assert.ok(replay.layer.classList.contains('is-playing'));
  await replay.api.finish();
  assert.equal(replay.layer.hidden,true);
  console.log('✓ Reingreso reinicia el movimiento');
  console.log('Pruebas de motion ident: 7/7');
 }catch(err){console.error(err.stack||err);process.exitCode=1}
})();
