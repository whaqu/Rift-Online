/* ---------------- developer tools guard ----------------
   `debugger` only stops while developer tools are open, so a long gap around it means they are.
   On the trip, rewards collected so far are sent one last time; after that nothing is saved or sent,
   and only a reload brings the game back. */
const GUARD_MS=100,GUARD_EVERY=1000;
let guardTimer=0;
// rewards not sent yet, frozen as text before the pause so later edits don't count
function guardSnap(){
  const arr=[];for(const k in KB){const p=k.split('|');arr.push({z:+p[0],ml:+p[1],e:p[2]==='1',g:p[3]==='1',n:KB[k]})}
  return JSON.stringify({k:arr,w:Math.min(30,GAT.pend.weed),d:Math.min(30,GAT.pend.wood)});
}
// must run before GUARD.tripped is set: each call passes the block while it starts
function guardLastSave(snap){
  if(!SES.token)return;
  const s=JSON.parse(snap),fail=()=>{const e=$('guardmsg');if(e)e.textContent='마지막 보상 일부는 저장하지 못했습니다.'};
  if(s.k.length)API.call('claim',s.k).catch(fail);
  if(s.w+s.d)API.call('gather',s.w,s.d).catch(fail);
}
function guardProbe(){
  if(GUARD.tripped)return;
  const snap=guardSnap();
  const t=performance.now();
  debugger;
  if(performance.now()-t>GUARD_MS)guardTrip(snap);
}
function guardTrip(snap){
  if(GUARD.tripped)return;
  try{guardLastSave(snap||guardSnap())}catch(e){}
  GUARD.tripped=true;
  clearInterval(guardTimer);
  const quiet=f=>{try{f()}catch(e){}};
  quiet(()=>{for(const k in KB)delete KB[k];KBn=0;GAT.pend.weed=GAT.pend.wood=0});   // already sent above
  quiet(()=>clearInterval(UI.tradeTimer));
  quiet(()=>NET.sb&&NET.sb.removeAllChannels());NET.on=false;NET.ch=null;   // leave the field so others are not stuck
  quiet(()=>{clearInterval(AU.tick);AU.ctx&&AU.ctx.suspend()});
  quiet(()=>{mouse.down=false;for(const k in keys)keys[k]=false;document.activeElement&&document.activeElement.blur()});
  const d=document.createElement('div');d.id='guard';
  d.innerHTML='<b>개발자 도구가 감지되었습니다</b><p>지금까지 모은 것은 저장하고, 게임을 멈췄습니다.<br>이후의 내용은 저장되지 않습니다.<br>개발자 도구를 닫은 뒤 새로고침해주세요.</p><p id="guardmsg"></p><button class="btn" id="guardgo">새로고침</button>';
  document.body.appendChild(d);
  quiet(()=>{$('guardgo').onclick=()=>location.reload()});
}
function guardStart(){if(guardTimer||GUARD.tripped)return;guardTimer=setInterval(guardProbe,GUARD_EVERY);guardProbe()}
if(!window.__RW_TEST)guardStart();
