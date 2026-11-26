/* ---------------- GM panel (관리자 계정 전용) ----------------
   일반 계정에는 버튼과 창을 아예 만들지 않는다. 실제 권한 검사는 서버(rw_gm_*)가 한다. */
function gmMenuButton(){
  if(!SES.pf||!SES.pf.admin)return;
  const b=document.createElement('div');b.className='mbtn';b.title='GM 패널';b.innerHTML=ic('star','#ffd24a',20)+'<small>GM</small>';
  b.onclick=e=>{e.stopPropagation();if(!UI.modal)openGM()};
  $('menu').appendChild(b);
}
async function gmApply(fn,...a){
  await flushKills();
  await API.call(fn,...a);
  derive();P.buff=null;P.cd={q:0,e:0,r:0};P.hp=S.maxHp;
  buildPlayerModel();UI.refreshHud();netPresence();
}
function openGM(){
  if(!SES.pf||!SES.pf.admin)return;
  let tab='job',cls=SES.pf.cls,wt=0,tier=8,enh=20,ench=[],busy=false;
  const run=async(fn,msg)=>{if(busy)return;busy=true;try{await fn();sfx('equip');UI.toast(msg)}catch(e){UI.toast(errKo(e.message))}busy=false;UI.rerender&&UI.rerender()};
  const btn=(a,v,label,on)=>'<button class="btn sm '+(on?'':'sec')+'" data-a="'+a+'" data-v="'+v+'">'+label+'</button>';
  const line=(title,body)=>'<div class="dim" style="margin:8px 0 4px">'+title+'</div><div class="row wrap" style="gap:6px">'+body+'</div>';
  const base=()=>cls+'_'+tier+(wt?'_'+wt:'');
  UI.page('GM 패널',()=>{
    let h='<div class="tabs">'+[['job','직업'],['weapon','무기'],['grow','성장']].map(t=>'<div class="tab '+(tab===t[0]?'on':'')+'" data-a="gmtab" data-v="'+t[0]+'">'+t[1]+'</div>').join('')+'</div>';
    h+='<div style="max-height:58vh;overflow:auto">'+(tab==='grow'?'':line('계열',CLASSES.map(k=>btn('gmcls',k,CLS[k].name,k===cls)).join('')));
    if(tab==='grow'){
      const k=perkOf(SES.pf),gl=gatLvOf((SES.pf.gather&&SES.pf.gather.xp)||0);
      h+='<div class="card"><div class="kv"><span>공격력 강화</span><span>'+k.a+'회</span><span>체력 강화</span><span>'+k.h+'회</span><span>쿨타임 강화</span><span>'+k.c+'회</span><span>벌목(채집) 숙련</span><span>Lv.'+gl+'</span></div></div>';
      h+=line('한 번에 설정',btn('gmgrow',1,'강화·벌목 만렙',true)+btn('gmgrow',0,'강화 초기화 (직접 고르기)'));
    }else if(tab==='job'){
      const job=id=>btn('gmjob',id,JOBS[id].name,SES.pf.job===id);
      h+=line('기본 직업',job(cls))+line('1차 전직',JOB_KIDS(cls).map(job).join(''));
      for(const p of JOB_KIDS(cls))h+=line('2차 전직 · '+JOBS[p].name,JOB_KIDS(p).map(job).join(''));
      h+='<div class="dim" style="margin-top:8px">지금 직업: '+JOBS[SES.pf.job].name+' · 누르면 바로 바뀝니다.</div>';
    }else{
      h+='<div class="card row sp" style="margin-top:8px;gap:8px;position:sticky;top:0;z-index:1;background:#2a3048"><div><b style="color:'+TIER_COL[tier-1]+'">'+esc(wName(base()))+' +'+enh+'</b><div class="dim">공격력 '+fmtN(weaponAtk(base(),enh))+' · '+CLS[cls].name+(cls===SES.pf.cls?' · 받으면 바로 장착':' · 가방에 보관')+'</div></div><button class="btn" data-a="gmget">받기</button></div>';
      h+=line('종류',WTMOD.map((m,i)=>btn('gmwt',i,m.n,i===wt)).join(''));
      h+=line('등급',[1,2,3,4,5,6,7,8].map(i=>btn('gmtier',i,wName(cls+'_'+i+(wt?'_'+wt:'')),i===tier)).join(''));
      h+=line('강화 +'+enh,[0,5,10,15,20].map(i=>btn('gmenh',i,'+'+i,i===enh)).join('')+btn('gmenhd',-1,'−1')+btn('gmenhd',1,'+1'));
      h+=line('인첸트 (최대 3개, 3단계)',Object.keys(ENCH).map(k=>btn('gmench',k,ENCH[k].name,ench.includes(k))).join(''));
    }
    return h+'</div>';
  });
  UI.handlers.gmtab=v=>{tab=v;UI.rerender()};
  UI.handlers.gmcls=v=>{cls=v;UI.rerender()};
  UI.handlers.gmwt=v=>{wt=+v;UI.rerender()};
  UI.handlers.gmtier=v=>{tier=+v;UI.rerender()};
  UI.handlers.gmenh=v=>{enh=+v;UI.rerender()};
  UI.handlers.gmenhd=v=>{enh=clamp(enh+(+v),0,20);UI.rerender()};
  UI.handlers.gmench=v=>{ench=ench.includes(v)?ench.filter(k=>k!==v):ench.concat(v).slice(-3);UI.rerender()};
  UI.handlers.gmjob=v=>run(()=>gmApply('gmJob',v),JOBS[v].name+'(으)로 바꿨습니다');
  UI.handlers.gmgrow=v=>run(()=>gmApply('gmGrowth',v==='1'),v==='1'?'강화·벌목 숙련 만렙':'강화를 초기화했습니다');
  UI.handlers.gmget=()=>run(()=>gmApply('gmWeapon',base(),enh,ench),wName(base())+' 지급');
}
