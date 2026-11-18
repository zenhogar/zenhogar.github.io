'use strict';
/* QA visual de la bienvenida Zen Hogar, sin navegador ni credenciales. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'logo-armado.css'),'utf8');
const js=fs.readFileSync(path.join(dir,'logo-armado.js'),'utf8');

function fixture(reduced=false){
  let now=100;
  const delays=[];
  const overlay={
    hidden:true,attributes:{},offsetWidth:150,
    classList:{
      members:new Set(),
      add(...v){v.forEach(x=>this.members.add(x))},
      remove(...v){v.forEach(x=>this.members.delete(x))},
      contains(x){return this.members.has(x)}
    },
    setAttribute(k,v){this.attributes[k]=v}
  };
  const api=new Function('document','window','Date','setTimeout',
    js+';return {start:zhBrandAssemblyStart,finish:zhBrandAssemblyFinish,dismiss:zhBrandAssemblyDismiss,info:()=>({active:zhBrandAssemblyActive,token:zhBrandAssemblyToken})};')(
      {getElementById:id=>id==='zhBrandAssembly'?overlay:null},
      {matchMedia:()=>({matches:reduced})},
      {now:()=>now},
      (cb,ms)=>{delays.push(ms);now+=ms;cb()}
    );
  return {api,overlay,delays};
}
(async()=>{
 try{
  new Function(js);
  const pieces=['outer','inner','house','leaf-left','leaf-right','sun','windows'];
  for(const piece of pieces)assert.equal(
    (html.match(new RegExp('class="zh-logo-layer zh-logo-'+piece+'"','g'))||[]).length,1,'Falta la capa '+piece
  );
  const svg=html.match(/<svg class="zh-brand-mark"[\s\S]*?<\/svg>/)?.[0]||'';
  assert.equal((html.match(/id="zhBrandAssembly"/g)||[]).length,1);
  assert.equal((html.match(/class="zh-logo-layer /g)||[]).length,7);
  assert.ok(svg.includes('href="#zhLogo-ring-dark"'),'El aro azul debe ser completo');
  assert.ok(svg.includes('<circle cx="500" cy="496" r="346"'),'El aro menta debe ser completo');
  assert.ok(!/<clipPath\b|<mask\b/.test(svg),'Los círculos no llevan cortes');
  assert.ok(!svg.includes('zh-puzzle-'),'No usar rompecabezas');
  assert.ok(!html.includes('id="zhNeonWelcome"'));
  assert.ok(!html.includes('class="brand-mark zh-gate-logo"'));
  assert.ok(html.includes('state.client.auth.signInWithPassword({email,password})'));
  assert.ok(html.includes('async function startApp(){\n  // Mostrar la firma visual al entrar, mientras se carga la empresa; nunca antes de autenticar.\n  zhBrandAssemblyStart();'));
  assert.ok(html.includes('await zhBrandAssemblyFinish();'));
  assert.ok(html.includes('logo-armado.css?v=20261118-brand-ident'));
  assert.ok(html.includes('logo-armado.js?v=20261118-brand-ident'));
  console.log('✓ Logo original intacto y acceso seguro');

  assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
  assert.ok(css.includes('translate3d(-430px') && css.includes('translate3d(430px'),
    'Los aros deben converger desde lados opuestos');
  assert.ok(css.includes('@keyframes zhIdentRingLeft'));
  assert.ok(css.includes('@keyframes zhIdentRingRight'));
  assert.ok(css.includes('@keyframes zhIdentCore'));
  assert.ok(css.includes('.zh-logo-leaf-left') && css.includes('.zh-logo-leaf-right'));
  assert.ok(!css.includes('zhLayerFitPremium'),'No conservar la antigua animación de rebotes');
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  console.log('✓ Movimiento editorial, aros completos y accesibilidad');

  const normal=fixture();
  normal.api.start();
  assert.equal(normal.overlay.hidden,false);
  assert.equal(normal.overlay.attributes['aria-hidden'],'false');
  assert.ok(normal.overlay.classList.contains('is-playing'));
  await normal.api.finish();
  assert.deepEqual(normal.delays,[2730,360]);
  assert.equal(normal.overlay.hidden,true);
  assert.equal(normal.api.info().active,false);
  console.log('✓ Duración breve y cierre fundido');

  const skip=fixture();
  skip.api.start();skip.api.dismiss();
  assert.equal(skip.overlay.hidden,true);
  await skip.api.finish();
  assert.deepEqual(skip.delays,[]);
  console.log('✓ Omitir animación nunca bloquea el panel');

  const reduced=fixture(true);
  reduced.api.start();await reduced.api.finish();
  assert.deepEqual(reduced.delays,[]);
  assert.equal(reduced.overlay.hidden,true);
  console.log('✓ Movimiento reducido evita la espera');

  const replay=fixture();
  replay.api.start();await replay.api.finish();replay.api.start();
  assert.equal(replay.overlay.hidden,false);
  assert.ok(replay.overlay.classList.contains('is-playing'));
  await replay.api.finish();
  assert.equal(replay.overlay.hidden,true);
  console.log('✓ Reingreso reinicia la secuencia correctamente');
  console.log('Pruebas de bienvenida: 6/6');
 }catch(err){console.error(err.stack||err);process.exitCode=1}
})();
