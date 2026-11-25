/* ---------------- server API ----------------
   온라인: Supabase RPC (서버가 경험치·골드·드랍·강화 확률을 모두 판정)
   오프라인(연결 실패 / 미리보기): 같은 규칙의 LocalAPI (이 기기 localStorage)        */
const RW_CFG={
  url:'https://vrdegvpgbmfdkkylkyic.supabase.co',
  key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZGVndnBnYm1mZGtreWxreWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1OTc2NjEsImV4cCI6MjExMTE3MzY2MX0.hAkPkneofLolnsampMNNX_S1iEyWTZPT5aLOV6PMYnQ'
};
const SES={name:'',token:'',pf:null,online:false,mode:'?'};

async function rpc(fn,args){
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
const LocalAPI=(()=>{
  const KEY='rw_local_db_v1';
  let db={acc:{},items:[],auc:[],nid:1,aid:1};
  const rd=()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)db=s}catch(e){}};
  const wr=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}};
  const E=c=>{throw new Error(c)};
  const xpNeed=l=>30+9*l*l;
  const jobOK=id=>JOBS[id];
  function pf(a){
    return{name:a.name,cls:a.cls,job:a.job,level:a.level,xp:a.xp,need:xpNeed(a.level),gold:a.gold,kills:a.kills,
      items:db.items.filter(i=>i.owner===a.name&&!i.gone).map(i=>({id:i.id,kind:i.kind,base:i.base,enh:i.enh,ench:i.ench,qty:i.qty,eq:i.eq,listed:i.listed}))};
  }
  function auth(n,t){const a=db.acc[n];if(!a||a.token!==t)E('BAD_AUTH');return a}
  function give(n,kind,base,q){
    if(kind==='potion'){const it=db.items.find(i=>i.owner===n&&i.kind==='potion'&&i.base===base&&!i.listed&&!i.gone);if(it){it.qty+=q;return it}}
    const it={id:db.nid++,owner:n,kind,base,enh:0,ench:[],qty:q,eq:false,listed:false,gone:false};db.items.push(it);return it;
  }
  function applyXp(a,x){a.xp+=x;while(a.level<40&&a.xp>=xpNeed(a.level)){a.xp-=xpNeed(a.level);a.level++}if(a.level>=40)a.xp=0}
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
      if(!['warrior','mage','archer'].includes(cls))E('BAD_CLASS');if(db.acc[name])E('NAME_TAKEN');
      const a=db.acc[name]={name,pass,token:'t'+Math.random().toString(36).slice(2),cls,job:cls,level:1,xp:0,gold:500,kills:0,tokens:60,ts:Date.now()};
      const w=give(name,'weapon',cls+'_1',1);w.eq=true;give(name,'potion','hp1',5);wr();
      return{token:a.token,profile:pf(a)};
    },
    login(name,pass){rd();seedMarket();const a=db.acc[name];if(!a||a.pass!==pass)E('BAD_LOGIN');a.token='t'+Math.random().toString(36).slice(2);wr();return{token:a.token,profile:pf(a)}},
    load(n,t){rd();return pf(auth(n,t))},
    claim(n,t,kills){
      rd();const a=auth(n,t);let tk=Math.min(80,(a.tokens==null?60:a.tokens)+(Date.now()-(a.ts||Date.now()))/1000*2.5);let gx=0,xx=0,got=0;const drops=[];
      for(const k of kills||[]){
        const z=clamp(k.z|0||1,1,4),el=!!k.e;let nn=Math.min(30,k.n|0,Math.floor(tk));if(nn<=0)continue;
        const lo=[1,8,16,26][z-1],hi=[10,18,28,42][z-1];let ml=clamp(k.ml|0||1,lo,hi);ml=Math.min(ml,a.level+10);
        tk-=nn;got+=nn;xx+=nn*(6+ml*4)*(el?6:1);gx+=Math.floor(nn*(2+ml*1.6)*(el?5:1));
        for(let i=0;i<nn;i++){
          if(rnd01()<(el?.3:.035)){const tier=clamp(Math.round(ml/5+rnd01()*1.6-.6),1,8),cls=['warrior','mage','archer'][Math.floor(rnd01()*3)];const b=cls+'_'+tier;give(n,'weapon',b,1);drops.push({kind:'weapon',base:b,qty:1})}
          else if(rnd01()<.14){let b=ml<10?'hp1':ml<24?(rnd01()<.6?'hp1':'hp2'):(rnd01()<.5?'hp2':'hp3');if(rnd01()<.08)b=['spd','atk','def'][Math.floor(rnd01()*3)];give(n,'potion',b,1);drops.push({kind:'potion',base:b,qty:1})}
        }
      }
      a.tokens=tk;a.ts=Date.now();a.gold+=gx;a.kills+=got;applyXp(a,xx);wr();
      return{gold:gx,xp:xx,n:got,drops,profile:pf(a)};
    },
    buy(n,t,base,q){
      rd();const a=auth(n,t);q=clamp(q|0||1,1,99);
      if(POTIONS[base]){const p=POTIONS[base].price*q;if(a.gold<p)E('NO_GOLD');a.gold-=p;give(n,'potion',base,q)}
      else if(/^(warrior|mage|archer)_[23]$/.test(base)){const p=WVALUE[wTier(base)-1];if(a.gold<p)E('NO_GOLD');a.gold-=p;give(n,'weapon',base,1)}
      else E('NOT_SOLD');
      wr();return pf(a);
    },
    sell(n,t,id,q){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.id===id&&i.owner===n&&!i.gone);if(!it||it.listed||it.eq)E('BAD_ITEM');
      let v;if(it.kind==='weapon'){v=sellValue(it);it.gone=true}else{const qq=clamp(q|0||1,1,it.qty);v=Math.floor(POTIONS[it.base].price*.25*qq);it.qty-=qq;if(it.qty<=0)it.gone=true}
      a.gold+=v;wr();return pf(a);
    },
    equip(n,t,id){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.id===id&&i.owner===n&&i.kind==='weapon'&&!i.gone);if(!it||it.listed)E('BAD_ITEM');
      if(wCls(it.base)!==a.cls)E('WRONG_CLASS');if(a.level<wReq(it.base))E('LOW_LEVEL');
      db.items.forEach(i=>{if(i.owner===n&&i.kind==='weapon')i.eq=false});it.eq=true;wr();return pf(a);
    },
    usePotion(n,t,base){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.owner===n&&i.kind==='potion'&&i.base===base&&!i.listed&&!i.gone&&i.qty>0);if(!it)E('NO_POTION');
      it.qty--;if(it.qty<=0)it.gone=true;wr();return{ok:true,profile:pf(a)};
    },
    enhance(n,t,id){
      rd();const a=auth(n,t);const it=db.items.find(i=>i.id===id&&i.owner===n&&i.kind==='weapon'&&!i.gone);if(!it||it.listed)E('BAD_ITEM');
      if(it.enh>=20)E('MAX_ENH');const cost=enhCost(it.base,it.enh);if(a.gold<cost)E('NO_GOLD');a.gold-=cost;
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
      rd();const a=auth(n,t);const j=JOBS[job];if(!j||!j.tier||j.cls!==a.cls||j.parent!==a.job)E('BAD_JOB');
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
    tradeOpen(){E('BAD_TARGET')},tradeGet(){E('BAD_TRADE')},tradeSet(){E('BAD_TRADE')},tradeOk(){E('BAD_TRADE')},tradeCancel(){E('BAD_TRADE')}
  };
  return API;
})();

/* ---------- unified client wrapper ---------- */
const NAMES={claim:'rw_claim',buy:'rw_buy',sell:'rw_sell',equip:'rw_equip',usePotion:'rw_use_potion',enhance:'rw_enhance',enchant:'rw_enchant',advance:'rw_advance',
  aucMine:'rw_auction_mine',aucPost:'rw_auction_post',aucCancel:'rw_auction_cancel',aucBuy:'rw_auction_buy',tradeOpen:'rw_trade_open',tradeGet:'rw_trade_get',tradeSet:'rw_trade_set',tradeOk:'rw_trade_ok',tradeCancel:'rw_trade_cancel'};
const ARGS={
  claim:(a)=>({p_kills:a[0]}),buy:a=>({p_base:a[0],p_qty:a[1]}),sell:a=>({p_item:a[0],p_qty:a[1]}),equip:a=>({p_item:a[0]}),usePotion:a=>({p_base:a[0]}),
  enhance:a=>({p_item:a[0]}),enchant:a=>({p_item:a[0],p_slot:a[1]}),advance:a=>({p_job:a[0]}),aucMine:()=>({}),aucPost:a=>({p_item:a[0],p_price:a[1]}),
  aucCancel:a=>({p_id:a[0]}),aucBuy:a=>({p_id:a[0]}),tradeOpen:a=>({p_target:a[0]}),tradeGet:a=>({p_id:a[0]}),tradeSet:a=>({p_id:a[0],p_gold:a[1],p_items:a[2]}),
  tradeOk:a=>({p_id:a[0]}),tradeCancel:a=>({p_id:a[0]})
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
  async resume(name,token){
    const r=SES.mode==='online'?await rpc('rw_load',{p_name:name,p_token:token}):LocalAPI.load(name,token);
    SES.name=name;SES.token=token;SES.pf=r;return r;
  },
  async call(fn,...a){
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
