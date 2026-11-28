/* ---------------- online: shard channel (Realtime broadcast + presence) ----------------
   방 코드 없음 — 접속하면 자동으로 인원이 덜 찬 필드 채널에 배정됩니다.
   파티가 되면 파티장 PC가 몬스터를 계산하고(다른 파티원은 동기화된 몬스터를 봄), 보상은 각자 서버에서 받습니다. */
const NET={on:false,sb:null,ch:null,shard:0,peers:{},party:null,invite:null,lastPos:0,lastSnap:0,lastX:1e9,lastZ:1e9,lastF:0,lastFx:0,lastAuth:true,tried:false,retry:0,retryT:null,joining:false,rejoin:null,resync:null,hb:{},hbT:0,partyGone:{}};
const SHARD_MAX=12;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('script'));document.head.appendChild(s)})}
function netSend(event,payload){if(!NET.on||!NET.ch)return;try{NET.ch.send({type:'broadcast',event,payload})}catch(e){}}
const myInfo=()=>({name:SES.name,cls:SES.pf.cls,job:curJob(),lv:SES.pf.level,w:myWeaponBase()});
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
  if(NET.tried||GUARD.tripped)return;NET.tried=true;
  if(SES.mode!=='online'){UI.setNet(false,'오프라인');return}
  UI.setNet(false,'접속 중…');
  await netConnect();
}
async function netConnect(){
  if(NET.joining||NET.on||GUARD.tripped)return;NET.joining=true;
  clearTimeout(NET.retryT);NET.retryT=null;
  try{
    if(!window.supabase)await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
    if(GUARD.tripped)return;
    if(!NET.sb)NET.sb=window.supabase.createClient(RW_CFG.url,RW_CFG.key,{realtime:{params:{eventsPerSecond:30}}});
    // try the previous channel first so a party finds each other again
    const order=[1,2,3,4,5,6];if(NET.shard)order.sort((a,b)=>(b===NET.shard)-(a===NET.shard));
    for(const i of order){const ok=await netJoin(i);if(ok)break}
    if(!NET.on)throw new Error('join');
    const again=NET.retry>0;NET.retry=0;UI.setNet(true,'온라인');syncPeers();UI.renderPeers();
    if(again){UI.toast('서버에 다시 연결되었습니다');netPartyResync()}
  }catch(e){NET.on=false;netRetry()}
  finally{NET.joining=false}
}
/* reconnect with back-off: 1, 2, 4, 8, then every 15 s */
function netRetry(){
  if(GUARD.tripped||NET.on||NET.retryT)return;
  const wait=Math.min(15,Math.pow(2,NET.retry))*1000;NET.retry++;
  UI.setNet(false,'연결 끊김 · 재접속 중…');
  NET.retryT=setTimeout(()=>{NET.retryT=null;netConnect()},wait);
}
function netLost(ch){
  if(GUARD.tripped||ch!==NET.ch)return;
  NET.on=false;NET.ch=null;NET.rejoin=NET.party?NET.party.id:null;
  try{NET.sb.removeChannel(ch)}catch(e){}
  for(const k in NET.peers)dropPeer(k);
  UI.renderPeers();netRetry();
}
/* after a reconnect the party may have changed while we were away: announce (leader) or ask (member), drop it if nobody answers */
function netPartyResync(){
  const id=NET.rejoin;NET.rejoin=null;if(!id||!NET.party||NET.party.id!==id)return;
  NET.partyGone={};NET.resync=id;let n=0;
  const step=()=>{
    if(NET.resync!==id||!NET.on||!NET.party||NET.party.id!==id)return;
    if(NET.party.leader===SES.name){if(!n)broadcastParty();checkParty();if(++n<6)setTimeout(step,1500);return}
    if(n++<4){netSend('pq',{n:SES.name,id});setTimeout(step,1500)}else{NET.resync=null;setParty(null);UI.toast('파티 연결이 해제되었습니다')}
  };
  step();
}
function onPQuery(d){if(d&&NET.party&&NET.party.id===d.id&&NET.party.leader===SES.name)broadcastParty()}
function netWake(){if(SES.mode==='online'&&NET.tried&&!NET.on&&!NET.joining){NET.retry=Math.max(1,NET.retry);netConnect()}}
if(window.addEventListener){window.addEventListener('online',netWake);window.addEventListener('focus',netWake)}
function netJoin(i){
  return new Promise(res=>{
    let done=false;const name='rw-field-'+i;
    const ch=NET.sb.channel(name,{config:{broadcast:{self:false},presence:{key:SES.name}}});
    const fin=v=>{if(done)return;done=true;if(!v&&NET.ch!==ch)try{NET.sb.removeChannel(ch)}catch(e){}res(v&&!GUARD.tripped)};
    ch.on('broadcast',{event:'p'},m=>onPos(m.payload)).on('broadcast',{event:'fx'},m=>onFx(m.payload)).on('broadcast',{event:'c'},m=>onChat(m.payload))
      .on('broadcast',{event:'pi'},m=>onPInvite(m.payload)).on('broadcast',{event:'pa'},m=>onPAccept(m.payload)).on('broadcast',{event:'ps'},m=>onPState(m.payload)).on('broadcast',{event:'pl'},m=>onPLeave(m.payload)).on('broadcast',{event:'pq'},m=>onPQuery(m.payload))
      .on('broadcast',{event:'ti'},m=>onTInvite(m.payload)).on('broadcast',{event:'es'},m=>onSnap(m.payload)).on('broadcast',{event:'ed'},m=>onHit(m.payload))
      .on('broadcast',{event:'ek'},m=>onKillCredit(m.payload)).on('broadcast',{event:'ev'},m=>onEnemyEv(m.payload)).on('broadcast',{event:'dg'},m=>onDgEv(m.payload)).on('broadcast',{event:'dq'},m=>onDuelAsk(m.payload)).on('broadcast',{event:'da'},m=>onDuelYes(m.payload)).on('broadcast',{event:'dx'},m=>onDuelNo(m.payload)).on('broadcast',{event:'dh'},m=>onDuelHit(m.payload)).on('broadcast',{event:'de'},m=>onDuelEnd(m.payload)).on('broadcast',{event:'dr'},m=>onDuelRecorded(m.payload)).on('broadcast',{event:'cb'},m=>onCb(m.payload)).on('broadcast',{event:'ch'},m=>onCh(m.payload))
      .on('presence',{event:'sync'},()=>{syncPeers();if(!done){let n=0;try{n=Object.keys(ch.presenceState()).length}catch(e){}
        if(n>SHARD_MAX&&i<6){fin(false)}else{NET.ch=ch;NET.on=true;NET.shard=i;fin(true)}}})
      .subscribe(st=>{
        if(st==='SUBSCRIBED'){try{ch.track(myInfo())}catch(e){}setTimeout(()=>{if(!done){NET.ch=ch;NET.on=true;NET.shard=i;fin(true)}},1800)}
        else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'||st==='CLOSED'){if(!done)fin(false);else netLost(ch)}
      });
    setTimeout(()=>fin(false),7000);
  });
}
/* call after level / job / weapon changes: refresh presence and push a position packet right away */
function netPresence(){NET.lastPos=0;if(NET.on&&NET.ch)try{NET.ch.track(myInfo())}catch(e){}}

/* ---------- peers ---------- */
function syncPeers(){
  if(!NET.ch)return;let st={};try{st=NET.ch.presenceState()}catch(e){}
  const seen={};
  for(const k in st){
    if(k===SES.name)continue;const m=st[k]&&st[k][st[k].length-1];if(!m)continue;seen[k]=1;let p=NET.peers[k];
    if(!p)p=NET.peers[k]={name:k,x:0,z:0,tx:0,tz:0,f:0,tf:0,moving:false,model:null,label:null,got:false,hp:100,dead:false,anim:Math.random()*5,cls:'warrior',job:'warrior',lv:0};
    if(!p.live)applyPeerInfo(p,m);   // live packets are newer than presence
  }
  for(const k in NET.peers){if(!seen[k])dropPeer(k)}
  UI.renderPeers();checkParty();
}
const peerLabel=p=>(p.lv?'Lv.'+p.lv+' ':'')+p.name;
/* level / class / job / weapon of another player; returns true when something changed */
function applyPeerInfo(p,m){
  const c=CLASSES.includes(m.cls)?m.cls:'warrior',j=jobDef(m.job)?m.job:c,w=typeof m.w==='string'&&m.w.length<24?m.w:null,lv=clamp(Math.floor(+m.lv)||0,0,99)||p.lv;
  const look=c!==p.cls||j!==p.job||w!==p.w,changed=look||lv!==p.lv;
  if(look){p.cls=c;p.job=j;p.w=w;if(p.model){entG.remove(p.model.g);p.model=null}}
  p.lv=lv;if(p.label)p.label.el.textContent=peerLabel(p);
  return changed;
}
function dropPeer(k){const p=NET.peers[k];if(!p)return;dropGolems(p);dropCape(p);if(p.model)entG.remove(p.model.g);if(p.label)p.label.remove();delete NET.peers[k]}
function onPos(d){
  if(!d||typeof d.n!=='string')return;const p=NET.peers[d.n];if(!p)return;
  const x=+d.x,z=+d.z,f=+d.f;if(!isFinite(x)||!isFinite(z)||!isFinite(f))return;
  p.tx=clamp(x,-WORLD_R,1500);p.tz=clamp(z,-WORLD_R,WORLD_R);
  {const du=Array.isArray(d.du)&&typeof d.du[0]==='string'&&typeof d.du[1]==='string'?{id:d.du[0].slice(0,40),vs:d.du[1],hid:!!d.du[2]}:null,ch=(p.du&&p.du.id)!==(du&&du.id);p.du=du;if(ch)UI.renderParty()}p.gl=golemData(d.gl);p.air=airData(d.a);p.tf=f;p.moving=!!d.m;p.hp=+d.h||0;p.dead=!!d.d;
  if(!p.got){p.got=true;p.x=p.tx;p.z=p.tz;p.f=p.tf}
  if(Array.isArray(d.i)){p.live=true;p.om=d.i[4]|0;if(applyPeerInfo(p,{lv:d.i[0],cls:d.i[1],job:d.i[2],w:d.i[3]})){UI.renderParty();UI.renderPeers()}}
}
const FXCOL={warrior:0xbfe4ff,mage:0x5ee7ff,archer:0x6bffb0,rogue:0xd0b0ff,cleric:0xfff2a0,lancer:0xffd0c0,monk:0xffe0a0,gunner:0xffe27a,summoner:0x6bffd0,darknight:0xb08aff};
function onFx(d){
  if(!d||!NET.peers[d.n]||!isFinite(+d.x)||!isFinite(+d.z))return;const col=+d.c||FXCOL[d.c]||0xffffff;
  if(d.k==='wing'){const p=NET.peers[d.n],r=clamp(+d.r||5,1,10),a=clamp(+d.a||2.8,.5,4),ff=+d.f||0,sd=+d.s<0?-1:1,l=clamp(+d.l||11,r,18);p.atkT=0;p.atkS=sd;if(p.model)p.model.atkBig=!!d.b;
    hidFeathers(+d.x,+d.z,ff,sd,r,l,a*.85,col,0);if(d.b)hidFeathers(+d.x,+d.z,ff,-sd,r,l,a*.85,col,.1)}
  else if(d.k==='slash')slashArc(+d.x,+d.z,+d.f||0,clamp(+d.r||3,1,8),clamp(+d.a||2,.5,6.3),d.c===1?0xffd24a:0xbfe4ff,.25);
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
function onPInvite(d){if(!d||d.t!==SES.name)return;if(DU.on){netSend('c',{n:'시스템',m:SES.name+'님은 결투장에 있습니다.',ch:'sys'});return}if(NET.party){netSend('c',{n:'시스템',m:SES.name+'님은 이미 파티 중입니다.',ch:'sys'});return}NET.invite={from:d.f,id:d.id,t:performance.now()};UI.partyInvite(d.f)}
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
  if(NET.resync===d.id&&d.leader!==SES.name)NET.resync=null;
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
    if(!m){const bk=type==='dgboss'?DGK.find(k=>it[7]&DGDEF[k].bits):null;if(bk)DG.mkBk=bk;m=makeMobObj(id,type,+it[2],+it[3],+it[6]||1,!!(it[7]&1),true);if(bk)dgBossSetup(m,bk);if(DG.on)m.dg=true}
    m.tx=+it[2];m.tz=+it[3];m.face=+it[4]||0;m.hp=m.maxHp*(+it[5]/100);m.warn=!!(it[7]&2);
  }
  for(const m of MOBS){if(m.ghost&&!m.dead&&!seen.has(m.id)){removeMob(m,true)}}
}
function netSnapshot(){
  if(!NET.on||!NET.party||NET.party.members.length<2||!isAuth())return;
  const A=allPos(),l=[];
  for(const m of MOBS){if(m.dead||m.ghost||m.spawning)continue;let near=false;for(const q of A)if(d2(m.x,m.z,q.x,q.z)<75*75){near=true;break}if(!near)continue;
    l.push([m.id,MTYPES.indexOf(m.type),+m.x.toFixed(1),+m.z.toFixed(1),+m.face.toFixed(2),Math.max(1,Math.round(m.hp/m.maxHp*100)),m.ml,(m.elite?1:0)|(m.warn?2:0)|(m.bk?DGDEF[m.bk].bits:0)]);if(l.length>=44)break}
  netSend('es',{n:SES.name,l});
}
function onHit(d){
  if(!d||!NET.party||!isAuth()||d.to!==SES.name||!Array.isArray(d.h))return;
  for(const h of d.h.slice(0,40))netApplyHit({id:h.id,d:Math.max(0,Math.min(1e6,+h.d||0)),kx:+h.kx||0,kz:+h.kz||0,kb:Math.min(20,+h.kb||0),fz:Math.min(5,+h.fz||0),bn:Math.min(1e5,+h.bn||0),by:d.by});
}
function onKillCredit(d){
  if(!d||!Array.isArray(d.to)||!d.to.includes(SES.name))return;
  registerKill({zid:clamp(d.z|0,1,9),ml:clamp(d.ml|0,1,99),elite:!!d.e,x:+d.x||P.x,z:+d.zz||P.z,r:1});
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
      const gl=myGolems();
      const up=myAir();   // airborne: keep sending (height changes while standing still), plus one packet after landing
      if(moved||up||NET.hadAir||(NET.hadGol&&!gl)||now-NET.lastPos>(DU.on||gl?200:1200)){NET.hadAir=!!up;NET.hadGol=!!gl;NET.lastPos=now;NET.lastX=P.x;NET.lastZ=P.z;NET.lastF=P.face;
        netSend('p',{n:SES.name,i:[SES.pf.level,SES.pf.cls,curJob(),myWeaponBase(),myOmni()],x:+P.x.toFixed(2),z:+P.z.toFixed(2),f:+P.face.toFixed(2),m:(P.ix||P.iz)?1:0,h:Math.round(P.hp/S.maxHp*100),d:P.dead?1:0,du:DU.on&&DU.role==='fight'?[DU.id,DU.opp,P.stealth>0||P.hidden?1:0]:0,gl:gl||0,a:up||0})}
    }
    if(now-NET.lastSnap>120){NET.lastSnap=now;netSnapshot();netFlushHits()}
  }
  for(const k in NET.peers){
    const p=NET.peers[k];if(!p.got){if(p.model)p.model.g.visible=false;continue}
    if(!p.model){p.model=makeHeroFor(lookCls(p.cls,p.job,p.w),p.job,CLS[p.cls].col);applyWeaponLook(p.model,p.w);entG.add(p.model.g)}
    if(!p.label)p.label=makeLabel(peerLabel(p),'pl');
    const kk=1-Math.exp(-dt*10);p.x=lerp(p.x,p.tx,kk);p.z=lerp(p.z,p.tz,kk);p.f=lerpAng(p.f,p.tf,kk);p.anim+=dt;
    const show=duelShows(k)&&!(p.du&&p.du.hid);   // a stealthed opponent really disappears
    p.model.g.visible=!p.dead&&show;p.model.g.position.set(p.x,0,p.z);p.model.g.rotation.y=p.f;
    omniApply(p.model,p.om);
    const fly=peerAir(p,dt);
    if(p.atkT!=null){p.atkT+=dt/.4;if(p.atkT>=1)p.atkT=null}
    animHeroFor(p.model,p.anim,!fly&&Math.hypot(p.tx-p.x,p.tz-p.z)>.15?1:0,p.atkT!=null?p.atkT:-1,false,p.atkS||1);
    peerAirPose(p,fly,show&&!p.dead);
    if(show)p.label.pos(p.x,3.3+(p.y||0)+(p.model.hid?1.7:0),p.z);else if(p.label.el)p.label.el.style.display='none';
    peerGolems(p,dt,duelShows(k));
  }
}
/* ---------- flight is visible to others: [height, pose blend 0..1, gliding(cloak), cloak spread 0..1] ---------- */
function myAir(){
  const y=P.glide?P.glide.h:P.leap?PM.g.position.y:0,k=P.glide?Math.min(1,P.glide.h/GLIDE_H):P.leap&&P.leap.y0!=null?1:0;
  if(P.dead||(!P.glide&&y<.05&&!k))return null;
  return[+y.toFixed(2),+k.toFixed(2),P.glide?1:0];
}
function airData(a){
  if(!Array.isArray(a)||![0,1,2].every(i=>isFinite(a[i])))return null;
  return{y:clamp(+a[0],0,12),k:clamp(+a[1],0,1),cape:!!a[2],at:performance.now()};
}
function peerAir(p,dt){
  const d=p.air&&performance.now()-p.air.at<1500?p.air:null,k=1-Math.exp(-dt*12);
  p.y=lerp(p.y||0,d?d.y:0,k);p.ak=lerp(p.ak||0,d?d.k:0,k);
  if(!d&&p.y<.03){p.y=0;p.ak=0}
  p.cp=!!(d&&d.cape);
  return p.y>0||p.ak>.02||p.cp;
}
function peerAirPose(p,fly,show){
  const m=p.model;m.g.position.y=p.y;m.body.position.z=0;
  if(fly&&p.ak>.02)glidePose(m,p.anim,p.ak,-1);else if(m.airOn){m.body.rotation.x=0;m.body.position.y=0;m.armL.rotation.z=0;m.armR.rotation.z=0}
  m.airOn=fly&&p.ak>.02;
  if(m.wau){const g=m.wau.g,b=m.body;g.rotation.x=m.airOn?b.rotation.x:0;g.position.y=m.airOn||m.hid?b.position.y:0;g.position.z=m.airOn?b.position.z:0}
  if(p.cp){
    if(!p.cape){p.cape=capeBuild();entG.add(p.cape)}
    p.cape.visible=show;p.cape.position.set(p.x,p.y,p.z);p.cape.rotation.y=p.f;capeWave(p.cape,p.anim,p.ak);
  }else dropCape(p);
}
function dropCape(p){if(p.cape){capeFree(p.cape);p.cape=null}}
/* ---------- golems are visible to others too: the owner sends [armored, [x,z,facing,swing]...] with his position ---------- */
function myGolems(){
  let armored=0;const l=[];
  for(const a of ACTS){const o=a.gol;if(!o)continue;armored=o.armored?1:0;l.push([+o.g.position.x.toFixed(1),+o.g.position.z.toFixed(1),+o.g.rotation.y.toFixed(2),+o.swing.toFixed(1)])}
  return l.length?[armored,l.slice(-5)]:null;
}
function golemData(a){
  if(!Array.isArray(a)||!Array.isArray(a[1]))return null;
  const l=a[1].slice(0,5).filter(q=>Array.isArray(q)&&[0,1,2,3].every(i=>isFinite(q[i])));
  return l.length?{a:a[0]?1:0,l,at:performance.now()}:null;
}
function dropGolems(p){if(p.gol){for(const o of p.gol)entG.remove(o.g);p.gol=null}}
function peerGolems(p,dt,show){
  const d=p.gl;
  if(!d||performance.now()-d.at>2500){dropGolems(p);return}
  if(p.gol&&(p.gol.length!==d.l.length||p.golA!==d.a))dropGolems(p);
  if(!p.gol){p.golA=d.a;p.gol=d.l.map(q=>{const o=golemBuild(!!d.a);o.g.position.set(q[0],0,q[1]);o.g.scale.setScalar(d.l.length>3?.75:1);entG.add(o.g);o.swing=0;o.t=0;o.seen=0;return o})}
  const k=1-Math.exp(-dt*10);
  p.gol.forEach((o,i)=>{
    const q=d.l[i],dx=q[0]-o.g.position.x,dz=q[1]-o.g.position.z,walk=Math.hypot(dx,dz)>.15;
    o.g.position.x+=dx*k;o.g.position.z+=dz*k;o.g.rotation.y=lerpAng(o.g.rotation.y,q[2],k);o.g.visible=show;
    if(o.seen!==d.at){o.seen=d.at;if(q[3]>.5&&o.swing<.3){o.swing=q[3];if(show){const x=q[0]+Math.sin(q[2])*2,z=q[1]+Math.cos(q[2])*2;shockRing(x,z,3,0xc8a860,.35);burst(x,.5,z,10,0xc8a860,6,.4,10)}}}
    o.swing=Math.max(0,o.swing-dt*3);o.t+=dt;const step=walk?Math.sin(o.t*6+i)*.35:0;
    o.arms.forEach((a,j)=>a.rotation.x=-o.swing*2.4+(j?-step:step)*.4*(1-o.swing));o.legs.forEach((l,j)=>l.rotation.x=j?step:-step);
  });
}
function netClearModels(){for(const k in NET.peers){const p=NET.peers[k];dropGolems(p);dropCape(p);if(p.model){entG.remove(p.model.g);p.model=null}if(p.label){p.label.remove();p.label=null}}}
