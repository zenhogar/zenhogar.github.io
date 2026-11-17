/* Zen Hogar Gestión · Reportes Visuales. Solo lectura de resultados existentes. */
let reportVisualProductMode='revenue';
function rvBuckets(a,period){
  const sales=a.sales||[],expenses=a.expenses||[],base=new Date();base.setHours(12,0,0,0);
  const dateISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const allDates=[...sales.map(s=>new Date(s.soldAt)),...expenses.map(e=>new Date(e.date))].filter(d=>Number.isFinite(d.getTime()));
  const buckets=[],kind=period==='today'?'hour':period==='all'?'month':'day';
  const make=(key,label,date)=>({key,label,date,amount:0,cost:0,profit:0,count:0,expense:0});
  if(kind==='hour'){
    for(let h=0;h<24;h++)buckets.push(make(String(h),String(h).padStart(2,'0')+':00',new Date(base.getFullYear(),base.getMonth(),base.getDate(),h)));
  }else if(kind==='month'){
    if(allDates.length){
      const limits=allDates.reduce((acc,d)=>({min:Math.min(acc.min,d.getTime()),max:Math.max(acc.max,d.getTime())}),{min:Infinity,max:-Infinity});
      const oldest=new Date(limits.min),latest=new Date(limits.max);
      const d=new Date(oldest.getFullYear(),oldest.getMonth(),1);
      const end=new Date(latest.getFullYear(),latest.getMonth(),1);
      while(d<=end){const dt=new Date(d);buckets.push(make(monthKey(dt),dt.toLocaleDateString('es-AR',{month:'short',year:'2-digit'}),dt));d.setMonth(d.getMonth()+1);}
    }
  }else{
    const n=period==='7d'?7:period==='30d'?30:base.getDate(),start=new Date(base);start.setDate(start.getDate()-n+1);
    for(let i=0;i<n;i++){const d=new Date(start);d.setDate(start.getDate()+i);buckets.push(make(dateISO(d),period==='7d'?d.toLocaleDateString('es-AR',{weekday:'short'}).replace('.',''):String(d.getDate()),d));}
  }
  const byKey=new Map(buckets.map(b=>[b.key,b])),keyFor=date=>kind==='hour'?String(date.getHours()):kind==='month'?monthKey(date):dateISO(date);
  for(const sale of sales){
    const dt=new Date(sale.soldAt);if(!Number.isFinite(dt.getTime()))continue;
    const b=byKey.get(keyFor(dt));if(!b)continue;
    b.amount+=Number(sale.total||0);b.count+=1;
    for(const item of sale.items||[]){const line=Number(item.lineTotal||0),cost=reportEffectiveItemCost(item);b.cost+=cost;b.profit+=line-cost;}
  }
  for(const expense of expenses){
    const dt=new Date(expense.date);if(!Number.isFinite(dt.getTime()))continue;
    const b=byKey.get(keyFor(dt));if(b)b.expense+=Number(expense.amount||0);
  }
  return {kind,buckets};
}

function rvShort(n){
  const abs=Math.abs(Number(n)||0),format=x=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(x);
  if(abs>=1000000)return (n<0?'-':'')+'$'+format(abs/1000000)+' M';
  if(abs>=1000)return (n<0?'-':'')+'$'+format(abs/1000)+' mil';
  return (n<0?'-':'')+'$'+format(abs);
}

function rvTrendSVG(buckets){
  if(!buckets.length||!buckets.some(b=>b.amount||b.profit||b.cost||b.expense))return '<div class="rv-chart-empty">Todavía no hay movimientos en el período elegido.</div>';
  const N=buckets.length, W=Math.max(820,N*34+95),H=250,L=78,R=20,T=18,B=203,gW=W-L-R,gH=B-T,band=gW/N;
  const values=buckets.flatMap(b=>[b.amount,b.cost,b.profit]);
  const minimum=Math.min(0,...values),maximum=Math.max(1,...values),lo=minimum<0?minimum*1.12:0,hi=maximum*1.13;
  const y=v=>T+(hi-v)/(hi-lo)*gH,x=i=>L+band*(i+.5);
  const baseline=y(0),bw=Math.min(27,band*.66);
  const grid=[0,1,2,3,4].map(i=>{const v=lo+(hi-lo)*i/4,yy=y(v);return `<g><line class="rv-grid-line" x1="${L}" y1="${yy.toFixed(2)}" x2="${W-R}" y2="${yy.toFixed(2)}"/><text x="${L-11}" y="${(yy+4).toFixed(2)}" text-anchor="end" class="rv-axis-label">${rvShort(v)}</text></g>`;}).join('');
  const path=key=>buckets.map((b,i)=>`${i?'L':'M'} ${x(i).toFixed(2)} ${y(b[key]).toFixed(2)}`).join(' ');
  const marks=buckets.map((b,i)=>{
    const xx=x(i),yy=y(b.amount),height=Math.max(0,baseline-yy),show=N<=12||i===0||i===N-1||i%Math.max(1,Math.round(N/8))===0;
    return `<g class="rv-hover" data-rv-trend="${i}"><rect class="rv-sales-bar" x="${(xx-bw/2).toFixed(2)}" y="${yy.toFixed(2)}" width="${bw.toFixed(2)}" height="${height.toFixed(2)}" rx="3"/><rect class="rv-hit" x="${(L+i*band).toFixed(2)}" y="${T}" width="${band.toFixed(2)}" height="${B-T}" tabindex="0" role="button" aria-label="${esc(b.label)}: ventas ${money(b.amount)}, costos ${money(b.cost)}, ganancia ${money(b.profit)}"/>${show?`<text class="rv-axis-label" x="${xx.toFixed(2)}" y="${B+22}" text-anchor="middle">${esc(b.label)}</text>`:''}</g>`;
  }).join('');
  const profitDots=N<=12?buckets.map((b,i)=>`<circle class="rv-profit-dot" cx="${x(i).toFixed(2)}" cy="${y(b.profit).toFixed(2)}" r="3"/>`).join(''):'';
  return `<svg class="rv-trend-svg" style="min-width:${W}px" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de ventas, costos efectivos y ganancia bruta"><g>${grid}</g><line x1="${L}" x2="${W-R}" y1="${baseline.toFixed(2)}" y2="${baseline.toFixed(2)}" stroke="var(--line)"/>${marks}<path class="rv-cost-line" d="${path('cost')}"/><path class="rv-profit-line" d="${path('profit')}"/>${profitDots}</svg>`;
}

function rvRenderTrend(a,period){
  const host=document.getElementById('rvFinancialChart'),detail=document.getElementById('rvFinancialDetail');if(!host||!detail)return;
  const {buckets,kind}=rvBuckets(a,period);
  host.innerHTML=rvTrendSVG(buckets);
  const touch=i=>{
    const b=buckets[i];if(!b)return;
    host.querySelectorAll('.rv-hover').forEach((el,j)=>el.classList.toggle('active',j===i));
    const title=kind==='hour'?b.label:kind==='month'?b.date.toLocaleDateString('es-AR',{month:'long',year:'numeric'}):b.date.toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});
    detail.innerHTML=`<strong>${esc(title)}</strong><span class="rv-main">${money(b.amount)} en ventas</span><span class="rv-text">${b.count} operaciones · Costo ${money(b.cost)} · Ganancia bruta ${money(b.profit)} · Gastos ${money(b.expense)}</span>`;
  };
  host.querySelectorAll('.rv-hover').forEach((el,i)=>{
    el.addEventListener('pointerenter',()=>touch(i));
    el.addEventListener('click',()=>touch(i));
    el.querySelector('.rv-hit')?.addEventListener('focus',()=>touch(i));
    el.querySelector('.rv-hit')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();touch(i);}});
  });
  if(buckets.length)touch(buckets.length-1);
  else detail.textContent='Cambiá el período para explorar los movimientos.';
}

function rvRenderPayments(a){
  const host=document.getElementById('rvPaymentChart');if(!host)return;
  const entries=Object.entries(a.payments||{}).filter(([,v])=>Number(v)>0).sort((x,y)=>Number(y[1])-Number(x[1]));
  const total=entries.reduce((sum,[,v])=>sum+Number(v),0);
  if(!total){host.innerHTML='<div class="rv-chart-empty">No hubo cobros en este período.</div>';return;}
  const palette=['#2F6F6D','#7FC7C2','#5D8CA2','#BEA06A','#9B8ABE','#7EA99D','#C77F77','#7387AB'];
  const r=60,circ=2*Math.PI*r;
  let offset=0;
  const rings=entries.map(([name,value],i)=>{const share=Number(value)/total,len=share*circ,seg=`<circle class="rv-donut-ring" data-rv-payment="${i}" tabindex="0" role="button" aria-label="${esc(name)}: ${money(value)}" cx="85" cy="85" r="${r}" stroke="${palette[i%palette.length]}" stroke-dasharray="${Math.max(0,len-.8)} ${circ}" stroke-dashoffset="${-offset}"/>`;offset+=len;return seg;}).join('');
  const legend=entries.map(([name,value],i)=>`<button type="button" class="rv-payment-row" data-rv-payment="${i}" style="--r-color:${palette[i%palette.length]}"><i class="dot"></i><span class="label">${esc(name)}</span><strong>${new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(value/total*100)}%</strong></button>`).join('');
  host.innerHTML=`<div class="rv-pay-layout"><div class="rv-donut"><svg viewBox="0 0 170 170" aria-label="Proporciones de cobro por forma de pago"><circle cx="85" cy="85" r="${r}" fill="none" stroke="var(--line)" stroke-width="20"/>${rings}</svg><div class="rv-donut-center"><strong id="rvPaymentAmount">${rvShort(total)}</strong><span id="rvPaymentName">Total cobrado</span></div></div><div class="rv-payment-legend">${legend}</div></div><div class="rv-selected-detail" id="rvPaymentDetail" aria-live="polite"><span class="rv-text">${entries.length} medios de pago · tocá una categoría para ver el detalle.</span></div>`;
  const activate=i=>{
    const [name,value]=entries[i];if(name===undefined)return;
    host.querySelectorAll('[data-rv-payment]').forEach(el=>el.classList.toggle('active',Number(el.dataset.rvPayment)===i));
    document.getElementById('rvPaymentAmount').textContent=rvShort(value);
    document.getElementById('rvPaymentName').textContent=name;
    document.getElementById('rvPaymentDetail').innerHTML=`<strong>${esc(name)}</strong><span class="rv-main">${money(value)}</span><span class="rv-text">${new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(value/total*100)}% de la facturación del período</span>`;
  };
  host.querySelectorAll('[data-rv-payment]').forEach(el=>{
    const fn=()=>activate(Number(el.dataset.rvPayment));el.addEventListener('click',fn);el.addEventListener('pointerenter',fn);
    el.addEventListener('focus',fn);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}});
  });
  activate(0);
}

function rvRenderCategories(a){
  const host=document.getElementById('rvCategoryChart');if(!host)return;
  const rows=(a.categoryRows||[]).slice().sort((x,y)=>y.profit-x.profit).slice(0,8);
  if(!rows.length){host.innerHTML='<div class="rv-chart-empty">Sin ventas por categoría en este período.</div>';return;}
  const max=Math.max(1,...rows.map(x=>Math.abs(Number(x.profit||0))));
  host.innerHTML=`<div class="rv-hbars">${rows.map((row,i)=>{
    const v=Number(row.profit||0),width=Math.min(100,Math.abs(v)/max*100);
    return `<button class="rv-hrow ${v<0?'negative':''}" type="button" data-rv-category="${i}"><div class="rv-hmeta"><strong title="${esc(row.name)}">${esc(row.name)}</strong><span>${money(v)}</span></div><div class="rv-bar-bg"><div class="rv-bar-fill" style="--rv-width:${width.toFixed(2)}%"></div></div><small class="rv-hsub">Margen ${Number.isFinite(row.margin)?pct(row.margin):'—'} · Ventas ${money(row.revenue)}</small></button>`;}).join('')}</div><div class="rv-selected-detail" id="rvCategoryDetail" aria-live="polite"></div>`;
  const activate=i=>{const r=rows[i];if(!r)return;host.querySelectorAll('[data-rv-category]').forEach(el=>el.classList.toggle('active',Number(el.dataset.rvCategory)===i));document.getElementById('rvCategoryDetail').innerHTML=`<strong>${esc(r.name)}</strong><span class="rv-main">${money(r.profit)} de ganancia</span><span class="rv-text">Ventas ${money(r.revenue)} · Costo ${money(r.cost)} · Margen ${Number.isFinite(r.margin)?pct(r.margin):'—'}</span>`;};
  host.querySelectorAll('[data-rv-category]').forEach(el=>{el.addEventListener('click',()=>activate(Number(el.dataset.rvCategory)));el.addEventListener('pointerenter',()=>activate(Number(el.dataset.rvCategory)));el.addEventListener('focus',()=>activate(Number(el.dataset.rvCategory)));});activate(0);
}

function rvRenderProducts(a){
  const host=document.getElementById('rvProductsChart');if(!host)return;
  const mode=reportVisualProductMode;
  const rows=(a.productRows||[]).slice().sort((x,y)=>mode==='quantity'?Number(displayQty({unitKind:y.unitKind},y.qty))-Number(displayQty({unitKind:x.unitKind},x.qty)):Number(y.revenue)-Number(x.revenue)).slice(0,8);
  if(!rows.length){host.innerHTML='<div class="rv-chart-empty">Sin productos vendidos en este período.</div>';return;}
  const count=row=>Number(displayQty({unitKind:row.unitKind},row.qty)),metric=row=>mode==='quantity'?count(row):Number(row.revenue||0);
  const max=Math.max(1,...rows.map(metric));
  const display=row=>mode==='quantity'?qtyText({unitKind:row.unitKind},row.qty):money(row.revenue);
  host.innerHTML=`<div class="rv-hbars">${rows.map((row,i)=>`<button class="rv-hrow" type="button" data-rv-product="${i}"><div class="rv-hmeta"><strong title="${esc(row.name)}">${esc(row.name)}</strong><span>${esc(display(row))}</span></div><div class="rv-bar-bg"><div class="rv-bar-fill" style="--rv-width:${Math.min(100,metric(row)/max*100).toFixed(2)}%"></div></div><small class="rv-hsub">${mode==='quantity'?money(row.revenue)+' de ventas':esc(qtyText({unitKind:row.unitKind},row.qty))+' vendidos'} · Ganancia ${money(row.profit)}</small></button>`).join('')}</div><div class="rv-selected-detail" id="rvProductDetail" aria-live="polite"></div><p class="rv-note">${mode==='quantity'?'Las cantidades se expresan en su unidad de venta (unidades, litros o kg); no son magnitudes directamente comparables entre categorías.':'Los productos se ordenan por facturación neta del período.'}</p>`;
  const activate=i=>{const r=rows[i];if(!r)return;host.querySelectorAll('[data-rv-product]').forEach(el=>el.classList.toggle('active',Number(el.dataset.rvProduct)===i));document.getElementById('rvProductDetail').innerHTML=`<strong>${esc(r.name)}</strong><span class="rv-main">${money(r.revenue)} en ventas</span><span class="rv-text">Cantidad ${esc(qtyText({unitKind:r.unitKind},r.qty))} · Ganancia ${money(r.profit)} · Margen ${Number.isFinite(r.margin)?pct(r.margin):'—'}</span>`;};
  host.querySelectorAll('[data-rv-product]').forEach(el=>{el.addEventListener('click',()=>activate(Number(el.dataset.rvProduct)));el.addEventListener('pointerenter',()=>activate(Number(el.dataset.rvProduct)));el.addEventListener('focus',()=>activate(Number(el.dataset.rvProduct)));});activate(0);
}

function renderReportVisualCharts(a){
  if(!document.getElementById('reportVisualGrid'))return;
  const period=state.reportPeriod||'30d';
  rvRenderTrend(a,period);rvRenderPayments(a);rvRenderCategories(a);rvRenderProducts(a);
  const chooser=document.getElementById('rvProductMode');
  if(chooser){
    chooser.querySelectorAll('[data-rv-product-mode]').forEach(el=>{const active=el.dataset.rvProductMode===reportVisualProductMode;el.setAttribute('aria-pressed',String(active));});
    chooser.onclick=e=>{const btn=e.target.closest('[data-rv-product-mode]');if(!btn)return;reportVisualProductMode=btn.dataset.rvProductMode;rvRenderProducts(a);chooser.querySelectorAll('[data-rv-product-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el===btn)));};
  }
}
