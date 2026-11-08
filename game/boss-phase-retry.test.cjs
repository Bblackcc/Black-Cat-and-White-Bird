const assert=require('node:assert/strict');
const {run,flushUntil,timers,elements}=require('./training-flow.test.cjs');
const value=expr=>JSON.parse(run(`JSON.stringify(${expr})`));
const defeat=()=>run('s.cat=0;s.bird=0;s.busy=false;checkEnd()');
timers.length=0;run('stopTutorial();resetBattle("boss");loadout.cat[2]="stone";s.tanukiUnlocked=true;s.totalDamageDealt=250;s.emberActivations=5;s.diceSpent=28;s.catShield=9;captureBossEntry()');
const first=value('bossEntryCheckpoints[1]');
// Normal phase transitions capture a fresh immutable entry snapshot after party configuration is retained.
run('loadout.bird[2]="maple";s.foxUnlocked=true;s.emberActivations=8;s.diceSpent=52;s.cat=40;s.bird=30;s.catMagicShield=12;s.enemy=0;s.totalDamageDealt=650;checkEnd()');flushUntil('s.bossPhase===2');
const second=value('bossEntryCheckpoints[2]');assert.equal(second.phase,2);assert.equal(second.skills.cat[2],'stone');assert.equal(second.skills.bird[2],'maple');assert.equal(second.state.totalDamageDealt,650);assert.deepEqual(value('bossEntryCheckpoints[1]'),first);
assert.equal(run('s.cat'),40);assert.equal(run('s.bird'),30);
run('loadout.cat[2]="rampart";s.goldUnlocked=true;s.totalDamageDealt=1300;s.emberActivations=15;s.diceSpent=100;s.catShield=1;s.catMagicShield=0');defeat();run('restartBattleAfterEnd()');
assert.equal(elements.get('retryPreviousConfig').hidden,false);assert(elements.get('retryRandomTitle').textContent.includes('6次'));assert(elements.get('retryPreviousTitle').textContent.includes('第1阶段'));
elements.get('retryEntryConfig').onclick();assert.equal(run('s.bossPhase'),2);assert.deepEqual(value('loadout'),second.skills);assert.equal(run('s.totalDamageDealt'),650);assert.equal(run('s.emberActivations'),8);assert.equal(run('s.catShield'),second.state.catShield);assert.equal(run('s.catMagicShield'),12);assert.equal(run('s.cat'),140);assert.equal(run('s.bird'),120);assert.equal(run('s.ap'),5);assert.equal(run('phaseTwoRemnant()'),false);assert.equal(run('s.phase2CounterHits'),0);
// A second phase-II death can return to the original phase-I entry, not the modified combat loadout.
defeat();run('showBossRetryMenu()');elements.get('retryPreviousConfig').onclick();assert.equal(run('s.bossPhase'),1);assert.deepEqual(value('loadout'),first.skills);assert.equal(run('s.totalDamageDealt'),250);assert.equal(run('bossEntryCheckpoints[2]'),undefined);
// Phase III offers its own entry and the most recent phase-II entry.
timers.length=0;run('s.enemy=0;checkEnd()');flushUntil('s.bossPhase===2');run('loadout.bird[2]="skyfall";s.craneUnlocked=true;s.totalDamageDealt=720;s.emberActivations=9;captureBossEntry()');
const currentSecond=value('bossEntryCheckpoints[2]');run('loadout.cat[3]="mountain";s.goldUnlocked=true;s.emberActivations=15;s.catShield=14;s.enemy=0;s.totalDamageDealt=1250;checkEnd()');flushUntil('s.bossPhase===3');const third=value('bossEntryCheckpoints[3]');
run('loadout.cat[2]=null;loadout.bird[2]=null;s.totalDamageDealt=2000');defeat();run('showBossRetryMenu()');assert(elements.get('retryRandomTitle').textContent.includes('10次'));assert(elements.get('retryPreviousTitle').textContent.includes('第2阶段'));
elements.get('retryEntryConfig').onclick();assert.equal(run('s.bossPhase'),3);assert.deepEqual(value('loadout'),third.skills);assert.equal(run('s.totalDamageDealt'),1250);assert.equal(run('s.catShield'),14);
defeat();run('showBossRetryMenu()');elements.get('retryPreviousConfig').onclick();assert.equal(run('s.bossPhase'),2);assert.deepEqual(value('loadout'),currentSecond.skills);assert.equal(run('s.totalDamageDealt'),720);
// Direct phase links establish fresh checkpoints, so all advertised restart choices are available.
for(const phase of [2,3]){elements.get('chapterBossStage'+phase).onclick();assert.equal(run('s.bossPhase'),phase);assert.equal(run('bossEntryCheckpoints['+phase+'].phase'),phase);assert.equal(run('bossEntryCheckpoints['+(phase-1)+'].phase'),phase-1)}
// Six / ten genuine random blessing selections start in the requested stage with EVERY evolution rank zero.
for(const [phase,count] of [[2,6],[3,10]]){
 timers.length=0;run(`selectBossStage(${phase});s.totalDamageDealt=1600;s.emberActivations=20`);defeat();run('showBossRetryMenu();Math.random=()=>.6');elements.get('retryRandomEmbers').onclick();
 assert.equal(run('s.bossPhase'),phase);assert.equal(run('s.retryPreparing'),true);assert.equal(run('s.totalDamageDealt'),0);assert.equal(run('activatedEmbers()'),0);
 for(let i=0;i<count;i++){
  flushUntil('s.emberPhase==="offer"&&!s.busy');assert.equal(run('s.emberBoon'),'crane');
  for(const id of ['light','heavy','enchant','heal'])assert.equal(run(`evolutionLevel('${id}')`),0);
  if(i===0)run('selectBoonSkill("crane","skyfall");installEquippedSkill(2)');else run('abandonBoonOffer()');
 }
 assert.equal(run('s.retryPreparing'),false);assert.equal(run('s.emberActivations'),count);assert.equal(run('s.emberReady'),0);assert.equal(run('activatedEmbers()'),0);assert.equal(run('s.enemy'),run('cfg.bossStages['+(phase-1)+'].enemyMax'));assert.equal(run('s.totalDamageDealt'),0);assert.equal(run('s.cat'),120);assert.equal(run('s.bird'),100);assert.equal(run('s.ap'),5);
 assert.equal(run('bossEntryCheckpoints['+phase+'].state.evolutionEmberOffset'),count);
 run('s.emberActivations++;s.diceSpent=emberThresholdForActivation(s.emberActivations);syncEmberReady()');assert.equal(run('activatedEmbers()'),1);
 defeat();run('restartBossFromEntry()');assert.equal(run('s.bossPhase'),phase);assert.equal(run('activatedEmbers()'),0);assert.equal(run('loadout.cat[2]'),'skyfall');
}
console.log('PASS: immutable natural phase-II / III entry snapshots, current / previous-stage retries, direct-stage menus, six / ten random grants and genuinely reset evolution.');
