/* ---------------- hidden classes (히든 클래스) ----------------
   An account keeps its base class and 2nd job; one hidden class can be learned on top and swapped on and off anywhere.
   To add one: add an entry to HIDDEN (skills = [Q,E,R,F] with SK functions) and a row to the server table rw_hidden_class.
   Story: 천사 is the messenger of heaven; 대천사 and 타락천사 were once brothers in arms and are now rivals (equal strength). */
const HIDDEN_LV=99,HIDDEN_DROP=.0005,HIDDEN_DG='sky',ARCH_SYN={atk:1.3,cd:.85,ult:4};
const HIDDEN={
  angel:{name:'천사',item:'hc_angel',itemName:'천사의 서사',col:'#fff4c2',
    story:'천상의 전령. 두 강자의 싸움 사이에서 다친 이들을 돌봅니다.',
    m:{atk:1.4,hp:1.4,armor:.08,regen:.015,aps:1.1},
    skills:[sd('h_an_q','빛의 깃',7,0xfff4c2,'volley','깃털 7개를 부채꼴로 날립니다. 맞힌 수만큼 회복합니다.'),
      sd('h_an_e','가호',18,0x9fd0ff,'shield','자신과 주변 파티원에게 보호막을 줍니다.'),
      sd('h_an_r','비상',12,0xfff2a0,'arrowup','날아올라 지정한 곳에 내려앉으며 빛기둥을 일으킵니다.'),
      sd('h_an_f','구원의 종',60,0xffe9a0,'heart','6초간 자신과 파티원을 회복하고 적을 묶습니다. 10초 안에 쓰러지면 한 번 버팁니다.')],
    pal:{main:0xf6f4ff,dark:0x8fa6d8,trim:0xf2d27a},wing:{a:0xffffff,b:0xdceaff,bone:0xf2d27a,glow:0xdfeeff,pairs:1}},
  fallen:{name:'타락천사',item:'hc_fallen',itemName:'타락천사의 금서',col:'#c23aff',
    story:'하늘을 등진 검. 한때의 전우였던 대천사와 맞서며, 상대의 피로 힘을 얻습니다.',
    m:{atk:1.75,hp:1.3,crit:.12,aps:1.2,vamp:.08},
    skills:[sd('h_fa_q','흑익 참',5,0xb23aff,'sword','앞으로 날아들며 베고, 맞힌 만큼 흡혈합니다.'),
      sd('h_fa_e','타락의 낙인',12,0xff2a6a,'close','적에게 낙인을 새겨 받는 피해를 30% 늘립니다. 낙인 찍힌 적이 쓰러지면 주변에 번집니다.'),
      sd('h_fa_r','검은 깃 폭우',13,0x7a2fd0,'rain','지정한 곳에 3초 동안 검은 깃을 쏟아붓습니다.'),
      sd('h_fa_f','추락',55,0xff1f4a,'burst','하늘에서 내리꽂힙니다. 잃은 체력이 많을수록 강합니다.')],
    pal:{main:0x1c1226,dark:0x0b0710,trim:0x8a1236},wing:{a:0x15091f,b:0x2a0f3a,bone:0xb0143c,glow:0x7a1fb0,pairs:1,broken:1}},
  arch:{name:'대천사',item:'hc_arch',itemName:'대천사의 주문서',col:'#ffd24a',
    story:'하늘의 군단장. 등을 돌린 타락천사를 막아서는 심판자입니다.',
    m:{atk:1.65,hp:1.6,armor:.15,aps:1.15,crit:.08},
    skills:[sd('h_ar_q','심판의 창',6,0xffd24a,'spear','거대한 빛의 창으로 일직선의 적을 꿰뚫습니다.'),
      sd('h_ar_e','성역의 방패',14,0xffe9a0,'shield','2초간 방패를 세워 피해를 크게 줄인 뒤 반격파를 터뜨립니다.'),
      sd('h_ar_r','천벌의 검진',13,0xfff2a0,'sword','빛의 검 일곱 자루를 지정한 곳에 떨어뜨립니다.'),
      sd('h_ar_f','최후의 심판',60,0xffffff,'bolt','주변 모든 적을 심판하고 8초간 공격력·공격 속도가 오릅니다.')],
    pal:{main:0xe9c25a,dark:0x6a4a14,trim:0xffffff},wing:{a:0xfff6d8,b:0xffd873,bone:0xffc02a,glow:0xffd873,pairs:3}}
};
const HJOBS={};
for(const k in HIDDEN){const h=HIDDEN[k],id='h_'+k;
  HJOBS[id]={name:h.name,tier:3,hid:k,m:h.m,desc:h.story};
  POTIONS[h.item]={name:h.itemName,kind:'hidden',price:0,col:h.col,hid:k,desc:'Lv.'+HIDDEN_LV+'에 사용하면 히든 클래스 '+h.name+'(으)로 전직합니다. 거래·판매할 수 없습니다.'};
  JOB_COL[id]=parseInt(h.col.slice(1),16);
}
const jobDef=id=>HJOBS[id]||JOBS[id];
const isBound=it=>!!it&&it.kind==='potion'&&String(it.base).startsWith('hc_');
const hidOn=pf=>pf&&pf.hiddenOn&&HIDDEN[pf.hidden]?pf.hidden:null;
const curJob=pf=>{pf=pf||SES.pf;const h=hidOn(pf);return h?'h_'+h:pf.job};
/* a hidden class may hold any weapon; it fights the way that weapon's own class does */
const styleCls=base=>{const c=wCls(base||'');return c==='sword'?'warrior':c==='wand'?'mage':CLS[c]?c:'warrior'};
const lookCls=(cls,job,w)=>HJOBS[job]&&w?styleCls(w):cls;
const canUse=(base,pf)=>{pf=pf||SES.pf;return !!hidOn(pf)||wCan(base,pf.cls)};
/* 대천사 + 대천사 축복의 룬 */
const archSyn=()=>!!(S&&S.hidden==='arch'&&S.weapon&&String(S.weapon.rune||'').startsWith('angel:'));

/* ---------- models ---------- */
const HSKIN=0xf1c7a0;
function hidWings(o,w,k){
  const fe=new THREE.ConeGeometry(.13,1,4),A=aumat(w.a,.97),B=aumat(w.b,.93),bone=aumat(w.bone,.96),bead=new THREE.OctahedronGeometry(.065,0);
  const add=(geo,mat,x,y,z,p)=>mesh(geo,mat,x,y,z,p,false);
  const feather=(p,sd,x,y,z,a,l,wd,mat)=>{const f=add(fe,mat,sd*(x+Math.cos(a)*l/2),y+Math.sin(a)*l/2,z,p);f.scale.set(wd,l,.18);f.rotation.z=sd*(a-Math.PI/2)};
  const spar=(p,sd,x1,y1)=>{const a=Math.atan2(y1,x1),b=add(fe,bone,sd*x1/2,y1/2,.06,p);b.scale.set(.55,Math.hypot(x1,y1)*1.12,.6);b.rotation.z=sd*(a-Math.PI/2)};
  const P3=[{y:1.8,s:1,tilt:0}];
  if(w.pairs===3)P3.splice(0,1,{y:2.05,s:1.12,tilt:.28},{y:1.65,s:.9,tilt:-.18},{y:1.28,s:.68,tilt:-.62});
  const all=[];
  P3.forEach((cfg,n)=>{for(const sd of[-1,1]){
    const root=grp(sd*.2,cfg.y,-.42-n*.05,o.g);root.scale.setScalar(cfg.s);
    const tilt=grp(0,0,0,root);tilt.rotation.z=sd*cfg.tilt;
    const arm=grp(0,0,0,tilt),tip=grp(sd*1.05,.62,0,arm),broken=w.broken&&sd<0;
    spar(arm,sd,1.05,.62);spar(tip,sd,1,.3);
    for(let i=0;i<7;i++){const q=i/6;feather(arm,sd,.12+q*.93,.07+q*.55,-.02*i,-1.5+q*.22,.75+q*.55,1.25,i%2?A:B);feather(arm,sd,.12+q*.93,.1+q*.55,.05,-1.35+q*.25,.4+q*.2,1.1,A)}
    for(let i=0;i<9;i++){if(broken&&(i===3||i===6))continue;const q=i/8,a=-1.2+q*1.62,x=Math.min(1,q*1.25),y=x*.3,l=(1.3+Math.sin(q*2.6)*.5)*(broken?.86:1);
      feather(tip,sd,x,y,-.03*i,a,l,1.2,i%2?B:A);feather(tip,sd,x,y+.03,.05,a+.08,l*.48,1,A);
      add(bead,bone,sd*(x+Math.cos(a)*(l+.07)),y+Math.sin(a)*(l+.07),-.03*i,tip)}
    const gl=glow(w.glow,2.4,.26);gl.position.set(sd*.8,.1,-.06);arm.add(gl);
    all.push({root,arm,tip,sd,n});
  }});
  return t=>{for(const p of all){const u=t*2.6-p.n*.5,beat=Math.sin(u+Math.sin(u)*.45),lag=Math.sin(u-1+Math.sin(u-1)*.45),k2=p.n?.7:1;
    p.arm.rotation.z=p.sd*(beat*.3*k2+.03);p.arm.rotation.y=p.sd*(.24-beat*.2);p.tip.rotation.z=p.sd*lag*.42*k2;p.tip.rotation.y=p.sd*(.1-lag*.26)}};
}
/* the rig and weapon come from the weapon's class; the outfit, wings and head pieces make the hidden class */
function makeHidden(cls,id){
  const h=HIDDEN[id],o=makeHero(cls,h.pal.main),pal=h.pal;
  const keep=new Set([o.weapon,o.weapon2,o.orb].filter(Boolean));
  const repaint=n=>{
    if(!n||keep.has(n))return;
    const m=n.material,c=m&&m.color&&m.color.getHex?m.color.getHex():null;
    if(c!=null&&c!==HSKIN&&!m.transparent&&m.isMeshStandardMaterial!==false){
      const lum=(((c>>16)&255)*.3+((c>>8)&255)*.6+(c&255)*.1)/255;
      n.material=m.metalness>.45&&lum>.45?M(pal.trim,{metalness:.7,roughness:.3}):lum<.22?M(pal.dark):M(pal.main,{roughness:.55});
    }
    if(n.children)for(const ch of n.children.slice())repaint(ch);
  };
  repaint(o.body);
  const main=M(pal.main,{roughness:.55}),dark=M(pal.dark),trim=M(pal.trim,{metalness:.7,roughness:.3,emissive:pal.trim,emissiveIntensity:.18});
  const ring=(r,t,mat,x,y,z,p,arc)=>mesh(new THREE.TorusGeometry(r,t,6,28,arc||TAU),mat,x,y,z,p,false);
  const halo=grp(0,.74,-.04,o.head);
  if(id==='angel'){
    CY(.46,.72,.95,main,0,-.62,0,o.torso,12);ring(.72,.04,trim,0,-1.08,0,o.torso).rotation.x=Math.PI/2;
    BX(.2,.8,.06,trim,0,-.1,.32,o.torso);SP(.1,EM(0xbfe4ff,1.4),0,.2,.34,o.torso,8,6);
    ring(.34,.045,EM(0xffe9a0,1.5),0,0,0,halo).rotation.x=Math.PI/2;
    for(const s of[-1,1]){const f=CN(.07,.46,EM(0xffffff,.5),s*.38,.2,-.05,o.head,4);f.rotation.z=-s*.9;f.scale.z=.3}
  }else if(id==='fallen'){
    const red=EM(0xff1f4a,1.6),cape=BX(1.05,1.75,.07,dark,0,-.2,-.38,o.torso);cape.rotation.x=.14;
    for(const s of[-1,1]){const hn=CN(.08,.5,trim,s*.24,.38,.04,o.head,6);hn.rotation.z=-s*.55;hn.rotation.x=-.3;
      SP(.045,red,s*.12,.0,.34,o.head,6,5);const sp=CN(.13,.55,dark,s*.72,.66,0,o.torso,5);sp.rotation.z=-s*.7;
      const tail=BX(.26,.9,.05,trim,s*.28,-.85,-.34,o.torso);tail.rotation.z=s*.18}
    SP(.12,red,0,.14,.33,o.torso,8,6);
    ring(.34,.045,red,0,.02,0,halo,TAU*.68).rotation.x=Math.PI/2-.35;
  }else{
    for(const s of[-1,1]){const pad=SP(.36,trim,s*.68,.52,0,o.torso,10,8);pad.scale.set(1.15,.8,1.1);
      const sp=CN(.09,.5,main,s*.84,.82,0,o.torso,5);sp.rotation.z=-s*.5;ring(.3,.05,main,s*.68,.46,0,o.torso).rotation.x=Math.PI/2}
    BX(.34,1.35,.08,trim,0,-.55,.33,o.torso);BX(.16,1.3,.1,main,0,-.55,.35,o.torso);
    SP(.15,EM(0x7fd6ff,1.6),0,.18,.36,o.torso,10,8);BX(.7,.1,.1,main,0,.18,.34,o.torso);
    const crown=ring(.34,.05,main,0,.3,0,o.head);crown.rotation.x=Math.PI/2;
    for(let i=0;i<5;i++){const a=(i-2)*.5,c=CN(.055,i===2?.42:.28,EM(0xffe27a,1.2),Math.sin(a)*.33,.48+(i===2?.06:0),Math.cos(a)*.33,o.head,4);c.rotation.z=-Math.sin(a)*.3}
    ring(.5,.045,EM(0xffd24a,1.5),0,-.1,-.34,halo);
    for(let i=0;i<12;i++){const a=i*TAU/12,r=CN(.035,i%2?.26:.42,EM(0xfff2a0,1.2),Math.sin(a)*(i%2?.64:.72),-.1+Math.cos(a)*(i%2?.64:.72),-.34,halo,4);r.rotation.z=-a}
  }
  const beat=hidWings(o,h.wing);
  const aura=glow(parseInt(h.col.slice(1),16),4.4,.34);aura.position.set(0,.8,0);o.g.add(aura);o.aura=aura;
  o.hid=id;o.hidSyn=on=>{if(!!on===!!o.synGlow)return;
    if(on){const g=grp(0,1.7,-.5,o.g);for(const[r,op]of[[7,.34],[3.4,.5]]){const s=glow(0xffd24a,r,op);g.add(s)}ring(1.35,.03,aumat(0xffe27a,.9),0,0,-.1,g);o.synGlow=g}
    else{o.g.remove(o.synGlow);o.synGlow=null}};
  o.hw=t=>{beat(t);halo.rotation.y=Math.sin(t*1.2)*.25;if(o.synGlow)o.synGlow.rotation.z=t*.5};
  o.hw(0);
  return o;
}

/* ---------- skills ---------- */
const hidParty=r=>partyPeers().filter(p=>d2(p.x,p.z,P.x,P.z)<r*r);
function hidHeal(pct,sh,r){
  healP(Math.round(S.maxHp*pct));if(sh)P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*sh);
  for(const p of hidParty(r||14)){netSend('ch',{to:p.name,from:SES.name,pct,sh:sh||0});burst(p.x,1.4,p.z,8,0xfff4c2,4,.5,-1)}
}
/* a projectile drawn by the skill itself: pierces, each enemy once */
function hidShot(c,ax,az,speed,len,rad,mult,col,size,onHit){
  const g=grp(P.x,1.3,P.z),s=part(g,'cone',col,.35*size,1.5*size,.35*size,0,0,0,1.2);s.rotation.x=Math.PI/2;g.add(glow(col,2*size,.7));g.rotation.y=Math.atan2(ax,az);
  let x=P.x,z=P.z,gone=0;const done=new Set();
  act(len/speed+.1,(t,dt)=>{const st=speed*dt;x+=ax*st;z+=az*st;gone+=st;g.position.set(x,1.3,z);emit(x,1.3,z,0,0,0,.25,col,0);
    for(const m of mobsIn(x,z,rad))if(!done.has(m)){done.add(m);sHit(c,m,mult,{x:x-ax,z:z-az,kb:4});if(onHit)onHit(m)}
    if(gone>=len)return true},null,g);
}
function lightFall(c,x,z,r,mult,col,o){pillar(x,z,col,20,.45);flashDisc(x,z,r,col,.35);shockRing(x,z,r+.6,col,.4);sArea(c,x,z,r,mult,Object.assign({kb:5},o));cam.shake=Math.max(cam.shake,.3)}
Object.assign(SK,{
  h_an_q(c){
    const base=Math.atan2(c.a.x,c.a.z);let healed=0;
    for(let i=-3;i<=3;i++){const a=base+i*.14;hidShot(c,Math.sin(a),Math.cos(a),30,13,1.1,1.3,c.col,.8,()=>{if(healed<6){healed++;healP(Math.max(1,Math.round(S.maxHp*.025)))}})}
    sfx('magic');netFx('nova',{x:P.x,z:P.z,r:3,c:c.col});
  },
  h_an_e(c){hidHeal(.04,.22,14);pillar(P.x,P.z,c.col,10,.6);shockRing(P.x,P.z,6,c.col,.6);ringBurst(P.x,.8,P.z,24,c.col,8,.6);sfx('level');netFx('nova',{x:P.x,z:P.z,r:6,c:c.col})},
  h_an_r(c){const pt=aimPoint(13);leapTo(pt.x,pt.z,.7,9,()=>{lightFall(c,P.x,P.z,5.5,3,c.col,{freeze:1,big:true});sfx('boom');netFx('nova',{x:P.x,z:P.z,r:5.5,c:c.col})})},
  h_an_f(c){
    P.reviveT=G.t+10;let n=0;const g=grp(P.x,5,P.z);part(g,'cone',0xffd873,1.8,2,1.8,0,0,0,.9);g.add(glow(c.col,5,.8));
    act(6,t=>{g.position.set(P.x,5+Math.sin(t*3)*.2,P.z);g.rotation.z=Math.sin(t*6)*.35;
      if(t>=n){n++;hidHeal(.06,0,16);shockRing(P.x,P.z,12,c.col,.8);for(const m of mobsIn(P.x,P.z,12)){sHit(c,m,.9,{noProc:true});freezeMob(m,.6)}sfx('sparkle')}},null,g);
    sfx('level');netFx('nova',{x:P.x,z:P.z,r:12,c:c.col});
  },
  h_fa_q(c){
    const a=c.a,len=10,x0=P.x,z0=P.z,done=new Set();let drank=0;
    leapTo(x0+a.x*len,z0+a.z*len,.28,1.2,()=>{boom(P.x,P.z,3,c.col,.4)});
    act(.34,()=>{for(const m of mobsIn(P.x,P.z,2.6))if(!done.has(m)){done.add(m);sHit(c,m,3.6,{x:P.x-a.x,z:P.z-a.z,kb:6,big:true});if(drank<4){drank++;healP(Math.max(1,Math.round(S.maxHp*.035)))}}
      slashArc(P.x,P.z,Math.atan2(a.x,a.z),3.2,2.6,0xb23aff,.18);burst(P.x,1,P.z,4,0x2a0f3a,4,.35,2)});
    sfx('slash');netFx('slash',{x:P.x,z:P.z,f:Math.atan2(a.x,a.z),r:5,a:2.4,c:1});
  },
  h_fa_e(c){
    const m0=aimMob(14);if(!m0)return false;
    const marked=new Set();
    const mark=m=>{if(!alive(m)||marked.has(m)||marked.size>=24)return;marked.add(m);m.brand=G.t+8;sHit(c,m,1.2,{noProc:true});boltFx(P.x,P.z,m.x,m.z,c.col)};
    for(const m of mobsIn(m0.x,m0.z,5))mark(m);mark(m0);
    const spread=new Set();let acc=0;
    act(8,(t,dt)=>{acc+=dt;if(acc<.2)return;acc=0;for(const m of[...marked]){
      if(m.dead&&!spread.has(m)){spread.add(m);shockRing(m.x,m.z,6,c.col,.4);for(const q of mobsIn(m.x,m.z,6))mark(q)}
      else if(alive(m))emit(m.x,m.r*1.6+1.4,m.z,0,.6,0,.4,0xff2a6a,0)}});
    sfx('magic');netFx('ground',{x:m0.x,z:m0.z,r:5,c:c.col});
  },
  h_fa_r(c){
    const pt=aimPoint(14),g=grp(pt.x,0,pt.z);flatRing(g,6,0x7a2fd0,.8);flatDisc(g,6,0x1c0a30,.35);let n=0;
    act(3,t=>{for(let i=0;i<4;i++){const a=rnd(0,TAU),r=Math.sqrt(Math.random())*6;emit(pt.x+Math.cos(a)*r,rnd(6,9),pt.z+Math.sin(a)*r,0,-20,0,.35,i?0x5a1a8a:0xff2a6a,0)}
      if(t>=n*.3&&n<10){n++;const k=sArea(c,pt.x,pt.z,6,.95,{noProc:true});if(k)healP(Math.max(1,Math.round(S.maxHp*.008)));sfx('hit',.6)}},null,g);
    sfx('shot');netFx('ground',{x:pt.x,z:pt.z,r:6,c:c.col});
  },
  h_fa_f(c){
    const pt=aimPoint(14),lost=clamp(1-P.hp/S.maxHp,0,1);P.iframes=Math.max(P.iframes,1.4);
    telegraph(pt.x,pt.z,9,.95,()=>{},c.col);
    leapTo(pt.x,pt.z,.95,15,()=>{const x=P.x,z=P.z;hitStop(.14);sArea(c,x,z,9,12*(1+lost),{kb:14,freeze:1,burn:.5,big:true});
      boom(x,z,9,c.col,1);ringBurst(x,.6,z,50,0x2a0f3a,18,.7);pillar(x,z,c.col,26,.8);clearShots(x,z,9);netFx('nova',{x,z,r:9,c:c.col})});
    sfx('dash');
  },
  h_ar_q(c){
    hidShot(c,c.a.x,c.a.z,40,20,2,4.4,c.col,2.2);shockRing(P.x,P.z,3,c.col,.35);cam.shake=Math.max(cam.shake,.35);
    sfx('crit');netFx('shot',{x:P.x,z:P.z,vx:c.a.x*40,vz:c.a.z*40,v:'orb',c:c.col});
  },
  h_ar_e(c){
    P.hGuard=2;const g=grp(P.x,1.4,P.z);part(g,'ball',c.col,4.4,4.4,4.4,0,0,0,.5);const m=g.children[0];
    if(m&&m.material){m.material=aumat(0xffe9a0,.28)}g.add(glow(c.col,5,.45));
    act(2,(t,dt)=>{P.hGuard=Math.max(0,2-t);g.position.set(P.x,1.4,P.z);g.rotation.y+=dt*2},
      ()=>{P.hGuard=0;sArea(c,P.x,P.z,7.5,4.6,{kb:14,freeze:.8,big:true});boom(P.x,P.z,7.5,c.col,.8);clearShots(P.x,P.z,7.5);netFx('nova',{x:P.x,z:P.z,r:7.5,c:c.col})},g);
    P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*.18);sfx('level');
  },
  h_ar_r(c){
    const pt=aimPoint(14);
    for(let i=0;i<7;i++){const a=i*TAU/7,x=i===6?pt.x:pt.x+Math.sin(a)*4.4,z=i===6?pt.z:pt.z+Math.cos(a)*4.4;
      later(i*.13,()=>{const g=grp(x,18,z);part(g,'box',0xfff2a0,.45,3.6,.14,0,0,0,1.4);part(g,'box',0xffd24a,1.5,.28,.3,0,1.9,0,1);part(g,'cone',0xfff2a0,.45,.8,.14,0,-2.2,0,1.4).rotation.x=Math.PI;g.add(glow(c.col,3,.7));
        act(.32,t=>{g.position.y=18-16*Math.min(1,t/.32)**2},()=>{lightFall(c,x,z,i===6?4.2:3,i===6?3:1.7,c.col,{freeze:.5});sfx('hit_stone',.8)},g)})}
    sfx('magic');netFx('ground',{x:pt.x,z:pt.z,r:6,c:c.col});
  },
  h_ar_f(c){
    const dur=8+(archSyn()?ARCH_SYN.ult:0);
    P.iframes=Math.max(P.iframes,1.2);pillar(P.x,P.z,0xffffff,34,1.1);ringBurst(P.x,.6,P.z,60,c.col,22,.8);
    const list=mobsIn(P.x,P.z,22);
    list.forEach((m,i)=>later(.25+Math.min(.9,i*.05),()=>{if(valid(m)){pillar(m.x,m.z,0xfff2a0,22,.4);sHit(c,m,10,{freeze:1,big:true})}}));
    later(.3,()=>{clearShots(P.x,P.z,22);boom(P.x,P.z,12,c.col,1);hitStop(.1)});
    P.buff={t:dur,atk:1.35,aps:1.25,spd:1.1};
    act(dur,(t,dt)=>{if(Math.random()<dt*14)emit(P.x+rnd(-1.4,1.4),rnd(.2,3),P.z+rnd(-1.4,1.4),0,1.4,0,.6,Math.random()<.5?0xffd24a:0xffffff,0)});
    sfx('level');sfx('boom');netFx('nova',{x:P.x,z:P.z,r:16,c:c.col});
  }
});

/* ---------- actions & window ---------- */
const hidBusy=()=>DU.on||skBusy()||P.dead||G.t-(P.lastHurt||-99)<5;
function hidRefresh(){derive();buildPlayerModel();P.hp=Math.min(P.hp,S.maxHp);P.buff=null;skReset();netPresence();UI.refreshHud();if(UI.refreshTouch)UI.refreshTouch()}
async function hidCall(method,arg,msg){
  if(hidBusy()){UI.toast('전투 중에는 바꿀 수 없습니다 (마지막 피격 5초 뒤)');return false}
  const r=await guarded(()=>API.call(method,arg),msg);if(!r)return false;
  hidRefresh();sfx('level');const c=JOB_COL[curJob()]||0xffd24a;shockRing(P.x,P.z,7,c,.8);pillar(P.x,P.z,c,22,1);
  return true;
}
function openHidden(){
  UI.page('히든 클래스',()=>{
    const pf=SES.pf,h=HIDDEN[pf.hidden];
    if(!h)return '<div class="card">히든 클래스가 없습니다.<div class="dim" style="margin-top:6px">Lv.'+HIDDEN_LV+'에 천공의 성역 던전 보상에서 아주 드물게 전직서를 얻습니다.</div></div>';
    const on=!!hidOn(pf);
    let s='<div class="card"><div class="row sp"><b style="font-size:18px;color:'+h.col+'">'+h.name+'</b><span class="dim">'+(on?'사용 중':'원래 직업 사용 중')+'</span></div><div class="dim" style="margin:4px 0">'+h.story+'</div><div style="font-size:12px">'
      +['Q','E','R','F'].map((k,i)=>'<div><b class="gold">'+k+' '+h.skills[i].name+'</b> — '+h.skills[i].desc+'</div>').join('')+'</div>'
      +(pf.hidden==='arch'?'<div class="gold" style="margin-top:6px;font-size:12px">대천사 축복의 룬을 장착하면: 스킬 피해 +30%, 쿨타임 -15%, 최후의 심판 +4초</div>':'')
      +'<div class="dim" style="margin-top:6px;font-size:12px">히든 상태에서는 모든 무기를 들 수 있고, 든 무기 방식으로 기본 공격합니다.</div></div>';
    s+='<div class="row sp" style="margin-top:10px;gap:8px"><button class="btn" data-a="hswap">'+(on?JOBS[pf.job].name+'(으)로 돌아가기':h.name+'(으)로 바꾸기')+'</button><button class="btn sm sec" data-a="hdrop">히든 클래스 포기</button></div>';
    return s;
  });
  UI.handlers.hswap=async()=>{if(await hidCall('hiddenSwap',!hidOn(SES.pf),'직업을 바꿨습니다'))UI.rerender()};
  UI.handlers.hdrop=async()=>{const h=HIDDEN[SES.pf.hidden];if(!h)return;
    if(!(await UI.confirm(h.name+'을(를) 포기할까요?\n다시 얻으려면 확률을 뚫어 전직서를 새로 얻어야 합니다.')))return;
    if(await hidCall('hiddenDrop',undefined,'히든 클래스를 포기했습니다'))UI.rerender()};
}
async function hidLearn(itemId){
  const it=myItems().find(i=>i.id===+itemId),h=it&&isBound(it)&&HIDDEN[POTIONS[it.base].hid];if(!h)return;
  if(SES.pf.semi)return UI.toast('이 계정은 히든 클래스를 쓸 수 없습니다');
  if(SES.pf.level<HIDDEN_LV)return UI.toast('Lv.'+HIDDEN_LV+'부터 사용할 수 있습니다');
  if(SES.pf.hidden)return UI.toast('히든 클래스는 하나만 가질 수 있습니다. 먼저 포기하세요');
  if(!(await UI.confirm(h.itemName+'을(를) 사용해 '+h.name+'(으)로 히든 전직할까요?')))return;
  if(await hidCall('hiddenLearn',it.id,h.name+'(으)로 히든 전직!'))UI.close();
}
/* a menu button that only appears once there is a hidden class */
function hidHud(){
  const box=$('menu');if(!box)return;let b=hidHud.b;
  const h=SES.pf&&HIDDEN[SES.pf.hidden];
  if(!b){if(!h)return;b=hidHud.b=document.createElement('button');b.className='mbtn';b.id='hidbtn';b.onclick=()=>openHidden();b.style.cssText='font-weight:800;padding:6px 10px;border-radius:10px;border:1px solid;background:#1c2136;cursor:pointer;pointer-events:auto';box.appendChild(b)}
  b.style.display=h?'':'none';if(h){b.style.color=b.style.borderColor=h.col;b.textContent=h.name}
}
