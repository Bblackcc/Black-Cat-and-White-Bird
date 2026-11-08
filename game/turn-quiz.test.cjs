const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {run,context,elements,timers}=require('./training-flow.test.cjs');timers.length=0;
let now=0,serial=0;const tasks=new Map(),listeners={};
context.Date=class extends Date{static now(){return now}};
context.setTimeout=(fn,ms=0)=>{const id=++serial;tasks.set(id,{fn,at:now+ms});return id};
context.setInterval=(fn,ms)=>{const id=++serial;tasks.set(id,{fn,at:now+ms,every:ms});return id};
context.clearTimeout=context.clearInterval=id=>tasks.delete(id);
context.document.addEventListener=(name,fn)=>(listeners[name]??=[]).push(fn);
function advance(ms){const end=now+ms;for(let i=0;i<100000;i++){const next=[...tasks].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next){now=end;return}const [id,t]=next;now=t.at;if(t.every)t.at+=t.every;else tasks.delete(id);t.fn()}throw Error('timer loop')}
run('stopTutorial();Math.random=()=>.9');
for(const file of ['battle-broadcast.js','quiz-bank.js','turn-quiz.js'])vm.runInContext(fs.readFileSync(require.resolve('./'+file),'utf8'),context);
run('const quizRealEnemyAct=enemyAct;let quizEnemyActions=0;enemyAct=()=>{quizEnemyActions++}');
function setup(mode='puppet',phase=1){run(`cancelTurnQuiz();stopTutorial();cfg.partyDieSides=6;cfg.enemyDieSides=10;resetBattle('${mode}',${phase});s.cat=10000;s.bird=10000;quizEnemyActions=0`);advance(1350);assert.equal(run('turnQuiz.active'),true)}
function correct(){run('answerTurnQuiz(turnQuiz.question.answer)');advance(700)}
function wrong(){run('answerTurnQuiz((turnQuiz.question.answer+1)%4)')}
function clickAnywhere(){const event={target:{closest:()=>null},preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};listeners.click.at(-1)(event);return event}
assert.equal(run('quizQuestionBank.length'),100);assert.equal(run('quizQuestionBank.every((q,i)=>q.id===i+1&&q.options.length===4&&q.answer>=0&&q.answer<4&&q.explanation.length>0)'),true);
assert.equal(run('new Set(Array.from({length:100},()=>drawQuizQuestion().id)).size'),100);run('const lastBagQuestion=turnQuiz.lastQuestion;drawQuizQuestion()');assert.notEqual(run('turnQuiz.lastQuestion'),run('lastBagQuestion'));
// Initial player turns pause before spending AP, with exactly four answer buttons.
setup();assert.equal(run('s.ap'),4);assert.equal(run('s.busy'),true);assert.equal(elements.get('skillButtons').children.length,4);
for(let i=0;i<4;i++){assert.equal(elements.get('skillButtons').children[i].children.length,1);assert.equal(elements.get('skillButtons').children[i].children[0].textContent,'ABCD'[i]);assert.equal(elements.get('quizChoicesText').children[i].children[1].textContent,run(`turnQuiz.question.options[${i}]`))}
assert.equal(elements.get('quizTimer').hidden,true);assert.equal(elements.get('quizQuestion').textContent,run('turnQuiz.question.question'));
run('useSkill("light","cat");render()');assert.equal(run('s.ap'),4);assert.equal(run('turnQuiz.active'),true);
run('answerTurnQuiz(turnQuiz.question.answer)');assert.equal(run('turnQuiz.phase'),'correct');assert(elements.get('skillButtons').children[run('turnQuiz.question.answer')].classList.contains('quiz-correct'));
advance(699);assert.equal(run('turnQuiz.active'),true);advance(1);assert.equal(run('turnQuiz.active'),false);assert.equal(run('s.busy'),false);assert.equal(run('partyDieSides()'),10);assert.equal(run('cfg.partyDieSides'),6);
run('Math.random=()=>.999;render()');advance(400);assert.equal(run('rollPartyDie()'),10);assert.equal(run('turnQuiz.active'),false);assert(!elements.get('skillButtons').children[0].classList.contains('quiz-option'));
// Wrong answers remain visible, mark both selected and correct choices, and consume the dismissal click.
setup();wrong();assert.equal(run('partyDieSides()'),6);assert.equal(run('turnQuiz.phase'),'wrong');assert.equal(elements.get('quizExplanation').hidden,false);
assert(elements.get('skillButtons').children[run('turnQuiz.selected')].classList.contains('quiz-wrong'));assert(elements.get('skillButtons').children[run('turnQuiz.question.answer')].classList.contains('quiz-correct'));
assert.match(elements.get('quizFeedback').textContent,/正确答案/);assert.match(elements.get('quizExplanation').textContent,/解析：/);advance(40000);assert.equal(run('turnQuiz.active'),true);
const dismissal=clickAnywhere();assert(dismissal.prevented&&dismissal.stopped);assert.equal(run('turnQuiz.active'),false);assert.equal(run('s.ap'),4);
// Enemy turns cannot act during the 30-second question or while wrong-answer feedback is open.
setup('boss',3);correct();run('startEnemyTurn()');advance(1350);assert.equal(run('turnQuiz.side'),'enemy');assert.equal(run('quizEnemyActions'),0);assert.match(elements.get('quizTimer').textContent,/30/);
run('answerTurnQuiz(turnQuiz.question.answer)');assert.equal(run('enemyDieSides()'),6);advance(700);assert.equal(run('quizEnemyActions'),1);assert.equal(run('cfg.enemyDieSides'),10);
run('syncChapterSettings()');assert.equal(Number(elements.get('enemyDieSides').value),10);assert.equal(run('partyDieSides()'),10);
setup();correct();run('startEnemyTurn()');advance(1350);wrong();advance(31000);assert.equal(run('quizEnemyActions'),0);assert.equal(run('enemyDieSides()'),10);clickAnywhere();assert.equal(run('quizEnemyActions'),1);
setup();correct();run('startEnemyTurn()');advance(1350);advance(29999);assert.equal(run('turnQuiz.phase'),'answering');advance(1);assert.equal(run('turnQuiz.phase'),'wrong');assert.equal(run('turnQuiz.selected'),null);assert.match(elements.get('quizFeedback').textContent,/超时/);assert.equal(run('quizEnemyActions'),0);clickAnywhere();assert.equal(run('quizEnemyActions'),1);
// A late click cannot beat the absolute deadline even before the next countdown tick.
setup();correct();run('startEnemyTurn()');advance(1350);now=run('turnQuiz.deadline');run('answerTurnQuiz(turnQuiz.question.answer)');assert.equal(run('turnQuiz.phase'),'wrong');assert.equal(run('turnQuiz.selected'),null);
// New turns re-answer independently; resetting cancels stale timeout / continuation callbacks.
setup();correct();run('startEnemyTurn()');advance(1350);correct();run('beginPlayerTurn()');advance(1350);assert.equal(run('turnQuiz.side'),'player');assert.equal(run('partyDieSides()'),6);correct();assert.equal(run('partyDieSides()'),10);
setup();correct();run('startEnemyTurn()');advance(1350);run('resetBattle("boss",2)');advance(1350);const newQuestion=run('turnQuiz.question.id');advance(31000);assert.equal(run('turnQuiz.side'),'player');assert.equal(run('turnQuiz.question.id'),newQuestion);assert.equal(run('turnQuiz.phase'),'answering');assert.equal(run('quizEnemyActions'),0);
// Tutorial narration is not interrupted; its free-play turn is eligible once narration ends.
run('cancelTurnQuiz();startTutorial()');advance(1500);assert.equal(run('turnQuiz.active'),false);run('tutorial.index=28;tutorial.fading=false;s.ap=4;s.busy=false;render()');advance(1);assert.equal(run('turnQuiz.active'),true);
// A phase change within an answered turn does not ask twice or lose the turn's dice result.
setup('boss',1);correct();run('s.targetIndex=0;s.enemy=0;checkEnd()');advance(1800);assert.equal(run('s.bossPhase'),2);assert.equal(run('turnQuiz.active'),false);assert.equal(run('partyDieSides()'),10);
// Real autonomous puppet combat returns to a fresh player question rather than racing ahead.
setup();correct();run('enemyAct=quizRealEnemyAct;startEnemyTurn()');advance(1350);assert.equal(run('turnQuiz.side'),'enemy');correct();advance(15000);assert.equal(run('s.turn'),'player');assert.equal(run('s.round'),2);assert.equal(run('turnQuiz.active'),true);
// Answer reactions appear after feedback closes, using the normal speaker / rare-line settings.
run('enemyAct=()=>{quizEnemyActions++}');
for(const speaker of ['ximo','tiaoyao']){
 setup();run(`battleBroadcast.setMode('${speaker}');Math.random=()=>.1`);correct();advance(200);assert.equal(run('battleBroadcast.current.type'),'quizCorrect');assert.equal(elements.get('broadcastText').textContent,run(`battleBroadcastLines.${speaker}.lines.quizCorrect[0]`));
 setup();run(`battleBroadcast.setMode('${speaker}');Math.random=()=>.9`);wrong();advance(1000);assert.equal(run('battleBroadcast.current'),null);clickAnywhere();advance(200);assert.equal(run('battleBroadcast.current.type'),'quizWrong');assert.equal(elements.get('broadcastText').textContent,run(`battleBroadcastLines.${speaker}.lines.quizWrong[1]`));
 for(const ok of [true,false]){
  setup();run(`battleBroadcast.setMode('${speaker}');Math.random=()=>.01`);if(ok)correct();else{wrong();clickAnywhere()}advance(200);
  const type=ok?'specialQuizCorrect':'specialQuizWrong';assert.equal(run('battleBroadcast.current.type'),type);assert.equal(elements.get('broadcastText').textContent,run(`battleBroadcastLines.${speaker}.lines.${type}[0]`));assert.equal(run('battleBroadcast.queue.length'),0);
 }
}
setup();run('battleBroadcast.setMode("both");battleBroadcast.lastSpeaker=null;Math.random=()=>.1');correct();advance(200);assert.equal(run('battleBroadcast.lastSpeaker'),'ximo');
setup();run('battleBroadcast.setMode("both");Math.random=()=>.1');wrong();clickAnywhere();advance(200);assert.equal(run('battleBroadcast.lastSpeaker'),'tiaoyao');
setup();run('battleBroadcast.setMode("off")');correct();advance(200);assert.equal(run('battleBroadcast.current'),null);assert.equal(run('partyDieSides()'),10);
// Enemy results react immediately even if the resumed enemy action is animating.
setup();correct();run('startEnemyTurn()');advance(1350);run('battleBroadcast.setMode("ximo");Math.random=()=>.1');wrong();clickAnywhere();run('battleBroadcast.beginAction("enemy")');advance(200);assert.equal(run('battleBroadcast.current.type'),'quizWrong');
console.log('PASS: letter-only skill buttons, question options above, answer reactions / rare lines / speaker modes, 100-question bank, turn dice, timed pause and lifecycle.');
