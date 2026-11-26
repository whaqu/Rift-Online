/* ---------------- loading & title screens ---------------- */
function showLoading(text){$('ldtx').textContent=text||'불러오는 중…';$('loading').classList.remove('hidden')}
function hideLoading(){$('loading').classList.add('hidden')}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function enterWithLoading(){
  showLoading('캐릭터를 불러오는 중…');await wait(500);
  enterGame();
  showLoading('필드로 이동하는 중…');await wait(400);
  hideLoading();
}
/* title screen: "게임 시작" → saved session resumes, otherwise the login box */
function showTitle(mode){
  let s=null;try{s=JSON.parse(localStorage.getItem('rw_sess')||'null')}catch(e){}
  if(!(s&&s.mode===mode&&s.name&&s.token))s=null;
  $('stsub').textContent=s?s.name+' 님으로 이어합니다':'';
  $('login').classList.add('hidden');$('start').classList.remove('hidden');LOGIN.title=true;
  const toLogin=msg=>{LOGIN.title=false;$('start').classList.add('hidden');$('login').classList.remove('hidden');$('lmsg').textContent=msg||''};
  let used=false;
  $('stgo').onclick=async()=>{
    if(used)return;used=true;auInit();
    if(!s){toLogin();return}
    $('start').classList.add('hidden');showLoading('접속 중…');
    try{await API.resume(s.name,s.token);await enterWithLoading()}
    catch(e){try{localStorage.removeItem('rw_sess')}catch(e2){}hideLoading();toLogin(errKo(e.message))}
  };
}
