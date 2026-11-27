/* ---------------- dungeons: portals in the world -> instanced arena (x≈1000): 3 waves + boss, contribution ranking, rune/weapon rewards ---------------- */
const DGP=[];   // world portals {kind:'portal',dg,name,x,z,g,ring,disc,label}
const DGH={el:null,t:0,last:''};

function dgPortalPos(def){
  let a=def.pa,r=def.pr;
  for(let i=0;i<60;i++){
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(!blocked(x,z,5))return{x,z};
    a+=.11;r+=(i%2?1:-1)*(1+i*.15);
  }
  return{x:Math.cos(def.pa)*def.pr,z:Math.sin(def.pa)*def.pr};
}
function dgBuildPortals(){
  try{
    for(const p of DGP){if(p.g&&p.g.parent)p.g.parent.remove(p.g);if(p.label&&p.label.remove)p.label.remove()}
    DGP.length=0;
    for(const id of DGK){
      const def=DGDEF[id],pos=dgPortalPos(def),g=grp(pos.x,0,pos.z,worldG);g.rotation.y=Math.atan2(-pos.x,-pos.z);
      const rock=M(def.col===0x56a044?0x6e6a5a:def.col===0x585a86?0x4e4a6e:0x56606e),dark=M(0x1a1a22);
      // cave mouth: a horseshoe of boulders around a dark opening, glowing rim + inner glow
      BX(8,.3,4,M(0x5a5648),0,.1,.6,g);
      const rocks=[[-3.6,0,1.9,3.4],[-3,0,-.2,3.8],[-1.7,0,-1.2,4.6],[0,0,-1.8,5.2],[1.7,0,-1.2,4.6],[3,0,-.2,3.8],[3.6,0,1.9,3.4],[-2.2,3.6,-1,2.4],[0,4.6,-1.4,2.8],[2.2,3.6,-1,2.4]];
      for(const[x,y,z,sc]of rocks){const r=mesh(new THREE.DodecahedronGeometry(sc*.55,0),rock,x,y+sc*.42,z,g);r.scale.set(1,.9+((x*7|0)%3)*.12,1);r.rotation.y=x}
      const hole=mesh(new THREE.CircleGeometry(1.9,20),dark,0,1.9,.15,g,false);hole.scale.set(1,1.15,1);
      const ring=mesh(new THREE.TorusGeometry(2.05,.16,6,24),EM(def.ring,1.7),0,1.9,.2,g,false);ring.scale.set(1,1.15,1);
      const disc=mesh(new THREE.CircleGeometry(1.7,20),new THREE.MeshBasicMaterial({color:def.ring,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}),0,1.9,.3,g,false);disc.scale.set(1,1.15,1);
      for(const sx of[-1,1]){const t=glow(def.ring,2.2,.6);t.position.set(sx*2.5,2.6,1.2);g.add(t)}
      const gl=glow(def.ring,5,.35);gl.position.set(0,1.9,.8);g.add(gl);
      DGP.push({kind:'portal',dg:id,name:def.name+' 입장',x:pos.x,z:pos.z,g,ring,disc,label:makeLabel(def.name,'st')});
    }
  }catch(e){console.error('portals',e)}
}

/* ---------- arena ---------- */
function dgBuildArena(){
  if(DG.arena)return DG.arena;
  const g=new THREE.Group();g.position.set(DG.cx,0,DG.cz);g.visible=false;scene.add(g);
  const gm=new THREE.MeshStandardMaterial({color:0x56a044,roughness:.95,flatShading:true}),pm=new THREE.MeshStandardMaterial({color:0x6a6a78,roughness:.8,flatShading:true}),
    rm=new THREE.MeshBasicMaterial({color:0x9aff7a,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide});
  const fl=new THREE.Mesh(new THREE.CircleGeometry(DG.R+10,48),gm);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
  for(let i=0;i<18;i++){const a=i/18*TAU,x=Math.cos(a)*(DG.R+.4),z=Math.sin(a)*(DG.R+.4);const p=new THREE.Mesh(new THREE.BoxGeometry(2.2,6,2.2),pm);p.position.set(x,3,z);p.castShadow=true;g.add(p)}
  for(const rr of[.62,.3]){const r=new THREE.Mesh(new THREE.RingGeometry(DG.R*rr,DG.R*rr+.6,64),rm);r.rotation.x=-Math.PI/2;r.position.y=.06;g.add(r)}
  const rocks=[[14,6],[-15,8],[6,-16],[-7,-14],[18,-9],[-19,-8],[0,16],[-3,6]];
  for(const[x,z]of rocks){const p=new THREE.Mesh(new THREE.CylinderGeometry(1.4,2,2.8,7),pm);p.position.set(x,1.4,z);p.castShadow=true;p.receiveShadow=true;g.add(p);addObst(DG.cx+x,DG.cz+z,2.1)}
  // common: central dais + braziers between the pillars
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(4.6,5.2,.35,24),pm);dais.position.y=.17;dais.receiveShadow=true;g.add(dais);
  for(let i=0;i<9;i++){const a=(i+.5)/9*TAU,x=Math.cos(a)*(DG.R-2.2),z=Math.sin(a)*(DG.R-2.2);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(.5,.35,1.2,6),pm);b.position.set(x,.6,z);g.add(b);
    const f=glow(0xffa23a,3.2,.7);f.position.set(x,1.7,z);g.add(f)}
  const th={},mk=(n)=>{const t=new THREE.Group();t.visible=false;g.add(t);th[n]=t;return t};
  const rr=(a,b)=>a+Math.random()*(b-a),ring=(r0,r1)=>{const a=rr(0,TAU),r=rr(r0,r1);return[Math.cos(a)*r,Math.sin(a)*r]};
  {const t=mk('meadow'),tr=new THREE.MeshStandardMaterial({color:0x7a5434,roughness:.95,flatShading:true}),lf=[0x4c9a46,0x5aae4e,0x68b856].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.9,flatShading:true})),
    fl=[0xff7aa8,0xffe27a,0xffffff,0xb07aff].map(c=>new THREE.MeshBasicMaterial({color:c}));
    for(let i=0;i<18;i++){const[x,z]=ring(DG.R+3,DG.R+11),s=rr(.9,1.5);const k=new THREE.Mesh(new THREE.CylinderGeometry(.35*s,.5*s,3*s,6),tr);k.position.set(x,1.5*s,z);t.add(k);
      const c=new THREE.Mesh(new THREE.IcosahedronGeometry(2*s,0),lf[i%3]);c.position.set(x,3.6*s,z);c.castShadow=true;t.add(c)}
    for(let i=0;i<40;i++){const[x,z]=ring(6,DG.R-3);const f=new THREE.Mesh(new THREE.SphereGeometry(.2,5,4),fl[i%4]);f.position.set(x,.25,z);t.add(f)}
    for(let i=0;i<10;i++){const[x,z]=ring(10,DG.R-4);const m=new THREE.Mesh(new THREE.SphereGeometry(.6,6,4,0,TAU,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xd8503a,flatShading:true}));m.position.set(x,.1,z);t.add(m)}}
  {const t=mk('crystal'),cm=[0x6ee7ff,0xb07aff,0x7a9aff].map(c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.9,roughness:.3,flatShading:true}));
    for(let i=0;i<26;i++){const[x,z]=ring(i<14?DG.R-8:DG.R+2,i<14?DG.R-3:DG.R+9),h=rr(2.5,7);const c=new THREE.Mesh(new THREE.ConeGeometry(rr(.5,1.1),h,5),cm[i%3]);c.position.set(x,h/2,z);c.rotation.z=rr(-.25,.25);c.rotation.x=rr(-.25,.25);t.add(c)}
    for(let i=0;i<4;i++){const[x,z]=ring(12,DG.R-6),gl=glow([0x6ee7ff,0xb07aff][i%2],6,.45);gl.position.set(x,1.6,z);t.add(gl)}}
  {const t=mk('storm'),sm=new THREE.MeshStandardMaterial({color:0x3a4252,roughness:.8,flatShading:true}),tip=new THREE.MeshBasicMaterial({color:0xffe27a});
    for(let i=0;i<9;i++){const a=i/9*TAU+.2,x=Math.cos(a)*(DG.R-5),z=Math.sin(a)*(DG.R-5);const sp=new THREE.Mesh(new THREE.ConeGeometry(.9,9,5),sm);sp.position.set(x,4.5,z);t.add(sp);
      const o=new THREE.Mesh(new THREE.SphereGeometry(.45,6,5),tip);o.position.set(x,9.4,z);t.add(o);const gl=glow(0xffe27a,4,.6);gl.position.set(x,9.4,z);t.add(gl)}
    for(let i=0;i<12;i++){const[x,z]=ring(DG.R+2,DG.R+14),s=rr(1.2,3);const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),sm);r.position.set(x,rr(5,12),z);r.rotation.set(rr(0,3),rr(0,3),0);t.add(r)}}
  DG.arena={g,gm,pm,rm,th};return DG.arena;
}

/* ---------- boss ---------- */
function dgBossModel(){
  const bk=DG.mkBk;
  if(bk==='crystal')return makeGolem();
  if(bk==='storm')return makeStormhawk();
  return makeQuad({kind:'boar',body:0x8a3a2a,dk:0x4a2018,eye:0xffd24a,tusk:1,snout:0xc79a82});
}
function dgBossSetup(m,bk){
  const d=DGDEF[bk];m.bk=bk;m.bn=d.bn;m.at=bk==='meadow'?'boar':bk==='crystal'?'golem':'stormhawk';
  m.scale=d.sc*(bk==='crystal'?.7:1);m.r=d.r;m.spd=d.spd;m.fly=bk==='storm'?2.4:0;m.dg=true;m.zid=d.zid;
  if(!m.ghost){m.dmg=mobDmg(m.ml)*d.dmgM;m.state='chase';m.cd=2;m.pi=0}
}
const DG_TEL={slam:.9,rush:.8,nova:.7,summon:.9,quake:.9,barrage:.7,bolts:.8};
function dgSpawnAdd(type,x,z,elite){
  const def=DGDEF[DG.id],m=makeMobObj(mobSeq++,type,x,z,def.ml+rndi(-1,1),!!elite,false,false);m.dg=true;m.zid=def.zid;return m;
}
function dgBossAI(m,dt,dx,dz,d){
  const bk=m.bk,def=DGDEF[bk],enr=m.hp<m.maxHp*.35,en=enr?1.2:1,cdm=enr?.7:1;
  if(m.pi===undefined){m.pi=0;m.state='chase';m.cd=2}
  if(m.state==='chase'){
    faceM(m,dx,dz,dt,6);
    const keep=bk==='storm'?10:3.4;
    if(d>keep+1.5){stepM(m,dx,dz,m.spd,dt);m.moving=true}else if(bk==='storm'&&d<keep-2){stepM(m,-dx,-dz,m.spd*.8,dt);m.moving=true}
    if(m.cd<=0){
      const pat=def.pat[m.pi++%def.pat.length],tel=DG_TEL[pat];m.pat=pat;m.state='wind';m.warn=true;m.st=tel;m.cdx=dx;m.cdz=dz;
      emitEvent({t:'v',x:m.x,z:m.z,n:'growl'});
      const T=targets().filter(t=>!t.pull).slice(0,4);
      if(pat==='slam')emitEvent({t:'x',x:m.x,z:m.z,r:6.5,w:tel,d:m.dmg*1.5*en,c:def.ring});
      else if(pat==='barrage')for(const t of T)for(let i=0;i<3;i++)emitEvent({t:'x',x:t.x+(i?rnd(-5,5):0),z:t.z+(i?rnd(-5,5):0),r:2.8,w:tel+.4+i*.15,d:m.dmg*1.1*en,c:def.ring});
      else if(pat==='bolts')for(const t of T)for(let i=0;i<5;i++)emitEvent({t:'x',x:t.x+rnd(-7,7),z:t.z+rnd(-7,7),r:2.4,w:.9+i*.14,d:m.dmg*1.1*en,c:def.ring});
      else if(pat==='quake'){const n=Math.hypot(dx,dz)||1;for(let i=1;i<=5;i++)emitEvent({t:'x',x:m.x+dx/n*i*4,z:m.z+dz/n*i*4,r:3,w:.7+i*.18,d:m.dmg*1.2*en,c:def.ring})}
    }
  }else if(m.state==='wind'){
    m.st-=dt;faceM(m,dx,dz,dt,8);if(m.pat==='rush'){m.cdx=dx;m.cdz=dz}
    if(m.st<=0){
      m.warn=false;
      if(m.pat==='rush'){m.state='rush';m.st=.75}
      else{
        if(m.pat==='nova'){const n=enr?24:16,o=m.age;for(let i=0;i<n;i++){const a=i/n*TAU+o;emitEvent({t:'b',x:m.x+Math.sin(a),z:m.z+Math.cos(a),a,s:8.5,d:m.dmg*.7*en,c:def.ring,l:3})}}
        else if(m.pat==='summon'){let c=0;for(const q of MOBS)if(q.dg&&!q.dead&&q!==m)c++;if(c<8){const k=enr?3:2;for(let i=0;i<k;i++){const a=rnd(0,TAU);dgSpawnAdd(pick(def.adds),clampArena(m.x+Math.cos(a)*5,'x'),clampArena(m.z+Math.sin(a)*5,'z'))}emitEvent({t:'f',x:m.x,z:m.z,c:def.ring,n:'whoosh'})}}
        m.state='rec';m.st=.9;m.cd=rnd(1.5,2.3)*cdm;
      }
    }
  }else if(m.state==='rush'){
    m.st-=dt;stepM(m,m.cdx,m.cdz,m.spd*4.6,dt);m.moving=true;faceM(m,m.cdx,m.cdz,dt,20);
    if(m.st<=0){m.state='rec';m.st=1.1;m.cd=rnd(1.5,2.3)*cdm}
  }else{m.st-=dt;if(m.st<=0)m.state='chase'}
}
function clampArena(v,ax){const c=ax==='x'?DG.cx:DG.cz,o=v-c;return c+Math.max(-DG.R*.8,Math.min(DG.R*.8,o))}

/* ---------- entering / leaving ---------- */
function dgEnter(id){
  const def=DGDEF[id],A=dgBuildArena();
  DG.on=true;DG.id=id;DG.zone=Object.assign({},ZONES[def.zid],{name:def.name,lo:def.need,hi:def.need+12});
  DG.ph='intro';DG.pt=3.5;DG.t=0;DG.wave=0;DG.dmg={};DG.deaths=0;DG.boss=null;DG.res=null;DG.begin=Date.now();DG.alive=0;DG.bh=100;DG.lastSt=0;
  DG.leader=NET.party?NET.party.leader:SES.name;
  A.gm.color.setHex(def.col);A.pm.color.setHex((def.col>>1)&0x7f7f7f);A.rm.color.setHex(def.ring);for(const k in A.th)A.th[k].visible=(k===id);A.g.visible=true;worldG.visible=false;
  resetMobs();
  P.recall=0;P.x=DG.cx+rnd(-2,2);P.z=DG.cz+DG.R-13;P.vx=P.vz=0;P.iframes=2;P.hp=S.maxHp;P.dead=false;cam.x=P.x;cam.z=P.z;
  const mini=$('mini');if(mini&&mini.style)mini.style.display='none';
  UI.zone=-1;dgHud(true);sfx('level');UI.toast(def.name+'에 입장했습니다',2200);
  shockRing(P.x,P.z,5,def.ring,.6);
}
function dgLeave(msg){
  if(!DG.on)return;
  const id=DG.id;DG.on=false;DG.ph='idle';DG.boss=null;
  if(DG.arena)DG.arena.g.visible=false;worldG.visible=true;
  resetMobs();
  const pt=DGP.find(p=>p.dg===id);
  if(pt){const l=Math.hypot(pt.x,pt.z)||1;P.x=pt.x-pt.x/l*4.5;P.z=pt.z-pt.z/l*4.5}else{P.x=SPAWN.x;P.z=SPAWN.z}
  P.vx=P.vz=0;P.dead=false;P.hp=S.maxHp;P.iframes=1.5;UI.deadOn(false);cam.x=P.x;cam.z=P.z;
  const mini=$('mini');if(mini&&mini.style)mini.style.display='';
  UI.zone=-1;dgHud(false);
  if(NET.on&&NET.party&&isAuth()){NET.party.dgId=null;netSend('dg',{k:'out',id,msg:msg||''})}
  if(msg)UI.toast(msg,2600);
}
function dgFail(msg){
  if(!DG.on)return;
  if(NET.on&&NET.party&&isAuth()&&DG.ph!=='clear')netSend('dg',{k:'out',id:DG.id,msg:msg||''});
  DG.ph='fail';dgLeave(msg||'던전에서 퇴장했습니다');
}
function dgRespawn(){
  if(DG.ph!=='clear'){
    DG.deaths++;
    if(DG.deaths>DG.maxDeaths){P.dead=false;UI.deadOn(false);dgFail('부활 횟수를 모두 사용했습니다');return}
    UI.toast('부활했습니다 (남은 부활 '+(DG.maxDeaths-DG.deaths)+'회)',2000);
  }
  P.dead=false;P.x=DG.cx+rnd(-3,3);P.z=DG.cz+DG.R-13;P.vx=P.vz=0;P.hp=S.maxHp;P.iframes=2.5;UI.deadOn(false);cam.x=P.x;cam.z=P.z;
}

/* ---------- portal interaction ---------- */
async function openPortal(p){
  const def=DGDEF[p.dg];if(!def||DG.on)return;
  if(SES.pf.level<def.need){UI.toast('Lv.'+def.need+' 이상부터 입장할 수 있습니다');return}
  const party=NET.party&&NET.party.members.length>1;
  if(party&&!isAuth()){
    if(NET.party.dgId!==p.dg){UI.toast('파티장이 먼저 입장해야 합니다');return}
    if(await UI.confirm(def.name+'에 합류할까요?'))dgJoin(p.dg);
    return;
  }
  const txt=def.name+'\n입장 Lv.'+def.need+' 이상 · 웨이브 '+def.waves.length+'회 + 보스 · 제한 10분\n피해 기여도 순위에 따라 보상이 달라집니다.\n(1위: 지역 룬 또는 지역 무기 · 2~5위: 골드/물약/룬 확률)\n사망은 3회까지 부활합니다.'+(party?'\n파티원에게 입장 알림이 전송됩니다.':'');
  if(!(await UI.confirm(txt)))return;
  dgStart(p.dg);
}
async function dgStart(id){
  try{await API.call('dgBegin',id)}catch(e){UI.toast(errKo(e.message));return}
  flushKills();flushGather();
  dgEnter(id);
  if(NET.on&&NET.party&&NET.party.members.length>1&&isAuth()){NET.party.dgId=id;netSend('dg',{k:'in',id,from:SES.name,to:NET.party.members.filter(n=>n!==SES.name)})}
}
async function dgJoin(id){
  if(DG.on)return;
  try{await API.call('dgBegin',id)}catch(e){UI.toast(errKo(e.message));return}
  flushKills();flushGather();dgEnter(id);
}

/* ---------- authority: waves & boss ---------- */
function dgPlayers(){return allPos().filter(q=>q.x>600)}
function dgSpawnWave(){
  const def=DGDEF[DG.id],A=dgPlayers(),pc=Math.max(1,A.length),n=Math.min(24,Math.round(def.waves[DG.wave]*(1+.5*(pc-1))));
  UI.toast('웨이브 '+(DG.wave+1)+' / '+def.waves.length,1800);sfx('boom');
  for(let i=0;i<n;i++){
    let x=DG.cx,z=DG.cz;
    for(let k=0;k<8;k++){const a=rnd(0,TAU),r=rnd(16,27);x=DG.cx+Math.cos(a)*r;z=DG.cz+Math.sin(a)*r;if(!blocked(x,z,1.2)&&A.every(q=>d2(x,z,q.x,q.z)>10*10))break}
    dgSpawnAdd(pick(def.mobs),x,z,DG.wave===def.waves.length-1&&i===0&&pc>1);
  }
}
function dgSpawnBoss(){
  const def=DGDEF[DG.id],pc=Math.max(1,dgPlayers().length);
  DG.mkBk=DG.id;const m=makeMobObj(mobSeq++,'dgboss',DG.cx,DG.cz-6,def.ml,false,false,false);
  dgBossSetup(m,DG.id);m.maxHp=m.hp=Math.round(mobHp(def.ml)*def.hpM*(1+.9*(pc-1)));
  DG.boss=m;UI.toast(def.bn+' 출현!',2400);sfx('boom');cam.shake=Math.max(cam.shake,.8);
  shockRing(m.x,m.z,10,def.ring,.8);
}
function dgTick(dt,A){
  if(!DG.on||DG.ph==='clear'||DG.ph==='fail')return;
  const def=DGDEF[DG.id];DG.t+=dt;
  if(DG.t>600){dgFail('제한 시간이 초과되었습니다');return}
  let alive=0;for(const m of MOBS)if(m.dg&&!m.dead&&!m.ghost&&m.type!=='dgboss')alive++;DG.alive=alive;
  if(DG.ph==='intro'){DG.pt-=dt;if(DG.pt<=0){DG.ph='wave';dgSpawnWave()}}
  else if(DG.ph==='wave'){if(alive===0){DG.wave++;if(DG.wave>=def.waves.length){DG.ph='bossIntro';DG.pt=3;UI.toast('보스가 다가옵니다…',2400)}else{DG.ph='gap';DG.pt=2.5}}}
  else if(DG.ph==='gap'){DG.pt-=dt;if(DG.pt<=0){DG.ph='wave';dgSpawnWave()}}
  else if(DG.ph==='bossIntro'){DG.pt-=dt;if(DG.pt<=0){DG.ph='boss';dgSpawnBoss()}}
  else if(DG.ph==='boss'){if(DG.boss&&DG.boss.dead)dgClear()}
  DG.lastSt+=dt;
  if(DG.lastSt>.5){DG.lastSt=0;if(NET.on&&NET.party&&NET.party.members.length>1){const b=DG.boss;netSend('dg',{k:'st',id:DG.id,ph:DG.ph,w:DG.wave,al:alive,t:Math.round(DG.t),bh:b&&!b.dead?Math.round(b.hp/b.maxHp*100):0})}}
}
function dgStandings(){
  const names=new Set(Object.keys(DG.dmg));
  if(NET.party)for(const n of NET.party.members){const p=NET.peers[n];if(n===SES.name||(p&&p.got&&p.x>600))names.add(n)}
  names.add(SES.name);
  return[...names].map(n=>[n,Math.round(DG.dmg[n]||0)]).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));
}
function dgClear(){
  DG.ph='clear';const st=dgStandings();
  if(NET.on&&NET.party&&NET.party.members.length>1)netSend('dg',{k:'end',id:DG.id,st});
  dgOnEnd(st);
}

/* ---------- results & rewards (every client in the dungeon) ---------- */
async function dgOnEnd(st){
  DG.ph='clear';DG.st=st;sfx('level');cam.shake=Math.max(cam.shake,.5);
  const idx=st.findIndex(s=>s[0]===SES.name),rank=Math.min(5,idx<0?st.length+1:idx+1),id=DG.id;
  // server needs the run to be at least 45 s old
  const wait=Math.max(0,46500-(Date.now()-DG.begin));if(wait>0)await new Promise(r=>setTimeout(r,wait));
  if(!DG.on||DG.id!==id)return;
  let rw=null,err=null;
  try{const r=await API.call('dgEnd',id,rank);rw=r.rewards}catch(e){err=e.message}
  DG.res={st,rank,rw,err};
  try{derive();UI.refreshHud()}catch(e){}
  dgResults();
}
function dgRwText(r){
  if(r.t==='gold')return '골드 +'+fmtN(r.n);
  if(r.t==='weapon')return '무기 · '+wName(r.base);
  if(r.t==='potion')return (POTIONS[r.base]?POTIONS[r.base].name:r.base)+' x'+r.n;
  if(r.t==='rune')return (RUNES[r.base]?RUNES[r.base].name:r.base)+(r.base==='all'?'':' '+(RUNE_G[r.g]||''))+' x'+r.n;
  return '';
}
function dgResults(){
  const R=DG.res;if(!R||!DG.on)return;
  const tot=R.st.reduce((s,x)=>s+x[1],0)||1;
  UI.page('던전 클리어 — '+DGDEF[DG.id].name,()=>{
    let h='<div class="card" style="margin-bottom:8px"><div class="dim" style="margin-bottom:6px">기여도 순위 (보스·몬스터 피해량)</div>'+R.st.map((s,i)=>'<div class="row sp"><span>'+(i+1)+'. '+esc(s[0])+(s[0]===SES.name?' <b style="color:#ffd24a">(나)</b>':'')+'</span><span>'+fmtN(s[1])+' · '+Math.round(s[1]/tot*100)+'%</span></div>').join('')+'</div>';
    if(R.err)h+='<div class="card"><div class="red">'+esc(errKo(R.err))+'</div></div>';
    else h+='<div class="card"><div class="dim" style="margin-bottom:6px">내 보상 ('+R.rank+'위)</div>'+(R.rw||[]).map(r=>'<div>'+esc(dgRwText(r))+'</div>').join('')+'</div>';
    h+='<div class="row" style="margin-top:10px;justify-content:center"><button class="btn" data-a="dgout">마을 입구로 나가기</button></div><div class="dim" style="text-align:center;margin-top:6px">30초 후 자동으로 나갑니다</div>';
    return h;
  });
  clearTimeout(DG.autoT);DG.autoT=setTimeout(()=>{if(DG.on&&DG.ph==='clear'){UI.close();dgLeave('던전을 나왔습니다')}},30000);
}
function dgOut(){clearTimeout(DG.autoT);UI.close();dgLeave('던전을 나왔습니다')}

/* ---------- party events ---------- */
async function onDgEv(d){
  if(!d||!NET.party)return;
  if(d.k==='in'){
    if(NET.party.leader!==d.from||!DGDEF[d.id])return;NET.party.dgId=d.id;
    if(!Array.isArray(d.to)||!d.to.includes(SES.name)||DG.on)return;
    if(SES.pf.level<DGDEF[d.id].need){UI.toast('파티장이 '+DGDEF[d.id].name+'에 입장했지만 레벨이 부족합니다');return}
    if(await UI.confirm('파티장이 '+DGDEF[d.id].name+'에 입장했습니다.\n함께 입장할까요?'))dgJoin(d.id);
  }else if(d.k==='st'){
    if(!DG.on||isAuth()||DG.id!==d.id)return;DG.ph=d.ph;DG.wave=d.w;DG.alive=d.al;DG.t=d.t;DG.bh=d.bh;
  }else if(d.k==='end'){
    if(!DG.on||isAuth()||DG.id!==d.id||DG.ph==='clear'||!Array.isArray(d.st))return;dgOnEnd(d.st.slice(0,8).map(s=>[String(s[0]),+s[1]||0]));
  }else if(d.k==='out'){
    NET.party.dgId=null;
    if(DG.on&&DG.ph!=='clear'&&!isAuth())dgFail(d.msg||'파티장이 던전을 떠났습니다');
  }
}

/* ---------- HUD + per-frame ---------- */
function dgHud(on){
  if(!DGH.el){
    const e=document.createElement('div');e.id='dgh';
    e.style.cssText='position:fixed;top:92px;left:50%;transform:translateX(-50%);z-index:19;pointer-events:none;text-align:center;color:#fff;text-shadow:0 1px 3px #000;font-size:13px;min-width:240px;display:none';
    e.innerHTML='<div class="dt" style="font-weight:700;font-size:14px"></div><div class="dl" style="opacity:.9"></div><div class="db" style="display:none;margin-top:4px;height:10px;border-radius:5px;background:rgba(0,0,0,.55);overflow:hidden;border:1px solid rgba(255,255,255,.25)"><i style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#ff5a3a,#ffb23a)"></i></div>';
    document.body.appendChild(e);DGH.el=e;DGH.dt=e.querySelector('.dt');DGH.dl=e.querySelector('.dl');DGH.db=e.querySelector('.db');DGH.bi=DGH.db.firstElementChild;
  }
  DGH.el.style.display=on?'block':'none';DGH.last='';
}
function dgUpdate(dt){
  if(DGP.length&&!DG.on){
    for(const p of DGP){
      const near=d2(p.x,p.z,P.x,P.z)<70*70;
      if(near){p.disc.material.opacity=.22+Math.sin(G.t*2.2)*.08;p.label.pos(p.x,7,p.z)}else if(p.label.el)p.label.el.style.display='none';
    }
  }
  if(!DG.on)return;
  if(DG.ph!=='clear'&&DG.ph!=='fail'&&(NET.party?NET.party.leader:SES.name)!==DG.leader){dgFail('파티 구성이 바뀌어 던전에서 나갑니다');return}
  DGH.t+=dt;if(DGH.t<.25)return;DGH.t=0;
  const def=DGDEF[DG.id];if(!def||!DGH.el)return;
  let boss=null;for(const m of MOBS)if(m.type==='dgboss'&&!m.dead){boss=m;break}
  const bh=boss?Math.max(0,boss.hp/boss.maxHp*100):(DG.ph==='boss'?DG.bh:0);
  const tl=Math.max(0,600-DG.t),mm=Math.floor(tl/60),ss=Math.floor(tl%60);
  const st=DG.ph==='intro'?'준비…':DG.ph==='bossIntro'?'보스 등장 임박':DG.ph==='boss'?'보스 전투':DG.ph==='clear'?'클리어!':'웨이브 '+Math.min(DG.wave+1,def.waves.length)+'/'+def.waves.length+' · 남은 몬스터 '+(DG.alive||0);
  const key=st+'|'+mm+':'+ss+'|'+DG.deaths+'|'+Math.round(bh);
  if(key===DGH.last)return;DGH.last=key;
  DGH.dt.textContent=def.name+' · '+st;DGH.dl.textContent='남은 시간 '+mm+':'+('0'+ss).slice(-2)+' · 부활 '+Math.max(0,DG.maxDeaths-DG.deaths)+'회';
  DGH.db.style.display=boss||DG.ph==='boss'?'block':'none';DGH.bi.style.width=bh.toFixed(0)+'%';
}
