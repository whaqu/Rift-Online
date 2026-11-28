/* ---------------- skills: 직업마다 동작 자체가 다른 스킬 ----------------
   Q·E(기본 직업), R(1차 전직과 그 각성), F(만렙 궁극기). 누르면 발동하고 쿨타임만 있다.
   판정은 클라이언트(서버는 처치 수만 검증). 함수가 false를 돌려주면 발동 실패(쿨타임 없음). */
const MAXLV=99;

/* ---------- data ---------- */
const sd=(id,name,cd,col,icon,desc,extra)=>Object.assign({id,fx:id,type:'x',name,cd,col,icon,desc},extra||{});
/* [Q, E, F] per class */
const KITDEF={
  warrior:[sd('w_q','사슬 폭풍',7,0xffd24a,'swap','적을 사슬로 끌어와 기절시킨 뒤 회전 베기로 휩쓸며 움직입니다. 끌어온 수만큼 보호막.'),
    sd('w_e','대지 가르기',6,0xc89a5a,'arrowup','세 갈래로 바위가 연달아 솟아 적을 기절시킵니다.'),
    sd('w_f','천지 붕괴',50,0xffb02a,'burst','적에서 적으로 세 번 도약하고 마지막에 충격파 3겹. 보호막을 얻습니다.')],
  mage:[sd('m_q','블랙홀',12,0x9a6aff,'burst','적을 빨아들이는 구멍을 만든 뒤 터뜨립니다.'),
    sd('m_e','얼음 장벽',10,0x9fe8ff,'snow','앞에 얼음벽을 세워 적을 막고 얼립니다.'),
    sd('m_f','종말의 운석',60,0xff6a2a,'flame','화면을 뒤덮는 거대한 운석을 떨어뜨립니다.')],
  archer:[sd('a_q','도탄 화살',6,0x6bffb0,'bow','적과 적 사이를 8번 튕기는 화살을 쏩니다.'),
    sd('a_e','올가미 덫',11,0xffc96a,'star','앞쪽에 덫 3개를 던집니다. 밟으면 묶입니다.'),
    sd('a_f','하늘을 덮는 화살',55,0xbfffd8,'rain','3초 동안 주변의 모든 적에게 화살이 꽂힙니다.')],
  rogue:[sd('r_q','암습',3,0xff4a7a,'sword','언제든 연타 가능(게이지가 찰수록 강함, 가득이면 특히 강함). 사용 후 0.8초간 받는 피해 60% 감소. 처치하면 즉시 가득. 12m 안의 적 뒤로 스며들어 벱니다. 계속 누르고 있으면 제자리로 돌아오며 한 번 더 베고, 바로 떼면 그 자리에 남습니다. 적이 없을 때 누르고 있으면 미끄러지듯 달립니다. 처치하면 바로 다시 쓸 수 있습니다.'),
    sd('r_e','은신',12,0x8a6ad0,'close','모습을 감춰 적의 시선을 끊습니다. 은신 중 첫 공격은 2.5배입니다.'),
    sd('r_f','만월 학살',60,0xff2a6a,'burst','그림자 속에서 주변 적을 차례로 베고 마지막에 일제히 터뜨립니다.')],
  cleric:[sd('c_q','스몰 힐',4,0x9fffd0,'heart','[Lv10] 바라본 파티원을 한 번 더 누르면 치유합니다. 우클릭: 자신 치유.'),
    sd('c_e','홀리 아머',26,0x9fd0ff,'shield','[Lv15] 파티원 모두(자신 포함)의 받는 피해를 줄이고, 공격 때마다 보호막을 얻게 합니다.'),
    sd('c_f','심판의 날',60,0xffffff,'bolt','체력을 모두 회복하고 모든 적에게 빛기둥을 내립니다.')],
  lancer:[sd('l_q','장대 도약',8,0xff9a5a,'arrowup','지정한 곳으로 뛰어 내려찍습니다.'),
    sd('l_e','꿰뚫는 투창',9,0xffc08a,'spear','창을 던져 맞은 적을 끝까지 끌고 가 박습니다.'),
    sd('l_f','용의 길',55,0xff5a3a,'dash','긴 직선을 세 번 왕복하며 꿰뚫습니다.')],
  monk:[sd('mk_q','백열권',8,0xffb04a,'fist','앞을 향해 주먹을 12번 연달아 지릅니다.'),
    sd('mk_e','장풍',9,0xffe27a,'volley','느리고 거대한 기공이 적을 밀고 갑니다.'),
    sd('mk_f','천수관음',60,0xffd24a,'fist','주변에 거대한 손바닥이 쏟아집니다.')],
  gunner:[sd('g_q','자동 포탑',14,0xffd24a,'gun','알아서 사격하는 포탑을 설치합니다.'),
    sd('g_e','화염 방사',10,0xff7a2a,'flame','조준 방향으로 불길을 2초간 뿜습니다.'),
    sd('g_f','위성 광선',60,0x7fd6ff,'bolt','조준을 따라다니는 광선을 4초간 내리쏩니다.')],
  summoner:[sd('s_q','골렘 소환',16,0xc8a860,'people','10레벨마다 골렘 +1(최대 5). 30레벨부터 철갑 골렘이 지켜 주어 받는 피해 30% 감소. 적의 시선을 끌며 내려치는 골렘을 부릅니다.'),
    sd('s_e','정령 벌떼',9,0x6bffd0,'star','적을 쫓아가는 도깨비불 14개를 풉니다.'),
    sd('s_f','고대 거신',70,0x9fffe8,'burst','거신이 나타나 적진을 네 번 짓밟습니다.')],
  darknight:[sd('d_q','피의 낫',7,0xff3a6a,'swap','낫 세 자루가 주위를 휘돌며 벨 때마다 회복합니다.'),
    sd('d_e','어둠의 손아귀',9,0xa070ff,'fist','지정한 곳으로 적을 모아 흡혈한 뒤 으스러뜨립니다. 보호막을 얻습니다.'),
    sd('d_f','일식',50,0x7a3aff,'burst','6초간 검은 태양이 적을 끌어당기며 흡혈하고 받는 피해 40% 감소, 끝에 붕괴합니다.')]
};
/* 성직자 Q: 레벨에 따라 스몰 힐(10) → 힐(20) → 홀리 힐(30) */
const CLQ=[null,
  sd('c_q','스몰 힐',4,0x9fffd0,'heart','[Lv10] 바라본 파티원을 한 번 더 누르면 체력 22% 치유. 우클릭: 자신 치유.',{tier:1,pct:.22}),
  sd('c_q','힐',6,0x6bff9a,'heart','[Lv20] 바라본 파티원을 한 번 더 누르면 체력 40% 치유. 우클릭: 자신 치유.',{tier:2,pct:.4}),
  sd('c_q','홀리 힐',8,0xfff2a0,'heart','[Lv30] 바라본 파티원을 한 번 더 누르면 체력 62% 치유 + 보호막. 우클릭: 자신 치유.',{tier:3,pct:.62})];
const ULT={};
for(const c in KITDEF){const[q,e,f]=KITDEF[c];CLS[c].q=q;CLS[c].e=e;ULT[c]=f}

/* R skill per 1st job: [name, cd, icon, description] */
const RDEF={
  gladiator:['처형 도약',9,'sword','적에게 뛰어들어 벱니다. 체력 35% 이하면 3배 피해.'],
  guardian:['수호 결계',16,'shield','적을 밀어내고 탄을 막는 결계를 5초간 칩니다.'],
  pyromancer:['화염룡',10,'flame','구불거리며 날아가는 불의 용이 길에 불을 남깁니다.'],
  cryomancer:['눈보라',14,'snow','따라다니는 눈보라가 5초간 주변을 얼립니다.'],
  sniper:['궤도 저격',11,'bow','가장 강한 적에 조준점을 찍고 큰 한 발을 내리꽂습니다.'],
  hunter:['사냥매',14,'star','매가 6초간 적을 번갈아 덮칩니다.'],
  assassin:['사신의 표식',12,'close','표식을 새기고 3초 뒤 그동안 준 피해를 한 번 더 터뜨립니다.'],
  trickster:['분신술',14,'people','적을 유인하는 분신을 남깁니다. 3초 뒤 폭발합니다.'],
  priest:['홀리 웨폰',22,'sword','파티원 모두(자신 포함)의 공격에 성광 추가 피해와 빛의 폭발을 부여합니다.'],
  crusader:['홀리 웨폰',22,'sword','파티원 모두(자신 포함)의 공격에 성광 추가 피해와 빛의 폭발을 부여합니다.'],
  dragoon:['창공 강습',13,'arrowup','하늘로 사라졌다가 지정한 곳에 불길과 함께 내리꽂힙니다.'],
  halberdier:['선회 창날',11,'swap','창날 두 개가 나선을 그리며 넓게 퍼져 나갑니다.'],
  brawler:['메다꽂기',9,'fist','적 하나를 붙잡아 던져 다른 적들까지 쓰러뜨립니다.'],
  zenmaster:['시간 정지',18,'snow','주변의 모든 것을 3초간 멈춥니다.'],
  gunslinger:['회전 난사',11,'gun','2.5초간 사방으로 탄을 뿌리며 움직입니다.'],
  grenadier:['공중 폭격',13,'burst','조준 방향을 따라 폭탄이 줄지어 떨어집니다.'],
  spiritcaller:['세계수',18,'leaf','나무를 심어 회복하고 뿌리로 적을 후려칩니다.'],
  necromancer:['해골 군단',13,'people','해골 6구가 달려가 적에게 달라붙어 터집니다.'],
  reaper:['영혼 수확',10,'swap','넓게 베고, 맞은 적마다 영혼이 날아와 회복시킵니다.'],
  doomknight:['마신 강림',22,'burst','6초간 거대해져 걸음마다 땅을 뒤흔듭니다.']
};
CLS.rogue.name='암살자';CLS.rogue.blurb='뒤를 잡고 숨어서 급소를 노립니다. 가장 빠르고 치명적';
Object.assign(CLS.rogue,{hp:96,crit:.25,spd:8.4});
JOBS.rogue.name='암살자';
{ // job names must not collide with the renamed class
  const old=JOBS.assassin.name,nu='그림자 살수';
  for(const id in JOBS)if(id==='assassin'||JOBS[id].parent==='assassin'){JOBS[id].name=JOBS[id].name.replace(old,nu);JOBS[id].desc=JOBS[id].desc.split(old).join(nu)}
}
for(const pid in RDEF){
  const[name,cd,icon,desc]=RDEF[pid],p=JOBS[pid];
  for(const id of[pid,...Object.keys(JOBS).filter(k=>JOBS[k].parent===pid&&JOBS[k].tier===2)]){
    const j=JOBS[id],el=j.el||null,pre=el?j.name.split(' ')[0]+' ':'';
    j.r={id:id+'_r',fx:pid,type:'x',name:pre+name,cd,col:j.r.col,icon,desc,el};
    if(el&&(pid==='priest'||pid==='crusader'))j.r=Object.assign(j.r,{fx:'moly',name:'홀리 몰리',cd:42,icon:'star',desc:'파티원 모두(자신 포함)에게 강력한 축복. 이동·공격 속도, 쿨타임 회복, 자연 치유가 크게 오르고 성광 효과가 함께 깃듭니다. 지속 중에는 빛기둥이 주변 적 3명을 계속 공격합니다.'});
    if(!el)j.desc=j.desc.split('. ')[0].replace(/\.$/,'')+'. R: '+desc;
  }
}

/* ---------- runtime ---------- */
const ACTS=[];   // running skill effects
const SG={};     // shared geometries
function geo(k){
  if(!SG[k])SG[k]=k==='box'?new THREE.BoxGeometry(1,1,1):k==='ball'?new THREE.SphereGeometry(.5,14,10):k==='cone'?new THREE.ConeGeometry(.5,1,7):k==='cyl'?new THREE.CylinderGeometry(.5,.5,1,12):new THREE.TorusGeometry(1,.09,6,28,Math.PI*1.4);
  return SG[k];
}
function part(g,k,hex,sx,sy,sz,x,y,z,em){const m=new THREE.Mesh(geo(k),em?EM(hex,em):M(hex));m.scale.set(sx,sy,sz);m.position.set(x||0,y||0,z||0);m.castShadow=false;g.add(m);return m}
function flatRing(g,r,hex,op,y){const m=new THREE.Mesh(shared.ringG,flatMat(hex,op));m.userData.own=1;m.rotation.x=-Math.PI/2;m.position.y=y||.13;m.scale.set(r,r,r);g.add(m);return m}
function flatDisc(g,r,hex,op,y){const m=new THREE.Mesh(shared.discG,flatMat(hex,op));m.userData.own=1;m.rotation.x=-Math.PI/2;m.position.y=y||.11;m.scale.set(r,r,r);g.add(m);return m}
/* summoned stone golem: faceted rocks with joints that overlap (no floating limbs), glowing eyes and core, mossy shoulders */
const golemCount=lv=>Math.min(5,1+Math.floor((lv||1)/10));
function golemBuild(armored){
  const g=grp(),stone=M(0x8f8268),dark=M(0x675c48),light=M(0xab9d7e),moss=M(0x5f8a4a),glowM=EM(0x6bffd0,1.4);
  const rock=(p,mat,sx,sy,sz,x,y,z)=>{const m=mesh(shared.golemRock||(shared.golemRock=new THREE.DodecahedronGeometry(.5,0)),mat,x,y,z,p,false);m.scale.set(sx,sy,sz);return m};
  const legs=[-1,1].map(s=>{const l=grp(s*.55,1.45,0,g);rock(l,dark,.85,1.1,.85,0,-.4,0);rock(l,stone,.95,.9,1,0,-.95,.04);rock(l,dark,1.15,.55,1.35,0,-1.25,.16);return l});
  rock(g,dark,1.5,.9,1.1,0,1.55,0);                                  // narrow hips -> wide chest (V silhouette)
  rock(g,stone,2.4,1.75,1.6,0,2.45,0);rock(g,light,1.35,.95,.6,0,2.5,.6);
  part(g,'ball',0x6bffd0,.55,.55,.4,0,2.45,.9,1.5);g.add((()=>{const q=glow(0x6bffd0,1.8,.6);q.position.set(0,2.45,1.05);return q})());
  BX(.95,.8,.85,light,0,3.8,.35,g);BX(1.1,.24,.35,dark,0,4.12,.7,g);BX(.7,.28,.3,dark,0,3.46,.72,g);   // boxy head, brow, jaw
  for(const s of[-1,1])part(g,'ball',0x7dffd8,.24,.18,.16,s*.23,3.84,.8,2.2);
  const arms=[-1,1].map(s=>{const a=grp(s*1.5,3,0,g);rock(a,dark,1.3,1.2,1.3,s*.05,.05,0);rock(a,moss,1,.42,1,s*.08,.6,0);
    rock(a,stone,.6,1.25,.6,s*.35,-.75,0);rock(a,light,.8,1.1,.8,s*.55,-1.55,.15);rock(a,dark,1.25,1.1,1.25,s*.65,-2.2,.3);return a});
  for(let i=0;i<3;i++){const k=mesh(shared.golemShard||(shared.golemShard=new THREE.OctahedronGeometry(.28,0)),glowM,(i-1)*.55,3.2+(i===1?.25:0),-.8,g,false);k.scale.set(.7,1.7,.7);k.rotation.z=(1-i)*.35}
  if(armored){const iron=M(0xaab6cc,{metalness:.65,roughness:.35}),trim=M(0xe0bc55,{metalness:.6,roughness:.35});   // Lv30+: plated
    BX(1.7,1.15,.3,iron,0,2.55,.82,g);BX(1.75,.14,.34,trim,0,3.1,.82,g);part(g,'ball',0x6bffd0,.4,.4,.2,0,2.45,1,1.5);BX(1.15,.3,1.05,iron,0,4.3,.35,g);BX(.16,.4,.9,trim,0,4.55,.35,g);
    for(const a of arms){const s=a.position.x<0?-1:1;BX(1.4,.4,1.45,iron,s*.08,.62,0,a);BX(1.45,.12,1.5,trim,s*.08,.42,0,a);BX(1.35,.7,1.35,iron,s*.65,-2.15,.3,a)}}
  return{g,arms,legs};
}
/* run `up(t,dt)` each frame for `life` seconds; `g` is removed afterwards. returning true from up ends early */
function act(life,up,end,g){const a={t:0,life,up,end,g};if(g&&!g.parent)entG.add(g);ACTS.push(a);return a}
function actDrop(a){if(a.g){entG.remove(a.g);a.g.traverse&&a.g.traverse(c=>{if(c.userData&&c.userData.own&&c.material)c.material.dispose()})}}
const later=(t,fn)=>act(t,null,fn);
function tickSkills(dt){
  hbTick(dt);healTick(dt);
  if(P.chan>0)P.chan-=dt;
  if(P.stealth>0){P.stealth-=dt;if(Math.random()<dt*18)emit(P.x+rnd(-.5,.5),rnd(.2,1.6),P.z+rnd(-.5,.5),0,.8,0,.45,0x8a6ad0,0)}
  for(let i=0;i<ACTS.length;i++){
    const a=ACTS[i];a.t+=dt;
    const stop=a.up&&a.up(a.t,dt)===true;
    if(ACTS[i]!==a)return;   // reset while running
    if(stop||a.t>=a.life){ACTS.splice(i--,1);actDrop(a);if(a.end)a.end()}
  }
}
function skReset(){
  for(const a of ACTS.splice(0))actDrop(a);
  DECOYS.length=0;
  if(!P)return;
  P.stealth=0;P.leap=null;P.qRun=false;P.chan=0;P.hidden=false;P.spinT=0;P.slow=1;
  if(PM&&PM.base)PM.g.scale.setScalar(PM.base);
}
const skBusy=()=>!!(P.leap||P.hidden||P.chan>0||P.stunT>0);

/* ---------- helpers ---------- */
const alive=m=>!!m&&!m.dead&&!m.spawning;
const valid=m=>alive(m)&&MOBS.indexOf(m)>=0;
const mobsIn=(x,z,r)=>MOBS.filter(m=>alive(m)&&d2(m.x,m.z,x,z)<(r+m.r)*(r+m.r));
function nearTo(x,z,r,skip){let b=null,bd=r*r;for(const m of MOBS){if(!alive(m)||(skip&&skip.has(m)))continue;const d=d2(m.x,m.z,x,z);if(d<bd){bd=d;b=m}}return b}
function aimMob(range){const pt=aimPoint(range),m=nearTo(pt.x,pt.z,4.5);if(m&&d2(m.x,m.z,P.x,P.z)<(range+m.r)*(range+m.r))return m;return nearestMob(range)}
/* one hit from a skill: attack * mult, knocked away from (fx,fz) */
function sHit(c,m,mult,o){
  o=o||{};if(!alive(m))return;
  const dx=m.x-(o.x!=null?o.x:P.x),dz=m.z-(o.z!=null?o.z:P.z),l=Math.hypot(dx,dz)||1;
  dealMob(m,c.atk*mult*c.m,{kx:dx/l,kz:dz/l,kb:o.kb||0,big:o.big,crit:o.crit,noProc:o.noProc});
  if(o.freeze)freezeMob(m,o.freeze);if(o.burn)burnMob(m,c.atk*o.burn);
  elemHit(m,c.el,c.atk);
}
function sArea(c,x,z,r,mult,o){const l=mobsIn(x,z,r);for(const m of l)sHit(c,m,mult,Object.assign({x,z},o));return l.length}
/* move a monster toward (dx,dz) by about `dist` */
function shove(m,dx,dz,dist){
  const l=Math.hypot(dx,dz);if(l<.01||!alive(m))return;
  if(m.duel){duelPushOut(dx,dz,dist);return}
  const kk={kx:dx/l,kz:dz/l,kb:Math.min(20,dist*4.4)};
  if(m.ghost)netSendHit(m,1,kk);else{const res=m.elite?.3:1;m.kx=kk.kx*kk.kb*res*1.6;m.kz=kk.kz*kk.kb*res*1.6}
}
function boom(x,z,r,col,shake){shockRing(x,z,r+.8,col,.45);flashDisc(x,z,r,col,.35);burst(x,1,z,24,col,10,.55,8);sfx('boom');cam.shake=Math.max(cam.shake,shake||.4)}
function blinkTo(x,z){const d=Math.hypot(x,z);if(!DG.on&&!DU.on&&d>WORLD_R-2){x*=(WORLD_R-2)/d;z*=(WORLD_R-2)/d}P.x=x;P.z=z;P.vx=P.vz=0;pushOut(P,P.r)}
function leapTo(x,z,dur,h,done){P.leap={t:0,dur,x0:P.x,z0:P.z,x1:x,z1:z,h,done};P.iframes=Math.max(P.iframes,dur+.2);sfx('dash')}
const clearShots=(x,z,r)=>{for(const b of EB)if(d2(b.x,b.z,x,z)<r*r)b.life=0};
function dropStar(x,z,col,size,dur,done){const g=glow(col,size,.9);g.position.set(x,22,z);entG.add(g);act(dur,t=>{const k=t/dur;g.position.y=22*(1-k*k)+1},done,g)}

/* ---------- the skills ---------- */
const SK={
  /* 전사 */
  w_q(c){   // drag them in, then wade through them as a whirlwind
    const r=11,list=mobsIn(P.x,P.z,r),g=grp(P.x,0,P.z),links=[];
    for(const m of list){links.push({m,o:part(g,'box',0xd0b060,.14,.14,1,0,1,0,.7)});const dx=P.x-m.x,dz=P.z-m.z,d=Math.hypot(dx,dz);shove(m,dx,dz,Math.max(0,d-2.2));freezeMob(m,1.8)}
    if(list.length)P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*Math.min(.3,.05*list.length));
    act(.35,()=>{g.position.set(P.x,0,P.z);for(const k of links){const dx=k.m.x-P.x,dz=k.m.z-P.z,d=Math.hypot(dx,dz)||.1;k.o.position.set(dx/2,1,dz/2);k.o.scale.z=d;k.o.rotation.y=Math.atan2(dx,dz)}},
      ()=>{const w=grp(P.x,1.2,P.z),bl=grp(0,0,0,w);for(let i=0;i<2;i++){const t=part(bl,'arc',c.col,4.2,4.2,3,0,i*.5,0,.9);t.rotation.set(Math.PI/2,0,i*Math.PI)}let n=0;
        act(1.7,(t,dt)=>{w.position.set(P.x,1.2,P.z);bl.rotation.y+=dt*18;if(n<7&&t>=n*.23){n++;sArea(c,P.x,P.z,4.6,1.15,{kb:1});ringBurst(P.x,.7,P.z,14,c.col,9,.3);sfx('slash')}},
          ()=>{sArea(c,P.x,P.z,5.5,3,{kb:12,freeze:.8,big:true});boom(P.x,P.z,5,c.col)},w)},g);
    shockRing(P.x,P.z,r,c.col,.4);sfx('slash');
  },
  w_e(c){   // three fissures in a fan
    const hit=new Set(),base=Math.atan2(c.a.x,c.a.z);
    for(const off of[-.42,0,.42])for(let i=1;i<=10;i++)later(i*.06,()=>{
      const ax=Math.sin(base+off),az=Math.cos(base+off),x=P.x+ax*i*1.6,z=P.z+az*i*1.6;
      const g=grp(x,-2,z);for(let j=0;j<2;j++){const s=part(g,'cone',0x8a6a4a,rnd(.8,1.4),rnd(1.8,3.4),rnd(.8,1.4),rnd(-.7,.7),0,rnd(-.7,.7));s.rotation.z=rnd(-.3,.3)}
      act(.8,t=>{g.position.y=t<.12?-2+t/.12*3:t>.55?1-(t-.55)*12:1},null,g);
      for(const m of mobsIn(x,z,2.1))if(!hit.has(m)){hit.add(m);sHit(c,m,4.2,{kb:5,freeze:1.6,big:true})}
      burst(x,.4,z,6,0xc89a5a,7,.4,14);if(!off){sfx('hit_stone',.8);cam.shake=Math.max(cam.shake,.25)}
    });
  },
  w_f(c){   // three leaps from enemy to enemy, the last one shakes the whole field
    P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*.35);
    const seen=new Set();
    const hop=i=>{
      const last=i===2;let m=null,bd=15*15;
      for(const o of MOBS){if(!alive(o)||seen.has(o))continue;const d=d2(o.x,o.z,P.x,P.z);if(d<bd){bd=d;m=o}}
      if(!m)m=nearTo(P.x,P.z,15);if(m)seen.add(m);
      const tx=m?m.x:P.x+c.a.x*4,tz=m?m.z:P.z+c.a.z*4;
      leapTo(tx,tz,last?.65:.38,last?9:4,()=>{
        const x=P.x,z=P.z;hitStop(last?.14:.05);
        if(!last){sArea(c,x,z,6,4,{kb:6,freeze:1,big:true});boom(x,z,5,c.col,.6);clearShots(x,z,6);later(.08,()=>hop(i+1));return}
        [[7,0],[12,.26],[17,.52]].forEach(([r,d],k)=>later(d+.01,()=>{
          for(const o of mobsIn(x,z,r)){const dist=Math.hypot(o.x-x,o.z-z);if(!k||dist>[7,12][k-1]-o.r)sHit(c,o,[8,6,5][k],{x,z,kb:12,freeze:2,big:true})}
          clearShots(x,z,r);boom(x,z,r-1,c.col,1);ringBurst(x,.6,z,50,c.col,r*2,.6)}));
        pillar(x,z,c.col,24,.8);
      });
    };
    hop(0);
  },
  /* 마법사 */
  m_q(c){
    const pt=aimPoint(14),g=grp(pt.x,1.6,pt.z);
    const core=part(g,'ball',0x080010,2.2,2.2,2.2);const r1=flatRing(g,6.5,c.col,.8,-1.4),r2=flatRing(g,3.5,0xffffff,.5,-1.3);g.add(glow(c.col,6,.55));
    let acc=0;
    act(2.2,(t,dt)=>{
      core.scale.setScalar(2.2+Math.sin(t*20)*.2);r1.scale.setScalar(6.5*(1-(t*1.7%1)*.7));r2.rotation.z+=dt*5;acc+=dt;
      for(let i=0;i<2;i++){const an=rnd(0,TAU),r=rnd(3,7);emit(pt.x+Math.cos(an)*r,rnd(.4,2.5),pt.z+Math.sin(an)*r,-Math.cos(an)*r*2.2,0,-Math.sin(an)*r*2.2,.4,c.col,0)}
      if(acc>=.2){acc-=.2;for(const m of mobsIn(pt.x,pt.z,7)){const dx=pt.x-m.x,dz=pt.z-m.z;shove(m,dx,dz,Math.min(1.6,Math.hypot(dx,dz)));sHit(c,m,.35,{x:pt.x,z:pt.z,noProc:true})}}
    },()=>{sArea(c,pt.x,pt.z,5,3.6,{kb:14,big:true});boom(pt.x,pt.z,5,c.col,.8)},g);
    sfx('magic');netFx('ground',{x:pt.x,z:pt.z,r:6,c:c.col});
  },
  m_e(c){
    const a=c.a,cx=P.x+a.x*3.5,cz=P.z+a.z*3.5,px=-a.z,pz=a.x,g=grp(0,0,0),pts=[];
    for(let i=-4;i<=4;i++){const x=cx+px*i*1.1,z=cz+pz*i*1.1;pts.push({x,z});
      const s=part(g,'cone',0xbfeaff,1.3,rnd(2.6,3.8),1.3,x,1.4,z,.45);s.rotation.y=rnd(0,3);s.rotation.z=rnd(-.15,.15);burst(x,.5,z,5,c.col,5,.4,10)}
    const done=new Set();
    act(4.5,()=>{
      for(const m of MOBS){if(!alive(m))continue;const dx=m.x-cx,dz=m.z-cz,along=dx*px+dz*pz,across=dx*a.x+dz*a.z;
        if(Math.abs(along)<5+m.r&&Math.abs(across)<.9+m.r){if(!done.has(m)){done.add(m);sHit(c,m,2,{x:cx-a.x,z:cz-a.z,freeze:2.5})}shove(m,a.x*(across>=-.2?1:-1),a.z*(across>=-.2?1:-1),.9)}}
      for(const b of EB){const dx=b.x-cx,dz=b.z-cz;if(Math.abs(dx*px+dz*pz)<5&&Math.abs(dx*a.x+dz*a.z)<1)b.life=0}
    },()=>{for(const p of pts)burst(p.x,1.2,p.z,8,c.col,6,.4,12);sfx('ice')},g);
    sfx('ice');netFx('nova',{x:cx,z:cz,r:5,c:c.col});
  },
  m_f(c){
    const pt=aimPoint(16);telegraph(pt.x,pt.z,10,1.8,()=>{
      sArea(c,pt.x,pt.z,10,12,{kb:18,burn:.6,big:true});boom(pt.x,pt.z,10,c.col,1.4);hitStop(.15);
      for(let i=0;i<14;i++){const an=i/14*TAU;pillar(pt.x+Math.cos(an)*7,pt.z+Math.sin(an)*7,c.col,10,.7)}pillar(pt.x,pt.z,0xfff2a0,26,.9);ringBurst(pt.x,1,pt.z,90,0xffb04a,22,.9)},c.col);
    const g=grp(pt.x,34,pt.z);part(g,'ball',0x5a2a1a,6,6,6);g.add(glow(c.col,18,.9));
    act(1.8,t=>{const k=t/1.8;g.position.set(pt.x-(1-k)*14,34*(1-k*k)+2,pt.z);g.rotation.x+=.05;emit(g.position.x+rnd(-2,2),g.position.y+rnd(-1,3),pt.z+rnd(-2,2),0,2,0,.6,c.col,0)},null,g);
    sfx('magic');netFx('ground',{x:pt.x,z:pt.z,r:10,c:c.col});
  },
  /* 궁수 */
  a_q(c){
    const first=aimMob(15);if(!first){UI.toast('가까운 대상이 없습니다');return false}
    const g=grp(P.x,1.3,P.z);part(g,'box',0xeaffe0,.12,.12,1.4,0,0,0,.9);g.add(glow(c.col,2.2,.8));
    let target=first,bounce=0,x=P.x,z=P.z,seen=new Set();
    act(3,(t,dt)=>{
      if(!valid(target)){target=nearTo(x,z,11,seen);if(!target)return true}
      const dx=target.x-x,dz=target.z-z,d=Math.hypot(dx,dz),st=48*dt;
      if(d<=st+target.r){x=target.x;z=target.z;sHit(c,target,2*(1-bounce*.06),{x:P.x,z:P.z,kb:3});burst(x,1.3,z,8,c.col,6,.3,0);
        seen.add(target);if(++bounce>=8)return true;
        let nx=nearTo(x,z,11,seen);if(!nx){seen=new Set([target]);nx=nearTo(x,z,11,seen)}if(!nx)return true;target=nx}
      else{x+=dx/d*st;z+=dz/d*st}
      g.position.set(x,1.3,z);g.rotation.y=Math.atan2(dx,dz);emit(x,1.3,z,0,0,0,.25,c.col,0);
    },null,g);
    sfx('shot');netFx('shot',{x:P.x,z:P.z,vx:c.a.x*40,vz:c.a.z*40,v:'arrow',c:c.col});
  },
  a_e(c){
    const base=Math.atan2(c.a.x,c.a.z);
    for(const off of[-.6,0,.6]){
      const x=P.x+Math.sin(base+off)*6,z=P.z+Math.cos(base+off)*6,g=grp(x,0,z);flatRing(g,1.7,c.col,.9);
      for(let i=0;i<6;i++){const an=i/6*TAU;part(g,'cone',0x9a9aa8,.25,.8,.25,Math.cos(an)*1.2,.35,Math.sin(an)*1.2)}
      act(14,t=>{if(t<.3||!nearTo(x,z,1.8))return;
        for(const m of mobsIn(x,z,3.4)){sHit(c,m,2.4,{x,z,freeze:3})}boom(x,z,3.4,c.col,.3);sfx('hit_stone');return true},null,g);
      burst(x,.4,z,10,c.col,4,.4,8);
    }
    sfx('dash');
  },
  a_f(c){
    let acc=.3;
    act(3.1,(t,dt)=>{acc+=dt;if(acc<.3)return;acc-=.3;
      for(const m of mobsIn(P.x,P.z,16)){for(let j=0;j<6;j++)emit(m.x+rnd(-.3,.3),2+j*1.5,m.z+rnd(-.3,.3),0,-34,0,.22,c.col,0);sHit(c,m,.85,{x:m.x,z:m.z+1,noProc:true});burst(m.x,.5,m.z,4,c.col,4,.3,8)}
      for(let i=0;i<10;i++){const x=P.x+rnd(-14,14),z=P.z+rnd(-14,14);for(let j=0;j<4;j++)emit(x,2+j*2,z,0,-30,0,.25,c.col,0)}
      sfx('shot');cam.shake=Math.max(cam.shake,.2)});
    pillar(P.x,P.z,c.col,24,.6);shockRing(P.x,P.z,16,c.col,.7);
  },
  /* 암살자 */
  r_q(c){   // tap: glide in and cut. Still held: glide back and cut again. No target: hold to glide around
    const ch=c.charge==null?1:c.charge,m=aimMob(12);if(!m){if(qHeld())P.qRun=true;return false}   // running costs no charge
    P.qRun=false;
    const bx=m.x-Math.sin(m.face||0)*(m.r+1),bz=m.z-Math.cos(m.face||0)*(m.r+1),amb=P.stealth>0,x0=P.x,z0=P.z,mult=(amb?6.25:2.65)*qPower(ch);
    P.stealth=0;P.iframes=Math.max(P.iframes,.4*ch);P.qGuard=.8;   // chaining Q keeps a 60% damage reduction up
    const cut=(kb,side)=>{if(!alive(m))return;P.face=Math.atan2(m.x-P.x,m.z-P.z);
      sHit(c,m,mult,{kb,crit:true,big:true});slashArc(m.x,m.z,P.face+side,3,2,c.col,.25);sfx('slash');hitStop(.06);netFx('slash',{x:m.x,z:m.z,f:P.face,r:3,a:2,c:0})};
    const glide=(x,z,done,dur=.13)=>{P.face=Math.atan2(x-P.x,z-P.z);P.leap={t:0,dur,x0:P.x,z0:P.z,x1:x,z1:z,h:0,smooth:true,done}};
    act(.5,()=>{emit(P.x,1,P.z,0,0,0,.35,0x8a6ad0,0)});sfx('dash');
    glide(bx,bz,()=>{cut(0,1.6);
      glide(P.x,P.z,()=>{if(qHeld())glide(x0,z0,()=>cut(4,-1.6))},.08)});   // a beat to let go and stay
    act(1.8,()=>{if(!m.dead)return;if(m.executed)return true;m.executed=true;P.cd.q=0;dmgNum(P.x,3.2,P.z,'처형','info');return true});
  },
  r_e(c){P.stealth=5;burst(P.x,1.2,P.z,30,0x5a3a8a,7,.8,-1);shockRing(P.x,P.z,3,c.col,.4);sfx('dash');
    act(5,()=>{if(!(P.stealth>0))return true;P.slow=1.35},()=>{P.slow=1})},
  r_f(c){
    const x0=P.x,z0=P.z,g=grp(x0,0,z0);flatDisc(g,13,0x12001a,.55,.09);flatRing(g,13,c.col,.9);
    P.hidden=true;P.iframes=Math.max(P.iframes,2.6);let n=0,acc=0;const marked=new Set();
    act(1.8,(t,dt)=>{acc+=dt;while(acc>=.11){acc-=.11;
      const l=mobsIn(x0,z0,13);if(!l.length)continue;const m=l[n++%l.length];marked.add(m);
      const an=rnd(0,TAU);boltFx(m.x+Math.cos(an)*3,m.z+Math.sin(an)*3,m.x-Math.cos(an)*3,m.z-Math.sin(an)*3,c.col);sHit(c,m,1.3,{x:x0,z:z0,noProc:true});slashArc(m.x,m.z,an,2.6,1.6,0xffffff,.2);sfx('slash',.7)}
    },()=>{P.hidden=false;for(const m of marked)if(valid(m)){sHit(c,m,3.5,{x:x0,z:z0,crit:true,big:true});boom(m.x,m.z,1.8,c.col,.6)}hitStop(.1)},g);
    sfx('dash');netFx('nova',{x:x0,z:z0,r:12,c:c.col});
  },
  /* 성직자 */
  c_q(c){
    const sk=c.sk,pct=sk.pct,self=!!P.selfHeal,peers=partyPeers();
    if(self||!peers.length){
      healSelfFx(pct,sk.tier);return;
    }
    if(!P.hs||P.hs.t<=0){P.hs={t:6,tg:null};UI.toast('치유할 파티원을 바라보고 다시 누르세요 (우클릭: 자신 치유)',2200);return false}
    let tg=P.hs.tg;
    if(!tg||!tg.got||tg.dead){
      if(IS_TOUCH){healSelfFx(pct,sk.tier);P.hs=null;return}
      UI.toast('파티원을 바라보세요 (우클릭: 자신 치유)',1400);return false;
    }
    healOtherFx(tg,pct,sk.tier);P.hs=null;
  },
  c_e(c){holyBuff('ar',22,c.col,'홀리 아머')},
  c_f(c){
    healP(S.maxHp);P.iframes=Math.max(P.iframes,1.5);pillar(P.x,P.z,0xfff2a0,30,1.2);shockRing(P.x,P.z,18,0xfff2a0,.9);sfx('level');
    for(let w=0;w<3;w++)later(.35+w*.4,()=>{for(const m of mobsIn(P.x,P.z,18)){pillar(m.x,m.z,0xfff2a0,20,.4);flashDisc(m.x,m.z,2,0xffffff,.3);sHit(c,m,3.2,{x:m.x,z:m.z+1,freeze:.8,big:true})}clearShots(P.x,P.z,18);sfx('boom');cam.shake=Math.max(cam.shake,.8)});
  },
  /* 창기사 */
  l_q(c){const pt=aimPoint(12);leapTo(pt.x,pt.z,.5,5,()=>{sArea(c,P.x,P.z,4.8*S.rangeMul,3.2,{kb:9,freeze:1,big:true});boom(P.x,P.z,4.8*S.rangeMul,c.col,.8);netFx('nova',{x:P.x,z:P.z,r:4.8,c:c.col})})},
  l_e(c){
    const a=c.a,g=grp(P.x,1.2,P.z);part(g,'box',0x8a5a3a,.16,.16,3.4);const tip=part(g,'cone',0xffd0a0,.6,1.2,.6,0,0,2.2,.9);tip.rotation.x=Math.PI/2;g.add(glow(c.col,2.6,.6));g.rotation.y=Math.atan2(a.x,a.z);
    let x=P.x,z=P.z,gone=0;const held=new Set();
    act(1,(t,dt)=>{const st=36*dt;x+=a.x*st;z+=a.z*st;gone+=st;g.position.set(x,1.2,z);emit(x,1.2,z,0,0,0,.3,c.col,0);
      for(const m of mobsIn(x,z,1.5)){if(!held.has(m)){held.add(m);sHit(c,m,1.8,{noProc:true})}}
      for(const m of held)if(alive(m)){if(m.duel)duelMoveOut(x+a.x*.6,z+a.z*.6);else if(m.ghost)shove(m,a.x,a.z,2);else{m.x=x+a.x*.6;m.z=z+a.z*.6;m.kx=m.kz=0}}
      if(gone>=17)return true},()=>{for(const m of held)if(valid(m))sHit(c,m,2.4,{x:x-a.x,z:z-a.z,freeze:2,big:true});boom(x,z,3,c.col,.5)},g);
    sfx('shot');netFx('shot',{x:P.x,z:P.z,vx:a.x*36,vz:a.z*36,v:'arrow',c:c.col});
  },
  l_f(c){
    const a=c.a,x0=P.x,z0=P.z,len=20,g=grp(x0,1.5,z0),seg=[];
    for(let i=0;i<9;i++){const s=part(g,'ball',i?0xff5a3a:0xffd24a,2.4-i*.18,2.4-i*.18,2.4-i*.18,0,0,0,.8);seg.push(s)}
    seg[0].add(glow(c.col,3,.8));P.hidden=true;P.iframes=Math.max(P.iframes,2.3);
    let pass=-1,hit=new Set();
    act(2.1,t=>{const p=Math.min(2,Math.floor(t/.7)),u=(t-p*.7)/.7,dir=p%2?-1:1,d=(p%2?1-u:u)*len;
      if(p!==pass){pass=p;hit=new Set();sfx('dash');sfx('slash')}
      seg.forEach((s,i)=>{const dd=d-dir*i*1.1,w=Math.sin(dd*.8+i)*.9;s.position.set(a.x*dd-a.z*w,Math.sin(dd*.6)*.6,a.z*dd+a.x*w)});
      const hx=x0+a.x*d,hz=z0+a.z*d;burst(hx,1.2,hz,5,0xff8a3a,6,.3,4);
      for(const m of mobsIn(hx,hz,3.2))if(!hit.has(m)){hit.add(m);sHit(c,m,3.6,{x:hx-a.x*dir,z:hz-a.z*dir,kb:3,big:true})}
      cam.shake=Math.max(cam.shake,.35)},()=>{P.hidden=false},g);
  },
  /* 권사 */
  mk_q(c){
    P.chan=1.2;let n=0,acc=.1;
    act(1.2,(t,dt)=>{acc+=dt;P.slow=.25;while(acc>=.1&&n<12){acc-=.1;n++;
      const a=aimDir(),f=Math.atan2(a.x,a.z),off=rnd(-1.2,1.2),r=rnd(2,3.4),x=P.x+a.x*r-a.z*off,z=P.z+a.z*r+a.x*off;P.face=f;P.atkAnim=0;P.atkDur=.12;P.swing=-P.swing;
      const g=grp(x,1.4,z);part(g,'box',0xffc080,.7,.6,.8,0,0,0,.8);g.rotation.y=f;g.add(glow(c.col,1.8,.7));act(.12,null,null,g);
      for(const m of mobsIn(P.x+a.x*2.3,P.z+a.z*2.3,2.7))sHit(c,m,n===12?2.6:.55,{kb:n===12?16:1,big:n===12,noProc:n<12});sfx('hit',.7);cam.shake=Math.max(cam.shake,.18)}},
      ()=>{P.slow=1;P.chan=0});
  },
  mk_e(c){
    const a=c.a,g=grp(P.x+a.x*2,1.8,P.z+a.z*2);const b=part(g,'ball',0xffe9a0,4,4,4,0,0,0,1);b.material=flatMat(0xffe9a0,.45);b.userData.own=1;part(g,'ball',0xffffff,1.8,1.8,1.8,0,0,0,1);g.add(glow(c.col,9,.7));
    let x=g.position.x,z=g.position.z;const hit=new Set();
    act(2,(t,dt)=>{x+=a.x*11*dt;z+=a.z*11*dt;g.position.set(x,1.8,z);g.scale.setScalar(1+Math.sin(t*18)*.06);emit(x+rnd(-2,2),rnd(.3,3),z+rnd(-2,2),-a.x*4,0,-a.z*4,.4,c.col,0);clearShots(x,z,3);
      for(const m of mobsIn(x,z,2.4)){if(!hit.has(m)){hit.add(m);sHit(c,m,2.8,{x:x-a.x,z:z-a.z})}shove(m,a.x,a.z,1.4)}},()=>boom(x,z,3,c.col,.5),g);
    sfx('magic');netFx('shot',{x:P.x,z:P.z,vx:a.x*11,vz:a.z*11,v:'orb',c:c.col});
  },
  mk_f(c){
    let acc=.2,n=0;
    act(3,(t,dt)=>{acc+=dt;while(acc>=.2){acc-=.2;
      const l=mobsIn(P.x,P.z,13),m=l.length&&n%3?l[n%l.length]:null;n++;
      const x=m?m.x:P.x+rnd(-10,10),z=m?m.z:P.z+rnd(-10,10),g=grp(x,12,z);
      part(g,'box',0xffd86a,2.6,.8,2.6,0,0,0,.8);for(let i=-1.5;i<=1.5;i++)part(g,'box',0xffd86a,.5,.7,1.6,i*.62,0,1.9,.8);g.add(glow(c.col,6,.5));
      act(.28,tt=>{g.position.y=Math.max(.5,12*(1-(tt/.2)))},()=>{sArea(c,x,z,3.4,2.1,{kb:5,freeze:.6,big:true});boom(x,z,3.4,c.col,.55)},g)}});
    pillar(P.x,P.z,c.col,22,1);sfx('level');
  },
  /* 총잡이 */
  g_q(c){
    const x=P.x+c.a.x*2.5,z=P.z+c.a.z*2.5,g=grp(x,0,z);part(g,'cyl',0x4a5260,1.2,.5,1.2,0,.25,0);const head=grp(0,1.1,0,g);part(head,'box',0x7a8aa0,.9,.7,1);part(head,'cyl',0x2a2e38,.24,1.3,.24,0,0,1).rotation.x=Math.PI/2;part(head,'ball',0xff5a3a,.25,.25,.25,0,.45,0,1);flatRing(g,1.2,c.col,.7);
    let acc=0;
    act(9,(t,dt)=>{acc+=dt;const m=nearTo(x,z,13);if(!m)return;const dx=m.x-x,dz=m.z-z,d=Math.hypot(dx,dz)||1;head.rotation.y=Math.atan2(dx,dz);
      if(acc>=.24){acc=0;spawnPB({kind:'arrow',x:x+dx/d*1.4,z:z+dz/d*1.4,vx:dx/d*50,vz:dz/d*50,r:.35,dmg:c.atk*.7*c.m,life:.6,pierce:1,col:c.col,el:c.el,eatk:c.atk});burst(x+dx/d*1.6,1.1,z+dz/d*1.6,3,c.col,3,.15,0);sfx('shot',.35)}},
      ()=>boom(x,z,2,c.col,.2),g);
    burst(x,.5,z,16,0x9aa0b8,5,.5,8);sfx('equip');
  },
  g_e(c){
    P.chan=2;let acc=0;
    act(2,(t,dt)=>{P.slow=.55;const a=aimDir(),base=Math.atan2(a.x,a.z);P.face=base;acc+=dt;
      for(let i=0;i<7;i++){const an=base+rnd(-.38,.38),sp=rnd(13,22);emit(P.x+a.x*1.2,1.3,P.z+a.z*1.2,Math.sin(an)*sp,rnd(-.5,1.5),Math.cos(an)*sp,rnd(.25,.45),pick([0xff5a1a,0xff9a2a,0xffd24a]),-2)}
      if(acc>=.2){acc-=.2;for(const m of mobsIn(P.x,P.z,8.5)){const dx=m.x-P.x,dz=m.z-P.z;if(Math.abs(angDiff(base,Math.atan2(dx,dz)))<.5)sHit(c,m,.55,{burn:.35,noProc:true})}sfx('magic',.3)}},
      ()=>{P.slow=1;P.chan=0});
  },
  g_f(c){
    const p=aimPoint(14),g=grp(p.x,0,p.z);const beam=part(g,'cyl',0xbfeaff,3,40,3,0,20,0);beam.material=flatMat(0x7fd6ff,.55);beam.userData.own=1;part(g,'cyl',0xffffff,1,40,1,0,20,0,1);flatRing(g,3.4,c.col,.9);g.add(glow(c.col,8,.7));
    let x=p.x,z=p.z,acc=0;
    act(4,(t,dt)=>{const q=aimPoint(18),dx=q.x-x,dz=q.z-z,d=Math.hypot(dx,dz),st=Math.min(d,13*dt);if(d>.1){x+=dx/d*st;z+=dz/d*st}g.position.set(x,0,z);beam.scale.x=beam.scale.z=3+Math.sin(t*30)*.4;acc+=dt;
      burst(x,.3,z,3,c.col,8,.3,6);if(acc>=.16){acc-=.16;sArea(c,x,z,3.4,1.15,{noProc:true,burn:.2});cam.shake=Math.max(cam.shake,.3);sfx('hit',.4)}},()=>boom(x,z,4,c.col,.6),g);
    sfx('boom');netFx('ground',{x:p.x,z:p.z,r:3.4,c:c.col});
  },
  /* 소환사 */
  s_q(c){
    /* one golem, plus one per 10 levels. Golems cannot be hit, so from Lv30 their armor protects the summoner instead */
    const lv=SES.pf.level||1,n=golemCount(lv),armored=lv>=30,size=n>3?.75:1,alive=[];
    const cx=P.x+c.a.x*3,cz=P.z+c.a.z*3;
    if(armored)P.golemGuard=12;
    for(let k=0;k<n;k++){
      const{g,arms,legs}=golemBuild(armored),an=k/n*TAU,off=n>1?2+n*.22:0;
      g.position.set(cx+Math.sin(an)*off,0,cz+Math.cos(an)*off);g.scale.setScalar(size);alive.push(g);
      const decoy={x:g.position.x,z:g.position.z,pull:.35};DECOYS.push(decoy);
      let cd=.8+k/n*.7,swing=0;
      const me={g,armored,swing:0},run=act(12,(t,dt)=>{me.swing=swing;cd-=dt;swing=Math.max(0,swing-dt*3);const step=Math.sin(t*6+k)*.35;arms.forEach((a,i)=>a.rotation.x=-swing*2.4+(i?-step:step)*.4*(1-swing));legs.forEach((l,i)=>l.rotation.x=i?step:-step);
        const m=nearTo(g.position.x,g.position.z,16)||null,tx=m?m.x:P.x+Math.sin(an)*off,tz=m?m.z:P.z+Math.cos(an)*off,dx=tx-g.position.x,dz=tz-g.position.z,d=Math.hypot(dx,dz)||1;
        if(d>(m?m.r+1.8:1.5)){g.position.x+=dx/d*5*dt;g.position.z+=dz/d*5*dt}g.rotation.y=Math.atan2(dx,dz);
        for(const q of alive){if(q===g)continue;const ex=g.position.x-q.position.x,ez=g.position.z-q.position.z,e=Math.hypot(ex,ez);if(e>.01&&e<2.4*size){g.position.x+=ex/e*3*dt;g.position.z+=ez/e*3*dt}}   // don't stack
        decoy.x=g.position.x;decoy.z=g.position.z;
        if(m&&d<m.r+2.6&&cd<=0){cd=1.3;swing=1;const x=g.position.x+dx/d*2,z=g.position.z+dz/d*2;sArea(c,x,z,3,2,{kb:8,freeze:.5,big:true});boom(x,z,3,0xc8a860,.35)}},
        ()=>{const i=DECOYS.indexOf(decoy);if(i>=0)DECOYS.splice(i,1);burst(g.position.x,2,g.position.z,24,0xc8a860,7,.6,12)},g);
      run.gol=me;
    }
    if(armored)shockRing(P.x,P.z,3,0xaecbff,.4);
    boom(cx,cz,2.5,c.col,.4);netFx('nova',{x:cx,z:cz,r:3,c:c.col});
  },
  s_e(c){
    for(let i=0;i<14;i++){
      const g=grp(P.x,1.6,P.z);g.add(glow(c.col,1.5,.95));part(g,'ball',0xeafff8,.3,.3,.3,0,0,0,1);
      const an=i/14*TAU;let x=P.x,z=P.z,vx=Math.sin(an)*14,vz=Math.cos(an)*14,m=null;
      act(2.2,(t,dt)=>{if(t>.3){if(!valid(m)){const l=mobsIn(x,z,16);m=l.length?l[i%l.length]:null}
          if(m){const dx=m.x-x,dz=m.z-z,d=Math.hypot(dx,dz)||1,k=Math.min(1,dt*7);vx=lerp(vx,dx/d*24,k);vz=lerp(vz,dz/d*24,k)}}
        x+=vx*dt;z+=vz*dt;g.position.set(x,1.6+Math.sin(t*14+i)*.4,z);emit(x,1.6,z,0,0,0,.22,c.col,0);
        const h=t>.15&&nearTo(x,z,1);if(h){sHit(c,h,.7,{x:x-vx,z:z-vz,noProc:true});burst(x,1.4,z,5,c.col,4,.3,0);return true}},null,g);
    }
    sfx('magic');netFx('nova',{x:P.x,z:P.z,r:3,c:c.col});
  },
  s_f(c){
    const pt=aimPoint(12),g=grp(pt.x,16,pt.z);
    part(g,'box',0x3a7a6a,5,4.5,3,0,7,0,.25);part(g,'box',0x4a9a86,2.4,2,2.2,0,10.4,0,.25);for(const s of[-1,1]){part(g,'ball',0xeafff8,.5,.5,.5,s*.6,10.6,1.15,1.4);part(g,'box',0x2f6a5a,1.6,5.5,1.6,s*3.6,6,0,.2);part(g,'box',0x2f6a5a,1.8,4.8,2,s*1.4,2.4,0,.2)}g.add(glow(c.col,16,.35));
    let n=0;
    act(4.4,(t,dt)=>{const k=Math.floor(t/1.05),u=t/1.05-k,m=nearTo(g.position.x,g.position.z,22);
      if(m){g.position.x=lerp(g.position.x,m.x,dt*2);g.position.z=lerp(g.position.z,m.z,dt*2)}
      g.position.y=u<.75?Math.sin(u/.75*Math.PI)*4:0;
      if(k>n-1&&u>=.75&&n<4){n++;const x=g.position.x,z=g.position.z;sArea(c,x,z,8,3.8,{kb:12,freeze:1,big:true});boom(x,z,8,c.col,1.1);ringBurst(x,.6,z,40,c.col,15,.5)}},null,g);
    sfx('level');netFx('ground',{x:pt.x,z:pt.z,r:8,c:c.col});
  },
  /* 암흑기사 */
  d_q(c){   // three scythes spiral out around the caster and drink blood
    const g=grp(P.x,1.2,P.z),sc=[0,1,2].map(()=>{const k=grp(0,0,0,g);for(const s of[0,Math.PI]){const t=part(k,'arc',0xff3a6a,1.3,1.3,2,0,0,0,.9);t.rotation.set(Math.PI/2,0,s)}k.add(glow(c.col,3.2,.5));return k});
    const last=new Map();let healed=0;
    act(3.6,(t,dt)=>{g.position.set(P.x,1.2,P.z);const rad=2.2+Math.sin(Math.min(1,t/3.6)*Math.PI)*5.5;
      sc.forEach((k,i)=>{const an=t*7+i*TAU/3,x=Math.cos(an)*rad,z=Math.sin(an)*rad;k.position.set(x,0,z);k.rotation.y+=dt*18;
        emit(P.x+x,1.2,P.z+z,0,.4,0,.3,c.col,0);
        for(const m of mobsIn(P.x+x,P.z+z,2.2))if(!(t-last.get(m)<.55)){last.set(m,t);sHit(c,m,1.3,{kb:1,noProc:true});if(healed<14){healed++;healP(Math.round(S.maxHp*.025))}}});
    },null,g);
    sfx('slash');netFx('nova',{x:P.x,z:P.z,r:7,c:c.col});
  },
  d_e(c){   // a giant grip: gather everything to one spot, drain, then crush
    const pt=aimPoint(11),list=mobsIn(pt.x,pt.z,9);if(!list.length){UI.toast('대상이 없습니다');return false}
    const g=grp(pt.x,0,pt.z),hands=[];
    for(let i=0;i<6;i++){const an=i/6*TAU,f=part(g,'cone',0x3a1a5a,.9,5,.9,Math.cos(an)*4,1.6,Math.sin(an)*4,.55);f.rotation.set(-Math.sin(an)*.5,0,Math.cos(an)*.5);hands.push({f,an})}
    flatDisc(g,5,0x2a004a,.6);
    for(const m of list){const dx=pt.x-m.x,dz=pt.z-m.z;shove(m,dx,dz,Math.max(0,Math.hypot(dx,dz)-1));freezeMob(m,2.4);boltFx(m.x,m.z,pt.x,pt.z,c.col)}
    P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*Math.min(.3,.05*list.length));
    let acc=0;
    act(1.8,(t,dt)=>{acc+=dt;const k=Math.min(1,t/1.8);for(const h of hands){h.f.position.set(Math.cos(h.an)*(4-3.2*k),1.6,Math.sin(h.an)*(4-3.2*k));h.f.rotation.set(-Math.sin(h.an)*(.5+k*.5),0,Math.cos(h.an)*(.5+k*.5))}
      if(acc>=.4){acc-=.4;const l=mobsIn(pt.x,pt.z,6);for(const m of l){const dx=pt.x-m.x,dz=pt.z-m.z;shove(m,dx,dz,Math.min(1.5,Math.hypot(dx,dz)));sHit(c,m,1,{x:pt.x,z:pt.z,noProc:true});boltFx(m.x,m.z,P.x,P.z,c.col)}if(l.length)healP(Math.round(S.maxHp*Math.min(.06,.012*l.length)))}},
      ()=>{sArea(c,pt.x,pt.z,6,5,{kb:9,freeze:1,big:true});boom(pt.x,pt.z,6,c.col,1);pillar(pt.x,pt.z,c.col,14,.5)},g);
    sfx('magic');shockRing(pt.x,pt.z,9,c.col,.5);netFx('nova',{x:pt.x,z:pt.z,r:9,c:c.col});
  },
  d_f(c){   // eclipse: the sun drags enemies in while the knight is hardened, then collapses
    P.dkGuard=6.2;P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*.25);
    const g=grp(P.x,7,P.z),sun=part(g,'ball',0x050008,4,4,4);g.add(glow(c.col,13,.6));const ring=flatRing(g,15,c.col,.7,-6.8);flatDisc(g,15,0x0a0016,.45,-6.9);let acc=.4;
    act(6,(t,dt)=>{g.position.set(P.x,7,P.z);sun.scale.setScalar(4+t*.4+Math.sin(t*6)*.3);ring.rotation.z+=dt;acc+=dt;
      for(let i=0;i<3;i++){const an=rnd(0,TAU),r=rnd(5,15);emit(P.x+Math.cos(an)*r,rnd(.3,2),P.z+Math.sin(an)*r,-Math.cos(an)*r*1.5,6,-Math.sin(an)*r*1.5,.6,c.col,0)}
      if(acc>=.5){acc-=.5;const l=mobsIn(P.x,P.z,15);for(const m of l){const dx=P.x-m.x,dz=P.z-m.z,d=Math.hypot(dx,dz);shove(m,dx,dz,Math.max(0,Math.min(1.8,d-3)));sHit(c,m,1.4,{noProc:true});boltFx(m.x,m.z,P.x,P.z,c.col)}if(l.length)healP(Math.round(S.maxHp*Math.min(.12,.03*l.length)))}},
      ()=>{sArea(c,P.x,P.z,15,7,{kb:14,freeze:1.5,big:true});boom(P.x,P.z,14,c.col,1);pillar(P.x,P.z,c.col,22,.8)},g);
    sfx('level');netFx('nova',{x:P.x,z:P.z,r:15,c:c.col});
  },

  /* ----- 1차 전직 R (각성은 속성이 붙고 1.3배) ----- */
  gladiator(c){
    const m=aimMob(12);if(!m){UI.toast('가까운 대상이 없습니다');return false}
    const dx=m.x-P.x,dz=m.z-P.z,d=Math.hypot(dx,dz)||1;
    leapTo(m.x-dx/d*(m.r+1),m.z-dz/d*(m.r+1),.35,3,()=>{if(!valid(m))return;const ex=m.hp<m.maxHp*.35;sHit(c,m,ex?12:4,{big:true,crit:ex||undefined,kb:6});
      slashArc(m.x,m.z,Math.atan2(dx,dz),4,2.6,c.col,.35);boom(m.x,m.z,2.2,c.col,ex?.9:.4);if(ex){dmgNum(P.x,3.2,P.z,'처형!','info');hitStop(.1)}});
  },
  guardian(c){
    const g=grp(P.x,0,P.z),dome=part(g,'ball',0x9fc8ff,11,9,11);dome.material=flatMat(0x6aa8ff,.16);dome.userData.own=1;flatRing(g,5.5,c.col,.9);let acc=.5;
    act(5,(t,dt)=>{g.position.set(P.x,0,P.z);acc+=dt;clearShots(P.x,P.z,5.8);P.iframes=Math.max(P.iframes,.1);
      for(const m of mobsIn(P.x,P.z,5)){const dx=m.x-P.x,dz=m.z-P.z;shove(m,dx,dz,5.8-Math.hypot(dx,dz));if(acc>=.5)sHit(c,m,.9,{noProc:true})}if(acc>=.5)acc-=.5},null,g);
    sfx('card');netFx('nova',{x:P.x,z:P.z,r:5.5,c:c.col});
  },
  pyromancer(c){
    const a=c.a,x0=P.x,z0=P.z,g=grp(0,0,0),seg=[];for(let i=0;i<10;i++){const s=part(g,'ball',i?0xff5a1a:0xffd24a,1.7-i*.12,1.7-i*.12,1.7-i*.12,x0,1.4,z0,1);seg.push(s)}
    const trail=[],hit=new Set();let acc=0;
    act(1.5,(t,dt)=>{acc+=dt;const d=t*17,w=Math.sin(t*9)*3.2,x=x0+a.x*d-a.z*w,z=z0+a.z*d+a.x*w;trail.unshift({x,z});
      seg.forEach((s,i)=>{const p=trail[Math.min(trail.length-1,i*3)];s.position.set(p.x,1.4,p.z)});burst(x,1.4,z,4,0xff7a2a,4,.4,-2);
      for(const m of mobsIn(x,z,2))if(!hit.has(m)){hit.add(m);sHit(c,m,3.4,{x:x-a.x,z:z-a.z,burn:.5,kb:5})}
      if(acc>=.12){acc=0;const f=grp(x,0,z);flatDisc(f,1.6,0xff5a1a,.45);let b=0;act(2.5,(tt,d2t)=>{b+=d2t;if(Math.random()<d2t*8)emit(x+rnd(-1,1),.3,z+rnd(-1,1),0,rnd(1,3),0,.5,0xff8a2a,0);if(b>=.5){b-=.5;sArea(c,x,z,1.5,.2,{noProc:true})}},null,f)}},null,g);
    sfx('magic');netFx('shot',{x:x0,z:z0,vx:a.x*17,vz:a.z*17,v:'orb',c:c.col});
  },
  cryomancer(c){
    const g=grp(P.x,0,P.z);flatRing(g,7.5,c.col,.6);flatDisc(g,7.5,0xdff6ff,.12);let acc=0;
    act(5,(t,dt)=>{g.position.set(P.x,0,P.z);acc+=dt;
      for(let i=0;i<5;i++){const an=rnd(0,TAU),r=rnd(1,7.5);emit(P.x+Math.cos(an)*r,rnd(.3,4),P.z+Math.sin(an)*r,-Math.sin(an)*12,-1,Math.cos(an)*12,.45,pick([0xffffff,0xbfeaff]),0)}
      if(acc>=.5){acc-=.5;sArea(c,P.x,P.z,7.5,.6,{freeze:.8,noProc:true});sfx('ice',.35)}},null,g);
    sfx('ice');netFx('nova',{x:P.x,z:P.z,r:7.5,c:c.col});
  },
  sniper(c){
    const l=mobsIn(P.x,P.z,22);if(!l.length){UI.toast('가까운 대상이 없습니다');return false}
    const m=l.reduce((a,b)=>b.hp>a.hp?b:a),g=grp(m.x,0,m.z);const r=flatRing(g,3,0xff3a3a,.95);part(g,'box',0xff3a3a,5,.06,.12,0,.16,0,1);part(g,'box',0xff3a3a,.12,.06,5,0,.16,0,1);
    act(.9,t=>{if(valid(m))g.position.set(m.x,0,m.z);r.scale.setScalar(3-t*2.2)},()=>{const x=g.position.x,z=g.position.z;if(valid(m))sHit(c,m,11,{crit:true,big:true,kb:8});sArea(c,x,z,2.5,2,{noProc:true});
      boltFx(P.x,P.z,x,z,c.col);pillar(x,z,c.col,30,.4);boom(x,z,2.5,c.col,.9);hitStop(.1);sfx('shot')},g);
    sfx('tele');
  },
  hunter(c){
    const g=grp(P.x,8,P.z);part(g,'cone',0x7a5230,.8,1.8,.6).rotation.x=Math.PI/2;part(g,'ball',0xf0e0c0,.5,.5,.5,0,0,1);const wings=[-1,1].map(s=>{const w=grp(0,0,0,g);part(w,'box',0x9a6a3a,2,.1,.8,s*1.1,0,0);return w});
    let target=null,cd=.3;
    act(6,(t,dt)=>{wings.forEach((w,i)=>w.rotation.z=Math.sin(t*16)*(i?.5:-.5));cd-=dt;
      if(!valid(target)){const l=mobsIn(P.x,P.z,15);target=l.length?pick(l):null}
      const dive=target&&cd<=0,tx=dive?target.x:P.x+Math.sin(t*3)*5,tz=dive?target.z:P.z+Math.cos(t*3)*5,ty=dive?1.4:7,dx=tx-g.position.x,dy=ty-g.position.y,dz=tz-g.position.z,d=Math.hypot(dx,dy,dz)||1,st=Math.min(d,32*dt);
      g.position.x+=dx/d*st;g.position.y+=dy/d*st;g.position.z+=dz/d*st;g.rotation.y=Math.atan2(dx,dz);
      if(dive&&d<1.2){sHit(c,target,1.5,{x:P.x,z:P.z,freeze:.5});burst(target.x,1.4,target.z,10,0xffe0a0,6,.35,8);sfx('slash');cd=.45;target=null}},null,g);
    sfx('dash');
  },
  assassin(c){
    const m=aimMob(14);if(!m){UI.toast('가까운 대상이 없습니다');return false}
    const hp0=m.hp,g=grp(m.x,0,m.z);const x1=part(g,'box',0xff2a6a,.2,1.6,.2,0,3.6,0,1),x2=part(g,'box',0xff2a6a,.2,1.6,.2,0,3.6,0,1);x1.rotation.z=.8;x2.rotation.z=-.8;flatRing(g,m.r+.8,0xff2a6a,.8);
    sHit(c,m,1.2,{});
    act(3,()=>{if(!valid(m))return true;g.position.set(m.x,0,m.z)},()=>{
      const dealt=Math.max(0,hp0-Math.max(0,m.hp)),x=g.position.x,z=g.position.z;
      if(valid(m)){const dmg=Math.max(c.atk*4*c.m,dealt);dealMob(m,dmg,{crit:false,big:true,noProc:true});elemHit(m,c.el,c.atk)}
      sArea(c,x,z,3.5,2,{noProc:true});boom(x,z,3.5,0xff2a6a,.7)},g);
    sfx('crit');
  },
  trickster(c){
    const x=P.x,z=P.z,g=grp(x,0,z);const body=part(g,'cyl',0x6a3a9a,1,1.7,1,0,.9,0,.5),head=part(g,'ball',0x9a6ad0,.9,.9,.9,0,2.2,0,.5);flatRing(g,1.3,c.col,.8);
    const decoy={x,z,pull:.08};DECOYS.push(decoy);P.stealth=Math.max(P.stealth||0,1.5);
    const a=c.a;P.dashDX=-a.x;P.dashDZ=-a.z;P.dashT=.18;P.dashSp=40;P.dashHit=null;
    act(3,t=>{body.rotation.y=head.rotation.y=t*3;if(t>2)g.scale.setScalar(1+Math.sin(t*30)*.1)},()=>{const i=DECOYS.indexOf(decoy);if(i>=0)DECOYS.splice(i,1);sArea(c,x,z,6,4,{kb:10,freeze:1,big:true});boom(x,z,6,c.col,.8)},g);
    sfx('dash');netFx('nova',{x,z,r:2,c:c.col});
  },
  priest(c){holyBuff('wp',22,c.col,'홀리 웨폰')},
  crusader(c){holyBuff('wp',22,c.col,'홀리 웨폰')},
  moly(c){
    holyBuff('my',16,0xfff2a0,'홀리 몰리');
    let acc=.6;   /* while it lasts, holy light also strikes up to 3 nearby enemies */
    act(16,(t,dt)=>{acc+=dt;if(acc<.8)return;acc-=.8;
      const l=mobsIn(P.x,P.z,11).sort((a,b)=>d2(a.x,a.z,P.x,P.z)-d2(b.x,b.z,P.x,P.z)).slice(0,3);
      for(const m of l){pillar(m.x,m.z,0xfff2a0,9,.35);flashDisc(m.x,m.z,2,0xffe27a,.3);sHit(c,m,1.6,{noProc:true})}
      if(l.length)sfx('hit_metal',.4)});
  },
  dragoon(c){
    P.hidden=true;P.iframes=Math.max(P.iframes,1.6);burst(P.x,1,P.z,30,c.col,8,.5,0);pillar(P.x,P.z,c.col,24,.4);sfx('dash');
    const pt=aimPoint(16);telegraph(pt.x,pt.z,5.5,1.1,()=>{},c.col);
    later(1.1,()=>{P.hidden=false;blinkTo(pt.x,pt.z);sArea(c,pt.x,pt.z,5.5,4.6,{kb:14,burn:.4,big:true});boom(pt.x,pt.z,5.5,c.col,1.1);pillar(pt.x,pt.z,0xff7a2a,20,.6);ringBurst(pt.x,.8,pt.z,50,0xff7a2a,14,.6);netFx('nova',{x:pt.x,z:pt.z,r:5.5,c:c.col})});
  },
  halberdier(c){
    const g=grp(P.x,1.2,P.z),bl=[0,1].map(()=>{const b=grp(0,0,0,g);part(b,'box',0x8a5a3a,.2,.2,2.6);part(b,'cone',0xffe0c0,.9,1.4,.3,0,0,1.8,.8).rotation.x=Math.PI/2;b.add(glow(c.col,2.5,.6));return b});
    const cool=new Map(),x=P.x,z=P.z;
    act(2.4,(t,dt)=>{const r=1.5+t*4.2;bl.forEach((b,i)=>{const an=t*9+i*Math.PI,bx=Math.sin(an)*r,bz=Math.cos(an)*r;b.position.set(bx,0,bz);b.rotation.y=an+Math.PI/2;emit(x+bx,1.2,z+bz,0,0,0,.35,c.col,0);
      for(const m of mobsIn(x+bx,z+bz,1.7))if(!(cool.get(m)>t)){cool.set(m,t+.35);sHit(c,m,1.9,{x,z,kb:5})}})},null,g);
    sfx('slash');netFx('nova',{x,z,r:8,c:c.col});
  },
  brawler(c){
    const m=aimMob(8);if(!m){UI.toast('가까운 대상이 없습니다');return false}
    const a=c.a,x0=P.x,z0=P.z,sx=m.x,sz=m.z,tx=P.x+a.x*10,tz=P.z+a.z*10;freezeMob(m,1.2);P.atkAnim=0;P.atkDur=.5;sHit(c,m,1,{noProc:true});
    act(.55,t=>{const u=t/.55;if(valid(m)&&!m.ghost&&!m.duel){m.x=lerp(sx,tx,u);m.z=lerp(sz,tz,u);m.kx=m.kz=0;if(m.m&&m.m.g)m.m.g.position.y=Math.sin(u*Math.PI)*5}},
      ()=>{if(m.duel)duelMoveOut(tx,tz);if(m.m&&m.m.g)m.m.g.position.y=0;sArea(c,tx,tz,4.5,4.2,{kb:12,freeze:1,big:true});boom(tx,tz,4.5,c.col,.9);hitStop(.08)});
    sfx('hit');
  },
  zenmaster(c){
    const g=grp(P.x,0,P.z);flatDisc(g,11,0x9fffe8,.14);flatRing(g,11,c.col,.8);const hand=part(g,'box',0xeafff8,.15,.1,9,0,.2,0,1);
    for(const m of mobsIn(P.x,P.z,11)){freezeMob(m,m.elite?6:3)}clearShots(P.x,P.z,11);
    act(3,(t,dt)=>{hand.rotation.y-=dt*.6;clearShots(g.position.x,g.position.z,11)},()=>{sArea(c,g.position.x,g.position.z,11,3.4,{big:true});boom(g.position.x,g.position.z,11,c.col,.9)},g);
    sfx('ice');netFx('nova',{x:P.x,z:P.z,r:11,c:c.col});
  },
  gunslinger(c){
    let acc=0,an=0;
    act(2.5,(t,dt)=>{acc+=dt;P.spinT=Math.max(P.spinT,.02);while(acc>=.06){acc-=.06;an+=.55;
      for(const off of[0,Math.PI]){const x=Math.sin(an+off),z=Math.cos(an+off);spawnPB({kind:'arrow',x:P.x+x,z:P.z+z,vx:x*40,vz:z*40,r:.4,dmg:c.atk*.75*c.m,life:.45,pierce:2,col:c.col,el:c.el,eatk:c.atk})}sfx('shot',.35)}});
  },
  grenadier(c){
    const a=c.a;
    for(let i=0;i<8;i++)later(.15+i*.13,()=>{const x=P.x+a.x*(4+i*2.4),z=P.z+a.z*(4+i*2.4);dropStar(x,z,c.col,3.5,.45,()=>{sArea(c,x,z,3.4,2.4,{kb:7,burn:.3,big:true});boom(x,z,3.4,c.col,.6)});telegraph(x,z,3.4,.45,()=>{},c.col)});
    const g=grp(P.x-a.x*14,13,P.z-a.z*14);part(g,'box',0x4a5260,1.2,.9,5);part(g,'box',0x6a7280,7,.2,1.4);g.rotation.y=Math.atan2(a.x,a.z);const x0=g.position.x,z0=g.position.z;
    act(1.4,t=>{g.position.set(x0+a.x*t*30,13,z0+a.z*t*30)},null,g);sfx('tele');
  },
  spiritcaller(c){
    const x=P.x+c.a.x*3,z=P.z+c.a.z*3,g=grp(x,0,z);part(g,'cyl',0x6a4a2a,1.2,3.4,1.2,0,1.7,0);for(const[px,py,pz,s]of[[0,4.4,0,3.6],[1.4,3.8,.4,2],[-1.3,3.9,-.5,2.2]])part(g,'ball',0x4ab86a,s,s*.8,s,px,py,pz,.35);flatRing(g,8,c.col,.45);let acc=0,heal=0;
    act(9,(t,dt)=>{g.scale.setScalar(Math.min(1,.2+t*2));acc+=dt;heal+=dt;
      if(heal>=1){heal-=1;if(d2(P.x,P.z,x,z)<64&&P.hp<S.maxHp)healP(Math.round(S.maxHp*.04))}
      if(acc>=.9){acc-=.9;for(const m of mobsIn(x,z,8).slice(0,5)){const n=6;for(let i=1;i<=n;i++)emit(lerp(x,m.x,i/n),.4,lerp(z,m.z,i/n),0,2,0,.4,0x7ad86a,0);pillar(m.x,m.z,0x5ac86a,4,.3);sHit(c,m,1.2,{x,z,freeze:.4,noProc:true})}}},null,g);
    sfx('level');netFx('nova',{x,z,r:8,c:c.col});
  },
  necromancer(c){
    for(let i=0;i<6;i++){
      const an=i/6*TAU,g=grp(P.x+Math.sin(an)*2,0,P.z+Math.cos(an)*2);part(g,'ball',0xe8e0d0,.8,.8,.8,0,1.5,0);part(g,'box',0xd0c8b8,.5,.8,.3,0,.8,0);for(const s of[-1,1]){part(g,'box',0xd0c8b8,.16,.6,.16,s*.18,.3,0);part(g,'ball',0xa070ff,.18,.18,.18,s*.18,1.55,.36,1.5)}
      act(5,(t,dt)=>{const m=nearTo(g.position.x,g.position.z,18);if(t<.3||!m)return;const dx=m.x-g.position.x,dz=m.z-g.position.z,d=Math.hypot(dx,dz)||1;
        g.position.x+=dx/d*(9+i*.5)*dt;g.position.z+=dz/d*(9+i*.5)*dt;g.position.y=Math.abs(Math.sin(t*14+i))*.4;g.rotation.y=Math.atan2(dx,dz);if(d<m.r+.8)return true},
        ()=>{const x=g.position.x,z=g.position.z;sArea(c,x,z,2.8,2,{kb:5});boom(x,z,2.8,c.col,.3)},g);
      burst(g.position.x,.3,g.position.z,10,0x9a6aff,4,.5,6);
    }
    sfx('magic');netFx('nova',{x:P.x,z:P.z,r:3,c:c.col});
  },
  reaper(c){
    const r=8,list=mobsIn(P.x,P.z,r);sArea(c,P.x,P.z,r,3,{kb:3,big:true});
    slashArc(P.x,P.z,0,r,TAU-.01,c.col,.45);slashArc(P.x,P.z,2,r*.7,TAU-.01,0xffffff,.3);boom(P.x,P.z,r,c.col,.7);
    list.slice(0,10).forEach((m,i)=>{const sx=m.x,sz=m.z,g=grp(sx,1.5,sz);g.add(glow(0xbfaaff,1.8,.9));part(g,'ball',0xffffff,.35,.35,.35,0,0,0,1);
      act(.6+i*.05,t=>{const u=(t/(.6+i*.05))**2;g.position.set(lerp(sx,P.x,u),1.5+Math.sin(u*Math.PI)*3,lerp(sz,P.z,u))},()=>healP(Math.round(S.maxHp*.035)),g)});
    sfx('slash');netFx('slash',{x:P.x,z:P.z,f:0,r,a:6.2,c:1});
  },
  doomknight(c){
    P.buff={t:6,aps:1.2,atk:1.35,spd:1.15};P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*.3);boom(P.x,P.z,5,c.col,1);pillar(P.x,P.z,c.col,16,.8);let acc=0;
    act(6,(t,dt)=>{const k=t<.3?1+t*2.7:t>5.6?1.8-(t-5.6)*2:1.8;if(PM){if(!PM.base)PM.base=PM.g.scale.x||1;PM.g.scale.setScalar(PM.base*k)}acc+=dt;if(Math.random()<dt*30)emit(P.x+rnd(-1,1),rnd(.3,4),P.z+rnd(-1,1),0,2,0,.5,c.col,0);
      if(acc>=.55){acc-=.55;sArea(c,P.x,P.z,5.5,1.3,{kb:6,freeze:.25});shockRing(P.x,P.z,5.5,c.col,.35);burst(P.x,.2,P.z,14,0x4a2a6a,7,.35,12);sfx('hit_stone');cam.shake=Math.max(cam.shake,.3)}},()=>{if(PM&&PM.base)PM.g.scale.setScalar(PM.base)});
    sfx('level');netFx('nova',{x:P.x,z:P.z,r:5.5,c:c.col});
  }
};

/* ---------- 성직자: 홀리 버프 (홀리 아머/웨폰/몰리, 파티 전체) + 지정 힐 ---------- */
const HB_DEF={ar:{n:'홀리 아머',col:'#9fd0ff'},wp:{n:'홀리 웨폰',col:'#ffe27a'},my:{n:'홀리 몰리',col:'#fff2a0'}};
const hbOn=k=>!!(P&&P.hb&&P.hb[k]&&P.hb[k].t>0);
const hbAr=()=>hbOn('ar')||hbOn('my'),hbWp=()=>hbOn('wp')||hbOn('my');
function partyPeers(){const r=[];if(typeof NET!=='undefined'&&NET.party)for(const n of NET.party.members){if(n===SES.name)continue;const p=NET.peers[n];if(p&&p.got&&!p.dead)r.push(p)}return r}
function applyHB(k,dur,pw,fromSelf){
  if(!HB_DEF[k]||!P||P.dead)return;P.hb=P.hb||{};P.hb[k]={t:dur,pw:pw||1};
  const col=parseInt(HB_DEF[k].col.slice(1),16);shockRing(P.x,P.z,4.5,col,.5);pillar(P.x,P.z,col,10,.6);burst(P.x,1,P.z,20,col,7,.7,3);sfx('level');dmgNum(P.x,3.4,P.z,HB_DEF[k].n,'info');
  hbHud(true);
}
function holyBuff(k,dur,col,name){
  const pw=1+Math.min(99,SES.pf.level)/100,to=(NET&&NET.on&&NET.party)?NET.party.members.filter(n=>n!==SES.name):[];
  applyHB(k,dur,pw,true);
  if(to.length)netSend('cb',{to,from:SES.name,k,d:dur,pw});
  netFx('nova',{x:P.x,z:P.z,r:4,c:col});
}
function onCb(d){
  if(!d||!Array.isArray(d.to)||!d.to.includes(SES.name)||!NET.party||!NET.party.members.includes(d.from)||!HB_DEF[d.k])return;
  applyHB(d.k,clamp(+d.d||0,1,30),clamp(+d.pw||1,1,2.5));
}
function onCh(d){
  if(!d||d.to!==SES.name||!NET.party||!NET.party.members.includes(d.from)||P.dead)return;
  const pct=clamp(+d.pct||0,0,.9),n=Math.round(S.maxHp*pct);healP(n);
  if(d.sh)P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*clamp(+d.sh,0,.3));
  pillar(P.x,P.z,0x6bff9a,8,.5);shockRing(P.x,P.z,3,0x6bff9a,.5);sfx('level');
}
function healSelfFx(pct,tier){
  healP(Math.round(S.maxHp*pct));if(tier>=3)P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*.1);
  pillar(P.x,P.z,0x6bff9a,9,.5);shockRing(P.x,P.z,3+tier,0x9fffd0,.5);ringBurst(P.x,.6,P.z,16,0x9fffd0,7,.5);sfx('level');
}
function healOtherFx(tg,pct,tier){
  netSend('ch',{to:tg.name,from:SES.name,pct,sh:tier>=3?.1:0});
  boltFx(P.x,P.z,tg.x,tg.z,0x6bff9a);pillar(tg.x,tg.z,0x6bff9a,9,.5);shockRing(tg.x,tg.z,3+tier,0x9fffd0,.5);burst(tg.x,1.4,tg.z,14,0x6bff9a,6,.6,3);
  dmgNum(tg.x,3.4,tg.z,'+'+Math.round(pct*100)+'%','heal');sfx('level');
}
const HM={g:null};
function hmMarker(){
  if(!HM.g){const g=grp(0,0,0);part(g,'box',0x6bff9a,.38,1.2,.38,0,0,0,1.3);part(g,'box',0x6bff9a,1.2,.38,.38,0,0,0,1.3);g.add(glow(0x6bff9a,3.2,.75));g.visible=false;entG.add(g);HM.g=g}
  return HM.g;
}
function aimedMember(){
  const L=partyPeers();if(!L.length)return null;
  const a=(IS_TOUCH||mv.on)?{x:Math.sin(P.face),z:Math.cos(P.face)}:aimDir(),af=Math.atan2(a.x,a.z);
  let best=null,bs=1e9;
  for(const p of L){const dx=p.x-P.x,dz=p.z-P.z,d=Math.hypot(dx,dz);if(d>42)continue;const ang=Math.abs(angDiff(af,Math.atan2(dx,dz)));if(ang>.75&&d>4)continue;const sc=ang+d*.012;if(sc<bs){bs=sc;best=p}}
  return best;
}
function healTick(dt){
  const hm=hmMarker();
  if(P.hs&&P.hs.t>0&&!P.dead){
    P.hs.t-=dt;const tg=aimedMember();P.hs.tg=tg;
    if(tg){hm.visible=true;hm.position.set(tg.x,4.7+Math.sin(G.t*6)*.25,tg.z);hm.rotation.y+=dt*2.5}else hm.visible=false;
  }else{if(P.hs)P.hs=null;hm.visible=false}
}
/* right mouse button: heal yourself */
function rightClickSkill(){
  if(!P||P.dead||UI.modal||!S||S.cls!=='cleric'||!skillOf('q'))return;
  P.selfHeal=true;P.hs=null;try{trySkill('q')}finally{P.selfHeal=false}
}
const HBF={el:null,t:0,last:''};
function hbHud(force){
  if(!HBF.el){
    const st=document.createElement('style');st.textContent='#hbf{position:fixed;left:12px;top:140px;z-index:18;display:flex;flex-direction:column;gap:4px;pointer-events:none}#hbf .c{padding:3px 10px 3px 8px;border-radius:12px;font-size:12px;font-weight:700;color:#fff;background:rgba(10,12,24,.8);border:1px solid var(--c);box-shadow:0 0 10px -2px var(--c);text-shadow:0 1px 2px #000}#hbf .c b{color:var(--c);margin-right:6px}';document.head.appendChild(st);
    const e=document.createElement('div');e.id='hbf';document.body.appendChild(e);HBF.el=e;
  }
  if(!force)return;HBF.last='';HBF.t=1;
}
function hbTick(dt){
  if(!P.hb)return;
  let any=false;for(const k in P.hb){const b=P.hb[k];if(b.t>0){b.t-=dt;any=true;if(b.t<=0){delete P.hb[k];HBF.last=''}}}
  if(any&&Math.random()<dt*10){const c=hbOn('my')?0xfff2a0:hbOn('wp')?0xffe27a:0x9fd0ff;emit(P.x+rnd(-.8,.8),rnd(.2,1.8),P.z+rnd(-.8,.8),0,1.2,0,.6,c,0)}
  if(!HBF.el)return;HBF.t-=dt;if(HBF.t>0)return;HBF.t=.25;
  let h='';for(const k of['my','wp','ar']){const b=P.hb[k];if(b&&b.t>0)h+='<div class="c" style="--c:'+HB_DEF[k].col+'"><b>'+HB_DEF[k].n+'</b>'+Math.ceil(b.t)+'초</div>'}
  if(h!==HBF.last){HBF.last=h;HBF.el.innerHTML=h}
}
/* holy hit effects (called from dealMob) */
function holyProc(m,base){
  const wp=hbWp(),ar=hbAr();if(!wp&&!ar)return;
  const my=hbOn('my'),pw=Math.max(1,...Object.values(P.hb||{}).map(b=>b.pw||1));
  if(wp){const k=hbOn('wp')?1:.7;
    dealMob(m,base*.22*k*pw,{noProc:true,noKb:true});
    if(Math.random()<.3*k){for(const q of MOBS){if(q===m||q.dead||q.spawning)continue;if(d2(q.x,q.z,m.x,m.z)<3.2*3.2)dealMob(q,base*.4*k*pw,{noProc:true,noKb:true})}
      shockRing(m.x,m.z,3.4,0xffe27a,.3);flashDisc(m.x,m.z,2.6,0xfff2a0,.3);burst(m.x,1.2,m.z,10,0xffe27a,6,.4,6)}}
  if(ar){const k=hbOn('ar')?1:.7;P.shield=Math.min(S.maxHp*.4,P.shield+S.maxHp*.012*k*pw);if(Math.random()<.25)shockRing(P.x,P.z,2.2,0x9fd0ff,.3)}
}
/* assassin Q reacts to the button being held: keyboard, touch button or the skill icon */
const qHeld=()=>!!(keys.q||mv.q);
/* hold-to-glide movement; turns into an attack as soon as an enemy is in reach */
function qRunStep(dt){
  if(!qHeld()||P.dead||P.stunT>0||P.hidden||P.dashT>0){P.qRun=false;return false}
  if(aimMob(12)){P.qRun=false;trySkill('q');return true}
  let dx,dz;
  if(IS_TOUCH||mv.on){const l=mv.on?Math.hypot(mv.x,mv.z):0;if(l>.2){dx=mv.x/l;dz=mv.z/l}else{dx=Math.sin(P.face);dz=Math.cos(P.face)}}
  else{const mx=mouse.gx-P.x,mz=mouse.gz-P.z,l=Math.hypot(mx,mz);if(l<1)return true;dx=mx/l;dz=mz/l}
  const step=effSpd()*2.2*dt;blinkTo(P.x+dx*step,P.z+dz*step);P.face=Math.atan2(dx,dz);
  emit(P.x,1,P.z,0,0,0,.35,0x8a6ad0,0);return true;
}
/* assassin Q is a charge gauge: usable at any charge (spammable), power grows with the charge, a full gauge gets a bonus */
const qCharge=()=>P.cdMax.q>0?clamp(1-P.cd.q/P.cdMax.q,0,1):1;
const qPower=ch=>ch>=1?1.4:.08+.82*ch;
/* returns false when the skill could not be used */
function castFx(sk){
  const atk=effAtk(),a=aimDir(),c={atk,a:{x:a.x,z:a.z},col:sk.col,el:sk.el||null,m:sk.el?1.3:1,sk,charge:sk.fx==='r_q'?qCharge():1};
  const ambush=P.stealth>0&&sk.fx!=='r_q'&&sk.fx!=='r_e';
  if(ambush)c.atk*=2.5;
  if(SK[sk.fx](c)===false)return false;
  if(ambush)P.stealth=0;
  if(c.el==='holy'){P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*.14);shockRing(P.x,P.z,3,sk.col,.5)}
  if(c.el)ringBurst(P.x,.8,P.z,18,sk.col,8,.5);
}
