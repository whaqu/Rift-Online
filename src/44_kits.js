/* ---------------- class kits: 직업마다 다른 전투 시스템 ----------------
   각 기본 직업은 고유 자원/상태를 갖고 Q·E가 그것을 쌓거나 쓴다. 전직 R 스킬도 같은 시스템과 맞물린다(onR).
   판정은 모두 클라이언트(서버는 처치 수만 검증)라 서버 변경은 없다.
   q/e 반환값: false = 발동 안 함(쿨타임 없음), 숫자 = 그 값을 쿨타임으로, 없음 = 기본 쿨타임 */
const kdef=(cls,blurb,sys,desc,q,e)=>Object.assign(CLS[cls],{blurb,sys,sysDesc:desc,q:Object.assign({id:cls+'_q',type:'kit'},q),e:Object.assign({id:cls+'_e',type:'kit'},e)});
kdef('warrior','싸울수록 분노가 차오르는 반격형 전사','분노','때리거나 맞으면 분노가 쌓입니다. Q는 분노를 모두 써서 도는 시간을 늘리고, E로 공격을 받아치면 반격합니다.',
  {name:'회오리 베기',cd:6,col:0xffd24a,icon:'burst'},{name:'반격 태세',cd:9,col:0x6aa8ff,icon:'shield'});
kdef('mage','불 → 얼음 → 번개를 돌려 쓰는 원소 마법사','원소 주기','Q를 쓸 때마다 불 → 얼음 → 번개로 바뀝니다. 얼어붙은 적에게 불·번개를 쓰면 피해가 50% 늘고, E로 순간이동합니다.',
  {name:'원소 폭발',cd:5.5,col:0xff7a2a,icon:'flame'},{name:'점멸',cd:6,col:0x9fe8ff,icon:'dash'});
kdef('archer','시위를 당겨 한 발을 노리고 덫으로 묶는 궁수','집중 조준','Q를 누르고 있으면 위력이 모이고 떼면 발사합니다(버튼 클릭·터치는 자동 발사). 덫에 묶인 적은 50% 더 아픕니다.',
  {name:'강궁',cd:5,col:0x6bffb0,icon:'bow'},{name:'덫 도약',cd:8,col:0xffc96a,icon:'swap'});
kdef('rogue','연계 점수를 모아 급소를 찌르고 그림자에 숨는 도적','연계 점수','공격이 맞을 때마다 점수가 쌓입니다(최대 5). Q는 점수를 써서 한 명에게 큰 피해, E는 은신해 적의 시선을 끊고 다음 공격이 치명타가 됩니다.',
  {name:'급소 찌르기',cd:1.5,col:0xff6bd6,icon:'sword'},{name:'그림자 도약',cd:11,col:0xa07aff,icon:'dash'});
kdef('cleric','성역을 깔고 모은 빛을 심판으로 쏘는 성직자','신성한 빛','성역 안에서 회복하고 적을 태우면 빛이 모입니다. E는 모은 빛을 모두 써서 앞으로 광선을 쏩니다. 성역은 파티원도 회복합니다.',
  {name:'성역',cd:11,col:0xfff2a0,icon:'heart'},{name:'심판의 빛',cd:3,col:0xffe27a,icon:'bolt'});
kdef('lancer','창끝 거리를 지키며 뛰어들고 창을 던지는 창기사','창끝 거리','공격 범위의 끝부분으로 맞히면 피해가 60% 늘어납니다. Q는 지정한 곳으로 도약, E는 창을 던진 뒤 다시 눌러 적을 끌고 회수합니다.',
  {name:'낙하 강타',cd:8,col:0xff9a5a,icon:'arrowup'},{name:'투창',cd:9,col:0xffc08a,icon:'spear'});
kdef('monk','3단 연격을 이어 치고 기를 모아 쏘는 권사','연격과 기','Q는 2초 안에 다시 누르면 정권 → 승룡 → 붕권으로 이어집니다. 연타로 모은 기 구슬(최대 5)을 E로 한꺼번에 쏩니다.',
  {name:'정권',cd:6,col:0xffd27a,icon:'fist'},{name:'기공탄',cd:2,col:0xffe27a,icon:'star'});
kdef('gunner','탄창을 관리하며 쏟아붓는 총잡이','탄창','탄환 12발을 다 쓰면 재장전합니다. 마지막 한 발은 2.5배. Q는 남은 탄을 모두 난사하고, E는 구르며 즉시 장전해 폭발탄을 얻습니다.',
  {name:'난사',cd:6,col:0xffd24a,icon:'volley'},{name:'구르기 장전',cd:7,col:0xff8a3a,icon:'swap'});
kdef('summoner','정령을 거느리고 터뜨리는 소환사','정령','Q로 불·서리·대지 정령을 부릅니다(최대 3). 정령은 알아서 싸우며, 내가 때린 적을 먼저 노립니다. E는 정령을 던져 폭발시킵니다.',
  {name:'정령 부름',cd:4.5,col:0x6bffd0,icon:'people'},{name:'정령 폭주',cd:7,col:0x9fffe8,icon:'burst'});
kdef('darknight','자기 피를 대가로 힘을 끌어내는 암흑기사','피의 대가','체력이 낮을수록 강해집니다(최대 +50%). Q는 체력을 바쳐 베고 맞힌 만큼 회복, E는 마검을 켜고 끄며 켜진 동안 체력이 줄고 검기가 나갑니다.',
  {name:'혈월 베기',cd:4,col:0xff3a6a,icon:'sword'},{name:'마검 해방',cd:1,col:0xa070ff,icon:'flame'});

/* 1차 전직(과 그 각성)의 R이 직업 시스템과 맞물리는 효과 */
const RSYN={
  gladiator:'분노 +40',guardian:'R 직후 반격 태세',pyromancer:'원소를 불로 바꾸고 Q 즉시 사용 가능',cryomancer:'원소를 얼음으로 바꾸고 Q 즉시 사용 가능',
  sniper:'Q 즉시 사용 가능, 다음 강궁은 바로 완충',hunter:'주위에 덫 3개 설치',assassin:'연계 점수 가득',trickster:'2초 은신',priest:'신성한 빛 +40',crusader:'조준한 곳에 성역 생성',
  dragoon:'낙하 강타 즉시 사용 가능',halberdier:'주변 적을 창끝 거리로 끌어옴',brawler:'기 구슬 가득',zenmaster:'8초간 기 구슬 자동 생성',gunslinger:'즉시 장전 + 3초간 탄 소모 없음',grenadier:'장전하고 한 탄창 전부 폭발탄',
  spiritcaller:'정령 3체 즉시 소환',necromancer:'해골 정령 2체 추가 (10초)',reaper:'혈월 베기 즉시 사용 가능',doomknight:'8초간 대가 없는 마검 해방'
};
for(const id in RSYN)if(JOBS[id])JOBS[id].desc+=' · R: '+RSYN[id];
function tier1Of(job){let id=job;for(let i=0;i<3&&JOBS[id]&&JOBS[id].tier!==1&&JOBS[id].parent;i++)id=JOBS[id].parent;return id}

/* ---------- shared helpers ---------- */
const ELS=[{n:'불',col:0xff7a2a},{n:'얼음',col:0x9fe8ff},{n:'번개',col:0xfff2a0}];
const PEER_SANCT=[];
const alive=m=>!m.dead&&!m.spawning;
const valid=m=>!!m&&alive(m)&&MOBS.indexOf(m)>=0;   // for references kept across frames
const rooted=m=>m.freeze>0||m.iceUntil>G.t;          // ghosts (party members) only know their own freezes
const mobsIn=(x,z,r)=>MOBS.filter(m=>alive(m)&&d2(m.x,m.z,x,z)<(r+m.r)*(r+m.r));
function hitList(list,dmg,x,z,kb,o){for(const m of list){const dx=m.x-x,dz=m.z-z,l=Math.hypot(dx,dz)||1;dealMob(m,dmg,Object.assign({kx:dx/l,kz:dz/l,kb},o||{}))}return list.length}
function nearTo(x,z,r,skip){let b=null,bd=r*r;for(const m of MOBS){if(!alive(m)||(skip&&skip.has(m)))continue;const d=d2(m.x,m.z,x,z);if(d<bd){bd=d;b=m}}return b}
/* enemy closest to where the player is aiming, within `range` of the player */
function aimMob(range){const pt=aimPoint(range),m=nearTo(pt.x,pt.z,4.5);if(m&&d2(m.x,m.z,P.x,P.z)<(range+m.r)*(range+m.r))return m;return nearestMob(range)}
function blinkTo(x,z){const d=Math.hypot(x,z);if(d>WORLD_R-2){x*=(WORLD_R-2)/d;z*=(WORLD_R-2)/d}P.x=x;P.z=z;P.vx=P.vz=0;pushOut(P,P.r)}
const boomFx=(x,z,r,col)=>{shockRing(x,z,r+.8,col,.45);flashDisc(x,z,r,col,.35);burst(x,1,z,22,col,9,.55,8)};
function kObj(k,o){entG.add(o);k.objs.push(o);return o}
function kDrop(k,o){if(!o)return;entG.remove(o);const i=k.objs.indexOf(o);if(i>=0)k.objs.splice(i,1);o.traverse&&o.traverse(c=>{if(c.userData&&c.userData.own&&c.material)c.material.dispose()})}
function ringMesh(x,z,r,col,op){const m=new THREE.Mesh(shared.ringG,flatMat(col,op));m.userData.own=1;m.rotation.x=-Math.PI/2;m.position.set(x,.13,z);m.scale.set(r,r,r);return m}
function waveShot(x,z,dx,dz,spd,dmg,col,pierce,life,r,extra){spawnPB(Object.assign({kind:'arrow',x,z,vx:dx*spd,vz:dz*spd,r,dmg,life,pierce,col},extra||{}))}

/* ---------- the kits ---------- */
const KITS={
  warrior:{
    init:()=>({rage:0,calm:0,whirl:null,parry:0}),
    gain(k,n){k.rage=Math.min(100,k.rage+n);k.calm=0},
    onHit(k,n,big){this.gain(k,Math.min(18,n*6)+(big?4:0))},
    onHurt(k){this.gain(k,12)},
    block(k){
      if(k.parry<=0)return false;k.parry=0;
      const r=5.2*S.rangeMul,col=0x6aa8ff;hitList(mobsIn(P.x,P.z,r),effAtk()*3,P.x,P.z,14);for(const m of mobsIn(P.x,P.z,r))freezeMob(m,1.2);
      boomFx(P.x,P.z,r,col);sfx('crit');sfx('boom');cam.shake=Math.max(cam.shake,.6);hitStop(.07);dmgNum(P.x,3.4,P.z,'반격!','info');
      this.gain(k,35);P.cd.e=Math.min(P.cd.e,3);return true;
    },
    q(k){
      const r=k.rage;k.rage=0;k.whirl={t:.8+r/100*2.2,acc:.25,mul:1+r/200};P.spinT=k.whirl.t;sfx('slash');netFx('nova',{x:P.x,z:P.z,r:4.2,c:0xffd24a});
    },
    e(k){k.parry=1.4;shockRing(P.x,P.z,2.6,0x6aa8ff,.4);sfx('card');dmgNum(P.x,3,P.z,'반격 태세','info');netFx('nova',{x:P.x,z:P.z,r:2.6,c:0x6aa8ff})},
    onR(k,j){if(j==='gladiator')this.gain(k,40);else if(j==='guardian')k.parry=1.4},
    tick(k,dt){
      k.calm+=dt;if(k.calm>4)k.rage=Math.max(0,k.rage-10*dt);
      if(k.parry>0){k.parry-=dt;if(Math.random()<dt*30)emit(P.x+rnd(-1,1),rnd(.5,2.2),P.z+rnd(-1,1),0,1,0,.3,0x9fd0ff,0);if(k.parry<=0)this.gain(k,8)}
      const w=k.whirl;if(!w)return;
      w.t-=dt;w.acc+=dt;P.spinT=Math.max(0,w.t);
      if(w.acc>=.25){w.acc-=.25;const r=4.3*S.rangeMul;hitList(mobsIn(P.x,P.z,r),effAtk()*.75*w.mul,P.x,P.z,4);for(const b of EB)if(d2(b.x,b.z,P.x,P.z)<r*r)b.life=0;slashArc(P.x,P.z,G.t*9,r,TAU-.01,0xffd24a,.25);shockRing(P.x,P.z,r,0xffd24a,.3);ringBurst(P.x,1,P.z,14,0xffb04a,10,.3);sfx('slash',.6)}
      if(w.t<=0)k.whirl=null;
    },
    hud:k=>({t:'분노',v:k.rage/100,col:'#ff7a4a',txt:Math.round(k.rage)+(k.parry>0?' · 반격 대기':'')}),
  },
  mage:{
    init:()=>({el:0,zones:[]}),
    basicCol:k=>ELS[k.el].col,
    spellDmg(m,el){return el!==1&&rooted(m)?1.5:1},
    q(k){
      const el=k.el,atk=effAtk(),col=ELS[el].col,pt=aimPoint(15);
      if(el===0){
        const g=glow(col,5,.9);g.position.set(pt.x,22,pt.z);entG.add(g);addFx(.7,t=>{g.position.y=22*(1-t*t)},()=>entG.remove(g));
        telegraph(pt.x,pt.z,4.2,.7,()=>{for(const m of mobsIn(pt.x,pt.z,4.2)){const mul=this.spellDmg(m,0);hitList([m],atk*3.8*mul,pt.x,pt.z,9);burnMob(m,atk*.35)}
          boomFx(pt.x,pt.z,4.2,col);pillar(pt.x,pt.z,col,18,.5);sfx('boom');cam.shake=Math.max(cam.shake,.6);
          if(P.kit===k)k.zones.push({x:pt.x,z:pt.z,r:3.6,t:3,acc:0,kind:'fire',o:kObj(k,ringMesh(pt.x,pt.z,3.6,col,.7))})},col);
      }else if(el===1){
        for(const m of mobsIn(pt.x,pt.z,5)){hitList([m],atk*1.8,pt.x,pt.z,2);freezeMob(m,2.4)}
        boomFx(pt.x,pt.z,5,col);sfx('ice');k.zones.push({x:pt.x,z:pt.z,r:5,t:3,acc:0,kind:'ice',o:kObj(k,ringMesh(pt.x,pt.z,5,col,.7))});
      }else{
        let from={x:P.x,z:P.z},cur=nearTo(pt.x,pt.z,9)||nearestMob(15);const used=new Set();
        for(let i=0;cur&&i<7;i++){used.add(cur);boltFx(from.x,from.z,cur.x,cur.z,col);dealMob(cur,atk*2.3*this.spellDmg(cur,2),{noKb:true});from=cur;cur=nearTo(from.x,from.z,10,used)}
        sfx('crit');sfx('boom');cam.shake=Math.max(cam.shake,.4);
      }
      sfx('magic');netFx('ground',{x:pt.x,z:pt.z,r:4.5,c:col});k.el=(el+1)%3;
    },
    e(k){
      const el=k.el,col=ELS[el].col,atk=effAtk(),x0=P.x,z0=P.z;
      let dx=P.ix,dz=P.iz;if(!dx&&!dz){const a=aimDir();dx=a.x;dz=a.z}const l=Math.hypot(dx,dz)||1;
      blinkTo(P.x+dx/l*8,P.z+dz/l*8);P.iframes=Math.max(P.iframes,.4);
      for(const m of mobsIn(x0,z0,3.8)){hitList([m],atk*(el===2?2.2:1.2),x0,z0,6);if(el===0)burnMob(m,atk*.3);if(el===1)freezeMob(m,2)}
      boomFx(x0,z0,3.8,col);burst(P.x,1.2,P.z,18,col,6,.45,0);sfx('magic');netFx('nova',{x:x0,z:z0,r:3.8,c:col});
    },
    onR(k,j){if(j==='pyromancer'){k.el=0;P.cd.q=0}else if(j==='cryomancer'){k.el=1;P.cd.q=0}},
    tick(k,dt){
      for(let i=k.zones.length-1;i>=0;i--){const z=k.zones[i];z.t-=dt;z.acc+=dt;
        if(Math.random()<dt*30){const a=rnd(0,TAU),r=Math.sqrt(Math.random())*z.r;emit(z.x+Math.cos(a)*r,.3,z.z+Math.sin(a)*r,0,rnd(1,3),0,.5,z.kind==='fire'?0xff7a2a:0xbff2ff,0)}
        if(z.acc>=.5){z.acc-=.5;for(const m of mobsIn(z.x,z.z,z.r)){dealMob(m,effAtk()*(z.kind==='fire'?.45:.25),{noKb:true,noProc:true});if(z.kind==='ice')freezeMob(m,.7)}}
        if(z.t<=0){kDrop(k,z.o);k.zones.splice(i,1)}}
    },
    hud:k=>({t:'원소',v:1,col:'#'+ELS[k.el].col.toString(16).padStart(6,'0'),txt:'다음 Q: '+ELS[k.el].n}),
    labels:k=>({q:{name:['메테오','서리 장막','연쇄 번개'][k.el],col:ELS[k.el].col,icon:['flame','snow','bolt'][k.el]}}),
  },
  archer:{
    init:()=>({charge:null,traps:[],ready:false}),
    canAttack:k=>!k.charge,
    spdMul:k=>k.charge?.5:1,
    q(k){k.charge={t:k.ready?1.3:0,held:!!keys.q};k.ready=false;sfx('card');return false},
    fire(k){
      const c=Math.min(1,k.charge.t/1.3),a=aimDir(),full=c>=1,atk=effAtk();k.charge=null;P.face=Math.atan2(a.x,a.z);
      waveShot(P.x+a.x,P.z+a.z,a.x,a.z,40+40*c,atk*(1.5+5*c),full?0xfff2a0:0x6bffb0,Math.round(3+12*c)+S.pierce,.9,.5+.6*c,{rootBonus:1.5});
      P.atkAnim=0;P.atkDur=.3;shockRing(P.x,P.z,1.5+2*c,0x6bffb0,.3);burst(P.x+a.x,1.3,P.z+a.z,Math.round(6+20*c),0x6bffb0,6,.4,0);sfx('shot');if(full){sfx('crit');cam.shake=Math.max(cam.shake,.45)}
      netFx('shot',{x:P.x+a.x,z:P.z+a.z,vx:a.x*60,vz:a.z*60,v:'arrow',c:0x6bffb0});
      P.cd.q=P.cdMax.q=CLS.archer.q.cd*(1-S.cdr);
    },
    trap(k,x,z){if(k.traps.length>=3)kDrop(k,k.traps.shift().o);const o=grp(x,0,z);const r=ringMesh(0,0,1.5,0xffc96a,.85);r.position.set(0,.14,0);o.add(r);o.add(glowS(0xffc96a,1.4,.8));k.traps.push({x,z,t:20,o:kObj(k,o)})},
    e(k){
      const a=aimDir();this.trap(k,P.x,P.z);P.dashDX=-a.x;P.dashDZ=-a.z;P.dashT=.17;P.dashSp=38;P.dashHit=null;P.iframes=Math.max(P.iframes,.3);sfx('dash');
    },
    onR(k,j){if(j==='sniper'){P.cd.q=0;k.ready=true}else if(j==='hunter'){for(let i=0;i<3;i++){const an=P.face+i*TAU/3;this.trap(k,P.x+Math.sin(an)*3.5,P.z+Math.cos(an)*3.5)}}},
    tick(k,dt){
      if(k.charge){const c=k.charge;c.t+=dt;if(Math.random()<dt*(10+40*Math.min(1,c.t/1.3)))emit(P.x+rnd(-1,1),rnd(.6,2),P.z+rnd(-1,1),0,rnd(.5,2),0,.35,c.t>=1.3?0xfff2a0:0x6bffb0,0);
        if(c.held?!keys.q:c.t>=1.3)this.fire(k)}
      for(let i=k.traps.length-1;i>=0;i--){const t=k.traps[i];t.t-=dt;
        if(nearTo(t.x,t.z,2.2)){for(const m of mobsIn(t.x,t.z,3.2)){hitList([m],effAtk()*1.5,t.x,t.z,0);freezeMob(m,2.6)}boomFx(t.x,t.z,3.2,0xffc96a);sfx('ice');t.t=0}
        if(t.t<=0){kDrop(k,t.o);k.traps.splice(i,1)}}
    },
    hud:k=>({t:'조준',v:k.charge?Math.min(1,k.charge.t/1.3):0,col:k.charge&&k.charge.t>=1.3?'#fff2a0':'#6bffb0',txt:k.charge?(k.charge.t>=1.3?'완충!':'당기는 중'):'덫 '+k.traps.length+'/3'}),
  },
  rogue:{
    init:()=>({cp:0,ambush:false}),
    gain(k,n){k.cp=Math.min(5,k.cp+n)},
    onHit(k){this.gain(k,1)},
    basicMod(k){return k.ambush?{mul:1.5,o:{crit:true}}:null},
    reveal(k){k.ambush=false;P.stealth=0},
    afterAttack(k){if(P.stealth>0||k.ambush)this.reveal(k)},
    q(k){
      if(k.cp<1){UI.toast('연계 점수가 없습니다');return false}
      const m=aimMob(7);if(!m){UI.toast('가까운 대상이 없습니다');return false}
      const n=k.cp,dx=m.x-P.x,dz=m.z-P.z,l=Math.hypot(dx,dz)||1;
      blinkTo(m.x-dx/l*(m.r+.9),m.z-dz/l*(m.r+.9));P.face=Math.atan2(dx,dz);
      const amb=k.ambush;this.reveal(k);k.cp=0;
      dealMob(m,effAtk()*(1+1.3*n)*(n>=5?1.3:1)*(amb?1.5:1),{kx:dx/l,kz:dz/l,kb:8,big:n>=4,crit:amb||n>=5?true:undefined});
      slashArc(m.x,m.z,P.face+1.6,3,2.2,0xff6bd6,.25);slashArc(m.x,m.z,P.face-1.6,3,2.2,0xff6bd6,.25);sfx('slash');P.iframes=Math.max(P.iframes,.25);netFx('slash',{x:m.x,z:m.z,f:P.face,r:3,a:2.2,c:0});
    },
    e(k){
      const m=aimMob(11);
      burst(P.x,1.2,P.z,16,0xa07aff,6,.5,0);
      if(m){const dx=m.x-P.x,dz=m.z-P.z,l=Math.hypot(dx,dz)||1;blinkTo(m.x+dx/l*(m.r+1.2),m.z+dz/l*(m.r+1.2));P.face=Math.atan2(-dx,-dz)}
      else{const a=aimDir();blinkTo(P.x+a.x*7,P.z+a.z*7)}
      P.stealth=2.5;k.ambush=true;this.gain(k,2);burst(P.x,1.2,P.z,16,0xa07aff,6,.5,0);sfx('dash');
    },
    onR(k,j){if(j==='assassin')k.cp=5;else if(j==='trickster'){P.stealth=2;k.ambush=true}},
    tick(k,dt){if(P.stealth>0){P.stealth-=dt;if(Math.random()<dt*18)emit(P.x+rnd(-.5,.5),rnd(.2,1.6),P.z+rnd(-.5,.5),0,.8,0,.45,0x8a6ad0,0);if(P.stealth<=0)k.ambush=false}},
    hud:k=>({t:'연계',pips:k.cp,max:5,col:'#ff6bd6',txt:P.stealth>0?'은신':''}),
    off:k=>({q:k.cp<1}),
  },
  cleric:{
    init:()=>({light:0,zones:[]}),
    gain(k,n){k.light=Math.min(100,k.light+n)},
    onHit(k){this.gain(k,2)},
    sanct(k,x,z,r,dur){const o=grp(x,0,z);const a=ringMesh(0,0,r,0xfff2a0,.9),b=ringMesh(0,0,r*.55,0xffffff,.5);a.position.set(0,.13,0);b.position.set(0,.14,0);o.add(a);o.add(b);
      k.zones.push({x,z,r,t:dur,acc:.5,o:kObj(k,o)});pillar(x,z,0xfff2a0,9,.6);netFx('sanct',{x,z,r,d:dur});sfx('level')},
    q(k){const pt=aimPoint(8);this.sanct(k,pt.x,pt.z,4.8,6)},
    e(k){
      if(k.light<25){UI.toast('빛이 25 이상 필요합니다');return false}
      const p=k.light,a=aimDir(),len=17,w=1.4+p/100*1.2,atk=effAtk();k.light=0;P.face=Math.atan2(a.x,a.z);
      const list=MOBS.filter(m=>{if(!alive(m))return false;const dx=m.x-P.x,dz=m.z-P.z,al=dx*a.x+dz*a.z;return al>-1&&al<len&&Math.abs(dx*a.z-dz*a.x)<w+m.r});
      for(const m of list)dealMob(m,atk*(2+p/100*7),{kx:a.x,kz:a.z,kb:10,big:p>=60});
      for(let i=1;i<len;i+=1.6){const x=P.x+a.x*i,z=P.z+a.z*i;flashDisc(x,z,w,0xfff2a0,.35);burst(x,1,z,5,0xfff2a0,4,.5,-2)}
      boltFx(P.x,P.z,P.x+a.x*len,P.z+a.z*len,0xffffff);healP(Math.round(S.maxHp*p/100*.2));sfx('crit');sfx('boom');cam.shake=Math.max(cam.shake,.3+p/200);
      netFx('shot',{x:P.x,z:P.z,vx:a.x*45,vz:a.z*45,v:'orb',c:0xfff2a0});
    },
    onR(k,j){if(j==='priest')this.gain(k,40);else if(j==='crusader'){const pt=aimPoint(10);this.sanct(k,pt.x,pt.z,4,4)}},
    tick(k,dt){
      for(let i=k.zones.length-1;i>=0;i--){const z=k.zones[i];z.t-=dt;z.acc+=dt;
        if(Math.random()<dt*22){const a=rnd(0,TAU),r=Math.sqrt(Math.random())*z.r;emit(z.x+Math.cos(a)*r,.2,z.z+Math.sin(a)*r,0,rnd(1.5,3),0,.6,0xfff2a0,0)}
        if(z.acc>=.5){z.acc-=.5;const list=mobsIn(z.x,z.z,z.r);for(const m of list)dealMob(m,effAtk()*.55,{noKb:true,noProc:true});if(list.length)this.gain(k,3);
          if(d2(P.x,P.z,z.x,z.z)<z.r*z.r){healP(Math.max(1,Math.round(S.maxHp*.03)));this.gain(k,4)}}
        if(z.t<=0){kDrop(k,z.o);k.zones.splice(i,1)}}
    },
    hud:k=>({t:'빛',v:k.light/100,col:'#ffe27a',txt:Math.round(k.light)+''}),
    off:k=>({e:k.light<25}),
  },
  lancer:{
    init:()=>({spear:null}),
    basicMod(k,e,dist,range){if(dist+e.r*.5<range*.65)return null;shockRing(e.x,e.z,1.4,0xffe0c0,.18);return{mul:1.6,o:{big:true}}},
    q(k){
      const pt=aimPoint(11);P.leap={t:0,dur:.45,x0:P.x,z0:P.z,x1:pt.x,z1:pt.z,h:4.5,done:()=>{
        for(const m of mobsIn(P.x,P.z,4.6*S.rangeMul)){hitList([m],effAtk()*3,P.x,P.z,10,{big:true});freezeMob(m,.8)}
        boomFx(P.x,P.z,4.6*S.rangeMul,0xff9a5a);sfx('boom');cam.shake=Math.max(cam.shake,.7);netFx('nova',{x:P.x,z:P.z,r:4.6,c:0xff9a5a})}};
      P.iframes=Math.max(P.iframes,.6);sfx('dash');
    },
    e(k){
      const s=k.spear;
      if(s){if(s.state!=='back'){s.state='back';s.hit=new Set();sfx('dash');return CLS.lancer.e.cd}return false}
      const a=aimDir(),o=grp(P.x,1.2,P.z);mesh(GEO.arrow,EM(0xffd0a0,.9),0,0,0,o,false).scale.set(2,2,2);mesh(GEO.head,EM(0xff9a5a,1),0,0,1.7,o,false).scale.set(1.6,1.6,1.6);o.add(glowS(0xffc08a,2.6,.8));o.rotation.y=Math.atan2(a.x,a.z);
      k.spear={x:P.x,z:P.z,dx:a.x,dz:a.z,gone:0,t:0,state:'out',hit:new Set(),o:kObj(k,o)};sfx('shot');netFx('shot',{x:P.x,z:P.z,vx:a.x*34,vz:a.z*34,v:'arrow',c:0xffc08a});return 0;
    },
    onR(k,j){
      if(j==='dragoon')P.cd.q=0;
      else if(j==='halberdier'){const tip=CLS.lancer.range*S.rangeMul*.85;for(const m of mobsIn(P.x,P.z,10)){const dx=P.x-m.x,dz=P.z-m.z,d=Math.hypot(dx,dz)||1;if(d>tip)dealMob(m,effAtk()*.3,{kx:dx,kz:dz,kb:(d-tip)*3.2,noProc:true})}shockRing(P.x,P.z,10,0xffc08a,.4)}
    },
    tick(k,dt){
      const s=k.spear;if(!s)return;s.t+=dt;
      if(s.state==='out'){const st=34*dt;s.x+=s.dx*st;s.z+=s.dz*st;s.gone+=st;if(s.gone>=13){s.state='stuck';s.t=0}}
      else if(s.state==='stuck'){if(Math.random()<dt*12)emit(s.x,rnd(.3,1.8),s.z,0,1,0,.4,0xffc08a,0);if(s.t>5){s.state='back';s.hit=new Set();P.cd.e=P.cdMax.e=CLS.lancer.e.cd*(1-S.cdr)}}
      else{const dx=P.x-s.x,dz=P.z-s.z,d=Math.hypot(dx,dz);if(d<1.4){kDrop(k,s.o);k.spear=null;return}s.x+=dx/d*Math.min(d,40*dt);s.z+=dz/d*Math.min(d,40*dt);s.o.rotation.y=Math.atan2(-dx,-dz)}
      s.o.position.set(s.x,1.2,s.z);
      if(s.state==='stuck')return;
      for(const m of MOBS){if(!alive(m)||s.hit.has(m)||d2(m.x,m.z,s.x,s.z)>(m.r+1.3)*(m.r+1.3))continue;s.hit.add(m);
        if(s.state==='out')dealMob(m,effAtk()*1.8,{kx:s.dx,kz:s.dz,kb:2});
        else{const px=P.x-m.x,pz=P.z-m.z,d=Math.hypot(px,pz)||1;dealMob(m,effAtk()*2.2,{kx:px/d,kz:pz/d,kb:Math.min(16,d*1.6)})}}
    },
    hud:k=>({t:'투창',v:k.spear?(k.spear.state==='stuck'?1-k.spear.t/5:1):0,col:'#ffc08a',txt:k.spear?'E: 회수':'창끝으로 맞히면 +60%'}),
    labels:k=>({e:k.spear?{name:'창 회수',col:0xff6a3a,icon:'swap'}:null}),
  },
  monk:{
    init:()=>({orbs:0,hits:0,stage:0,win:0,lock:0,regen:0,racc:0,shots:[],balls:[]}),
    gain(k,n){k.orbs=Math.min(5,k.orbs+n)},
    onHit(k){if(++k.hits>=2){k.hits=0;this.gain(k,1)}},
    q(k){
      if(k.lock>0)return false;
      const st=k.stage,a=aimDir(),f=Math.atan2(a.x,a.z),atk=effAtk();P.face=f;P.atkAnim=0;P.atkDur=.28;k.lock=.22;let n=0;
      if(st===0){P.vx+=a.x*22;P.vz+=a.z*22;const list=mobsIn(P.x+a.x*2,P.z+a.z*2,2.6);n=hitList(list,atk*1.5,P.x,P.z,6);slashArc(P.x,P.z,f,3.6,1.4,0xffd27a,.22);sfx('slash')}
      else if(st===1){const list=mobsIn(P.x+a.x*2,P.z+a.z*2,3);n=hitList(list,atk*1.9,P.x,P.z,3);for(const m of list)freezeMob(m,1.1);pillar(P.x+a.x*2,P.z+a.z*2,0xffb04a,8,.45);burst(P.x+a.x*2,1,P.z+a.z*2,18,0xffb04a,8,.5,12);sfx('hit');sfx('slash')}
      else{const x=P.x+a.x*3,z=P.z+a.z*3;n=hitList(mobsIn(x,z,4.4*S.rangeMul),atk*3.8,P.x,P.z,18,{big:true});boomFx(x,z,4.4*S.rangeMul,0xff8a3a);sfx('boom');cam.shake=Math.max(cam.shake,.65);hitStop(.06)}
      if(n)this.gain(k,1);netFx('slash',{x:P.x,z:P.z,f,r:4,a:1.6,c:1});
      if(st<2){k.stage=st+1;k.win=2;return 0}
      k.stage=0;k.win=0;
    },
    e(k){
      if(k.orbs<1){UI.toast('기 구슬이 없습니다');return false}
      const n=k.orbs,a=aimDir(),base=Math.atan2(a.x,a.z),first=aimMob(15);k.orbs=0;
      for(let i=0;i<n;i++){const an=base+(i-(n-1)/2)*.5,o=grp(P.x,1.4,P.z);o.add(glowS(0xffe27a,2,.95));k.shots.push({x:P.x,z:P.z,vx:Math.sin(an)*18,vz:Math.cos(an)*18,t:0,m:first,full:n>=5,o:kObj(k,o)})}
      sfx('magic');netFx('nova',{x:P.x,z:P.z,r:3,c:0xffe27a});
    },
    onR(k,j){if(j==='brawler')k.orbs=5;else if(j==='zenmaster')k.regen=8},
    tick(k,dt){
      k.lock-=dt;if(k.win>0){k.win-=dt;if(k.win<=0&&k.stage){k.stage=0;P.cd.q=P.cdMax.q=CLS.monk.q.cd*(1-S.cdr)}}
      if(k.regen>0){k.regen-=dt;k.racc+=dt;if(k.racc>=1){k.racc-=1;this.gain(k,1)}}
      while(k.balls.length<k.orbs){const o=glowS(0xffe27a,1,.95);k.balls.push(kObj(k,o))}
      while(k.balls.length>k.orbs)kDrop(k,k.balls.pop());
      k.balls.forEach((o,i)=>{const an=G.t*2.4+i*TAU/Math.max(1,k.balls.length);o.position.set(P.x+Math.sin(an)*1.4,1.5,P.z+Math.cos(an)*1.4)});
      for(let i=k.shots.length-1;i>=0;i--){const s=k.shots[i];s.t+=dt;
        if(!valid(s.m))s.m=nearTo(s.x,s.z,14);
        if(s.m&&s.t>.1){const dx=s.m.x-s.x,dz=s.m.z-s.z,d=Math.hypot(dx,dz)||1,tr=Math.min(1,dt*9);s.vx=lerp(s.vx,dx/d*32,tr);s.vz=lerp(s.vz,dz/d*32,tr)}
        s.x+=s.vx*dt;s.z+=s.vz*dt;s.o.position.set(s.x,1.4,s.z);emit(s.x,1.4,s.z,0,0,0,.2,0xffd27a,0);
        const hit=nearTo(s.x,s.z,1.1);
        if(hit){if(s.full)explodeAt(s.x,s.z,2.6,effAtk()*.5,0xffe27a);dealMob(hit,effAtk()*1.3,{kx:s.vx,kz:s.vz,kb:4})}
        if(hit||s.t>1.4){kDrop(k,s.o);k.shots.splice(i,1)}}
    },
    hud:k=>({t:'기',pips:k.orbs,max:5,col:'#ffd27a',txt:k.stage?'연격 '+(k.stage+1)+'타 준비':''}),
    labels:k=>({q:{name:['정권','승룡','붕권'][k.stage],col:[0xffd27a,0xffb04a,0xff6a3a][k.stage],icon:['fist','arrowup','burst'][k.stage]}}),
    off:k=>({e:k.orbs<1}),
  },
  gunner:{
    MAG:12,
    init:()=>({ammo:12,reload:0,expl:0,burst:0,bacc:0,free:0}),
    canAttack:k=>k.reload<=0&&k.burst<=0&&k.ammo>0,
    startReload(k){if(k.reload<=0){k.reload=1.4;sfx('card')}},
    /* damage multiplier and extras for the next basic bullet */
    shot(k){
      const last=k.ammo===1&&k.free<=0,o={mul:last?3:1.2};
      if(k.expl>0){k.expl--;o.expl=1;o.col=0xff8a3a}
      if(last)o.col=0xffffff;
      if(k.free<=0)k.ammo--;if(k.ammo<=0)this.startReload(k);return o;
    },
    q(k){if(k.reload>0||k.ammo<1){UI.toast('재장전 중입니다');return false}k.burst=k.ammo;k.bacc=.05},
    reloadNow(k){k.ammo=this.MAG;k.reload=0;k.burst=0},
    e(k){
      let dx=P.ix,dz=P.iz;if(!dx&&!dz){const a=aimDir();dx=-a.x;dz=-a.z}const l=Math.hypot(dx,dz)||1;
      P.dashDX=dx/l;P.dashDZ=dz/l;P.dashT=.18;P.dashSp=40;P.dashHit=null;P.iframes=Math.max(P.iframes,.35);
      this.reloadNow(k);k.expl=Math.max(k.expl,4);sfx('dash');sfx('card');burst(P.x,.6,P.z,12,0xff8a3a,5,.35,0);
    },
    onR(k,j){if(j==='gunslinger'){this.reloadNow(k);k.free=3}else if(j==='grenadier'){this.reloadNow(k);k.expl=this.MAG}},
    tick(k,dt){
      if(k.free>0)k.free-=dt;
      if(k.reload>0){k.reload-=dt;if(k.reload<=0){k.ammo=this.MAG;k.reload=0;sfx('equip',.6)}}
      if(k.burst>0){k.bacc+=dt;while(k.bacc>=.05&&k.burst>0){k.bacc-=.05;k.burst--;
        const a=aimDir(),an=Math.atan2(a.x,a.z)+rnd(-.14,.14),dx=Math.sin(an),dz=Math.cos(an),s=this.shot(k);
        waveShot(P.x+dx,P.z+dz,dx,dz,55,effAtk()*.95*s.mul,s.col||0xffd24a,2+S.pierce,.65,.4,{expl:s.expl});sfx('shot',.6);netFx('shot',{x:P.x+dx,z:P.z+dz,vx:dx*55,vz:dz*55,v:'arrow',c:0xffd24a})}
        if(k.burst<=0&&k.ammo<this.MAG&&k.free<=0)this.startReload(k)}
    },
    hud:k=>({t:'탄창',pips:k.ammo,max:12,col:k.expl>0?'#ff8a3a':'#ffe27a',txt:k.reload>0?'재장전…':k.free>0?'무한 탄':k.expl>0?'폭발탄 '+k.expl:k.ammo+'발'}),
    off:k=>({q:k.reload>0}),
  },
  summoner:{
    TYPES:[{n:'불',col:0xff7a4a},{n:'서리',col:0x9fe8ff},{n:'대지',col:0xc8a860},{n:'해골',col:0xd0c0ff}],
    init:()=>({spirits:[],next:0,mark:null,bolts:[]}),
    onHit(k,n,big,m){if(m)k.mark=m},
    spawn(k,type,life){
      const T=this.TYPES[type],o=grp(P.x,1.8,P.z);mesh(GEO.orb,EM(T.col,1.4),0,0,0,o,false).scale.setScalar(.8);o.add(glowS(T.col,2.6,.85));
      k.spirits.push({type,t:life,cd:rnd(.2,.8),x:P.x,z:P.z,o:kObj(k,o)});burst(P.x,1.6,P.z,14,T.col,5,.5,0);
    },
    own:k=>k.spirits.filter(s=>s.type<3),
    q(k){
      const own=this.own(k);
      if(own.length>=3){const old=own.reduce((a,b)=>a.t<b.t?a:b);kDrop(k,old.o);k.spirits.splice(k.spirits.indexOf(old),1)}
      this.spawn(k,k.next,18);k.next=(k.next+1)%3;sfx('magic');netFx('nova',{x:P.x,z:P.z,r:2.5,c:0x6bffd0});
    },
    e(k){
      if(!k.spirits.length){UI.toast('정령이 없습니다');return false}
      const pt=aimPoint(14),atk=effAtk();let i=0;
      for(const s of k.spirits.splice(0)){
        const T=this.TYPES[s.type],sx=s.x,sz=s.z,tx=pt.x+(i?rnd(-2.2,2.2):0),tz=pt.z+(i?rnd(-2.2,2.2):0),o=s.o;i++;
        addFx(.28,t=>{o.position.set(lerp(sx,tx,t),1.8+Math.sin(t*Math.PI)*3,lerp(sz,tz,t))},()=>{
          kDrop(k,o);
          for(const m of mobsIn(tx,tz,3.6)){hitList([m],atk*2.3,tx,tz,s.type===2?16:6);if(s.type===0)burnMob(m,atk*.35);if(s.type===1)freezeMob(m,1.8)}
          boomFx(tx,tz,3.6,T.col);sfx('boom');cam.shake=Math.max(cam.shake,.35)});
      }
      netFx('ground',{x:pt.x,z:pt.z,r:4,c:0x9fffe8});
    },
    onR(k,j){
      if(j==='spiritcaller'){while(this.own(k).length<3){this.spawn(k,k.next,18);k.next=(k.next+1)%3}for(const s of k.spirits)s.t=Math.max(s.t,18)}
      else if(j==='necromancer'){const n=k.spirits.filter(s=>s.type===3).length;for(let i=n;i<2;i++)this.spawn(k,3,10)}
    },
    tick(k,dt){
      if(k.mark&&!valid(k.mark))k.mark=null;
      for(let i=k.spirits.length-1;i>=0;i--){const s=k.spirits[i];s.t-=dt;s.cd-=dt;
        if(s.t<=0){burst(s.x,1.8,s.z,8,this.TYPES[s.type].col,3,.4,0);kDrop(k,s.o);k.spirits.splice(i,1);continue}
        const an=G.t*1.3+i*TAU/Math.max(1,k.spirits.length),f=1-Math.exp(-dt*6);s.x=lerp(s.x,P.x+Math.sin(an)*2.3,f);s.z=lerp(s.z,P.z+Math.cos(an)*2.3,f);s.o.position.set(s.x,1.8+Math.sin(G.t*3+i)*.25,s.z);
        if(s.cd<=0&&!P.dead&&!inTown(P.x,P.z)){
          const m=k.mark&&d2(k.mark.x,k.mark.z,P.x,P.z)<15*15?k.mark:nearTo(P.x,P.z,11);
          if(m){s.cd=1.15;const T=this.TYPES[s.type];boltFx(s.x,s.z,m.x,m.z,T.col);dealMob(m,effAtk()*.55,{noProc:true,noKb:s.type!==2,kx:m.x-s.x,kz:m.z-s.z,kb:4});if(s.type===0)burnMob(m,effAtk()*.15);if(s.type===1)freezeMob(m,.35)}}
      }
    },
    hud:function(k){return{t:'정령',pips:k.spirits.length,max:Math.max(3,k.spirits.length),col:'#6bffd0',txt:'다음: '+this.TYPES[k.next].n}},
    off:k=>({e:!k.spirits.length}),
  },
  darknight:{
    init:()=>({form:false,free:0}),
    atkMul(k){return(1+.5*clamp(1-P.hp/S.maxHp,0,1))*(k.form?1.25:1)},
    afterAttack(k,a){if(!k.form)return;waveShot(P.x+a.x*1.5,P.z+a.z*1.5,a.x,a.z,30,effAtk()*.6,0xa070ff,4+S.pierce,.45,1.1);netFx('shot',{x:P.x,z:P.z,vx:a.x*30,vz:a.z*30,v:'orb',c:0xa070ff})},
    q(k){
      const cost=Math.min(Math.round(P.hp*.1),Math.max(0,Math.ceil(P.hp)-1));P.hp-=cost;if(cost>0)dmgNum(P.x,3,P.z,'-'+cost,'hurt');
      const a=aimDir(),f=Math.atan2(a.x,a.z),r=6.4*S.rangeMul;P.face=f;
      const list=mobsIn(P.x,P.z,r).filter(m=>{const dx=m.x-P.x,dz=m.z-P.z,d=Math.hypot(dx,dz);return d<2||Math.abs(angDiff(f,Math.atan2(dx,dz)))<1.5});
      hitList(list,effAtk()*2.6,P.x,P.z,10,{big:true});
      if(list.length)healP(Math.round(S.maxHp*Math.min(.24,.04*list.length)));
      slashArc(P.x,P.z,f,r,3,0xff3a6a,.35);slashArc(P.x,P.z,f,r*.75,3,0xa070ff,.3);sfx('slash');sfx('boom');cam.shake=Math.max(cam.shake,.5);netFx('slash',{x:P.x,z:P.z,f,r,a:3,c:1});
    },
    e(k){
      if(!k.form&&P.hp<S.maxHp*.2){UI.toast('체력이 20% 이상이어야 합니다');return false}
      k.form=!k.form;k.free=0;shockRing(P.x,P.z,4,0xa070ff,.45);if(k.form)pillar(P.x,P.z,0xa070ff,8,.5);sfx(k.form?'level':'card');netFx('nova',{x:P.x,z:P.z,r:4,c:0xa070ff});
    },
    onR(k,j){if(j==='reaper')P.cd.q=0;else if(j==='doomknight'){k.form=true;k.free=8}},
    tick(k,dt){
      if(!k.form)return;
      if(inTown(P.x,P.z)){k.form=false;k.free=0;return}
      if(Math.random()<dt*26)emit(P.x+rnd(-.7,.7),rnd(.2,2),P.z+rnd(-.7,.7),0,rnd(1,2.5),0,.45,Math.random()<.5?0xa070ff:0xff3a6a,0);
      if(k.free>0){k.free-=dt;if(k.free<=0)k.form=false;return}
      P.hp-=S.maxHp*.025*dt;if(P.hp<=S.maxHp*.15){P.hp=Math.max(1,P.hp);k.form=false;UI.toast('체력이 부족해 마검이 봉인됩니다')}
    },
    hud(k){return{t:'어둠',v:clamp((this.atkMul(k)/(k.form?1.25:1)-1)/.5,0,1),col:k.form?'#ff3a6a':'#a070ff',txt:'위력 +'+Math.round((this.atkMul(k)-1)*100)+'%'+(k.form?' · 마검':'')}},
    labels:k=>({e:k.form?{name:'마검 봉인',col:0xff3a6a,icon:'close'}:null}),
  }
};

/* ---------- glue used by player / combat code ---------- */
function kitReset(){
  if(P){if(P.kit)for(const o of P.kit.objs.splice(0))entG.remove(o);P.kit=null;P.stealth=0;P.leap=null;P.spinT=0}
}
function kit(){
  if(!P||!S)return null;
  if(!P.kit||P.kit.cls!==S.cls){kitReset();P.kit=Object.assign({cls:S.cls,objs:[]},KITS[S.cls].init())}
  return P.kit;
}
function kitCall(fn,...a){const k=kit();if(!k)return undefined;const K=KITS[k.cls];return K[fn]?K[fn](k,...a):undefined}
function kitCanAttack(){return !P.leap&&kitCall('canAttack')!==false}
function kitAtkMul(){return(P&&P.kit&&KITS[P.kit.cls].atkMul)?KITS[P.kit.cls].atkMul(P.kit):1}
function kitTick(dt){
  if(P.dead)return;
  kitCall('tick',dt);
  for(let i=PEER_SANCT.length-1;i>=0;i--){const z=PEER_SANCT[i];z.t-=dt;z.acc+=dt;if(z.acc>=.5){z.acc-=.5;if(d2(P.x,P.z,z.x,z.z)<z.r*z.r&&P.hp<S.maxHp)healP(Math.max(1,Math.round(S.maxHp*.02)))}if(z.t<=0)PEER_SANCT.splice(i,1)}
}
function kitOnR(){const k=kit();if(k)KITS[k.cls].onR(k,tier1Of(SES.pf.job))}

/* ---------- HUD: class gauge + dynamic skill names ---------- */
function kitHud(){
  const el=$('cgauge');if(!el||!P)return;const k=kit(),K=KITS[k.cls],h=K.hud(k);
  let body;
  if(h.pips!=null){body='<span class="pips">';for(let i=0;i<h.max;i++)body+='<i'+(i<h.pips?' style="background:'+h.col+';box-shadow:0 0 6px '+h.col+'"':'')+'></i>';body+='</span>'}
  else body='<span class="cgbar"><i style="width:'+Math.round(h.v*100)+'%;background:'+h.col+'"></i></span>';
  const html='<b style="color:'+h.col+'">'+h.t+'</b>'+body+'<small>'+(h.txt||'')+'</small>';
  if(el._h!==html){el._h=html;el.innerHTML=html}
  const lb=K.labels?K.labels(k):{},off=K.off?K.off(k):{};
  for(const slot of['q','e']){
    const b=$('sk-'+slot);if(!b)continue;const sk=lb[slot]||CLS[k.cls][slot],key=k.cls+sk.name;
    b.classList.toggle('nores',!!off[slot]);
    if(b._k!==key){b._k=key;b.querySelector('.nm').textContent=sk.name;b.querySelector('.ic0').innerHTML=skIcon(sk,30);const tb=$('tb-'+slot),ti=tb&&tb.querySelector('.ic0');if(ti)ti.innerHTML=skIcon(sk,28)}
  }
}
