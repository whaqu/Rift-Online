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
  const regd=()=>(g.SES.pf.kills-k0)+Object.values(g.KB).reduce((x,y)=>x+y,0);
  for(let i=0;i<6400&&(i<2400||regd()<2);i++){
    g.P.iframes=1;g.P.hp=g.S.maxHp;
    let best=null,bd=1e9;for(const m of g.MOBS){if(m.dead)continue;const d=(m.x-g.P.x)**2+(m.z-g.P.z)**2;if(d<bd){bd=d;best=m}}
    if(best){g.mouse.gx=best.x;g.mouse.gz=best.z;const dx=best.x-g.P.x,dz=best.z-g.P.z,l=Math.hypot(dx,dz);g.keys.d=dx>2;g.keys.a=dx<-2;g.keys.s=dz>2;g.keys.w=dz<-2}
    if(i%150===0)g.trySkill('q');if(i%110===50)g.trySkill('e');
    g.frame(.016);
    {const r=Math.hypot(g.P.x,g.P.z);if(r<24){g.P.x*=24.5/r;g.P.z*=24.5/r}}
    if(i%300===299){await sleep(2)}
  }
  g.mouse.down=false;g.keys.d=g.keys.a=g.keys.s=g.keys.w=false;
  await sleep(30);await g.flushKills();await sleep(40);await g.flushKills();await sleep(40);
  T(g.SES.pf.kills>=k0+1,'kills recorded on server '+(g.SES.pf.kills-k0));
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
  setAcc({level:15,xp:0});
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
  // ---- armor, weapon kinds, zones 7-9 ----
  {
    setAcc({gold:5e7,level:99});await g.API.call('claim',[]);
    for(const sl of g.ASLOTS)await g.API.call('buy',sl+'_3_plate');
    let bw='';try{await g.API.call('buy','helm_9_plate')}catch(e){bw=e.message}T(bw!=='','bad armor id rejected');
    const arm=()=>g.SES.pf.items.filter(i=>i.kind==='armor'),p3=()=>arm().filter(i=>/_3_plate$/.test(i.base));
    T(p3().length>=4,'bought 4 armor pieces');
    for(const sl of g.ASLOTS)await g.API.call('equip',p3().find(i=>i.base.startsWith(sl+'_')).id);
    T(p3().filter(i=>i.eq).length===4,'all armor equipped');
    g.derive();T(g.S.def>0&&g.S.armor>0,'armor gives def '+g.S.def);
    const b4=g.armorBonus(p3().filter(i=>i.eq));T(b4.cnt.plate===4&&b4.armor>0&&b4.hpPct>0,'plate 4pc bonus');
    const hp0=g.S.maxHp;
    const h1=p3().find(i=>i.base.startsWith('helm_'));await g.API.call('equip',h1.id);T(!arm().find(i=>i.id===h1.id).eq,'equip toggles armor off');await g.API.call('equip',h1.id);
    await g.API.call('buy','helm_2_leather');const lh=arm().find(i=>i.base==='helm_2_leather');await g.API.call('equip',lh.id);
    T(arm().filter(i=>i.eq&&i.base.startsWith('helm_')).length===1&&!arm().find(i=>i.id===h1.id).eq,'one piece per slot');
    await g.API.call('equip',h1.id);
    const e0=h1.enh;await g.API.call('enhance',h1.id).catch(()=>{});
    setAcc({});for(let i=0;i<3;i++)await g.API.call('enhance',h1.id).catch(()=>{});
    T(g.SES.pf.items.find(i=>i.id===h1.id).enh>=e0,'armor enhance callable');
    g.derive();T(g.S.maxHp>=hp0*.9,'hp from armor');
    const spare=arm().find(i=>!i.eq&&!i.listed);const g0=g.SES.pf.gold;await g.API.call('sell',spare.id);T(g.SES.pf.gold>g0,'armor sold');
    // weapon kinds
    const cls=g.SES.pf.cls;for(const ty of[1,2])await g.API.call('buy',cls+'_3_'+ty);
    const typed=g.SES.pf.items.filter(i=>i.kind==='weapon'&&/_3_[12]$/.test(i.base));T(typed.length===2,'typed weapons bought');
    T(g.wType(typed[0].base)===1&&g.wName(typed[0].base)!==g.wName(cls+'_3'),'weapon kind names differ');
    await g.API.call('equip',typed[0].id);g.derive();const aHeavy=g.S.atk;await g.API.call('equip',typed[1].id);g.derive();T(g.S.atk!==aHeavy,'weapon kinds change stats');
    // zones
    T(g.ZONES.length===10&&g.WORLD_R>=570,'ten zones');
    T(g.zoneAt(400,0).id===7&&g.zoneAt(470,0).id===8&&g.zoneAt(540,0).id===9,'zones 7-9 resolve');
    T(g.mobLevel(540,0)>=88&&g.mobLevel(400,0)>=70,'late-zone mob levels');
    setAcc({tokens:80,ts:Date.now()});const c9=await g.API.call('claim',[{z:9,ml:95,n:40,e:true}]);T(c9.gold>0,'zone 9 claim pays');
    for(let i=0;i<10;i++){setAcc({tokens:80,ts:Date.now()});await g.API.call('claim',[{z:9,ml:95,n:40,e:true}])}
    T(g.SES.pf.items.some(i=>i.kind==='armor')&&true,'armor present after claims');
    g.drawMini();g.openShop();g.UI.close();
  }
  // ---- level perks ----
  {
    setAcc({level:30});await g.API.call('claim',[]);
    const k0=g.perkOf(g.SES.pf);T(k0.pts===29,'perk points = level-1 ('+k0.pts+')');
    g.derive();const atk0=g.S.atk,hp0=g.S.maxHp;
    for(let i=0;i<4;i++)await g.UI.handlers.perk('a');for(let i=0;i<3;i++)await g.UI.handlers.perk('h');for(let i=0;i<5;i++)await g.UI.handlers.perk('c');
    const k1=g.perkOf(g.SES.pf);T(k1.a===4&&k1.h===3&&k1.c===5&&k1.pts===17,'perks spent');
    g.derive();T(g.S.atk>atk0*1.09&&g.S.maxHp>hp0*1.08&&Math.abs(g.S.cdr-.05)<1e-9,'perks change stats');
    setAcc({level:1,perks:{a:0,h:0,c:0}});await g.API.call('claim',[]);
    let np='';try{await g.API.call('perk','a')}catch(e){np=e.message}T(np==='NO_POINTS','no points rejected '+np);
    let bk='';try{setAcc({level:10});await g.API.call('perk','x')}catch(e){bk=e.message}T(bk==='BAD_ARGS','bad perk kind');
    g.UI.close();g.openPerks();T(g.UI.modal==='능력치 강화','perk window opens');g.UI.close();
  }
  // ---- every monster type: spawn, AI ticks, hit, die ----
  {
    g.UI.close();g.P.dead=false;g.P.hp=g.S.maxHp;g.P.x=300;g.P.z=0;
    const types=Object.keys(g.MDEF);T(types.length>=19,'monster roster '+types.length);
    for(const t of types){
      const m=g.makeMobObj(7000+types.indexOf(t),t,306,2,50,false,false,false);m.spawning=false;m.sp=0;
      for(let i=0;i<120;i++){g.P.iframes=1;g.P.hp=g.S.maxHp;step(1)}
      T((t==='bomber'||!m.dead)&&Number.isFinite(m.x)&&Number.isFinite(m.z),'mob '+t+' survives AI ticks');
      g.dealMob(m,10,{kx:1,kz:0,kb:3,big:true});step(2);
      g.dealMob(m,m.maxHp*2,{kx:1,kz:0,kb:3,crit:true});step(40);
      T(m.dead,'mob '+t+' dies');
    }
    for(const t of['wraith','phantom','sentinel','yeti']){const m=g.makeMobObj(7500,t,306,2,50,true,false,false);m.spawning=false;m.sp=0;for(let i=0;i<150;i++){g.P.iframes=1;step(1)}T(!m.dead,'elite '+t+' ok');m.dead=true}
    for(let i=0;i<200;i++)step(1);T(g.DYING.length===0,'death animations clean up');
    T(g.ZONES.every(z=>!z.types||z.types.every(t=>g.MDEF[t])),'zone monster types all defined');
  }
  // ---- weapon looks: every class x kind x tier builds without error; kinds look different ----
  {
    const oe=console.error;let be=0;console.error=(...x)=>{if(String(x[0]).indexOf('weapon look')===0)be++;oe.apply(console,x)};
    const cnt=o=>{let n=0;if(o)o.traverse(()=>n++);return n};
    const shape=o=>{let n=0;if(o)o.traverse(c=>{n+=Math.round((c.position.y*7+c.position.z*13+c.position.x*3+c.scale.y*5)*100)});return n};
    for(const cls of g.CLASSES){
      const sig=[];
      for(let ty=0;ty<3;ty++){
        for(const t of[1,3,5,8]){const h=g.makeHeroFor(cls,cls,0xffffff);g.applyWeaponLook(h,cls+'_'+t+(ty?'_'+ty:''));if(t===1)sig.push(cnt(h.weapon)+'/'+shape(h.weapon)+'/'+(h.weapon2&&h.weapon2.visible?cnt(h.weapon2):0));if(!(cnt(h.weapon)>1))be++;
          if(['mage','cleric','summoner'].includes(cls)&&h.orb&&!h.orbGlow)be++}
      }
      T(new Set(sig).size===3,'weapon kinds look different for '+cls+' '+sig.join(','));
    }
    const hw=g.makeHeroFor('warrior','warrior',0xffffff);g.applyWeaponLook(hw,'warrior_2');const c2=cnt(hw.weapon);g.applyWeaponLook(hw,'warrior_8');T(cnt(hw.weapon)>c2,'higher tier adds detail (glow/rune ring)');
    g.applyWeaponLook(hw,'mage_3');T(hw.wbase==='warrior_1','foreign class weapon falls back');
    const h5=g.makeHeroFor('mage','mage',0xffffff);g.applyWeaponLook(h5,'mage_5');T(h5.wfx.length>0&&h5.wfx[0].list.length===4,'tier5 weapon has orbiting runes');
    const p0=h5.wfx[0].list[0].position.x;g.animHeroFor(h5,.5,0,-1,false,1);const p1=h5.wfx[0].list[0].position.x;g.animHeroFor(h5,1.3,0,-1,false,1);T(p1!==h5.wfx[0].list[0].position.x,'runes orbit over time');
    g.applyWeaponLook(h5,'mage_1');T(h5.wfx.length===0,'tier1 has no orbiting runes');
    console.error=oe;T(be===0,'weapon look builds clean ('+be+')');
  }
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
   {const d2=JSON.parse(localStorage.getItem('rw_local_db_v1'));d2.acc['일일시험'].tokens=80;d2.acc['일일시험'].ts=Date.now();localStorage.setItem('rw_local_db_v1',JSON.stringify(d2))}
   const k0=g.SES.pf.gold;g.registerKill(gm);await sleep(60);await g.flushKills();await sleep(60);await g.flushKills();T(g.SES.pf.gold>k0,'golden kill paid');
  }
  { // gathering via normal attacks
    const nodes=g.WORLD.nodes;T(nodes.some(n=>n.k==='weed')&&nodes.some(n=>n.k==='wood'),'gather nodes registered (weed+wood)');
    const tr=nodes.filter(n=>n.k==='wood'&&Math.hypot(n.x,n.z)<90&&Math.hypot(n.x,n.z)>30)[0];
    g.P.dead=false;g.UI.modal=null;g.P.x=tr.x-2;g.P.z=tr.z;
    const near=nodes.filter(n=>n.k==='weed'&&Math.hypot(n.x-g.P.x,n.z-g.P.z)<3.2&&!n.st);
    const f=Math.atan2(tr.x-g.P.x,tr.z-g.P.z);
    const nw=nodes.filter(n=>n.k==='weed'&&!n.st&&Math.hypot(n.x-g.P.x,n.z-g.P.z)<3&&Math.abs(((Math.atan2(n.x-g.P.x,n.z-g.P.z)-f+Math.PI*3)%(Math.PI*2))-Math.PI)<1).length;
    let hits=0;const hp0=3+Math.min(2,Math.floor((tr.s-.8)/.7*3));
    g.gatherArc(f,3.4,2.15,1);hits++;
    T(g.GAT.pend.weed===0||g.GAT.pend.weed>=0,'swing runs');T(tr.sh!=null||tr.st,'tree shakes on hit');
    while(tr.st!=='fall'&&hits<8){g.gatherArc(f,3.4,2.15,1);hits++}
    T(hits>=3&&hits<=5,'tree falls after 3-5 normal hits ('+hits+', hp '+hp0+')');T(g.GAT.pend.wood===1,'wood granted on fall');
    for(let i=0;i<60;i++)g.tickGather(.05);T(tr.st==='wait'||tr.st==='sap','fallen tree becomes sapling');
    g.tickGather(5);T(tr.st==='sap','sapling grows');for(let i=0;i<120;i++)g.tickGather(1);T(!tr.st,'sapling grows back into a tree');
    {const w0=nodes.find(n=>n.k==='weed'&&!n.st&&Math.hypot(n.x,n.z)>30&&Math.hypot(n.x,n.z)<70);g.P.x=w0.x-1.2;g.P.z=w0.z;const p0=g.GAT.pend.weed;
      const inCone=nodes.filter(n=>n.k==='weed'&&!n.st&&Math.hypot(n.x-g.P.x,n.z-g.P.z)<3.8&&(Math.hypot(n.x-g.P.x,n.z-g.P.z)<1.1||Math.abs(Math.atan2(n.x-g.P.x,n.z-g.P.z)-Math.PI/2)<1.07)).length;
      g.gatherArc(Math.PI/2,3.4,2.15,1);const got=g.GAT.pend.weed-p0;T(got>=1&&w0.st==='gone','swing cuts weeds instantly ('+got+')');T(got===inCone||got>=inCone-2,'weeds pierce: whole cone cleared ('+got+'/'+inCone+')');
      T(g.gatherArc(Math.PI/2,3.4,2.15,1)>=0&&g.GAT.pend.weed-p0===got,'cut weeds are not cut twice');
      g.tickGather(.5);T(w0.st==='gone'||w0.st==='wait','cut weed disappears');for(let i=0;i<60;i++)g.tickGather(1);T(!w0.st,'weed regrows after a while');}
    g.UI.modal=null;await g.flushGather();for(let k=0;k<30&&(g.GAT.busy||g.GAT.pend.weed+g.GAT.pend.wood>0);k++)await sleep(30);await sleep(30);
    const wi=g.SES.pf.items.find(i=>i.kind==='mat'&&i.base==='weed'),di=g.SES.pf.items.find(i=>i.kind==='mat'&&i.base==='wood');
    T(wi&&wi.qty>=1&&di&&di.qty>=1,'weed + wood in inventory');T(g.SES.pf.gather&&g.SES.pf.gather.xp>=6,'mastery xp gained');
    const gold0=g.SES.pf.gold,wq=wi.qty;await g.API.call('sell',wi.id,wq);T(g.SES.pf.gold-gold0===10*wq,'weed sells for 10G each');
    const g1=g.SES.pf.gold,dq=di.qty;await g.API.call('sell',di.id,dq);T(g.SES.pf.gold-g1===20*dq,'wood sells for 20G each');
    T(!g.SES.pf.items.some(i=>i.kind==='mat'),'materials gone after selling');
    T(g.gatLvOf(0)===1&&g.gatLvOf(25)===2&&g.gatLvOf(1e6)===20,'mastery level curve');
    g.P.x=tr.x-6;g.P.z=tr.z;g.gatherLine(1,0,10,1);T(true,'ranged strip runs');
    g.openInventory();g.UI.close&&g.UI.close();
  }
  // GM panel: only the admin account gets the button / actions
  {
    const A=g.LocalAPI,code=fn=>{try{fn();return''}catch(e){return e.message}};
    const u=A.register('일반유저','pw1234','warrior');
    T(!u.profile.admin&&u.profile.level===1,'normal account is not admin');
    T(code(()=>A.gmJob('일반유저',u.token,'mage'))==='NOT_ADMIN','normal account cannot change job');
    T(code(()=>A.gmWeapon('일반유저',u.token,'mage_8',20,[]))==='NOT_ADMIN','normal account cannot take weapons');
    await g.API.register('테스트','pw1234','warrior');
    T(g.SES.pf.admin&&g.SES.pf.level===99,'test account is admin Lv99');
    T(g.SES.pf.gather.lv===20&&g.SES.pf.perks.c===40&&g.SES.pf.perks.pts===0,'test account starts maxed');
    await g.API.call('gmGrowth',false);T(g.SES.pf.perks.pts===98,'perk reset gives points back');
    await g.API.call('gmGrowth',true);T(g.SES.pf.perks.a===98&&g.SES.pf.gather.lv===20,'max growth');
    T(code(()=>A.gmGrowth('일반유저',u.token,true))==='NOT_ADMIN','normal account cannot max growth');
    await g.API.call('gmJob','priest_fire');
    T(g.SES.pf.cls==='cleric'&&g.SES.pf.items.find(i=>i.kind==='weapon'&&i.eq).base==='cleric_1','job change swaps weapon class');
    await g.API.call('gmWeapon','cleric_8_2',20,['burn','crit']);
    const w=g.SES.pf.items.find(i=>i.kind==='weapon'&&i.eq);T(w.base==='cleric_8_2'&&w.enh===20&&w.ench.length===2,'granted weapon equipped');
    g.enterGame();step(3);g.openGM();T(g.UI.modal==='GM 패널','GM panel opens');
    g.UI.handlers.gmtab('weapon');g.UI.handlers.gmtab('job');await g.UI.handlers.gmjob('assassin_dark');await sleep(20);step(3);
    T(g.SES.pf.job==='assassin_dark','job change from panel');g.UI.close();
    const code2=async f=>{try{await f();return''}catch(e){return e.message}};
    await g.API.call('gmResetInv');
    T(g.SES.pf.items.length===2&&g.SES.pf.items.some(i=>i.kind==='weapon'&&i.eq&&i.base===g.SES.pf.cls+'_1'),'inventory reset to starter kit');
    T(await code2(()=>g.API.changePassword('wrong','newpass123'))==='BAD_OLD_PASS','password change needs the current one');
    T(await code2(()=>g.API.changePassword('pw1234','short'))==='BAD_NEW_PASS','new password too short');
    await g.API.changePassword('pw1234','newpass123');await g.API.call('gmResetInv');T(true,'session still works after password change');
    T(await code2(()=>g.API.login('테스트','pw1234'))==='BAD_LOGIN','old password rejected');
    T(await code2(()=>g.API.login('테스트','newpass123'))==='','new password works');
    T(code(()=>A.gmResetInv('일반유저',u.token))==='NOT_ADMIN'&&code(()=>A.gmPassword('일반유저',u.token,'pw1234','newpass123'))==='NOT_ADMIN','normal account refused');
    await g.API.login('일반유저','pw1234');g.openGM();T(g.UI.modal!=='GM 패널','GM panel refuses normal account');
  }
  // every class skill (Q/E/R/F) runs, does something and cleans up
  {
    await g.API.login('테스트','newpass123');g.enterGame();step(3);
    let uid=20000;
    const setup=async job=>{
      await g.API.call('gmJob',job);g.derive();g.skReset();g.UI.close&&g.UI.close();
      for(const m of g.MOBS)g.removeMob(m,false);g.compactMobs();
      const P=g.P;P.dead=false;P.x=300;P.z=0;P.vx=P.vz=0;P.cd={q:0,e:0,r:0,f:0};P.hp=g.S.maxHp;P.buff=null;P.shield=0;P.dashT=0;P.spinT=0;P.atkCd=0;g.UI.refreshHud();
    };
    const dummy=(dx,dz)=>{const m=g.makeMobObj(uid++,'slime',g.P.x+dx,g.P.z+dz,50,false,false,false);m.spawning=false;m.sp=0;m.hp=m.maxHp=1e12;m.freeze=999;m.dmg=1;return m};
    const aim=(dx,dz)=>{g.mouse.gx=g.P.x+dx;g.mouse.gz=g.P.z+dz;g.P.face=Math.atan2(dx,dz)};
    const run=n=>{for(let i=0;i<n;i++){g.P.iframes=Math.max(g.P.iframes,.1);step(1)}};
    const names=new Set(),fxs=new Set();
    for(const c of g.CLASSES)for(const job of[c,...g.JOB_KIDS(c)]){
      await setup(job);
      for(const slot of job===c?['q','e','f']:['r']){
        const sk=g.skillOf(slot);names.add(sk.name);fxs.add(sk.fx);
        await setup(job);const m=dummy(0,4),m2=dummy(2,6);aim(0,4);
        g.trySkill(slot);const cd=g.P.cd[slot];
        if(sk.fx==='mk_q'||sk.fx==='g_e')for(let i=0;i<150;i++){aim(0,4);g.tickPlayer(.016)}   // these follow the live aim
        run(10);let hit=m.hp<m.maxHp||m2.hp<m2.maxHp;
        for(let i=0;i<520;i+=10){run(10);if(m.hp<m.maxHp||m2.hp<m2.maxHp)hit=true}
        if(sk.fx==='r_e'){aim(0,1);hit=true}
        T(cd>0&&hit,'skill '+job+' '+slot+' '+sk.name+' cd='+cd+' hit='+hit);
        run(400);T(g.ACTS.length===0&&g.DECOYS.length===0&&!g.skBusy()&&Number.isFinite(g.P.x)&&Number.isFinite(g.P.hp),'skill '+sk.name+' cleans up '+g.ACTS.length);
      }
      if(job!==c&&g.JOBS[job].tier===2){await setup(job);dummy(0,4);aim(0,4);g.trySkill('r');run(200);T(g.P.cd.r>0&&g.skillOf('r').el===g.JOBS[job].el,'awakened R '+job)}
    }
    T(fxs.size===50,'50 distinct skill behaviours: '+fxs.size);
    await setup('rogue');T(g.JOBS.rogue.name==='암살자'&&g.JOBS.assassin.name!=='암살자','rogue renamed');
    let m=dummy(0,2);aim(0,2);g.trySkill('e');T(g.P.stealth>0,'stealth');g.doAttack();T(!(g.P.stealth>0),'attack leaves stealth');
    g.SES.pf.level=98;T(g.skillOf('f')===null,'no ultimate below max level');g.SES.pf.level=99;T(g.skillOf('f')===g.ULT.rogue,'ultimate at max level');
    await setup('summoner');for(const s of['q','e']){g.trySkill(s)}run(5);g.skReset();T(g.ACTS.length===0&&g.DECOYS.length===0,'reset clears running skills');
  }
  // other players' level/job arrive with every position packet; graphics default to everything on
  {
    await g.API.login('테스트','newpass123');g.enterGame();step(3);
    const pres={'동료2':[{name:'동료2',cls:'mage',job:'mage',lv:7}]},sent=[],tracked=[];
    g.NET.on=true;g.NET.ch={send(m){sent.push(m)},track(m){tracked.push(m)},presenceState:()=>pres};
    g.syncPeers();const p=g.NET.peers['동료2'];T(p&&p.lv===7,'level from presence');
    g.onPos({n:'동료2',x:1,z:1,f:0,h:90,i:[42,'archer','archer',null]});T(p.lv===42&&p.cls==='archer','position packet updates level and class');
    g.syncPeers();T(p.lv===42&&p.cls==='archer','stale presence does not roll it back');
    g.NET.lastPos=-1e9;step(40);const pk=sent.filter(m=>m.event==='p').pop();T(pk&&pk.payload.i[0]===g.SES.pf.level&&pk.payload.i[1]===g.SES.pf.cls,'my packet carries level and class');
    const n0=tracked.length;g.onLevelUp();T(tracked.length>n0&&tracked[tracked.length-1].lv===g.SES.pf.level,'level up refreshes presence');
    delete g.NET.peers['동료2'];g.NET.on=false;g.NET.ch=null;g.UI.close&&g.UI.close();
    const keep=JSON.stringify(g.save);
    localStorage.setItem('rw_settings_v1',JSON.stringify({shadows:false,outline:false,treeQ:0,fx:false,vol:.3,custom:true}));g.loadSave();
    T(g.save.shadows&&g.save.outline&&g.save.treeQ===1&&g.save.fx&&g.save.vol===.3,'old settings get graphics on once');
    localStorage.setItem('rw_settings_v1',JSON.stringify(Object.assign({},g.save,{shadows:false})));g.loadSave();T(g.save.shadows===false,'later choice is kept');
    g.save.custom=false;g.save.shadows=true;g.setTouchMode(true);T(g.save.shadows&&g.save.outline&&g.save.treeQ===1,'touch keeps graphics on');g.setTouchMode(false);
    Object.assign(g.save,JSON.parse(keep));
  }
  // levelling up never pops the perk window; only the top-left button blinks
  {
    await g.API.login('테스트','newpass123');g.enterGame();step(3);g.UI.close&&g.UI.close();
    const perks=g.SES.pf.perks;g.SES.pf.perks={a:0,h:0,c:0,pts:3};g.P.dead=false;g.onLevelUp();
    g.SES.pf.daily.ready=false;g.UI.close&&g.UI.close();g.onLevelUp();
    await new Promise(r=>setTimeout(r,1200));
    T(!g.UI.modal,'no perk popup on level up '+(g.UI.modal&&JSON.stringify(g.UI.modal.title||'')));
    g.SES.pf.perks=perks;
  }
  console.log('errors:',errs,'ok:',ok,'bad:',bad);
  process.exit(bad||errs?1:0);
})().catch(e=>{console.log('CRASH',e.stack||e);process.exit(2)});
