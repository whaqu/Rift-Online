/* ---------------- duels: request / accept / fight / spectate ----------------
   Each fighter owns his own HP. The opponent is represented locally by an invisible proxy "mob", so every attack and skill works
   unchanged; hitting the proxy sends the damage to the opponent. Only the loser reports the result to the server. */
const DUEL_K=.25,DUEL_TIME=120,DUEL_POINT=300;
const DU={on:false,role:null,id:null,a:null,b:null,opp:null,x:1300,z:0,R:13,ph:'idle',t:0,pt:0,prox:null,out:0,flush:0,back:null,pend:null,ask:null,arena:null,hud:null,seen:0};
const DUATMO={bg:0x8ab8e6,sky:0xdcecff,gr:0x6a7a58,hi:.72,sun:.72,sc:0xfff2d6,rc:0x9ab8ff,ri:.4,fd:.0034};
const duFree=()=>!DU.on&&!DG.on&&!NET.party&&P&&!P.dead;
function duelClampXZ(e){const dx=e.x-DU.x,dz=e.z-DU.z,d=Math.hypot(dx,dz),lim=DU.R-.8;if(d>lim){e.x=DU.x+dx*lim/d;e.z=DU.z+dz*lim/d}}
/* who is drawn: inside a duel only its two fighters, outside nobody who is fighting */
function duelShows(n){return DU.on?(n===DU.a||n===DU.b):!(NET.peers[n]&&NET.peers[n].du)}

/* ---------- arena: octagonal stone floor, stepped stands, arched walls, two pillars, floating isles in the sky ---------- */
function duelFloorTex(){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
  if(x&&x.arc){
    x.fillStyle='#9d8f74';x.fillRect(0,0,512,512);
    x.strokeStyle='rgba(90,78,58,.35)';x.lineWidth=2;for(let i=0;i<=512;i+=40){x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke()}
    const ring=(r,w,col)=>{x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.arc(256,256,r,0,TAU);x.stroke()};
    x.fillStyle='#86765a';x.beginPath();x.arc(256,256,200,0,TAU);x.fill();
    ring(200,12,'#4a3e2a');ring(180,3,'#d8caa6');ring(142,10,'#53452e');ring(96,4,'#4a3e2a');ring(60,9,'#5e4c30');
    for(let i=0;i<48;i++){const a=i/48*TAU;x.strokeStyle='#6e6048';x.lineWidth=3;x.beginPath();x.moveTo(256+Math.cos(a)*144,256+Math.sin(a)*144);x.lineTo(256+Math.cos(a)*178,256+Math.sin(a)*178);x.stroke()}
    for(let i=0;i<8;i++){const a=i/8*TAU;x.fillStyle='#ddd0ac';x.beginPath();x.arc(256+Math.cos(a)*119,256+Math.sin(a)*119,13,0,TAU);x.fill()}
    x.fillStyle='#5a4a30';x.beginPath();x.arc(256,256,34,0,TAU);x.fill();x.strokeStyle='#d8b86a';x.lineWidth=3;
    for(let i=0;i<16;i++){const a=i/16*TAU;x.beginPath();x.moveTo(256,256);x.lineTo(256+Math.cos(a)*32,256+Math.sin(a)*32);x.stroke()}
  }
  return new THREE.CanvasTexture(c);
}
function duelArena(){
  if(DU.arena)return DU.arena;
  const g=grp(DU.x,0,DU.z,scene),R=DU.R;
  const stone=M(0xb8ae98,{roughness:.95}),stone2=M(0x948a74,{roughness:.95}),dark=M(0x6c6456),grass=M(0x6f9a45,{roughness:1}),rock=M(0x7a7266,{roughness:1}),shade=M(0x39404a);
  const cyl=(rt,rb,h,n,m,x,y,z,p)=>{const o=mesh(new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z,p||g,false);o.receiveShadow=true;return o};
  /* the arena itself floats: grass shelf on a rock root */
  cyl(R+12,R+11,.6,24,grass,0,-.85,0);cyl(R+11,3,15,10,rock,0,-8.6,0);
  const floor=mesh(new THREE.CircleGeometry(R+.4,8),new THREE.MeshStandardMaterial({map:duelFloorTex(),roughness:.95}),0,.02,0,g,false);
  floor.rotation.x=-Math.PI/2;floor.rotation.z=Math.PI/8;floor.receiveShadow=true;
  /* stepped stands on the eight sides, with two entrances (left/right) */
  for(let s=0;s<8;s++){
    const an=s/8*TAU,side=grp(0,0,0,g);side.rotation.y=an;
    const low=Math.abs(an)<.1,gate=Math.abs(an-Math.PI/2)<.1||Math.abs(an-Math.PI*1.5)<.1,tiers=low?2:4;   // an=0 faces the camera: keep it low
    for(let t=0;t<tiers;t++){
      const d=R+.6+t*1.25,w=2*d*Math.tan(Math.PI/8)+.1,h=.4+t*.45,m=t%2?stone2:stone;
      if(gate){for(const k of[-1,1])BX(w*.36,h,1.25,m,k*w*.32,h/2-.1,d,side)}else BX(w,h,1.25,m,0,h/2-.1,d,side);
    }
  }
  /* two-storey arched colonnades left and right */
  const arcade=(x0,z0,ry,n)=>{const w=grp(x0,0,z0,g);w.rotation.y=ry;
    for(let f=0;f<2;f++){const y=f*3.7;
      BX(n*2.5+.6,.45,1.5,stone2,0,y+3.45,0,w);BX(n*2.5,3.2,.4,shade,0,y+1.6,-.55,w);
      for(let i=0;i<=n;i++){const x=(i-n/2)*2.5;BX(.55,3.3,1.2,stone,x,y+1.6,0,w);cyl(.2,.22,2.6,8,stone2,x,y+1.45,.72,w)}
      for(let i=0;i<n;i++){const x=(i-n/2+.5)*2.5;mesh(new THREE.TorusGeometry(.95,.24,5,12,Math.PI),stone,x,y+2.2,.3,w,false)}
    }
    BX(n*2.5+1,.35,1.8,stone,0,7.55,0,w);
  };
  arcade(-(R+6.4),-4,Math.PI/2,5);arcade(R+6.4,-4,-Math.PI/2,5);arcade(0,-(R+7),0,5);
  /* two tall pillars at the back */
  for(const sx of[-1,1]){const x=sx*8.5,z=-(R+6.5);BX(1.5,.7,1.5,dark,x,.35,z,g);cyl(.45,.55,8,10,stone,x,4.6,z);BX(1.3,.5,1.3,stone2,x,8.8,z,g);SP(.35,EM(0xffd27a,1),x,9.4,z,g,8,6)}
  /* floating isles, rock spires and clouds around (below the arena, so the high camera sees them) */
  for(const[x,z,y,r]of[[-9,-34,-7,4.5],[17,-31,-11,3],[-34,6,-12,3.5],[33,14,-9,4],[2,-48,-6,6],[-26,-24,-16,2.5],[27,-12,-15,2]]){
    cyl(r,r*.9,.5,9,grass,x,y,z);cyl(r*.9,.2,r*2.2,7,rock,x,y-r*1.1-.2,z);
    if(r>3.4){BX(r*.8,r*.45,r*.5,stone,x,y+r*.22,z,g);CN(r*.35,r*.5,dark,x,y+r*.7,z,g,4)}
  }
  for(let i=0;i<26;i++){const a=i*2.4,r=R+17+(i*7)%22,s=glow(0xffffff,9+(i%4)*3,.5);s.position.set(Math.cos(a)*r,-9-(i%3)*3,Math.sin(a)*r);g.add(s)}
  g.visible=false;DU.arena={g};return DU.arena;
}

/* ---------- messages ---------- */
function duelRequest(name){
  if(!NET.on)return;const p=NET.peers[name];
  if(!duFree()){UI.toast(NET.party?'파티 중에는 결투할 수 없습니다':'지금은 결투를 신청할 수 없습니다');return}
  if(!p||p.du){UI.toast('상대가 결투를 받을 수 없습니다');return}
  DU.pend={to:name,id:Math.random().toString(36).slice(2,10)+Date.now().toString(36),at:Date.now()};
  netSend('dq',{f:SES.name,t:name,id:DU.pend.id});UI.toast(name+'님에게 결투를 신청했습니다');
}
const duelNo=(to,why)=>netSend('dx',{f:SES.name,t:to,why});
function onDuelAsk(d){
  if(!d||d.t!==SES.name||typeof d.f!=='string'||typeof d.id!=='string'||!NET.peers[d.f])return;
  if(!duFree()||UI.trade){duelNo(d.f,'상대가 지금은 결투할 수 없습니다');return}
  DU.ask={from:d.f,id:d.id,at:Date.now()};UI.duelInvite(d.f);
}
function duelAccept(){
  const a=DU.ask;DU.ask=null;if(!a)return;
  if(!duFree()||!NET.peers[a.from]){UI.toast('결투를 시작할 수 없습니다');duelNo(a.from,'상대가 결투를 시작할 수 없습니다');return}
  netSend('da',{f:SES.name,t:a.from,id:a.id});duelStart(a.id,a.from,SES.name);
}
function duelDecline(){const a=DU.ask;DU.ask=null;if(a)duelNo(a.from,SES.name+'님이 결투를 거절했습니다')}
function onDuelYes(d){
  const q=DU.pend;if(!d||d.t!==SES.name||!q||d.id!==q.id||d.f!==q.to||Date.now()-q.at>25000)return;
  DU.pend=null;
  if(!duFree()){netSend('de',{id:q.id,cancel:1,f:SES.name});return}
  duelStart(q.id,SES.name,q.to);
}
function onDuelNo(d){if(d&&d.t===SES.name&&DU.pend&&DU.pend.to===d.f){DU.pend=null;UI.toast(String(d.why||'결투가 거절되었습니다').slice(0,60))}}

/* ---------- enter / leave ---------- */
function duelEnter(){
  if(GUIDE.id)guideStop();
  const A=duelArena();A.g.visible=true;worldG.visible=false;skReset();resetMobs();
  for(const p of DGP)if(p.label.el)p.label.el.style.display='none';
  const mini=$('mini');if(mini&&mini.style)mini.style.display='none';
  UI.zone=-1;duelHud(true);sfx('level');
}
function duelStart(id,a,b){
  DU.on=true;DU.role='fight';DU.id=id;DU.a=a;DU.b=b;DU.opp=a===SES.name?b:a;DU.ph='count';DU.pt=3;DU.t=0;DU.out=0;DU.prox=null;DU.res=null;DU.seen=Date.now();
  DU.back={x:P.x,z:P.z};UI.close();duelEnter();duelClearFx();
  P.recall=0;P.x=DU.x+(a===SES.name?-6:6);P.z=DU.z;P.vx=P.vz=0;P.face=a===SES.name?Math.PI/2:-Math.PI/2;P.hp=S.maxHp;P.shield=0;P.iframes=0;cam.x=P.x;cam.z=P.z;
  for(const k of['q','e','r','f'])P.cd[k]=0;P.dashCd=0;
  NET.lastPos=0;
}
function duelSpectate(name){
  const p=NET.peers[name];if(!p||!p.du){UI.toast('결투가 이미 끝났습니다');return}
  if(!duFree()){UI.toast(NET.party?'파티 중에는 관전할 수 없습니다':'지금은 관전할 수 없습니다');return}
  if(!inTown(P.x,P.z)){UI.toast('관전은 마을에서만 할 수 있습니다');return}
  DU.on=true;DU.role='spec';DU.id=p.du.id;DU.a=name;DU.b=p.du.vs;DU.opp=null;DU.ph='watch';DU.t=0;DU.pt=0;DU.res=null;DU.seen=Date.now();DU.back={x:P.x,z:P.z};
  UI.close();duelEnter();cam.x=DU.x;cam.z=DU.z;
}
function duelLeave(msg){
  if(!DU.on)return;
  const spec=DU.role==='spec',back=DU.back;
  DU.on=false;duelClearFx();DU.ph='idle';DU.prox=null;DU.role=null;DU.res=null;
  if(DU.arena)DU.arena.g.visible=false;worldG.visible=true;skReset();resetMobs();
  if(!spec&&back){P.x=back.x;P.z=back.z;P.vx=P.vz=0;P.hp=S.maxHp;P.shield=0;P.iframes=2}
  cam.x=P.x;cam.z=P.z;if(PM&&PM.g)PM.g.visible=true;
  const mini=$('mini');if(mini&&mini.style)mini.style.display='';
  UI.zone=-1;duelHud(false);NET.lastPos=0;
  if(msg)UI.toast(msg,3200);
}
/* the fight is decided; stay a moment, then return */
function duelFinish(winner,msg){
  if(!DU.on||DU.ph==='end')return;
  DU.ph='end';duelClearFx();DU.pt=3.5;DU.res=msg||(winner+'님의 승리!');
  if(DU.prox){removeMob(DU.prox,false);DU.prox=null}
  if(DU.role==='fight'){skReset();P.iframes=9}
}
/* I lost: tell the others and let the server record it (winner +300 duel points) */
function duelLose(why){
  if(!DU.on||DU.role!=='fight'||DU.ph==='end')return;
  const id=DU.id,opp=DU.opp,counted=DU.ph==='fight';
  netSend('de',{id,w:opp,l:SES.name,counted:counted?1:0});
  duelFinish(opp,counted?(why||'패배했습니다'):'결투를 취소했습니다');
  if(counted)API.call('duelLose',opp,id).then(()=>netSend('dr',{id,t:opp})).catch(()=>UI.toast('전적을 저장하지 못했습니다',2600));
}
function onDuelEnd(d){
  if(!d||!DU.on||d.id!==DU.id||DU.ph==='end')return;
  if(d.cancel){duelLeave('결투가 취소되었습니다');return}
  if(DU.role==='fight'){
    if(d.l!==DU.opp)return;
    duelFinish(SES.name,d.counted?'승리! 결투 포인트 +'+DUEL_POINT:'상대가 결투를 취소했습니다');
  }else if(d.w===DU.a||d.w===DU.b)duelFinish(d.w);
}
/* the server has saved the result: reload my record and points */
function onDuelRecorded(d){
  if(!d||d.t!==SES.name)return;
  API.resume(SES.name,SES.token).then(p=>{if(p&&p.items){const r=p.duel;if(r)UI.toast('전적 '+r.w+'승 '+r.l+'패 · 결투 포인트 '+fmtG(r.pt),3200)}}).catch(()=>{});
}

/* ---------- damage ---------- */
function duelHitOut(m,d){
  if(DU.ph!=='fight')return;
  DU.out+=d;
  if(S.vamp){P.vampAcc+=d*DUEL_K*S.vamp;if(P.vampAcc>=1){const v=Math.floor(P.vampAcc);P.vampAcc-=v;P.hp=Math.min(S.maxHp,P.hp+v)}}
}
function onDuelHit(d){
  if(!d||!DU.on||DU.role!=='fight'||DU.ph!=='fight'||d.id!==DU.id||d.t!==SES.name||d.f!==DU.opp)return;
  if(P.dead||P.iframes>0||P.dashT>0||P.hidden||qAloft())return;
  duelFxIn(d);
  const raw=Math.min(Math.max(0,+d.d||0)*DUEL_K,S.maxHp*.3);
  if(raw>0){burst(P.x,1.2,P.z,6,0xff5a6a,5,.3,8);duelHurt(raw)}
}

/* ---------- crowd control: stun, burn, knockback, pull and throw all reach the opponent ---------- */
const duelFxOut=()=>DU.fx||(DU.fx={});
function duelStunOut(t){if(DU.ph==='fight'){const f=duelFxOut();f.fz=Math.max(f.fz||0,t)}}
function duelBurnOut(dps){if(DU.ph==='fight'){const f=duelFxOut();f.bn=Math.max(f.bn||0,Math.round(dps))}}
/* displacement: keep only the strongest push of this tick (skills that push every frame must not add up) */
function duelPushOut(dx,dz,dist){
  const l=Math.hypot(dx,dz);if(DU.ph!=='fight'||l<.01||!(dist>.05))return;
  const f=duelFxOut(),o=f.mv;if(!o||Math.hypot(o[0],o[1])<dist)f.mv=[+(dx/l*dist).toFixed(2),+(dz/l*dist).toFixed(2)];
}
function duelMoveOut(x,z){if(DU.ph==='fight')duelFxOut().to=[+x.toFixed(2),+z.toFixed(2)]}   // carried or thrown to a spot
function duelFxIn(d){
  if(+d.bn>0){DU.burnT=3;DU.burnD=Math.max(DU.burnD||0,Math.min(+d.bn,S.maxHp*2))}
  /* stun is halved and capped, then there is a short immunity so that ice hits cannot lock someone forever */
  if(+d.fz>0&&!(P.stunT>0)&&!(P.stunImm>0)){P.stunT=Math.min(1.5,d.fz*.6);P.stunImm=P.stunT+1.5;P.vx=P.vz=0;dmgNum(P.x,3.6,P.z,'기절!','info')}
  const V=a=>Array.isArray(a)&&isFinite(a[0])&&isFinite(a[1]);
  let dx=0,dz=0;
  if(V(d.to)){const e={x:+d.to[0],z:+d.to[1]};duelClampXZ(e);dx=e.x-P.x;dz=e.z-P.z}
  else if(V(d.mv)){dx=+d.mv[0];dz=+d.mv[1];const l=Math.hypot(dx,dz);if(l>9){dx*=9/l;dz*=9/l}}
  if(dx||dz){DU.kn={vx:dx/.18,vz:dz/.18,t:.18};if(P.recall>0)cancelRecall('')}
}
function duelHurt(raw){
  let dmg=Math.max(1,Math.round(raw*(1-S.armor)*(P.hb?(hbOn('ar')?.72:hbOn('my')?.85:1):1)*(P.qGuard>0?.4:1)*(P.golemGuard>0?.7:1)*(P.dkGuard>0?.6:1)));
  if(P.shield>0){const ab=Math.min(P.shield,dmg);P.shield-=ab;dmg-=ab}
  if(dmg>0){P.hp-=dmg;dmgNum(P.x,3,P.z,'-'+dmg,'hurt');sfx('hurt');vignette(.6);cam.shake=Math.max(cam.shake,.25)}
  if(P.hp<=0){P.hp=1;duelLose()}
}
function duelTickFx(dt){
  if(P.stunImm>0)P.stunImm-=dt;
  if(P.stunT>0){P.stunT-=dt;if(Math.random()<dt*14)emit(P.x+rnd(-.6,.6),rnd(1.6,2.8),P.z+rnd(-.6,.6),0,.5,0,.4,0xffe27a,0)}
  if(DU.kn){const k=DU.kn,s=Math.min(dt,k.t);P.x+=k.vx*s;P.z+=k.vz*s;pushOut(P,P.r);k.t-=dt;if(k.t<=0)DU.kn=null}
  if(DU.burnT>0){DU.burnT-=dt;DU.burnC=(DU.burnC||0)-dt;if(DU.burnC<=0){DU.burnC=.5;burst(P.x,1.2,P.z,6,0xff7a2a,3,.4,-2);duelHurt(Math.min(DU.burnD*.5*DUEL_K,S.maxHp*.04))}if(DU.burnT<=0)DU.burnD=0}
}
function duelClearFx(){DU.fx=null;DU.kn=null;DU.burnT=0;DU.burnD=0;DU.burnC=0;DU.out=0;if(P){P.stunT=0;P.stunImm=0}}

/* ---------- HUD ---------- */
function duelHud(on){
  if(!DU.hud){
    if(!on)return;
    const st=document.createElement('style');st.textContent='#duel{position:fixed;left:50%;top:44px;transform:translateX(-50%);z-index:21;width:min(300px,64vw);padding:4px 10px;border-radius:12px;background:rgba(12,14,26,.86);border:1px solid #ffd24a;color:#fff;font-size:13px;text-align:center;display:none}#duel .r{display:flex;gap:8px;align-items:center;margin-top:2px;font-size:12px}#duel .r b{width:68px;text-align:left;overflow:hidden;white-space:nowrap}#duel .r i{flex:1;height:10px;background:#2a1c24;border-radius:5px;overflow:hidden}#duel .r i s{display:block;height:100%;background:#ff5a6a}#duel button{margin-top:3px;padding:2px 14px;border-radius:12px;border:1px solid #8890a8;background:#222842;color:#fff}';
    document.head.appendChild(st);
    const e=document.createElement('div');e.id='duel';e.innerHTML='<div></div><div class="r"><b></b><i><s></s></i></div><div class="r"><b></b><i><s></s></i></div><button></button>';document.body.appendChild(e);
    const k=e.children;DU.hud={e,title:k[0],rows:[k[1],k[2]],btn:k[3]};
    if(DU.hud.btn)DU.hud.btn.onclick=()=>duelQuit();
  }
  DU.hud.e.style.display=on?'block':'none';DU.hud.last='';
}
function duelHudUpdate(){
  const H=DU.hud;if(!H||!H.title||!H.rows[0]||!H.rows[0].children)return;
  const hp=n=>n===SES.name?Math.round(P.hp/S.maxHp*100):(NET.peers[n]?NET.peers[n].hp:0);
  const title=DU.ph==='count'?'결투 시작까지 '+Math.ceil(DU.pt):DU.ph==='end'?DU.res:DU.role==='spec'?'관전 중':'결투 · '+Math.max(0,Math.ceil(DUEL_TIME-DU.t))+'초';
  const v=[DU.a,DU.b].map(n=>[n,clamp(hp(n),0,100)]),key=title+JSON.stringify(v);if(H.last===key)return;H.last=key;
  H.title.textContent=title;H.btn.textContent=DU.role==='spec'?'관전 종료':'기권';
  v.forEach(([n,h],i)=>{const r=H.rows[i].children;r[0].textContent=n;r[1].firstElementChild.style.width=h+'%'});
}
function duelQuit(){
  if(!DU.on)return;
  if(DU.role==='spec')duelLeave('관전을 마쳤습니다');
  else if(DU.ph!=='end')duelLose('기권했습니다');
}

/* ---------- per frame ---------- */
function duelUpdate(dt){
  if(DU.pend&&Date.now()-DU.pend.at>25000)DU.pend=null;
  if(!DU.on)return;
  if(!NET.on){duelLeave('연결이 끊겨 결투장에서 나왔습니다');return}
  DU.t+=DU.ph==='count'?0:dt;
  const now=Date.now(),others=DU.role==='spec'?[DU.a,DU.b]:[DU.opp],live=others.every(n=>NET.peers[n]);
  if(live&&(DU.role==='fight'||others.some(n=>NET.peers[n].du&&NET.peers[n].du.id===DU.id)))DU.seen=now;
  if(DU.ph==='end'){DU.pt-=dt;if(DU.pt<=0)duelLeave(DU.res)}
  else if(!live||now-DU.seen>(DU.role==='spec'?4000:8000))duelLeave(DU.role==='spec'?'결투가 끝났습니다':'상대의 연결이 끊겨 결투가 취소되었습니다');
  else if(DU.ph==='count'){
    DU.pt-=dt;
    if(DU.pt<=0){
      DU.ph='fight';DU.t=0;UI.toast('결투 시작!',1400);sfx('level');
      const p=NET.peers[DU.opp],m=makeMobObj(-777,'slime',p.x||DU.x,p.z||DU.z,1,false,true);
      entG.remove(m.m.g);m.duel=true;m.spawning=false;m.dmg=0;m.r=.7;m.maxHp=m.hp=1e12;DU.prox=m;
    }
  }else if(DU.ph==='fight'){
    const p=NET.peers[DU.opp],m=DU.prox;
    if(m&&p){m.x=m.tx=p.x;m.z=m.tz=p.z;m.dead=false;m.hp=m.maxHp*Math.max(.01,p.hp/100);if(!MOBS.includes(m))MOBS.push(m)}
    DU.flush-=dt;if((DU.out>0||DU.fx)&&DU.flush<=0){DU.flush=.1;netSend('dh',Object.assign({id:DU.id,f:SES.name,t:DU.opp,d:Math.round(DU.out)},DU.fx));DU.out=0;DU.fx=null}
    if(DU.role==='fight')duelTickFx(dt);
    /* time over: the one with less HP left concedes (ties: the challenger) */
    if(DU.t>=DUEL_TIME&&p){const me=P.hp/S.maxHp*100;if(me<p.hp||(me===p.hp&&DU.a===SES.name))duelLose('시간 종료 · 패배')}
  }
  if(DU.on)duelHudUpdate();
}
/* camera target: spectators follow the middle of the two fighters */
function duelFocus(){
  if(!DU.on||DU.role!=='spec')return P;
  const a=NET.peers[DU.a],b=NET.peers[DU.b];
  return a&&b&&a.got&&b.got?{x:(a.x+b.x)/2,z:(a.z+b.z)/2}:DU;
}
