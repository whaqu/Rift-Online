/* dev-only model viewer: open tools/viewer.html#mode (mode: row | close | tiers) */
addEventListener('load',()=>setTimeout(()=>{
  try{for(const el of document.body.children)if(el.tagName!=='SCRIPT'&&!el.contains(canvas)&&el!==canvas)el.style.display='none';
  LOGIN.on=false;if(LOGIN.g)LOGIN.g.visible=false;
  const Q=new URLSearchParams(location.search),mode=Q.get('m')||(location.hash||'#row').slice(1),V=new THREE.Group();scene.add(V);
  const list=[];const WV={town:[0],house:[0],forest:[1,2.2,5],dead:[2,1,5],snow:[7,2.5,6]};const C=Object.keys(CLS);
  const tiersOf=mode==='tiers'?[1,3,5,8]:null;
  if(tiersOf){const cls=C[(+Q.get('c'))||0];tiersOf.forEach((t,i)=>[0,1,2].forEach((ty,j)=>{const h=makeHeroFor(cls,cls,CLS[cls].col);applyWeaponLook(h,cls+'_'+t+(ty?'_'+ty:''));h.g.position.set((i-1.5)*3.2,0,(j-1)*3.4);V.add(h.g);list.push(h)}))}
  else if(!WV[mode])C.forEach((c,i)=>{const h=makeHeroFor(c,c,CLS[c].col);applyWeaponLook(h,c+'_5');h.g.position.set(((i%5)-2)*2.6,0,Math.floor(i/5)*3.6-1.8);V.add(h.g);list.push(h)});
  V.position.set(0,0,11);let t=0;const one=Q.get('one');
  if(one!=null)list.forEach((h,i)=>h.g.visible=i==+one);
  const setCam=()=>{if(camera.clearViewOffset)camera.clearViewOffset();
    if(one!=null){const h=list[+one],p=new THREE.Vector3();h.g.getWorldPosition(p);const ry=+(Q.get('ry')||0.5);camera.position.set(p.x+Math.sin(ry)*5.2,p.y+2.2,p.z+Math.cos(ry)*5.2);camera.lookAt(p.x,p.y+1.25,p.z)}
    else if(WV[mode]){const [zi,ang,ht]=WV[mode],r=zi?(ZONES[zi].r0+ZONES[zi].r1)/2:0,cx=Math.cos(ang)*r,cz=Math.sin(ang)*r;
      if(!zi&&mode==='house'){camera.position.set(4,3.2,-6.5);camera.lookAt(0,2.6,-15)}else if(!zi){camera.position.set(-6,7,16);camera.lookAt(-12,2,-4)}else{camera.position.set(cx,ht,cz);camera.lookAt(cx+Math.cos(ang+1.3)*20,1.5,cz+Math.sin(ang+1.3)*20)}}
    else if(mode==='tiers'){camera.position.set(0,10,25);camera.lookAt(0,1,11)}
    else{camera.position.set(0,6,22);camera.lookAt(0,1.2,11)}
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();camera.updateMatrixWorld()};
  const r0=renderer.render.bind(renderer);renderer.render=(sc,c)=>{setCam();r0(sc,camera)};
  const lp=()=>{t+=.016;list.forEach(h=>{h.g.rotation.y=one!=null?0:.35;animHeroFor(h,t,0,-1,false,1)});requestAnimationFrame(lp)};lp();
  document.title='VIEWER OK '+(renderer.getContext()?'gl':'nogl');}catch(e){document.title='VIEWER ERR '+e.message}
},800));
