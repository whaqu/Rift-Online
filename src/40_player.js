/* ---------------- player: stats, movement, attacks, skills ---------------- */
const G={mode:'boot',t:0,ts:1,last:performance.now()};
let P=null,PM=null,S=null;
const inTown=(x,z)=>x*x+z*z<19*19;

function derive(){
  const pf=SES.pf,c=CLS[pf.cls],job=JOBS[pf.job]||JOBS[pf.cls],m=job.m,L=pf.level;
  const w=pf.items.find(i=>i.kind==='weapon'&&i.eq);
  const wa=w?weaponAtk(w.base,w.enh):0;const en={};(w?w.ench:[]).forEach(e=>en[e.k]=e.l);
  const burnLv=(m.burn||0)+(en.burn||0);
  S={
    cls:pf.cls,job:pf.job,level:L,
    maxHp:Math.round((c.hp+L*c.hpLv)*(m.hp||1)),
    atk:(c.atk+L*c.atkLv+wa)*(m.atk||1),wa,
    aps:c.aps*(m.aps||1)*(1+(en.aspd||0)*.06),
    spd:c.spd*(m.spd||1),
    crit:Math.min(.8,c.crit+(m.crit||0)+(en.crit||0)*.05),critDmg:1.6,
    armor:1-(1-(m.armor||0))*(1-(en.armor||0)*.04),
    vamp:(m.vamp||0)+(en.vamp||0)*.03,burnLv,
    chainP:Math.min(.6,(m.chain||0)*.10+(en.chain||0)*.12),explP:(en.explode||0)*.10,
    pierce:(m.pierce||0)+(en.pierce||0),rangeMul:1+(en.pierce||0)*.1,
    regen:m.regen||0,berserk:!!m.berserk,weapon:w||null,en
  };
  return S;
}
function newPlayer(){
  derive();
  P={x:SPAWN.x,z:SPAWN.z,vx:0,vz:0,face:Math.PI,r:.6,ix:0,iz:0,hp:S.maxHp,hpShow:100,
    atkCd:0,atkAnim:-1,atkDur:.3,combo:0,comboT:0,swing:1,dashT:0,dashCd:0,dashDX:0,dashDZ:1,iframes:0,
    cd:{q:0,e:0,r:0},cdMax:{q:1,e:1,r:1},buff:null,pot:{hp:0,spd:0,atk:0,def:0},shield:0,
    spinT:0,dead:false,deadT:0,animT:0,spdN:0,regenAcc:0,vampAcc:0,castT:0};
  buildPlayerModel();
}
function buildPlayerModel(){
  if(PM)entG.remove(PM.g);
  PM=makeHeroFor(SES.pf.cls,SES.pf.job,CLS[SES.pf.cls].col);entG.add(PM.g);
}
function skillOf(slot){
  const pf=SES.pf,c=CLS[pf.cls],j=JOBS[pf.job];
  if(slot==='q')return c.q;if(slot==='e')return c.e;
  return j&&j.tier>0?j.r:null;
}
const effAtk=()=>S.atk*(P.buff&&P.buff.atk?P.buff.atk:1)*(P.pot.atk>0?1.3:1);
const effAps=()=>S.aps*((S.berserk&&P.hp<S.maxHp*.5)?1.4:1)*(P.buff&&P.buff.aps?P.buff.aps:1);
const effSpd=()=>S.spd*(P.buff&&P.buff.spd?P.buff.spd:1)*(P.pot.spd>0?1.4:1)*(P.spinT>0?.6:1);

/* ----- targeting ----- */
function nearestMob(range,from){
  let best=null,bd=range*range;const fx=from?from.x:P.x,fz=from?from.z:P.z;
  for(const m of MOBS){if(m.dead||m.spawning)continue;const d=d2(m.x,m.z,fx,fz);if(d<bd){bd=d;best=m}}
  return best;
}
function aimDir(){
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
    if(Math.hypot(mouse.gx-P.x,mouse.gz-P.z)>.4)tf=Math.atan2(mouse.gx-P.x,mouse.gz-P.z);
  }
  P.face=lerpAng(P.face,tf,1-Math.exp(-dt*22));
}
function movePlayer(dt){
  let ix=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),iz=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  if(mv.on){ix=mv.x;iz=mv.z}
  const il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il}P.ix=ix;P.iz=iz;
  const sp=effSpd();
  if(P.dashT>0){
    P.dashT-=dt;P.vx=P.dashDX*(P.dashSp||38);P.vz=P.dashDZ*(P.dashSp||38);
    emit(P.x,1,P.z,rnd(-1,1),rnd(0,1.5),rnd(-1,1),.35,JOB_COL[SES.pf.job]||CLS[S.cls].col,0);
    if(P.dashHit)dashStrike(dt);
  }else{const k=1-Math.exp(-dt*(il>0?16:11));P.vx=lerp(P.vx,ix*sp,k);P.vz=lerp(P.vz,iz*sp,k)}
  P.x+=P.vx*dt;P.z+=P.vz*dt;pushOut(P,P.r);
  P.spdN=Math.min(1.2,Math.hypot(P.vx,P.vz)/Math.max(1,S.spd));
}
function updatePlayerModel(dt){
  P.animT+=dt;PM.g.position.set(P.x,0,P.z);
  let fy=P.face;if(P.spinT>0)fy+=(1-P.spinT/.5)*TAU*1.2;
  PM.g.rotation.y=fy;
  if(P.atkAnim>=0){P.atkAnim+=dt/P.atkDur;if(P.atkAnim>=1)P.atkAnim=-1}
  animHeroFor(PM,P.animT,P.spdN,P.atkAnim,P.dashT>0,P.swing);
  PM.auraT=(PM.auraT||0)-dt;
  if(PM.auraT<=0){PM.auraT=.6;const w=SES.pf.items.find(i=>i.kind==='weapon'&&i.eq);PM.enh=w?(w.enh||0):0}
  if(PM.enh>=7&&PM.g.visible&&Math.random()<dt*(PM.enh>=15?46:PM.enh>=11?26:12)){
    const a=fy+.9+rnd(-.5,.5),hx=P.x+Math.sin(a)*.8,hz=P.z+Math.cos(a)*.8;
    emit(hx,rnd(.6,2.3),hz,rnd(-.3,.3),rnd(.6,1.4),rnd(-.3,.3),rnd(.5,.9),PM.enh>=15?0xff5a7a:PM.enh>=11?0xffa040:0xffe27a,0);
  }
  PM.g.visible=!(P.dead||(P.iframes>0&&P.dashT<=0&&Math.floor(P.animT*30)%2===0));
}

/* ----- per-frame timers / regen ----- */
function tickPlayer(dt){
  P.atkCd-=dt;P.comboT-=dt;if(P.comboT<=0)P.combo=0;P.iframes-=dt;P.spinT-=dt;P.dashCd-=dt;
  for(const k of['q','e','r'])P.cd[k]-=dt;
  for(const k in P.pot)P.pot[k]-=dt;
  if(P.buff){P.buff.t-=dt;if(P.buff.t<=0)P.buff=null}
  if(S.regen>0&&P.hp<S.maxHp&&!P.dead){P.regenAcc+=S.maxHp*S.regen*dt;if(P.regenAcc>=1){const v=Math.floor(P.regenAcc);P.regenAcc-=v;P.hp=Math.min(S.maxHp,P.hp+v)}}
  if(inTown(P.x,P.z)&&P.hp<S.maxHp&&!P.dead)P.hp=Math.min(S.maxHp,P.hp+S.maxHp*.12*dt);
  if(P.dead){P.deadT-=dt;if(P.deadT<=0)respawn()}
}
function tryAttackInput(){
  if(P.dead||inTown(P.x,P.z)||UI.modal)return;
  const want=mouse.down||keys.j||mv.atk;
  let auto=false;
  if(save.auto&&!want&&IS_TOUCH){const reach=S.cls==='warrior'?CLS.warrior.range*S.rangeMul+1.2:13;const m=nearestMob(reach);auto=!!m}
  if((want||auto)&&P.atkCd<=0&&P.dashT<=0&&P.spinT<=0)doAttack();
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
  const a=aimDir(),f=Math.atan2(a.x,a.z);P.face=f;
  P.atkCd=1/effAps();P.atkAnim=0;P.atkDur=Math.min(.34,P.atkCd*.92);
  const atk=effAtk();
  if(S.cls==='warrior'){
    P.comboT=1.1;const step=P.combo%3;P.combo++;P.swing=-P.swing;
    const big=step===2,range=CLS.warrior.range*S.rangeMul*(big?1.28:1),arc=big?2.8:2.15,dmg=atk*(big?1.7:1);
    P.vx+=a.x*(big?9:5);P.vz+=a.z*(big?9:5);
    slashArc(P.x+a.x*.4,P.z+a.z*.4,f,range,arc,big?0xffd24a:0xbfe4ff,.26);
    if(big)ringBurst(P.x+a.x*range*.7,.9,P.z+a.z*range*.7,10,0xffd24a,5,.35);
    sfx('slash');cam.shake=Math.max(cam.shake,big?.35:.12);
    hitArc(f,range,arc,dmg,big?11:6);
    for(const b of EB){const dx=b.x-P.x,dz=b.z-P.z,d=Math.hypot(dx,dz);if(d<range+.5&&Math.abs(angDiff(f,Math.atan2(dx,dz)))<arc/2){b.life=0;burst(b.x,1,b.z,5,0xffffff,5,.3);sfx('hit')}}
    netFx('slash',{x:P.x+a.x*.4,z:P.z+a.z*.4,f,r:range,a:arc,c:big?1:0});
  }else if(S.cls==='mage'){
    sfx('magic');const sx=P.x+a.x*1.2,sz=P.z+a.z*1.2;
    spawnPB({kind:'orb',x:sx,z:sz,vx:a.x*25,vz:a.z*25,r:.55,dmg:atk,life:1.3,pierce:0,splash:2.3*S.rangeMul});
    burst(sx,1.6,sz,4,0x5ee7ff,3,.3,0);netFx('shot',{x:sx,z:sz,vx:a.x*25,vz:a.z*25,v:'orb'});
  }else{
    sfx('shot');const sp=rnd(-.03,.03),cs=Math.cos(sp),sn=Math.sin(sp),dx=a.x*cs-a.z*sn,dz=a.x*sn+a.z*cs;
    spawnPB({kind:'arrow',x:P.x+dx,z:P.z+dz,vx:dx*46,vz:dz*46,r:.4,dmg:atk,life:.85,pierce:1+S.pierce});
    netFx('shot',{x:P.x+dx,z:P.z+dz,vx:dx*46,vz:dz*46,v:'arrow'});
  }
}

/* ----- skills ----- */
function trySkill(slot){
  if(!P||P.dead||UI.modal||inTown(P.x,P.z)||P.cd[slot]>0||P.spinT>0)return;
  const sk=skillOf(slot);if(!sk)return;
  castSkill(sk,slot);
  P.cd[slot]=sk.cd;P.cdMax[slot]=sk.cd;P.atkAnim=0;P.atkDur=.35;
}
function castSkill(sk,slot){
  const atk=effAtk(),a=aimDir(),col=sk.col||0xffffff;
  if(sk.type==='nova'){
    const rg=sk.rad*S.rangeMul;
    if(sk.id==='w_q'){P.spinT=.5;P.iframes=Math.max(P.iframes,.35)}
    for(const e of MOBS){if(e.dead||e.spawning)continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);if(d<rg+e.r){
      dealMob(e,atk*sk.dmg,{kx:dx/(d||1),kz:dz/(d||1),kb:sk.kb||8});if(sk.freeze)freezeMob(e,sk.freeze)}}
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
            if(sk.burn)burnMob(e,atk*.25*sk.burn);if(sk.freeze)freezeMob(e,sk.freeze)}}
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
        for(const e of MOBS){if(e.dead||e.spawning)continue;if(d2(e.x,e.z,px,pz)<(1.7+e.r)*(1.7+e.r))dealMob(e,dmg*.8,{noKb:true,crit:false,noProc:true})}
        sfx('hit')}
    },()=>{entG.remove(zone);zone.material.dispose()});
    sfx('shot');netFx('ground',{x:pt.x,z:pt.z,r:rad,c:col});
  }else if(sk.type==='volley'){
    const base=Math.atan2(a.x,a.z),n=sk.n,sp=sk.speed||46;
    for(let i=0;i<n;i++){const an=base+(i-(n-1)/2)*(sk.spread||0);
      spawnPB({kind:'arrow',x:P.x+Math.sin(an),z:P.z+Math.cos(an),vx:Math.sin(an)*sp,vz:Math.cos(an)*sp,r:.5,dmg:atk*sk.dmg,life:.95,pierce:(sk.pierce||2)+S.pierce,col,freeze:sk.freeze})}
    if(sk.back){P.dashDX=-a.x;P.dashDZ=-a.z;P.dashT=.14;P.dashSp=38;P.dashHit=null;P.iframes=Math.max(P.iframes,.25)}
    shockRing(P.x,P.z,3,col,.4);burst(P.x,1,P.z,14,col,6,.4,0);sfx('shot');sfx('dash');
    netFx('nova',{x:P.x,z:P.z,r:3,c:col});
  }else if(sk.type==='dash'){
    P.dashDX=a.x;P.dashDZ=a.z;P.dashT=sk.dist/46;P.dashSp=46;P.iframes=Math.max(P.iframes,sk.dist/46+.1);
    P.dashHit={dmg:atk*sk.dmg,col,done:new Set()};sfx('dash');sfx('slash');cam.shake=Math.max(cam.shake,.3);
  }else if(sk.type==='chain'){
    let from={x:P.x,z:P.z},cur=nearestMob(18),used=new Set(),i=0;
    while(cur&&i<sk.n){used.add(cur);boltFx(from.x,from.z,cur.x,cur.z,col);dealMob(cur,atk*sk.dmg,{noKb:true,noProc:true});from=cur;i++;
      let best=null,bd=100;for(const q of MOBS){if(q.dead||q.spawning||used.has(q))continue;const d=d2(q.x,q.z,from.x,from.z);if(d<bd){bd=d;best=q}}cur=best}
    sfx('crit');sfx('boom');cam.shake=Math.max(cam.shake,.4);
  }
}
function dashStrike(dt){
  const h=P.dashHit;
  for(const e of MOBS){if(e.dead||e.spawning||h.done.has(e))continue;if(d2(e.x,e.z,P.x,P.z)<(e.r+1.6)*(e.r+1.6)){h.done.add(e);dealMob(e,h.dmg,{kx:P.dashDX,kz:P.dashDZ,kb:9});slashArc(P.x,P.z,Math.atan2(P.dashDX,P.dashDZ),3,2.4,h.col,.2)}}
  if(P.dashT<=0)P.dashHit=null;
}
function doDash(){
  if(!P||P.dead||P.dashCd>0||P.dashT>0||UI.modal)return;
  let dx=P.ix,dz=P.iz;if(!dx&&!dz){dx=Math.sin(P.face);dz=Math.cos(P.face)}
  const l=Math.hypot(dx,dz)||1;P.dashDX=dx/l;P.dashDZ=dz/l;P.dashT=.2;P.dashSp=38;P.dashHit=null;P.iframes=Math.max(P.iframes,.34);P.dashCd=2.8;
  sfx('dash');burst(P.x,.6,P.z,10,0xffffff,4,.3,0);
}

/* ----- health ----- */
function healP(n){
  const before=P.hp;P.hp=Math.min(S.maxHp,P.hp+n);const g=Math.round(P.hp-before);
  if(g>0){dmgNum(P.x,3,P.z,'+'+g,'heal');burst(P.x,1.2,P.z,8,0x6bffb0,3,.6,-1,.8)}
}
function hurtPlayer(dmg,sx,sz){
  if(!P||P.dead||P.iframes>0||inTown(P.x,P.z))return false;
  dmg=Math.max(1,Math.round(dmg*(1-S.armor)*(P.pot.def>0?.7:1)));
  if(P.shield>0){const ab=Math.min(P.shield,dmg);P.shield-=ab;dmg-=ab;burst(P.x,1.4,P.z,8,0x9fd0ff,5,.3,2)}
  P.iframes=.5;
  if(dmg>0){P.hp-=dmg;dmgNum(P.x,3,P.z,'-'+dmg,'hurt');sfx('hurt');vignette(1);cam.shake=Math.max(cam.shake,.6);
    if(sx!=null){const dx=P.x-sx,dz=P.z-sz,l=Math.hypot(dx,dz)||1;P.vx+=dx/l*6;P.vz+=dz/l*6}}
  burst(P.x,1.2,P.z,10,0xff5a6a,6,.4,10);
  if(P.hp<=0)playerDown();
  return true;
}
function playerDown(){
  P.dead=true;P.hp=0;P.deadT=3.5;P.shield=0;P.buff=null;sfx('lose');UI.deadOn(true);
}
function respawn(){
  P.dead=false;P.x=SPAWN.x+rnd(-2,2);P.z=SPAWN.z;P.vx=P.vz=0;P.hp=S.maxHp;P.iframes=1.5;UI.deadOn(false);
  clearMobsNearTown();cam.x=P.x;cam.z=P.z;
}

/* ----- potions ----- */
function usePotionKey(base){
  if(!P||P.dead)return;const pd=POTIONS[base];if(!pd)return;
  const it=SES.pf.items.find(i=>i.kind==='potion'&&i.base===base&&!i.listed&&i.qty>0);
  if(!it){UI.toast(pd.name+' 없음');return}
  if(pd.kind==='hp'){if(P.pot.hp>0)return;if(P.hp>=S.maxHp){UI.toast('체력이 가득 찼습니다');return}P.pot.hp=2.5;healP(Math.round(S.maxHp*pd.pct));sfx('level')}
  else{const k=base;if(P.pot[k]>0){UI.toast('이미 효과가 적용 중입니다');return}P.pot[k]=30;dmgNum(P.x,3,P.z,pd.name,'info');sfx('card');burst(P.x,1,P.z,16,0xffffff,5,.5,2)}
  it.qty--;if(it.qty<=0)SES.pf.items=SES.pf.items.filter(i=>i!==it);
  UI.refreshHud();
  API.call('usePotion',base).then(()=>{UI.refreshHud();UI.afterProfile&&UI.afterProfile()}).catch(e=>{UI.toast(errKo(e.message));API.resume(SES.name,SES.token).then(()=>UI.refreshHud()).catch(()=>{})});
}
