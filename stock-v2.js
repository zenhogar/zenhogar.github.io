/* Stock 2.0 · Filtros visuales, sin escritura de datos */
function zhStockFilterRows(rows){
  const type=zhStockActiveFilter;
  if(type==='out')return rows.filter(p=>Number(p.stock||0)<=0);
  if(type==='low')return rows.filter(p=>Number(p.stock||0)>0&&Number(p.stock||0)<=Number(p.minStock||0));
  if(type==='target')return rows.filter(p=>Number(p.targetStock||0)>Number(p.minStock||0)&&Number(p.stock||0)<Number(p.targetStock||0));
  if(type==='unset')return rows.filter(p=>Number(p.targetStock||0)<=Number(p.minStock||0));
  return rows;
}

function zhStockUpdateControls(count){
  const root=document.getElementById('zhStockFilterBar');if(!root)return;
  const all=state.products||[],countFor=(fn)=>all.filter(fn).length;
  const nums={
    all:all.length,
    out:countFor(p=>Number(p.stock||0)<=0),
    low:countFor(p=>Number(p.stock||0)>0&&Number(p.stock||0)<=Number(p.minStock||0)),
    target:countFor(p=>Number(p.targetStock||0)>Number(p.minStock||0)&&Number(p.stock||0)<Number(p.targetStock||0)),
    unset:countFor(p=>Number(p.targetStock||0)<=Number(p.minStock||0))
  };
  root.querySelectorAll('[data-stock-filter]').forEach(el=>{
    const key=el.dataset.stockFilter;
    el.classList.toggle('active',key===zhStockActiveFilter);
    el.setAttribute('aria-pressed',String(key===zhStockActiveFilter));
    const badge=el.querySelector('[data-filter-count]');if(badge)badge.textContent=String(nums[key]||0);
  });
  const out=document.getElementById('zhStockFilterCount');
  if(out)out.textContent=`Mostrando ${count} de ${all.length} productos`;
}

function zhStockSetFilter(next){
  if(!['all','out','low','target','unset'].includes(next))return;
  zhStockActiveFilter=next;
  renderProducts();
}
let zhStockActiveFilter='all';
