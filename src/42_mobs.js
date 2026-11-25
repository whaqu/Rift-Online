/* ---------------- monsters: authority simulation + remote ghosts ---------------- */
const MDEF={
  slime:{n:'슬라임',hpM:1,spd:3.4,r:.9,dmgM:.8,mk:()=>makeSlime(pick([0x58d68d,0x5dade2,0x76d7a3])),contact:true,col:0x58d68d},
  bat:{n:'박쥐',hpM:.6,spd:6.4,r:.6,dmgM:.7,mk:makeBat,fly:1.2,contact:true,col:0x9a6aff},
  skel:{n:'해골 병사',hpM:1.3,spd:3.8,r:.75,dmgM:1.1,mk:()=>makeSkeleton(false),scale:1.05,col:0xe6e1cf},
  archer:{n:'해골 궁수',hpM:.8,spd:3.2,r:.7,dmgM:.9,mk:()=>makeSkeleton(true),scale:1.05,col:0xc9b6ff},
  bomber:{n:'폭탄 도깨비',hpM:.7,spd:5.4,r:.7,dmgM:1.6,mk:makeBomber,scale:1.1,col:0xff7a4a},
  golem:{n:'수정 거인',hpM:2.4,spd:2.6,r:1.4,dmgM:1.4,mk:makeGolem,scale:.62,contact:true,col:0x5ee7ff}
};
const MTYPES=Object.keys(MDEF);
let mobSeq=1,spawnT=0;
let mobLabels=[];

function makeMobObj(id,type,x,z,ml,elite,ghost,gold){
  const d=MDEF[type],zn=zoneAt(x,z),mk=gold?makeSlime(0xffd24a):d.mk(),g=mk.g,sc=(d.scale||1)*(elite?1.55:gold?1.25:1);
  g.scale.set(sc,sc,sc);g.position.set(x,d.fly||0,z);entG.add(g);
  const maxHp=Math.round(mobHp(ml)*d.hpM*(elite?10:gold?3:1));
  const m={id,type,def:d,x,z,tx:x,tz:z,kx:0,kz:0,face:rnd(0,TAU),hp:maxHp,maxHp,ml,zid:zn.id,elite:!!elite,r:d.r*(elite?1.5:1),spd:d.spd*(elite?.9:1),
    dmg:mobDmg(ml)*d.dmgM*(elite?1.5:1),m:mk,mats:cloneMats(g),golden:!!gold,dead:false,spawning:true,sp:.35,age:rnd(0,3),cd:rnd(.6,1.6),state:'chase',st:0,hitCd:0,flash:0,freeze:0,burnT:0,burnD:0,burnTick:0,
    ph:rnd(0,6),fly:d.fly||0,warn:false,tintKey:'',strafe:Math.random()<.5?1:-1,moving:false,ghost:!!ghost,wt:0,wx:0,wz:0,aggro:null,scale:sc};
  if(elite||gold){const gl=glow(0xffd24a,gold?4.5:5.5,.5);gl.position.set(0,1.2,0);g.add(gl)}
  if(gold){m.spd=d.spd*1.9;m.dmg=0;m.gAge=0;if(!ghost)UI.feedText('황금 슬라임이 나타났습니다! 잡으면 골드 대박','#ffd24a')}
  MOBS.push(m);return m;
}
function removeMob(m,fx){
  m.dead=true;entG.remove(m.m.g);
  if(fx)burst(m.x,1.2,m.z,12,m.def.col,7,.5,8);
}
function resetMobs(){for(const m of MOBS)entG.remove(m.m.g);MOBS.length=0;clearProjectiles()}
function clearMobsNearTown(){for(const m of MOBS)if(Math.hypot(m.x,m.z)<38)removeMob(m,false);compactMobs()}
function compactMobs(){for(let i=MOBS.length-1;i>=0;i--)if(MOBS[i].dead)MOBS.splice(i,1)}

/* ---------- authority helpers ---------- */
function isAuth(){return !(typeof NET!=='undefined'&&NET.party&&NET.party.leader!==SES.name)}
function targets(){
  const T=[];if(!P.dead)T.push({x:P.x,z:P.z,me:true});
  if(typeof NET!=='undefined'&&NET.party){for(const n of NET.party.members){if(n===SES.name)continue;const p=NET.peers[n];if(p&&p.got&&!p.dead)T.push({x:p.x,z:p.z,name:n})}}
  return T;
}
function allPos(){const T=[{x:P.x,z:P.z}];if(typeof NET!=='undefined'&&NET.party){for(const n of NET.party.members){if(n===SES.name)continue;const p=NET.peers[n];if(p&&p.got)T.push({x:p.x,z:p.z})}}return T}
function emitEvent(ev){runEnemyEvent(ev);if(typeof netEnemyEvent==='function')netEnemyEvent(ev)}

function spawnPack(A){
  const t=pick(A);
  for(let tries=0;tries<14;tries++){
    const a=rnd(0,TAU),r=rnd(22,40),x=t.x+Math.cos(a)*r,z=t.z+Math.sin(a)*r,dist=Math.hypot(x,z);
    if(dist<24||dist>WORLD_R-4||blocked(x,z,1.6))continue;
    const zn=zoneAt(x,z);if(!zn.id)continue;
    let tooClose=false;for(const q of A)if(d2(x,z,q.x,q.z)<15*15)tooClose=true;if(tooClose)continue;
    const hw=huntInfo().on,gold=!hw&&zn.id>=1&&Math.random()<.014&&!MOBS.some(q=>q.golden&&!q.dead),elite=!gold&&Math.random()<(hw?.14:isNight()?.05:.035),type=gold?'slime':pick(zn.types),n=(elite||gold)?1:(zn.id>=4?rndi(1,2):rndi(1,3));
    for(let i=0;i<n;i++){const px=x+rnd(-3,3),pz=z+rnd(-3,3);if(blocked(px,pz,1)||Math.hypot(px,pz)<22)continue;makeMobObj(mobSeq++,type,px,pz,Math.max(1,mobLevel(px,pz)),elite,false,gold)}
    return;
  }
}
function updateSpawns(dt,A){
  spawnT-=dt;
  for(const m of MOBS){if(m.dead||m.ghost)continue;let far=true;for(const q of A)if(d2(m.x,m.z,q.x,q.z)<80*80){far=false;break}if(far)removeMob(m,false)}
  if(!A.some(q=>Math.hypot(q.x,q.z)>=22))return;
  const cap=Math.min(50,18*A.length);let n=0;for(const m of MOBS)if(!m.dead)n++;
  if(n<cap&&spawnT<=0){spawnPack(A);spawnT=.12}
}

/* ---------- damage application (authority) ---------- */
function applyMobDmg(m,d,kk,by){
  if(m.dead||m.spawning)return;
  m.hp-=d;m.flash=.09;m.aggro=by||null;
  if(kk&&kk.kb){const l=Math.hypot(kk.kx,kk.kz)||1,res=m.elite?.3:1;m.kx+=kk.kx/l*kk.kb*res*1.6;m.kz+=kk.kz/l*kk.kb*res*1.6}
  if(m.hp<=0)killMob(m);
}
function killMob(m){
  if(m.dead)return;m.dead=true;entG.remove(m.m.g);
  burst(m.x,1.2,m.z,m.elite?44:14,m.def.col,8,.7,8);burst(m.x,1.2,m.z,6,0xffffff,5,.4,6);flashDisc(m.x,m.z,m.r*1.6,m.def.col,.3);shockRing(m.x,m.z,m.r*2.4,m.def.col,.3);
  if(m.elite){shockRing(m.x,m.z,6,0xffd24a,.6);cam.shake=Math.max(cam.shake,.5);sfx('boom')}
  if(!P.dead||true){if(d2(m.x,m.z,P.x,P.z)<55*55)registerKill(m)}
  if(typeof netKill==='function')netKill(m);
}
function netApplyHit(h){ // member -> authority
  const m=MOBS.find(q=>q.id===h.id&&!q.ghost);if(!m||m.dead)return;
  if(h.d>0)applyMobDmg(m,h.d,{kx:h.kx||0,kz:h.kz||0,kb:h.kb||0},h.by);
  if(h.fz)m.freeze=Math.max(m.freeze,m.elite?h.fz*.5:h.fz);
  if(h.bn){m.burnT=3;m.burnD=Math.max(m.burnD,h.bn)}
}

/* ---------- AI ---------- */
function nearestT(m,T){let b=null,bd=1e9;for(const t of T){const d=d2(m.x,m.z,t.x,t.z);if(d<bd){bd=d;b=t}}return b?{t:b,d:Math.sqrt(bd)}:null}
function stepM(m,dx,dz,sp,dt){m.x+=dx*sp*dt;m.z+=dz*sp*dt}
function faceM(m,dx,dz,dt,rate){m.face=lerpAng(m.face,Math.atan2(dx,dz),1-Math.exp(-dt*(rate||10)))}
function updateMobAuth(m,dt,T){
  m.age+=dt;m.hitCd-=dt;m.cd-=dt;if(m.flash>0)m.flash-=dt;
  if(m.golden&&m.age>42){removeMob(m,true);UI.feedText('황금 슬라임이 도망쳤습니다','#9aa0b8');return}
  if(m.spawning){m.sp-=dt;if(m.sp<=0)m.spawning=false}
  if(m.burnT>0){m.burnT-=dt;m.burnTick-=dt;if(m.burnTick<=0){m.burnTick=.5;m.hp-=m.burnD*.5;m.flash=.05;dmgNum(m.x,m.r*1.5+1.2,m.z,fmtN(m.burnD*.5),'burn');if(m.hp<=0){killMob(m);return}}
    if(Math.random()<dt*14)emit(m.x+rnd(-.4,.4),rnd(.5,1.8),m.z+rnd(-.4,.4),0,2,0,.5,0xff7a2a,0)}
  m.x+=m.kx*dt;m.z+=m.kz*dt;const kd=Math.pow(.0008,dt);m.kx*=kd;m.kz*=kd;
  let sp=1;
  if(m.freeze>0){m.freeze-=dt;sp=0;if(Math.random()<dt*12)emit(m.x+rnd(-.6,.6),rnd(.4,2),m.z+rnd(-.6,.6),0,.6,0,.5,0xbff2ff,0)}
  if(sp>0&&!m.spawning){
    const nt=nearestT(m,T),aggro=m.elite?22:15;
    if(nt&&nt.d<aggro){m.tgt=nt.t;aiMob(m,dt,nt,sp)}
    else{ // wander
      m.wt-=dt;if(m.wt<=0){m.wt=rnd(1.5,3.5);const a=rnd(0,TAU);m.wx=Math.cos(a);m.wz=Math.sin(a);if(Math.random()<.4){m.wx=0;m.wz=0}}
      if(m.wx||m.wz){stepM(m,m.wx,m.wz,m.spd*.35,dt);faceM(m,m.wx,m.wz,dt,6);m.moving=true}
    }
  }
  if(!m.fly)pushOut(m,m.r*.7);
  const d=Math.hypot(m.x,m.z);if(d<20.5){const k=20.5/(d||1);m.x*=k;m.z*=k}
  if(d>WORLD_R-2){m.x*=(WORLD_R-2)/d;m.z*=(WORLD_R-2)/d}
}
function aiMob(m,dt,nt,sp){
  const t=nt.t,d=nt.d,dx=(t.x-m.x)/(d||1),dz=(t.z-m.z)/(d||1);
  switch(m.type){
    case 'slime':{
      if(m.hop===undefined)m.hop=0;
      if(m.cd<=0){m.cd=rnd(1,1.5);m.hop=.38}
      if(m.hop>0){m.hop-=dt;if(m.golden){stepM(m,-dx,-dz,m.spd*2.2,dt);faceM(m,-dx,-dz,dt,14)}else{stepM(m,dx,dz,m.spd*2.7,dt);faceM(m,dx,dz,dt,14)}m.moving=true}
      break}
    case 'bat':{
      if(m.state==='chase'){const an=Math.atan2(dx,dz)+Math.sin(m.age*3.2+m.ph)*.85;stepM(m,Math.sin(an),Math.cos(an),m.spd,dt);faceM(m,Math.sin(an),Math.cos(an),dt,12);m.moving=true;
        if(m.cd<=0){m.state='dive';m.st=.75;m.cd=rnd(2.4,3.6)}}
      else if(m.state==='dive'){m.st-=dt;m.warn=m.st>.5;faceM(m,dx,dz,dt,16);stepM(m,dx,dz,m.spd*(m.st>.5?.2:2.1),dt);m.moving=true;if(m.st<=0){m.state='chase';m.warn=false}}
      else{m.st-=dt;stepM(m,-dx,-dz,m.spd*1.1,dt);m.moving=true;if(m.st<=0)m.state='chase'}
      break}
    case 'skel':{
      if(m.state==='chase'){faceM(m,dx,dz,dt);if(d>1.9){stepM(m,dx,dz,m.spd,dt);m.moving=true}else{m.state='wind';m.st=.55;m.warn=true}}
      else if(m.state==='wind'){m.st-=dt;faceM(m,dx,dz,dt,6);
        if(m.st<=0){m.warn=false;emitEvent({t:'s',x:m.x,z:m.z,f:m.face,r:2.7,a:1.7,d:m.dmg});m.state='rec';m.st=.8}}
      else{m.st-=dt;if(m.st<=0)m.state='chase'}
      break}
    case 'archer':{
      faceM(m,dx,dz,dt,12);
      if(m.state==='wind'){m.st-=dt;m.warn=true;
        if(m.st<=0){m.warn=false;const an=Math.atan2(t.x-m.x,t.z-m.z);emitEvent({t:'b',x:m.x+Math.sin(an),z:m.z+Math.cos(an),a:an,s:12.5,d:m.dmg,c:0xc9b6ff,l:3});m.state='move';m.cd=rnd(2,2.8)}}
      else{let mvv=0;if(d<8)mvv=-1;else if(d>13)mvv=1;
        if(mvv){stepM(m,dx*mvv,dz*mvv,m.spd,dt);m.moving=true}else{stepM(m,-dz*m.strafe,dx*m.strafe,m.spd*.55,dt);m.moving=true}
        if(m.cd<=0&&d<18){m.state='wind';m.st=.45}}
      break}
    case 'bomber':{
      if(m.state==='chase'){faceM(m,dx,dz,dt,14);stepM(m,dx,dz,m.spd,dt);m.moving=true;if(d<2.8){m.state='fuse';m.st=.85;m.warn=true;emitEvent({t:'x',x:m.x,z:m.z,r:4,w:.85,d:m.dmg,c:0xff5a2a})}}
      else{m.st-=dt;if(m.st<=0){removeMob(m,true);sfx('boom')}}
      break}
    case 'golem':{
      if(m.state==='chase'){faceM(m,dx,dz,dt,6);if(d>2.8){stepM(m,dx,dz,m.spd,dt);m.moving=true}
        if(m.cd<=0&&d<9){m.cd=rnd(3,4.2);m.state='swind';m.st=1;m.warn=true;m.sx=m.x+dx*2;m.sz=m.z+dz*2;emitEvent({t:'x',x:m.sx,z:m.sz,r:5,w:1,d:m.dmg*1.3,c:0x5ee7ff})}}
      else if(m.state==='swind'){m.st-=dt;faceM(m,dx,dz,dt,3);if(m.st<=0){m.warn=false;m.state='slamrec';m.st=.8}}
      else{m.st-=dt;if(m.st<=0)m.state='chase'}
      break}
  }
}
/* contact damage — evaluated on every client for the local player */
function contactCheck(m){
  if(!m.def.contact||m.hitCd>0||m.spawning||P.dead)return;
  if(m.type==='bat'&&m.ghost&&!m.warn&&false)return;
  if(d2(m.x,m.z,P.x,P.z)<(m.r+P.r)*(m.r+P.r)){if(hurtPlayer(m.dmg,m.x,m.z)){m.hitCd=.9;if(m.type==='bat'&&!m.ghost){m.state='retreat';m.st=.8}}}
}

/* ---------- visuals ---------- */
function tintMob(m){
  let key='',hex=null,int=0;
  if(m.flash>0){key='f';hex=0xffffff;int=.85}
  else if(m.freeze>0){key='i';hex=0x6ad0ff;int=.6}
  else if(m.warn){const on=Math.floor(m.age*14)%2===0;key=on?'w1':'w0';hex=on?0xff3030:null;int=.7}
  if(key===m.tintKey)return;m.tintKey=key;
  for(const q of m.mats){if(!q.emissive)continue;if(hex==null){q.emissive.setHex(q.userData.e0);q.emissiveIntensity=q.userData.i0}else{q.emissive.setHex(hex);q.emissiveIntensity=int}}
}
function animMob(m,dt){
  const o=m.m,t=m.age,mv=m.moving?1:0,g=o.g;
  g.position.x=m.x;g.position.z=m.z;g.rotation.y=m.face;
  let gs=m.scale;if(m.spawning)gs=m.scale*(1-m.sp/.35*.8);g.scale.set(gs,gs,gs);
  switch(m.type){
    case 'slime':{const k=m.hop>0?1:0;o.b.scale.set(1+Math.sin(t*6+m.ph)*.06+k*-.15,1+(k?.28:Math.sin(t*6+m.ph)*.08),1+Math.sin(t*6+m.ph)*.06+k*-.15);g.position.y=k?Math.sin(clamp(1-m.hop/.38,0,1)*Math.PI)*1.1:0;break}
    case 'skel':case 'archer':{const sw=Math.sin(t*10)*.7*(mv?1:.15);o.legL.rotation.x=sw;o.legR.rotation.x=-sw;
      if(m.type==='skel'){o.armR.rotation.x=m.state==='wind'?-2.4:m.state==='rec'?.4:-.4+sw*.5;o.armL.rotation.x=-sw*.5}else{o.armL.rotation.x=-1.5;o.armR.rotation.x=m.state==='wind'?-1.8:-.6}
      o.b.position.y=Math.abs(sw)*.1;break}
    case 'bat':{const f=Math.sin(t*22+m.ph)*.8;o.wl.rotation.z=f;o.wr.rotation.z=-f;g.position.y=m.fly+Math.sin(t*4+m.ph)*.25;break}
    case 'bomber':{const sw=Math.sin(t*16)*.8;o.legL.rotation.x=sw;o.legR.rotation.x=-sw;o.b.position.y=Math.abs(sw)*.12;o.spark.scale.setScalar(.6+Math.random()*.5);
      if(m.warn){const s=1+(1-clamp(m.st/.85,0,1))*.35;o.b.scale.set(s,s,s)}break}
    case 'golem':{const sw=Math.sin(t*5)*.45*(mv?1:.1);o.legL.rotation.x=sw;o.legR.rotation.x=-sw;
      if(m.warn){const k=1-clamp(m.st/1,0,1);o.armL.rotation.x=o.armR.rotation.x=lerp(-.3,-2.9,k)}
      else if(m.state==='slamrec'){o.armL.rotation.x=o.armR.rotation.x=lerp(o.armL.rotation.x,.2,.2)}
      else{o.armL.rotation.x=-sw*1.2;o.armR.rotation.x=sw*1.2}
      o.core.scale.setScalar(2.6*(1+Math.sin(t*4)*.12));o.b.position.y=Math.abs(sw)*.2;break}
  }
  m.moving=false;
}

function updateMobs(dt){
  const auth=isAuth();
  if(auth){
    const A=allPos(),T=targets();
    updateSpawns(dt,A);
    for(const m of MOBS){if(m.dead||m.ghost)continue;updateMobAuth(m,dt,T)}
    // soft separation
    for(let i=0;i<MOBS.length;i++){const a=MOBS[i];if(a.dead||a.fly||a.ghost)continue;
      for(let j=i+1;j<MOBS.length;j++){const b=MOBS[j];if(b.dead||b.fly||b.ghost)continue;const dx=b.x-a.x,dz=b.z-a.z;if(Math.abs(dx)>3||Math.abs(dz)>3)continue;
        const rr=(a.r+b.r)*.85,dd=dx*dx+dz*dz;if(dd<rr*rr&&dd>1e-5){const d=Math.sqrt(dd),k=(rr-d)/d*.5;a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k}}}
  }else{
    for(const m of MOBS){if(!m.ghost||m.dead)continue;
      const k=1-Math.exp(-dt*9),ox=m.x,oz=m.z;m.x=lerp(m.x,m.tx,k);m.z=lerp(m.z,m.tz,k);m.age+=dt;m.hitCd-=dt;if(m.flash>0)m.flash-=dt;
      m.moving=Math.hypot(m.x-ox,m.z-oz)>.01;if(m.spawning){m.sp-=dt;if(m.sp<=0)m.spawning=false}
      if(m.type==='slime'){m.hop=m.moving?.2:0}}
  }
  for(const m of MOBS){if(m.dead)continue;contactCheck(m);tintMob(m);animMob(m,dt)}
  compactMobs();
  updateMobLabels();
}
function updateMobLabels(){
  const near=[];for(const m of MOBS){if(m.dead||m.spawning)continue;const d=d2(m.x,m.z,P.x,P.z);if(d<20*20)near.push([d,m])}
  near.sort((a,b)=>a[0]-b[0]);
  const n=Math.min(10,near.length);
  while(mobLabels.length<10){const el=document.createElement('div');el.className='ml';el.innerHTML='<span class="mn"></span><i class="mb"><b></b></i>';labelsEl.appendChild(el);mobLabels.push({el,n:el.firstElementChild,b:null})}
  for(let i=0;i<mobLabels.length;i++){
    const L=mobLabels[i];
    if(i>=n){L.el.style.display='none';continue}
    const m=near[i][1],s=toScreen(m.x,(m.fly||0)+m.r*2.6+1.4,m.z);
    if(!s.vis){L.el.style.display='none';continue}
    L.el.style.display='block';L.el.style.transform='translate('+(s.x|0)+'px,'+(s.y|0)+'px) translate(-50%,-100%)';
    const txt='Lv.'+m.ml+' '+(m.elite?'정예 ':'')+m.def.n,diff=m.ml-SES.pf.level;
    if(L.last!==txt){L.last=txt;L.n.textContent=txt}
    const cls='ml'+(m.elite?' el':'')+(diff>=5?' hi':diff<=-6?' lo':'');if(L.cls!==cls){L.cls=cls;L.el.className=cls}
    const w=Math.max(0,m.hp/m.maxHp*100).toFixed(0)+'%';const bar=L.el.lastElementChild.firstElementChild;if(L.w!==w){L.w=w;bar.style.width=w}
  }
}
function hideMobLabels(){for(const L of mobLabels)L.el.style.display='none'}
