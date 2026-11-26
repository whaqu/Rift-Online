'use strict';
/* =====================================================================
   core: math, audio, three setup, particles, fx, labels, input
   ===================================================================== */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const d2=(ax,az,bx,bz)=>{const dx=ax-bx,dz=az-bz;return dx*dx+dz*dz};
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const lerpAng=(a,b,t)=>a+angDiff(a,b)*t;
const easeOut=t=>1-(1-t)*(1-t);
const $=id=>document.getElementById(id);
const fmtTime=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const fmtN=n=>Math.floor(n).toLocaleString('ko-KR');

/* ---------------- settings ---------------- */
const SET_KEY='rw_settings_v1';
/* default is keyboard/mouse UI; touch UI only on phones/tablets (mobile UA)  also flips at runtime when keyboard/mouse or touch input is seen (see 55_touch.js) */
let IS_TOUCH=(()=>{try{const ua=navigator.userAgent||'',mob=/Android|iPhone|iPad|iPod|Mobile/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);if(typeof matchMedia!=='function')return mob;const fine=matchMedia('(any-pointer:fine)').matches;return mob?!fine||matchMedia('(pointer:coarse)').matches:false}catch(e){return false}})();
const GFX_V=2,GFX_DEFAULT={fx:true,treeQ:1,shadows:true,outline:true};   // all graphics options start on, on every device
const save=Object.assign({vol:.7,auto:IS_TOUCH,lastName:'',gv:GFX_V},GFX_DEFAULT);
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SET_KEY)||'null');if(s){Object.assign(save,s);if(s.gv!==GFX_V){Object.assign(save,GFX_DEFAULT,{gv:GFX_V});writeSave()}}}catch(e){}}   // older saves get the new defaults once
function writeSave(){try{localStorage.setItem(SET_KEY,JSON.stringify(save))}catch(e){}}

/* ---------------- audio (all synthesized) ---------------- */
const AU={ctx:null,mg:null,sg:null,mus:null,mode:null,tick:null,step:0,vm:1,pj:1,zid:0,amb:null};
function auInit(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return}
  try{
    const C=window.AudioContext||window.webkitAudioContext;AU.ctx=new C();
    AU.mg=AU.ctx.createGain();AU.mg.gain.value=save.vol;AU.mg.connect(AU.ctx.destination);
    AU.sg=AU.ctx.createGain();AU.sg.gain.value=.85;AU.sg.connect(AU.mg);
    AU.mus=AU.ctx.createGain();AU.mus.gain.value=.32;AU.mus.connect(AU.mg);
    AU.ag=AU.ctx.createGain();AU.ag.gain.value=1;AU.ag.connect(AU.mg);
    const n=AU.ctx.sampleRate*1.5,b=AU.ctx.createBuffer(1,n,AU.ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=Math.random()*2-1;AU.nb=b;
    ambStart();
    if(AU.mode)musicMode(AU.mode);
  }catch(e){AU.ctx=null}
}
function setVol(v){save.vol=v;if(AU.mg)AU.mg.gain.value=v;writeSave()}
function tone(f,d,type,v,slide,delay,dest){
  if(!AU.ctx)return;const t=AU.ctx.currentTime+(delay||0);
  const o=AU.ctx.createOscillator(),g=AU.ctx.createGain();o.type=type||'sine';
  f*=AU.pj;v=(v||.2)*AU.vm;
  o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(25,f+slide),t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(dest||AU.sg);o.start(t);o.stop(t+d+.05);
}
function noise(d,v,fq,delay,type){
  if(!AU.ctx||!AU.nb)return;const t=AU.ctx.currentTime+(delay||0);
  v*=AU.vm;const s=AU.ctx.createBufferSource();s.buffer=AU.nb;s.playbackRate.value=.85+Math.random()*.3;const f=AU.ctx.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=(fq||1500)*AU.pj;
  const g=AU.ctx.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f);f.connect(g);g.connect(AU.sg);s.start(t);s.stop(t+d+.05);
}
const SFX={
  click:()=>tone(660,.07,'square',.06),
  slash:()=>{noise(.14,.22,2600,0,'bandpass');tone(300,.12,'sawtooth',.05,-180)},
  hit:()=>{noise(.07,.2,900);tone(160,.08,'square',.09,-60)},
  crit:()=>{noise(.1,.25,1400);tone(520,.12,'square',.1,200);tone(780,.1,'triangle',.08,0,.02)},
  shot:()=>{tone(880,.1,'triangle',.07,-500)},
  magic:()=>{tone(520,.2,'sine',.1,380);tone(1040,.14,'triangle',.05,-300,.02)},
  boom:()=>{noise(.5,.45,500);tone(90,.4,'sawtooth',.16,-50)},
  dash:()=>{noise(.18,.2,3200,0,'highpass')},
  pickup:()=>tone(1200+Math.random()*300,.08,'sine',.06),
  coin:()=>{tone(1480,.07,'square',.05);tone(1980,.1,'square',.05,0,.05)},
  level:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.25,'triangle',.12,0,i*.08))},
  hurt:()=>{noise(.2,.35,600);tone(130,.2,'sawtooth',.14,-70)},
  card:()=>{[440,554,659].forEach((f,i)=>tone(f,.2,'triangle',.1,0,i*.05))},
  win:()=>{[523,659,784,1046,1318].forEach((f,i)=>tone(f,.5,'triangle',.14,0,i*.14))},
  lose:()=>{[392,330,262,196].forEach((f,i)=>tone(f,.6,'sawtooth',.1,0,i*.2))},
  roar:()=>{noise(1.1,.5,300);tone(70,1.1,'sawtooth',.22,30)},
  tele:()=>tone(240,.2,'sine',.05,160),
  spawn:()=>tone(180,.25,'sine',.06,300),
  ice:()=>{tone(1400,.3,'triangle',.08,-900);noise(.25,.14,4000,0,'highpass')},
  portal:()=>{[262,330,392,523].forEach((f,i)=>tone(f,.9,'sine',.07,0,i*.12))},
  emote:()=>tone(900,.12,'sine',.08,300),
  hit_flesh:()=>{noise(.09,.22,700);tone(120,.09,'square',.1,-50);tone(70,.12,'sine',.12)},
  hit_bone:()=>{noise(.05,.2,3000,0,'highpass');tone(820,.07,'square',.07,-300);tone(220,.08,'triangle',.08)},
  hit_stone:()=>{noise(.12,.3,420);tone(90,.18,'sine',.18,-30);tone(1500,.04,'square',.03)},
  hit_ice:()=>{tone(1700,.12,'triangle',.07,-700);noise(.08,.15,5000,0,'highpass');tone(300,.08,'square',.05)},
  hit_metal:()=>{tone(1300,.14,'square',.05,-100);tone(1950,.2,'sine',.05);noise(.04,.2,4000,0,'highpass')},
  hit_ghost:()=>{tone(520,.2,'sine',.08,-260);noise(.1,.1,2200,0,'bandpass')},
  hit_slime:()=>{tone(240,.14,'sine',.14,220);tone(160,.1,'sine',.1,120,.03)},
  hit_chitin:()=>{noise(.06,.25,2200,0,'bandpass');tone(480,.07,'sawtooth',.06,-200)},
  hit_cloth:()=>{noise(.1,.2,500);tone(100,.1,'sine',.1)},
  hit_holy:()=>{tone(880,.15,'triangle',.07);tone(1320,.2,'sine',.05,0,.03)},
  bigHit:()=>{noise(.16,.3,800);tone(100,.22,'sawtooth',.14,-60);tone(60,.28,'sine',.2)},
  sparkle:()=>{tone(1568,.18,'triangle',.05,0,.03);tone(2093,.14,'sine',.03,0,.07)},
  die:()=>{noise(.18,.22,900);tone(260,.2,'triangle',.1,-200)},
  die_big:()=>{noise(.45,.4,500);tone(110,.5,'sawtooth',.16,-70);tone(55,.6,'sine',.2);tone(1046,.4,'triangle',.07,0,.15);tone(1568,.4,'triangle',.05,0,.22)},
  pop:()=>{tone(520,.1,'sine',.1,-320);noise(.06,.12,1500)},
  growl:()=>{noise(.4,.2,260);tone(95,.4,'sawtooth',.12,-30)},
  snarl:()=>{tone(140,.25,'sawtooth',.1,-60);noise(.2,.2,700,0,'bandpass')},
  howl:()=>{tone(380,.9,'sine',.1,260);tone(570,.9,'sine',.05,390,.05)},
  screech:()=>{tone(1900,.35,'sawtooth',.07,-900);noise(.25,.12,3500,0,'highpass')},
  hiss:()=>{noise(.5,.18,5000,0,'highpass')},
  moan:()=>{tone(150,.8,'sawtooth',.09,-40);noise(.6,.1,400)},
  chime:()=>{[1046,1318,1568].forEach((f,i)=>tone(f,.45,'sine',.06,0,i*.07))},
  clank:()=>{tone(1100,.12,'square',.05,-200);tone(180,.18,'sawtooth',.1,-80);noise(.06,.2,3000,0,'highpass')},
  whoosh:()=>{noise(.25,.2,1800,0,'bandpass');tone(300,.25,'sine',.06,600)},
  ebolt:()=>tone(420,.14,'square',.05,-200),
  thunder:()=>{noise(.15,.4,3000,0,'highpass');noise(1.4,.4,260,.08);tone(48,1.2,'sine',.22,0,.05)},
  step_grass:()=>noise(.05,.08,1300,0,'bandpass'),
  step_stone:()=>{noise(.04,.1,2400,0,'highpass');tone(110,.05,'sine',.05)},
  step_sand:()=>noise(.09,.08,900),
  step_snow:()=>{noise(.1,.09,1900,0,'bandpass')},
  step_marble:()=>{noise(.03,.1,3200,0,'highpass');tone(520,.03,'sine',.025)},
  beat:()=>{tone(60,.12,'sine',.25);tone(55,.14,'sine',.2,0,.17)},
  equip:()=>{tone(900,.05,'square',.05);tone(1400,.08,'triangle',.06,0,.04);noise(.05,.15,3000,0,'highpass')},
  enhOk:()=>{[660,880,1320,1760].forEach((f,i)=>tone(f,.3,'triangle',.08,0,i*.07));noise(.2,.12,5000,.2,'highpass')},
  enhFail:()=>{tone(200,.3,'sawtooth',.12,-120);noise(.2,.25,600)},
  swing:()=>{noise(.1,.12,2200,0,'bandpass')}
};
const SFXKEY={};['hit_flesh','hit_bone','hit_stone','hit_ice','hit_metal','hit_ghost','hit_slime','hit_chitin','hit_cloth','hit_holy'].forEach(k=>SFXKEY[k]='hit');
['step_grass','step_stone','step_sand','step_snow','step_marble'].forEach(k=>SFXKEY[k]='step');
const SFXJIT={hit:1,crit:1,slash:1,shot:1,magic:1,pickup:1,coin:1,hurt:1,die:1,pop:1,swing:1,bigHit:1,ebolt:1,step:1};
for(const k in SFX)if(k.indexOf('hit_')===0)SFXJIT[k]=1;
const SFXMIN={hit:35,crit:50,shot:45,coin:40,pickup:35,slash:60,boom:80,tele:100,spawn:90,step:90,die:40,pop:40,ebolt:40,growl:200,snarl:200,howl:600,screech:400,hiss:300,moan:500,chime:300,clank:80,whoosh:120,thunder:800,beat:600};
const lastSfx={};
function sfx(n,v){
  if(!AU.ctx||typeof n!=='string'||!Object.prototype.hasOwnProperty.call(SFX,n))return;const t=performance.now(),k=SFXKEY[n]||n;if(t-(lastSfx[k]||0)<(SFXMIN[k]||30))return;lastSfx[k]=t;
  AU.vm=v==null?1:v;AU.pj=(SFXJIT[n]||SFXJIT[k])?(.93+Math.random()*.14):1;try{SFX[n]()}finally{AU.vm=1;AU.pj=1}
}
/* positional one-shot: quieter with distance from the local player */
function sfxAt(n,x,z,range){
  if(typeof P==='undefined'||!P)return sfx(n);const d=Math.hypot(x-P.x,z-P.z),R=range||42;if(d>R)return;sfx(n,Math.max(.12,1-d/R)*(1-.25*d/R));
}
let _hsT=0;
function hitStop(sec){if(typeof G==='undefined')return;const n=performance.now();if(n-_hsT<150)return;_hsT=n;G.hs=Math.max(G.hs||0,Math.min(.12,sec))}
/* ---- ambience bed (looping filtered noise) + per-zone music ---- */
const ZAMB=[{f:500,q:.4,g:.0,t:'lowpass'},{f:700,q:.5,g:.03,t:'bandpass'},{f:420,q:.8,g:.04,t:'bandpass'},{f:180,q:.7,g:.07,t:'lowpass'},{f:1500,q:3,g:.02,t:'bandpass'},{f:900,q:.6,g:.05,t:'bandpass'},{f:140,q:1,g:.07,t:'lowpass'},{f:800,q:1.4,g:.07,t:'bandpass'},{f:1100,q:.5,g:.05,t:'bandpass'},{f:2400,q:.7,g:.03,t:'highpass'}];
const ZMUS=[{b:174.6,w:'sine',s:[0,3,5,7,10],oc:[2,4],r:.5},{b:146.8,w:'triangle',s:[0,3,5,7,10],oc:[2,4],r:.65},{b:130.8,w:'triangle',s:[0,3,5,6,10],oc:[2,2,4],r:.6},{b:123.5,w:'square',s:[0,1,5,7,8],oc:[1,2],r:.7},{b:164.8,w:'sine',s:[0,2,7,9],oc:[2,4,4],r:.55},{b:146.8,w:'triangle',s:[0,3,5,7,10],oc:[2,4],r:.85},{b:110,w:'sawtooth',s:[0,1,6,7],oc:[1,2],r:.5},{b:196,w:'sine',s:[0,2,5,7,9],oc:[2,4],r:.4},{b:138.6,w:'triangle',s:[0,1,4,5,7,8],oc:[2,2,4],r:.6},{b:220,w:'sine',s:[0,2,4,7,9],oc:[2,4,8],r:.7}];
function ambStart(){
  if(!AU.ctx||AU.amb)return;
  const s=AU.ctx.createBufferSource();s.buffer=AU.nb;s.loop=true;const f=AU.ctx.createBiquadFilter(),g=AU.ctx.createGain();g.gain.value=0;
  s.connect(f);f.connect(g);g.connect(AU.ag);s.start();AU.amb={f,g};ambZone(AU.zid||0);
}
function ambZone(z){
  AU.zid=z;if(!AU.amb)return;const a=ZAMB[z]||ZAMB[0],t=AU.ctx.currentTime;
  AU.amb.f.type=a.t;AU.amb.f.frequency.setTargetAtTime(a.f,t,.8);AU.amb.f.Q.value=a.q;AU.amb.g.gain.setTargetAtTime(a.g,t,1.2);
}
const SCALE=[0,3,5,7,10];
function musicMode(m){
  AU.mode=m;if(!AU.ctx||AU.tick)return;AU.tick=setInterval(musicStep,270);
}
function musicStep(){
  if(!AU.ctx||!AU.mode||document.hidden)return;AU.step++;
  const town=AU.mode==='town',zm=ZMUS[town?0:Math.min(AU.zid||1,ZMUS.length-1)]||ZMUS[1],base=zm.b;
  if(AU.step%8===0)tone(base/2,2.4,'sine',.55,0,0,AU.mus);
  if(AU.step%2===0&&Math.random()<(town?.5:zm.r)){
    const dg=zm.s[Math.floor(Math.random()*zm.s.length)],oc=zm.oc[Math.floor(Math.random()*zm.oc.length)];
    tone(base*oc*Math.pow(2,dg/12),town?1.5:.9,town?'sine':zm.w,town?.14:.1,0,0,AU.mus);
  }
  if(!town&&AU.step%4===0)tone(base/2,.14,'square',.04,-18,0,AU.mus);
  if(!town){ // wandering ambience: gusts and distant thunder
    if(AU.amb){const a=ZAMB[AU.zid]||ZAMB[0];AU.amb.g.gain.setTargetAtTime(a.g*(.7+.6*Math.random()),AU.ctx.currentTime,.4)}
    if(AU.zid===5&&Math.random()<.025)sfx('thunder',.5);
    if(AU.zid===3&&Math.random()<.02)sfx('boom',.12);
    if(AU.zid===7&&Math.random()<.015)sfx('howl',.15);
  }
}

/* ---------------- three basics ---------------- */
const canvas=$('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,IS_TOUCH?1.5:1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
/* look tuning: lights are scaled so bright albedo never clips, ACES filmic curve rolls highlights off */
const TUNE={th:1.0,hemi:.72,sun:.92,rim:1,exp:1.0,sat:1.14,con:.36,bloom:.3,vig:.78};
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=TUNE.exp;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0d1020);
const camera=new THREE.PerspectiveCamera(40,1,.5,320);
const hemi=new THREE.HemisphereLight(0xbfd8ff,0x2a2038,1.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d0,.95);sun.position.set(-12,26,10);sun.castShadow=true;
sun.shadow.mapSize.set(1536,1536);
{const c=sun.shadow.camera;c.left=-25;c.right=25;c.top=25;c.bottom=-25;c.near=1;c.far=90;sun.shadow.bias=-.0007;c.updateProjectionMatrix()}
scene.add(sun);scene.add(sun.target);
const rim=new THREE.DirectionalLight(0x9ab8ff,.35);rim.position.set(10,12,-18);rim.target=sun.target;scene.add(rim);
const worldG=new THREE.Group(),entG=new THREE.Group();scene.add(worldG);scene.add(entG);
let cam;
function resize(){
  const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;
  camera.fov=w/h<1.45?50:40;cam.h=w/h<.8?30:w/h<1.45?24:21;cam.d=w/h<.8?22:w/h<1.45?17:15;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);

cam={x:0,z:0,shake:0,h:21,d:15,kx:0,kz:0};resize();
function updateCam(dt,fx,fz,snap){
  const k=snap?1:1-Math.exp(-dt*7);cam.x=lerp(cam.x,fx,k);cam.z=lerp(cam.z,fz,k);
  const sx=(Math.random()-.5)*cam.shake+cam.kx,sz=(Math.random()-.5)*cam.shake+cam.kz;cam.kx*=Math.pow(.0006,dt);cam.kz*=Math.pow(.0006,dt);
  camera.position.set(cam.x+sx,cam.h,cam.z+cam.d+sz);camera.lookAt(cam.x+sx,0,cam.z-.5+sz);
  cam.shake=Math.max(0,cam.shake-dt*Math.max(1.6,cam.shake*5));
  sun.position.set(cam.x-12,26,cam.z+10);sun.target.position.set(cam.x,0,cam.z);rim.position.set(cam.x+10,12,cam.z-18);
  camera.updateMatrixWorld();
}
function camKick(dx,dz,a){const l=Math.hypot(dx,dz)||1;cam.kx+=dx/l*a;cam.kz+=dz/l*a;const m=Math.hypot(cam.kx,cam.kz);if(m>.7){cam.kx*=.7/m;cam.kz*=.7/m}}
const _v=new THREE.Vector3();
function groundPoint(mx,my){
  const nx=(mx/innerWidth)*2-1,ny=-(my/innerHeight)*2+1;
  _v.set(nx,ny,.5).unproject(camera);
  const o=camera.position,dx=_v.x-o.x,dy=_v.y-o.y,dz=_v.z-o.z;
  if(!(dy<-1e-4))return null;const t=-o.y/dy;return{x:o.x+dx*t,z:o.z+dz*t};
}
function toScreen(x,y,z){_v.set(x,y,z).project(camera);return{x:(_v.x*.5+.5)*innerWidth,y:(-_v.y*.5+.5)*innerHeight,vis:_v.z<1}}

function clearGroup(g){
  for(let i=g.children.length-1;i>=0;i--){const c=g.children[i];g.remove(c);c.traverse(o=>{if(o.geometry&&o.geometry.dispose)o.geometry.dispose()})}
}

/* ---------------- textures / glow ---------------- */
function radialTex(inner,outer,size){
  size=size||64;const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');
  const gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);gr.addColorStop(0,inner);gr.addColorStop(1,outer);
  g.fillStyle=gr;g.fillRect(0,0,size,size);return new THREE.CanvasTexture(c);
}
const glowTex=radialTex('rgba(255,255,255,1)','rgba(255,255,255,0)');
function glow(color,size,op){
  const m=new THREE.SpriteMaterial({map:glowTex,color:color,transparent:true,opacity:op==null?.8:op,blending:THREE.AdditiveBlending,depthWrite:false});
  const s=new THREE.Sprite(m);s.scale.set(size,size,1);return s;
}
function groundTex(base,accent,seed){
  const S=1024,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  g.fillStyle=base;g.fillRect(0,0,S,S);
  for(let i=0;i<2200;i++){g.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'0,0,0')+','+(Math.random()*.07)+')';const r=Math.random()*5+1;g.fillRect(Math.random()*S,Math.random()*S,r,r)}
  g.translate(S/2,S/2);g.strokeStyle=accent;g.lineCap='round';
  g.globalAlpha=.55;g.lineWidth=5;[.93,.78,.34].forEach(r=>{g.beginPath();g.arc(0,0,S/2*r,0,TAU);g.stroke()});
  g.globalAlpha=.3;g.lineWidth=2;g.beginPath();g.arc(0,0,S/2*.55,0,TAU);g.stroke();
  g.globalAlpha=.5;g.lineWidth=4;
  for(let i=0;i<24;i++){const a=i/24*TAU;g.save();g.rotate(a);g.beginPath();g.moveTo(S/2*.78,0);g.lineTo(S/2*.93,0);g.stroke();
    if(i%2===0){g.fillStyle=accent;g.globalAlpha=.6;g.fillRect(S/2*.84,-9,24,18)}g.restore()}
  g.globalAlpha=.35;g.lineWidth=3;
  for(let i=0;i<6;i++){g.save();g.rotate(i/6*TAU+.26);g.beginPath();g.moveTo(S/2*.34,0);g.lineTo(S/2*.78,0);g.stroke();g.restore()}
  g.globalAlpha=.4;g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU,r=S/2*.3;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.stroke();
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
}

/* ---------------- particles ---------------- */
const PN=2200,pPos=new Float32Array(PN*3),pCol=new Float32Array(PN*3),pVel=new Float32Array(PN*3),pBase=new Float32Array(PN*3),pLife=new Float32Array(PN),pMax=new Float32Array(PN),pGrav=new Float32Array(PN);
let pHead=0;
for(let i=0;i<PN;i++)pPos[i*3+1]=-999;
const pGeo=new THREE.BufferGeometry();
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const pMat=new THREE.PointsMaterial({size:.75,map:glowTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
const pPts=new THREE.Points(pGeo,pMat);pPts.frustumCulled=false;scene.add(pPts);
const _c=new THREE.Color();
function emit(x,y,z,vx,vy,vz,life,hex,grav){
  const i=pHead;pHead=(pHead+1)%PN;_c.set(hex);const j=i*3;
  pPos[j]=x;pPos[j+1]=y;pPos[j+2]=z;pVel[j]=vx;pVel[j+1]=vy;pVel[j+2]=vz;
  pBase[j]=_c.r;pBase[j+1]=_c.g;pBase[j+2]=_c.b;pLife[i]=pMax[i]=life;pGrav[i]=grav||0;
}
function burst(x,y,z,n,hex,sp,life,grav,up){
  for(let i=0;i<n;i++){const a=Math.random()*TAU,s=sp*(.3+Math.random()*.7),u=(up==null?.5:up);
    emit(x,y,z,Math.cos(a)*s,(Math.random()*u+.15)*sp*.7,Math.sin(a)*s,life*(.6+Math.random()*.6),hex,grav==null?12:grav)}
}
function ringBurst(x,y,z,n,hex,sp,life){
  for(let i=0;i<n;i++){const a=i/n*TAU;emit(x,y,z,Math.cos(a)*sp,.3,Math.sin(a)*sp,life,hex,0)}
}
function updateParticles(dt){
  for(let i=0;i<PN;i++){
    if(pLife[i]<=0)continue;const j=i*3;pLife[i]-=dt;
    if(pLife[i]<=0){pPos[j+1]=-999;pCol[j]=pCol[j+1]=pCol[j+2]=0;continue}
    pVel[j+1]-=pGrav[i]*dt;pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;
    if(pPos[j+1]<.05&&pGrav[i]>0){pPos[j+1]=.05;pVel[j+1]*=-.3;pVel[j]*=.7;pVel[j+2]*=.7}
    const f=pLife[i]/pMax[i];pCol[j]=pBase[j]*f;pCol[j+1]=pBase[j+1]*f;pCol[j+2]=pBase[j+2]*f;
  }
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
}
function clearParticles(){pLife.fill(0);pPos.fill(0);for(let i=0;i<PN;i++)pPos[i*3+1]=-999}


/* ---------------- ambient particles (per zone) ---------------- */
const AMB=[
  {rate:6,cols:[0xcfe86a,0xf2f09a],vy:[.05,.35],sp:.5,y:[.5,3.2],life:[3,5.5]},
  {rate:8,cols:[0xdfe89a,0xffffff],vy:[.1,.5],sp:.7,y:[.4,4],life:[3,5]},
  {rate:9,cols:[0x7fc8e8,0xb8e8ff],vy:[.25,.7],sp:.35,y:[.3,3.6],life:[3.5,5.5]},
  {rate:18,cols:[0xff8a3a,0xffc060],vy:[1.2,3.2],sp:.9,y:[.2,1.5],life:[1.8,3]},
  {rate:11,cols:[0xa88aff,0x7ae8ff],vy:[.1,.5],sp:.4,y:[.3,4.5],life:[3.5,6]},
  {rate:14,cols:[0xffe27a,0xcfe0ff],vy:[.3,1.6],sp:1.1,y:[.3,4],life:[1.2,2.4]},
  {rate:13,cols:[0xff3dd0,0x8a2ad0],vy:[.2,1.2],sp:.5,y:[.3,5],life:[2.5,4.5]},
  {rate:20,cols:[0xffffff,0xd8ecff],vy:[-.7,-.25],sp:.6,y:[2,7],life:[3,5]},
  {rate:12,cols:[0xe8c88a,0xffe2a8],vy:[.05,.5],sp:1.3,y:[.2,2.2],life:[2,3.5]},
  {rate:12,cols:[0xfff0b0,0xffffff,0xd8c8ff],vy:[.3,1.1],sp:.35,y:[.5,6],life:[3,5.5]}
];
let ambAcc=0,fireAcc=0;
function ambientFx(dt,zi,cx,cz){
  if(typeof nightK==='function'&&zi<=2){const nk=nightK();if(nk>.35){fireAcc+=dt*9*nk;while(fireAcc>=1){fireAcc-=1;const ang=Math.random()*TAU,r=Math.sqrt(Math.random())*22;emit(cx+Math.cos(ang)*r,rnd(.4,2.6),cz+Math.sin(ang)*r,rnd(-.35,.35),rnd(-.05,.25),rnd(-.35,.35),rnd(2.5,4.5),pick([0xe8ff7a,0xc8ff6a,0xfff0a0]),0)}}}
  const a=AMB[zi]||AMB[0];ambAcc+=dt*a.rate;
  while(ambAcc>=1){
    ambAcc-=1;const ang=Math.random()*TAU,r=Math.sqrt(Math.random())*26;
    emit(cx+Math.cos(ang)*r,rnd(a.y[0],a.y[1]),cz+Math.sin(ang)*r,rnd(-a.sp,a.sp),rnd(a.vy[0],a.vy[1]),rnd(-a.sp,a.sp),rnd(a.life[0],a.life[1]),pick(a.cols),0);
  }
}

/* ---------------- fx list (rings, telegraphs, slashes...) ---------------- */
const fxList=[];
function addFx(life,upd,done){const f={t:0,life,upd,done};fxList.push(f);return f}
function updateFx(dt){
  for(let i=fxList.length-1;i>=0;i--){
    const f=fxList[i];f.t+=dt;const k=Math.min(1,f.t/f.life);
    if(f.upd)f.upd(k,dt);
    if(f.t>=f.life){if(f.done)f.done();fxList.splice(i,1)}
  }
}
function clearFx(){fxList.length=0}
const shared={
  ringG:new THREE.RingGeometry(.9,1,48),discG:new THREE.CircleGeometry(1,40),
  sph:new THREE.SphereGeometry(1,12,10),box:new THREE.BoxGeometry(1,1,1)
};
function flatMat(hex,op){return new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:op==null?.8:op,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})}
function shockRing(x,z,r,hex,life,w){
  const m=new THREE.Mesh(shared.ringG,flatMat(hex,.9));m.rotation.x=-Math.PI/2;m.position.set(x,.15,z);entG.add(m);
  addFx(life||.4,k=>{const s=r*easeOut(k);m.scale.set(s,s,s);m.material.opacity=.9*(1-k)},()=>{entG.remove(m);m.material.dispose()});
}
function flashDisc(x,z,r,hex,life){
  const m=new THREE.Mesh(shared.discG,flatMat(hex,.6));m.rotation.x=-Math.PI/2;m.position.set(x,.12,z);m.scale.set(r,r,r);entG.add(m);
  addFx(life||.3,k=>{m.material.opacity=.6*(1-k)},()=>{entG.remove(m);m.material.dispose()});
}
/* impact star + directional sparks at a hit point */
function impactFlash(x,y,z,hex,size,life){
  const mt=new THREE.SpriteMaterial({map:glowTex,color:hex,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}),sp=new THREE.Sprite(mt);sp.position.set(x,y,z);sp.scale.set(size*.4,size*.4,1);entG.add(sp);
  addFx(life||.16,k=>{const q=size*(.4+.9*Math.sqrt(k));sp.scale.set(q,q,1);mt.opacity=.95*(1-k)},()=>{entG.remove(sp);mt.dispose()});
}
function hitSparks(x,y,z,dx,dz,hex,n,sp){
  const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  for(let i=0;i<n;i++){const a=rnd(-.9,.9),c=Math.cos(a),s2=Math.sin(a),vx=(dx*c-dz*s2)*sp*rnd(.5,1.2),vz=(dx*s2+dz*c)*sp*rnd(.5,1.2);emit(x,y+rnd(-.2,.3),z,vx,rnd(.5,3.5),vz,rnd(.18,.38),hex,14)}
}
function pillar(x,z,hex,h,life){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,h||14,12,1,true),flatMat(hex,.7));m.position.set(x,(h||14)/2,z);entG.add(m);
  addFx(life||.5,k=>{const s=1-k;m.scale.set(s*1.2+.2,1,s*1.2+.2);m.material.opacity=.7*(1-k)},()=>{entG.remove(m);m.geometry.dispose();m.material.dispose()});
}
function slashArc(x,z,face,range,arc,hex,life){
  const g=new THREE.Group();g.position.set(x,.5,z);g.rotation.y=face;
  const geo=new THREE.RingGeometry(range*.35,range,32,1,-Math.PI/2-arc/2,arc);
  const m=new THREE.Mesh(geo,flatMat(hex,.85));m.rotation.x=-Math.PI/2;g.add(m);entG.add(g);
  addFx(life||.22,k=>{const s=.85+k*.25;g.scale.set(s,1,s);m.material.opacity=.85*(1-k)},()=>{entG.remove(g);geo.dispose();m.material.dispose()});
}

/* ---------------- labels / damage numbers ---------------- */
const labelsEl=$('labels');
const dnPool=[],dnAct=[];
function dmgNum(x,y,z,txt,cls){
  let o;if(dnPool.length)o=dnPool.pop();else if(dnAct.length>46){o=dnAct.shift()}else{const el=document.createElement('div');labelsEl.appendChild(el);o={el}}
  o.el.className='dn '+(cls||'');o.el.textContent=txt;o.x=x+rnd(-.4,.4);o.y=y;o.z=z+rnd(-.2,.2);o.t=0;o.life=.85;o.vy=2.6;o.el.style.display='block';dnAct.push(o);
}
function updateDN(dt){
  for(let i=dnAct.length-1;i>=0;i--){
    const o=dnAct[i];o.t+=dt;o.y+=o.vy*dt;o.vy*=.94;
    if(o.t>=o.life){o.el.style.display='none';dnAct.splice(i,1);dnPool.push(o);continue}
    const s=toScreen(o.x,o.y,o.z);const sc=o.t<.1?1+(.1-o.t)*6:1;
    o.el.style.transform='translate('+(s.x|0)+'px,'+(s.y|0)+'px) translate(-50%,-50%) scale('+sc.toFixed(2)+')';
    o.el.style.opacity=o.t>.55?String(1-(o.t-.55)/.3):'1';
  }
}
function clearDN(){for(const o of dnAct){o.el.style.display='none';dnPool.push(o)}dnAct.length=0}
function makeLabel(text,cls){
  const el=document.createElement('div');el.className='nl '+(cls||'');el.textContent=text;labelsEl.appendChild(el);
  return{el,pos(x,y,z){const s=toScreen(x,y,z);if(!s.vis){el.style.display='none';return}el.style.display='block';el.style.transform='translate('+(s.x|0)+'px,'+(s.y|0)+'px) translate(-50%,-100%)'},remove(){el.remove()}};
}

/* ---------------- input ---------------- */
const keys={},mouse={x:innerWidth/2,y:innerHeight/2,down:false,gx:0,gz:1},mv={x:0,z:0,on:false,atk:false};
addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='INPUT')return;
  const k=e.key.toLowerCase();if(k===' '||k==='tab'||k.startsWith('arrow'))e.preventDefault();
  if(!keys[k]){keys[k]=true;if(window.onKeyPress)window.onKeyPress(k,e)}
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.down=false});
canvas.addEventListener('mousedown',e=>{if(e.button===0){mouse.down=true;auInit()}});
addEventListener('mouseup',e=>{if(e.button===0)mouse.down=false});
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
