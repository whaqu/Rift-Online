/* ---------------- mobile controls (auto-detected) ---------------- */
function initTouch(){
  if(!IS_TOUCH)return;
  document.body.classList.add('touch');
  const joy=$('joy'),knob=$('knob');let jid=null,cx=0,cy=0;
  const R=58;
  const setStick=(x,y)=>{
    let dx=x-cx,dy=y-cy;const l=Math.hypot(dx,dy);if(l>R){dx=dx/l*R;dy=dy/l*R}
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
    el.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();auInit();fn(true)},{passive:false});
    if(hold){const up=e=>{e.preventDefault();fn(false)};el.addEventListener('touchend',up);el.addEventListener('touchcancel',up)}
  };
  press('tb-atk',on=>{mv.atk=on},true);
  press('tb-q',on=>{if(on)trySkill('q')});press('tb-e',on=>{if(on)trySkill('e')});press('tb-r',on=>{if(on)trySkill('r')});
  press('tb-dash',on=>{if(on)doDash()});
  press('tb-hp',on=>{if(!on)return;const order=['hp1','hp2','hp3'];for(const b of order){if(SES.pf.items.find(i=>i.kind==='potion'&&i.base===b&&i.qty>0&&!i.listed)){usePotionKey(b);return}}UI.toast('체력 물약이 없습니다')});
  press('tb-use',on=>{if(on)interact()});
  canvas.addEventListener('touchstart',e=>{auInit()},{passive:true});
  const setI=(id,h)=>{const e=$(id);if(e){const q=e.querySelector('.ic0');if(q)q.innerHTML=h}};
  setI('tb-dash',ic('dash','#9fc8ff',26));setI('tb-hp',ic('potion','#ff6a7a',26));
  UI.refreshTouch=()=>{const r=$('tb-r');if(r)r.classList.toggle('hidden',!skillOf('r'));for(const k of['q','e','r']){const sk=skillOf(k);if(sk)setI('tb-'+k,skIcon(sk,28))}};
}
function openChatInput(){const ci=$('chatin');ci.classList.add('on');ci.focus()}
