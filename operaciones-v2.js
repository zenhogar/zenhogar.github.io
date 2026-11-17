/* Ventas y Compras 2.0 — ayuda visual sin persistir cambios */
function zhOpsQtyAdjust(kind,delta){
  const isSale=kind==='sale',sel=document.getElementById(isSale?'saleProduct':'purchaseProduct');
  const input=document.getElementById(isSale?'saleQty':'purchaseQty');
  const p=state.products.find(v=>v.id===sel?.value);
  if(!p){toast('Primero seleccioná un producto.','error');return;}
  if(delta!==1&&delta!==-1)return;
  const step=p.unitKind==='unit'?1:.25,raw=Number(input.value),current=Number.isFinite(raw)&&raw>0?raw:0;
  let next=Math.round((current+delta*step)*1000)/1000;
  if(next<step)next=step;
  if(isSale){
    const inCart=(state.saleCart||[]).find(x=>x.productId===p.id)?.qty||0;
    const free=Math.max(0,displayQty(p,Number(p.stock||0)-inCart));
    if(free<=0){toast('No queda stock disponible para agregar.','error');return;}
    const cap=p.unitKind==='unit'?Math.floor(free):Math.floor(free*1000)/1000;
    if(next>cap){next=cap;if(next<=0){toast('No hay stock suficiente.','error');return;}}
  }
  input.value=String(next);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  if(isSale)updateSaleUnit();
  zhOpsRenderHint(kind);
}

function zhOpsRenderHint(kind){
  const isSale=kind==='sale',id=isSale?'zhSaleQtyHint':'zhPurchaseQtyHint';
  const box=document.getElementById(id);
  if(!box)return;
  const productId=document.getElementById(isSale?'saleProduct':'purchaseProduct')?.value;
  const p=state.products.find(x=>x.id===productId);
  const input=document.getElementById(isSale?'saleQty':'purchaseQty');
  if(!p){box.textContent='Elegí un producto para consultar la cantidad.';box.classList.remove('warning');return;}
  const qty=Number(input?.value||0);
  if(isSale){
    const booked=(state.saleCart||[]).find(i=>i.productId===p.id)?.qty||0;
    const free=Math.max(0,Number(p.stock||0)-booked),available=displayQty(p,free);
    const exceeds=qty>available+1e-8;
    box.classList.toggle('warning',exceeds);
    box.textContent=exceeds?`Cantidad superior al disponible (${qtyText(p,free)}). Revisá el carrito.`:`Podés agregar hasta ${qtyText(p,free)} de este producto.`;
  }else{
    const cost=Number(document.getElementById('purchaseUnitCost')?.value||0);
    const valid=Number.isFinite(qty)&&qty>0&&Number.isFinite(cost)&&cost>=0;
    box.classList.remove('warning');
    box.textContent=valid?`Costo estimado del renglón: ${money(cost*toBaseQty(p,qty)/Number(p.priceUnitQty||1))} · stock actual ${qtyText(p,p.stock)}`:`Stock actual ${qtyText(p,p.stock)} · definí cantidad y costo para ver el subtotal.`;
  }
}
