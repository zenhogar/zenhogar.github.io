'use strict';
/* Zen Hogar Gestión · Pruebas del logo original armado por capas.
   No requiere credenciales ni conexión con Supabase. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'logo-armado.css'),'utf8');
const js=fs.readFileSync(path.join(dir,'logo-armado.js'),'utf8');
function fixture(reduced=false){
  let now=100;const delays=[];
  const overlay={hidden:true,attributes:{},offsetWidth:150,
    classList:{members:new Set(),add(...v){v.forEach(x=>this.members.add(x))},remove(...v){v.forEach(x=>this.members.delete(x))},contains(x){return this.members.has(x)}},
    setAttribute(k,v){this.attributes[k]=v}};
  const api=new Function('document','window','Date','setTimeout',
    js+';return {start:zhBrandAssemblyStart,finish:zhBrandAssemblyFinish,dismiss:zhBrandAssemblyDismiss,info:()=>({active:zhBrandAssemblyActive,token:zhBrandAssemblyToken})};')(
      {getElementById:id=>id==='zhBrandAssembly'?overlay:null},
      {matchMedia:()=>({matches:reduced})},
      {now:()=>now},
      (callback,ms)=>{delays.push(ms);now+=ms;callback();}
    );
  return {api,overlay,delays};
}
(async()=>{
 try{
  new Function(js);
  const pieces=['outer','inner','house','leaf-left','leaf-right','sun','windows'];
  for(const piece of pieces)assert.equal((html.match(new RegExp('class="zh-logo-layer zh-logo-'+piece+'"','g'))||[]).length,1,'Falta capa completa '+piece);
  assert.equal((html.match(/class="zh-logo-layer /g)||[]).length,7,'Cantidad de capas');
  const svg=html.match(/<svg class="zh-brand-mark"[\s\S]*?<\/svg>/)?.[0]||'';
  assert.ok(svg.includes('<circle cx="500" cy="496" r="346"'),'El aro verde debe ser una pieza circular completa');
  assert.ok(svg.includes('href="#zhLogo-ring-dark"'),'El aro exterior debe estar entero');
  assert.ok(!/<clipPath\b|<mask\b/.test(svg),'El logo no debe tener piezas recortadas o máscaras');
  assert.ok(!svg.includes('zh-puzzle-'),'Se deben eliminar los fragmentos antiguos');
  assert.ok(html.includes('viewBox="0 0 1000 1000"'));
  assert.equal((html.match(/id="zhBrandAssembly"/g)||[]).length,1);
  assert.ok(!html.includes('id="zhNeonWelcome"'));
  assert.ok(!html.includes('class="brand-mark zh-gate-logo"'));
  assert.ok(html.includes('state.client.auth.signInWithPassword({email,password})'));
  assert.ok(html.includes('async function startApp(){\n  // Mostrar la firma visual al entrar, mientras se carga la empresa; nunca antes de autenticar.\n  zhBrandAssemblyStart();'));
  assert.ok(html.includes('await zhBrandAssemblyFinish();'));
  assert.ok(html.includes('logo-armado.css?v=20261117-layers-final'));
  assert.ok(html.includes('logo-armado.js?v=20261117-layers-final'));
  assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  assert.ok(css.includes('#033446') && css.includes('#fefbf4'));
  console.log('✓ Aros enteros, siete capas completas y acceso seguro');

  const normal=fixture();
  normal.api.start();
  assert.equal(normal.overlay.hidden,false);
  assert.equal(normal.overlay.attributes['aria-hidden'],'false');
  assert.ok(normal.overlay.classList.contains('is-playing'));
  await normal.api.finish();
  assert.deepEqual(normal.delays,[4100,460]);
  assert.equal(normal.overlay.hidden,true);
  assert.equal(normal.api.info().active,false);
  console.log('✓ Armado por superposición y cierre suave');

  const skip=fixture();
  skip.api.start();skip.api.dismiss();
  await skip.api.finish();
  assert.equal(skip.overlay.hidden,true);
  assert.deepEqual(skip.delays,[]);
  console.log('✓ Omitir sin demoras');

  const reduced=fixture(true);
  reduced.api.start();await reduced.api.finish();
  assert.equal(reduced.overlay.hidden,true);
  assert.deepEqual(reduced.delays,[]);
  console.log('✓ Accesibilidad de movimiento reducido');

  const again=fixture();
  again.api.start();await again.api.finish();again.api.start();
  assert.ok(again.overlay.classList.contains('is-playing'));
  assert.equal(again.overlay.hidden,false);
  await again.api.finish();
  console.log('✓ Reingreso repite el armado');
  console.log('Pruebas de logo: 5/5');
 }catch(err){console.error(err.stack||err);process.exitCode=1;}
})();
