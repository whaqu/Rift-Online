/* ---------------- shared fx + projectiles + damage ---------------- */
const MOBS=[],PB=[],EB=[];
const glowMats={};
function glowS(hex,size,op){
  const k=hex+'_'+op;if(!glowMats[k])glowMats[k]=new THREE.SpriteMaterial({map:glowTex,color:hex,transparent:true,opacity:op==null?.8:op,blending:THREE.AdditiveBlending,depthWrite:false});
  const s=new THREE.Sprite(glowMats[k]);s.scale.set(size,size,1);return s;
}
const GEO={orb:new THREE.SphereGeometry(.5,10,8),ebul:new THREE.SphereGeometry(.38,8,6),arrow:new THREE.BoxGeometry(.1,.1,1.5),head:new THREE.ConeGeometry(.2,.5,5),line:new THREE.BoxGeometry(1,1,1)};
GEO.head.rotateX(Math.PI/2);

function telegraph(x,z,r,dur,cb,hex){
  hex=hex||0xff3a4a;
  const mk=(op,geo)=>{const m=new THREE.Mesh(geo,flatMat(hex,op));m.rotation.x=-Math.PI/2;m.position.set(x,.1,z);return m};
  const disc=mk(.2,shared.discG),fill=mk(.32,shared.discG),ring=mk(.9,shared.ringG);disc.scale.set(r,r,r);ring.scale.set(r,r,r);fill.scale.set(.01,.01,.01);ring.position.y=.12;fill.position.y=.11;
  entG.add(disc);entG.add(fill);entG.add(ring);sfx('tele');
  addFx(dur,k=>{const s=Math.max(.01,r*k);fill.scale.set(s,s,s);ring.material.opacity=.55+.4*Math.sin(k*28)},()=>{entG.remove(disc);entG.remove(fill);entG.remove(ring);disc.material.dispose();fill.material.dispose();ring.material.dispose();if(cb)cb()});
}
function boltFx(x1,z1,x2,z2,hex){
  const pts=[{x:x1,z:z1}];const n=4;
  for(let i=1;i<n;i++){const k=i/n;pts.push({x:lerp(x1,x2,k)+rnd(-.9,.9),z:lerp(z1,z2,k)+rnd(-.9,.9)})}pts.push({x:x2,z:z2});
  const ms=[];
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||.1;const m=new THREE.Mesh(GEO.line,flatMat(hex||0xfff2a0,.95));m.position.set((a.x+b.x)/2,1.3,(a.z+b.z)/2);m.rotation.y=Math.atan2(dx,dz);m.scale.set(.16,.16,l);entG.add(m);ms.push(m)}
  addFx(.18,k=>{ms.forEach(m=>m.material.opacity=.95*(1-k))},()=>ms.forEach(m=>{entG.remove(m);m.material.dispose()}));
  burst(x2,1.2,z2,6,hex||0xfff2a0,5,.3,4);
}
function explodeAt(x,z,r,dmg,hex){
  shockRing(x,z,r+.8,hex,.4);flashDisc(x,z,r,hex,.35);burst(x,1,z,22,hex,9,.5,8);sfx('boom');cam.shake=Math.max(cam.shake,.3);
  for(const e of MOBS){if(e.dead||e.spawning)continue;const dx=e.x-x,dz=e.z-z,d=Math.hypot(dx,dz);if(d<r+e.r)dealMob(e,dmg,{noProc:true,kx:dx/(d||1),kz:dz/(d||1),kb:8})}
}

/* ---------------- damage to monsters ---------------- */
function freezeMob(m,t){if(m.ghost){netSendHit(m,0,{fz:t});return}m.freeze=Math.max(m.freeze||0,m.elite?t*.5:t)}
function burnMob(m,dps){if(m.ghost){netSendHit(m,0,{bn:dps});return}m.burnT=3;m.burnD=Math.max(m.burnD||0,dps)}
function dealMob(m,base,o){
  if(m.dead)return;o=o||{};
  const crit=o.crit!==undefined?o.crit:Math.random()<S.crit;
  const d=Math.max(1,Math.round(base*(crit?S.critDmg:1)*(.92+Math.random()*.16)));
  dmgNum(m.x,m.r*1.5+1.2,m.z,fmtN(d),crit?'crit':'');
  const mat=m.def&&m.def.mat||'flesh',heavy=!!o.big||base>S.atk*2.2,kxn=o.kx||0,kzn=o.kz||0,ic=crit?0xffd24a:0xfff4e0;
  if(crit){sfx('crit');sfx('hit_'+mat,.8);sfx('sparkle')}else sfx('hit_'+mat);
  if(heavy)sfx('bigHit',.8);
  burst(m.x,1.2,m.z,crit?12:4,crit?0xffd24a:0xffffff,5,.35,10);m.flash=.09;m.pop=1;
  impactFlash(m.x-(kxn?kxn/(Math.hypot(kxn,kzn)||1)*m.r*.6:0),1.3,m.z-(kzn?kzn/(Math.hypot(kxn,kzn)||1)*m.r*.6:0),ic,crit?3.4:heavy?3:2.1,crit?.2:.15);
  if(kxn||kzn){hitSparks(m.x,1.3,m.z,kxn,kzn,ic,crit?9:heavy?7:4,crit?11:8);camKick(kxn,kzn,crit?.2:heavy?.26:.07)}
  if(crit){shockRing(m.x,m.z,2.1,0xffd24a,.24);burst(m.x,1.5,m.z,6,0xfff3b0,9,.3,4,.2);cam.shake=Math.max(cam.shake,.28);hitStop(.04)}else cam.shake=Math.max(cam.shake,heavy?.2:.06);
  if(heavy)hitStop(.055);
  const kk={kx:o.kx||0,kz:o.kz||0,kb:o.noKb?0:(o.kb||0)};
  if(m.ghost){m.hp=Math.max(1,m.hp-d);netSendHit(m,d,kk)}
  else applyMobDmg(m,d,kk,SES.name);
  if(S.vamp&&!o.noProc){P.vampAcc+=d*S.vamp;if(P.vampAcc>=1){const v=Math.floor(P.vampAcc);P.vampAcc-=v;P.hp=Math.min(S.maxHp,P.hp+v)}}
  if(o.noProc)return;
  if(S.burnLv>0)burnMob(m,effAtk()*.25*S.burnLv);
  if(S.chainP>0&&Math.random()<S.chainP){
    let n=0,px=m.x,pz=m.z;const used=new Set([m]);
    for(const q of MOBS){if(n>=2)break;if(q.dead||q.spawning||used.has(q))continue;if(d2(q.x,q.z,m.x,m.z)<81){used.add(q);boltFx(px,pz,q.x,q.z);dealMob(q,base*.6,{noProc:true,noKb:true});px=q.x;pz=q.z;n++}}
  }
  if(S.explP>0&&Math.random()<S.explP)explodeAt(m.x,m.z,3.2,base*.5,0xff9a3a);
}

/* ---------------- player projectiles ---------------- */
function spawnPB(o){
  const col=o.col||(o.kind==='orb'?0x5ee7ff:0x6bffb0);const g=grp(o.x,1.3,o.z);
  if(o.kind==='orb'){mesh(GEO.orb,EM(col,1.6),0,0,0,g,false);g.add(glowS(col,2.8,.85))}
  else{mesh(GEO.arrow,M(0xe8ffe0,{emissive:col,emissiveIntensity:.8}),0,0,0,g,false);mesh(GEO.head,EM(col,1),0,0,.8,g,false);g.add(glowS(col,1.6,.6))}
  g.rotation.y=Math.atan2(o.vx,o.vz);entG.add(g);o.m=g;o.hit=[];o.t=0;o.col=col;PB.push(o);
}
function orbBoom(b,primary){
  const rad=b.splash;
  for(const e of MOBS){if(e.dead||e.spawning)continue;const dx=e.x-b.x,dz=e.z-b.z,d=Math.hypot(dx,dz);
    if(e===primary)dealMob(e,b.dmg,{kx:b.vx,kz:b.vz,kb:3});
    else if(d<rad+e.r)dealMob(e,b.dmg*.7,{kx:dx,kz:dz,kb:5,noProc:true})}
  const bc=b.col||0x5ee7ff;shockRing(b.x,b.z,rad,bc,.3);flashDisc(b.x,b.z,rad*.8,bc,.25);burst(b.x,1.2,b.z,14,bc,7,.45,6);sfx('boom');
}
function updatePB(dt){
  for(let i=PB.length-1;i>=0;i--){
    const b=PB[i];b.life-=dt;b.t+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.m.position.x=b.x;b.m.position.z=b.z;
    if(b.kind==='orb'){emit(b.x,1.3,b.z,rnd(-.5,.5),rnd(-.5,.5),rnd(-.5,.5),.35,b.col,0);b.m.scale.setScalar(1+Math.sin(b.t*30)*.1)}
    else if(Math.random()<.5)emit(b.x,1.3,b.z,0,0,0,.2,b.col,0);
    let dead=false;
    for(const e of MOBS){
      if(e.dead||e.spawning||b.hit.indexOf(e)>=0)continue;
      const rr=e.r+b.r;if(d2(e.x,e.z,b.x,b.z)<rr*rr){
        if(b.kind==='orb'){orbBoom(b,e);dead=true;break}
        dealMob(e,b.dmg,{kx:b.vx,kz:b.vz,kb:3});if(b.freeze)freezeMob(e,b.freeze);if(b.el)elemHit(e,b.el,b.eatk);b.hit.push(e);b.pierce--;if(b.pierce<=0){dead=true;break}
      }
    }
    if(!dead&&b.life<=0){if(b.kind==='orb')orbBoom(b,null);dead=true}
    if(dead){entG.remove(b.m);PB.splice(i,1)}
  }
}
function clearProjectiles(){for(const b of PB)entG.remove(b.m);PB.length=0;for(const b of EB)entG.remove(b.m);EB.length=0}

/* ---------------- enemy events (run on every client for the local player) ---------------- */
function spawnEB(x,z,ang,spd,dmg,col,life,big){
  col=col||0xff4d6d;sfxAt('ebolt',x,z,30);const g=grp(x,1.2,z);
  const s=mesh(GEO.ebul,EM(col,1.6),0,0,0,g,false);if(big)s.scale.setScalar(1.5);g.add(glowS(col,big?3:2,.75));entG.add(g);
  EB.push({x,z,vx:Math.sin(ang)*spd,vz:Math.cos(ang)*spd,r:big?.7:.42,dmg,life:life||4,m:g,col});
}
function runEnemyEvent(ev){
  if(ev.t==='b')spawnEB(ev.x,ev.z,ev.a,ev.s,ev.d,ev.c,ev.l,ev.big);
  else if(ev.t==='s'){
    slashArc(ev.x,ev.z,ev.f,ev.r,ev.a,0xff6a6a,.22);sfx('slash');
    const dx=P.x-ev.x,dz=P.z-ev.z,d=Math.hypot(dx,dz);
    if(d<ev.r+.5&&Math.abs(angDiff(ev.f,Math.atan2(dx,dz)))<ev.a/2+.2)hurtPlayer(ev.d,ev.x,ev.z);
  }else if(ev.t==='v'){sfxAt(ev.n||'growl',ev.x,ev.z);
  }else if(ev.t==='f'){burst(ev.x,1.2,ev.z,16,ev.c||0xff3dd0,6,.5,2);shockRing(ev.x,ev.z,2,ev.c||0xff3dd0,.3);if(ev.n)sfxAt(ev.n,ev.x,ev.z);
  }else if(ev.t==='x'){
    telegraph(ev.x,ev.z,ev.r,ev.w,()=>{
      shockRing(ev.x,ev.z,ev.r+.8,ev.c||0xff7a3a,.4);flashDisc(ev.x,ev.z,ev.r,ev.c||0xff5a1a,.35);burst(ev.x,1,ev.z,26,ev.c||0xff8a3a,10,.6,8);sfx('boom');cam.shake=Math.max(cam.shake,.4);
      if(d2(ev.x,ev.z,P.x,P.z)<(ev.r+P.r)*(ev.r+P.r))hurtPlayer(ev.d,ev.x,ev.z);
    },ev.c||0xff3a4a);
  }
}
function updateEB(dt){
  for(let i=EB.length-1;i>=0;i--){
    const b=EB[i];b.life-=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.m.position.x=b.x;b.m.position.z=b.z;
    let dead=b.life<=0;
    if(!dead&&d2(b.x,b.z,P.x,P.z)<(b.r+P.r)*(b.r+P.r)){if(hurtPlayer(b.dmg,b.x,b.z)){dead=true;burst(b.x,1.2,b.z,8,b.col,5,.3,4)}}
    if(!dead&&blocked(b.x,b.z,.2)){dead=true;burst(b.x,1.2,b.z,5,b.col,4,.25,4)}
    if(dead){entG.remove(b.m);EB.splice(i,1)}else if(Math.random()<.25)emit(b.x,1.2,b.z,0,0,0,.25,b.col,0);
  }
}

/* ---------------- kill rewards (server-verified) ---------------- */
const KB={};let KBn=0,KBt=0,claiming=false;
function registerKill(m){
  const k=m.zid+'|'+m.ml+'|'+(m.elite?1:0)+'|'+(m.golden?1:0);KB[k]=(KB[k]||0)+1;KBn++;KBt=Math.max(KBt,0);comboHit(m);
  if(m.golden){UI.feedText('황금 슬라임 처치! 골드가 쏟아집니다','#ffd24a');shockRing(m.x,m.z,5,0xffd24a,.6);for(let i=0;i<40;i++)emit(m.x,1,m.z,rnd(-7,7),rnd(5,13),rnd(-7,7),1.1,0xffd24a,22);sfx('level')}
  const gold=Math.floor((2+m.ml*1.6)*(m.elite?5:1)),xp=(6+m.ml*4)*(m.elite?6:1);
  dmgNum(m.x,m.r*1.5+2.2,m.z,'+'+fmtN(xp)+' XP','xp');
  const n=Math.min(8,Math.ceil(gold/6));for(let i=0;i<n;i++)emit(m.x,1,m.z,rnd(-4,4),rnd(4,9),rnd(-4,4),.8,0xffd24a,22);
  if(KBn>=12)flushKills();
}
async function flushKills(){
  if(claiming||!KBn||!SES.token)return;
  const arr=[];for(const k in KB){const p=k.split('|');arr.push({z:+p[0],ml:+p[1],e:p[2]==='1',g:p[3]==='1',n:KB[k]})}
  for(const k in KB)delete KB[k];KBn=0;claiming=true;KBt=0;
  const before=SES.pf.level;
  try{
    const r=await API.call('claim',arr);
    if(r.gold)dmgNum(P.x,2.6,P.z,'+'+fmtN(r.gold)+' G','gold');
    for(const d of r.drops||[])UI.feed(d);
    if(SES.pf.level>before)onLevelUp();
    UI.refreshHud();UI.afterProfile&&UI.afterProfile();
  }catch(e){UI.toast(errKo(e.message))}
  claiming=false;
}
function onLevelUp(){
  derive();P.hp=S.maxHp;sfx('level');dmgNum(P.x,3.8,P.z,'LEVEL UP','info');shockRing(P.x,P.z,5,0xffe27a,.6);shockRing(P.x,P.z,9,0xfff3b0,.9);pillar(P.x,P.z,0xffe27a,12,.8);burst(P.x,1,P.z,40,0xffe27a,9,1,2);flashDisc(P.x,P.z,4,0xffe27a,.5);cam.shake=Math.max(cam.shake,.3);
  UI.feedText('레벨 '+SES.pf.level+' 달성','#ffe27a');netSys('lv',SES.pf.level);
  UI.refreshHud();if(UI.refreshTouch)UI.refreshTouch();if(SES.pf.level===MAXLV)UI.toast('만렙 달성! 궁극기 해금: '+ULT[SES.pf.cls].name+' (F)');setTimeout(()=>{if(P&&!P.dead&&!UI.modal&&perkOf(SES.pf).pts>0)openPerks()},900);
}
