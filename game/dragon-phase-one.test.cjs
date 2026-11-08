const assert=require('node:assert/strict');
const {run,flushUntil,timers,elements}=require('./training-flow.test.cjs');
function setup(){timers.length=0;run("stopTutorial();resetBattle('boss');s.turn='enemy';s.enemyAp=8;s.enemies[0].hp=100;s.enemies[0].physical=0;s.enemies[0].magic=0;s.dragonDamageEvents=0;s.dragonLastDamage=null;s.dragonLastGraspEvent=0")}
setup();assert.equal(run('enemyActionDice()'),8);assert.equal(run('enemyDieSides()'),10);
// Grasp returns actual shield and health losses in full, independently by type.
run('s.enemyAp=6;const firstGrasp=dragonGrasp({physicalShield:10,magicShield:10,hp:10})');assert.equal(run('s.shield'),10);assert.equal(run('s.magicShield'),10);assert.equal(run('s.enemy'),110);assert.equal(run('firstGrasp.when'),'首次');
run('s.enemyAp=4;const middleGrasp=dragonGrasp({physicalShield:3,magicShield:4,hp:5})');assert.equal(run('middleGrasp.triggered'),false);assert.equal(run('s.enemy'),110);
run('s.enemyAp=1;const lastGrasp=dragonGrasp({physicalShield:6,magicShield:7,hp:8})');assert.equal(run('lastGrasp.when'),'末次');assert.equal(run('s.shield'),16);assert.equal(run('s.magicShield'),17);assert.equal(run('s.enemy'),118);assert.equal(run('flushLastDragonGrasp().triggered'),false);
// A canceled tail attack must not replace the last effective loss or prevent its Grasp.
setup();run('s.enemyAp=6;dragonGrasp({physicalShield:10,magicShield:20,hp:5});s.enemyAp=3;dragonGrasp({physicalShield:7,magicShield:3,hp:2});s.enemyAp=0;dragonGrasp({physicalShield:0,magicShield:0,hp:0});const canceledTailGain=flushLastDragonGrasp()');assert.equal(run('canceledTailGain.triggered'),true);assert.equal(run('s.shield'),17);assert.equal(run('s.magicShield'),23);assert.equal(run('s.enemy'),107);assert.equal(run('flushLastDragonGrasp().triggered'),false);
// One effective hit is not counted twice; healing respects maximum HP and cannot revive a dead boss.
setup();run('dragonGrasp({physicalShield:1,magicShield:2,hp:3});s.enemyAp=0');assert.equal(run('flushLastDragonGrasp().triggered'),false);
setup();run('s.enemies[0].hp=290;const cappedGrasp=dragonGrasp({hp:20})');assert.equal(run('s.enemy'),300);assert.equal(run('cappedGrasp.hpGain'),10);
setup();run('dragonGrasp({hp:1});dragonGrasp({hp:2});s.enemies[0].hp=0');assert.equal(run('flushLastDragonGrasp().triggered'),false);assert.equal(run('s.enemy'),0);
// Resetting a round restores the complete eight-die budget and clears Grasp bookkeeping.
setup();run('s.dragonDamageEvents=4;s.dragonLastDamage={event:4,hp:9};s.dragonLastGraspEvent=4;startEnemyTurn()');assert.equal(run('s.enemyAp'),8);assert.equal(run('s.dragonDamageEvents'),0);assert.equal(run('s.dragonLastDamage'),null);
// Divine: casts 1–5 are normal, 6–10 gain the secondary damage, and cast 11 modifies low faces.
assert.equal(run('dragonDivineResult(5,1).physical'),1);assert.equal(run('dragonDivineResult(5,1).magic'),0);
assert.equal(run('dragonDivineResult(6,1).physical'),2);assert.equal(run('dragonDivineResult(6,1).magic'),1.5);
assert.equal(run('dragonDivineResult(10,3).face'),3);assert.equal(run('dragonDivineResult(11,1).face'),5);assert.equal(run('dragonDivineResult(11,3).face'),6);assert.equal(run('dragonDivineResult(11,5).face'),7);assert.equal(run('dragonDivineResult(11,8).face'),8);
assert.equal(run('dragonDivineResult(11,2).magic'),12);assert.equal(run('dragonDivineResult(11,2).physical'),9);assert.equal(run('dragonDivineResult(20,0).physical'),0);assert.equal(run('dragonDivineResult(20,0).magic'),0);
// Every third enemy round starts Apocalypse once, spending a total of eight dice for that round.
run("const originalDragonRoll=rollDragonAction;const schedules=[];rollDragonAction=function(id,cost){schedules.push({turn:s.dragonTurn,id,cost});s.enemyAp-=cost;s.divineBuff=id==='divine'?{physical:1,magic:0}:null}");
for(let turn=1;turn<=6;turn++){
 setup();run(`s.dragonTurn=${turn};s.dragonApocTurn=0;s.divineBuff=null;while(s.enemyAp>0)dragonBossAct()`);
 const count=run(`schedules.filter(x=>x.turn===${turn}&&x.id==='apocalypse').length`);assert.equal(count,turn%3===0?1:0);assert.equal(run(`schedules.filter(x=>x.turn===${turn}).reduce((n,x)=>n+x.cost,0)`),8);
}
run('rollDragonAction=originalDragonRoll');
// Apocalypse keeps its arithmetic, damage parity, and distinct charge / deciding die colors.
setup();run("const resolveDragonBeforeTest=resolveDragonSkill;let capturedDragonRoll=null;resolveDragonSkill=(id,faces,shown,owned)=>capturedDragonRoll={id,faces,shown,owned};rollDragonAction('apocalypse',4)");
for(const id of ['dice','dice2','dice3'])assert(elements.get(id).classList.contains('dragon-purple'));assert(elements.get('dice4').classList.contains('dragon-black'));flushUntil('capturedDragonRoll!==null');run('resolveDragonSkill=resolveDragonBeforeTest');
setup();run('const dragonDealBeforeTest=dragonDeal,finishDragonBeforeTest=finishDragonAction;let dragonHit=null;dragonDeal=(physical,magic)=>{dragonHit={physical,magic};return{physicalShield:0,magicShield:0,hp:0,breaks:[],hits:[]}};finishDragonAction=()=>{};resolveDragonSkill("apocalypse",[1,3,5,7])');assert.equal(run('dragonHit.physical'),27);assert.equal(run('dragonHit.magic'),0);run('resolveDragonSkill("apocalypse",[1,3,5,8])');assert.equal(run('dragonHit.magic'),28);
// Ruin looks at both allies together, then adds half the dragon's shields as the other damage type.
run('s.catShield=3;s.birdShield=2;s.catMagicShield=20;s.birdMagicShield=20;s.shield=40;s.magicShield=30;resolveDragonSkill("ruin",[3,4])');assert.equal(run('dragonHit.physical'),7);assert.equal(run('dragonHit.magic'),35);
run('s.catShield=20;s.birdShield=20;s.catMagicShield=3;s.birdMagicShield=2;resolveDragonSkill("ruin",[3,4])');assert.equal(run('dragonHit.physical'),35);assert.equal(run('dragonHit.magic'),7);run('dragonDeal=dragonDealBeforeTest;finishDragonAction=finishDragonBeforeTest');
// Skyfall continues to intercept the first and eighth dice in the expanded budget.
setup();run('loadout.cat[2]="skyfall";s.craneUnlocked=true;resolveDragonSkill=(id,faces,shown,owned)=>capturedDragonRoll={id,faces,shown,owned};capturedDragonRoll=null;rollDragonAction("divine",1)');assert(elements.get('dice').classList.contains('crane-roll'));flushUntil('capturedDragonRoll!==null');assert.equal(run('capturedDragonRoll.faces[0]'),0);assert.equal(run('capturedDragonRoll.owned[0]'),0);
run('s.enemyAp=2;capturedDragonRoll=null;rollDragonAction("ruin",2)');assert(elements.get('dice2').classList.contains('crane-roll'));flushUntil('capturedDragonRoll!==null');assert.equal(run('capturedDragonRoll.faces[1]'),0);run('resolveDragonSkill=resolveDragonBeforeTest');
setup();run('s.dragonUses.divine=1;s.dragonUses.apocalypse=1;renderDragonLore()');assert(elements.get('bossLore').innerHTML.includes('初始拥有8枚'));assert(elements.get('bossLore').innerHTML.includes('首次造成伤害和最后一次'));assert(elements.get('bossLore').innerHTML.includes('每三回合'));assert(elements.get('bossLore').innerHTML.includes('使用五次后'));
console.log('PASS: dragon D10 budget, first/last full Grasp, canceled tails, Divine thresholds, Apocalypse cadence / math / colors, Ruin shield targeting, Skyfall and lore.');
