'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
let passed=0;
function test(name,fn){try{fn();passed++;console.log('✓ '+name);}catch(e){console.error('✗ '+name+': '+e.message);process.exitCode=1;}}

test('Carga paginada de Supabase activa',()=>{
  assert.ok(html.includes('async function fetchAllPages'),'falta fetchAllPages');
  assert.ok(/pageSize\s*=\s*500/.test(html),'tamaño de página esperado no encontrado');
  assert.ok(html.includes('.range(from,to)'),'la paginación no usa range');
});

test('Consultas principales aisladas por organización',()=>{
  const start=html.indexOf('async function loadAllData({silent=false}={})');
  const end=html.indexOf('function subscribeRealtime()',start);
  assert.ok(start>=0&&end>start,'no se encontró loadAllData');
  const block=html.slice(start,end);
  const matches=block.match(/\.eq\('organization_id',state\.org\.id\)/g)||[];
  assert.ok(matches.length>=9,'faltan filtros organization_id en las consultas principales');
});

test('Navegación y experiencia móvil conservadas',()=>{
  for(const symbol of ['initViewHistory','setView','mobileNav','mobileSaleBtn'])assert.ok(html.includes(symbol),symbol+' falta');
});

test('Ventas y stock mantienen unidades variables',()=>{
  for(const symbol of ['unit_kind','price_unit_qty','qtyText','unitLabel'])assert.ok(html.includes(symbol),symbol+' falta');
});

test('La app no depende de módulos legacy externos',()=>{
  const legacy=['dashboard-premium.js','reportes-v2.js','stock-v2.js','operaciones-v2.js','panel-inteligente.js','logo-armado.js','login-neon.js'];
  for(const file of legacy){
    const external=new RegExp(`(?:src|href)=["']\\.?\\/?${file.replace('.','\\.')}[?"']`,'i');
    assert.ok(!external.test(html),file+' todavía está enlazado externamente');
  }
});

console.log(`\nOptimización: ${passed}/5 pruebas correctas`);
if(process.exitCode)process.exit(1);
