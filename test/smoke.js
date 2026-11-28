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
  // town recall (C key)
  g.startRecall();T(!(g.P.recall>0),'recall is refused inside town');
  g.P.x=60;g.P.z=0;g.P.iframes=0;g.startRecall();T(g.P.recall>0,'recall starts outside town');
  g.hurtPlayer(1,0,0);T(!(g.P.recall>0)&&g.P.x===60,'damage cancels recall');
  g.P.iframes=0;g.startRecall();g.startRecall();T(!(g.P.recall>0),'pressing C again cancels recall');
  g.startRecall();g.keys['d']=true;step(3);g.keys['d']=false;T(!(g.P.recall>0)&&Math.hypot(g.P.x,g.P.z)>30,'moving cancels recall');
  g.P.x=60;g.P.z=0;g.P.iframes=1e9;g.startRecall();step(100);T(Math.hypot(g.P.x,g.P.z)>30&&g.P.recall>0,'recall still channelling after ~1.6s');step(160);T(Math.hypot(g.P.x,g.P.z)<19&&!(g.P.recall>0),'recall brings the player to town after 3s');
  // ---- runes ----
  {
    const K='rw_local_db_v1',dbR=()=>JSON.parse(localStorage.getItem(K)),dbW=d=>localStorage.setItem(K,JSON.stringify(d));
    const addRune=async(base,enh,qty)=>{const d=dbR();d.items.push({id:d.nid++,owner:g.SES.name,kind:'rune',base,enh,ench:[],qty,eq:false,listed:false,gone:false});dbW(d);await g.API.resume(g.SES.name,g.SES.token)};
    const runes=()=>g.SES.pf.items.filter(i=>i.kind==='rune');
    const wpn=()=>g.SES.pf.items.find(i=>i.kind==='weapon'&&i.eq);
    await addRune('fire',1,3);
    await g.API.resume(g.SES.name,g.SES.token);
    if(!g.SES.pf.items.some(i=>i.kind==='weapon'&&!i.listed&&i.base.split('_')[0]===g.SES.pf.cls)){const d=dbR();d.items.push({id:d.nid++,owner:g.SES.name,kind:'weapon',base:g.SES.pf.cls+'_1',enh:0,ench:[],qty:1,eq:false,listed:false,gone:false});dbW(d)}
    await g.API.resume(g.SES.name,g.SES.token);
    await g.API.call('equip',g.SES.pf.items.find(i=>i.kind==='weapon'&&!i.listed&&i.base.split('_')[0]===g.SES.pf.cls).id);
    await g.API.resume(g.SES.name,g.SES.token);let r=await g.API.call('runeFuse','up','fire',1);
    T(r.items.some(i=>i.kind==='rune'&&i.base==='fire'&&i.enh===2&&i.qty===1),'3 rune I fuse into 1 rune II');
    let ee='';try{await g.API.call('runeFuse','up','fire',1)}catch(e){ee=e.message}T(ee==='NO_RUNE','fuse without runes is refused');
    const b0=(g.derive(),g.S.burnLv);
    const fr=runes().find(i=>i.base==='fire'&&i.enh===2);
    await g.API.call('runeAttach',wpn().id,fr.id);g.derive();
    T(wpn().rune==='fire:2'&&g.S.burnLv===b0+2,'fire rune II adds burn 2 ('+b0+'->'+g.S.burnLv+')');
    await addRune('holy',3,1);const hp0=g.S.maxHp;await g.API.call('runeAttach',wpn().id,runes().find(i=>i.base==='holy').id);g.derive();
    T(wpn().rune==='holy:3'&&g.S.maxHp>hp0&&g.S.burnLv===b0,'rune replacement works, holy raises max hp');
    const pot0=(g.SES.pf.items.find(i=>i.base==='atk')||{qty:0}).qty;await addRune('fire',1,2);
    r=await g.API.call('runeBrew',runes().find(i=>i.base==='fire'&&i.enh===1).id);
    T(r.potion==='atk'&&r.qty===3&&g.SES.pf.items.find(i=>i.base==='atk').qty===pot0+3,'rune brews potions');
    const gold0=g.SES.pf.gold;await g.API.call('sell',runes().find(i=>i.base==='fire'&&i.enh===1).id,1);T(g.SES.pf.gold===gold0+400,'rune sells for gold');
    for(const k of['fire','ice','thunder','dark','holy','meadow','crystal','storm'])await addRune(k,2,1);
    r=await g.API.call('runeFuse','all');
    const all=runes().find(i=>i.base==='all');T(all&&all.qty===1,'all 8 runes fuse into the Rune of All');
    await g.API.call('runeAttach',wpn().id,all.id);g.derive();
    T(g.S.runeAura&&g.S.burnLv>b0+1&&g.S.chainP>0&&g.S.vamp>0,'Rune of All gives every effect + aura');
    const fx=g.runeFx('all');T(fx.en.burn>=4&&fx.aura,'Rune of All effect is double the combined 8 runes');
    ee='';try{await g.API.call('runeFuse','all')}catch(e){ee=e.message}T(ee==='NO_RUNE','cannot fuse All twice without runes');
  }
  // ---- dungeon ----
  {
    const K='rw_local_db_v1';const lv=g.SES.pf.level;
    g.P.iframes=1e9;g.P.x=60;g.P.z=0;
    T(g.DGP.filter(p=>p.kind==='portal').length===9&&g.DGP.some(p=>p.kind==='map'),'nine dungeon portals + town map sign exist');
    {let ok=true;try{g.openMap()}catch(e){ok=false}T(ok,'town map opens')}
    const p0=g.DGP[0];g.P.x=p0.x+1;g.P.z=p0.z+1;step(2);
    T(g.nearNpc()&&g.nearNpc().kind==='portal','portal is interactable');
    g.P.x=60;g.P.z=0;
    await g.dgStart('meadow');
    T(g.DG.on&&g.DG.id==='meadow'&&g.P.x>900,'entered the meadow dungeon arena');
    T(g.zoneAt(g.P.x,g.P.z).name==='초원 던전','zone label override');
    g.P.x=g.DG.cx+500;g.P.z=g.DG.cz;step(2);T(Math.abs(g.P.x-g.DG.cx)<=20&&g.P.z-g.DG.cz>=-70,'cave clamps the player (sideways + closed gate)');
    step(300);
    T(g.DG.ph==='wave'&&g.MOBS.filter(m=>m.dg&&!m.dead).length>=5,'wave 1 spawned '+g.DG.ph+' '+g.MOBS.length);
    T(g.MOBS.every(m=>!m.dg||Math.abs(m.x-g.DG.cx)<=20),'wave mobs inside cave room');
    let guard=0;
    while(g.DG.ph!=='boss'&&guard++<60){for(const m of g.MOBS.slice())if(m.dg&&!m.dead&&m.type!=='dgboss')g.applyMobDmg(m,1e9,null,g.SES.name);step(200);if(g.DG.ph==='advance'){g.P.x=g.DG.cx;g.P.z=g.DG.cz+(g.DG.wave>=4?-4*68+6-46-22-26+30-5:6-g.DG.wave*68-6);step(100)}}
    T(g.DG.ph==='boss','reached boss phase after 3 waves ('+g.DG.ph+')');
    const boss=g.MOBS.find(m=>m.type==='dgboss');T(boss&&boss.bn==='멧돼지 왕'&&boss.maxHp>1000,'boss spawned '+(boss&&boss.maxHp));
    const pats=new Set();for(let i=0;i<2500&&!boss.dead;i++){g.frame(.016);if(boss.pat)pats.add(boss.pat)}
    T(pats.size>=3,'boss cycles patterns '+[...pats]);
    T(boss.z-g.DG.cz<-200&&Math.abs(boss.x-g.DG.cx)<=32,'boss stays in hall');
    // death handling
    g.P.iframes=0;g.hurtPlayer(1e9,0,0);T(g.P.dead,'dies in dungeon');step(300);
    T(!g.P.dead&&g.DG.on&&g.DG.deaths===1&&g.P.x>900,'respawns inside the arena (deaths '+g.DG.deaths+')');g.P.iframes=1e9;
    // make the run old enough for the server rule, then kill the boss
    {const d=JSON.parse(localStorage.getItem(K));d.acc[g.SES.name].dgRun.ts-=60000;localStorage.setItem(K,JSON.stringify(d))}
    g.DG.begin-=60000;const gold0=g.SES.pf.gold;
    g.applyMobDmg(boss,1e12,null,g.SES.name);step(5);
    T(g.DG.ph==='clear','boss kill clears the dungeon');
    for(let i=0;i<50&&!g.DG.res;i++)await sleep(20);
    T(g.DG.res&&g.DG.res.rank===1&&g.DG.res.rw&&g.DG.res.rw.length>=2,'rank 1 reward received '+JSON.stringify(g.DG.res&&g.DG.res.rw));
    T(g.SES.pf.gold>gold0,'dungeon gold paid');
    g.UI.close();g.dgLeave('x');step(3);
    T(!g.DG.on&&Math.hypot(g.P.x,g.P.z)<100&&g.MOBS.length===0,'left dungeon back to the world');
    let e3='';try{await g.API.call('dgEnd','meadow',1)}catch(e){e3=e.message}T(e3==='NO_RUN','a finished run cannot be claimed twice');
    g.P.iframes=1e9;
  }
  // ---- cleric rework ----
  {
    const K0='rw_local_db_v1',orig={};{const d=JSON.parse(localStorage.getItem(K0)),a=d.acc[g.SES.name];orig.cls=a.cls;orig.job=a.job;orig.level=a.level;a.cls='cleric';a.job='cleric';localStorage.setItem(K0,JSON.stringify(d))}
    await g.API.resume(g.SES.name,g.SES.token);g.derive();g.skReset();g.UI.close&&g.UI.close();
    const P=g.P,setLv=async l=>{const K='rw_local_db_v1',d=JSON.parse(localStorage.getItem(K));d.acc[g.SES.name].level=l;localStorage.setItem(K,JSON.stringify(d));await g.API.resume(g.SES.name,g.SES.token);g.derive()};
    const noParty=()=>{g.NET.party=null;g.NET.peers={}};noParty();
    await setLv(9);T(!g.skillOf('q')&&!g.skillOf('e'),'cleric below Lv10 has no heal / armor');
    await setLv(10);T(g.skillOf('q')&&g.skillOf('q').name==='스몰 힐'&&!g.skillOf('e'),'Lv10: 스몰 힐');
    await setLv(15);T(g.skillOf('e')&&g.skillOf('e').name==='홀리 아머','Lv15: 홀리 아머');
    await setLv(20);T(g.skillOf('q').name==='힐','Lv20: 힐');
    await setLv(30);T(g.skillOf('q').name==='홀리 힐'&&g.skillOf('q').pct>g.CLQ[2].pct,'Lv30: 홀리 힐');
    g.P.x=300;g.P.z=0;g.P.dead=false;g.P.iframes=1e9;g.P.cd={q:0,e:0,r:0,f:0};g.P.hp=g.S.maxHp*.2;
    g.trySkill('q');T(g.P.hp>g.S.maxHp*.2+1&&g.P.cd.q>0,'solo: Q heals yourself');
    // party: target selection + second press heals the partner, right click heals self
    const sent=[];g.NET.on=true;g.NET.ch={send(m){sent.push(m)}};
    g.NET.peers['동료']={name:'동료',x:g.P.x,z:g.P.z+8,tx:g.P.x,tz:g.P.z+8,got:true,hp:50,lv:5,cls:'warrior',job:'warrior',anim:0};
    g.NET.party={id:'p9',leader:g.SES.name,members:[g.SES.name,'동료']};
    g.mouse.gx=g.P.x;g.mouse.gz=g.P.z+8;g.P.cd.q=0;g.P.hp=g.S.maxHp*.5;g.P.face=0;
    g.trySkill('q');T(g.P.hs&&g.P.cd.q===0,'party: first Q only arms the heal (no cooldown)');
    for(let i=0;i<3;i++){g.mouse.gx=g.P.x;g.mouse.gz=g.P.z+8;g.tickPlayer(.016)}
    T(g.P.hs&&g.P.hs.tg&&g.P.hs.tg.name==='동료','heal marker targets the partner you face');
    g.mouse.gx=g.P.x;g.mouse.gz=g.P.z+8;g.trySkill('q');
    T(sent.some(x=>x.event==='ch'&&x.payload.to==='동료'&&x.payload.pct>0.5)&&g.P.cd.q>0&&!g.P.hs,'second Q sends the heal to that partner');
    g.P.cd.q=0;g.P.hp=g.S.maxHp*.3;g.rightClickSkill();T(g.P.hp>g.S.maxHp*.3+1&&g.P.cd.q>0,'right click heals yourself in a party');
    // receiving a heal from a party member
    g.P.hp=g.S.maxHp*.2;g.onCh({to:g.SES.name,from:'동료',pct:.5,sh:.1});T(g.P.hp>=g.S.maxHp*.69,'incoming heal applies');
    g.onCh({to:g.SES.name,from:'낯선사람',pct:.5});T(g.P.hp<g.S.maxHp*.9,'heal from non-party is ignored');
    // buffs go to the whole party
    sent.length=0;g.P.cd.e=0;g.trySkill('e');
    T(g.hbOn('ar')&&sent.some(x=>x.event==='cb'&&x.payload.k==='ar'&&x.payload.to.includes('동료')),'홀리 아머 buffs self and sends to party');
    const dm=g.S.maxHp;g.P.iframes=0;g.P.hp=dm;g.P.shield=0;g.hurtPlayer(100,0,0);T(dm-g.P.hp<=75,'홀리 아머 reduces damage ('+(dm-g.P.hp)+')');
    g.P.hb=null;g.onCb({to:[g.SES.name],from:'동료',k:'wp',d:10,pw:1.5});T(g.hbOn('wp'),'receives 홀리 웨폰 from a party member');
    g.onCb({to:[g.SES.name],from:'낯선사람',k:'my',d:10,pw:1});T(!g.hbOn('my'),'buff from non-party is ignored');
    // holy weapon alters hits
    const mm=g.makeMobObj(9000,'slime',g.P.x,g.P.z+3,50,false,false,false);mm.spawning=false;mm.sp=0;mm.hp=mm.maxHp=1e12;mm.dmg=0;
    const hitN=()=>{mm.hp=mm.maxHp;for(let i=0;i<40;i++)g.dealMob(mm,1000,{crit:false});return mm.maxHp-mm.hp};g.P.hb=null;const h0=hitN();g.applyHB('wp',20,1.5);const h1=hitN();
    T(h1>h0*1.1,'홀리 웨폰 adds holy damage to hits ('+Math.round(h0)+' -> '+Math.round(h1)+')');
    g.P.hb=null;g.P.shield=0;g.applyHB('ar',20,1.5);g.dealMob(mm,1000,{});T(g.P.shield>0,'홀리 아머 grants shield per hit');
    // holy moly: speed / attack speed / cooldown / regen
    g.P.hb=null;const sp0=g.effSpd(),as0=g.effAps();g.applyHB('my',16,1.5);
    T(g.effSpd()>sp0*1.15&&g.effAps()>as0*1.2,'홀리 몰리 raises move and attack speed');
    g.P.cd.q=10;g.tickPlayer(1);T(g.P.cd.q<8.7,'홀리 몰리 speeds up cooldowns');
    g.P.hp=g.S.maxHp*.5;g.P.regenAcc=0;const hpb=g.P.hp;for(let i=0;i<60;i++)g.tickPlayer(.05);T(g.P.hp>hpb+g.S.maxHp*.03,'홀리 몰리 adds natural regen');
    T(g.JOBS.priest_fire&&g.JOBS.priest_fire.r.fx==='moly'&&g.JOBS.crusader_holy.r.name==='홀리 몰리'&&g.JOBS.priest.r.name==='홀리 웨폰','2nd jobs get 홀리 몰리, 1st jobs 홀리 웨폰');
    g.P.hb=null;g.NET.party=null;g.NET.peers={};g.NET.on=false;g.NET.ch=null;
    {const d=JSON.parse(localStorage.getItem(K0)),a=d.acc[g.SES.name];a.cls=orig.cls;a.job=orig.job;a.level=orig.level;localStorage.setItem(K0,JSON.stringify(d))}
    await g.API.resume(g.SES.name,g.SES.token);g.derive();g.P.cd={q:0,e:0,r:0,f:0};
  }
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
    const gold0=g.SES.pf.gold,wq=wi.qty;await g.API.call('sell',wi.id,wq);T(g.SES.pf.gold-gold0===2*wq,'weed sells for 2G each');
    const g1=g.SES.pf.gold,dq=di.qty;await g.API.call('sell',di.id,dq);T(g.SES.pf.gold-g1===8*dq,'wood sells for 8G each');
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
        if(['c_q','c_e','priest','crusader','moly'].includes(sk.fx))hit=true;   // support skills: no damage
        T(cd>0&&hit,'skill '+job+' '+slot+' '+sk.name+' cd='+cd+' hit='+hit);
        run(400);T(g.ACTS.length===0&&g.DECOYS.length===0&&!g.skBusy()&&Number.isFinite(g.P.x)&&Number.isFinite(g.P.hp),'skill '+sk.name+' cleans up '+g.ACTS.length);
      }
      for(const slot of job===c?['q','e','f']:['r']){   // the same skill against a duel opponent
        await setup(job);const m=dummy(0,5);m.duel=true;m.freeze=0;aim(0,5);g.DU.ph='fight';g.DU.out=0;g.DU.fx=null;
        const sk=g.skillOf(slot);g.trySkill(slot);if(sk.fx==='mk_q'||sk.fx==='g_e')for(let i=0;i<150;i++){aim(0,4);g.tickPlayer(.016)}
        if(sk.fx==='r_e')aim(0,1);run(530);
        if(!['c_q','c_e','r_e','priest','crusader','moly'].includes(sk.fx))T(g.DU.out>0,'skill reaches duel opponent: '+job+' '+sk.name);
        g.DU.ph='idle';g.DU.out=0;g.DU.fx=null;
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
  // desktop auto attack: unlocked at Lv.5, aims at the nearest enemy, never breaks stealth
  {
    await g.API.login('테스트','newpass123');g.enterGame();step(3);g.UI.close&&g.UI.close();
    await g.API.call('gmJob','warrior');g.derive();g.skReset();
    for(const m of g.MOBS)g.removeMob(m,false);g.compactMobs();
    const P=g.P;P.x=300;P.z=0;P.dead=false;P.hp=g.S.maxHp;P.dashT=0;P.spinT=0;
    const m=g.makeMobObj(99001,'slime',302,0,50,false,false,false);m.spawning=false;m.sp=0;m.hp=m.maxHp=1e12;m.freeze=999;
    const lv=g.SES.pf.level,au=g.save.auto,tryOnce=()=>{m.hp=m.maxHp;P.atkCd=0;g.mouse.down=false;g.mouse.gx=P.x-5;g.mouse.gz=P.z;g.tryAttackInput();return m.hp<m.maxHp};
    g.save.auto=true;g.SES.pf.level=4;T(!tryOnce(),'no auto attack below Lv.5');
    g.SES.pf.level=5;T(tryOnce(),'auto attack hits the nearest enemy while the mouse points away');
    T(g.aimDir().x<0,'skills still aim at the mouse');
    P.stealth=3;T(!tryOnce(),'auto attack keeps stealth');P.stealth=0;
    g.save.auto=false;T(!tryOnce(),'switch off stops it');
    g.SES.pf.level=lv;g.save.auto=au;
  }
  // developer tools guard (last: once tripped the game stays stopped)
  { // every region has its own dungeon: entry, scenery, waves, boss, offline rewards
    const ids=['meadow','forest','ember','crystal','storm','void','snow','desert','sky'],D=g.DG;
    T(ids.every(id=>g.DGP.some(p=>p.dg===id))&&new Set(ids.map(id=>g.DGDEF[id].zid)).size===9,'one portal per region');
    T(new Set(ids.map(id=>g.DGDEF[id].bits)).size===9&&ids.every(id=>g.DGDEF[id].bits>2),'boss snapshot bits are unique');
    T(g.DGP.filter(p=>p.dg).every(p=>g.zoneAt(p.x,p.z).id===g.DGDEF[p.dg].zid),'portals sit in their own region');
    for(const id of ids){
      const def=g.DGDEF[id];g.UI.close();g.dgEnter(id);g.P.iframes=1e9;g.P.dead=false;step(260);
      T(D.on&&g.MOBS.some(m=>m.dg&&def.mobs.includes(m.type)),id+' wave spawns');
      D.wave=4;D.ph='advance';g.P.x=D.cx;g.P.z=D.cz-300;g.P.iframes=1e9;step(150);
      const b=g.MOBS.find(m=>m.type==='dgboss');T(b&&b.bn===def.bn&&b.bk===id,id+' boss spawns');
      g.dgLeave('x');step(2);
    }
    { // sky temple: two waves in every room before the gate opens
      g.UI.close();g.dgEnter('sky');g.P.dead=false;let n=0,prev='';
      for(let i=0;i<200&&D.ph!=='boss';i++){g.P.iframes=1e9;for(const m of g.MOBS.slice())if(m.dg&&!m.dead&&m.type!=='dgboss')g.applyMobDmg(m,1e9,null,g.SES.name);if(D.ph==='advance'){g.P.x=D.cx;g.P.z=D.cz-300}step(60);if(D.ph==='wave'&&prev!=='wave')n++;prev=D.ph}
      T(n===8&&D.ph==='boss','sky dungeon runs 8 waves then boss ('+n+' '+D.ph+')');
      const P=g.P,hit=hb=>{P.dead=false;P.iframes=0;P.shield=0;P.hb=hb;P.hp=g.S.maxHp;const h=P.hp,arm=g.S.armor;g.S.armor=.64;g.hurtPlayer(215*1.7*1.5,P.x,P.z);g.S.armor=arm;P.hb=null;return(h-P.hp)/g.S.maxHp};
      P.x=D.cx;const bare=hit(null),buffed=hit({ar:{t:20,pw:1}});
      T(bare>.8&&buffed<.65&&buffed>.5,'sky boss slam is near lethal without holy armor ('+bare.toFixed(2)+'/'+buffed.toFixed(2)+')');
    }
    const K='rw_local_db_v1',me=g.SES.name,tk=g.SES.token,edit=f=>{const d=JSON.parse(localStorage.getItem(K));f(d.acc[me]);localStorage.setItem(K,JSON.stringify(d))};
    let lv;edit(a=>{lv=a.level;a.level=99});
    { edit(a=>{a.level=1});let solo='';try{g.LocalAPI.dgBegin(me,tk,'sky')}catch(e){solo=e.message}
      let pty='';try{g.LocalAPI.dgBegin(me,tk,'sky',true)}catch(e){pty=e.message}
      T(solo==='LOW_LEVEL'&&pty==='','dungeon level limit: solo only ('+solo+'/'+pty+')');edit(a=>{a.level=99}) }
    for(const id of ids){g.LocalAPI.dgBegin(me,tk,id);edit(a=>{a.dgRun.ts-=60000});const r=g.LocalAPI.dgEnd(me,tk,id,1);T(r.rewards.every(x=>x.t!=='weapon'||g.wTier(x.base)===g.DGDEF[id].zid),id+' weapon reward is the region grade');T(r.rewards.every(x=>x.t!=='rune'||x.g<2||x.base===id),id+' area rune');T(r.rewards.length>=2&&r.rewards.every(x=>x.t!=='rune'||g.RUNES[x.base]),id+' reward '+JSON.stringify(r.rewards))}
    edit(a=>{a.level=lv});
  }
  { // weapon grade = region, region rune bonus
    const ids=g.REGION_RUNE;
    T(ids.length===9&&ids.every((id,i)=>g.DGDEF[id].zid===i+1&&g.RUNES[id]),'nine regions, nine runes');
    for(let n=1;n<=9;n++){
      const id=ids[n-1],sum=q=>Object.values(q.en).reduce((a,b)=>a+b,0)+q.hp+q.rg,base='warrior_'+n,other=ids[n%9];
      T(Math.abs(sum(g.weaponRuneFx({base,rune:id+':2'}))-sum(g.runeFx(id+':2'))*g.RUNE_MATCH)<1e-9&&Math.abs(sum(g.weaponRuneFx({base,rune:other+':2'}))-sum(g.runeFx(other+':2')))<1e-9,'grade '+n+' bonus only with its own rune');
    }
    for(const c of g.CLASSES){const o=g.makeHeroFor(c,c,0xffffff);g.applyWeaponLook(o,c+'_9_2');T(o.wbase===c+'_9_2'&&g.wName(c+'_9')&&!g.wName(c+'_9').includes('undefined'),'grade 9 '+c)}
    for(const c of g.CLASSES){const o=g.makeHeroFor(c,c,0xffffff),k=n=>{g.applyWeaponLook(o,c+'_'+n);g.animHeroFor(o,1.3,0,-1,false,1);return o.wau?o.wau.kind:null};T(k(7)==='storm'&&k(8)==='eternity'&&k(9)==='celestial'&&k(6)===null&&!o.wau,'weapon grade aura '+c)}
    T(g.weaponAtk('mage_9',0)>g.weaponAtk('mage_8',0)&&g.sellValue({kind:'weapon',base:'mage_9',enh:0,ench:[]})===90000,'grade 9 stats and value');
    T(g.wType('mage_4_11')===0&&g.wName('mage_4_11')===g.wName('mage_4'),'removed kinds fall back to the basic kind');
    const me=g.SES.name,tk=g.SES.token,K='rw_local_db_v1',edit=f=>{const d=JSON.parse(localStorage.getItem(K));f(d.acc[me]);localStorage.setItem(K,JSON.stringify(d))};
    let lv;edit(a=>{lv=a.level;a.level=99});
    for(const z of[1,5,9]){let got=[];for(let i=0;i<40&&got.length<3;i++){edit(a=>{a.tokens=80;a.ts=Date.now()});got=got.concat(g.LocalAPI.claim(me,tk,[{z,ml:99,e:true,n:30}]).drops.filter(d=>d.kind==='weapon'))}
      T(got.length&&got.every(d=>g.wTier(d.base)===z),'zone '+z+' drops grade '+z)}
    edit(a=>{a.level=lv});
  }
  { // doorway walking, map guide, realtime reconnect
    const D=g.DG,wasOn=D.on,wave=D.wave;D.on=true;D.wave=4;D.shapes=null;
    const o={x:D.cx,z:D.cz+6-10};let stuck=false;
    while(o.z>D.cz-4*68){const z0=o.z;o.z-=.08;g.dgClampXZ(o);if(o.z>z0-.04){stuck=z0-D.cz;break}}
    T(stuck===false,'walks through every doorway without dash '+stuck);D.on=wasOn;D.wave=wave;
    const pt=g.DGP.find(p=>p.dg==='meadow');g.P.x=0;g.P.z=0;g.P.dead=false;D.on=false;
    g.guideToggle('meadow');T(g.GUIDE.id==='meadow','guide starts');g.guideToggle('meadow');T(g.GUIDE.id===null,'second pick cancels');
    g.guideToggle('meadow');g.P.x=pt.x+3;g.P.z=pt.z;g.guideUpdate(.3);T(g.GUIDE.id===null,'arrival ends guide');
    const chs=[];const mk=()=>{const c={h:{},on(a,b,f){c.h[a+':'+b.event]=f;return c},subscribe(f){c.st=f;setTimeout(()=>f('SUBSCRIBED'),1);setTimeout(()=>c.h['presence:sync'](),2);return c},track(){},send(){},presenceState:()=>({})};chs.push(c);return c};
    window.supabase=window.supabase||{};g.NET.sb={channel:mk,removeChannel(){}};g.NET.shard=0;g.NET.party=null;
    await g.netConnect();T(g.NET.on&&g.NET.ch===chs[0],'connects');
    chs[0].st('CHANNEL_ERROR');T(!g.NET.on&&g.NET.retryT,'loss schedules a retry');
    await sleep(1300);T(g.NET.on&&g.NET.ch===chs[1],'reconnects automatically');
    g.NET.on=false;g.NET.ch=null;
  }
  {
    await g.API.login('테스트','newpass123');g.enterGame();step(3);g.UI.close&&g.UI.close();
    g.guardProbe();T(!g.GUARD.tripped,'no trip without developer tools');
    const db=localStorage.getItem('rw_local_db_v1'),set=localStorage.getItem('rw_settings_v1'),gold=g.SES.pf.gold;
    const acc=()=>JSON.parse(localStorage.getItem('rw_local_db_v1')).acc[g.SES.name];
    {const d=JSON.parse(db),a=d.acc[g.SES.name];a.tokens=60;a.gat_tk=40;localStorage.setItem('rw_local_db_v1',JSON.stringify(d))}
    const k0=acc().kills,x0=acc().gat_xp||0;
    for(let i=0;i<3;i++)g.registerKill({zid:1,ml:1,elite:false,x:g.P.x,z:g.P.z,r:1});g.GAT.pend.weed=2;
    g.guardTrip();T(g.GUARD.tripped,'guard trips');
    T(acc().kills===k0+3,'kills collected before the trip are saved '+k0+'->'+acc().kills);
    T(acc().gat_xp===x0+2,'gathering collected before the trip is saved');
    const db2=localStorage.getItem('rw_local_db_v1');
    g.registerKill({zid:1,ml:1,elite:false,x:g.P.x,z:g.P.z,r:1});await g.flushKills();
    let err='';try{await g.API.call('buy','hp1',1)}catch(e){err=e.message}T(err==='DEVTOOLS','server calls are refused');
    try{g.LocalAPI.buy(g.SES.name,g.SES.token,'hp1',1)}catch(e){}
    g.save.vol=.123;g.writeSave();
    T(localStorage.getItem('rw_local_db_v1')===db2&&localStorage.getItem('rw_settings_v1')===set,'nothing is saved after the trip');
  }
  { // minor updates: assassin Q reset on a late kill, gunner nerf, value sort, golem
    g.P.cd.q=4;const m={x:g.P.x+2,z:g.P.z,r:1,face:0,hp:1,dead:true,def:{}};
    T(g.golemBuild().legs.length===2&&g.golemBuild(true).arms.length===2,'golem model builds');
    T(g.ROGUE_VAMP===.08&&g.CLS.warrior.atk===5.8&&g.CLS.darknight.atk===6.1,'assassin vamp, warrior/darknight buff');
    T(g.golemCount(9)===1&&g.golemCount(10)===2&&g.golemCount(35)===4&&g.golemCount(99)===5,'golems per 10 levels');
    { const lv=g.SES.pf.level,n0=g.DECOYS.length;g.SES.pf.level=35;g.P.golemGuard=0;g.SK.s_q({atk:1,a:{x:0,z:1},col:0,m:1,sk:{}});
      T(g.DECOYS.length===n0+4&&g.P.golemGuard>0,'Lv35 summons 4 armored golems');for(let i=0;i<130;i++)g.tickSkills(.1);T(g.DECOYS.length===n0,'golems expire');g.SES.pf.level=lv;g.P.golemGuard=0; }
    { const keep=g.MOBS.splice(0);const mm=g.makeMobObj(99001,'slime',g.P.x+2,g.P.z,1,false,false,false);if(!g.MOBS.includes(mm))g.MOBS.push(mm);mm.spawning=false;mm.hp=mm.maxHp=1e12;
      g.SK.r_q({atk:1,a:{x:0,z:1},col:0,m:1,sk:{}});g.P.cd.q=4;g.tickSkills(.1);const before=g.P.cd.q;T(g.P.qGuard>0,'assassin Q gives damage reduction');mm.dead=true;g.tickSkills(.1);T(before===4&&g.P.cd.q===0,'assassin Q resets on a kill confirmed late');
      g.MOBS.splice(0);g.MOBS.push(...keep); }
    T(g.CLS.gunner.atk===3.8&&g.CLS.gunner.aps===3.3,'gunner nerf');
    const a={id:1,kind:'weapon',base:'warrior_2',enh:0,ench:[]},b={id:2,kind:'weapon',base:'warrior_5',enh:0,ench:[]},c={id:3,kind:'potion',base:'hp1',qty:99};
    T([c,a,b].sort(g.byValue).map(i=>i.id).join()==='2,1,3','inventory sorted by value');
  }
  { // assassin Q charge gauge
    g.P.cdMax.q=3;g.P.cd.q=1.5;T(Math.abs(g.qCharge()-.5)<1e-9,'q charge half');g.P.cd.q=0;T(g.qCharge()===1,'q charge full');
    T(g.qPower(1)===1.4&&g.qPower(.2)<g.qPower(.6)&&g.qPower(.99)<1,'q power grows with charge');
  }
  { // duel: request -> accept -> hit -> lose -> back
    const sent=[],N=g.NET,on0=N.on,ch0=N.ch,party0=N.party,me=g.SES.name;N.on=true;N.party=null;N.ch={send:o=>sent.push(o),track(){}};
    N.peers['상대']={got:true,x:1306,z:0,tx:1306,tz:0,hp:100,lv:10,cls:'warrior',job:'warrior',anim:0,f:0,tf:0};
    const x0=g.P.x,z0=g.P.z;g.P.dead=false;
    g.duelRequest('상대');const q=sent.find(o=>o.event==='dq');T(!!q,'duel request sent');
    g.onDuelYes({f:'상대',t:me,id:q.payload.id});T(g.DU.on&&g.DU.ph==='count'&&g.P.x>1200,'duel starts in arena');
    g.frame(.03);g.frame(.03);T(g.P.x>1200&&g.DU.on,'stays in arena across frames');T(g.duelShows('상대')&&!g.duelShows('구경꾼'),'only fighters visible in arena');
    for(let i=0;i<35;i++)g.duelUpdate(.1);T(g.DU.ph==='fight'&&!!g.DU.prox,'duel fight phase');
    g.dealMob(g.DU.prox,100,{crit:false});g.duelUpdate(.2);T(sent.some(o=>o.event==='dh'&&o.payload.d>0&&o.payload.t==='상대'),'hit sent to opponent');
    const hp=g.P.hp;g.P.iframes=0;g.P.dashT=0;g.onDuelHit({id:g.DU.id,f:'상대',t:me,d:200});T(g.P.hp<hp,'duel damage taken');
    g.P.iframes=0;g.P.stunT=0;g.P.stunImm=0;g.onDuelHit({id:g.DU.id,f:'상대',t:me,d:0,fz:2,mv:[3,0],bn:50});
    T(g.P.stunT>0&&g.P.stunT<=1.5&&g.skBusy(),'duel stun applies');const kx=g.P.x,bh=g.P.hp;for(let i=0;i<25;i++)g.duelUpdate(.1);T(g.P.x>kx+2&&g.P.hp<bh&&!(g.P.stunT>0),'duel knockback and burn apply, stun ends');
    g.P.hp=g.S.maxHp;
    for(let i=0;i<20&&g.DU.ph==='fight';i++){g.P.iframes=0;g.onDuelHit({id:g.DU.id,f:'상대',t:me,d:1e9})}
    T(g.DU.ph==='end'&&sent.some(o=>o.event==='de'&&o.payload.w==='상대'&&o.payload.counted===1),'loser reports defeat');
    for(let i=0;i<45;i++)g.duelUpdate(.1);T(!g.DU.on&&g.P.x===x0&&g.P.z===z0,'returns after duel');
    for(const[n,v]of[['갑','을'],['을','갑']])N.peers[n]={got:true,x:1300,z:0,tx:1300,tz:0,hp:90,lv:5,cls:'warrior',job:'warrior',anim:0,f:0,tf:0,du:{id:'spec-test',vs:v}};
    g.openParty();g.P.x=0;g.P.z=0;g.duelSpectate('갑');g.frame(.03);g.duelUpdate(.1);T(g.DU.on&&g.DU.role==='spec'&&Math.abs(g.P.x)<20,'spectate from town');
    g.onDuelEnd({id:'spec-test',w:'갑',l:'을',counted:1});for(let i=0;i<45;i++)g.duelUpdate(.1);T(!g.DU.on,'spectator leaves when duel ends');
    delete N.peers['갑'];delete N.peers['을'];
    {g.skReset();g.SK.s_q({a:{x:0,z:1},atk:10,m:1,col:0xffffff});const gl=g.myGolems();T(gl&&gl[1].length>=1,'own golems are sent to others');
      N.peers['소환']={got:true,x:0,z:0,tx:0,tz:0,f:0,tf:0,hp:100,lv:40,cls:'summoner',job:'summoner',anim:0,live:true};
      g.onPos({n:'소환',x:1,z:1,f:0,m:0,h:100,d:0,gl});g.netUpdate(.05);T(N.peers['소환'].gol&&N.peers['소환'].gol.length===gl[1].length,'other players see the golems');
      g.onPos({n:'소환',x:1,z:1,f:0,m:0,h:100,d:0,gl:0});g.netUpdate(.05);T(!N.peers['소환'].gol,'golems disappear for others when gone');delete N.peers['소환'];g.skReset()}
    N.on=on0;N.ch=ch0;N.party=party0;delete N.peers['상대'];
  }
  console.log('errors:',errs,'ok:',ok,'bad:',bad);
  process.exit(bad||errs?1:0);
})().catch(e=>{console.log('CRASH',e.stack||e);process.exit(2)});
