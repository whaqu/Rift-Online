/* ---------------- hidden classes (히든 클래스) ----------------
   An account keeps its base class and 2nd job; one hidden class can be learned on top and swapped on and off anywhere.
   To add one: add an entry to HIDDEN (skills = [Q,E,R,F] with SK functions) and a row to the server table rw_hidden_class.
   Story: 천사 is the messenger of heaven; 대천사 and 타락천사 were once brothers in arms and are now rivals (equal strength). */
const HIDDEN_LV=99,HIDDEN_DROP=.0005,HIDDEN_DG='sky',ARCH_SYN={atk:1.3,cd:.85,ult:4};
const HIDDEN={
  angel:{name:'천사',item:'hc_angel',itemName:'천사의 서사',col:'#fff4c2',size:1.22,
    story:'천상의 전령. 두 강자의 싸움 사이에서 다친 이들을 돌봅니다.',
    m:{atk:2.2,hp:2.4,armor:.2,regen:.03,aps:1.25,crit:.1,spd:1.15},
    skills:[sd('h_an_q','성광의 파문',5,0xfff4c2,'h_halo','빛의 고리를 사방으로 퍼뜨립니다. 맞힌 수만큼 회복합니다.'),
      sd('h_an_e','가호',16,0x9fd0ff,'h_shield','자신과 주변 파티원에게 큰 보호막을 줍니다.'),
      sd('h_an_r','비상',10,0xfff2a0,'h_wing','날아올라 지정한 곳에 내려앉으며 빛기둥을 일으킵니다.'),
      sd('h_an_f','구원의 종',55,0xffe9a0,'h_bell','6초간 자신과 파티원을 크게 회복하고 적을 묶습니다. 10초 안에 쓰러지면 한 번 버팁니다.')],
    pal:{main:0xf6f4ff,dark:0x8fa6d8,trim:0xf2d27a,face:0xffe9d8,eye:0x7fd6ff},wing:{a:0xffffff,b:0xdceaff,bone:0xf2d27a,glow:0xdfeeff,pairs:1,size:1.3}},
  fallen:{name:'타락천사',item:'hc_fallen',itemName:'타락천사의 금서',col:'#c23aff',size:1.3,
    story:'하늘을 등진 검. 한때의 전우였던 대천사와 맞서며, 상대의 피로 힘을 얻습니다.',
    m:{atk:3,hp:2.2,armor:.15,crit:.22,aps:1.4,vamp:.12,spd:1.2},
    skills:[sd('h_fa_q','나락의 초승달',4,0xb23aff,'h_moon','거대한 검은 초승달 세 개를 날려 꿰뚫고, 맞힌 만큼 흡혈합니다.'),
      sd('h_fa_e','타락의 낙인',10,0xff2a6a,'h_brand','적 무리에 낙인을 새겨 받는 피해를 50% 늘립니다. 낙인 찍힌 적이 쓰러지면 주변에 번집니다.'),
      sd('h_fa_r','검은 깃 폭우',11,0x7a2fd0,'h_feather','지정한 넓은 곳에 3초 동안 검은 깃을 쏟아붓습니다.'),
      sd('h_fa_f','추락',50,0xff1f4a,'h_dive','하늘에서 내리꽂힙니다. 잃은 체력이 많을수록 강합니다.')],
    pal:{main:0x1c1226,dark:0x0b0710,trim:0x8a1236,face:0xcdbfd4,eye:0xff1f4a},wing:{a:0x15091f,b:0x2a0f3a,bone:0xb0143c,glow:0x7a1fb0,pairs:1,broken:1,size:1.35}},
  arch:{name:'대천사',item:'hc_arch',itemName:'대천사의 주문서',col:'#ffd24a',size:1.38,
    story:'하늘의 군단장. 등을 돌린 타락천사를 막아서는 심판자입니다.',
    m:{atk:2.8,hp:2.7,armor:.3,regen:.02,aps:1.35,crit:.15,spd:1.15},
    skills:[sd('h_ar_q','천벌 탄막',4.5,0xffd24a,'h_nova','빛의 탄막을 두 번 사방으로 터뜨립니다.'),
      sd('h_ar_e','심판의 연격',10,0xffe9a0,'h_quake','전방으로 폭발이 줄지어 터집니다. 보호막과 짧은 피해 감소를 얻습니다.'),
      sd('h_ar_r','천공 유성우',11,0xff8a2a,'h_meteor','주변 적과 지정한 곳에 유성을 쏟아붓습니다.'),
      sd('h_ar_f','최후의 심판',55,0xffffff,'h_judge','내가 선 성역을 뺀 전장 전체를 심판합니다. 파티를 회복하고 10초간 크게 강해집니다.')],
    pal:{main:0xfff8e8,dark:0xb8903a,trim:0xf0c24a,face:0xfff0d8,eye:0xffe27a},wing:{a:0xfff6d8,b:0xffd873,bone:0xffc02a,glow:0xffd873,pairs:3,size:1.4}}
};
/* each hidden skill has its own icon */
{const P8=n=>Array.from({length:n},(_,i)=>i*TAU/n),f=v=>(+v).toFixed(1),dot=(a,r,s)=>'<circle cx="'+f(12+Math.cos(a)*r)+'" cy="'+f(12+Math.sin(a)*r)+'" r="'+s+'"/>';
Object.assign(ICONS,{
  h_nova:'<circle cx="12" cy="12" r="3"/>'+P8(8).map(a=>dot(a,9,2)).join('')+P8(8).map(a=>dot(a+TAU/16,5.8,1)).join(''),
  h_quake:'<circle cx="4" cy="19" r="2.5"/><circle cx="10" cy="14" r="3.4"/><circle cx="17.5" cy="7" r="5"/>',
  h_meteor:'<circle cx="8" cy="16" r="5.5"/><path d="M10 9L21 2l-6 9zM15 13l8-4-6 7zM6 9l5-8-1 8z"/>',
  h_judge:'<path d="M12 1l3 7h-2v7h-2V8H9zM3 14l4 3-1 2zm18 0l-4 3 1 2zM4 23c0-3 4-5 8-5s8 2 8 5z"/>',
  h_halo:'<path fill-rule="evenodd" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14zm0 3a4 4 0 100 8 4 4 0 000-8z"/>',
  h_shield:'<path d="M12 2l8 3v6c0 5-3.500 9-8 11-4.500-2-8-6-8-11V5zm-1 5v4H8v2h3v4h2v-4h3v-2h-3V7z" fill-rule="evenodd"/>',
  h_wing:'<path d="M12 22V9C9 4 5 3 1 3c1 3 2 4 4 5-2 0-3 0-4-1 1 4 3 5 6 6-1 .500-3 .500-4 0 2 3 5 4 9 3zm0 0V9c3-5 7-6 11-6-1 3-2 4-4 5 2 0 3 0 4-1-1 4-3 5-6 6 1 .500 3 .500 4 0-2 3-5 4-9 3z"/>',
  h_bell:'<path d="M12 2a2 2 0 012 2c3 1 4 4 4 7v5l3 3H3l3-3v-5c0-3 1-6 4-7a2 2 0 012-2zm-3 18h6a3 3 0 01-6 0z"/>',
  h_moon:'<path d="M4 3c9 0 15 5 17 18-4-8-9-11-18-10 5-2 6-4 1-8zM2 14c6-1 10 1 13 7-5-3-8-3-13-1 3-2 3-4 0-6z"/>',
  h_brand:'<path fill-rule="evenodd" d="M12 1a11 11 0 100 22 11 11 0 000-22zm0 2.500a8.500 8.500 0 110 17 8.500 8.500 0 010-17zM12 19l-4.500-12 9.500 7.500H7L16.500 7z"/>',
  h_feather:'<path d="M6 2c6 3 7 8 5 14l-2-3-1 5C4 13 3 7 6 2zm12 6c4 4 4 9 0 14l-.500-3.500L15 21c-2-5-1-9 3-13z"/>',
  h_dive:'<path d="M12 23l-6-8h4L8 2l4 6 4-6-2 13h4zM2 20h3v2H2zm17 0h3v2h-3z"/>',
  h_fly:'<path d="M2 6c6 0 9 2 10 6 1-4 4-6 10-6-2 6-5 9-9 9l-1 5-1-5c-4 0-7-3-9-9z"/>'
});}
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
    const root=grp(sd*.2,cfg.y,-.46-n*.06,o.g);root.scale.setScalar(cfg.s*(w.size||1));
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
/* a hidden class covers the whole body with a floating, boss-sized figure (like the sky temple's fallen archangel).
   The weapon class's rig is kept only for its animation and weapon: every other part of it is made invisible. */
const HID_HOVER=.85;
let HID_INV=null;
function hidBlank(root,keep){
  if(!HID_INV)HID_INV=new THREE.MeshBasicMaterial({visible:false});
  const go=n=>{if(!n||keep.has(n))return;if(n.material){if(n.isSprite||n.type==='Sprite')n.visible=false;else{n.material=HID_INV;n.castShadow=false}}if(n.children)for(const c of n.children)go(c)};
  go(root);
}
function makeHidden(cls,id){
  const h=HIDDEN[id],o=makeHero(cls,h.pal.main),pal=h.pal,colN=parseInt(h.col.slice(1),16);
  hidBlank(o.body,new Set([o.weapon,o.weapon2,o.orb].filter(Boolean)));
  const main=M(pal.main,{roughness:.5,emissive:pal.main,emissiveIntensity:id==='fallen'?.1:.14}),dark=M(pal.dark,{roughness:.6}),
    trim=M(pal.trim,{metalness:.7,roughness:.3,emissive:pal.trim,emissiveIntensity:.25}),face=M(pal.face),lit=EM(pal.eye,1.7),
    edge=EM(id==='fallen'?0xff1f4a:0xffe27a,1.4);
  const ring=(r,t,mat,x,y,z,p,arc)=>mesh(new THREE.TorusGeometry(r,t,6,28,arc||TAU),mat,x,y,z,p,false);
  const cone=(r,hh,mat,x,y,z,p,seg)=>mesh(new THREE.ConeGeometry(r,hh,seg||6),mat,x,y,z,p);
  const T=grp(0,0,0,o.torso),H=grp(0,0,0,o.head),AL=grp(0,0,0,o.armL),AR=grp(0,0,0,o.armR);
  /* body: broad chest, narrow waist, long robe that ends in drifting ribbons (no legs) */
  CY(.46,.3,.9,main,0,.12,0,T,10).scale.z=.7;CY(.3,.34,.28,dark,0,-.4,0,T,10);ring(.34,.06,trim,0,-.3,0,T).rotation.x=Math.PI/2;
  CY(.36,.7,.9,main,0,-.92,0,T,12);ring(.7,.045,trim,0,-1.36,0,T).rotation.x=Math.PI/2;
  BX(.24,1.15,.05,trim,0,-.88,.55,T).rotation.x=-.27;BX(.11,1.1,.06,dark,0,-.88,.57,T).rotation.x=-.27;
  const ribbons=[];
  for(let i=0;i<8;i++){const a=i*TAU/8+.39,g=grp(Math.sin(a)*.55,-1.3,Math.cos(a)*.55,T);const c=cone(.13,i%2?.78:.55,i%2?main:dark,0,-.3,0,g,4);c.rotation.x=Math.PI;c.scale.z=.35;g.rotation.y=a;ribbons.push(g)}
  const gem=OC(.17,lit,0,.2,.34,T);gem.scale.set(.9,1.3,.7);ring(.25,.035,trim,0,.2,.31,T);
  /* shoulders are covered by a draped mantle, open at the front */
  { const mt=grp(0,0,0,T);mt.scale.z=.75;
    const cloth=M(pal.main,{side:THREE.DoubleSide,roughness:.6,emissive:pal.main,emissiveIntensity:id==='fallen'?.1:.14});
    const drape=(rt,rb,hh,y,gap,mat)=>{const m=mesh(foldGeo(rt,rb,hh,9,.035,gap,TAU-gap*2),mat,0,y,0,mt);m.userData.ol=true;return m};
    const hem=(r,y,gap,mat,t)=>{const m=ring(r,t||.032,mat,0,y,0,mt,TAU-gap*2);m.rotation.set(Math.PI/2,0,Math.PI/2+gap);m.userData.ol=true};
    drape(.28,.82,.3,.54,.36,cloth);drape(.82,.96,.42,.18,.42,cloth);hem(.935,-.02,.42,trim,.04);
    if(id==='arch'){drape(.3,.87,.26,.57,.55,M(pal.trim,{side:THREE.DoubleSide,metalness:.55,roughness:.35,emissive:pal.trim,emissiveIntensity:.22}));hem(.87,.44,.55,edge,.022)}
    else hem(.83,.39,.38,id==='fallen'?edge:trim,.022);
    /* pointed ends around the lower edge (none at the front) */
    for(let i=2;i<=10;i++){const q=i*TAU/12,p=cone(.1,id==='fallen'?(i%2?.5:.3):.22,id==='fallen'?dark:cloth,Math.sin(q)*.92,id==='fallen'?-.2:-.1,Math.cos(q)*.92,mt,4);p.rotation.x=Math.PI;p.userData.ol=true}
    for(const s of[-1,1]){const cl=OC(.075,lit,s*.2,.5,.44,mt);cl.userData.ol=true;
      const col=cone(.09,.44,trim,s*.3,.76,-.2,T,4);col.rotation.z=-s*.4;col.scale.z=.4}
  }
  /* arms: wide sleeves, tall gauntlets, glowing wrists (hands stay where the weapon is held) */
  for(const [A,s] of[[AL,-1],[AR,1]]){
    CY(.15,.11,.42,main,0,-.2,0,A);CY(.12,.22,.36,dark,0,-.52,0,A);ring(.22,.035,trim,0,-.68,0,A).rotation.x=Math.PI/2;
    SP(.13,trim,0,-.76,0,A,8,6);ring(.17,.025,edge,0,-.72,0,A).rotation.x=Math.PI/2;
    const fin2=cone(.07,.42,trim,s*.17,-.42,0,A,4);fin2.rotation.z=-s*2.6;
  }
  /* head: a mask with burning eyes and a floating crown or horns */
  SP(.29,face,0,0,0,H,12,10);for(const s of[-1,1]){const e=SP(.055,lit,s*.11,.02,.26,H,6,5);e.scale.set(1.5,.6,1)}
  const halo=grp(0,.18,-.42,o.head);
  if(id==='angel'){
    const hood=SP(.36,main,0,.06,-.1,H,12,10);hood.scale.set(1.05,1.08,.95);cone(.2,.5,main,0,.4,-.16,H,8).rotation.x=-.4;
    ring(.31,.03,trim,0,.14,0,H).rotation.x=Math.PI/2;
    for(const s of[-1,1]){const f=cone(.09,.62,EM(0xffffff,.55),s*.42,.24,-.08,H,4);f.rotation.z=-s*.9;f.scale.z=.3}
    ring(.4,.05,EM(0xffe9a0,1.6),0,.46,.42,halo).rotation.x=Math.PI/2;ring(.62,.025,aumat(0xdfeeff,.8),0,0,0,halo);
  }else if(id==='fallen'){
    const hood=SP(.37,dark,0,.07,-.1,H,12,10);hood.scale.set(1.05,1.1,.95);cone(.22,.55,dark,0,.4,-.2,H,7).rotation.x=-.6;
    for(const s of[-1,1]){const hn=cone(.1,.62,trim,s*.3,.38,.02,H,6);hn.rotation.z=-s*.75;const tp=cone(.055,.46,edge,s*.54,.7,.02,H,5);tp.rotation.z=-s*.15;
      const hem=BX(.3,1.5,.05,dark,s*.34,-.65,-.46,T);hem.rotation.set(.18,0,s*.16)}
    ring(.62,.05,edge,0,0,0,halo,TAU*.72).rotation.z=2.2;ring(.46,.025,aumat(0x7a1fb0,.9),0,0,0,halo,TAU*.8);
    for(let i=0;i<7;i++){const a=.5+i*.75,sp=cone(.05,.4,trim,Math.cos(a)*.76,Math.sin(a)*.76,0,halo,4);sp.rotation.z=a-Math.PI/2}
  }else{
    const helm=mesh(new THREE.SphereGeometry(.33,14,10,0,TAU,0,Math.PI*.46),trim,0,.03,-.01,H);helm.rotation.x=-.2;
    BX(.07,.34,.07,trim,0,.12,.29,H);
    for(let i=0;i<5;i++){const a=(i-2)*.52,c=cone(.065,i===2?.58:i%4?.42:.3,EM(0xffe27a,1.2),Math.sin(a)*.3,.46+(i===2?.08:0),Math.cos(a)*.3,H,4);c.rotation.z=-Math.sin(a)*.35}
    for(const s of[-1,1]){const w=cone(.1,.55,main,s*.4,.2,-.06,H,4);w.rotation.z=-s*.85;w.scale.z=.25}
    ring(.7,.06,EM(0xffd24a,1.6),0,0,0,halo);ring(.46,.025,EM(0xfff2a0,1.3),0,0,0,halo);
    for(let i=0;i<16;i++){const a=i*TAU/16,l=i%2?.3:.55,r=.7+l/2,c=cone(.045,l,EM(0xfff2a0,1.2),Math.sin(a)*r,Math.cos(a)*r,0,halo,4);c.rotation.z=-a}
  }
  const hg=glow(colN,2.6,.45);halo.add(hg);
  for(const[g,n] of[[T,14],[H,6],[AL,4],[AR,4]])addOutline(g,n,.04);
  /* wings hover with the body */
  const wroot=grp(0,0,0,o.body),beat=hidWings({g:wroot},h.wing);
  /* things that circle the figure: swords (대천사), blood crystals (타락천사), feathers (천사) */
  const orbit=grp(0,1.1,0,o.body),orbs=[];
  const N=id==='arch'?6:id==='fallen'?5:4;
  for(let i=0;i<N;i++){const g=grp(0,0,0,orbit);
    if(id==='arch'){BX(.09,.95,.03,EM(0xfff2a0,1.1),0,-.08,0,g);cone(.075,.24,EM(0xfff2a0,1.1),0,-.66,0,g,4).rotation.x=Math.PI;BX(.34,.07,.07,trim,0,.42,0,g);CY(.03,.03,.24,dark,0,.56,0,g,6)}
    else if(id==='fallen'){const c=OC(.17,EM(i%2?0xff1f4a:0x9a2ae0,1.3),0,0,0,g);c.scale.set(.6,1.7,.6)}
    else{const f=cone(.11,.6,EM(0xffffff,.8),0,0,0,g,4);f.scale.z=.2;f.rotation.z=.5}
    g.add(glow(colN,.9,.45));orbs.push(g)}
  /* magic circle on the ground */
  const circle=grp(0,.12,0,o.g),cm=aumat(colN,.7);
  ring(1.35,.04,cm,0,0,0,circle).rotation.x=Math.PI/2;ring(.95,.02,cm,0,0,0,circle).rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=i*TAU/8,b=mesh(new THREE.BoxGeometry(.1,.02,.3),cm,Math.sin(a)*1.15,0,Math.cos(a)*1.15,circle,false);b.rotation.y=a}
  const aura=glow(colN,5.6,.4);aura.position.set(0,1.1,-.3);o.body.add(aura);o.aura=aura;
  o.g.scale.setScalar(h.size);o.base=h.size;
  o.hid=id;o.hover=HID_HOVER;
  o.hidSyn=on=>{if(!!on===!!o.synGlow)return;
    if(on){const g=grp(0,1.7,-.7,o.body);for(const[r,op]of[[8,.34],[3.8,.5]]){const s=glow(0xffd24a,r,op);g.add(s)}ring(1.55,.035,aumat(0xffe27a,.9),0,0,-.1,g);o.synGlow=g}
    else{o.body.remove(o.synGlow);o.synGlow=null}};
  o.hw=t=>{
    o.body.position.y=HID_HOVER+Math.sin(t*2.2)*.14;
    beat(t);halo.rotation.z=t*.35;circle.rotation.y=t*.6;
    ribbons.forEach((g,i)=>{g.rotation.x=Math.cos(i*TAU/8+.39)*-.12+Math.sin(t*3+i*1.3)*.14;g.rotation.z=Math.sin(i*TAU/8+.39)*.12+Math.cos(t*2.6+i)*.12});
    orbs.forEach((g,i)=>{const a=t*.9+i*TAU/N;g.position.set(Math.cos(a)*1.45,Math.sin(t*1.8+i*1.7)*.18,Math.sin(a)*1.45);g.rotation.y=-a+Math.PI/2});
    if(o.synGlow)o.synGlow.rotation.z=t*.5};
  o.hw(0);
  return o;
}

/* ---------- skills ---------- */
const hidParty=r=>partyPeers().filter(p=>d2(p.x,p.z,P.x,P.z)<r*r);
function hidHeal(pct,sh,r){
  healP(Math.round(S.maxHp*pct));if(sh)P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*sh);
  for(const p of hidParty(r||14)){netSend('ch',{to:p.name,from:SES.name,pct,sh:sh||0});burst(p.x,1.4,p.z,8,0xfff4c2,4,.5,-1)}
}
function lightFall(c,x,z,r,mult,col,o){pillar(x,z,col,20,.45);flashDisc(x,z,r,col,.35);shockRing(x,z,r+.6,col,.4);sArea(c,x,z,r,mult,Object.assign({kb:5},o));cam.shake=Math.max(cam.shake,.3)}
/* a ring of light bullets spreading from (x,z): each enemy is struck once as the front passes it */
function hidWave(c,x,z,max,speed,mult,col,n,onHit){
  const g=grp(x,1.1,z),list=[],done=new Set();
  for(let i=0;i<n;i++){const a=i*TAU/n,q=grp(0,0,0,g);part(q,'ball',col,.5,.5,.5,0,0,0,1.4);q.add(glow(col,1.5,.7));list.push({q,a})}
  act(max/speed,t=>{const r=.8+speed*t;for(const e of list)e.q.position.set(Math.sin(e.a)*r,0,Math.cos(e.a)*r);
    for(const m of mobsIn(x,z,Math.min(max,r+.8)))if(!done.has(m)&&Math.hypot(m.x-x,m.z-z)>=r-2.4){done.add(m);sHit(c,m,mult,{x,z,kb:5});if(onHit)onHit(m)}
  },null,g);
}
function hidMeteor(c,x,z,r,mult,col){
  telegraph(x,z,r,.65,()=>{},col);
  const g=grp(x+6,20,z-4);part(g,'ball',0xff6a1a,1.5,1.5,1.5,0,0,0,1.3);part(g,'ball',0xfff2a0,.8,.8,.8,0,0,0,1.5);g.add(glow(0xff8a2a,5,.8));
  act(.65,t=>{const k=Math.min(1,t/.65)**1.6;g.position.set(x+6*(1-k),20-19.5*k,z-4*(1-k));emit(g.position.x,g.position.y,g.position.z,0,1,0,.35,0xffa040,0)},
    ()=>{boom(x,z,r,0xff7a2a,.45);pillar(x,z,col,12,.35);sArea(c,x,z,r,mult,{kb:8,burn:.5,big:true})},g);
}
Object.assign(SK,{
  h_an_q(c){
    let healed=0;
    hidWave(c,P.x,P.z,14,22,3.2,c.col,24,()=>{if(healed<8){healed++;healP(Math.max(1,Math.round(S.maxHp*.03)))}});
    shockRing(P.x,P.z,4,c.col,.4);sfx('magic');netFx('nova',{x:P.x,z:P.z,r:14,c:c.col});
  },
  h_an_e(c){hidHeal(.1,.4,16);pillar(P.x,P.z,c.col,12,.6);shockRing(P.x,P.z,8,c.col,.6);ringBurst(P.x,.8,P.z,32,c.col,9,.6);sArea(c,P.x,P.z,8,3,{kb:12});sfx('level');netFx('nova',{x:P.x,z:P.z,r:8,c:c.col})},
  h_an_r(c){const pt=aimPoint(14);leapTo(pt.x,pt.z,.7,9,()=>{lightFall(c,P.x,P.z,7,7,c.col,{freeze:1.5,big:true});sfx('boom');netFx('nova',{x:P.x,z:P.z,r:7,c:c.col})})},
  h_an_f(c){
    P.reviveT=G.t+10;let n=0;const g=grp(P.x,6,P.z);part(g,'cone',0xffd873,2.2,2.4,2.2,0,0,0,.9);g.add(glow(c.col,6,.8));
    act(6,t=>{g.position.set(P.x,6+Math.sin(t*3)*.2,P.z);g.rotation.z=Math.sin(t*6)*.35;
      if(t>=n){n++;hidHeal(.12,.05,18);shockRing(P.x,P.z,14,c.col,.8);for(const m of mobsIn(P.x,P.z,14)){sHit(c,m,2.5,{noProc:true});freezeMob(m,.8)}sfx('sparkle')}},null,g);
    sfx('level');netFx('nova',{x:P.x,z:P.z,r:14,c:c.col});
  },
  h_fa_q(c){
    const base=Math.atan2(c.a.x,c.a.z);let drank=0;
    for(const d of[-.34,0,.34]){const a=base+d,ax=Math.sin(a),az=Math.cos(a),g=grp(P.x,1.2,P.z);
      const m=new THREE.Mesh(new THREE.TorusGeometry(1.5,.22,5,18,Math.PI),EM(0xb23aff,1.5));m.rotation.x=Math.PI/2;g.add(m);g.add(glow(0x7a1fb0,4,.7));g.rotation.y=a;
      let x=P.x,z=P.z,gone=0;const done=new Set();
      act(18/34+.05,(t,dt)=>{x+=ax*34*dt;z+=az*34*dt;gone+=34*dt;g.position.set(x,1.2,z);emit(x,1.2,z,0,0,0,.3,0xff2a6a,0);
        for(const q of mobsIn(x,z,2.1))if(!done.has(q)){done.add(q);sHit(c,q,3.8,{x:x-ax,z:z-az,kb:5});if(drank<8){drank++;healP(Math.max(1,Math.round(S.maxHp*.03)))}}
        if(gone>=18)return true},null,g);
    }
    slashArc(P.x,P.z,base,3.6,2.8,0xb23aff,.22);sfx('slash');netFx('slash',{x:P.x,z:P.z,f:base,r:7,a:2.4,c:1});
  },
  h_fa_e(c){
    const m0=aimMob(15);if(!m0)return false;
    const marked=new Set();
    const mark=m=>{if(!alive(m)||marked.has(m)||marked.size>=32)return;marked.add(m);m.brand=G.t+10;sHit(c,m,3,{noProc:true});boltFx(P.x,P.z,m.x,m.z,c.col)};
    for(const m of mobsIn(m0.x,m0.z,8))mark(m);mark(m0);
    const spread=new Set();let acc=0;
    act(10,(t,dt)=>{acc+=dt;if(acc<.2)return;acc=0;for(const m of[...marked]){
      if(m.dead&&!spread.has(m)){spread.add(m);boom(m.x,m.z,5,c.col,.2);sArea(c,m.x,m.z,5,2.5,{noProc:true});for(const q of mobsIn(m.x,m.z,7))mark(q)}
      else if(alive(m))emit(m.x,m.r*1.6+1.4,m.z,0,.6,0,.4,0xff2a6a,0)}});
    sfx('magic');netFx('ground',{x:m0.x,z:m0.z,r:8,c:c.col});
  },
  h_fa_r(c){
    const pt=aimPoint(15),g=grp(pt.x,0,pt.z);flatRing(g,8,0x7a2fd0,.8);flatDisc(g,8,0x1c0a30,.4);let n=0;
    act(3,t=>{for(let i=0;i<7;i++){const a=rnd(0,TAU),r=Math.sqrt(Math.random())*8;emit(pt.x+Math.cos(a)*r,rnd(6,10),pt.z+Math.sin(a)*r,0,-22,0,.38,i%3?0x5a1a8a:0xff2a6a,0)}
      if(t>=n*.22&&n<14){n++;const k=sArea(c,pt.x,pt.z,8,2,{noProc:true});if(k)healP(Math.max(1,Math.round(S.maxHp*.012)));sfx('hit',.6)}},null,g);
    sfx('shot');netFx('ground',{x:pt.x,z:pt.z,r:8,c:c.col});
  },
  h_fa_f(c){
    const pt=aimPoint(15),lost=clamp(1-P.hp/S.maxHp,0,1);P.iframes=Math.max(P.iframes,1.4);
    telegraph(pt.x,pt.z,12,.95,()=>{},c.col);
    leapTo(pt.x,pt.z,.95,16,()=>{const x=P.x,z=P.z;hitStop(.14);sArea(c,x,z,12,28*(1+lost),{kb:16,freeze:1.2,burn:.8,big:true});
      boom(x,z,12,c.col,1);ringBurst(x,.6,z,70,0x2a0f3a,20,.7);pillar(x,z,c.col,30,.9);clearShots(x,z,12);healP(Math.round(S.maxHp*.2));netFx('nova',{x,z,r:12,c:c.col})});
    sfx('dash');
  },
  h_ar_q(c){
    const x=P.x,z=P.z;
    for(let w=0;w<2;w++)later(w*.28,()=>{hidWave(c,x,z,17,24,3.4,w?0xfff2a0:c.col,24);shockRing(x,z,4,c.col,.35);sfx('magic')});
    cam.shake=Math.max(cam.shake,.35);netFx('nova',{x,z,r:17,c:c.col});
  },
  h_ar_e(c){
    const a=c.a,x0=P.x,z0=P.z,done=new Set();
    for(let i=1;i<=8;i++){const x=x0+a.x*i*2.8,z=z0+a.z*i*2.8;telegraph(x,z,3.4,.15+i*.09,()=>{},c.col);
      later(.15+i*.09,()=>{boom(x,z,3.4,c.col,.35);pillar(x,z,0xfff2a0,14,.4);for(const m of mobsIn(x,z,3.4))if(!done.has(m)){done.add(m);sHit(c,m,8,{x:x-a.x,z:z-a.z,kb:9,freeze:.8,big:true})}clearShots(x,z,3.4)})}
    P.hGuard=2.5;act(2.5,t=>{P.hGuard=Math.max(0,2.5-t)},()=>{P.hGuard=0});
    P.shield=Math.min(S.maxHp*.8,P.shield+S.maxHp*.3);shockRing(P.x,P.z,3,c.col,.4);sfx('level');netFx('ground',{x:x0+a.x*12,z:z0+a.z*12,r:8,c:c.col});
  },
  h_ar_r(c){
    const pt=aimPoint(15),pts=[{x:pt.x,z:pt.z}];
    for(const m of mobsIn(P.x,P.z,20).slice(0,9))pts.push({x:m.x,z:m.z});
    while(pts.length<16){const a=rnd(0,TAU),r=rnd(2,9);pts.push({x:pt.x+Math.cos(a)*r,z:pt.z+Math.sin(a)*r})}
    pts.forEach((p,i)=>later(i*.09,()=>hidMeteor(c,p.x,p.z,4,4.5,c.col)));
    sfx('magic');netFx('ground',{x:pt.x,z:pt.z,r:10,c:c.col});
  },
  h_ar_f(c){
    const dur=10+(archSyn()?ARCH_SYN.ult:0),x=P.x,z=P.z,R=28,wait=1.4;
    P.iframes=Math.max(P.iframes,wait+.6);
    /* the whole field is condemned except the caster's sanctuary */
    const g=grp(x,0,z);flatDisc(g,R,0xff2a1a,.2,.1);flatRing(g,R,0xff5a2a,.8);flatDisc(g,5,0x6aff9a,.55,.14);flatRing(g,5,0xc8ffd8,.95,.16);
    act(wait,t=>{for(let i=0;i<3;i++){const a=rnd(0,TAU),r=rnd(6,R);emit(x+Math.cos(a)*r,.3,z+Math.sin(a)*r,0,rnd(3,7),0,.5,0xffe27a,0)}},null,g);
    pillar(x,z,0xffffff,40,wait);sfx('level');
    later(wait,()=>{
      const list=mobsIn(x,z,R);
      for(const m of list){pillar(m.x,m.z,0xfff2a0,28,.5);sHit(c,m,25,{x,z,freeze:1.5,big:true})}
      for(let i=0;i<18;i++){const a=rnd(0,TAU),r=rnd(7,R-3);pillar(x+Math.cos(a)*r,z+Math.sin(a)*r,0xffe27a,30,.5)}
      clearShots(x,z,R);flashDisc(x,z,R,0xfff2a0,.6);shockRing(x,z,R,c.col,.8);ringBurst(x,.6,z,70,c.col,26,.8);cam.shake=Math.max(cam.shake,1.1);hitStop(.15);sfx('boom');
      hidHeal(.5,.2,18);
      P.buff={t:dur,atk:1.5,aps:1.35,spd:1.2};
      act(dur,(t,dt)=>{if(Math.random()<dt*18)emit(P.x+rnd(-1.8,1.8),rnd(.2,4),P.z+rnd(-1.8,1.8),0,1.4,0,.6,Math.random()<.5?0xffd24a:0xffffff,0)});
    });
    netFx('nova',{x,z,r:R,c:c.col});
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
  const on=SES.pf&&HIDDEN[hidOn(SES.pf)];
  for(const k of['q','e','r','f'])for(const p of['sk-','tb-']){const el=$(p+k);if(el)el.style.boxShadow=on?'0 0 12px '+on.col+', inset 0 0 10px '+on.col:''}
  const box=$('menu');if(!box)return;let b=hidHud.b;
  const h=SES.pf&&HIDDEN[SES.pf.hidden];
  if(!b){if(!h)return;b=hidHud.b=document.createElement('button');b.className='mbtn';b.id='hidbtn';b.onclick=()=>openHidden();b.style.cssText='font-weight:800;padding:6px 10px;border-radius:10px;border:1px solid;background:#1c2136;cursor:pointer;pointer-events:auto';box.appendChild(b)}
  b.style.display=h?'':'none';if(h){b.style.color=b.style.borderColor=h.col;b.textContent=h.name}
}
