/* ---------- gathering: cut weeds (grass) and chop trees -> materials; mastery speeds it up ---------- */
const GAT={act:null,cut:[],fall:[],pend:{weed:0,wood:0},busy:false,tf:0,_m:new THREE.Matrix4(),_r:new THREE.Matrix4(),_z:new THREE.Matrix4().makeScale(0,0,0)};
const gatLvNow=()=>gatLvOf(SES.pf&&SES.pf.gather?SES.pf.gather.xp:0);
function gatTime(n){const sp=gatSpeed(gatLvNow());return n.k==='weed'?Math.max(.2,.6/sp):Math.max(.35,(.9+.9*n.s)/sp)}
function nearNode(){
  if(!P||P.dead||UI.modal||GAT.act)return null;
  const cx=Math.floor(P.x/8),cz=Math.floor(P.z/8);let best=null,bd=1e9;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=WORLD.ngrid[(cx+i)+','+(cz+j)];if(!a)continue;
    for(const n of a){if(n.cut)continue;const reach=n.k==='weed'?1.9:2.5+n.s*.4,d=d2(n.x,n.z,P.x,P.z);if(d>=reach*reach)continue;const sc=Math.sqrt(d)-(n.k==='wood'?2.4:0);if(sc<bd){bd=sc;best=n}}}
  return best;
}
function startGather(n){if(!n||GAT.act||!P||P.dead)return;GAT.act={n,t:0,need:gatTime(n),px:P.x,pz:P.z,pt:0};P.face=Math.atan2(n.x-P.x,n.z-P.z)}
function cancelGather(){GAT.act=null}
function gatPart(n,fn){for(let q=0;q<n.parts.length;q++){const m=n.parts[q][0],i=n.parts[q][1];fn(m,i,q);m.instanceMatrix.needsUpdate=true}}
function cutNode(n){
  n.cut=n.k==='weed'?45:100;n.mats=[];
  for(const[m,i]of n.parts){const mm=new THREE.Matrix4();m.getMatrixAt(i,mm);n.mats.push(mm)}
  if(n.ob)n.ob.r=0;GAT.cut.push(n);GAT.fall.push({n,t:0,dur:n.k==='weed'?.16:.6,dir:Math.random()<.5?1:-1});
}
function tickGather(dt){
  if(!P)return;
  for(let i=GAT.fall.length-1;i>=0;i--){const f=GAT.fall[i],n=f.n;f.t+=dt;const u=Math.min(1,f.t/f.dur);
    gatPart(n,(m,idx,q)=>{
      if(u>=1){m.setMatrixAt(n.parts[q][1],GAT._z);return}
      if(n.k==='weed')GAT._r.makeScale(1,1-u,1);else GAT._r.makeRotationX(f.dir*u*u*1.5);
      GAT._m.copy(n.mats[q]).multiply(GAT._r);m.setMatrixAt(n.parts[q][1],GAT._m)});
    if(u>=1)GAT.fall.splice(i,1)}
  for(let i=GAT.cut.length-1;i>=0;i--){const n=GAT.cut[i];n.cut-=dt;if(n.cut>0)continue;
    if(GAT.fall.some(f=>f.n===n)){n.cut=.5;continue}
    gatPart(n,(m,idx,q)=>m.setMatrixAt(n.parts[q][1],n.mats[q]));if(n.ob)n.ob.r=n.or;n.cut=0;n.mats=null;GAT.cut.splice(i,1)}
  const a=GAT.act;
  if(a){
    if(P.dead||UI.modal||P.dashT>0||Math.hypot(P.x-a.px,P.z-a.pz)>.7){cancelGather()}
    else{
      a.t+=dt;a.pt-=dt;
      if(a.pt<=0){a.pt=a.n.k==='weed'?.1:.13;const wc=a.n.k==='weed'?[0x6fcf4a,0x9be063,0x4fae3a]:[0xc8935a,0x8a5e36,0xe0b27a];
        emit(a.n.x+rnd(-.4,.4),a.n.k==='weed'?.4:rnd(.5,1.6),a.n.z+rnd(-.4,.4),rnd(-1.6,1.6),rnd(1.2,2.8),rnd(-1.6,1.6),rnd(.4,.7),pick(wc),9);
        sfx(a.n.k==='weed'?'swing':'hit',.35)}
      if(a.t>=a.need){const n=a.n;cancelGather();cutNode(n);GAT.pend[n.k]++;
        dmgNum(n.x,n.k==='weed'?1.2:2.4,n.z,'+'+MATS[n.k].name,'gold');sfx('pickup');
        for(let i=0;i<(n.k==='weed'?6:12);i++)emit(n.x,rnd(.3,1.4),n.z,rnd(-2.2,2.2),rnd(1,3.4),rnd(-2.2,2.2),rnd(.5,.9),pick(n.k==='weed'?[0x6fcf4a,0x9be063]:[0xc8935a,0xe0b27a]),9)}
    }
  }
  GAT.tf+=dt;if(GAT.tf>1.2){GAT.tf=0;flushGather()}
}
async function flushGather(){
  const w=GAT.pend.weed,d=GAT.pend.wood;if(GAT.busy||!(w+d)||!SES.token)return;
  if(typeof claiming!=='undefined'&&claiming)return;
  GAT.pend.weed=GAT.pend.wood=0;GAT.busy=true;const lv0=gatLvNow();
  try{
    const r=await API.call('gather',w,d);
    if(r&&r.up||gatLvNow()>lv0){const lv=gatLvNow();UI.toast('채집 숙련 Lv.'+lv+' 달성! 채집 속도 +'+Math.round((gatSpeed(lv)-1)*100)+'% · 추가 획득 '+(gatDouble(lv)*100).toFixed(1)+'%');sfx('level')}
    if(r&&((r.weed|0)>w||(r.wood|0)>d))dmgNum(P.x,2.8,P.z,'추가 획득!','gold');
    UI.refreshHud();UI.afterProfile&&UI.afterProfile();if(UI.modal&&UI.rerender)UI.rerender();
  }catch(e){if(/NET/.test(e.message)){GAT.pend.weed+=w;GAT.pend.wood+=d}}
  GAT.busy=false;if(GAT.pend.weed+GAT.pend.wood>0)setTimeout(flushGather,0);
}
