/* Zen Hogar Gestión — Gráfico premium. Solo lectura sobre state.sales; sin escrituras de base de datos. */
let dashboardPremiumPeriod='7d';
function dashboardPremiumAggregate(sales,period,now,dateFn,profitFn){
  const today=new Date(now);today.setHours(12,0,0,0);
  const size=period==='30d'?30:period==='month'?today.getDate():7;
  const start=new Date(today);start.setDate(today.getDate()-size+1);
  const prevStart=new Date(start);prevStart.setDate(start.getDate()-size);
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const firstISO=iso(start),prevISO=iso(prevStart);
  const days=[];
  for(let i=0;i<size;i++){const date=new Date(start);date.setDate(start.getDate()+i);days.push({date,iso:iso(date),total:0,count:0,profit:0,payments:new Map()});}
  const lookup=new Map(days.map(d=>[d.iso,d]));let previous=0;
  for(const sale of sales||[]){
    const dateISO=dateFn(sale),revenue=Number(sale.total||0);
    if(!Number.isFinite(revenue))continue;
    const day=lookup.get(dateISO);
    if(day){day.total+=revenue;day.count++;const prof=Number(profitFn(sale));if(Number.isFinite(prof))day.profit+=prof;const pay=String(sale.payment||'Sin especificar');day.payments.set(pay,(day.payments.get(pay)||0)+1);}
    else if(dateISO>=prevISO&&dateISO<firstISO)previous+=revenue;
  }
  const amount=days.reduce((a,d)=>a+d.total,0),operations=days.reduce((a,d)=>a+d.count,0),profit=days.reduce((a,d)=>a+d.profit,0);
  const best=operations?days.reduce((a,d)=>!a||d.total>a.total?d:a,null):null;
  const worst=operations?days.reduce((a,d)=>!a||d.total<a.total?d:a,null):null;
  const topMethod=map=>[...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es'))[0]?.[0]||'Sin operaciones';
  const payments=new Map();for(const d of days)for(const [p,n] of d.payments)payments.set(p,(payments.get(p)||0)+n);
  return {days,amount,operations,profit,previous,compare:previous>0?(amount-previous)/previous*100:null,best,worst,average:amount/size,ticket:operations?amount/operations:0,payment:topMethod(payments),topMethod,size};
}

function dashboardPremiumShortMoney(value){
  const n=Number(value||0);
  if(n>=1000000)return '$'+new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(n/1000000)+' M';
  if(n>=1000)return '$'+new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(n/1000)+' mil';
  return '$'+new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(n);
}

function dashboardPremiumSVG(model){
  const {days,amount}=model;
  if(!amount)return '<div class="empty" style="min-height:270px;display:grid;place-items:center">Todavía no hay ventas registradas en este período.</div>';
  const W=900,H=280,L=75,R=18,T=22,B=227,graphW=W-L-R,graphH=B-T;
  const maxDaily=Math.max(0,...days.map(d=>d.total)),pow=Math.pow(10,Math.floor(Math.log10(maxDaily/4||1)));
  const tick=Math.max(1,Math.ceil((maxDaily/4)/pow)*pow),max=tick*4;
  const band=graphW/days.length,barW=Math.min(47,Math.max(7,band*.63));
  const xAt=i=>L+band*(i+.5),yAt=n=>B-Math.max(0,Number(n||0))/max*graphH;
  const trend=days.map((d,i)=>{const from=Math.max(0,i-2);return days.slice(from,i+1).reduce((a,v)=>a+v.total,0)/(i-from+1);});
  const pts=trend.map((v,i)=>[xAt(i),yAt(v)]);
  let path=pts.length?`M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`:'';
  for(let i=1;i<pts.length;i++){const p=pts[i-1],q=pts[i],mx=(p[0]+q[0])/2;path+=` Q ${mx.toFixed(2)} ${p[1].toFixed(2)} ${mx.toFixed(2)} ${((p[1]+q[1])/2).toFixed(2)}`;}
  if(pts.length>1){const last=pts[pts.length-1];path+=` T ${last[0].toFixed(2)} ${last[1].toFixed(2)}`;}
  const area=path?path+` L ${pts[pts.length-1][0].toFixed(2)} ${B} L ${pts[0][0].toFixed(2)} ${B} Z`:'';
  const grid=[0,1,2,3,4].map(i=>{const y=yAt(i*tick);return `<g><line class="grid-line" x1="${L}" y1="${y}" x2="${W-R}" y2="${y}"/><text class="axis" x="${L-12}" y="${y+4}" text-anchor="end">${dashboardPremiumShortMoney(i*tick)}</text></g>`;}).join('');
  const bars=days.map((d,i)=>{
    const x=xAt(i),y=yAt(d.total),h=Math.max(0,B-y),barX=x-barW/2,show=days.length<=10||i===0||i===days.length-1||i%5===0;
    const day=days.length<=10?d.date.toLocaleDateString('es-AR',{weekday:'short'}).replace('.',''):String(d.date.getDate());
    return `<g class="analytics-day" data-analytics-day="${i}"><rect class="analytics-bar" x="${barX.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" rx="4"/><rect class="analytics-hit" x="${(L+i*band).toFixed(2)}" y="${T}" width="${band.toFixed(2)}" height="${B-T}" tabindex="0" role="button" aria-label="${d.date.toLocaleDateString('es-AR',{dateStyle:'full'})}: ${money(d.total)}"/>${show?`<text class="axis" x="${x.toFixed(2)}" y="${B+23}" text-anchor="middle">${day}</text>`:''}</g>`;
  }).join('');
  const dots=pts.filter((_,i)=>days.length<=10||i===days.length-1).map(p=>`<circle class="trend-dot" cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="4"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico combinado de facturación diaria y promedio móvil de tres días"><path class="analytics-area" d="${area}"/>${grid}<line class="baseline" x1="${L}" y1="${B}" x2="${W-R}" y2="${B}"/>${bars}<path class="trend-line" d="${path}"/>${dots}</svg><div class="analytics-tooltip" id="dashboardAnalyticsTooltip" role="status" hidden></div>`;
}

function dashboardRenderPremium(){
  const host=$('#dashboardAnalyticsPlot'),kpis=$('#dashboardAnalyticsKpis'),insights=$('#dashboardAnalyticsInsights'),periods=$('#dashboardAnalyticsPeriods');
  if(!host||!kpis||!insights||!periods)return;
  const model=dashboardPremiumAggregate(state.sales,dashboardPremiumPeriod,new Date(),saleLocalDate,saleProfit);
  const date=d=>d?d.date.toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'short'}):'—';
  const comparison=model.compare===null?'Sin referencia':(model.compare>0?'+':'')+new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(model.compare)+'%';
  const klass=model.compare===null?'':model.compare>=0?'positive':'negative';
  const kpi=(label,value,desc,extra='')=>`<div class="analytics-kpi ${extra}"><span class="name">${label}</span><strong title="${esc(value)}">${esc(value)}</strong><small>${esc(desc)}</small></div>`;
  kpis.innerHTML=kpi('Facturación',money(model.amount),`${model.operations} operaciones`)+
    kpi('Promedio diario',money(model.average),`${model.size} días del período`)+
    kpi('Mejor día',model.best?money(model.best.total):'—',model.best?date(model.best):'Sin ventas')+
    kpi('Variación',comparison,model.previous>0?'Vs. período anterior':'Sin ventas en el período anterior',klass);
  const insight=(sym,title,detail)=>`<div class="analytics-insight"><span class="symbol">${sym}</span><span><strong>${esc(title)}</strong><small>${esc(detail)}</small></span></div>`;
  insights.innerHTML=insight('▤',`${model.operations} operaciones`,'Ticket promedio: '+money(model.ticket))+
    insight('↗','Ganancia estimada',money(model.profit)+' según costos registrados')+
    insight('⌄','Día de menor facturación',model.worst?date(model.worst)+' · '+money(model.worst.total):'Sin ventas')+
    insight('◈','Pago más frecuente',model.payment+' · por cantidad de operaciones');
  $('#dashboardAnalyticsRangeLabel').textContent=dashboardPremiumPeriod==='7d'?'Últimos 7 días':dashboardPremiumPeriod==='30d'?'Últimos 30 días':'Mes actual';
  periods.querySelectorAll('[data-analytics-period]').forEach(b=>{const active=b.dataset.analyticsPeriod===dashboardPremiumPeriod;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  host.innerHTML=dashboardPremiumSVG(model);
  const tooltip=$('#dashboardAnalyticsTooltip'),bars=host.querySelectorAll('[data-analytics-day]');
  function show(i){
    const d=model.days[i];if(!d||!tooltip)return;
    bars.forEach((el,j)=>el.classList.toggle('active',j===i));
    tooltip.hidden=false;
    const item=(label,value)=>`<div class="detail"><span>${label}</span><b>${esc(String(value))}</b></div>`;
    tooltip.innerHTML=`<strong>${esc(d.date.toLocaleDateString('es-AR',{dateStyle:'full'}))}</strong>`+
      item('Facturación',money(d.total))+item('Operaciones',d.count)+item('Ticket promedio',d.count?money(d.total/d.count):'—')+
      item('Ganancia estimada',money(d.profit))+item('Medio de pago',model.topMethod(d.payments));
    tooltip.style.left=Math.max(28,Math.min(72,(i+.5)/model.days.length*100))+'%';
    tooltip.style.transform='translateX(-50%)';
  }
  bars.forEach((bar,i)=>{
    bar.addEventListener('pointerenter',()=>show(i));
    bar.querySelector('.analytics-hit')?.addEventListener('focus',()=>show(i));
    bar.querySelector('.analytics-hit')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(i);}});
    bar.addEventListener('click',()=>show(i));
  });
  host.onpointerleave=()=>{if(tooltip)tooltip.hidden=true;bars.forEach(x=>x.classList.remove('active'));};
  periods.onclick=e=>{const b=e.target.closest('[data-analytics-period]');if(!b)return;dashboardPremiumPeriod=b.dataset.analyticsPeriod;dashboardRenderPremium();};
  $('#dashboardAnalyticsReports').onclick=()=>setView('reports');
}
