const assert=require('node:assert/strict');
const {run,flushUntil,timers,elements}=require('./training-flow.test.cjs');
run('const phaseThreeRealAct=enemyAct,phaseThreeRealRandom=Math.random;enemyAct=()=>{}');
function setup(turn='player'){
 timers.length=0;run(`stopTutorial();resetBattle('boss',3);s.turn='${turn}';s.busy=false;s.over=false;Math.random=()=>.1;s.cat=1000;s.bird=1000;s.catShield=0;s.birdShield=0;s.catMagicShield=0;s.birdMagicShield=0;s.enemy=600;s.shield=70;s.magicShield=80;s.enemyAp=10;s.phase3NormalAp=10`);
}
function cast(id,faces){run(`s.busy=true;resolveDragonSkill('${id}',${JSON.stringify(faces)})`);flushUntil('!s.busy')}
setup();assert.equal(run('enemyActionDice()'),10);assert.equal(run('enemyDieSides()'),10);assert.equal(run('s.phase3Initialized'),true);
run('cfg.enemyDieSides=6');assert.equal(run('enemyDieSides()'),6);run('cfg.enemyDieSides=null');
run('selectEnemy(0)');assert.match(elements.get('dialogText').textContent,/当前攻击目标：巨龙/);
cast('peak',[5,5]);assert.equal(run('s.enemies.length'),3);assert.equal(run('s.enemies[1].hp'),20);assert.equal(run('s.enemies[2].hp'),20);
assert.equal(run('s.enemies[1].name'),'死士（赫）');assert.equal(run('s.enemies[1].physical'),999);assert.equal(run('s.enemies[1].magic'),0);
assert.equal(run('s.enemies[2].name'),'死士（苍）');assert.equal(run('s.enemies[2].physical'),0);assert.equal(run('s.enemies[2].magic'),999);
run('selectEnemy(1)');assert.match(elements.get('dialogText').textContent,/死士（赫）/);assert.equal(elements.get('enemyPortrait-second').src,'assets/death-soldier-he.png');
run('damageEnemyMagic(7)');assert.equal(run('s.enemies[1].hp'),13);assert.equal(run('s.enemies[0].hp'),600);
run('selectEnemy(2)');assert.match(elements.get('dialogText').textContent,/死士（苍）/);assert.equal(elements.get('enemyPortrait-third').src,'assets/death-soldier-cang.png');
run('damageEnemyPhysical(5)');assert.equal(run('s.enemies[2].hp'),15);assert.equal(run('s.enemies[2].magic'),999);
run('s.enemy=0;checkEnd()');assert.equal(run('s.over'),false);assert.equal(run('s.targetIndex'),0);
run('s.phase3SoldierDeadline=null;phaseThreeSummonSoldiers([6,7])');assert.equal(run('s.enemies[1].hp'),13);
// Entrance / defeat / dismissal animations persist across renders and hide only after fading.
setup();run('phaseThreeSummonSoldiers([3,4]);render();var soldierEnterTimer=phaseThreeSoldierViews.get(1).timer');
assert.equal(elements.get('enemy-second').hidden,false);assert(elements.get('enemy-second').classList.contains('soldier-entering'));
run('render()');assert.equal(run('phaseThreeSoldierViews.get(1).timer===soldierEnterTimer'),true);
run('soldierEnterTimer.fn();s.enemies[1].hp=0;render();var oldSoldierLeaveTimer=phaseThreeSoldierViews.get(1).timer');
assert.equal(elements.get('enemy-second').hidden,false);assert(elements.get('enemy-second').classList.contains('soldier-leaving'));assert.equal(elements.get('enemy-second').tabIndex,-1);
run('oldSoldierLeaveTimer.fn()');assert.equal(elements.get('enemy-second').hidden,true);
run('dismissPhaseThreeSoldiers();render()');assert(elements.get('enemy-third').classList.contains('soldier-leaving'));assert.equal(elements.get('enemy-third').hidden,false);
run('var staleSoldierLeaveTimer=phaseThreeSoldierViews.get(2).timer;phaseThreeSummonSoldiers([3,4]);render();staleSoldierLeaveTimer.fn()');assert.equal(elements.get('enemy-third').hidden,false);assert(elements.get('enemy-third').classList.contains('soldier-entering'));
run('resetBattle("boss",2)');assert.equal(run('phaseThreeSoldierViews.size'),0);assert.equal(elements.get('enemy-second').hidden,true);assert.equal(elements.get('enemy-third').hidden,true);
// Both survivors / either survivor / no survivors produce the correct expiration and shield transfer.
for(const [he,cang,count,p,m] of [[true,true,4,999,999],[true,false,2,999,0],[false,true,2,0,999],[false,false,0,0,0]]){
 setup('enemy');run(`s.phase3Turn=1;phaseThreeSummonSoldiers([2,3]);s.enemies[1].hp=${he?20:0};s.enemies[2].hp=${cang?20:0};s.phase3Turn=2`);
 assert.equal(run('phaseThreeDeadlinePlan().count'),count);assert.equal(run('phaseThreeDeadlinePlan().pShield'),p);assert.equal(run('phaseThreeDeadlinePlan().mShield'),m);
 run('var deadlineDone=false;resolvePhaseThreeDeadline(()=>deadlineDone=true)');flushUntil('deadlineDone');
 assert.equal(run('s.shield'),70+p);assert.equal(run('s.magicShield'),80+m);assert.equal(run('s.enemies[1].dismissed'),true);assert.equal(run('s.enemies[2].dismissed'),true);
 assert.equal(run('s.cat'),1000-(he?count*2:0)-(cang?count*2:0));
}
setup('enemy');run('s.phase3Turn=1;phaseThreeSummonSoldiers([3,4]);s.phase3Turn=1;let earlyDeadlineDone=false;resolvePhaseThreeDeadline(()=>earlyDeadlineDone=true)');assert.equal(run('earlyDeadlineDone'),true);assert.equal(run('s.enemies[1].hp'),20);
// Each soldier has its own two dice and damage type, with a shared three-die theft cap.
run('s.phase3Borrowed=0;let hePacket=resolvePhaseThreeSoldier(1,[3,4]),cangPacket=resolvePhaseThreeSoldier(2,[5,6]);s.phase3Actor=1;withEnemy(1,()=>phaseTwoDamagePacket(hePacket));s.phase3Actor=2;withEnemy(2,()=>phaseTwoDamagePacket(cangPacket))');
assert.equal(run('hePacket.physical'),7);assert.equal(run('cangPacket.magic'),11);assert.equal(run('s.cat'),982);assert.equal(run('s.phase3Borrowed'),2);run('stealPhaseThreeDie();stealPhaseThreeDie()');assert.equal(run('s.phase3Borrowed'),2);
// Each soldier closes the central dice before yielding; cancellation and defeat also clean up.
setup('enemy');run('phaseThreeSummonSoldiers([3,4]);var soldierTurnDone=false;runPhaseThreeSoldiers(()=>soldierTurnDone=true)');
flushUntil('s.phase3Actor===1&&!s.busy');assert(!elements.get('diceWrap').classList.contains('show'));assert.equal(elements.get('diceCaption').textContent,'');
flushUntil('soldierTurnDone');assert(!elements.get('diceWrap').classList.contains('show'));assert.equal(run('s.phase3Actor'),0);
setup('enemy');run('phaseThreeSummonSoldiers([3,4]);s.enemies[2].hp=1;s.enemies[2].magic=0;loadout.cat[2]="skyfall";s.craneUnlocked=true;s.phase3SoldierQueue=[2];soldierTurnDone=false;runPhaseThreeSoldiers(()=>soldierTurnDone=true)');flushUntil('soldierTurnDone');assert(!elements.get('diceWrap').classList.contains('show'));assert.equal(run('s.busy'),false);
setup('enemy');run('phaseThreeSummonSoldiers([3,4]);s.cat=1;s.bird=1;runPhaseThreeSoldiers(()=>{})');flushUntil('s.over');assert(!elements.get('diceWrap').classList.contains('show'));
// Debt is withheld once, reclaimed by actual damage in fifty-point increments, then handed to the boss.
setup('enemy');run('s.phase3Borrowed=2;beginPlayerTurn()');timers.length=0;run('s.busy=false');assert.equal(run('s.ap'),2);assert.equal(run('maxActionPoints()'),2);
run('damageEnemyPhysical(49)');assert.equal(run('s.phase3PartyDebt'),2);assert.equal(run('s.ap'),2);
run('damageEnemyPhysical(1)');assert.equal(run('s.phase3PartyDebt'),1);assert.equal(run('s.ap'),3);
run('startEnemyTurn()');assert.equal(run('s.phase3EnemyPurpleLeft'),1);assert.equal(run('enemyActionDice()'),11);assert.equal(run('s.enemyAp'),11);
run('render()');assert(elements.get('ap').children[10].classList.contains('stolen'));
// Return to Heaven consumes only the larger shield and matches the output damage type.
setup('enemy');run('s.shield=100;s.magicShield=50');cast('returnSky',Array(10).fill(2));assert.equal(run('s.shield'),0);assert.equal(run('s.magicShield'),50);assert.equal(run('s.cat'),880);assert.equal(run('s.phase3Borrowed'),1);
setup('enemy');run('s.shield=10;s.magicShield=90');cast('returnSky',Array(10).fill(1));assert.equal(run('s.magicShield'),0);assert.equal(run('s.shield'),10);assert.equal(run('s.cat'),900);
// Only the larger individual shield controls scaling; 100 is unscaled, and the dice sum never scales.
for(const [physical,magic,type,bonus] of [[0,0,'physical',0],[99,1,'physical',99],[100,50,'physical',100],[101,50,'physical',10.1],[1000,50,'physical',100],[1,99,'magic',99],[50,100,'magic',100],[50,101,'magic',10.1],[50,1000,'magic',100]]){
 setup('enemy');run(`s.shield=${physical};s.magicShield=${magic};var returnSkyBoundary=phaseThreeReturnSky(Array(10).fill(2))`);
 assert.equal(run('returnSkyBoundary.type'),type);assert(Math.abs(run('returnSkyBoundary.amount')-(20+bonus))<1e-8);
 assert.equal(run('s.shield'),type==='physical'?0:physical);assert.equal(run('s.magicShield'),type==='magic'?0:magic);
 assert.equal(run('returnSkyBoundary.packet.label.includes("÷10")'),Math.max(physical,magic)>100);
}
// Grasp stays off for the first two stage-local turns, then shares the first / last full-gain logic.
setup('enemy');run('s.phase3Turn=2;s.enemy=100;s.shield=0;s.magicShield=0;var earlyThreeGrasp=dragonGrasp({physicalShield:4,magicShield:5,hp:6})');assert.equal(run('earlyThreeGrasp.triggered'),false);assert.equal(run('s.enemy'),100);assert.equal(run('s.dragonDamageEvents'),0);
run('s.phase3Turn=3;s.enemyAp=8;var firstThreeGrasp=dragonGrasp({physicalShield:4,magicShield:5,hp:6})');assert.equal(run('firstThreeGrasp.when'),'首次');assert.equal(run('s.shield'),4);assert.equal(run('s.magicShield'),5);assert.equal(run('s.enemy'),106);
run('s.enemyAp=1;var middleThreeGrasp=dragonGrasp({physicalShield:2,magicShield:3,hp:4})');assert.equal(run('middleThreeGrasp.triggered'),false);assert.equal(run('s.enemy'),106);
run('s.enemyAp=0;var lastThreeGrasp=flushLastDragonGrasp()');assert.equal(run('lastThreeGrasp.when'),'末次');assert.equal(run('s.shield'),6);assert.equal(run('s.magicShield'),8);assert.equal(run('s.enemy'),110);assert.equal(run('flushLastDragonGrasp().triggered'),false);
run('s.phase3Actor=1;dragonGrasp({physicalShield:10,magicShield:10,hp:10})');assert.equal(run('s.dragonDamageEvents'),2);assert.equal(run('s.enemy'),110);
// Stage-III Ruin allows the shield bonus at exactly 100 total shields, but suppresses it above 100.
setup('enemy');run('s.shield=40;s.magicShield=60');cast('ruin',[3,4]);assert.equal(run('s.cat'),943);assert.equal(run('s.bird'),943);
setup('enemy');run('s.shield=40;s.magicShield=61');cast('ruin',[3,4]);assert.equal(run('s.cat'),993);assert.equal(run('s.bird'),993);
setup('enemy');run('s.shield=999;s.magicShield=0;s.divineBuff={physical:0,magic:2}');cast('ruin',[3,4]);assert.equal(run('s.cat'),991);
// Summits only target hero skills; lower-half counts are rounded up.
setup();run('loadout.cat[2]="wind";loadout.cat[3]="stone";loadout.bird[2]="clouds";loadout.bird[3]="gallant";s.tanukiUnlocked=true;s.foxUnlocked=true;s.goldUnlocked=true;applyPhaseThreeBurnout([5,3])');
assert.equal(run('[...s.phase3Burnout.cat,...s.phase3Burnout.bird].filter(Boolean).length'),2);assert.equal(run('[...s.phase3Burnout.cat,...s.phase3Burnout.bird].filter(Boolean)[0].remaining'),2);
run('applyPhaseThreeBurnout([6,3])');assert.equal(run('[...s.phase3Burnout.cat,...s.phase3Burnout.bird].filter(Boolean).length'),4);assert.equal(run('s.phase3Burnout.cat[0]'),null);
run('s.phase3Burnout.cat[2].remaining=1;s.phase3Burnout.cat[3].remaining=3;applyPhaseThreeBurnout([6,8])');assert.equal(run('s.phase3Burnout.cat[2].remaining'),1);assert.equal(run('s.phase3Burnout.cat[3].remaining'),3);
run('applyPhaseThreeBurnout([6,1])');assert.equal(run('[...s.phase3Burnout.cat,...s.phase3Burnout.bird].filter(Boolean).every(entry=>entry.remaining===1)'),true);
// The final allowed active use resolves fully, then its slot and talent disappear.
setup();run('loadout.cat[2]="wind";s.tanukiUnlocked=true;s.phase3Burnout.cat[2]={id:"wind",remaining:1};s.busy=true;finishRoll("wind","cat",3,null)');flushUntil('!s.busy');
assert.equal(run('loadout.cat[2]'),null);assert.equal(run('talentActive("tanuki")'),false);assert.equal(run('s.shield'),67);
// Re-installing the same hero skill yields a fresh slot without the old burnout restriction.
run('s.equipSkill="wind";s.equipBoon="tanuki";s.selected="cat";installEquippedSkill(2)');assert.equal(run('loadout.cat[2]'),'wind');assert.equal(run('s.phase3Burnout.cat[2]'),null);
// Passive uses: Stone, Clouds, Maple and Rampart each consume their own activation.
setup();run('loadout.cat[2]="stone";s.tanukiUnlocked=true;s.phase3Burnout.cat[2]={id:"stone",remaining:1};let stoneBurnDone=false;rollStonePassives(["cat"],0,()=>stoneBurnDone=true)');flushUntil('stoneBurnDone');assert.equal(run('loadout.cat[2]'),null);assert(run('s.catShield>0'));
setup();run('loadout.bird[2]="clouds";s.foxUnlocked=true;s.phase3Burnout.bird[2]={id:"clouds",remaining:1};let cloudBurnDone=false;rollFoxCloud(()=>cloudBurnDone=true)');flushUntil('cloudBurnDone');assert.equal(run('loadout.bird[2]'),null);
setup();run('loadout.bird[2]="maple";s.foxUnlocked=true;s.phase3Burnout.bird[2]={id:"maple",remaining:1};s.cat=30;s.bird=20;healParty(5,"maple")');assert.equal(run('s.cat'),35);assert.equal(run('loadout.bird[2]'),null);
setup('enemy');run('loadout.cat[2]="rampart";s.goldUnlocked=true;s.phase3Burnout.cat[2]={id:"rampart",remaining:1};let rampartBurnDone=false;dealGoldenBreaks([{type:"physical",attack:5},{type:"magic",attack:5}],0,[],()=>rampartBurnDone=true)');flushUntil('rampartBurnDone');assert.equal(run('loadout.cat[2]'),null);assert.equal(run('s.shield'),69);assert.equal(run('s.magicShield'),80);
// The scheduler reserves ten dice for Return to Heaven exactly every fifth turn.
run('const realThreeRoll=rollDragonAction;let scheduledThree=[];rollDragonAction=(id,cost)=>{scheduledThree.push(id);s.phase3NormalAp-=cost;s.enemyAp-=cost;if(id==="peak")s.phase3SummonedTurn=s.phase3Turn}');
for(let turn=1;turn<=10;turn++){setup('enemy');run(`s.phase3Turn=${turn};scheduledThree=[];while(s.phase3NormalAp>0)phaseThreeRealAct()`);assert.equal(run('scheduledThree.filter(id=>id==="returnSky").length'),turn%5===0?1:0);assert.equal(run('scheduledThree.filter(id=>id==="peak").length'),turn===1||turn%3===0&&turn%5!==0?1:0);assert.equal(run('scheduledThree.filter(id=>id==="summit").length'),turn===1||turn%4===0&&turn%5!==0?1:0);assert.equal(run('s.enemyAp'),0);if(turn===1)assert.equal(run('scheduledThree.slice(0,2).join(",")'),'summit,peak')}
// Collisions use only ten normal dice; deferred mandatory skills survive into the next round.
setup('enemy');
for(let turn=1;turn<=61;turn++){
 run(`s.phase3Turn=${turn};s.phase3NormalAp=10;s.enemyAp=10;scheduledThree=[];while(s.phase3NormalAp>0)phaseThreeRealAct()`);
 if([15,20,60].includes(turn)){assert.equal(run('scheduledThree[0]'),'returnSky');assert.equal(run('scheduledThree.length'),1);assert.equal(run('s.phase3Required.length'),turn===60?2:1)}
 if(turn===16){assert.equal(run('scheduledThree[0]'),'peak');assert.equal(run('scheduledThree[1]'),'summit')}
 if(turn===21){assert.equal(run('scheduledThree[0]'),'summit');assert.equal(run('scheduledThree[1]'),'peak')}
 if(turn===61){assert.equal(run('scheduledThree[0]'),'peak');assert.equal(run('scheduledThree[1]'),'summit');assert.equal(run('s.phase3Required.length'),0)}
 assert.equal(run('s.enemyAp'),0);
}
run('rollDragonAction=realThreeRoll');
// A stolen die costs one AP; its inherited skill is a separate free roll.
run('const realThreeAnimate=phaseThreeAnimateDice,realThreeResolve=resolveDragonSkill;let stolenCalls=[],stolenId=null,stolenSelector=3;phaseThreeAnimateDice=(count,label,done,owned=[],purple=false)=>{stolenCalls.push({count,purple});done(Array(count).fill(count===1&&stolenCalls.length===1?stolenSelector:2),[],[])};resolveDragonSkill=id=>stolenId=id');
for(const [face,expected] of [[3,'apocalypse'],[4,'moon']]){setup('enemy');run(`s.enemyAp=1;s.phase3EnemyPurpleLeft=1;stolenSelector=${face};stolenCalls=[];rollPhaseThreeStolenDie()`);assert.equal(run('stolenId'),expected);assert.equal(run('s.enemyAp'),0);assert.equal(run('stolenCalls.length'),2);assert.equal(run('stolenCalls.every(call=>call.purple)'),true)}
run('phaseThreeAnimateDice=realThreeAnimate;resolveDragonSkill=realThreeResolve');
setup('enemy');run('Math.random=()=>.2;s.enemyAp=1;s.phase3NormalAp=0;s.phase3EnemyPurpleLeft=1;rollPhaseThreeStolenDie()');flushUntil('document.getElementById("diceCaption").textContent.includes("天启")');assert(elements.get('dice').classList.contains('dragon-purple'));assert(elements.get('dice3').classList.contains('dragon-purple'));assert(elements.get('dice4').classList.contains('dragon-black'));
// Ten dice render together, and the first die remains eligible for Skyfall interception.
setup('enemy');run('loadout.cat[2]="skyfall";s.craneUnlocked=true;let capturedThree=null;const threeResolveBeforeCapture=resolveDragonSkill;resolveDragonSkill=(id,faces,shown,owned)=>capturedThree={id,faces,owned};rollDragonAction("returnSky",10)');assert.equal(elements.get('dice10').style.display,'grid');flushUntil('capturedThree!==null');assert.equal(run('capturedThree.faces[0]'),0);assert.equal(run('capturedThree.owned[0]'),0);run('resolveDragonSkill=threeResolveBeforeCapture');
// Both opening skills resolve in the first real enemy turn, within the ten-die budget.
setup('player');run('enemyAct=phaseThreeRealAct;startEnemyTurn()');flushUntil('s.turn==="player"&&s.round===2');assert.equal(run('s.phase3NormalAp'),0);assert.equal(run('s.dragonDiceSpent'),10);assert.equal(run('s.phase3PartyDebt'),2);assert.equal(run('s.ap'),2);assert.equal(run('s.cat'),980);assert.equal(run('s.bird'),980);assert.equal(run('s.dragonUses.summit'),1);assert.equal(run('s.dragonUses.peak'),1);assert.equal(run('s.phase3SoldierDeadline'),2);run('enemyAct=()=>{}');
// Skyfall takes only the entire enemy turn's first / last die, including the soldiers' later actions.
setup('player');run('s.cat=120;s.bird=100;loadout.cat[2]="skyfall";s.craneUnlocked=true;const threePursuitBeforeCount=applyCranePursuit;let threePursuits=0;applyCranePursuit=face=>{threePursuits++;return threePursuitBeforeCount(face)};enemyAct=phaseThreeRealAct;startEnemyTurn()');flushUntil('s.turn==="player"&&s.round===2');
assert.equal(run('threePursuits'),2);assert.equal(run('s.cat'),102);assert.equal(run('s.bird'),82);run('applyCranePursuit=threePursuitBeforeCount;enemyAct=()=>{}');
// Real rounds retain the deferred summons through purple casts, soldier turns and the player handoff.
setup('player');run('enemyAct=phaseThreeRealAct');
for(let turn=1;turn<=16;turn++){
 run('s.cat=10000;s.bird=10000;startEnemyTurn()');flushUntil(`s.turn==="player"&&s.round===${turn+1}`);
 assert.equal(run('s.phase3Turn'),turn);assert.equal(run('s.phase3NormalAp'),0);assert.equal(run('s.phase3PartyDebt'),2);
 if(turn===15){assert.equal(run('s.dragonUses.returnSky'),3);assert.equal(run('s.dragonUses.peak'),5);assert.equal(run('s.phase3Required[0].id'),'peak')}
 if(turn===16){assert.equal(run('s.dragonUses.peak'),6);assert.equal(run('s.dragonUses.summit'),5);assert.equal(run('s.phase3Required.length'),0)}
}
run('enemyAct=()=>{}');
setup();run('phaseThreeSummonSoldiers([3,3]);s.targetIndex=2;s.enemies[0].hp=0;checkEnd()');assert.equal(run('s.over'),true);assert.equal(run('s.enemies.length'),1);
setup();run('renderDragonLore()');assert.match(elements.get('bossLore').innerHTML,/10枚骰子/);assert(!elements.get('bossLore').innerHTML.includes('登峰造极'));
run('s.dragonUses.summit=1;renderDragonLore()');assert(elements.get('bossLore').innerHTML.includes('登峰造极'));
run('Math.random=phaseThreeRealRandom;enemyAct=phaseThreeRealAct');
console.log('PASS: phase-III roster / targets, soldier stats and deadlines, theft / reclaim / purple rolls, burnout active / passive / reinstall, Return to Heaven / cadence, Skyfall, lore and victory.');


// Hovering either soldier exposes the matching skill without changing the attack target.
setup();run('phaseThreeSummonSoldiers([5,5]);render();s.targetIndex=0;showSoldierLore(1)');
assert.equal(run('s.targetIndex'),0);assert.equal(elements.get('soldierLore').classList.contains('show'),true);
assert.match(elements.get('soldierLore').innerHTML,/死士（赫）.*炽血.*物理伤害/s);assert.match(elements.get('soldierLore').innerHTML,/初始物理护盾：999；初始法术护盾：0/);
run('showSoldierLore(2)');assert.match(elements.get('soldierLore').innerHTML,/死士（苍）.*冻焰.*法术伤害/s);assert.match(elements.get('soldierLore').innerHTML,/初始物理护盾：0；初始法术护盾：999/);
assert.equal(elements.get('bossLore').classList.contains('show'),false);assert.equal(run('s.targetIndex'),0);
assert(parseFloat(elements.get('soldierLore').style.left)>=12);assert(parseFloat(elements.get('soldierLore').style.top)>=10);
run('cfg.enemyDieSides=6;showSoldierLore(2)');assert.match(elements.get('soldierLore').innerHTML,/D6/);
run('s.enemies[2].hp=0;render()');assert.equal(elements.get('soldierLore').classList.contains('show'),false);
run('showSoldierLore(2)');assert.equal(elements.get('soldierLore').classList.contains('show'),false);
run('showSoldierLore(1);resetBattle("puppet")');assert.equal(elements.get('soldierLore').classList.contains('show'),false);
console.log('PASS: soldier hover lore matches each actor, preserves targeting and clears on death / chapter change.');
