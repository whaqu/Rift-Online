/* ---------------- UI ---------------- */
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const UI={modal:null,rerender:null,sel:null,toastT:0,vgT:0,lastHud:0,lastMini:0,chatLines:[],trade:null,tradeTimer:0};
const KCLS=(()=>{const o={};for(const k of CLASSES)o[k]=CLS[k].name;return o})();

UI.toast=function(msg,ms){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(UI.toastT);UI.toastT=setTimeout(()=>t.classList.remove('show'),ms||2200)};
function vignette(){const v=$('vign');v.style.opacity='1';clearTimeout(UI.vgT);UI.vgT=setTimeout(()=>{v.style.opacity=(P&&!P.dead&&P.hp<S.maxHp*.25)?'.5':'0'},180)}
UI.deadOn=b=>$('dead').classList.toggle('on',b);
UI.setNet=(on,txt)=>{$('netdot').className=on?'on':'';$('netst').textContent=txt};
UI.renderPeers=()=>{let n=1;for(const k in NET.peers)n++;$('netn').textContent=NET.on?n+'명 · 채널 '+NET.shard:''};
UI.afterProfile=()=>{if(UI.rerender)UI.rerender()};
UI.feed=d=>{
  let txt,col='#ccc';
  if(d.kind==='weapon'){txt=wName(d.base);col=TIER_COL[wTier(d.base)-1]}else if(d.kind==='armor'){txt=armorName(d.base);col=TIER_COL[wTier(d.base)-1]}else if(d.kind==='mat'){const p=MATS[d.base];txt=p?p.name:d.base;col=p?p.col:'#ccc'}else{const p=POTIONS[d.base];txt=p?p.name:d.base;col=p?p.col:'#ccc'}
  UI.feedText('획득: '+txt,col);
};
UI.feedText=(txt,col)=>{const f=$('feed'),d=document.createElement('div');d.textContent=txt;d.style.borderLeftColor=col||'#888';f.appendChild(d);while(f.children.length>5)f.removeChild(f.children[0]);setTimeout(()=>{try{f.removeChild(d)}catch(e){}},6000)};
UI.chatAdd=(n,m,ch)=>{
  const log=$('chatlog'),d=document.createElement('div');d.className=ch||'all';
  d.innerHTML=ch==='sys'?'<span class="sys">'+esc(m)+'</span>':'<span class="n">'+(ch==='party'?'[파티] ':'')+esc(n)+'</span> '+esc(m);
  log.appendChild(d);while(log.children.length>40)log.removeChild(log.children[0]);
  clearTimeout(UI.chatFade);
};

/* ---------- windows ---------- */
UI.confirm=function(msg){return new Promise(res=>{const d=document.createElement('div');d.id='cfm';d.style.cssText='position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center';
  d.innerHTML='<div class="win" style="width:min(380px,92vw)"><div class="bd" style="text-align:center;padding:18px"><div style="margin-bottom:14px;white-space:pre-line">'+esc(msg)+'</div><div class="row" style="justify-content:center"><button class="btn" id="cy">확인</button><button class="btn sec" id="cn">취소</button></div></div></div>';
  document.body.appendChild(d);d.querySelector('#cy').onclick=()=>{d.remove();res(true)};d.querySelector('#cn').onclick=()=>{d.remove();res(false)}})};
UI.open=function(title,html,hooks){
  const bg=$('modalbg');bg.innerHTML='<div class="win"><div class="hd"><span>'+title+'</span><span class="x" id="wx">'+ic('close','#ccc',16)+'</span></div><div class="bd" id="wbd"></div></div>';
  bg.classList.add('on');UI.modal=title;$('wbd').innerHTML=html;$('wx').onclick=UI.close;
  keys.w=keys.a=keys.s=keys.d=false;mv.x=mv.z=0;
  return $('wbd');
};
UI.close=function(){
  $('modalbg').classList.remove('on');$('modalbg').innerHTML='';UI.modal=null;UI.rerender=null;UI.sel=null;
  if(UI.trade){tradeCancelLocal()}
  flushKills();
};
UI.page=function(title,render){
  UI.rerender=()=>{const bd=$('wbd');if(!bd)return;const qa=()=>bd.querySelectorAll?[...bd.querySelectorAll('.list')]:[],st=bd.scrollTop,ls=qa().map(l=>l.scrollTop);bd.innerHTML=render();bd.scrollTop=st;qa().forEach((l,i)=>{if(ls[i])l.scrollTop=ls[i]});bind()};
  const bd=UI.open(title,render());bind();
  function bind(){const b=$('wbd');if(b)b.onclick=ev=>{const t=ev.target.closest('[data-a]');if(!t||t.disabled)return;UI.act(t.dataset.a,t.dataset.v,t)}};
};
UI.act=function(a,v,el){const h=UI.handlers[a];if(h)h(v,el)};
UI.handlers={};
const fmtG=n=>fmtN(n)+' G';
function wStat(it){return it.kind==='weapon'?'공격력 '+fmtN(weaponAtk(it.base,it.enh)):it.kind==='armor'?'방어 '+fmtN(armorDef(it.base,it.enh))+' · 체력 +'+fmtN(armorHp(it.base,it.enh)):''}
function enchTags(it){return(it.ench||[]).map(e=>'<span class="ench" style="color:'+ENCH[e.k].col+'">'+enchText(e)+'</span>').join('')}
function runeTag(it){if(!it.rune)return '';const p=it.rune.split(':'),r=RUNES[p[0]];return r?'<span class="ench" style="color:'+r.col+'">◆'+r.name.replace('의 룬','')+(p[0]==='all'?'':' '+(RUNE_G[+p[1]]||''))+(runeMatch(it.base,it.rune)?' ★짝 +'+Math.round((RUNE_MATCH-1)*100)+'%':'')+'</span>':''}
function itemRow(it,o){
  o=o||{};const col=isGear(it)?TIER_COL[wTier(it.base)-1]:it.kind==='mat'&&MATS[it.base]?MATS[it.base].col:it.kind==='rune'&&RUNES[it.base]?RUNES[it.base].col:'#e4e6ec';let sub;
  if(it.kind==='weapon'){const ok=wCls(it.base)===SES.pf.cls,ty=wType(it.base);sub='<span class="'+(ok?'':'red')+'">'+KCLS[wCls(it.base)]+'</span> · '+wTier(it.base)+'등급('+ZONES[wTier(it.base)].name+') · '+(ty?WTMOD[ty].n+' · ':'')+wStat(it)+' '+enchTags(it)+runeTag(it)}
  else if(it.kind==='armor'){sub=ASETS[aSet(it.base)].n+' '+ASLOT_N[aSlot(it.base)]+' · '+wStat(it)}
  else if(it.kind==='mat'){const m=MATS[it.base];sub=m?m.desc:''}
  else if(it.kind==='rune'){sub=runeDesc(it.base==='all'?'all':it.base,it.enh)||(RUNES[it.base]||{}).d}
  else{const p=POTIONS[it.base];sub=p.kind==='hp'?'체력 '+Math.round(p.pct*100)+'% 회복':p.desc}
  return '<div class="item'+(o.sel?' sel':'')+(it.eq?' eq':'')+'" style="--tc:'+col+'" data-a="'+(o.a||'sel')+'" data-v="'+it.id+'">'+itemIcon(it)+'<div><div class="nm" style="color:'+col+'">'+esc(itemName(it))+(it.kind==='potion'||it.kind==='mat'||it.kind==='rune'?' x'+it.qty:'')+(it.eq?' <span class="dim">[장착중]</span>':'')+'</div><div class="sub">'+sub+'</div></div><div class="rt">'+(o.rt||'')+'</div></div>';
}
const myItems=()=>SES.pf.items.filter(i=>!i.listed);
/* most valuable first (price of one piece) */
const byValue=(a,b)=>itemPrice(b)-itemPrice(a)||(a.kind>b.kind?-1:a.kind<b.kind?1:0)||a.id-b.id;
const byId=id=>SES.pf.items.find(i=>i.id==id);
async function guarded(fn,okMsg){
  try{const r=await fn();if(okMsg)UI.toast(okMsg);UI.refreshHud();if(P){const old=S.maxHp;derive();if(S.maxHp!==old)P.hp=Math.min(P.hp,S.maxHp)}if(UI.rerender)UI.rerender();return r}
  catch(e){UI.toast(errKo(e.message));if(/BAD_AUTH/.test(e.message))return null;return null}
}

/* ---------- inventory ---------- */
function statsHtml(){
  derive();const pen=Math.round(S.armor*100);
  const gx=(SES.pf.gather&&SES.pf.gather.xp)||0,gl=gatLvOf(gx),gp=gl>=GAT_MAX?100:Math.floor((gx-(gl>1?gatNeed(gl-1):0))/(gatNeed(gl)-(gl>1?gatNeed(gl-1):0))*100);
  const gh='<div class="dim" style="margin-top:6px">채집 숙련 <b style="color:#7fd35a">Lv.'+gl+(gl>=GAT_MAX?' (최대)':' · '+gp+'%')+'</b> · 벌목 위력 +'+Math.round((gatSpeed(gl)-1)*100)+'% · 추가 획득 '+(gatDouble(gl)*100).toFixed(1)+'%</div>';
  return '<div class="kv"><span>공격력</span><span>'+fmtN(S.atk)+'</span><span>최대 체력</span><span>'+fmtN(S.maxHp)+'</span><span>공격 속도</span><span>'+S.aps.toFixed(2)+'/초</span><span>치명타</span><span>'+Math.round(S.crit*100)+'%</span><span>이동 속도</span><span>'+S.spd.toFixed(1)+'</span><span>방어력</span><span>'+fmtN(S.def||0)+'</span><span>피해 감소</span><span>'+pen+'%</span>'+(S.vamp?'<span>흡혈</span><span>'+Math.round(S.vamp*100)+'%</span>':'')+'</div>'+gh;
}
function setBonusHtml(){
  derive();let h='';
  for(const k of ASET_KEYS){const n=S.setCnt?S.setCnt[k]:0;if(n<1)continue;
    h+='<div class="sb"><b>'+ASETS[k].n+' '+n+'/4</b>'+SETB[k].map((t,i)=>'<span class="'+(n>=(i+1)*2?'on':'')+'">'+(i+1)*2+'세트: '+t+'</span>').join('')+'</div>'}
  return h;
}
function equipRow(){
  const pf=SES.pf;
  return '<div class="eqrow">'+ASLOTS.map(sl=>{const it=pf.items.find(i=>i.kind==='armor'&&i.eq&&aSlot(i.base)===sl);return '<div class="eqs'+(it?'':' emp')+'" '+(it?'data-a="sel" data-v="'+it.id+'"':'')+'>'+(it?itemIcon(it):ico(ic(sl,'#667',26),'#667'))+'<span>'+ASLOT_N[sl]+(it&&it.enh?' +'+it.enh:'')+'</span></div>'}).join('')+'</div>';
}
function openInventory(){
  UI.sel=null;UI.multi=new Set();UI.multiMode=false;flushGather();
  UI.page('가방',()=>{
    const items=myItems().slice().sort((a,b)=>(b.eq-a.eq)||byValue(a,b));
    const sel=UI.sel&&byId(UI.sel)&&!byId(UI.sel).listed?byId(UI.sel):null;
    let det='<div class="dim">아이템을 선택하세요.</div>';
    if(sel){
      det=itemRow(sel,{a:'none'});
      if(isGear(sel)){
        det+='<div class="row wrap" style="margin-top:8px">'+(sel.eq?(sel.kind==='armor'?'<button class="btn sm sec" data-a="equip" data-v="'+sel.id+'">해제</button>':''):'<button class="btn sm" data-a="equip" data-v="'+sel.id+'">장착</button>')+(sel.eq?'':'<button class="btn sm sec" data-a="sell" data-v="'+sel.id+'">상점 판매 ('+fmtG(sellValue(sel))+')</button>')+(sel.eq?'':'<button class="btn sm sec" data-a="toauc" data-v="'+sel.id+'">경매 등록</button>')+'</div>';
        if(sel.eq)det+='<div class="dim" style="margin-top:6px">장착 중인 장비는 판매할 수 없습니다.</div>';
        if(sel.kind==='weapon'&&wType(sel.base))det+='<div class="dim" style="margin-top:6px">'+WTMOD[wType(sel.base)].d+'</div>';
        if(sel.kind==='weapon'&&sel.rune){const p=sel.rune.split(':'),m=runeMatch(sel.base,sel.rune);det+='<div class="dim" style="margin-top:4px">룬 효과: '+esc(runeDesc(p[0],+p[1],m?RUNE_MATCH:0))+(m?' (짝 보너스 적용)':'')+'</div>'}
        if(sel.kind==='armor')det+='<div class="dim" style="margin-top:6px">'+ASETS[aSet(sel.base)].n+' 세트 ('+ASETS[aSet(sel.base)].d+') — 같은 재질을 2·4개 장착하면 세트 효과</div>';
      }else if(sel.kind==='rune'){
        const rr=RUNES[sel.base]||{},ww=myItems().filter(i=>i.kind==='weapon'&&i.eq)[0],canUp=sel.base!=='all'&&sel.enh<3&&sel.qty>=3,pot=RUNE_POTION[sel.base];
        det+='<div class="dim" style="margin:6px 0">'+esc(rr.d||'')+(sel.base==='all'?'':' · '+runeDesc(sel.base,sel.enh))+(REGION_RUNE.includes(sel.base)?'<br>★ '+(REGION_RUNE.indexOf(sel.base)+1)+'등급('+ZONES[REGION_RUNE.indexOf(sel.base)+1].name+') 무기에 넣으면 효과 +'+Math.round((RUNE_MATCH-1)*100)+'%':'')+'</div><div class="row wrap">'
          +(ww?'<button class="btn sm" data-a="rattach" data-v="'+sel.id+'">장착 무기에 장착'+(runeMatch(ww.base,sel.base)?' ★짝':'')+'</button>':'')
          +(canUp?'<button class="btn sm sec" data-a="rfuse" data-v="'+sel.id+'">3개 합성 → '+RUNE_G[sel.enh+1]+'</button>':'')
          +(pot?'<button class="btn sm sec" data-a="rbrew" data-v="'+sel.id+'">물약으로 (+'+pot[1]*sel.enh+' '+POTIONS[pot[0]].name+')</button>':'')
          +'<button class="btn sm sec" data-a="sell" data-v="'+sel.id+'">1개 판매 ('+fmtG(runePrice(sel.base,sel.enh))+')</button></div>'
          +'<div class="dim" style="margin-top:6px">룬을 장착하면 무기 효과가 추가됩니다. 이미 장착된 룬은 교체됩니다. 같은 지역 등급의 무기에 넣으면 효과가 '+Math.round((RUNE_MATCH-1)*100)+'% 강해집니다. 화염·냉기·번개·암흑·성광·초원·수정·폭풍 룬(Ⅱ 이상)을 모으면 ‘만물의 룬’으로 합성할 수 있습니다.</div>'
          +(RUNE_KEYS.every(k=>myItems().some(i=>i.kind==='rune'&&i.base===k&&i.enh>=2))?'<div class="row" style="margin-top:6px"><button class="btn sm" data-a="rall">만물의 룬 합성</button></div>':'');
      }else if(sel.kind==='mat'){const mp=MATS[sel.base].price;det+='<div class="row wrap" style="margin-top:8px"><button class="btn sm sec" data-a="sell" data-v="'+sel.id+'">1개 판매 ('+fmtG(mp)+')</button><button class="btn sm" data-a="sellall" data-v="'+sel.id+'">전부 판매 ('+fmtG(mp*sel.qty)+')</button><button class="btn sm sec" data-a="toauc" data-v="'+sel.id+'">경매 등록</button></div><div class="dim" style="margin-top:6px">강화 재료로 쓰일 수 있는 채집 재료입니다.</div>'}
      else det+='<div class="row wrap" style="margin-top:8px"><button class="btn sm" data-a="usep" data-v="'+sel.base+'">사용</button><button class="btn sm sec" data-a="sell" data-v="'+sel.id+'">1개 판매 ('+fmtG(Math.floor(POTIONS[sel.base].price*.25))+')</button><button class="btn sm sec" data-a="toauc" data-v="'+sel.id+'">경매 등록</button></div>';
    }
    const msel=[...UI.multi].map(byId).filter(i=>i&&!i.eq&&!i.listed),mtot=msel.reduce((s,i)=>s+itemPrice(i)*((i.kind==='potion'||i.kind==='mat'||i.kind==='rune')?i.qty:1),0);
    if(msel.length)det='<div class="row sp"><b>선택 '+msel.length+'개</b><span class="gold">'+fmtG(mtot)+'</span></div><div class="row wrap" style="margin-top:8px"><button class="btn sm" data-a="msell">선택 판매</button><button class="btn sm sec" data-a="mclear">선택 해제</button></div><div class="dim" style="margin-top:6px">포션·재료는 묶음 전체가 판매됩니다.</div>';
    else det+='<div class="dim" style="margin-top:8px">드래그로 여러 개를 한 번에 선택해 팔 수 있습니다.</div>';
    det+='<div class="row wrap" style="margin-top:8px"><button class="btn sm '+(UI.multiMode?'':'sec')+'" data-a="mmode">다중 선택 '+(UI.multiMode?'켜짐':'(터치용)')+'</button></div>';
    const pf=SES.pf,jn=JOBS[pf.job].name;
    return '<div class="two"><div><div class="card" style="margin-bottom:8px"><div class="row sp"><b>'+esc(pf.name)+'</b><span class="gold">'+fmtG(pf.gold)+'</span></div><div class="dim" style="margin:2px 0 6px">Lv.'+pf.level+' '+jn+' · 경험치 '+fmtN(pf.xp)+'/'+fmtN(pf.need)+'</div>'+statsHtml()+'</div><div class="card" style="margin-bottom:8px"><div class="dim" style="margin-bottom:5px">방어구</div>'+equipRow()+setBonusHtml()+'</div><div class="card">'+det+'</div></div>'
      +'<div><div class="list" style="max-height:62vh">'+(items.length?items.map(i=>itemRow(i,{sel:(sel&&sel.id===i.id)||UI.multi.has(i.id),a:i.eq?'sel':'isel'})).join(''):'<div class="dim">비어 있습니다.</div>')+'</div></div></div>';
  });
  bindDragSelect();
}
UI.handlers.sel=v=>{UI.sel=+v;UI.rerender()};
/* inventory multi-select: a plain click picks one item for details (or toggles when multi mode is on); dragging over rows selects many */
UI.handlers.isel=v=>{v=+v;if(UI.multiMode||UI.multi.size){if(UI.multi.has(v))UI.multi.delete(v);else UI.multi.add(v)}else UI.sel=v;UI.rerender()};
UI.handlers.mmode=()=>{UI.multiMode=!UI.multiMode;UI.rerender()};
UI.handlers.mclear=()=>{UI.multi.clear();UI.rerender()};
UI.handlers.msell=async()=>{
  const list=[...UI.multi].map(byId).filter(i=>i&&!i.eq&&!i.listed);if(!list.length)return;
  if(list.some(i=>isGear(i)&&(i.enh>=5||(i.ench||[]).length))&&!(await UI.confirm('강화·인첸트된 장비가 포함되어 있습니다.\n선택한 '+list.length+'개를 정말 판매할까요?')))return;
  sfx('coin');UI.multi.clear();
  await guarded(async()=>{for(const i of list)await API.call('sell',i.id,(i.kind==='potion'||i.kind==='mat'||i.kind==='rune')?i.qty:1)},list.length+'개를 판매했습니다');
};
function bindDragSelect(){
  const bd=$('wbd');if(!bd||bd._dsel)return;bd._dsel=true;
  let st=null;
  const rows=()=>[...bd.querySelectorAll('.list .item[data-a="isel"]')];
  const at=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&e.closest?e.closest('.item[data-a="isel"]'):null};
  bd.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse'||e.button!==0)return;const it=e.target.closest&&e.target.closest('.item[data-a="isel"]');if(!it)return;
    const r=rows();st={start:r.indexOf(it),on:!UI.multi.has(+it.dataset.v),base:new Set(UI.multi),drag:false};
  });
  addEventListener('pointermove',e=>{
    if(!st)return;const it=at(e.clientX,e.clientY);if(!it)return;const r=rows(),cur=r.indexOf(it);if(cur<0)return;
    if(cur!==st.start)st.drag=true;if(!st.drag)return;
    const a=Math.min(st.start,cur),b=Math.max(st.start,cur);UI.multi=new Set(st.base);
    r.forEach((el,i)=>{const id=+el.dataset.v;if(i>=a&&i<=b){if(st.on)UI.multi.add(id);else UI.multi.delete(id)}el.classList.toggle('sel',UI.multi.has(id)||(UI.sel===id&&!UI.multi.size))});
    window.getSelection&&window.getSelection().removeAllRanges();
  });
  addEventListener('pointerup',()=>{if(!st)return;const d=st.drag;st=null;if(d){UI.dragEnd=Date.now();UI.rerender&&UI.rerender()}});
  bd.addEventListener('click',e=>{if(Date.now()-(UI.dragEnd||0)<150){e.stopImmediatePropagation();e.preventDefault()}},true);
  bd.style.userSelect='none';
}
UI.handlers.none=()=>{};
UI.handlers.equip=v=>{sfx('equip');return guarded(()=>API.call('equip',+v),'장비를 변경했습니다').then(()=>{if(SES.pf.items.find(i=>i.eq&&i.id==v)){buildPlayerModel();netPresence()}})};
UI.handlers.rattach=async v=>{const w=myItems().find(i=>i.kind==='weapon'&&i.eq);if(!w)return;if(w.rune&&!(await UI.confirm('현재 장착된 룬이 사라지고 교체됩니다. 계속할까요?')))return;await guarded(()=>API.call('runeAttach',w.id,+v),'룬을 장착했습니다');derive();netPresence()};
UI.handlers.rfuse=v=>{const r=byId(+v);if(!r)return;sfx('level');guarded(()=>API.call('runeFuse','up',r.base,r.enh),'룬을 합성했습니다')};
UI.handlers.rall=()=>{sfx('level');guarded(()=>API.call('runeFuse','all'),'만물의 룬을 얻었습니다!')};
UI.handlers.rbrew=async v=>{const r=await guarded(()=>API.call('runeBrew',+v));if(r)UI.toast(POTIONS[r.potion].name+' x'+r.qty+' 제작')};
UI.handlers.dgout=()=>dgOut();
UI.handlers.sellall=v=>{const it=byId(+v);if(!it)return;sfx('coin');guarded(()=>API.call('sell',+v,it.qty),'모두 판매했습니다')};
UI.handlers.sell=v=>{const it=byId(+v);if(!it)return;guarded(()=>API.call('sell',+v,1),'판매했습니다')};
UI.handlers.usep=v=>{usePotionKey(v);setTimeout(()=>UI.rerender&&UI.rerender(),50)};
UI.handlers.toauc=v=>{UI.close();openAuction('post',+v)};

/* ---------- shop ---------- */
function openShop(){
  flushGather();
  let tab='buy',qty=1,aset='plate',atier=1;
  UI.page('상점',()=>{
    const pf=SES.pf;let h='<div class="row sp" style="margin-bottom:8px"><div class="tabs" style="margin:0"><div class="tab '+(tab==='buy'?'on':'')+'" data-a="stab" data-v="buy">구매</div><div class="tab '+(tab==='armor'?'on':'')+'" data-a="stab" data-v="armor">방어구</div><div class="tab '+(tab==='sell'?'on':'')+'" data-a="stab" data-v="sell">판매</div></div><span class="gold">'+fmtG(pf.gold)+'</span></div>';
    if(tab==='buy'){
      h+='<div class="row" style="margin-bottom:6px"><span class="dim">수량</span>'+[1,5,10,20].map(n=>'<button class="btn sm '+(qty===n?'':'sec')+'" data-a="sqty" data-v="'+n+'">'+n+'</button>').join('')+'</div><div class="list" style="max-height:56vh">';
      for(const b of POTION_ORDER){const p=POTIONS[b];h+='<div class="item" style="--tc:'+p.col+'">'+ico(ic('potion',p.col,26),p.col)+'<div><div class="nm">'+p.name+'</div><div class="sub">'+(p.kind==='hp'?'체력 '+Math.round(p.pct*100)+'% 회복':p.desc)+'</div></div><div class="rt"><div class="gold">'+fmtG(p.price*qty)+'</div><button class="btn sm" data-a="buy" data-v="'+b+'" '+(pf.gold<p.price*qty?'disabled':'')+'>구매</button></div></div>'}
      for(const t of[2,3,4])for(let ty=0;ty<3;ty++){const b=pf.cls+'_'+t+(ty?'_'+ty:'');h+='<div class="item" style="--tc:'+TIER_COL[t-1]+'">'+ico(ic(WICON[pf.cls],TIER_COL[t-1],26),TIER_COL[t-1])+'<div><div class="nm" style="color:'+TIER_COL[t-1]+'">'+wName(b)+'</div><div class="sub">공격력 '+WATK[t-1]+' · '+WTMOD[ty].n+' · '+KCLS[pf.cls]+' 전용</div></div><div class="rt"><div class="gold">'+fmtG(WVALUE[t-1])+'</div><button class="btn sm" data-a="buy" data-v="'+b+'" '+(pf.gold<WVALUE[t-1]?'disabled':'')+'>구매</button></div></div>'}
      h+='</div>';
    }else if(tab==='armor'){
      h+='<div class="row wrap" style="margin-bottom:6px">'+ASET_KEYS.map(k=>'<button class="btn sm '+(aset===k?'':'sec')+'" data-a="aset" data-v="'+k+'">'+ASETS[k].n+'</button>').join('')+'<span class="dim" style="margin:0 4px 0 10px">등급</span>'+[1,2,3,4].map(n=>'<button class="btn sm '+(atier===n?'':'sec')+'" data-a="atier" data-v="'+n+'">'+n+'</button>').join('')+'</div>'
        +'<div class="dim" style="margin-bottom:6px">'+ASETS[aset].n+': '+ASETS[aset].d+' · 2세트 '+SETB[aset][0]+' / 4세트 '+SETB[aset][1]+'</div><div class="list" style="max-height:50vh">';
      for(const sl of ASLOTS){const b=sl+'_'+atier+'_'+aset,pr=AVALUE[atier-1],cl=TIER_COL[atier-1];h+='<div class="item" style="--tc:'+cl+'">'+ico(ic(sl,cl,26),cl)+'<div><div class="nm" style="color:'+cl+'">'+armorName(b)+'</div><div class="sub">방어 '+armorDef(b,0)+' · 체력 +'+armorHp(b,0)+'</div></div><div class="rt"><div class="gold">'+fmtG(pr)+'</div><button class="btn sm" data-a="buy" data-v="'+b+'" '+(pf.gold<pr?'disabled':'')+'>구매</button></div></div>'}
      h+='</div>';
    }else{
      const items=myItems().filter(i=>!i.eq).sort(byValue);const mats=items.filter(i=>i.kind==='mat'),mv=mats.reduce((s,i)=>s+MATS[i.base].price*i.qty,0);
      if(mats.length)h+='<div class="row sp" style="margin-bottom:6px"><span class="dim">채집 재료 '+mats.reduce((s,i)=>s+i.qty,0)+'개</span><button class="btn sm" data-a="sellmats" data-v="0">재료 모두 팔기 ('+fmtG(mv)+')</button></div>';
      h+='<div class="list" style="max-height:56vh">'+(items.length?items.map(i=>itemRow(i,{a:'sellrow',rt:'<div class="gold">'+fmtG(itemPrice(i))+'</div>'+(i.kind==='potion'||i.kind==='mat'?'<span class="dim">1개씩</span>':'')})).join(''):'<div class="dim">판매할 아이템이 없습니다.</div>')+'</div>';
    }
    return h;
  });
  UI.handlers.stab=v=>{tab=v;UI.rerender()};UI.handlers.aset=v=>{aset=v;UI.rerender()};UI.handlers.atier=v=>{atier=+v;UI.rerender()};UI.handlers.sqty=v=>{qty=+v;UI.rerender()};
  UI.handlers.buy=v=>{sfx('coin');return guarded(()=>API.call('buy',v,qty),'구매했습니다')};
  UI.handlers.sellmats=async()=>{sfx('coin');await guarded(async()=>{for(const i of myItems().filter(x=>x.kind==='mat'))await API.call('sell',i.id,i.qty)},'채집 재료를 모두 판매했습니다')};
  UI.handlers.sellrow=async v=>{const it=byId(+v);if(!it)return;if(isGear(it)&&(it.enh>=5||(it.ench||[]).length)&&!(await UI.confirm('강화·인첸트된 장비입니다.\n정말 판매할까요?')))return;guarded(()=>API.call('sell',+v,1),'판매했습니다')};
}

/* ---------- blacksmith ---------- */
function openSmith(){
  let tab='enh',selId=null,msg='';
  const weapons=()=>myItems().filter(isGear).sort((a,b)=>(b.eq-a.eq)||(wTier(b.base)-wTier(a.base)));
  UI.page('대장간',()=>{
    const pf=SES.pf,ws=weapons();if(!selId||!byId(selId)||byId(selId).listed){const eq=ws.find(w=>w.eq);selId=eq?eq.id:(ws[0]?ws[0].id:null)}
    const it=selId?byId(selId):null;
    let h='<div class="row sp" style="margin-bottom:8px"><div class="tabs" style="margin:0"><div class="tab '+(tab==='enh'?'on':'')+'" data-a="mtab" data-v="enh">강화</div><div class="tab '+(tab==='ench'?'on':'')+'" data-a="mtab" data-v="ench">인첸트</div></div><span class="gold">'+fmtG(pf.gold)+'</span></div>';
    h+='<div class="two"><div><div class="list" style="max-height:58vh">'+ws.map(w=>itemRow(w,{sel:w.id===selId,a:'wsel'})).join('')+'</div></div><div>';
    if(!it)h+='<div class="dim">장비가 없습니다.</div>';
    else if(tab==='enh'){
      const maxed=it.enh>=maxEnh(it),cost=maxed?0:enhCost(it.base,it.enh),rate=maxed?0:ENH_RATE[it.enh],isA=it.kind==='armor',ev=(e)=>isA?armorDef(it.base,e):weaponAtk(it.base,e);
      h+='<div class="card"><div class="nm" style="font-size:16px;color:'+TIER_COL[wTier(it.base)-1]+'">'+esc(itemName(it))+'</div><div class="dim">'+(isA?'방어 ':'공격력 ')+fmtN(ev(it.enh))+(maxed?'':' → <span class="grn">'+fmtN(ev(it.enh+1))+'</span>')+'</div><hr>'
        +(maxed?'<div>최대 강화입니다.</div>':'<div class="kv"><span>성공 확률</span><span>'+rate+'%</span><span>비용</span><span class="gold">'+fmtG(cost)+'</span><span>실패 시</span><span>'+(it.enh>=7?'<span class="red">강화 단계 -1</span>':'변화 없음')+'</span></div>')
        +'<div style="margin:10px 0 4px;min-height:20px">'+msg+'</div><button class="btn" style="width:100%" data-a="enh" '+(maxed||pf.gold<cost?'disabled':'')+'>강화하기</button></div>';
    }else if(it.kind==='armor'){
      h+='<div class="card"><div class="nm" style="color:'+TIER_COL[wTier(it.base)-1]+'">'+esc(itemName(it))+'</div><div class="dim" style="margin-top:6px">인첸트는 무기에만 부여할 수 있습니다.</div></div>';
    }else{
      const cnt=it.ench.length;
      h+='<div class="card"><div class="nm" style="color:'+TIER_COL[wTier(it.base)-1]+'">'+esc(itemName(it))+'</div><div class="dim" style="margin-bottom:6px">인첸트 슬롯 '+cnt+'/3 — 효과는 무작위로 부여됩니다.</div>';
      for(let i=0;i<3;i++){
        const e=it.ench[i];
        if(e){const ucost=e.l>=3?0:4000*e.l*e.l;h+='<div class="item" style="cursor:default;margin-bottom:5px"><div><div class="nm" style="color:'+ENCH[e.k].col+'">'+enchText(e)+'</div><div class="sub">'+enchDesc(e.k,e.l)+'</div></div><div class="rt">'+(e.l>=3?'<span class="dim">최대</span>':'<div class="gold">'+fmtG(ucost)+'</div><button class="btn sm" data-a="encup" data-v="'+i+'" '+(pf.gold<ucost?'disabled':'')+'>강화 ('+(e.l===1?55:30)+'%)</button>')+'</div></div>'}
        else if(i===cnt){const c=2500*(cnt+1)*(cnt+1);h+='<div class="item" style="cursor:default;margin-bottom:5px"><div class="dim">빈 슬롯</div><div class="rt"><div class="gold">'+fmtG(c)+'</div><button class="btn sm" data-a="encnew" '+(pf.gold<c?'disabled':'')+'>부여</button></div></div>'}
        else h+='<div class="item" style="cursor:default;margin-bottom:5px;opacity:.4"><div class="dim">잠김</div></div>';
      }
      h+='<div style="margin-top:6px;min-height:20px">'+msg+'</div></div>';
    }
    return h+'</div></div>';
  });
  UI.handlers.mtab=v=>{tab=v;msg='';UI.rerender()};
  UI.handlers.wsel=v=>{selId=+v;msg='';UI.rerender()};
  UI.handlers.enh=async()=>{
    const it=byId(selId);if(!it)return;
    try{const r=await API.call('enhance',selId);UI.refreshHud();
      msg=r.result==='success'?'<b class="grn">강화 성공! +'+r.enh+'</b>':r.result==='drop'?'<b class="red">실패 — +'+r.enh+'로 하락</b>':'<b class="red">실패 (단계 유지)</b>';
      sfx(r.result==='success'?'enhOk':'enhFail');if(r.result==='success'){const a=P;shockRing(a.x,a.z,3,0xffe27a,.5)}
      derive();UI.rerender()}
    catch(e){UI.toast(errKo(e.message))}
  };
  UI.handlers.encnew=async()=>{try{const r=await API.call('enchant',selId,-1);const it=byId(selId);const e=it.ench[it.ench.length-1];msg='<b class="grn">'+enchText(e)+' 부여됨</b>';sfx('card');UI.refreshHud();derive();UI.rerender()}catch(e){UI.toast(errKo(e.message))}};
  UI.handlers.encup=async v=>{try{const r=await API.call('enchant',selId,+v);msg=r.result==='success'?'<b class="grn">인첸트 강화 성공</b>':'<b class="red">인첸트 강화 실패</b>';sfx(r.result==='success'?'level':'hurt');UI.refreshHud();derive();UI.rerender()}catch(e){UI.toast(errKo(e.message))}};
}

/* ---------- job advancement ---------- */
function modText(m){
  const t=[];if(m.hp)t.push('체력 '+(m.hp>1?'+':'')+Math.round((m.hp-1)*100)+'%');if(m.atk)t.push('공격력 '+(m.atk>1?'+':'')+Math.round((m.atk-1)*100)+'%');if(m.aps)t.push('공속 +'+Math.round((m.aps-1)*100)+'%');
  if(m.spd)t.push('이속 +'+Math.round((m.spd-1)*100)+'%');if(m.crit)t.push('치명타 +'+Math.round(m.crit*100)+'%');if(m.armor)t.push('피해 감소 +'+Math.round(m.armor*100)+'%');if(m.vamp)t.push('흡혈 '+Math.round(m.vamp*100)+'%');
  if(m.burn)t.push('화상 Lv.'+m.burn);if(m.chain)t.push('연쇄 번개');if(m.pierce)t.push('관통 +'+m.pierce);if(m.regen)t.push('체력 재생');if(m.berserk)t.push('체력 50% 이하 공속 +40%');return t.join(' · ');
}
function openJob(){
  UI.page('전직 교관',()=>{
    const pf=SES.pf,cur=JOBS[pf.job],kids=JOB_KIDS(pf.job);
    let h='<div class="card" style="margin-bottom:10px"><div class="row sp"><div><span class="dim">현재 직업</span> <b style="font-size:16px">'+cur.name+'</b> <span class="dim">(Lv.'+pf.level+')</span></div><span class="gold">'+fmtG(pf.gold)+'</span></div>'
      +'<div class="dim" style="margin-top:4px">'+(cur.tier?cur.desc:'1차 전직은 Lv.20, 2차 전직(각성)은 Lv.50부터 가능합니다.')+'</div>'
      +'<div style="margin-top:6px;font-size:12px">'+['q','e','r','f'].map(s=>{const k=s==='f'?ULT[pf.cls]:skillOf(s);return k&&k.desc?'<div><b class="gold">'+s.toUpperCase()+' '+k.name+'</b>'+(s==='f'&&pf.level<MAXLV?' <span class="dim">(Lv.'+MAXLV+' 해금)</span>':'')+' — '+k.desc+'</div>':''}).join('')+'</div></div>';
    if(!kids.length)h+='<div class="card">최종 직업입니다. 더 이상 전직할 수 없습니다.</div>';
    else{
      h+='<div class="dim" style="margin-bottom:6px">'+(cur.tier===0?'1차 전직':'2차 전직')+' — 한 번 선택하면 되돌릴 수 없습니다.</div><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(290px,1fr))">';
      for(const id of kids){const j=JOBS[id],okL=pf.level>=j.req,okG=pf.gold>=j.price;
        h+='<div class="card"><div class="row sp"><b style="font-size:16px">'+j.name+'</b><span class="'+(okL?'':'red')+'">필요 Lv.'+j.req+'</span></div><div class="dim" style="margin:3px 0">'+j.desc+'</div><div style="font-size:12px;margin-bottom:3px">'+modText(j.m)+'</div><div style="font-size:12px;color:#9fc8ff">스킬(R): '+j.r.name+' — 쿨타임 '+j.r.cd+'초'+(j.r.desc?'<br><span class="dim">'+j.r.desc+'</span>':'')+'</div>'
          +'<div class="row sp" style="margin-top:8px"><span class="gold '+(okG?'':'red')+'">'+fmtG(j.price)+'</span><button class="btn sm" data-a="adv" data-v="'+id+'" '+(okL&&okG?'':'disabled')+'>전직</button></div></div>'}
      h+='</div>';
    }
    return h;
  });
  UI.handlers.adv=async v=>{if(!(await UI.confirm(JOBS[v].name+'(으)로 전직할까요?\n되돌릴 수 없습니다.')))return;guarded(()=>API.call('advance',v),'전직했습니다').then(r=>{if(r){derive();buildPlayerModel();P.hp=S.maxHp;sfx('level');shockRing(P.x,P.z,6,0xc06bff,.8);pillar(P.x,P.z,0xc06bff,14,.9);burst(P.x,1,P.z,40,0xc06bff,10,.9,3);netPresence();UI.feedText(JOBS[v].name+'(으)로 전직',JOB_COL[v]?'#'+JOB_COL[v].toString(16).padStart(6,'0'):'#fff')}})};
}

/* ---------- auction ---------- */
function openAuction(tab0,preItem){
  let tab=tab0||'list',kind='',mine=false,rows=[],myrows=[],sel=preItem||null,price='',loading=true;
  const load=async()=>{loading=true;try{if(tab==='list')rows=await API.aucList(kind||null,mine?SES.pf.cls:null);else if(tab==='my')myrows=await API.call('aucMine')}catch(e){UI.toast(errKo(e.message))}loading=false;UI.rerender&&UI.rerender()};
  UI.page('경매장',()=>{
    const pf=SES.pf;
    let h='<div class="row sp" style="margin-bottom:8px"><div class="tabs" style="margin:0">'+[['list','검색'],['post','등록'],['my','내 등록']].map(t=>'<div class="tab '+(tab===t[0]?'on':'')+'" data-a="atab" data-v="'+t[0]+'">'+t[1]+'</div>').join('')+'</div><span class="gold">'+fmtG(pf.gold)+'</span></div>';
    if(tab==='list'){
      h+='<div class="row wrap" style="margin-bottom:6px">'+[['','전체'],['weapon','무기'],['armor','방어구'],['potion','물약']].map(t=>'<button class="btn sm '+(kind===t[0]?'':'sec')+'" data-a="akind" data-v="'+t[0]+'">'+t[1]+'</button>').join('')+'<label class="row" style="margin-left:8px"><input type="checkbox" id="amine" '+(mine?'checked':'')+' data-a="amine"> 내 직업 무기만</label><button class="btn sm sec" data-a="arefresh" style="margin-left:auto">새로고침</button></div>';
      h+='<div class="list" style="max-height:54vh">'+(loading?'<div class="dim">불러오는 중…</div>':rows.length?rows.map(r=>itemRow(r.item,{a:'none',rt:'<div class="gold">'+fmtG(r.price)+'</div><div class="dim">'+esc(r.seller)+'</div><button class="btn sm" data-a="abuy" data-v="'+r.id+'" '+(r.seller===SES.name||pf.gold<r.price?'disabled':'')+'>구매</button>'})).join(''):'<div class="dim">등록된 물품이 없습니다.</div>')+'</div>';
    }else if(tab==='post'){
      const items=myItems().filter(i=>!i.eq);const it=sel&&items.find(i=>i.id===sel);
      h+='<div class="two"><div><div class="dim" style="margin-bottom:4px">등록할 아이템 (포션은 보유 묶음 전체가 등록됩니다)</div><div class="list" style="max-height:50vh">'+(items.length?items.map(i=>itemRow(i,{sel:sel===i.id,a:'apick'})).join(''):'<div class="dim">등록할 수 있는 아이템이 없습니다.</div>')+'</div></div>'
        +'<div><div class="card">'+(it?itemRow(it,{a:'none'}):'<div class="dim">아이템을 선택하세요.</div>')+'<div style="margin-top:8px"><input class="tx" id="aprice" type="number" min="1" placeholder="판매 가격 (G)" value="'+esc(price)+'"></div><div class="dim" style="margin:6px 0">판매 시 수수료 5%가 차감됩니다. 최대 20개까지 등록할 수 있습니다.</div><button class="btn" style="width:100%" data-a="apost" '+(it?'':'disabled')+'>등록</button></div></div></div>';
    }else{
      h+='<div class="list" style="max-height:54vh">'+(loading?'<div class="dim">불러오는 중…</div>':myrows.length?myrows.map(r=>itemRow(r.item,{a:'none',rt:'<div class="gold">'+fmtG(r.price)+'</div><div class="'+(r.status==='sold'?'grn':'dim')+'">'+({active:'판매 중',sold:'판매됨',cancelled:'취소됨'})[r.status]+(r.buyer?' · '+esc(r.buyer):'')+'</div>'+(r.status==='active'?'<button class="btn sm sec" data-a="acancel" data-v="'+r.id+'">취소</button>':'')})).join(''):'<div class="dim">등록 내역이 없습니다.</div>')+'</div>';
    }
    return h;
  });
  const bd=()=>$('wbd');
  UI.handlers.atab=v=>{tab=v;load();UI.rerender()};
  UI.handlers.akind=v=>{kind=v;load()};
  UI.handlers.amine=()=>{const c=$('amine');mine=!!(c&&c.checked);load()};
  UI.handlers.arefresh=()=>load();
  UI.handlers.abuy=async v=>{const r=rows.find(x=>x.id==v);if(!r)return;if(!(await UI.confirm(itemName(r.item)+'\n'+fmtG(r.price)+'에 구매할까요?')))return;guarded(()=>API.call('aucBuy',+v),'구매했습니다').then(()=>load())};
  UI.handlers.apick=v=>{const p=$('aprice');if(p)price=p.value;sel=+v;UI.rerender()};
  UI.handlers.apost=async()=>{const p=$('aprice'),pr=Math.floor(+(p&&p.value));if(!(pr>=1)){UI.toast('가격을 입력해주세요');return}price='';guarded(()=>API.call('aucPost',sel,pr),'등록했습니다').then(()=>{sel=null})};
  UI.handlers.acancel=v=>guarded(()=>API.call('aucCancel',+v),'등록을 취소했습니다').then(()=>load());
  if(tab!=='post')load();else loading=false;
}

/* ---------- party / players ---------- */
function openParty(){
  UI.page('파티 · 플레이어',()=>{
    let h='';
    if(!NET.on)return '<div class="card">오프라인 모드에서는 파티와 거래를 사용할 수 없습니다.<br><span class="dim">온라인 서버에 접속하면 다른 플레이어와 함께 사냥할 수 있습니다.</span></div>';
    h+='<div class="card" style="margin-bottom:10px"><div class="row sp"><b>내 파티</b>'+(NET.party?'<button class="btn sm red" data-a="pleave">탈퇴</button>':'')+'</div>';
    if(NET.party){h+='<div class="list" style="margin-top:6px;max-height:20vh">'+NET.party.members.map(n=>{const p=n===SES.name?{lv:SES.pf.level,job:SES.pf.job}:NET.peers[n];return '<div class="item" style="cursor:default"><div><div class="nm">'+(n===NET.party.leader?'<span class="gold">[파티장]</span> ':'')+esc(n)+'</div><div class="sub">'+(p?'Lv.'+(p.lv||'?')+' '+(JOBS[p.job]?JOBS[p.job].name:''):'연결 끊김')+'</div></div></div>'}).join('')+'</div><div class="dim" style="margin-top:6px">파티원은 같은 몬스터를 함께 사냥하며 각자 경험치와 드랍을 받습니다.</div>'}
    else h+='<div class="dim" style="margin-top:4px">파티가 없습니다. 아래 플레이어를 초대하세요.</div>';
    h+='</div><div class="card"><b>접속 중인 플레이어</b><div class="list" style="margin-top:6px;max-height:34vh">';
    const names=Object.keys(NET.peers);
    h+=names.length?names.map(n=>{const p=NET.peers[n];return '<div class="item" style="cursor:default"><div><div class="nm">'+esc(n)+'</div><div class="sub">Lv.'+p.lv+' '+(JOBS[p.job]?JOBS[p.job].name:'')+'</div></div><div class="rt"><button class="btn sm" data-a="pinv" data-v="'+esc(n)+'" '+(NET.party&&NET.party.members.includes(n)?'disabled':'')+'>파티 초대</button> <button class="btn sm sec" data-a="ptrade" data-v="'+esc(n)+'">거래</button></div></div>'}).join(''):'<div class="dim">같은 채널에 다른 플레이어가 없습니다.</div>';
    return h+'</div></div>';
  });
  UI.handlers.pinv=v=>partyInvite(v);
  UI.handlers.pleave=()=>{partyLeave();UI.rerender()};
  UI.handlers.ptrade=async v=>{
    try{const t=await API.call('tradeOpen',v);netTradeInvite(v,t.id);UI.close();openTrade(t.id,v)}catch(e){UI.toast(errKo(e.message))}
  };
}
UI.renderParty=()=>{
  const box=$('partybox');if(!box)return;
  if(!NET.party){box.innerHTML='';if(UI.rerender&&UI.modal==='파티 · 플레이어')UI.rerender();return}
  let h='';for(const n of NET.party.members){const me=n===SES.name,p=me?null:NET.peers[n];const hp=me?Math.round(P.hp/S.maxHp*100):p?p.hp:0;
    h+='<div class="pm'+(n===NET.party.leader?' ld':'')+'" data-n="'+esc(n)+'"><b>'+esc(n)+'</b> <span class="dim">Lv.'+(me?SES.pf.level:p&&p.lv||'?')+'</span><div class="b"><i style="width:'+hp+'%"></i></div></div>'}
  box.innerHTML=h;
  if(UI.rerender&&UI.modal==='파티 · 플레이어')UI.rerender();
};
UI.partyInvite=from=>{$('invtx').textContent=from+'님이 파티에 초대했습니다.';$('invite').classList.add('on');$('invok').onclick=()=>{$('invite').classList.remove('on');partyAccept()};$('invno').onclick=()=>{NET.invite=null;$('invite').classList.remove('on')};
  setTimeout(()=>{if(NET.invite&&NET.invite.from===from){NET.invite=null;$('invite').classList.remove('on')}},20000)};
UI.tradeInvite=(from,tid)=>{$('invtx').textContent=from+'님이 거래를 신청했습니다.';$('invite').classList.add('on');$('invok').onclick=()=>{$('invite').classList.remove('on');openTrade(tid,from)};$('invno').onclick=()=>{$('invite').classList.remove('on');API.call('tradeCancel',tid).catch(()=>{})};setTimeout(()=>$('invite').classList.remove('on'),20000)};

/* ---------- direct trade ---------- */
function tradeCancelLocal(){if(UI.trade){clearInterval(UI.tradeTimer);const id=UI.trade.id;UI.trade=null;API.call('tradeCancel',id).catch(()=>{})}}
function openTrade(tid,other){
  UI.trade={id:tid,other,t:null,myGold:0,myItems:[]};
  const render=()=>{
    const T=UI.trade&&UI.trade.t,pf=SES.pf;if(!UI.trade)return '';
    if(!T)return '<div class="dim">거래 정보를 불러오는 중…</div>';
    const meA=T.a===SES.name,my={gold:meA?T.a_gold:T.b_gold,items:meA?T.a_items:T.b_items,ok:meA?T.a_ok:T.b_ok},th={gold:meA?T.b_gold:T.a_gold,items:meA?T.b_items:T.a_items,ok:meA?T.b_ok:T.a_ok};
    if(T.status!=='open')return '<div class="card" style="text-align:center;padding:20px"><b>'+(T.status==='done'?'거래가 완료되었습니다.':'거래가 취소되었습니다.')+'</b></div>';
    const inv=myItems().filter(i=>!i.eq);
    return '<div class="two"><div><b>내 제안</b> '+(my.ok?'<span class="grn">[확인함]</span>':'')+'<div class="card" style="margin:6px 0"><div class="row"><span class="dim">골드</span><input class="tx" id="tgold" type="number" min="0" value="'+UI.trade.myGold+'" style="width:140px"><button class="btn sm sec" data-a="tset">반영</button></div></div><div class="list" style="max-height:34vh">'+inv.map(i=>itemRow(i,{sel:UI.trade.myItems.includes(i.id),a:'ttoggle'})).join('')+'</div><div class="dim" style="margin-top:4px">선택한 아이템이 제안에 올라갑니다 (최대 8개).</div></div>'
      +'<div><b>'+esc(other)+'님의 제안</b> '+(th.ok?'<span class="grn">[확인함]</span>':'')+'<div class="card" style="margin:6px 0"><span class="dim">골드</span> <b class="gold">'+fmtG(th.gold)+'</b></div><div class="list" style="max-height:34vh">'+(th.items.length?th.items.map(i=>itemRow(i,{a:'none'})).join(''):'<div class="dim">아이템 없음</div>')+'</div></div></div>'
      +'<hr><div class="row sp"><span class="dim">조건이 바뀌면 양쪽 확인이 초기화됩니다. 상대 제안을 꼭 확인하세요.</span><span><button class="btn" data-a="tok" '+(my.ok?'disabled':'')+'>확인</button> <button class="btn sec" data-a="tcancel">취소</button></span></div>';
  };
  UI.page('거래 — '+esc(other),render);
  const poll=async()=>{if(!UI.trade)return;try{const T=await API.call('tradeGet',tid);if(!UI.trade)return;if(Date.now()<(UI.trade.hold||0))return;const sg=JSON.stringify(T);if(T.status==='open'&&sg===UI.trade.sig)return;UI.trade.sig=sg;UI.trade.t=T;
      if(T.status!=='open'){clearInterval(UI.tradeTimer);if(T.status==='done'){await API.resume(SES.name,SES.token);UI.refreshHud()}UI.trade=UI.trade;UI.rerender&&UI.rerender();UI.trade=null;return}
      const el=$('tgold');const keep=el&&document.activeElement===el;if(!keep&&UI.rerender)UI.rerender()}catch(e){clearInterval(UI.tradeTimer);UI.trade=null;UI.toast(errKo(e.message))}};
  UI.tradeTimer=setInterval(poll,1500);poll();
  const push=async()=>{try{UI.trade.hold=Date.now()+2500;const g=Math.max(0,Math.floor(+($('tgold')?$('tgold').value:UI.trade.myGold)||0));UI.trade.myGold=g;UI.trade.t=await API.call('tradeSet',tid,g,UI.trade.myItems);UI.trade.sig=JSON.stringify(UI.trade.t);UI.trade.hold=0;UI.rerender()}catch(e){UI.trade&&(UI.trade.hold=0);UI.toast(errKo(e.message))}};
  UI.handlers.tset=push;
  UI.handlers.ttoggle=v=>{const id=+v,a=UI.trade.myItems,i=a.indexOf(id);if(i>=0)a.splice(i,1);else if(a.length<8)a.push(id);else{UI.toast('최대 8개까지 올릴 수 있습니다');return}UI.trade.hold=Date.now()+2500;UI.rerender();push()};
  UI.handlers.tok=async()=>{try{const r=await API.call('tradeOk',tid);if(r.error)UI.toast(errKo(r.error));if(r.trade)UI.trade.t=r.trade;UI.refreshHud();UI.rerender()}catch(e){UI.toast(errKo(e.message))}};
  UI.handlers.tcancel=()=>{UI.close()};
}

/* ---------- settings ---------- */
function openSettings(){
  UI.page('설정',()=>{
    return '<div class="grid"><div class="card"><div class="row sp"><span>볼륨</span><input type="range" id="vol" min="0" max="100" value="'+Math.round(save.vol*100)+'" style="width:60%"></div>'
      +'<div class="row sp" style="margin-top:8px"><span>고품질 그래픽 효과 (빛 번짐·색감·비네트)</span><input type="checkbox" id="pfx" '+(save.fx?'checked':'')+'></div>'
      +'<div class="row sp" style="margin-top:8px"><span>나무·풀 모델링</span><span class="row" style="gap:6px"><button class="btn sm '+(save.treeQ===0?'':'sec')+'" data-a="tq" data-v="0">가볍게</button><button class="btn sm '+(save.treeQ===0?'sec':'')+'" data-a="tq" data-v="1">정교하게</button></span></div>'
      +'<div class="row sp" style="margin-top:8px"><span>밸런스 모드 (저사양 PC용: 먼 곳·꽃 생략, 60fps 목표)</span><input type="checkbox" id="bal" '+(save.balance?'checked':'')+'></div>'
      +'<div class="row sp" style="margin-top:8px"><span>그림자 (끄면 더 부드럽습니다)</span><input type="checkbox" id="shd" '+(save.shadows?'checked':'')+'></div>'
      +'<div class="row sp" style="margin-top:8px"><span>캐릭터 외곽선 (재접속 후 완전 적용)</span><input type="checkbox" id="oln" '+(save.outline?'checked':'')+'></div>'
      +(IS_TOUCH?'<div class="row sp" style="margin-top:8px"><span>자동 공격</span><input type="checkbox" id="aut" '+(save.auto?'checked':'')+'></div>':'')+'</div>'
      +'<div class="card"><b>조작</b><div class="kv" style="margin-top:6px">'+(IS_TOUCH?'<span>이동</span><span>왼쪽 조이스틱</span><span>공격</span><span>오른쪽 큰 버튼 (자동 조준)</span><span>스킬</span><span>Q · E · R 버튼</span>':'<span>이동</span><span>W A S D</span><span>공격</span><span>마우스 클릭(누르기)</span><span>스킬</span><span>Q · E · R</span><span>대시</span><span>Space</span><span>물약</span><span>1 ~ 6</span><span>NPC</span><span>E 또는 F</span><span>가방 / 파티</span><span>I / P</span><span>채팅</span><span>Enter</span>')+'</div></div>'
      +'<div class="row"><button class="btn sec" data-a="logout">로그아웃</button><button class="btn" data-a="closeS" style="margin-left:auto">닫기</button></div></div>';
  });
  const v=$('vol');if(v)v.oninput=()=>setVol(v.value/100);
  const s=$('shd');if(s)s.onchange=()=>{save.custom=true;save.shadows=s.checked;writeSave();applyShadows()};
  const fx=$('pfx');if(fx)fx.onchange=()=>{save.custom=true;save.fx=fx.checked;writeSave()};
  const ol=$('oln');if(ol)ol.onchange=()=>{save.custom=true;save.outline=ol.checked;writeSave()};
  const bl=$('bal');if(bl)bl.onchange=()=>{save.custom=true;save.balance=bl.checked;writeSave();UI.toast('밸런스 모드를 바꾸는 중…');UI.rerender&&UI.rerender();setTimeout(()=>{try{applyGfxMode();buildWorld()}catch(e){console.error('balance',e)}UI.toast(save.balance?'밸런스 모드: 먼 곳과 꽃은 그리지 않습니다':'밸런스 모드 꺼짐');UI.rerender&&UI.rerender()},60)};
  const a=$('aut');if(a)a.onchange=()=>{save.custom=true;save.auto=a.checked;writeSave()};
  UI.handlers.tq=v=>{v=+v;if(save.treeQ===v)return;save.custom=true;save.treeQ=v;writeSave();UI.toast('나무·풀 모델을 바꾸는 중…');UI.rerender&&UI.rerender();setTimeout(()=>{try{buildWorld()}catch(e){console.error('rebuild',e)}UI.toast(v?'나무·풀: 정교하게':'나무·풀: 가볍게');UI.rerender&&UI.rerender()},60)};
  UI.handlers.logout=()=>{try{localStorage.removeItem('rw_sess')}catch(e){}location.reload()};
  UI.handlers.closeS=UI.close;
}
function applyShadows(){renderer.shadowMap.enabled=!!save.shadows;sun.castShadow=!!save.shadows;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true})}

/* ---------- NPC interaction ---------- */
function nearNpc(){
  if(!P||P.dead)return null;let best=null,bd=3.6*3.6;
  if(DG.on)return null;
  for(const n of WORLD.npcs){const d=d2(n.x,n.z,P.x,P.z);if(d<bd){bd=d;best=n}}
  for(const n of DGP){const d=d2(n.x,n.z,P.x,P.z);if(d<bd){bd=d;best=n}}
  return best;
}
function interact(){
  if(UI.modal)return;const n=nearNpc();if(!n)return;
  flushKills();flushGather();
  ({shop:openShop,smith:openSmith,auction:()=>openAuction('list'),job:openJob,portal:()=>openPortal(n),map:openMap})[n.kind]();
}

/* ---------- HUD ---------- */
const MENU=[['chat','채팅','Ent',()=>openChatInput()],['bag','가방','I',openInventory],['people','파티','P',openParty],['gear','설정','Esc',openSettings],['star','일일','J',()=>openDaily()]];
function buildHud(){
  const m=$('menu');m.innerHTML='<div class="mbtn auto hidden" id="mauto">'+ic('sword','#e4e6ec',20)+'<small></small></div>'+MENU.map((b,i)=>'<div class="mbtn" data-i="'+i+'" title="'+b[1]+'">'+ic(b[0],'#e4e6ec',20)+'<small>'+b[2]+'</small></div>').join('');
  // desktop auto attack switch: leftmost icon, mouse only (no shortcut key)
  $('mauto').onclick=e=>{e.stopPropagation();if(UI.modal)return;save.auto=!save.auto;save.custom=true;writeSave();updateAutoBtn();UI.toast(save.auto?'자동 공격 켜짐':'자동 공격 꺼짐')};
  m.onclick=e=>{const t=e.target.closest('.mbtn');if(t&&t.dataset.i!=null&&!UI.modal)MENU[+t.dataset.i][3]()};
  $('quick').innerHTML=POTION_ORDER.map((b,i)=>'<div class="qs" data-b="'+b+'" style="border-color:'+POTIONS[b].col+'55">'+ic('potion',POTIONS[b].col,26)+'<span class="kk">'+(i+1)+'</span><span class="ct"></span><div class="cdm"></div></div>').join('');
  $('quick').onclick=e=>{const t=e.target.closest('.qs');if(t)usePotionKey(t.dataset.b)};
  $('skills').innerHTML=['dash','q','e','r','f'].map(k=>'<div class="sk rdy" data-k="'+k+'" id="sk-'+k+'"><span class="ic0"></span><span class="kk">'+({dash:'Space',q:'Q',e:'E',r:'R',f:'F'})[k]+'</span><span class="nm"></span><div class="cdm"></div><div class="cdt"></div></div>').join('');
  $('skills').onclick=e=>{const t=e.target.closest('.sk');if(!t)return;const k=t.dataset.k;if(k==='dash')doDash();else trySkill(k)};
  $('prompt').onclick=()=>interact();
  const ci=$('chatin');
  ci.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){let t=ci.value.trim(),ch='all';if(t.startsWith('/p ')){ch='party';t=t.slice(3)}if(t){if(ch==='party'&&!NET.party)UI.toast('파티가 없습니다');else netChatSend(ch,t)}ci.value='';ci.classList.remove('on');ci.blur();canvas.focus()}else if(e.key==='Escape'){ci.value='';ci.classList.remove('on');ci.blur();canvas.focus()}};
  ci.onfocus=()=>{for(const k in keys)keys[k]=false};
}
function updateAutoBtn(){
  const b=$('mauto');if(!b||!SES.pf)return;
  b.classList.toggle('hidden',SES.pf.level<AUTO_LV);b.classList.toggle('on',!!save.auto);
  b.title='자동 공격 '+(save.auto?'켜짐':'꺼짐');b.querySelector('small').textContent=save.auto?'켜짐':'꺼짐';
}
UI.refreshHud=function(){
  if(!SES.pf||!P)return;const pf=SES.pf;
  $('pname').textContent=pf.name;$('pjob').textContent=JOBS[pf.job].name;$('plv').textContent='경험치 '+fmtN(pf.xp)+' / '+fmtN(pf.need);$('plvn').textContent=pf.level;$('pgold').textContent=fmtG(pf.gold);
  $('xpfill').style.width=Math.min(100,pf.xp/pf.need*100)+'%';
  const qs=$('quick').children;for(let i=0;i<qs.length;i++){const b=POTION_ORDER[i],it=pf.items.find(x=>x.kind==='potion'&&x.base===b&&!x.listed),n=it?it.qty:0;qs[i].classList.toggle('off',!n);qs[i].querySelector('.ct').textContent=n||''}
  for(const k of['q','e','r','f']){const sk=skillOf(k),el=$('sk-'+k);if(!el)continue;el.style.display=sk?'grid':'none';if(sk){el.title=sk.desc||'';el.querySelector('.nm').textContent=sk.name;el.querySelector('.ic0').innerHTML=skIcon(sk,30)}}
  const dn=$('sk-dash');if(dn){dn.querySelector('.nm').textContent='대시';dn.querySelector('.ic0').innerHTML=ic('dash','#9fc8ff',30)}
  updatePerkRow();updateAutoBtn();UI.refreshTouch&&UI.refreshTouch();
};
/* ---------- level-up perks ---------- */
function perkRowHtml(){
  const k=perkOf(SES.pf);let h='';
  if(k.a)h+='<span class="pk" style="color:'+PERK.a.col+'">공격 +'+(+(k.a*PERK.a.per*100).toFixed(1))+'%</span>';
  if(k.h)h+='<span class="pk" style="color:'+PERK.h.col+'">체력 +'+(+(k.h*PERK.h.per*100).toFixed(1))+'%</span>';
  if(k.c)h+='<span class="pk" style="color:'+PERK.c.col+'">쿨 -'+Math.min(40,k.c)+'%</span>';
  if(k.pts>0)h+='<button class="pkb">+'+k.pts+' 강화 선택</button>';
  return h;
}
function updatePerkRow(){const el=$('perkrow');if(!el||!SES.pf)return;const h=perkRowHtml();if(el._h!==h){el._h=h;el.innerHTML=h}}
function openPerks(){
  if(!SES.pf)return;
  UI.page('능력치 강화',()=>{
    const k=perkOf(SES.pf);
    let h='<div class="dim" style="margin-bottom:10px">레벨이 오를 때마다 1포인트를 받아 원하는 능력치를 강화합니다.</div><div class="row" style="margin-bottom:10px"><b style="font-size:16px;color:var(--ac2)">남은 포인트 '+k.pts+'</b></div>';
    for(const id of['a','h','c']){
      const P_=PERK[id],n=k[id],tot=id==='c'?Math.min(40,n):+(n*P_.per*100).toFixed(1),capped=id==='c'&&n>=40;
      h+='<div class="pkc" style="border-left:4px solid '+P_.col+'"><div><b style="color:'+P_.col+'">'+P_.n+'</b><div class="dim">'+P_.d+'</div><div class="dim">현재 '+(id==='c'?'-':'+')+tot+'% ('+n+'회)</div></div><button class="btn" data-a="perk" data-v="'+id+'" '+(k.pts<1||capped?'disabled':'')+'>강화</button></div>';
    }
    return h;
  });
}
UI.handlers.perk=async v=>{try{await API.call('perk',v);sfx('enhOk');const a=P;if(a){shockRing(a.x,a.z,3,parseInt(PERK[v].col.slice(1),16),.5);burst(a.x,1,a.z,16,0xffe27a,6,.6,2)}const old=S.maxHp;derive();if(P&&S.maxHp>old)P.hp+=S.maxHp-old;UI.refreshHud();UI.rerender&&UI.rerender();if(perkOf(SES.pf).pts<1)setTimeout(()=>{if(UI.modal==='능력치 강화')UI.close()},650)}catch(e){UI.toast(errKo(e.message))}};
{const el=typeof $==='function'?$('perkrow'):null;if(el)el.onclick=()=>{if(!UI.modal)openPerks()}}
/* DOM writes are cached on the element: a style or text is only written when its value really changed (cheap on weak CPUs) */
const domW=(el,v)=>{if(el._w!==v){el._w=v;el.style.width=v}},domT=(el,v)=>{if(el._t!==v){el._t=v;el.textContent=v}},domX=(el,v)=>{if(el._x!==v){el._x=v;el.style.transform=v}};
const domQ=(el,sel)=>el['_q'+sel]||(el['_q'+sel]=el.querySelector(sel));
UI.hudTick=function(dt){
  if(!P||!SES.pf)return;
  const hp=Math.max(0,P.hp);domW($('hpfill'),(hp/S.maxHp*100).toFixed(1)+'%');domT($('hptxt'),Math.ceil(hp)+' / '+S.maxHp);
  domW($('shfill'),Math.min(100,P.shield/S.maxHp*100).toFixed(1)+'%');
  for(const k of['dash','q','e','r','f']){
    const el=$('sk-'+k);if(!el)continue;const cd=k==='dash'?P.dashCd:P.cd[k],mx=k==='dash'?2.8:P.cdMax[k]||1,sy='scaleY('+clamp(cd/mx,0,1).toFixed(3)+')';
    const sk=k==='q'?skillOf('q'):null,tb=$('tb-'+k);
    if(sk&&sk.fx==='r_q'){   // round charge gauge
      const ch=qCharge(),deg=Math.round(ch*360),full=ch>=1,
        bg='conic-gradient(rgba(255,74,122,.28) '+deg+'deg, rgba(4,5,10,'+(ch<Q_MIN?.82:.62)+') '+deg+'deg)';
      for(const b of[el,tb]){if(!b)continue;const m=domQ(b,'.cdm');if(!m)continue;if(m._bg!==bg){m._bg=bg;m.style.background=bg}domX(m,full?'scaleY(0)':'scaleY(1)')}
      domT(domQ(el,'.cdt'),full?'':Math.floor(ch*100)+'%');continue;
    }
    for(const b of[el,tb]){const m=b&&domQ(b,'.cdm');if(m&&m._bg){m._bg='';m.style.background=''}}
    domX(domQ(el,'.cdm'),sy);domT(domQ(el,'.cdt'),cd>0?String(Math.ceil(cd)):'');
    if(tb)domX(domQ(tb,'.cdm'),sy)
  }
  const qs=$('quick').children;for(let i=0;i<qs.length;i++){const b=POTION_ORDER[i],pd=POTIONS[b],cdv=pd.kind==='hp'?P.pot.hp:P.pot[b];domX(domQ(qs[i],'.cdm'),'scaleY('+clamp(cdv/(pd.kind==='hp'?2.5:30),0,1).toFixed(3)+')')}
  {const zb=$('zone');const hide=!!DG.on;if(zb&&UI._zh!==hide){UI._zh=hide;zb.style.display=hide?'none':''}}
  const z=zoneAt(P.x,P.z);if(UI.zone!==z.id){UI.zone=z.id;$('znm').textContent=z.name;$('znlv').textContent=z.id?'권장 Lv.'+z.lo+'~'+z.hi:'안전 지대'}
  const n=nearNpc(),pr=$('prompt'),use=$('tb-use');
  if(n&&!UI.modal){const ph=(IS_TOUCH?'':'<kbd>E</kbd>')+n.name;if(pr._h!==ph){pr._h=ph;pr.innerHTML=ph}pr.classList.add('show');if(use){use.classList.remove('hidden');domT(domQ(use,'span'),n.name)}}
  else{pr.classList.remove('show');if(use)use.classList.add('hidden')}
  UI.lastMini+=dt;if(UI.lastMini>(typeof balOn==='function'&&balOn()?.2:.12)){UI.lastMini=0;drawMini();updatePartyBars()}
};
function updatePartyBars(){
  if(!NET.party)return;const box=$('partybox');if(!box)return;
  for(const el of box.children){const n=el.dataset.n,me=n===SES.name,p=me?null:NET.peers[n],hp=me?P.hp/S.maxHp*100:p?p.hp:0;const b=el.querySelector('.b i');if(b)b.style.width=Math.max(0,Math.min(100,hp))+'%'}
}
function drawMini(){
  const c=$('mini'),g=c.getContext&&c.getContext('2d');if(!g)return;const W=c.width,sc=W/2/105,cx=W/2,ox=cx-P.x*sc,oz=cx-P.z*sc;
  g.clearRect(0,0,W,W);g.save();g.beginPath();g.arc(cx,cx,W/2-1,0,TAU);g.clip();g.fillStyle='#10131b';g.fillRect(0,0,W,W);
  const cols=['#6f8a56','#5fa84a','#4a4f58','#7a4a38','#4a4a8a','#5a6678','#3a2a52','#cfe0ee','#c8a468','#d8d4e8'];
  for(let i=ZONES.length-1;i>=0;i--){g.fillStyle=cols[i];g.beginPath();g.arc(ox,oz,ZONES[i].r1*sc,0,TAU);g.fill()}
  g.fillStyle='#8c8678';g.beginPath();g.arc(ox,oz,19*sc,0,TAU);g.fill();
  g.fillStyle='#10131b';g.beginPath();g.rect(0,0,W,W);g.arc(ox,oz,WORLD_R*sc,0,TAU,true);g.fill('evenodd');
  const px=x=>ox+x*sc,pz=z=>oz+z*sc;
  g.fillStyle='#d9534f';for(const m of MOBS){if(m.dead)continue;if(m.golden){g.fillStyle='#ffd24a';g.fillRect(px(m.x)-4,pz(m.z)-4,8,8);g.fillStyle='#d9534f';continue}if(d2(m.x,m.z,P.x,P.z)<45*45){g.fillRect(px(m.x)-2,pz(m.z)-2,4,4)}}
  g.fillStyle='#6bd4ff';for(const k in NET.peers){const p=NET.peers[k];if(p.got){g.beginPath();g.arc(px(p.x),pz(p.z),4,0,TAU);g.fill()}}
  const gt=guideTarget();if(gt){let dx=gt.x-P.x,dz=gt.z-P.z;const k=Math.min(1,90/(Math.hypot(dx,dz)||1));dx=cx+dx*k*sc;dz=cx+dz*k*sc;
    g.strokeStyle='#ffd24a';g.lineWidth=3;g.beginPath();g.moveTo(cx,cx);g.lineTo(dx,dz);g.stroke();g.fillStyle='#ffd24a';g.beginPath();g.arc(dx,dz,8,0,TAU);g.fill()}
  g.fillStyle='#ffd24a';g.beginPath();g.arc(px(P.x),pz(P.z),5,0,TAU);g.fill();g.strokeStyle='#fff';g.lineWidth=1.5;g.stroke();
  g.restore();
}

/* ---------- login ---------- */
const LG={mode:'in',cls:'warrior'};
function initLogin(){
  const desc=()=>{const d=$('clsdesc'),c=CLS[LG.cls];if(d)d.innerHTML='<b>'+c.name+'</b> — '+c.blurb+'<br>Q '+c.q.name+' · E '+c.e.name+' · 만렙 F '+ULT[LG.cls].name};
  $('clsgrid').innerHTML=CLASSES.map(k=>'<div class="c'+(k===LG.cls?' on':'')+'" data-k="'+k+'">'+ic(WICON[k],'#d2a84a',24)+'<b>'+CLS[k].name+'</b></div>').join('');
  $('clsgrid').onclick=e=>{const t=e.target.closest('.c');if(!t)return;LG.cls=t.dataset.k;loginPick(LG.cls);desc();for(const c of $('clsgrid').children)c.classList.toggle('on',c===t)};
  desc();
  const setMode=m=>{LG.mode=m;$('tab-in').classList.toggle('on',m==='in');$('tab-up').classList.toggle('on',m==='up');$('clswrap').classList.toggle('hidden',m==='in');loginPick(m==='in'?'warrior':LG.cls);$('lgo').textContent=m==='in'?'접속':'캐릭터 생성';$('lmsg').textContent=''};
  $('tab-in').onclick=()=>setMode('in');$('tab-up').onclick=()=>setMode('up');
  const go=async()=>{
    const name=$('lname').value.trim(),pass=$('lpass').value;$('lmsg').textContent='';$('lgo').disabled=true;auInit();
    try{
      if(LG.mode==='up')await API.register(name,pass,LG.cls);else await API.login(name,pass);
      try{localStorage.setItem('rw_sess',JSON.stringify({name:SES.name,token:SES.token,mode:SES.mode}))}catch(e){}
      save.lastName=name;writeSave();
      await enterWithLoading();
    }catch(e){$('lmsg').textContent=errKo(e.message)}
    $('lgo').disabled=false;
  };
  $('lgo').onclick=go;
  $('lpass').onkeydown=e=>{if(e.key==='Enter')go()};$('lname').onkeydown=e=>{if(e.key==='Enter')$('lpass').focus()};
  if(save.lastName)$('lname').value=save.lastName;
}
