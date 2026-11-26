/* ---------------- online: shard channel (Realtime broadcast + presence) ----------------
   방 코드 없음 — 접속하면 자동으로 인원이 덜 찬 필드 채널에 배정됩니다.
   파티가 되면 파티장 PC가 몬스터를 계산하고(다른 파티원은 동기화된 몬스터를 봄), 보상은 각자 서버에서 받습니다. */
const NET={on:false,sb:null,ch:null,shard:0,peers:{},party:null,invite:null,lastPos:0,lastSnap:0,lastX:1e9,lastZ:1e9,lastF:0,lastFx:0,lastAuth:true,tried:false,hb:{},hbT:0,partyGone:{}};
const SHARD_MAX=12;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('script'));document.head.appendChild(s)})}
function netSend(event,payload){if(!NET.on||!NET.ch)return;try{NET.ch.send({type:'broadcast',event,payload})}catch(e){}}
function netSys(kind,val){if(kind==='lv')netChatSend('sys',SES.name+'님이 레벨 '+val+'에 도달했습니다.')}
function netFx(k,d){
  if(!NET.on)return;const now=performance.now();if(now-NET.lastFx<70)return;NET.lastFx=now;
  netSend('fx',Object.assign({n:SES.name,k,c:S?S.cls:'warrior'},d||{}));
}
function netEnemyEvent(ev){if(NET.on&&NET.party&&NET.party.members.length>1&&isAuth())netSend('ev',{ev})}
function netSendHit(m,d,kk){
  if(!NET.on||!NET.party)return;
  const h=NET.hb[m.id]||(NET.hb[m.id]={id:m.id,d:0,kx:0,kz:0,kb:0,fz:0,bn:0});
  h.d+=d;if(kk){if(kk.kx||kk.kz){h.kx=kk.kx||0;h.kz=kk.kz||0}h.kb=Math.max(h.kb,kk.kb||0);if(kk.fz)h.fz=Math.max(h.fz,kk.fz);if(kk.bn)h.bn=Math.max(h.bn,kk.bn)}
}
function netFlushHits(){
  if(!NET.party)return;const arr=[];for(const k in NET.hb){arr.push(NET.hb[k]);delete NET.hb[k]}
  if(arr.length)netSend('ed',{to:NET.party.leader,by:SES.name,h:arr});
}
function netKill(m){
  if(!NET.on||!NET.party||NET.party.members.length<2)return;
  const to=[];for(const n of NET.party.members){if(n===SES.name)continue;const p=NET.peers[n];if(p&&p.got&&d2(p.x,p.z,m.x,m.z)<60*60)to.push(n)}
  if(to.length)netSend('ek',{to,z:m.zid,ml:m.ml,e:m.elite?1:0,x:m.x,zz:m.z});
}
function netChatSend(ch,text){
  text=String(text||'').slice(0,80);if(!text)return;
  UI.chatAdd(SES.name,text,ch);
  netSend('c',{n:SES.name,m:text,ch,p:NET.party?NET.party.id:null});
}

async function netInit(){
  if(NET.tried)return;NET.tried=true;
  if(SES.mode!=='online'){UI.setNet(false,'오프라인');return}
  UI.setNet(false,'접속 중…');
  try{
    if(!window.supabase)await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
    NET.sb=window.supabase.createClient(RW_CFG.url,RW_CFG.key,{realtime:{params:{eventsPerSecond:30}}});
    for(let i=1;i<=6;i++){
      const ok=await netJoin(i);if(ok)break;
    }
    if(!NET.on)throw new Error('join');
    UI.setNet(true,'온라인');
  }catch(e){NET.on=false;UI.setNet(false,'오프라인 (연결 실패)')}
}
function netJoin(i){
  return new Promise(res=>{
    let done=false;const name='rw-field-'+i;
    const ch=NET.sb.channel(name,{config:{broadcast:{self:false},presence:{key:SES.name}}});
    const fin=v=>{if(done)return;done=true;res(v)};
    ch.on('broadcast',{event:'p'},m=>onPos(m.payload)).on('broadcast',{event:'fx'},m=>onFx(m.payload)).on('broadcast',{event:'c'},m=>onChat(m.payload))
      .on('broadcast',{event:'pi'},m=>onPInvite(m.payload)).on('broadcast',{event:'pa'},m=>onPAccept(m.payload)).on('broadcast',{event:'ps'},m=>onPState(m.payload)).on('broadcast',{event:'pl'},m=>onPLeave(m.payload))
      .on('broadcast',{event:'ti'},m=>onTInvite(m.payload)).on('broadcast',{event:'es'},m=>onSnap(m.payload)).on('broadcast',{event:'ed'},m=>onHit(m.payload))
      .on('broadcast',{event:'ek'},m=>onKillCredit(m.payload)).on('broadcast',{event:'ev'},m=>onEnemyEv(m.payload))
      .on('presence',{event:'sync'},()=>{syncPeers();if(!done){let n=0;try{n=Object.keys(ch.presenceState()).length}catch(e){}
        if(n>SHARD_MAX&&i<6){try{NET.sb.removeChannel(ch)}catch(e){}fin(false)}else{NET.ch=ch;NET.on=true;NET.shard=i;fin(true)}}})
      .subscribe(st=>{
        if(st==='SUBSCRIBED'){try{ch.track({name:SES.name,cls:SES.pf.cls,job:SES.pf.job,lv:SES.pf.level,w:myWeaponBase()})}catch(e){}setTimeout(()=>{if(!done){NET.ch=ch;NET.on=true;NET.shard=i;fin(true)}},1800)}
        else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'||st==='CLOSED'){if(!done)fin(false);else{NET.on=false;UI.setNet(false,'연결 끊김');UI.renderPeers()}}
      });
    setTimeout(()=>fin(false),7000);
  });
}
function netPresence(){if(NET.on&&NET.ch)try{NET.ch.track({name:SES.name,cls:SES.pf.cls,job:SES.pf.job,lv:SES.pf.level,w:myWeaponBase()})}catch(e){}}

/* ---------- peers ---------- */
function syncPeers(){
  if(!NET.ch)return;let st={};try{st=NET.ch.presenceState()}catch(e){}
  const seen={};
  for(const k in st){
    if(k===SES.name)continue;const m=st[k]&&st[k][st[k].length-1];if(!m)continue;seen[k]=1;let p=NET.peers[k];
    if(!p)p=NET.peers[k]={name:k,x:0,z:0,tx:0,tz:0,f:0,tf:0,moving:false,model:null,label:null,got:false,hp:100,dead:false,anim:Math.random()*5,cls:'warrior',job:'warrior',lv:1};
    const c=CLASSES.includes(m.cls)?m.cls:'warrior',j=JOBS[m.job]?m.job:c;
    const w=typeof m.w==='string'&&m.w.length<24?m.w:null;
    if(c!==p.cls||j!==p.job||w!==p.w){p.cls=c;p.job=j;p.w=w;if(p.model){entG.remove(p.model.g);p.model=null}}
    p.lv=+m.lv||1;if(p.label)p.label.el.textContent=peerLabel(p);
  }
  for(const k in NET.peers){if(!seen[k])dropPeer(k)}
  UI.renderPeers();checkParty();
}
const peerLabel=p=>'Lv.'+p.lv+' '+p.name;
function dropPeer(k){const p=NET.peers[k];if(!p)return;if(p.model)entG.remove(p.model.g);if(p.label)p.label.remove();delete NET.peers[k]}
function onPos(d){
  if(!d||typeof d.n!=='string')return;const p=NET.peers[d.n];if(!p)return;
  const x=+d.x,z=+d.z,f=+d.f;if(!isFinite(x)||!isFinite(z)||!isFinite(f))return;
  p.tx=clamp(x,-WORLD_R,WORLD_R);p.tz=clamp(z,-WORLD_R,WORLD_R);p.tf=f;p.moving=!!d.m;p.hp=+d.h||0;p.dead=!!d.d;
  if(!p.got){p.got=true;p.x=p.tx;p.z=p.tz;p.f=p.tf}
}
const FXCOL={warrior:0xbfe4ff,mage:0x5ee7ff,archer:0x6bffb0,rogue:0xd0b0ff,cleric:0xfff2a0,lancer:0xffd0c0,monk:0xffe0a0,gunner:0xffe27a,summoner:0x6bffd0,darknight:0xb08aff};
function onFx(d){
  if(!d||!NET.peers[d.n]||!isFinite(+d.x)||!isFinite(+d.z))return;const col=+d.c||FXCOL[d.c]||0xffffff;
  if(d.k==='slash')slashArc(+d.x,+d.z,+d.f||0,clamp(+d.r||3,1,8),clamp(+d.a||2,.5,6.3),d.c===1?0xffd24a:0xbfe4ff,.25);
  else if(d.k==='shot'){const vx=+d.vx||0,vz=+d.vz||0;const g=grp(+d.x,1.3,+d.z);g.add(glowS(+d.c||(d.v==='orb'?0x5ee7ff:0x6bffb0),d.v==='orb'?2.8:1.6,.8));entG.add(g);let t=0,x=+d.x,z=+d.z;addFx(.8,(k,dt)=>{x+=vx*dt;z+=vz*dt;g.position.x=x;g.position.z=z;emit(x,1.3,z,0,0,0,.2,0x9fe8ff,0)},()=>entG.remove(g))}
  else if(d.k==='nova'){shockRing(+d.x,+d.z,clamp(+d.r||4,1,12),+d.c||0xffffff,.45)}
  else if(d.k==='ground'){shockRing(+d.x,+d.z,clamp(+d.r||4,1,10),+d.c||0xffffff,.6)}
}
function onChat(d){if(!d||typeof d.n!=='string'||typeof d.m!=='string')return;if(d.ch==='party'&&!(NET.party&&NET.party.id===d.p))return;UI.chatAdd(d.n,d.m.slice(0,80),d.ch==='party'?'party':d.ch==='sys'?'sys':'all')}

/* ---------- party ---------- */
function partyInvite(name){
  if(!NET.on)return UI.toast('온라인에서만 가능합니다');
  if(!NET.peers[name])return UI.toast('접속 중인 플레이어가 아닙니다');
  if(NET.party&&NET.party.leader!==SES.name)return UI.toast('파티장만 초대할 수 있습니다');
  if(NET.party&&NET.party.members.length>=4)return UI.toast('파티가 가득 찼습니다');
  if(!NET.party)setParty({id:SES.name+'-'+Date.now().toString(36),leader:SES.name,members:[SES.name]});
  netSend('pi',{f:SES.name,t:name,id:NET.party.id});UI.toast(name+'님에게 파티를 초대했습니다');
}
function onPInvite(d){if(!d||d.t!==SES.name)return;if(NET.party){netSend('c',{n:'시스템',m:SES.name+'님은 이미 파티 중입니다.',ch:'sys'});return}NET.invite={from:d.f,id:d.id,t:performance.now()};UI.partyInvite(d.f)}
function partyAccept(){
  const iv=NET.invite;if(!iv)return;NET.invite=null;
  netSend('pa',{f:SES.name,t:iv.from,id:iv.id});
}
function onPAccept(d){
  if(!d||!NET.party||d.t!==SES.name||d.id!==NET.party.id)return;
  if(NET.party.members.length>=4||NET.party.members.includes(d.f))return;
  NET.party.members.push(d.f);broadcastParty();UI.renderParty();UI.toast(d.f+'님이 파티에 참가했습니다');
}
function broadcastParty(){if(NET.party)netSend('ps',{id:NET.party.id,leader:NET.party.leader,members:NET.party.members})}
function onPState(d){
  if(!d||!Array.isArray(d.members))return;
  if(d.members.includes(SES.name))setParty({id:d.id,leader:d.leader,members:d.members.slice(0,4)});
  else if(NET.party&&NET.party.id===d.id)setParty(null);
}
function setParty(p){
  const was=NET.party;NET.party=p;
  const changed=!was!==!p||(was&&p&&(was.leader!==p.leader));
  if(changed)resetMobs();
  UI.renderParty();
}
function partyLeave(){
  if(!NET.party)return;const p=NET.party;netSend('pl',{n:SES.name,id:p.id});setParty(null);UI.toast('파티를 떠났습니다');
}
function onPLeave(d){
  if(!d||!NET.party||NET.party.id!==d.id)return;
  const was=NET.party.leader;NET.party.members=NET.party.members.filter(n=>n!==d.n);
  if(NET.party.leader===d.n)NET.party.leader=NET.party.members[0];
  if(NET.party.members.length<=1){if(NET.party.members[0]===SES.name){setParty(null)}return}
  if(NET.party.leader!==was)resetMobs();
  if(NET.party.leader===SES.name)broadcastParty();
  UI.renderParty();
}
function checkParty(){ // presence-based cleanup (disconnects)
  if(!NET.party)return;const now=performance.now();let changed=false;
  for(const n of NET.party.members.slice()){
    if(n===SES.name)continue;
    if(!NET.peers[n]){const t=NET.partyGone[n]||(NET.partyGone[n]=now);if(now-t>6000){delete NET.partyGone[n];
      NET.party.members=NET.party.members.filter(x=>x!==n);if(NET.party.leader===n){NET.party.leader=NET.party.members[0];resetMobs()}changed=true}}
    else delete NET.partyGone[n];
  }
  if(changed){if(NET.party.members.length<=1)setParty(null);else{if(NET.party.leader===SES.name)broadcastParty();UI.renderParty()}}
}
function onTInvite(d){if(d&&d.t===SES.name)UI.tradeInvite(d.f,d.tid)}
function netTradeInvite(to,tid){netSend('ti',{f:SES.name,t:to,tid})}

/* ---------- enemy sync (party only) ---------- */
function onSnap(d){
  if(!d||!NET.party||isAuth()||d.n!==NET.party.leader||!Array.isArray(d.l))return;
  const seen=new Set();
  for(const it of d.l){
    const id=it[0],type=MTYPES[it[1]];if(!type)continue;seen.add(id);
    let m=MOBS.find(q=>q.id===id&&q.ghost);
    if(!m){m=makeMobObj(id,type,+it[2],+it[3],+it[6]||1,!!(it[7]&1),true)}
    m.tx=+it[2];m.tz=+it[3];m.face=+it[4]||0;m.hp=m.maxHp*(+it[5]/100);m.warn=!!(it[7]&2);
  }
  for(const m of MOBS){if(m.ghost&&!m.dead&&!seen.has(m.id)){removeMob(m,true)}}
}
function netSnapshot(){
  if(!NET.on||!NET.party||NET.party.members.length<2||!isAuth())return;
  const A=allPos(),l=[];
  for(const m of MOBS){if(m.dead||m.ghost||m.spawning)continue;let near=false;for(const q of A)if(d2(m.x,m.z,q.x,q.z)<75*75){near=true;break}if(!near)continue;
    l.push([m.id,MTYPES.indexOf(m.type),+m.x.toFixed(1),+m.z.toFixed(1),+m.face.toFixed(2),Math.max(1,Math.round(m.hp/m.maxHp*100)),m.ml,(m.elite?1:0)|(m.warn?2:0)]);if(l.length>=44)break}
  netSend('es',{n:SES.name,l});
}
function onHit(d){
  if(!d||!NET.party||!isAuth()||d.to!==SES.name||!Array.isArray(d.h))return;
  for(const h of d.h.slice(0,40))netApplyHit({id:h.id,d:Math.max(0,Math.min(1e6,+h.d||0)),kx:+h.kx||0,kz:+h.kz||0,kb:Math.min(20,+h.kb||0),fz:Math.min(5,+h.fz||0),bn:Math.min(1e5,+h.bn||0),by:d.by});
}
function onKillCredit(d){
  if(!d||!Array.isArray(d.to)||!d.to.includes(SES.name))return;
  registerKill({zid:clamp(d.z|0,1,4),ml:clamp(d.ml|0,1,42),elite:!!d.e,x:+d.x||P.x,z:+d.zz||P.z,r:1});
}
function onEnemyEv(d){if(!d||!d.ev||isAuth())return;const e=d.ev;if(!isFinite(+e.x)||!isFinite(+e.z))return;runEnemyEvent(e)}

/* ---------- per-frame ---------- */
function netUpdate(dt){
  const auth=isAuth();
  if(auth!==NET.lastAuth){NET.lastAuth=auth;resetMobs()}
  if(NET.on&&NET.ch){
    const now=performance.now();
    if(now-NET.lastPos>100){
      const moved=Math.abs(P.x-NET.lastX)>.02||Math.abs(P.z-NET.lastZ)>.02||Math.abs(P.face-NET.lastF)>.05;
      if(moved||now-NET.lastPos>1200){NET.lastPos=now;NET.lastX=P.x;NET.lastZ=P.z;NET.lastF=P.face;
        netSend('p',{n:SES.name,x:+P.x.toFixed(2),z:+P.z.toFixed(2),f:+P.face.toFixed(2),m:(P.ix||P.iz)?1:0,h:Math.round(P.hp/S.maxHp*100),d:P.dead?1:0})}
    }
    if(now-NET.lastSnap>120){NET.lastSnap=now;netSnapshot();netFlushHits()}
  }
  for(const k in NET.peers){
    const p=NET.peers[k];if(!p.got){if(p.model)p.model.g.visible=false;continue}
    if(!p.model){p.model=makeHeroFor(p.cls,p.job,CLS[p.cls].col);applyWeaponLook(p.model,p.w);entG.add(p.model.g)}
    if(!p.label)p.label=makeLabel(peerLabel(p),'pl');
    const kk=1-Math.exp(-dt*10);p.x=lerp(p.x,p.tx,kk);p.z=lerp(p.z,p.tz,kk);p.f=lerpAng(p.f,p.tf,kk);p.anim+=dt;
    p.model.g.visible=!p.dead;p.model.g.position.set(p.x,0,p.z);p.model.g.rotation.y=p.f;
    animHeroFor(p.model,p.anim,Math.hypot(p.tx-p.x,p.tz-p.z)>.15?1:0,-1,false,1);
    p.label.pos(p.x,3.3,p.z);
  }
}
function netClearModels(){for(const k in NET.peers){const p=NET.peers[k];if(p.model){entG.remove(p.model.g);p.model=null}if(p.label){p.label.remove();p.label=null}}}
