/* ---------------- developer tools guard ----------------
   `debugger` only stops while developer tools are open, so a long gap around it means they are.
   Once tripped nothing is saved or sent any more; only a reload brings the game back. */
const GUARD_MS=100,GUARD_EVERY=1000;
let guardTimer=0;
function guardProbe(){
  if(GUARD.tripped)return;
  const t=performance.now();
  debugger;
  if(performance.now()-t>GUARD_MS)guardTrip();
}
function guardTrip(){
  if(GUARD.tripped)return;
  GUARD.tripped=true;
  clearInterval(guardTimer);
  const quiet=f=>{try{f()}catch(e){}};
  quiet(()=>{for(const k in KB)delete KB[k];KBn=0;GAT.pend.weed=GAT.pend.wood=0});   // drop unsent rewards
  quiet(()=>clearInterval(UI.tradeTimer));
  quiet(()=>NET.sb&&NET.sb.removeAllChannels());NET.on=false;NET.ch=null;   // leave the field so others are not stuck
  quiet(()=>{clearInterval(AU.tick);AU.ctx&&AU.ctx.suspend()});
  quiet(()=>{mouse.down=false;for(const k in keys)keys[k]=false;document.activeElement&&document.activeElement.blur()});
  const d=document.createElement('div');d.id='guard';
  d.innerHTML='<b>개발자 도구가 감지되었습니다</b><p>게임을 멈추고 저장을 중단했습니다.<br>개발자 도구를 닫은 뒤 새로고침해주세요.</p><button class="btn" id="guardgo">새로고침</button>';
  document.body.appendChild(d);
  quiet(()=>{$('guardgo').onclick=()=>location.reload()});
}
function guardStart(){if(guardTimer||GUARD.tripped)return;guardTimer=setInterval(guardProbe,GUARD_EVERY);guardProbe()}
if(!window.__RW_TEST)guardStart();
