/* ---------------- monsters: authority simulation + remote ghosts ---------------- */
const MDEF={
  slime:{n:'슬라임',hpM:1,spd:3.4,r:.9,dmgM:.8,mk:()=>makeSlime(pick([0x58d68d,0x5dade2,0x76d7a3])),contact:true,col:0x58d68d,mat:'slime'},
  bat:{n:'박쥐',hpM:.6,spd:6.4,r:.6,dmgM:.7,mk:makeBat,fly:1.2,contact:true,col:0x9a6aff,mat:'flesh'},
  skel:{n:'해골 병사',hpM:1.3,spd:3.8,r:.75,dmgM:1.1,mk:()=>makeSkeleton(false),scale:1.05,col:0xe6e1cf,mat:'bone'},
  archer:{n:'해골 궁수',hpM:.8,spd:3.2,r:.7,dmgM:.9,mk:()=>makeSkeleton(true),scale:1.05,col:0xc9b6ff,mat:'bone'},
  bomber:{n:'폭탄 도깨비',hpM:.7,spd:5.4,r:.7,dmgM:1.6,mk:makeBomber,scale:1.1,col:0xff7a4a,mat:'flesh'},
  golem:{n:'수정 거인',hpM:2.4,spd:2.6,r:1.4,dmgM:1.4,mk:makeGolem,scale:.62,contact:true,col:0x5ee7ff,mat:'stone'},
  boar:{n:'들멧돼지',hpM:1.5,spd:3.6,r:.95,dmgM:1.2,mk:()=>makeQuad({kind:'boar',body:0x7a5236,dk:0x4a3020,eye:0xff4a3a,tusk:1,snout:0xc79a82}),contact:true,col:0xc08a5a,mat:'flesh',snd:'growl',ch:{min:4,max:12,tel:.55,dur:.55,sp:3.8,rec:.8,cd:[2.4,3.6]}},
  hound:{n:'지옥견',hpM:1,spd:5.2,r:.8,dmgM:1.1,mk:()=>makeQuad({kind:'hound',body:0x4a2a2a,dk:0x2a1414,eye:0xffa030,ears:1,flame:0xff6a2a,snout:0x5a3a3a,len:1.6}),contact:true,col:0xff7a3a,mat:'flesh',snd:'snarl',ch:{min:3,max:10,tel:.4,dur:.45,sp:3.4,rec:.6,cd:[1.8,2.8]},pack:[2,3]},
  frostwolf:{n:'서리늑대',hpM:1.1,spd:5.6,r:.8,dmgM:1.1,mk:()=>makeQuad({kind:'frostwolf',body:0xd8e6f2,dk:0x8fa8c0,eye:0x6ad0ff,ears:1,frost:1,snout:0xeef4fa,len:1.6}),contact:true,col:0xbfe6ff,mat:'flesh',snd:'howl',ch:{min:3,max:11,tel:.4,dur:.5,sp:3.3,rec:.6,cd:[1.8,3]},pack:[2,4]},
  jackal:{n:'사막 자칼',hpM:1,spd:5.6,r:.75,dmgM:1.1,mk:()=>makeQuad({kind:'jackal',body:0xb89860,dk:0x6a5430,eye:0xffe04a,ears:1,snout:0xd8c090,len:1.5}),contact:true,col:0xe0c080,mat:'flesh',snd:'snarl',ch:{min:3,max:10,tel:.4,dur:.45,sp:3.4,rec:.6,cd:[1.8,2.8]},pack:[2,4]},
  wraith:{n:'망령',hpM:.9,spd:3.2,r:.8,dmgM:1,mk:makeWraith,fly:1,col:0x7aa8ff,mat:'ghost',snd:'moan',cast:{kind:'fan',lo:7,hi:12,col:0x9fe8ff,cd:[2.2,3.2],wind:.6}},
  spider:{n:'수정 거미',hpM:1,spd:5,r:.9,dmgM:1.1,mk:makeSpider,scale:.9,contact:true,col:0x7a7aff,mat:'chitin',snd:'hiss'},
  stormhawk:{n:'폭풍매',hpM:.9,spd:5.4,r:.8,dmgM:1.2,mk:makeStormhawk,fly:1.9,col:0xffe27a,mat:'flesh',snd:'screech',cast:{kind:'strike',lo:8,hi:15,col:0xffe27a,cd:[2.4,3.4],wind:.5}},
  phantom:{n:'공허 암살자',hpM:.9,spd:4.6,r:.7,dmgM:1.5,mk:makePhantom,scale:1.05,col:0xff3dd0,mat:'ghost',snd:'whoosh'},
  yeti:{n:'설인',hpM:2.6,spd:2.8,r:1.3,dmgM:1.5,mk:makeYeti,scale:.78,col:0xcfe6ff,mat:'cloth',snd:'growl'},
  icewitch:{n:'설녀',hpM:.9,spd:3.4,r:.7,dmgM:1.1,mk:makeIceWitch,scale:1.05,col:0x9fe8ff,mat:'ice',snd:'chime',cast:{kind:'nova',lo:7,hi:12,col:0x9fe8ff,cd:[3,4],wind:.8}},
  scorpion:{n:'모래 전갈',hpM:1.2,spd:4.2,r:1,dmgM:1.3,mk:makeScorpion,col:0xe8c060,mat:'chitin',snd:'hiss'},
  mummy:{n:'미라',hpM:1.9,spd:2.4,r:.85,dmgM:1.4,mk:makeMummy,scale:1.1,col:0xd8c9a0,mat:'cloth',snd:'moan'},
  sentinel:{n:'성역 수호병',hpM:2.2,spd:3,r:.95,dmgM:1.4,mk:makeSentinel,scale:1.12,col:0xffe27a,mat:'metal',snd:'clank'},
  seraph:{n:'타락 세라핌',hpM:1,spd:3.2,r:.8,dmgM:1.2,mk:makeSeraph,fly:.9,scale:1.1,col:0xffe27a,mat:'holy',snd:'chime',cast:{kind:'rain',lo:8,hi:14,col:0xffe27a,cd:[3,4],wind:.9}},
  dgboss:{n:'던전 보스',hpM:1,spd:4,r:1.8,dmgM:1.3,mk:()=>dgBossModel(),contact:true,col:0xffd24a,mat:'flesh',snd:'growl'}
};
const DYING=[];
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
  m.dead=true;
  if(fx){burst(m.x,1.2,m.z,12,m.def.col,7,.5,8);sfxAt(m.def.mat==='slime'||m.type==='bomber'?'pop':'die',m.x,m.z);retire(m,.22)}else entG.remove(m.m.g);
}
/* keep the model around for a short squash-and-fade death animation */
function retire(m,dur){
  const g=m.m.g;g.visible=true;DYING.push({g,t:0,dur:dur||.3,sc:g.scale.x,dx:m.lx||0,dz:m.lz||0,y0:g.position.y,spin:rnd(-5,5)});
}
function updateDying(dt){
  for(let i=DYING.length-1;i>=0;i--){
    const q=DYING[i];q.t+=dt;const k=Math.min(1,q.t/q.dur),s=q.sc*(1-k*k);
    q.g.position.x+=q.dx*dt*6*(1-k);q.g.position.z+=q.dz*dt*6*(1-k);q.g.position.y=q.y0+Math.sin(k*Math.PI)*.5;q.g.rotation.y+=q.spin*dt;
    q.g.scale.set(s*(1+k*.35),Math.max(.02,s*(1-k*.65)),s*(1+k*.35));
    if(k>=1){entG.remove(q.g);DYING.splice(i,1)}
  }
}
function resetMobs(){for(const m of MOBS)entG.remove(m.m.g);for(const q of DYING)entG.remove(q.g);DYING.length=0;MOBS.length=0;clearProjectiles()}
function clearMobsNearTown(){for(const m of MOBS)if(Math.hypot(m.x,m.z)<38)removeMob(m,false);compactMobs()}
function compactMobs(){for(let i=MOBS.length-1;i>=0;i--)if(MOBS[i].dead)MOBS.splice(i,1)}

/* ---------- authority helpers ---------- */
function isAuth(){return !(typeof NET!=='undefined'&&NET.party&&NET.party.leader!==SES.name)}
const DECOYS=[];   // summons that draw monster attention: {x,z,pull<1}
function targets(){
  const T=DECOYS.map(d=>({x:d.x,z:d.z,pull:d.pull}));if(!P.dead&&!(P.stealth>0)&&!P.hidden)T.push({x:P.x,z:P.z,me:true});
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
    const hw=huntInfo().on,gold=!hw&&zn.id>=1&&Math.random()<.014&&!MOBS.some(q=>q.golden&&!q.dead),elite=!gold&&Math.random()<(hw?.14:isNight()?.05:.035),type=gold?'slime':pick(zn.types),n=(elite||gold)?1:(MDEF[type].pack?rndi(MDEF[type].pack[0],MDEF[type].pack[1]):zn.id>=4?rndi(1,2):rndi(1,3));
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
  if(m.dg){const w=by||SES.name;DG.dmg[w]=(DG.dmg[w]||0)+Math.max(0,Math.min(d,m.hp))}
  m.hp-=d;m.flash=.09;m.aggro=by||null;
  if(kk&&(kk.kx||kk.kz)){const l=Math.hypot(kk.kx,kk.kz)||1;m.lx=kk.kx/l;m.lz=kk.kz/l}
  if(kk&&kk.kb){const l=Math.hypot(kk.kx,kk.kz)||1,res=m.elite?.3:1;m.kx+=kk.kx/l*kk.kb*res*1.6;m.kz+=kk.kz/l*kk.kb*res*1.6}
  if(m.hp<=0)killMob(m);
}
function killMob(m){
  if(m.dead)return;m.dead=true;retire(m,m.elite?.5:.28);
  sfxAt(m.elite?'die_big':(m.def.mat==='slime'||m.type==='bomber')?'pop':'die',m.x,m.z);if(m.elite)hitStop(.09);
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
function nearestT(m,T){let b=null,bd=1e9;for(const t of T){const d=d2(m.x,m.z,t.x,t.z)*(t.pull||1);if(d<bd){bd=d;b=t}}return b?{t:b,d:Math.sqrt(d2(m.x,m.z,b.x,b.z))}:null}
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
    const nt=nearestT(m,T),aggro=m.dg?80:m.elite?22:15;
    if(nt&&nt.d<aggro){m.tgt=nt.t;aiMob(m,dt,nt,sp)}
    else{ // wander
      m.wt-=dt;if(m.wt<=0){m.wt=rnd(1.5,3.5);const a=rnd(0,TAU);m.wx=Math.cos(a);m.wz=Math.sin(a);if(Math.random()<.4){m.wx=0;m.wz=0}}
      if(m.wx||m.wz){stepM(m,m.wx,m.wz,m.spd*.35,dt);faceM(m,m.wx,m.wz,dt,6);m.moving=true}
    }
  }
  if(!m.fly||m.dg)pushOut(m,m.r*.7);
  if(m.dg)return;
  const d=Math.hypot(m.x,m.z);if(d<20.5){const k=20.5/(d||1);m.x*=k;m.z*=k}
  if(d>WORLD_R-2){m.x*=(WORLD_R-2)/d;m.z*=(WORLD_R-2)/d}
}
function castPattern(m,c,t){
  const an=Math.atan2(t.x-m.x,t.z-m.z);
  if(c.kind==='fan'){for(const k of[-.3,0,.3])emitEvent({t:'b',x:m.x+Math.sin(an+k),z:m.z+Math.cos(an+k),a:an+k,s:11,d:m.dmg*.8,c:c.col,l:3})}
  else if(c.kind==='nova'){const n=10,o=m.age;for(let i=0;i<n;i++){const a=i/n*TAU+o;emitEvent({t:'b',x:m.x+Math.sin(a),z:m.z+Math.cos(a),a,s:8,d:m.dmg*.7,c:c.col,l:2.6})}}
  else if(c.kind==='strike'){emitEvent({t:'x',x:t.x,z:t.z,r:2.6,w:.8,d:m.dmg*1.2,c:c.col});emitEvent({t:'x',x:t.x+rnd(-4,4),z:t.z+rnd(-4,4),r:2.4,w:1.1,d:m.dmg*1.1,c:c.col})}
  else if(c.kind==='rain'){for(let i=0;i<4;i++)emitEvent({t:'x',x:t.x+(i?rnd(-5,5):0),z:t.z+(i?rnd(-5,5):0),r:2.3,w:.9+i*.18,d:m.dmg,c:c.col})}
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
    case 'boar':case 'hound':case 'frostwolf':case 'jackal':{
      const c=m.def.ch;
      if(m.state==='chase'||m.state==='retreat'){faceM(m,dx,dz,dt,10);
        if(m.type!=='boar'&&d<7&&d>2.6){stepM(m,-dz*m.strafe*.8+dx*.3,dx*m.strafe*.8+dz*.3,m.spd*.8,dt);m.moving=true}
        else if(d>1.7){stepM(m,dx,dz,m.spd,dt);m.moving=true}
        if(m.cd<=0&&d>c.min&&d<c.max){m.state='tele';m.st=c.tel;m.warn=true;m.cdx=dx;m.cdz=dz;emitEvent({t:'v',x:m.x,z:m.z,n:m.def.snd})}
        else if(m.cd<=0&&d<=c.min)m.cd=.4}
      else if(m.state==='tele'){m.st-=dt;faceM(m,dx,dz,dt,14);m.cdx=dx;m.cdz=dz;if(m.st<=0){m.warn=false;m.state='rush';m.st=c.dur}}
      else if(m.state==='rush'){m.st-=dt;stepM(m,m.cdx,m.cdz,m.spd*c.sp,dt);faceM(m,m.cdx,m.cdz,dt,20);m.moving=true;if(m.st<=0){m.state='rec';m.st=c.rec;m.cd=rnd(c.cd[0],c.cd[1])}}
      else{m.st-=dt;if(m.st<=0)m.state='chase'}
      break}
    case 'wraith':case 'stormhawk':case 'icewitch':case 'seraph':{
      const c=m.def.cast;faceM(m,dx,dz,dt,10);
      if(m.state==='wind'){m.st-=dt;m.warn=true;if(m.st<=0){m.warn=false;castPattern(m,c,t);m.state='move';m.cd=rnd(c.cd[0],c.cd[1])}}
      else{let mvv=0;if(d<c.lo)mvv=-1;else if(d>c.hi)mvv=1;
        if(mvv)stepM(m,dx*mvv,dz*mvv,m.spd,dt);else stepM(m,-dz*m.strafe,dx*m.strafe,m.spd*.5,dt);m.moving=true;
        if(m.cd<=0&&d<c.hi+5){m.state='wind';m.st=c.wind;emitEvent({t:'v',x:m.x,z:m.z,n:m.def.snd})}}
      break}
    case 'dgboss':dgBossAI(m,dt,dx,dz,d);break;
    case 'spider':{
      faceM(m,dx,dz,dt,12);
      if(m.state==='wind'){m.st-=dt;m.warn=true;if(m.st<=0){m.warn=false;const an=Math.atan2(t.x-m.x,t.z-m.z);emitEvent({t:'b',x:m.x+Math.sin(an),z:m.z+Math.cos(an),a:an,s:13,d:m.dmg*.9,c:0x9aff6a,l:3});m.state='chase';m.cd=rnd(1.8,2.6)}}
      else{const zz=Math.sin(m.age*3+m.ph);
        if(d>6)stepM(m,dx-dz*zz*.8,dz+dx*zz*.8,m.spd,dt);else if(d<3.2)stepM(m,-dx,-dz,m.spd*.8,dt);else stepM(m,-dz*m.strafe,dx*m.strafe,m.spd*.9,dt);
        m.moving=true;if(m.cd<=0&&d<14){m.state='wind';m.st=.4;emitEvent({t:'v',x:m.x,z:m.z,n:'hiss'})}}
      break}
    case 'phantom':{
      if(m.state==='chase'){faceM(m,dx,dz,dt,12);if(d>2){stepM(m,dx,dz,m.spd,dt);m.moving=true}
        if(m.cd<=0&&d<13&&d>3){m.state='vanish';m.st=.3;emitEvent({t:'f',x:m.x,z:m.z,c:0xff3dd0,n:'whoosh'})}}
      else if(m.state==='vanish'){m.st-=dt;if(m.st<=0){const an=Math.atan2(t.x-m.x,t.z-m.z)+Math.PI+rnd(-.5,.5);m.x=t.x+Math.sin(an)*2.4;m.z=t.z+Math.cos(an)*2.4;emitEvent({t:'f',x:m.x,z:m.z,c:0xff3dd0,n:'whoosh'});m.state='wind';m.st=.45;m.warn=true}}
      else if(m.state==='wind'){m.st-=dt;faceM(m,t.x-m.x,t.z-m.z,dt,20);if(m.st<=0){m.warn=false;emitEvent({t:'s',x:m.x,z:m.z,f:Math.atan2(t.x-m.x,t.z-m.z),r:3,a:2,d:m.dmg*1.2});m.state='rec';m.st=.9}}
      else{m.st-=dt;if(m.st<=0){m.state='chase';m.cd=rnd(2.5,3.8)}}
      break}
    case 'yeti':{
      if(m.state==='chase'){faceM(m,dx,dz,dt,5);if(d>2.6){stepM(m,dx,dz,m.spd,dt);m.moving=true}
        if(m.cd<=0&&d<10){m.cd=rnd(3.4,4.6);emitEvent({t:'v',x:m.x,z:m.z,n:'growl'});
          if(d<4.5&&Math.random()<.55){m.state='smash';m.st=.8;m.warn=true}
          else{m.state='stomp';m.st=1;m.warn=true;emitEvent({t:'x',x:m.x+dx*3,z:m.z+dz*3,r:5.5,w:1,d:m.dmg*1.3,c:0xbfe6ff})}}}
      else if(m.state==='smash'){m.st-=dt;faceM(m,dx,dz,dt,6);if(m.st<=0){m.warn=false;emitEvent({t:'s',x:m.x,z:m.z,f:m.face,r:3.6,a:2.4,d:m.dmg*1.2});m.state='rec';m.st=1}}
      else if(m.state==='stomp'){m.st-=dt;if(m.st<=0){m.warn=false;m.state='rec';m.st=.9}}
      else{m.st-=dt;if(m.st<=0)m.state='chase'}
      break}
    case 'scorpion':{
      if(m.state==='chase'){faceM(m,dx,dz,dt,8);
        if(d>3.4){stepM(m,dx,dz,m.spd,dt);m.moving=true}else if(m.cd<=0){m.state='wind';m.st=.6;m.warn=true;emitEvent({t:'v',x:m.x,z:m.z,n:'hiss'})}else{stepM(m,-dz*m.strafe,dx*m.strafe,m.spd*.5,dt);m.moving=true}
        if(m.cd<=0&&d>7&&d<14&&Math.random()<dt*1.2){m.state='spit';m.st=.5;m.warn=true}}
      else if(m.state==='wind'){m.st-=dt;faceM(m,dx,dz,dt,16);if(m.st<=0){m.warn=false;emitEvent({t:'s',x:m.x,z:m.z,f:m.face,r:4.6,a:.9,d:m.dmg*1.2});m.state='rec';m.st=.8;m.cd=rnd(1.4,2)}}
      else if(m.state==='spit'){m.st-=dt;faceM(m,dx,dz,dt,14);if(m.st<=0){m.warn=false;const an=Math.atan2(t.x-m.x,t.z-m.z);for(const k of[-.14,.14])emitEvent({t:'b',x:m.x+Math.sin(an+k),z:m.z+Math.cos(an+k),a:an+k,s:11,d:m.dmg*.8,c:0x6aff6a,l:3});m.state='rec';m.st=.7;m.cd=rnd(2,3)}}
      else{m.st-=dt;if(m.st<=0)m.state='chase'}
      break}
    case 'mummy':{
      if(m.state==='chase'){faceM(m,dx,dz,dt,6);if(d>2.4){stepM(m,dx,dz,m.spd,dt);m.moving=true}else{m.state='wind';m.st=.85;m.warn=true;emitEvent({t:'v',x:m.x,z:m.z,n:'moan'})}
        if(m.cd<=0&&d>5&&d<10){m.cd=rnd(4.5,6);emitEvent({t:'x',x:t.x,z:t.z,r:3,w:1.1,d:m.dmg,c:0x6aff9a})}}
      else if(m.state==='wind'){m.st-=dt;faceM(m,dx,dz,dt,6);if(m.st<=0){m.warn=false;emitEvent({t:'s',x:m.x,z:m.z,f:m.face,r:3.2,a:2.2,d:m.dmg*1.1});m.state='rec';m.st=1}}
      else{m.st-=dt;if(m.st<=0)m.state='chase'}
      break}
    case 'sentinel':{
      if(m.state==='chase'){faceM(m,dx,dz,dt,8);if(d>2.2){stepM(m,dx,dz,m.spd,dt);m.moving=true}else{m.state='c1';m.st=.5;m.warn=true;emitEvent({t:'v',x:m.x,z:m.z,n:'clank'})}
        if(m.cd<=0&&d>6&&d<12){m.cd=rnd(5,7);emitEvent({t:'x',x:t.x,z:t.z,r:3.2,w:1,d:m.dmg*1.1,c:0xffe27a})}}
      else if(m.state==='c1'){m.st-=dt;faceM(m,dx,dz,dt,10);if(m.st<=0){emitEvent({t:'s',x:m.x,z:m.z,f:m.face,r:3,a:1.8,d:m.dmg});m.state='c2';m.st=.45}}
      else if(m.state==='c2'){m.st-=dt;faceM(m,dx,dz,dt,12);if(m.st<=0){m.warn=false;emitEvent({t:'s',x:m.x,z:m.z,f:m.face,r:3.3,a:2.2,d:m.dmg*1.3});m.state='rec';m.st=1.1}}
      else{m.st-=dt;if(m.st<=0)m.state='chase'}
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
  if(!m.def.contact||m.hitCd>0||m.spawning||P.dead||P.stealth>0||P.hidden)return;
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
  let gs=m.scale;if(m.spawning)gs=m.scale*(1-m.sp/.35*.8);const pp=m.pop||0;if(pp>0)m.pop=Math.max(0,pp-dt*7);g.scale.set(gs*(1+pp*.14),gs*(1-pp*.12),gs*(1+pp*.14));
  const kind=m.at||m.type;
  switch(kind){
    case 'slime':{const k=m.hop>0?1:0;o.b.scale.set(1+Math.sin(t*6+m.ph)*.06+k*-.15,1+(k?.28:Math.sin(t*6+m.ph)*.08),1+Math.sin(t*6+m.ph)*.06+k*-.15);g.position.y=k?Math.sin(clamp(1-m.hop/.38,0,1)*Math.PI)*1.1:0;break}
    case 'skel':case 'archer':{const sw=Math.sin(t*10)*.7*(mv?1:.15);o.legL.rotation.x=sw;o.legR.rotation.x=-sw;
      if(kind==='skel'){o.armR.rotation.x=m.state==='wind'?-2.4:m.state==='rec'?.4:-.4+sw*.5;o.armL.rotation.x=-sw*.5}else{o.armL.rotation.x=-1.5;o.armR.rotation.x=m.state==='wind'?-1.8:-.6}
      o.b.position.y=Math.abs(sw)*.1;break}
    case 'bat':{const f=Math.sin(t*22+m.ph)*.8;o.wl.rotation.z=f;o.wr.rotation.z=-f;g.position.y=m.fly+Math.sin(t*4+m.ph)*.25;break}
    case 'bomber':{const sw=Math.sin(t*16)*.8;o.legL.rotation.x=sw;o.legR.rotation.x=-sw;o.b.position.y=Math.abs(sw)*.12;o.spark.scale.setScalar(.6+Math.random()*.5);
      if(m.warn){const s=1+(1-clamp(m.st/.85,0,1))*.35;o.b.scale.set(s,s,s)}break}
    case 'boar':case 'hound':case 'frostwolf':case 'jackal':{
      const sw=Math.sin(t*(m.state==='rush'?22:13))*.8*(mv?1:.1);
      o.legs[0].rotation.x=sw;o.legs[3].rotation.x=sw;o.legs[1].rotation.x=-sw;o.legs[2].rotation.x=-sw;
      o.tail.rotation.y=Math.sin(t*8+m.ph)*.4;o.head.rotation.x=m.warn?.35:Math.sin(t*3+m.ph)*.03;
      o.b.position.y=Math.abs(sw)*.08;o.b.scale.set(1,m.warn?.88:1,m.warn?1.06:1);break}
    case 'wraith':{g.position.y=m.fly+Math.sin(t*2+m.ph)*.35;o.armL.rotation.x=o.armR.rotation.x=m.warn?-2.2:-.3+Math.sin(t*3)*.15;o.tail.rotation.z=Math.sin(t*3)*.2;o.gl.material.opacity=.4+Math.sin(t*5)*.12;break}
    case 'spider':{for(const l of o.legs)l.g.rotation.y=Math.sin(t*(mv?18:3)+l.i*1.2+(l.s>0?0:Math.PI))*.35;o.b.position.y=.75+(mv?Math.abs(Math.sin(t*18))*.05:0);o.b.rotation.x=m.warn?-.3:0;break}
    case 'stormhawk':{const f=Math.sin(t*(m.warn?26:12)+m.ph)*.7;o.wl.rotation.z=f;o.wr.rotation.z=-f;g.position.y=m.fly+Math.sin(t*3+m.ph)*.3;o.b.rotation.x=mv?.2:0;break}
    case 'scorpion':{for(const l of o.legs)l.g.rotation.y=Math.sin(t*14+l.i*1.3+(l.s>0?0:Math.PI))*.4*(mv?1:.15);o.tail.rotation.x=m.warn?.9+Math.sin(t*30)*.04:Math.sin(t*2)*.12;o.pin[0].rotation.y=o.pin[1].rotation.y=Math.sin(t*3)*.08;break}
    case 'phantom':case 'yeti':case 'mummy':case 'sentinel':case 'icewitch':case 'seraph':{
      const sw=Math.sin(t*(kind==='mummy'?6:9))*.6*(mv?1:.12);
      o.legL.rotation.x=sw;o.legR.rotation.x=-sw;
      if(kind==='mummy')o.armL.rotation.x=o.armR.rotation.x=-1.3+(m.warn?-.9:0)+Math.sin(t*2)*.1;
      else if(kind==='yeti')o.armL.rotation.x=o.armR.rotation.x=m.warn?-2.8:-sw*.9;
      else if(kind==='icewitch'||kind==='seraph'){o.armR.rotation.x=m.warn?-2.4:-.6;o.armL.rotation.x=m.warn?-2.4:-.3}
      else{o.armR.rotation.x=m.warn?-2.5:-.4+sw*.5;o.armL.rotation.x=m.warn?-.9:-sw*.5}
      if(kind==='seraph'){g.position.y=m.fly+Math.sin(t*2+m.ph)*.3;o.wings.forEach((w,i)=>{w.rotation.z=(i?1:-1)*(.2+Math.sin(t*5)*.25)});if(o.halo)o.halo.rotation.z=t*2}
      if(kind==='phantom')g.visible=m.state!=='vanish';
      o.b.position.y=Math.abs(sw)*.08;break}
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
    if(DG.on)dgTick(dt,A);else updateSpawns(dt,A);
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
  updateDying(dt);compactMobs();
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
    L.el.style.display='block';const tf='translate('+(s.x|0)+'px,'+(s.y|0)+'px) translate(-50%,-100%)';if(L.tf!==tf){L.tf=tf;L.el.style.transform=tf}
    const txt='Lv.'+m.ml+' '+(m.elite?'정예 ':'')+(m.bn||m.def.n),diff=m.ml-SES.pf.level;
    if(L.last!==txt){L.last=txt;L.n.textContent=txt}
    const cls='ml'+(m.elite?' el':'')+(diff>=5?' hi':diff<=-6?' lo':'');if(L.cls!==cls){L.cls=cls;L.el.className=cls}
    const w=Math.max(0,m.hp/m.maxHp*100).toFixed(0)+'%';const bar=L.el.lastElementChild.firstElementChild;if(L.w!==w){L.w=w;bar.style.width=w}
  }
}
function hideMobLabels(){for(const L of mobLabels)L.el.style.display='none'}
