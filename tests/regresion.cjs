'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let passed=0;
function test(name,fn){try{fn();passed++;console.log('✓ '+name);}catch(e){console.error('✗ '+name+': '+e.message);process.exitCode=1;}}

test('HTML principal presente y autocontenido',()=>{
  assert.ok(html.length>500000,'index.html demasiado pequeño para la app actual');
  assert.ok(html.includes('<style')&&html.includes('<script'),'faltan recursos embebidos');
});

test('JavaScript embebido compilable',()=>{
  const embedded=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>x.trim());
  assert.ok(embedded.length>=4,'se esperaban varios scripts embebidos');
  embedded.forEach((code,i)=>new vm.Script(code,{filename:'index-inline-'+i+'.js'}));
});

test('CSS embebido balanceado',()=>{
  const styles=[...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]);
  assert.ok(styles.length>=2,'faltan bloques de estilos');
  for(const [i,css] of styles.entries()){
    assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS desbalanceado en bloque '+i);
  }
});

test('Funciones críticas de negocio conservadas',()=>{
  for(const symbol of ['create_sale_v2','create_purchase','upsert_product_v4','archive_product','cancel_sale','loadAllData','renderReports','fetchAllPages','subscribeRealtime']){
    assert.ok(html.includes(symbol),symbol+' falta en index.html');
  }
});

test('Autenticación y cliente Supabase seguros',()=>{
  assert.ok(html.includes('signInWithPassword'),'falta login por contraseña');
  assert.ok(html.includes('sb_publishable_'),'falta clave publicable');
  assert.ok(!/sb_secret_/i.test(html),'no debe existir una clave secreta en el cliente');
  assert.ok(!/(?:supabaseKey|key|apikey)\s*[:=]\s*['"]?[^'"\n]*service_role/i.test(html),'no debe configurarse service_role como credencial');
});

test('Intro actual integrada después del login',()=>{
  assert.equal((html.match(/id="zhBrandAssembly"/g)||[]).length,1,'debe existir una sola intro');
  assert.ok(html.includes('zhBrandAssemblyStart();'),'falta inicio de intro');
  assert.ok(html.includes('await zhBrandAssemblyFinish();'),'falta espera de intro');
  const start=html.indexOf('async function startApp()');
  assert.ok(start>=0,'falta startApp');
  const slice=html.slice(start,start+1800);
  assert.ok(slice.includes('zhBrandAssemblyStart();'),'startApp no inicia la intro');
});

console.log(`\nRegresión: ${passed}/6 pruebas correctas`);
if(process.exitCode)process.exit(1);
