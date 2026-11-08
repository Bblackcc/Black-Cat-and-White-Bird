/* One question per side's turn. The bank is a local script so file:// play needs no fetch. */
const turnQuiz={active:false,phase:'',state:null,token:'',side:'',question:null,selected:null,resume:null,deadline:0,tickTimer:null,closeTimer:null,queuedTimer:null,waitingBanner:null,resetting:0,bag:[],lastQuestion:null};
const quizBlocker=document.createElement('div');quizBlocker.id='quizBlocker';quizBlocker.hidden=true;document.getElementById('game').appendChild(quizBlocker);
const quizPanel=document.createElement('section');quizPanel.id='turnQuizPanel';quizPanel.hidden=true;quizPanel.setAttribute('role','dialog');quizPanel.setAttribute('aria-modal','true');quizPanel.setAttribute('aria-label','回合答题');
quizPanel.innerHTML='<div class="quiz-heading"><b id="quizTurnTitle"></b><span id="quizTimer" role="timer"></span></div><p id="quizQuestion"></p><div id="quizChoicesText" class="quiz-choices"></div><div id="quizFeedback" role="status" aria-live="polite"></div><p id="quizExplanation" hidden></p><p id="quizContinueHint"></p>';
document.getElementById('game').appendChild(quizPanel);
function quizTurnToken(){return `${s.round}:${s.turn}`}
function quizNarrativeBlocked(){return tutorialScripted()||tutorial.fading||tutorial.transitioning||!!tutorial.skipPrompt||typeof gameEnding!=='undefined'&&(gameEnding.active||gameEnding.completed||gameEnding.exited)}
function quizCanOpen(){return cfg.quizEnabled!==false&&!turnQuiz.resetting&&!s.over&&!s.retryPreparing&&!s.emberPhase&&!s.equipSkill&&!s.pendingHeal&&!s.passiveResolving&&!quizNarrativeBlocked()&&!document.getElementById('emberOverlay').classList.contains('show')&&!document.getElementById('chapterOverlay').classList.contains('show')&&document.getElementById('bossRetryOverlay')?.hidden!==false&&!document.querySelector('.settings').open}
function drawQuizQuestion(){
 if(!turnQuiz.bag.length){turnQuiz.bag=quizQuestionBank.map((_,index)=>index);for(let i=turnQuiz.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[turnQuiz.bag[i],turnQuiz.bag[j]]=[turnQuiz.bag[j],turnQuiz.bag[i]]}if(turnQuiz.bag.at(-1)===turnQuiz.lastQuestion&&turnQuiz.bag.length>1)[turnQuiz.bag[0],turnQuiz.bag[turnQuiz.bag.length-1]]=[turnQuiz.bag.at(-1),turnQuiz.bag[0]]}
 const index=turnQuiz.bag.pop();turnQuiz.lastQuestion=index;return quizQuestionBank[index];
}
function cancelTurnQuiz(){
 clearInterval(turnQuiz.tickTimer);clearTimeout(turnQuiz.closeTimer);clearTimeout(turnQuiz.queuedTimer);
 Object.assign(turnQuiz,{active:false,phase:'',state:null,resume:null,tickTimer:null,closeTimer:null,queuedTimer:null,waitingBanner:null});
 quizPanel.hidden=true;quizBlocker.hidden=true;document.body.classList.remove('quiz-active');
}
function beginTurnQuiz(resume=null){
 if(turnQuiz.active||s.quizAnsweredToken===quizTurnToken())return false;
 if(!quizCanOpen())return false;
 clearTimeout(turnQuiz.queuedTimer);turnQuiz.queuedTimer=null;
 Object.assign(turnQuiz,{active:true,phase:'answering',state:s,token:quizTurnToken(),side:s.turn,question:drawQuizQuestion(),selected:null,resume,deadline:s.turn==='enemy'?Date.now()+30000:0});
 if(s.turn==='player')s.quizPartySides=6;else s.quizEnemySides=10;
 s.busy=true;hideSkillTooltip();if(typeof battleBroadcast!=='undefined')battleBroadcast.clear();
 quizPanel.hidden=false;quizBlocker.hidden=false;document.body.classList.add('quiz-active');
 render();paintTurnQuiz();if(turnQuiz.side==='enemy')turnQuiz.tickTimer=setInterval(updateQuizCountdown,200);
 return true;
}
function updateQuizCountdown(){
 if(!turnQuiz.active||turnQuiz.phase!=='answering'||turnQuiz.side!=='enemy')return;
 const remaining=Math.max(0,Math.ceil((turnQuiz.deadline-Date.now())/1000));document.getElementById('quizTimer').textContent=`限时 ${remaining} 秒`;document.getElementById('quizTimer').classList.toggle('urgent',remaining<=5);
 if(remaining===0)answerTurnQuiz(null,true);
}
function paintTurnQuiz(){
 if(!turnQuiz.active)return;
 const q=turnQuiz.question,player=turnQuiz.side==='player',resolved=turnQuiz.phase!=='answering';
 document.getElementById('quizTurnTitle').textContent=player?'我方回合 · 答题升级':'敌方回合 · 答题削弱';
 document.getElementById('quizQuestion').textContent=q.question;
 const choices=document.getElementById('quizChoicesText');choices.innerHTML='';q.options.forEach((text,index)=>{const row=document.createElement('div');row.className='quiz-choice-text';const letter=document.createElement('b');letter.textContent='ABCD'[index]+'．';const content=document.createElement('span');content.textContent=text;row.appendChild(letter);row.appendChild(content);if(resolved&&index===q.answer)row.classList.add('correct');if(resolved&&index===turnQuiz.selected&&index!==q.answer)row.classList.add('wrong');choices.appendChild(row)});
 document.getElementById('quizTimer').hidden=player;
 const explanation=document.getElementById('quizExplanation');explanation.hidden=!resolved||turnQuiz.phase==='correct';explanation.textContent=`解析：${q.explanation}`;
 const feedback=document.getElementById('quizFeedback');feedback.className='';
 if(!resolved){feedback.textContent=player?'答对：本回合每枚行动骰为D10；答错：本回合每枚行动骰为D6。':'30秒内答对：敌方本回合每枚行动骰为D6；答错或超时：敌方本回合每枚行动骰为D10。'}
 else if(turnQuiz.phase==='correct'){feedback.className='correct';feedback.textContent=player?'回答正确！本回合行动骰升级为D10。':'回答正确！敌方本回合行动骰降为D6。'}
 else{feedback.className='wrong';feedback.textContent=`${turnQuiz.selected===null?'答题超时':'回答错误'}。正确答案：${'ABCD'[q.answer]}．${q.options[q.answer]}。${player?'本回合行动骰为D6。':'敌方本回合行动骰为D10。'}`}
 document.getElementById('quizContinueHint').textContent=turnQuiz.phase==='correct'?'即将继续战斗…':resolved?'单击屏幕任意位置继续':'点击下方ABCD选项作答，也可按键盘A、B、C、D。';
 document.getElementById('quizContinueHint').classList.toggle('dismiss-hint',turnQuiz.phase==='wrong');
 if(!player&&!resolved)updateQuizCountdown();
}
function renderQuizOptions(){
 hideSkillTooltip();const box=document.getElementById('skillButtons');box.innerHTML='';
 document.getElementById('prompt').textContent=turnQuiz.phase==='answering'?'请选择一个答案':'答题结果';
 document.getElementById('tinyhint').textContent=turnQuiz.phase==='wrong'?'单击屏幕任意位置继续':'答题不消耗行动力';
 turnQuiz.question.options.forEach((text,index)=>{
  const button=document.createElement('button');button.type='button';button.className='skill-btn quiz-option';button.dataset.quizAnswer=String(index);
  const letter=document.createElement('b');letter.className='quiz-letter';letter.textContent='ABCD'[index];button.appendChild(letter);button.setAttribute('aria-label',`${'ABCD'[index]}：${text}`);
  const resolved=turnQuiz.phase!=='answering';button.disabled=resolved;
  if(resolved&&index===turnQuiz.question.answer)button.classList.add('quiz-correct');
  if(resolved&&index===turnQuiz.selected&&index!==turnQuiz.question.answer)button.classList.add('quiz-wrong');
  button.onclick=()=>answerTurnQuiz(index);box.appendChild(button);
 });
}
function answerTurnQuiz(index,timedOut=false){
 if(!turnQuiz.active||turnQuiz.phase!=='answering'||turnQuiz.state!==s)return;
 if(turnQuiz.side==='enemy'&&Date.now()>=turnQuiz.deadline){index=null;timedOut=true}
 if(!timedOut&&(!Number.isInteger(index)||index<0||index>3))return;
 clearInterval(turnQuiz.tickTimer);turnQuiz.tickTimer=null;
 turnQuiz.selected=index;const correct=!timedOut&&index===turnQuiz.question.answer;turnQuiz.phase=correct?'correct':'wrong';
 s.quizAnsweredToken=turnQuiz.token;if(turnQuiz.side==='player')s.quizPartySides=correct?10:6;else s.quizEnemySides=correct?6:10;
 render();paintTurnQuiz();if(correct)turnQuiz.closeTimer=setTimeout(finishTurnQuiz,700);
}
function finishTurnQuiz(){
 if(!turnQuiz.active||turnQuiz.phase==='answering')return;
 const state=turnQuiz.state,resume=turnQuiz.resume,side=turnQuiz.side,correct=turnQuiz.phase==='correct';cancelTurnQuiz();
 if(state!==s||s.over)return;
 if(typeof battleBroadcast!=='undefined')battleBroadcast.quizAnswer(correct);
 if(resume)resume();else{s.busy=false;render();if(side==='enemy')enemyAct()}
 if(side==='player'&&s.turn==='player'&&!s.busy&&!s.over)passUnusedActionPoints();
}
function maybeQueueTurnQuiz(){
 if(turnQuiz.active||turnQuiz.queuedTimer||turnQuiz.waitingBanner||s.busy||s.turn!=='player'||s.ap<=0||s.quizAnsweredToken===quizTurnToken()||!quizCanOpen())return;
 const state=s;turnQuiz.queuedTimer=setTimeout(()=>{turnQuiz.queuedTimer=null;if(state===s&&!s.busy)beginTurnQuiz()},0);
}
const bannerBeforeQuiz=showTurnBanner;
showTurnBanner=function(label,done){
 if(!['我方回合','敌方回合'].includes(label))return bannerBeforeQuiz(label,done);
 clearTimeout(turnQuiz.queuedTimer);turnQuiz.queuedTimer=null;const state=s,token=quizTurnToken(),waiting={state,token};turnQuiz.waitingBanner=waiting;
 return bannerBeforeQuiz(label,()=>{
  if(turnQuiz.waitingBanner===waiting)turnQuiz.waitingBanner=null;
  if(state!==s||s.over)return;
  if(s.quizAnsweredToken!==token&&quizCanOpen()&&beginTurnQuiz(()=>{if(done)done();else{s.busy=false;render()}}))return;
  if(done)done();
 });
};
const skillsBeforeQuiz=renderSkills;
renderSkills=function(...args){return turnQuiz.active?renderQuizOptions():skillsBeforeQuiz(...args)};
const renderBeforeQuiz=render;
render=function(...args){const result=renderBeforeQuiz(...args);if(turnQuiz.active){if(turnQuiz.state!==s||s.over)cancelTurnQuiz();else paintTurnQuiz()}else maybeQueueTurnQuiz();return result};
const resetBeforeQuiz=resetBattle;
resetBattle=function(...args){cancelTurnQuiz();turnQuiz.resetting++;try{return resetBeforeQuiz(...args)}finally{turnQuiz.resetting--}};
const partySidesBeforeQuiz=partyDieSides,enemySidesBeforeQuiz=enemyDieSides;
partyDieSides=function(){return cfg.quizEnabled===false?partySidesBeforeQuiz():s.quizPartySides||partySidesBeforeQuiz()};
enemyDieSides=function(){return cfg.quizEnabled===false?enemySidesBeforeQuiz():s.quizEnemySides||enemySidesBeforeQuiz()};
function disableTurnQuizMode(){
 const wasActive=turnQuiz.active,state=turnQuiz.state,resume=turnQuiz.resume,side=turnQuiz.side;
 cfg.quizEnabled=false;delete s.quizPartySides;delete s.quizEnemySides;delete s.quizAnsweredToken;cancelTurnQuiz();
 if(wasActive&&state===s&&!s.over){if(resume)resume();else{s.busy=false;if(side==='enemy')enemyAct()}}
 render();
}
const enemyActBeforeQuiz=enemyAct,beginEnemyBeforeQuiz=beginEnemyTurn,skillBeforeQuiz=useSkill,tooltipBeforeQuiz=showSkillTooltip;
enemyAct=function(...args){if(turnQuiz.active)return;return enemyActBeforeQuiz(...args)};
beginEnemyTurn=function(...args){if(turnQuiz.active)return;return beginEnemyBeforeQuiz(...args)};
useSkill=function(...args){if(turnQuiz.active)return;return skillBeforeQuiz(...args)};
showSkillTooltip=function(...args){if(turnQuiz.active){hideSkillTooltip();return}return tooltipBeforeQuiz(...args)};
document.addEventListener('click',event=>{
 if(!turnQuiz.active)return;
 if(event.target.closest('#quizDisableSecret')&&document.getElementById('chapterOverlay').classList.contains('show'))return;
 if(turnQuiz.phase==='wrong'){event.preventDefault();event.stopImmediatePropagation();finishTurnQuiz();return}
 if(turnQuiz.phase==='answering'&&event.target.closest('.quiz-option'))return;
 event.preventDefault();event.stopImmediatePropagation();
},true);
document.addEventListener('keydown',event=>{
 if(!turnQuiz.active)return;const key=event.key.toUpperCase();
 if(key==='TAB')return;event.preventDefault();event.stopImmediatePropagation();if(event.repeat)return;
 if(turnQuiz.phase==='wrong'&&['ENTER',' '].includes(key))finishTurnQuiz();else if(turnQuiz.phase==='answering'&&'ABCD'.includes(key)&&key.length===1)answerTurnQuiz('ABCD'.indexOf(key));
},true);
// A skipped tutorial or the completed Boss introduction may reveal an already-started player turn.
setInterval(maybeQueueTurnQuiz,300);
maybeQueueTurnQuiz();
