/* ---------------- game data ---------------- */
const CLS={
  warrior:{name:'전사',hp:150,hpLv:14,atk:5,atkLv:2.1,aps:2.2,spd:6.8,crit:.05,range:3.4,col:0x2f56c8,
    q:{id:'w_q',name:'회전 베기',type:'nova',cd:7,rad:4.9,dmg:2.4,kb:14,col:0xffd24a},
    e:{id:'w_e',name:'방어 태세',type:'buff',cd:14,dur:5,shield:.35,spd:1.25,col:0x6aa8ff}},
  mage:{name:'마법사',hp:100,hpLv:9,atk:6,atkLv:2.4,aps:1.9,spd:6.6,crit:.08,range:0,col:0x6a3fc8,
    q:{id:'m_q',name:'메테오',type:'ground',cd:9,rad:4.2,dmg:4.2,delay:.8,range:15,col:0xffa23a,burn:1},
    e:{id:'m_e',name:'서리 파동',type:'nova',cd:11,rad:8,dmg:1.6,kb:8,freeze:2.4,col:0x9fe8ff}},
  archer:{name:'궁수',hp:112,hpLv:10,atk:4,atkLv:2.0,aps:3.2,spd:7.6,crit:.14,range:0,col:0x2f7a4a,
    q:{id:'a_q',name:'화살비',type:'rain',cd:10,rad:4.8,dmg:1.15,dur:1.8,range:14,col:0x6bffb0},
    e:{id:'a_e',name:'후퇴 사격',type:'volley',cd:7,n:5,spread:.2,dmg:1.5,pierce:3,back:1,col:0x6bffb0}}
};
const CLASSES=['warrior','mage','archer','rogue','cleric','lancer','monk','gunner','summoner','darknight'];
Object.assign(CLS.warrior,{blurb:'단단한 근접 전사. 균형 잡힌 입문 직업',sty:{t:'melee',range:3.4,arc:2.15,big:2.8,bigMul:1.7,col:0xbfe4ff,bigCol:0xffd24a,lunge:5,kb:6,kbBig:11}});
Object.assign(CLS.mage,{blurb:'강력한 마법 폭격. 체력은 낮습니다',sty:{t:'proj',kind:'orb',spd:25,r:.55,life:1.3,splash:2.3,col:0x5ee7ff}});
Object.assign(CLS.archer,{blurb:'멀리서 빠르게 쏘는 원거리 딜러',sty:{t:'proj',kind:'arrow',spd:46,r:.4,life:.85,pierce:1,col:0x6bffb0}});
Object.assign(CLS,{
  rogue:{name:'도적',blurb:'치명타와 기동성. 빠른 단검 연타',hp:100,hpLv:9.5,atk:4.4,atkLv:2.1,aps:3.3,spd:8.0,crit:.2,range:2.5,col:0x7a3f9a,
    sty:{t:'melee',range:2.5,arc:1.9,big:2.6,bigMul:1.5,col:0xd0b0ff,bigCol:0xff6bd6,lunge:7,kb:3,kbBig:6},
    q:{id:'r_q',name:'연막탄',type:'nova',cd:8,rad:5,dmg:1.7,kb:6,freeze:1.2,col:0xb08aff},
    e:{id:'r_e',name:'그림자 걸음',type:'buff',cd:12,dur:5,aps:1.35,spd:1.4,col:0xa07aff}},
  cleric:{name:'성직자',blurb:'성스러운 빛으로 싸우고 스스로 치유',hp:140,hpLv:12,atk:4.6,atkLv:2.0,aps:2.0,spd:6.6,crit:.06,range:0,col:0xe8d27a,
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
  gunner:{name:'총잡이',blurb:'총알 세례. 빠른 연사와 폭탄',hp:105,hpLv:9.5,atk:4.2,atkLv:2.0,aps:3.6,spd:7.4,crit:.12,range:0,col:0x4a8aa0,
    sty:{t:'proj',kind:'arrow',spd:60,r:.3,life:.6,pierce:1,col:0xffe27a},
    q:{id:'g_q',name:'난사',type:'volley',cd:8,n:9,spread:.1,dmg:.9,pierce:2,speed:50,col:0xffd24a},
    e:{id:'g_e',name:'집속 폭탄',type:'ground',cd:11,rad:4.6,dmg:3.2,delay:.6,range:13,burn:1,col:0xff8a3a}},
  summoner:{name:'소환사',blurb:'정령을 불러 넓은 범위를 폭격',hp:108,hpLv:9.5,atk:5.5,atkLv:2.3,aps:1.8,spd:6.6,crit:.07,range:0,col:0x3aa08a,
    sty:{t:'proj',kind:'orb',spd:20,r:.6,life:1.5,splash:2.6,col:0x6bffd0},
    q:{id:'s_q',name:'정령 폭발',type:'ground',cd:9,rad:4.6,dmg:3.6,delay:.7,range:14,col:0x6bffd0},
    e:{id:'s_e',name:'정령 소나기',type:'rain',cd:12,rad:4.5,dmg:1.0,dur:2.2,range:12,col:0x9fffe8}},
  darknight:{name:'암흑기사',blurb:'어둠의 대검. 피를 흡수하며 싸움',hp:155,hpLv:14,atk:5.3,atkLv:2.1,aps:2.1,spd:6.7,crit:.07,range:3.6,col:0x4a2a6a,
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
  warrior:['낡은 검','철제 장검','강철 검','룬 검','미스릴 대검','용아검','폭풍의 대검','영겁의 검'],
  mage:['나무 지팡이','수정 지팡이','마력의 지팡이','룬 스태프','현자의 스태프','용혼 스태프','별의 지팡이','세계수 스태프'],
  archer:['단궁','사냥용 활','장궁','룬 활','미스릴 활','용골 활','폭풍의 활','바람의 신궁'],
  rogue:['녹슨 단검','철 단검','쌍날 단검','그림자 단검','암살자의 칼날','용아 단도','폭풍의 단검','영겁의 암영'],
  cleric:['나무 곤봉','철제 철퇴','성직자의 메이스','룬 철퇴','성자의 홀','용혼 철퇴','별빛의 홀','천상의 홀'],
  lancer:['낡은 창','철제 장창','강철 장창','룬 창','미스릴 장창','용아창','폭풍의 장창','영겁의 창'],
  monk:['붕대 장갑','가죽 권갑','강철 권갑','룬 권갑','미스릴 권갑','용린 권갑','폭풍의 권갑','영겁의 권갑'],
  gunner:['낡은 권총','철제 권총','강철 리볼버','룬 리볼버','미스릴 쌍총','용골 총','폭풍의 총','영겁의 총'],
  summoner:['낡은 토템','나무 토템','정령의 토템','룬 토템','현자의 토템','용혼 토템','별의 토템','세계수 토템'],
  darknight:['녹슨 대검','어둠의 검','흑철 대검','룬 대검','암흑 대검','용아 대검','폭풍의 대검','영겁의 대검']
};
const WICON={warrior:'sword',mage:'staff',archer:'bow',rogue:'sword',cleric:'staff',lancer:'spear',monk:'fist',gunner:'gun',summoner:'staff',darknight:'sword'};
const WATK=[10,22,40,70,115,180,280,420];
const TIER_COL=['#9aa0a8','#e8e8e8','#5fd26a','#4aa8ff','#b86bff','#ff9a3a','#ff5a5a','#ffd24a'];
const TIER_HEX=[0x9aa0a8,0xe8e8e8,0x5fd26a,0x4aa8ff,0xb86bff,0xff9a3a,0xff5a5a,0xffd24a];
const wTier=b=>+(String(b).split('_')[1]||1);
const wCls=b=>String(b).split('_')[0];
const wType=b=>{const p=String(b).split('_')[2];return p&&/^\d$/.test(p)?+p:0};
/* weapon kinds: every class has 3 (balanced / heavy / swift), same tier ladder */
const WPFX=['낡은','철제','강철','룬','미스릴','용아','폭풍의','영겁의'];
const WTYPES={warrior:['대검','쌍검'],mage:['마도서','완드'],archer:['석궁','속사궁'],rogue:['쌍낫','표창'],cleric:['전투 철퇴','성배'],lancer:['미늘창','단창'],monk:['건틀릿','발톱'],gunner:['산탄총','쌍권총'],summoner:['정령서','인형'],darknight:['참마도','단도']};
const WTMOD=[{n:'균형형',d:'균형 잡힌 기본형',atk:1,aps:1,crit:0},{n:'강타형',d:'공격력 +15%, 공격 속도 -12%',atk:1.15,aps:.88,crit:0},{n:'속공형',d:'공격력 -10%, 공격 속도 +15%, 치명타 +4%',atk:.9,aps:1.15,crit:.04}];
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
const dmgReduce=(def,lv)=>Math.min(.75,def/(def+60+lv*5));
const wReq=b=>Math.max(1,(wTier(b)-1)*5);
const wName=b=>{const c=wCls(b),t=wType(b),k=wTier(b)-1;return t&&WTYPES[c]?WPFX[k]+' '+WTYPES[c][t-1]:WNAMES[c][k]};
const weaponAtk=(b,enh)=>WATK[wTier(b)-1]*(1+enh*.10+Math.max(0,enh-10)*.06);
const WVALUE=[100,900,3500,12000,38000,110000,320000,900000];
const enhCost=(b,enh)=>Math.floor(80*Math.pow(1+enh,1.75)*(1+.5*wTier(b))*(ASLOT_W[aSlot(b)]!=null?.7:1));
const isArmorIt=it=>it.kind==='armor',isGear=it=>it.kind==='weapon'||it.kind==='armor',maxEnh=it=>it.kind==='armor'?15:20;
const ENH_RATE=[95,92,88,84,80,74,66,58,50,44,38,32,27,22,18,14,11,8,6,4];
const sellValue=it=>it.kind==='armor'?Math.floor(AVALUE[wTier(it.base)-1]*.3*(1+it.enh*.35)):it.kind==='weapon'?Math.floor(WVALUE[wTier(it.base)-1]*.3*(1+it.enh*.35)*(1+(it.ench||[]).length*.5)):Math.floor((POTIONS[it.base]?POTIONS[it.base].price:0)*.25*it.qty);

const POTIONS={
  hp1:{name:'하급 체력 물약',kind:'hp',pct:.35,price:40,col:'#ff5a6a'},
  hp2:{name:'중급 체력 물약',kind:'hp',pct:.6,price:120,col:'#ff3a5a'},
  hp3:{name:'상급 체력 물약',kind:'hp',pct:1,price:320,col:'#ff2a4a'},
  spd:{name:'신속 물약',kind:'buff',price:150,col:'#5ee7ff',desc:'30초간 이동 속도 +40%'},
  atk:{name:'격분 물약',kind:'buff',price:200,col:'#ffa23a',desc:'30초간 공격력 +30%'},
  def:{name:'강철 물약',kind:'buff',price:200,col:'#9aa6c8',desc:'30초간 받는 피해 -30%'}
};
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
const ZONES=[
  {id:0,name:'마을',r0:0,r1:19,lo:0,hi:0},
  {id:1,name:'초원',r0:19,r1:72,lo:1,hi:10,types:['slime','slime','bat'],ground:0x5fa84a,alt:0x4f9a40},
  {id:2,name:'망자의 숲',r0:72,r1:128,lo:8,hi:18,types:['skel','skel','archer'],ground:0x4a4f58,alt:0x3e4350},
  {id:3,name:'화염 황무지',r0:128,r1:186,lo:16,hi:28,types:['bomber','skel','archer','bat'],ground:0x7a4a38,alt:0x6a3c30},
  {id:4,name:'수정 협곡',r0:186,r1:246,lo:26,hi:42,types:['golem','archer','bomber'],ground:0x4a4a8a,alt:0x3a3a78},
  {id:5,name:'뇌우 고원',r0:246,r1:308,lo:40,hi:62,types:['golem','bomber','archer','bat'],ground:0x5a6678,alt:0x4a5668},
  {id:6,name:'공허의 균열',r0:308,r1:372,lo:60,hi:72,types:['golem','skel','archer','bomber'],ground:0x3a2a52,alt:0x2e2044},
  {id:7,name:'얼어붙은 설원',r0:372,r1:438,lo:70,hi:80,types:['skel','golem','archer','bat'],ground:0xcfe0ee,alt:0xb4cbe0},
  {id:8,name:'고대 사막 유적',r0:438,r1:506,lo:78,hi:89,types:['golem','bomber','archer','skel'],ground:0xc8a468,alt:0xb48f55},
  {id:9,name:'천공의 성역',r0:506,r1:576,lo:88,hi:99,types:['golem','archer','bomber','bat'],ground:0xd8d4e8,alt:0xbfb8dc}
];
const WORLD_R=576;
/* day / night: one cycle = 16 min on the shared wall clock, night is phase [.55,.95) (same rule as the server) */
const DAYLEN=960;
const dayPhase=()=>((Date.now()/1000)%DAYLEN)/DAYLEN;
const isNight=()=>{const p=dayPhase();return p>=.55&&p<.95};
function nightK(p){p=p==null?dayPhase():p;const sm=x=>x*x*(3-2*x);if(p<.5)return 0;if(p<.6)return sm((p-.5)/.1);if(p<.9)return 1;if(p<1)return 1-sm((p-.9)/.1);return 0}
/* elite hunt: first 2.5 min of every 10 min */
function huntInfo(){const t=(Date.now()/1000)%600;return t<150?{on:true,left:150-t}:{on:false,next:600-t}}
function zoneAt(x,z){const d=Math.hypot(x,z);for(let i=ZONES.length-1;i>=0;i--)if(d>=ZONES[i].r0)return ZONES[i];return ZONES[0]}
function mobLevel(x,z){const zn=zoneAt(x,z);if(!zn.id)return 0;const k=clamp((Math.hypot(x,z)-zn.r0)/(zn.r1-zn.r0),0,1);return Math.max(zn.lo,Math.min(zn.hi,Math.round(zn.lo+k*(zn.hi-zn.lo)+rnd(-1,1))))}
const mobHp=ml=>Math.round(30+ml*ml*1.6);
const mobDmg=ml=>6+ml*2.2;

/* ---------------- svg icons ---------------- */
const ICONS={
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
  volley:'<path d="M2 11h14v2H2zM16 8l6 4-6 4zM3 5l12 3-.5 2L2.5 7zm0 14l12-3-.5-2L2.5 17z"/>'
};
const SKICON={nova:'burst',buff:'shield',ground:'flame',rain:'rain',volley:'volley',dash:'dash',chain:'bolt'};
const hex6=n=>'#'+('000000'+(n>>>0).toString(16)).slice(-6);
function skIcon(sk,sz){return ic(SKICON[sk.type]||'star',hex6(sk.col||0xffffff),sz||30)}
function ico(svg,col){return '<span class="ico" style="--tc:'+col+'">'+svg+'</span>'}
function ic(n,col,sz){return '<svg class="ic" viewBox="0 0 24 24" width="'+(sz||18)+'" height="'+(sz||18)+'" fill="'+(col||'currentColor')+'">'+(ICONS[n]||'')+'</svg>'}
function itemIcon(it){
  if(it.kind==='potion'){const p=POTIONS[it.base],c=p?p.col:'#fff';return ico(ic('potion',c,26),c)}
  const c=TIER_COL[wTier(it.base)-1];if(it.kind==='armor')return ico(ic(aSlot(it.base),c,26),c);return ico(ic(WICON[wCls(it.base)],c,26),c);
}
function itemName(it){
  if(it.kind==='potion'){const p=POTIONS[it.base];return p?p.name:it.base}
  return (it.kind==='armor'?armorName(it.base):wName(it.base))+(it.enh>0?' +'+it.enh:'');
}
function enchText(e){const d=ENCH[e.k];if(!d)return e.k;return d.name+' '+'I'.repeat(e.l)}
function enchDesc(k,l){const d=ENCH[k];return d.d.replace('{v}',d.per*l).replace('{v2}',10*l)}
const ERR_KO={ALREADY:'이미 받았습니다.',NOT_READY:'아직 받을 수 없습니다.',BAD_AUTH:'로그인이 만료되었습니다. 다시 로그인해주세요.',BAD_LOGIN:'이름 또는 비밀번호가 틀렸습니다.',LOCKED:'로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',BAD_NAME:'이름은 한글·영문·숫자 2~10자만 가능합니다.',BAD_PASS:'비밀번호는 4자 이상이어야 합니다.',NAME_TAKEN:'이미 사용 중인 이름입니다.',BAD_CLASS:'직업을 선택해주세요.',NO_GOLD:'골드가 부족합니다.',NOT_SOLD:'판매하지 않는 물품입니다.',BAD_ITEM:'사용할 수 없는 아이템입니다.',WRONG_CLASS:'다른 직업의 무기입니다.',LOW_LEVEL:'레벨이 부족합니다.',NO_POTION:'물약이 없습니다.',MAX_ENH:'더 이상 강화할 수 없습니다.',SLOTS_FULL:'인첸트 슬롯이 가득 찼습니다.',MAX_ENCH:'최대 단계입니다.',BAD_SLOT:'잘못된 슬롯입니다.',BAD_JOB:'전직할 수 없는 직업입니다.',BAD_PRICE:'가격이 올바르지 않습니다.',TOO_MANY:'더 이상 등록할 수 없습니다.',SOLD_OUT:'이미 판매되었거나 취소된 물품입니다.',OWN_LISTING:'내 물품은 구매할 수 없습니다.',BAD_LISTING:'등록 정보를 찾을 수 없습니다.',BAD_TARGET:'거래 상대를 찾을 수 없습니다.',ALREADY_TRADING:'이미 거래 중입니다.',BAD_TRADE:'거래가 종료되었습니다.',TRADE_INVALID:'거래 조건이 변경되어 취소되었습니다.',BAD_ARGS:'잘못된 요청입니다.',NET:'서버에 연결할 수 없습니다.'};
const errKo=m=>{m=String(m||'');for(const k in ERR_KO)if(m.indexOf(k)>=0)return ERR_KO[k];return '요청에 실패했습니다.'};
