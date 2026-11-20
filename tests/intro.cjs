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
  assert.equal((svg.match(/class="zh-v8-dot /g)||[]).length,3,'deben existir tres puntos');
});

test('Animación actual es lineal en punto y línea',()=>{
  assert.ok(html.includes('progress=raw'),'el avance actual debe ser lineal');
  assert.ok(!html.includes('easeOut*.72+smooth*.28'),'no debe quedar el easing combinado anterior');
});

test('Rutas y puntos comparten reloj requestAnimationFrame',()=>{
  const start=html.indexOf('function zhBrandAssemblyStart()');
  assert.ok(start>=0,'falta función de inicio');
  const chunk=html.slice(start,start+7000);
  assert.ok(chunk.includes('requestAnimationFrame(update)'),'falta RAF');
  assert.ok(chunk.includes("item.dot.setAttribute('transform'"),'el punto no se actualiza en el mismo loop');
  assert.ok(chunk.includes('item.route.style.strokeDashoffset'),'la línea no se actualiza en el mismo loop');
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

console.log(`\nIntro: ${passed}/5 pruebas correctas`);
if(process.exitCode)process.exit(1);
