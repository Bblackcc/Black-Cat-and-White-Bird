const assert=require('node:assert/strict');
const {run,flushUntil,timers,elements}=require('./training-flow.test.cjs');
function fresh(mode='puppet',phase=1){timers.length=0;run(`stopTutorial();cfg.debugControlsUnlocked=false;resetBattle('${mode}',${phase});s.busy=false`)}
fresh();assert.equal(run('document.querySelector(".settings").hidden'),true);
run('toggleChapterMenu(true)');assert.equal(run('document.querySelector(".settings").hidden'),true);run('toggleChapterMenu(false)');
run('s.cat=0;checkEnd();render()');assert.equal(run('document.querySelector(".settings").hidden'),true,'one fallen ally is not a team defeat');
run('s.bird=0;checkEnd()');assert.equal(run('document.querySelector(".settings").hidden'),false);assert.equal(run('cfg.debugControlsUnlocked'),true);
run('resetBattle("boss",1)');assert.equal(run('document.querySelector(".settings").hidden'),false,'unlock survives a scene reset');
// Natural story progression does not unlock debug controls on a fresh playthrough.
fresh();run('s.enemies.forEach(enemy=>enemy.hp=0);checkEnd()');flushUntil('s.battleMode==="boss"');assert.equal(run('document.querySelector(".settings").hidden'),true);
run('stopTutorial();s.busy=false');
for(const phase of [2,3]){run('s.enemies[0].hp=0;checkEnd()');flushUntil(`s.bossPhase===${phase}&&!s.over`);assert.equal(run('document.querySelector(".settings").hidden'),true)}
fresh('boss');run('s.cat=0;s.bird=0;checkEnd()');assert.equal(run('document.querySelector(".settings").hidden'),false);
fresh('boss',2);run('s.cat=0;s.bird=0;checkEnd()');assert.equal(run('document.querySelector(".settings").hidden'),false);
fresh('boss',3);run('s.cat=0;s.bird=0;checkEnd()');assert.equal(run('document.querySelector(".settings").hidden'),false);
// Every chapter entry route, including the tutorial replay, reveals the control panel.
fresh();run('selectChapter("boss")');assert.equal(run('document.querySelector(".settings").hidden'),false);
fresh();run('selectBossStage(2)');assert.equal(run('document.querySelector(".settings").hidden'),false);
fresh();run('selectBossStage(3)');assert.equal(run('document.querySelector(".settings").hidden'),false);
fresh();run('replayButton.onclick()');assert.equal(run('document.querySelector(".settings").hidden'),false);run('stopTutorial()');
// Phase-III damage indication restarts the dragon hit effect for HP and both shield types.
fresh('boss',3);run('document.getElementById("puppet").classList.remove("hit");showEnemyDamage(0,0,0)');assert(!elements.get('puppet').classList.contains('hit'));
for(const damage of [[1,0,0],[0,2,0],[0,0,3]]){run(`document.getElementById('puppet').classList.remove('hit');showEnemyDamage(${damage.join(',')})`);assert(elements.get('puppet').classList.contains('hit'))}
run('document.getElementById("puppet").classList.remove("hit");phaseThreeSummonSoldiers([3,4]);s.targetIndex=1;showEnemyDamage(1,0,0)');assert(!elements.get('puppet').classList.contains('hit'),'hitting a soldier does not shake the dragon');
run('stopTutorial()');
console.log('PASS: debug panel hides on first story entry, unlocks after defeat / menu entry, and phase-III HP / physical / magic hits animate the correct target.');
