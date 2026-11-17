/* Panel inteligente — métricas descriptivas, sin predicciones ni escritura de datos. */
function zhSmartStats(sales,products,now,dateFn,costFn){
  const base=new Date(now);base.setHours(12,0,0,0);
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dateBefore=n=>{const d=new Date(base);d.setDate(base.getDate()-n);return iso(d);};
  const currentStart=dateBefore(6),priorStart=dateBefore(13),priorEnd=dateBefore(7),monthStart=dateBefore(29),today=iso(base);
  let total=0,previous=0,count=0;
  const productMap=new Map();
  for(const sale of sales||[]){
    const d=dateFn(sale),value=Number(sale.total||0);
    if(d>=currentStart&&d<=today){total+=value;count++;}
    else if(d>=priorStart&&d<=priorEnd)previous+=value;
    if(d>=monthStart&&d<=today)for(const i of sale.items||[]){
      const key=String(i.productId||i.productName||'desconocido'),name=String(i.productName||'Producto');
      const old=productMap.get(key)||{name,profit:0,sales:0,qty:0};
      const cost=Number(costFn(i)||0);
      old.profit+=Number(i.lineTotal||0)-cost;old.sales+=Number(i.lineTotal||0);old.qty+=Number(i.qty||0);productMap.set(key,old);
    }
  }
  const topProducts=[...productMap.values()].sort((a,b)=>b.profit-a.profit);
  const topPositive=topProducts.find(x=>x.profit>0)||null;
  const lows=(products||[]).filter(p=>Number(p.stock||0)<=Number(p.minStock||0));
  const actionable=lows.filter(p=>Number(p.targetStock||0)>Number(p.minStock||0));
  const pending=lows.filter(p=>Number(p.targetStock||0)<=Number(p.minStock||0));
  const estimate=actionable.reduce((n,p)=>n+Math.max(0,(Number(p.targetStock)-Number(p.stock||0))/Number(p.priceUnitQty||1))*Number(p.cost||0),0);
  return {total,previous,count,pct:previous>0?(total-previous)/previous*100:null,top:topPositive,
    topCount:topProducts.length,lows:lows.length,actionable:actionable.length,pending:pending.length,estimate};
}

function zhSmartRender(){
  const host=document.getElementById('zhSmartPanel');if(!host)return;
  const m=zhSmartStats(state.sales,state.products,new Date(),saleLocalDate,reportEffectiveItemCost);
  const percentage=m.pct===null?'—':(m.pct>=0?'+':'')+new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(m.pct)+'%';
  const tone=m.pct===null?'neutral':m.pct>=0?'positive':'negative';
  const card=(label,value,description,button,view,extra='')=>`<article class="zh-smart-card ${extra}"><div class="zh-smart-label">${label}</div><strong>${esc(String(value))}</strong><small>${esc(description)}</small><button type="button" onclick="setView('${view}')">${button} ↗</button></article>`;
  host.innerHTML=card('Ventas · 7 días',percentage,m.pct===null?'No hubo facturación en los 7 días anteriores':`${money(m.total)} ahora · ${money(m.previous)} antes`, 'Ver análisis','reports',tone)+
    card('Mayor ganancia · 30 días',m.top?m.top.name:'Sin datos suficientes',m.top?`${money(m.top.profit)} de ganancia bruta · ${money(m.top.sales)} facturados`:'No se registraron productos con ganancia bruta positiva','Ver rentabilidad','reports')+
    card('Reposición de stock',`${m.lows} productos`,m.lows?`${m.actionable} con objetivo · ${m.pending} sin objetivo válido · ${money(m.estimate)} costo sugerido`:'No hay artículos al mínimo','Ver reposición','replenishment',m.lows?'attention':'');
}
