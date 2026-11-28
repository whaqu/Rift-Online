/* ---------------- game data ---------------- */
const CLS={
  warrior:{name:'전사',hp:172,hpLv:16,atk:5.8,atkLv:2.4,aps:2.2,spd:6.8,crit:.05,range:3.4,col:0x2f56c8,
    q:{id:'w_q',name:'회전 베기',type:'nova',cd:7,rad:4.9,dmg:2.4,kb:14,col:0xffd24a},
    e:{id:'w_e',name:'방어 태세',type:'buff',cd:14,dur:5,shield:.35,spd:1.25,col:0x6aa8ff}},
  mage:{name:'마법사',hp:100,hpLv:9,atk:6,atkLv:2.4,aps:1.9,spd:6.6,crit:.08,range:0,col:0x6a3fc8,
    q:{id:'m_q',name:'메테오',type:'ground',cd:9,rad:4.2,dmg:4.2,delay:.8,range:15,col:0xffa23a,burn:1},
    e:{id:'m_e',name:'서리 파동',type:'nova',cd:11,rad:8,dmg:1.6,kb:8,freeze:2.4,col:0x9fe8ff}},
  archer:{name:'궁수',hp:112,hpLv:10,atk:4,atkLv:2.0,aps:3.2,spd:7.6,crit:.14,range:0,col:0x2f7a4a,
    q:{id:'a_q',name:'화살비',type:'rain',cd:10,rad:4.8,dmg:1.15,dur:1.8,range:14,col:0x6bffb0},
    e:{id:'a_e',name:'후퇴 사격',type:'volley',cd:7,n:5,spread:.2,dmg:1.5,pierce:3,back:1,col:0x6bffb0}}
};
const ROGUE_VAMP=.08;   // assassin innate lifesteal
const CLASSES=['warrior','mage','archer','rogue','cleric','lancer','monk','gunner','summoner','darknight'];
Object.assign(CLS.warrior,{blurb:'단단한 근접 전사. 균형 잡힌 입문 직업',sty:{t:'melee',range:3.4,arc:2.15,big:2.8,bigMul:1.7,col:0xbfe4ff,bigCol:0xffd24a,lunge:5,kb:6,kbBig:11}});
Object.assign(CLS.mage,{blurb:'강력한 마법 폭격. 체력은 낮습니다',sty:{t:'proj',kind:'orb',spd:25,r:.55,life:1.3,splash:2.3,col:0x5ee7ff}});
Object.assign(CLS.archer,{blurb:'멀리서 빠르게 쏘는 원거리 딜러',sty:{t:'proj',kind:'arrow',spd:46,r:.4,life:.85,pierce:1,col:0x6bffb0}});
Object.assign(CLS,{
  rogue:{name:'도적',blurb:'치명타와 흡혈, 기동성. 빠른 연타',hp:100,hpLv:9.5,atk:4.4,atkLv:2.1,aps:3.3,spd:8.0,crit:.2,range:2.5,col:0x7a3f9a,
    sty:{t:'melee',range:2.5,arc:1.9,big:2.6,bigMul:1.5,col:0xd0b0ff,bigCol:0xff6bd6,lunge:7,kb:3,kbBig:6},
    q:{id:'r_q',name:'연막탄',type:'nova',cd:8,rad:5,dmg:1.7,kb:6,freeze:1.2,col:0xb08aff},
    e:{id:'r_e',name:'그림자 걸음',type:'buff',cd:12,dur:5,aps:1.35,spd:1.4,col:0xa07aff}},
  cleric:{name:'성직자',blurb:'성스러운 빛으로 파티를 치유하고 강화하는 버퍼',hp:140,hpLv:12,atk:4.6,atkLv:2.0,aps:2.0,spd:6.6,crit:.06,range:0,col:0xe8d27a,
    sty:{t:'proj',kind:'orb',spd:22,r:.6,life:1.1,splash:1.9,col:0xfff2a0},
    q:{id:'c_q',name:'성스러운 빛',type:'nova',cd:9,rad:6,dmg:1.8,kb:8,heal:.18,col:0xfff2a0},
    e:{id:'c_e',name:'신의 가호',type:'buff',cd:15,dur:6,shield:.4,spd:1.1,col:0xffe9a0}},
  lancer:{name:'창기사',blurb:'긴 사거리의 창. 돌진과 관통',hp:145,hpLv:13,atk:5,atkLv:2.1,aps:1.9,spd:6.8,crit:.07,range:4.6,col:0xb85a4a,
    sty:{t:'melee',range:4.6,arc:1.0,big:1.3,bigMul:1.9,col:0xffd0c0,bigCol:0xff8a4a,lunge:6,kb:5,kbBig:12},
    q:{id:'l_q',name:'돌격',type:'dash',cd:7,dist:10,dmg:2.4,col:0xff9a5a},
    e:{id:'l_e',name:'창 회오리',type:'nova',cd:11,rad:5.6,dmg:2.1,kb:12,col:0xffc08a}},
  monk:{name:'권사',blurb:'맨주먹 연타. 호흡으로 몸을 강화',hp:135,hpLv:12,atk:4.8,atkLv:2.1,aps:3.0,spd:7.2,crit:.1,range:2.3,col:0xd2893a,
    sty:{t:'melee',range:2.3,arc:2.4,big:3.2,bigMul:1.6,col:0xffe0a0,bigCol:0xffb04a,lunge:5,kb:5,kbBig:9},
    q:{id:'mk_q',name:'기공파',type:'volley',cd:7,n:3,spread:.22,dmg:1.6,pierce:4,speed:32,col:0xffd27a},
    e:{id:'mk_e',name:'호흡',type:'buff',cd:13,dur:5,aps:1.3,atk:1.2,shield:.2,col:0xffe27a}},
  gunner:{name:'총잡이',blurb:'총알 세례. 빠른 연사와 폭탄',hp:105,hpLv:9.5,atk:3.8,atkLv:1.8,aps:3.3,spd:7.4,crit:.12,range:0,col:0x4a8aa0,
    sty:{t:'proj',kind:'arrow',spd:60,r:.3,life:.6,pierce:1,col:0xffe27a},
    q:{id:'g_q',name:'난사',type:'volley',cd:8,n:9,spread:.1,dmg:.9,pierce:2,speed:50,col:0xffd24a},
    e:{id:'g_e',name:'집속 폭탄',type:'ground',cd:11,rad:4.6,dmg:3.2,delay:.6,range:13,burn:1,col:0xff8a3a}},
  summoner:{name:'소환사',blurb:'정령을 불러 넓은 범위를 폭격',hp:108,hpLv:9.5,atk:5.5,atkLv:2.3,aps:1.8,spd:6.6,crit:.07,range:0,col:0x3aa08a,
    sty:{t:'proj',kind:'orb',spd:20,r:.6,life:1.5,splash:2.6,col:0x6bffd0},
    q:{id:'s_q',name:'정령 폭발',type:'ground',cd:9,rad:4.6,dmg:3.6,delay:.7,range:14,col:0x6bffd0},
    e:{id:'s_e',name:'정령 소나기',type:'rain',cd:12,rad:4.5,dmg:1.0,dur:2.2,range:12,col:0x9fffe8}},
  darknight:{name:'암흑기사',blurb:'어둠의 대검. 피를 흡수하며 싸움',hp:178,hpLv:16,atk:6.1,atkLv:2.4,aps:2.1,spd:6.7,crit:.07,range:3.6,col:0x4a2a6a,
    sty:{t:'melee',range:3.6,arc:2.3,big:3.0,bigMul:1.75,col:0xb08aff,bigCol:0xff3a6a,lunge:5,kb:6,kbBig:11},
    q:{id:'d_q',name:'암흑 베기',type:'nova',cd:8,rad:5.2,dmg:2.5,kb:12,heal:.1,col:0xa070ff},
    e:{id:'d_e',name:'피의 서약',type:'buff',cd:15,dur:6,atk:1.35,shield:.25,col:0xff3a6a}}
});
const JOBS={
  warrior:{name:'전사',cls:'warrior',tier:0,parent:null,req:1,price:0,m:{}},
  mage:{name:'마법사',cls:'mage',tier:0,parent:null,req:1,price:0,m:{}},
  archer:{name:'궁수',cls:'archer',tier:0,parent:null,req:1,price:0,m:{}},
  gladiator:{name:'검투사',cls:'warrior',tier:1,parent:'warrior',req:20,price:5000,m:{atk:1.15,crit:.08,aps:1.05},desc:'공격력·치명타 특화. 돌진하며 베어 넘깁니다.',
    r:{id:'gladiator_r',name:'돌진 베기',type:'dash',cd:8,dist:9,dmg:2.6,col:0xffd24a}},
  guardian:{name:'수호기사',cls:'warrior',tier:1,parent:'warrior',req:20,price:5000,m:{hp:1.4,armor:.12},desc:'체력·방어 특화. 방패로 적을 기절시킵니다.',
    r:{id:'guardian_r',name:'방패 강타',type:'nova',cd:10,rad:5.5,dmg:1.6,kb:10,freeze:1.5,col:0x9fc8ff}},
  blademaster:{name:'검성',cls:'warrior',tier:2,parent:'gladiator',req:30,price:30000,m:{atk:1.35,aps:1.2,crit:.12},desc:'빠른 검술. 검기를 날려 일직선의 적을 벱니다.',
    r:{id:'blademaster_r',name:'검기 폭풍',type:'volley',cd:7,n:3,spread:.28,dmg:2.2,pierce:8,speed:34,col:0xbfe4ff}},
  berserker:{name:'광전사',cls:'warrior',tier:2,parent:'gladiator',req:30,price:30000,m:{atk:1.5,vamp:.06,hp:.95,berserk:1},desc:'체력이 낮을수록 빨라집니다. 피해 흡수.',
    r:{id:'berserker_r',name:'분노',type:'buff',cd:20,dur:8,aps:1.5,atk:1.4,col:0xff5a4a}},
  paladin:{name:'성기사',cls:'warrior',tier:2,parent:'guardian',req:30,price:30000,m:{hp:1.5,armor:.15,regen:.02},desc:'체력 재생. 성스러운 빛으로 적을 쓸고 회복합니다.',
    r:{id:'paladin_r',name:'성스러운 빛',type:'nova',cd:12,rad:6,dmg:1.8,kb:8,heal:.25,col:0xfff2a0}},
  bulwark:{name:'요새수호자',cls:'warrior',tier:2,parent:'guardian',req:30,price:30000,m:{hp:1.8,armor:.25,atk:.95},desc:'가장 단단한 직업. 대지를 내리쳐 기절시킵니다.',
    r:{id:'bulwark_r',name:'대지 분쇄',type:'ground',cd:11,rad:6,dmg:3.2,delay:.6,range:7,freeze:2,col:0xb08a5a}},
  pyromancer:{name:'화염술사',cls:'mage',tier:1,parent:'mage',req:20,price:5000,m:{atk:1.15,burn:1},desc:'모든 공격에 화상 효과. 화염 폭발을 사용합니다.',
    r:{id:'pyromancer_r',name:'화염 폭발',type:'ground',cd:8,rad:4,dmg:3,delay:.5,range:13,burn:2,col:0xff7a2a}},
  cryomancer:{name:'냉기술사',cls:'mage',tier:1,parent:'mage',req:20,price:5000,m:{hp:1.1,armor:.05},desc:'적을 얼리며 싸우는 제어형 마법사.',
    r:{id:'cryomancer_r',name:'얼음 창',type:'volley',cd:8,n:5,spread:.18,dmg:1.4,pierce:3,speed:30,freeze:1.4,col:0x9fe8ff}},
  flamelord:{name:'화염군주',cls:'mage',tier:2,parent:'pyromancer',req:30,price:30000,m:{atk:1.4,burn:2,aps:1.1},desc:'화염 마법의 정점. 지면을 불바다로 만듭니다.',
    r:{id:'flamelord_r',name:'불지옥',type:'rain',cd:14,rad:6.2,dmg:1.1,dur:3,range:13,col:0xff5a2a}},
  meteormage:{name:'유성술사',cls:'mage',tier:2,parent:'pyromancer',req:30,price:30000,m:{atk:1.5},desc:'거대한 유성을 연달아 떨어뜨립니다.',
    r:{id:'meteormage_r',name:'유성우',type:'ground',cd:16,rad:4,dmg:3.5,delay:.7,range:14,count:4,burn:1,col:0xffb04a}},
  frostlord:{name:'서리군주',cls:'mage',tier:2,parent:'cryomancer',req:30,price:30000,m:{hp:1.3,armor:.1,atk:1.2},desc:'광범위 빙결. 단단하고 강합니다.',
    r:{id:'frostlord_r',name:'절대영도',type:'nova',cd:16,rad:9.5,dmg:2.4,kb:6,freeze:3,col:0xbff2ff}},
  stormcaller:{name:'폭풍술사',cls:'mage',tier:2,parent:'cryomancer',req:30,price:30000,m:{atk:1.35,chain:2,aps:1.15},desc:'번개가 적을 연쇄로 타격합니다.',
    r:{id:'stormcaller_r',name:'낙뢰',type:'chain',cd:9,n:8,dmg:2,col:0xfff2a0}},
  sniper:{name:'저격수',cls:'archer',tier:1,parent:'archer',req:20,price:5000,m:{atk:1.2,crit:.12,pierce:1},desc:'치명타와 관통 특화. 먼 거리에서 한 발을 노립니다.',
    r:{id:'sniper_r',name:'저격',type:'volley',cd:8,n:1,spread:0,dmg:5.5,pierce:8,speed:60,col:0xffe27a}},
  hunter:{name:'사냥꾼',cls:'archer',tier:1,parent:'archer',req:20,price:5000,m:{aps:1.15,spd:1.1,hp:1.1},desc:'연사와 기동성 특화. 화살을 부채꼴로 쏩니다.',
    r:{id:'hunter_r',name:'연발 사격',type:'volley',cd:8,n:7,spread:.13,dmg:1,pierce:2,speed:40,col:0x6bffb0}},
  marksman:{name:'명사수',cls:'archer',tier:2,parent:'sniper',req:30,price:30000,m:{atk:1.45,crit:.2,pierce:2},desc:'가장 강력한 한 발. 모든 적을 관통합니다.',
    r:{id:'marksman_r',name:'관통 저격',type:'volley',cd:10,n:1,spread:0,dmg:8.5,pierce:14,speed:70,col:0xffd24a}},
  shadowarcher:{name:'그림자 궁수',cls:'archer',tier:2,parent:'sniper',req:30,price:30000,m:{aps:1.25,crit:.18,spd:1.2},desc:'빠르게 이동하며 사격합니다.',
    r:{id:'shadowarcher_r',name:'암영 질주',type:'dash',cd:7,dist:11,dmg:1.6,col:0xa07aff}},
  stormarcher:{name:'폭풍궁수',cls:'archer',tier:2,parent:'hunter',req:30,price:30000,m:{aps:1.35,atk:1.25,chain:1},desc:'폭풍 같은 연사. 화살 폭우를 내립니다.',
    r:{id:'stormarcher_r',name:'폭풍 화살',type:'rain',cd:13,rad:7,dmg:1.1,dur:3,range:14,col:0x7fd6ff}},
  beasthunter:{name:'야수사냥꾼',cls:'archer',tier:2,parent:'hunter',req:30,price:30000,m:{hp:1.5,atk:1.3,vamp:.04,armor:.1},desc:'야수의 힘을 빌립니다. 체력과 공격이 모두 높습니다.',
    r:{id:'beasthunter_r',name:'야성의 포효',type:'buff',cd:18,dur:10,atk:1.3,spd:1.3,shield:.3,col:0xe0a050}}
};
  const mkT1=(id,name,cls,m,desc,r,col)=>{JOBS[id]={name,cls,tier:1,parent:cls,req:20,price:5000,m,desc,r:Object.assign({id:id+'_r'},r)};JOB_COL[id]=col};
  for(const c of['rogue','cleric','lancer','monk','gunner','summoner','darknight'])JOBS[c]={name:CLS[c].name,cls:c,tier:0,parent:null,req:1,price:0,m:{}};
  mkT1('assassin','암살자','rogue',{atk:1.2,crit:.15},'치명타 특화. 순식간에 파고들어 베어 넘깁니다.',{name:'급습',type:'dash',cd:6,dist:12,dmg:3.2,col:0xff6bd6},0xff6bd6);
  mkT1('trickster','괴도','rogue',{aps:1.2,spd:1.15},'손이 빠른 기동형. 표창을 흩뿌립니다.',{name:'표창 난무',type:'volley',cd:8,n:5,spread:.3,dmg:1.2,pierce:2,speed:36,col:0xd0b0ff},0xd0b0ff);
  mkT1('priest','사제','cleric',{hp:1.25,regen:.015},'회복 특화. 치유의 파동으로 스스로를 지킵니다.',{name:'치유의 파동',type:'nova',cd:11,rad:7,dmg:1.2,kb:6,heal:.35,col:0x9fffd0},0x9fffd0);
  mkT1('crusader','성전사','cleric',{atk:1.15,armor:.1,hp:1.1},'신의 이름으로 적을 단죄하는 공격형 성직자.',{name:'심판',type:'ground',cd:10,rad:5,dmg:3.2,delay:.6,range:10,col:0xfff2a0},0xffe27a);
  mkT1('dragoon','용기병','lancer',{atk:1.2,spd:1.1},'하늘 높이 뛰어올라 창으로 꿰뚫습니다.',{name:'용창 돌격',type:'dash',cd:7,dist:12,dmg:3,col:0xff7a4a},0xff7a4a);
  mkT1('halberdier','창병','lancer',{hp:1.3,armor:.1},'단단한 방어와 넓은 휘두르기를 겸비했습니다.',{name:'대회전',type:'nova',cd:10,rad:6.5,dmg:2.4,kb:14,col:0xffc08a},0xc8a070);
  mkT1('brawler','투사','monk',{atk:1.25,aps:1.1},'권법 연타의 달인. 주먹이 폭발합니다.',{name:'폭렬권',type:'nova',cd:8,rad:5,dmg:2.8,kb:16,col:0xffa23a},0xffa23a);
  mkT1('zenmaster','선승','monk',{hp:1.2,regen:.02,armor:.08},'마음을 다스려 몸을 단련한 수행자.',{name:'명경지수',type:'buff',cd:18,dur:8,aps:1.3,atk:1.2,shield:.3,col:0x9fffe8},0x9fffe8);
  mkT1('gunslinger','쌍권총사','gunner',{aps:1.2,crit:.1},'두 자루 총으로 탄막을 만듭니다.',{name:'탄막',type:'volley',cd:8,n:8,spread:.09,dmg:1,pierce:2,speed:52,col:0xffd24a},0xffd24a);
  mkT1('grenadier','폭파병','gunner',{atk:1.2,burn:1},'폭탄과 중화기 전문. 범위 공격이 강력합니다.',{name:'융단 폭격',type:'ground',cd:11,rad:5.2,dmg:3.2,delay:.5,range:13,count:3,burn:1,col:0xff7a2a},0xff7a2a);
  mkT1('spiritcaller','정령사','summoner',{atk:1.2,aps:1.1},'정령의 비를 내려 넓은 지역을 휩씁니다.',{name:'정령의 비',type:'rain',cd:13,rad:6,dmg:1.2,dur:3,range:13,col:0x6bffd0},0x6bffd0);
  mkT1('necromancer','강령술사','summoner',{hp:1.2,vamp:.04},'죽음의 기운으로 적의 생명을 빨아들입니다.',{name:'죽음의 파동',type:'nova',cd:11,rad:7,dmg:2.2,kb:6,heal:.2,col:0x9a6aff},0x9a6aff);
  mkT1('reaper','사신','darknight',{atk:1.25,crit:.12},'낫처럼 날카로운 일격. 영혼을 수확합니다.',{name:'영혼 수확',type:'dash',cd:7,dist:10,dmg:3.2,col:0xb06bff},0xb06bff);
  mkT1('doomknight','파멸기사','darknight',{hp:1.35,vamp:.04,armor:.08},'절망 속에서 더 강해지는 불굴의 기사.',{name:'파멸의 선언',type:'buff',cd:18,dur:8,atk:1.35,aps:1.2,shield:.3,col:0xff3a6a},0xff3a6a);
  // legacy (pre-rework) 2nd jobs stay valid for old accounts but cannot be picked
  for(const k of['blademaster','berserker','paladin','bulwark','flamelord','meteormage','frostlord','stormcaller','marksman','shadowarcher','stormarcher','beasthunter']){JOBS[k].tier=9;JOBS[k].legacy=1}
  // 2nd advancement: 5 awakenings per 1st job
  const ELEM={
    fire:{n:'화염',col:0xff7a2a,m:{atk:1.18,burn:1},d:'적을 불태우는 화염의 힘.'},
    ice:{n:'냉기',col:0x9fe8ff,m:{hp:1.12,armor:.06},d:'적을 얼리고 몸을 단단히 하는 냉기의 힘.'},
    thunder:{n:'번개',col:0xfff2a0,m:{aps:1.12,chain:1},d:'적에게 번개가 번지는 뇌전의 힘.'},
    dark:{n:'암흑',col:0xa070ff,m:{vamp:.04,crit:.06},d:'피해의 일부를 흡수하는 암흑의 힘.'},
    holy:{n:'성광',col:0xffe9a0,m:{hp:1.18,regen:.015,armor:.04},d:'스킬 사용 시 보호막이 생기는 성광의 힘.'}
  };
  const MULK=['hp','atk','aps','spd'];
  const mergeM=(a,b)=>{const o=Object.assign({},a);for(const k in b)o[k]=MULK.includes(k)?(o[k]||1)*b[k]:(o[k]||0)+b[k];return o};
  for(const pid of Object.keys(JOBS).filter(k=>JOBS[k].tier===1)){
    const p=JOBS[pid];
    for(const ek in ELEM){
      const E=ELEM[ek],id=pid+'_'+ek;
      JOBS[id]={name:E.n+' '+p.name,cls:p.cls,tier:2,parent:pid,req:50,price:120000,el:ek,m:mergeM(mergeM(p.m,E.m),{atk:1.1}),
        desc:'['+E.n+' 각성] '+E.d+' '+p.name+'의 기술이 한층 강해집니다.',
        r:Object.assign({},p.r,{id:id+'_r',name:E.n+' '+p.r.name,col:E.col,dmg:(p.r.dmg||1)*1.3,el:ek})};
      JOB_COL[id]=E.col;
    }
  }
const JOB_KIDS=id=>Object.keys(JOBS).filter(k=>JOBS[k].parent===id&&!JOBS[k].legacy);

const WNAMES={
  warrior:['낡은 검','철제 장검','강철 검','룬 검','미스릴 대검','용아검','폭풍의 대검','영겁의 검','천상의 성검'],
  mage:['나무 지팡이','수정 지팡이','마력의 지팡이','룬 스태프','현자의 스태프','용혼 스태프','별의 지팡이','세계수 스태프','천공의 지팡이'],
  archer:['단궁','사냥용 활','장궁','룬 활','미스릴 활','용골 활','폭풍의 활','바람의 신궁','천상의 활'],
  rogue:['녹슨 단검','철 단검','쌍날 단검','그림자 단검','암살자의 칼날','용아 단도','폭풍의 단검','영겁의 암영','천상의 비수'],
  cleric:['나무 곤봉','철제 철퇴','성직자의 메이스','룬 철퇴','성자의 홀','용혼 철퇴','별빛의 홀','천상의 홀','신성한 홀'],
  lancer:['낡은 창','철제 장창','강철 장창','룬 창','미스릴 장창','용아창','폭풍의 장창','영겁의 창','천상의 창'],
  monk:['붕대 장갑','가죽 권갑','강철 권갑','룬 권갑','미스릴 권갑','용린 권갑','폭풍의 권갑','영겁의 권갑','천상의 권갑'],
  gunner:['낡은 권총','철제 권총','강철 리볼버','룬 리볼버','미스릴 쌍총','용골 총','폭풍의 총','영겁의 총','천상의 총'],
  summoner:['낡은 토템','나무 토템','정령의 토템','룬 토템','현자의 토템','용혼 토템','별의 토템','세계수 토템','천공의 토템'],
  darknight:['녹슨 대검','어둠의 검','흑철 대검','룬 대검','암흑 대검','용아 대검','폭풍의 대검','영겁의 대검','타락천사의 대검']
};
const WICON={warrior:'sword',mage:'staff',archer:'bow',rogue:'sword',cleric:'staff',lancer:'spear',monk:'fist',gunner:'gun',summoner:'staff',darknight:'sword',sword:'sword',wand:'staff'};
/* shared weapons: base 'sword_10' / 'wand_10' are usable by several classes. Must match rw_wcan */
const SHARED_CLS={sword:['warrior','rogue','darknight'],wand:['cleric','summoner','mage']};
const wCan=(b,c)=>{const s=SHARED_CLS[wCls(b)];return s?s.includes(c):wCls(b)===c};
const UNAMES={sword:'만물의 검',archer:'만물의 활',wand:'만물의 완드',lancer:'만물의 창',monk:'만물의 건틀렛',gunner:'만물의 셰리프',sword_10_3:'크로마이스'};
/* uniques whose attack differs from WATK[9] */
const UATK={sword_10_3:1000};
const wGrade=b=>wTier(b)>9?'유니크':wTier(b)+'등급('+ZONES[wTier(b)].name+')';
const WATK=[10,22,40,70,115,180,280,420,620,880];   // 10th = unique (crafted)
const TIER_COL=['#9aa0a8','#e8e8e8','#5fd26a','#4aa8ff','#b86bff','#ff9a3a','#ff5a5a','#ffd24a','#8affef','#ff4fd8'];
const TIER_HEX=[0x9aa0a8,0xe8e8e8,0x5fd26a,0x4aa8ff,0xb86bff,0xff9a3a,0xff5a5a,0xffd24a,0x8affef,0xff4fd8];
const wTier=b=>+(String(b).split('_')[1]||1);
const wCls=b=>String(b).split('_')[0];
const wType=b=>{const p=String(b).split('_')[2];return p&&/^[12]$/.test(p)?+p:0};
/* weapon kinds: every class has 3 (balanced / heavy / swift), same tier ladder */
const WPFX=['낡은','철제','강철','룬','미스릴','용아','폭풍의','영겁의','천상의'];
const WTYPES={warrior:['대검','쌍검'],mage:['마도서','완드'],archer:['석궁','속사궁'],rogue:['쌍낫','표창'],cleric:['전투 철퇴','성배'],lancer:['미늘창','단창'],monk:['건틀릿','발톱'],gunner:['산탄총','쌍권총'],summoner:['정령서','인형'],darknight:['참마도','단도']};
const WTMOD=[{n:'균형형',d:'균형 잡힌 기본형',atk:1,aps:1,crit:0},{n:'강타형',d:'공격력 +15%, 공격 속도 -12%',atk:1.15,aps:.88,crit:0},{n:'속공형',d:'공격력 -10%, 공격 속도 +15%, 치명타 +4%',atk:.9,aps:1.15,crit:.04}];
/* weapon grade = region: grade N weapons come from zone N, and that zone's rune is stronger in them */
const RUNE_MATCH=1.3;
const REGION_RUNE=['meadow','forest','ember','crystal','storm','void','snow','desert','sky'];
const runeMatch=(base,rune)=>!!rune&&ASLOT_W[String(base).split('_')[0]]==null&&REGION_RUNE[wTier(base)-1]===String(rune).split(':')[0];
/* armor: 4 slots x 3 materials. base id = slot_tier_material (e.g. body_3_plate) */
const ASLOTS=['helm','body','gloves','boots'],ASLOT_N={helm:'투구',body:'갑옷',gloves:'장갑',boots:'신발'},ASLOT_W={helm:.6,body:1,gloves:.45,boots:.45};
const ASETS={plate:{n:'판금',def:1.25,hp:2,d:'방어와 체력 특화'},leather:{n:'가죽',def:1,hp:1.5,d:'기동과 치명타'},cloth:{n:'비단',def:.7,hp:1.2,d:'공격력과 공격 속도'}};
const ASET_KEYS=['plate','leather','cloth'];
const ADEF=[6,14,26,42,64,92,128,172],AVALUE=[60,500,2000,7000,22000,60000,170000,480000];
const APFX=['낡은','견습','병사의','룬 각인','미스릴','용린','폭풍의','영겁의'];
const ANOUN={plate:{helm:'투구',body:'판금 갑옷',gloves:'철장갑',boots:'철제 장화'},leather:{helm:'가죽 모자',body:'가죽 조끼',gloves:'가죽 장갑',boots:'가죽 장화'},cloth:{helm:'두건',body:'로브',gloves:'비단 장갑',boots:'천 신발'}};
const aSlot=b=>String(b).split('_')[0],aSet=b=>String(b).split('_')[2]||'cloth';
const armorName=b=>APFX[wTier(b)-1]+' '+ANOUN[aSet(b)][aSlot(b)];
const armorDef=(b,enh)=>Math.round(ADEF[wTier(b)-1]*ASLOT_W[aSlot(b)]*ASETS[aSet(b)].def*(1+(enh||0)*.09));
const armorHp=(b,enh)=>Math.round(armorDef(b,enh)*ASETS[aSet(b)].hp*1.6);
const SETB={plate:['최대 체력 +8%','피해 감소 +6%'],leather:['이동 속도 +4%','치명타 +6%, 공격 속도 +6%'],cloth:['공격력 +6%','공격력 +8%, 흡혈 +2%']};
function armorBonus(pieces){
  const o={def:0,hp:0,atk:0,aps:0,spd:0,crit:0,armor:0,hpPct:0,vamp:0,cnt:{plate:0,leather:0,cloth:0}};
  for(const it of pieces){
    const b=it.base,st=aSet(b);o.def+=armorDef(b,it.enh);o.hp+=armorHp(b,it.enh);o.cnt[st]++;
    if(st==='leather'){o.spd+=.006;o.crit+=.008}else if(st==='cloth'){o.atk+=.015;o.aps+=.01}
  }
  if(o.cnt.plate>=2)o.hpPct+=.08;if(o.cnt.plate>=4)o.armor+=.06;
  if(o.cnt.leather>=2)o.spd+=.04;if(o.cnt.leather>=4){o.crit+=.06;o.aps+=.06}
  if(o.cnt.cloth>=2)o.atk+=.06;if(o.cnt.cloth>=4){o.atk+=.08;o.vamp+=.02}
  return o;
}
/* level-up perks: every level (from 2) grants 1 point to spend on atk / hp / cooldown */
const PERK={a:{n:'공격력',per:.025,col:'#ff9a7a',d:'공격력 +2.5%'},h:{n:'체력',per:.03,col:'#6bd98a',d:'최대 체력 +3%'},c:{n:'쿨타임 감소',per:.01,col:'#7ac8ff',d:'스킬·대시 쿨타임 -1% (최대 40%)'}};
const perkOf=pf=>Object.assign({a:0,h:0,c:0,pts:0},pf&&pf.perks||{});
const dmgReduce=(def,lv)=>Math.min(.75,def/(def+60+lv*5));
const wReq=b=>Math.max(1,(wTier(b)-1)*5);
const wName=b=>{if(wTier(b)>9)return UNAMES[b]||UNAMES[wCls(b)];const c=wCls(b),t=wType(b),k=wTier(b)-1;return t&&WTYPES[c]?WPFX[k]+' '+WTYPES[c][t-1]:WNAMES[c][k]};
const weaponAtk=(b,enh)=>(UATK[b]||WATK[wTier(b)-1])*(1+enh*.10+Math.max(0,enh-10)*.06);
const WVALUE=[100,900,3500,12000,38000,110000,320000,900000,2400000,6000000];
const enhCost=(b,enh)=>Math.floor(80*Math.pow(1+enh,1.75)*(1+.5*wTier(b))*(ASLOT_W[aSlot(b)]!=null?.7:1));
const isArmorIt=it=>it.kind==='armor',isGear=it=>it.kind==='weapon'||it.kind==='armor',maxEnh=it=>it.kind==='armor'?15:20;
const ENH_RATE=[95,92,88,84,80,74,66,58,50,44,38,32,27,22,18,14,11,8,6,4];
/* base resale price by tier (30% of value, top tiers capped around 70-90k) */
const WSELL=[30,270,1050,3600,11400,33000,70000,80000,90000,90000],ASELL=[18,150,600,2100,6600,18000,51000,75000];
const sellValue=it=>it.kind==='armor'?Math.floor(ASELL[wTier(it.base)-1]*(1+it.enh*.35)):it.kind==='weapon'?Math.floor(WSELL[wTier(it.base)-1]*(1+it.enh*.35)*(1+(it.ench||[]).length*.5)):Math.floor((POTIONS[it.base]?POTIONS[it.base].price:0)*.25*it.qty);

const POTIONS={
  hp1:{name:'하급 체력 물약',kind:'hp',pct:.35,price:40,col:'#ff5a6a'},
  hp2:{name:'중급 체력 물약',kind:'hp',pct:.6,price:120,col:'#ff3a5a'},
  hp3:{name:'상급 체력 물약',kind:'hp',pct:1,price:320,col:'#ff2a4a'},
  spd:{name:'신속 물약',kind:'buff',price:150,col:'#5ee7ff',desc:'30초간 이동 속도 +40%'},
  atk:{name:'격분 물약',kind:'buff',price:200,col:'#ffa23a',desc:'30초간 공격력 +30%'},
  def:{name:'강철 물약',kind:'buff',price:200,col:'#9aa6c8',desc:'30초간 받는 피해 -30%'},
  tp:{name:'텔레포트의 서',kind:'tp',price:1000,col:'#c79bff',desc:'사용하면 지도가 열리고 누른 곳으로 순간이동합니다'},
  rr:{name:'룬의 복원서',kind:'restore',price:100000,col:'#7dffd0',desc:'사용해 무기를 고르면 그 무기의 룬이 사라지지 않고 가방으로 돌아옵니다'},
  wr:{name:'무기의 복원서',kind:'wrestore',price:150000,col:'#ffb86a',desc:'사용해 제작한 무기를 고르면 무기가 분해되고 제작 재료가 가방으로 돌아옵니다'}
};
/* crafting table: 5x5 shaped recipes (Minecraft style, the shape may sit anywhere it fits).
   To add one: add it here AND add the same id / ingredient totals to the server function rw_recipe */
const CRAFT_N=5;
const RECIPES=[
  {id:'omni_weapon',base:'sword_10',grade:'유니크',key:{C:'mat:core',R:'rune:all',F:'mat:m9',W:'mat:wood'},
   pattern:['.....','..C..','..R..','.FWF.','..W..']},
  {id:'omni_bow',base:'archer_10',grade:'유니크',key:{C:'mat:core',R:'rune:all',F:'mat:m9',W:'mat:wood'},
   pattern:['..FF.','.F.W.','.C.R.','.F.W.','..FF.']},
  {id:'omni_wand',base:'wand_10',grade:'유니크',key:{C:'mat:core',R:'rune:all',F:'mat:m9',W:'mat:wood',E:'mat:m3'},
   pattern:['..E..','..F..','..C..','..W..','..R..']},
  {id:'omni_spear',base:'lancer_10',grade:'유니크',key:{C:'mat:core',R:'rune:all',F:'mat:m9',W:'mat:wood',E:'mat:m3'},
   pattern:['..E..','.EFE.','.WCW.','..W..','..R..']},
  {id:'omni_gauntlet',base:'monk_10',grade:'유니크',key:{C:'mat:core',R:'rune:all',F:'mat:m9',E:'mat:m3'},
   pattern:['.....','.....','.C.C.','.F.F.','.ERE.']},
  {id:'omni_sheriff',base:'gunner_10',grade:'유니크',key:{C:'mat:core',R:'rune:all',F:'mat:m9',W:'mat:wood',E:'mat:m3',I:'mat:m7'},
   pattern:['.....','....C','ECRIF','...W.','...W.']},
  {id:'chromaice',base:'sword_10_3',grade:'유니크',key:{E:'mat:m3',R:'rune:all',V:'mat:m6',D:'rune:void'},
   pattern:['..E..','..R..','.VRV.','..D..','..D..']},
  /* 만물의 룬: the nine region runes, each grade II or higher (min). out = a non-weapon result */
  {id:'rune_all',out:'rune:all',min:2,grade:'룬',key:Object.fromEntries(REGION_RUNE.map((k,i)=>[String(i+1),'rune:'+k])),
   pattern:['.....','.123.','.456.','.789.','.....']}
];
/* the recipe a crafted weapon came from (undefined for every other item) */
const recipeOf=b=>RECIPES.find(r=>r.base===b);
const recipeCells=r=>{const o=[];for(const row of r.pattern)for(const ch of row)o.push(r.key[ch]||null);return o};
const recipeNeed=r=>{const o={};for(const k of recipeCells(r))if(k)o[k]=(o[k]||0)+1;return o};
/* shape of a grid without its empty border */
function gridShape(g){
  let x0=9,x1=-1,y0=9,y1=-1;
  g.forEach((v,i)=>{if(!v)return;const x=i%CRAFT_N,y=i/CRAFT_N|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)});
  if(x1<0)return'';const o=[];for(let y=y0;y<=y1;y++)o.push(g.slice(y*CRAFT_N+x0,y*CRAFT_N+x1+1).map(v=>v||'.').join(','));return o.join('/');
}
const craftMatch=g=>RECIPES.find(r=>gridShape(recipeCells(r))===gridShape(g))||null;
const matName=k=>{const[t,b]=k.split(':');return t==='rune'?(RUNES[b]?RUNES[b].name:b):(MATS[b]?MATS[b].name:b)};
const matCol=k=>{const[t,b]=k.split(':');const o=t==='rune'?RUNES[b]:MATS[b];return o?o.col:'#ccc'};

/* gathering materials (sold at the shop: weed 2G, wood 8G; reserved for future upgrade recipes) */
const MATS={
  /* monster drops (m1..m9 by region, core from elites). Prices must match rw_mat_price */
  m1:{name:'말랑한 점액',price:4,col:'#8dff6a',icon:'gem',mob:1,desc:'초원 몬스터의 전리품 · 개당 4G'},
  m2:{name:'낡은 뼛조각',price:8,col:'#d8d2b8',icon:'gem',mob:1,desc:'망자의 숲 몬스터의 전리품 · 개당 8G'},
  m3:{name:'식지 않는 불씨',price:14,col:'#ff6a2a',icon:'flame',mob:1,desc:'화염 황무지 몬스터의 전리품 · 개당 14G'},
  m4:{name:'수정 파편',price:22,col:'#6ee7ff',icon:'gem',mob:1,desc:'수정 협곡 몬스터의 전리품 · 개당 22G'},
  m5:{name:'뇌광 깃털',price:35,col:'#ffe24a',icon:'bolt',mob:1,desc:'뇌우 고원 몬스터의 전리품 · 개당 35G'},
  m6:{name:'공허의 잔재',price:50,col:'#c86bff',icon:'burst',mob:1,desc:'공허의 균열 몬스터의 전리품 · 개당 50G'},
  m7:{name:'서리 결정',price:70,col:'#bfeaff',icon:'gem',mob:1,desc:'얼어붙은 설원 몬스터의 전리품 · 개당 70G'},
  m8:{name:'고대 유물 조각',price:90,col:'#ffb85a',icon:'shield',mob:1,desc:'고대 사막 유적 몬스터의 전리품 · 개당 90G'},
  m9:{name:'천상의 깃',price:120,col:'#fff0b0',icon:'leaf',mob:1,desc:'천공의 성역 몬스터의 전리품 · 개당 120G'},
  core:{name:'정예의 핵',price:500,col:'#ff5ad1',icon:'star',mob:1,desc:'엘리트 몬스터가 가끔 남기는 핵 · 개당 500G'},
  weed:{name:'잡초',price:2,col:'#7fd35a',icon:'leaf',desc:'풀숲에서 벤 잡초 · 개당 2G · 강화 재료로도 쓰일 예정'},
  wood:{name:'목재',price:8,col:'#c8935a',icon:'log',desc:'벌목한 나무 · 개당 8G · 강화 재료로도 쓰일 예정'}
};
const GAT_MAX=20,gatLvOf=xp=>Math.min(GAT_MAX,1+Math.floor(Math.sqrt(Math.max(0,xp||0)/25))),gatNeed=lv=>25*lv*lv;
const gatSpeed=lv=>1+.1*(lv-1),gatDouble=lv=>.015*(lv-1);
const itemPrice=it=>it.kind==='rune'?runePrice(it.base,it.enh):isGear(it)?sellValue(it):it.kind==='mat'?(MATS[it.base]?MATS[it.base].price:0):Math.floor(POTIONS[it.base].price*.25);
const POTION_ORDER=['hp1','hp2','hp3','spd','atk','def'];
const ENCH={
  burn:{name:'화염',d:'공격 시 화상 (초당 공격력의 {v}%)',per:25,col:'#ff7a2a'},
  vamp:{name:'흡혈',d:'입힌 피해의 {v}% 회복',per:3,col:'#ff4d6d'},
  chain:{name:'번개',d:'{v}% 확률로 연쇄 번개',per:12,col:'#ffe27a'},
  explode:{name:'폭발',d:'{v}% 확률로 주변 폭발',per:10,col:'#ff9a3a'},
  aspd:{name:'가속',d:'공격 속도 +{v}%',per:6,col:'#6bffb0'},
  crit:{name:'치명',d:'치명타 확률 +{v}%',per:5,col:'#ffd24a'},
  pierce:{name:'관통',d:'관통 +{v} · 근접 범위 +{v2}%',per:1,col:'#9fc8ff'},
  armor:{name:'수호',d:'받는 피해 -{v}%',per:4,col:'#b0b8d8'}
};
/* runes: attach 1 to a weapon (socket). grade 1..3 (3 same -> next grade). 만물의 룬(all) is fused from the 9 region runes (REGION_RUNE); RUNE_KEYS are the 8 effects it carries */
const RUNES={
  fire:{name:'화염의 룬',col:'#ff7a2a',d:'화상 · 폭발'},ice:{name:'냉기의 룬',col:'#7fd8ff',d:'수호 · 가속'},thunder:{name:'번개의 룬',col:'#ffe27a',d:'연쇄 번개 · 가속'},
  dark:{name:'암흑의 룬',col:'#b07aff',d:'흡혈 · 치명'},holy:{name:'성광의 룬',col:'#fff1a8',d:'체력 · 재생'},
  meadow:{name:'초원의 룬',col:'#7fd35a',d:'가속 · 재생'},crystal:{name:'수정의 룬',col:'#6ee7ff',d:'치명 · 수호'},storm:{name:'폭풍의 룬',col:'#9aa8ff',d:'폭발 · 연쇄 번개'},
  forest:{name:'묘지의 룬',col:'#7fe0d0',d:'수호 · 흡혈'},ember:{name:'용암의 룬',col:'#ff5a1e',d:'화상 · 치명'},void:{name:'공허의 룬',col:'#c86bff',d:'치명 · 흡혈'},
  snow:{name:'설원의 룬',col:'#bfeaff',d:'수호 · 체력'},desert:{name:'사막의 룬',col:'#ffb85a',d:'화상 · 가속'},sky:{name:'천공의 룬',col:'#fff0b0',d:'연쇄 번개 · 체력 · 재생'},
  all:{name:'만물의 룬',col:'#ffd24a',d:'여러 룬 속성의 힘 ×2 · 아홉 지역 오라'}
};
const RUNE_KEYS=['fire','ice','thunder','dark','holy','meadow','crystal','storm'];
const RUNE_G=['','Ⅰ','Ⅱ','Ⅲ'];
const RUNE_POTION={fire:['atk',3],ice:['def',3],thunder:['spd',3],dark:['hp2',4],holy:['hp3',3],meadow:['hp1',8],crystal:['atk',2],storm:['spd',2],forest:['hp1',8],ember:['atk',3],void:['hp3',3],snow:['def',3],desert:['spd',3],sky:['hp3',4]};
const runePrice=(b,g)=>b==='all'?40000:400*Math.pow(3,Math.max(1,Math.min(3,g))-1);
function runeBase(k,g){
  g=Math.max(1,g|0);const o={en:{},hp:0,rg:0};const a=(e,v)=>{if(v>0)o.en[e]=(o.en[e]||0)+v};
  switch(k){
    case'fire':a('burn',g);a('explode',g-1);break;case'ice':a('armor',g);a('aspd',g-1);break;case'thunder':a('chain',g);a('aspd',g-1);break;
    case'dark':a('vamp',g);a('crit',g-1);break;case'holy':o.hp=.04*g;o.rg=.004*g;break;case'meadow':a('aspd',g);o.rg=.003*g;break;
    case'crystal':a('crit',g);a('armor',g-1);break;case'storm':a('explode',g);a('chain',g-1);break;
    case'forest':a('armor',g);a('vamp',g-1);break;case'ember':a('burn',g);a('crit',g-1);break;case'void':a('crit',g);a('vamp',g-1);break;
    case'snow':a('armor',g);o.hp=.02*g;break;case'desert':a('burn',g);a('aspd',g-1);break;case'sky':a('chain',g);o.hp=.02*g;o.rg=.002*g;break;
  }
  return o;
}
/* weapon.rune = 'kind:grade' -> {en,hp,rg,aura} (en keys = ENCH keys) */
function runeFx(s){
  if(!s)return null;const p=String(s).split(':'),k=p[0],g=Math.max(1,Math.min(3,+p[1]||1));
  if(k==='all'){const o={en:{},hp:0,rg:0,aura:true};for(const r of RUNE_KEYS){const q=runeBase(r,2);for(const e in q.en)o.en[e]=(o.en[e]||0)+q.en[e]*2;o.hp+=q.hp*2;o.rg+=q.rg*2}return o}
  if(!RUNES[k])return null;const o=runeBase(k,g);o.aura=false;return o;
}
const scaleFx=(o,k)=>{for(const e in o.en)o.en[e]*=k;o.hp*=k;o.rg*=k;return o};
/* rune effect of an equipped weapon, including the same-region bonus */
function weaponRuneFx(w){const o=w&&w.rune?runeFx(w.rune):null;return o&&runeMatch(w.base,w.rune)?scaleFx(o,RUNE_MATCH):o}
const xpBase=l=>30+7*l*l;
/* from Lv.25 a level costs 3x and keeps climbing (server: rw_xp_need) */
const xpNeed=l=>l<25?xpBase(l):Math.floor(xpBase(l)*(300+12*(l-25))/100);
/* NPC quests (server: rw_quest). story: 18 one-time chapters (hunt, then dungeon, per region); bounty / herb: 3 a day */
const QUEST_NPC={story:{who:'길드장 아론',title:'이야기 퀘스트',hi:'리프트가 열린 뒤로 길드는 늘 손이 모자라네. 자네가 맡아 주겠나?'},
  bounty:{who:'현상금꾼 카일',title:'현상금 의뢰',hi:'목에 값이 붙은 녀석들이 있어. 하루 세 건까지만 줄게.'},
  herb:{who:'약초꾼 미나',title:'채집 의뢰',hi:'재료가 다 떨어졌어요. 좀 도와주실래요?'}};
const QUEST_STORY=[['초원에 이상한 균열이 생겼네. 주변 몬스터부터 정리해 주게.','균열의 근원은 초원 동굴이야. 우두머리를 쓰러뜨리게.'],
  ['망자의 숲에서 죽은 자들이 일어서고 있네.','묘지 깊은 곳에서 그들을 깨우는 자가 있어.'],['황무지의 불길이 마을까지 번질 기세야.','용암 동굴의 불씨를 꺼야 하네.'],
  ['수정 협곡의 골렘들이 길을 막았네.','협곡 아래의 수정 심장을 부수게.'],['고원의 번개가 그치지 않아.','폭풍을 부르는 존재가 동굴에 있네.'],
  ['공허가 새어 나오고 있어. 조심하게.','공허의 중심으로 들어가야만 하네.'],['설원의 짐승들이 사나워졌네.','얼음 동굴의 주인을 잠재우게.'],
  ['사막의 유적이 다시 깨어났어.','왕릉의 주인을 다시 잠들게 하게.'],['마지막일세. 천공의 성역이 우리를 시험하고 있네.','천공 신전에서 모든 것을 끝내 주게.']];
const QUEST_ZLO=[1,8,16,26,40,60,70,78,88],QUEST_DGLV=[8,14,22,30,48,62,72,80,90],QUEST_GOLD=[500,1000,2000,3000,6000,10000,15000,20000,30000],QUEST_DAY=3;
/* the offer for a line: n = story chapter index, or quests already finished today */
function questDef(line,n,lv){
  if(line==='story'){
    if(n>=18)return null;
    const z=(n>>1)+1,boss=n%2===1,req=(boss?QUEST_DGLV:QUEST_ZLO)[z-1];
    return{k:boss?'dungeon':'zone',z,t:boss?1:25+z*5,p:0,g:QUEST_GOLD[z-1]*(boss?2:1),x:Math.floor(xpNeed(req)*(boss?.6:.3)),pot:boss?'tp':z<=2?'hp1':z<=4?'hp2':'hp3',pn:boss?2:5,req};
  }
  if(line==='bounty'){const zmax=QUEST_ZLO.filter(v=>v<=lv).length,e=n%2===1;
    return{k:e?'elite':'zone',z:e?0:zmax,t:e?3:40,p:0,g:400+lv*60,x:Math.floor((30+7*lv*lv)*.15),pot:'atk',pn:2}}
  const w=n%2===1;return{k:w?'wood':'weed',z:0,t:w?8:15,p:0,g:300+lv*40,x:Math.floor((30+7*lv*lv)*.1),pot:'def',pn:2};
}
function questText(q){
  if(q.k==='zone')return ZONES[q.z].name+'에서 몬스터 '+q.t+'마리 처치';
  if(q.k==='dungeon')return ZONES[q.z].name+' 던전 클리어';
  if(q.k==='elite')return '엘리트 몬스터 '+q.t+'마리 처치';
  return q.k==='wood'?'나무 '+q.t+'그루 베기':'잡초 '+q.t+'번 베기';
}
const questDone=c=>!!c&&c.p>=c.t;
/* which region's dungeon a rune comes from (its own region first); drop table: DGSRV */
function runeFrom(k){
  if(k==='all')return '제작대';
  const own=REGION_RUNE.includes(k)?[k]:[],ds=own.concat(REGION_RUNE.filter(d=>d!==k&&DGSRV[d][3].includes(k)));
  return ds.map(d=>ZONES[REGION_RUNE.indexOf(d)+1].name).join('·')+' 던전';
}
function runeDesc(k,g,mult){
  const o=runeFx(k+':'+g);if(!o)return '';const t=[];if(mult)scaleFx(o,mult);
  for(const e in o.en){const d=ENCH[e];if(d)t.push(d.name+' +'+(+(o.en[e]*d.per).toFixed(1))+(e==='pierce'?'':'%'))}
  if(o.hp)t.push('체력 +'+(+(o.hp*100).toFixed(1))+'%');if(o.rg)t.push('재생 +'+(o.rg*100).toFixed(1)+'%/s');
  return t.join(' · ');
}
const ZONES=[
  {id:0,name:'마을',r0:0,r1:19,lo:0,hi:0},
  {id:1,name:'초원',r0:19,r1:72,lo:1,hi:10,types:['slime','slime','bat','boar'],ground:0x56a044,alt:0x4a9340},
  {id:2,name:'망자의 숲',r0:72,r1:128,lo:8,hi:18,types:['skel','skel','archer','wraith'],ground:0x4a4f58,alt:0x3e4350},
  {id:3,name:'화염 황무지',r0:128,r1:186,lo:16,hi:28,types:['bomber','skel','archer','bat','hound','hound'],ground:0x5e4a44,alt:0x524038},
  {id:4,name:'수정 협곡',r0:186,r1:246,lo:26,hi:42,types:['golem','archer','bomber','spider','spider'],ground:0x585a86,alt:0x4a4c78},
  {id:5,name:'뇌우 고원',r0:246,r1:308,lo:40,hi:62,types:['golem','bomber','archer','bat','stormhawk','stormhawk'],ground:0x5a6678,alt:0x4a5668},
  {id:6,name:'공허의 균열',r0:308,r1:372,lo:60,hi:72,types:['golem','skel','archer','phantom','phantom','wraith'],ground:0x3a2a52,alt:0x2e2044},
  {id:7,name:'얼어붙은 설원',r0:372,r1:438,lo:70,hi:80,types:['yeti','frostwolf','frostwolf','icewitch'],ground:0xb8cce4,alt:0xa4bcd8},
  {id:8,name:'고대 사막 유적',r0:438,r1:506,lo:78,hi:89,types:['scorpion','scorpion','mummy','mummy','jackal'],ground:0xb8955a,alt:0xb48f55},
  {id:9,name:'천공의 성역',r0:506,r1:576,lo:88,hi:99,types:['sentinel','sentinel','seraph','stormhawk'],ground:0xc4c0d8,alt:0xb0acc8}
];
const WORLD_R=576;
/* day / night: one cycle = 16 min on the shared wall clock, night is phase [.55,.95) (same rule as the server) */
const DAYLEN=960;
const dayPhase=()=>((Date.now()/1000)%DAYLEN)/DAYLEN;
const isNight=()=>{const p=dayPhase();return p>=.55&&p<.95};
function nightK(p){p=p==null?dayPhase():p;const sm=x=>x*x*(3-2*x);if(p<.5)return 0;if(p<.6)return sm((p-.5)/.1);if(p<.9)return 1;if(p<1)return 1-sm((p-.9)/.1);return 0}
/* elite hunt: first 2.5 min of every 10 min */
function huntInfo(){const t=(Date.now()/1000)%600;return t<150?{on:true,left:150-t}:{on:false,next:600-t}}
/* dungeons: instanced arena far outside the world (x≈1000) */
const DGDEF={
  meadow:{name:'초원 던전',need:8,zid:1,ml:10,col:0x56a044,ring:0x9aff7a,fl:0x23301f,wl:0x2f3a2a,atmo:{bg:0x070d0a,sky:0x16241c,gr:0x0c140f,hi:.5,sun:.3,sc:0x9ab8a0,rc:0x6aff9a,ri:.35,fd:.017},mobs:['slime','bat','boar'],waves:[6,8,10,12],bn:'멧돼지 왕',hpM:26,dmgM:1.3,spd:4.2,sc:2.2,r:1.9,pa:2.4,pr:32,bits:4,at:'boar',model:()=>makeQuad({kind:'boar',body:0x8a3a2a,dk:0x4a2018,eye:0xffd24a,tusk:1,snout:0xc79a82}),
    pat:['slam','rush','nova','summon','rush'],adds:['slime','bat']},
  crystal:{name:'수정 던전',need:30,zid:4,ml:34,col:0x585a86,ring:0x7a9aff,fl:0x1c1c34,wl:0x2a2a4a,atmo:{bg:0x070716,sky:0x181838,gr:0x0c0c20,hi:.55,sun:.28,sc:0x8aa0ff,rc:0xb07aff,ri:.45,fd:.018},mobs:['golem','spider','archer','bomber'],waves:[6,8,10,12],bn:'수정 거인왕',hpM:30,dmgM:1.3,spd:3.2,sc:1.05,r:2.2,pa:.8,pr:204,bits:8,at:'golem',model:()=>makeGolem(),
    pat:['slam','quake','nova','summon','barrage'],adds:['spider','spider']},
  storm:{name:'폭풍 던전',need:48,zid:5,ml:54,col:0x5a6678,ring:0xffe27a,fl:0x1e232c,wl:0x30384a,atmo:{bg:0x080b12,sky:0x18202e,gr:0x0c1118,hi:.5,sun:.28,sc:0xa0b8e0,rc:0xffe27a,ri:.5,fd:.017},mobs:['stormhawk','golem','bomber','archer'],waves:[6,8,10,12],bn:'폭풍매 군주',hpM:36,dmgM:1.35,spd:4.4,sc:2.6,r:1.8,pa:3.9,pr:268,bits:16,at:'stormhawk',model:()=>makeStormhawk(),fly:2.4,keep:10,
    pat:['bolts','nova','barrage','slam','summon'],adds:['stormhawk','stormhawk']},
  forest:{name:'망자의 묘지 던전',need:14,zid:2,ml:17,col:0x4a4f58,ring:0x7fe0d0,rock:0x4a4e56,fl:0x1e2226,wl:0x2a3036,atmo:{bg:0x060a0c,sky:0x141e22,gr:0x0a1012,hi:.52,sun:.28,sc:0x90b0c0,rc:0x7fe0d0,ri:.38,fd:.018},mobs:['skel','archer','wraith','skel'],waves:[6,8,10,12],bn:'해골 대왕',hpM:28,dmgM:1.3,spd:3.8,sc:2.7,r:1.8,pa:5.5,pr:100,bits:32,at:'skel',model:()=>makeSkeleton(false),
    pat:['slam','summon','nova','rush','barrage'],adds:['skel','skel']},
  ember:{name:'용암 던전',need:22,zid:3,ml:26,col:0x5e4a44,ring:0xff6a2a,rock:0x4a2e28,fl:0x2a1a16,wl:0x38241e,atmo:{bg:0x100604,sky:0x2a1410,gr:0x180a06,hi:.5,sun:.28,sc:0xd89a80,rc:0xff6a2a,ri:.5,fd:.017},mobs:['hound','bomber','archer','skel'],waves:[6,8,10,12],bn:'지옥견 우두머리',hpM:30,dmgM:1.3,spd:4.6,sc:2.4,r:2,pa:3.3,pr:156,bits:64,at:'hound',model:()=>makeQuad({kind:'hound',body:0x5a2420,dk:0x2a0e0c,eye:0xffd24a,ears:1,flame:0xff6a2a,snout:0x6a3a34,len:1.6}),
    pat:['rush','slam','barrage','nova','summon'],adds:['hound','hound']},
  void:{name:'공허 던전',need:62,zid:6,ml:68,col:0x3a2a52,ring:0xc86bff,rock:0x2e2044,fl:0x161024,wl:0x221838,atmo:{bg:0x07030f,sky:0x1a0e30,gr:0x0c0618,hi:.55,sun:.26,sc:0xa890e0,rc:0xc86bff,ri:.5,fd:.017},mobs:['phantom','wraith','golem','archer'],waves:[6,8,10,12],bn:'공허의 군주',hpM:38,dmgM:1.35,spd:4.6,sc:2.6,r:1.7,pa:.3,pr:340,bits:128,at:'phantom',model:()=>makePhantom(),
    pat:['nova','quake','bolts','rush','summon'],adds:['phantom','wraith']},
  snow:{name:'얼음 동굴 던전',need:72,zid:7,ml:77,col:0xb8cce4,ring:0xbfeaff,rock:0x9ab4cc,fl:0x40546a,wl:0x4e6880,atmo:{bg:0x0a121c,sky:0x203248,gr:0x101a28,hi:.52,sun:.26,sc:0xa8c8e8,rc:0x9fe0ff,ri:.4,fd:.017},mobs:['frostwolf','yeti','icewitch','frostwolf'],waves:[6,8,10,12],bn:'설원의 폭군',hpM:40,dmgM:1.35,spd:3.6,sc:2,r:2.2,pa:2,pr:404,bits:256,at:'yeti',model:()=>makeYeti(),
    pat:['slam','quake','nova','barrage','summon'],adds:['frostwolf','frostwolf']},
  desert:{name:'왕릉 던전',need:80,zid:8,ml:85,col:0xb8955a,ring:0xffb85a,rock:0xa8854e,fl:0x3a2c1a,wl:0x54402a,atmo:{bg:0x100b05,sky:0x2e2212,gr:0x181008,hi:.52,sun:.3,sc:0xe0c090,rc:0xffb85a,ri:.42,fd:.016},mobs:['scorpion','mummy','jackal','mummy'],waves:[6,8,10,12],bn:'전갈 여왕',hpM:42,dmgM:1.4,spd:4,sc:2.5,r:2.2,pa:5.9,pr:470,bits:512,at:'scorpion',model:()=>makeScorpion(),
    pat:['rush','barrage','quake','summon','slam'],adds:['scorpion','jackal']},
  sky:{name:'천공 신전 던전',need:90,zid:9,ml:95,col:0xc4c0d8,ring:0xfff0b0,rock:0xc8c2da,fl:0x34324a,wl:0x4a4666,atmo:{bg:0x0c0a18,sky:0x2a2648,gr:0x141226,hi:.55,sun:.3,sc:0xe0d8ff,rc:0xffe8a0,ri:.45,fd:.015},mobs:['sentinel','seraph','stormhawk','sentinel'],per:2,waves:[2,2,2,2],elite:{hp:6,dm:.8},hit:.55,meteor:{d:5000,r:3.8,w:1.8,first:10,every:[16,10],n:[3,6]},hpFix:[1000000,2000000],judge:{d:5000,r:4.5,w:3,w2:2.3,first:22,every:[26,20]},p2:{at:2/3,cdm:.8,pat:['slam','bolts','rush','quake','nova','barrage','summon']},cdm:.75,addCap:3,bn:'타락 대천사',hpM:100,dmgM:1.7,spd:4.2,sc:2.1,r:1.8,pa:.9,pr:538,bits:1024,at:'seraph',model:()=>makeSeraph(),fly:.7,keep:8,
    pat:['bolts','slam','nova','quake','rush','barrage','summon'],adds:['seraph','sentinel']}
};
const DGK=Object.keys(DGDEF).sort((a,b)=>DGDEF[a].need-DGDEF[b].need);
const DG={on:false,id:null,cx:1000,cz:0,R:34,atmo:null,shapes:null,lamp:null,zone:null,ph:'idle',t:0,wave:0,wn:0,pt:0,dmg:{},deaths:0,maxDeaths:3,leader:null,boss:null,res:null,st:null,lastSt:0,arena:null,mkBk:'meadow'};
function zoneAt(x,z){if(DG.on&&x>600)return DG.zone;const d=Math.hypot(x,z);for(let i=ZONES.length-1;i>=0;i--)if(d>=ZONES[i].r0)return ZONES[i];return ZONES[0]}
function mobLevel(x,z){const zn=zoneAt(x,z);if(!zn.id)return 0;const k=clamp((Math.hypot(x,z)-zn.r0)/(zn.r1-zn.r0),0,1);return Math.max(zn.lo,Math.min(zn.hi,Math.round(zn.lo+k*(zn.hi-zn.lo)+rnd(-1,1))))}
const mobHp=ml=>Math.round(30+ml*ml*1.6);
const mobDmg=ml=>6+ml*2.2;

/* ---------------- svg icons ---------------- */
const ICONS={
  leaf:'<path d="M20 3C10 3 4 8 4 15c0 2 .8 3.600 2 4.600C6.600 14.500 10 10.500 15 8.500c-4 3-6.500 6.500-7.500 11C9 20.200 10.500 20.500 12 20.500c6 0 8-7.500 8-17.500z"/>',
  log:'<path d="M3 9c0-2 4-3.500 9-3.500s9 1.500 9 3.500v7c0 2-4 3.500-9 3.500S3 18 3 16V9zm9-1.600c-3.800 0-6.400.8-6.400 1.600s2.600 1.600 6.400 1.600 6.400-.8 6.400-1.600S15.800 7.400 12 7.400z"/>',
  sword:'<path d="M14.5 3.5l6 .1.1 6-9.8 9.8-2.4-2.4L14.5 3.5zM7 14l3 3-2.2 2.2-1.6-.5-2.4 2.3-1-1 2.3-2.4-.5-1.6L7 14z"/>',
  staff:'<path d="M16 2a4 4 0 013 6.6l-1.6 1.6-3.2-3.2L13.8 5.4A4 4 0 0116 2zM11.6 8.4l4 4L5.4 22.6 1.4 18.6 11.6 8.4z"/>',
  bow:'<path d="M5 2c9 2 15 8 17 17-1 .3-2 .6-3 .8C16 12 12 8 4.2 5.2 4.5 4.2 4.7 3.1 5 2zm-1 5.2l12.8 12.8-1.4 1.4L2.6 8.6 4 7.2z"/>',
  potion:'<path d="M9 2h6v2h-1v4.4l4.6 8A3 3 0 0116 21H8a3 3 0 01-2.6-4.6L10 8.4V4H9V2zm-.8 12l-1.1 1.9A1 1 0 008 17.4h8a1 1 0 00.9-1.5L15.8 14H8.2z"/>',
  coin:'<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14zm-1 3v1.2c-1.2.3-2 1.1-2 2.2 0 1.5 1.2 2 2.6 2.3 1 .3 1.3.5 1.3.9s-.5.7-1.2.7c-.8 0-1.4-.3-1.6-.9l-1.4.6c.4 1 1.3 1.6 2.3 1.8V18h1.4v-1.2c1.3-.3 2.1-1.1 2.1-2.3 0-1.4-1.1-2-2.5-2.3-1.1-.3-1.4-.5-1.4-.9s.4-.6 1-.6c.6 0 1.1.2 1.3.7l1.4-.6c-.3-.8-1-1.3-1.9-1.5V8H11z"/>',
  shield:'<path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z"/>',
  bag:'<path d="M8 6V5a4 4 0 118 0v1h3l1 15H4L5 6h3zm2 0h4V5a2 2 0 10-4 0v1z"/>',
  anvil:'<path d="M3 5h13c0 2.5 2 4 5 4-1 2.5-3 3.500-5 3.500H14l1 3h2v4H7v-4h2l1-3H8c-3 0-5-2-5-5V5z"/>',
  scale:'<path d="M11 2h2v3.1l6 1.4v2l3 6.500c-.5 1.800-2.300 3-4 3s-3.500-1.200-4-3l3-6.500-3-.7V19h4v2H7v-2h4V7.800l-3 .7 3 6.500c-.5 1.800-2.300 3-4 3s-3.500-1.200-4-3l3-6.500v-2L11 5.100V2z"/>',
  star:'<path d="M12 2l2.900 6.300 6.800.7-5.100 4.600 1.500 6.800L12 17l-6.100 3.400 1.500-6.800L2.300 9l6.800-.7L12 2z"/>',
  people:'<path d="M9 11a4 4 0 100-8 4 4 0 000 8zm8 1a3 3 0 100-6 3 3 0 000 6zM1 20c0-3.900 3.600-6 8-6s8 2.100 8 6v1H1v-1zm17.500-5.500c2.800.4 4.500 2 4.500 4.500V21h-4v-1c0-1.800-.5-3.500-1.800-4.800.4-.4.900-.6 1.300-.7z"/>',
  chat:'<path d="M3 4h18v13H9l-5 4v-4H3V4z"/>',
  gear:'<path d="M10.500 2h3l.5 2.500 1.800.8 2.200-1.400 2.100 2.100-1.400 2.200.8 1.800 2.500.5v3l-2.500.5-.8 1.800 1.400 2.200-2.100 2.100-2.200-1.400-1.800.8-.5 2.500h-3l-.5-2.500-1.800-.8-2.200 1.400-2.100-2.100 1.400-2.200-.8-1.800L2 13.500v-3l2.500-.5.8-1.800-1.400-2.200 2.100-2.100 2.200 1.400 1.800-.8.500-2.500zM12 9a3 3 0 100 6 3 3 0 000-6z"/>',
  dash:'<path d="M3 6h9l-2 3H3V6zm0 5h13l-2 3H3v-3zm0 5h9l-2 3H3v-3zm14-12l5 7-5 7V4z"/>',
  bolt:'<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
  flame:'<path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-2 1-3.500 2-4.500 0 1.500.5 2.500 1.500 3C9 8 11 6 12 2z"/>',
  snow:'<path d="M11 2h2v5.600l3.500-2 1 1.700L14 9.300l2.500 1.500-1 1.700L12 10.500l-3.500 2-1-1.700L10 9.300 7.500 7.300l1-1.700L11 7.600V2zm0 20v-5.600l-3.500 2-1-1.700L10 14.700 7.500 13.200l1-1.700L12 13.500l3.500-2 1 1.700-2.500 1.500 2.500 1.500-1 1.700-3.500-2V22h-2z"/>',
  heart:'<path d="M12 21C5 15.500 2 12 2 8.500A4.500 4.500 0 016.500 4c2 0 3.700 1 5.500 3 1.800-2 3.500-3 5.500-3A4.500 4.500 0 0122 8.500c0 3.500-3 7-10 12.500z"/>',
  menu:'<path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/>',
  close:'<path d="M5 3.600L12 10.600 19 3.600 20.400 5 13.400 12l7 7-1.400 1.400-7-7-7 7L3.600 19l7-7-7-7L5 3.600z"/>',
  swap:'<path d="M4 7h13V3l5 5-5 5V9H4V7zm16 8v2H7v4l-5-5 5-5v4h13z"/>',
  arrowup:'<path d="M12 3l8 9h-5v9H9v-9H4l8-9z"/>',
  burst:'<path d="M12 1l2.2 6.3L20 4l-3.3 5.8L23 12l-6.3 2.2L20 20l-5.8-3.3L12 23l-2.2-6.3L4 20l3.3-5.8L1 12l6.3-2.2L4 4l5.8 3.3z"/>',
  rain:'<path d="M4 2h2v9h2.5L5 17 1.5 11H4V2zm7 5h2v9h2.5L12 22l-3.5-6H11V7zm7-5h2v9h2.5L19 17l-3.5-6H18V2z"/>',
  helm:'<path d="M12 3C7 3 4 7 4 12v3h3v-2h10v2h3v-3c0-5-3-9-8-9zm-2 7h4v2h-4v-2z"/>',
  body:'<path d="M8 3L3 6l2 4 2-1v11h10V9l2 1 2-4-5-3c-.5 1.500-1.800 2.500-4 2.500S8.500 4.500 8 3z"/>',
  gloves:'<path d="M7 4h2v5h1V3h2v6h1V4h2v6h1V6h2v9c0 3-2 6-6 6h-1c-3 0-5-2-5-5V4z"/>',
  boots:'<path d="M8 3h6v8l5 3c1 .6 1.500 1.500 1.500 3v2H5v-3c0-1 .3-1.800 1-2.500L8 11V3z"/>',
  spear:'<path d="M3 20.5L16.5 7l-1.500-1.500L17 2l5 5-3.500 1.500L17 7 3.500 22 3 20.500z"/>',
  fist:'<path d="M6 9a3 3 0 013-3h7a3 3 0 013 3v6a5 5 0 01-5 5h-3a5 5 0 01-5-5V9zm3 0v3h8V9H9zm0 5v1h8v-1H9z"/>',
  gun:'<path d="M2 7h16l4 3v3h-8l-1.500 7H8.500l1-7H2V7z"/>',
  volley:'<path d="M2 11h14v2H2zM16 8l6 4-6 4zM3 5l12 3-.5 2L2.5 7zm0 14l12-3-.5-2L2.5 17z"/>',
  gem:'<path d="M7 3h10l5 6-10 13L2 9l5-6zm1.200 2L5 9h14l-3.200-4H8.200zM5.500 11l6.500 8.500L18.500 11h-13z"/>'
};
const SKICON={nova:'burst',buff:'shield',ground:'flame',rain:'rain',volley:'volley',dash:'dash',chain:'bolt'};
const hex6=n=>'#'+('000000'+(n>>>0).toString(16)).slice(-6);
function skIcon(sk,sz){return ic(sk.icon||SKICON[sk.type]||'star',hex6(sk.col||0xffffff),sz||30)}
function ico(svg,col){return '<span class="ico" style="--tc:'+col+'">'+svg+'</span>'}
function ic(n,col,sz){return '<svg class="ic" viewBox="0 0 24 24" width="'+(sz||18)+'" height="'+(sz||18)+'" fill="'+(col||'currentColor')+'">'+(ICONS[n]||'')+'</svg>'}
function itemIcon(it){
  if(it.kind==='rune'){const r=RUNES[it.base],c=r?r.col:'#fff';return ico(ic('gem',c,26),c)}
  if(it.kind==='mat'){const m=MATS[it.base],c=m?m.col:'#fff';return ico(ic(m?m.icon:'leaf',c,26),c)}
  if(it.kind==='potion'){const p=POTIONS[it.base],c=p?p.col:'#fff';return ico(ic('potion',c,26),c)}
  const c=TIER_COL[wTier(it.base)-1];if(it.kind==='armor')return ico(ic(aSlot(it.base),c,26),c);return ico(ic(WICON[wCls(it.base)],c,26),c);
}
function itemName(it){
  if(it.kind==='rune'){const r=RUNES[it.base];return (r?r.name:it.base)+(it.base==='all'?'':' '+(RUNE_G[it.enh]||''))}
  if(it.kind==='mat'){const m=MATS[it.base];return m?m.name:it.base}
  if(it.kind==='potion'){const p=POTIONS[it.base];return p?p.name:it.base}
  return (it.kind==='armor'?armorName(it.base):wName(it.base))+(it.enh>0?' +'+it.enh:'');
}
function enchText(e){const d=ENCH[e.k];if(!d)return e.k;return d.name+' '+'I'.repeat(e.l)}
function enchDesc(k,l){const d=ENCH[k];return d.d.replace('{v}',d.per*l).replace('{v2}',10*l)}
const ERR_KO={NO_MAT:'재료가 부족합니다.',QUEST_ACTIVE:'이미 진행 중인 퀘스트입니다.',QUEST_LIMIT:'오늘 받을 수 있는 의뢰를 모두 마쳤습니다.',QUEST_DONE:'모든 이야기를 끝냈습니다.',SEMI_NO_ASSASSIN:'이 계정은 암살자를 선택할 수 없습니다.',SEMI_LOCKED:'세미 개발자 계정은 아이템을 얻거나 거래·변경할 수 없습니다.',NO_RUNE:'룬이 부족합니다.',LOW_LEVEL:'레벨이 부족해 입장할 수 없습니다.',TOO_FAST:'너무 빨리 끝났습니다. 보상이 지급되지 않았습니다.',NO_RUN:'진행 중인 던전 기록이 없습니다.',LIMIT:'오늘 던전 보상 한도에 도달했습니다.',NO_POINTS:'사용할 수 있는 포인트가 없습니다.',ALREADY:'이미 받았습니다.',NOT_READY:'아직 받을 수 없습니다.',BAD_AUTH:'로그인이 만료되었습니다. 다시 로그인해주세요.',BAD_LOGIN:'이름 또는 비밀번호가 틀렸습니다.',LOCKED:'로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',BAD_NAME:'이름은 한글·영문·숫자 2~10자만 가능합니다.',BAD_PASS:'비밀번호는 4자 이상이어야 합니다.',NAME_TAKEN:'이미 사용 중인 이름입니다.',BAD_CLASS:'직업을 선택해주세요.',NO_GOLD:'골드가 부족합니다.',NOT_SOLD:'판매하지 않는 물품입니다.',BAD_ITEM:'사용할 수 없는 아이템입니다.',WRONG_CLASS:'다른 직업의 무기입니다.',LOW_LEVEL:'레벨이 부족합니다.',NO_POTION:'물약이 없습니다.',MAX_ENH:'더 이상 강화할 수 없습니다.',SLOTS_FULL:'인첸트 슬롯이 가득 찼습니다.',MAX_ENCH:'최대 단계입니다.',BAD_SLOT:'잘못된 슬롯입니다.',BAD_JOB:'전직할 수 없는 직업입니다.',BAD_PRICE:'가격이 올바르지 않습니다.',TOO_MANY:'더 이상 등록할 수 없습니다.',SOLD_OUT:'이미 판매되었거나 취소된 물품입니다.',OWN_LISTING:'내 물품은 구매할 수 없습니다.',BAD_LISTING:'등록 정보를 찾을 수 없습니다.',BAD_TARGET:'거래 상대를 찾을 수 없습니다.',ALREADY_TRADING:'이미 거래 중입니다.',BAD_TRADE:'거래가 종료되었습니다.',TRADE_INVALID:'거래 조건이 변경되어 취소되었습니다.',BAD_ARGS:'잘못된 요청입니다.',NET:'서버에 연결할 수 없습니다.',DELETED:'삭제된 계정입니다.',NOT_ADMIN:'권한이 없습니다.',BAD_OLD_PASS:'현재 비밀번호가 틀렸습니다.',BAD_NEW_PASS:'새 비밀번호는 8~40자이고 현재 비밀번호와 달라야 합니다.'};
const errKo=m=>{m=String(m||'');for(const k in ERR_KO)if(m.indexOf(k)>=0)return ERR_KO[k];return '요청에 실패했습니다.'};
