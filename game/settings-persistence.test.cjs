const assert=require('node:assert/strict');
const {run,flushUntil,timers,elements}=require('./training-flow.test.cjs');
function setup(mode='puppet',phase=1){
 timers.length=0;
 run(`stopTutorial();Object.assign(cfg,{enemyMax:60,shield:8,magicShield:0,catMax:30,birdMax:24,bossCatMax:120,bossBirdMax:100,partyDieSides:6,enemyDieSides:null,puppetCount:2,bossStages:[{enemyMax:300,shield:40,magicShield:30},{enemyMax:420,shield:55,magicShield:50},{enemyMax:600,shield:70,magicShield:80}]});resetBattle('${mode}',${phase});s.busy=false`);
}
function edit(values){run('syncChapterSettings()');for(const [id,value] of Object.entries(values))elements.get(id).value=String(value);run('applySettings()')}
function assertCustom(){
 assert.equal(run('battleStats().enemyMax'),777);assert.equal(run('s.enemies[0].hp'),777);
 assert.equal(run('battleStats().shield'),28);assert.equal(run('s.enemies[0].physical'),28);
 assert.equal(run('battleStats().magicShield'),9);assert.equal(run('s.enemies[0].magic'),9);
 assert.equal(run('maxHp("cat")'),222);assert.equal(run('maxHp("bird")'),188);
 assert.equal(run('cfg.partyDieSides'),10);assert.equal(run('enemyDieSides()'),6);
 assert.equal(Number(elements.get('catMax').value),222);assert.equal(Number(elements.get('enemyMax').value),777);
}
// Editing a single field must not flatten the other chapters' untouched defaults.
setup();edit({catMax:222});assert.equal(run('cfg.bossCatMax'),222);
assert.equal(run('cfg.bossBirdMax'),100);assert.equal(run('cfg.birdMax'),24);
assert.equal(run('cfg.bossStages[1].enemyMax'),420);assert.equal(run('cfg.bossStages[2].shield'),70);
// Explicit overrides follow the real training victory and phase-transition paths.
setup();edit({enemyMax:777,enemyShield:28,enemyMagicShield:9,catMax:222,birdMax:188,partyDieSides:10,enemyDieSides:6});assertCustom();
run('startTutorial()');assertCustom();run('stopTutorial();s.enemies.forEach(enemy=>enemy.hp=0);checkEnd()');flushUntil('s.battleMode==="boss"');
assertCustom();assert.equal(run('s.cat'),222);assert.equal(run('s.bird'),188);run('stopTutorial();s.busy=false');
for(const phase of [2,3]){
 run('s.targetIndex=0;s.enemy=0;checkEnd()');flushUntil(`s.bossPhase===${phase}&&!s.over`);assertCustom();
}
// Retry checkpoints restore loadouts without restoring obsolete settings or dice types.
run('s.cat=0;s.bird=0;checkEnd();restartBossFromEntry(3)');assertCustom();assert.equal(run('s.cat'),222);
for(const [mode,phase] of [['puppet',1],['boss',1],['boss',2],['boss',3]]){run(`selectChapter('${mode}');${phase>1?`selectBossStage(${phase});`:''}`);assertCustom()}
// Editing while a soldier is selected still updates the boss globally, not the soldier template.
run('phaseThreeSummonSoldiers([3,4]);s.targetIndex=1');edit({enemyMax:555,catMax:333,partyDieSides:6,enemyDieSides:10});
assert.equal(run('s.enemies[0].hp'),555);assert.equal(run('cfg.enemyMax'),555);assert.equal(run('cfg.bossStages.every(stage=>stage.enemyMax===555)'),true);
run('selectChapter("puppet");startTutorial()');assert.equal(run('maxHp("cat")'),333);assert.equal(run('cfg.partyDieSides'),6);assert.equal(run('enemyDieSides()'),10);
// Dice-only changes leave all three phase-specific health / shield defaults intact.
setup('boss',2);edit({partyDieSides:10,enemyDieSides:6});
assert.equal(run('cfg.bossStages.map(stage=>stage.enemyMax).join(",")'),'300,420,600');
assert.equal(run('cfg.bossStages.map(stage=>stage.shield).join(",")'),'40,55,70');
assert.equal(run('cfg.catMax'),30);assert.equal(run('cfg.bossCatMax'),120);
console.log('PASS: debug values / dice survive tutorial, training victory, all boss phases, retries and chapter selection; untouched defaults stay independent.');
