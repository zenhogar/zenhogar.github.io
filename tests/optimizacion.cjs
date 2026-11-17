'use strict';
/* QA de optimización: búsquedas rápidas, sincronización y aislamiento multiempresa.
   No usa red ni datos de empresas reales. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const grab=(start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,'Falta la función: '+start);
  return source.slice(a,b);
};
let ok=0;
function pass(label){ok++;console.log('✓ '+label);}
function stockTest(){
  const snippet=grab('function renderProducts({tableOnly=false}={})','function replenishmentItems()');
  const els={
    '#productSearch':{value:''}, '#categoryFilter':{value:'',innerHTML:'categorías originales'},
    '#productSort':{value:'name'}, '#productsTable':{innerHTML:''},
    '#saleProduct':{innerHTML:'venta original'}, '#pPreferredSupplier':{innerHTML:'proveedores originales'},
    '#addProductBtn':{hidden:false}
  };
  let categories=0,stockQuery=0,summary=0,rows=0;
  const state={products:[
    {id:'1',name:'Jabón',code:'JA',barcode:'',category:'Limpieza',price:100,cost:50,stock:4,minStock:1,unitKind:'unit',createdAt:'2026-11-17'},
    {id:'2',name:'Shampoo',code:'SH',barcode:'',category:'Higiene',price:180,cost:90,stock:2,minStock:1,unitKind:'unit',createdAt:'2026-11-17'}
  ],suppliers:[]};
  const render=new Function('$','state','esc','money','qtyText','unitLabel','unitWord','populateProductCategoryOptions','renderStockQuery','renderInventorySummary','zhStockFilterRows','zhStockUpdateControls','canAdmin',
    snippet+'return renderProducts;')(
      x=>els[x],state,x=>String(x),x=>String(x),(p,n)=>String(n),()=> 'unidad',()=> 'unidad',
      ()=>categories++,()=>stockQuery++,()=>summary++,x=>x,n=>{rows=n;},()=>true
    );
  render({tableOnly:true});
  assert.equal(rows,2);
  assert.ok(els['#productsTable'].innerHTML.includes('Jabón'));
  assert.equal(els['#categoryFilter'].innerHTML,'categorías originales');
  assert.equal(els['#saleProduct'].innerHTML,'venta original');
  assert.equal(els['#pPreferredSupplier'].innerHTML,'proveedores originales');
  assert.deepEqual([categories,stockQuery,summary],[0,0,0]);
  els['#productSearch'].value='sham';
  render({tableOnly:true});
  assert.equal(rows,1);
  assert.ok(els['#productsTable'].innerHTML.includes('Shampoo'));
  assert.ok(!els['#productsTable'].innerHTML.includes('Jabón'));
  assert.deepEqual([categories,stockQuery,summary],[0,0,0]);
  render();
  assert.deepEqual([categories,stockQuery,summary],[1,1,1]);
  assert.notEqual(els['#saleProduct'].innerHTML,'venta original');
  pass('Filtrar no reconstruye formularios ni pierde búsqueda');
}
async function multiCompanyTest(){
  const snippet=grab('async function loadAllData({silent=false}={}){','function subscribeRealtime()');
  const held=[],changes=[];
  const state={org:{id:'A'},products:[],sales:[],role:'employee',client:{}};
  let renders=0,saves=0;
  const env=new Function('state','fetchAllPages','navigator','updateConnection','saveCache','renderAll','loadCache','toast','canOwner','console',
    "let zhCloudSyncStatus='checking',zhLastConnectedOrgId=null,zhLoadVersion=0;\n"+
     snippet+"\nreturn {loadAllData,info:()=>({status:zhCloudSyncStatus,verified:zhLastConnectedOrgId})};")(
       state,()=>new Promise(resolve=>held.push(resolve)),{onLine:true},
       ()=>changes.push(state.org?.id),()=>saves++,()=>renders++,()=>false,
       ()=>{},()=>false,{error:()=>{}}
     );
  const first=env.loadAllData({silent:true});
  assert.equal(held.length,10);
  state.org={id:'B'};
  const second=env.loadAllData({silent:true});
  assert.equal(held.length,20);
  const replies=id=>[{data:[{id,code:id,name:id,category:'test',stock:1,price:2,cost:1,min_stock:0}],error:null},...Array.from({length:9},()=>({data:[],error:null}))];
  const newer=replies('only-B'),older=replies('only-A');
  held.slice(10,20).forEach((resolve,i)=>resolve(newer[i]));
  await second;
  assert.equal(state.products[0].id,'only-B');
  assert.deepEqual(env.info(),{status:'connected',verified:'B'});
  held.slice(0,10).forEach((resolve,i)=>resolve(older[i]));
  await first;
  assert.equal(state.products[0].id,'only-B');
  assert.equal(saves,1);assert.equal(renders,1);
  pass('Una respuesta vieja no pisa otra empresa');
  state.org={id:'C'};
  const third=env.loadAllData({silent:true});
  assert.equal(env.info().status,'checking');
  const failed=[{data:null,error:new Error('fallo de red')},...Array.from({length:9},()=>({data:[],error:null}))];
  held.slice(20,30).forEach((resolve,i)=>resolve(failed[i]));
  await third;
  assert.equal(env.info().status,'error');
  assert.equal(env.info().verified,'B');
  pass('Sincronización fallida no aparece como conectada');
}
function statusTest(){
  const snippet=grab('function updateConnection(){',"window.addEventListener('online',");
  const statuses={
    '#connectionStatus':{classList:{toggle(){}},innerHTML:''},
    '#cloudStatusTitle':{textContent:''}, '#cloudStatusText':{textContent:''},
    '#settingsSyncState':{textContent:''}
  };
  const factory=new Function('$','navigator','state','zhCloudSyncStatus','zhLastConnectedOrgId',snippet+'return updateConnection;');
  factory(x=>statuses[x],{onLine:true},{org:{id:'C'}},'connected','B')();
  assert.match(statuses['#connectionStatus'].innerHTML,/Comprobando nube/);
  factory(x=>statuses[x],{onLine:true},{org:{id:'C'}},'connected','C')();
  assert.match(statuses['#connectionStatus'].innerHTML,/Nube conectada/);
  factory(x=>statuses[x],{onLine:true},{org:{id:'C'}},'error','C')();
  assert.match(statuses['#connectionStatus'].innerHTML,/Sin sincronizar/);
  factory(x=>statuses[x],{onLine:false},{org:{id:'C'}},'connected','C')();
  assert.match(statuses['#connectionStatus'].innerHTML,/Sin conexión/);
  pass('Estado de conexión distingue validación, error y modo offline');
}
(async()=>{
 try{
   stockTest();
   await multiCompanyTest();
   statusTest();
   console.log('\nOptimización: '+ok+'/4 pruebas correctas');
 }catch(e){
   console.error('Falló optimización: '+e.stack);
   process.exitCode=1;
 }
})();
