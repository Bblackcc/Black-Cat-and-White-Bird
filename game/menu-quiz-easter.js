/* A hidden menu toy. Discovery and chase progress last for this play session. */
const menuQuizEaster={menuOpen:false,startedAt:0,waitTimer:null,revealed:false,used:false,dodges:0,dodgeLimit:0,nextDodgeAt:0};
const quizSecretHost=document.querySelector('.music-panel'),quizSecretButton=document.createElement('button');
quizSecretButton.id='quizDisableSecret';quizSecretButton.type='button';quizSecretButton.className='quiz-escape-button';quizSecretButton.textContent='关闭答题模式';quizSecretButton.hidden=true;quizSecretHost.appendChild(quizSecretButton);
function resetQuizSecretPosition(){quizSecretHost.appendChild(quizSecretButton);quizSecretButton.classList.remove('roaming');quizSecretButton.style.left='auto';quizSecretButton.style.right='8px';quizSecretButton.style.top='12px'}
function revealQuizMenuSecret(){
 if(!menuQuizEaster.menuOpen||menuQuizEaster.revealed||Date.now()-menuQuizEaster.startedAt<180000)return;
 menuQuizEaster.revealed=true;menuQuizEaster.dodgeLimit=30+Math.floor(Math.random()*15);resetQuizSecretPosition();quizSecretButton.hidden=false;
}
function syncQuizMenuSecret(){
 const open=document.getElementById('chapterOverlay').classList.contains('show');
 if(open&&!menuQuizEaster.menuOpen){menuQuizEaster.menuOpen=true;menuQuizEaster.startedAt=Date.now();if(!menuQuizEaster.revealed)menuQuizEaster.waitTimer=setTimeout(revealQuizMenuSecret,180000);else{quizSecretButton.hidden=false;resetQuizSecretPosition()}}
 else if(!open&&menuQuizEaster.menuOpen){menuQuizEaster.menuOpen=false;clearTimeout(menuQuizEaster.waitTimer);menuQuizEaster.waitTimer=null;quizSecretButton.hidden=true}
 if(open&&!menuQuizEaster.revealed)revealQuizMenuSecret();
}
function chooseQuizSecretSpot(area,size,obstacles,pointer,random=Math.random){
 const margin=6,maxX=Math.max(margin,area.width-size.width-margin),maxY=Math.max(margin,area.height-size.height-margin),candidates=[];
 // Stay just beside the pointer; repeated small hops are easy to follow.
 const clamp=(value,maximum)=>Math.max(margin,Math.min(maximum,value));
 for(const gap of [10,18,26])for(const [dx,dy] of [[-size.width/2,-size.height-gap],[-size.width/2,gap],[gap,-size.height/2],[-size.width-gap,-size.height/2],[gap,gap],[-size.width-gap,gap],[gap,-size.height-gap],[-size.width-gap,-size.height-gap]])candidates.push({x:clamp(pointer.x+dx,maxX),y:clamp(pointer.y+dy,maxY)});
 const overlaps=p=>obstacles.some(r=>Math.min(p.x+size.width,r.right+4)>Math.max(p.x,r.left-4)&&Math.min(p.y+size.height,r.bottom+4)>Math.max(p.y,r.top-4));
 const avoidsPointer=p=>pointer.x<p.x-6||pointer.x>p.x+size.width+6||pointer.y<p.y-6||pointer.y>p.y+size.height+6;
 const away=candidates.filter(avoidsPointer),clear=away.filter(p=>!overlaps(p)),pool=clear.length?clear:away.length?away:candidates;
 return pool.map(p=>({...p,score:Math.hypot(p.x+size.width/2-pointer.x,p.y+size.height/2-pointer.y)+random()*18})).sort((a,b)=>a.score-b.score)[0];
}
function dodgeQuizMenuSecret(event){
 if(!menuQuizEaster.menuOpen||!menuQuizEaster.revealed||menuQuizEaster.used||menuQuizEaster.dodges>=menuQuizEaster.dodgeLimit)return false;
 event?.preventDefault?.();event?.stopPropagation?.();
 if(Date.now()<menuQuizEaster.nextDodgeAt)return true;
 menuQuizEaster.dodges++;menuQuizEaster.nextDodgeAt=Date.now()+150;
 const button=quizSecretButton.getBoundingClientRect(),area={width:innerWidth,height:innerHeight};
 const obstacles=[...document.querySelectorAll('.chapter-card button,.chapter-card input,.chapter-card select')].filter(node=>node!==quizSecretButton).map(node=>node.getBoundingClientRect());
 const pointer={x:Number.isFinite(event?.clientX)?event.clientX:button.left+button.width/2,y:Number.isFinite(event?.clientY)?event.clientY:button.top+button.height/2};
 const spot=chooseQuizSecretSpot(area,button,obstacles,pointer);document.body.appendChild(quizSecretButton);quizSecretButton.classList.add('roaming');quizSecretButton.style.left=spot.x+'px';quizSecretButton.style.right='auto';quizSecretButton.style.top=spot.y+'px';return true;
}
function catchQuizMenuSecret(event){
 event?.preventDefault?.();event?.stopPropagation?.();
 if(dodgeQuizMenuSecret(event)||!menuQuizEaster.menuOpen||!menuQuizEaster.revealed||menuQuizEaster.used)return;
 menuQuizEaster.used=true;quizSecretButton.textContent='答题已关闭';quizSecretButton.disabled=true;disableTurnQuizMode();
 if(typeof battleBroadcast!=='undefined')battleBroadcast.secretQuizDisabled();
}
// Missed clicks during the chase must not dismiss the menu behind the button.
function protectQuizSecretChase(event){
 if(event.target===document.getElementById('chapterOverlay')&&menuQuizEaster.menuOpen&&menuQuizEaster.dodges>0&&!menuQuizEaster.used){event.preventDefault();event.stopImmediatePropagation()}
}
document.getElementById('chapterOverlay').addEventListener('click',protectQuizSecretChase,true);
quizSecretButton.onpointerenter=dodgeQuizMenuSecret;quizSecretButton.onpointerdown=dodgeQuizMenuSecret;quizSecretButton.onclick=catchQuizMenuSecret;
const menuBeforeQuizSecret=toggleChapterMenu;
toggleChapterMenu=function(...args){const result=menuBeforeQuizSecret(...args);syncQuizMenuSecret();return result};
window.addEventListener('resize',()=>{if(menuQuizEaster.menuOpen&&menuQuizEaster.revealed)resetQuizSecretPosition()});
document.addEventListener('visibilitychange',syncQuizMenuSecret);
syncQuizMenuSecret();
