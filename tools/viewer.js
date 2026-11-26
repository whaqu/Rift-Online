/* dev-only model viewer: open tools/viewer.html#mode (mode: row | close | tiers) */
addEventListener('load',()=>setTimeout(()=>{
  for(const el of document.body.children)if(el.tagName!=='CANVAS'&&el.tagName!=='SCRIPT')el.style.display='none';
  LOGIN.on=false;if(LOGIN.g)LOGIN.g.visible=false;
  const mode=(location.hash||'#row').slice(1),V=new THREE.Group();scene.add(V);
  const list=[];const C=Object.keys(CLS);
  const tiersOf=mode==='tiers'?[1,3,5,8]:null;
  if(tiersOf){const cls=C[(+new URLSearchParams(location.search).get('c'))||0];tiersOf.forEach((t,i)=>[0,1,2].forEach((ty,j)=>{const h=makeHeroFor(cls,cls,CLS[cls].col);applyWeaponLook(h,cls+'_'+t+(ty?'_'+ty:''));h.g.position.set((i-1.5)*3.2,0,(j-1)*3.4);V.add(h.g);list.push(h)}))}
  else C.forEach((c,i)=>{const h=makeHeroFor(c,c,CLS[c].col);applyWeaponLook(h,c+'_5');h.g.position.set(((i%5)-2)*2.6,0,Math.floor(i/5)*3.6-1.8);V.add(h.g);list.push(h)});
  V.position.set(0,0,11);let t=0;
  const lp=()=>{t+=.016;list.forEach(h=>{h.g.rotation.y=mode==='close'?.5:.35;animHeroFor(h,t,0,-1,false,1)});
    if(camera.clearViewOffset)camera.clearViewOffset();
    if(mode==='close'){camera.position.set(-2.6,2.4,7.8+11-3.6);camera.lookAt(-2.6,1.3,11-1.8)}
    else{camera.position.set(0,9,24);camera.lookAt(0,1,11)}
    camera.updateProjectionMatrix();camera.updateMatrixWorld();requestAnimationFrame(lp)};lp();
},800));
