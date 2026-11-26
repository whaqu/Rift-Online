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
  }else if(cls==='archer'){
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
  }else if(cls==='rogue'){
    const cloth=M(tint||0x7a3f9a),dk2=M(0x1e1a2e),lea=M(0x3a2a3e),acc=M(0xff6bd6,{emissive:0xff6bd6,emissiveIntensity:.5}),blade=M(0xe3ebff,{metalness:.7,roughness:.25,emissive:0x6a4aa0,emissiveIntensity:.45});
    CY(.14,.12,.8,dk2,0,-.4,0,legL);CY(.14,.12,.8,dk2,0,-.4,0,legR);BX(.26,.18,.42,lea,0,-.78,.07,legL);BX(.26,.18,.42,lea,0,-.78,.07,legR);
    BX(.8,.88,.46,cloth,0,0,0,torso);BX(.84,.1,.5,lea,0,-.3,0,torso);BX(.2,.7,.5,dk2,.25,0,0,torso).rotation.z=.4;
    BX(.95,1.2,.08,dk2,0,-.2,-.32,torso).rotation.x=.18;
    SP(.32,skin,0,0,0,head);SP(.4,cloth,0,.08,-.05,head,10,8);const hh=CN(.26,.55,cloth,0,.12,-.5,head,6);hh.rotation.x=-1.2;
    BX(.54,.2,.1,dk2,0,-.1,.3,head);eye(-.11,.06,.3);eye(.11,.06,.3);
    CY(.11,.1,.7,cloth,0,-.35,0,armL);SP(.13,skin,0,-.76,0,armL);CY(.11,.1,.7,cloth,0,-.35,0,armR);SP(.13,skin,0,-.76,0,armR);
    const dl=grp(0,-.76,0,armL),dr=grp(0,-.76,0,armR);
    for(const d of[dl,dr]){BX(.09,.85,.035,blade,0,.5,0,d);BX(.26,.06,.08,acc,0,.08,0,d);CY(.035,.035,.22,lea,0,-.05,0,d,6);d.rotation.x=1.0}
    o.weapon=dr;
  }else if(cls==='cleric'){
    const robe=M(0xf1ecd8),trim=M(tint||0xe8d27a,{metalness:.5,roughness:.4}),sash=M(0x5a7ad8),wood=M(0x7a5a33),boot=M(0x8a6a3a);
    BX(.22,.5,.3,boot,-.2,-.4,.04,legL);BX(.22,.5,.3,boot,.2,-.4,.04,legR);
    CY(.4,.46,.62,robe,0,.28,0,torso,10);CY(.46,.72,1.25,robe,0,-.52,0,torso,12);
    const bs=mesh(new THREE.TorusGeometry(.46,.07,6,14),trim,0,-.08,0,torso);bs.rotation.x=Math.PI/2;
    BX(.3,1.2,.06,sash,0,-.2,.43,torso);
    SP(.32,skin,0,0,0,head);const hr=SP(.37,M(0xb88a4a),0,.06,-.07,head,10,8);hr.scale.set(1,1,.95);eye(-.12,-.02,.29);eye(.12,-.02,.29);
    const hl=mesh(new THREE.TorusGeometry(.36,.04,6,16),EM(0xfff2a0,1.1),0,.62,0,head);hl.rotation.x=Math.PI/2;
    CY(.17,.21,.7,robe,0,-.32,0,armL);SP(.13,skin,0,-.74,0,armL);CY(.17,.21,.7,robe,0,-.32,0,armR);SP(.13,skin,0,-.74,0,armR);
    const st=grp(0,-.74,0,armR);CY(.05,.06,1.9,wood,0,.3,0,st);
    const orb=SP(.14,EM(0xfff2a0,1.3),0,1.34,0,st,10,8);BX(.06,.5,.06,trim,0,1.34,0,st);BX(.4,.06,.06,trim,0,1.38,0,st);
    const gl=glow(0xfff2a0,1.8,.7);gl.position.set(0,1.34,0);st.add(gl);o.orb=orb;o.orbGlow=gl;st.rotation.x=.5;o.weapon=st;
  }else if(cls==='lancer'){
    const steel=M(0xb7a9a0,{metalness:.55,roughness:.4}),red=M(tint||0xb85a4a),gold=M(0xe8b73a,{metalness:.6,roughness:.35}),dk2=M(0x2a2230);
    CY(.17,.15,.8,steel,0,-.4,0,legL);CY(.17,.15,.8,steel,0,-.4,0,legR);BX(.3,.18,.46,dk2,0,-.78,.08,legL);BX(.3,.18,.46,dk2,0,-.78,.08,legR);
    BX(.92,.95,.56,steel,0,0,0,torso);BX(.96,.2,.6,red,0,-.32,0,torso);BX(.5,.55,.1,red,0,.08,.31,torso);
    SP(.31,steel,-.6,.5,0,torso);SP(.31,steel,.6,.5,0,torso);CN(.14,.3,gold,-.6,.82,0,torso,5);CN(.14,.3,gold,.6,.82,0,torso,5);
    SP(.33,skin,0,0,0,head);const hel=SP(.41,steel,0,.07,-.02,head,10,8);hel.scale.set(1,.95,1);BX(.5,.08,.1,dk2,0,.02,.36,head);CN(.07,.8,red,0,.66,-.1,head,5);
    CY(.13,.12,.7,steel,0,-.35,0,armL);SP(.14,skin,0,-.76,0,armL);CY(.13,.12,.7,steel,0,-.35,0,armR);SP(.14,skin,0,-.76,0,armR);
    const sp=grp(0,-.76,0,armR);CY(.04,.04,3.0,M(0x5a3a22),0,.6,0,sp);CN(.12,.55,M(0xeaf0ff,{metalness:.7,roughness:.25,emissive:0x335577,emissiveIntensity:.4}),0,2.35,0,sp,5);BX(.3,.08,.08,gold,0,2.05,0,sp);
    sp.rotation.x=1.2;o.weapon=sp;
  }else if(cls==='monk'){
    const cloth=M(tint||0xd2893a),pants=M(0x3a2a22),band=M(0xd8353a),wrap=M(0xe8dcc0);
    CY(.17,.14,.8,pants,0,-.4,0,legL);CY(.17,.14,.8,pants,0,-.4,0,legR);BX(.26,.16,.42,wrap,0,-.78,.07,legL);BX(.26,.16,.42,wrap,0,-.78,.07,legR);
    BX(.9,.9,.5,cloth,0,0,0,torso);BX(.94,.12,.54,band,0,-.32,0,torso);
    const bd=mesh(new THREE.TorusGeometry(.36,.05,6,14),EM(0xffd27a,.5),0,.42,.05,torso);bd.rotation.x=Math.PI/2.4;
    SP(.32,skin,0,0,0,head);const hr=SP(.36,M(0x2a1e18),0,.08,-.06,head,10,8);hr.scale.set(1,.9,1);
    const hb=mesh(new THREE.TorusGeometry(.34,.045,6,14),band,0,.12,0,head);hb.rotation.x=Math.PI/2;eye(-.11,.0,.3);eye(.11,.0,.3);
    CY(.16,.13,.7,skin,0,-.35,0,armL);SP(.17,wrap,0,-.78,0,armL);CY(.16,.13,.7,skin,0,-.35,0,armR);SP(.17,wrap,0,-.78,0,armR);
    const fist=grp(0,-.78,0,armR);const fg=glow(0xffd27a,1.5,.5);fist.add(fg);o.weapon=fist;
  }else if(cls==='gunner'){
    const coat=M(tint||0x4a8aa0),dk2=M(0x20262e),lea=M(0x6b4a2b),brass=M(0xe8b73a,{metalness:.6,roughness:.35}),steel=M(0xc8d0d8,{metalness:.7,roughness:.3});
    CY(.15,.13,.8,dk2,0,-.4,0,legL);CY(.15,.13,.8,dk2,0,-.4,0,legR);BX(.27,.2,.42,lea,0,-.78,.07,legL);BX(.27,.2,.42,lea,0,-.78,.07,legR);
    BX(.86,.9,.5,coat,0,0,0,torso);BX(.9,.1,.53,lea,0,-.3,0,torso);SP(.05,brass,-.1,.2,.26,torso,6,5);SP(.05,brass,.1,.0,.26,torso,6,5);
    BX(.9,.8,.08,coat,0,-.55,-.28,torso).rotation.x=.1;
    SP(.32,skin,0,0,0,head);SP(.36,dk2,0,.1,-.08,head,10,8);
    CY(.62,.62,.06,dk2,0,.27,0,head,14);CY(.36,.4,.4,dk2,0,.48,0,head,10);CY(.38,.38,.08,brass,0,.34,0,head,10);
    BX(.5,.12,.1,M(0xd8353a),0,-.12,.3,head);eye(-.11,.05,.3);eye(.11,.05,.3);
    CY(.12,.11,.7,coat,0,-.35,0,armL);SP(.13,skin,0,-.76,0,armL);CY(.12,.11,.7,coat,0,-.35,0,armR);SP(.13,skin,0,-.76,0,armR);
    const gn=grp(0,-.76,0,armR);BX(.1,.5,.1,steel,0,-.22,0,gn);BX(.12,.16,.14,brass,0,-.02,0,gn);BX(.09,.2,.09,lea,0,.02,-.12,gn).rotation.x=.35;
    o.weapon=gn;
  }else if(cls==='summoner'){
    const robe=M(tint||0x3aa08a),trim=M(0xe8d27a,{metalness:.5,roughness:.4}),wood=M(0x5a4a2b),leaf=M(0x6bd06a);
    BX(.22,.5,.3,M(0x2a3a2a),-.2,-.4,.04,legL);BX(.22,.5,.3,M(0x2a3a2a),.2,-.4,.04,legR);
    CY(.4,.46,.62,robe,0,.28,0,torso,10);CY(.46,.74,1.2,robe,0,-.52,0,torso,12);
    const sash=mesh(new THREE.TorusGeometry(.46,.07,6,14),trim,0,-.08,0,torso);sash.rotation.x=Math.PI/2;
    for(const s of[-1,1])CN(.12,.5,leaf,s*.62,.62,0,torso,4).rotation.z=-s*.5;
    SP(.32,skin,0,0,0,head);const hr=SP(.38,M(0x2a1e18),0,.05,-.08,head,10,8);hr.scale.set(1,1,.95);eye(-.12,-.02,.29);eye(.12,-.02,.29);
    for(const s of[-1,1]){const hn=CN(.07,.5,leaf,s*.24,.45,-.05,head,5);hn.rotation.z=-s*.35}
    CY(.17,.21,.7,robe,0,-.32,0,armL);SP(.13,skin,0,-.74,0,armL);CY(.17,.21,.7,robe,0,-.32,0,armR);SP(.13,skin,0,-.74,0,armR);
    const st=grp(0,-.74,0,armR);CY(.05,.06,2.2,wood,0,.4,0,st);
    const orb=SP(.2,EM(0x6bffd0,1.3),0,1.6,0,st,10,8);const cl=mesh(new THREE.TorusGeometry(.26,.04,5,10),trim,0,1.45,0,st);cl.rotation.x=Math.PI/2;
    const gl=glow(0x6bffd0,1.9,.75);gl.position.set(0,1.6,0);st.add(gl);o.orb=orb;o.orbGlow=gl;st.rotation.x=.55;o.weapon=st;
    o.wisps=[];for(let i=0;i<2;i++){const w=grp(0,0,0,body);SP(.12,EM(0x9fffe8,1.4),0,0,0,w,8,6);w.add(glow(0x9fffe8,.9,.6));o.wisps.push(w)}
  }else if(cls==='darknight'){
    const blk=M(0x2a2236,{metalness:.5,roughness:.45}),pur=M(tint||0x4a2a6a),edge=M(0xff3a6a,{emissive:0xff3a6a,emissiveIntensity:.8}),steel=M(0x5a5470,{metalness:.6,roughness:.4});
    CY(.17,.15,.8,blk,0,-.4,0,legL);CY(.17,.15,.8,blk,0,-.4,0,legR);BX(.3,.18,.46,steel,0,-.78,.08,legL);BX(.3,.18,.46,steel,0,-.78,.08,legR);
    BX(.95,.95,.58,blk,0,0,0,torso);BX(.6,.7,.1,pur,0,.05,.31,torso);BX(.98,.08,.6,edge,0,-.28,0,torso);
    for(const s of[-1,1]){SP(.34,blk,s*.62,.5,0,torso);CN(.1,.4,edge,s*.7,.86,0,torso,5).rotation.z=-s*.4}
    BX(1.0,1.4,.08,M(0x3a1030),0,-.15,-.36,torso).rotation.x=.12;
    SP(.33,skin,0,0,0,head);const hm=SP(.42,blk,0,.07,-.02,head,10,8);hm.scale.set(1,.95,1);BX(.42,.06,.1,edge,0,.04,.38,head);
    for(const s of[-1,1]){const hn=CN(.08,.55,steel,s*.34,.4,0,head,5);hn.rotation.z=-s*.7}
    CY(.13,.12,.7,blk,0,-.35,0,armL);SP(.14,steel,0,-.76,0,armL);CY(.13,.12,.7,blk,0,-.35,0,armR);SP(.14,steel,0,-.76,0,armR);
    const sw=grp(0,-.76,0,armR);BX(.3,2.1,.07,steel,0,1.1,0,sw);BX(.05,2.0,.08,edge,0,1.1,0,sw);BX(.62,.12,.2,blk,0,.12,0,sw);CY(.06,.06,.4,M(0x1a1420),0,-.12,0,sw);
    sw.rotation.x=.9;o.weapon=sw;
  }
  o.ak=({warrior:'m',rogue:'m',lancer:'m',monk:'m',darknight:'m',mage:'c',cleric:'c',summoner:'c'})[cls]||'a';
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
  if(o.ak==='m'){
    o.armL.rotation.x=-.5-sw*.35;o.armL.rotation.z=.05;
    if(atkP>=0){const k=easeOut(atkP);o.armR.rotation.x=lerp(-2.6,.4,k);o.armR.rotation.z=lerp(-.5*sd,.3*sd,k);o.torso.rotation.y=lerp(.7*sd,-.7*sd,k)}
    else{o.armR.rotation.x=-.3-sw*.5;o.armR.rotation.z=0;o.torso.rotation.y*=.85}
  }else if(o.ak==='c'){
    o.armL.rotation.x=-.4-sw*.4;o.armL.rotation.z=.1;
    if(atkP>=0){const k=Math.sin(atkP*Math.PI);o.armR.rotation.x=-1.0-k*.9;o.torso.rotation.y=-k*.3}
    else{o.armR.rotation.x=-.35-sw*.4;o.torso.rotation.y*=.85}
    if(o.orb){o.orb.rotation.y=t*2;const s=1+Math.sin(t*5)*.08;o.orbGlow.scale.set(1.9*s,1.9*s,1)}
    if(o.wisps)o.wisps.forEach((w,i)=>{const a=t*1.6+i*3.14;w.position.set(Math.cos(a)*.95,1.9+Math.sin(t*2.4+i)*.18,Math.sin(a)*.95)});
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
/* ---- new monster models (zones 1-9 variety) ---- */
function makeQuad(o){
  const g=grp(),b=grp(0,0,0,g),fur=M(o.body),dk=M(o.dk),L=o.len||1.7,H=.62;
  BX(1.0,.85,L,fur,0,H+.4,0,b);BX(.9,.3,L*.7,dk,0,H+.9,-.1,b);
  const head=grp(0,H+.55,L*.5+.2,b);BX(.78,.7,.75,fur,0,0,0,head);BX(.46,.34,.5,M(o.snout||0xc9a58a),0,-.14,.5,head);
  SP(.055,EM(o.eye,1.6),-.22,.1,.37,head,5,4);SP(.055,EM(o.eye,1.6),.22,.1,.37,head,5,4);
  if(o.tusk)for(const s of[-1,1]){const t=CN(.06,.38,M(0xf2ead0),s*.2,-.05,.62,head,4);t.rotation.x=1.15}
  if(o.ears)for(const s of[-1,1])CN(.12,.34,dk,s*.26,.42,-.05,head,4);
  if(o.horn)for(const s of[-1,1]){const h=CN(.08,.5,M(0xe8e0c8),s*.24,.45,0,head,5);h.rotation.z=-s*.4}
  if(o.flame){CN(.4,1.1,EM(o.flame,1.3),0,H+1.25,-.1,b,5);const gl=glow(o.flame,3,.55);gl.position.set(0,H+1.1,0);b.add(gl)}
  if(o.frost){for(let i=0;i<4;i++){const c=CN(.14,.55,EM(0xbfe6ff,.8),(i-1.5)*.22,H+1.05,-.2+i*.1,b,4);c.rotation.z=(i-1.5)*.15}}
  const tail=grp(0,H+.8,-L*.5,b);const tt=CN(.1,.8,dk,0,0,-.35,tail,4);tt.rotation.x=-1.2;
  const legs=[];for(const p of[[-.32,.6],[.32,.6],[-.32,-.6],[.32,-.6]]){const l=grp(p[0],H+.2,p[1]*(L/1.7),b);CY(.1,.08,H+.2,dk,0,-(H+.2)/2,0,l,5);BX(.2,.1,.26,dk,0,-(H+.2),.04,l);legs.push(l)}
  return fin({g,b,legs,head,tail,kind:o.kind},9,.04,.95);
}
function makeWraith(){
  const g=grp(),b=grp(0,.4,0,g),cl=M(0x4a5a8a,{transparent:true,opacity:.78,emissive:0x2a3a7a,emissiveIntensity:.55}),dk=M(0x1a2040,{transparent:true,opacity:.85});
  const body=CN(.75,2.0,cl,0,.5,0,b,8);const tail=CN(.5,1.3,cl,0,-.7,0,b,6);tail.rotation.x=Math.PI;
  const head=grp(0,1.65,0,b);SP(.36,dk,0,0,0,head,8,6);CN(.4,.6,cl,0,.25,-.05,head,7);
  SP(.07,EM(0x9fe8ff,1.9),-.13,.02,.3,head,5,4);SP(.07,EM(0x9fe8ff,1.9),.13,.02,.3,head,5,4);
  const armL=grp(-.55,1.2,0,b),armR=grp(.55,1.2,0,b);for(const a of[armL,armR]){const c=CN(.12,1.1,cl,0,-.5,0,a,5);c.rotation.x=Math.PI;SP(.1,EM(0x9fe8ff,1.2),0,-1.05,0,a,5,4)}
  const gl=glow(0x7aa8ff,3.6,.4);gl.position.set(0,.8,0);b.add(gl);
  return fin({g,b,armL,armR,tail,head,gl,kind:'wraith'},4,.05,.8);
}
function makeSpider(){
  const g=grp(),b=grp(0,.75,0,g),ch=M(0x2a2250),cr=EM(0x7a7aff,1.1),dk=M(0x1a1634);
  const ab=SP(.62,ch,0,.15,-.75,b,9,7);ab.scale.set(1,.85,1.25);SP(.42,ch,0,.15,.15,b,8,6);const head=grp(0,.15,.72,b);SP(.3,ch,0,0,0,head,8,6);
  for(const p of[[-.12,.1],[.12,.1],[-.2,.02],[.2,.02]])SP(.055,EM(0xff4060,1.7),p[0],p[1]+.08,.25,head,5,4);
  for(const s of[-1,1]){const f=CN(.05,.3,M(0xe8e0d0),s*.1,-.18,.25,head,4);f.rotation.x=2.7}
  for(let i=0;i<3;i++){const c=OC(.24,cr,(i-1)*.35,.62,-.7-Math.abs(i-1)*.1,b);c.scale.set(.7,1.5,.7)}
  const gl=glow(0x7a7aff,2.6,.45);gl.position.set(0,.7,-.7);b.add(gl);
  const legs=[];for(let i=0;i<4;i++)for(const s of[-1,1]){const l=grp(s*.3,.1,.55-i*.4,b);const u=CY(.045,.04,1.0,dk,s*.5,.0,0,l,5);u.rotation.z=s*1.05;const d=CY(.035,.03,.95,dk,s*1.02,-.38,0,l,5);d.rotation.z=-s*.25;legs.push({g:l,s,i})}
  return fin({g,b,legs,head,gl,kind:'spider'},6,.04,1.0);
}
function makeStormhawk(){
  const g=grp(),b=grp(0,.2,0,g),fe=M(0x5a6a8a),lt=M(0xe8eefc),ye=M(0xffd24a);
  const body=SP(.4,fe,0,0,0,b,8,6);body.scale.set(.9,.8,1.3);const head=grp(0,.22,.55,b);SP(.26,lt,0,0,0,head,8,6);
  const bk=CN(.08,.32,ye,0,-.03,.3,head,4);bk.rotation.x=Math.PI/2;SP(.05,EM(0xffe27a,1.8),-.12,.07,.2,head,5,4);SP(.05,EM(0xffe27a,1.8),.12,.07,.2,head,5,4);
  BX(.42,.05,.62,fe,0,0,-.78,b);BX(.2,.05,.4,lt,0,0,-1.15,b);
  const wl=grp(-.3,.1,0,b),wr=grp(.3,.1,0,b);
  for(const [w,s] of[[wl,-1],[wr,1]]){BX(1.5,.05,.8,fe,s*.75,0,0,w);BX(.8,.04,.6,lt,s*1.6,0,-.1,w);BX(.5,.04,.4,M(0xffe27a,{emissive:0xffd24a,emissiveIntensity:.8}),s*2.1,0,-.15,w)}
  for(const s of[-1,1]){const c=CN(.05,.28,ye,s*.14,-.45,.1,b,4);c.rotation.x=Math.PI}
  const gl=glow(0xffe27a,2.6,.5);b.add(gl);
  return fin({g,b,wl,wr,head,gl,kind:'stormhawk'},5,.05,.7);
}
function makeScorpion(){
  const g=grp(),b=grp(0,0,0,g),sh=M(0xb88a4a),dk=M(0x6a4a24),cl=M(0xd8a85a);
  BX(1.0,.45,1.3,sh,0,.55,0,b);BX(.7,.38,.5,dk,0,.55,.8,b);SP(.05,EM(0xff5a3a,1.7),-.15,.68,1.05,b,5,4);SP(.05,EM(0xff5a3a,1.7),.15,.68,1.05,b,5,4);
  const pin=[];for(const s of[-1,1]){const a=grp(s*.6,.55,.8,b);BX(.16,.16,.9,sh,s*.15,0,.45,a);BX(.5,.14,.4,cl,s*.2,0,1.0,a);const c=CN(.12,.5,cl,s*.38,0,1.25,a,4);c.rotation.x=Math.PI/2;pin.push(a)}
  const tail=grp(0,.7,-.6,b);SP(.24,sh,0,.2,-.2,tail,6,5);SP(.22,sh,0,.75,-.4,tail,6,5);SP(.2,sh,0,1.25,-.2,tail,6,5);
  const st=CN(.1,.42,EM(0x6aff6a,1.2),0,1.55,.1,tail,4);st.rotation.x=2.3;const gl=glow(0x6aff6a,1.2,.6);gl.position.set(0,1.6,.2);tail.add(gl);
  const legs=[];for(let i=0;i<3;i++)for(const s of[-1,1]){const l=grp(s*.45,.5,.3-i*.4,b);const c=CY(.04,.035,.8,dk,s*.35,-.15,0,l,4);c.rotation.z=s*.9;legs.push({g:l,s,i})}
  return fin({g,b,legs,tail,pin,gl,kind:'scorpion'},8,.04,1.0);
}
function makeHum(o){
  const g=grp(),b=grp(0,0,0,g),sk=M(o.skin),cl=M(o.cloth),tr=M(o.trim||o.cloth),w=o.bulk||1;
  const legL=grp(-.2*w,.85,0,b),legR=grp(.2*w,.85,0,b);
  if(!o.noLegs){for(const l of[legL,legR]){CY(.1*w,.08*w,.85,cl,0,-.42,0,l);BX(.24*w,.12,.34,tr,0,-.85,.06,l)}}
  BX(.7*w,.95,.4*w,cl,0,1.35,0,b);BX(.78*w,.18,.44*w,tr,0,.92,0,b);
  if(o.skirt)CN(.75*w,1.35,cl,0,.7,0,b,8);
  if(o.wraps)for(let i=0;i<5;i++)BX(.76*w,.07,.46*w,M(0xe8dcb8),0,.95+i*.19,0,b);
  const head=grp(0,2.05,0,b);SP(.3,sk,0,0,0,head,10,8);
  if(o.head==='hood'){const h=CN(.42,.75,cl,0,.12,-.05,head,7);h.rotation.x=-.12}
  if(o.head==='helm'){SP(.34,tr,0,.04,0,head,9,7);BX(.5,.08,.12,EM(o.eye,1.4),0,.02,.3,head);BX(.1,.35,.5,tr,0,.3,-.02,head)}
  if(o.brow)BX(.56,.12,.2,cl,0,.14,.24,head);
  if(o.head!=='helm'){SP(.055,EM(o.eye,1.7),-.11,.03,.27,head,5,4);SP(.055,EM(o.eye,1.7),.11,.03,.27,head,5,4)}
  const armL=grp(-.46*w,1.7,0,b),armR=grp(.46*w,1.7,0,b);
  for(const a of[armL,armR]){CY(.08*w,.07*w,.75,o.sleeve?cl:sk,0,-.38,0,a);SP(.13*w,sk,0,-.78,0,a,6,5)}
  const gc=o.glow||0xffffff;
  if(o.weapon==='blades')for(const a of[armL,armR]){const bl=BX(.06,.95,.03,EM(gc,1.2),0,-1.2,.12,a);bl.rotation.x=.5}
  else if(o.weapon==='sword'){BX(.14,1.5,.06,M(0xdcdcf0,{metalness:.6}),0,-1.45,.1,armR);BX(.42,.09,.12,tr,0,-.78,.1,armR)}
  else if(o.weapon==='club')CY(.14,.22,1.2,M(0x6b5a46),0,-1.2,.1,armR,6);
  else if(o.weapon==='staff'){CY(.04,.04,2.0,M(0x7a6a50),0,-.7,.1,armR,5);SP(.15,EM(gc,1.7),0,.35,.1,armR,6,5)}
  if(o.shield)BX(.1,.95,.7,tr,-.1,-.7,.2,armL);
  const wings=[];
  if(o.wings){for(const s of[-1,1]){const wg=grp(s*.3,1.7,-.25,b);for(let i=0;i<4;i++){const f=CN(.14,1.7-i*.25,EM(o.wings,.5),s*(.3+i*.28),.2-i*.1,0,wg,4);f.rotation.z=-s*(1.0+i*.12)}wings.push(wg)}}
  let halo=null;if(o.halo){halo=mesh(new THREE.TorusGeometry(.42,.04,6,18),EM(0xffe27a,1.5),0,.62,0,head);halo.rotation.x=Math.PI/2}
  if(o.glow){const gl=glow(o.glow,2.4,.45);gl.position.set(0,1.4,.2);b.add(gl)}
  return fin({g,b,legL,legR,armL,armR,head,wings,halo,kind:o.kind},10,.04,.8);
}
const makePhantom=()=>makeHum({kind:'phantom',skin:0x3a2a5a,cloth:0x241636,trim:0x4a2a6a,eye:0xff3dd0,bulk:.85,head:'hood',weapon:'blades',glow:0xff3dd0});
const makeYeti=()=>makeHum({kind:'yeti',skin:0xcfdcea,cloth:0xe8f0f8,trim:0x9fb6cc,eye:0x6ad0ff,bulk:1.9,head:'bare',brow:true,sleeve:true,weapon:'none'});
const makeMummy=()=>makeHum({kind:'mummy',skin:0xd8c9a0,cloth:0xd8c9a0,trim:0xb8a880,eye:0x6aff9a,bulk:1.1,head:'bare',wraps:true,sleeve:true,weapon:'none'});
const makeSentinel=()=>makeHum({kind:'sentinel',skin:0xe8e4f0,cloth:0xe8e4f0,trim:0xd8b24a,eye:0xffe27a,bulk:1.25,head:'helm',weapon:'sword',shield:true,glow:0xffe27a,sleeve:true});
const makeIceWitch=()=>makeHum({kind:'icewitch',skin:0xdfeeff,cloth:0x7aa8d8,trim:0xbfe6ff,eye:0x9fe8ff,bulk:.9,head:'hood',skirt:true,weapon:'staff',glow:0x9fe8ff,sleeve:true});
const makeSeraph=()=>makeHum({kind:'seraph',skin:0xfff0d8,cloth:0xf6f0ff,trim:0xe8c860,eye:0xffe27a,bulk:.9,head:'bare',noLegs:true,skirt:true,weapon:'staff',glow:0xffe27a,wings:0xfff0b0,halo:true,sleeve:true});
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
