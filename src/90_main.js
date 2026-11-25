/* ---------------- main ---------------- */
let loopOn=false;
window.onKeyPress=(k,e)=>{
  if(!P)return;
  if(k==='escape'){if(UI.modal)UI.close();else openSettings();return}
  if(UI.modal){if(k==='i'||k==='p')UI.close();return}
  if(k==='enter'){openChatInput();return}
  if(k==='i')return openInventory();
  if(k==='p')return openParty();
  if((k==='e'||k==='f')&&nearNpc()){interact();return}
  if(k==='e')return trySkill('e');
  if(k==='q')return trySkill('q');
  if(k==='r')return trySkill('r');
  if(k===' ')return doDash();
  if(k>='1'&&k<='6')return usePotionKey(POTION_ORDER[+k-1]);
};
document.addEventListener&&document.addEventListener('visibilitychange',()=>{if(document.hidden)flushKills()});

function enterGame(){
  loginEnd();
  $('login').classList.add('hidden');$('hud').classList.remove('hidden');
  buildHud();initTouch();
  newPlayer();UI.refreshHud();UI.zone=-1;
  cam.x=P.x;cam.z=P.z;
  resetMobs();netClearModels();
  G.mode='play';musicMode('town');
  netInit();
  const first=SES.pf.kills===0&&SES.pf.level===1;
  UI.feedText(SES.mode==='online'?'접속했습니다':'오프라인 모드 (이 기기에만 저장)','#9fc8ff');
  if(first)UI.toast(IS_TOUCH?'상점에서 물약을 구입하고, 필드로 나가 몬스터를 사냥하세요':'상점(E)에서 물약을 구입하고, 마을 밖으로 나가 사냥하세요',4200);
  if(!IS_TOUCH)canvas.focus();
}


/* ---------------- login backdrop: live town + class line-up ---------------- */
const LOGIN={g:null,heroes:{},sel:'warrior',on:true,t:0};
function buildLoginScene(){
  if(LOGIN.g)scene.remove(LOGIN.g);
  const g=new THREE.Group();scene.add(g);LOGIN.g=g;
  const xs={warrior:-2.5,mage:0,archer:2.5};
  for(const k of['warrior','mage','archer']){
    const h=makeHeroFor(k,null,CLS[k].col);h.g.position.set(xs[k],0,11+(k==='mage'?.9:0));g.add(h.g);
    const gl=glow(CLS[k].col,5,.0);gl.position.set(0,.2,0);h.g.add(gl);h.sel=gl;LOGIN.heroes[k]=h;h.sc=1;
  }
}
function loginPick(k){LOGIN.sel=k}
function loginScene(dt){
  if(!LOGIN.g||!LOGIN.on)return;
  LOGIN.t+=dt;const a=Math.sin(LOGIN.t*.18)*.4,cx=0,cz=11.5,dist=8,h=3;
  for(const k in LOGIN.heroes){const o=LOGIN.heroes[k],sel=k===LOGIN.sel;
    o.sc+=((sel?1.14:.96)-o.sc)*Math.min(1,dt*5);o.g.scale.set(o.sc,o.sc,o.sc);
    o.g.rotation.y=lerpAng(o.g.rotation.y,a*.8,dt*3);
    o.sel.material.opacity+=((sel?.55:0)-o.sel.material.opacity)*Math.min(1,dt*5);
    animHeroFor(o,LOGIN.t+(k==='mage'?1:k==='archer'?2:0),0,sel?Math.max(0,Math.sin(LOGIN.t*2.2)*.6)-.1:-1,false,1);
  }
  cam.x=cx;cam.z=cz;updateCam(dt,cx,cz,true);
  camera.position.set(cx+Math.sin(a)*dist,h,cz+Math.cos(a)*dist);camera.lookAt(cx,1.5,cz);camera.updateMatrixWorld();
  const w=innerWidth,hh=innerHeight;
  if(w>=900&&camera.setViewOffset){camera.setViewOffset(w,hh,-w*.17,0,w,hh)}else if(camera.clearViewOffset)camera.clearViewOffset();
}
function loginEnd(){LOGIN.on=false;if(LOGIN.g)LOGIN.g.visible=false;if(camera.clearViewOffset)camera.clearViewOffset();camera.updateProjectionMatrix()}

let lastZoneAudio=-1;
function frame(dt){
  if(P&&G.mode==='play'){
    const modal=!!UI.modal;
    playerFacing(dt);
    if(P.dead||modal){P.ix=P.iz=0;P.vx*=.85;P.vz*=.85;P.x+=P.vx*dt;P.z+=P.vz*dt;pushOut(P,P.r)}else movePlayer(dt);
    tickPlayer(dt);
    if(!modal)tryAttackInput();
    updatePB(dt);updateEB(dt);updateMobs(dt);updatePlayerModel(dt);
    netUpdate(dt);
    const z=zoneAt(P.x,P.z);updateAtmo(dt,z.id);
    if(z.id!==lastZoneAudio){lastZoneAudio=z.id;musicMode(z.id?'field':'town');AU.mode=z.id?'field':'town'}
    KBt+=dt;if(KBn&&KBt>4)flushKills();
    for(const n of WORLD.npcs){const p=n.model.g.position;n.label.pos(p.x,4.1,p.z);n.model.g.rotation.y=lerpAng(n.model.g.rotation.y,Math.atan2(P.x-p.x,P.z-p.z),dt*2);animHero(n.model,G.t,0,-1,false,1)}
    ambientFx(dt,z.id,cam.x,cam.z);
    for(const L of WORLD.lava){L.m.material.opacity=.45+Math.sin(G.t*2+L.x)*.12}
    UI.hudTick(dt);
    updateCam(dt,P.x,P.z,false);
  }else{
    try{loginScene(dt)}catch(e){LOGIN.on=false;if(LOGIN.g)LOGIN.g.visible=false;console.error('login',e)}
    if(!LOGIN.g||!LOGIN.on)updateCam(dt,0,8,true);updateAtmo(dt,0);ambientFx(dt,0,0,11);
    for(const n of WORLD.npcs)animHero(n.model,G.t,0,-1,false,1);
  }
  try{updateWorldFx(dt,G.t)}catch(e){}
  updateParticles(dt);updateFx(dt);updateDN(dt);
  if(!P||G.mode!=='play'){hideMobLabels();for(const n of WORLD.npcs)n.label.el.style.display='none'}
  renderer.render(scene,camera);
}
function loop(now){
  requestAnimationFrame(loop);
  let dt=Math.min(.05,(now-G.last)/1000);G.last=now;if(!(dt>0))return;
  G.t+=dt;frame(dt);
}

async function boot(){
  loadSave();setVol(save.vol);
  scene.fog=new THREE.FogExp2(0x8fb4d8,.0052);
  sun.castShadow=!!save.shadows;renderer.shadowMap.enabled=!!save.shadows;
  buildWorld();try{buildLoginScene()}catch(e){console.error('login scene',e);LOGIN.g=null}initLogin();
  cam.x=0;cam.z=8;
  if(!loopOn&&typeof requestAnimationFrame==='function'){loopOn=true;requestAnimationFrame(loop)}
  const mode=await API.probe();
  $('lstat').textContent=mode==='online'?'서버 연결됨':'서버에 연결할 수 없어 오프라인 모드로 실행됩니다 (이 기기에만 저장)';
  $('lhelp').textContent=IS_TOUCH?'조이스틱으로 이동, 오른쪽 버튼으로 공격합니다.':'WASD 이동 · 마우스 공격 · Q/E/R 스킬 · Space 대시';
  try{
    const s=JSON.parse(localStorage.getItem('rw_sess')||'null');
    if(s&&s.mode===mode&&s.name&&s.token){await API.resume(s.name,s.token);enterGame()}
  }catch(e){try{localStorage.removeItem('rw_sess')}catch(e2){}}
}
if(window.__RW_TEST)window.__RW={mouse,keys,skillOf,SES,API,LocalAPI,get P(){return P},get S(){return S},MOBS,UI,NET,frame,enterGame,boot,initLogin,derive,dealMob,flushKills,registerKill,trySkill,doAttack,usePotionKey,openInventory,openShop,openSmith,openJob,openAuction,openParty,openSettings,interact,nearNpc,hurtPlayer,respawn,KB};
else boot();
