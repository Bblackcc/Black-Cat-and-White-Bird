const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {run,context,elements,timers}=require('./training-flow.test.cjs');timers.length=0;
let now=0,serial=0;const tasks=new Map();
context.Date=class extends Date{static now(){return now}};
context.setTimeout=(fn,ms=0)=>{const id=++serial;tasks.set(id,{fn,at:now+ms});return id};context.setInterval=(fn,ms)=>{const id=++serial;tasks.set(id,{fn,at:now+ms,every:ms});return id};context.clearTimeout=context.clearInterval=id=>tasks.delete(id);
function advance(ms){const end=now+ms;for(let i=0;i<100000;i++){const next=[...tasks].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next){now=end;return}const [id,t]=next;now=t.at;if(t.every)t.at+=t.every;else tasks.delete(id);t.fn()}throw Error('timer loop')}
run('stopTutorial();Math.random=()=>.1;showTurnBanner=(label,done)=>done?.()');
for(const file of ['battle-broadcast.js','quiz-bank.js','turn-quiz.js','menu-quiz-easter.js'])vm.runInContext(fs.readFileSync(require.resolve('./'+file),'utf8'),context);
run('quizSecretHost.getBoundingClientRect=()=>({left:100,top:300,right:550,bottom:446,width:450,height:146});quizSecretButton.getBoundingClientRect=()=>{const left=Number.parseFloat(quizSecretButton.style.left)||322,top=Number.parseFloat(quizSecretButton.style.top)||12;return{left:100+left,top:300+top,right:100+left+118,bottom:300+top+26,width:118,height:26}}');
assert.equal(run('quizSecretButton.hidden'),true);advance(180000);assert.equal(run('menuQuizEaster.revealed'),false,'time outside the menu does not count');
run('cancelTurnQuiz();s.busy=false;s.quizAnsweredToken=quizTurnToken();toggleChapterMenu(true)');advance(179999);assert.equal(run('quizSecretButton.hidden'),true);
run('toggleChapterMenu(false)');advance(5000);run('toggleChapterMenu(true)');advance(179999);assert.equal(run('quizSecretButton.hidden'),true);advance(1);assert.equal(run('quizSecretButton.hidden'),false);
assert(run('menuQuizEaster.dodgeLimit>=30&&menuQuizEaster.dodgeLimit<=44'));
const click={clientX:480,clientY:325,preventDefault(){},stopPropagation(){}};context.secretClick=click;
context.secretBackdropEvent={target:elements.get('chapterOverlay'),preventDefault(){this.prevented=true},stopImmediatePropagation(){this.blocked=true}};
run('protectQuizSecretChase(secretBackdropEvent)');assert.equal(context.secretBackdropEvent.blocked,undefined,'background closes normally before chasing');
run('catchQuizMenuSecret(secretClick)');assert.notEqual(run('cfg.quizEnabled'),false);assert.equal(run('menuQuizEaster.dodges'),1);
run('protectQuizSecretChase(secretBackdropEvent)');assert.equal(context.secretBackdropEvent.blocked,true,'missed chase clicks do not dismiss the menu');
for(let i=0;i<10;i++)run('catchQuizMenuSecret(secretClick)');assert.equal(run('menuQuizEaster.dodges'),1,'one pointer gesture cannot instantly exhaust the chase');
while(run('menuQuizEaster.dodges<10')){advance(160);run('dodgeQuizMenuSecret(secretClick)')}
run('const progressBeforeMenuClose=menuQuizEaster.dodges;toggleChapterMenu(false);toggleChapterMenu(true)');assert.equal(run('quizSecretButton.hidden'),false);assert.equal(run('menuQuizEaster.dodges'),run('progressBeforeMenuClose'));
while(run('menuQuizEaster.dodges<menuQuizEaster.dodgeLimit')){advance(160);run('dodgeQuizMenuSecret(secretClick)');assert(run('parseFloat(quizSecretButton.style.left)>=6&&parseFloat(quizSecretButton.style.left)+118<=innerWidth-6'));assert(run('parseFloat(quizSecretButton.style.top)>=6&&parseFloat(quizSecretButton.style.top)+26<=innerHeight-6'));assert(run('quizSecretButton.classList.contains("roaming")'))}
assert.notEqual(run('cfg.quizEnabled'),false);run('battleBroadcast.setMode("both");cfg.partyDieSides=10;cfg.enemyDieSides=6;s.quizPartySides=6;s.quizEnemySides=10;catchQuizMenuSecret(secretClick)');
delete context.secretBackdropEvent.blocked;run('protectQuizSecretChase(secretBackdropEvent)');assert.equal(context.secretBackdropEvent.blocked,undefined,'background closing resumes after catching the button');
assert.equal(run('cfg.quizEnabled'),false);assert.equal(run('quizSecretButton.disabled'),true);assert.equal(run('quizSecretButton.textContent'),'答题已关闭');assert.equal(run('partyDieSides()'),10);assert.equal(run('enemyDieSides()'),6);
advance(200);assert.equal(run('battleBroadcast.current.type'),'quizDisabled');assert.equal(run('battleBroadcast.lastSpeaker'),'ximo');assert.equal(elements.get('broadcastText').textContent,'（失望地看着你）');assert.equal(elements.get('battleBroadcast').hidden,false);assert(elements.get('battleBroadcast').classList.contains('secret-quiz'));
run('battleBroadcast.emit("combat")');assert.equal(run('battleBroadcast.queue.length'),0);advance(3000);assert.equal(run('battleBroadcast.lastSpeaker'),'ximo');assert.equal(run('battleBroadcast.current'),null,'only one random reaction, no second speaker');
advance(6000);assert.equal(run('battleBroadcast.current'),null);assert.equal(run('battleBroadcast.secretNarrative'),false);assert.equal(elements.get('battleBroadcast').hidden,true);
run('catchQuizMenuSecret(secretClick)');advance(500);assert.equal(run('battleBroadcast.current'),null,'the secret can only be used once');
run('toggleChapterMenu(false);resetBattle("boss",3)');advance(2000);assert.equal(run('turnQuiz.active'),false);assert.equal(run('cfg.quizEnabled'),false);
run('let secretEnemyActs=0;enemyAct=()=>secretEnemyActs++;startEnemyTurn()');advance(2000);assert.equal(run('turnQuiz.active'),false);assert.equal(run('secretEnemyActs'),1);
run('toggleChapterMenu(true)');assert.equal(run('quizSecretButton.hidden'),false);assert.equal(run('quizSecretButton.disabled'),true);
for(const speaker of ['ximo','tiaoyao','off']){
 run(`battleBroadcast.setMode('${speaker}');battleBroadcast.secretQuizDisabled()`);advance(200);
 if(speaker==='off')assert.equal(run('battleBroadcast.current'),null);else{assert.equal(run('battleBroadcast.lastSpeaker'),speaker);assert.equal(elements.get('broadcastText').textContent,run(`battleBroadcastLines.${speaker}.lines.quizDisabled[0]`))}
 advance(7000);assert.equal(run('battleBroadcast.current'),null);
}
for(const [chance,speaker] of [[.49,'ximo'],[.5,'tiaoyao'],[.99,'tiaoyao']]){
 run(`battleBroadcast.setMode('both');Math.random=()=>${chance};battleBroadcast.secretQuizDisabled()`);advance(200);assert.equal(run('battleBroadcast.lastSpeaker'),speaker);assert.equal(run('battleBroadcast.secretSpeakers.length'),0);advance(6000);assert.equal(run('battleBroadcast.current'),null);
}
// Disabling a pending question cancels its timeout and resumes its held turn exactly once.
run('battleBroadcast.setMode("off");toggleChapterMenu(false);cfg.quizEnabled=true;s.turn="player";s.busy=false;delete s.quizAnsweredToken;let secretResumeCount=0;beginTurnQuiz(()=>{secretResumeCount++;s.busy=false});disableTurnQuizMode()');advance(31000);assert.equal(run('secretResumeCount'),1);assert.equal(run('turnQuiz.active'),false);
// Small hops stay near the pointer, inside the viewport, with space for another approach.
context.secretObstacles=[{left:500,top:300,right:600,bottom:340}];
for(const pointer of [{x:560,y:290},{x:700,y:600},{x:6,y:6},{x:1434,y:894}]){
 context.secretPointer=pointer;const point=run('chooseQuizSecretSpot({width:1440,height:900},{width:118,height:26},secretObstacles,secretPointer,()=>.5)');
 assert(point.x>=6&&point.x+118<=1434&&point.y>=6&&point.y+26<=894);
 assert(Math.hypot(point.x+59-pointer.x,point.y+13-pointer.y)<145,'button stays within easy reach');
 assert(pointer.x<point.x-6||pointer.x>point.x+124||pointer.y<point.y-6||pointer.y>point.y+32);
 for(const r of context.secretObstacles)assert(Math.min(point.x+118,r.right+4)<=Math.max(point.x,r.left-4)||Math.min(point.y+26,r.bottom+4)<=Math.max(point.y,r.top-4));
}
console.log('PASS: continuous three-minute discovery, 30-44 bounded dodges, catch / touch guards, session-wide quiz disabling, preserved debug dice and single random / filtered secret reaction.');
