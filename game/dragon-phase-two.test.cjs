const assert=require('node:assert/strict');
const {run,flushUntil,timers,elements}=require('./training-flow.test.cjs');
run('const phaseTwoOriginalRandom=Math.random,phaseTwoOriginalFinish=finishDragonAction;let phaseTwoLastText="";finishDragonAction=(text)=>{phaseTwoLastText=text;s.busy=false;clearDragonDice()}');
function setup(turn='enemy'){
 timers.length=0;run(`stopTutorial();resetBattle('boss',2);Math.random=()=>.1;s.turn='${turn}';s.busy=false;s.enemyAp=8;s.enemy=350;s.shield=0;s.magicShield=0;s.cat=500;s.bird=500;s.catShield=0;s.birdShield=0;s.catMagicShield=0;s.birdMagicShield=0`);
}
function skill(id,faces,form){if(form)run(`s.phase2CastForm='${form}'`);run(`s.busy=true;resolveDragonSkill('${id}',${JSON.stringify(faces)})`);flushUntil('!s.busy')}
setup();assert.equal(run('enemyActionDice()'),8);assert.equal(run('enemyDieSides()'),10);run('cfg.enemyDieSides=6');assert.equal(run('enemyDieSides()'),6);run('cfg.enemyDieSides=null');
// Phase II inherits first / last Grasp, using actual shield and HP losses of damage packets.
setup();run('s.enemy=100;s.catShield=5;s.birdShield=5;s.catMagicShield=5;s.birdMagicShield=5;let graspPacketDone=false;runPhaseTwoPackets([{targets:["cat","bird"],physical:10,magic:10,label:"首次"}],()=>graspPacketDone=true)');flushUntil('graspPacketDone');
assert.equal(run('s.shield'),10);assert.equal(run('s.magicShield'),10);assert.equal(run('s.enemy'),120);assert.equal(run('s.dragonDamageEvents'),1);
run('s.enemyAp=1;graspPacketDone=false;runPhaseTwoPackets([{targets:["cat","bird"],physical:2,magic:3,label:"中段"}],()=>graspPacketDone=true)');flushUntil('graspPacketDone');
assert.equal(run('s.enemy'),120);assert.equal(run('s.dragonDamageEvents'),2);
run('s.enemyAp=0;graspPacketDone=false;runPhaseTwoPackets([{targets:["cat","bird"],physical:4,magic:1,label:"末段"},{targets:["cat"],physical:0,magic:0,label:"接管取消"}],()=>graspPacketDone=true)');flushUntil('graspPacketDone');
assert.equal(run('s.enemy'),120);assert.equal(run('s.dragonDamageEvents'),3);
run('s.dragonTurn=1;resolveEnemyBurnTick()');assert.equal(run('s.enemy'),130);assert.equal(run('flushLastDragonGrasp().triggered'),false);
assert.equal(run('s.shield'),10);assert.equal(run('s.magicShield'),10);
setup();run('s.enemy=100;s.enemyAp=0;graspPacketDone=false;runPhaseTwoPackets([{targets:["cat"],physical:5,magic:0,label:"唯一一次伤害"}],()=>graspPacketDone=true)');flushUntil('graspPacketDone');
assert.equal(run('s.enemy'),105);assert.equal(run('flushLastDragonGrasp().triggered'),false);
// End-of-round conversion: no immediate burn damage, then exactly one mature dead-fire D4 heal next round.
setup();
run('s.dragonTurn=1;s.marked=true;s.enemyBurn=4;resolveEnemyBurnTick()');assert.equal(run('s.marked'),false);assert.equal(run('phaseTwoRemnant()'),true);assert.equal(run('s.enemyBurn'),0);assert.equal(run('phaseTwoDeadFire()'),4);assert.equal(run('s.enemy'),350);
timers.length=0;run('loadout.cat[2]="maple";loadout.bird[2]="skyfall";s.foxUnlocked=true;s.craneUnlocked=true;startEnemyTurn();s.cat=30;s.bird=20');timers.length=0;run('resolveEnemyBurnTick()');flushUntil('!s.busy');assert.equal(run('s.enemy'),351);assert.equal(run('phaseTwoDeadFire()'),3);assert.equal(run('s.cat'),30);assert.equal(run('s.bird'),20);assert.equal(run('s.pursuitCount'),0);
// Occupied burn slots constrain ordinary application and Light III; Heavy III remains explicitly uncapped.
setup('player');run('phaseTwoEnemy().deadFire=4;s.pendingBurn=2;s.pendingBurnLayers=3;applyPendingBurn()');assert.equal(run('s.enemyBurn'),1);assert.equal(run('phaseTwoDeadFire()'),4);
run('s.pendingBurnLayers=3;s.pendingBurn=0;applyPendingBurn()');assert.equal(run('s.enemyBurn'),1);
run('resolveBasicAttack("light",1,null,3)');assert.equal(run('s.enemyBurn'),1);run('resolveBasicAttack("heavy",1,1,3)');assert.equal(run('s.enemyBurn'),3);
// Remnant reflects only actual shield losses of the paid attack, to the actor.
setup('player');run('s.cat=100;s.bird=80;s.shield=10;s.magicShield=10;s.totalDamageDealt=400;setPhaseTwoRemnant(true);s.busy=true;finishRoll("light","cat",6,null)');flushUntil('!s.busy');assert.equal(run('s.cat'),85);assert.equal(run('s.bird'),80);assert.equal(run('phaseTwoRemnant()'),false);assert.equal(run('s.shield'),10);assert.equal(run('s.magicShield'),10);
setup('player');run('s.cat=100;setPhaseTwoRemnant(true);s.busy=true;finishRoll("light","cat",3,null)');flushUntil('!s.busy');assert.equal(run('s.cat'),100);assert.equal(run('phaseTwoRemnant()'),true);assert.equal(run('s.shield'),0);
setup('player');run('s.cat=100;s.bird=80;s.shield=100;s.magicShield=100;loadout.bird[2]="starlight";s.craneUnlocked=true;setPhaseTwoRemnant(true);s.busy=true;finishRoll("starlight","bird",3,4)');flushUntil('!s.busy');assert.equal(run('s.cat'),100);assert.equal(run('s.bird'),59);assert.equal(run('s.magicShield'),100);
setup('player');run('s.cat=100;s.bird=80;s.magicShield=100;s.enemyBurn=2;loadout.cat[2]="skyfall";loadout.bird[2]="foxfire";s.craneUnlocked=true;s.foxUnlocked=true;setPhaseTwoRemnant(true);s.busy=true;finishRoll("foxfire","bird",2,null)');flushUntil('!s.busy');assert.equal(run('s.cat'),100);assert.equal(run('s.bird'),66);assert.equal(run('s.magicShield'),100);assert.equal(run('phaseTwoRemnant()'),false);
setup('player');run('s.cat=100;s.shield=30;s.magicShield=30;setPhaseTwoRemnant(true);const heavyClear=resolveBasicAttack("heavy",1,3,3)');assert.equal(run('phaseTwoRemnant()'),false);assert.equal(run('s.cat'),100);assert(run('heavyClear.notes.some(x=>x.includes("清除了残念"))'));
// Reflected shield breaks still trigger Rampart, without reflecting the response again.
setup('player');run('s.cat=100;s.catShield=2;s.shield=30;loadout.cat[2]="rampart";s.goldUnlocked=true;setPhaseTwoRemnant(true);s.busy=true;finishRoll("light","cat",4,null)');flushUntil('!s.busy');assert.equal(run('phaseTwoRemnant()'),false);assert(run('s.phase2CounterHits>=1'));assert(run('s.cat<100'));
// A stolen mark cannot cause either Tanuki response. Normal marks and Brew are counted separately.
setup();run('loadout.cat[2]="brew";s.tanukiUnlocked=true;setPhaseTwoRemnant(true);let reactionDone=false;resolveTanukiReactions([{who:"cat",type:"physical",amount:4}],0,[],()=>reactionDone=true)');assert.equal(run('reactionDone'),true);assert.equal(run('s.phase2CounterHits'),0);assert.equal(run('s.enemy'),350);
setup();run('loadout.cat[2]="brew";s.tanukiUnlocked=true;s.marked=true;reactionDone=false;resolveTanukiReactions([{who:"cat",type:"physical",amount:4},{who:"bird",type:"magic",amount:3}],0,[],()=>reactionDone=true)');flushUntil('reactionDone');assert.equal(run('s.phase2CounterHits'),2);assert.equal(run('s.marked'),true);
// Seal boundaries and the one-round +1 enemy die are based on the previous player turn.
// Remnant owns the mark slot: neither direct marking, Wind nor Brew can create a normal mark.
setup();run('s.marked=true;setPhaseTwoRemnant(true);loadout.cat[2]="brew";s.tanukiUnlocked=true');assert.equal(run('s.marked'),false);
assert.equal(run('installMark()'),false);assert.equal(run('markHealthiestEnemy()'),false);
run('let remnantReactionDone=false;resolveTanukiReactions([{who:"cat",type:"magic",amount:4}],0,[],()=>remnantReactionDone=true)');
assert.equal(run('remnantReactionDone'),true);assert.equal(run('s.phase2CounterHits'),0);assert.equal(run('s.enemy'),350);assert.equal(run('s.marked'),false);assert.equal(run('phaseTwoRemnant()'),true);
setup('player');run('s.cat=100;s.shield=0;loadout.cat[2]="wind";s.tanukiUnlocked=true;setPhaseTwoRemnant(true);s.busy=true;finishRoll("wind","cat",3,null)');flushUntil('!s.busy');
assert.equal(run('s.marked'),false);assert.equal(run('phaseTwoRemnant()'),true);assert.equal(run('s.cat'),100);assert.equal(run('s.shield'),0);
// Wind consumes Remnant only by hitting a shield, then can place a fresh normal mark.
setup('player');run('s.cat=100;s.shield=10;loadout.cat[2]="wind";s.tanukiUnlocked=true;setPhaseTwoRemnant(true);s.busy=true;finishRoll("wind","cat",3,null)');flushUntil('!s.busy');
assert.equal(run('s.cat'),97);assert.equal(run('s.shield'),10);assert.equal(run('phaseTwoRemnant()'),false);assert.equal(run('s.marked'),true);
// Immediate (non-paid) shield hits also reflect once and restore the matching shield only.
setup('player');run('s.cat=100;s.shield=10;s.magicShield=20;setPhaseTwoRemnant(true);damageEnemyPhysical(4)');
assert.equal(run('s.cat'),96);assert.equal(run('s.shield'),10);assert.equal(run('s.magicShield'),20);assert.equal(run('phaseTwoRemnant()'),false);
run('damageEnemyMagic(5)');assert.equal(run('s.cat'),96);assert.equal(run('s.magicShield'),15);assert.equal(run('installMark()'),true);
setup('player');run('s.cat=100;s.catMagicShield=6;s.shield=10;s.magicShield=20;setPhaseTwoRemnant(true);damageEnemyMagic(4)');
assert.equal(run('s.cat'),100);assert.equal(run('s.catMagicShield'),2);assert.equal(run('s.magicShield'),20);assert.equal(run('s.shield'),10);
// HP-only and bypass damage do not trigger Remnant; mixed damage reflects only the shield portion.
setup('player');run('s.cat=100;setPhaseTwoRemnant(true);damageEnemyMagic(4)');assert.equal(run('s.cat'),100);assert.equal(run('s.magicShield'),0);assert.equal(run('phaseTwoRemnant()'),true);
setup('player');run('s.cat=100;s.shield=2;setPhaseTwoRemnant(true);s.busy=true;finishRoll("heavy","cat",2,4)');flushUntil('!s.busy');
assert.equal(run('s.cat'),98);assert.equal(run('s.enemy'),346);assert.equal(run('s.shield'),2);assert.equal(run('phaseTwoRemnant()'),false);
setup('player');run('s.cat=100;setPhaseTwoRemnant(true);damageEnemyPhysical(0)');assert.equal(run('s.cat'),100);assert.equal(run('phaseTwoRemnant()'),true);
// Mark / Brew count separately; crossing each lifetime threshold also takes effect during the turn.
run('let quotaReactionDone=false');
for(const [total,limit] of [[4,3],[5,3],[9,2],[10,2],[14,1],[15,1],[20,1]]){
 setup();run(`loadout.cat[2]="brew";s.tanukiUnlocked=true;s.marked=true;s.phase2CounterHits=${total}`);
 while(!run('phaseTwoRemnant()')){
  run('quotaReactionDone=false;resolveTanukiReactions([{who:"cat",type:"physical",amount:4}],0,[],()=>quotaReactionDone=true)');flushUntil('quotaReactionDone');
 }
 assert.equal(run('s.phase2TurnCounterHits'),limit);assert.equal(run('s.phase2CounterHits'),total+limit);assert.equal(run('s.marked'),false);
 const hp=run('s.enemy');run('quotaReactionDone=false;resolveTanukiReactions([{who:"cat",type:"physical",amount:4}],0,[],()=>quotaReactionDone=true)');flushUntil('quotaReactionDone');
 assert.equal(run('s.enemy'),hp);assert.equal(run('s.phase2CounterHits'),total+limit);assert.equal(run('installMark()'),false);
}
// The quota resets next turn without erasing the lifetime count or the existing Remnant.
run('const lifetimeBeforeReset=s.phase2CounterHits;beginPlayerTurn()');assert.equal(run('s.phase2TurnCounterHits'),0);assert.equal(run('s.phase2CounterHits'),run('lifetimeBeforeReset'));
run('s.magicShield=1;damageEnemyMagic(1);installMark();startEnemyTurn()');timers.length=0;assert.equal(run('s.phase2TurnCounterHits'),0);assert.equal(run('s.marked'),true);
run('quotaReactionDone=false;resolveTanukiReactions([{who:"cat",type:"physical",amount:4}],0,[],()=>quotaReactionDone=true)');flushUntil('quotaReactionDone');
assert.equal(run('s.phase2TurnCounterHits'),1);assert.equal(run('phaseTwoRemnant()'),true);
// Multiple Rampart break events share the same per-turn quota and stop at the limit.
setup();run('loadout.cat[2]="rampart";s.goldUnlocked=true;s.phase2CounterHits=15;quotaReactionDone=false;dealGoldenBreaks([{type:"physical",attack:2},{type:"magic",attack:3}],0,[],()=>quotaReactionDone=true)');flushUntil('quotaReactionDone');
assert.equal(run('s.phase2TurnCounterHits'),1);assert.equal(run('s.phase2CounterHits'),16);assert.equal(run('phaseTwoRemnant()'),true);
// Seal boundaries and the one-round +1 enemy die are based on the previous player turn.
for(const [count,seal,bonus] of [[0,0,0],[5,0,0],[6,1,0],[8,1,0],[9,2,1],[10,2,1]]){
 setup();run(`s.dragonTurn=1;s.phase2PriorPlayerDice=${count};resolveEnemyBurnTick()`);assert.equal(run('s.phase2SealNext'),seal);assert.equal(run('s.phase2NextEnemyBonus'),bonus);
 run('beginPlayerTurn()');assert.equal(run('s.ap'),4-seal);assert.equal(run('s.phase2SealedDice'),seal);run('startEnemyTurn()');assert.equal(run('s.enemyAp'),8+bonus);
 run('s.phase2PriorPlayerDice=0;s.phase2EndSettled=-1;resolveEnemyBurnTick();beginPlayerTurn()');assert.equal(run('s.ap'),4);assert.equal(run('s.phase2SealedDice'),0);
}
// Dice animation frames do not count. Paid, free-enchant, ember and passive dice do count once each.
setup('player');run('startRoll("heavy","cat",2)');flushUntil('!s.busy');assert.equal(run('s.playerDiceThrown'),2);
setup('player');run('s.emberActivations=5;s.busy=true;finishRoll("enchant","bird",2,null)');flushUntil('!s.busy');assert.equal(run('s.playerDiceThrown'),2);
setup('player');run('s.emberReady=1;beginEmberRoll()');flushUntil('s.emberPhase==="offer"');assert.equal(run('s.playerDiceThrown'),1);
setup('player');run('let diceBatchDone=false;rollD4Batch(3,"计数检查",()=>diceBatchDone=true)');flushUntil('diceBatchDone');assert.equal(run('s.playerDiceThrown'),3);
setup('player');run('diceBatchDone=false;rollFoxCloud(()=>diceBatchDone=true)');flushUntil('diceBatchDone');assert.equal(run('s.playerDiceThrown'),2);
setup('player');run('diceBatchDone=false;rollStonePassives(["cat"],0,()=>diceBatchDone=true)');flushUntil('diceBatchDone');assert.equal(run('s.playerDiceThrown'),1);
// Single-die attack parity, remnant consumption and two-die healing / dead-fire D4s.
setup();skill('liujia',[3]);assert.equal(run('s.cat'),491);assert.equal(run('s.bird'),500);
setup();run('s.catShield=10;s.catMagicShield=10');skill('liujia',[4]);assert.equal(run('s.catShield'),10);assert.equal(run('s.catMagicShield'),0);assert.equal(run('s.cat'),498);
setup();run('setPhaseTwoRemnant(true)');skill('liujia',[3]);assert.equal(run('s.cat'),488);assert.equal(run('phaseTwoRemnant()'),false);
setup();run('phaseTwoEnemy().deadFire=3;loadout.cat[2]="maple";loadout.bird[2]="skyfall";s.foxUnlocked=true;s.craneUnlocked=true;s.cat=30;s.bird=20');skill('duanhong',[2,3]);assert.equal(run('s.enemy'),359);assert.equal(run('phaseTwoDeadFire()'),0);assert.equal(run('s.cat'),30);assert.equal(run('s.bird'),20);assert.equal(run('s.pursuitCount'),0);
setup();skill('duanhong',[4,5]);assert.equal(run('s.enemy'),370);assert(run('phaseTwoLastText.includes("4×5=20")'));
setup();skill('duanhong',[10,10]);assert.equal(run('s.enemy'),420);
setup();run('s.busy=true;resolveDragonSkill("duanhong",[0,5],[6,5],[0])');flushUntil('!s.busy');assert.equal(run('s.enemy'),350);
// Crescent threshold / retarget / weakest-shield type; 36 uses the original target.
setup();skill('moon',[6,6,1,2],'crescent');assert.equal(run('s.cat'),462);assert.equal(run('s.bird'),500);
assert.equal(elements.get('catDamage').textContent,'−38');assert.equal(run('s.allyDamageDisplay'),null);assert(!elements.get('birdDamage').classList.contains('show'));
setup();skill('moon',[7,6,1,2],'crescent');assert.equal(run('s.cat'),458);assert.equal(run('s.bird'),498);
assert.equal(elements.get('catDamage').textContent,'−42');assert.equal(elements.get('birdDamage').textContent,'−2');
setup();run('s.catShield=10;s.catMagicShield=0');const plan=run('phaseTwoCrescentPlan([1,2,3,4],"cat")');assert.equal(plan[0].physical,0);assert.equal(plan[0].magic,2);
assert.equal(plan[1].magic,12);assert(plan[1].label.includes('3×4=12'));
setup();skill('moon',[3,4,5,6],'crescent');assert.equal(run('s.cat'),458);assert.equal(run('s.bird'),500);
setup();skill('moon',[7,6,5,6],'crescent');assert.equal(run('s.cat'),458);assert.equal(run('s.bird'),470);
setup();run('s.busy=true;resolveDragonSkill("moon",[3,4,5,0],[3,4,5,6],[3])');flushUntil('!s.busy');assert.equal(run('s.cat'),488);assert.equal(run('s.bird'),500);
// Half-mark snapshots counter count, half-fire limits D4s, full moon preserves both transformed statuses.
setup();run('s.marked=true;s.phase2CounterHits=5');skill('moon',[2,1,1,1,1],'mark');assert.equal(run('s.cat'),489);assert.equal(run('phaseTwoRemnant()'),true);assert(run('phaseTwoLastText.includes("2×2+5=9")'));
setup();run('s.marked=true;s.phase2CounterHits=5');skill('moon',[3,1,1,1,1],'mark');assert.equal(run('s.cat'),487);assert(run('phaseTwoLastText.includes("3×2+5=11")'));
setup();run('s.marked=true;s.phase2CounterHits=0');skill('moon',[2,1,1,1,1],'mark');assert.equal(run('s.cat'),494);
setup();run('s.marked=true;s.phase2CounterHits=5;s.phase2CastForm="mark";s.busy=true;resolveDragonSkill("moon",[0,1,1,1,1],[2,1,1,1,1],[0])');flushUntil('!s.busy');assert.equal(run('s.cat'),498);
setup();run('s.enemyBurn=3');skill('moon',[2,1,1,1,1],'fire');assert.equal(run('s.cat'),496);assert.equal(run('s.enemy'),355);assert.equal(run('phaseTwoDeadFire()'),3);assert.equal(run('s.enemyBurn'),0);
setup();run('s.marked=true;s.enemyBurn=2;phaseTwoEnemy().deadFire=1;s.phase2CounterHits=5');skill('moon',[1,2,1,1,1,1],'full');assert.equal(run('s.cat'),484);assert.equal(run('s.bird'),486);assert.equal(run('s.enemy'),365);assert.equal(run('phaseTwoRemnant()'),true);assert.equal(run('phaseTwoDeadFire()'),3);
assert.equal(elements.get('catDamage').textContent,'−16');assert.equal(elements.get('birdDamage').textContent,'−14');assert.equal(run('s.allyDamageDisplay'),null);
// Skill-converted dead fire is newly born: no additional end-of-this-turn healing.
run('s.dragonTurn=1;resolveEnemyBurnTick()');assert.equal(run('s.enemy'),366);assert.equal(run('phaseTwoDeadFire()'),3);
// Shield absorption is excluded; a later cast or unrelated hit starts a fresh number.
setup();run('s.catShield=30');skill('moon',[6,6,1,2],'crescent');assert.equal(run('s.cat'),462);assert.equal(elements.get('catDamage').textContent,'−38');
setup();run('s.catMagicShield=30');skill('moon',[6,6,1,2],'crescent');assert.equal(run('s.cat'),462);assert.equal(elements.get('catDamage').textContent,'−38');
setup();run('s.catShield=30;s.catMagicShield=30');skill('moon',[6,6,1,2],'crescent');assert.equal(run('s.cat'),492);assert.equal(elements.get('catDamage').textContent,'−8');
skill('liujia',[1]);assert.equal(elements.get('catDamage').textContent,'−3');run('damageAlly("cat",2)');assert.equal(elements.get('catDamage').textContent,'−2');
setup();run('s.cat=1;s.bird=1');skill('moon',[1,1,1,1,1,1],'full');assert.equal(run('s.over'),true);assert.equal(run('s.allyDamageDisplay'),null);
// Form detection includes the corresponding stolen statuses; third-turn mandatory skills spend 4/5/6 dice.
for(const [mark,fire,cost] of [[false,0,4],[true,0,5],[false,2,5],[true,2,6]]){
 setup();run(`setPhaseTwoRemnant(${mark});phaseTwoEnemy().deadFire=${fire}`);assert.equal(run('phaseTwoMoonCost()'),cost);
}
run('const realPhaseTwoRoll=rollDragonAction;let phaseTwoSchedule=[];rollDragonAction=(id,cost)=>{phaseTwoSchedule.push({id,cost});s.enemyAp-=cost}');
for(let turn=1;turn<=6;turn++){setup();run(`s.enemy=420;s.dragonTurn=${turn};phaseTwoSchedule=[];while(s.enemyAp>0)enemyAct()`);assert.equal(run('phaseTwoSchedule.filter(x=>x.id==="moon").length'),turn%3===0?1:0);assert.equal(run('phaseTwoSchedule.reduce((n,x)=>n+x.cost,0)'),8)}
run('rollDragonAction=realPhaseTwoRoll');
// Five/six-die rendering and Skyfall interception follow the actual phase budget.
setup();run('s.marked=true;s.enemyBurn=1;s.enemyAp=6;loadout.cat[2]="skyfall";s.craneUnlocked=true;const realPhaseTwoResolve=resolveDragonSkill;let capturedPhaseTwoRoll=null;resolveDragonSkill=(id,faces,shown,owned)=>capturedPhaseTwoRoll={id,faces,shown,owned};rollDragonAction("moon",6)');assert.equal(elements.get('dice6').style.display,'grid');assert(elements.get('dice6').classList.contains('crane-roll'));flushUntil('capturedPhaseTwoRoll!==null');assert.equal(run('capturedPhaseTwoRoll.faces[5]'),0);assert.equal(run('capturedPhaseTwoRoll.owned[0]'),5);run('resolveDragonSkill=realPhaseTwoResolve');
// A complete real phase-II turn consumes eight D10s, records Grasp, and applies the seal.
setup();run('finishDragonAction=phaseTwoOriginalFinish;s.enemy=420;s.playerDiceThrown=6;startEnemyTurn()');flushUntil('s.turn==="player"&&s.round===2');assert.equal(run('s.ap'),3);assert.equal(run('s.enemyAp'),0);assert.equal(run('s.dragonDiceSpent'),8);assert.equal(run('s.enemy'),420);assert.equal(run('s.dragonDamageEvents'),8);
// Lore reveals only used skills and the phase-aware status / menu affordances exist.
setup();run('renderDragonLore()');assert(elements.get('bossLore').innerHTML.includes('篡夺'));assert(elements.get('bossLore').innerHTML.includes('特殊机制：攫取'));assert(elements.get('bossLore').innerHTML.includes('物理护盾或法术护盾造成伤害'));assert(!elements.get('bossLore').innerHTML.includes('六甲穷日'));
run('showDragonLore();render()');assert(elements.get('bossLore').classList.contains('show'));assert(elements.get('bossLore').classList.contains('boss-lore-active'));
run('s.dragonUses.liujia=1;renderDragonLore()');assert(elements.get('bossLore').innerHTML.includes('六甲穷日'));assert(!elements.get('bossLore').innerHTML.includes('断虹明'));
assert(elements.get('bossLore').innerHTML.includes('超过8枚'));assert(!elements.get('bossLore').innerHTML.includes('超过10枚'));
assert(run('phaseTwoLore.liujia.includes("点数x3")'));assert(run('phaseTwoLore.duanhong.includes("两枚点数相乘")'));assert.equal(run('phaseTwoLore.moon.split("剩下两枚骰子相乘").length-1'),2);
run('setPhaseTwoRemnant(true);phaseTwoEnemy().deadFire=2;s.enemyBurn=1;render()');assert(elements.get('markTag').classList.contains('remnant'));assert(elements.get('burnStack').innerHTML.includes('dead-fire'));
elements.get('chapterBossStage3').onclick();assert.equal(run('s.bossPhase'),3);assert(!elements.get('markTag').classList.contains('remnant'));elements.get('chapterBossStage2').onclick();assert.equal(run('s.bossPhase'),2);
run('Math.random=phaseTwoOriginalRandom');
console.log('PASS: phase-II D10 budget, Usurp / Remnant / Dead Fire, real-die seals, counters, all Moon forms, interception, full turn, lore and direct stage entry.');
