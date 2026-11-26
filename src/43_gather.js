/* ---------- gathering by normal attacks ----------
   weeds: any normal attack cuts every weed it touches (pierces) -> instant material, regrow animation later
   trees: 3-5 normal-attack hits (shakes each time) -> falls -> sapling -> grows back
   mastery (server-stored): more chop power per hit, bonus yield chance */
const GAT={anim:[],weedAnim:[],pend:{weed:0,wood:0},busy:false,tf:0,wt:0,sw:0,_m:new THREE.Matrix4(),_a:new THREE.Matrix4(),_b:new THREE.Matrix4(),_z:new THREE.Matrix4().makeScale(0,0,0),_v:new THREE.Vector3()};
const gatLvNow=()=>gatLvOf(SES.pf&&SES.pf.gather?SES.pf.gather.xp:0);
const GT_WEED_WAIT=[22,38],GT_FALL=.8,GT_SAP_WAIT=4,GT_GROW=85,GT_WEED_GROW=4.5;
function gatBase(n){if(!n.mats){n.mats=[];for(const[m,i]of n.parts){const mm=new THREE.Matrix4();m.getMatrixAt(i,mm);n.mats.push(mm)}}}
function gatSet(n,mf){for(let q=0;q<n.parts.length;q++){const m=n.parts[q][0],i=n.parts[q][1];m.setMatrixAt(i,mf(q));m.instanceMatrix.needsUpdate=true}}
function gatHide(n){gatSet(n,()=>GAT._z)}
function gatShow(n){gatSet(n,q=>n.mats[q])}
/* world-space transform about the node's base: Tn * X * Tn^-1 * M0 */
function gatAbout(n,q,X){const M=GAT._m;M.makeTranslation(n.x,0,n.z).multiply(X);GAT._a.makeTranslation(-n.x,0,-n.z);M.multiply(GAT._a).multiply(n.mats[q]);return M}
function treeHp(n){return n.hp0||(n.hp0=3+Math.min(2,Math.floor((n.s-.8)/.7*3)));}
function nodeHit(n,dmg,f,fromX,fromZ){
  if(n.st)return false;
  if(n.k==='weed'){cutWeed(n);return true}
  gatBase(n);if(n.hp==null)n.hp=treeHp(n);n.hp-=dmg;
  n.sh={t:0,dur:.42,amp:.07+Math.random()*.03,ph:Math.random()*6.28,dx:n.x-fromX,dz:n.z-fromZ};GAT.anim.indexOf(n)<0&&GAT.anim.push(n);
  sfx('hit',.5);for(let i=0;i<7;i++)emit(n.x+rnd(-.6,.6),rnd(1.2,3.2)*Math.min(1.3,n.s),n.z+rnd(-.6,.6),rnd(-1.6,1.6),rnd(.2,1.6),rnd(-1.6,1.6),rnd(.5,.9),n.leaf||(zoneAt(n.x,n.z).id===2?0x55556a:zoneAt(n.x,n.z).id===7?0xeaf4ff:0x5aae4e),7);
  if(n.hp<=.001){n.st='fall';n.sh=null;n.ft=0;const l=Math.hypot(n.x-fromX,n.z-fromZ)||1;n.fx=(n.x-fromX)/l;n.fz=(n.z-fromZ)/l;if(n.ob)n.ob.r=0;sfx('boom',.45);
    GAT.pend.wood++;dmgNum(n.x,3,n.z,'+'+MATS.wood.name,'gold');cam.shake=Math.max(cam.shake,.28)}
  return true;
}
function cutWeed(n){
  gatBase(n);n.st='gone';n.ft=0;n.wt=GT_WEED_WAIT[0]+Math.random()*(GT_WEED_WAIT[1]-GT_WEED_WAIT[0]);GAT.weedAnim.push(n);GAT.pend.weed++;GAT.sw++;
  if(Math.random()<.5)emit(n.x,.3,n.z,rnd(-1.5,1.5),rnd(1,2.6),rnd(-1.5,1.5),rnd(.4,.7),pick([0x6fcf4a,0x9be063,0x4fae3a]),9);
}
/* every nearby node inside the swing's cone (weeds pierce, each tree takes one hit) */
function gatherArc(f,range,arc,power){
  if(!P)return;const cx=Math.floor(P.x/8),cz=Math.floor(P.z/8),R=Math.ceil((range+3)/8),dmg=gatPower()*(power||1);let any=0;
  for(let i=-R;i<=R;i++)for(let j=-R;j<=R;j++){const a=WORLD.ngrid[(cx+i)+','+(cz+j)];if(!a)continue;
    for(const n of a){if(n.st)continue;const dx=n.x-P.x,dz=n.z-P.z,d=Math.hypot(dx,dz),rr=n.k==='weed'?0:.5+n.s*.5;
      if(d>range+.4+rr)continue;if(d>1.1&&Math.abs(angDiff(f,Math.atan2(dx,dz)))>arc/2+Math.atan2(rr+.3,Math.max(d,.5)))continue;
      if(nodeHit(n,dmg,f,P.x,P.z))any++}}
  gatNotify();return any;
}
/* ranged normal attacks: a strip in front; weeds pierce, only the nearest tree is struck */
function gatherLine(dx,dz,len,power){
  if(!P)return;const f=Math.atan2(dx,dz),cx=Math.floor((P.x+dx*len/2)/8),cz=Math.floor((P.z+dz*len/2)/8),R=Math.ceil(len/16)+1,dmg=gatPower()*(power||1);let tree=null,td=1e9;
  for(let i=-R;i<=R;i++)for(let j=-R;j<=R;j++){const a=WORLD.ngrid[(cx+i)+','+(cz+j)];if(!a)continue;
    for(const n of a){if(n.st)continue;const rx=n.x-P.x,rz=n.z-P.z,al=rx*dx+rz*dz;if(al<-.3||al>len)continue;const lat=Math.abs(rx*dz-rz*dx),w=n.k==='weed'?1.1:.8+n.s*.5;if(lat>w)continue;
      if(n.k==='weed')nodeHit(n,dmg,f,P.x,P.z);else if(al<td){td=al;tree=n}}}
  if(tree)nodeHit(tree,dmg,f,P.x,P.z);gatNotify();
}
function gatPower(){return gatSpeed(gatLvNow())}
function gatNotify(){if(GAT.sw>0){dmgNum(P.x,2.3,P.z,'+'+MATS.weed.name+(GAT.sw>1?' x'+GAT.sw:''),'gold');sfx('pickup',.35);GAT.sw=0}}
function tickGather(dt){
  if(!P)return;
  /* trees: shake / fall / sapling / grow (per frame; only a few meshes) */
  for(let i=GAT.anim.length-1;i>=0;i--){const n=GAT.anim[i];let done=false;
    if(n.st==='fall'){n.ft+=dt;const u=Math.min(1,n.ft/GT_FALL),th=Math.min(1.5,u*u*1.9);GAT._b.makeRotationAxis(GAT._v.set(n.fz,0,-n.fx),th);
      gatSet(n,q=>gatAbout(n,q,GAT._b));
      if(u>=1){n.st='wait';n.wt=GT_SAP_WAIT;gatHide(n);for(let k=0;k<10;k++)emit(n.x+rnd(-1,1),rnd(.2,1),n.z+rnd(-1,1),rnd(-1.2,1.2),rnd(.5,1.6),rnd(-1.2,1.2),rnd(.5,.9),0x8a7a5a,6)}}
    else if(n.st==='wait'){n.wt-=dt;if(n.wt<=0){n.st='sap';n.gt=0}}
    else if(n.st==='sap'){n.gt+=dt;const u=Math.min(1,n.gt/GT_GROW),e=u*u*(3-2*u),sc=.07+.93*e;GAT._b.makeScale(sc,sc,sc);gatSet(n,q=>gatAbout(n,q,GAT._b));if(n.ob)n.ob.r=n.or*Math.max(0,(e-.25)/.75);
      if(u>=1){n.st=null;n.hp=null;n.hp0=3+Math.floor(Math.random()*3);gatShow(n);if(n.ob)n.ob.r=n.or;done=true}}
    else if(n.sh){const s=n.sh;s.t+=dt;const u=s.t/s.dur;
      if(u>=1){n.sh=null;gatShow(n);done=true}
      else{const k=Math.exp(-4*u)*Math.sin(u*34+s.ph),l=Math.hypot(s.dx,s.dz)||1;GAT._b.makeRotationAxis(GAT._v.set(s.dz/l,0,-s.dx/l),k*s.amp*3.2);gatSet(n,q=>gatAbout(n,q,GAT._b))}}
    else done=true;
    if(done)GAT.anim.splice(i,1)}
  /* weeds: updated at ~12 Hz (their meshes hold thousands of instances) */
  GAT.wt+=dt;if(GAT.wt>=.083){const step=GAT.wt;GAT.wt=0;
    for(let i=GAT.weedAnim.length-1;i>=0;i--){const n=GAT.weedAnim[i];
      if(n.st==='gone'){n.ft+=step;const u=Math.min(1,n.ft/.14);GAT._b.makeScale(1+.2*u,Math.max(.001,1-u),1+.2*u);gatSet(n,q=>gatAbout(n,q,GAT._b));if(u>=1){gatHide(n);n.st='wait';n.wt-=n.ft}}
      else if(n.st==='wait'){n.wt-=step;if(n.wt<=0){n.st='sap';n.gt=0}}
      else if(n.st==='sap'){n.gt+=step;const u=Math.min(1,n.gt/GT_WEED_GROW),e=1-Math.pow(1-u,3),o=u>.7?Math.sin((u-.7)/.3*Math.PI)*.08:0,sc=Math.max(.02,e+o);
        GAT._b.makeScale(sc,sc,sc);gatSet(n,q=>gatAbout(n,q,GAT._b));if(u>=1){n.st=null;gatShow(n);GAT.weedAnim.splice(i,1)}}}}
  GAT.tf+=dt;if(GAT.tf>1.2){GAT.tf=0;flushGather()}
}
async function flushGather(){
  const w=GAT.pend.weed,d=GAT.pend.wood;if(GAT.busy||!(w+d)||!SES.token)return;
  if(typeof claiming!=='undefined'&&claiming)return;
  GAT.pend.weed=GAT.pend.wood=0;GAT.busy=true;const lv0=gatLvNow();
  try{
    const r=await API.call('gather',Math.min(30,w),Math.min(30,d));
    if(w>30)GAT.pend.weed+=w-30;if(d>30)GAT.pend.wood+=d-30;
    if(r&&r.up||gatLvNow()>lv0){const lv=gatLvNow();UI.toast('채집 숙련 Lv.'+lv+' 달성! 벌목 위력 +'+Math.round((gatSpeed(lv)-1)*100)+'% · 추가 획득 '+(gatDouble(lv)*100).toFixed(1)+'%');sfx('level')}
    if(r&&((r.weed|0)>Math.min(30,w)||(r.wood|0)>Math.min(30,d)))dmgNum(P.x,2.8,P.z,'추가 획득!','gold');
    UI.refreshHud();UI.afterProfile&&UI.afterProfile();if(UI.modal&&UI.rerender)UI.rerender();
  }catch(e){if(/NET/.test(e.message)){GAT.pend.weed+=w;GAT.pend.wood+=d}}
  GAT.busy=false;if(GAT.pend.weed+GAT.pend.wood>0)setTimeout(flushGather,0);
}
