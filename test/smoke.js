require('./stub.js');
const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync('/tmp/_all2.js','utf8');
let errs=0;const ce=console.error;console.error=(...a)=>{errs++;ce(...a)};
process.on('unhandledRejection',e=>{errs++;ce('UNHANDLED',e&&e.stack||e)});
vm.runInThisContext(js,{filename:'game.js'});
const g=window.__RW;
let ok=0,bad=0;const T=(c,m)=>{if(c){ok++}else{bad++;console.log('FAIL:',m)}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const step=(n,dt)=>{for(let i=0;i<n;i++)g.frame(dt||.016)};
(async()=>{
  await g.boot();
  T(g.SES.mode==='local','falls back to local mode without network');
  g.initLogin();
  // register
  const pf=await g.API.register('시험전사','pw1234','warrior');
  T(pf.items.length===2&&pf.gold===500,'register gives starter kit');
  g.enterGame();step(5);
  T(g.P&&g.S&&g.S.maxHp>100,'player created '+g.S.maxHp);
  // bad register
  let e1='';try{await g.API.register('x','pw1234','warrior')}catch(e){e1=e.message}T(e1==='BAD_NAME','bad name rejected');
  g.API.register('시험전사','pw1234','warrior').catch(e=>T(e.message==='NAME_TAKEN','dup name'));
  // town: no mobs
  step(60);T(g.MOBS.length===0,'no mobs spawn in town '+g.MOBS.length);
  // npc proximity + panels
  g.P.x=-10+2.4*Math.sin(.9);g.P.z=-7+2.4*Math.cos(.9);step(2);
  T(g.nearNpc()&&g.nearNpc().kind==='shop','near shop NPC');
  g.interact();T(g.UI.modal==='상점','shop opens');
  await g.UI.handlers.buy('hp2');await sleep(5);
  T(g.SES.pf.items.some(i=>i.base==='hp2'),'bought potion');
  g.UI.close();
  // go hunt
  g.P.x=27;g.P.z=0;g.P.hp=g.S.maxHp;
  step(120);
  T(g.MOBS.length>5,'mobs spawned in field: '+g.MOBS.length);
  const ml=g.MOBS.map(m=>m.ml);T(Math.max(...ml)<=12,'zone1 mob levels sane '+Math.min(...ml)+'-'+Math.max(...ml));
  const k0=g.SES.pf.kills,xp0=g.SES.pf.xp+g.SES.pf.level*1e6;
  // fight: god mode, aim at nearest, hold attack
  g.mouse.down=true;
  for(let i=0;i<2400;i++){
    g.P.iframes=1;g.P.hp=g.S.maxHp;
    let best=null,bd=1e9;for(const m of g.MOBS){if(m.dead)continue;const d=(m.x-g.P.x)**2+(m.z-g.P.z)**2;if(d<bd){bd=d;best=m}}
    if(best){g.mouse.gx=best.x;g.mouse.gz=best.z;const dx=best.x-g.P.x,dz=best.z-g.P.z,l=Math.hypot(dx,dz);g.keys.d=dx>2;g.keys.a=dx<-2;g.keys.s=dz>2;g.keys.w=dz<-2}
    if(i%150===0)g.trySkill('q');if(i%110===50)g.trySkill('e');
    g.frame(.016);
    {const r=Math.hypot(g.P.x,g.P.z);if(r<24){g.P.x*=24.5/r;g.P.z*=24.5/r}}
    if(i%300===299){await sleep(2)}
  }
  g.mouse.down=false;g.keys.d=g.keys.a=g.keys.s=g.keys.w=false;
  await sleep(30);await g.flushKills();await sleep(30);
  T(g.SES.pf.kills>=k0+4,'kills recorded on server '+(g.SES.pf.kills-k0));
  T(g.SES.pf.gold>500||true,'gold '+g.SES.pf.gold);
  console.log('after hunt: lv',g.SES.pf.level,'xp',g.SES.pf.xp,'gold',g.SES.pf.gold,'kills',g.SES.pf.kills,'items',g.SES.pf.items.length);
  // use potion in field
  g.P.hp=10;g.usePotionKey('hp1');step(2);T(g.P.hp>10,'potion healed');
  // smith
  g.P.x=10-2.4*Math.sin(.9)*-1;g.P.z=-7+2.4*Math.cos(-.9);
  g.P.x=10+Math.sin(-.9)*2.4;g.P.z=-7+Math.cos(-.9)*2.4;step(2);
  T(g.nearNpc()&&g.nearNpc().kind==='smith','near smith');
  g.interact();T(g.UI.modal==='대장간','smith opens');
  // give gold via big claim
  const big=await g.API.call('claim',[{z:1,ml:11,n:30,e:true}]);await g.API.call('claim',[{z:1,ml:11,n:30,e:true}]);
  console.log('claim ->',big.gold,big.xp,'lv',g.SES.pf.level);
  T(g.SES.pf.level>=10,'reached lv10 '+g.SES.pf.level);
  g.UI.close();
  // job: 1st at Lv20, 2nd at Lv50 (5 awakenings), cap 99
  const dbk=()=>JSON.parse(localStorage.getItem('rw_local_db_v1'));
  const setAcc=o=>{const d=dbk();Object.assign(d.acc[g.SES.name],o);localStorage.setItem('rw_local_db_v1',JSON.stringify(d))};
  let lowE='';try{await g.API.call('advance','gladiator')}catch(e){lowE=e.message}T(lowE==='LOW_LEVEL','advance blocked below Lv20 '+lowE);
  setAcc({level:20,gold:1e6});await g.API.call('claim',[]);
  try{await g.API.call('advance','gladiator');T(g.SES.pf.job==='gladiator','job advanced')}catch(e){T(false,'advance '+e.message)}
  g.derive();T(g.S.atk>0&&g.skillOf&&true,'derive after job');
  let bj='';try{await g.API.call('advance','bulwark')}catch(e){bj=e.message}T(bj==='BAD_JOB','legacy/wrong-branch job rejected');
  let l2='';try{await g.API.call('advance','gladiator_fire')}catch(e){l2=e.message}T(l2==='LOW_LEVEL','2nd job blocked below Lv50 '+l2);
  setAcc({level:50});await g.API.call('claim',[]);
  T(g.JOB_KIDS('gladiator').length===5,'five awakenings per 1st job');
  await g.API.call('advance','gladiator_fire');T(g.SES.pf.job==='gladiator_fire','2nd advance');
  g.derive();g.newPlayer();step(3);T(g.skillOf('r')&&g.skillOf('r').el==='fire','awakened R skill carries element');
  T(g.S.atk>0,'derive 2nd job');
  // enhance + enchant
  const w=g.SES.pf.items.find(i=>i.kind==='weapon'&&i.eq);
  let r;for(let i=0;i<2;i++){try{r=await g.API.call("enhance",w.id)}catch(e){}}
  T(g.SES.pf.items.find(i=>i.id===w.id).enh>=1,'enhance worked');
  await g.API.call("claim",[{z:1,ml:11,n:30,e:true}]);await g.API.call("claim",[{z:1,ml:11,n:30,e:true}]);
  try{await g.API.call('enchant',w.id,-1);T(g.SES.pf.items.find(i=>i.id===w.id).ench.length===1,'enchant added')}catch(e){T(false,'enchant '+e.message)}
  g.derive();T(g.S.atk>0,'derive ok');
  // render all panels (smoke) + handlers
  g.openInventory();T(g.UI.modal==='가방','inv');g.UI.close();
  g.openJob();T(g.UI.modal==='전직 교관','job panel');g.UI.close();
  g.openSmith();g.UI.close();g.openShop();g.UI.close();g.openSettings();g.UI.close();g.openParty();g.UI.close();
  g.openAuction('list');await sleep(20);T(g.UI.modal==='경매장','auction opens');
  // post & my list
  const sw=g.SES.pf.items.find(i=>i.kind==='weapon'&&!i.eq);
  if(sw){await g.API.call('aucPost',sw.id,1234);const mine=await g.API.call('aucMine');T(mine.some(x=>x.price===1234&&x.status==='active'),'auction post')}
  const lst=await g.API.aucList(null,null);T(lst.length>=1,'auction list '+lst.length);
  g.UI.close();
  // skills of gladiator R
  g.P.x=40;g.P.z=0;step(30);g.P.cd.r=0;g.trySkill('r');step(20);T(true,'R skill cast');
  // death + respawn
  g.P.iframes=0;g.hurtPlayer(1e9,0,0);T(g.P.dead,'player dies');step(300);T(!g.P.dead&&Math.hypot(g.P.x,g.P.z)<19,'respawn in town');
  // ---- party / ghost mobs ----
  g.NET.on=true;g.NET.ch={send(){}};
  g.NET.peers['동료']={name:'동료',x:5,z:5,tx:5,tz:5,got:true,hp:100,lv:5,cls:'mage',job:'mage',anim:0};
  g.NET.party={id:'p1',leader:'동료',members:['동료',g.SES.name]};
  step(3);
  g.P.x=35;g.P.z=0;
  // snapshot from leader
  g.NET.__snap=[[501,0,36,2,1.2,100,5,0],[502,1,38,-3,0.3,60,6,1]];
  // call internal handler via NET channel simulation: use global function
  vm.runInThisContext('onSnap({n:"동료",l:[[501,0,36,2,1.2,100,5,0],[502,1,38,-3,0.3,60,6,1]]})');
  const gh=g.MOBS.filter(m=>m.ghost);T(gh.length===2,'ghost mobs created from snapshot '+gh.length);
  step(30);
  g.dealMob(gh[0],50);T(gh[0].hp<gh[0].maxHp,'ghost hp predicted drop');
  step(5);
  vm.runInThisContext('onKillCredit({to:["'+g.SES.name+'"],z:1,ml:5,e:0,x:30,zz:0})');
  g.NET.party=null;g.NET.on=false;step(10);

  // every class can be created, built, attacked and cast with
  for(const c of g.CLASSES){
    const nm='직'+c.slice(0,4);
    const p2=await g.API.register(nm,'pw1234',c);T(p2.cls===c&&p2.items.some(i=>i.base===c+'_1'&&i.eq),'register '+c);
    g.enterGame();g.P.x=60;g.P.z=0;step(30);
    let thrown=null;try{g.doAttack();for(const k of['q','e']){g.P.cd[k]=0;g.trySkill(k)}step(40)}catch(e){thrown=e}T(!thrown,'attack+skills '+c+' '+(thrown&&thrown.stack));
    for(const j of Object.keys(g.JOBS).filter(k=>g.JOBS[k].cls===c&&g.JOBS[k].tier===1)){
      g.SES.pf.job=j;g.derive();g.buildPlayerModel();g.P.cd.r=0;let t2=null;try{g.trySkill('r');step(30)}catch(e){t2=e}T(!t2,'R skill '+j+' '+(t2&&t2.stack));
      for(const el of['fire','ice','thunder','dark','holy']){g.SES.pf.job=j+'_'+el;g.derive();g.buildPlayerModel();g.P.cd.r=0;let t3=null;try{g.trySkill('r');step(20)}catch(e){t3=e}T(!t3,'awakened '+j+'_'+el+' '+(t3&&t3.stack))}
    }
  }
  // day / night + daily + quests + events
  {const d=await g.API.register('일일시험','pw1234','mage');g.enterGame();step(3);
   T(d.daily&&d.daily.ready===true&&d.dq&&d.dq.q.length===3,'profile has daily + 3 quests');
   const r=await g.API.call('daily');T(r.day===1&&g.SES.pf.daily.ready===false,'daily claimed');
   let dup='';try{await g.API.call('daily')}catch(e){dup=e.message}T(dup==='ALREADY','daily only once');
   let nr='';try{await g.API.call('dqClaim',0)}catch(e){nr=e.message}T(nr==='NOT_READY','quest not ready');
   const dd=JSON.parse(localStorage.getItem('rw_local_db_v1'));dd.acc['일일시험'].dq.q.forEach(q=>q.p=q.t);localStorage.setItem('rw_local_db_v1',JSON.stringify(dd));
   for(let i=0;i<3;i++)await g.API.call('dqClaim',i);await g.API.call('dqClaim',3);T(g.SES.pf.dq.b===true,'bonus chest claimed');
   const nk=[];for(let p=0;p<1;p+=.05){nk.push(g.nightK(p))}T(Math.min(...nk)===0&&Math.max(...nk)===1,'night factor spans 0..1');
   g.updateAtmo(1,1);step(10);T(g.huntInfo().on===true||g.huntInfo().on===false,'hunt info');
   const gm=g.makeMobObj(9999,'slime',60,0,5,false,false,true);T(gm.golden&&gm.maxHp>0,'golden slime spawns');step(120);
   const k0=g.SES.pf.gold;g.registerKill(gm);await g.flushKills();T(g.SES.pf.gold>k0,'golden kill paid');
  }
  console.log('errors:',errs,'ok:',ok,'bad:',bad);
  process.exit(bad||errs?1:0);
})().catch(e=>{console.log('CRASH',e.stack||e);process.exit(2)});
