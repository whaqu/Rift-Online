/* ---------------- weapon looks: shape by class x kind (3), material/glow/size by tier (1-8) ---------------- */
const WACC=[0x9aa0aa,0xc0c8d4,0x8fb8ff,0x6ad0ff,0x6affd0,0xff9a5a,0xffe27a,0xff7ae8,0x8affef];
const WBLD=[0x8a8f98,0xaab0bc,0xd8dee8,0xc4e4ff,0xc4fff0,0xffdcc8,0xfff2b8,0xffd4f6,0xd4fffa];
function wmats(t){
  const c=WACC[t-1],em=t>=4;
  return{t,c,
    blade:M(WBLD[t-1],{metalness:.7,roughness:.25,emissive:em?c:0x1a2030,emissiveIntensity:em?.04+.015*t:.04}),
    edge:EM(c,.25+.05*t),
    grip:M(t>=6?0x3a2a50:0x4a2c18),
    gold:M(t>=7?0xffe6a0:0xe8b73a,{metalness:.6,roughness:.35}),
    wood:M(t>=5?0x5a3a6a:0x6b4a2b),
    dark:M(0x20262e,{metalness:.5,roughness:.4}),
    steel:M(t>=3?0xc8d0d8:0x8a9098,{metalness:.7,roughness:.3})
  };
}
const wclear=g=>{while(g.children.length)g.remove(g.children[0])};
/* orbiting runes / sparks circling the weapon (animated in animHeroFor via o.wfx); none below tier 3 */
let WCUR=null;
const WFXN=[0,0,2,3,4,5,6,8,10];
function wglow(k,m,x,y,z,s){
  const n=WFXN[m.t-1];if(!n||!WCUR)return null;
  s=s||1.4;const list=[];
  for(let i=0;i<n;i++){
    const rune=i%3===2?SP(.035+.003*m.t,EM(m.c,2),0,0,0,k,5,4):OC(.05+.004*m.t,EM(m.c,1.8),0,0,0,k);
    if(i%3!==2)rune.scale.set(.7,1.5,.3);
    list.push(rune);
  }
  WCUR.wfx.push({list,x,y,z,r:.3+.1*s,h:.22+.2*s,sp:1.6+.18*m.t});
  return null;
}
const wglw=(c,sz,op)=>glow(c,sz*.7,op*.45);
/* tier 8 gets an orbiting-looking rune ring, tier 6+ a small gem */
function wcrown(k,m,yc,r){if(m.t>=8){const ring=mesh(new THREE.TorusGeometry(r||.3,.022,4,14),EM(m.c,1.5),0,yc,0,k);ring.rotation.x=Math.PI/2}}
/* straight blade along +y */
function wblade(k,m,len,wid,y0,thick){
  const t=thick||.05;
  BX(wid,len,t,m.blade,0,y0+len/2,0,k);
  CN(wid*.62,Math.max(.18,len*.12),m.blade,0,y0+len+Math.max(.18,len*.12)/2-.01,0,k,4).scale.set(1,1,t/wid*1.6);
  if(m.t>=3)BX(wid*.18,len*.96,t*1.25,m.edge,0,y0+len/2,0,k);
}
/* blade bent forward (+z) in n segments — katana / curved swords */
function wcurve(k,m,len,wid,curv,y0){
  const n=6,seg=len/n;let y=y0,z=0;
  for(let i=0;i<n;i++){const a=i*.07*curv,my=y+Math.cos(a)*seg/2,mz=z+Math.sin(a)*seg/2;
    const b=BX(wid*(1-i*.05),seg*1.04,.05,m.blade,0,my,mz,k);b.rotation.x=a;
    if(m.t>=3){const e=BX(wid*.16,seg*1.0,.07,m.edge,0,my,mz+.02,k);e.rotation.x=a}
    y+=Math.cos(a)*seg;z+=Math.sin(a)*seg}
  return{y,z};
}
function whilt(k,m,yg,w){BX(w||.52,.1,.15,m.gold,0,yg,0,k);CY(.06,.06,.42,m.grip,0,yg-.22,0,k);SP(.09,m.gold,0,yg-.46,0,k,6,5)}
function wsecond(o){if(!o.weapon2){o.weapon2=grp(0,-.76,0,o.armL)}o.weapon2.visible=true;wclear(o.weapon2);o.weapon2.rotation.x=o.weapon.rotation.x;const k=grp(0,0,0,o.weapon2);return k}
function wscale(k,t){k.scale.setScalar(.94+.03*t)}
function wbook(k,m,cover,pageGlow,o){
  BX(.46,.07,.62,cover,0,-.3,0,k);BX(.4,.08,.55,M(0xf4ecd8),0,-.27,0,k);BX(.06,.1,.64,m.gold,-.24,-.3,0,k);
  BX(.2,.09,.2,EM(pageGlow,.9+.1*m.t),0,-.22,0,k);
  const gl=wglw(pageGlow,1.6+.1*m.t,.55);gl.position.set(0,-.15,0);k.add(gl);
  const runes=[];for(let i=0;i<3;i++){const r=OC(.07,EM(pageGlow,1.4),0,0,0,k);r.position.set(Math.cos(i*2.1)*.35,.15+i*.1,Math.sin(i*2.1)*.35);runes.push(r)}
  o.orb=runes[0];o.orbGlow=gl;wglow(k,m,0,-.2,0,1.2);
}
function wstaff(k,m,len,orbCol,orbR,o){
  CY(.05,.06,len,m.wood,0,len/2-.8,0,k);
  const top=len-.75,orb=SP(orbR,EM(orbCol,1.3),0,top+.08,0,k,10,8);
  const cl=mesh(new THREE.TorusGeometry(orbR*1.25,.04,5,10),m.gold,0,top-.1,0,k);cl.rotation.x=Math.PI/2;
  if(m.t>=5)for(let i=0;i<4;i++){const p=CN(.05,.34,m.gold,Math.cos(i*1.57)*orbR*1.2,top+.1,Math.sin(i*1.57)*orbR*1.2,k,4);p.rotation.z=-Math.cos(i*1.57)*.4;p.rotation.x=Math.sin(i*1.57)*.4}
  const gl=wglw(orbCol,1.7+.1*m.t,.7);gl.position.set(0,top+.08,0);k.add(gl);o.orb=orb;o.orbGlow=gl;wcrown(k,m,top-.3,orbR*1.5);wglow(k,m,0,top-.1,0,1.2);
}
function wpistol(k,m){
  BX(.1,.5,.1,m.steel,0,-.22,0,k);BX(.12,.16,.14,m.gold,0,-.02,0,k);BX(.09,.2,.09,m.grip,0,.04,-.12,k).rotation.x=.35;
  if(m.t>=4)BX(.03,.46,.12,m.edge,0,-.22,0,k);
  if(m.t>=3)SP(.07,EM(m.c,1.3),0,-.5,0,k,5,4);
}

const WLOOK={
  warrior(o,ty,t,m){
    const k=grp(0,0,0,o.weapon),sh=o.shield;if(sh)sh.visible=ty!==2;
    if(ty===0){wblade(k,m,1.75,.17,.14);whilt(k,m,.12,.52)}
    else if(ty===1){wblade(k,m,2.25,.32,.2,.07);BX(.12,.5,.08,m.blade,0,.3,0,k);whilt(k,m,.14,.85);CY(.07,.07,.5,m.grip,0,-.5,0,k,6)}
    else{wblade(k,m,1.2,.13,.14);whilt(k,m,.12,.4);const k2=wsecond(o);wblade(k2,m,1.2,.13,.14);whilt(k2,m,.12,.4);wscale(k2,t)}
    wglow(k,m,0,1.1,0,1.8);wcrown(k,m,.6,.34);wscale(k,t);
  },
  mage(o,ty,t,m){
    const k=grp(0,0,0,o.weapon),col=t>=3?m.c:0x5ee7ff;
    if(ty===0)wstaff(k,m,2.5,col,.17+.012*t,o);
    else if(ty===1)wbook(k,m,M(t>=4?0x3a2a7a:0x5a3a2a),col,o);
    else{CY(.025,.035,.95,m.wood,0,-.1,0,k,5);const g=OC(.1+.01*t,EM(col,1.5),0,.42,0,k);g.scale.set(.8,1.4,.8);const gl=wglw(col,1.3+.1*t,.75);gl.position.set(0,.42,0);k.add(gl);
      for(const s of[-1,1])CN(.03,.2,m.gold,s*.09,.34,0,k,4).rotation.z=-s*.4;o.orb=g;o.orbGlow=gl;wcrown(k,m,.2,.2);wglow(k,m,0,.3,0,.9)}
    wscale(k,t);
  },
  archer(o,ty,t,m){
    const k=grp(0,0,0,o.weapon);
    if(ty===0){const s=.85+.02*t,geo=new THREE.TorusGeometry(s,.055,6,20,Math.PI);geo.rotateZ(Math.PI/2);geo.rotateY(Math.PI/2);
      mesh(geo,m.wood,0,0,0,k);BX(.015,s*2,.015,M(0xeeeeee),0,0,0,k);
      if(t>=4){for(const sg of[-1,1])SP(.07,EM(m.c,1.4),0,sg*s,0,k,5,4)}wglow(k,m,0,0,.3,2.2)}
    else if(ty===1){BX(.12,1.2,.15,m.wood,0,-.45,0,k);BX(1.25,.08,.12,m.steel,0,-.95,0,k);
      BX(1.15,.015,.015,M(0xeeeeee),0,-.82,0,k);BX(.045,.75,.045,m.edge,0,-.55,0,k);CN(.07,.2,m.blade,0,-1.0,0,k,4).rotation.x=Math.PI;
      BX(.06,.3,.2,m.grip,0,.12,-.05,k);wglow(k,m,0,-.6,0,1.6)}
    else{for(const dy of[-.34,.34]){const geo=new THREE.TorusGeometry(.5+.01*t,.045,6,16,Math.PI);geo.rotateZ(Math.PI/2);geo.rotateY(Math.PI/2);mesh(geo,m.wood,0,dy,0,k);BX(.012,1,.012,m.edge,0,dy,0,k)}
      BX(.08,.9,.1,m.steel,0,0,0,k);if(t>=4)for(const sg of[-1,1])SP(.06,EM(m.c,1.4),0,sg*.84,0,k,5,4);wglow(k,m,0,0,.2,2)}
    wcrown(k,m,0,.7);wscale(k,t);
  },
  rogue(o,ty,t,m){
    const k=grp(0,0,0,o.weapon),k2=wsecond(o);
    for(const q of[k,k2]){
      if(ty===0){if(q===k2)continue;wblade(q,m,1.45,.085,.12,.032);BX(.28,.06,.12,m.edge,0,.1,0,q);CY(.038,.038,.34,m.grip,0,-.09,0,q,8)}
      else if(ty===1){CY(.04,.04,.8,m.grip,0,.05,0,q,6);
        const tor=mesh(new THREE.TorusGeometry(.5,.045,5,14,Math.PI*.85),m.blade,0,.5,.5,q);tor.rotation.y=Math.PI/2;
        if(t>=3){const e=mesh(new THREE.TorusGeometry(.52,.018,4,14,Math.PI*.85),m.edge,0,.5,.5,q);e.rotation.y=Math.PI/2}
        CN(.06,.2,m.blade,0,.92,1.02,q,4).rotation.x=2.2;BX(.2,.05,.08,m.gold,0,.4,0,q)}
      else{const st=grp(0,-.5,0,q);for(let i=0;i<4;i++){const b=BX(.9,.035,.16,m.blade,0,0,0,st);b.rotation.y=i*Math.PI/4}
        SP(.09,EM(m.c,1.3),0,0,0,st,6,5);st.rotation.x=Math.PI/2;st.position.set(0,-.3,0)}
      wglow(q,m,0,ty===2?-.3:.7,0,1.3);wscale(q,t);
    }
  },
  cleric(o,ty,t,m){
    const k=grp(0,0,0,o.weapon),col=t>=3?m.c:0xfff2a0;
    if(ty===0){wstaff(k,m,1.9,col,.12+.01*t,o);BX(.06,.5,.06,m.gold,0,1.38,0,k);BX(.4,.06,.06,m.gold,0,1.44,0,k)}
    else if(ty===1){CY(.05,.06,1.4,m.wood,0,.3,0,k);const hd=SP(.2+.012*t,m.blade,0,1.1,0,k,8,6);
      for(let i=0;i<8;i++){const a=i/8*TAU,sp=CN(.06,.2,m.steel,Math.cos(a)*.22,1.1,Math.sin(a)*.22,k,4);sp.rotation.z=-Math.cos(a)*1.3;sp.rotation.x=Math.sin(a)*1.3}
      CN(.07,.22,m.steel,0,1.36,0,k,4);const bd=mesh(new THREE.TorusGeometry(.2,.03,4,10),m.gold,0,.88,0,k);bd.rotation.x=Math.PI/2;o.orb=null;o.orbGlow=null;wglow(k,m,0,1.1,0,1.7)}
    else{CY(.04,.04,.4,m.gold,0,.05,0,k,6);CY(.15,.18,.05,m.gold,0,-.15,0,k,10);CY(.21,.1,.32,m.gold,0,.38,0,k,10);
      CY(.19,.19,.03,EM(col,1.4),0,.54,0,k,10);const gl=wglw(col,2+.15*t,.8);gl.position.set(0,.62,0);k.add(gl);
      const rg=mesh(new THREE.TorusGeometry(.3,.025,4,14),EM(col,1.3),0,.95,0,k);rg.rotation.x=Math.PI/2;o.orb=rg;o.orbGlow=gl;wglow(k,m,0,.4,0,1.1)}
    wscale(k,t);
  },
  lancer(o,ty,t,m){
    const k=grp(0,0,0,o.weapon);
    if(ty===0){CY(.04,.04,3,m.wood,0,.6,0,k,6);CN(.12,.55,m.blade,0,2.35,0,k,5);BX(.3,.08,.08,m.gold,0,2.05,0,k);CN(.1,.34,M(0xd8353a),0,1.9,0,k,5).rotation.x=Math.PI;wglow(k,m,0,2.3,0,1.6)}
    else if(ty===1){CY(.045,.045,3,m.wood,0,.6,0,k,6);CN(.09,.5,m.blade,0,2.8,0,k,4);
      const ax=BX(.55,.62,.06,m.blade,.3,2.25,0,k);ax.rotation.z=-.1;if(t>=3)BX(.08,.6,.08,m.edge,.55,2.25,0,k);BX(.3,.1,.07,m.gold,0,2.0,0,k);
      CN(.07,.34,m.blade,-.2,2.2,0,k,4).rotation.z=.9;wglow(k,m,.2,2.3,0,1.8)}
    else{CY(.04,.04,1.9,m.wood,0,.25,0,k,6);const hd=OC(.18,m.blade,0,1.4,0,k);hd.scale.set(.6,1.8,.3);BX(.26,.07,.07,m.gold,0,1.15,0,k);
      for(let i=0;i<3;i++){const rb=BX(.04,.5+i*.1,.02,M(i%2?0xd8353a:0xf2d27a),(i-1)*.07,.9,0,k);rb.rotation.z=(i-1)*.25}wglow(k,m,0,1.4,0,1.3)}
    wcrown(k,m,1.2,.3);wscale(k,t);
  },
  monk(o,ty,t,m){
    for(const q of[grp(0,0,0,o.weapon),wsecond(o)]){
      if(ty===0){const gl=wglw(m.c,1.3+.12*t,.5);q.add(gl);const bd=mesh(new THREE.TorusGeometry(.17,.03,5,10),EM(m.c,.8+.1*t),0,-.15,0,q);bd.rotation.x=Math.PI/2}
      else if(ty===1){BX(.34,.4,.34,m.blade,0,-.12,0,q);BX(.4,.1,.14,m.gold,0,-.32,.1,q);for(let i=-1;i<=1;i++)CN(.05,.16,m.steel,i*.11,-.4,.14,q,4).rotation.x=-Math.PI/2;BX(.36,.08,.36,m.gold,0,.1,0,q);wglow(q,m,0,-.2,0,1.2)}
      else{for(let i=-1;i<=1;i++){const cl=BX(.04,.62,.02,m.blade,i*.09,-.5,0,q);cl.rotation.z=i*.08;if(t>=3)BX(.012,.6,.03,m.edge,i*.09,-.5,0,q)}BX(.3,.07,.12,m.gold,0,-.08,0,q);wglow(q,m,0,-.45,0,1.3)}
      wscale(q,t);
    }
  },
  gunner(o,ty,t,m){
    const k=grp(0,0,0,o.weapon);
    if(ty===0)wpistol(k,m);
    else if(ty===1){BX(.12,.95,.12,m.steel,-.05,-.58,0,k);BX(.12,.95,.12,m.steel,.07,-.58,0,k);BX(.18,.32,.2,m.wood,0,-.35,0,k);BX(.14,.2,.16,m.gold,0,-.02,0,k);BX(.1,.5,.14,m.wood,0,.3,-.1,k).rotation.x=.3;
      if(t>=4)BX(.03,.9,.1,m.edge,0,-.58,0,k);SP(.08,EM(m.c,1.3),0,-1.08,0,k,5,4)}
    else{wpistol(k,m);const k2=wsecond(o);wpistol(k2,m);wscale(k2,t)}
    wglow(k,m,0,-.45,0,1.3);wscale(k,t);
  },
  summoner(o,ty,t,m){
    const k=grp(0,0,0,o.weapon),col=t>=3?m.c:0x6bffd0;
    if(ty===0){wstaff(k,m,2.2,col,.17+.012*t,o);for(const s of[-1,1])CN(.1,.4,M(0x6bd06a),s*.2,1.35,0,k,4).rotation.z=-s*.7}
    else if(ty===1)wbook(k,m,M(0x2a5a3a),col,o);
    else{CY(.03,.03,.5,m.wood,0,.15,0,k,5);BX(.5,.04,.04,m.wood,0,.42,0,k);
      const dl=grp(0,-.5,.0,k);SP(.14,M(0xe8d8b8),0,.2,0,dl,8,6);SP(.1,M(0xe8d8b8),0,-.05,0,dl,6,5);SP(.025,EM(col,1.8),-.05,.22,.12,dl,4,3);SP(.025,EM(col,1.8),.05,.22,.12,dl,4,3);
      for(const s of[-1,1]){BX(.015,.7,.015,M(0xdddddd),s*.24,.07,0,k)}
      const gl=wglw(col,1.8+.12*t,.7);gl.position.set(0,-.3,0);k.add(gl);o.orb=dl;o.orbGlow=gl;wglow(k,m,0,0,0,1.2)}
    wscale(k,t);
  },
  darknight(o,ty,t,m){
    const k=grp(0,0,0,o.weapon),edge=EM(t>=3?m.c:0xff3a6a,.9);
    if(ty===0){BX(.3,2.1,.07,m.steel,0,1.1,0,k);BX(.05,2.0,.08,edge,0,1.1,0,k);BX(.62,.12,.2,m.dark,0,.12,0,k);CY(.06,.06,.4,M(0x1a1420),0,-.12,0,k);
      for(let i=0;i<3;i++)CN(.07,.22,m.steel,.17,.5+i*.5,0,k,4).rotation.z=-1.2}
    else if(ty===1){const e=wcurve(k,m,2.2,.15,1.3,.15);BX(.42,.08,.16,m.dark,0,.12,0,k);CY(.05,.05,.7,M(0x1a1420),0,-.25,-.02,k,6);
      for(let i=0;i<4;i++)BX(.045,.1,.02,edge,0,-.1-i*.14,.03,k)}
    else{for(const q of[k,wsecond(o)]){wblade(q,m,.8,.14,.1,.05);for(let i=0;i<3;i++)CN(.04,.14,m.steel,.09,.3+i*.2,0,q,4).rotation.z=-1.2;BX(.3,.07,.1,m.dark,0,.08,0,q);BX(.03,.78,.07,edge,0,.5,0,q);CY(.04,.04,.28,M(0x1a1420),0,-.08,0,q,6);wscale(q,t)}}
    wglow(k,m,0,1.1,0,1.8);wcrown(k,m,.7,.3);wscale(k,t);
  }
};

/* body aura for the top weapon grades: 7 storm (lightning), 8 eternity (gyro rings + clock), 9 celestial (halo + wings) */
const AUKIND={7:'storm',8:'eternity',9:'celestial',10:'omni'};
const AUMAT={};
const aumat=(c,op)=>AUMAT[c+'_'+op]||(AUMAT[c+'_'+op]=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide}));
let WINDTEX=null;
/* three crescent wind streaks: thin faded tail -> thick bright head */
function windTex(){
  if(WINDTEX)return WINDTEX;
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  if(x&&x.arc){
    x.lineCap='round';
    for(let k=0;k<3;k++)for(let i=0;i<34;i++){const u=i/33,a=k*TAU/3+u*1.75,r=90+u*22;
      for(const[col,w]of[['40,190,185',17],['235,255,255',7]]){x.strokeStyle='rgba('+col+','+(u*u*.9+.05).toFixed(2)+')';x.lineWidth=1+w*Math.sin(Math.min(1,u*.93)*Math.PI*.62);x.beginPath();x.arc(128,128,r,a,a+.075);x.stroke()}}
  }
  return WINDTEX=new THREE.CanvasTexture(c);
}
function auraBuild(kind,form){
  const g=new THREE.Group(),add=(geo,mat,x,y,z,p)=>mesh(geo,mat,x,y,z,p||g,false);
  const halo=(c,y,sz,op)=>{const s=glow(c,sz,op);s.position.set(0,y,0);g.add(s)};
  let anim;
  if(kind==='dark'){
    /* 크로마이스: void seal on the ground, black blades orbiting, wisps of darkness rising, wings of darkness on the back */
    const black=aumat(0x14081f,.92),vio=aumat(0x8a2cff,.85),deep=aumat(0x4a0f8a,.7),red=aumat(0xff1f4a,.9);
    const seal=new THREE.Group();seal.position.y=.09;g.add(seal);
    for(const[r,w,m]of[[1.55,.05,deep],[1.25,.02,vio],[.75,.018,red]])add(new THREE.TorusGeometry(r,w,4,48),m,0,0,0,seal).rotation.x=Math.PI/2;
    const spike=new THREE.ConeGeometry(.09,.55,4);
    for(let i=0;i<9;i++){const a=i*TAU/9,s=add(spike,i%3?vio:red,Math.sin(a)*1.35,0,Math.cos(a)*1.35,seal);s.rotation.set(Math.PI/2,a,0,'YXZ');s.scale.z=.15}
    /* wings of darkness: black blade-feathers with violet spines, spread out from the shoulder blades */
    const feather=new THREE.ConeGeometry(.11,1,4),spine=new THREE.ConeGeometry(.028,.85,4),ember=new THREE.OctahedronGeometry(.055,0);
    const wings=[-1,1].map(sd=>{const w=new THREE.Group();w.position.set(sd*.22,1.75,-.45);g.add(w);
      for(let i=0;i<6;i++){const a=1.05-i*.3,l=1.75-i*.16,x=sd*Math.cos(a),y=Math.sin(a);
        const fe=add(feather,black,x*l/2,y*l/2,-i*.012,w);fe.scale.set(1.15,l,.2);fe.rotation.z=sd*(a-Math.PI/2);
        const sp=add(spine,vio,x*l*.55,y*l*.55,.03-i*.012,w);sp.scale.set(1,l,.4);sp.rotation.z=fe.rotation.z;
        add(ember,i%2?vio:red,x*(l+.1),y*(l+.1),0,w)}
      return w});
    const bl=new THREE.ConeGeometry(.1,.95,4),core=new THREE.ConeGeometry(.03,.8,4);
    const blades=[0,1,2,3,4].map(()=>{const b=new THREE.Group();g.add(b);add(bl,black,0,0,0,b).scale.z=.3;add(core,vio,0,0,.03,b);return b});
    const wisp=new THREE.OctahedronGeometry(.12,0),wisps=[];
    for(let i=0;i<14;i++)wisps.push(add(wisp,i%4===0?vio:i%2?deep:black,0,0,0));
    halo(0x5a12b0,1.3,4,.5);halo(0x2a0050,.4,3.6,.55);
    anim=t=>{
      seal.rotation.y=-t*.5;
      wings.forEach((w,i)=>{const sd=i?1:-1;w.rotation.y=sd*(.28+Math.sin(t*2)*.2);w.rotation.z=sd*Math.sin(t*2-.6)*.07});
      blades.forEach((b,i)=>{const a=i*TAU/5+t*.9;b.position.set(Math.cos(a)*1.25,1.25+Math.sin(t*2+i*1.3)*.2,Math.sin(a)*1.25);b.rotation.set(Math.PI,-a,0)});
      wisps.forEach((w,i)=>{const k=(t*.3+i/14)%1,a=i*2.4-t*.7,r=.45+.55*((i*7)%5)/5;w.position.set(Math.cos(a)*r,.1+k*2.8,Math.sin(a)*r);const s=Math.sin(k*Math.PI)+.1;w.scale.set(s*.7,s*1.9,s*.7)});
    };
  }else if(kind==='storm'){
    /* whirlwind: stacked spinning wind streaks widening upward, with leaves carried up around the body */
    const wm=new THREE.MeshBasicMaterial({map:windTex(),transparent:true,depthWrite:false,side:THREE.DoubleSide});
    const disc=new THREE.PlaneGeometry(1,1);
    const layers=[[.2,2.5],[.85,2.9],[1.55,3.3]].map(([y,d],i)=>{const w=new THREE.Group();w.position.y=y;g.add(w);const m=add(disc,wm,0,0,0,w);m.rotation.x=-Math.PI/2;m.scale.set(d,d,1);return w});
    const leafM=[aumat(0x8ff0c0,.95),aumat(0xeaffff,.95)],leaf=new THREE.OctahedronGeometry(.13,0);
    const leaves=[0,1,2,3,4,5,6,7].map(i=>{const m=add(leaf,leafM[i%2],0,0,0);m.scale.set(1.3,.18,.6);return m});
    anim=t=>{
      layers.forEach((w,i)=>{w.rotation.y=-t*(5.2-i*.9)-i*1.3;w.position.y=[.2,.85,1.55][i]+Math.sin(t*3+i*2)*.08});
      leaves.forEach((m,i)=>{const k=(t*.6+i/8)%1,a=t*4.2+i*2.4,r=.7+k*.9;m.position.set(Math.cos(a)*r,.15+k*2.1,Math.sin(a)*r);m.rotation.set(t*5+i,-a,t*3)});
    };
  }else if(kind==='eternity'){
    const pink=aumat(0xe45cff,.9),deep=aumat(0x7a2fd0,.85),pale=aumat(0xffd6ff,.95),bead=new THREE.OctahedronGeometry(.14,0);
    const rings=[0,1].map(i=>{const tilt=new THREE.Group();tilt.position.y=1.2;tilt.rotation.z=i?-.55:.55;g.add(tilt);const sp=new THREE.Group();tilt.add(sp);tilt.scale.setScalar(.72);
      add(new THREE.TorusGeometry(1.35+i*.2,.065,4,40),i?deep:pink,0,0,0,sp).rotation.x=Math.PI/2;
      add(bead,pale,1.35+i*.2,0,0,sp).scale.setScalar(1.5);add(bead,pale,-1.35-i*.2,0,0,sp).scale.setScalar(1.5);return sp});
    const clock=new THREE.Group();clock.position.set(0,1.85,-.75);clock.rotation.x=-.8;clock.scale.setScalar(.9);g.add(clock);
    add(new THREE.TorusGeometry(.92,.08,4,36),pink,0,0,0,clock);add(new THREE.TorusGeometry(.72,.015,4,32),deep,0,0,0,clock);
    const tick=new THREE.BoxGeometry(.08,.19,.04);
    for(let i=0;i<12;i++){const a=i/12*TAU;add(tick,pale,Math.sin(a)*.82,Math.cos(a)*.82,0,clock).rotation.z=-a}
    const hands=[.68,.46].map(l=>{const h=new THREE.Group();clock.add(h);add(new THREE.BoxGeometry(.09,l,.04),pale,0,l/2,0,h);return h});
    halo(0xb04cff,1.2,3.2,.45);
    anim=t=>{rings[0].rotation.y=t*1.5;rings[1].rotation.y=-t*1.1;hands[0].rotation.z=-t*2.4;hands[1].rotation.z=-t*.35;clock.position.y=1.85+Math.sin(t*1.3)*.07};
  }else if(kind==='omni'){
    /* 만물의 검: seven spectral blades fanned out behind the back, a rune halo, a ground seal and rising motes */
    const mag=aumat(0xff4fd8,.9),pale=aumat(0xffe9fb,.95),gold=aumat(0xffd24a,.9),cols=OMNI_COL.map(c=>parseInt(c.slice(1),16));
    const fan=new THREE.Group();fan.position.set(0,1.75,-.7);g.add(fan);
    const tip=new THREE.ConeGeometry(.11,.34,4),body=new THREE.BoxGeometry(.13,.95,.035),guard=new THREE.BoxGeometry(.36,.07,.07),hilt=new THREE.BoxGeometry(.06,.24,.06);
    const blades=[0,1,2,3,4,5,6].map(i=>{
      const piv=new THREE.Group();fan.add(piv);const s=new THREE.Group();piv.add(s);const m=aumat(cols[i],.8);
      if(form==='archer'){add(new THREE.BoxGeometry(.045,1.2,.045),m,0,.95,0,s);add(tip,pale,0,1.68,0,s).scale.z=.3;for(const d of[-1,1])add(new THREE.BoxGeometry(.05,.26,.02),gold,d*.07,.45,0,s).rotation.z=d*.6}
      else if(form==='wand'){add(new THREE.BoxGeometry(.05,1,.05),gold,0,.85,0,s);add(new THREE.OctahedronGeometry(.17,0),m,0,1.5,0,s);add(new THREE.TorusGeometry(.24,.02,4,20),pale,0,1.5,0,s)}
      else if(form==='lancer'){add(new THREE.BoxGeometry(.055,1.35,.055),gold,0,.9,0,s);add(new THREE.OctahedronGeometry(.19,0),m,0,1.72,0,s).scale.set(.7,1.9,.25);add(guard,pale,0,1.42,0,s)}
      else if(form==='monk'){add(new THREE.BoxGeometry(.28,.3,.18),m,0,1.35,0,s);for(let j=-1;j<=1;j++)add(new THREE.BoxGeometry(.07,.12,.2),pale,j*.09,1.55,0,s);add(guard,gold,0,1.15,0,s);add(hilt,mag,0,.95,0,s)}
      else if(form==='gunner'){add(new THREE.CylinderGeometry(.09,.09,.5,8),m,0,1.15,0,s);add(new THREE.ConeGeometry(.09,.24,8),pale,0,1.52,0,s);add(new THREE.CylinderGeometry(.11,.11,.07,8),gold,0,.88,0,s);add(hilt,mag,0,.55,0,s)}
      else{add(body,m,0,.98,0,s);add(new THREE.BoxGeometry(.035,.95,.05),pale,0,.98,0,s);add(tip,pale,0,1.62,0,s).scale.z=.3;add(guard,gold,0,.47,0,s);add(hilt,mag,0,.32,0,s)}
      return{piv,s,a:(i-3)*.52}});
    const halo1=add(new THREE.TorusGeometry(.5,.035,5,36),gold,0,0,0,fan),halo2=add(new THREE.TorusGeometry(.34,.018,4,32),mag,0,0,0,fan);
    const seal=new THREE.Group();seal.position.y=.1;g.add(seal);
    for(const[r,t2,m]of[[1.5,.025,mag],[1.2,.015,gold]])add(new THREE.TorusGeometry(r,t2,4,48),m,0,0,0,seal).rotation.x=Math.PI/2;
    const mark=new THREE.BoxGeometry(.05,.02,.42);
    for(let i=0;i<8;i++){const a=i*TAU/8,m=add(mark,i%2?gold:pale,Math.sin(a)*1.35,0,Math.cos(a)*1.35,seal);m.rotation.y=a}
    const mote=new THREE.OctahedronGeometry(.09,0),motes=[0,1,2,3,4,5,6,7,8].map(i=>add(mote,aumat(cols[i],.95),0,0,0));
    halo(0xff4fd8,1.5,3.6,.4);
    anim=t=>{
      const breathe=Math.sin(t*1.6)*.5+.5;
      blades.forEach((b,i)=>{b.piv.rotation.z=-b.a*(.92+breathe*.12);b.s.position.y=Math.sin(t*2.4+i*.9)*.09});
      halo1.rotation.z=t*.8;halo2.rotation.z=-t*1.4;halo1.scale.setScalar(1+breathe*.08);
      seal.rotation.y=t*.6;
      motes.forEach((m,i)=>{const k=(t*.35+i/9)%1,a=i*TAU/9+t*1.1,r=1.35-k*.55;m.position.set(Math.cos(a)*r,.12+k*2.5,Math.sin(a)*r);m.scale.setScalar(Math.sin(k*Math.PI)+.2);m.rotation.y=t*4});
    };
  }else{
    const gold=aumat(0xffc21a,1),white=aumat(0xfffbe8,.95),soft=aumat(0xffd24a,.95);
    const crown=new THREE.Group();crown.position.y=2.85;g.add(crown);
    add(new THREE.TorusGeometry(.6,.1,6,28),gold,0,0,0,crown).rotation.x=Math.PI/2;
    const ray=new THREE.ConeGeometry(.05,.24,4);
    for(let i=0;i<8;i++){const a=i/8*TAU,m=add(ray,white,Math.cos(a)*.84,0,Math.sin(a)*.84,crown);m.rotation.set(0,-a,-Math.PI/2)}
    const feather=new THREE.ConeGeometry(.13,1,4);
    const wings=[-1,1].map(sd=>{const w=new THREE.Group();w.position.set(sd*.2,1.7,-.5);w.rotation.x=-1.3;w.scale.setScalar(1.15);g.add(w);
      for(let i=0;i<6;i++){const a=1.25-i*.34,l=1.45-i*.1,f=add(feather,i%2?gold:soft,sd*Math.cos(a)*l/2,Math.sin(a)*l/2,-i*.012,w);f.scale.set(1.8,l,.22);f.rotation.z=sd*(a-Math.PI/2)}
      return w});
    const mote=new THREE.OctahedronGeometry(.13,0),motes=[];
    for(let i=0;i<7;i++)motes.push(add(mote,i%2?gold:white,0,0,0));
    halo(0xffb820,1.4,5,.6);
    anim=t=>{
      crown.rotation.y=t*.9;crown.position.y=2.85+Math.sin(t*2)*.06;
      wings.forEach((w,i)=>{w.rotation.y=(i?1:-1)*(.22+Math.sin(t*2.2)*.22)});
      motes.forEach((m,i)=>{const k=(t*.42+i/7)%1,a=i*2.4+t*.8;m.position.set(Math.cos(a)*(1-k*.4),.1+k*2.9,Math.sin(a)*(1-k*.4));m.scale.setScalar(Math.sin(k*Math.PI)+.15);m.rotation.y=t*3});
    };
  }
  anim(0);return{kind,form,g,anim};
}
function auraApply(o,t,form){
  const kind=form==='chroma'?'dark':AUKIND[t]||null;form=kind==='omni'?form:null;
  if(o.wau&&o.wau.kind===kind&&o.wau.form===form)return;
  if(o.wau){o.g.remove(o.wau.g);o.wau=null}
  if(kind&&o.g){o.wau=auraBuild(kind,form);o.g.add(o.wau.g)}
}

/* 만물의 룬 aura: nine elemental fragments (low-poly 3D, one per region) ride a ring of light streams over a golden rune circle. No flat icons. */
const OMNI_COL=['#8dff6a','#7ff0dc','#ff6a2a','#6ee7ff','#ffe24a','#c86bff','#e4f6ff','#ffb85a','#fff0b0'];   // zid 1..9
const OMNI_R=2.05,OMTEX={};
/* 'trail': nine tapered comet streaks, one behind each fragment. 'floor': thin concentric rings, rune ticks, nine-colour arcs */
function omniTex(kind){
  if(OMTEX[kind])return OMTEX[kind];
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  if(x&&x.arc){
    x.translate(128,128);x.lineCap='round';
    const arc=(r,a,b,col,w,al)=>{x.globalAlpha=al;x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.arc(0,0,r,a,b);x.stroke()};
    if(kind==='trail'){
      OMNI_COL.forEach((col,k)=>{const head=k*TAU/9,len=.62;
        for(let i=0;i<20;i++){const u=i/19,a=head-len*(1-u);arc(100,a,a+len/19,col,1+u*u*7,u*u*.8)}
        arc(100,head-.16,head,'#ffffff',1.5,.8)});
    }else{
      arc(112,0,TAU,'#ffd24a',2.5,.85);arc(106,0,TAU,'#ffd24a',1,.6);arc(78,0,TAU,'#ffd24a',1.5,.55);
      OMNI_COL.forEach((col,k)=>{const a=k*TAU/9;arc(92,a+.05,a+TAU/9-.05,col,3,.75)});
      x.strokeStyle='#ffe9a0';x.lineWidth=2;x.globalAlpha=.75;
      for(let k=0;k<45;k++){const a=k*TAU/45;x.save();x.rotate(a);x.beginPath();x.moveTo(97,0);x.lineTo(k%5?101:104,k%3?3:-3);x.lineTo(104,0);x.stroke();x.restore()}
    }
  }
  return OMTEX[kind]=new THREE.CanvasTexture(c);
}
/* one fragment per region, built around the origin; +z is the direction of travel */
function omniPiece(i){
  const g=new THREE.Group(),col=parseInt(OMNI_COL[i].slice(1),16),m=aumat(col,.95),w=aumat(0xffffff,.9);
  const put=(geo,mat,x,y,z,sx,sy,sz)=>{const o=mesh(geo,mat,x,y,z,g,false);if(sx)o.scale.set(sx,sy,sz);return o};
  const oct=r=>new THREE.OctahedronGeometry(r,0),cone=(r,h,n)=>new THREE.ConeGeometry(r,h,n),box=(a,b,c)=>new THREE.BoxGeometry(a,b,c);
  if(i===0){for(const s of[-1,1])put(oct(.2),s>0?m:aumat(0x3fae3a,.95),s*.16,0,0,1.4,.18,.75).rotation.z=s*.5}   // leaves
  else if(i===1){put(oct(.16),w,0,0,0);put(cone(.15,.55,6),aumat(col,.55),0,0,-.3).rotation.x=-Math.PI/2}   // soul wisp
  else if(i===2){put(cone(.19,.55,5),m,0,.08,0);put(cone(.1,.34,5),aumat(0xffe27a,1),0,.02,.08);put(oct(.16),m,0,-.2,0,1,.7,1)}   // flame
  else if(i===3){put(oct(.2),m,0,0,0,.75,1.9,.75);put(oct(.11),w,.2,-.13,0,.7,1.7,.7).rotation.z=-.5}   // crystal shards
  else if(i===4){for(const[x,y,r,l]of[[.05,.2,-.6,.32],[0,0,.9,.3],[-.05,-.2,-.6,.32]])put(box(.08,l,.08),m,x,y,0).rotation.z=r}   // lightning
  else if(i===5){put(oct(.17),aumat(0x1c0a30,.95),0,0,0,1.1,1.1,1.1);put(new THREE.TorusGeometry(.3,.035,4,24),m,0,0,0).rotation.x=1.2}   // void core
  else if(i===6){for(let k=0;k<3;k++)put(box(.055,.55,.055),k?m:w,0,0,0).rotation.z=k*Math.PI/3}   // frost star
  else if(i===7){put(cone(.24,.28,4),m,0,.13,0);put(cone(.24,.28,4),aumat(0xb8772e,.95),0,-.13,0).rotation.x=Math.PI}   // sandstone
  else{put(new THREE.TorusGeometry(.22,.04,5,24),m,0,.2,0).rotation.x=1.3;put(oct(.16),w,0,-.02,0,.8,1.5,.8)}   // halo
  const gl=glow(col,i===5?1.2:1,.45);g.add(gl);g.userData.glow=gl;
  return g;
}
let OMMAT=null;
function omniBuild(){
  if(!OMMAT){const f=(k,op)=>new THREE.MeshBasicMaterial({map:omniTex(k),transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide});OMMAT={trail:f('trail',.95),floor:f('floor',.85)}}
  const g=new THREE.Group();
  const plane=(mat,size)=>{const h=new THREE.Group();g.add(h);const d=mesh(new THREE.PlaneGeometry(1,1),mat,0,0,0,h,false);d.rotation.x=-Math.PI/2;d.scale.set(size,size,1);return h};
  const floor=plane(OMMAT.floor,4.2),trail=plane(OMMAT.trail,OMNI_R*256/100);
  const pieces=OMNI_COL.map((_,i)=>{const p=omniPiece(i);g.add(p);return p});
  const anim=(t,face,h)=>{
    g.rotation.y=-face;floor.position.y=.09-h;floor.rotation.y=-t*.35;   // the orbit stays still when the wearer turns
    trail.position.y=1.15;trail.rotation.y=-t*.9;
    pieces.forEach((p,i)=>{const a=t*.9+i*TAU/9;p.position.set(Math.cos(a)*OMNI_R,1.15+Math.sin(t*2.2+i*1.4)*.08,Math.sin(a)*OMNI_R);
      // flat shapes (bolt, frost star) keep facing the camera; the rest turn with the orbit or spin
      p.rotation.y=i===4||i===6?0:i===1?-a:t*1.6+i;p.rotation.z=i===6?t*.8:0;
      const k=i===2||i===4?1+Math.sin(t*17+i)*.12:1;p.scale.set(k,k,k)});
  };
  anim(0,0,0);return{g,anim,pieces,glows:pieces.map(p=>p.userData.glow)};
}
function omniApply(o,on){
  if(!o||!o.g||!!on===!!o.omni)return;
  if(on){try{o.omni=omniBuild();o.g.add(o.omni.g)}catch(e){console.error('omni aura',e)}}
  else{o.g.remove(o.omni.g);o.omni=null}
}
const myOmni=()=>SES.pf&&SES.pf.items.some(i=>i.kind==='weapon'&&i.eq&&String(i.rune||'').startsWith('all:'))?1:0;

function applyWeaponLook(o,base){HQ++;try{return applyWeaponLook0(o,base)}finally{HQ--}}
/* 만물의 검 model, built along +y like every blade. 정예의 핵 = the heart in the guard, 천상의 깃 = the feathered crossguard,
   목재 = the grip, 만물의 룬 = nine region gems down the fuller */
function wOmniSword(o,k){
  const white=M(0xf4f0ff,{metalness:.75,roughness:.18,emissive:0x5a3a6a,emissiveIntensity:.25}),dark=M(0x2a1638,{metalness:.7,roughness:.3}),
    gold=M(0xffd873,{metalness:.7,roughness:.28,emissive:0x6a4a10,emissiveIntensity:.35}),mag=EM(0xff4fd8,1.4),wood=M(0x7a4a28),feather=M(0xfff8e0,{emissive:0xffe9a0,emissiveIntensity:.35});
  const flat=(geo,mat,x,y,z,sz)=>{const m=mesh(geo,mat,x,y,z,k);if(sz!=null)m.scale.z=sz;return m};
  // blade: dark spine, two bright edges that flare out near the tip, magenta rim, pointed end
  BX(.13,1.84,.055,dark,0,1.19,0,k);
  for(const s of[-1,1]){
    BX(.085,1.5,.045,white,s*.105,1.02,0,k);BX(.018,1.5,.05,mag,s*.153,1.02,0,k);
    const f=BX(.09,.42,.045,white,s*.13,1.93,0,k);f.rotation.z=-s*.16;
    const barb=flat(new THREE.ConeGeometry(.07,.26,4),white,s*.2,.52,0,.35);barb.rotation.z=-s*2.3;
  }
  flat(new THREE.ConeGeometry(.2,.52,4),white,0,2.34,0,.2);flat(new THREE.ConeGeometry(.07,.4,4),mag,0,2.28,0,.9);
  OMNI_COL.forEach((c,i)=>{const gem=OC(.045,EM(parseInt(c.slice(1),16),1.9),0,.52+i*.17,0,k);gem.scale.set(.9,1.5,1.5)});
  // feathered crossguard: three layered feathers each side
  for(const s of[-1,1])for(let i=0;i<3;i++){
    const len=.56-i*.11,a=.16+i*.34,f=flat(new THREE.ConeGeometry(.075,len,4),i===1?gold:feather,s*(.12+Math.cos(a)*len/2),.2+Math.sin(a)*len/2,(i-1)*.012,.3);
    f.rotation.z=-s*(Math.PI/2-a);
  }
  BX(.34,.14,.17,gold,0,.17,0,k);
  const heart=OC(.13,mag,0,.19,0,k);heart.scale.set(1,1.25,1.1);
  const ring=mesh(new THREE.TorusGeometry(.19,.018,5,24),gold,0,.19,0,k);ring.rotation.y=.5;
  // wooden grip with golden wraps and a gem pommel
  CY(.055,.062,.46,wood,0,-.13,0,k,8);for(let i=0;i<3;i++)CY(.068,.068,.03,gold,0,-.02-i*.13,0,k,8);
  OC(.085,gold,0,-.41,0,k);OC(.045,mag,0,-.47,0,k);
  for(const[y,s]of[[.2,1],[1.35,.9],[2.3,.8]]){const gl=glow(0xff4fd8,s,.4);gl.position.set(0,y,0);k.add(gl)}
  // shards and rune sparks spiralling up the blade (moved by animHeroFor through o.wfx)
  for(const[y,r,sp,n,col]of[[.75,.3,2.2,3,0xffd24a],[1.45,.34,-1.7,3,0xff4fd8],[2.05,.24,2.8,2,0x9ff6ff]]){
    const list=[];for(let i=0;i<n;i++){const s=OC(.05,EM(col,1.8),0,y,0,k);s.scale.set(.6,1.7,.4);list.push(s)}
    o.wfx.push({list,x:0,y,z:0,r,h:.18,sp});
  }
}
/* other unique (crafted) weapons share the sword's materials: white metal, gold, magenta core, feathers, nine region gems */
function wOmniMats(){return{white:M(0xf4f0ff,{metalness:.75,roughness:.18,emissive:0x5a3a6a,emissiveIntensity:.25}),dark:M(0x2a1638,{metalness:.7,roughness:.3}),
  gold:M(0xffd873,{metalness:.7,roughness:.28,emissive:0x6a4a10,emissiveIntensity:.35}),mag:EM(0xff4fd8,1.4),fire:EM(0xff8a3a,1.8),ice:EM(0x9ff6ff,1.8),
  wood:M(0x7a4a28),feather:M(0xfff8e0,{emissive:0xffe9a0,emissiveIntensity:.35})}}
const wOmniGem=(k,i,x,y,z,s)=>{const g=OC(s||.045,EM(parseInt(OMNI_COL[i].slice(1),16),1.9),x,y,z,k);g.scale.set(.9,1.4,1.2);return g};
const wOmniGlow=(k,x,y,z,s,col)=>{const g=glow(col||0xff4fd8,s,.4);g.position.set(x,y,z);k.add(g);return g};
/* a fan of feathers growing from (x,y): side = +-1, plane 'x' or 'z' */
function wOmniWing(k,m,x,y,z,side,len,plane){
  for(let i=0;i<3;i++){const l=len-i*len*.2,a=.16+i*.34,d=side*(Math.cos(a)*l/2),h=y+Math.sin(a)*l/2;
    const f=mesh(new THREE.ConeGeometry(len*.13,l,4),i===1?m.gold:m.feather,plane==='z'?x:x+d,h,plane==='z'?z+d:z,k);
    if(plane==='z'){f.scale.x=.3;f.rotation.x=side*(Math.PI/2-a)}else{f.scale.z=.3;f.rotation.z=-side*(Math.PI/2-a)}}
}
function wOmniOrbit(o,k,list){
  for(const[y,r,sp,n,col]of list){const l=[];for(let i=0;i<n;i++){const s=OC(.05,EM(col,1.8),0,y,0,k);s.scale.set(.6,1.7,.4);l.push(s)}o.wfx.push({list:l,x:0,y,z:0,r,h:.18,sp})}
}
function wOmniBow(o,k){
  const m=wOmniMats();
  const arc=(r,t,mat,dz)=>{const geo=new THREE.TorusGeometry(r,t,6,32,Math.PI);geo.rotateZ(Math.PI/2);geo.rotateY(Math.PI/2);return mesh(geo,mat,0,0,dz||0,k)};
  arc(1.2,.07,m.white);arc(1.28,.022,m.mag);arc(1.1,.03,m.gold);
  BX(.018,2.4,.018,m.ice,0,0,0,k);
  for(let i=0;i<9;i++){const a=(i-4)*.32;wOmniGem(k,i,0,Math.sin(a)*1.2,Math.cos(a)*1.2)}
  for(const s of[-1,1]){OC(.1,m.gold,0,s*1.2,0,k);wOmniWing(k,m,0,s*1.2,0,1,s*.5,'z')}
  CY(.085,.085,.5,m.wood,0,0,1.18,k,8);for(const y of[-.27,.27])CY(.1,.1,.05,m.gold,0,y,1.18,k,8);
  const heart=OC(.13,m.mag,0,0,1.3,k);heart.scale.set(1,1.3,1);
  for(const y of[-1.2,0,1.2])wOmniGlow(k,0,y,y?0:1.25,.85);
  wOmniOrbit(o,k,[[.7,.28,2.2,2,0xffd24a],[-.7,.28,-2.2,2,0xff4fd8]]);
}
function wOmniWand(o,k){
  const m=wOmniMats();
  CY(.045,.065,1.7,m.wood,0,.05,0,k,8);for(const y of[-.55,-.2,.55])CY(.075,.075,.045,m.gold,0,y,0,k,8);
  OC(.11,m.mag,0,-.85,0,k);
  for(const s of[-1,1])wOmniWing(k,m,s*.08,1.0,0,s,.58);
  const heart=OC(.2,m.mag,0,1.38,0,k);heart.scale.set(1,1.3,1);
  const r1=mesh(new THREE.TorusGeometry(.34,.025,5,30),m.gold,0,1.38,0,k),r2=mesh(new THREE.TorusGeometry(.42,.012,4,30),m.ice,0,1.38,0,k);r2.rotation.x=Math.PI/2;r1.rotation.y=.4;
  CN(.09,.34,m.fire,0,1.9,0,k,5);for(const s of[-1,1])CN(.045,.18,m.fire,s*.1,1.78,0,k,4).rotation.z=-s*.5;
  for(let i=0;i<9;i++){const a=i/9*TAU;wOmniGem(k,i,Math.cos(a)*.34,1.38+Math.sin(a)*.34,0,.035)}
  const gl=wOmniGlow(k,0,1.38,0,1.5);o.orb=r2;o.orbGlow=gl;wOmniGlow(k,0,1.9,0,.8,0xff8a3a);
  wOmniOrbit(o,k,[[1.38,.55,2.4,3,0xffd24a],[.9,.28,-1.8,2,0x9ff6ff]]);
}
function wOmniSpear(o,k){
  const m=wOmniMats();
  CY(.045,.05,2.9,m.wood,0,.55,0,k,8);for(const y of[-.75,-.2,.35,1.75])CY(.065,.065,.06,m.gold,0,y,0,k,8);
  OC(.11,m.gold,0,-.95,0,k);
  const blade=OC(.22,m.white,0,2.5,0,k);blade.scale.set(.75,2.6,.25);BX(.05,.9,.07,m.mag,0,2.45,0,k);
  for(const s of[-1,1]){const p=CN(.07,.55,m.white,s*.27,2.2,0,k,4);p.rotation.z=-s*.35;p.scale.z=.35;
    wOmniWing(k,m,s*.07,1.9,0,s,.52);CN(.06,.28,m.fire,s*.3,2.52,0,k,5)}
  const heart=OC(.14,m.mag,0,1.95,0,k);heart.scale.set(1,1.25,1.1);
  CN(.08,.3,m.fire,0,3.2,0,k,5);
  for(let i=0;i<9;i++)wOmniGem(k,i,0,.55+i*.13,.055,.032);
  for(const[y,s]of[[1.95,1],[2.6,1],[3.2,.7]])wOmniGlow(k,0,y,0,s);
  wOmniOrbit(o,k,[[2.45,.4,2.6,3,0xffd24a],[1.7,.3,-2,2,0xff4fd8]]);
}
function wOmniFist(o,k,side){
  const m=wOmniMats();
  BX(.36,.42,.36,m.white,0,-.14,0,k);BX(.4,.09,.4,m.gold,0,.11,0,k);BX(.39,.05,.39,m.mag,0,-.02,0,k);BX(.38,.1,.14,m.gold,0,-.34,.11,k);
  for(let i=-1;i<=1;i++)CN(.05,.18,m.fire,i*.11,-.45,.13,k,4).rotation.x=Math.PI;
  const heart=OC(.1,m.mag,0,-.17,.2,k);heart.scale.set(1,1.25,.7);
  wOmniWing(k,m,side*.2,-.05,0,side,.5);
  for(let i=0;i<4;i++)wOmniGem(k,i*2+(side>0?1:0),-.15+i*.1,-.28,.19,.032);
  wOmniGlow(k,0,-.2,0,1.1);wOmniOrbit(o,k,[[-.2,.34,side*2.6,3,side>0?0xff8a3a:0xffd24a]]);
}
function wOmniGun(o,k){
  const m=wOmniMats();
  BX(.14,.95,.14,m.white,0,-.55,0,k);BX(.05,.95,.05,m.dark,0,-.55,.1,k);BX(.16,.95,.03,m.mag,0,-.55,0,k);
  const cyl=CY(.17,.17,.3,m.gold,0,-.08,0,k,8);cyl.rotation.y=.4;
  for(let i=0;i<6;i++){const a=i/6*TAU;CY(.03,.03,.31,m.dark,Math.cos(a)*.12,-.08,Math.sin(a)*.12,k,6)}
  BX(.13,.2,.16,m.gold,0,.14,0,k);BX(.11,.34,.13,m.wood,0,.2,-.15,k).rotation.x=.45;CN(.05,.16,m.gold,0,.24,.07,k,4);
  /* sheriff star on both sides */
  for(const s of[-1,1]){for(let i=0;i<5;i++){const a=i/5*TAU,p=CN(.04,.13,m.gold,s*.19,-.08+Math.cos(a)*.09,Math.sin(a)*.09,k,4);p.rotation.x=a;p.scale.x=.3}OC(.045,m.mag,s*.2,-.08,0,k)}
  wOmniWing(k,m,0,.02,-.12,-1,.46,'z');
  const mz=mesh(new THREE.TorusGeometry(.13,.025,5,20),m.ice,0,-1.06,0,k);mz.rotation.x=Math.PI/2;
  for(let i=0;i<9;i++)wOmniGem(k,i,0,-.28-i*.085,-.085,.03);
  wOmniGlow(k,0,-.08,0,.9);wOmniGlow(k,0,-1.1,0,.9,0x9ff6ff);
  wOmniOrbit(o,k,[[-.9,.26,2.8,3,0x9ff6ff],[-.35,.3,-2,2,0xff8a3a]]);
}
/* 크로마이스: black serrated greatblade, violet void edge, crimson eye in a clawed guard, dark shards circling */
function wChromaSword(o,k){
  const black=M(0x0c0912,{metalness:.8,roughness:.25,emissive:0x1a0630,emissiveIntensity:.5}),iron=M(0x2a2434,{metalness:.7,roughness:.4}),
    vio=EM(0x8a2cff,1.7),red=EM(0xff1f4a,1.8),grip=M(0x1a0a14);
  BX(.24,1.8,.055,black,0,1.17,0,k);BX(.035,1.75,.065,vio,0,1.17,0,k);
  for(const s of[-1,1]){
    BX(.022,1.75,.04,vio,s*.128,1.15,0,k);
    for(let i=0;i<4;i++){const p=CN(.065,.3,black,s*.16,.55+i*.4,0,k,4);p.rotation.z=-s*2.5;p.scale.z=.35}
    const c=CN(.09,.62,black,s*.34,.36,0,k,4);c.rotation.z=-s*.85;c.scale.z=.45;
    const c2=CN(.05,.36,iron,s*.26,.02,0,k,4);c2.rotation.z=-s*2.35;
  }
  const tip=CN(.17,.6,black,0,2.36,0,k,4);tip.scale.z=.22;CN(.045,.4,vio,0,2.3,0,k,4);
  BX(.4,.15,.17,iron,0,.16,0,k);
  const eye=OC(.13,red,0,.2,.03,k);eye.scale.set(1.1,.8,1);BX(.025,.15,.03,black,0,.2,.15,k);
  CY(.052,.06,.5,grip,0,-.15,0,k,8);for(let i=0;i<3;i++)CY(.068,.068,.025,iron,0,-.02-i*.14,0,k,8);
  const pm=CN(.08,.26,iron,0,-.52,0,k,4);pm.rotation.x=Math.PI;OC(.05,red,0,-.4,0,k);
  for(const[y,s,col]of[[.2,.9,0xff1f4a],[1.0,1.3,0x6a14d8],[1.75,1.2,0x6a14d8],[2.4,.8,0x8a2cff]]){const gl=glow(col,s,.42);gl.position.set(0,y,0);k.add(gl)}
  for(const[y,r,sp,n,col]of[[.7,.32,2.4,3,0x8a2cff],[1.5,.36,-1.9,4,0x3a0a6a],[2.1,.26,3,2,0xff1f4a]]){
    const list=[];for(let i=0;i<n;i++){const s=OC(.055,EM(col,1.7),0,y,0,k);s.scale.set(.6,1.8,.4);list.push(s)}
    o.wfx.push({list,x:0,y,z:0,r,h:.2,sp});
  }
}
function wOmniLook(o,b){
  const c=wCls(b),one=(fn,s)=>{const k=grp(0,0,0,o.weapon);k.scale.setScalar(s||1);fn(o,k)};
  if(o.shield&&c!=='wand')o.shield.visible=false;
  if(c==='sword'){if(o.shield)o.shield.visible=true;one(b==='sword_10_3'?wChromaSword:wOmniSword,{warrior:1,rogue:.85,darknight:1.14}[o.cls]||1)}
  else if(c==='archer')one(wOmniBow);
  else if(c==='wand')one(wOmniWand);
  else if(c==='lancer')one(wOmniSpear);
  else if(c==='gunner')one(wOmniGun,1.1);
  else if(c==='monk'){const a=grp(0,0,0,o.weapon);wOmniFist(o,a,-1);wOmniFist(o,wsecond(o),1)}
}
function applyWeaponLook0(o,base){
  if(!o||!o.weapon||!o.cls)return;
  const fn=WLOOK[o.cls];if(!fn)return;
  let b=typeof base==='string'&&/^[a-z]+_([1-9]|10)(_\d+)?$/.test(base)&&wCan(base,o.cls)?base:o.cls+'_1';
  const ty=wType(b),t=wTier(b);
  wclear(o.weapon);if(o.weapon2){wclear(o.weapon2);o.weapon2.visible=false}
  if(o.shield)o.shield.visible=true;
  o.orb=null;o.orbGlow=null;o.wfx=[];WCUR=o;
  try{
    if(t===10)wOmniLook(o,b);
    else fn(o,ty,t,wmats(t))
  }catch(e){console.error('weapon look',o.cls,b,e)}
  WCUR=null;
  try{auraApply(o,t,b==='sword_10_3'?'chroma':wCls(b))}catch(e){console.error('weapon aura',t,e)}
  o.wbase=b;
}
