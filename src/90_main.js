/* ---------------- main ---------------- */
let loopOn=false;
window.onKeyPress=(k,e)=>{
  if(!P||GUARD.tripped)return;
  if(k==='escape'){if(UI.modal)UI.close();else openSettings();return}
  if(UI.modal){if(k==='i'||k==='p'||k==='j')UI.close();return}
  if(k==='enter'){openChatInput();return}
  if(k==='i')return openInventory();
  if(k==='p')return openParty();
  if(k==='j')return openDaily();
  if((k==='e'||k==='f')&&nearNpc()){interact();return}
  if(k==='c')return startRecall();
  if(k==='e')return trySkill('e');
  if(k==='q')return trySkill('q');
  if(k==='r')return trySkill('r');
  if(k==='f')return trySkill('f');
  if(k===' ')return doDash();
  if(k>='1'&&k<='6')return usePotionKey(POTION_ORDER[+k-1]);
};
document.addEventListener&&document.addEventListener('click',e=>{try{auInit();const t=e.target&&e.target.closest&&e.target.closest('.btn,.tab,.item,.c');if(t&&!t.disabled)sfx('click')}catch(x){}});
document.addEventListener&&document.addEventListener('visibilitychange',()=>{if(document.hidden)flushKills()});

function enterGame(){
  loginEnd();
  $('start').classList.add('hidden');hideLoading();
  $('login').classList.add('hidden');$('hud').classList.remove('hidden');
  buildHud();gmMenuButton();initTouch();
  newPlayer();UI.refreshHud();UI.zone=-1;
  cam.x=P.x;cam.z=P.z;
  resetMobs();netClearModels();
  G.mode='play';musicMode('town');
  netInit();
  const first=SES.pf.kills===0&&SES.pf.level===1;
  UI.feedText(SES.mode==='online'?'접속했습니다':'오프라인 모드 (이 기기에만 저장)','#9fc8ff');
  if(first)UI.toast(IS_TOUCH?'상점에서 물약을 구입하고, 필드로 나가 몬스터를 사냥하세요':'상점(E)에서 물약을 구입하고, 마을 밖으로 나가 사냥하세요',4200);
  if(!IS_TOUCH)canvas.focus();
  dailyOnEnter();
  if(perkOf(SES.pf).pts>0)UI.toast('능력치 강화 포인트가 '+perkOf(SES.pf).pts+'개 있습니다 (왼쪽 위 프로필을 눌러 선택)',4200);
}


/* ---------------- login backdrop: live town + class line-up ---------------- */
const LOGIN={g:null,heroes:{},sel:'warrior',on:true,t:0};
function buildLoginScene(){
  if(LOGIN.g)scene.remove(LOGIN.g);
  const g=new THREE.Group();scene.add(g);LOGIN.g=g;LOGIN.heroes={};
  loginPick(LOGIN.sel||'warrior');
}
function getLoginHero(k){
  if(!LOGIN.heroes[k]){
    const h=makeHeroFor(k,null,CLS[k].col);h.g.position.set(0,0,11.4);h.g.visible=false;LOGIN.g.add(h.g);
    const gl=glow(CLS[k].col,5,.4);gl.position.set(0,.2,0);h.g.add(gl);h.sel=gl;h.sc=1.28;LOGIN.heroes[k]=h;
  }
  return LOGIN.heroes[k];
}
function loginPick(k){LOGIN.sel=k;if(LOGIN.g)getLoginHero(k)}
function loginScene(dt){
  if(!LOGIN.g||!LOGIN.on)return;
  LOGIN.t+=dt;const a=Math.sin(LOGIN.t*.18)*.4,cx=0,cz=11.5,dist=8,h=3;
  for(const k in LOGIN.heroes){const o=LOGIN.heroes[k],sel=k===LOGIN.sel;
    const show=sel&&!LOGIN.title;if(o.g.visible!==show)o.g.visible=show;if(!show)continue;
    o.g.scale.set(o.sc,o.sc,o.sc);o.g.rotation.y=lerpAng(o.g.rotation.y,a*.8,dt*3);
    animHeroFor(o,LOGIN.t,0,Math.max(0,Math.sin(LOGIN.t*2.2)*.6)-.1,false,1);
  }
  cam.x=cx;cam.z=cz;updateCam(dt,cx,cz,true);
  const cd=LOGIN.title?5.5:dist;   // title: stay in front of the lamp post behind the hero spot
  camera.position.set(cx+Math.sin(a)*cd,h,cz+Math.cos(a)*cd);camera.lookAt(cx,1.5,cz);camera.updateMatrixWorld();
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
    tickPlayer(dt);tickGather(dt);
    if(!modal)tryAttackInput();
    updatePB(dt);updateEB(dt);updateMobs(dt);updatePlayerModel(dt);
    netUpdate(dt);dgUpdate(dt);
    const z=zoneAt(P.x,P.z);updateAtmo(dt,z.id);
    if(z.id!==lastZoneAudio){lastZoneAudio=z.id;musicMode(z.id?'field':'town');AU.mode=z.id?'field':'town';ambZone(z.id)}
    KBt+=dt;if(KBn&&KBt>4)flushKills();
    const bo=balOn();
    for(const n of WORLD.npcs){const p=n.model.g.position;if(bo&&(p.x-P.x)*(p.x-P.x)+(p.z-P.z)*(p.z-P.z)>3600){n.label.el.style.display='none';continue}n.label.pos(p.x,4.1,p.z);n.model.g.rotation.y=lerpAng(n.model.g.rotation.y,Math.atan2(P.x-p.x,P.z-p.z),dt*2);animHero(n.model,G.t,0,-1,false,1)}
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
  renderFrame();
}
function loop(now){
  if(GUARD.tripped)return;
  requestAnimationFrame(loop);
  const raw=now-G.last;let dt=Math.min(.05,raw/1000);G.last=now;if(!(dt>0))return;
  balAdapt(raw);
  G.t+=dt;let sdt=dt;if(G.hs>0){G.hs-=dt;sdt=dt*.05}   // hit-stop: sim crawls for a few frames on heavy hits
  frame(sdt);
}

async function boot(){
  showLoading('세계를 만드는 중…');await wait(60);   // let the loading screen paint before the heavy build
  loadSave();setVol(save.vol);applyGfxMode();
  scene.fog=new THREE.FogExp2(0x8fb4d8,.0052);
  sun.castShadow=!!save.shadows;renderer.shadowMap.enabled=!!save.shadows;
  buildWorld();try{buildLoginScene()}catch(e){console.error('login scene',e);LOGIN.g=null}initLogin();
  cam.x=0;cam.z=8;
  if(!loopOn&&typeof requestAnimationFrame==='function'){loopOn=true;requestAnimationFrame(loop)}
  showLoading('서버에 연결하는 중…');
  const mode=await API.probe();
  $('lstat').textContent=mode==='online'?'서버 연결됨':'서버에 연결할 수 없어 오프라인 모드로 실행됩니다 (이 기기에만 저장)';
  $('lhelp').textContent=IS_TOUCH?'조이스틱으로 이동, 오른쪽 버튼으로 공격합니다.':'WASD 이동 · 마우스 공격 · Q/E/R 스킬 · F 궁극기(만렙) · Space 대시 · C 마을 귀환';
  hideLoading();showTitle(mode);
}
if(window.__RW_TEST)window.__RW={buildPlayerModel,applyWeaponLook,animHeroFor,makeHeroFor,REGION_RUNE,wTier,weaponAtk,sellValue,RUNE_MATCH,WTMOD,wName,weaponRuneFx,runeMatch,runeDesc,wType,zoneAt,GUIDE,guideToggle,guideUpdate,dgClampXZ,netConnect,CLQ,hbOn,applyHB,onCb,onCh,rightClickSkill,effSpd,effAps,JOBS,DG,DGDEF,DGP,openMap,RUNES,dgStart,dgEnter,dgLeave,dgTick,dgRespawn,runeFx,applyMobDmg,startRecall,cancelRecall,GUARD,guardProbe,guardTrip,guardStart,writeSave,TUNE,save,renderer,scene,camera,sun,hemi,mouse,keys,skillOf,tryAttackInput,aimDir,onPos,syncPeers,loadSave,setTouchMode,onLevelUp,netPresence,SK,ACTS,ULT,DECOYS,skReset,tickSkills,skBusy,tickPlayer,removeMob,compactMobs,PB,entG,SES,API,LocalAPI,get P(){return P},get S(){return S},MOBS,UI,NET,frame,enterGame,boot,initLogin,derive,dealMob,flushKills,registerKill,trySkill,doAttack,usePotionKey,openInventory,openShop,openSmith,openJob,openAuction,openParty,openSettings,openGM,showTitle,interact,nearNpc,rebuild:()=>buildWorld(),WORLD,GAT,gatherArc,gatherLine,tickGather,flushGather,MATS,gatLvOf,hurtPlayer,respawn,KB,CLASSES,JOBS,JOB_KIDS,buildPlayerModel,newPlayer,nightK,huntInfo,updateAtmo,makeMobObj,makeHeroFor,animHeroFor,applyWeaponLook,WLOOK,myWeaponBase,openPerks,perkOf,MDEF,DYING,ZONES,WORLD_R,zoneAt,mobLevel,armorBonus,armorName,armorDef,armorHp,wName,wType,sellValue,enhCost,ASLOTS,ASET_KEYS,drawMini,buildWorld};
else boot();
