/* ---------------- dungeons: portals in the world -> instanced arena (x≈1000): 3 waves + boss, contribution ranking, rune/weapon rewards ---------------- */
const DGP=[];   // world portals {kind:'portal',dg,name,x,z,g,ring,disc,label}
const DGH={el:null,t:0,last:''};

function dgPortalPos(def){
  let a=def.pa,r=def.pr;
  for(let i=0;i<60;i++){
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(!blocked(x,z,5))return{x,z};
    a+=.11;r+=(i%2?1:-1)*(1+i*.15);
  }
  return{x:Math.cos(def.pa)*def.pr,z:Math.sin(def.pa)*def.pr};
}
function dgBuildPortals(){
  try{
    for(const p of DGP){if(p.g&&p.g.parent)p.g.parent.remove(p.g);if(p.label&&p.label.remove)p.label.remove()}
    DGP.length=0;
    for(const id of DGK){
      const def=DGDEF[id],pos=dgPortalPos(def),g=grp(pos.x,0,pos.z,worldG);g.rotation.y=Math.atan2(-pos.x,-pos.z);
      const rock=M(def.rock||(id==='meadow'?0x6e6a5a:id==='crystal'?0x4e4a6e:0x56606e)),dark=M(0x1a1a22);
      // cave mouth: a horseshoe of boulders around a dark opening, glowing rim + inner glow
      BX(8,.3,4,M(0x5a5648),0,.1,.6,g);
      const rocks=[[-3.6,0,1.9,3.4],[-3,0,-.2,3.8],[-1.7,0,-1.2,4.6],[0,0,-1.8,5.2],[1.7,0,-1.2,4.6],[3,0,-.2,3.8],[3.6,0,1.9,3.4],[-2.2,3.6,-1,2.4],[0,4.6,-1.4,2.8],[2.2,3.6,-1,2.4]];
      for(const[x,y,z,sc]of rocks){const r=mesh(new THREE.DodecahedronGeometry(sc*.55,0),rock,x,y+sc*.42,z,g);r.scale.set(1,.9+((x*7|0)%3)*.12,1);r.rotation.y=x}
      {const th=g.rotation.y,c=Math.cos(th),sn=Math.sin(th);for(const[x,y,z,sc]of rocks)if(y===0)addObst(pos.x+x*c+z*sn,pos.z-x*sn+z*c,sc*.5)}   // boulders block movement
      const hole=mesh(new THREE.CircleGeometry(1.9,20),dark,0,1.9,.15,g,false);hole.scale.set(1,1.15,1);
      const ring=mesh(new THREE.TorusGeometry(2.05,.16,6,24),EM(def.ring,1.7),0,1.9,.2,g,false);ring.scale.set(1,1.15,1);
      const disc=mesh(new THREE.CircleGeometry(1.7,20),new THREE.MeshBasicMaterial({color:def.ring,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}),0,1.9,.3,g,false);disc.scale.set(1,1.15,1);
      for(const sx of[-1,1]){const t=glow(def.ring,2.2,.6);t.position.set(sx*2.5,2.6,1.2);g.add(t)}
      const gl=glow(def.ring,5,.35);gl.position.set(0,1.9,.8);g.add(gl);
      DGP.push({kind:'portal',dg:id,name:def.name+' 입장',x:pos.x,z:pos.z,g,ring,disc,label:makeLabel(def.name,'st')});
    }
    // town map signboard
    {const g=grp(0,0,-10,worldG);g.rotation.y=0;const wood=M(0x6b4a2b);
      for(const sx of[-1.6,1.6])CY(.14,.16,3.2,wood,sx,1.6,0,g,6);
      BX(4.2,2.4,.18,M(0x3a2f22),0,2.6,0,g);BX(3.8,2.0,.1,M(0xd8c79a),0,2.6,.12,g);
      const pin=EM(0xe5483a,1.2);for(const[x,y]of[[-1,2.9],[.4,2.3],[1.2,3.1]])SP(.12,pin,x,y,.2,g,6,5);
      BX(.8,.1,.1,M(0x7a5a3a),-1,2.4,.2,g);BX(1.2,.08,.08,M(0x7a5a3a),.2,2.9,.2,g);
      const gl=glow(0xffd88a,2.2,.5);gl.position.set(0,3.6,.6);g.add(gl);addObst(0,-10,1.6);
      DGP.push({kind:'map',name:'마을 지도',x:0,z:-7.6,g,disc:{material:{opacity:0}},label:makeLabel('마을 지도','st')})}
  }catch(e){console.error('portals',e)}
}

/* ---------- arena: a dark cave dungeon laid out as a forward path (z decreases): 4 rooms joined by corridors, then the boss hall ---------- */
const DGL={rw:17,cw:5,rl:46,gap:22,pitch:68,zt0:6,hallR:30};
const dgZT=i=>DGL.zt0-i*DGL.pitch,dgZB=i=>dgZT(i)-DGL.rl,dgGate=i=>dgZB(i)-6;
const DG_HALL_Z=dgZB(3)-DGL.gap-26;   // hall centre
function dgBuildShapes(){
  const s=[],ins=1.3;
  for(let i=0;i<4;i++){s.push({x0:-DGL.rw+ins,x1:DGL.rw-ins,z0:dgZB(i)+ins,z1:dgZT(i)-ins});
    s.push({x0:-DGL.cw+ins,x1:DGL.cw-ins,z0:(i<3?dgZT(i+1):dgZB(3)-DGL.gap)-ins-1,z1:dgZB(i)+ins+1})}   // overlap both rooms: no dead strip at the doorways
  s.push({c:1,x:0,z:DG_HALL_Z,r:DGL.hallR-ins});
  return s;
}
/* keep an entity inside the walkable cave and behind the closed gate */
function dgClampXZ(e){
  const sh=DG.shapes||(DG.shapes=dgBuildShapes());let lx=e.x-DG.cx,lz=e.z-DG.cz,bx=lx,bz=lz,bd=1e18,inside=false;
  for(const s of sh){
    let px,pz;
    if(s.c){const dx=lx-s.x,dz=lz-s.z,d=Math.hypot(dx,dz)||.001;if(d<=s.r){inside=true;break}px=s.x+dx/d*s.r;pz=s.z+dz/d*s.r}
    else{px=Math.max(s.x0,Math.min(s.x1,lx));pz=Math.max(s.z0,Math.min(s.z1,lz));if(px===lx&&pz===lz){inside=true;break}}
    const d=(px-lx)*(px-lx)+(pz-lz)*(pz-lz);if(d<bd){bd=d;bx=px;bz=pz}
  }
  if(!inside){lx=bx;lz=bz}
  const lim=dgLimit();if(lz<lim)lz=lim;
  e.x=DG.cx+lx;e.z=DG.cz+lz;
}
function dgClampPt(x,z){const o={x,z};dgClampXZ(o);return o}
/* furthest z (most negative) that may be reached; DG.wave = index of the room that is currently open */
function dgLimit(){return DG.wave>=4?-1e9:dgGate(DG.wave)+1.2}
function dgRoomTrigger(idx){return idx>=4?DG_HALL_Z+DGL.hallR-4:dgZT(idx)-5}
function dgRespawnZ(){return DG.wave>=4?DG_HALL_Z+DGL.hallR-3:dgZT(Math.max(0,DG.wave))-3}

function dgBuildArena(){
  if(DG.arena)return DG.arena;
  const g=new THREE.Group();g.position.set(DG.cx,0,DG.cz);g.visible=false;scene.add(g);
  const std=c=>new THREE.MeshStandardMaterial({color:c,roughness:.95,flatShading:true});
  const gm=std(0x2a2a30),wm=std(0x3a3a44),pm=std(0x4a4a56),rm=new THREE.MeshBasicMaterial({color:0x9aff7a,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide});
  const A={g,gm,wm,pm,rm,th:{},gates:[],arrows:null};
  const flat=(geo,mat,x,z)=>{const m=new THREE.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.position.set(x,0,z);m.receiveShadow=true;g.add(m);return m};
  const segs=[];const box=(w,h,d,x,z)=>{if(w<d)segs.push([x,z,d,0]);else segs.push([x,z,w,Math.PI/2])};
  const {rw,cw,rl,gap}=DGL,WH=8;
  for(let i=0;i<4;i++){
    const zt=dgZT(i),zb=dgZB(i),zm=(zt+zb)/2;
    flat(new THREE.PlaneGeometry(rw*2,rl),gm,0,zm);
    box(3,WH,rl+3,-(rw+1.5),zm);box(3,WH,rl+3,rw+1.5,zm);
    const sideW=rw-cw;
    if(i===0)box(rw*2+6,WH,3,0,zt+1.5);else for(const sx of[-1,1])box(sideW,WH,3,sx*(cw+sideW/2),zt+1.5);
    for(const sx of[-1,1])box(sideW,WH,3,sx*(cw+sideW/2),zb-1.5);
    // corridor
    const cz0=zb,cz1=i<3?dgZT(i+1):zb-gap,cm=(cz0+cz1)/2,cl=Math.abs(cz0-cz1);
    flat(new THREE.PlaneGeometry(cw*2,cl),gm,0,cm);
    for(const sx of[-1,1])box(3,WH,cl,sx*(cw+1.5),cm);
    // gate barrier
    const gz=dgGate(i),gt=new THREE.Group();gt.position.set(0,0,gz);
    const bar=new THREE.Mesh(new THREE.PlaneGeometry(cw*2,7),new THREE.MeshBasicMaterial({color:0x9aff7a,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));bar.position.y=3.5;gt.add(bar);
    for(const sx of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,7.5,6),pm);p.position.set(sx*cw,3.7,0);gt.add(p)}
    g.add(gt);A.gates.push({g:gt,bar});
    // cover rocks (collide)
    for(const sx of[-1,1]){const x=sx*7,z=zm+(sx<0?6:-6);const r=new THREE.Mesh(new THREE.CylinderGeometry(1.5,2.1,3,7),pm);r.position.set(x,1.5,z);r.castShadow=true;g.add(r);addObst(DG.cx+x,DG.cz+z,2.2)}
  }
  // boss hall
  const hz=DG_HALL_Z,hr=DGL.hallR;
  const hall=new THREE.Mesh(new THREE.CircleGeometry(hr,40),gm);hall.rotation.x=-Math.PI/2;hall.position.set(0,0,hz);hall.receiveShadow=true;g.add(hall);
  for(let i=0;i<20;i++){const a=i/20*TAU;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a))-Math.PI/2)<.5)continue;
    segs.push([Math.cos(a)*(hr+1.5),hz+Math.sin(a)*(hr+1.5),2*Math.PI*(hr+1.5)/20+.8,-a])}
  for(const rr of[.62,.3]){const r=new THREE.Mesh(new THREE.RingGeometry(hr*rr,hr*rr+.6,64),rm);r.rotation.x=-Math.PI/2;r.position.set(0,.06,hz);g.add(r)}
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(5,5.6,.35,24),pm);dais.position.set(0,.17,hz);g.add(dais);
  // ---- cave rock walls (instanced, irregular), flagstones, rubble, ruined pillars ----
  const R0=mulberry(4242),q=(a,b)=>a+R0()*(b-a),dm=new THREE.Object3D(),col=new THREE.Color();
  const inst=(geo,mat,items,shade)=>{if(!THREE.InstancedMesh||!items.length)return null;const im=new THREE.InstancedMesh(geo,mat,items.length);
    items.forEach((it,i)=>{dm.position.set(it[0],it[1],it[2]);dm.rotation.set(it[3],it[4],it[5]);dm.scale.set(it[6],it[7],it[8]);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);
      if(im.setColorAt&&col.setRGB){const v=shade?q(shade[0],shade[1]):1;col.setRGB(v,v,v*1.04);im.setColorAt(i,col)}});
    im.castShadow=false;im.receiveShadow=true;im.frustumCulled=false;g.add(im);return im};
  const rk=[];
  for(const[sx,sz,len,th]of segs){const dx=Math.sin(th),dz=Math.cos(th),n=Math.ceil(len/1.9);
    for(let k=0;k<n;k++){const t=((k+.5)/n-.5)*len,sp=R0()<.28;
      for(let L=0;L<2;L++){const h=sp?q(8,13):q(3.5,7.5),w=q(1.5,2.5);
        rk.push([sx+dx*t+dz*q(-.9,.9)*(L?1.4:.5),h*.5-.7,sz+dz*t-dx*q(-.9,.9)*(L?1.4:.5),q(-.25,.25),q(0,6.3),q(-.25,.25),w,h*.5,q(1.4,2.3)])}}}
  inst(new THREE.IcosahedronGeometry(1,1),wm,rk,[.45,1.15]);
  const tm=std(0x3c3c46);A.tm=tm;const ft=[];
  const tiles=(x0,x1,z0,z1)=>{for(let x=x0;x<x1;x+=2.55)for(let z=z0;z<z1;z+=2.55){if(R0()<.12)continue;ft.push([x+q(-.15,.15),q(-.04,.1),z+q(-.15,.15),0,q(-.12,.12),0,q(1.05,1.22),q(.5,1.3),q(1.05,1.22)])}};
  for(let i=0;i<4;i++){tiles(-rw+1.5,rw-1.5,dgZB(i)+1.5,dgZT(i)-1.5);tiles(-cw+1,cw-1,i<3?dgZT(i+1):dgZB(3)-gap,dgZB(i)+1)}
  tiles(-hr+3,hr-3,hz-hr+3,hz+hr-3);
  const ftm=ft.filter(it=>it[0]*it[0]+(it[2]-hz)*(it[2]-hz)<1e9);
  inst(new THREE.BoxGeometry(2,.22,2),tm,ftm,[.55,1.2]);
  const rb=[];for(let i=0;i<4;i++)for(let k=0;k<26;k++)rb.push([q(-rw+2,rw-2),q(.1,.4),dgZT(i)-q(2,rl-2),q(0,3),q(0,3),0,q(.25,.8),q(.2,.6),q(.25,.8)]);
  for(let k=0;k<50;k++){const a=q(0,TAU),r=q(3,hr-3);rb.push([Math.cos(a)*r,q(.1,.4),hz+Math.sin(a)*r,q(0,3),q(0,3),0,q(.25,.9),q(.2,.6),q(.25,.9)])}
  inst(new THREE.DodecahedronGeometry(1,0),wm,rb,[.5,1.1]);
  // ruined pillars + fallen drums
  const pil=(x,z)=>{const h=q(2,7),c=new THREE.Mesh(new THREE.CylinderGeometry(.8,.95,h,8),pm);c.position.set(x,h/2,z);c.castShadow=true;g.add(c);
    const cap=new THREE.Mesh(new THREE.DodecahedronGeometry(1.0,0),pm);cap.position.set(x,h,z);cap.scale.set(1,.5,1);g.add(cap);addObst(DG.cx+x,DG.cz+z,1.2);
    const dr=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,1.2,8),pm);dr.position.set(x+q(1.2,2.4),.6,z+q(-1,1));dr.rotation.z=q(.6,1.5);g.add(dr)};
  for(let i=0;i<4;i++)for(const sx of[-1,1]){pil(sx*(rw-4),dgZT(i)-q(12,18));pil(sx*(rw-4),dgZT(i)-q(30,38))}
  for(let i=0;i<6;i++){const a=i/6*TAU+.5;if(Math.sin(a)>.7)continue;pil(Math.cos(a)*(hr-6),hz+Math.sin(a)*(hr-6))}
  // drifting dust motes
  {const n=240,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=q(-rw,rw);pos[i*3+1]=q(.5,7);pos[i*3+2]=q(dgZB(3)-gap-30,6)}
   const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.BufferAttribute(pos,3));
   const pt=new THREE.Points(ge,new THREE.PointsMaterial({color:0xcfd8ff,size:.16,transparent:true,opacity:.55,depthWrite:false}));pt.frustumCulled=false;g.add(pt);A.dust=pt}
  // torches along the walls
  const torch=(x,z)=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.28,1.3,6),pm);b.position.set(x,.65,z);g.add(b);const f=glow(0xffa23a,3.4,.8);f.position.set(x,1.8,z);g.add(f)};
  for(let i=0;i<4;i++){const zt=dgZT(i);for(const k of[10,36])for(const sx of[-1,1])torch(sx*(rw-1.3),zt-k)}
  for(let i=0;i<8;i++){const a=(i+.5)/8*TAU+Math.PI*.1;if(Math.sin(a)>.85)continue;torch(Math.cos(a)*(hr-2),hz+Math.sin(a)*(hr-2))}
  // themed props
  const R=mulberry(7731),rr=(a,b)=>a+R()*(b-a);
  const edge=(i,n,fn)=>{const zt=dgZT(i);for(let k=0;k<n;k++){const sx=R()<.5?-1:1;fn(sx*rr(rw-6,rw-1.6),zt-rr(3,rl-3))}};
  const hallPt=()=>{const a=rr(0,TAU),r=rr(hr-9,hr-2);return[Math.cos(a)*r,hz+Math.sin(a)*r]};
  const mk=n=>{const t=new THREE.Group();t.visible=false;g.add(t);A.th[n]=t;return t};
  { // meadow: mossy cave, glowing mushrooms, roots
    const t=mk('meadow'),cap=[0x4aff9a,0x6aff6a,0x9aff7a].map(c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.9,roughness:.5,flatShading:true})),stalk=std(0xcdbf9a),moss=std(0x3a5a2a);
    const shroom=(x,z)=>{const s=rr(.7,1.7);const st=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.26*s,1.3*s,6),stalk);st.position.set(x,.65*s,z);t.add(st);
      const c=new THREE.Mesh(new THREE.SphereGeometry(.8*s,8,5,0,TAU,0,Math.PI/2),cap[(x*7|0)%3<0?0:Math.abs(x*7|0)%3]);c.position.set(x,1.3*s,z);t.add(c)};
    for(let i=0;i<4;i++){edge(i,9,shroom);edge(i,4,(x,z)=>{const m=new THREE.Mesh(new THREE.DodecahedronGeometry(rr(.8,1.8),0),moss);m.position.set(x,.5,z);t.add(m)})}
    for(let i=0;i<16;i++){const[x,z]=hallPt();shroom(x,z)}
    for(let i=0;i<5;i++){const[x,z]=hallPt(),gl=glow(0x6aff9a,7,.4);gl.position.set(x,1.5,z);t.add(gl)}
    // hanging roots / vines along the walls
    const vm=std(0x2f5a2a);for(let i=0;i<4;i++)for(let k=0;k<12;k++){const sx=k%2?-1:1,h=rr(3,7),v=new THREE.Mesh(new THREE.CylinderGeometry(.08,.16,h,5),vm);v.position.set(sx*(rw-1.6),WH-h/2,dgZT(i)-rr(2,rl-2));v.rotation.z=sx*rr(.05,.25);t.add(v)}
    // ghostly will-o-wisps
    for(let i=0;i<10;i++){const[x,z]=hallPt(),gl=glow(0x9affd0,3,.7);gl.position.set(x,rr(1.5,3.5),z);t.add(gl)}}
  { // crystal cavern
    const t=mk('crystal'),cm=[0x6ee7ff,0xb07aff,0x7a9aff].map(c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.1,roughness:.3,flatShading:true}));
    const cr=(x,z)=>{const h=rr(2.5,7);const c=new THREE.Mesh(new THREE.ConeGeometry(rr(.5,1.1),h,5),cm[(Math.abs(x*3|0))%3]);c.position.set(x,h/2,z);c.rotation.z=rr(-.25,.25);c.rotation.x=rr(-.25,.25);t.add(c)};
    for(let i=0;i<4;i++){edge(i,12,cr);const[x,z]=[0,dgZT(i)-rl/2],gl=glow([0x6ee7ff,0xb07aff][i%2],9,.35);gl.position.set(x,1.6,z);t.add(gl)}
    for(let i=0;i<20;i++){const[x,z]=hallPt();cr(x,z)}
    // amethyst geodes embedded in the cave walls
    const am=new THREE.MeshStandardMaterial({color:0xa86bff,emissive:0x8a3cff,emissiveIntensity:1.3,roughness:.25,flatShading:true});
    for(let i=0;i<4;i++)for(let k=0;k<9;k++){const sx=k%2?-1:1,zc=dgZT(i)-rr(3,rl-3),y=rr(1.2,5.5);
      for(let j=0;j<4;j++){const h=rr(1,2.6),c=new THREE.Mesh(new THREE.ConeGeometry(rr(.25,.5),h,5),am);c.position.set(sx*(rw-1.2)-sx*h*.3,y+rr(-.5,.5),zc+rr(-.6,.6));c.rotation.z=sx*(Math.PI/2+rr(-.5,.5));c.rotation.x=rr(-.4,.4);t.add(c)}
      if(k%3===0){const gl=glow(0xb07aff,4.5,.6);gl.position.set(sx*(rw-2.4),y,zc);t.add(gl)}}
    for(let i=0;i<10;i++){const a=i/10*TAU,x=Math.cos(a)*(hr-1.5),z=hz+Math.sin(a)*(hr-1.5);if(Math.sin(a)>.8)continue;
      for(let j=0;j<5;j++){const h=rr(2,5),c=new THREE.Mesh(new THREE.ConeGeometry(rr(.4,.8),h,5),am);c.position.set(x-Math.cos(a)*h*.35+rr(-.6,.6),h*.45,z-Math.sin(a)*h*.35+rr(-.6,.6));c.rotation.set(rr(-.4,.4)+Math.sin(a)*.5,0,rr(-.4,.4)-Math.cos(a)*.5);t.add(c)}
      const gl=glow(0xb07aff,7,.5);gl.position.set(x*.92,2.5,hz+(z-hz)*.92);t.add(gl)}
    for(let i=0;i<4;i++){const[x,z]=hallPt(),gl=glow(0x6ee7ff,8,.4);gl.position.set(x,1.6,z);t.add(gl)}}
  { // storm: ruined cave, lightning spires, floating rubble
    const t=mk('storm'),sm=std(0x4a5262),tip=new THREE.MeshBasicMaterial({color:0xffe27a});
    const sp=(x,z)=>{const h=rr(5,9);const c=new THREE.Mesh(new THREE.ConeGeometry(.9,h,5),sm);c.position.set(x,h/2,z);t.add(c);const o=new THREE.Mesh(new THREE.SphereGeometry(.4,6,5),tip);o.position.set(x,h+.2,z);t.add(o);const gl=glow(0xffe27a,4,.6);gl.position.set(x,h+.2,z);t.add(gl)};
    for(let i=0;i<4;i++){edge(i,3,sp);edge(i,6,(x,z)=>{const r=new THREE.Mesh(new THREE.DodecahedronGeometry(rr(.7,1.6),0),sm);r.position.set(x,rr(.5,3),z);r.rotation.set(rr(0,3),rr(0,3),0);t.add(r)})}
    for(let i=0;i<6;i++){const[x,z]=hallPt();sp(x,z)}
    // lightning-scorched ground arcs + floating rubble + storm glows
    const sc=new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:.55,depthWrite:false});
    for(let i=0;i<4;i++)for(let k=0;k<5;k++){const x=rr(-rw+4,rw-4),z=dgZT(i)-rr(4,rl-4),m=new THREE.Mesh(new THREE.PlaneGeometry(.18,rr(3,7)),sc);m.rotation.x=-Math.PI/2;m.rotation.z=rr(0,3.1);m.position.set(x,.14,z);t.add(m)}
    A.fl=[];for(let i=0;i<34;i++){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(rr(.5,1.3),0),sm),zz=rr(dgZB(3)-gap-20,4);r.position.set(rr(-rw+3,rw-3),rr(3,7),zz);r.userData.b=r.position.y;r.userData.p=rr(0,6);t.add(r);A.fl.push(r)}
    for(let i=0;i<4;i++){const gl=glow(0xffe27a,10,.28);gl.position.set(0,5,dgZT(i)-rl/2);t.add(gl)}}
  // advance arrows (chevrons that point down the path)
  const ar=new THREE.Group();ar.visible=false;g.add(ar);A.arrows=ar;A.arrowMats=[];
  for(let k=0;k<4;k++){const m=new THREE.MeshBasicMaterial({color:0xfff2a0,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide});A.arrowMats.push(m);
    const c=new THREE.Mesh(new THREE.ConeGeometry(1.5,2.2,3),m);c.rotation.x=-Math.PI/2;c.position.set(0,.1,-k*5);ar.add(c)}
  DG.arena=A;return A;
}
/* ---------- boss ---------- */
function dgBossModel(){return DGDEF[DG.mkBk].model()}
function dgBossSetup(m,bk){
  const d=DGDEF[bk];m.bk=bk;m.bn=d.bn;m.at=d.at;
  m.scale=d.sc;m.r=d.r;m.spd=d.spd;m.fly=d.fly||0;m.dg=true;m.zid=d.zid;
  if(!m.ghost){m.dmg=mobDmg(m.ml)*d.dmgM;m.state='chase';m.cd=2;m.pi=0}
}
const DG_TEL={slam:.9,rush:.8,nova:.7,summon:.9,quake:.9,barrage:.7,bolts:.8};
function dgSpawnAdd(type,x,z,elite){
  const def=DGDEF[DG.id],m=makeMobObj(mobSeq++,type,x,z,def.ml+rndi(-1,1),!!elite,false,false);m.dg=true;m.zid=def.zid;return m;
}
function dgBossAI(m,dt,dx,dz,d){
  const bk=m.bk,def=DGDEF[bk],enr=m.hp<m.maxHp*.35,en=enr?1.2:1,cdm=enr?.7:1;
  if(m.pi===undefined){m.pi=0;m.state='chase';m.cd=2}
  if(m.state==='chase'){
    faceM(m,dx,dz,dt,6);
    const kp=def&&def.keep,keep=kp||3.4;
    if(d>keep+1.5){stepM(m,dx,dz,m.spd,dt);m.moving=true}else if(kp&&d<keep-2){stepM(m,-dx,-dz,m.spd*.8,dt);m.moving=true}
    if(m.cd<=0){
      const pat=def.pat[m.pi++%def.pat.length],tel=DG_TEL[pat];m.pat=pat;m.state='wind';m.warn=true;m.st=tel;m.cdx=dx;m.cdz=dz;
      emitEvent({t:'v',x:m.x,z:m.z,n:'growl'});
      const T=targets().filter(t=>!t.pull).slice(0,4);
      if(pat==='slam')emitEvent({t:'x',x:m.x,z:m.z,r:6.5,w:tel,d:m.dmg*1.5*en,c:def.ring});
      else if(pat==='barrage')for(const t of T)for(let i=0;i<3;i++)emitEvent({t:'x',x:t.x+(i?rnd(-5,5):0),z:t.z+(i?rnd(-5,5):0),r:2.8,w:tel+.4+i*.15,d:m.dmg*1.1*en,c:def.ring});
      else if(pat==='bolts')for(const t of T)for(let i=0;i<5;i++)emitEvent({t:'x',x:t.x+rnd(-7,7),z:t.z+rnd(-7,7),r:2.4,w:.9+i*.14,d:m.dmg*1.1*en,c:def.ring});
      else if(pat==='quake'){const n=Math.hypot(dx,dz)||1;for(let i=1;i<=5;i++)emitEvent({t:'x',x:m.x+dx/n*i*4,z:m.z+dz/n*i*4,r:3,w:.7+i*.18,d:m.dmg*1.2*en,c:def.ring})}
    }
  }else if(m.state==='wind'){
    m.st-=dt;faceM(m,dx,dz,dt,8);if(m.pat==='rush'){m.cdx=dx;m.cdz=dz}
    if(m.st<=0){
      m.warn=false;
      if(m.pat==='rush'){m.state='rush';m.st=.75}
      else{
        if(m.pat==='nova'){const n=enr?24:16,o=m.age;for(let i=0;i<n;i++){const a=i/n*TAU+o;emitEvent({t:'b',x:m.x+Math.sin(a),z:m.z+Math.cos(a),a,s:8.5,d:m.dmg*.7*en,c:def.ring,l:3})}}
        else if(m.pat==='summon'){let c=0;for(const q of MOBS)if(q.dg&&!q.dead&&q!==m)c++;if(c<8){const k=enr?3:2;for(let i=0;i<k;i++){const a=rnd(0,TAU),q=dgClampPt(m.x+Math.cos(a)*5,m.z+Math.sin(a)*5);dgSpawnAdd(pick(def.adds),q.x,q.z)}emitEvent({t:'f',x:m.x,z:m.z,c:def.ring,n:'whoosh'})}}
        m.state='rec';m.st=.9;m.cd=rnd(1.5,2.3)*cdm;
      }
    }
  }else if(m.state==='rush'){
    m.st-=dt;stepM(m,m.cdx,m.cdz,m.spd*4.6,dt);m.moving=true;faceM(m,m.cdx,m.cdz,dt,20);
    if(m.st<=0){m.state='rec';m.st=1.1;m.cd=rnd(1.5,2.3)*cdm}
  }else{m.st-=dt;if(m.st<=0)m.state='chase'}
}

/* ---------- entering / leaving ---------- */
function dgEnter(id){
  const def=DGDEF[id],A=dgBuildArena();
  if(GUIDE.id)guideStop();
  DG.on=true;DG.id=id;DG.zone=Object.assign({},ZONES[def.zid],{name:def.name,lo:def.need,hi:def.need+12});
  DG.ph='intro';DG.pt=3.5;DG.t=0;DG.wave=0;DG.sub=0;DG.dmg={};DG.deaths=0;DG.boss=null;DG.res=null;DG.begin=Date.now();DG.alive=0;DG.bh=100;DG.lastSt=0;
  DG.leader=NET.party?NET.party.leader:SES.name;
  DG.atmo=def.atmo;DG.shapes=null;
  A.gm.color.setHex(def.fl);A.wm.color.setHex(def.wl);A.pm.color.setHex(def.wl+0x101012);if(A.tm)A.tm.color.setHex(def.wl+0x08080a);A.rm.color.setHex(def.ring);
  dgTheme(A,id);for(const k in A.th)A.th[k].visible=(k===id);for(const gt of A.gates){gt.bar.material.color.setHex(def.ring);gt.g.visible=true}A.arrows.visible=false;
  A.g.visible=true;worldG.visible=false;
  if(THREE.PointLight&&!(typeof balOn==='function'&&balOn())){if(!DG.lamp){DG.lamp=new THREE.PointLight(0xffb878,1.5,36,1.5)}DG.lamp.position.set(P.x,6,P.z);scene.add(DG.lamp)}
  resetMobs();
  P.recall=0;P.x=DG.cx+rnd(-2,2);P.z=DG.cz+1;P.vx=P.vz=0;P.iframes=2;P.hp=S.maxHp;P.dead=false;cam.x=P.x;cam.z=P.z;
  const mini=$('mini');if(mini&&mini.style)mini.style.display='none';
  UI.zone=-1;DG.dm=null;dgHud(true);sfx('level');
  shockRing(P.x,P.z,5,def.ring,.6);
}
function dgLeave(msg){
  if(!DG.on)return;
  const id=DG.id;DG.on=false;DG.ph='idle';DG.boss=null;
  if(DG.arena)DG.arena.g.visible=false;worldG.visible=true;DG.atmo=null;if(DG.lamp&&DG.lamp.parent)scene.remove(DG.lamp);
  resetMobs();
  const pt=DGP.find(p=>p.dg===id);
  if(pt){const l=Math.hypot(pt.x,pt.z)||1;P.x=pt.x-pt.x/l*4.5;P.z=pt.z-pt.z/l*4.5}else{P.x=SPAWN.x;P.z=SPAWN.z}
  P.vx=P.vz=0;P.dead=false;P.hp=S.maxHp;P.iframes=1.5;UI.deadOn(false);cam.x=P.x;cam.z=P.z;
  const mini=$('mini');if(mini&&mini.style)mini.style.display='';
  UI.zone=-1;dgHud(false);
  if(NET.on&&NET.party&&isAuth()){NET.party.dgId=null;netSend('dg',{k:'out',id,msg:msg||''})}
  if(msg)UI.toast(msg,2600);
}
function dgFail(msg){
  if(!DG.on)return;
  if(NET.on&&NET.party&&isAuth()&&DG.ph!=='clear')netSend('dg',{k:'out',id:DG.id,msg:msg||''});
  DG.ph='fail';dgLeave(msg||'던전에서 퇴장했습니다');
}
function dgRespawn(){
  if(DG.ph!=='clear'){
    DG.deaths++;
    if(DG.deaths>DG.maxDeaths){P.dead=false;UI.deadOn(false);dgFail('부활 횟수를 모두 사용했습니다');return}
    UI.toast('부활했습니다 (남은 부활 '+(DG.maxDeaths-DG.deaths)+'회)',2000);
  }
  P.dead=false;P.x=DG.cx+rnd(-3,3);P.z=DG.cz+dgRespawnZ();P.vx=P.vz=0;P.hp=S.maxHp;P.iframes=2.5;UI.deadOn(false);cam.x=P.x;cam.z=P.z;
}

/* ---------- portal interaction ---------- */
async function openPortal(p){
  const def=DGDEF[p.dg];if(!def||DG.on)return;
  if(SES.pf.level<def.need){UI.toast('Lv.'+def.need+' 이상부터 입장할 수 있습니다');return}
  const party=NET.party&&NET.party.members.length>1;
  if(party&&!isAuth()){
    if(NET.party.dgId!==p.dg){UI.toast('파티장이 먼저 입장해야 합니다');return}
    if(await UI.confirm(def.name+'에 합류할까요?'))dgJoin(p.dg);
    return;
  }
  const txt=def.name+'\n입장 Lv.'+def.need+' 이상 · 웨이브 '+def.waves.length*(def.per||1)+'회 + 보스 · 제한 10분\n피해 기여도 순위에 따라 보상이 달라집니다.\n(1위: 지역 룬 또는 지역 무기 · 2~5위: 골드/물약/룬 확률)\n사망은 3회까지 부활합니다.'+(party?'\n파티원에게 입장 알림이 전송됩니다.':'');
  if(!(await UI.confirm(txt)))return;
  dgStart(p.dg);
}
async function dgStart(id){
  try{await API.call('dgBegin',id)}catch(e){UI.toast(errKo(e.message));return}
  flushKills();flushGather();
  dgEnter(id);
  if(NET.on&&NET.party&&NET.party.members.length>1&&isAuth()){NET.party.dgId=id;netSend('dg',{k:'in',id,from:SES.name,to:NET.party.members.filter(n=>n!==SES.name)})}
}
async function dgJoin(id){
  if(DG.on)return;
  try{await API.call('dgBegin',id)}catch(e){UI.toast(errKo(e.message));return}
  flushKills();flushGather();dgEnter(id);
}

/* ---------- authority: waves & boss ---------- */
function dgPlayers(){return allPos().filter(q=>q.x>600)}
function dgSpawnWave(){
  const def=DGDEF[DG.id],A=dgPlayers(),pc=Math.max(1,A.length),idx=DG.wave,n=Math.min(24,Math.round(def.waves[idx]*(1+.5*(pc-1))));
  sfx('boom');const zt=dgZT(idx),zb=dgZB(idx);
  for(let i=0;i<n;i++){
    let x=DG.cx,z=DG.cz+zb+6;
    for(let k=0;k<10;k++){x=DG.cx+rnd(-13,13);z=DG.cz+rnd(zb+4,zt-18);if(!blocked(x,z,1.2)&&A.every(q=>d2(x,z,q.x,q.z)>9*9))break}
    dgSpawnAdd(pick(def.mobs),x,z,idx===def.waves.length-1&&DG.sub===(def.per||1)-1&&i===0&&pc>1);
  }
}
function dgSpawnBoss(){
  const def=DGDEF[DG.id],pc=Math.max(1,dgPlayers().length);
  DG.mkBk=DG.id;const m=makeMobObj(mobSeq++,'dgboss',DG.cx,DG.cz+DG_HALL_Z-4,def.ml,false,false,false);
  dgBossSetup(m,DG.id);m.maxHp=m.hp=Math.round(mobHp(def.ml)*def.hpM*(1+.9*(pc-1)));
  DG.boss=m;sfx('boom');cam.shake=Math.max(cam.shake,.8);
  shockRing(m.x,m.z,10,def.ring,.8);
}
function dgTick(dt,A){
  if(!DG.on||DG.ph==='clear'||DG.ph==='fail')return;
  const def=DGDEF[DG.id];DG.t+=dt;
  if(DG.t>600){dgFail('제한 시간이 초과되었습니다');return}
  let alive=0;for(const m of MOBS)if(m.dg&&!m.dead&&!m.ghost&&m.type!=='dgboss')alive++;DG.alive=alive;
  if(DG.ph==='intro'){DG.pt-=dt;if(DG.pt<=0){DG.ph='wave';dgSpawnWave()}}
  else if(DG.ph==='wave'){if(alive===0){if(DG.sub+1<(def.per||1)){DG.sub++;DG.ph='gap';DG.pt=2.5}else{DG.sub=0;DG.wave++;DG.ph='advance'}}}
  else if(DG.ph==='gap'){DG.pt-=dt;if(DG.pt<=0){DG.ph='wave';dgSpawnWave()}}
  else if(DG.ph==='advance'){
    const tz=dgRoomTrigger(DG.wave);
    if(dgPlayers().some(q=>q.z-DG.cz<tz)){if(DG.wave>=def.waves.length){DG.ph='boss';dgSpawnBoss()}else{DG.ph='wave';dgSpawnWave()}}
  }
  else if(DG.ph==='boss'){if(DG.boss&&DG.boss.dead)dgClear()}
  DG.lastSt+=dt;
  if(DG.lastSt>.5){DG.lastSt=0;if(NET.on&&NET.party&&NET.party.members.length>1){const b=DG.boss;netSend('dg',{k:'st',id:DG.id,ph:DG.ph,w:DG.wave,s:DG.sub,al:alive,t:Math.round(DG.t),bh:b&&!b.dead?Math.round(b.hp/b.maxHp*100):0,dm:Object.fromEntries(Object.entries(DG.dmg).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>[x[0],Math.round(x[1])]))})}}
}
function dgStandings(){
  const names=new Set(Object.keys(DG.dmg));
  if(NET.party)for(const n of NET.party.members){const p=NET.peers[n];if(n===SES.name||(p&&p.got&&p.x>600))names.add(n)}
  names.add(SES.name);
  return[...names].map(n=>[n,Math.round(DG.dmg[n]||0)]).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));
}
function dgClear(){
  DG.ph='clear';const st=dgStandings();
  if(NET.on&&NET.party&&NET.party.members.length>1)netSend('dg',{k:'end',id:DG.id,st});
  dgOnEnd(st);
}

/* ---------- results & rewards (every client in the dungeon) ---------- */
async function dgOnEnd(st){
  DG.ph='clear';DG.st=st;sfx('level');cam.shake=Math.max(cam.shake,.5);
  const idx=st.findIndex(s=>s[0]===SES.name),rank=Math.min(5,idx<0?st.length+1:idx+1),id=DG.id;
  // server needs the run to be at least 45 s old
  const wait=Math.max(0,46500-(Date.now()-DG.begin));if(wait>0)await new Promise(r=>setTimeout(r,wait));
  if(!DG.on||DG.id!==id)return;
  let rw=null,err=null;
  try{const r=await API.call('dgEnd',id,rank);rw=r.rewards}catch(e){err=e.message}
  DG.res={st,rank,rw,err};
  try{derive();UI.refreshHud()}catch(e){}
  dgResults();
}
function dgRwText(r){
  if(r.t==='gold')return '골드 +'+fmtN(r.n);
  if(r.t==='weapon')return '무기 · '+wName(r.base);
  if(r.t==='potion')return (POTIONS[r.base]?POTIONS[r.base].name:r.base)+' x'+r.n;
  if(r.t==='rune')return (RUNES[r.base]?RUNES[r.base].name:r.base)+(r.base==='all'?'':' '+(RUNE_G[r.g]||''))+' x'+r.n;
  return '';
}
function dgRwCard(r){
  let col='#ffd24a',ico=ic('star',col,26),nm='',sub='';
  if(r.t==='gold'){nm=fmtN(r.n)+' G';sub='골드'}
  else if(r.t==='weapon'){col=TIER_COL[wTier(r.base)-1];ico=ic(WICON[wCls(r.base)],col,26);nm=wName(r.base);sub='무기'}
  else if(r.t==='potion'){const p=POTIONS[r.base]||{};col=p.col||'#ff5a6a';ico=ic('potion',col,26);nm=(p.name||r.base)+' x'+r.n;sub='물약'}
  else if(r.t==='rune'){const q=RUNES[r.base]||{};col=q.col||'#fff';ico=ic('gem',col,26);nm=(q.name||r.base)+(r.base==='all'?'':' '+(RUNE_G[r.g]||''))+' x'+r.n;sub='룬'}
  return '<div class="rc" style="--cc:'+col+'">'+ico+'<div style="color:'+col+';font-weight:800;margin-top:4px">'+esc(nm)+'</div><small>'+sub+'</small></div>';
}
function dgResults(){
  const R=DG.res;if(!R||!DG.on)return;
  const tot=R.st.reduce((a,x)=>a+x[1],0)||1,top=R.st[0]?R.st[0][1]||1:1,mc=['#ffd24a','#cfd8e8','#d89a5a'][R.rank-1]||'#8aa0c0';
  UI.page('DUNGEON CLEAR — '+DGDEF[DG.id].name,()=>{
    let h='<div id="dgres" style="--mc:'+mc+'"><div class="rk"><b>'+R.rank+'</b><div>'+(R.rank===1?'기여도 1위! 최고의 활약':R.rank+'위 · 수고하셨습니다')+'</div></div>';
    h+=R.err?'<div class="card"><div class="red">'+esc(errKo(R.err))+'</div></div>':'<div class="rw">'+(R.rw||[]).map((r,i)=>dgRwCard(r).replace('class="rc"','class="rc" style="animation-delay:'+(i*.15)+'s;--cc:'+(r.t==='gold'?'#ffd24a':'#9fc8ff')+'"')).join('')+'</div>';
    h+='<div class="dim" style="margin:12px 0 4px;text-align:center;letter-spacing:1px">기여도 순위</div>'+R.st.map((x,i)=>'<div class="sr'+(x[0]===SES.name?' me':'')+'"><i style="width:'+Math.round(x[1]/top*100)+'%"></i><span>'+(i+1)+'. '+esc(x[0])+'</span><span>'+fmtN(x[1])+' · '+Math.round(x[1]/tot*100)+'%</span></div>').join('');
    h+='<div class="row" style="margin-top:12px;justify-content:center"><button class="btn" data-a="dgout">마을 입구로 나가기</button></div><div class="dim" style="text-align:center;margin-top:6px">30초 후 자동으로 나갑니다</div></div>';
    return h;
  });
  clearTimeout(DG.autoT);DG.autoT=setTimeout(()=>{if(DG.on&&DG.ph==='clear'){UI.close();dgLeave('던전을 나왔습니다')}},30000);
}
function dgOut(){clearTimeout(DG.autoT);UI.close();dgLeave('던전을 나왔습니다')}

/* ---------- party events ---------- */
async function onDgEv(d){
  if(!d||!NET.party)return;
  if(d.k==='in'){
    if(NET.party.leader!==d.from||!DGDEF[d.id])return;NET.party.dgId=d.id;
    if(!Array.isArray(d.to)||!d.to.includes(SES.name)||DG.on)return;
    if(SES.pf.level<DGDEF[d.id].need){UI.toast('파티장이 '+DGDEF[d.id].name+'에 입장했지만 레벨이 부족합니다');return}
    if(await UI.confirm('파티장이 '+DGDEF[d.id].name+'에 입장했습니다.\n함께 입장할까요?'))dgJoin(d.id);
  }else if(d.k==='st'){
    if(!DG.on||isAuth()||DG.id!==d.id)return;DG.ph=d.ph;DG.wave=d.w;DG.sub=d.s|0;DG.alive=d.al;DG.t=d.t;DG.bh=d.bh;if(d.dm&&typeof d.dm==='object')DG.dm=d.dm;
  }else if(d.k==='end'){
    if(!DG.on||isAuth()||DG.id!==d.id||DG.ph==='clear'||!Array.isArray(d.st))return;dgOnEnd(d.st.slice(0,8).map(s=>[String(s[0]),+s[1]||0]));
  }else if(d.k==='out'){
    NET.party.dgId=null;
    if(DG.on&&DG.ph!=='clear'&&!isAuth())dgFail(d.msg||'파티장이 던전을 떠났습니다');
  }
}

/* ---------- HUD + per-frame ---------- */
const DG_CSS=`
#dgh,#dgboss,#dgrank,#dgban{position:fixed;pointer-events:none;z-index:19;color:#fff;font-family:inherit;display:none}
#dgh{top:44px;left:50%;transform:translateX(-50%);min-width:300px;padding:8px 18px 9px;text-align:center;border-radius:14px;background:linear-gradient(180deg,rgba(18,20,36,.88),rgba(10,12,24,.82));border:1px solid var(--dc,#9aff7a);box-shadow:0 0 18px -4px var(--dc,#9aff7a),inset 0 0 14px rgba(255,255,255,.05)}
#dgh:before,#dgh:after{content:'';position:absolute;top:50%;width:26px;height:2px;background:linear-gradient(90deg,transparent,var(--dc,#9aff7a))}
#dgh:before{left:-30px}#dgh:after{right:-30px;transform:scaleX(-1)}
#dgh .t{font-size:15px;font-weight:800;letter-spacing:.5px;color:var(--dc,#9aff7a);text-shadow:0 0 8px var(--dc,#9aff7a)}
#dgh .p{font-size:12px;opacity:.85;margin-top:1px}
#dgh .pips{display:flex;justify-content:center;gap:6px;margin:6px 0 5px}
#dgh .pip{width:26px;height:7px;border-radius:4px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);transition:all .3s}
#dgh .pip.on{background:var(--dc,#9aff7a);box-shadow:0 0 8px var(--dc,#9aff7a);border-color:transparent}
#dgh .pip.cur{background:linear-gradient(90deg,var(--dc,#9aff7a),#fff);box-shadow:0 0 10px var(--dc,#9aff7a);animation:dgpulse 1s infinite;border-color:transparent}
#dgh .pip.boss{width:34px;border-radius:4px;transform:skewX(-20deg)}
#dgh .pip.boss.cur,#dgh .pip.boss.on{background:linear-gradient(90deg,#ff4a3a,#ffb23a);box-shadow:0 0 10px #ff6a3a}
#dgh .row{display:flex;justify-content:center;gap:16px;font-size:12px}
#dgh .row b{color:#ffe27a}
#dgh .row .low{color:#ff6a5a;animation:dgpulse .6s infinite}
#dgh .hr{letter-spacing:2px;color:#ff5a6a}
#dgboss{top:144px;left:50%;transform:translateX(-50%);width:min(560px,88vw);text-align:center}
#dgboss .nm{display:inline-block;padding:2px 22px 3px;font-size:17px;font-weight:900;letter-spacing:1px;text-shadow:0 0 10px #000,0 0 12px var(--dc,#ff7a3a);background:linear-gradient(90deg,transparent,rgba(0,0,0,.65),transparent)}
#dgboss .nm small{font-size:11px;opacity:.8;margin-right:8px;color:#ffd24a}
#dgboss .bar{position:relative;height:20px;margin-top:3px;border-radius:4px;background:rgba(8,8,16,.85);border:2px solid #cbb27a;box-shadow:0 0 16px rgba(255,120,60,.45),inset 0 0 8px #000;overflow:hidden;transform:skewX(-12deg)}
#dgboss .trail{position:absolute;left:0;top:0;bottom:0;width:100%;background:#fff;opacity:.85;transition:width .9s .25s ease-out}
#dgboss .hp{position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(180deg,#ff8a5a,#e0301a 55%,#a01408);transition:width .25s}
#dgboss.enr .hp{background:linear-gradient(180deg,#ffd24a,#ff4a1a 55%,#c0140a);animation:dgpulse .5s infinite}
#dgboss .tick{position:absolute;top:0;bottom:0;width:2px;background:rgba(0,0,0,.6)}
#dgboss .tx{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;text-shadow:0 1px 2px #000;transform:skewX(12deg)}
#dgboss .st{font-size:11px;margin-top:2px;color:#ff9a7a;letter-spacing:2px;opacity:0;transition:opacity .3s}
#dgboss.enr .st{opacity:1;animation:dgpulse .8s infinite}
#dgrank{top:172px;left:12px;width:190px;padding:7px 9px;border-radius:10px;background:rgba(12,14,26,.78);border:1px solid rgba(255,255,255,.16);font-size:12px}
#dgrank .h{font-weight:800;color:#ffd24a;margin-bottom:4px;letter-spacing:1px;font-size:11px}
#dgrank .r{position:relative;margin:2px 0;padding:1px 4px;border-radius:3px;overflow:hidden;display:flex;justify-content:space-between}
#dgrank .r i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--dc,#9aff7a),transparent);opacity:.4}
#dgrank .r span{position:relative;z-index:1}#dgrank .r.me{outline:1px solid #ffd24a}
#dgban{top:26%;left:0;right:0;text-align:center}
#dgban .a{display:inline-block;padding:6px 60px 8px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.72) 25%,rgba(0,0,0,.72) 75%,transparent);animation:dgban 2.6s ease-out forwards}
#dgban .m{font-size:34px;font-weight:900;letter-spacing:4px;color:var(--bc,#fff);text-shadow:0 0 14px var(--bc,#fff),0 2px 4px #000}
#dgban .s{font-size:14px;letter-spacing:2px;opacity:.9;margin-top:2px}
@keyframes dgban{0%{opacity:0;transform:scale(1.5)}12%{opacity:1;transform:scale(1)}78%{opacity:1}100%{opacity:0;transform:translateY(-12px)}}
@keyframes dgpulse{50%{opacity:.55}}
#dgres .rk{text-align:center;margin:2px 0 10px}
#dgres .rk b{display:inline-block;font-size:34px;font-weight:900;line-height:1;padding:10px 22px;border-radius:50%;border:3px solid var(--mc,#ffd24a);color:var(--mc,#ffd24a);box-shadow:0 0 18px var(--mc,#ffd24a);text-shadow:0 0 10px var(--mc,#ffd24a)}
#dgres .rk div{margin-top:6px;font-size:13px;opacity:.85}
#dgres .rw{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
#dgres .rc{min-width:120px;padding:10px 12px;border-radius:10px;text-align:center;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02));border:1px solid var(--cc,#888);box-shadow:0 0 10px -3px var(--cc,#888);animation:dgpop .5s backwards}
#dgres .rc small{display:block;opacity:.7;font-size:11px;margin-top:2px}
@keyframes dgpop{0%{opacity:0;transform:translateY(14px) scale(.8)}}
#dgres .sr{position:relative;display:flex;justify-content:space-between;padding:4px 8px;margin:3px 0;border-radius:6px;overflow:hidden;background:rgba(255,255,255,.04)}
#dgres .sr i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(255,210,74,.45),transparent)}
#dgres .sr span{position:relative}#dgres .sr.me{outline:1px solid #ffd24a}
@media(max-width:700px){#dgh{top:48px;min-width:240px;padding:6px 10px}#dgrank{display:none!important}#dgboss{top:140px}#dgban .m{font-size:24px}#dgban .a{padding:6px 24px}}
`;
function dgHud(on){
  if(!DGH.el){
    const st=document.createElement('style');st.textContent=DG_CSS;document.head.appendChild(st);
    const mk=(id,html)=>{const e=document.createElement('div');e.id=id;e.innerHTML=html;document.body.appendChild(e);return e};
    DGH.el=mk('dgh','<div class="t"></div><div class="p"></div><div class="pips"></div><div class="row"><span class="tm"></span><span class="mo"></span><span class="hr"></span></div>');
    DGH.boss=mk('dgboss','<div class="nm"></div><div class="bar"><div class="trail"></div><div class="hp"></div><i class="tick" style="left:25%"></i><i class="tick" style="left:50%"></i><i class="tick" style="left:75%"></i><div class="tx"></div></div><div class="st">— 격분 —</div>');
    DGH.rank=mk('dgrank','<div class="h">⚔ 기여도</div><div class="rl"></div>');
    DGH.ban=mk('dgban','');
    DGH.q=s=>DGH.el.querySelector(s);
  }
  for(const e of[DGH.el,DGH.boss,DGH.rank])e.style.display=on?'block':'none';
  if(!on||true)DGH.boss.style.display='none';
  if(!on)DGH.ban.style.display='none';
  DGH.last='';DGH.bk='';
}
function dgVar(e,k,v){if(e.style.setProperty)e.style.setProperty(k,v)}
function dgBanner(m,s,col){
  if(!DGH.ban)return;
  const c=col!=null?hex6(col):'#fff';
  DGH.ban.style.display='block';dgVar(DGH.ban,'--bc',c);
  DGH.ban.innerHTML='<div class="a"><div class="m">'+esc(m)+'</div><div class="s">'+esc(s||'')+'</div></div>';
  clearTimeout(DGH.bt);DGH.bt=setTimeout(()=>{DGH.ban.style.display='none'},2700);
}
function dgScene(dt){
  const A=DG.arena;if(!A)return;
  for(let i=0;i<A.gates.length;i++){const open=DG.wave>i;if(A.gates[i].g.visible===open)A.gates[i].g.visible=!open;if(!open)A.gates[i].bar.material.opacity=.28+Math.sin(G.t*3+i)*.1}
  const adv=DG.ph==='advance';if(A.arrows.visible!==adv)A.arrows.visible=adv;
  if(adv){const gz=DG.wave>=4?dgGate(3)-12:dgGate(DG.wave-1)-8;A.arrows.position.set(0,0,gz);A.arrowMats.forEach((m,k)=>{m.opacity=.25+.5*Math.max(0,Math.sin(G.t*5-k*.9))})}
  if(DG.lamp)DG.lamp.position.set(P.x,6.5,P.z);
  const fx=A.anim&&A.anim[DG.id];if(fx)for(const f of fx)f(dt,G.t);
  if(A.dust)A.dust.position.y=Math.sin(G.t*.3)*.6;
  if(A.fl&&DG.id==='storm')for(const r of A.fl){r.position.y=r.userData.b+Math.sin(G.t*.8+r.userData.p)*.5;r.rotation.y+=dt*.3}
}
function dgUpdate(dt){
  guideUpdate(dt);
  if(DGP.length&&!DG.on){
    for(const p of DGP){
      const near=d2(p.x,p.z,P.x,P.z)<70*70;
      if(near){p.disc.material.opacity=.22+Math.sin(G.t*2.2)*.08;p.label.pos(p.x,7,p.z)}else if(p.label.el)p.label.el.style.display='none';
    }
  }
  else if(DG.on)for(const p of DGP)if(p.label.el)p.label.el.style.display='none';   // world portal name tags must not show inside
  if(!DG.on){
    if(P&&P.x>600&&!P.dead&&!DU.on){P.x=SPAWN.x;P.z=SPAWN.z;P.vx=P.vz=0;cam.x=P.x;cam.z=P.z;worldG.visible=true;UI.zone=-1;UI.toast('마을로 돌아왔습니다')}   // safety net: never stay in the arena outside a run
    return;
  }
  dgScene(dt);
  if(DG.ph!=='clear'&&DG.ph!=='fail'&&(NET.party?NET.party.leader:SES.name)!==DG.leader){dgFail('파티 구성이 바뀌어 던전에서 나갑니다');return}
  DGH.t+=dt;if(DGH.t<.2)return;DGH.t=0;
  const def=DGDEF[DG.id];if(!def||!DGH.el)return;
  const dc=hex6(def.ring),per=def.per||1,nw=def.waves.length*per,cw=DG.wave*per+(DG.sub||0);
  const bk=DG.ph+'|'+cw;
  if(bk!==DGH.bk){
    DGH.bk=bk;
    if(DG.ph==='intro')dgBanner(def.name,'준비하세요…',def.ring);
    else if(DG.ph==='wave')dgBanner('WAVE '+(cw+1)+' / '+nw,'몬스터를 모두 처치하라',def.ring);
    else if(DG.ph==='advance')dgBanner(cw>=nw?'보스의 방':'길이 열렸다','앞으로 나아가세요',cw>=nw?0xff5a3a:def.ring);
    else if(DG.ph==='boss')dgBanner(def.bn,'BOSS',0xff7a3a);
    else if(DG.ph==='clear')dgBanner('DUNGEON CLEAR','보상을 정산합니다…',0xffd24a);
  }
  let boss=null;for(const m of MOBS)if(m.type==='dgboss'&&!m.dead){boss=m;break}
  const bh=boss?Math.max(0,boss.hp/boss.maxHp*100):(DG.ph==='boss'?DG.bh:0);
  const tl=Math.max(0,600-DG.t),mm=Math.floor(tl/60),ss=Math.floor(tl%60);
  const pt=DG.ph==='intro'?'준비 중':DG.ph==='gap'?'다음 웨이브 준비':DG.ph==='advance'?'앞으로 나아가세요 ▶':DG.ph==='bossIntro'?'보스 등장 임박':DG.ph==='boss'?'보스 전투':DG.ph==='clear'?'클리어!':'웨이브 '+Math.min(cw+1,nw)+' / '+nw;
  const dm=Object.entries(DG.dm||DG.dmg||{}).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const key=pt+'|'+mm+':'+ss+'|'+DG.deaths+'|'+DG.alive+'|'+cw+'|'+DG.ph+'|'+Math.round(bh)+'|'+dm.map(x=>x[0]+Math.round(x[1]/50)).join();
  if(key===DGH.last)return;DGH.last=key;
  dgVar(DGH.el,'--dc',dc);dgVar(DGH.rank,'--dc',dc);dgVar(DGH.boss,'--dc',dc);
  DGH.q('.t').textContent='◆ '+def.name+' ◆';DGH.q('.p').textContent=pt;
  let pips='';for(let i=0;i<nw;i++)pips+='<i class="pip'+(cw>i||DG.ph==='boss'||DG.ph==='bossIntro'||DG.ph==='clear'?' on':cw===i&&DG.ph==='wave'?' cur':'')+'"></i>';
  pips+='<i class="pip boss'+(DG.ph==='clear'?' on':DG.ph==='boss'?' cur':'')+'"></i>';DGH.q('.pips').innerHTML=pips;
  DGH.q('.tm').innerHTML='⏱ <b class="'+(tl<60?'low':'')+'">'+mm+':'+('0'+ss).slice(-2)+'</b>';
  DGH.q('.mo').innerHTML=DG.ph==='boss'||DG.ph==='clear'?'':'👹 <b>'+(DG.alive||0)+'</b>';
  DGH.q('.hr').textContent='♥'.repeat(Math.max(0,DG.maxDeaths-DG.deaths))+'♡'.repeat(Math.min(DG.maxDeaths,DG.deaths));
  const showB=DG.ph==='boss'&&(boss||DG.bh>0);DGH.boss.style.display=showB?'block':'none';
  if(showB){
    const nm=DGH.boss.querySelector('.nm'),nt='<small>Lv.'+def.ml+'</small>'+esc(def.bn);if(DGH.nt!==nt){DGH.nt=nt;nm.innerHTML=nt}
    DGH.boss.querySelector('.hp').style.width=bh.toFixed(1)+'%';DGH.boss.querySelector('.trail').style.width=bh.toFixed(1)+'%';
    DGH.boss.querySelector('.tx').textContent=boss?fmtN(Math.max(0,boss.hp))+' / '+fmtN(boss.maxHp)+'  ('+bh.toFixed(0)+'%)':bh.toFixed(0)+'%';
    if(DGH.boss.classList&&DGH.boss.classList.toggle)DGH.boss.classList.toggle('enr',bh<35);
  }
  const rl=DGH.rank.querySelector('.rl');
  if(dm.length){const tot=dm.reduce((a,x)=>a+x[1],0)||1,top=dm[0][1]||1;
    rl.innerHTML=dm.map((x,i)=>'<div class="r'+(x[0]===SES.name?' me':'')+'"><i style="width:'+Math.round(x[1]/top*100)+'%"></i><span>'+(i+1)+'. '+esc(x[0])+'</span><span>'+Math.round(x[1]/tot*100)+'%</span></div>').join('')}
  else rl.innerHTML='<div class="dim">—</div>';
}

/* ---------- dungeon guide: pick on the town map -> arrow on the ground + chip with distance; ends on re-pick, X, or arrival ---------- */
const GUIDE={id:null,el:null,arrow:null,t:0};
const guideTarget=()=>GUIDE.id?DGP.find(p=>p.dg===GUIDE.id):null;
function guideStop(msg){
  GUIDE.id=null;if(GUIDE.el)GUIDE.el.style.display='none';if(GUIDE.arrow)GUIDE.arrow.visible=false;
  if(msg)UI.toast(msg,2200);
}
function guideToggle(id){
  if(!DGDEF[id])return;
  if(GUIDE.id===id){guideStop('길 안내를 취소했습니다');return}
  if(!GUIDE.el){
    const st=document.createElement('style');
    st.textContent='#guide{position:fixed;left:50%;top:112px;transform:translateX(-50%);z-index:21;display:none;align-items:center;gap:10px;padding:5px 6px 5px 14px;border-radius:18px;background:rgba(12,14,26,.88);border:1px solid #ffd24a;color:#fff;font-size:13px;font-weight:700;white-space:nowrap}#guide button{width:24px;height:24px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:13px;cursor:pointer;padding:0}';
    document.head.appendChild(st);
    const e=document.createElement('div');e.id='guide';e.innerHTML='<span></span><button title="안내 취소">✕</button>';document.body.appendChild(e);
    e.querySelector('button').onclick=()=>guideStop('길 안내를 취소했습니다');GUIDE.el=e;
  }
  if(!GUIDE.arrow){
    const g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.85,depthWrite:false,depthTest:false});
    for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.55,.9,3),m);c.rotation.x=Math.PI/2;c.position.set(0,0,2.4+k*1.1);c.scale.set(1,1,.2);g.add(c)}
    scene.add(g);GUIDE.arrow=g;
  }
  GUIDE.id=id;GUIDE.t=1;GUIDE.el.style.display='flex';
  UI.toast(DGDEF[id].name+' 길 안내를 시작합니다',2200);guideUpdate(0);
}
function guideUpdate(dt){
  if(!GUIDE.id||!P)return;
  const p=guideTarget();if(!p||DG.on){guideStop();return}
  const d=Math.hypot(p.x-P.x,p.z-P.z);
  if(d<9){guideStop(DGDEF[GUIDE.id].name+' 입구에 도착했습니다');return}
  const a=GUIDE.arrow;a.visible=!P.dead;a.position.set(P.x,.25,P.z);a.rotation.y=Math.atan2(p.x-P.x,p.z-P.z);
  GUIDE.t+=dt;if(GUIDE.t<.2)return;GUIDE.t=0;
  GUIDE.el.querySelector('span').textContent='▶ '+DGDEF[GUIDE.id].name+' 안내 중 · '+Math.round(d)+'m';
}

/* ---------- town map ---------- */
function openMap(){
  UI.handlers.guide=id=>{guideToggle(id);if(UI.rerender)UI.rerender();drawBigMap()};
  UI.page('지도',()=>'<div style="text-align:center"><canvas id="bigmap" width="720" height="720" style="width:100%;max-width:560px;border-radius:10px;border:1px solid #444"></canvas></div><div id="mapl" style="margin-top:8px;font-size:13px;line-height:1.7"></div>');
  drawBigMap();
}
function drawBigMap(){
  const c=$('bigmap'),g=c&&c.getContext&&c.getContext('2d');if(!g)return;
  const W=c.width,cx=W/2,sc=(W/2-14)/WORLD_R,px=x=>cx+x*sc,pz=z=>cx+z*sc;
  const cols=['#8c8678','#5fa84a','#4a4f58','#7a4a38','#4a4a8a','#5a6678','#3a2a52','#cfe0ee','#c8a468','#d8d4e8'];
  g.fillStyle='#0c0f16';g.fillRect(0,0,W,W);
  for(let i=ZONES.length-1;i>=0;i--){g.fillStyle=cols[i];g.beginPath();g.arc(cx,cx,ZONES[i].r1*sc,0,TAU);g.fill()}
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1.5;for(const z of ZONES){g.beginPath();g.arc(cx,cx,z.r1*sc,0,TAU);g.stroke()}
  g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1;for(let i=-5;i<=5;i++){g.beginPath();g.moveTo(px(i*100),pz(-WORLD_R));g.lineTo(px(i*100),pz(WORLD_R));g.moveTo(px(-WORLD_R),pz(i*100));g.lineTo(px(WORLD_R),pz(i*100));g.stroke()}
  g.textAlign='center';g.font='bold 13px sans-serif';
  const lab=(t,x,y,col)=>{g.lineWidth=3.5;g.strokeStyle='rgba(0,0,0,.8)';g.strokeText(t,x,y);g.fillStyle=col||'#fff';g.fillText(t,x,y)};
  for(const z of ZONES){if(!z.id)continue;const r=(z.r0+z.r1)/2;lab(z.name,cx,cx-r*sc+4);g.font='11px sans-serif';lab('Lv.'+z.lo+'~'+z.hi,cx,cx-r*sc+17,'#ddd');g.font='bold 13px sans-serif'}
  lab('마을',cx,cx+5,'#fff');
  const rows=[];
  for(const p of DGP){if(p.kind!=='portal')continue;const def=DGDEF[p.dg],x=px(p.x),y=pz(p.z);
    g.fillStyle='rgba(0,0,0,.6)';g.beginPath();g.arc(x,y,13,0,TAU);g.fill();g.fillStyle='#'+('000000'+def.ring.toString(16)).slice(-6);g.beginPath();g.arc(x,y,9,0,TAU);g.fill();
    g.fillStyle='#10131b';g.beginPath();g.arc(x,y,4.5,0,TAU);g.fill();
    lab(def.name,x,y-18,'#ffe9a0');
    const dist=Math.round(Math.hypot(p.x-P.x,p.z-P.z)),ang=Math.atan2(p.z,p.x),dirs=['동','남동','남','남서','서','북서','북','북동'],dn=dirs[(Math.round(ang/(Math.PI/4))+8)%8];
    const on=GUIDE.id===p.dg;
    if(on){g.strokeStyle='#ffd24a';g.lineWidth=3;g.setLineDash&&g.setLineDash([10,7]);g.beginPath();g.moveTo(px(P.x),pz(P.z));g.lineTo(x,y);g.stroke();g.setLineDash&&g.setLineDash([]);g.beginPath();g.arc(x,y,18,0,TAU);g.stroke()}
    rows.push('<div data-a="guide" data-v="'+p.dg+'" style="cursor:pointer;margin:4px 0;padding:5px 8px;border-radius:8px;border:1px solid '+(on?'#ffd24a':'#3a3f52')+'"><b style="color:#ffe9a0">'+def.name+'</b> '+(on?'<b style="color:#6bffb0">[안내 중 · 다시 누르면 취소]</b>':'<span style="opacity:.7">[눌러서 안내]</span>')+' — '+ZONES[def.zid].name+' '+dn+'쪽 · 필요 Lv.'+def.need+' · 마을에서 약 '+Math.round(Math.hypot(p.x,p.z))+'m (현재 '+dist+'m)</div>')}
  g.fillStyle='#ffd24a';g.beginPath();g.arc(px(P.x),pz(P.z),7,0,TAU);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();lab('나',px(P.x),pz(P.z)-12,'#ffd24a');
  g.font='bold 14px sans-serif';lab('북',cx,16,'#ccc');lab('남',cx,W-6,'#ccc');lab('서',14,cx+5,'#ccc');lab('동',W-14,cx+5,'#ccc');
  c.onclick=ev=>{
    const r=c.getBoundingClientRect(),mx=(ev.clientX-r.left)*W/r.width,my=(ev.clientY-r.top)*W/r.height;
    let best=null,bd=34;for(const p of DGP){if(p.kind!=='portal')continue;const d=Math.hypot(px(p.x)-mx,pz(p.z)-my);if(d<bd){bd=d;best=p}}
    if(best)UI.act('guide',best.dg);
  };
  const l=$('mapl');if(l)l.innerHTML=rows.join('')+'<div style="opacity:.7;margin-top:4px">던전 표시나 목록을 누르면 길 안내 · 동굴 입구에서 E로 입장 · 중심은 마을, 바깥으로 갈수록 위험합니다</div>';
}
