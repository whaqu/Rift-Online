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
const JOBS={
  warrior:{name:'전사',cls:'warrior',tier:0,parent:null,req:1,price:0,m:{}},
  mage:{name:'마법사',cls:'mage',tier:0,parent:null,req:1,price:0,m:{}},
  archer:{name:'궁수',cls:'archer',tier:0,parent:null,req:1,price:0,m:{}},
  gladiator:{name:'검투사',cls:'warrior',tier:1,parent:'warrior',req:10,price:2000,m:{atk:1.15,crit:.08,aps:1.05},desc:'공격력·치명타 특화. 돌진하며 베어 넘깁니다.',
    r:{id:'gladiator_r',name:'돌진 베기',type:'dash',cd:8,dist:9,dmg:2.6,col:0xffd24a}},
  guardian:{name:'수호기사',cls:'warrior',tier:1,parent:'warrior',req:10,price:2000,m:{hp:1.4,armor:.12},desc:'체력·방어 특화. 방패로 적을 기절시킵니다.',
    r:{id:'guardian_r',name:'방패 강타',type:'nova',cd:10,rad:5.5,dmg:1.6,kb:10,freeze:1.5,col:0x9fc8ff}},
  blademaster:{name:'검성',cls:'warrior',tier:2,parent:'gladiator',req:30,price:30000,m:{atk:1.35,aps:1.2,crit:.12},desc:'빠른 검술. 검기를 날려 일직선의 적을 벱니다.',
    r:{id:'blademaster_r',name:'검기 폭풍',type:'volley',cd:7,n:3,spread:.28,dmg:2.2,pierce:8,speed:34,col:0xbfe4ff}},
  berserker:{name:'광전사',cls:'warrior',tier:2,parent:'gladiator',req:30,price:30000,m:{atk:1.5,vamp:.06,hp:.95,berserk:1},desc:'체력이 낮을수록 빨라집니다. 피해 흡수.',
    r:{id:'berserker_r',name:'분노',type:'buff',cd:20,dur:8,aps:1.5,atk:1.4,col:0xff5a4a}},
  paladin:{name:'성기사',cls:'warrior',tier:2,parent:'guardian',req:30,price:30000,m:{hp:1.5,armor:.15,regen:.02},desc:'체력 재생. 성스러운 빛으로 적을 쓸고 회복합니다.',
    r:{id:'paladin_r',name:'성스러운 빛',type:'nova',cd:12,rad:6,dmg:1.8,kb:8,heal:.25,col:0xfff2a0}},
  bulwark:{name:'요새수호자',cls:'warrior',tier:2,parent:'guardian',req:30,price:30000,m:{hp:1.8,armor:.25,atk:.95},desc:'가장 단단한 직업. 대지를 내리쳐 기절시킵니다.',
    r:{id:'bulwark_r',name:'대지 분쇄',type:'ground',cd:11,rad:6,dmg:3.2,delay:.6,range:7,freeze:2,col:0xb08a5a}},
  pyromancer:{name:'화염술사',cls:'mage',tier:1,parent:'mage',req:10,price:2000,m:{atk:1.15,burn:1},desc:'모든 공격에 화상 효과. 화염 폭발을 사용합니다.',
    r:{id:'pyromancer_r',name:'화염 폭발',type:'ground',cd:8,rad:4,dmg:3,delay:.5,range:13,burn:2,col:0xff7a2a}},
  cryomancer:{name:'냉기술사',cls:'mage',tier:1,parent:'mage',req:10,price:2000,m:{hp:1.1,armor:.05},desc:'적을 얼리며 싸우는 제어형 마법사.',
    r:{id:'cryomancer_r',name:'얼음 창',type:'volley',cd:8,n:5,spread:.18,dmg:1.4,pierce:3,speed:30,freeze:1.4,col:0x9fe8ff}},
  flamelord:{name:'화염군주',cls:'mage',tier:2,parent:'pyromancer',req:30,price:30000,m:{atk:1.4,burn:2,aps:1.1},desc:'화염 마법의 정점. 지면을 불바다로 만듭니다.',
    r:{id:'flamelord_r',name:'불지옥',type:'rain',cd:14,rad:6.2,dmg:1.1,dur:3,range:13,col:0xff5a2a}},
  meteormage:{name:'유성술사',cls:'mage',tier:2,parent:'pyromancer',req:30,price:30000,m:{atk:1.5},desc:'거대한 유성을 연달아 떨어뜨립니다.',
    r:{id:'meteormage_r',name:'유성우',type:'ground',cd:16,rad:4,dmg:3.5,delay:.7,range:14,count:4,burn:1,col:0xffb04a}},
  frostlord:{name:'서리군주',cls:'mage',tier:2,parent:'cryomancer',req:30,price:30000,m:{hp:1.3,armor:.1,atk:1.2},desc:'광범위 빙결. 단단하고 강합니다.',
    r:{id:'frostlord_r',name:'절대영도',type:'nova',cd:16,rad:9.5,dmg:2.4,kb:6,freeze:3,col:0xbff2ff}},
  stormcaller:{name:'폭풍술사',cls:'mage',tier:2,parent:'cryomancer',req:30,price:30000,m:{atk:1.35,chain:2,aps:1.15},desc:'번개가 적을 연쇄로 타격합니다.',
    r:{id:'stormcaller_r',name:'낙뢰',type:'chain',cd:9,n:8,dmg:2,col:0xfff2a0}},
  sniper:{name:'저격수',cls:'archer',tier:1,parent:'archer',req:10,price:2000,m:{atk:1.2,crit:.12,pierce:1},desc:'치명타와 관통 특화. 먼 거리에서 한 발을 노립니다.',
    r:{id:'sniper_r',name:'저격',type:'volley',cd:8,n:1,spread:0,dmg:5.5,pierce:8,speed:60,col:0xffe27a}},
  hunter:{name:'사냥꾼',cls:'archer',tier:1,parent:'archer',req:10,price:2000,m:{aps:1.15,spd:1.1,hp:1.1},desc:'연사와 기동성 특화. 화살을 부채꼴로 쏩니다.',
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
const JOB_KIDS=id=>Object.keys(JOBS).filter(k=>JOBS[k].parent===id);

const WNAMES={
  warrior:['낡은 검','철제 장검','강철 검','룬 검','미스릴 대검','용아검','폭풍의 대검','영겁의 검'],
  mage:['나무 지팡이','수정 지팡이','마력의 지팡이','룬 스태프','현자의 스태프','용혼 스태프','별의 지팡이','세계수 스태프'],
  archer:['단궁','사냥용 활','장궁','룬 활','미스릴 활','용골 활','폭풍의 활','바람의 신궁']
};
const WATK=[10,22,40,70,115,180,280,420];
const TIER_COL=['#9aa0a8','#e8e8e8','#5fd26a','#4aa8ff','#b86bff','#ff9a3a','#ff5a5a','#ffd24a'];
const TIER_HEX=[0x9aa0a8,0xe8e8e8,0x5fd26a,0x4aa8ff,0xb86bff,0xff9a3a,0xff5a5a,0xffd24a];
const wTier=b=>+(String(b).split('_')[1]||1);
const wCls=b=>String(b).split('_')[0];
const wReq=b=>Math.max(1,(wTier(b)-1)*5);
const wName=b=>WNAMES[wCls(b)][wTier(b)-1];
const weaponAtk=(b,enh)=>WATK[wTier(b)-1]*(1+enh*.10+Math.max(0,enh-10)*.06);
const WVALUE=[100,900,3500,12000,38000,110000,320000,900000];
const enhCost=(b,enh)=>Math.floor(80*Math.pow(1+enh,1.75)*(1+.5*wTier(b)));
const ENH_RATE=[95,92,88,84,80,74,66,58,50,44,38,32,27,22,18,14,11,8,6,4];
const sellValue=it=>it.kind==='weapon'?Math.floor(WVALUE[wTier(it.base)-1]*.3*(1+it.enh*.35)*(1+(it.ench||[]).length*.5)):Math.floor((POTIONS[it.base]?POTIONS[it.base].price:0)*.25*it.qty);

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
  {id:1,name:'초원',r0:19,r1:62,lo:1,hi:10,types:['slime','slime','bat'],ground:0x5fa84a,alt:0x4f9a40},
  {id:2,name:'망자의 숲',r0:62,r1:100,lo:8,hi:18,types:['skel','skel','archer'],ground:0x4a4f58,alt:0x3e4350},
  {id:3,name:'화염 황무지',r0:100,r1:132,lo:16,hi:28,types:['bomber','skel','archer','bat'],ground:0x7a4a38,alt:0x6a3c30},
  {id:4,name:'수정 협곡',r0:132,r1:166,lo:26,hi:42,types:['golem','archer','bomber'],ground:0x4a4a8a,alt:0x3a3a78}
];
const WORLD_R=164;
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
  volley:'<path d="M2 11h14v2H2zM16 8l6 4-6 4zM3 5l12 3-.5 2L2.5 7zm0 14l12-3-.5-2L2.5 17z"/>'
};
const SKICON={nova:'burst',buff:'shield',ground:'flame',rain:'rain',volley:'volley',dash:'dash',chain:'bolt'};
const hex6=n=>'#'+('000000'+(n>>>0).toString(16)).slice(-6);
function skIcon(sk,sz){return ic(SKICON[sk.type]||'star',hex6(sk.col||0xffffff),sz||30)}
function ico(svg,col){return '<span class="ico" style="--tc:'+col+'">'+svg+'</span>'}
function ic(n,col,sz){return '<svg class="ic" viewBox="0 0 24 24" width="'+(sz||18)+'" height="'+(sz||18)+'" fill="'+(col||'currentColor')+'">'+(ICONS[n]||'')+'</svg>'}
function itemIcon(it){
  if(it.kind==='potion'){const p=POTIONS[it.base],c=p?p.col:'#fff';return ico(ic('potion',c,26),c)}
  const c=TIER_COL[wTier(it.base)-1];return ico(ic(({warrior:'sword',mage:'staff',archer:'bow'})[wCls(it.base)],c,26),c);
}
function itemName(it){
  if(it.kind==='potion'){const p=POTIONS[it.base];return p?p.name:it.base}
  return wName(it.base)+(it.enh>0?' +'+it.enh:'');
}
function enchText(e){const d=ENCH[e.k];if(!d)return e.k;return d.name+' '+'I'.repeat(e.l)}
function enchDesc(k,l){const d=ENCH[k];return d.d.replace('{v}',d.per*l).replace('{v2}',10*l)}
const ERR_KO={BAD_AUTH:'로그인이 만료되었습니다. 다시 로그인해주세요.',BAD_LOGIN:'이름 또는 비밀번호가 틀렸습니다.',LOCKED:'로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',BAD_NAME:'이름은 한글·영문·숫자 2~10자만 가능합니다.',BAD_PASS:'비밀번호는 4자 이상이어야 합니다.',NAME_TAKEN:'이미 사용 중인 이름입니다.',BAD_CLASS:'직업을 선택해주세요.',NO_GOLD:'골드가 부족합니다.',NOT_SOLD:'판매하지 않는 물품입니다.',BAD_ITEM:'사용할 수 없는 아이템입니다.',WRONG_CLASS:'다른 직업의 무기입니다.',LOW_LEVEL:'레벨이 부족합니다.',NO_POTION:'물약이 없습니다.',MAX_ENH:'더 이상 강화할 수 없습니다.',SLOTS_FULL:'인첸트 슬롯이 가득 찼습니다.',MAX_ENCH:'최대 단계입니다.',BAD_SLOT:'잘못된 슬롯입니다.',BAD_JOB:'전직할 수 없는 직업입니다.',BAD_PRICE:'가격이 올바르지 않습니다.',TOO_MANY:'더 이상 등록할 수 없습니다.',SOLD_OUT:'이미 판매되었거나 취소된 물품입니다.',OWN_LISTING:'내 물품은 구매할 수 없습니다.',BAD_LISTING:'등록 정보를 찾을 수 없습니다.',BAD_TARGET:'거래 상대를 찾을 수 없습니다.',ALREADY_TRADING:'이미 거래 중입니다.',BAD_TRADE:'거래가 종료되었습니다.',TRADE_INVALID:'거래 조건이 변경되어 취소되었습니다.',BAD_ARGS:'잘못된 요청입니다.',NET:'서버에 연결할 수 없습니다.'};
const errKo=m=>{m=String(m||'');for(const k in ERR_KO)if(m.indexOf(k)>=0)return ERR_KO[k];return '요청에 실패했습니다.'};
