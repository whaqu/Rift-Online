/* ---------------- model helpers ---------------- */
const matC={};
function M(hex,o){const k=hex+(o?JSON.stringify(o):'');return matC[k]||(matC[k]=new THREE.MeshStandardMaterial(Object.assign({color:hex,flatShading:true,roughness:.72,metalness:.08},o||{})))}
function EM(hex,int){return M(hex,{emissive:hex,emissiveIntensity:int==null?1:int,roughness:.4})}
function mesh(geo,mat,x,y,z,parent,shadow){const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=shadow!==false;if(parent)parent.add(m);return m}
const BX=(w,h,d,mat,x,y,z,p)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,p);
const SP=(r,mat,x,y,z,p,ws,hs)=>mesh(new THREE.SphereGeometry(r,ws||10,hs||8),mat,x,y,z,p);
const CY=(rt,rb,h,mat,x,y,z,p,seg)=>mesh(new THREE.CylinderGeometry(rt,rb,h,seg||8),mat,x,y,z,p);
const CN=(r,h,mat,x,y,z,p,seg)=>mesh(new THREE.ConeGeometry(r,h,seg||8),mat,x,y,z,p);
const OC=(r,mat,x,y,z,p)=>mesh(new THREE.OctahedronGeometry(r,0),mat,x,y,z,p);
function grp(x,y,z,p){const g=new THREE.Group();g.position.set(x||0,y||0,z||0);if(p)p.add(g);return g}
function cloneMats(g){
  const map=new Map(),list=[];
  g.traverse(o=>{if(o.isMesh&&o.material){let m=map.get(o.material);if(!m){m=o.material.clone();m.userData.e0=m.emissive?m.emissive.getHex():0;m.userData.i0=m.emissiveIntensity;map.set(o.material,m);list.push(m)}o.material=m}});
  return list;
}
function setFlash(mats,on){
  for(const m of mats){if(!m.emissive)continue;if(on){m.emissive.setHex(0xffffff);m.emissiveIntensity=.85}else{m.emissive.setHex(m.userData.e0);m.emissiveIntensity=m.userData.i0}}
}


/* ---------------- outline (inverted hull) + contact blob ---------------- */
const OL_MAT=new THREE.MeshBasicMaterial({color:0x080a14,side:THREE.BackSide});
function addOutline(root,maxN,t){
  if(!save.outline)return root;
  const list=[];
  root.traverse(m=>{
    if(!m.isMesh||!m.geometry||m.userData.ol)return;
    const mt=m.material;if(!mt||mt.blending===THREE.AdditiveBlending)return;
    const g=m.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;if(!b)return;
    const sx=b.max.x-b.min.x,sy=b.max.y-b.min.y,sz=b.max.z-b.min.z;
    list.push({m,b,sx,sy,sz,v:sx*sy*sz*Math.abs(m.scale.x*m.scale.y*m.scale.z)});
  });
  list.sort((a,c)=>c.v-a.v);
  const k=(d)=>Math.min(2.1,(Math.max(d,.04)+2*t)/Math.max(d,.04));
  for(const e of list.slice(0,maxN)){
    const o=new THREE.Mesh(e.m.geometry,OL_MAT),kx=k(e.sx),ky=k(e.sy),kz=k(e.sz);
    o.scale.set(kx,ky,kz);
    o.position.set((e.b.min.x+e.b.max.x)/2*(1-kx),(e.b.min.y+e.b.max.y)/2*(1-ky),(e.b.min.z+e.b.max.z)/2*(1-kz));
    o.userData.ol=true;o.castShadow=false;e.m.add(o);
  }
  return root;
}
let _blobMat=null;
function blob(r){
  if(!_blobMat)_blobMat=new THREE.MeshBasicMaterial({map:radialTex('rgba(0,0,0,.6)','rgba(0,0,0,0)',64),transparent:true,depthWrite:false});
  const m=new THREE.Mesh(shared.discG,_blobMat);m.rotation.x=-Math.PI/2;m.position.y=.1;m.scale.set(r,r,r);m.castShadow=false;m.userData.ol=true;return m;
}
function fin(o,n,t,r){addOutline(o.g,n,t);if(r)o.g.add(blob(r));return o}

/* ---------------- heroes ---------------- */
function makeHero(cls,tint){
  const g=grp(),body=grp(0,0,0,g);
  const skin=M(0xf1c7a0),dark=M(0x262a40);
  const legL=grp(-.22,.85,0,body),legR=grp(.22,.85,0,body),torso=grp(0,1.15,0,body),head=grp(0,1.95,0,body),armL=grp(-.66,1.6,0,body),armR=grp(.66,1.6,0,body);
  const o={g,body,torso,head,legL,legR,armL,armR,cls,weapon:null,shadowBlob:null};
  const eye=(x,y,z)=>SP(.045,M(0x10131f),x,y,z,head,6,5);
  if(cls==='warrior'){
    const steel=M(0xaab6d6,{metalness:.55,roughness:.4}),blue=M(tint||0x2f56c8),gold=M(0xe8b73a,{metalness:.6,roughness:.35});
    CY(.17,.15,.8,steel,0,-.4,0,legL);CY(.17,.15,.8,steel,0,-.4,0,legR);BX(.3,.18,.46,dark,0,-.78,.08,legL);BX(.3,.18,.46,dark,0,-.78,.08,legR);
    BX(.95,.95,.58,steel,0,0,0,torso);BX(.97,.22,.6,blue,0,-.32,0,torso);BX(1,.1,.62,gold,0,-.2,0,torso);BX(.46,.5,.1,blue,0,.1,.31,torso);SP(.1,gold,0,.12,.38,torso,6,5);
    SP(.3,steel,-.62,.5,0,torso);SP(.3,steel,.62,.5,0,torso);
    SP(.33,skin,0,0,0,head);const hel=SP(.41,steel,0,.07,-.02,head,10,8);hel.scale.set(1,.92,1);
    BX(.52,.09,.1,dark,0,.02,.36,head);BX(.08,.5,.12,gold,0,.06,.37,head);
    const pl=CN(.11,.6,M(0xd8353a),0,.5,-.2,head,6);pl.rotation.x=-.6;
    CY(.13,.12,.7,steel,0,-.35,0,armL);SP(.14,skin,0,-.76,0,armL);CY(.13,.12,.7,steel,0,-.35,0,armR);SP(.14,skin,0,-.76,0,armR);
    const sh=grp(-.22,-.5,.22,armL);const sd=CY(.58,.58,.1,blue,0,0,0,sh,14);sd.rotation.x=Math.PI/2;sh.rotation.y=-.25;
    const sd2=CY(.4,.4,.13,gold,0,0,.02,sh,14);sd2.rotation.x=Math.PI/2;SP(.13,gold,0,0,.1,sh,8,6);
    const sw=grp(0,-.76,0,armR);
    BX(.17,1.75,.06,M(0xe9f2ff,{metalness:.7,roughness:.25,emissive:0x335577,emissiveIntensity:.45}),0,.98,0,sw);
    BX(.52,.1,.15,gold,0,.12,0,sw);CY(.06,.06,.42,M(0x4a2c18),0,-.1,0,sw);SP(.09,gold,0,-.32,0,sw,6,5);
    sw.rotation.x=.9;o.weapon=sw;
  }else if(cls==='mage'){
    const robe=M(tint||0x6a3fc8),trim=M(0xf2d27a,{metalness:.5,roughness:.4}),hair=M(0xcfe3ff),wood=M(0x6b4a2b);
    BX(.22,.5,.3,dark,-.2,-.4,.04,legL);BX(.22,.5,.3,dark,.2,-.4,.04,legR);
    CY(.4,.46,.62,robe,0,.28,0,torso,10);CY(.46,.78,1.3,robe,0,-.55,0,torso,12);
    const sash=mesh(new THREE.TorusGeometry(.46,.07,6,14),trim,0,-.08,0,torso);sash.rotation.x=Math.PI/2;
    const hem=mesh(new THREE.TorusGeometry(.78,.05,6,16),trim,0,-1.18,0,torso);hem.rotation.x=Math.PI/2;
    SP(.32,skin,0,0,0,head);const hr=SP(.38,hair,0,.05,-.08,head,10,8);hr.scale.set(1,1,.95);BX(.62,1.0,.2,hair,0,-.45,-.28,head);
    eye(-.12,-.02,.29);eye(.12,-.02,.29);
    CY(.66,.66,.07,robe,0,.24,0,head,16);const hat=CN(.45,1.1,robe,0,.82,-.05,head,10);hat.rotation.x=-.18;
    const hb=mesh(new THREE.TorusGeometry(.45,.05,5,14),trim,0,.3,0,head);hb.rotation.x=Math.PI/2;
    SP(.11,EM(0xffe27a,1.2),0,1.42,-.2,head,6,5);
    CY(.17,.21,.7,robe,0,-.32,0,armL);SP(.13,skin,0,-.74,0,armL);CY(.17,.21,.7,robe,0,-.32,0,armR);SP(.13,skin,0,-.74,0,armR);
    const st=grp(0,-.74,0,armR);CY(.05,.06,2.5,wood,0,.45,0,st);
    const orb=SP(.21,EM(0x5ee7ff,1.3),0,1.78,0,st,10,8);const cl=mesh(new THREE.TorusGeometry(.26,.04,5,10),trim,0,1.6,0,st);cl.rotation.x=Math.PI/2;
    const gl=glow(0x5ee7ff,1.9,.75);gl.position.set(0,1.78,0);st.add(gl);o.orb=orb;o.orbGlow=gl;
    st.rotation.x=.55;o.weapon=st;
  }else{
    const green=M(tint||0x2f7a4a),leather=M(0x6b4a2b),cloak=M(0x1f4a31),bootm=M(0x3a2a1e);
    CY(.15,.13,.8,leather,0,-.4,0,legL);CY(.15,.13,.8,leather,0,-.4,0,legR);BX(.27,.2,.42,bootm,0,-.78,.07,legL);BX(.27,.2,.42,bootm,0,-.78,.07,legR);
    BX(.86,.92,.5,green,0,0,0,torso);BX(.9,.12,.53,leather,0,-.3,0,torso);BX(.14,.95,.54,leather,.2,0,0,torso).rotation.z=.3;
    const cp=BX(1.0,1.35,.1,cloak,0,-.15,-.34,torso);cp.rotation.x=.12;SP(.27,cloak,-.55,.48,0,torso);SP(.27,cloak,.55,.48,0,torso);
    SP(.32,skin,0,0,0,head);const hd=SP(.4,cloak,0,.07,-.06,head,10,8);hd.scale.set(1,1,1.0);const hp=CN(.26,.55,cloak,0,.14,-.52,head,6);hp.rotation.x=-1.25;
    BX(.5,.15,.1,M(0x2a2a35),0,-.1,.31,head);eye(-.11,.06,.3);eye(.11,.06,.3);
    CY(.12,.11,.7,green,0,-.35,0,armL);SP(.13,skin,0,-.76,0,armL);CY(.12,.11,.7,green,0,-.35,0,armR);SP(.13,skin,0,-.76,0,armR);
    const qv=CY(.13,.12,.8,leather,.28,.15,-.42,torso);qv.rotation.x=.15;for(let i=0;i<3;i++){const ar=CN(.05,.18,M(0xdddddd),.28+(i-1)*.07,.62,-.46,torso,4)}
    const bw=grp(0,-.76,0,armL);const geo=new THREE.TorusGeometry(.85,.055,6,20,Math.PI);geo.rotateZ(Math.PI/2);geo.rotateY(Math.PI/2);
    const bm=mesh(geo,M(0x7a4b25),0,0,0,bw);BX(.015,1.7,.015,M(0xeeeeee),0,0,0,bw);o.weapon=bw;
  }
  g.traverse(m=>{if(m.isMesh)m.castShadow=true});
  addOutline(g,18,.04);g.add(blob(.85));
  return o;
}
function animHero(o,t,spd,atkP,dashing,swingDir){
  const run=Math.min(1,spd),sw=Math.sin(t*13)*.85*run;
  o.legL.rotation.x=sw;o.legR.rotation.x=-sw;
  o.body.position.y=Math.abs(Math.sin(t*13))*.13*run+Math.sin(t*2.4)*.025*(1-run);
  o.body.rotation.x=dashing?.55:run*.1;
  const sd=swingDir||1;
  if(o.cls==='warrior'){
    o.armL.rotation.x=-.5-sw*.35;o.armL.rotation.z=.05;
    if(atkP>=0){const k=easeOut(atkP);o.armR.rotation.x=lerp(-2.6,.4,k);o.armR.rotation.z=lerp(-.5*sd,.3*sd,k);o.torso.rotation.y=lerp(.7*sd,-.7*sd,k)}
    else{o.armR.rotation.x=-.3-sw*.5;o.armR.rotation.z=0;o.torso.rotation.y*=.85}
  }else if(o.cls==='mage'){
    o.armL.rotation.x=-.4-sw*.4;o.armL.rotation.z=.1;
    if(atkP>=0){const k=Math.sin(atkP*Math.PI);o.armR.rotation.x=-1.0-k*.9;o.torso.rotation.y=-k*.3}
    else{o.armR.rotation.x=-.35-sw*.4;o.torso.rotation.y*=.85}
    if(o.orb){o.orb.rotation.y=t*2;const s=1+Math.sin(t*5)*.08;o.orbGlow.scale.set(1.9*s,1.9*s,1)}
  }else{
    if(atkP>=0){const k=atkP;o.armL.rotation.x=-1.55;o.armR.rotation.x=lerp(-1.7,-.5,easeOut(k));o.armR.rotation.z=lerp(.5,.1,k);o.torso.rotation.y=-.35}
    else{o.armL.rotation.x=-.6-sw*.3;o.armR.rotation.x=-.2-sw*.5;o.armR.rotation.z=0;o.torso.rotation.y*=.85}
  }
}

/* ---------------- enemies ---------------- */
function makeSlime(hex){
  const g=grp(),b=grp(0,0,0,g);
  const mat=M(hex,{transparent:true,opacity:.88,roughness:.25,metalness:.1,emissive:hex,emissiveIntensity:.18});
  const body=SP(.95,mat,0,.8,0,b,12,10);body.scale.set(1,.82,1);
  SP(.45,M(hex,{emissive:hex,emissiveIntensity:.6}),0,.75,.05,b,8,6);
  const w=M(0xffffff),bl=M(0x10131f);
  SP(.2,w,-.32,1.0,.72,b,8,6);SP(.2,w,.32,1.0,.72,b,8,6);SP(.09,bl,-.3,1.0,.9,b,6,5);SP(.09,bl,.3,1.0,.9,b,6,5);
  return fin({g,b,kind:'slime'},3,.06,1.05);
}
function makeSkeleton(bow){
  const g=grp(),b=grp(0,0,0,g),bone=M(0xe6e1cf),dk=M(0x2a2630);
  const legL=grp(-.2,.8,0,b),legR=grp(.2,.8,0,b);CY(.07,.06,.8,bone,0,-.4,0,legL);CY(.07,.06,.8,bone,0,-.4,0,legR);
  BX(.22,.1,.34,bone,0,-.8,.06,legL);BX(.22,.1,.34,bone,0,-.8,.06,legR);
  BX(.55,.2,.3,bone,0,.88,0,b);CY(.05,.05,.5,bone,0,1.2,0,b);
  for(let i=0;i<3;i++)BX(.7-i*.08,.1,.38,bone,0,1.3+i*.17,0,b);
  const head=grp(0,2.05,0,b);SP(.3,bone,0,0,0,head,10,8);BX(.34,.14,.3,bone,0,-.24,.04,head);
  SP(.075,dk,-.11,.03,.25,head,6,5);SP(.075,dk,.11,.03,.25,head,6,5);SP(.05,EM(0xff3030,1.4),-.11,.03,.28,head,6,5);SP(.05,EM(0xff3030,1.4),.11,.03,.28,head,6,5);
  const armL=grp(-.42,1.62,0,b),armR=grp(.42,1.62,0,b);CY(.05,.05,.7,bone,0,-.35,0,armL);CY(.05,.05,.7,bone,0,-.35,0,armR);
  let weapon=null;
  if(bow){
    const hood=CN(.4,.7,M(0x3a2a4a),0,.2,-.06,head,7);hood.rotation.x=-.1;
    const bw=grp(0,-.72,0,armL);const geo=new THREE.TorusGeometry(.7,.045,5,16,Math.PI);geo.rotateZ(Math.PI/2);geo.rotateY(Math.PI/2);mesh(geo,M(0x5a3a2a),0,0,0,bw);BX(.012,1.4,.012,M(0xdddddd),0,0,0,bw);weapon=bw;
  }else{
    const sw=grp(0,-.72,0,armR);BX(.1,1.2,.04,M(0xa8805a,{metalness:.5}),0,.7,0,sw);BX(.35,.08,.1,M(0x5a4030),0,.1,0,sw);sw.rotation.x=.9;weapon=sw;
    const sh=BX(.08,.8,.6,M(0x6b4a2b),-.1,-.5,.2,armL);
  }
  return fin({g,b,legL,legR,armL,armR,head,weapon,kind:bow?'archer':'skel'},8,.035,.6);
}
function makeBat(){
  const g=grp(),b=grp(0,1.3,0,g),pm=M(0x5a3a7a),dk=M(0x2a1840);
  SP(.38,pm,0,0,0,b,8,6);SP(.26,pm,0,.28,.2,b,8,6);CN(.09,.25,dk,-.14,.55,.2,b,4);CN(.09,.25,dk,.14,.55,.2,b,4);
  SP(.05,EM(0xff4040,1.5),-.1,.3,.42,b,5,4);SP(.05,EM(0xff4040,1.5),.1,.3,.42,b,5,4);
  const wl=grp(-.3,.05,0,b),wr=grp(.3,.05,0,b);
  const w1=BX(1.2,.05,.7,dk,-.6,0,0,wl),w2=BX(1.2,.05,.7,dk,.6,0,0,wr);
  return fin({g,b,wl,wr,kind:'bat'},4,.05,0);
}
function makeBomber(){
  const g=grp(),b=grp(0,0,0,g),rm=M(0xd8452f),dk=M(0x3a1410);
  const legL=grp(-.17,.45,0,b),legR=grp(.17,.45,0,b);CY(.09,.08,.45,dk,0,-.22,0,legL);CY(.09,.08,.45,dk,0,-.22,0,legR);
  const bd=SP(.48,rm,0,.85,0,b,8,6);bd.scale.set(1,1.1,.9);const head=grp(0,1.45,0,b);SP(.36,rm,0,0,0,head,8,6);
  CN(.09,.3,M(0xf2e6c0),-.2,.38,0,head,4).rotation.z=.3;CN(.09,.3,M(0xf2e6c0),.2,.38,0,head,4).rotation.z=-.3;
  SP(.07,EM(0xffe04a,1.6),-.12,.03,.3,head,5,4);SP(.07,EM(0xffe04a,1.6),.12,.03,.3,head,5,4);BX(.28,.07,.1,dk,0,-.15,.3,head);
  const armL=grp(-.46,1.0,0,b),armR=grp(.46,1.0,0,b);CY(.07,.07,.5,rm,0,-.25,0,armL);CY(.07,.07,.5,rm,0,-.25,0,armR);
  const bomb=grp(0,-.5,.25,armR);const bs=SP(.34,M(0x15151c,{metalness:.5}),0,0,0,bomb,8,6);CY(.04,.04,.22,M(0x888888),0,.38,0,bomb,5);
  const spark=glow(0xffa030,.8,.9);spark.position.set(0,.55,0);bomb.add(spark);
  armR.rotation.x=-.9;
  return fin({g,b,legL,legR,armL,armR,bomb,bs,spark,kind:'bomber'},6,.04,.65);
}
function makeGolem(){
  const g=grp(),b=grp(0,0,0,g),rock=M(0x4a4560),rk2=M(0x363250),cr=EM(0x5ee7ff,1.1);
  const legL=grp(-.55,1.2,0,b),legR=grp(.55,1.2,0,b);BX(.7,1.2,.7,rk2,0,-.6,0,legL);BX(.7,1.2,.7,rk2,0,-.6,0,legR);BX(.9,.3,1.0,rock,0,-1.15,.1,legL);BX(.9,.3,1.0,rock,0,-1.15,.1,legR);
  const torso=grp(0,2.3,0,b);BX(2.0,1.8,1.3,rock,0,0,0,torso);BX(1.4,.5,1.4,rk2,0,-.9,0,torso);
  SP(.4,cr,0,.1,.7,torso,8,6);const cg=glow(0x5ee7ff,2.6,.8);cg.position.set(0,.1,.9);torso.add(cg);
  for(const s of[-1,1]){const c=OC(.65,cr,s*1.15,1.1,-.2,torso);c.scale.set(.8,1.5,.8);c.rotation.z=s*.3}
  const head=grp(0,3.5,.1,b);BX(.85,.7,.85,rock,0,0,0,head);BX(.6,.12,.1,EM(0x5ee7ff,1.6),0,.05,.45,head);
  const armL=grp(-1.35,2.9,0,b),armR=grp(1.35,2.9,0,b);
  BX(.7,1.7,.7,rock,0,-.8,0,armL);BX(1.0,1.0,1.0,rk2,0,-1.9,0,armL);BX(.7,1.7,.7,rock,0,-.8,0,armR);BX(1.0,1.0,1.0,rk2,0,-1.9,0,armR);
  for(let i=0;i<4;i++){const s=OC(.35,cr,Math.cos(i*1.7)*.5,3.5+Math.sin(i)*.1,-.6,b);s.scale.set(.6,1.6,.6);s.rotation.z=(i-1.5)*.4}
  return fin({g,b,legL,legR,armL,armR,torso,head,core:cg,kind:'golem'},10,.1,1.7);
}
function makeBoss(){
  const g=grp(),b=grp(0,3.4,0,g);
  const dk=M(0x2b1232,{metalness:.4,roughness:.5}),bone=M(0xe9e1d2),red=EM(0xff3d7a,1.4);
  const core=mesh(new THREE.IcosahedronGeometry(1.7,0),dk,0,0,0,b);
  const inner=SP(1.2,EM(0xff3d7a,1.0),0,0,0,b,10,8);inner.scale.set(1.02,1.02,1.02);
  const face=grp(0,.1,1.5,b);BX(1.5,1.7,.4,bone,0,0,0,face);BX(.5,.14,.1,red,-.38,.3,.24,face).rotation.z=.25;BX(.5,.14,.1,red,.38,.3,.24,face).rotation.z=-.25;
  BX(.8,.14,.1,M(0x2a1520),0,-.4,.24,face);for(let i=-2;i<=2;i++)BX(.08,.3,.1,M(0xe9e1d2),i*.16,-.4,.28,face);
  for(const s of[-1,1]){const h=CN(.38,2.6,bone,s*1.2,1.5,-.1,b,6);h.rotation.z=-s*.5;h.rotation.x=-.15;const h2=CN(.25,1.5,bone,s*2.1,2.35,-.1,b,6);h2.rotation.z=-s*1.0}
  const r1=mesh(new THREE.TorusGeometry(2.9,.1,6,36),EM(0xc06bff,1.2),0,0,0,b),r2=mesh(new THREE.TorusGeometry(3.5,.07,6,36),EM(0xff3d7a,1.1),0,0,0,b);
  const orbs=[];for(let i=0;i<8;i++){const o=OC(.5,EM(i%2?0xc06bff:0xff3d7a,1.2),0,0,0,b);orbs.push(o)}
  const au=glow(0xff3d7a,11,.45);b.add(au);
  const wings=[];for(const s of[-1,1]){const w=grp(s*1.4,.2,-.8,b);for(let i=0;i<4;i++){const f=CN(.2,3.2-i*.4,dk,s*(.9+i*.5),-.4+i*.1,0,w,4);f.rotation.z=-s*(1.1+i*.12)}wings.push(w)}
  return fin({g,b,core,inner,r1,r2,orbs,face,wings,aura:au,kind:'boss'},14,.14,3.4);
}
function makeCoin(){const g=grp();const c=CY(.28,.28,.08,M(0xffcf3a,{metalness:.7,roughness:.3,emissive:0xaa7a00,emissiveIntensity:.6}),0,.5,0,g,10);c.rotation.x=Math.PI/2;g.add(glow(0xffd24a,1.3,.5));g.children[1].position.y=.5;return{g,c}}
function makeOrb(hex){const g=grp();const s=SP(.22,EM(hex,1.4),0,.5,0,g,8,6);const gl=glow(hex,1.4,.7);gl.position.y=.5;g.add(gl);return{g,s}}
function makeHeart(){const g=grp();const a=SP(.2,EM(0xff4d6d,1.0),-.13,.55,0,g,8,6),b2=SP(.2,EM(0xff4d6d,1.0),.13,.55,0,g,8,6);const c=CN(.3,.4,EM(0xff4d6d,1.0),0,.3,0,g,6);c.rotation.x=Math.PI;const gl=glow(0xff4d6d,1.6,.6);gl.position.y=.5;g.add(gl);return{g}}

/* ---------------- job look ---------------- */
const JOB_COL={gladiator:0xd8452f,guardian:0x4a78d8,blademaster:0xbfe4ff,berserker:0xc0302a,paladin:0xffe27a,bulwark:0x8a7a5a,
  pyromancer:0xff7a2a,cryomancer:0x5ee7ff,flamelord:0xff3d2a,meteormage:0xffb04a,frostlord:0x9fe8ff,stormcaller:0xfff2a0,
  sniper:0xffe27a,hunter:0x6bffb0,marksman:0xffd24a,shadowarcher:0xa07aff,stormarcher:0x7fd6ff,beasthunter:0xe0a050};
function makeHeroFor(cls,job,tint){
  const o=makeHero(cls,tint);o.job=job;
  const jd=JOBS[job],t=jd?jd.tier:0;
  if(t>=1){
    const col=JOB_COL[job]||0xffffff;
    const cape=BX(.95,1.5,.08,M(col,{emissive:col,emissiveIntensity:.25}),0,-.1,-.42,o.torso);cape.rotation.x=.14;
    for(const s of[-1,1])SP(.18,EM(col,.9),s*.66,.52,0,o.torso,6,5);
  }
  if(t>=2){
    const col=JOB_COL[job]||0xffffff;
    const gl=glow(col,4.2,.45);gl.position.set(0,.6,0);o.g.add(gl);o.aura=gl;
    o.orbs=[];for(let i=0;i<3;i++){const r=OC(.16,EM(col,1.3),0,0,0,o.g);o.orbs.push(r)}
  }
  return o;
}
function animHeroFor(o,t,spd,atkP,dashing,sd){
  animHero(o,t,spd,atkP,dashing,sd);
  if(o.orbs)o.orbs.forEach((r,i)=>{const a=t*1.8+i/3*TAU;r.position.set(Math.cos(a)*1.1,1.6+Math.sin(t*2+i)*.2,Math.sin(a)*1.1);r.rotation.y=t*3});
}
function makeNPC(kind){
  const tints={shop:0xc0803a,smith:0x7a4a2a,auction:0x2f8a6a,job:0x7a4ac0};
  const o=makeHero(kind==='smith'?'warrior':kind==='job'?'mage':'archer',tints[kind]);
  return o;
}
