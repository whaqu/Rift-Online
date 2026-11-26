/* ---------------- post processing: bloom + colour grade + vignette (setting: save.fx, default on) ---------------- */
const POST={ok:false,bad:false,w:0,h:0};
const FSV='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
function postMat(frag,uni){return new THREE.ShaderMaterial({uniforms:uni,vertexShader:FSV,fragmentShader:frag,depthTest:false,depthWrite:false,toneMapped:false})}
function postInit(){
  const isGL2=renderer.capabilities&&renderer.capabilities.isWebGL2;
  const opt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat};
  POST.rt=isGL2&&THREE.WebGLMultisampleRenderTarget?new THREE.WebGLMultisampleRenderTarget(4,4,opt):new THREE.WebGLRenderTarget(4,4,opt);
  if(POST.rt.samples!==undefined)POST.rt.samples=IS_TOUCH?2:4;
  POST.b1=new THREE.WebGLRenderTarget(4,4,opt);POST.b2=new THREE.WebGLRenderTarget(4,4,opt);
  POST.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);POST.scene=new THREE.Scene();
  POST.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),null);POST.quad.frustumCulled=false;POST.scene.add(POST.quad);
  POST.bright=postMat('uniform sampler2D tD;uniform float uTh;varying vec2 vUv;void main(){vec3 c=texture2D(tD,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));float k=smoothstep(uTh,uTh+.5,l);gl_FragColor=vec4(c*k,1.);}',{tD:{value:null},uTh:{value:.88}});
  POST.blur=postMat('uniform sampler2D tD;uniform vec2 uDir;varying vec2 vUv;void main(){vec3 c=texture2D(tD,vUv).rgb*.2270;'
    +'c+=texture2D(tD,vUv+uDir*1.3846).rgb*.3162;c+=texture2D(tD,vUv-uDir*1.3846).rgb*.3162;'
    +'c+=texture2D(tD,vUv+uDir*3.2308).rgb*.0703;c+=texture2D(tD,vUv-uDir*3.2308).rgb*.0703;gl_FragColor=vec4(c,1.);}',{tD:{value:null},uDir:{value:new THREE.Vector2()}});
  POST.comp=postMat(
    THREE.ShaderChunk.tonemapping_pars_fragment+'uniform float uSat;uniform float uCon;uniform float uVig;uniform sampler2D tD;uniform sampler2D tB;uniform float uB;uniform float uT;uniform vec2 uRes;varying vec2 vUv;'
    +'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}'
    +'void main(){vec3 c=texture2D(tD,vUv).rgb;vec3 b=texture2D(tB,vUv).rgb;c+=b*uB;'
    +'c=ACESFilmicToneMapping(c);float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,uSat);'
    +'c*=mix(vec3(.96,.985,1.04),vec3(1.025,1.005,.97),smoothstep(.12,.8,l));'
    +'c=clamp(c,0.,1.);c=mix(c,c*c*(3.-2.*c),uCon);'
    +'vec2 d=vUv-.5;d.x*=uRes.x/uRes.y;float v=smoothstep(1.05,.32,length(d));c*=mix(uVig,1.,v);'
    +'c+=(hash(vUv*uRes+uT)-.5)*.018;gl_FragColor=vec4(c,1.);}',
    {toneMappingExposure:{value:1},uSat:{value:1.1},uCon:{value:.3},uVig:{value:.62},tD:{value:null},tB:{value:null},uB:{value:.4},uT:{value:0},uRes:{value:new THREE.Vector2(1,1)}});
  POST.ok=true;
}
function postSize(){
  const v=new THREE.Vector2();renderer.getDrawingBufferSize(v);
  if(v.x===POST.w&&v.y===POST.h)return;POST.w=v.x;POST.h=v.y;
  POST.rt.setSize(v.x,v.y);const bw=Math.max(1,v.x>>2),bh=Math.max(1,v.y>>2);POST.b1.setSize(bw,bh);POST.b2.setSize(bw,bh);
  POST.comp.uniforms.uRes.value.set(v.x,v.y);POST.bw=bw;POST.bh=bh;
}
function postPass(mat,target){POST.quad.material=mat;renderer.setRenderTarget(target);renderer.render(POST.scene,POST.cam)}
function renderFrame(){
  if(!save.fx||POST.bad||!renderer.getDrawingBufferSize){renderer.render(scene,camera);return}
  try{
    if(!POST.ok)postInit();postSize();
    renderer.setRenderTarget(POST.rt);renderer.render(scene,camera);
    POST.bright.uniforms.uTh.value=TUNE.th;POST.bright.uniforms.tD.value=POST.rt.texture;postPass(POST.bright,POST.b1);
    for(let i=0;i<2;i++){
      POST.blur.uniforms.tD.value=POST.b1.texture;POST.blur.uniforms.uDir.value.set((1+i)/POST.bw,0);postPass(POST.blur,POST.b2);
      POST.blur.uniforms.tD.value=POST.b2.texture;POST.blur.uniforms.uDir.value.set(0,(1+i)/POST.bh);postPass(POST.blur,POST.b1);
    }
    {const u=POST.comp.uniforms;u.toneMappingExposure.value=TUNE.exp;u.uSat.value=TUNE.sat;u.uCon.value=TUNE.con;u.uVig.value=TUNE.vig;u.uB.value=TUNE.bloom}
    POST.comp.uniforms.tD.value=POST.rt.texture;POST.comp.uniforms.tB.value=POST.b1.texture;POST.comp.uniforms.uT.value=(POST.comp.uniforms.uT.value+1)%997;
    postPass(POST.comp,null);
  }catch(e){POST.bad=true;console.error('post fx disabled',e);try{renderer.setRenderTarget(null)}catch(_){}renderer.render(scene,camera)}
}
