/* ---------------- daily reward, daily quests, day/night HUD, field events ---------------- */
const DAILY_TXT=(d,lv)=>{const b=500+lv*60;return[null,fmtG(b),'체력 물약 ×5',fmtG(b*2),'격분·강철 물약 ×3',fmtG(b)+' + 체력 물약 ×8',fmtG(b*3)+' + 신속 ×3','대박: '+fmtG(b*6)+' + 상급 체력 ×5 + 격분 ×5'][d]};
function dqText(q){
  if(q.k==='any')return '몬스터 '+q.t+'마리 처치';
  if(q.k==='zone')return (ZONES[q.z]?ZONES[q.z].name:'필드')+'에서 몬스터 '+q.t+'마리 처치';
  if(q.k==='elite')return '엘리트 몬스터 '+q.t+'마리 처치';
  return '물약 '+q.t+'개 사용';
}
/* ---------- NPC quests ---------- */
const questOf=line=>(SES.pf&&SES.pf.quest&&SES.pf.quest[line])||(line==='story'?{i:0,cur:null}:{n:0,cur:null});
const questReward=q=>'골드 '+fmtN(q.g)+' · 경험치 '+fmtN(q.x)+' · '+POTIONS[q.pot].name+' ×'+q.pn;
const questBar=c=>'<div class="row sp"><b>'+questText(c)+'</b><span class="'+(questDone(c)?'grn':'dim')+'">'+c.p+' / '+c.t+'</span></div><div class="qbar"><i style="width:'+Math.min(100,c.p/c.t*100)+'%"></i></div>';
/* mark over an NPC: ! = something to take, ? = ready to report */
function questMark(line){
  const s=questOf(line),lv=SES.pf?SES.pf.level:1;
  if(s.cur)return questDone(s.cur)?'❓ ':'';
  const d=line==='story'?questDef(line,s.i,lv):s.n<QUEST_DAY?questDef(line,s.n,lv):null;
  return d&&(!d.req||lv>=d.req)?'❗ ':'';
}
function questMarks(){for(const n of WORLD.npcs)if(n.kind==='quest'){const t=questMark(n.line)+n.name;if(n._t!==t){n._t=t;n.label.el.textContent=t}}}
function openQuest(line){
  const info=QUEST_NPC[line];
  UI.page(info.who,()=>{
    const s=questOf(line),lv=SES.pf.level,c=s.cur;
    const d=c||(line==='story'?questDef(line,s.i,lv):s.n<QUEST_DAY?questDef(line,s.n,lv):null);
    let h='<div class="dim" style="margin-bottom:8px">“'+(line==='story'&&d?QUEST_STORY[d.z-1][d.k==='dungeon'?1:0]:info.hi)+'”</div>';
    h+='<div class="dim" style="margin-bottom:6px">'+info.title+' · '+(line==='story'?Math.min(18,s.i+1)+' / 18장':'오늘 완료 '+s.n+' / '+QUEST_DAY)+'</div>';
    if(!d)return h+'<div class="card">'+(line==='story'?'모든 이야기를 끝냈네. 고맙네, 영웅이여.':'오늘 의뢰는 모두 끝났습니다. 내일 다시 오세요.')+'</div>';
    h+='<div class="card">'+(c?questBar(c):'<b>'+questText(d)+'</b>')+'<div class="dim" style="margin-top:6px">보상: '+questReward(d)+'</div><div style="text-align:right;margin-top:8px">';
    if(!c)h+=d.req&&lv<d.req?'<span class="red">Lv.'+d.req+'부터 받을 수 있습니다</span>':'<button class="btn" data-a="qsacc">수락</button>';
    else h+='<button class="btn" data-a="qsend" '+(questDone(c)?'':'disabled')+'>'+(questDone(c)?'보고하고 보상 받기':'진행 중')+'</button>';
    return h+'</div></div>';
  });
  const act=async(a,msg)=>{
    const lv=SES.pf.level;await flushKills();const r=await guarded(()=>API.call('quest',line,a));if(!r)return;
    sfx(a==='claim'?'level':'equip');UI.toast(msg);if(r.gold)UI.feedText('+'+fmtN(r.gold)+' G','#ffd24a');
    if(SES.pf.level>lv&&P)onLevelUp();UI.refreshHud();UI.rerender&&UI.rerender();
  };
  UI.handlers.qsacc=()=>act('accept','퀘스트를 받았습니다');
  UI.handlers.qsend=()=>act('claim','퀘스트 완료!');
}
/* tell the player once when a quest becomes ready to report */
const _qsSeen={};
function questWatch(){
  for(const line in QUEST_NPC){const c=questOf(line).cur,d=questDone(c),k=SES.pf.name+line;
    if(d&&_qsSeen[k]===false){UI.toast(QUEST_NPC[line].who+'에게 보고하세요: '+questText(c),3200);sfx('level')}
    _qsSeen[k]=c?d:undefined;}
  questMarks();
}
function openDaily(tab0){
  let tab=tab0||'daily';
  UI.page('출석 · 일일 퀘스트',()=>{
    const pf=SES.pf,dl=pf.daily||{ready:false,streak:0,day:1},dq=pf.dq||{q:[],b:false};
    let h='<div class="tabs"><div class="tab '+(tab==='daily'?'on':'')+'" data-a="dtab" data-v="daily">출석 보상'+(dl.ready?' <span class="pdot"></span>':'')+'</div><div class="tab '+(tab==='npc'?'on':'')+'" data-a="dtab" data-v="npc">마을 의뢰</div><div class="tab '+(tab==='quest'?'on':'')+'" data-a="dtab" data-v="quest">일일 퀘스트'+(questReady(dq)?' <span class="pdot"></span>':'')+'</div></div>';
    if(tab==='npc'){
      h+='<div class="dim" style="margin-bottom:8px">마을의 NPC에게 가서 받고, 끝나면 돌아가 보고합니다.</div><div class="grid">';
      for(const line in QUEST_NPC){const c=questOf(line).cur;h+='<div class="card"><div class="dim">'+QUEST_NPC[line].who+' · '+QUEST_NPC[line].title+'</div>'+(c?questBar(c)+(questDone(c)?'<div class="grn">돌아가서 보고하세요</div>':''):'<div>'+(questMark(line)?'❗ 새 의뢰가 있습니다':'받은 의뢰가 없습니다')+'</div>')+'</div>'}
      h+='</div>';
    }else if(tab==='daily'){
      h+='<div class="card" style="margin-bottom:10px"><div class="row sp"><div><b style="font-size:16px">연속 출석 '+dl.streak+'일</b></div><span class="dim">7일 주기 · 하루 거르면 처음부터</span></div></div><div class="dgrid">';
      for(let d=1;d<=7;d++){
        const done=dl.ready?d<dl.day:d<=dl.day,cur=dl.ready&&d===dl.day;
        h+='<div class="dcell '+(done?'done':'')+(cur?' cur':'')+(d===7?' big':'')+'"><b>'+d+'일차</b><div>'+DAILY_TXT(d,pf.level)+'</div>'+(done?'<span class="ck">✔</span>':'')+'</div>';
      }
      h+='</div><div style="margin-top:12px;text-align:center">'+(dl.ready?'<button class="btn" data-a="dclaim" style="padding:10px 34px">오늘의 보상 받기</button>':'<div class="dim">오늘은 이미 받았습니다. 내일 다시 오세요.</div>')+'</div>';
    }else{
      h+='<div class="dim" style="margin-bottom:8px">매일 0시(한국 시간)에 새로 갱신됩니다. 3개를 모두 완료하면 보너스 상자를 받습니다.</div><div class="grid">';
      dq.q.forEach((q,i)=>{
        const ok=q.p>=q.t,w=Math.min(100,q.p/q.t*100);
        h+='<div class="card"><div class="row sp"><b>'+dqText(q)+'</b><span class="'+(ok?'grn':'dim')+'">'+q.p+' / '+q.t+'</span></div>'
          +'<div class="qbar"><i style="width:'+w+'%"></i></div>'
          +'<div class="row sp" style="margin-top:6px"><span class="dim">골드 '+fmtN(400+pf.level*90)+' · 경험치 · 체력 물약 ×3</span><button class="btn sm" data-a="qclaim" data-v="'+i+'" '+(ok&&!q.c?'':'disabled')+'>'+(q.c?'완료':'받기')+'</button></div></div>';
      });
      const all=dq.q.length&&dq.q.every(q=>q.c);
      h+='<div class="card" style="border-color:#8a6a2a"><div class="row sp"><b class="gold">보너스 상자</b><span class="dim">퀘스트 3개 완료 시</span></div><div class="dim" style="margin-top:4px">골드 '+fmtN((400+pf.level*90)*3)+' · 경험치 · 격분·강철 물약 ×2 · 체력 물약 ×5</div>'
        +'<div style="text-align:right;margin-top:6px"><button class="btn sm" data-a="qclaim" data-v="3" '+(all&&!dq.b?'':'disabled')+'>'+(dq.b?'완료':'열기')+'</button></div></div></div>';
    }
    return h;
  });
  UI.handlers.dtab=v=>{tab=v;UI.rerender()};
  const after=async fn=>{const lv=SES.pf.level;const r=await guarded(fn);if(r){sfx('level');if(SES.pf.level>lv&&P)onLevelUp();if(r.gold)UI.feedText('+'+fmtN(r.gold)+' G','#ffd24a');dailyDot()}};
  UI.handlers.dclaim=()=>after(()=>API.call('daily'));
  UI.handlers.qclaim=v=>after(()=>API.call('dqClaim',+v));
}
const questReady=dq=>!!(dq&&dq.q&&(dq.q.some(q=>q.p>=q.t&&!q.c)||(dq.q.length&&dq.q.every(q=>q.c)&&!dq.b)));
function dailyDot(){
  const pf=SES.pf;if(!pf)return;const on=!!((pf.daily&&pf.daily.ready)||questReady(pf.dq));
  const b=document.querySelector('#menu .mbtn[data-i="4"]');if(b)b.classList.toggle('dot',on);
}
function renderTrack(){
  const el=$('qtrack');if(!el||!SES.pf||!SES.pf.dq)return;const dq=SES.pf.dq;
  el.innerHTML='<b>오늘의 퀘스트</b>'+dq.q.map(q=>'<div class="'+(q.c?'done':q.p>=q.t?'ok':'')+'"><span>'+dqText(q)+'</span><em>'+(q.c?'완료':q.p+'/'+q.t)+'</em></div>').join('')
    +Object.keys(QUEST_NPC).map(l=>{const c=questOf(l).cur;return c?'<div class="'+(questDone(c)?'ok':'')+'"><span>★ '+questText(c)+'</span><em>'+(questDone(c)?'보고':c.p+'/'+c.t)+'</em></div>':''}).join('');
}
{const _rh=UI.refreshHud;UI.refreshHud=function(){_rh.apply(this,arguments);try{dailyDot();renderTrack();questWatch()}catch(e){}}}
function dailyOnEnter(){setTimeout(()=>{try{if(SES.pf&&SES.pf.daily&&SES.pf.daily.ready&&!UI.modal&&G.mode==='play')openDaily('daily')}catch(e){}},2200)}

/* ----- combo / events / clock ----- */
const COMBO={n:0,t:-99,best:0};
function comboHit(m){
  COMBO.n=(G.t-COMBO.t<5)?COMBO.n+1:1;COMBO.t=G.t;COMBO.best=Math.max(COMBO.best,COMBO.n);
  const n=COMBO.n,el=$('combo');
  if(el&&n>=3){el.innerHTML='<small>연속 처치</small><b>'+n+'</b>';el.classList.remove('pop');void el.offsetWidth;el.classList.add('on','pop')}
  if(n===10||n===25||n===50||n===100||n===200){UI.feedText('연속 처치 ×'+n+'!','#ff9a3a');sfx('level');shockRing(P.x,P.z,4+Math.min(6,n/20),0xff9a3a,.5);burst(P.x,1.4,P.z,22,0xff9a3a,8,.6,3)}
}
let _todT=0,_huntOn=null;
function eventTick(dt){
  if(G.t-COMBO.t>5&&COMBO.n){COMBO.n=0;const el=$('combo');if(el)el.classList.remove('on')}
  _todT-=dt;if(_todT>0)return;_todT=.5;
  const night=isNight(),p=dayPhase(),hr=(p*24+6)%24,hh=Math.floor(hr),mm=Math.floor((hr-hh)*60/10)*10;
  const t=$('tod');if(t){t.innerHTML='<i class="'+(night?'n':'d')+'"></i><span>'+(night?'밤':'낮')+' '+('0'+hh).slice(-2)+':'+('0'+mm).slice(-2)+'</span>'+(night?'<small>경험치·골드 +30%</small>':'')}
  const hi=huntInfo(),b=$('evb');
  if(b){
    if(hi.on){const l=Math.ceil(hi.left);b.innerHTML='<b>엘리트 사냥 시간</b> 남은 시간 '+Math.floor(l/60)+':'+('0'+l%60).slice(-2)+' · 엘리트 몬스터가 자주 나타납니다';b.classList.add('on')}
    else b.classList.remove('on');
  }
  if(_huntOn!==null&&hi.on&&!_huntOn){UI.toast('엘리트 사냥 시간이 시작되었습니다!',3200);sfx('boom')}
  _huntOn=hi.on;
}
{const _ht=UI.hudTick;UI.hudTick=function(dt){_ht.apply(this,arguments);try{eventTick(dt)}catch(e){}}}
