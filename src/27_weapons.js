/* ---------------- weapon looks: shape by class x kind (3), material/glow/size by tier (1-8) ---------------- */
const WACC=[0x9aa0aa,0xc0c8d4,0x8fb8ff,0x6ad0ff,0x6affd0,0xff9a5a,0xffe27a,0xff7ae8];
const WBLD=[0x8a8f98,0xaab0bc,0xd8dee8,0xc4e4ff,0xc4fff0,0xffdcc8,0xfff2b8,0xffd4f6];
function wmats(t){
  const c=WACC[t-1],em=t>=4;
  return{t,c,
    blade:M(WBLD[t-1],{metalness:.7,roughness:.25,emissive:em?c:0x1a2030,emissiveIntensity:em?.16+.05*t:.08}),
    edge:EM(c,.4+.12*t),
    grip:M(t>=6?0x3a2a50:0x4a2c18),
    gold:M(t>=7?0xffe6a0:0xe8b73a,{metalness:.6,roughness:.35}),
    wood:M(t>=5?0x5a3a6a:0x6b4a2b),
    dark:M(0x20262e,{metalness:.5,roughness:.4}),
    steel:M(t>=3?0xc8d0d8:0x8a9098,{metalness:.7,roughness:.3})
  };
}
const wclear=g=>{while(g.children.length)g.remove(g.children[0])};
function wglow(k,m,x,y,z,s){if(m.t<4)return null;const gl=glow(m.c,(s||1.4)*(.7+m.t*.08),.3+.05*m.t);gl.position.set(x,y,z);k.add(gl);return gl}
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
  const gl=glow(pageGlow,1.6+.1*m.t,.55);gl.position.set(0,-.15,0);k.add(gl);
  const runes=[];for(let i=0;i<3;i++){const r=OC(.07,EM(pageGlow,1.4),0,0,0,k);r.position.set(Math.cos(i*2.1)*.35,.15+i*.1,Math.sin(i*2.1)*.35);runes.push(r)}
  o.orb=runes[0];o.orbGlow=gl;
}
function wstaff(k,m,len,orbCol,orbR,o){
  CY(.05,.06,len,m.wood,0,len/2-.8,0,k);
  const top=len-.75,orb=SP(orbR,EM(orbCol,1.3),0,top+.08,0,k,10,8);
  const cl=mesh(new THREE.TorusGeometry(orbR*1.25,.04,5,10),m.gold,0,top-.1,0,k);cl.rotation.x=Math.PI/2;
  if(m.t>=5)for(let i=0;i<4;i++){const p=CN(.05,.34,m.gold,Math.cos(i*1.57)*orbR*1.2,top+.1,Math.sin(i*1.57)*orbR*1.2,k,4);p.rotation.z=-Math.cos(i*1.57)*.4;p.rotation.x=Math.sin(i*1.57)*.4}
  const gl=glow(orbCol,1.7+.1*m.t,.7);gl.position.set(0,top+.08,0);k.add(gl);o.orb=orb;o.orbGlow=gl;wcrown(k,m,top-.3,orbR*1.5);
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
    else{CY(.025,.035,.95,m.wood,0,-.1,0,k,5);const g=OC(.1+.01*t,EM(col,1.5),0,.42,0,k);g.scale.set(.8,1.4,.8);const gl=glow(col,1.3+.1*t,.75);gl.position.set(0,.42,0);k.add(gl);
      for(const s of[-1,1])CN(.03,.2,m.gold,s*.09,.34,0,k,4).rotation.z=-s*.4;o.orb=g;o.orbGlow=gl;wcrown(k,m,.2,.2)}
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
      if(ty===0){wblade(q,m,.85,.09,.1,.035);BX(.26,.06,.08,m.edge,0,.08,0,q);CY(.035,.035,.22,m.grip,0,-.05,0,q,6)}
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
      CY(.19,.19,.03,EM(col,1.4),0,.54,0,k,10);const gl=glow(col,2+.15*t,.8);gl.position.set(0,.62,0);k.add(gl);
      const rg=mesh(new THREE.TorusGeometry(.3,.025,4,14),EM(col,1.3),0,.95,0,k);rg.rotation.x=Math.PI/2;o.orb=rg;o.orbGlow=gl}
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
      if(ty===0){const gl=glow(m.c,1.3+.12*t,.5);q.add(gl);const bd=mesh(new THREE.TorusGeometry(.17,.03,5,10),EM(m.c,.8+.1*t),0,-.15,0,q);bd.rotation.x=Math.PI/2}
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
      const gl=glow(col,1.8+.12*t,.7);gl.position.set(0,-.3,0);k.add(gl);o.orb=dl;o.orbGlow=gl}
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

function applyWeaponLook(o,base){
  if(!o||!o.weapon||!o.cls)return;
  const fn=WLOOK[o.cls];if(!fn)return;
  let b=typeof base==='string'&&/^[a-z]+_[1-8](_[12])?$/.test(base)&&base.split('_')[0]===o.cls?base:o.cls+'_1';
  const ty=wType(b),t=wTier(b);
  wclear(o.weapon);if(o.weapon2){wclear(o.weapon2);o.weapon2.visible=false}
  if(o.shield)o.shield.visible=true;
  o.orb=null;o.orbGlow=null;
  try{fn(o,ty,t,wmats(t))}catch(e){console.error('weapon look',o.cls,b,e)}
  o.wbase=b;
}
