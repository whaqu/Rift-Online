/* ---------------- region dungeon scenery (forest / ember / void / snow / desert / sky): built on first entry ----------------
   소품은 벽 가장자리에만 둔다(충돌체가 전역이라 추가하지 않음). */
function dgTheme(A,id){
  const build=DGTHEME[id];if(!build||A.th[id])return;
  const t=new THREE.Group();t.visible=false;A.g.add(t);A.th[id]=t;
  const {rw,rl}=DGL,hr=DGL.hallR,hz=DG_HALL_Z,R=mulberry(9000+DGDEF[id].bits),rr=(a,b)=>a+R()*(b-a),fns=[];
  A.anim=A.anim||{};A.anim[id]=fns;
  const std=(c,e,i)=>new THREE.MeshStandardMaterial({color:c,roughness:.85,flatShading:true,emissive:e||0,emissiveIntensity:e?(i||1):0});
  const flatm=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide});
  const G_={box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(1,1,5),cyl:new THREE.CylinderGeometry(1,1,1,8),rock:new THREE.DodecahedronGeometry(1,0),
    ball:new THREE.SphereGeometry(1,8,6),disc:new THREE.CircleGeometry(1,18),plane:new THREE.PlaneGeometry(1,1),torus:new THREE.TorusGeometry(1,.09,6,24)};
  const add=(geo,mat,x,y,z,sx,sy,sz,par)=>{const m=new THREE.Mesh(G_[geo],mat);m.position.set(x,y,z);m.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz);(par||t).add(m);return m};
  const decal=(geo,mat,x,z,w,l,rot)=>{const m=add(geo,mat,x,.15+R()*.04,z,w,l,1);m.rotation.x=-Math.PI/2;m.rotation.z=rot||0;return m};
  const light=(c,s,o,x,y,z)=>{const g=glow(c,s,o);g.position.set(x,y,z);t.add(g);return g};
  const side=()=>R()<.5?-1:1;
  const rooms=(n,fn,inner)=>{for(let i=0;i<4;i++)for(let k=0;k<n;k++){const sx=side();fn(sx*rr(rw-(inner||6),rw-1.6),dgZT(i)-rr(3,rl-3),sx,i)}};
  const floor=(n,fn)=>{for(let i=0;i<4;i++)for(let k=0;k<n;k++)fn(rr(-rw+4,rw-4),dgZT(i)-rr(4,rl-4),i)};
  const ring=(n,rad,fn)=>{for(let i=0;i<n;i++){const a=(i+.5)/n*TAU;if(Math.sin(a)>.8)continue;fn(Math.cos(a)*(hr-rad),hz+Math.sin(a)*(hr-rad),a,i)}};
  // drifting particles: dy<0 falls (snow), dy>0 rises (embers / feathers)
  const motes=(n,color,size,dy,top)=>{const base=new Float32Array(n*3),pos=new Float32Array(n*3),z0=hz-hr;
    for(let i=0;i<n;i++){base[i*3]=rr(-rw,rw);base[i*3+1]=rr(0,top);base[i*3+2]=rr(z0,6);pos.set([base[i*3],base[i*3+1],base[i*3+2]],i*3)}
    const ge=new THREE.BufferGeometry(),at=new THREE.BufferAttribute(pos,3);ge.setAttribute('position',at);
    const p=new THREE.Points(ge,new THREE.PointsMaterial({color,size,transparent:true,opacity:.85,depthWrite:false}));p.frustumCulled=false;t.add(p);
    fns.push((dt,T)=>{for(let i=0;i<n;i++){const y=((base[i*3+1]+T*dy)%top+top)%top;pos[i*3+1]=y;pos[i*3]=base[i*3]+Math.sin(T*.7+i)*.5}at.needsUpdate=true})};
  const bob=(list,amp,spin)=>fns.push((dt,T)=>{for(const o of list){o.m.position.y=o.y+Math.sin(T*.8+o.p)*amp;if(spin)o.m.rotation.y+=dt*spin}});
  const float=(arr,m)=>{arr.push({m,y:m.position.y,p:rr(0,6)});return m};
  // jagged floor line (no circles on the floor: those read as boss telegraphs)
  const zig=(x,z,mat,w,len)=>{let a=rr(0,TAU);for(let i=0;i<len;i++){a+=rr(-.9,.9);const l=rr(1.1,2),nx=x+Math.cos(a)*l,nz=z+Math.sin(a)*l;
    decal('plane',mat,(x+nx)/2,(z+nz)/2,l+w*.6,w*(1-i/(len+1)*.6),-a);x=nx;z=nz}};
  // landmarks beside every doorway, where the camera always passes
  const doors=fn=>{for(let i=0;i<4;i++)for(const sx of[-1,1]){fn(sx*(DGL.cw+3),dgZB(i)+3,sx);if(i)fn(sx*(DGL.cw+3),dgZT(i)-3,sx)}};
  const hall=(n,fn)=>{for(let i=0;i<n;i++){const a=(i+.5)/n*TAU;fn(Math.cos(a)*rr(8,hr-7),hz+Math.sin(a)*rr(8,hr-7),a)}};
  build({t,std,flatm,add,decal,light,rr,side,rooms,floor,ring,motes,bob,float,fns,zig,doors,hall,rw,rl,hr,hz});
}
const DGTHEME={
  forest(h){   // 망자의 숲: 지하 묘지
    const stone=h.std(0x6a727a),bark=h.std(0x2c2420),bone=h.std(0xd8d4c0),wood=h.std(0x3a2a22),moss=h.std(0x2e4a3a);
    const grave=(x,z,s)=>{const g=h.add('box',stone,x,.8*s,z,1.1*s,1.6*s,.3*s);g.rotation.z=h.rr(-.18,.18);const c=h.add('cyl',stone,x,1.6*s,z,.55*s,.3*s,.55*s);c.rotation.x=Math.PI/2;c.rotation.z=g.rotation.z;h.add('box',moss,x,.1,z+.7*s,1.3*s,.2,1.2*s)};
    const tree=(x,z)=>{const ht=h.rr(4,7);h.add('cyl',bark,x,ht/2,z,.32,ht,.32);for(let k=0;k<4;k++){const b=h.add('cone',bark,x,ht*h.rr(.55,.95),z,.14,h.rr(1.6,3),.14);b.rotation.z=(k%2?1:-1)*h.rr(.7,1.3);b.rotation.y=h.rr(0,6);b.position.x+=(k%2?-1:1)*.7}};
    const bones=(x,z)=>{for(let k=0;k<4;k++){const b=h.add('cyl',bone,x+h.rr(-.8,.8),.2,z+h.rr(-.8,.8),.08,h.rr(.6,1.2),.08);b.rotation.set(Math.PI/2,0,h.rr(0,3))}h.add('ball',bone,x,.32,z,.3)};
    h.rooms(7,(x,z)=>grave(x,z,h.rr(.8,1.4)));h.rooms(3,tree);h.rooms(3,bones,9);
    h.rooms(2,(x,z)=>{const c=h.add('box',wood,x,.45,z,1.2,.8,2.8);c.rotation.y=h.rr(-.5,.5);h.add('box',stone,x,.92,z,.18,.12,1.8).rotation.y=c.rotation.y});
    h.ring(14,3,(x,z)=>grave(x,z,h.rr(1.6,2.4)));
    const fire=[];h.rooms(2,(x,z)=>h.float(fire,h.light(0x7fe0ff,3.2,.75,x,h.rr(1.6,3.4),z)),9);h.ring(8,8,(x,z)=>h.float(fire,h.light(0x9affd8,3.6,.7,x,2.4,z)));h.bob(fire,.6);
    // sunken grave slabs and scattered bones across the floor
    const slab=(x,z)=>{const a=h.rr(-.5,.5);h.add('box',stone,x,.2,z,1.4,.18,2.8).rotation.y=a;h.add('box',bark,x,.31,z,.2,.06,1.7).rotation.y=a;h.add('box',bark,x,.32,z-.3*Math.cos(a),.9,.06,.2).rotation.y=a};
    h.floor(5,slab);h.floor(4,bones);h.hall(10,slab);h.hall(8,bones);
    h.doors((x,z)=>{grave(x,z,2);h.float(fire,h.light(0x7fe0ff,4,.85,x,3.8,z))});
    h.motes(160,0x9fd8c8,.14,.25,6);
  },
  ember(h){   // 화염 황무지: 용암 동굴
    const basalt=h.std(0x241c1c),hot=h.std(0xff7a2a,0xff4a0a,1.4),lava=h.flatm(0xff5a14,.85),core=h.flatm(0xffc23a,.8),crack=h.flatm(0xff7a1a,.7);
    const pool=(x,z,s)=>{h.decal('disc',lava,x,z,s,s*h.rr(.6,1.1),h.rr(0,3));const c=h.decal('disc',core,x+h.rr(-.4,.4),z,s*.45,s*.35,h.rr(0,3));c.position.y+=.05;h.light(0xff5a14,s*2.6,.4,x,.8,z)};
    const spike=(x,z)=>{const ht=h.rr(3,8),c=h.add('cone',basalt,x,ht/2,z,h.rr(.6,1.2),ht,h.rr(.6,1.2));c.rotation.z=h.rr(-.2,.2);if(h.rr(0,1)<.45)h.add('cone',hot,x,ht*.18,z+.5,.25,ht*.36,.25)};
    h.rooms(2,(x,z)=>pool(x,z,h.rr(1.6,3)),8);h.rooms(6,spike);
    const fissure=(x,z)=>{h.zig(x,z,crack,.75,5);h.light(0xff7a1a,3,.28,x,.5,z)};
    h.floor(4,fissure);h.hall(12,fissure);
    h.doors((x,z)=>{spike(x,z);h.add('cone',hot,x,1,z+.8,.4,2,.4);h.light(0xff7a2a,5,.75,x,2.4,z)});
    h.ring(16,2.5,(x,z,a,i)=>{if(i%2)spike(x,z);else pool(x,z,h.rr(1.8,2.6))});
    h.motes(260,0xff9a3a,.17,1.5,8);
    h.fns.push((dt,T)=>{lava.opacity=.72+Math.sin(T*2.1)*.16;core.opacity=.65+Math.sin(T*3.4+1)*.25;crack.opacity=.5+Math.sin(T*2.7+2)*.25});
  },
  void(h){   // 공허의 균열: 떠다니는 비석과 균열
    const dark=h.std(0x120c22),seam=h.std(0xc86bff,0x9a2aff,1.6),shard=h.std(0x5a2a8a,0x6a1ac8,.9),rift=h.flatm(0xd04aff,.55),hole=h.flatm(0x05000a,.95),mark=h.flatm(0xa84aff,.5);
    const slabs=[];h.rooms(4,(x,z)=>{const g=new THREE.Group();g.position.set(x,h.rr(2,5),z);g.rotation.set(h.rr(-.2,.2),h.rr(0,3),h.rr(-.25,.25));h.t.add(g);const ht=h.rr(2.5,4.5);h.add('box',dark,0,0,0,1.2,ht,.5,g);h.add('box',seam,0,0,.27,.12,ht*.75,.04,g);h.float(slabs,g)});h.bob(slabs,.55,.12);
    const sh=[];h.floor(5,(x,z)=>h.float(sh,h.add('cone',shard,x,h.rr(5,8),z,.3,h.rr(.8,1.8),.3)));h.bob(sh,.4,.7);
    const rings=[];const portal=(x,z,ry,s)=>{const g=new THREE.Group();g.position.set(x,3.4,z);g.rotation.y=ry;h.t.add(g);h.add('disc',hole,0,0,0,s*.92,s*1.2,1,g);rings.push(h.add('torus',seam,0,0,.05,s,s*1.3,s,g));rings.push(h.add('torus',rift,0,0,.1,s*.7,s*.9,s,g));h.light(0xb04aff,s*4,.45,x,3.4,z)};
    for(let i=0;i<4;i++)for(const sx of[-1,1])portal(sx*(h.rw-1.4),dgZT(i)-h.rr(10,36),-sx*Math.PI/2,h.rr(1.3,2));
    const tear=(x,z)=>h.zig(x,z,mark,.55,5);h.floor(4,tear);h.hall(12,tear);
    h.doors((x,z)=>{h.add('box',dark,x,2.4,z,1,4.8,1);h.add('box',seam,x,2.4,z+.52,.14,4,.04);h.float(slabs,h.add('cone',shard,x,5.8,z,.45,1.6,.45));h.light(0xb04aff,4.5,.65,x,5.8,z)});
    h.ring(8,3,(x,z,a)=>portal(x,z,-a-Math.PI/2,2.2));
    h.motes(300,0xd8b0ff,.13,.18,10);
    h.fns.push((dt,T)=>{rift.opacity=.4+Math.sin(T*2.4)*.2;rings.forEach((r,i)=>{r.rotation.z=Math.sin(T*(i%2?1.3:.9)+i)*.25})});
  },
  snow(h){   // 얼어붙은 설원: 얼음 동굴
    const ice=new THREE.MeshStandardMaterial({color:0xbfe8ff,emissive:0x2a6a9a,emissiveIntensity:.7,roughness:.15,flatShading:true,transparent:true,opacity:.82}),snow=h.std(0xe8f2fa),frozen=h.std(0x26364a),sheet=h.flatm(0x9fd8ff,.22);
    const spire=(x,z)=>{const ht=h.rr(2.5,7);h.add('cone',ice,x,ht/2,z,h.rr(.5,1),ht,h.rr(.5,1)).rotation.z=h.rr(-.15,.15);h.add('ball',snow,x,.1,z,h.rr(1,1.8),.5,h.rr(1,1.8))};
    h.rooms(6,spire);h.rooms(5,(x,z)=>h.add('ball',snow,x,.1,z,h.rr(1.2,3),h.rr(.4,.9),h.rr(1.2,3)),7);
    h.rooms(9,(x,z,sx)=>{const ht=h.rr(1,3.4),c=h.add('cone',ice,sx*(h.rw-h.rr(.8,2.2)),8-ht/2,z,.28,ht,.28);c.rotation.x=Math.PI},3);
    h.rooms(1,(x,z)=>{h.add('box',frozen,x,1.1,z,.7,2,.5);h.add('ball',frozen,x,2.35,z,.35);h.add('box',ice,x,1.5,z,1.8,3,1.6);h.light(0x9fe8ff,4,.35,x,1.8,z)},8);
    const drift=(x,z)=>{h.add('rock',snow,x,.1,z,h.rr(.9,2.2),h.rr(.18,.32),h.rr(.6,1.4)).rotation.y=h.rr(0,3)};
    h.floor(5,drift);h.floor(3,(x,z)=>h.zig(x,z,sheet,.5,5));h.hall(10,drift);h.hall(8,(x,z)=>h.zig(x,z,sheet,.55,5));
    h.doors((x,z)=>{spire(x,z);h.add('cone',ice,x+.9,1.4,z+.4,.5,2.8,.5);h.light(0x9fe8ff,5,.6,x,3,z)});
    h.ring(18,2.5,spire);h.ring(6,7,(x,z)=>h.light(0x7ac8ff,8,.35,x,2,z));
    h.motes(420,0xffffff,.14,-1.1,9);
  },
  desert(h){   // 고대 사막 유적: 지하 왕릉
    const sand=h.std(0xb8955a),dune=h.std(0xc9a66a),gold=h.std(0xffcf4a,0x8a5a0a,.8),dk=h.std(0x2a2228),eye=h.std(0x5affd0,0x2ad8a8,1.6),glyph=h.flatm(0xffc45a,.45);
    const obelisk=(x,z)=>{const ht=h.rr(4,7);h.add('box',sand,x,.3,z,1.6,.6,1.6);h.add('box',sand,x,ht/2,z,.9,ht,.9);const c=h.add('cone',gold,x,ht+.45,z,.7,.9,.7);c.rotation.y=.62;for(let k=0;k<3;k++)h.add('box',gold,x,ht*(.35+k*.2),z+.47,.36,.12,.04)};
    const statue=(x,z,sx)=>{h.add('box',sand,x,.5,z,2,1,2);h.add('box',dk,x,2.1,z,1,2.2,.8);h.add('box',gold,x,2.9,z,1.1,.3,.9);h.add('box',dk,x,3.7,z,.8,.9,.8);h.add('box',dk,x-sx*.55,3.55,z,.6,.35,.4);for(const d of[-.28,.28])h.add('cone',dk,x,4.5,z+d,.18,.8,.18);h.add('ball',eye,x-sx*.42,3.85,z+.2,.09)};
    const brazier=(x,z)=>{h.add('cyl',sand,x,.7,z,.3,1.4,.3);h.add('cyl',gold,x,1.5,z,.7,.3,.7);h.light(0xffa83a,4,.8,x,2.2,z)};
    h.rooms(2,obelisk);h.rooms(3,(x,z)=>h.add('ball',dune,x,0,z,h.rr(1.5,3.5),h.rr(.4,1),h.rr(1.5,3.5)),7);
    for(let i=0;i<4;i++)for(const sx of[-1,1]){statue(sx*(h.rw-2.6),dgZT(i)-24,sx);brazier(sx*(h.rw-4),dgZT(i)-7);
      const z=dgZT(i)-h.rr(30,40),x=sx*(h.rw-3.2);h.add('box',sand,x,.5,z,1.6,.9,3.2);h.add('box',gold,x,1.1,z,1.2,.3,2.7);h.add('ball',gold,x,1.35,z-.9,.42,.3,.5)}
    h.rooms(2,(x,z)=>{for(let k=0;k<14;k++)h.add('cyl',gold,x+h.rr(-1,1),h.rr(.08,.5),z+h.rr(-1,1),.22,.07,.22).rotation.z=h.rr(-.5,.5)},8);
    // royal road: gold inlay along the path, sand spilling over the floor
    for(let z=6;z>h.hz+h.hr;z-=3.4){for(const sx of[-1,1])h.decal('plane',glyph,sx*3.4,z,.3,2.2);h.decal('plane',glyph,0,z,.9,.9,Math.PI/4)}
    h.floor(4,(x,z)=>{h.add('rock',dune,x,.08,z,h.rr(1,2.4),h.rr(.16,.3),h.rr(.6,1.4)).rotation.y=h.rr(0,3)});
    h.hall(12,(x,z,a)=>h.decal('plane',glyph,x,z,4,.35,-a));
    h.doors((x,z)=>{obelisk(x,z);h.light(0xffc45a,4,.6,x,6,z)});
    h.ring(10,3,(x,z,a,i)=>{if(i%2)obelisk(x,z);else brazier(x,z)});
    h.motes(220,0xe8c890,.11,-.5,7);
  },
  sky(h){   // 천공의 성역: 타락한 신전
    const marble=h.std(0xe8e4f4,0x2a2640,.6),gold=h.std(0xffd45a,0x9a6a10,.9),halo=h.std(0xfff0b0,0xffd45a,1.5),beam=h.flatm(0xfff2c0,.1),seal=h.flatm(0xffe8a0,.4);
    const column=(x,z,broken)=>{const ht=broken?h.rr(2,4):7;h.add('box',gold,x,.25,z,1.9,.5,1.9);h.add('cyl',marble,x,ht/2,z,.62,ht,.62);if(broken){h.add('rock',marble,x+1.2,.4,z+.4,.6)}else{h.add('box',gold,x,ht+.2,z,1.8,.4,1.8);h.light(0xfff0b0,2.6,.55,x,ht+.9,z)}};
    for(let i=0;i<4;i++)for(const sx of[-1,1])for(const k of[6,20,34])column(sx*(h.rw-2),dgZT(i)-k-h.rr(0,3),h.rr(0,1)<.25);
    const angel=(x,z,sx)=>{h.add('box',gold,x,.4,z,1.8,.8,1.8);h.add('cone',marble,x,2.2,z,.8,2.8,.8);h.add('ball',marble,x,3.9,z,.4);for(const d of[-1,1])for(let k=0;k<3;k++){const w=h.add('cone',marble,x+sx*.2,3-k*.35,z+d*(.8+k*.28),.18,2.2-k*.35,.18);w.rotation.x=d*(.7+k*.3)}const r=h.add('torus',halo,x,4.55,z,.55);r.rotation.x=Math.PI/2};
    for(let i=0;i<4;i++)for(const sx of[-1,1])angel(sx*(h.rw-5),dgZT(i)-28,sx);
    const fl=[];h.rooms(1,(x,z)=>{h.float(fl,h.add('torus',halo,x,h.rr(5,7),z,h.rr(.8,1.4))).rotation.x=h.rr(1,2)});h.bob(fl,.4,.5);
    h.floor(2,(x,z)=>{h.add('cyl',beam,x,5,z,h.rr(.8,1.8),10,h.rr(.8,1.8));h.light(0xffe8a0,5,.3,x,.6,z)});
    for(let z=6;z>h.hz+h.hr;z-=4){for(const sx of[-1,1])h.decal('plane',seal,sx*3.8,z,.22,3);h.decal('plane',seal,0,z,1.4,1.4,Math.PI/4)}
    h.hall(16,(x,z,a)=>{h.decal('plane',seal,x,z,5,.22,-a);h.decal('plane',seal,x,z,1,1,Math.PI/4)});
    h.doors((x,z)=>column(x,z,false));
    h.ring(12,3,(x,z,a,i)=>{column(x,z,i%3===0)});h.add('cyl',beam,0,7,h.hz,5,14,5);
    h.motes(220,0xfff0c0,.16,.45,9);
    h.fns.push((dt,T)=>{beam.opacity=.08+Math.sin(T*1.3)*.035});
  }
};
