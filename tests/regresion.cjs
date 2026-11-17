'use strict';
/* Zen Hogar Gestión — QA estática y pruebas de regresión sin datos privados. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const scripts=['dashboard-premium.js','reportes-charts.js','reportes-v2.js','stock-v2.js','operaciones-v2.js','panel-inteligente.js'];
const styles=['modelo13-visual.css','dashboard-premium.css','reportes-visual.css','reportes-v2.css','stock-v2.css','operaciones-v2.css','panel-inteligente.css'];
let passed=0;
function test(name,fn){try{fn();passed++;process.stdout.write('✓ '+name+'\n');}catch(e){process.stderr.write('✗ '+name+': '+e.message+'\n');process.exitCode=1;}}
test('Scripts compilables',()=>{
  for(const s of scripts)new vm.Script(read(s),{filename:s});
  const embedded=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>x.trim());
  assert.ok(embedded.length>=2);
  embedded.forEach((text,i)=>new vm.Script(text,{filename:'index-inline-'+i+'.js'}));
});
test('Enlaces a archivos reales',()=>{
  for(const file of [...scripts,...styles]){
    assert.ok(html.includes('./'+file+'?'),file+' no está enlazado');
    assert.ok(read(file).length>60,file+' vacío');
  }
});
test('CSS balanceado',()=>{
  for(const s of styles){const text=read(s);assert.equal((text.match(/{/g)||[]).length,(text.match(/}/g)||[]).length,s);}
});
test('IDs de gráficos únicos',()=>{
  for(const id of ['salesWeekChart','dashboardAnalyticsPlot','rvFinancialChart','rvPaymentChart','rvCategoryChart','rvProductsChart','reportVisualGrid','zhR2Summary','zhStockFilterBar','zhSmartPanel']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  }
});
test('Persistencia y controles centrales intactos',()=>{
  for(const symbol of ['create_sale_v2','create_purchase','upsert_product_v4','archive_product','cancel_sale','loadAllData','renderReports']){
    assert.ok(html.includes(symbol),symbol+' falta');
  }
});
test('No hay clave privilegiada en la configuración de cliente',()=>{
  assert.ok(html.includes('sb_publishable_'));
  assert.ok(!/supabaseKey:\s*['"]sb_secret_/i.test(html));
});
test('Reportes por mes y cálculos',()=>{
  const month=new Function(read('reportes-v2.js')+';return zhR2MonthModel;')();
  const d=month('2026-11',[{id:'x',category:'Higiene'}],[{soldAt:'2026-11-16T13:00:00Z',total:1200,payment:'Efectivo',items:[{productId:'x',productName:'Jabón',lineTotal:1200,unitCost:400,qty:1,priceUnitQty:1}]}],[{date:'2026-11-16T15:00:00Z',amount:100}],i=>i.unitCost*i.qty/i.priceUnitQty,v=>v.slice(0,10));
  assert.equal(d.days.length,30);
  assert.deepEqual([d.revenue,d.cost,d.profit,d.expenseTotal,d.net],[1200,400,800,100,700]);
});
test('Filtro de stock no altera unidades ni datos',()=>{
  const f=new Function(read('stock-v2.js')+';return (rows,kind)=>{zhStockActiveFilter=kind;return zhStockFilterRows(rows);};')();
  const rows=[{stock:0,minStock:2,targetStock:5},{stock:1,minStock:2,targetStock:5},{stock:3,minStock:2,targetStock:5},{stock:8,minStock:2,targetStock:0}];
  assert.deepEqual(['out','low','target','unset','all'].map(k=>f(rows,k).length),[1,1,3,1,4]);
});
test('Panel inteligente con 7 días reales',()=>{
  const f=new Function(read('panel-inteligente.js')+';return zhSmartStats;')();
  const date='2026-11-17',ago='2026-11-10';
  const sales=[{date,total:200,items:[{productId:'x',productName:'A',lineTotal:200,unitCost:50,qty:1,priceUnitQty:1}]},{date:ago,total:100,items:[]}];
  const m=f(sales,[{stock:0,minStock:1,targetStock:3,cost:8,priceUnitQty:1}],new Date(2026,10,17),s=>s.date,i=>i.unitCost*i.qty/i.priceUnitQty);
  assert.deepEqual([m.total,m.previous,m.lows,m.actionable,m.estimate],[200,100,1,1,24]);
});
test('Caché protegida y PDF con paginación',()=>{
  assert.ok(html.includes("Copia local no disponible"));
  assert.ok(html.includes('No se pudo guardar la copia local'));
  assert.ok(read('reportes-v2.js').includes('enoughSpace(13)'));
  assert.ok(read('reportes-charts.js').includes('findLastIndex(b=>b.count>0)'));
});
console.log('\nPruebas superadas: '+passed+'/10');
if(process.exitCode)process.exit(1);
