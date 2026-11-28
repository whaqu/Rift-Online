/* ---------------- server API ----------------
   온라인: Supabase RPC (서버가 경험치·골드·드랍·강화 확률을 모두 판정)
   오프라인(연결 실패 / 미리보기): 같은 규칙의 LocalAPI (이 기기 localStorage)        */
const RW_CFG={
  url:'https://vrdegvpgbmfdkkylkyic.supabase.co',
  key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZGVndnBnYm1mZGtreWxreWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1OTc2NjEsImV4cCI6MjExMTE3MzY2MX0.hAkPkneofLolnsampMNNX_S1iEyWTZPT5aLOV6PMYnQ'
};
const SES={name:'',token:'',pf:null,online:false,mode:'?'};

async function rpc(fn,args){
  if(GUARD.tripped)throw new Error('DEVTOOLS');
  const ctl=typeof AbortController!=='undefined'?new AbortController():null;
  const to=ctl?setTimeout(()=>ctl.abort(),9000):0;
  let r;
  try{
    r=await fetch(RW_CFG.url+'/rest/v1/rpc/'+fn,{method:'POST',signal:ctl?ctl.signal:undefined,
      headers:{apikey:RW_CFG.key,Authorization:'Bearer '+RW_CFG.key,'Content-Type':'application/json'},body:JSON.stringify(args||{})});
  }catch(e){throw new Error('NET')}finally{clearTimeout(to)}
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok)throw new Error((j&&(j.message||j.hint))||'NET');
  return j;
}

/* ---------- local fallback (same rules as the SQL functions) ---------- */
const LOCAL_GM='테스트';   // offline mode: only this name gets the GM panel (starts at Lv.99)
/* offline mirror of rw_dungeon_begin/end: [need level, rank-1 gold, zone id (= weapon grade), side runes, potion] (area rune = dungeon id) */
const DGSRV={
  meadow:[8,4000,1,['holy','ice'],'hp1'],forest:[14,10000,2,['dark','meadow'],'hp1'],ember:[22,18000,3,['fire','thunder'],'hp2'],
  crystal:[30,30000,4,['ice','dark'],'hp2'],storm:[48,90000,5,['thunder','fire'],'hp3'],void:[62,150000,6,['dark','crystal'],'hp3'],
  snow:[72,200000,7,['ice','crystal'],'hp3'],desert:[80,250000,8,['holy','fire'],'hp3'],sky:[90,330000,9,['holy','storm'],'hp3']
};
const LocalAPI=(()=>{
  const KEY='rw_local_db_v1';
  let db={acc:{},items:[],auc:[],nid:1,aid:1};
  const rd=()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)db=s}catch(e){}};
  const wr=()=>{if(GUARD.tripped)return;try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}};
  const E=c=>{throw new Error(c)};
  const xpNeed=l=>30+7*l*l;
  const jobOK=id=>JOBS[id];
  const today=()=>new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
  const yday=()=>new Date(Date.now()+9*3600e3-864e5).toISOString().slice(0,10);
  const hashS=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
  function dqEnsure(a){
    const d=today();if(a.dq&&a.dq.d===d)return a.dq;
    const zmax=a.level>=88?9:a.level>=78?8:a.level>=70?7:a.level>=60?6:a.level>=40?5:a.level>=26?4:a.level>=16?3:a.level>=8?2:1,h=hashS(a.name+d);
    const q=[{k:'any',z:0,t:50+(h%5)*10,p:0,c:false},{k:'zone',z:1+(Math.floor(h/7)%zmax),t:30+(Math.floor(h/11)%4)*5,p:0,c:false}];
    q.push(Math.floor(h/13)%2===0?{k:'elite',z:0,t:2+Math.floor(h/17)%3,p:0,c:false}:{k:'potion',z:0,t:4+Math.floor(h/17)%4,p:0,c:false});
    return a.dq={d,q,b:false};
  }
  function dqProg(a,k,z,n){const dq=dqEnsure(a);for(const q of dq.q)if(q.k===k&&(k!=='zone'||q.z===z)&&!q.c)q.p=Math.min(q.t,q.p+n)}
  function pf(a){
    const d=today(),es=(a.last_daily===d||a.last_daily===yday())?(a.streak||0):0,dd=a.last_daily===d?(((a.streak||1)-1)%7)+1:(es%7)+1;
    return{name:a.name,cls:a.cls,job:a.job,level:a.level,xp:a.xp,need:xpNeed(a.level),gold:a.gold,kills:a.kills,
      duel:{w:0,l:0,pt:0},
      admin:a.name===LOCAL_GM,daily:{ready:a.last_daily!==d,streak:es,day:dd},gather:{xp:a.gat_xp||0,lv:gatLvOf(a.gat_xp||0)},perks:(()=>{const k=Object.assign({a:0,h:0,c:0},a.perks||{});k.pts=Math.max(0,a.level-1-k.a-k.h-k.c);return k})(),dq:JSON.parse(JSON.stringify(dqEnsure(a))),
      items:db.items.filter(i=>i.owner===a.name&&!i.gone).map(i=>({id:i.id,kind:i.kind,base:i.base,enh:i.enh,ench:i.ench,qty:i.qty,eq:i.eq,listed:i.listed,rune:i.rune||null}))};
  }
  function auth(n,t){const a=db.acc[n];if(!a||a.token!==t)E('BAD_AUTH');dqEnsure(a);return a}
  function give(n,kind,base,q){
    if(kind==='rune'){const it=db.items.find(i=>i.owner===n&&i.kind==='rune'&&i.base===base&&i.enh===(arguments[4]||1)&&!i.listed&&!i.gone);if(it){it.qty+=q;return it}const r={id:db.nid++,owner:n,kind,base,enh:arguments[4]||1,ench:[],qty:q,eq:false,listed:false,gone:false};db.items.push(r);return r}
    if(kind==='potion'||kind==='mat'){const it=db.items.find(i=>i.owner===n&&i.kind===kind&&i.base===base&&!i.listed&&!i.gone);if(it){it.qty+=q;return it}}
    const it={id:db.nid++,owner:n,kind,base,enh:0,ench:[],qty:q,eq:false,listed:false,gone:false};db.items.push(it);return it;
  }
  function applyXp(a,x){a.xp+=x;while(a.level<99&&a.xp>=xpNeed(a.level)){a.xp-=xpNeed(a.level);a.level++}if(a.level>=99)a.xp=0}
  const isNightL=()=>{const p=((Date.now()/1000)%DAYLEN)/DAYLEN;return p>=.55&&p<.95};
  const rnd01=Math.random;
  // seed a few fake market listings so the auction house isn't empty offline
  function seedMarket(){
    if(db.auc.some(x=>x.seller==='시장상인'))return;
    if(!db.acc['시장상인'])db.acc['시장상인']={name:'시장상인',pass:'-',token:'-',cls:'warrior',job:'warrior',level:40,xp:0,gold:0,kills:0};
    const picks=[['warrior_3',3,1800],['mage_3',2,1600],['archer_3',4,2600],['warrior_4',1,9000],['mage_4',3,15000],['archer_2',5,2200]];
    for(const[b,e,p]of picks){const it=give('시장상인','weapon',b,1);it.enh=e;db.auc.push({id:db.aid++,seller:'시장상인',item_id:it.id,price:p,status:'active',created:Date.now()});it.listed=true}
    give('시장상인','potion','hp2',20);const hp=db.items[db.items.length-1];hp.listed=true;db.auc.push({id:db.aid++,seller:'시장상인',item_id:hp.id,price:1500,status:'active',created:Date.now()});
  }
  const API={
    register(name,pass,cls){
      rd();seedMarket();
      if(!/^[가-힣A-Za-z0-9_]{2,10}$/.test(name||''))E('BAD_NAME');if(!pass||pass.length<4)E('BAD_PASS');
      if(!CLASSES.includes(cls))E('BAD_CLASS');if(db.acc[name])E('NAME_TAKEN');
      const a=db.acc[name]={name,pass,token:'t'+Math.random().toString(36).slice(2),cls,job:cls,level:name===LOCAL_GM?99:1,xp:0,gold:500,kills:0,tokens:60,ts:Date.now()};
      if(name===LOCAL_GM){a.perks={a:98,h:98,c:40};a.gat_xp=9025}
      const w=give(name,'weapon',cls+'_1',1);w.eq=true;give(name,'potion','hp1',5);wr();
      return{token:a.token,profile:pf(a)};
    },
    login(name,pass){rd();seedMarket();const a=db.acc[name];if(!a||a.pass!==pass)E('BAD_LOGIN');a.token='t'+Math.random().toString(36).slice(2);wr();return{token:a.token,profile:pf(a)}},
    load(n,t){rd();return pf(auth(n,t))},
    claim(n,t,kills){
      rd();const a=auth(n,t);const night=isNightL(),nm=night?1.3:1;let tk=Math.min(80,(a.tokens==null?60:a.tokens)+(Date.now()-(a.ts||Date.now()))/1000*2.5);let gx=0,xx=0,got=0;const drops=[];
      if(!a.gq_ts||Date.now()-a.gq_ts>30*60e3){a.gq_n=0;a.gq_ts=Date.now()}
      const zc=[0,0,0,0,0,0,0,0,0,0];let ec=0;
      for(const k of kills||[]){
        const z=clamp(k.z|0||1,1,9),el=!!k.e,gl=!!k.g;let nn=Math.min(30,k.n|0,Math.floor(tk));if(nn<=0)continue;
        const lo=[1,8,16,26,40,60,70,78,88][z-1],hi=[10,18,28,42,62,72,80,89,99][z-1];let ml=clamp(k.ml|0||1,lo,hi);ml=Math.min(ml,a.level+10);
        tk-=nn;got+=nn;zc[z]+=nn;if(el)ec+=nn;xx+=Math.floor(nn*(6+ml*4)*(el?6:1)*nm);gx+=Math.floor(nn*(2+ml*1.6)*(el?5:1)*nm);
        if(gl&&!el){const i3=Math.min(nn,3,Math.max(0,8-a.gq_n));if(i3>0){gx+=Math.floor(i3*(2+ml*1.6)*30*nm);a.gq_n+=i3}}
        for(let i=0;i<nn;i++){
          const rr=rnd01(),wc=(el?.3:.035)*(night?1.4:1),ac=(el?.22:.03)*(night?1.4:1),tier=clamp(Math.round(ml/9+rnd01()*1.6-.6),1,8);
          if(rr<wc){const cls=rnd01()<.6?a.cls:CLASSES[Math.floor(rnd01()*CLASSES.length)],wt=Math.floor(rnd01()*3),wz=Math.min(z,[1,8,16,26,40,60,70,78,88].filter(v=>v<=ml).length),b=cls+'_'+wz+(wt?'_'+wt:'');give(n,'weapon',b,1);drops.push({kind:'weapon',base:b,qty:1})}
          else if(rr<wc+ac){const b=ASLOTS[Math.floor(rnd01()*4)]+'_'+tier+'_'+ASET_KEYS[Math.floor(rnd01()*3)];give(n,'armor',b,1);drops.push({kind:'armor',base:b,qty:1})}
          else if(rnd01()<.14){let b=ml<10?'hp1':ml<24?(rnd01()<.6?'hp1':'hp2'):(rnd01()<.5?'hp2':'hp3');if(rnd01()<.08)b=['spd','atk','def'][Math.floor(rnd01()*3)];give(n,'potion',b,1);drops.push({kind:'potion',base:b,qty:1})}
        }
      }
      a.tokens=tk;a.ts=Date.now();a.gold+=gx;a.kills+=got;
      if(got>0){dqProg(a,'any',0,got);for(let i=1;i<=9;i++)if(zc[i]>0)dqProg(a,'zone',i,zc[i]);if(ec>0)dqProg(a,'elite',0,ec)}
      applyXp(a,xx);wr();
      return{gold:gx,xp:xx,n:got,drops,night,profile:pf(a)};
    },
    daily(n,t){
      rd();const a=auth(n,t),d=today();if(a.last_daily===d)E('ALREADY');
      const ns=a.last_daily===yday()?(a.streak||0)+1:1,dy=((ns-1)%7)+1,base=500+a.level*60,pot=a.level>=16?'hp2':'hp1';let rg=0;
      if(dy===1)rg=base;else if(dy===2)give(n,'potion',pot,5);else if(dy===3)rg=base*2;else if(dy===4){give(n,'potion','atk',3);give(n,'potion','def',3)}
      else if(dy===5){give(n,'potion',pot,8);rg=base}else if(dy===6){rg=base*3;give(n,'potion','spd',3)}else{rg=base*6;give(n,'potion','hp3',5);give(n,'potion','atk',5)}
      a.gold+=rg;a.streak=ns;a.last_daily=d;wr();return{day:dy,gold:rg,profile:pf(a)};
    },
    dqClaim(n,t,idx){
      rd();const a=auth(n,t),dq=dqEnsure(a),pot=a.level>=16?'hp2':'hp1';let rg,rx;
      if(idx>=0&&idx<=2){const q=dq.q[idx];if(!q||q.p<q.t||q.c)E('NOT_READY');q.c=true;rg=400+a.level*90;rx=Math.floor(xpNeed(a.level)*.2);a.gold+=rg;give(n,'potion',pot,3)}
      else if(idx===3){if(dq.b)E('ALREADY');if(dq.q.filter(q=>q.c).length<3)E('NOT_READY');dq.b=true;rg=(400+a.level*90)*3;rx=Math.floor(xpNeed(a.level)*.5);a.gold+=rg;give(n,'potion','atk',2);give(n,'potion','def',2);give(n,'potion',pot,5)}
      else E('BAD_ARGS');
      applyXp(a,rx);wr();return{gold:rg,xp:rx,profile:pf(a)};
    },
    buy(n,t,base,q){
      rd();const a=auth(n,t);q=clamp(q|0||1,1,99);
      if(POTIONS[base]){const p=POTIONS[base].price*q;if(a.gold<p)E('NO_GOLD');a.gold-=p;give(n,'potion',base,q)}
      else if(new RegExp('^('+CLASSES.join('|')+')_[2-4](_[12])?$').test(base)){const p=WVALUE[wTier(base)-1];if(a.gold<p)E('NO_GOLD');a.gold-=p;give(n,'weapon',base,1)}
      else if(/^(helm|body|gloves|boots)_[1-4]_(plate|leather|cloth)$/.test(base)){const p=AVALUE[wTier(base)-1];if(a.gold<p)E('NO_GOLD');a.gold-=p;give(n,'armor',base,1)}
      else E('NOT_SOLD');
      wr();return pf(a);
    },
    sell(n,t,id,q){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.id===id&&i.owner===n&&!i.gone);if(!it||it.listed||it.eq)E('BAD_ITEM');
      let v;if(it.kind==='rune'){const qq=clamp(q|0||1,1,it.qty);v=runePrice(it.base,it.enh)*qq;it.qty-=qq;if(it.qty<=0)it.gone=true}else if(it.kind==='weapon'||it.kind==='armor'){v=sellValue(it);it.gone=true}else if(it.kind==='mat'){const qq=clamp(q|0||1,1,it.qty);v=(MATS[it.base]?MATS[it.base].price:0)*qq;it.qty-=qq;if(it.qty<=0)it.gone=true}else{const qq=clamp(q|0||1,1,it.qty);v=Math.floor(POTIONS[it.base].price*.25*qq);it.qty-=qq;if(it.qty<=0)it.gone=true}
      a.gold+=v;wr();return pf(a);
    },
    runeAttach(n,t,wid,rid){
      rd();const a=auth(n,t);const w=db.items.find(i=>i.id===wid&&i.owner===n&&i.kind==='weapon'&&!i.gone&&!i.listed),r=db.items.find(i=>i.id===rid&&i.owner===n&&i.kind==='rune'&&!i.gone&&!i.listed&&i.qty>0);
      if(!w||!r)E('BAD_ITEM');w.rune=r.base+':'+r.enh;r.qty--;if(r.qty<=0)r.gone=true;wr();return pf(a);
    },
    runeFuse(n,t,mode,base,grade){
      rd();const a=auth(n,t);
      const have=(b,g)=>db.items.filter(i=>i.owner===n&&i.kind==='rune'&&i.base===b&&i.enh===g&&!i.gone&&!i.listed).reduce((s,i)=>s+i.qty,0);
      const take=(b,g,c)=>{for(const i of db.items){if(c<=0)break;if(i.owner===n&&i.kind==='rune'&&i.base===b&&i.enh===g&&!i.gone&&!i.listed){const x=Math.min(i.qty,c);i.qty-=x;c-=x;if(i.qty<=0)i.gone=true}}};
      if(mode==='up'){
        if(base==='all'||!RUNES[base]||(grade!==1&&grade!==2))E('BAD_ARGS');if(have(base,grade)<3)E('NO_RUNE');take(base,grade,3);give(n,'rune',base,1,grade+1);
      }else if(mode==='all'){
        const gs=RUNE_KEYS.map(b=>have(b,2)?2:have(b,3)?3:0);if(gs.some(g=>!g))E('NO_RUNE');RUNE_KEYS.forEach((b,i)=>take(b,gs[i],1));give(n,'rune','all',1,1);
      }else E('BAD_ARGS');
      wr();return pf(a);
    },
    runeBrew(n,t,id){
      rd();const a=auth(n,t);const r=db.items.find(i=>i.id===id&&i.owner===n&&i.kind==='rune'&&!i.gone&&!i.listed&&i.qty>0);if(!r||!RUNE_POTION[r.base])E('BAD_ITEM');
      const sp=RUNE_POTION[r.base],q=sp[1]*r.enh;r.qty--;if(r.qty<=0)r.gone=true;give(n,'potion',sp[0],q);wr();return{potion:sp[0],qty:q,profile:pf(a)};
    },
    dgBegin(n,t,dg){
      rd();const a=auth(n,t);const need=(DGSRV[dg]||[])[0];if(!need)E('BAD_ARGS');if(a.level<need)E('LOW_LEVEL');a.dgRun={dg,ts:Date.now()};wr();return{run:1};
    },
    dgEnd(n,t,dg,rank){
      rd();const a=auth(n,t);const r=a.dgRun;if(!r||r.dg!==dg)E('NO_RUN');if(Date.now()-r.ts<45000)E('TOO_FAST');a.dgRun=null;
      const rk=clamp(rank|0||5,1,5),[,base,zid,els,pot]=DGSRV[dg],zr=dg;
      const gd=Math.floor(base*[1,.6,.5,.4,.35][rk-1]);a.gold+=gd;const rw=[{t:'gold',n:gd}];
      if(rk===1){
        if(rnd01()<.5){const wt=rnd01()<.5?0:rnd01()<.5?1:2,pb=a.cls+'_'+zid+(wt?'_'+wt:'');give(n,'weapon',pb,1);rw.push({t:'weapon',base:pb})}
        else{const g=rnd01()<.85?2:3,er=els[Math.floor(rnd01()*2)];give(n,'rune',zr,1,g);give(n,'rune',er,2,1);rw.push({t:'rune',base:zr,g,n:1},{t:'rune',base:er,g:1,n:2})}
      }else{
        give(n,'potion',pot,3);rw.push({t:'potion',base:pot,n:3});
        if(rnd01()<.15+(rk===2?.1:0)){const er=rnd01()<.4?zr:els[Math.floor(rnd01()*2)];give(n,'rune',er,1,1);rw.push({t:'rune',base:er,g:1,n:1})}
      }
      wr();return{rewards:rw,rank:rk,profile:pf(a)};
    },
    gather(n,t,weed,wood){
      rd();const a=auth(n,t);const lv0=gatLvOf(a.gat_xp||0),ch=gatDouble(lv0);
      let tk=Math.min(40,(a.gat_tk==null?40:a.gat_tk)+(Date.now()-(a.gat_ts||Date.now()))/1000*4);
      let w=Math.min(tk|0,clamp(weed|0,0,30));tk-=w;let d=Math.min((tk/2)|0,clamp(wood|0,0,30));tk-=d*2;
      let gw=0,gd=0;for(let i=0;i<w;i++)gw+=1+(rnd01()<ch?1:0);for(let i=0;i<d;i++)gd+=1+(rnd01()<ch?1:0);
      a.gat_tk=tk;a.gat_ts=Date.now();a.gat_xp=(a.gat_xp||0)+w+d*5;
      if(gw>0)give(n,'mat','weed',gw);if(gd>0)give(n,'mat','wood',gd);
      wr();return{weed:gw,wood:gd,up:gatLvOf(a.gat_xp)>lv0,profile:pf(a)};
    },
    perk(n,t,kind){
      rd();const a=auth(n,t);if(!PERK[kind])E('BAD_ARGS');const k=Object.assign({a:0,h:0,c:0},a.perks||{});
      if(a.level-1-k.a-k.h-k.c<=0)E('NO_POINTS');k[kind]++;a.perks={a:k.a,h:k.h,c:k.c};wr();return pf(a);
    },
    equip(n,t,id){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.id===id&&i.owner===n&&(i.kind==='weapon'||i.kind==='armor')&&!i.gone);if(!it||it.listed)E('BAD_ITEM');
      if(it.kind==='weapon'){if(wCls(it.base)!==a.cls)E('WRONG_CLASS');db.items.forEach(i=>{if(i.owner===n&&i.kind==='weapon')i.eq=false});it.eq=true}
      else if(it.eq)it.eq=false;
      else{db.items.forEach(i=>{if(i.owner===n&&i.kind==='armor'&&aSlot(i.base)===aSlot(it.base))i.eq=false});it.eq=true}
      wr();return pf(a);
    },
    usePotion(n,t,base){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.owner===n&&i.kind==='potion'&&i.base===base&&!i.listed&&!i.gone&&i.qty>0);if(!it)E('NO_POTION');
      it.qty--;if(it.qty<=0)it.gone=true;dqProg(a,'potion',0,1);wr();return{ok:true,profile:pf(a)};
    },
    enhance(n,t,id){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.id===id&&i.owner===n&&(i.kind==='weapon'||i.kind==='armor')&&!i.gone);if(!it||it.listed)E('BAD_ITEM');
      if(it.enh>=maxEnh(it))E('MAX_ENH');const cost=enhCost(it.base,it.enh);if(a.gold<cost)E('NO_GOLD');a.gold-=cost;
      const rate=ENH_RATE[it.enh];let res;
      if(rnd01()*100<rate){it.enh++;res='success'}else if(it.enh>=7){it.enh--;res='drop'}else res='fail';
      wr();return{result:res,cost,rate,enh:it.enh,profile:pf(a)};
    },
    enchant(n,t,id,slot){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.id===id&&i.owner===n&&i.kind==='weapon'&&!i.gone);if(!it||it.listed)E('BAD_ITEM');
      const cnt=it.ench.length;let cost,res;
      if(slot==null||slot<0){
        if(cnt>=3)E('SLOTS_FULL');cost=2500*(cnt+1)*(cnt+1);if(a.gold<cost)E('NO_GOLD');
        const av=Object.keys(ENCH).filter(k=>!it.ench.some(e=>e.k===k));it.ench=it.ench.concat([{k:av[Math.floor(rnd01()*av.length)],l:1}]);res='added';
      }else{
        if(slot>=cnt)E('BAD_SLOT');const e=it.ench[slot];if(e.l>=3)E('MAX_ENCH');cost=4000*e.l*e.l;if(a.gold<cost)E('NO_GOLD');
        if(rnd01()<(e.l===1?.55:.3)){it.ench=it.ench.map((x,i)=>i===slot?{k:x.k,l:x.l+1}:x);res='success'}else res='fail';
      }
      a.gold-=cost;wr();return{result:res,cost,profile:pf(a)};
    },
    advance(n,t,job){
      rd();const a=auth(n,t);const j=JOBS[job];if(!j||!(j.tier===1||j.tier===2)||j.cls!==a.cls||j.parent!==a.job)E('BAD_JOB');
      if(a.level<j.req)E('LOW_LEVEL');if(a.gold<j.price)E('NO_GOLD');a.gold-=j.price;a.job=job;wr();return pf(a);
    },
    aucList(kind,cls){
      rd();seedMarket();
      return db.auc.filter(x=>x.status==='active').map(x=>({x,i:db.items.find(i=>i.id===x.item_id)})).filter(o=>o.i&&(!kind||o.i.kind===kind)&&(!cls||(o.i.kind==='weapon'&&wCls(o.i.base)===cls)))
        .sort((a,b)=>b.x.created-a.x.created).slice(0,60).map(o=>({id:o.x.id,seller:o.x.seller,price:o.x.price,item:{id:o.i.id,kind:o.i.kind,base:o.i.base,enh:o.i.enh,ench:o.i.ench,qty:o.i.qty}}));
    },
    aucMine(n,t){rd();auth(n,t);return db.auc.filter(x=>x.seller===n).sort((a,b)=>b.id-a.id).slice(0,30).map(x=>{const i=db.items.find(i=>i.id===x.item_id);return{id:x.id,price:x.price,status:x.status,buyer:x.buyer,item:{id:i.id,kind:i.kind,base:i.base,enh:i.enh,ench:i.ench,qty:i.qty}}})},
    aucPost(n,t,id,price){
      rd();const a=auth(n,t);if(!(price>=1&&price<=1e8))E('BAD_PRICE');const it=db.items.find(i=>i.id===id&&i.owner===n&&!i.gone);if(!it||it.listed||it.eq)E('BAD_ITEM');
      if(db.auc.filter(x=>x.seller===n&&x.status==='active').length>=20)E('TOO_MANY');it.listed=true;db.auc.push({id:db.aid++,seller:n,item_id:it.id,price,status:'active',created:Date.now()});wr();return pf(a);
    },
    aucCancel(n,t,id){rd();const a=auth(n,t);const x=db.auc.find(x=>x.id===id&&x.seller===n&&x.status==='active');if(!x)E('BAD_LISTING');x.status='cancelled';db.items.find(i=>i.id===x.item_id).listed=false;wr();return pf(a)},
    aucBuy(n,t,id){
      rd();const a=auth(n,t);const x=db.auc.find(x=>x.id===id&&x.status==='active');if(!x)E('SOLD_OUT');if(x.seller===n)E('OWN_LISTING');if(a.gold<x.price)E('NO_GOLD');
      const fee=Math.floor(x.price*.05);a.gold-=x.price;const s=db.acc[x.seller];if(s)s.gold+=x.price-fee;
      const it=db.items.find(i=>i.id===x.item_id);it.owner=n;it.listed=false;it.eq=false;x.status='sold';x.buyer=n;wr();return pf(a);
    },
    gmGrowth(n,t,max){
      rd();const a=auth(n,t);if(n!==LOCAL_GM)E('NOT_ADMIN');
      if(max){a.perks={a:98,h:98,c:40};a.gat_xp=Math.max(a.gat_xp||0,9025)}else a.perks={a:0,h:0,c:0};
      wr();return pf(a);
    },
    gmPassword(n,t,old,nw){
      rd();const a=auth(n,t);if(n!==LOCAL_GM)E('NOT_ADMIN');if(a.pass!==old)E('BAD_OLD_PASS');
      if(!nw||nw.length<8||nw.length>40||nw===old)E('BAD_NEW_PASS');a.pass=nw;a.token='t'+Math.random().toString(36).slice(2);wr();return{token:a.token};
    },
    gmResetInv(n,t){
      rd();const a=auth(n,t);if(n!==LOCAL_GM)E('NOT_ADMIN');
      db.auc.forEach(x=>{if(x.seller===n&&x.status==='active')x.status='cancelled'});
      db.items.forEach(i=>{if(i.owner===n){i.gone=true;i.eq=false;i.listed=false}});
      give(n,'weapon',a.cls+'_1',1).eq=true;give(n,'potion','hp1',5);wr();return pf(a);
    },
    gmJob(n,t,job){
      rd();const a=auth(n,t);if(n!==LOCAL_GM)E('NOT_ADMIN');const j=JOBS[job];if(!j||j.tier===9)E('BAD_JOB');a.cls=j.cls;a.job=job;
      const ws=db.items.filter(i=>i.owner===n&&i.kind==='weapon'&&!i.gone);ws.forEach(i=>{if(wCls(i.base)!==j.cls)i.eq=false});
      if(!ws.some(i=>i.eq)){let w=ws.filter(i=>!i.listed&&wCls(i.base)===j.cls).sort((x,y)=>wTier(y.base)-wTier(x.base)||y.enh-x.enh)[0];if(!w)w=give(n,'weapon',j.cls+'_1',1);w.eq=true}
      wr();return pf(a);
    },
    gmWeapon(n,t,base,enh,ench){
      rd();const a=auth(n,t);if(n!==LOCAL_GM)E('NOT_ADMIN');const k=ench||[];
      if(!new RegExp('^('+CLASSES.join('|')+')_[1-9](_[12])?$').test(base)||!(enh>=0&&enh<=20)||k.length>3||new Set(k).size!==k.length||!k.every(x=>ENCH[x]))E('BAD_ARGS');
      const mine=wCls(base)===a.cls;if(mine)db.items.forEach(i=>{if(i.owner===n&&i.kind==='weapon')i.eq=false});
      const it=give(n,'weapon',base,1);it.enh=enh;it.ench=k.map(x=>({k:x,l:3}));it.eq=mine;wr();return pf(a);
    },
    tradeOpen(){E('BAD_TARGET')},tradeGet(){E('BAD_TRADE')},tradeSet(){E('BAD_TRADE')},tradeOk(){E('BAD_TRADE')},tradeCancel(){E('BAD_TRADE')}
  };
  return API;
})();

/* ---------- unified client wrapper ---------- */
const NAMES={duelLose:'rw_duel_lose',claim:'rw_claim',buy:'rw_buy',sell:'rw_sell',equip:'rw_equip',usePotion:'rw_use_potion',gather:'rw_gather',enhance:'rw_enhance',enchant:'rw_enchant',perk:'rw_perk',advance:'rw_advance',daily:'rw_daily',dqClaim:'rw_dq_claim',
  aucMine:'rw_auction_mine',aucPost:'rw_auction_post',aucCancel:'rw_auction_cancel',aucBuy:'rw_auction_buy',tradeOpen:'rw_trade_open',tradeGet:'rw_trade_get',tradeSet:'rw_trade_set',tradeOk:'rw_trade_ok',tradeCancel:'rw_trade_cancel',gmJob:'rw_gm_job',gmWeapon:'rw_gm_weapon',gmGrowth:'rw_gm_growth',gmResetInv:'rw_gm_reset_inventory',runeAttach:'rw_rune_attach',runeFuse:'rw_rune_fuse',runeBrew:'rw_rune_brew',dgBegin:'rw_dungeon_begin',dgEnd:'rw_dungeon_end'};
const ARGS={
  duelLose:a=>({p_winner:a[0],p_id:a[1]}),
  claim:(a)=>({p_kills:a[0]}),buy:a=>({p_base:a[0],p_qty:a[1]}),sell:a=>({p_item:a[0],p_qty:a[1]}),gather:a=>({p_weed:a[0],p_wood:a[1]}),equip:a=>({p_item:a[0]}),usePotion:a=>({p_base:a[0]}),
  enhance:a=>({p_item:a[0]}),enchant:a=>({p_item:a[0],p_slot:a[1]}),perk:a=>({p_kind:a[0]}),advance:a=>({p_job:a[0]}),daily:()=>({}),dqClaim:a=>({p_idx:a[0]}),aucMine:()=>({}),aucPost:a=>({p_item:a[0],p_price:a[1]}),
  aucCancel:a=>({p_id:a[0]}),aucBuy:a=>({p_id:a[0]}),tradeOpen:a=>({p_target:a[0]}),tradeGet:a=>({p_id:a[0]}),tradeSet:a=>({p_id:a[0],p_gold:a[1],p_items:a[2]}),
  tradeOk:a=>({p_id:a[0]}),tradeCancel:a=>({p_id:a[0]}),gmJob:a=>({p_job:a[0]}),gmWeapon:a=>({p_base:a[0],p_enh:a[1],p_ench:a[2]}),gmGrowth:a=>({p_max:a[0]}),gmResetInv:()=>({}),
  runeAttach:a=>({p_weapon:a[0],p_rune:a[1]}),runeFuse:a=>({p_mode:a[0],p_base:a[1]||'',p_grade:a[2]||0}),runeBrew:a=>({p_item:a[0]}),dgBegin:a=>({p_dg:a[0]}),dgEnd:a=>({p_dg:a[0],p_rank:a[1]})
};
const API={
  async probe(){
    if(SES.mode!=='?')return SES.mode;
    try{await rpc('rw_auction_list',{p_limit:1});SES.mode='online'}catch(e){SES.mode='local'}
    SES.online=SES.mode==='online';return SES.mode;
  },
  async register(name,pass,cls){
    const r=SES.mode==='online'?await rpc('rw_register',{p_name:name,p_pass:pass,p_cls:cls}):LocalAPI.register(name,pass,cls);
    SES.name=name;SES.token=r.token;SES.pf=r.profile;return r.profile;
  },
  async login(name,pass){
    const r=SES.mode==='online'?await rpc('rw_login',{p_name:name,p_pass:pass}):LocalAPI.login(name,pass);
    SES.name=name;SES.token=r.token;SES.pf=r.profile;return r.profile;
  },
  // the server replaces the session on a password change, so keep the new token (also for auto-resume)
  async changePassword(old,nw){
    const r=SES.mode==='online'?await rpc('rw_gm_password',{p_name:SES.name,p_token:SES.token,p_old:old,p_new:nw}):LocalAPI.gmPassword(SES.name,SES.token,old,nw);
    SES.token=r.token;try{localStorage.setItem('rw_sess',JSON.stringify({name:SES.name,token:SES.token,mode:SES.mode}))}catch(e){}
  },
  async resume(name,token){
    const r=SES.mode==='online'?await rpc('rw_load',{p_name:name,p_token:token}):LocalAPI.load(name,token);
    SES.name=name;SES.token=token;SES.pf=r;return r;
  },
  async call(fn,...a){
    if(GUARD.tripped)throw new Error('DEVTOOLS');
    let r;
    if(SES.mode==='online')r=await rpc(NAMES[fn],Object.assign({p_name:SES.name,p_token:SES.token},ARGS[fn](a)));
    else r=LocalAPI[fn](SES.name,SES.token,...a);
    const p=r&&r.profile?r.profile:(r&&r.items&&r.name?r:null);if(p)SES.pf=p;
    return r;
  },
  async aucList(kind,cls){
    if(SES.mode==='online')return rpc('rw_auction_list',{p_kind:kind||null,p_cls:cls||null,p_limit:60});
    return LocalAPI.aucList(kind,cls);
  }
};
