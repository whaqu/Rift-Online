/* ---------------- mobile controls (auto-detected) ---------------- */
let TOUCH_BOUND=false;
function initTouch(){
  if(!IS_TOUCH)return;
  document.body.classList.add('touch');
  if(TOUCH_BOUND)return;TOUCH_BOUND=true;
  const joy=$('joy'),knob=$('knob');let jid=null,cx=0,cy=0;
  const R=58;
  const setStick=(x,y)=>{
    let dx=x-cx,dy=y-cy,l=Math.hypot(dx,dy);if(l>R){dx=dx/l*R;dy=dy/l*R;l=R}   // l must follow the clamp, or speed drops outside the ring
    knob.style.transform='translate('+dx+'px,'+dy+'px)';
    const m=Math.hypot(dx,dy)/R;if(m<.12){mv.x=mv.z=0;return}
    const nx=dx/(l||1),nz=dy/(l||1);mv.x=nx*Math.min(1,m*1.15);mv.z=nz*Math.min(1,m*1.15);mv.on=true;
  };
  joy.addEventListener('touchstart',e=>{e.preventDefault();auInit();const t=e.changedTouches[0];if(jid!==null)return;jid=t.identifier;const r=joy.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;setStick(t.clientX,t.clientY)},{passive:false});
  joy.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===jid)setStick(t.clientX,t.clientY)},{passive:false});
  const endJ=e=>{for(const t of e.changedTouches)if(t.identifier===jid){jid=null;mv.x=mv.z=0;mv.on=false;knob.style.transform='translate(0,0)'}};
  joy.addEventListener('touchend',endJ);joy.addEventListener('touchcancel',endJ);
  const press=(id,fn,hold)=>{
    const el=$(id);if(!el)return;
    el.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();auInit();fn(true,e)},{passive:false});
    if(hold){const up=e=>{e.preventDefault();fn(false)};el.addEventListener('touchend',up);el.addEventListener('touchcancel',up)}
  };
  press('tb-atk',on=>{mv.atk=on},true);
  press('tb-q',(on,e)=>{mv.q=on;mv.qt=on&&e&&e.changedTouches?e.changedTouches[0].identifier:null;if(on)trySkill('q')},true);press('tb-e',on=>{if(on)trySkill('e')});press('tb-r',on=>{if(on)trySkill('r')});press('tb-f',on=>{if(on)trySkill('f')});
  press('tb-dash',on=>{if(on)doDash()});
  press('tb-hp',on=>{if(!on)return;const order=['hp1','hp2','hp3'];for(const b of order){if(SES.pf.items.find(i=>i.kind==='potion'&&i.base===b&&i.qty>0&&!i.listed)){usePotionKey(b);return}}UI.toast('체력 물약이 없습니다')});
  press('tb-use',on=>{if(on)interact()});press('tb-recall',on=>{if(on)startRecall()});
  canvas.addEventListener('touchstart',e=>{auInit()},{passive:true});
  const setI=(id,h)=>{const e=$(id);if(e){const q=e.querySelector('.ic0');if(q)q.innerHTML=h}};
  setI('tb-dash',ic('dash','#9fc8ff',26));setI('tb-hp',ic('potion','#ff6a7a',26));
  UI.refreshTouch=()=>{{const hd=SES.pf&&HIDDEN[hidOn(SES.pf)];setI('tb-dash',hd?ic('h_fly',hd.col,26):ic('dash','#9fc8ff',26))}for(const k of['r','f']){const b=$('tb-'+k);if(b)b.classList.toggle('hidden',!skillOf(k))}for(const k of['q','e','r','f']){const sk=skillOf(k);if(sk)setI('tb-'+k,skIcon(sk,28))}};
}
function openChatInput(){const ci=$('chatin');ci.classList.add('on');ci.focus()}

/* typing in a text box (on-screen keyboard) is not a sign that a real keyboard is being used */
const isTyping=t=>!!t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable===true);
/* ---- switch between touch UI and keyboard/mouse UI depending on the input actually used ---- */
function setTouchMode(on){
  if(on===IS_TOUCH)return;
  IS_TOUCH=on;document.body.classList.toggle('touch',on);
  for(const k in keys)keys[k]=false;mv.on=false;mv.x=mv.z=0;mv.atk=false;mv.q=false;
  if(on)initTouch();
  if(!save.custom){save.auto=on;writeSave()}
  if(typeof UI!=='undefined'){UI.toast(on?'터치 조작으로 전환했습니다':'키보드·마우스 조작으로 전환했습니다');if(UI.refreshTouch)UI.refreshTouch();if(UI.rerender&&UI.modal)UI.rerender()}
  if(!on&&!isTyping(document.activeElement))try{canvas.focus()}catch(e){}
}
{
  let lastT=0;
  window.addEventListener('keydown',e=>{
    if(!IS_TOUCH||isTyping(e.target)||isTyping(document.activeElement))return;if(e.isComposing||e.keyCode===229||!e.code||e.key==='Unidentified')return;
    if(['Shift','Control','Alt','Meta','CapsLock'].includes(e.key))return;
    if(performance.now()-lastT<800)return;setTouchMode(false);
  },true);
  window.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'){lastT=performance.now();if(!IS_TOUCH)setTouchMode(true)}
    else if(e.pointerType==='mouse'&&IS_TOUCH&&performance.now()-lastT>800)setTouchMode(false);
  },true);
  window.addEventListener('pointermove',e=>{if(IS_TOUCH&&e.pointerType==='mouse'&&e.movementX*e.movementX+e.movementY*e.movementY>4&&performance.now()-lastT>800)setTouchMode(false)},true);
}
