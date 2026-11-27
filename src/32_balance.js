/* ---------------- balance mode (setting save.balance, default off): low-end PC option, target 60 fps ----------------
   The world is built exactly as before: same random sequence, same obstacles, same gather nodes.
   Balance mode only changes how it is drawn, in four steps (all run once after buildWorld):
   1. flowers are not created (their random numbers are still drawn, so the layout stays identical);
   2. static props (houses, gates, stalls, torches, fountain, rocks...) are merged per material and 40-unit cell;
      NPC models, glow sprites and the animated gems/emblem stay as they are;
   3. instanced decor is split into 20-unit chunks; gather nodes are re-pointed to the chunk holding their instance;
   4. every frame, a chunk or prop is drawn only if its box is inside the view frustum and within BAL.rd of the camera.
      Shadow casters just off-screen are still drawn, so shadows near the view do not pop.
   Post-processing (bloom, grade) is off and the shadow map is 1024 instead of 1536; pixel ratio is capped at 1. */
const BAL={rd:70,gd:42,nd:26,sn:2,keep:20,cell:24,dcell:10,mcell:40,macro:96,big:150,pad:.5};   // rd: far limit · gd: grass limit (blades shrink away) · nd: mob outlines hidden beyond · sn: shadow map refreshed every sn frames
/* adaptive quality: the game watches its own frame time and steps between 4 levels so a slow PC settles near 60 fps */
const BQ={lv:0,acc:0,n:0,upAt:0,downAt:0,f:0,hold:[0,0,0,0],
  L:[{pr:1,rd:70,gd:42,nd:26,sn:2},{pr:1,rd:58,gd:34,nd:22,sn:2},{pr:.85,rd:50,gd:30,nd:20,sn:3},{pr:.72,rd:42,gd:26,nd:16,sn:3}]};
function balApply(lv){
  BQ.lv=lv;const q=BQ.L[lv];BAL.rd=q.rd;BAL.gd=q.gd;BAL.nd=q.nd;BAL.sn=q.sn;
  GRASS_U.uFade.value.set(q.gd-10,q.gd);
  if(Math.abs(renderer.getPixelRatio()-q.pr)>.01){renderer.setPixelRatio(q.pr);try{resize()}catch(e){}}
}
function balAdapt(ms){
  if(!balOn()||G.mode!=='play'||document.hidden||ms>400)return;   // hitches (tab switch, loading) are not a quality signal
  BQ.acc+=Math.min(ms,100);if(++BQ.n<(ms>60?20:60))return;
  const avg=BQ.acc/BQ.n,now=performance.now();BQ.acc=0;BQ.n=0;
  if(avg>19.5&&BQ.lv<BQ.L.length-1){if(now-BQ.upAt<12000)BQ.hold[BQ.lv]=now+60000;BQ.downAt=now;balApply(BQ.lv+1)}   // slower than ~51 fps: lighten
  else if(avg<17.4&&BQ.lv>0&&now>BQ.hold[BQ.lv-1]&&now-BQ.downAt>10000){BQ.upAt=now;balApply(BQ.lv-1)}              // comfortably 60: try heavier again
}
const _balFr=new THREE.Frustum(),_balPM=new THREE.Matrix4(),_balBox=new THREE.Box3(),_balSph=new THREE.Sphere(),_balV=new THREE.Vector3();
function balOn(){return !!save.balance}
/* renderer-level settings that follow the balance flag (no reload needed) */
function applyGfxMode(){
  const on=balOn();
  renderer.setPixelRatio(on?BQ.L[BQ.lv].pr:Math.min(window.devicePixelRatio||1,IS_TOUCH?1.5:1.75));
  const want=on?1024:1536;
  if(sun.shadow.mapSize.x!==want){sun.shadow.mapSize.set(want,want);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  const ty=on?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;       // hard-edged PCF is clearly cheaper on integrated GPUs
  if(renderer.shadowMap.type!==ty){renderer.shadowMap.type=ty;scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>{m.needsUpdate=true})})}
  renderer.shadowMap.autoUpdate=!on;                            // balance mode refreshes the shadow map every BAL.sn frames (see balCull)
  if(on)balApply(BQ.lv);else{BAL.rd=70;GRASS_U.uFade.value.set(1e5,1e5+1)}
  try{resize()}catch(e){}
}
/* called at the end of buildWorld */
function balFinish(){
  WORLD.cull=null;
  if(!balOn())return;
  worldG.updateMatrixWorld(true);
  for(const n of WORLD.npcs)n.model.g.traverse(c=>{if(c.isMesh)c.castShadow=false});   // vendor NPCs keep their model, only the shadow pass skips them
  renderer.shadowMap.needsUpdate=true;
  balSplitGround();
  balMergeStatic();
  balChunkify();
  balBuildCull();
}
/* the ground is one 48k-vertex mesh; split its triangles into 60-unit tiles (same vertices, colours and triangles) so far tiles can be culled */
function balSplitGround(){
  const gm=worldG.children.find(o=>o.isMesh&&!o.isInstancedMesh&&o.geometry.index&&o.geometry.attributes.color&&o.geometry.attributes.position.count>40000);
  if(!gm)return;
  const g=gm.geometry,P=g.attributes.position.array,I=g.index.array,T=60,tiles=new Map();
  const size=(WORLD_R+14)*2;
  for(let t=0;t<I.length;t+=3){
    const a=I[t],b=I[t+1],c=I[t+2],x=(P[a*3]+P[b*3]+P[c*3])/3,z=(P[a*3+2]+P[b*3+2]+P[c*3+2])/3;
    const k=Math.floor((x+size/2)/T)+','+Math.floor((z+size/2)/T);
    let L=tiles.get(k);if(!L){L=[];tiles.set(k,L)}L.push(a,b,c);
  }
  const N=g.attributes.normal,U=g.attributes.uv,C=g.attributes.color;
  for(const L of tiles.values()){
    const remap=new Map(),vs=[];
    const idx=new Uint32Array(L.length);
    for(let q=0;q<L.length;q++){let v=remap.get(L[q]);if(v===undefined){v=vs.length;remap.set(L[q],v);vs.push(L[q])}idx[q]=v}
    const tg=new THREE.BufferGeometry(),n=vs.length;
    const pp=new Float32Array(n*3),nn=new Float32Array(n*3),uu=new Float32Array(n*2),cc=new Float32Array(n*3);
    vs.forEach((v,i)=>{pp.set(P.subarray(v*3,v*3+3),i*3);nn.set(N.array.subarray(v*3,v*3+3),i*3);uu.set(U.array.subarray(v*2,v*2+2),i*2);cc.set(C.array.subarray(v*3,v*3+3),i*3)});
    tg.setAttribute('position',new THREE.BufferAttribute(pp,3));tg.setAttribute('normal',new THREE.BufferAttribute(nn,3));
    tg.setAttribute('uv',new THREE.BufferAttribute(uu,2));tg.setAttribute('color',new THREE.BufferAttribute(cc,3));
    tg.setIndex(new THREE.BufferAttribute(idx,1));tg.computeBoundingSphere();tg.computeBoundingBox();
    const tm=new THREE.Mesh(tg,gm.material);tm.receiveShadow=gm.receiveShadow;tm.castShadow=false;
    worldG.add(tm);
  }
  worldG.remove(gm);
}
/* concatenate non-indexed geometries into one (position, normal, uv, colour; missing attributes are filled) */
function balConcat(geos){
  let n=0;for(const g of geos)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),C=new Float32Array(n*3);
  const hasN=geos.every(g=>g.attributes.normal),hasC=geos.some(g=>g.attributes.color);
  let o=0;
  for(const g of geos){
    const p=g.attributes.position,c=p.count;
    P.set(p.array.subarray(0,c*3),o*3);
    if(hasN)N.set(g.attributes.normal.array.subarray(0,c*3),o*3);
    const u=g.attributes.uv;if(u)U.set(u.array.subarray(0,c*2),o*2);
    const col=g.attributes.color;
    for(let i=0;i<c;i++){const k=(o+i)*3;if(col){C[k]=col.array[i*col.itemSize];C[k+1]=col.array[i*col.itemSize+1];C[k+2]=col.array[i*col.itemSize+2]}else{C[k]=C[k+1]=C[k+2]=1}}
    o+=c;
  }
  const out=new THREE.BufferGeometry();
  out.setAttribute('position',new THREE.BufferAttribute(P,3));
  if(hasN)out.setAttribute('normal',new THREE.BufferAttribute(N,3));else out.computeVertexNormals();
  out.setAttribute('uv',new THREE.BufferAttribute(U,2));
  if(hasC)out.setAttribute('color',new THREE.BufferAttribute(C,3));
  out.computeBoundingSphere();out.computeBoundingBox();
  return out;
}
/* merge static meshes of top-level objects per (cell, material, shadow flags); the merged result replaces them */
function balMergeStatic(){
  const npc=new Set(WORLD.npcs.map(n=>n.model.g)),keep=new Set([WORLD.emblem].concat(WORLD.gems||[]));
  const buckets=new Map();
  for(const o of worldG.children.slice()){
    if(o.isInstancedMesh||o.isSprite||npc.has(o)||keep.has(o))continue;
    if(!(o.isMesh||o.isGroup))continue;
    _balBox.setFromObject(o);if(_balBox.isEmpty())continue;
    _balBox.getSize(_balV);if(_balV.length()*.5>BAL.big)continue;      // the ground and other huge meshes stay as they are
    _balBox.getCenter(_balV);const ck=Math.floor(_balV.x/BAL.mcell)+','+Math.floor(_balV.z/BAL.mcell);
    const meshes=[];o.traverse(c=>{if(c.isMesh&&!c.isInstancedMesh&&!c.isSprite&&!keep.has(c))meshes.push(c)});
    for(const m of meshes){
      const key=ck+'|'+(m.renderOrder||0)+'|'+m.material.uuid+'|'+(m.castShadow?1:0)+(m.receiveShadow?1:0);
      let b=buckets.get(key);if(!b){b={mat:m.material,ro:m.renderOrder||0,cs:m.castShadow,rs:m.receiveShadow,geos:[]};buckets.set(key,b)}
      const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);b.geos.push(g);
      if(m.parent)m.parent.remove(m);
    }
  }
  for(const b of buckets.values()){
    const mesh=new THREE.Mesh(balConcat(b.geos),b.mat);
    mesh.castShadow=b.cs;mesh.receiveShadow=b.rs;mesh.frustumCulled=false;mesh.renderOrder=b.ro;
    worldG.add(mesh);
  }
}
/* split every instanced mesh of the world into cell-sized chunks; gather nodes are re-pointed to the new chunks */
function balChunkify(){
  const remap=new Map(),macros=new Map(),MC=BAL.macro;
  for(const m of worldG.children.slice()){
    if(!m.isInstancedMesh)continue;
    const n=m.count,A=m.instanceMatrix.array,C=m.instanceColor?m.instanceColor.array:null,g=m.geometry;
    const cell=n>1000?BAL.dcell:BAL.cell;     // dense grass: smaller chunks so the view frustum cuts more
    if(!g.boundingSphere)g.computeBoundingSphere();
    const gr=g.boundingSphere?g.boundingSphere.radius+g.boundingSphere.center.length():2;
    const buckets=new Map();
    for(let i=0;i<n;i++){const k=Math.floor(A[i*16+12]/cell)+','+Math.floor(A[i*16+14]/cell);let b=buckets.get(k);if(!b){b=[];buckets.set(k,b)}b.push(i)}
    const map=new Array(n);
    for(const idx of buckets.values()){
      const cm=new THREE.InstancedMesh(g,m.material,idx.length);
      cm.castShadow=false;cm.receiveShadow=m.receiveShadow;cm.frustumCulled=false;   // decor is not a shadow caster in balance mode
      if(C)cm.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(idx.length*3),3);
      let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,pd=0;
      for(let q=0;q<idx.length;q++){
        const oi=idx[q];cm.instanceMatrix.array.set(A.subarray(oi*16,oi*16+16),q*16);
        if(C)cm.instanceColor.array.set(C.subarray(oi*3,oi*3+3),q*3);
        map[oi]=[cm,q];const x=A[oi*16+12],z=A[oi*16+14];
        x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);
        pd=Math.max(pd,gr*Math.max(Math.hypot(A[oi*16],A[oi*16+1],A[oi*16+2]),Math.hypot(A[oi*16+4],A[oi*16+5],A[oi*16+6]),Math.hypot(A[oi*16+8],A[oi*16+9],A[oi*16+10])));
      }
      cm.instanceMatrix.needsUpdate=true;if(C)cm.instanceColor.needsUpdate=true;
      /* box = footprint of the chunk's instances, grown by the largest instance radius (+pad); tall enough for props */
      const p=pd+BAL.pad;
      /* draw-distance class: 1 = grass (fades out by BAL.gd), 2 = small props (BAL.gd+16), 0 = trees, houses and other big things (BAL.rd) */
      const kind=Object.values(GRASSM).includes(m.material)?1:pd<1.6?2:0;
      const ccx=(x0+x1)/2,ccz=(z0+z1)/2,mk=Math.floor(ccx/MC)+','+Math.floor(ccz/MC);
      let mg=macros.get(mk);if(!mg){mg=new THREE.Group();mg.userData.balKids=[];macros.set(mk,mg);worldG.add(mg)}
      mg.add(cm);mg.userData.balKids.push({o:cm,x:ccx,y:0,z:ccz,r:Math.hypot((x1-x0)/2+p,(z1-z0)/2+p),bx:[x0-p,x1+p,z0-p,z1+p,2*p],sh:false,k:kind});
    }
    remap.set(m,map);worldG.remove(m);
  }
  /* chunks never move: their group skips the per-frame matrix walk, and a hidden group skips its whole subtree in the render list */
  for(const mg of macros.values()){mg.matrixAutoUpdate=false;mg.updateMatrixWorld=function(){}}
  /* gather nodes must point at the chunk that now holds their instance */
  for(const n of WORLD.nodes)for(const p of n.parts){const mp=remap.get(p[0]);if(mp){const t=mp[p[1]];p[0]=t[0];p[1]=t[1]}}
}
/* cull list: every top-level object gets a box (sprites get a sphere); huge objects such as the ground are never culled */
function balBuildCull(){
  const list=[];
  for(const o of worldG.children.slice()){
    if(o.userData.balKids){
      let a=1e9,b=-1e9,c=1e9,d=-1e9,h=0;for(const k of o.userData.balKids){a=Math.min(a,k.bx[0]);b=Math.max(b,k.bx[1]);c=Math.min(c,k.bx[2]);d=Math.max(d,k.bx[3]);h=Math.max(h,k.bx[4])}
      list.push({o,x:(a+b)/2,y:0,z:(c+d)/2,r:Math.hypot(b-a,d-c)/2,bx:[a,b,c,d,h],sh:false,k:0,kids:o.userData.balKids});continue}
    if(o.isSprite){list.push({o,x:o.position.x,y:o.position.y,z:o.position.z,r:Math.max(o.scale.x,o.scale.y)*.71,sh:false});continue}
    _balBox.setFromObject(o);if(_balBox.isEmpty())continue;
    _balBox.getSize(_balV);if(_balV.length()*.5>BAL.big)continue;
    const b=_balBox,c=b.getCenter(_balV);
    list.push({o,x:c.x,y:c.y,z:c.z,r:Math.hypot(b.max.x-b.min.x,b.max.z-b.min.z)*.5,bx:[b.min.x,b.max.x,b.min.z,b.max.z,b.max.y],sh:true});
  }
  WORLD.cull=list;
}
function balTest(e,cx,cz){
  const dx=e.x-cx,dz=e.z-cz,d=Math.sqrt(dx*dx+dz*dz),lim=(e.k===1?BAL.gd:e.k===2?BAL.gd+16:BAL.rd)+e.r;
  let v;
  if(d>lim)v=false;
  else if(e.bx){_balBox.min.set(e.bx[0],0,e.bx[2]);_balBox.max.set(e.bx[1],e.bx[4],e.bx[3]);v=_balFr.intersectsBox(_balBox)}
  else{_balSph.center.set(e.x,e.y,e.z);_balSph.radius=e.r+BAL.pad;v=_balFr.intersectsSphere(_balSph)}
  if(!v&&e.sh&&d<=BAL.keep+e.r)v=true;
  return v;
}
/* per-frame visibility: view frustum and distance from the camera (shadow casters off-screen within BAL.keep are kept) */
function balCull(){
  const L=WORLD.cull;if(!L)return;
  camera.updateMatrixWorld();
  _balPM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_balFr.setFromProjectionMatrix(_balPM);
  const cx=camera.position.x,cz=camera.position.z;
  for(let i=0;i<L.length;i++){
    const e=L[i],v=balTest(e,cx,cz);
    if(e.o.visible!==v)e.o.visible=v;
    if(v&&e.kids){const K=e.kids;for(let j=0;j<K.length;j++){const q=K[j],w=balTest(q,cx,cz);if(q.o.visible!==w)q.o.visible=w}}
  }
  balMobs(cx,cz);
  if(++BQ.f%BAL.sn===0)renderer.shadowMap.needsUpdate=true;
}
/* far mobs lose their outline shell (a third of their draw calls, invisible at that distance) */
function balMobs(cx,cz){
  const lim=BAL.nd*BAL.nd;
  for(const m of MOBS){
    if(m.dead||!m.m)continue;
    const far=(m.x-P.x)*(m.x-P.x)+(m.z-P.z)*(m.z-P.z)>lim;
    if(m._far===far)continue;m._far=far;
    if(!m._ol){m._ol=[];m.m.g.traverse(o=>{if(o.isMesh&&o.material===OL_MAT)m._ol.push(o)})}
    for(const o of m._ol)o.visible=!far;
  }
}
