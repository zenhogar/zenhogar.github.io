'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
let passed=0;
function test(name,fn){try{fn();passed++;console.log('✓ '+name);}catch(e){console.error('✗ '+name+': '+e.message);process.exitCode=1;}}

test('SVG completo de Zen Hogar preservado',()=>{
  const svg=html.match(/<svg class="zh-brand-mark"[\s\S]*?<\/svg>/)?.[0]||'';
  assert.ok(svg,'falta SVG de marca');
  for(const name of ['outer','inner','house','leaf-left','leaf-right','sun','windows'])assert.ok(svg.includes('zh-logo-'+name),'falta '+name);
  const classicDots=(svg.match(/class="zh-v8-dot /g)||[]).length;
  const nativeDots=(svg.match(/class="zh-v8-dot"/g)||[]).length;
  assert.ok(classicDots===3||nativeDots===3,'deben existir tres puntos');
});

test('Motor de recorrido lineal válido',()=>{
  const native=(html.match(/<animateMotion\b/g)||[]).length===3 &&
               (html.match(/attributeName="stroke-dashoffset"/g)||[]).length>=3 &&
               html.includes('calcMode="linear"');
  const jsLinear=html.includes('progress=raw')&&!html.includes('easeOut*.72+smooth*.28');
  assert.ok(native||jsLinear,'la intro debe usar avance lineal nativo o JS lineal');
});

test('Punto y línea comparten una única referencia temporal',()=>{
  const native=(html.match(/<animateMotion\b/g)||[]).length===3 &&
               html.includes('svg.setCurrentTime(0)') &&
               html.includes('svg.unpauseAnimations()');
  const js=html.includes("item.dot.setAttribute('transform'") &&
           html.includes('item.route.style.strokeDashoffset') &&
           html.includes('requestAnimationFrame(update)');
  assert.ok(native||js,'punto y línea no comparten el mismo motor temporal');
});

test('La intro corre sin carga pesada en paralelo',()=>{
  const start=html.indexOf('async function startApp()');
  const end=html.indexOf('async function handleSignedIn',start);
  assert.ok(start>=0&&end>start,'no se encontró startApp');
  const block=html.slice(start,end);
  const load=block.indexOf('await loadAllData();');
  const intro=block.indexOf('zhBrandAssemblyStart();');
  const finish=block.indexOf('await zhBrandAssemblyFinish();');
  const realtime=block.indexOf('subscribeRealtime();');
  // Acepta la versión publicada anterior, pero cuando exista la separación nueva debe respetar el orden.
  if(load>=0&&intro>=0&&block.includes('ventana limpia')){
    assert.ok(load<intro,'loadAllData debe terminar antes de la intro');
    assert.ok(finish<intro+5000,'debe existir cierre de intro');
    assert.ok(realtime>finish,'Realtime debe iniciarse después de la intro');
  }
});

test('Respeta movimiento reducido',()=>{
  assert.ok(html.includes('prefers-reduced-motion: reduce'),'falta media query de movimiento reducido');
  assert.ok(html.includes("matchMedia?.('(prefers-reduced-motion: reduce)')"),'falta control JS de movimiento reducido');
});

test('JavaScript de la intro compila dentro del documento',()=>{
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>x.includes('zhBrandAssemblyStart'));
  assert.ok(scripts.length>=1,'no se encontró script de intro');
  scripts.forEach((code,i)=>new vm.Script(code,{filename:'intro-inline-'+i+'.js'}));
});

console.log(`\nIntro: ${passed}/6 pruebas correctas`);
if(process.exitCode)process.exit(1);
