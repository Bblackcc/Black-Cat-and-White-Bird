/* Non-blocking battle commentary. Speaker / event names stay out of the dialogue. */
const battleBroadcastLines={
 ximo:{avatar:'assets/ximo-avatar.png',lines:{
  encourage:['接敌，准备迎战！','能和大家一起同行…真的很开心。'],
  special:['这样的战斗方式吗…真是…受益匪浅…'],
  combat:['向着敌人，冲锋！','尝尝这个！','这招怎么样！','抱歉哦，这下会很疼的！'],
  specialCombat:['...你会喜欢这招的...','哈！我喜欢这招！'],
  hit:['没事吧！？','能顶住...','...绝不后退！','...有点耍赖了吧...'],
  specialHit:['...不能永远依靠她...汐霂，想想办法！','...我们不是第一次承受痛苦...'],
  advantage:['真棒！就这样一鼓作气！'],disadvantage:['别放弃！还有机会…'],
  warning:['…有种不好的预感…'],heal:['…别慌！会没事的…'],
  idle:['如果是她的话…会怎么处理呢…？','要是她在就好了…'],
  tanuki:['狸猫…是很勇敢的孩子呢…'],fox:['红狐姐…温柔而火热的…'],
  crane:['白鹤姐…不太好相处诶…气质上有点像某个人呢…'],
  gold:['金毛…会有很多人喜欢这样好相处的孩子吧…'],allBoons:['...组一辈子乐队？'],
  debugHint:['...嗯咳咳...右侧有一个神秘的小按钮，如果实在打不过的话...'],
  debugHealth:['...血脉...觉醒吧！'],debugDice:['...命运...逆转吧！'],debugBoon:['...灵魂...重燃吧！'],
  debugSpecial:['...嘘...这可是我偷偷告诉你的，可别告诉她哦~'],
  quizCorrect:['真棒！','哼哼，这下给他们点颜色瞧瞧！'],quizWrong:['...没关系的，还有机会。','这下要小心了...！'],
  specialQuizCorrect:['好耶，骰来！'],specialQuizWrong:['哦不，骰去！'],quizDisabled:['（失望地看着你）']
 }},
 tiaoyao:{avatar:'assets/tiaoyao-avatar.png',lines:{
  encourage:['…打起精神。','…准备就绪。'],special:['哈…还不赖。再来啊！'],
  combat:['...不错的战术。','...这招很强。','...有进步。','...冲锋吧...一往无前。'],
  specialCombat:['...就知道你会喜欢...','...不错嘛，蛮有水准的...'],
  hit:['...无伤大雅。','...还能继续。','...会没事的。','...你等下回合的...'],
  specialHit:['...真是无能啊...岧峣...','...你当时...也是承受着这样的痛苦吗...'],
  advantage:['不错的战果，继续。'],disadvantage:['…真是被看扁了啊…'],
  warning:['…小心点！有什么要来了…'],heal:['…还疼吗？…这下应该会好很多…'],
  idle:['如果是她的话…应该会这样做吧…','真希望她还在啊…'],
  tanuki:['吟游...细腻但寡断…'],fox:['牧师...柔和但易碎…'],crane:['隐士...自由但尖锐…'],gold:['骑士...无畏但冲动…'],allBoons:['...我已启动。'],
  debugHint:['...（暗示地向右侧看看）'],debugHealth:['...喔，这么高。'],debugDice:['...嚯，也行吧。'],debugBoon:['...哇，这么强。'],
  debugSpecial:['...好了...别拿那种眼神看我...我不是...还是希望你的作品能被好好对待...完全打不过？那...那开一下就开一下吧。'],
  quizCorrect:['...还挺厉害嘛。','哇哦...'],quizWrong:['...别掉以轻心...！','下回合别这样了...'],
  specialQuizCorrect:['看来不需要我帮忙了。'],specialQuizWrong:['... 要我帮你吗？'],quizDisabled:['...真是肮脏的黑客啊。']
 }}
};
const broadcastCard=document.createElement('aside');broadcastCard.id='battleBroadcast';broadcastCard.hidden=true;
broadcastCard.setAttribute('role','status');broadcastCard.setAttribute('aria-live','polite');
broadcastCard.innerHTML='<div id="broadcastPortrait"><img id="broadcastAvatar" alt=""></div><p id="broadcastText"></p>';document.getElementById('game').appendChild(broadcastCard);
const broadcastSettings=document.createElement('div');broadcastSettings.className='broadcast-settings';
broadcastSettings.innerHTML='<label for="broadcastMode">战斗播报</label><select id="broadcastMode"><option value="both">两人轮流</option><option value="ximo">仅汐霂</option><option value="tiaoyao">仅岧峣</option><option value="off">关闭播报</option></select>';
document.querySelector('.chapter-card').appendChild(broadcastSettings);

const broadcastIdleDelay=120000,broadcastSpecialChance=.08;
function broadcastNarrativeActive(){return tutorial.active||tutorial.fading||tutorial.transitioning}
function broadcastBlocked(entry){const hint=entry?.type==='debugHint'&&s.over&&s.battleMode==='boss'&&s.cat<=0&&s.bird<=0,secret=entry?.type==='quizDisabled';return !secret&&(broadcastNarrativeActive()||typeof turnQuiz!=='undefined'&&turnQuiz.active||(s.over&&!hint)||s.retryPreparing||!!s.emberPhase||!!s.equipSkill||document.getElementById('phaseTransition').classList.contains('active')||(document.getElementById('chapterOverlay').classList.contains('show')&&entry?.type!=='allBoons')||document.querySelector('.settings').open||(!hint&&document.getElementById('bossRetryOverlay')?.hidden===false))}
function isQuizBroadcast(type){return ['quizCorrect','quizWrong','specialQuizCorrect','specialQuizWrong'].includes(type)}
function dragonAttackImminent(){if(typeof dragonPhaseThree==='function'&&dragonPhaseThree()){const next=(s.phase3Turn||0)+1;return next===1||next%3===0||next%4===0||next%5===0||(s.phase3Required?.length||0)>0}const next=(s.dragonTurn||0)+1;return (dragonPhaseOne()||typeof dragonPhaseTwo==='function'&&dragonPhaseTwo())&&next%3===0&&s.dragonApocTurn!==next}
// Reserve the protruding portrait as well as the panel, leaving the location and AP readable.
function broadcastPlacement(game,turn,title){
 const place=(left,top,width)=>{left=Math.max(24,left-48);if(left-18<=title.right-game.left)top=Math.max(top,title.bottom-game.top+30);return{left,top,width}};
 const right=turn.left-game.left-20,leftLimit=title.right-game.left+36,space=right-leftLimit;
 if(space>=260){const width=Math.min(400,space);return place(right-width,turn.top-game.top+32,width)}
 if(right>=284){const width=Math.min(360,right-44);return place(right-width,Math.max(turn.top+32,title.bottom+34)-game.top,width)}
 return place(32,Math.max(turn.bottom,title.bottom)-game.top+38,Math.max(120,Math.min(360,game.width-52)));
}
function broadcastDuration(line){return Math.min(3400,Math.max(2200,line.length*85))}
function positionBattleBroadcast(){
 const game=document.getElementById('game').getBoundingClientRect(),turn=document.querySelector('.turn').getBoundingClientRect(),title=document.querySelector('.title').getBoundingClientRect();
 const position=broadcastPlacement(game,turn,title);if(broadcastCard.classList.contains('defeat-hint')||broadcastCard.classList.contains('secret-quiz')||broadcastCard.classList.contains('menu-comment')){position.left+=game.left;position.top+=game.top}for(const key of ['left','top','width'])broadcastCard.style[key]=position[key]+'px';
}
class BattleBroadcastController{
 constructor(){this.mode='both';this.lastSpeaker=null;this.queue=[];this.current=null;this.until=0;this.flushAt=0;this.flushTimer=null;this.hideTimer=null;this.fadeTimer=null;this.fadingOut=false;this.enemyHits=null;this.idleSince=Date.now();this.enemyBrokeShield=false;this.resetting=false;this.batches=new Map();this.pendingSkill=null;this.pendingEnemyAction=null;this.action=null;this.installingBoon=0;this.bossDeaths=0;this.defeatedStates=new WeakSet();this.outsideGame=false;this.secretSpeakers=[];this.secretNarrative=false}
 clear(){for(const scope of [this.action,this.pendingSkill?.scope,this.pendingEnemyAction,...this.queue.map(item=>item.scope)])if(scope)scope.committed=true;for(const timer of this.batches.values())clearTimeout(timer);this.batches.clear();clearTimeout(this.flushTimer);clearTimeout(this.hideTimer);clearTimeout(this.fadeTimer);this.flushTimer=null;this.hideTimer=null;this.fadeTimer=null;this.fadingOut=false;this.flushAt=0;this.queue=[];this.current=null;this.until=0;this.pendingSkill=null;this.pendingEnemyAction=null;this.action=null;broadcastCard.hidden=true;broadcastCard.classList.remove('visible','leaving','defeat-hint','secret-quiz','menu-comment');this.secretSpeakers=[];this.secretNarrative=false;if(this.outsideGame){document.getElementById('game').appendChild(broadcastCard);this.outsideGame=false}}
 reset(){this.clear();clearTimeout(this.enemyHits?.implicitTimer);this.enemyHits=null;this.enemyBrokeShield=false;this.idleSince=Date.now()}
 setMode(mode){if(!['both','ximo','tiaoyao','off'].includes(mode))return;this.mode=mode;this.clear();this.idleSince=Date.now();document.getElementById('broadcastMode').value=mode;try{localStorage.setItem('blackCatBroadcastMode',mode)}catch{}}
 beginAction(kind){const scope={state:s,kind,resolving:true,committed:false};this.action=scope;return scope}
 beginEnemyHits(){clearTimeout(this.enemyHits?.implicitTimer);this.enemyHits={state:s,count:0,closed:false,implicit:null,implicitTimer:null}}
 recordEnemyHit(){
  if(!this.enemyHits||this.enemyHits.state!==s||this.enemyHits.closed)this.beginEnemyHits();
  const turn=this.enemyHits;let scope=this.action?.kind==='enemy'?this.action:null;
  // Direct multi-target damage helpers have no enclosing action; coalesce their synchronous hits.
  if(!scope){if(!turn.implicit){turn.implicit={state:s,kind:'enemyHit',resolving:false,committed:false};turn.implicitTimer=setTimeout(()=>{turn.implicit=null;turn.implicitTimer=null},160)}scope=turn.implicit}
  if(scope.hitCounted)return;scope.hitCounted=true;scope.hitTurn=turn;turn.count++;
  if(turn.count===1){scope.hitMoment='first';this.batch('hit',scope)}
 }
 finishEnemyHits(){
  const turn=this.enemyHits;if(!turn||turn.state!==s||turn.closed)return;turn.closed=true;
  // We know the last ACTUAL damaging attack only once the enemy has finished acting.
  if(turn.count>1)this.variant('hit',{state:s,kind:'enemyLastHit',resolving:false,committed:false,hitTurn:turn,hitMoment:'last'});
 }
 fadeOut(expected=this.current){
  if(!expected||this.current!==expected||this.fadingOut)return;
  clearTimeout(this.hideTimer);this.hideTimer=null;this.fadingOut=true;broadcastCard.classList.remove('visible');broadcastCard.classList.add('leaving');
  this.fadeTimer=setTimeout(()=>{if(this.current!==expected||!this.fadingOut)return;this.current=null;this.fadingOut=false;this.fadeTimer=null;broadcastCard.hidden=true;broadcastCard.classList.remove('leaving');if(expected.type==='quizDisabled')this.nextSecretQuizLine();this.pump()},220);
 }
 emit(type,scope=this.action){
  if(this.secretNarrative&&type!=='quizDisabled')return;
  if(this.resetting||this.mode==='off'||(broadcastNarrativeActive()&&type!=='quizDisabled')||(s.over&&!['debugHint','quizDisabled'].includes(type))||!battleBroadcastLines.ximo.lines[type]||scope&&(scope.committed||scope.state!==s))return;
  const priority=type==='allBoons'?20:type==='quizDisabled'?170:type==='debugHint'?160:type.startsWith('debug')?150:['tanuki','fox','crane','gold'].includes(type)?120:type==='warning'?110:isQuizBroadcast(type)?100:type==='disadvantage'?95:['hit','specialHit'].includes(type)?90:type==='advantage'?70:type==='heal'?60:['combat','specialCombat'].includes(type)?50:type==='idle'?0:10;
  const group=isQuizBroadcast(type)?'quiz':type.startsWith('debug')?'debug':['combat','specialCombat'].includes(type)?'combat':['hit','specialHit'].includes(type)?'hit':type;
  if(this.queue.some(item=>item.group===group))return;
  this.queue.push({type,priority,group,scope});this.queue.sort((a,b)=>b.priority-a.priority);
  // Let same-resolution callbacks converge before choosing ONE line, including 160ms hit batches.
  if(this.flushTimer===null){this.flushAt=Date.now()+200;this.flushTimer=setTimeout(()=>{this.flushTimer=null;this.pump()},200)}
  this.pump();
 }
 variant(type,scope=this.action){const rare={combat:'specialCombat',hit:'specialHit',quizCorrect:'specialQuizCorrect',quizWrong:'specialQuizWrong'}[type];this.emit(rare&&Math.random()<broadcastSpecialChance?rare:type,scope)}
 secretQuizDisabled(){if(this.mode==='off')return;this.clear();this.secretNarrative=true;this.secretSpeakers=[this.mode==='both'?(Math.random()<.5?'ximo':'tiaoyao'):this.mode];this.nextSecretQuizLine()}
 nextSecretQuizLine(){const speaker=this.secretSpeakers.shift();if(!speaker){this.secretNarrative=false;return}this.emit('quizDisabled',null);const line=this.queue.find(item=>item.type==='quizDisabled');if(line)line.forcedSpeaker=speaker}
 quizAnswer(correct){if(this.mode==='off')return;this.clear();this.variant(correct?'quizCorrect':'quizWrong',null)}
 debugReview(type){if(this.mode==='off'||broadcastNarrativeActive())return;this.clear();const special=Math.random()<broadcastSpecialChance;if(type||special)this.emit(special?'debugSpecial':type,null)}
 noteBossDefeat(){
  if(this.resetting||!s.over||s.battleMode!=='boss'||s.cat>0||s.bird>0||(s.enemies?s.enemies[0].hp:s.enemy)<=0||this.defeatedStates.has(s))return;
  this.defeatedStates.add(s);this.bossDeaths++;
  if(this.bossDeaths===1||Math.random()<broadcastSpecialChance){this.clear();this.emit('debugHint',null)}
 }
 batch(type,scope=this.action){if(this.resetting||this.batches.has(type))return;const state=s;this.batches.set(type,setTimeout(()=>{this.batches.delete(type);if(s===state)this.variant(type,scope)},160))}
 skillResolved(){
  if(s.busy)return;
  const scope=this.pendingSkill?.scope||this.pendingEnemyAction;if(!scope)return;
  const player=!!this.pendingSkill;this.pendingSkill=null;this.pendingEnemyAction=null;scope.resolving=false;if(this.action===scope)this.action=null;
  if(scope.state===s&&player&&s.turn==='player')this.variant('combat',scope);
 }
 playerTurn(){
  const broken=this.enemyBrokeShield;this.enemyBrokeShield=false;
  const imminent=dragonAttackImminent(),other=this.batches.size>0||this.queue.some(item=>item.priority>=50)||(this.current?.priority>=50&&Date.now()<this.until);
  if(imminent)this.emit('warning');
  if(broken)this.emit('disadvantage');
  if(!broken&&!imminent&&!other)this.emit(Math.random()<broadcastSpecialChance?'special':'encourage');
 }
 pump(){
  const blocked=broadcastBlocked(this.queue[0]||this.current)||this.mode==='off'||this.installingBoon>0,now=Date.now();
  if(this.current&&now>=this.until)this.fadeOut();
  if(blocked){broadcastCard.hidden=true;return}
  if(this.queue.length&&now>=this.flushAt&&this.batches.size===0&&(!this.action?.resolving||isQuizBroadcast(this.queue[0].type)||['quizDisabled','allBoons'].includes(this.queue[0].type))){
   const winner=this.queue[0];for(const item of this.queue)if(item.scope)item.scope.committed=true;this.queue=[];this.flushAt=0;clearTimeout(this.flushTimer);this.flushTimer=null;
   // A visible higher-priority line also wins; discarded lines never replay afterward.
   const lastHitAfterFirst=winner.group==='hit'&&winner.scope?.hitMoment==='last'&&this.current?.group==='hit'&&this.current.scope?.hitMoment==='first'&&this.current.scope.hitTurn===winner.scope.hitTurn;
   if(this.current&&this.current.priority>=winner.priority&&!lastHitAfterFirst){broadcastCard.hidden=false;positionBattleBroadcast();return}
   this.current=winner;const speaker=winner.forcedSpeaker||(this.mode==='both'?(this.lastSpeaker?(this.lastSpeaker==='ximo'?'tiaoyao':'ximo'):(Math.random()<.5?'ximo':'tiaoyao')):this.mode);
   const entry=battleBroadcastLines[speaker],choices=entry.lines[this.current.type],line=choices[Math.floor(Math.random()*choices.length)];this.lastSpeaker=speaker;
   document.getElementById('broadcastAvatar').src=entry.avatar;document.getElementById('broadcastText').textContent=line;
   const hint=winner.type==='debugHint',secret=winner.type==='quizDisabled',menu=winner.type==='allBoons';broadcastCard.classList.toggle('menu-comment',menu);broadcastCard.classList.toggle('defeat-hint',hint);broadcastCard.classList.toggle('secret-quiz',secret);if((hint||secret||menu)&&!this.outsideGame){document.body.appendChild(broadcastCard);this.outsideGame=true}else if(!hint&&!secret&&!menu&&this.outsideGame){document.getElementById('game').appendChild(broadcastCard);this.outsideGame=false}
   const duration=winner.type==='debugSpecial'?Math.max(broadcastDuration(line),Math.min(12000,1600+line.length*95)):broadcastDuration(line);this.until=now+duration;clearTimeout(this.hideTimer);clearTimeout(this.fadeTimer);this.fadeTimer=null;this.fadingOut=false;this.hideTimer=setTimeout(()=>this.fadeOut(winner),duration);broadcastCard.classList.remove('visible','leaving');void broadcastCard.offsetWidth;broadcastCard.classList.add('visible');
  }
  broadcastCard.hidden=!this.current;
  if(this.current)positionBattleBroadcast();
 }
 tick(){
  if(broadcastBlocked(this.queue[0]||this.current)){this.idleSince=Date.now();this.pump();return}
  if(s.turn==='player'&&!s.busy&&Date.now()-this.idleSince>broadcastIdleDelay){this.idleSince=Date.now();this.emit('idle')}
  this.pump();
 }
}
const battleBroadcast=new BattleBroadcastController();
try{const savedMode=localStorage.getItem('blackCatBroadcastMode');if(savedMode)battleBroadcast.setMode(savedMode)}catch{}
document.getElementById('broadcastMode').onchange=event=>battleBroadcast.setMode(event.target.value);

const resetBeforeBroadcast=resetBattle;
resetBattle=function(...args){battleBroadcast.reset();battleBroadcast.resetting=true;try{return resetBeforeBroadcast(...args)}finally{battleBroadcast.resetting=false;battleBroadcast.reset()}};
const playerTurnBeforeBroadcast=beginPlayerTurn;
beginPlayerTurn=function(...args){if(!s.over&&s.turn==='enemy')battleBroadcast.finishEnemyHits();const round=s.round;const result=playerTurnBeforeBroadcast(...args);if(!s.over&&s.turn==='player'&&s.round!==round)battleBroadcast.playerTurn();return result};
const enemyTurnBeforeBroadcast=startEnemyTurn;
startEnemyTurn=function(...args){if(!s.over){battleBroadcast.enemyBrokeShield=false;battleBroadcast.beginEnemyHits()}return enemyTurnBeforeBroadcast(...args)};
const damageAllyBeforeBroadcast=damageAlly;
damageAlly=function(...args){const hit=damageAllyBeforeBroadcast(...args);if(s.turn==='enemy'){if(hit.breaks.length)battleBroadcast.enemyBrokeShield=true;if(hit.hp>0||hit.shield>0)battleBroadcast.recordEnemyHit()}return hit};
const enemyBurnBeforeBroadcast=resolveEnemyBurnTick;
resolveEnemyBurnTick=function(...args){if(!(typeof dragonPhaseThree==='function'&&dragonPhaseThree()))battleBroadcast.finishEnemyHits();return enemyBurnBeforeBroadcast(...args)};
const damageRecordBeforeBroadcast=recordEvolutionDamage;
recordEvolutionDamage=function(state,key,previous,value){damageRecordBeforeBroadcast(state,key,previous,value);if(state===s&&s.turn==='player'&&['shield','magicShield'].includes(key)&&previous>0&&value<=0&&!s.over)battleBroadcast.batch('advantage')};
const healingBeforeBroadcast=applyHealing;
applyHealing=function(...args){const result=healingBeforeBroadcast(...args);if(result.gain>0)battleBroadcast.batch('heal');return result};
const rollBeforeBroadcast=startRoll;
startRoll=function(...args){battleBroadcast.idleSince=Date.now();battleBroadcast.pendingSkill=null;battleBroadcast.beginAction('player');return rollBeforeBroadcast(...args)};
const finishBeforeBroadcast=finishRoll;
finishRoll=function(...args){if(s.turn==='player'&&!s.over){const scope=battleBroadcast.action?.kind==='player'&&battleBroadcast.action.state===s?battleBroadcast.action:battleBroadcast.beginAction('player');battleBroadcast.pendingSkill={scope,id:args[0]}}return finishBeforeBroadcast(...args)};
const enemyMoveBeforeBroadcast=resolveEnemyMove;
resolveEnemyMove=function(...args){battleBroadcast.pendingEnemyAction=battleBroadcast.beginAction('enemy');return enemyMoveBeforeBroadcast(...args)};
const dragonSkillBeforeBroadcast=resolveDragonSkill;
resolveDragonSkill=function(...args){battleBroadcast.pendingEnemyAction=battleBroadcast.beginAction('enemy');return dragonSkillBeforeBroadcast(...args)};
const emberRollBeforeBroadcast=beginEmberRoll;
beginEmberRoll=function(...args){if(s.emberReady>0&&!s.over){s.debugBoonOffer=false;battleBroadcast.clear()}return emberRollBeforeBroadcast(...args)};
const installBeforeBroadcast=installEquippedSkill;
installEquippedSkill=function(index){
 const boon=s.equipBoon,id=s.equipSkill,who=s.selected,debug=!!s.debugBoonOffer;
 if(!id||!boon||!Number.isInteger(index)||index<0||index>=4)return installBeforeBroadcast(index);
 // The underlying installation re-renders with the modal closed before returning.
 // Discard old speech and hold that nested render until the acquired-hero line is registered.
 battleBroadcast.clear();battleBroadcast.installingBoon++;
 try{const result=installBeforeBroadcast(index);if(!s.equipSkill&&loadout[who][index]===id){s.debugBoonOffer=false;if(debug)battleBroadcast.debugReview('debugBoon');else battleBroadcast.emit(boon,null)}return result}
 finally{battleBroadcast.installingBoon--;battleBroadcast.pump()}
};
const renderBeforeBroadcast=render;
render=function(...args){const result=renderBeforeBroadcast(...args);battleBroadcast.noteBossDefeat();battleBroadcast.skillResolved();battleBroadcast.pump();return result};
const settingsBeforeDebugBroadcast=applySettings;
applySettings=function(...args){
 const stats=s.battleMode==='boss'?cfg.bossStages[s.bossPhase-1]:cfg;
 const health=+$('enemyMax').value!==stats.enemyMax||+$('catMax').value!==(s.battleMode==='boss'?cfg.bossCatMax:cfg.catMax)||+$('birdMax').value!==(s.battleMode==='boss'?cfg.bossBirdMax:cfg.birdMax);
 const dice=+$('partyDieSides').value!==cfg.partyDieSides||+$('enemyDieSides').value!==configuredEnemyDieSides();
 const shields=+$('enemyShield').value!==stats.shield||+$('enemyMagicShield').value!==stats.magicShield;
 const result=settingsBeforeDebugBroadcast(...args);if(health||dice||shields)battleBroadcast.debugReview(health?'debugHealth':dice?'debugDice':null);return result;
};
const summonBeforeDebugBroadcast=debugSummonBoon;
debugSummonBoon=function(...args){const allowed=!s.busy&&!s.over&&s.turn==='player',result=summonBeforeDebugBroadcast(...args);if(allowed&&s.emberPhase==='offer')s.debugBoonOffer=true;return result};
const abandonBeforeDebugBroadcast=abandonBoonOffer;
abandonBoonOffer=function(...args){s.debugBoonOffer=false;return abandonBeforeDebugBroadcast(...args)};
window.addEventListener('resize',()=>{if(!broadcastCard.hidden)positionBattleBroadcast()});
setInterval(()=>battleBroadcast.tick(),500);

// A rare menu aside only while all four blessings actually have equipped skills.
const menuBeforeAllBoonsBroadcast=toggleChapterMenu;
toggleChapterMenu=function(...args){
 const overlay=document.getElementById('chapterOverlay'),wasOpen=overlay.classList.contains('show'),result=menuBeforeAllBoonsBroadcast(...args),open=overlay.classList.contains('show');
 if(open&&!wasOpen&&!broadcastNarrativeActive()&&!s.over&&!s.busy&&!battleBroadcast.secretNarrative&&!battleBroadcast.current&&!battleBroadcast.queue.length&&!battleBroadcast.batches.size&&battleBroadcast.mode!=='off'&&['tanuki','fox','crane','gold'].every(talentActive)&&Math.random()<broadcastSpecialChance){battleBroadcast.clear();battleBroadcast.emit('allBoons',null)}
 if(!open&&wasOpen&&(battleBroadcast.current?.type==='allBoons'||battleBroadcast.queue.some(item=>item.type==='allBoons')))battleBroadcast.clear();
 return result;
};
