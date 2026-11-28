/* ---------------- player: stats, movement, attacks, skills ---------------- */
const G={mode:'boot',t:0,ts:1,last:performance.now()};
let P=null,PM=null,S=null;
const inTown=(x,z)=>x*x+z*z<19*19;

function derive(){
  const pf=SES.pf,c=CLS[pf.cls],hid=hidOn(pf),job=jobDef(curJob(pf))||JOBS[pf.cls],m=job.m,L=pf.level;
  const w=pf.items.find(i=>i.kind==='weapon'&&i.eq);
  const ab=armorBonus(pf.items.filter(i=>i.kind==='armor'&&i.eq));
  const wa=w?weaponAtk(w.base,w.enh):0,wt=w?WTMOD[wType(w.base)]:WTMOD[0];const en={};(w?w.ench:[]).forEach(e=>en[e.k]=e.l);
  const rf=weaponRuneFx(w);if(rf){for(const e in rf.en)en[e]=(en[e]||0)+rf.en[e];if(en.aspd>10)en.aspd=10}
  const burnLv=(m.burn||0)+(en.burn||0);
  const dr=Math.min(.8,dmgReduce(ab.def,L)+ab.armor),pk=perkOf(pf);
  S={
    cls:pf.cls,job:curJob(pf),hidden:hid,atkCls:hid&&w?styleCls(w.base):pf.cls,level:L,
    maxHp:Math.round(((hid?HIDDEN_HP:(c.hp+L*c.hpLv)*(m.hp||1))+ab.hp)*(1+ab.hpPct+(rf?rf.hp:0))*(1+PERK.h.per*pk.h)),
    atk:(c.atk+L*c.atkLv+wa)*(m.atk||1)*wt.atk*(1+ab.atk)*(1+PERK.a.per*pk.a),wa,cdr:Math.min(.4,PERK.c.per*pk.c),
    aps:(hid?HID_APS:c.aps)*(m.aps||1)*wt.aps*(1+ab.aps)*(1+(en.aspd||0)*.06),
    spd:c.spd*(m.spd||1)*(1+ab.spd),
    crit:Math.min(.8,c.crit+(m.crit||0)+wt.crit+ab.crit+(en.crit||0)*.05),critDmg:1.6,
    armor:1-(1-(m.armor||0))*(1-dr)*(1-(en.armor||0)*.04),
    grace:m.grace||0,vamp:(m.vamp||0)+ab.vamp+(en.vamp||0)*.03+(pf.cls==='rogue'&&!hid?ROGUE_VAMP:0),burnLv,
    chainP:Math.min(.6,(m.chain||0)*.10+(en.chain||0)*.12),explP:(en.explode||0)*.10,
    pierce:(m.pierce||0)+(en.pierce||0),rangeMul:1+(en.pierce||0)*.1,
    regen:(m.regen||0)+(rf?rf.rg:0),runeAura:!!(rf&&rf.aura),berserk:!!m.berserk,weapon:w||null,en,def:ab.def,setCnt:ab.cnt
  };
  return S;
}
function newPlayer(){
  skReset();derive();
  P={x:SPAWN.x,z:SPAWN.z,vx:0,vz:0,face:Math.PI,r:.6,ix:0,iz:0,hp:S.maxHp,hpShow:100,
    atkCd:0,atkAnim:-1,atkDur:.3,combo:0,comboT:0,swing:1,dashT:0,dashCd:0,dashDX:0,dashDZ:1,iframes:0,
    cd:{q:0,e:0,r:0,f:0},cdMax:{q:1,e:1,r:1,f:1},buff:null,pot:{hp:0,spd:0,atk:0,def:0},shield:0,
    spinT:0,dead:false,deadT:0,animT:0,spdN:0,regenAcc:0,vampAcc:0,castT:0};
  buildPlayerModel();
}
function buildPlayerModel(){
  if(PM)entG.remove(PM.g);
  PM=makeHeroFor(lookCls(SES.pf.cls,curJob(),myWeaponBase()),curJob(),CLS[SES.pf.cls].col);applyWeaponLook(PM,myWeaponBase());entG.add(PM.g);
}
function myWeaponBase(){const w=SES.pf&&SES.pf.items.find(i=>i.kind==='weapon'&&i.eq);return w?w.base:null}
function skillOf(slot){
  const pf=SES.pf,c=CLS[pf.cls],j=JOBS[pf.job],hid=hidOn(pf);
  if(hid)return HIDDEN[hid].skills[['q','e','r','f'].indexOf(slot)]||null;
  if(pf.cls==='cleric'){
    if(slot==='q'){const L=pf.level;if(L<10)return null;const t=L>=30?3:L>=20?2:1;return CLQ[t]}
    if(slot==='e'&&pf.level<15)return null;
  }
  if(slot==='q')return c.q;if(slot==='e')return c.e;if(slot==='f')return pf.level>=MAXLV?ULT[pf.cls]:null;
  return j&&j.tier>0?j.r:null;
}
const effAtk=()=>S.atk*(P.buff&&P.buff.atk?P.buff.atk:1)*(P.pot.atk>0?1.3:1)*(P.hb&&hbOn('my')?1.1:1);
const effAps=()=>S.aps*((S.berserk&&P.hp<S.maxHp*.5)?1.4:1)*(P.buff&&P.buff.aps?P.buff.aps:1)*(P.hb&&hbOn('my')?1.25:1);
const effSpd=()=>S.spd*(P.buff&&P.buff.spd?P.buff.spd:1)*(P.hb&&hbOn('my')?1.2:1)*(P.pot.spd>0?1.4:1)*(P.spinT>0?.6:1)*(P.slow||1);

/* ----- targeting ----- */
function nearestMob(range,from){
  let best=null,bd=range*range;const fx=from?from.x:P.x,fz=from?from.z:P.z;
  for(const m of MOBS){if(m.dead||m.spawning)continue;const d=d2(m.x,m.z,fx,fz);if(d<bd){bd=d;best=m}}
  return best;
}
function aimDir(){
  if(P.autoAim){const m=P.autoAim,dx=m.x-P.x,dz=m.z-P.z,l=Math.hypot(dx,dz)||1;return{x:dx/l,z:dz/l,m}}   // only while an automatic basic attack fires
  if(IS_TOUCH||mv.on){const m=nearestMob(15);if(m){const dx=m.x-P.x,dz=m.z-P.z,l=Math.hypot(dx,dz)||1;return{x:dx/l,z:dz/l,m}}return{x:Math.sin(P.face),z:Math.cos(P.face),m:null}}
  const dx=mouse.gx-P.x,dz=mouse.gz-P.z,l=Math.hypot(dx,dz)||1;return{x:dx/l,z:dz/l,m:null};
}
function aimPoint(range){
  if(IS_TOUCH||mv.on){const m=nearestMob(range);if(m)return{x:m.x,z:m.z};return{x:P.x+Math.sin(P.face)*Math.min(range,7),z:P.z+Math.cos(P.face)*Math.min(range,7)}}
  let tx=mouse.gx,tz=mouse.gz;const dd=Math.hypot(tx-P.x,tz-P.z);if(dd>range){tx=P.x+(tx-P.x)/dd*range;tz=P.z+(tz-P.z)/dd*range}return{x:tx,z:tz};
}

/* ----- movement ----- */
function playerFacing(dt){
  if(!IS_TOUCH){const g=groundPoint(mouse.x,mouse.y);if(g){mouse.gx=g.x;mouse.gz=g.z}}
  let tf=P.face;
  const a=aimDir();
  if(IS_TOUCH||mv.on){
    if(a.m&&(P.atkAnim>=0||P.atkCd>.05||(save.auto&&!inTown(P.x,P.z))))tf=Math.atan2(a.x,a.z);
    else if(P.ix||P.iz)tf=Math.atan2(P.ix,P.iz);
  }else{
    const t=P.autoT;
    if(t&&!t.dead&&!mouse.down&&P.atkAnim>=0)tf=Math.atan2(t.x-P.x,t.z-P.z);
    else if(Math.hypot(mouse.gx-P.x,mouse.gz-P.z)>.4)tf=Math.atan2(mouse.gx-P.x,mouse.gz-P.z);
  }
  P.face=lerpAng(P.face,tf,1-Math.exp(-dt*22));
}
function movePlayer(dt){
  let ix=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),iz=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  if(mv.on&&!ix&&!iz){ix=mv.x;iz=mv.z}   // real keys win over a stick left on
  const il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il}P.ix=ix;P.iz=iz;
  const sp=effSpd();
  P.qClock=(P.qClock||0)+dt;
  if(P.qArm!=null){if(!qHeld())P.qArm=null;else if(P.qClock-P.qArm>=.12){P.qArm=null;qGlideStart()}}
  if(P.glide){qGlideStep(dt);P.vx=P.vz=0;return}
  if(P.leap){   // fly along an arc, no steering
    const L=P.leap;L.t+=dt;const u=Math.min(1,L.t/L.dur),k=L.smooth?u*u*(3-2*u):u;P.x=lerp(L.x0,L.x1,k);P.z=lerp(L.z0,L.z1,k);P.vx=P.vz=0;if(DG.on||DU.on)pushOut(P,P.r);
    if(u>=1){P.leap=null;pushOut(P,P.r);if(L.done)L.done()}return;
  }
  if(P.dashT>0){
    P.dashT-=dt;P.vx=P.dashDX*(P.dashSp||38);P.vz=P.dashDZ*(P.dashSp||38);
    emit(P.x,1,P.z,rnd(-1,1),rnd(0,1.5),rnd(-1,1),.35,JOB_COL[curJob()]||CLS[S.cls].col,0);
    if(P.dashHit)dashStrike(dt);
  }else{const k=1-Math.exp(-dt*(il>0?16:11));P.vx=lerp(P.vx,ix*sp,k);P.vz=lerp(P.vz,iz*sp,k)}
  P.x+=P.vx*dt;P.z+=P.vz*dt;pushOut(P,P.r);
  if(P.dashT<=0&&!P.dead){P.stepAcc=(P.stepAcc||0)+Math.hypot(P.vx,P.vz)*dt;if(P.stepAcc>2.2){P.stepAcc=0;if(!(PM&&PM.hid))footstep()}}
  P.spdN=Math.min(1.2,Math.hypot(P.vx,P.vz)/Math.max(1,S.spd));
}
const STEPS=['step_stone','step_grass','step_grass','step_stone','step_stone','step_stone','step_stone','step_snow','step_sand','step_marble'];
function footstep(){const z=zoneAt(P.x,P.z);sfx(STEPS[z.id]||'step_stone',.55)}
/* airborne pose: lean forward, legs and arms trailing, no walk cycle (k: 0..1 blend) */
function glidePose(o,t,k,atk){
  if(atk==null)atk=P.atkAnim;
  const sway=Math.sin(t*3.2)*.07,tilt=.6*k;
  o.body.rotation.x=tilt;o.body.position.z=-1.5*Math.sin(tilt);o.body.position.y=1.5*(1-Math.cos(tilt))+(o.hover||0);   // lean around the shoulders so the cloak stays attached
  o.legL.rotation.x=lerp(o.legL.rotation.x,.35+sway,k);o.legR.rotation.x=lerp(o.legR.rotation.x,.7-sway,k);
  o.armL.rotation.x=lerp(o.armL.rotation.x,.55+sway,k);o.armL.rotation.z=lerp(o.armL.rotation.z,-.85,k);
  if(atk<0){o.armR.rotation.x=lerp(o.armR.rotation.x,.55-sway,k);o.armR.rotation.z=lerp(o.armR.rotation.z,.85,k)}
}
function updatePlayerModel(dt){
  P.animT+=dt;PM.g.position.set(P.x,P.leap?(P.leap.y0!=null?P.leap.y0*(1-Math.pow(Math.min(1,P.leap.t/P.leap.dur),2)):Math.sin(Math.min(1,P.leap.t/P.leap.dur)*Math.PI)*P.leap.h):P.glide?P.glide.h:0,P.z);
  let fy=P.face;if(P.spinT>0)fy+=(1-P.spinT/.5)*TAU*1.2;
  PM.g.rotation.y=fy;
  if(P.atkAnim>=0){P.atkAnim+=dt/P.atkDur;if(P.atkAnim>=1)P.atkAnim=-1}
  const air=P.glide?Math.min(1,P.glide.h/GLIDE_H):P.leap&&P.leap.y0!=null?1:0;
  animHeroFor(PM,P.animT,P.glide||air?0:P.spdN,P.atkAnim,P.dashT>0,P.swing);
  PM.body.position.z=0;if(air>0)glidePose(PM,P.animT,air);
  if(PM.wau){const g=PM.wau.g,b=PM.body;g.rotation.x=air>0?b.rotation.x:0;g.position.y=air>0||PM.hid?b.position.y:0;g.position.z=air>0?b.position.z:0}
  if(PM.hid&&PM.g.visible&&Math.random()<dt*(balOn()?7:11))emit(P.x+rnd(-.7,.7),PM.g.position.y+rnd(.2,1.2),P.z+rnd(-.7,.7),0,rnd(-.8,-.2),0,rnd(.5,1),parseInt(HIDDEN[PM.hid].col.slice(1),16),0);
  PM.auraT=(PM.auraT||0)-dt;
  if(PM.auraT<=0){PM.auraT=.6;const w=SES.pf.items.find(i=>i.kind==='weapon'&&i.eq);PM.enh=w?(w.enh||0):0;omniApply(PM,myOmni())}
  if(PM.omni&&PM.omni.kind===2&&PM.g.visible&&Math.random()<dt*(balOn()?2:7)){const s=Math.random()<.5?-1:1,r=rnd(.5,2.2);emit(P.x+Math.cos(PM.g.rotation.y)*s*r,PM.g.position.y+rnd(1.2,2.6),P.z-Math.sin(PM.g.rotation.y)*s*r,0,rnd(-.5,.2),0,rnd(.5,.9),Math.random()<.5?0xffffff:0xffe08a,0)}
  if(PM.omni&&PM.omni.kind===1&&PM.g.visible&&Math.random()<dt*(balOn()?3:9)){const i=rnd(0,9)|0,a=PM.animT*.9+i*TAU/9;emit(P.x+Math.cos(a)*2.05,PM.g.position.y+1.1,P.z+Math.sin(a)*2.05,0,rnd(.3,.9),0,rnd(.4,.7),parseInt(OMNI_COL[i].slice(1),16),0)}
  if(PM.enh>=7&&!PM.hid&&PM.g.visible&&Math.random()<dt*(PM.enh>=15?46:PM.enh>=11?26:12)){
    const a=fy+.9+rnd(-.5,.5),hx=P.x+Math.sin(a)*.8,hz=P.z+Math.cos(a)*.8;
    emit(hx,PM.g.position.y+rnd(.6,2.3),hz,rnd(-.3,.3),rnd(.6,1.4),rnd(-.3,.3),rnd(.5,.9),PM.enh>=15?0xff5a7a:PM.enh>=11?0xffa040:0xffe27a,0);
  }
  PM.g.visible=!(P.dead||P.hidden||(P.iframes>0&&!PM.hid&&P.dashT<=0&&!P.leap&&!P.glide&&Math.floor(P.animT*30)%2===0)||(P.stealth>0&&Math.floor(P.animT*20)%4!==0));
}

/* ----- per-frame timers / regen ----- */
function tickPlayer(dt){
  const cdk=P.hb&&hbOn('my')?1.4:1;
  P.atkCd-=dt;P.comboT-=dt;if(P.comboT<=0)P.combo=0;P.iframes-=dt;P.spinT-=dt;if(P.qGuard>0)P.qGuard-=dt;if(P.golemGuard>0)P.golemGuard-=dt;if(P.dkGuard>0)P.dkGuard-=dt;P.dashCd-=dt*cdk;
  for(const k of['q','e','r','f'])P.cd[k]-=dt*cdk;
  for(const k in P.pot)P.pot[k]-=dt;
  if(P.buff){P.buff.t-=dt;if(P.buff.t<=0)P.buff=null}
  const rgn=S.regen+(P.hb&&hbOn('my')?.025:0);
  if(rgn>0&&P.hp<S.maxHp&&!P.dead){P.regenAcc+=S.maxHp*rgn*dt;if(P.regenAcc>=1){const v=Math.floor(P.regenAcc);P.regenAcc-=v;P.hp=Math.min(S.maxHp,P.hp+v)}}
  if(inTown(P.x,P.z)&&P.hp<S.maxHp&&!P.dead)P.hp=Math.min(S.maxHp,P.hp+S.maxHp*.12*dt);
  if(!P.dead&&P.hp<S.maxHp*.25){P.beatT=(P.beatT||0)-dt;if(P.beatT<=0){P.beatT=1.1;sfx('beat',.8)}}
  if(P.dead){P.deadT-=dt;if(P.deadT<=0)respawn()}
  else{tickSkills(dt);tickRecall(dt)}
}
const AUTO_LV=5;
const canAuto=()=>IS_TOUCH||SES.pf.level>=AUTO_LV;
function tryAttackInput(){
  if(P.dead||inTown(P.x,P.z)||UI.modal)return;
  const want=mouse.down||keys.j||mv.atk;
  let auto=null;
  // auto attack never breaks stealth; on desktop it unlocks at AUTO_LV
  if(save.auto&&!want&&canAuto()&&!(P.stealth>0)){const sy=CLS[S.atkCls].sty,reach=S.hidden?9:sy.t==='melee'?sy.range*S.rangeMul+1.2:13;auto=nearestMob(reach)}
  P.autoT=auto;
  if((want||auto)&&P.atkCd<=0&&P.dashT<=0&&P.spinT<=0&&!skBusy()){P.autoAim=auto;doAttack();P.autoAim=null}
}

/* ----- basic attack ----- */
function hitArc(f,range,arc,dmg,kb,opt){
  let n=0;
  for(const e of MOBS){
    if(e.dead||e.spawning)continue;const dx=e.x-P.x,dz=e.z-P.z,dist=Math.hypot(dx,dz);
    if(dist>range+e.r)continue;
    if(arc<TAU-.1){const a=Math.atan2(dx,dz);if(Math.abs(angDiff(f,a))>arc/2+Math.atan2(e.r,Math.max(dist,.1)))continue}
    dealMob(e,dmg,Object.assign({kx:dx/(dist||1),kz:dz/(dist||1),kb},opt||{}));n++;
  }
  return n;
}
function doAttack(){
  const ambush=P.stealth>0;
  const a=aimDir(),f=Math.atan2(a.x,a.z);P.face=f;
  P.atkCd=1/effAps();P.atkAnim=0;P.atkDur=Math.min(.34,P.atkCd*.92);
  const atk=effAtk()*(ambush?2.5:1);
  const sty=CLS[S.atkCls].sty;
  if(S.hidden)hidAttack(a,f,atk);
  else if(sty.t==='melee'){
    P.comboT=1.1;const step=P.combo%3;P.combo++;P.swing=-P.swing;
    const big=step===2,range=sty.range*S.rangeMul*(big?1.28:1),arc=big?sty.big:sty.arc,dmg=atk*(big?sty.bigMul:1);
    P.vx+=a.x*(big?sty.lunge*1.8:sty.lunge);P.vz+=a.z*(big?sty.lunge*1.8:sty.lunge);
    slashArc(P.x+a.x*.4,P.z+a.z*.4,f,range,arc,big?sty.bigCol:sty.col,.26);
    if(big)ringBurst(P.x+a.x*range*.7,.9,P.z+a.z*range*.7,10,sty.bigCol,5,.35);
    sfx('slash');cam.shake=Math.max(cam.shake,big?.35:.12);
    hitArc(f,range,arc,dmg,big?sty.kbBig:sty.kb,{big});gatherArc(f,range,arc,big?1.5:1);
    for(const b of EB){const dx=b.x-P.x,dz=b.z-P.z,d=Math.hypot(dx,dz);if(d<range+.5&&Math.abs(angDiff(f,Math.atan2(dx,dz)))<arc/2){b.life=0;burst(b.x,1,b.z,5,0xffffff,5,.3);sfx('hit')}}
    netFx('slash',{x:P.x+a.x*.4,z:P.z+a.z*.4,f,r:range,a:arc,c:big?1:0});
  }else if(sty.kind==='orb'){
    sfx('magic');const sx=P.x+a.x*1.2,sz=P.z+a.z*1.2;
    gatherLine(a.x,a.z,Math.min(11,sty.spd*sty.life*.4),1);
    spawnPB({kind:'orb',x:sx,z:sz,vx:a.x*sty.spd,vz:a.z*sty.spd,r:sty.r,dmg:atk,life:sty.life,pierce:0,splash:sty.splash*S.rangeMul,col:sty.col});
    burst(sx,1.6,sz,4,sty.col,3,.3,0);netFx('shot',{x:sx,z:sz,vx:a.x*sty.spd,vz:a.z*sty.spd,v:'orb',c:sty.col});
  }else{
    sfx('shot');const sp=rnd(-.03,.03),cs=Math.cos(sp),sn=Math.sin(sp),dx=a.x*cs-a.z*sn,dz=a.x*sn+a.z*cs;
    gatherLine(a.x,a.z,Math.min(14,sty.spd*sty.life),1);
    spawnPB({kind:'arrow',x:P.x+dx,z:P.z+dz,vx:dx*sty.spd,vz:dz*sty.spd,r:sty.r,dmg:atk,life:sty.life,pierce:sty.pierce+S.pierce,col:sty.col});
    netFx('shot',{x:P.x+dx,z:P.z+dz,vx:dx*sty.spd,vz:dz*sty.spd,v:'arrow',c:sty.col});
  }
  if(ambush){P.stealth=0;P.slow=1}
}

/* ----- skills ----- */
function trySkill(slot){
  if(!P||P.dead||UI.modal||P.spinT>0||(DU.on&&(DU.role!=='fight'||DU.ph!=='fight')))return;
  if(inTown(P.x,P.z)){if(slot==='q'&&!P.glide)qPress();return}   // town: no skills, but the double-tap glide works (no plunge)
  if(slot==='q'&&qPress())return;
  if(skBusy())return;
  const sk=skillOf(slot);if(!sk)return;
  if(sk.fx!=='r_q'&&P.cd[slot]>0)return;   // r_q has no lockout: its gauge only scales the power
  if(castSkill(sk,slot)===false)return;
  const cdk=sk.cd*(1-S.cdr)*(archSyn()?ARCH_SYN.cd:1)*(S.hidden?HID_CD:1);P.cd[slot]=cdk;P.cdMax[slot]=cdk;P.atkAnim=0;P.atkDur=.35;
}
function elemHit(e,el,atk){
  if(!el||!e||e.dead)return;
  if(el==='fire')burnMob(e,atk*.35);
  else if(el==='ice')freezeMob(e,1.5);
  else if(el==='thunder'){let q=null,bd=36;for(const m of MOBS){if(m===e||m.dead||m.spawning)continue;const d=d2(m.x,m.z,e.x,e.z);if(d<bd){bd=d;q=m}}if(q){boltFx(e.x,e.z,q.x,q.z,0xfff2a0);dealMob(q,atk*.5,{noKb:true,noProc:true})}else if(e.duel){boltFx(e.x,e.z+1,e.x,e.z,0xfff2a0);duelHitOut(e,atk*.5)}}
  else if(el==='dark'){if(G.t-(P.elHT||0)>.15){P.elHT=G.t;healP(Math.max(1,Math.round(S.maxHp*.012)))}}
}
function castSkill(sk,slot){
  if(sk.fx)return castFx(sk);
  const atk=effAtk(),a=aimDir(),col=sk.col||0xffffff,el=sk.el||null;
  if(el==='holy'){P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*.14);shockRing(P.x,P.z,3,col,.5)}
  if(el)ringBurst(P.x,.8,P.z,18,col,8,.5);
  if(sk.type==='nova'){
    const rg=sk.rad*S.rangeMul;
    if(sk.id==='w_q'){P.spinT=.5;P.iframes=Math.max(P.iframes,.35)}
    for(const e of MOBS){if(e.dead||e.spawning)continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);if(d<rg+e.r){
      dealMob(e,atk*sk.dmg,{kx:dx/(d||1),kz:dz/(d||1),kb:sk.kb||8});if(sk.freeze)freezeMob(e,sk.freeze);elemHit(e,el,atk)}}
    for(const b of EB)if(d2(b.x,b.z,P.x,P.z)<rg*rg)b.life=0;
    if(sk.heal){const h=Math.round(S.maxHp*sk.heal);healP(h)}
    slashArc(P.x,P.z,0,rg,TAU-.01,col,.4);shockRing(P.x,P.z,rg+1,col,.5);flashDisc(P.x,P.z,rg,col,.5);ringBurst(P.x,.8,P.z,30,col,11,.55);
    sfx(sk.freeze?'ice':'slash');sfx('boom');cam.shake=Math.max(cam.shake,.6);
    netFx('nova',{x:P.x,z:P.z,r:rg,c:col});
  }else if(sk.type==='buff'){
    P.buff={t:sk.dur,aps:sk.aps||0,atk:sk.atk||0,spd:sk.spd||0};
    if(sk.shield)P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*sk.shield);
    shockRing(P.x,P.z,4,col,.5);pillar(P.x,P.z,col,8,.6);burst(P.x,1,P.z,24,col,7,.7,3);sfx('level');dmgNum(P.x,3,P.z,sk.name,'info');
    netFx('nova',{x:P.x,z:P.z,r:4,c:col});
  }else if(sk.type==='ground'){
    const pt=aimPoint(sk.range||14),cnt=sk.count||1;
    for(let i=0;i<cnt;i++){
      const tx=pt.x+(cnt>1?rnd(-5,5):0),tz=pt.z+(cnt>1?rnd(-5,5):0),delay=(sk.delay||.8)+i*.22;
      addFx(i*.22,null,()=>{
        telegraph(tx,tz,sk.rad,sk.delay||.8,()=>{
          for(const e of MOBS){if(e.dead||e.spawning)continue;const d=Math.hypot(e.x-tx,e.z-tz);if(d<sk.rad+e.r){
            dealMob(e,atk*sk.dmg,{kx:(e.x-tx)/(d||1),kz:(e.z-tz)/(d||1),kb:9,noProc:false});
            if(sk.burn)burnMob(e,atk*.25*sk.burn);if(sk.freeze)freezeMob(e,sk.freeze);elemHit(e,el,atk)}}
          shockRing(tx,tz,sk.rad+1,col,.5);flashDisc(tx,tz,sk.rad,col,.5);burst(tx,1,tz,40,col,12,.8,10);pillar(tx,tz,col,18,.5);sfx('boom');cam.shake=Math.max(cam.shake,.7);
        },col);
        if(sk.id==='m_q'||sk.id==='meteormage_r'||sk.id==='pyromancer_r'){const m=glow(col,5,.9);m.position.set(tx,22,tz);entG.add(m);addFx(sk.delay||.8,k=>{m.position.y=22*(1-k*k);m.scale.set(5+k*3,5+k*3,1)},()=>entG.remove(m))}
      });
    }
    sfx('magic');netFx('ground',{x:pt.x,z:pt.z,r:sk.rad,c:col});
  }else if(sk.type==='rain'){
    const pt=aimPoint(sk.range||14),rad=sk.rad,dmg=atk*sk.dmg;
    const zone=new THREE.Mesh(shared.ringG,flatMat(col,.8));zone.rotation.x=-Math.PI/2;zone.position.set(pt.x,.12,pt.z);zone.scale.set(rad,rad,rad);entG.add(zone);
    let acc=0;
    addFx(sk.dur,(k,dt)=>{
      zone.material.opacity=.8*(1-k*.6);acc+=dt;
      while(acc>.11){acc-=.11;const a2=rnd(0,TAU),rr=Math.sqrt(Math.random())*rad,px=pt.x+Math.cos(a2)*rr,pz=pt.z+Math.sin(a2)*rr;
        for(let j=0;j<5;j++)emit(px,j*2.6,pz,0,-22,0,.28,col,0);burst(px,.3,pz,3,col,3,.25,6);
        for(const e of MOBS){if(e.dead||e.spawning)continue;if(d2(e.x,e.z,px,pz)<(1.7+e.r)*(1.7+e.r)){dealMob(e,dmg*.8,{noKb:true,crit:false,noProc:true});if(el&&Math.random()<.35)elemHit(e,el,atk)}}
        sfx('hit')}
    },()=>{entG.remove(zone);zone.material.dispose()});
    sfx('shot');netFx('ground',{x:pt.x,z:pt.z,r:rad,c:col});
  }else if(sk.type==='volley'){
    const base=Math.atan2(a.x,a.z),n=sk.n,sp=sk.speed||46;
    for(let i=0;i<n;i++){const an=base+(i-(n-1)/2)*(sk.spread||0);
      spawnPB({kind:'arrow',x:P.x+Math.sin(an),z:P.z+Math.cos(an),vx:Math.sin(an)*sp,vz:Math.cos(an)*sp,r:.5,dmg:atk*sk.dmg,life:.95,pierce:(sk.pierce||2)+S.pierce,col,freeze:sk.freeze,el,eatk:atk})}
    if(sk.back){P.dashDX=-a.x;P.dashDZ=-a.z;P.dashT=.14;P.dashSp=38;P.dashHit=null;P.iframes=Math.max(P.iframes,.25)}
    shockRing(P.x,P.z,3,col,.4);burst(P.x,1,P.z,14,col,6,.4,0);sfx('shot');sfx('dash');
    netFx('nova',{x:P.x,z:P.z,r:3,c:col});
  }else if(sk.type==='dash'){
    P.dashDX=a.x;P.dashDZ=a.z;P.dashT=sk.dist/46;P.dashSp=46;P.iframes=Math.max(P.iframes,sk.dist/46+.1);
    P.dashHit={dmg:atk*sk.dmg,col,done:new Set(),el,atk};sfx('dash');sfx('slash');cam.shake=Math.max(cam.shake,.3);
  }else if(sk.type==='chain'){
    let from={x:P.x,z:P.z},cur=nearestMob(18),used=new Set(),i=0;
    while(cur&&i<sk.n){used.add(cur);boltFx(from.x,from.z,cur.x,cur.z,col);dealMob(cur,atk*sk.dmg,{noKb:true,noProc:true});if(el&&el!=='thunder')elemHit(cur,el,atk);from=cur;i++;
      let best=null,bd=100;for(const q of MOBS){if(q.dead||q.spawning||used.has(q))continue;const d=d2(q.x,q.z,from.x,from.z);if(d<bd){bd=d;best=q}}cur=best}
    sfx('crit');sfx('boom');cam.shake=Math.max(cam.shake,.4);
  }
}
function dashStrike(dt){
  const h=P.dashHit;
  for(const e of MOBS){if(e.dead||e.spawning||h.done.has(e))continue;if(d2(e.x,e.z,P.x,P.z)<(e.r+1.6)*(e.r+1.6)){h.done.add(e);dealMob(e,h.dmg,{kx:P.dashDX,kz:P.dashDZ,kb:9});elemHit(e,h.el,h.atk);slashArc(P.x,P.z,Math.atan2(P.dashDX,P.dashDZ),3,2.4,h.col,.2)}}
  if(P.dashT<=0)P.dashHit=null;
}
function doDash(){
  if(!P||P.dead||P.dashCd>0||P.dashT>0||P.leap||P.glide||P.hidden||P.stunT>0||UI.modal)return;
  let dx=P.ix,dz=P.iz;if(!dx&&!dz){dx=Math.sin(P.face);dz=Math.cos(P.face)}
  const l=Math.hypot(dx,dz)||1;P.dashDX=dx/l;P.dashDZ=dz/l;P.dashT=.2;P.dashSp=38;P.dashHit=null;P.iframes=Math.max(P.iframes,.34);P.dashCd=2.8*(1-S.cdr);
  sfx('dash');burst(P.x,.6,P.z,10,0xffffff,4,.3,0);
}

/* ----- health ----- */
function healP(n){
  const before=P.hp;P.hp=Math.min(S.maxHp,P.hp+n);const g=Math.round(P.hp-before);
  if(g>0){dmgNum(P.x,3,P.z,'+'+g,'heal');burst(P.x,1.2,P.z,8,0x6bffb0,3,.6,-1,.8)}
}
function hurtPlayer(dmg,sx,sz,pure){   /* pure: ignores armor (meteor); buffs, shields and guard skills still apply */
  if(!P||P.dead||P.iframes>0||qAloft()||inTown(P.x,P.z))return false;
  dmg=Math.max(1,Math.round((pure?dmg:Math.max(dmg*(1-S.armor),S.hidden?0:dgHitFloor(dmg)))*(pure&&S.hidden?HID_PURE:1)*(P.pot.def>0?.7:1)*(P.hb?(hbOn('ar')?.72:hbOn('my')?.85:1):1)*(P.qGuard>0?.4:1)*(P.golemGuard>0?.7:1)*(P.hGuard>0?.4:1)*(P.dkGuard>0?.6:1)));
  if(P.shield>0){const ab=Math.min(P.shield,dmg);P.shield-=ab;dmg-=ab;burst(P.x,1.4,P.z,8,0x9fd0ff,5,.3,2)}
  P.iframes=S.hidden?.8:.5;P.lastHurt=G.t;
  if(P.recall>0)cancelRecall('피격으로 마을 귀환이 취소되었습니다');
  if(dmg>0){P.hp-=dmg;dmgNum(P.x,3,P.z,'-'+dmg,'hurt');sfx('hurt');vignette(1);cam.shake=Math.max(cam.shake,S.hidden?.2:.6);if(!S.hidden)hitStop(.06);
    if(sx!=null&&!S.hidden){const dx=P.x-sx,dz=P.z-sz,l=Math.hypot(dx,dz)||1;P.vx+=dx/l*6;P.vz+=dz/l*6;camKick(dx,dz,.3)}}
  burst(P.x,1.2,P.z,10,0xff5a6a,6,.4,10);
  if(P.hp<=0){if(P.reviveT>G.t){P.reviveT=0;P.hp=Math.round(S.maxHp*.3);P.iframes=2;dmgNum(P.x,3.6,P.z,'구원','info');pillar(P.x,P.z,0xfff4c2,16,.8);sfx('level')}else playerDown()}
  return true;
}
function playerDown(){
  P.hb=null;P.hs=null;P.recall=0;P.dkGuard=0;P.dead=true;P.hp=0;P.deadT=3.5;P.shield=0;P.buff=null;skReset();sfx('lose');UI.deadOn(true);
}
function respawn(){
  if(DG.on){dgRespawn();return}
  P.dead=false;P.x=SPAWN.x+rnd(-2,2);P.z=SPAWN.z;P.vx=P.vz=0;P.hp=S.maxHp;P.iframes=1.5;UI.deadOn(false);
  clearMobsNearTown();cam.x=P.x;cam.z=P.z;
}

/* ----- town recall (C): 3 s channel, cancelled by moving, dashing, skills, damage or death ----- */
const RECALL_T=3;
function startRecall(){
  if(!P||P.dead||UI.modal)return;
  if(DU.on){duelQuit();return}
  if(P.recall>0){cancelRecall('마을 귀환을 취소했습니다');return}
  if(inTown(P.x,P.z)){UI.toast('이미 마을입니다');return}
  if(P.dashT>0||skBusy())return;
  P.recall=RECALL_T;P.recallN=Math.ceil(RECALL_T);P.recallFx=0;sfx('click');
  UI.toast('마을로 귀환 중… '+P.recallN+' (움직이면 취소)',1100);
}
function cancelRecall(msg){P.recall=0;if(msg)UI.toast(msg)}
function tickRecall(dt){
  if(!(P.recall>0))return;
  if(P.ix||P.iz||P.dashT>0||skBusy()){cancelRecall('마을 귀환이 취소되었습니다');return}
  P.recall-=dt;P.recallFx-=dt;
  if(P.recallFx<=0){P.recallFx=.18;burst(P.x,.3,P.z,4,0x8fe8ff,2.5,.7,-1,.8)}
  const n=Math.ceil(Math.max(0,P.recall));if(n!==P.recallN&&n>0){P.recallN=n;UI.toast('마을로 귀환 중… '+n+' (움직이면 취소)',1100)}
  if(P.recall<=0){
    P.recall=0;ringBurst(P.x,.2,P.z,18,0x8fe8ff,9,.5);pillar(P.x,P.z,0x8fe8ff,14,.5);
    if(DG.on){dgLeave('귀환했습니다 (보상 없음)');return}
    P.x=SPAWN.x+rnd(-2,2);P.z=SPAWN.z;P.vx=P.vz=0;P.iframes=Math.max(P.iframes,1);
    clearMobsNearTown();cam.x=P.x;cam.z=P.z;
    ringBurst(P.x,.2,P.z,18,0x8fe8ff,9,.5);pillar(P.x,P.z,0x8fe8ff,14,.5);sfx('level');UI.toast('마을로 돌아왔습니다');
  }
}

/* ----- teleport scroll: pick a spot on the world map ----- */
const tpBlocked=()=>!P||P.dead?'지금은 사용할 수 없습니다':DU.on?'결투 중에는 사용할 수 없습니다':DG.on?'던전에서는 사용할 수 없습니다':'';
function openTeleport(){
  const why=tpBlocked();if(why){UI.toast(why);return}
  UI.page('텔레포트',()=>{setTimeout(tpDrawMap,0);return '<div style="text-align:center"><div style="margin-bottom:6px;color:#c79bff"><b>이동할 곳을 누르세요</b><div class="dim"><span style="color:#ff5ad1">● 나</span> · <span style="color:#6bff8a">● 파티원</span> · <span style="color:#5ee7ff">● 다른 플레이어</span></div></div><canvas id="bigmap" width="720" height="720" style="width:100%;max-width:min(560px,62vh);border-radius:10px;border:1px solid #c79bff;cursor:crosshair"></canvas></div><div id="mapl" style="display:none"></div>'});
}
/* other players standing in the world (not in a dungeon or duel arena) */
const tpPlayers=()=>Object.values(NET.peers).filter(p=>p.got&&!p.du&&Math.hypot(p.tx,p.tz)<=WORLD_R)
  .map(p=>({name:p.name,x:p.tx,z:p.tz,party:!!(NET.party&&NET.party.members.includes(p.name))}));
function tpMarks(c){
  const g=c.getContext&&c.getContext('2d');if(!g)return;
  const W=c.width,sc=(W/2-14)/WORLD_R;
  const mark=(x,z,t,col,r,fs)=>{const mx=W/2+x*sc,mz=W/2+z*sc;
    g.fillStyle=col;g.beginPath();g.arc(mx,mz,r,0,TAU);g.fill();g.strokeStyle='#fff';g.lineWidth=3;g.stroke();
    g.font='bold '+fs+'px sans-serif';g.textAlign='center';g.lineWidth=5;g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(t,mx,mz-r-7);g.fillStyle=col;g.fillText(t,mx,mz-r-7)};
  for(const p of tpPlayers())mark(p.x,p.z,p.name,p.party?'#6bff8a':'#5ee7ff',10,20);
  mark(P.x,P.z,'나','#ff5ad1',13,26);
}
let tpT=0;
function tpDrawMap(){
  const c=$('bigmap');if(!c||UI.modal!=='텔레포트')return;drawBigMap();tpMarks(c);
  clearTimeout(tpT);tpT=setTimeout(tpDrawMap,500);
  c.onclick=ev=>{const r=c.getBoundingClientRect(),W=c.width,sc=(W/2-14)/WORLD_R;
    teleportTo(((ev.clientX-r.left)*W/r.width-W/2)/sc,((ev.clientY-r.top)*W/r.height-W/2)/sc)};
}
/* nearest free spot inside the world */
function tpSpot(x,z){
  const l=Math.hypot(x,z),max=WORLD_R-6;if(l>max){x*=max/l;z*=max/l}
  for(let i=0;i<80;i++){const a=i*2.4,d=i*.6,nx=x+Math.cos(a)*d,nz=z+Math.sin(a)*d;if(Math.hypot(nx,nz)<=max&&!blocked(nx,nz,1.2))return{x:nx,z:nz}}
  return{x:SPAWN.x,z:SPAWN.z};
}
let tpBusy=false;
async function teleportTo(x,z){
  if(tpBusy||!isFinite(x)||!isFinite(z))return false;
  const why=tpBlocked();if(why){UI.toast(why);return false}
  tpBusy=true;
  try{
    await API.call('usePotion','tp');
    UI.close();
    if(tpBlocked())return false;
    const q=tpSpot(x,z);cancelRecall();pillar(P.x,P.z,0xc79bff,14,.5);
    P.x=q.x;P.z=q.z;P.vx=P.vz=0;P.iframes=Math.max(P.iframes,2);cam.x=P.x;cam.z=P.z;
    ringBurst(P.x,.2,P.z,18,0xc79bff,9,.5);pillar(P.x,P.z,0xc79bff,14,.5);sfx('level');UI.toast('순간이동했습니다');
    UI.refreshHud();return true;
  }catch(e){UI.toast(errKo(e.message));return false}
  finally{tpBusy=false}
}

/* ----- potions ----- */
function usePotionKey(base){
  if(!P||P.dead)return;
  if(DU.on){UI.toast('결투 중에는 물약을 쓸 수 없습니다');return}const pd=POTIONS[base];if(!pd)return;
  const it=SES.pf.items.find(i=>i.kind==='potion'&&i.base===base&&!i.listed&&i.qty>0);
  if(!it){UI.toast(pd.name+' 없음');return}
  if(pd.kind==='tp'){openTeleport();return}
  if(pd.kind==='restore'){openRestore();return}
  if(pd.kind==='wrestore'){openWeaponRestore();return}
  if(pd.kind==='erestore'){openEnchRestore();return}
  if(pd.kind==='hp'){if(P.pot.hp>0)return;if(P.hp>=S.maxHp){UI.toast('체력이 가득 찼습니다');return}P.pot.hp=2.5;healP(Math.round(S.maxHp*pd.pct));sfx('level')}
  else{const k=base;if(P.pot[k]>0){UI.toast('이미 효과가 적용 중입니다');return}P.pot[k]=30;dmgNum(P.x,3,P.z,pd.name,'info');sfx('card');burst(P.x,1,P.z,16,0xffffff,5,.5,2)}
  it.qty--;if(it.qty<=0)SES.pf.items=SES.pf.items.filter(i=>i!==it);
  UI.refreshHud();
  API.call('usePotion',base).then(()=>{UI.refreshHud();UI.afterProfile&&UI.afterProfile()}).catch(e=>{UI.toast(errKo(e.message));API.resume(SES.name,SES.token).then(()=>UI.refreshHud()).catch(()=>{})});
}
