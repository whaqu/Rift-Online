/* ---------------- world: town + 4 hunting zones ---------------- */
function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const WORLD={obst:[],grid:{},cell:8,npcs:[],lava:[],nodes:[],ngrid:{}};
const NPCS=[
  {kind:'shop',name:'상점',x:-10,z:-7,face:.9},
  {kind:'smith',name:'대장간',x:10,z:-7,face:-.9},
  {kind:'auction',name:'경매장',x:-10,z:8,face:2.2},
  {kind:'job',name:'전직 교관',x:10,z:8,face:-2.2}
];
const SPAWN={x:0,z:7};
function addObst(x,z,r){const o={x,z,r};WORLD.obst.push(o);const k=Math.floor(x/WORLD.cell)+','+Math.floor(z/WORLD.cell);(WORLD.grid[k]||(WORLD.grid[k]=[])).push(o);return o}
/* gatherable nodes: weeds (grass tufts) and trees; parts = [[instancedMesh,index],..] hidden while 'cut' */
function regNode(k,x,z,parts,ob,s){const n={k,x,z,parts,ob,or:ob?ob.r:0,mats:null,cut:0,s:s||1};WORLD.nodes.push(n);const g=Math.floor(x/8)+','+Math.floor(z/8);(WORLD.ngrid[g]||(WORLD.ngrid[g]=[])).push(n);return n}
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

/* plaza flagstones: irregular warm/cool stones, dark grout, moss and wear, plus a matching height map for relief */
function cobbleTex(){
  const S=1024,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  const h=document.createElement('canvas');h.width=h.height=S;const hg=h.getContext('2d');
  g.fillStyle='#4a453e';g.fillRect(0,0,S,S);hg.fillStyle='#000';hg.fillRect(0,0,S,S);
  const R=mulberry(7),rr=(x,y,w,hh,r)=>{const q=Math.min(r,w/2,hh/2);return[x+q,y,x+w-q,y+hh,q]};
  const rect=(ctx,x,y,w,hh,r)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+hh,r);ctx.arcTo(x+w,y+hh,x,y+hh,r);ctx.arcTo(x,y+hh,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()};
  const pal=[[128,118,104],[116,110,104],[138,124,104],[104,104,108],[124,112,96],[96,98,102]];
  let y=0;
  while(y<S){const rowH=56+Math.floor(R()*28);let x=-Math.floor(R()*60);
    while(x<S){const w=52+Math.floor(R()*54),base=pal[Math.floor(R()*pal.length)],v=Math.floor((R()-.5)*26),ins=3;
      g.fillStyle='rgb('+(base[0]+v)+','+(base[1]+v)+','+(base[2]+v)+')';rect(g,x+ins,y+ins,w-ins*2,rowH-ins*2,9);g.fill();
      // top-left highlight / bottom-right shade for a bevelled stone
      g.lineWidth=3;g.strokeStyle='rgba(255,246,226,.22)';rect(g,x+ins+1.5,y+ins+1.5,w-ins*2-3,rowH-ins*2-3,8);g.stroke();
      const gr=g.createLinearGradient(x,y,x+w,y+rowH);gr.addColorStop(0,'rgba(255,255,255,.07)');gr.addColorStop(1,'rgba(0,0,0,.16)');g.fillStyle=gr;rect(g,x+ins,y+ins,w-ins*2,rowH-ins*2,9);g.fill();
      for(let i=0;i<14;i++){g.fillStyle='rgba('+(R()<.5?'255,255,255':'30,24,18')+','+(.03+R()*.07)+')';g.fillRect(x+ins+R()*(w-8),y+ins+R()*(rowH-8),1+R()*5,1+R()*4)}
      hg.fillStyle='rgb('+(150+Math.floor(R()*70))+','+(150)+','+(150)+')';rect(hg,x+ins,y+ins,w-ins*2,rowH-ins*2,9);hg.fill();
      x+=w}
    y+=rowH}
  // moss in the joints + soft dirt patches
  for(let i=0;i<420;i++){const x=R()*S,yy=R()*S;g.fillStyle='rgba('+(60+R()*30)+','+(88+R()*40)+','+(44+R()*20)+','+(.1+R()*.18)+')';g.beginPath();g.arc(x,yy,2+R()*7,0,TAU);g.fill()}
  for(let i=0;i<40;i++){const x=R()*S,yy=R()*S,r=30+R()*80,gr=g.createRadialGradient(x,yy,0,x,yy,r);gr.addColorStop(0,'rgba(40,30,20,.16)');gr.addColorStop(1,'rgba(40,30,20,0)');g.fillStyle=gr;g.fillRect(x-r,yy-r,r*2,r*2)}
  const t=new THREE.CanvasTexture(c),bt=new THREE.CanvasTexture(h);
  for(const q of[t,bt]){if(q.wrapS!==undefined){q.wrapS=q.wrapT=THREE.RepeatWrapping;q.repeat.set(3.4,3.4);q.anisotropy=4}}
  t.userData={bump:bt};return t;
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
const ZCOL=[0x8fe8ff,0x8fe8ff,0x9fb0ff,0xff7a3a,0xc06bff,0xffe27a,0xff3dd0,0xbfe6ff,0xffc060,0xfff0b0];
const ZS=[0,1.5,1.8,2.4,2.8,2.3,2.2,1,1,1],sc=(n,zi)=>Math.round(n*ZS[zi]);
function onPath(x,z){const d=Math.hypot(x,z);if(d>17&&d<64)return Math.abs(x)<3.6||Math.abs(z)<3.6;return x>0&&Math.abs(z)<3.6&&d<WORLD_R}
WORLD.wisps=[];WORLD.ponds=[];WORLD.cracks=null;WORLD.emblem=null;WORLD.pulse=[];

/* ---- geometry helpers for nicer props (fallback to the first part if the runtime lacks support) ---- */
function mergeGeos(parts){
  try{
    const P=[],N=[];let n=0;
    for(const p of parts){
      let g=p[0];g=g.index?g.toNonIndexed():g.clone();
      const m=new THREE.Matrix4().compose(new THREE.Vector3(p[1]||0,p[2]||0,p[3]||0),new THREE.Quaternion().setFromEuler(new THREE.Euler(p[4]||0,p[5]||0,p[6]||0)),new THREE.Vector3(p[7]||1,p[8]||p[7]||1,p[9]||p[7]||1));
      g.applyMatrix4(m);if(!g.attributes.normal)g.computeVertexNormals();
      P.push(g.attributes.position.array);N.push(g.attributes.normal.array);n+=g.attributes.position.array.length;
    }
    const pa=new Float32Array(n),na=new Float32Array(n);let o=0;
    for(let i=0;i<P.length;i++){pa.set(P[i],o);na.set(N[i],o);o+=P[i].length}
    const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pa,3));out.setAttribute('normal',new THREE.BufferAttribute(na,3));
    out.computeBoundingSphere();return out;
  }catch(e){return parts[0][0]}
}
/* triangular prism: base width w (along z), apex height h, length len (along x) */
function prismGeo(w,h,len){
  try{
    const hw=w/2,hl=len/2,A=[-hl,0,-hw],B=[-hl,0,hw],C=[-hl,h,0],A2=[hl,0,-hw],B2=[hl,0,hw],C2=[hl,h,0];
    const tris=[A,B,C, A2,C2,B2, B,C2,C, B,B2,C2, A,C2,A2, A,C,C2, A,B2,B, A,A2,B2];
    const a=new Float32Array(tris.length*3);tris.forEach((v,i)=>a.set(v,i*3));
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));g.computeVertexNormals();return g;
  }catch(e){return new THREE.ConeGeometry(w/2,h,4)}
}
/* drooping, scalloped conifer tier: concave profile, wavy hem that sags between "branch tips" */
function bough(R,h,seed,cap){
  try{
    const g=new THREE.ConeGeometry(R,h,20,4,false),a=g.attributes.position.array;
    for(let i=0;i<a.length;i+=3){
      const x=a[i],y=a[i+1],z=a[i+2],r=Math.hypot(x,z);if(r<1e-4)continue;
      const t=(y+h/2)/h,th=Math.atan2(z,x),w=.5+.5*Math.sin(7*th+seed*1.9),v=.5+.5*Math.sin(12*th+seed*3.1);
      const k=1+(1-t)*(.2*w+.1*v-.08)-.16*Math.sin(Math.PI*t)*(cap?.3:1);
      a[i]=x*k;a[i+2]=z*k;a[i+1]=y-(1-t)*(.2*h)*(1-w)*(cap?.5:1)+(cap?0:.03*h*Math.sin(th*3+seed));
    }
    g.attributes.position.needsUpdate=true;g.computeVertexNormals();return g;
  }catch(e){return new THREE.ConeGeometry(R,h,10)}
}
const TREEG={};
const TQ=()=>save.treeQ===0?0:1;
/* tapered limb between two points (brown wood; merged into trunk meshes) */
function limbGeo(ax,ay,az,bx,by,bz,r0,r1,seg){
  const dx=bx-ax,dy=by-ay,dz=bz-az,len=Math.hypot(dx,dy,dz)||.01,g=new THREE.CylinderGeometry(r1,r0,len,seg||5,1);
  g.translate(0,len/2,0);g.rotateX(Math.acos(Math.max(-1,Math.min(1,dy/len))));g.rotateY(Math.atan2(dx,dz));g.translate(ax,ay,az);return g;
}
/* flat drooping conifer frond (needle spray): cone laid along a branch, flattened vertically */
function frondGeo(L,w,droop,th,x,y,z){
  const g=new THREE.ConeGeometry(w,L,5,2,true);g.translate(0,L/2,0);g.scale(.42,1,1);g.rotateZ(-(Math.PI/2+droop));g.rotateY(th);g.translate(x,y,z);return g;
}
/* lumpy foliage ball: icosahedron with deterministic vertex jitter (no cracks: jitter depends only on position) */
function lumpyGeo(r,seed,amp){
  const g=new THREE.IcosahedronGeometry(r,1),a=g.attributes.position.array;
  for(let i=0;i<a.length;i+=3){const x=a[i],y=a[i+1],z=a[i+2],h=Math.sin(x*12.9898+y*78.233+z*37.719+seed*4.1)*43758.5453,k=1+((h-Math.floor(h))-.5)*2*(amp||.13);a[i]*=k;a[i+1]*=k*.94;a[i+2]*=k}
  g.attributes.position.needsUpdate=true;g.computeVertexNormals();return g;
}
const RND_C=[[0,3.2,0,1.3],[.95,2.75,.3,1],[-.85,2.85,-.35,1.05],[.2,3.95,-.4,.95],[-.3,2.55,.85,.9],[.5,2.6,-.85,.85],[-.2,4.1,.45,.8]];
/* deterministic pine layout: tiers of branches, each with a main frond and two side fronds */
function pineLayout(){
  const R=mulberry(77),out=[];
  for(let t=0;t<8;t++){
    const u=t/7,y=1.35+u*4.2,rad=2.15*Math.pow(1-u*.92,.95)+.3,n=Math.round(7-3.6*u);
    for(let b=0;b<n;b++){out.push({y:y+R()*.18,th:b/n*TAU+t*2.4+R()*.5,L:rad*(.92+R()*.3),w:.2+.16*(1-u)+R()*.05,dr:.32+R()*.3-u*.12})}
  }
  return out;
}
/* soft conifer pad: flattened, elongated low-poly bud lying along a drooping branch (rounded ends, no spikes) */
function padGeo(len,w,h,droop,th,dist,x,y,z){
  const g=new THREE.IcosahedronGeometry(1,0);try{const pa=g.attributes.position.array,na=g.attributes.normal.array;for(let i=0;i<pa.length;i+=3){const l=Math.hypot(pa[i],pa[i+1],pa[i+2])||1;na[i]=pa[i]/l;na[i+1]=pa[i+1]/l;na[i+2]=pa[i+2]/l}}catch(e){}
  g.scale(w,h,len/2);g.rotateX(droop);g.rotateY(th);
  const c=Math.cos(droop);g.translate(x+Math.sin(th)*dist*c,y-Math.sin(droop)*dist,z+Math.cos(th)*dist*c);return g;
}
/* previous, simpler trees (setting: light models) */
function treeGeoLow(k){
  const ico=r=>new THREE.IcosahedronGeometry(r,1);let g;
  try{
    if(k==='trunk'||k==='ptrunk')g=mergeGeos([[new THREE.CylinderGeometry(.2,.32,2.4,8),0,1.2,0],[new THREE.ConeGeometry(.55,.6,8),0,.25,0],[new THREE.CylinderGeometry(.06,.1,.9,5),.32,1.6,0,0,0,-.9],[new THREE.CylinderGeometry(.05,.09,.8,5),-.28,1.9,.1,.3,0,.85]]);
    else if(k==='round')g=mergeGeos([[ico(1.35),0,3.2,0],[ico(1),.95,2.75,.3],[ico(1.05),-.85,2.85,-.35],[ico(.95),.2,3.95,-.4],[ico(.9),-.3,2.55,.85],[ico(.85),.5,2.6,-.85],[ico(.8),-.2,4.1,.45]]);
    else{
      const T=[[1.45,1.9,2.2,0],[2.55,1.55,1.9,.5],[3.55,1.2,1.7,1.0],[4.45,.85,1.45,1.5]],parts=[];
      T.forEach((t,i)=>{if(k==='pine')parts.push([bough(t[1],t[2],t[3]+1),0,t[0],0,0,i*.7]);else parts.push([bough(t[1]*.8,t[2]*.5,t[3]+1,true),0,t[0]+t[2]*.24,0,0,i*.7])});
      if(k==='pine')parts.push([bough(.5,1.3,9),0,5.3,0]);else parts.push([bough(.3,.7,9,true),0,5.6,0]);
      g=mergeGeos(parts);
    }
  }catch(e){g=new THREE.IcosahedronGeometry(1,0)}
  return g;
}
function treeGeo(k){
  const ck=k+TQ();if(TREEG[ck])return TREEG[ck];
  if(!TQ()&&k!=='dead')return TREEG[ck]=treeGeoLow(k);
  let g;
  try{
  if(k==='trunk'){
    const parts=[[new THREE.CylinderGeometry(.2,.34,2.2,8),0,1.1,0],[new THREE.ConeGeometry(.6,.6,8),0,.25,0]];
    RND_C.forEach((c,i)=>parts.push([limbGeo(0,1.7+(i%3)*.12,0,c[0]*.78,c[1]*.8,c[2]*.78,.13-i*.004,.045,5),0,0,0]));
    parts.push([limbGeo(0,.9,.1,.65,1.5,.2,.07,.03,4),0,0,0],[limbGeo(0,1.0,-.1,-.6,1.55,-.15,.07,.03,4),0,0,0]);
    g=mergeGeos(parts);
  }
  else if(k==='round'){
    const parts=[];
    RND_C.forEach((c,i)=>{parts.push([lumpyGeo(c[3],i+1,.15),c[0],c[1],c[2]]);
      for(let q=0;q<3;q++){const a=q*2.1+i*1.3,rr=c[3]*.72;parts.push([lumpyGeo(c[3]*(.46+.08*q),i*3+q,.18),c[0]+Math.cos(a)*rr,c[1]+Math.sin(a*1.7)*.35*c[3],c[2]+Math.sin(a)*rr])}});
    g=mergeGeos(parts);
  }
  else if(k==='ptrunk'){
    const parts=[[new THREE.CylinderGeometry(.07,.3,6.2,7),0,3.1,0],[new THREE.ConeGeometry(.55,.55,7),0,.22,0]];
    for(const b of pineLayout()){const rb=.11+.0*b.L,ex=Math.sin(b.th)*b.L*.62,ez=Math.cos(b.th)*b.L*.62;parts.push([limbGeo(0,b.y,0,ex,b.y-b.L*.62*Math.tan(b.dr)*.9,ez,.065,.022,4),0,0,0])}
    for(let q=0;q<5;q++){const th=q*1.3,y=.75+q*.2;parts.push([limbGeo(0,y,0,Math.sin(th)*.75,y+.15,Math.cos(th)*.75,.05,.015,4),0,0,0])}
    g=mergeGeos(parts);
  }
  else if(k==='pine'||k==='snow'){
    const sn=k==='snow',parts=[];
    pineLayout().forEach(b=>{
      const L=b.L*(sn?.86:1),y=b.y+(sn?.13:0),th=b.th,dr=b.dr*(sn?.9:1),wd=b.w*(sn?.7:1),hh=(sn?.12:.26)+b.w*.35,x0=Math.sin(th)*.1,z0=Math.cos(th)*.1;
      parts.push([padGeo(L*.86,wd*1.45,hh*.7,dr,th,L*.46,x0,y,z0),0,0,0]);              /* inner pad */
      parts.push([padGeo(L*.62,wd*1.05,hh*.6,dr+.12,th,L*.86,x0,y,z0),0,0,0]);           /* outer pad, droops more */
      for(const sd of[-.62,.62])parts.push([padGeo(L*.66,wd*.95,hh*.55,dr+.06,th+sd,L*.52,x0,y-.03,z0),0,0,0]); /* side pads */
    });
    for(let t=0;t<8;t+=2){const u=t/7,y=1.35+u*4.2,rad=2.15*Math.pow(1-u*.92,.95)+.3;parts.push(sn?[bough(rad*.3,.5,t+3,true),0,y+.3,0]:[bough(rad*.42,1.1,t+3),0,y+.1,0])}
    parts.push(sn?[bough(.28,.7,9,true),0,6.15,0]:[bough(.5,1.5,9),0,6.0,0]);
    g=mergeGeos(parts);
  }
  else if(k==='dead')g=mergeGeos([[new THREE.CylinderGeometry(.1,.36,4.4,7),0,2.2,0],[new THREE.ConeGeometry(.6,.7,7),0,.3,0],
    [new THREE.CylinderGeometry(.04,.1,1.7,5),.55,3.0,0,0,0,-1.0],[new THREE.CylinderGeometry(.04,.09,1.5,5),-.5,3.5,.15,.2,0,.95],[new THREE.CylinderGeometry(.03,.08,1.3,5),.1,3.9,-.5,-.95,0,0],
    [new THREE.CylinderGeometry(.03,.06,.8,4),1.05,3.75,0,0,0,-.3],[new THREE.CylinderGeometry(.03,.06,.7,4),-.95,4.15,.25,0,0,.3],[new THREE.CylinderGeometry(.03,.07,1.1,5),.2,2.2,.5,.9,0,0]]);
  }catch(e){g=new THREE.IcosahedronGeometry(1,0)}
  return TREEG[ck]=g;
}
/* timber house with stone base, gable roof, chimney, windows */
function buildHouse(x,z,ry,v){
  HQ++;try{
  const g=grp(x,0,z,worldG);g.rotation.y=ry;
  const wallC=[0xe8dcc0,0xd8c8a4,0xeadfc8][v%3],roofC=[0x9a4a3a,0x3a5a8a,0x5a7a3a][v%3],beamC=0x5a3a24;
  const wall=M(wallC),beam=M(beamC),stone=M(0x8a8478,{roughness:.95}),roof=M(roofC,{roughness:.8}),roofD=M(0x2a2420),glass=EM(0xffd27a,.9),shut=M([0x3a6a8a,0x8a3a3a,0x4a7a4a][v%3]);
  BX(5.5,.55,4.5,stone,0,.27,0,g);
  BX(5,2.7,4,wall,0,1.9,0,g);
  for(const sx of[-2.45,2.45])for(const sz of[-1.95,1.95])BX(.26,2.75,.26,beam,sx,1.9,sz,g);
  for(const sz of[-2.02,2.02]){BX(5.1,.2,.12,beam,0,3.18,sz,g);BX(5.1,.18,.12,beam,0,1.95,sz,g)}
  for(const sx of[-2.02*1.235,2.02*1.235])BX(.12,.2,4.1,beam,sx,3.18,0,g);
  const gw=new THREE.Mesh(prismGeo(3.9,1.7,4.95),wall);gw.position.set(0,3.25,0);g.add(gw);gw.castShadow=true;
  const rf=new THREE.Mesh(prismGeo(5.0,2.25,6),roof);rf.position.set(0,3.15,0);rf.scale.set(1,1,1);g.add(rf);rf.castShadow=true;
  BX(6.15,.2,.2,roofD,0,5.4,0,g);
  const ch=BX(.65,1.7,.65,stone,1.4,4.9,-1.3,g);BX(.8,.18,.8,M(0x5a5650),1.4,5.8,-1.3,g);
  BX(1.2,2.0,.14,M(0x6a4428),0,1.55,2.05,g);BX(1.45,.16,.2,beam,0,2.6,2.08,g);SP(.07,M(0xe8b73a,{metalness:.6}),.38,1.5,2.16,g,6,5);BX(1.6,.12,.7,stone,0,.6,2.45,g);
  for(const sx of[-1.5,1.5]){
    BX(.9,.85,.1,glass,sx,2.35,2.04,g);BX(1.04,.1,.16,beam,sx,2.82,2.07,g);BX(1.04,.1,.16,beam,sx,1.88,2.07,g);BX(.07,.85,.13,beam,sx,2.35,2.08,g);
    for(const s2 of[-1,1])BX(.32,.95,.07,shut,sx+s2*.64,2.35,2.1,g);
    BX(1.0,.22,.3,M(0x6a4428),sx,1.72,2.2,g);for(let i=0;i<4;i++)SP(.09,EM([0xff7aa8,0xffd24a,0xffffff,0xb48aff][i],.25),sx-.33+i*.22,1.9,2.22,g,6,5);
  }
  for(const sz of[-.8,.8]){BX(.1,.8,.75,glass,2.52,2.35,sz,g)}
  g.traverse(m=>{if(m.isMesh)m.castShadow=true});
  addObst(x,z,3.2);return g;
  }finally{HQ--}
}
/* ---- lush grass: clumps of curved leaf blades, swaying in the wind (vertex shader) ---- */
const GRASS_U={uTime:{value:0}};
function grassGeoLow(n,h,w,lean,seed){
  try{
    const rnd=mulberry(seed),P=[],N=[],C=[],SEG=3;
    for(let b=0;b<n;b++){
      const a=b/n*TAU+rnd()*.9,dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx,hh=h*(.6+rnd()*.7),ww=w*(.7+rnd()*.6),ln=lean*(.4+rnd()*.9),r0=rnd()*.1*w/.1;
      const pt=t=>{const cx=dx*(r0+ln*hh*Math.pow(t,1.7)),cz=dz*(r0+ln*hh*Math.pow(t,1.7)),y=hh*t*(1-.25*t*ln),wd=ww*Math.pow(1-t,.75)*(t<.25?.75+t:1)*.5;return[[cx-px*wd,y,cz-pz*wd],[cx+px*wd,y,cz+pz*wd]]};
      const nx=dx*.45,nz=dz*.45,nl=Math.hypot(nx,1,nz);
      const push=(v,t)=>{P.push(v[0],v[1],v[2]);N.push(nx/nl,1/nl,nz/nl);const c=.56+.5*t;C.push(c,c,c)};
      for(let i=0;i<SEG;i++){const t0=i/SEG,t1=(i+1)/SEG,A=pt(t0),B=pt(t1);
        push(A[0],t0);push(A[1],t0);push(B[1],t1);
        if(i<SEG-1){push(A[0],t0);push(B[1],t1);push(B[0],t1)}}
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(N),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(C),3));
    g.computeBoundingSphere();return g;
  }catch(e){return new THREE.ConeGeometry(w,h,4)}
}
function grassGeo(n,h,w,lean,seed,opt){
  try{
    opt=opt||{};const rnd=mulberry(seed),P=[],N=[],C=[],SEG=3,leaf=!!opt.leaf;
    for(let b=0;b<n;b++){
      const a=b/n*TAU+rnd()*.9,dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx,hh=h*(leaf?.75+rnd()*.5:.45+rnd()*.85),ww=w*(.7+rnd()*.6),ln=lean*(.35+rnd()*1.0),r0=rnd()*.1*w/.1,curl=(rnd()-.5)*(leaf?.5:1.3),tone=.82+rnd()*.3,tip=rnd();
      const pt=t=>{const cr=r0+ln*hh*Math.pow(t,leaf?1.2:1.7),ca=curl*t*t,cx=dx*cr+px*ca*hh*.25,cz=dz*cr+pz*ca*hh*.25,y=hh*t*(1-(leaf?.5:.25)*t*ln),
        wd=(leaf?ww*Math.pow(Math.sin(Math.PI*Math.min(1,.12+t*.88)),.75)*1.25:ww*Math.pow(1-t,.75)*(t<.25?.75+t:1))*.5;return[[cx-px*wd,y,cz-pz*wd],[cx+px*wd,y,cz+pz*wd]]};
      const nx=dx*.45,nz=dz*.45,nl=Math.hypot(nx,1,nz);
      const push=(v,t)=>{P.push(v[0],v[1],v[2]);N.push(nx/nl,1/nl,nz/nl);const c=(.5+.55*t)*tone;C.push(c*(1+.1*t*tip),c*(1+.05*t),c*(1-.14*t*tip))};
      for(let i=0;i<SEG;i++){const t0=i/SEG,t1=(i+1)/SEG,A=pt(t0),B=pt(t1);
        push(A[0],t0);push(A[1],t0);push(B[1],t1);
        if(i<SEG-1){push(A[0],t0);push(B[1],t1);push(B[0],t1)}else{/* leaf tip is a point */}}
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(N),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(C),3));
    g.computeBoundingSphere();return g;
  }catch(e){return new THREE.ConeGeometry(w,h,4)}
}

/* ---- procedural ground detail: per-zone patterns layered on the vertex-coloured ground ---- */
const GD_COMMON=`
float gh(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float gn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x),f.y);}
float gf(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*gn(p);p=p*2.03+vec2(17.3,9.1);a*=.5;}return s;}
float gr(vec2 p){return 1.-abs(gf(p)*2.-1.);}
vec3 gv(vec2 p){vec2 i=floor(p),f=fract(p);float d1=9.,d2=9.;float id=0.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 o=vec2(gh(i+g),gh(i+g+57.1));float d=length(g+o-f);if(d<d1){d2=d1;d1=d;id=gh(i+g+13.7);}else if(d<d2)d2=d;}return vec3(d2-d1,id,d1);}
void gd(int z,vec2 p,float t,out vec3 m,out vec3 e){
  m=vec3(1.);e=vec3(0.);
  float n=gf(p*.07),n2=gf(p*.9),n3=gf(p*.23+5.);
  if(z==1){m=mix(vec3(.72,.9,.7),vec3(.98,1.03,.84),n)*(.88+.2*n2);float dirt=smoothstep(.66,.76,gf(p*.045+7.));m=mix(m,vec3(1.2,.92,.64)*(.85+.3*n2),dirt*.5);m*=1.+.05*sin(p.x*.55+n*5.);}
  else if(z==2){m=mix(vec3(.5,.58,.5),vec3(.8,.82,.7),n)*(.62+.3*n2);m=mix(m,vec3(.85,.68,.5)*(.6+.3*n2),smoothstep(.6,.7,n3)*.5);float c=gr(p*.22);m*=1.-.35*smoothstep(.95,.99,c);}
  else if(z==3){float c=gr(p*.085+n*.5);float lava=smoothstep(.945,.99,c);m=mix(vec3(.5,.46,.46),vec3(.85,.78,.76),n)*(.72+.3*n2)*(1.-.7*lava);e=vec3(1.5,.5,.12)*lava*(1.1+.45*sin(t*1.7+p.x*.15));float ash=smoothstep(.55,.7,n3);m=mix(m,vec3(.42,.4,.42),ash*.5);}
  else if(z==4){vec3 v=gv(p*.55);m=vec3(.8+.3*v.y)*(1.-.3*smoothstep(.1,0.,v.x));m*=vec3(.9,.9,1.02);float sp=step(.994,gh(floor(p*3.)));e=vec3(.5,.55,1.)*sp*(.5+.5*sin(t*3.+p.x));e+=vec3(.25,.15,.5)*smoothstep(.1,0.,v.x)*.5;}
  else if(z==5){float s=sin(p.x*.19+p.y*.11+n*6.)*.5+.5;m=mix(vec3(.58,.62,.72),vec3(.9,.9,.86),s)*(.8+.3*n2);float c=gr(p*.14);m*=1.-.3*smoothstep(.95,.99,c);}
  else if(z==6){float c=gr(p*.07+n*.6);float f=smoothstep(.93,.99,c);m=mix(vec3(.8,.72,1.),vec3(1.3,1.15,1.5),n)*(.8+.35*n2)*(1.-.6*f);e=vec3(1.3,.2,1.)*f*(1.+.5*sin(t*2.1+p.y*.2))+vec3(.4,.1,.6)*smoothstep(.85,.93,c)*.5;}
  else if(z==7){float dr=sin(p.x*.22+p.y*.13+n*9.)*.5+.5;m=mix(vec3(.62,.74,.95),vec3(.95,.97,1.),smoothstep(.2,.8,mix(n,dr,.5)))*(.88+.14*n2);m=mix(m,vec3(.55,.68,.9),smoothstep(.62,.75,n3)*.45);float sp=step(.996,gh(floor(p*6.)));e=vec3(.6,.75,1.)*sp*(.5+.5*sin(t*4.+p.x*2.));}
  else if(z==8){float w=sin(p.x*.75+p.y*.42+n*7.)*.5+.5;m=mix(vec3(.72,.64,.52),vec3(1.08,.98,.82),w)*(.85+.3*n2);m=mix(m,vec3(.7,.55,.45),smoothstep(.62,.72,n3)*.5);}
  else if(z==9){vec2 q=p/7.;vec2 f=fract(q);vec2 id=floor(q);float line=smoothstep(.045,.0,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));float chk=gh(id);float vein=smoothstep(.9,.99,gr(p*.05+chk*9.));m=vec3(.83+.14*chk)*(.93+.1*n2)*(1.-.14*vein);m=mix(m,vec3(1.15,.95,.55),line*.85);e=vec3(.9,.7,.25)*line*.18;}
}`;
function groundMat(){
  const m=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,metalness:0});
  const R0=ZONES.map(z=>z.r0);
  m.onBeforeCompile=sh=>{sh.uniforms.uTime=GRASS_U.uTime;sh.uniforms.uR0={value:R0};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGW;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGW=(modelMatrix*vec4(position,1.)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGW;uniform float uTime;uniform float uR0['+R0.length+'];\n'+GD_COMMON)
      .replace('#include <color_fragment>','#include <color_fragment>\nvec3 gM=vec3(1.),gE=vec3(0.);{float d=length(vGW.xz);int zi=0;for(int i=1;i<'+R0.length+';i++)if(d>=uR0[i])zi=i;float tn=0.;if(zi<'+(R0.length-1)+')tn=smoothstep(uR0[zi+1]-7.,uR0[zi+1]+1.,d);vec3 m1,e1;gd(zi,vGW.xz,uTime,m1,e1);gM=m1;gE=e1;if(tn>0.){vec3 m2,e2;gd(zi+1,vGW.xz,uTime,m2,e2);gM=mix(m1,m2,tn);gE=mix(e1,e2,tn);}float fade=smoothstep(14.,40.,length(vGW.xz));gM=mix(vec3(1.),gM,fade);gE*=fade;}\ndiffuseColor.rgb*=gM;')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=gE;');
  };
  return m;
}
const GRASSM={};
function grassMat(o){
  const k=JSON.stringify(o||{});if(GRASSM[k])return GRASSM[k];
  const m=new THREE.MeshStandardMaterial(Object.assign({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,roughness:.92,metalness:0},o||{}));
  m.onBeforeCompile=sh=>{sh.uniforms.uTime=GRASS_U.uTime;
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec4 _wp=instanceMatrix*vec4(0.,0.,0.,1.);\nfloat _k=transformed.y*transformed.y;\nfloat _s=sin(uTime*1.7+_wp.x*.31+_wp.z*.23)+.45*sin(uTime*3.1+_wp.x*.9);\ntransformed.x+=_s*_k*.16;transformed.z+=cos(uTime*1.3+_wp.z*.27)*_k*.1;\n#endif')};
  return GRASSM[k]=m;
}
function buildWorld(){
  for(const n of WORLD.npcs){try{n.label.el.remove()}catch(e){}}
  clearGroup(worldG);WORLD.obst.length=0;WORLD.grid={};WORLD.nodes.length=0;WORLD.ngrid={};if(typeof GAT!=='undefined'){GAT.anim.length=0;GAT.weedAnim.length=0}WORLD.lava.length=0;WORLD.wisps.length=0;WORLD.ponds.length=0;WORLD.pulse.length=0;WORLD.cracks=null;WORLD.emblem=null;
  const R=mulberry(20240611);
  /* ground */
  const SIZE=(WORLD_R+14)*2,SEG=220;
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
  const gm=new THREE.Mesh(geo,groundMat());gm.receiveShadow=true;worldG.add(gm);
  /* town plaza */
  const ct=cobbleTex(),plaza=new THREE.Mesh(new THREE.CircleGeometry(17.5,64),new THREE.MeshStandardMaterial({map:ct,bumpMap:ct.userData.bump,bumpScale:2.2,roughness:.9}));plaza.rotation.x=-Math.PI/2;plaza.position.y=.04;plaza.receiveShadow=true;worldG.add(plaza);
  const edge=new THREE.Mesh(new THREE.RingGeometry(17.5,18.3,48),new THREE.MeshStandardMaterial({color:0x6b6558,roughness:1,flatShading:true}));edge.rotation.x=-Math.PI/2;edge.position.y=.06;worldG.add(edge);
  const safe=new THREE.Mesh(new THREE.RingGeometry(18.9,19.1,64),flatMat(0x8fe8ff,.35));safe.rotation.x=-Math.PI/2;safe.position.y=.08;worldG.add(safe);
  /* fountain */
  const stone=M(0x9a96a8,{roughness:.9}),water=M(0x5ec8ff,{emissive:0x2a80b0,emissiveIntensity:.5,transparent:true,opacity:.85});
  CY(2.8,3.1,.9,stone,0,.45,0,worldG,16);CY(2.3,2.3,.6,water,0,.85,0,worldG,16);CY(.5,.7,2.6,stone,0,1.5,0,worldG,8);SP(.8,stone,0,2.9,0,worldG,8,6);
  const fgl=glow(0x7fd6ff,6,.35);fgl.position.set(0,2,0);worldG.add(fgl);addObst(0,0,3.2);
  {const em=new THREE.Mesh(new THREE.PlaneGeometry(17,17),new THREE.MeshBasicMaterial({map:emblemTex(),transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));em.rotation.x=-Math.PI/2;em.position.y=.075;worldG.add(em);WORLD.emblem=em}
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
    mkPath(0,17.9,44);mkPath(Math.PI,17.9,44);mkPath(-Math.PI/2,17.9,44);mkPath(Math.PI/2,17.9,WORLD_R-12)}
  /* gates */
  const stoneG=M(0x8a8798,{roughness:.9}),darkG=M(0x55526a,{roughness:.9});
  const gate=(x,z,th,col,sc)=>{HQ++;try{return gate0(x,z,th,col,sc)}finally{HQ--}};
  const gate0=(x,z,th,col,sc)=>{
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
  for(const zi of[2,3,4,5,6,7,8,9])gate(ZONES[zi].r0,0,Math.PI/2,ZCOL[zi],1.1);
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
  for(const n of NPCS){HQ++;try{
    const g=grp(n.x,0,n.z,worldG);g.rotation.y=n.face;
    BX(5.4,.3,3.6,M(0x7a6a58),0,.15,0,g);
    for(const sx of[-2.4,2.4])CY(.12,.12,3.2,wood,sx,1.7,-1.4,g,6);
    for(let i=0;i<7;i++){const st=BX(.84,.12,3.3,M(i%2?0xf4ecd8:cloth[n.kind]),-2.52+i*.84,3.3,-.7,g);st.rotation.x=.22}
    for(let i=0;i<7;i++){const fl=CN(.42,.36,M(i%2?0xf4ecd8:cloth[n.kind]),-2.52+i*.84,2.83,.95,g,3);fl.rotation.x=Math.PI}
    BX(5.9,.14,.14,wood,0,3.0,.92,g);
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
  }finally{HQ--}}
  /* houses (decor) */
  [[-15,0,1.57],[15,0,-1.57],[0,-15,0],[-13,-12,.7],[13,-12,-.7]].forEach((h,i)=>buildHouse(h[0],h[1],h[2],i));
  /* decor by zone */
  const free=(x,z)=>Math.hypot(x,z)>21&&Math.hypot(x,z)<WORLD_R-3&&!onPath(x,z);
  const placeIn=(zi,n,rad,fn)=>{const zn=ZONES[zi];let c=0,tries=0;while(c<n&&tries++<n*20){const a=R()*TAU,r=zn.r0+2+R()*(zn.r1-zn.r0-4),x=Math.cos(a)*r,z=Math.sin(a)*r;if(!free(x,z))continue;let ok=true;for(const o of WORLD.obst){if(Math.abs(o.x-x)<8&&Math.abs(o.z-z)<8&&d2(x,z,o.x,o.z)<(o.r+rad+.6)*(o.r+rad+.6)){ok=false;break}}if(!ok)continue;fn(c++,x,z)}return c};
  // z1 trees
  {const N=sc(190,1),sm=M(0xffffff,{roughness:.85,flatShading:false}),tr=instMesh(treeGeo('trunk'),M(0x7a5434,{roughness:.95,flatShading:false}),N),tp=instMesh(treeGeo('ptrunk'),M(0x6a4a30,{roughness:.95,flatShading:false}),N),rd=instMesh(treeGeo('round'),sm,N),pn=instMesh(treeGeo('pine'),sm,N);let k=0,kr=0,kp=0;
    const cols=[0x4c9a46,0x5aae4e,0x3e8a40,0x68b856,0x7ab84a],pcols=[0x2e7a46,0x34864c,0x286e40];
    placeIn(1,N,1.2,(i,x,z)=>{const s=.8+R()*.7,ry=R()*6;
      let cm,ci,tm,ti;if(R()<.55){tm=tr;ti=kr;cm=rd;ci=kr;instSet(tr,kr,x,0,z,s,s,s,ry);instSet(rd,kr++,x,0,z,s,s*(.9+R()*.25),s,ry,cols[Math.floor(R()*cols.length)])}else{tm=tp;ti=kp;cm=pn;ci=kp;instSet(tp,kp,x,0,z,s,s,s,ry);instSet(pn,kp++,x,0,z,s,s*(.95+R()*.3),s,ry,pcols[Math.floor(R()*3)])}
      regNode('wood',x,z,[[tm,ti],[cm,ci]],addObst(x,z,.6*s+.2),s);k=i+1});
    tr.count=kr;tp.count=kp;rd.count=kr;pn.count=kp;instDone(tr);instDone(tp);instDone(rd);instDone(pn);
    const NR=sc(40,1),rk=instMesh(new THREE.DodecahedronGeometry(1,0),M(0xffffff),NR);let kk=0;placeIn(1,NR,1.2,(i,x,z)=>{const s=.7+R()*1.0;instSet(rk,i,x,s*.5,z,s*1.2,s*.8,s,R()*6,0x8a8f98);addObst(x,z,s*.9);kk=i+1});rk.count=kk;instDone(rk)}
  // z2 dead forest
  {const N=sc(170,2),tr=instMesh(treeGeo('dead'),M(0x34303a,{roughness:1,flatShading:false}),N);let k=0;
    placeIn(2,N,1,(i,x,z)=>{const s=.8+R()*.9;instSet(tr,i,x,0,z,s,s*(.85+R()*.4),s,R()*6);regNode('wood',x,z,[[tr,i]],addObst(x,z,.5*s+.2),s);k=i+1});tr.count=k;instDone(tr);
    const NR=sc(70,2),gs=instMesh(new THREE.BoxGeometry(.9,1.4,.3),M(0x8a8f9a),NR);let kk=0;placeIn(2,NR,.8,(i,x,z)=>{const s=.8+R()*.5;instSet(gs,i,x,.7*s,z,s,s,s,R()*6);addObst(x,z,.55);kk=i+1});gs.count=kk;instDone(gs)}
  // z3 volcanic
  {const N=sc(130,3),rk=instMesh(new THREE.DodecahedronGeometry(1,0),M(0xffffff,{roughness:1}),N);let k=0;
    placeIn(3,N,1.4,(i,x,z)=>{const s=.8+R()*1.6;instSet(rk,i,x,s*.55,z,s,s*(.8+R()*.8),s,R()*6,pick([0x3a2a2a,0x4a3030,0x2a2024]));addObst(x,z,s*.95);k=i+1});rk.count=k;instDone(rk);
    for(let i=0,NL=sc(26,3);i<NL;i++){const a=R()*TAU,r=ZONES[3].r0+4+R()*(ZONES[3].r1-ZONES[3].r0-8),x=Math.cos(a)*r,z=Math.sin(a)*r,s=2+R()*3;
      const m=new THREE.Mesh(shared.discG,flatMat(0xff5a1a,.55));m.rotation.x=-Math.PI/2;m.position.set(x,.1,z);m.scale.set(s,s,s);worldG.add(m);const g=glow(0xff6a2a,s*2.6,.28);g.position.set(x,.8,z);worldG.add(g);WORLD.lava.push({x,z,s,m})}}
  // z4 crystals
  {const N=sc(120,4),cr=instMesh(new THREE.OctahedronGeometry(1,0),M(0xffffff,{emissive:0x4040a0,emissiveIntensity:.8,roughness:.3}),N);let k=0;
    const cols=[0x7a7aff,0xb06bff,0x5ee7ff,0xff6bd0];
    placeIn(4,N,1.2,(i,x,z)=>{const s=.8+R()*1.6;const cc2=cols[Math.floor(R()*4)];instSet(cr,i,x,s*1.6,z,s*.6,s*1.7,s*.6,R()*6,cc2);if(i%4===0){const g=glow(cc2,s*4.2,.4);g.position.set(x,s*1.6,z);worldG.add(g);WORLD.pulse.push({s:g,b:.4,ph:R()*6})}addObst(x,z,s*.6);k=i+1});cr.count=k;instDone(cr)}

  // z5 thunder plateau: stone spires with charged tips
  {const N=sc(110,5),sp=instMesh(new THREE.CylinderGeometry(.35,.9,1,5),M(0xffffff,{roughness:.9}),N),tp=instMesh(new THREE.OctahedronGeometry(1,0),M(0xffffff,{emissive:0x8a7a20,emissiveIntensity:.9,roughness:.3}),N);let k=0;
    placeIn(5,N,1.1,(i,x,z)=>{const s=.8+R()*1.3,h=3+R()*5;instSet(sp,i,x,h*.5,z,s,h,s,R()*6,pick([0x4a5568,0x56627a,0x3a4558]));instSet(tp,i,x,h+.3,z,.35*s,.5*s,.35*s,R()*6,0xffe27a);
      if(i%5===0){const g=glow(0xffe27a,s*3.4,.4);g.position.set(x,h+.3,z);worldG.add(g);WORLD.pulse.push({s:g,b:.4,ph:R()*6})}addObst(x,z,.6*s+.3);k=i+1});
    sp.count=tp.count=k;instDone(sp);instDone(tp);
    const NR=sc(50,5),rk=instMesh(new THREE.DodecahedronGeometry(1,0),M(0xffffff),NR);let kk=0;placeIn(5,NR,1.2,(i,x,z)=>{const s=.7+R()*1.1;instSet(rk,i,x,s*.5,z,s*1.2,s*.8,s,R()*6,0x6a7488);addObst(x,z,s*.9);kk=i+1});rk.count=kk;instDone(rk)}
  // z6 void rift: floating shards + magenta fissures
  {const N=sc(110,6),cr=instMesh(new THREE.OctahedronGeometry(1,0),M(0xffffff,{emissive:0x6a1a8a,emissiveIntensity:.9,roughness:.3}),N);let k=0;
    placeIn(6,N,1.2,(i,x,z)=>{const s=.9+R()*1.9,y=s*1.8+R()*2.5;instSet(cr,i,x,y,z,s*.55,s*1.6,s*.55,R()*6,pick([0x8a2ad0,0xff3dd0,0x5a3aa8,0x2a1a4a]));
      if(i%3===0){const g=glow(0xff3dd0,s*4.6,.38);g.position.set(x,y,z);worldG.add(g);WORLD.pulse.push({s:g,b:.38,ph:R()*6})}addObst(x,z,s*.6);k=i+1});cr.count=k;instDone(cr)}

  // z7 frozen tundra: snowy pines + ice spires
  {const N=230,sm=M(0xffffff,{roughness:.85,flatShading:false}),tr=instMesh(treeGeo('ptrunk'),M(0x4a3a30,{flatShading:false}),N),cn=instMesh(treeGeo('pine'),sm,N),cn2=instMesh(treeGeo('snow'),M(0xf4faff,{roughness:.6,flatShading:false}),N);let k=0;
    placeIn(7,N,1.2,(i,x,z)=>{const s=.8+R()*.9,ry=R()*6;instSet(tr,i,x,0,z,s,s,s,ry);instSet(cn,i,x,0,z,s,s,s,ry,pick([0x2e5a5a,0x3a6a68,0x2a4a58]));instSet(cn2,i,x,0,z,s,s,s,ry);regNode('wood',x,z,[[tr,i],[cn,i],[cn2,i]],addObst(x,z,.6*s+.2),s);k=i+1});tr.count=cn.count=cn2.count=k;instDone(tr);instDone(cn);instDone(cn2);
    const N2=130,ic=instMesh(new THREE.OctahedronGeometry(1,0),M(0xffffff,{emissive:0x3a7aa8,emissiveIntensity:.7,roughness:.25}),N2);let k2=0;
    placeIn(7,N2,1.2,(i,x,z)=>{const s=.9+R()*1.6;instSet(ic,i,x,s*1.5,z,s*.55,s*1.6,s*.55,R()*6,pick([0xbfe6ff,0x8ad0ff,0xe8f6ff]));if(i%5===0){const g=glow(0x9fe0ff,s*4,.35);g.position.set(x,s*1.5,z);worldG.add(g);WORLD.pulse.push({s:g,b:.35,ph:R()*6})}addObst(x,z,s*.6);k2=i+1});ic.count=k2;instDone(ic)}
  // z8 ancient desert ruins: broken columns, cacti, glowing obelisks
  {const N=180,col=instMesh(new THREE.CylinderGeometry(.6,.75,1,7),M(0xffffff,{roughness:.95}),N),cap=instMesh(new THREE.BoxGeometry(1.7,.5,1.7),M(0xffffff,{roughness:.95}),N);let k=0;
    placeIn(8,N,1.2,(i,x,z)=>{const s=.8+R()*.7,h=2+R()*5,c=pick([0xc9a96a,0xb8975a,0xd8bb80]);instSet(col,i,x,h*.5,z,s,h,s,R()*6,c);if(R()<.6)instSet(cap,i,x,h+.25,z,s,s,s,R()*6,c);else instSet(cap,i,x,-8,z,.01,.01,.01,0,c);addObst(x,z,.75*s+.2);k=i+1});col.count=cap.count=k;instDone(col);instDone(cap);
    const N2=130,ca=instMesh(new THREE.CylinderGeometry(.28,.34,1,6),M(0xffffff,{roughness:1}),N2);let k2=0;
    placeIn(8,N2,.8,(i,x,z)=>{const s=.8+R()*.8,h=1.4+R()*2.2;instSet(ca,i,x,h*.5,z,s,h,s,R()*6,pick([0x4f8a4a,0x5a9a52]));addObst(x,z,.4*s+.15);k2=i+1});ca.count=k2;instDone(ca);
    const N3=36,ob=instMesh(new THREE.BoxGeometry(1,1,1),M(0xffffff,{emissive:0x8a6a10,emissiveIntensity:.8,roughness:.4}),N3);let k3=0;
    placeIn(8,N3,1.2,(i,x,z)=>{const s=.7+R()*.6,h=3.5+R()*3;instSet(ob,i,x,h*.5,z,.9*s,h,.9*s,R()*6,0xffd45a);const g=glow(0xffd45a,s*5,.38);g.position.set(x,h*.8,z);worldG.add(g);WORLD.pulse.push({s:g,b:.38,ph:R()*6});addObst(x,z,.8*s);k3=i+1});ob.count=k3;instDone(ob)}
  // z9 sky sanctuary: marble columns + floating golden orbs
  {const N=160,cl=instMesh(new THREE.CylinderGeometry(.5,.6,1,10),M(0xffffff,{roughness:.5}),N),cp=instMesh(new THREE.BoxGeometry(1.5,.4,1.5),M(0xffffff,{roughness:.5}),N);let k=0;
    placeIn(9,N,1.2,(i,x,z)=>{const s=.8+R()*.6,h=3+R()*6,c=pick([0xf0eef8,0xe0dcf0,0xd8d0ee]);instSet(cl,i,x,h*.5,z,s,h,s,R()*6,c);instSet(cp,i,x,h+.2,z,s,s,s,R()*6,c);addObst(x,z,.6*s+.2);k=i+1});cl.count=cp.count=k;instDone(cl);instDone(cp);
    const N2=120,or=instMesh(new THREE.IcosahedronGeometry(1,1),M(0xffffff,{emissive:0xb89a30,emissiveIntensity:.9,roughness:.3}),N2);let k2=0;
    placeIn(9,N2,1,(i,x,z)=>{const s=.5+R()*.8,y=2.5+R()*4;instSet(or,i,x,y,z,s,s,s,R()*6,pick([0xffe27a,0xfff0b0,0xd8c8ff]));if(i%3===0){const g=glow(0xffe27a,s*5,.35);g.position.set(x,y,z);worldG.add(g);WORLD.pulse.push({s:g,b:.35,ph:R()*6})}addObst(x,z,s*.7);k2=i+1});or.count=k2;instDone(or)}

  /* ground cover */
  try{
  const hq=TQ();const GB=hq?grassGeo(17,.85,.085,.42,11):grassGeoLow(12,.8,.1,.38,11),GL=hq?grassGeo(8,.6,.34,1.05,23,{leaf:true}):grassGeoLow(7,.55,.3,.95,23),GT=hq?grassGeo(14,1.3,.07,.32,37):grassGeoLow(12,1.2,.08,.3,37);
  const cover=(zi,n,geo,mat,fn)=>{n=Math.round(sc(n,zi)*(IS_TOUCH?.55:1));const m=instMesh(geo,mat,n);m.castShadow=false;m.receiveShadow=!!mat.vertexColors;let k=0;const wd=geo===GB||geo===GL||geo===GT;placeIn(zi,n,.05,(i,x,z)=>{fn(m,i,x,z);if(wd)regNode('weed',x,z,[[m,i]],null);k=i+1});m.count=k;instDone(m);return m};
  const tm=M(0xffffff,{roughness:1}),gcols=[0x68ae52,0x78bd5c,0x5aa04a,0x86c862];
  
  cover(1,4200,GB,grassMat(),(m,i,x,z)=>{const s=.75+R()*.8;instSet(m,i,x,0,z,s,s*(.8+R()*.6),s,R()*6,gcols[Math.floor(R()*4)])});
  cover(1,1000,GL,grassMat(),(m,i,x,z)=>{const s=.8+R()*.8;instSet(m,i,x,0,z,s,s,s,R()*6,pick([0x55a044,0x62ae4c,0x70b856]))});
  cover(1,500,GT,grassMat(),(m,i,x,z)=>{const s=.8+R()*.7;instSet(m,i,x,0,z,s,s,s,R()*6,pick([0x7ab858,0x88c460,0x96c868]))});
  {const gl=[0x4a8a3a,0x58984a,0x66a650];const n=700,m=instMesh(GB,grassMat(),n);m.castShadow=false;let k=0;
    for(let i=0;i<n;i++){const a=R()*TAU,r=19+R()*5,x=Math.cos(a)*r,z=Math.sin(a)*r;if(onPath(x,z))continue;const s=.6+R()*.7;instSet(m,k++,x,0,z,s,s,s,R()*6,gl[i%3])}m.count=k;instDone(m)}
  {const N=sc(420,1),fc=[0xff7aa8,0xffd24a,0xffffff,0xb48aff,0xff8a4a],st=instMesh(new THREE.CylinderGeometry(.025,.025,.42,3),M(0x3f7a38),N),hd=instMesh(new THREE.IcosahedronGeometry(.17,0),M(0xffffff,{emissive:0x222222}),N);st.castShadow=hd.castShadow=false;let k=0;
    placeIn(1,N,.05,(i,x,z)=>{const s=.8+R()*.6;instSet(st,i,x,.21*s,z,s,s,s,0);instSet(hd,i,x,.46*s,z,s,s,s,R()*6,fc[Math.floor(R()*5)]);k=i+1});st.count=hd.count=k;instDone(st);instDone(hd)}
  cover(2,1300,GT,grassMat(),(m,i,x,z)=>{const s=.6+R()*.9;instSet(m,i,x,0,z,s,s*(.8+R()*.7),s,R()*6,R()<.5?0x6a6a78:0x55556a)});
  {const N=sc(110,2),cap=instMesh(new THREE.SphereGeometry(.42,7,5),M(0xffffff,{emissive:0x6a5acd,emissiveIntensity:.9,roughness:.5}),N),stm=instMesh(new THREE.CylinderGeometry(.1,.14,.5,5),M(0xd8d4c0),N);cap.castShadow=stm.castShadow=false;let k=0;
    placeIn(2,N,.5,(i,x,z)=>{const s=.7+R()*1.1;instSet(cap,i,x,.55*s,z,s,s*.6,s,0,[0x7a8aff,0xb07aff,0x6ad8ff][Math.floor(R()*3)]);instSet(stm,i,x,.25*s,z,s,s,s,0);if(i%4===0){const g=glow(0x8a8aff,2.6*s,.35);g.position.set(x,.8*s,z);worldG.add(g);WORLD.pulse.push({s:g,b:.35,ph:R()*6})}k=i+1;addObst(x,z,.35*s)});cap.count=stm.count=k;instDone(cap);instDone(stm)}
  for(let i=0,NW=sc(26,2);i<NW;i++){const a=R()*TAU,r=ZONES[2].r0+4+R()*(ZONES[2].r1-ZONES[2].r0-8),x=Math.cos(a)*r,z=Math.sin(a)*r;if(onPath(x,z))continue;const g=glow(0x9fe0ff,1.7,.55);g.position.set(x,1.4,z);worldG.add(g);WORLD.wisps.push({s:g,x,z,ph:R()*6})}
  cover(3,420,new THREE.ConeGeometry(.22,1.3,4),M(0xffffff,{roughness:1,emissive:0x401008,emissiveIntensity:.6}),(m,i,x,z)=>{const s=.6+R()*1.2;instSet(m,i,x,.5*s,z,s,s*(.7+R()*1.1),s,R()*6,pick([0x3a2220,0x4a2a24,0x2e1c1c]))});
  {const N=sc(140,3),cm=instMesh(new THREE.PlaneGeometry(.35,1),new THREE.MeshBasicMaterial({color:0xff6a1a,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),N);cm.castShadow=false;let k=0;
    placeIn(3,N,.05,(i,x,z)=>{const s=1.5+R()*3.5;_dm.position.set(x,.09,z);_dm.rotation.set(-Math.PI/2,0,R()*TAU);_dm.scale.set(.6+R()*.8,s,1);_dm.updateMatrix();cm.setMatrixAt(i,_dm.matrix);k=i+1});cm.count=k;instDone(cm);WORLD.cracks=cm}
  cover(4,340,new THREE.ConeGeometry(.2,1.2,4),M(0xffffff,{roughness:.3,emissive:0x303090,emissiveIntensity:.9}),(m,i,x,z)=>{const s=.6+R()*1.3;instSet(m,i,x,.5*s,z,s,s,s,R()*6,pick([0x7a7aff,0xb06bff,0x5ee7ff,0xff6bd0]))});
  cover(5,700,GB,grassMat(),(m,i,x,z)=>{const s=.6+R()*1.0;instSet(m,i,x,0,z,s,s,s,R()*6,pick([0x56627a,0x6a7a94,0x5a7068]))});
  {const N=sc(120,6),cm=instMesh(new THREE.PlaneGeometry(.3,1),new THREE.MeshBasicMaterial({color:0xff3dd0,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),N);cm.castShadow=false;let k=0;
    placeIn(6,N,.05,(i,x,z)=>{const s=2+R()*5;_dm.position.set(x,.09,z);_dm.rotation.set(-Math.PI/2,0,R()*TAU);_dm.scale.set(.6+R()*.8,s,1);_dm.updateMatrix();cm.setMatrixAt(i,_dm.matrix);k=i+1});cm.count=k;instDone(cm);WORLD.cracks2=cm}
  cover(6,360,new THREE.ConeGeometry(.2,1.2,4),M(0xffffff,{roughness:.3,emissive:0x501070,emissiveIntensity:.9}),(m,i,x,z)=>{const s=.6+R()*1.3;instSet(m,i,x,.5*s,z,s,s,s,R()*6,pick([0x8a2ad0,0xff3dd0,0x5a3aa8]))});
  cover(7,1100,GB,grassMat(),(m,i,x,z)=>{const s=.6+R()*.9;instSet(m,i,x,0,z,s,s,s,R()*6,pick([0xeaf4ff,0xcfe0ee,0xa8c8e0]))});
  cover(8,1100,GT,grassMat(),(m,i,x,z)=>{const s=.6+R()*.9;instSet(m,i,x,0,z,s,s,s,R()*6,pick([0xc8a858,0xb89848,0xd8b868]))});
  cover(9,1000,GL,grassMat({emissive:0x3a3010,emissiveIntensity:.5}),(m,i,x,z)=>{const s=.6+R()*1.0;instSet(m,i,x,0,z,s,s,s,R()*6,pick([0xfff0b0,0xffffff,0xd8c8ff]))});
  }catch(e){console.error('deco2',e)}
  /* far mountains */
  {const N=130,mt=instMesh(new THREE.ConeGeometry(1,1,6),M(0xffffff),N);mt.castShadow=false;for(let i=0;i<N;i++){const a=i/N*TAU,r=WORLD_R+9+R()*5,s=10+R()*14;instSet(mt,i,Math.cos(a)*r,s*.5,Math.sin(a)*r,s,s*(1.3+R()*1.2),s,R()*6,0x1c2036)}instDone(mt)}
}

const ATMO=[
  {bg:0x8fb4d8,sky:0xdfeeff,gr:0x6a7a5a,hi:1.0,sun:1.0,sc:0xfff0d0,rc:0x9ab8ff,ri:.4,fd:.0046},
  {bg:0x93b8d4,sky:0xdfeeff,gr:0x6a7a5a,hi:1.0,sun:1.0,sc:0xfff0d0,rc:0x9ab8ff,ri:.4,fd:.0050},
  {bg:0x56627a,sky:0xa8b8d8,gr:0x3a4050,hi:.88,sun:.75,sc:0xc0ccff,rc:0x6a8aff,ri:.55,fd:.0078},
  {bg:0x7a4636,sky:0xffb89a,gr:0x4a2a24,hi:.92,sun:.85,sc:0xffb480,rc:0xff6a3a,ri:.6,fd:.0068},
  {bg:0x2c2a5a,sky:0x9a8aff,gr:0x20204a,hi:.92,sun:.7,sc:0xd0c0ff,rc:0x8a6aff,ri:.65,fd:.0062},
  {bg:0x3a4658,sky:0xaab8d0,gr:0x2a3446,hi:.86,sun:.66,sc:0xcfe0ff,rc:0xffe27a,ri:.7,fd:.0068},
  {bg:0x1c1030,sky:0x8a5aaa,gr:0x180e2c,hi:.8,sun:.55,sc:0xd0a0ff,rc:0xff5ad8,ri:.8,fd:.0074},
  {bg:0xa8c4dc,sky:0xeaf4ff,gr:0x8aa0b8,hi:1.02,sun:.95,sc:0xe8f0ff,rc:0xbfe0ff,ri:.5,fd:.0072},
  {bg:0xd8b88a,sky:0xffe2b0,gr:0x8a6a44,hi:1.05,sun:1.1,sc:0xffd89a,rc:0xffb060,ri:.45,fd:.0058},
  {bg:0xb8b0e0,sky:0xf4eeff,gr:0x8a84b0,hi:1.05,sun:1.05,sc:0xfff4e0,rc:0xffe8a0,ri:.6,fd:.0054}
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
  hemi.color.copy(_ns);hemi.groundColor.copy(_ng);hemi.intensity=_ac.hi*TUNE.hemi*(1-.5*nk);sun.intensity=_ac.sun*TUNE.sun*(1-.7*nk);sun.color.copy(_nsc);rim.color.copy(_nrc);rim.intensity=_ac.ri*TUNE.rim*(1+.5*nk);
}
function updateWorldFx(dt,t){
  GRASS_U.uTime.value=t;
  if(WORLD.emblem)WORLD.emblem.rotation.z=t*.05;
  for(const w of WORLD.wisps){w.s.position.set(w.x+Math.sin(t*.6+w.ph)*1.2,1.3+Math.sin(t*1.3+w.ph)*.5,w.z+Math.cos(t*.5+w.ph)*1.2);w.s.material.opacity=.4+Math.sin(t*2+w.ph)*.2}
  for(const p of WORLD.pulse)p.s.material.opacity=p.b*(.75+.25*Math.sin(t*2.2+p.ph));
  for(const g of (WORLD.gems||[]))g.rotation.y=t*1.2;
  for(const w of WORLD.ponds)w.material.emissiveIntensity=.5+Math.sin(t*1.5)*.12;
  if(WORLD.cracks)WORLD.cracks.material.opacity=.5+Math.sin(t*2.4)*.15;
  if(WORLD.cracks2)WORLD.cracks2.material.opacity=.5+Math.sin(t*2.0+1)*.18;
}
