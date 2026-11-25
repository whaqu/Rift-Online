// Minimal THREE + DOM stubs so game logic can be smoke-tested in node (no rendering).
class Vec{constructor(x,y,z){this.x=x||0;this.y=y||0;this.z=z||0}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}setScalar(s){this.x=this.y=this.z=s;return this}project(){this.z=0;return this}unproject(){this.x=(this.x)*10;this.y=-5;this.z=-5;return this}clone(){return new Vec(this.x,this.y,this.z)}}
class Col{constructor(h){this.r=1;this.g=1;this.b=1;this.h=h||0}set(h){this.h=h;return this}setHex(h){this.h=h;return this}getHex(){return this.h}copy(c){this.h=c.h;return this}lerp(c,k){return this}}
class O3{constructor(){this.position=new Vec();this.rotation=new Vec();this.scale=new Vec(1,1,1);this.children=[];this.parent=null;this.userData={};this.visible=true;this.castShadow=false;this.receiveShadow=false}
 add(...a){for(const c of a){if(c.parent)c.parent.remove(c);c.parent=this;this.children.push(c)}return this}
 remove(c){const i=this.children.indexOf(c);if(i>=0){this.children.splice(i,1);c.parent=null}return this}
 traverse(cb){cb(this);for(const c of this.children.slice())c.traverse(cb)}
 lookAt(){}updateMatrixWorld(){}updateMatrix(){this.matrix=this.matrix||{}}}
class Mesh extends O3{constructor(g,m){super();this.geometry=g;this.material=m;this.isMesh=true}}
class Sprite extends O3{constructor(m){super();this.material=m;this.isSprite=true}}
class Mat{constructor(p){Object.assign(this,p||{});this.emissive=new Col(p&&p.emissive||0);this.color=new Col(p&&p.color||0);this.emissiveIntensity=(p&&p.emissiveIntensity)||0;this.userData={}}clone(){const m=new Mat();Object.assign(m,this);m.emissive=new Col(this.emissive.h);m.color=new Col(this.color.h);m.userData={};return m}dispose(){}}
class Geo{constructor(){this.attributes={};this.userData={}}computeBoundingBox(){this.boundingBox={min:new Vec(-.5,-.5,-.5),max:new Vec(.5,.5,.5)}}dispose(){}rotateX(){return this}rotateY(){return this}rotateZ(){return this}translate(){return this}setAttribute(k,v){this.attributes[k]=v}}
class Attr{constructor(a,n){this.array=a;this.needsUpdate=false}}
class PlaneG extends Geo{constructor(w,h,sx,sz){super();const n=((sx||1)+1)*((sz||1)+1);const a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=(i%((sx||1)+1))-(sx||1)/2;a[i*3+2]=Math.floor(i/((sx||1)+1))-(sz||1)/2}this.attributes.position={array:a,count:n,getX:i=>a[i*3],getZ:i=>a[i*3+2]}}}
class InstM extends O3{constructor(g,m,n){super();this.material=m;this.count=n;this.instanceMatrix={needsUpdate:false};this.isMesh=true}setMatrixAt(){}setColorAt(){this.instanceColor=this.instanceColor||{needsUpdate:false}}}
const base={PlaneGeometry:PlaneG,InstancedMesh:InstM,Vector3:Vec,Color:Col,Object3D:O3,Group:class extends O3{},Mesh,Sprite,Points:class extends O3{},Scene:class extends O3{},
 PerspectiveCamera:class extends O3{constructor(){super();this.aspect=1;this.fov=40}updateProjectionMatrix(){}},
 HemisphereLight:class extends O3{constructor(){super();this.color=new Col();this.groundColor=new Col()}},
 DirectionalLight:class extends O3{constructor(){super();this.color=new Col();this.target=new O3();this.shadow={mapSize:new Vec(),camera:{updateProjectionMatrix(){}}}}},
 PointLight:class extends O3{},
 WebGLRenderer:class{constructor(){this.shadowMap={}}setPixelRatio(){}setSize(){}render(){}},
 BufferAttribute:Attr,BufferGeometry:Geo,CanvasTexture:class{constructor(){this.repeat={set(){}}}},FogExp2:class{constructor(){this.color=new Col()}},RepeatWrapping:1,
 AdditiveBlending:1,DoubleSide:2,PCFSoftShadowMap:3};
global.THREE=new Proxy(base,{get(t,k){if(k in t)return t[k];if(typeof k==='string'){if(k.endsWith('Geometry'))return Geo;if(k.endsWith('Material')){return k==='SpriteMaterial'||k==='MeshBasicMaterial'||k==='MeshStandardMaterial'||k==='PointsMaterial'?Mat:Mat}}return class extends O3{}}});
THREE.Mesh=Mesh;
const els={};
function el(id){
  const e={id,style:{},classList:{_s:new Set(),add(c){this._s.add(c)},remove(c){this._s.delete(c)},toggle(c,f){f?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},children:[],textContent:'',innerHTML:'',value:'',className:'',
   appendChild(c){this.children.push(c);return c},removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c},remove(){},querySelector(){return el('q'+id)},addEventListener(){},get firstElementChild(){return el('f'+id)},get lastElementChild(){return el('l'+id)},focus(){},blur(){},getBoundingClientRect(){return{left:0,top:0,width:100,height:100}},setAttribute(){},click(){this.onclick&&this.onclick()},getContext(){return new Proxy({},{get:(t,k)=>(k==='createRadialGradient'||k==='createLinearGradient')?()=>({addColorStop(){}}):()=>{}})}};
  e.width=e.height=0;return e;
}
global.window=global;
global.document={getElementById(id){return els[id]||(els[id]=el(id))},createElement(t){return el(t)},head:el('head'),body:el('body'),hidden:false,addEventListener(){},activeElement:null};
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}};
global.navigator={maxTouchPoints:0};global.matchMedia=()=>({matches:false});
global.fetch=()=>Promise.reject(new Error('no net'));
global.innerWidth=1280;global.innerHeight=720;global.devicePixelRatio=1;
global.addEventListener=()=>{};
global.requestAnimationFrame=()=>{};global.confirm=()=>true;
global.AudioContext=undefined;
global.__RW_TEST=true;
global.__els=els;
