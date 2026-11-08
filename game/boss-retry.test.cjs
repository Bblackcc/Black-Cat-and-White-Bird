const assert=require('node:assert/strict');
const {run,flushUntil,elements,timers}=require('./training-flow.test.cjs');
const value=code=>JSON.parse(run(`JSON.stringify(${code})`));
const defeat=()=>run('s.cat=0;s.bird=0;s.busy=false;checkEnd()');
timers.length=0;
// Capture the actual training loadout after it is restored into the Boss encounter.
run(`stopTutorial();resetBattle('puppet');loadout.cat[2]='stone';loadout.bird[2]='maple';s.tanukiUnlocked=true;s.foxUnlocked=true;s.totalDamageDealt=450;s.emberActivations=8;s.diceSpent=46;s.catShield=7;s.birdMagicShield=9;s.enemies.forEach(e=>e.hp=0);checkEnd()`);
flushUntil('s.battleMode==="boss"');run('stopTutorial();s.busy=false');timers.length=0;
assert.deepEqual(value('bossEntryCheckpoint.skills.cat'),['light','heavy','stone',null]);
assert.equal(run('bossEntryCheckpoint.state.totalDamageDealt'),450);
const checkpoint=value('bossEntryCheckpoint');
defeat();run('restartBattleAfterEnd()');assert.equal(elements.get('bossRetryOverlay').hidden,false);
run('showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip'),null);
elements.get('retryCancel').onclick();assert.equal(elements.get('bossRetryOverlay').hidden,true);assert.equal(run('s.over'),true);
run(`s.bossPhase=3;loadout.cat[2]='rampart';loadout.bird[2]=null;s.totalDamageDealt=1500;s.emberActivations=20;s.catShield=0;s.birdMagicShield=0;restartBattleAfterEnd()`);
elements.get('retryEntryConfig').onclick();
assert.equal(elements.get('bossRetryOverlay').hidden,true);assert.equal(run('s.bossPhase'),1);assert.equal(run('s.turn'),'player');assert.equal(run('s.over'),false);
assert.deepEqual(value('loadout'),checkpoint.skills);assert.equal(run('s.totalDamageDealt'),450);assert.equal(run('s.emberActivations'),8);
assert.equal(run("evolutionLevel('light')"),2);assert.equal(run("evolutionLevel('heavy')"),1);assert.equal(run("evolutionLevel('enchant')"),2);
assert.equal(run('s.cat'),140);assert.equal(run('s.bird'),120);assert.equal(run('s.catShield'),12);assert.equal(run('s.birdMagicShield'),14);assert.equal(run('s.ap'),5);
assert.equal(run('s.enemy'),run('cfg.bossStages[0].enemyMax'));
// A second defeat still uses the entry checkpoint, not the first retry's combat changes.
run("loadout.cat[2]=null;s.totalDamageDealt=999");defeat();run('restartBossFromEntry()');assert.deepEqual(value('bossEntryCheckpoint'),checkpoint);assert.equal(run('s.totalDamageDealt'),450);assert.equal(run('loadout.cat[2]'),'stone');
// Three real random D4 offers start from the four original skills and zero evolution.
timers.length=0;defeat();run('restartBattleAfterEnd();const randomBeforeRetry=Math.random;Math.random=()=>.6');elements.get('retryRandomEmbers').onclick();
assert.equal(run('s.retryPreparing'),true);assert.equal(run('s.totalDamageDealt'),0);assert.deepEqual(value('loadout.cat'),['light','heavy',null,null]);assert.deepEqual(value('loadout.bird'),['enchant','heal',null,null]);
flushUntil('s.emberPhase==="offer"&&!s.busy');assert.equal(run('s.emberBoon'),'crane');run("selectBoonSkill('crane','skyfall');installEquippedSkill(2)");
flushUntil('s.emberPhase==="offer"&&!s.busy');run('abandonBoonOffer()');
flushUntil('s.emberPhase==="offer"&&!s.busy');run('abandonBoonOffer();Math.random=randomBeforeRetry');
assert.equal(run('s.retryPreparing'),false);assert.equal(run('s.emberActivations'),3);assert.equal(run('s.emberReady'),0);assert.equal(run('s.diceSpent'),14);assert.equal(run('s.totalDamageDealt'),0);
assert.equal(run('s.enemy'),run('cfg.bossStages[0].enemyMax'));assert.equal(run('s.shield'),run('cfg.bossStages[0].shield'));assert.equal(run('s.magicShield'),run('cfg.bossStages[0].magicShield'));
for(const id of ['light','heavy','enchant','heal'])assert.equal(run(`evolutionLevel('${id}')`),0);
assert.equal(run('s.cat'),120);assert.equal(run('s.bird'),100);assert.equal(run('s.ap'),5);assert.equal(run('bossEntryCheckpoint.skills.cat[2]'),'skyfall');
run("loadout.cat[2]=null;s.totalDamageDealt=1600");defeat();run('restartBossFromEntry()');assert.equal(run('loadout.cat[2]'),'skyfall');assert.equal(run('s.totalDamageDealt'),0);assert.equal(run('s.emberActivations'),3);
// Retry handlers cannot reset a live fight.
run('s.cat=51;restartBossWithEmbers();restartBossFromEntry()');assert.equal(run('s.cat'),51);
console.log('PASS: Boss entry checkpoint, repeated restore, three random blessings, abandoned grants, zero preparation damage, fresh evolution and live-fight guards.');
