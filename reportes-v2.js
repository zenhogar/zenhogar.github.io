/* Reportes 2.0 — Comparación y PDF mensual sin escritura en backend */
function zhR2Compare(a){
  const start=a?.range?.start, end=a?.range?.end;
  if(!start||!end||!Number.isFinite(start.getTime()))return {valid:false,label:'Sin período anterior comparable'};
  const begin=new Date(start);begin.setHours(0,0,0,0);
  const today=new Date(end);today.setHours(0,0,0,0);
  const days=Math.max(1,Math.round((Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())-Date.UTC(begin.getFullYear(),begin.getMonth(),begin.getDate()))/86400000)+1);
  const prevStart=new Date(begin);prevStart.setDate(begin.getDate()-days);
  const prevEnd=new Date(begin);prevEnd.setMilliseconds(-1);
  const priorSales=(state.sales||[]).filter(s=>{const d=new Date(s.soldAt);return d>=prevStart&&d<=prevEnd});
  const priorTotal=priorSales.reduce((n,s)=>n+Number(s.total||0),0),current=Number(a.revenue||0);
  return {valid:true,days,priorTotal,priorCount:priorSales.length,current,pct:priorTotal>0?(current-priorTotal)/priorTotal*100:null};
}

function zhR2MonthModel(key,products,sales,expenses,costFn,dateFn){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(key||'')))return null;
  const [year,month]=key.split('-').map(Number);
  const daysInMonth=new Date(year,month,0).getDate(),days=Array.from({length:daysInMonth},(_,i)=>({day:i+1,revenue:0,cost:0,profit:0,ops:0,expense:0}));
  const monthSales=(sales||[]).filter(s=>dateFn(s.soldAt)?.slice(0,7)===key);
  const monthExpenses=(expenses||[]).filter(e=>dateFn(e.date)?.slice(0,7)===key);
  const productCat=new Map((products||[]).map(p=>[p.id,p.category||'Sin categoría']));
  const methods=new Map(),categories=new Map(),items=new Map();
  let revenue=0,cost=0,profit=0,expenseTotal=0;
  for(const s of monthSales){
    const d=Number(dateFn(s.soldAt)?.slice(8,10));if(!Number.isInteger(d)||d<1||d>daysInMonth)continue;
    const b=days[d-1],gross=Number(s.total||0);revenue+=gross;b.revenue+=gross;b.ops++;
    const method=String(s.payment||'Sin especificar');methods.set(method,(methods.get(method)||0)+gross);
    for(const it of s.items||[]){
      const expense=Math.max(0,Number(costFn(it)||0)),line=Number(it.lineTotal||0),gain=line-expense,cat=productCat.get(it.productId)||'Sin categoría';
      cost+=expense;profit+=gain;b.cost+=expense;b.profit+=gain;
      const prevCat=categories.get(cat)||{name:cat,revenue:0,cost:0,profit:0};
      prevCat.revenue+=line;prevCat.cost+=expense;prevCat.profit+=gain;categories.set(cat,prevCat);
      const id=it.productId||it.productName||'Producto';
      const prevItem=items.get(id)||{name:String(it.productName||'Producto'),qty:0,revenue:0,profit:0};
      prevItem.qty+=Number(it.qty||0);prevItem.revenue+=line;prevItem.profit+=gain;items.set(id,prevItem);
    }
  }
  for(const e of monthExpenses){const d=Number(dateFn(e.date)?.slice(8,10));if(!Number.isInteger(d)||d<1||d>daysInMonth)continue;const amount=Number(e.amount||0);expenseTotal+=amount;days[d-1].expense+=amount;}
  return {key,year,month,days,revenue,cost,profit,expenseTotal,net:profit-expenseTotal,ops:monthSales.length,ticket:monthSales.length?revenue/monthSales.length:0,methods:[...methods.entries()].sort((a,b)=>b[1]-a[1]),categories:[...categories.values()].sort((a,b)=>b.profit-a.profit),products:[...items.values()].sort((a,b)=>b.revenue-a.revenue)};
}

function zhR2Render(a){
  const root=document.getElementById('zhR2Summary');if(!root)return;
  const compare=zhR2Compare(a),format=n=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(n);
  if(!compare.valid){root.innerHTML='<span>Comparación histórica:</span> <strong>Todo el historial</strong><small>Elegí 7 días, 30 días o este mes para comparar con el período anterior.</small>';}
  else{
    const message=compare.pct===null?'El período anterior no registró ventas':(compare.pct>=0?'+':'')+format(compare.pct)+'%';
    const tone=compare.pct===null?'flat':compare.pct>=0?'positive':'negative';
    root.innerHTML=`<span>Comparación del período</span><strong class="${tone}">${esc(message)}</strong><small>Actual ${money(compare.current)} · Anterior ${money(compare.priorTotal)} · ${compare.days} días por período</small>`;
  }
  const picker=document.getElementById('zhR2Month');
  if(picker&&!picker.value){const d=new Date();picker.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
}

function zhR2ExportPDF(){
  const picker=document.getElementById('zhR2Month');
  const key=picker?.value;
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(key||'')){toast('Elegí un mes válido.','error');return;}
  const PDF=window.jspdf?.jsPDF;
  if(!PDF){toast('El módulo PDF no se cargó. Revisá la conexión y volvé a intentar.','error');return;}
  const localIso=v=>{const d=new Date(v);if(!Number.isFinite(d.getTime()))return '';return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const m=zhR2MonthModel(key,state.products,state.sales,state.expenses,reportEffectiveItemCost,localIso);
  if(!m){toast('Mes inválido.','error');return;}
  const doc=new PDF({orientation:'portrait',unit:'mm',format:'a4',compress:true}),W=210,H=297;
  const ink=[28,42,44],muted=[105,119,120],teal=[47,111,109],pale=[232,244,243],line=[223,231,230],white=[255,255,255];
  const fill=c=>doc.setFillColor(...c),textColor=c=>doc.setTextColor(...c),drawLine=()=>doc.setDrawColor(...line);
  const fmt=n=>'$ '+new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(Number(n||0));
  const label=(str,x,y,size=10,color=ink,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);textColor(color);doc.text(String(str),x,y);};
  const rect=(x,y,w,h,c)=>{fill(c);doc.roundedRect(x,y,w,h,2,2,'F');};
  const titleMonth=new Date(m.year,m.month-1,1).toLocaleDateString('es-AR',{month:'long',year:'numeric'});
  const footer=p=>{drawLine();doc.line(15,280,195,280);label('Zen Hogar Gestion · Reporte interno · Valores registrados en el sistema',15,285,7,muted);label('Pagina '+p,183,285,7,muted);};
  // Página 1: resumen ejecutivo y gráfico financiero generado como vectores para impresión nítida.
  fill(teal);doc.rect(0,0,W,31,'F');label('ZEN HOGAR | GESTION',15,13,15,white,true);label('Informe mensual · '+titleMonth,15,22,10,white);
  label('Empresa: '+String(state.org?.name||'Empresa activa'),15,41,9,muted);
  const metrics=[['VENTAS NETAS',m.revenue],['GANANCIA BRUTA',m.profit],['GASTOS REGISTRADOS',m.expenseTotal],['RESULTADO ESTIMADO',m.net]];
  metrics.forEach(([caption,value],i)=>{const x=15+(i%2)*92,y=47+Math.floor(i/2)*28;rect(x,y,88,24,pale);label(caption,x+5,y+8,7,muted,true);label(fmt(value),x+5,y+17,12,ink,true);});
  label('Rendimiento diario',15,116,13,ink,true);
  label('Facturacion, costos efectivos y ganancia bruta registrados cada dia',15,124,8,muted);
  const X=19,Y=137,GW=175,GH=68,max=Math.max(1,...m.days.map(d=>Math.max(d.revenue,d.cost,d.profit)));
  for(let k=0;k<5;k++){drawLine();doc.line(X,Y+GH-k*GH/4,X+GW,Y+GH-k*GH/4);label(fmt(max*k/4),X,Y+GH-k*GH/4-1,6,muted);}
  const bW=GW/m.days.length,scale=v=>Math.max(0,Math.min(GH,Number(v||0)/max*GH));
  for(let i=0;i<m.days.length;i++){const b=m.days[i],x=X+(i+.5)*bW,high=scale(b.revenue);fill(teal);doc.rect(x-1.5,Y+GH-high,3,high,'F');if(i===0||i===m.days.length-1||i%5===0)label(String(i+1),x-1.7,Y+GH+5,7,muted);}
  // Línea de ganancia bruta (puede ser negativa; se marca solo si el valor es positivo).
  doc.setDrawColor(127,199,194);doc.setLineWidth(.7);
  let last=null;for(let i=0;i<m.days.length;i++){const x=X+(i+.5)*bW,y=Y+GH-scale(m.days[i].profit);if(last)doc.line(last.x,last.y,x,y);last={x,y};}
  label('Barras: ventas',19,223,8,teal,true);label('Linea: ganancia bruta',73,223,8,[78,144,141],true);
  rect(15,233,180,34,[248,250,249]);
  label('Operaciones: '+m.ops,20,242,9,ink,true);label('Ticket promedio: '+fmt(m.ticket),20,250,9,ink);
  label('Costo efectivo vendido: '+fmt(m.cost),107,242,9,ink);
  label('Los importes se basan en ventas y gastos registrados; no incluyen',20,258,7,muted);
  label('impuestos u otros cargos no cargados en el sistema.',20,264,7,muted);
  footer(1);
  doc.addPage();
  fill(teal);doc.rect(0,0,W,28,'F');label('DETALLE DEL MES',15,13,14,white,true);label(titleMonth,15,21,9,white);
  let cursor=37;
  const ranking=(heading,rows,render)=>{
    label(heading,15,cursor,12,ink,true);cursor+=7;
    if(!rows.length){label('Sin registros.',17,cursor,8,muted);cursor+=10;return;}
    rows.slice(0,8).forEach((row,i)=>{const pair=render(row);if(i%2===0)rect(15,cursor-5,180,10,[248,250,249]);const name=String(pair[0]).slice(0,56);label(`${i+1}. ${name}`,18,cursor+1,8,ink);const amount=String(pair[1]);doc.setFontSize(8);doc.setFont('helvetica','bold');textColor(ink);doc.text(amount,192,cursor+1,{align:'right'});cursor+=11;});cursor+=10;
  };
  ranking('Medios de pago',m.methods,([name,value])=>[name,fmt(value)]);
  ranking('Categorias con mayor ganancia bruta',m.categories,r=>[r.name,fmt(r.profit)]);
  ranking('Productos por facturacion',m.products,r=>[r.name,fmt(r.revenue)]);
  if(cursor>255){doc.addPage();cursor=35;fill(teal);doc.rect(0,0,W,27,'F');label('ANEXO',15,16,13,white,true);}
  label('Criterios',15,cursor,11,ink,true);cursor+=7;
  for(const txt of [
    'Ventas: importe neto efectivamente registrado para las operaciones completadas.',
    'Ganancia bruta: total de lineas vendidas menos costos efectivos registrados.',
    'Resultado estimado: ganancia bruta menos gastos operativos registrados.',
    'El PDF es una copia informativa y no modifica datos ni genera movimientos.'
  ]){const rows=doc.splitTextToSize(txt,180);for(const row of rows){label(row,15,cursor,8,muted);cursor+=5;}}
  footer(doc.internal.getNumberOfPages());
  doc.save(`zen-hogar-reporte-${key}.pdf`);
}
