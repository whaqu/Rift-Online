/* ---------------- world: town + 4 hunting zones ---------------- */
function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const WORLD={obst:[],grid:{},cell:8,npcs:[],lava:[]};
const NPCS=[
  {kind:'shop',name:'상점',x:-10,z:-7,face:.9},
  {kind:'smith',name:'대장간',x:10,z:-7,face:-.9},
  {kind:'auction',name:'경매장',x:-10,z:8,face:2.2},
  {kind:'job',name:'전직 교관',x:10,z:8,face:-2.2}
];
const SPAWN={x:0,z:7};
function addObst(x,z,r){const o={x,z,r};WORLD.obst.push(o);const k=Math.floor(x/WORLD.cell)+','+Math.floor(z/WORLD.cell);(WORLD.grid[k]||(WORLD.grid[k]=[])).push(o)}
function pushOut(e,r){
  const d=Math.hypot(e.x,e.z),lim=WORLD_R-1.2;if(d>lim){e.x*=lim/d;e.z*=lim/d}
  const cx=Math.floor(e.x/WORLD.cell),cz=Math.floor(e.z/WORLD.cell);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
    const c=WORLD.grid[(cx+i)+','+(cz+j)];if(!c)continue;
    for(const o of c){const dx=e.x-o.x,dz=e.z-o.z,rr=o.r+r,dd=dx*dx+dz*dz;if(dd<rr*rr){const dl=Math.sqrt(dd)||.01,k=(rr-dl)/dl;e.x+=dx*k;e.z+=dz*k}}
  }
}
function blocked(x,z,r){
  const cx=Math.floor(x/WORLD.cell),cz=Math.floor(z/WORLD.cell);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const c=WORLD.grid[(cx+i)+','+(cz+j)];if(!c)continue;for(const o of c)if(d2(x,z,o.x,o.z)<(o.r+r)*(o.r+r))return true}
  return false;
}
const _dm=new THREE.Object3D();
function instSet(mesh,i,x,y,z,sx,sy,sz,ry,col){
  _dm.position.set(x,y,z);_dm.scale.set(sx,sy,sz);_dm.rotation.set(0,ry||0,0);_dm.updateMatrix();mesh.setMatrixAt(i,_dm.matrix);
  if(col!=null&&mesh.setColorAt){_c.set(col);mesh.setColorAt(i,_c)}
}
function instMesh(geo,mat,n){const m=new THREE.InstancedMesh(geo,mat,n);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;worldG.add(m);return m}
function instDone(m){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}

function cobbleTex(){
  const S=512,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  g.fillStyle='#8c8678';g.fillRect(0,0,S,S);
  const R=mulberry(7);
  for(let y=0;y<S;y+=32)for(let x=-(y/32%2)*16;x<S;x+=32){
    const v=Math.floor(R()*26);g.fillStyle='rgb('+(150+v)+','+(144+v)+','+(130+v)+')';g.fillRect(x+2,y+2,28,28);
  }
  const t=new THREE.CanvasTexture(c);if(t.wrapS!==undefined){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,5)}return t;
}


function pathTexture(){
  const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d'),R=mulberry(11);
  g.fillStyle='#8c7752';g.fillRect(0,0,128,256);
  for(let i=0;i<520;i++){g.fillStyle='rgba('+(R()<.5?'255,240,210':'60,40,20')+','+(R()*.12)+')';const r=R()*4+1;g.fillRect(R()*128,R()*256,r,r)}
  for(let i=0;i<46;i++){g.fillStyle='rgba(128,118,100,.65)';g.beginPath();g.ellipse(R()*128,R()*256,R()*4+2,R()*3+1.5,R()*3,0,TAU);g.fill()}
  g.globalCompositeOperation='destination-in';
  const gr=g.createLinearGradient(0,0,128,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.2,'rgba(0,0,0,1)');gr.addColorStop(.8,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,128,256);
  const t=new THREE.CanvasTexture(c);if(t.wrapS!==undefined){t.wrapS=t.wrapT=THREE.RepeatWrapping}return t;
}
function emblemTex(){
  const S=512,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  g.translate(S/2,S/2);g.lineCap='round';g.strokeStyle='#ffd98a';
  g.globalAlpha=.9;g.lineWidth=5;[244,228].forEach(r=>{g.beginPath();g.arc(0,0,r,0,TAU);g.stroke()});
  g.globalAlpha=.6;g.lineWidth=3;[150,96].forEach(r=>{g.beginPath();g.arc(0,0,r,0,TAU);g.stroke()});
  g.globalAlpha=.8;g.lineWidth=6;for(let i=0;i<24;i++){const a=i/24*TAU;g.save();g.rotate(a);g.beginPath();g.moveTo(232,0);g.lineTo(240,0);g.stroke();g.restore()}
  g.globalAlpha=.7;g.lineWidth=3;for(let k=0;k<2;k++){g.beginPath();for(let i=0;i<3;i++){const a=i/3*TAU+k*Math.PI/3-Math.PI/2,r=200;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.stroke()}
  g.fillStyle='#ffd98a';g.globalAlpha=.8;for(let i=0;i<12;i++){const a=i/12*TAU;g.save();g.rotate(a);g.beginPath();g.moveTo(170,0);g.lineTo(184,-9);g.lineTo(198,0);g.lineTo(184,9);g.closePath();g.fill();g.restore()}
  g.globalAlpha=.45;g.lineWidth=2;for(let i=0;i<12;i++){const a=i/12*TAU;g.beginPath();g.moveTo(Math.cos(a)*100,Math.sin(a)*100);g.lineTo(Math.cos(a)*150,Math.sin(a)*150);g.stroke()}
  return new THREE.CanvasTexture(c);
}
const ZCOL=[0x8fe8ff,0x8fe8ff,0x9fb0ff,0xff7a3a,0xc06bff,0xffe27a,0xff3dd0];
function onPath(x,z){const d=Math.hypot(x,z);if(d>17&&d<64)return Math.abs(x)<3.6||Math.abs(z)<3.6;return x>0&&Math.abs(z)<3.6&&d<162}
WORLD.wisps=[];WORLD.ponds=[];WORLD.cracks=null;WORLD.emblem=null;WORLD.pulse=[];

function buildWorld(){
  clearGroup(worldG);WORLD.obst.length=0;WORLD.grid={};WORLD.lava.length=0;WORLD.wisps.length=0;WORLD.ponds.length=0;WORLD.pulse.length=0;WORLD.cracks=null;WORLD.emblem=null;
  const R=mulberry(20240611);
  /* ground */
  const SIZE=(WORLD_R+14)*2,SEG=96;
  const geo=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;
  if(pos){
    const col=new Float32Array(pos.count*3),cc=new THREE.Color(),c2=new THREE.Color();
    for(let i=0;i<pos.count;i++){
      const x=pos.getX?pos.getX(i):pos.array[i*3],z=pos.getZ?pos.getZ(i):pos.array[i*3+2],d=Math.hypot(x,z);
      let zi=0;for(let k=ZONES.length-1;k>=0;k--)if(d>=ZONES[k].r0){zi=k;break}
      const zn=ZONES[zi],nx=ZONES[Math.min(ZONES.length-1,zi+1)];
      if(zi===0)cc.set(0x6f8a56);else{const nn=Math.sin(x*.11+Math.sin(z*.13)*2)+Math.cos(z*.09+Math.sin(x*.17)*1.7)+Math.sin((x+z)*.31)*.4;cc.set(zn.ground);c2.set(zn.alt);cc.lerp(c2,clamp(nn*.5+.5,0,1))}
      if(zi<ZONES.length-1){const e=clamp((d-(zn.r1-5))/10,0,1);if(e>0){c2.set(nx.ground);cc.lerp(c2,e)}}
      if(d>WORLD_R-2){c2.set(0x15182a);cc.lerp(c2,clamp((d-(WORLD_R-2))/8,0,1))}
      const n=(R()-.5)*.09;col[i*3]=clamp(cc.r+n,0,1);col[i*3+1]=clamp(cc.g+n,0,1);col[i*3+2]=clamp(cc.b+n,0,1);
    }
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  }
  const gm=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,metalness:0}));gm.receiveShadow=true;worldG.add(gm);
  /* town plaza */
  const plaza=new THREE.Mesh(new THREE.CircleGeometry(17.5,48),new THREE.MeshStandardMaterial({map:cobbleTex(),roughness:.95,flatShading:true}));plaza.rotation.x=-Math.PI/2;plaza.position.y=.04;plaza.receiveShadow=true;worldG.add(plaza);
  const edge=new THREE.Mesh(new THREE.RingGeometry(17.5,18.3,48),new THREE.MeshStandardMaterial({color:0x6b6558,roughness:1,flatShading:true}));edge.rotation.x=-Math.PI/2;edge.position.y=.06;worldG.add(edge);
  const safe=new THREE.Mesh(new THREE.RingGeometry(18.9,19.1,64),flatMat(0x8fe8ff,.35));safe.rotation.x=-Math.PI/2;safe.position.y=.08;worldG.add(safe);
  /* fountain */
  const stone=M(0x9a96a8,{roughness:.9}),water=M(0x5ec8ff,{emissive:0x2a80b0,emissiveIntensity:.5,transparent:true,opacity:.85});
  CY(2.8,3.1,.9,stone,0,.45,0,worldG,16);CY(2.3,2.3,.6,water,0,.85,0,worldG,16);CY(.5,.7,2.6,stone,0,1.5,0,worldG,8);SP(.8,stone,0,2.9,0,worldG,8,6);
  const fgl=glow(0x7fd6ff,6,.35);fgl.position.set(0,2,0);worldG.add(fgl);addObst(0,0,3.2);
  {const em=new THREE.Mesh(new THREE.PlaneGeometry(17,17),new THREE.MeshBasicMaterial({map:emblemTex(),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));em.rotation.x=-Math.PI/2;em.position.y=.075;worldG.add(em);WORLD.emblem=em}
  {const fl=instMesh(new THREE.IcosahedronGeometry(.2,0),M(0xffffff),22);fl.castShadow=false;const fc=[0xff7aa8,0xffd24a,0xffffff,0xb48aff];
    for(let i=0;i<22;i++){const a=i/22*TAU;instSet(fl,i,Math.cos(a)*4.5,.28,Math.sin(a)*4.5,1,1,1,0,fc[i%4])}instDone(fl)}
  /* torches */
  for(let i=0;i<10;i++){const a=i/10*TAU+.3,x=Math.cos(a)*18.6,z=Math.sin(a)*18.6;
    CY(.12,.16,2.4,M(0x4a3426),x,1.2,z,worldG,6);const f=SP(.28,EM(0xffb040,1.6),x,2.6,z,worldG,6,5);const g=glow(0xffa030,3,.55);g.position.set(x,2.6,z);worldG.add(g);addObst(x,z,.4)}
  /* paths */
  try{{const pt=pathTexture(),mkPath=(th,r0,len)=>{
      const geo=new THREE.PlaneGeometry(4.8,len);geo.rotateX(-Math.PI/2);
      const uv=geo.attributes&&geo.attributes.uv;if(uv&&uv.count){for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*len/9)}
      const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:pt,transparent:true,roughness:1,depthWrite:false}));
      m.position.set(Math.sin(th)*(r0+len/2),.03,Math.cos(th)*(r0+len/2));m.rotation.y=th;m.receiveShadow=true;worldG.add(m)};
    mkPath(0,17.9,44);mkPath(Math.PI,17.9,44);mkPath(-Math.PI/2,17.9,44);mkPath(Math.PI/2,17.9,228)}
  /* gates */
  const stoneG=M(0x8a8798,{roughness:.9}),darkG=M(0x55526a,{roughness:.9});
  const gate=(x,z,th,col,sc)=>{
    sc=sc||1;const g=grp(x,0,z,worldG);g.rotation.y=th;g.scale.set(sc,sc,sc);
    for(const sx of[-3.9,3.9]){BX(1.4,6.4,1.4,stoneG,sx,3.2,0,g);BX(1.9,.5,1.9,darkG,sx,6.6,0,g);BX(1.9,.6,1.9,darkG,sx,.3,0,g);
      const f=SP(.3,EM(0xffb040,1.6),sx,7.1,0,g,6,5);const gl=glow(0xffa030,3.2,.6);gl.position.set(sx,7.1,0);g.add(gl);
      addObst(x+Math.cos(th)*sx*sc,z-Math.sin(th)*sx*sc,1.0*sc)}
    BX(9.8,.9,1.2,stoneG,0,6.2,0,g);BX(8,.5,1.0,darkG,0,5.6,0,g);
    const gem=OC(.5,EM(col,1.7),0,4.7,0,g);const gg=glow(col,4.2,.55);gg.position.set(0,4.7,0);g.add(gg);WORLD.pulse.push({s:gg,b:.55,ph:Math.random()*6});WORLD.gems=WORLD.gems||[];WORLD.gems.push(gem);
    for(const sx of[-2,2]){BX(1.1,2.2,.08,M(col,{emissive:col,emissiveIntensity:.35}),sx,4.5,.2,g)}
    return g;
  };
  WORLD.gems=[];
  [0,Math.PI/2,Math.PI,-Math.PI/2].forEach(th=>gate(Math.sin(th)*20.8,Math.cos(th)*20.8,th,0x8fe8ff,.9));
  for(const zi of[2,3,4,5,6])gate(ZONES[zi].r0,0,Math.PI/2,ZCOL[zi],1.1);
  /* ponds */
  [[38,-26,5.5],[-30,36,6.5],[-44,-38,5]].forEach(pd=>{
    const [x,z,r]=pd;
    const w=new THREE.Mesh(new THREE.CircleGeometry(r,26),M(0x3c9ad0,{transparent:true,opacity:.84,emissive:0x1a5a8a,emissiveIntensity:.55,roughness:.2,metalness:.1}));w.rotation.x=-Math.PI/2;w.position.set(x,.07,z);worldG.add(w);WORLD.ponds.push(w);
    const sh=new THREE.Mesh(new THREE.RingGeometry(r,r+1,26),M(0x9a8a62,{roughness:1}));sh.rotation.x=-Math.PI/2;sh.position.set(x,.065,z);worldG.add(sh);
    const gl=glow(0x6ac8ff,r*2.2,.22);gl.position.set(x,.5,z);worldG.add(gl);
    for(let i=0;i<7;i++){const a=i/7*TAU+R()*.4,rr=r+.4+R()*.6,sc=.6+R()*.7;const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(1,0),M(0x8a8f98));rk.scale.set(sc*1.2,sc*.7,sc);rk.position.set(x+Math.cos(a)*rr,sc*.35,z+Math.sin(a)*rr);rk.castShadow=true;worldG.add(rk)}
    addObst(x,z,r+.4);
  });
  }catch(e){console.error('deco1',e)}
  /* stalls + npcs */
  WORLD.npcs.length=0;
  const wood=M(0x6b4a2b),cloth={shop:0xc0803a,smith:0x8a4a3a,auction:0x2f8a6a,job:0x6a4ac0};
  for(const n of NPCS){
    const g=grp(n.x,0,n.z,worldG);g.rotation.y=n.face;
    BX(5.4,.3,3.6,M(0x7a6a58),0,.15,0,g);
    for(const sx of[-2.4,2.4])CY(.12,.12,3.2,wood,sx,1.7,-1.4,g,6);
    const roof=BX(5.8,.18,3.2,M(cloth[n.kind]),0,3.3,-.7,g);roof.rotation.x=.22;
    BX(4.6,.9,.8,wood,0,.85,1.0,g);BX(4.8,.12,1.0,M(0xcdb68a),0,1.34,1.0,g);
    if(n.kind==='shop'){for(let i=0;i<3;i++)SP(.22,EM([0xff5a6a,0x5ee7ff,0xffa23a][i],.7),-1+i,1.6,1.0,g,6,5)}
    if(n.kind==='smith'){BX(.9,.5,.6,M(0x3a3a44,{metalness:.6}),1.4,1.6,1.0,g);const fl=glow(0xff7a2a,2.4,.6);fl.position.set(-1.2,1.8,-.6);g.add(fl);SP(.4,EM(0xff6a1a,1.4),-1.2,.7,-.6,g,6,5)}
    if(n.kind==='auction'){BX(.9,1.2,.1,M(0xe6dcc0),-1.6,2.1,1.2,g);BX(.9,1.2,.1,M(0xe6dcc0),1.6,2.1,1.2,g)}
    if(n.kind==='job'){OC(.5,EM(0xc06bff,1.4),0,2.2,-.2,g);const gl=glow(0xc06bff,3,.6);gl.position.set(0,2.2,-.2);g.add(gl)}
    for(const sx of[-3.4,3.4]){CY(.42,.46,.9,M(0x6f4a2a),sx,.75,.9,g,8);const hp=mesh(new THREE.TorusGeometry(.44,.04,5,10),M(0x3a3a44,{metalness:.6}),sx,.75,.9,g);hp.rotation.x=Math.PI/2}
    BX(.9,.9,.9,M(0xa07a4a),3.3,.75,-.4,g);BX(.7,.7,.7,M(0xb58a52),3.4,1.55,-.35,g).rotation.y=.5;
    const npc=makeNPC(n.kind);npc.g.position.set(n.x-Math.sin(n.face)*1.0,0,n.z-Math.cos(n.face)*1.0);
    npc.g.position.set(n.x+Math.sin(n.face)*-.2,.3,n.z+Math.cos(n.face)*-.2);
    npc.g.rotation.y=n.face;worldG.add(npc.g);
    addObst(n.x,n.z,2.6);
    WORLD.npcs.push({kind:n.kind,name:n.name,x:n.x+Math.sin(n.face)*2.4,z:n.z+Math.cos(n.face)*2.4,model:npc,label:makeLabel(n.name,'st')});
  }
  /* houses (decor) */
  [[-15,0,1.57],[15,0,-1.57],[0,-15,0],[-13,-12,.7],[13,-12,-.7]].forEach(h=>{
    const g=grp(h[0],0,h[1],worldG);g.rotation.y=h[2];const wall=M(0xcdb690),roof=M(0x9a4a3a);
    BX(5,3,4,wall,0,1.5,0,g);const rf=CN(4.2,2.2,roof,0,4.1,0,g,4);rf.rotation.y=Math.PI/4;rf.scale.set(1,1,.82);
    BX(1,1.8,.1,M(0x4a3426),0,.9,2.05,g);BX(.8,.8,.1,EM(0xffd27a,.8),1.5,1.8,2.05,g);addObst(h[0],h[1],3.2);
  });
  /* decor by zone */
  const free=(x,z)=>Math.hypot(x,z)>21&&Math.hypot(x,z)<WORLD_R-3&&!onPath(x,z);
  const placeIn=(zi,n,rad,fn)=>{const zn=ZONES[zi];let c=0,tries=0;while(c<n&&tries++<n*20){const a=R()*TAU,r=zn.r0+2+R()*(zn.r1-zn.r0-4),x=Math.cos(a)*r,z=Math.sin(a)*r;if(!free(x,z))continue;let ok=true;for(const o of WORLD.obst){if(Math.abs(o.x-x)<8&&Math.abs(o.z-z)<8&&d2(x,z,o.x,o.z)<(o.r+rad+.6)*(o.r+rad+.6)){ok=false;break}}if(!ok)continue;fn(c++,x,z)}return c};
  // z1 trees
  {const N=190,tr=instMesh(new THREE.CylinderGeometry(.25,.4,2,6),M(0x6b4a2b),N),cn=instMesh(new THREE.ConeGeometry(1.5,3.6,7),M(0xffffff),N),cn2=instMesh(new THREE.ConeGeometry(1.1,2.8,7),M(0xffffff),N);let k=0;
    const cols=[0x3e8a44,0x4a9a48,0x2e7a3e,0x56a850];
    placeIn(1,N,1.2,(i,x,z)=>{const s=.8+R()*.8,c=cols[Math.floor(R()*4)];instSet(tr,i,x,s*1,z,s,s,s,0);instSet(cn,i,x,s*3.2,z,s,s,s,R()*6,c);instSet(cn2,i,x,s*5.0,z,s,s,s,R()*6,c);addObst(x,z,.6*s+.2);k=i+1});
    tr.count=cn.count=cn2.count=k;instDone(tr);instDone(cn);instDone(cn2);
    const rk=instMesh(new THREE.DodecahedronGeometry(1,0),M(0xffffff),40);let kk=0;placeIn(1,40,1.2,(i,x,z)=>{const s=.7+R()*1.0;instSet(rk,i,x,s*.5,z,s*1.2,s*.8,s,R()*6,0x8a8f98);addObst(x,z,s*.9);kk=i+1});rk.count=kk;instDone(rk)}
  // z2 dead forest
  {const N=170,tr=instMesh(new THREE.CylinderGeometry(.14,.36,4.4,5),M(0x2a2a30),N),br=instMesh(new THREE.ConeGeometry(.9,2.2,5),M(0x3a3a44),N);let k=0;
    placeIn(2,N,1,(i,x,z)=>{const s=.8+R()*.9;instSet(tr,i,x,s*2.2,z,s,s,s,0);instSet(br,i,x,s*4.2,z,s,s*.8,s,R()*6);addObst(x,z,.5*s+.2);k=i+1});tr.count=br.count=k;instDone(tr);instDone(br);
    const gs=instMesh(new THREE.BoxGeometry(.9,1.4,.3),M(0x8a8f9a),70);let kk=0;placeIn(2,70,.8,(i,x,z)=>{const s=.8+R()*.5;instSet(gs,i,x,.7*s,z,s,s,s,R()*6);addObst(x,z,.55);kk=i+1});gs.count=kk;instDone(gs)}
  // z3 volcanic
  {const N=130,rk=instMesh(new THREE.DodecahedronGeometry(1,0),M(0xffffff,{roughness:1}),N);let k=0;
    placeIn(3,N,1.4,(i,x,z)=>{const s=.8+R()*1.6;instSet(rk,i,x,s*.55,z,s,s*(.8+R()*.8),s,R()*6,pick([0x3a2a2a,0x4a3030,0x2a2024]));addObst(x,z,s*.95);k=i+1});rk.count=k;instDone(rk);
    for(let i=0;i<26;i++){const a=R()*TAU,r=ZONES[3].r0+4+R()*(ZONES[3].r1-ZONES[3].r0-8),x=Math.cos(a)*r,z=Math.sin(a)*r,s=2+R()*3;
      const m=new THREE.Mesh(shared.discG,flatMat(0xff5a1a,.55));m.rotation.x=-Math.PI/2;m.position.set(x,.1,z);m.scale.set(s,s,s);worldG.add(m);const g=glow(0xff6a2a,s*2.6,.28);g.position.set(x,.8,z);worldG.add(g);WORLD.lava.push({x,z,s,m})}}
  // z4 crystals
  {const N=120,cr=instMesh(new THREE.OctahedronGeometry(1,0),M(0xffffff,{emissive:0x4040a0,emissiveIntensity:.8,roughness:.3}),N);let k=0;
    const cols=[0x7a7aff,0xb06bff,0x5ee7ff,0xff6bd0];
    placeIn(4,N,1.2,(i,x,z)=>{const s=.8+R()*1.6;const cc2=cols[Math.floor(R()*4)];instSet(cr,i,x,s*1.6,z,s*.6,s*1.7,s*.6,R()*6,cc2);if(i%4===0){const g=glow(cc2,s*4.2,.4);g.position.set(x,s*1.6,z);worldG.add(g);WORLD.pulse.push({s:g,b:.4,ph:R()*6})}addObst(x,z,s*.6);k=i+1});cr.count=k;instDone(cr)}

  // z5 thunder plateau: stone spires with charged tips
  {const N=110,sp=instMesh(new THREE.CylinderGeometry(.35,.9,1,5),M(0xffffff,{roughness:.9}),N),tp=instMesh(new THREE.OctahedronGeometry(1,0),M(0xffffff,{emissive:0x8a7a20,emissiveIntensity:.9,roughness:.3}),N);let k=0;
    placeIn(5,N,1.1,(i,x,z)=>{const s=.8+R()*1.3,h=3+R()*5;instSet(sp,i,x,h*.5,z,s,h,s,R()*6,pick([0x4a5568,0x56627a,0x3a4558]));instSet(tp,i,x,h+.3,z,.35*s,.5*s,.35*s,R()*6,0xffe27a);
      if(i%5===0){const g=glow(0xffe27a,s*3.4,.4);g.position.set(x,h+.3,z);worldG.add(g);WORLD.pulse.push({s:g,b:.4,ph:R()*6})}addObst(x,z,.6*s+.3);k=i+1});
    sp.count=tp.count=k;instDone(sp);instDone(tp);
    const rk=instMesh(new THREE.DodecahedronGeometry(1,0),M(0xffffff),50);let kk=0;placeIn(5,50,1.2,(i,x,z)=>{const s=.7+R()*1.1;instSet(rk,i,x,s*.5,z,s*1.2,s*.8,s,R()*6,0x6a7488);addObst(x,z,s*.9);kk=i+1});rk.count=kk;instDone(rk)}
  // z6 void rift: floating shards + magenta fissures
  {const N=110,cr=instMesh(new THREE.OctahedronGeometry(1,0),M(0xffffff,{emissive:0x6a1a8a,emissiveIntensity:.9,roughness:.3}),N);let k=0;
    placeIn(6,N,1.2,(i,x,z)=>{const s=.9+R()*1.9,y=s*1.8+R()*2.5;instSet(cr,i,x,y,z,s*.55,s*1.6,s*.55,R()*6,pick([0x8a2ad0,0xff3dd0,0x5a3aa8,0x2a1a4a]));
      if(i%3===0){const g=glow(0xff3dd0,s*4.6,.38);g.position.set(x,y,z);worldG.add(g);WORLD.pulse.push({s:g,b:.38,ph:R()*6})}addObst(x,z,s*.6);k=i+1});cr.count=k;instDone(cr)}

  /* ground cover */
  try{
  const cover=(zi,n,geo,mat,fn)=>{const m=instMesh(geo,mat,n);m.castShadow=false;m.receiveShadow=false;let k=0;placeIn(zi,n,.05,(i,x,z)=>{fn(m,i,x,z);k=i+1});m.count=k;instDone(m);return m};
  const tm=M(0xffffff,{roughness:1}),gcols=[0x5a9a48,0x6aae52,0x4a8a40,0x7ab85a];
  cover(1,1700,new THREE.ConeGeometry(.17,.9,4),tm,(m,i,x,z)=>{const s=.7+R()*.9;instSet(m,i,x,.4*s,z,s,s,s,R()*6,gcols[Math.floor(R()*4)])});
  {const gl=[0x4a7a3a,0x58884a];const n=420,m=instMesh(new THREE.ConeGeometry(.17,.9,4),tm,n);m.castShadow=false;let k=0;
    for(let i=0;i<n;i++){const a=R()*TAU,r=19+R()*5,x=Math.cos(a)*r,z=Math.sin(a)*r;if(onPath(x,z))continue;const s=.6+R()*.7;instSet(m,k++,x,.4*s,z,s,s,s,R()*6,gl[i&1])}m.count=k;instDone(m)}
  {const N=420,fc=[0xff7aa8,0xffd24a,0xffffff,0xb48aff,0xff8a4a],st=instMesh(new THREE.CylinderGeometry(.025,.025,.42,3),M(0x3f7a38),N),hd=instMesh(new THREE.IcosahedronGeometry(.17,0),M(0xffffff,{emissive:0x222222}),N);st.castShadow=hd.castShadow=false;let k=0;
    placeIn(1,N,.05,(i,x,z)=>{const s=.8+R()*.6;instSet(st,i,x,.21*s,z,s,s,s,0);instSet(hd,i,x,.46*s,z,s,s,s,R()*6,fc[Math.floor(R()*5)]);k=i+1});st.count=hd.count=k;instDone(st);instDone(hd)}
  cover(2,900,new THREE.ConeGeometry(.15,.8,4),tm,(m,i,x,z)=>{const s=.6+R()*1.0;instSet(m,i,x,.4*s,z,s,s*(.8+R()*.8),s,R()*6,R()<.5?0x6a6a78:0x55556a)});
  {const N=110,cap=instMesh(new THREE.SphereGeometry(.42,7,5),M(0xffffff,{emissive:0x6a5acd,emissiveIntensity:.9,roughness:.5}),N),stm=instMesh(new THREE.CylinderGeometry(.1,.14,.5,5),M(0xd8d4c0),N);cap.castShadow=stm.castShadow=false;let k=0;
    placeIn(2,N,.5,(i,x,z)=>{const s=.7+R()*1.1;instSet(cap,i,x,.55*s,z,s,s*.6,s,0,[0x7a8aff,0xb07aff,0x6ad8ff][Math.floor(R()*3)]);instSet(stm,i,x,.25*s,z,s,s,s,0);if(i%4===0){const g=glow(0x8a8aff,2.6*s,.35);g.position.set(x,.8*s,z);worldG.add(g);WORLD.pulse.push({s:g,b:.35,ph:R()*6})}k=i+1;addObst(x,z,.35*s)});cap.count=stm.count=k;instDone(cap);instDone(stm)}
  for(let i=0;i<26;i++){const a=R()*TAU,r=ZONES[2].r0+4+R()*(ZONES[2].r1-ZONES[2].r0-8),x=Math.cos(a)*r,z=Math.sin(a)*r;if(onPath(x,z))continue;const g=glow(0x9fe0ff,1.7,.55);g.position.set(x,1.4,z);worldG.add(g);WORLD.wisps.push({s:g,x,z,ph:R()*6})}
  cover(3,420,new THREE.ConeGeometry(.22,1.3,4),M(0xffffff,{roughness:1,emissive:0x401008,emissiveIntensity:.6}),(m,i,x,z)=>{const s=.6+R()*1.2;instSet(m,i,x,.5*s,z,s,s*(.7+R()*1.1),s,R()*6,pick([0x3a2220,0x4a2a24,0x2e1c1c]))});
  {const N=140,cm=instMesh(new THREE.PlaneGeometry(.35,1),new THREE.MeshBasicMaterial({color:0xff6a1a,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),N);cm.castShadow=false;let k=0;
    placeIn(3,N,.05,(i,x,z)=>{const s=1.5+R()*3.5;_dm.position.set(x,.09,z);_dm.rotation.set(-Math.PI/2,0,R()*TAU);_dm.scale.set(.6+R()*.8,s,1);_dm.updateMatrix();cm.setMatrixAt(i,_dm.matrix);k=i+1});cm.count=k;instDone(cm);WORLD.cracks=cm}
  cover(4,340,new THREE.ConeGeometry(.2,1.2,4),M(0xffffff,{roughness:.3,emissive:0x303090,emissiveIntensity:.9}),(m,i,x,z)=>{const s=.6+R()*1.3;instSet(m,i,x,.5*s,z,s,s,s,R()*6,pick([0x7a7aff,0xb06bff,0x5ee7ff,0xff6bd0]))});
  cover(5,420,new THREE.ConeGeometry(.2,1.0,4),M(0xffffff,{roughness:1}),(m,i,x,z)=>{const s=.6+R()*1.1;instSet(m,i,x,.45*s,z,s,s,s,R()*6,pick([0x56627a,0x6a7a94,0x445066]))});
  {const N=120,cm=instMesh(new THREE.PlaneGeometry(.3,1),new THREE.MeshBasicMaterial({color:0xff3dd0,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),N);cm.castShadow=false;let k=0;
    placeIn(6,N,.05,(i,x,z)=>{const s=2+R()*5;_dm.position.set(x,.09,z);_dm.rotation.set(-Math.PI/2,0,R()*TAU);_dm.scale.set(.6+R()*.8,s,1);_dm.updateMatrix();cm.setMatrixAt(i,_dm.matrix);k=i+1});cm.count=k;instDone(cm);WORLD.cracks2=cm}
  cover(6,360,new THREE.ConeGeometry(.2,1.2,4),M(0xffffff,{roughness:.3,emissive:0x501070,emissiveIntensity:.9}),(m,i,x,z)=>{const s=.6+R()*1.3;instSet(m,i,x,.5*s,z,s,s,s,R()*6,pick([0x8a2ad0,0xff3dd0,0x5a3aa8]))});
  }catch(e){console.error('deco2',e)}
  /* far mountains */
  {const N=48,mt=instMesh(new THREE.ConeGeometry(1,1,6),M(0xffffff),N);mt.castShadow=false;for(let i=0;i<N;i++){const a=i/N*TAU,r=WORLD_R+9+R()*5,s=10+R()*14;instSet(mt,i,Math.cos(a)*r,s*.5,Math.sin(a)*r,s,s*(1.3+R()*1.2),s,R()*6,0x1c2036)}instDone(mt)}
}

const ATMO=[
  {bg:0x8fb4d8,sky:0xdfeeff,gr:0x6a7a5a,hi:1.0,sun:1.0,sc:0xfff0d0,rc:0x9ab8ff,ri:.4,fd:.0046},
  {bg:0x93b8d4,sky:0xdfeeff,gr:0x6a7a5a,hi:1.0,sun:1.0,sc:0xfff0d0,rc:0x9ab8ff,ri:.4,fd:.0050},
  {bg:0x56627a,sky:0xa8b8d8,gr:0x3a4050,hi:.88,sun:.75,sc:0xc0ccff,rc:0x6a8aff,ri:.55,fd:.0078},
  {bg:0x7a4636,sky:0xffb89a,gr:0x4a2a24,hi:.92,sun:.85,sc:0xffb480,rc:0xff6a3a,ri:.6,fd:.0068},
  {bg:0x2c2a5a,sky:0x9a8aff,gr:0x20204a,hi:.92,sun:.7,sc:0xd0c0ff,rc:0x8a6aff,ri:.65,fd:.0062},
  {bg:0x3a4658,sky:0xaab8d0,gr:0x2a3446,hi:.86,sun:.66,sc:0xcfe0ff,rc:0xffe27a,ri:.7,fd:.0068},
  {bg:0x1c1030,sky:0x8a5aaa,gr:0x180e2c,hi:.8,sun:.55,sc:0xd0a0ff,rc:0xff5ad8,ri:.8,fd:.0074}
];
const _ac={bg:new THREE.Color(0x8fb4d8),sky:new THREE.Color(0xdfeeff),gr:new THREE.Color(0x6a7a5a),sc:new THREE.Color(0xfff0d0),rc:new THREE.Color(0x9ab8ff),hi:1,sun:1,ri:.4,fd:.0046},_ct=new THREE.Color();
const _nb=new THREE.Color(),_ns=new THREE.Color(),_ng=new THREE.Color(),_nsc=new THREE.Color(),_nrc=new THREE.Color();
function updateAtmo(dt,zi){
  const a=ATMO[zi],k=1-Math.exp(-dt*1.5);
  _ct.set(a.bg);_ac.bg.lerp(_ct,k);_ct.set(a.sky);_ac.sky.lerp(_ct,k);_ct.set(a.gr);_ac.gr.lerp(_ct,k);_ct.set(a.sc);_ac.sc.lerp(_ct,k);_ct.set(a.rc);_ac.rc.lerp(_ct,k);
  _ac.hi+=(a.hi-_ac.hi)*k;_ac.sun+=(a.sun-_ac.sun)*k;_ac.ri+=(a.ri-_ac.ri)*k;_ac.fd+=(a.fd-_ac.fd)*k;
  const nk=nightK();   // 0 = day .. 1 = deep night, follows the shared 16 min clock
  _nb.copy(_ac.bg).lerp(_ct.set(0x0b1233),nk*.8);_ns.copy(_ac.sky).lerp(_ct.set(0x34478c),nk*.8);_ng.copy(_ac.gr).lerp(_ct.set(0x0e1530),nk*.7);
  _nsc.copy(_ac.sc).lerp(_ct.set(0x93a8ff),nk*.85);_nrc.copy(_ac.rc).lerp(_ct.set(0xb4c4ff),nk*.5);
  if(scene.background&&scene.background.copy)scene.background.copy(_nb);
  if(scene.fog){if(scene.fog.color&&scene.fog.color.copy)scene.fog.color.copy(_nb);scene.fog.density=_ac.fd*(1+.22*nk)}
  hemi.color.copy(_ns);hemi.groundColor.copy(_ng);hemi.intensity=_ac.hi*(1-.5*nk);sun.intensity=_ac.sun*(1-.7*nk);sun.color.copy(_nsc);rim.color.copy(_nrc);rim.intensity=_ac.ri*(1+.5*nk);
}
function updateWorldFx(dt,t){
  if(WORLD.emblem)WORLD.emblem.rotation.z=t*.05;
  for(const w of WORLD.wisps){w.s.position.set(w.x+Math.sin(t*.6+w.ph)*1.2,1.3+Math.sin(t*1.3+w.ph)*.5,w.z+Math.cos(t*.5+w.ph)*1.2);w.s.material.opacity=.4+Math.sin(t*2+w.ph)*.2}
  for(const p of WORLD.pulse)p.s.material.opacity=p.b*(.75+.25*Math.sin(t*2.2+p.ph));
  for(const g of (WORLD.gems||[]))g.rotation.y=t*1.2;
  for(const w of WORLD.ponds)w.material.emissiveIntensity=.5+Math.sin(t*1.5)*.12;
  if(WORLD.cracks)WORLD.cracks.material.opacity=.5+Math.sin(t*2.4)*.15;
  if(WORLD.cracks2)WORLD.cracks2.material.opacity=.5+Math.sin(t*2.0+1)*.18;
}
