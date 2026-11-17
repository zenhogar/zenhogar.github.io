'use strict';
/* Comprobaciones de bienvenida de acceso, sin navegador ni credenciales. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'login-neon.css'),'utf8');
const svg=fs.readFileSync(path.join(root,'zen-hogar-neon.svg'),'utf8');
const js=fs.readFileSync(path.join(root,'login-neon.js'),'utf8');
function fixture(reduced=false){
  let now=100,delays=[];
  const overlay={
    hidden:true,attrs:{},offsetWidth:100,
    classList:{
      classes:new Set(),
      add(...a){a.forEach(x=>this.classes.add(x));},
      remove(...a){a.forEach(x=>this.classes.delete(x));},
      contains(x){return this.classes.has(x);}
    },
    setAttribute(k,v){this.attrs[k]=v;}
  };
  const fn=new Function('document','window','Date','setTimeout',
    js+';return {start:zhNeonWelcomeStart,finish:zhNeonWelcomeFinish,dismiss:zhNeonWelcomeDismiss,info:()=>({token:zhNeonWelcomeToken,active:zhNeonWelcomeActive})};');
  const api=fn({getElementById:id=>id==='zhNeonWelcome'?overlay:null},
    {matchMedia:()=>({matches:reduced})},{now:()=>now},
    (cb,duration)=>{delays.push(duration);now+=duration;cb();});
  return {overlay,api,delays};
}
(async()=>{
  try{
    new Function(js);
    assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('viewBox="0 0 320 320"'));
    for(const filename of ['login-neon.css','login-neon.js'])
      assert.ok(html.includes(filename),'No se incluye '+filename);
    assert.ok(!html.includes('class="brand-mark zh-gate-logo"'),'El logo no debe mostrarse en la tarjeta de ingreso');
    assert.ok(!html.includes('src="./zen-hogar-neon.svg"'),'El logo no debe cargarse en el formulario de login');
    assert.equal((html.match(/id="zhNeonWelcome"/g)||[]).length,1);
    assert.ok(html.includes('async function startApp(){\n  // Mostrar la firma visual al entrar'));
    assert.ok(html.includes('await zhNeonWelcomeFinish();'));
    assert.ok(html.includes('state.client.auth.signInWithPassword({email,password})'));
    console.log('✓ Recursos y autenticación preservados');
    const normal=fixture();
    normal.api.start();
    assert.equal(normal.overlay.hidden,false);
    assert.equal(normal.overlay.attrs['aria-hidden'],'false');
    assert.ok(normal.overlay.classList.contains('is-playing'));
    await normal.api.finish();
    assert.deepEqual(normal.delays,[3300,360]);
    assert.equal(normal.overlay.hidden,true);
    assert.equal(normal.api.info().active,false);
    console.log('✓ Trazo más lento, pausa final y cierre automático');
    const skip=fixture();
    skip.api.start();skip.api.dismiss();
    assert.equal(skip.overlay.hidden,true);
    await skip.api.finish();
    assert.equal(skip.delays.length,0);
    console.log('✓ Omitir animación no bloquea la app');
    const reduced=fixture(true);
    reduced.api.start();await reduced.api.finish();
    assert.equal(reduced.overlay.hidden,true);
    assert.deepEqual(reduced.delays,[]);
    assert.ok(css.includes('prefers-reduced-motion:reduce'));
    console.log('✓ Respeto por movimiento reducido');
    const replay=fixture();
    replay.api.start();await replay.api.finish();replay.api.start();
    assert.ok(replay.overlay.classList.contains('is-playing'));
    assert.equal(replay.overlay.hidden,false);
    await replay.api.finish();
    console.log('✓ Reingreso reinicia correctamente la animación');
    console.log('Pruebas de bienvenida: 5/5');
  }catch(err){
    console.error(err.stack||err);
    process.exitCode=1;
  }
})();
