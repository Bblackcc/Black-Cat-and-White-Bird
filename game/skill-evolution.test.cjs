const assert=require('node:assert/strict');
const {run,flushUntil,timers,elements}=require('./training-flow.test.cjs');
function setup(damage=0,embers=0){timers.length=0;run(`stopTutorial();resetBattle('boss');s.enemies[0].hp=1000;s.enemies[0].physical=100;s.enemies[0].magic=100;s.totalDamageDealt=${damage};s.emberActivations=${embers};s.emberReady=0;s.busy=false`)}
function paidResult(id,who,d1,d2=null){run(`s.busy=true;finishRoll('${id}','${who}',${d1},${d2})`);flushUntil('!s.busy')}
setup();assert.equal(run('s.cat'),120);assert.equal(run('s.bird'),100);for(const key of ['catShield','catMagicShield','birdShield','birdMagicShield'])assert.equal(run('s.'+key),5);
// Each tier has distinct physical / magic damage; progress only changes subsequent attacks.
for(const [progress,pLoss,mLoss] of [[0,4,0],[200,4,2],[400,6,4],[800,8,6]]){setup(progress);run("resolveBasicAttack('light',4,null)");assert.equal(run('s.shield'),100-pLoss);assert.equal(run('s.magicShield'),100-mLoss)}
for(const [progress,part,magic] of [[0,2,0],[300,2,2],[600,4,2],[1200,4,4]]){setup(progress);run("resolveBasicAttack('heavy',1,3)");assert.equal(run('s.shield'),100-part);assert.equal(run('s.enemy'),1000-part);assert.equal(run('s.magicShield'),100-magic)}
setup();run("s.enemies[0].physical=0;resolveBasicAttack('heavy',1,3)");assert.equal(run('s.enemy'),996);
setup(199);run("const crossingAttack=resolveBasicAttack('light',6,null)");assert.equal(run('crossingAttack.damage.magic'),0);assert.equal(run("evolutionLevel('light')"),1);assert.equal(run('s.totalDamageDealt'),205);
// Marked Light III spends all cat physical shield and transfers half of the bird shield exactly.
setup(800);run("s.marked=true;s.enemyBurn=2;s.catShield=10;s.birdShield=8;const lightIII=resolveBasicAttack('light',4,null)");assert.equal(run('s.shield'),82);assert.equal(run('s.magicShield'),94);assert.equal(run('s.catShield'),4);assert.equal(run('s.birdShield'),4);assert.equal(run('s.enemyBurn'),5);assert.equal(run('lightIII.breaks.length'),1);
// The generated break event actually runs Rampart, with no extra AP cost.
setup(800);run("s.marked=true;s.catShield=10;s.birdShield=8;loadout.cat[2]='rampart';s.goldUnlocked=true;const previousRoll=rollPartyDie;rollPartyDie=()=>5");paidResult('light','cat',4);assert.equal(run('s.shield'),77);assert.equal(run('s.ap'),4);run('rollPartyDie=previousRoll');
// Heavy III triggers a normal mark once, never re-marks with Brew, and can exceed the burn cap.
setup(1200);run("s.marked=true;s.enemyBurn=5;loadout.cat[2]='brew';s.tanukiUnlocked=true;resolveBasicAttack('heavy',1,3)");assert.equal(run('s.marked'),false);assert.equal(run('s.enemyBurn'),7);assert.equal(run('s.shield'),80);assert.equal(run('s.magicShield'),88);assert.equal(run('s.catShield'),13);assert.equal(run('s.catMagicShield'),9);
run('s.pendingBurnLayers=2;applyPendingBurn()');assert.equal(run('s.enemyBurn'),7);
setup(1200);run("s.marked=true;s.enemies[0].markStolen=true;resolveBasicAttack('heavy',1,3)");assert.equal(run('s.marked'),false);assert.equal(run('s.shield'),96);assert.equal(run('s.magicShield'),96);assert.equal(run('s.catShield'),5);
// Enchant evolves from paid magic plus one free physical die; free dice spend neither AP nor embers.
for(const [embers,magic,physical] of [[0,8,0],[5,8,5],[8,10,7.5],[12,12,10]]){setup(0,embers);run('rollPartyDie=()=>5');paidResult('enchant','bird',4);assert.equal(run('s.enchant'),magic);assert.equal(run('s.enchantPhysical'),physical);assert.equal(run('s.ap'),4);assert.equal(run('s.diceSpent'),0);run("resolveBasicAttack('light',2,null)");assert.equal(run('s.shield'),98-physical);assert.equal(run('s.magicShield'),100-magic);assert.equal(run('s.enchant'),0);assert.equal(run('s.enchantPhysical'),0)}
// Heal tiers affect both characters. Max-tier overflow from any heal is saved and consumed once.
for(const [embers,cat,bird] of [[0,54,50],[7,54,52],[10,56,54],[15,58,56]]){setup(0,embers);run('s.cat=50;s.bird=50');paidResult('heal','cat',4);assert.equal(run('s.cat'),cat);assert.equal(run('s.bird'),bird)}
setup(0,15);run('s.cat=118;s.bird=99');paidResult('heal','cat',4);assert.equal(run('s.cat'),120);assert.equal(run('s.bird'),100);assert.equal(run('s.overflowBonus.physical'),6);assert.equal(run('s.overflowBonus.magic'),5);run('healParty(4)');assert.equal(run('s.overflowBonus.physical'),10);assert.equal(run('s.overflowBonus.magic'),9);assert(run('canUsePlayerSkill()'));run("resolveBasicAttack('light',2,null)");assert.equal(run('s.shield'),88);assert.equal(run('s.magicShield'),91);assert.equal(run('s.overflowBonus.physical'),0);assert.equal(run('s.overflowBonus.magic'),0);
// Enchant III applies burning first, then resolves all remaining D4 ticks and activates Maple.
setup(0,12);run("loadout.cat[2]='maple';s.foxUnlocked=true;s.cat=50;s.bird=40;s.enchant=12;s.enchantPhysical=10;s.enchantDetonate=true;s.pendingBurn=2;s.pendingBurnLayers=2;s.enemyBurn=1;const burstResult=resolveBasicAttack('light',1,null);let burstDone=false;const randomBeforeBurst=Math.random;Math.random=()=>0;detonateEvolvedEnchantment(burstResult,()=>burstDone=true)");flushUntil('burstDone');run('Math.random=randomBeforeBurst');assert.equal(run('s.enemyBurn'),0);assert.equal(run('s.magicShield'),83);assert.equal(run('s.cat'),56);assert.equal(run('s.bird'),46);assert.equal(run('s.diceSpent'),0);
// Only the next tier is revealed and queued / abandoned ember activations still count.
setup(0,4);run('s.emberReady=1');assert.equal(run("evolutionLevel('enchant')"),1);assert(run("initialSkillDescription('enchant').includes('累计激活过8个')"));assert(!run("initialSkillDescription('enchant').includes('累计激活过12个')"));run("s.emberPhase='offer';s.emberBoon='fox';abandonBoonOffer()");assert.equal(run('activatedEmbers()'),5);
setup(1200,15);assert(!run("initialSkillDescription('heavy').includes('下一级')"));assert.equal((run("evolutionDiamonds('heavy')").match(/◆/g)||[]).length,3);
// Only the next effect is muted; current effects and unlock conditions remain in the normal color.
setup();const descriptionMarkup=run("evolutionTooltipMarkup(initialSkillDescription('light'))");assert(descriptionMarkup.includes('<span class="evolution-next-effect">解锁后：'));assert(descriptionMarkup.indexOf('解锁条件：')<descriptionMarkup.indexOf('<span'));assert(!run("evolutionTooltipMarkup('当前 <b>效果</b>')").includes('<b>'));
setup(1200);assert(!run("evolutionTooltipMarkup(initialSkillDescription('heavy'))").includes('evolution-next-effect'));
// Boss entry refills health after restoring boons and retains existing shields plus the five-point gift.
setup();run("resetBattle('puppet');loadout.bird[2]='maple';s.foxUnlocked=true;s.totalDamageDealt=123;s.emberActivations=6;s.diceSpent=32;s.cat=1;s.bird=2;s.catShield=2;s.catMagicShield=3;s.birdShield=4;s.birdMagicShield=6;s.enemies.forEach(e=>e.hp=0);checkEnd()");flushUntil('s.battleMode==="boss"');assert.equal(run('s.cat'),140);assert.equal(run('s.bird'),120);assert.equal(run('s.catShield'),7);assert.equal(run('s.catMagicShield'),8);assert.equal(run('s.birdShield'),9);assert.equal(run('s.birdMagicShield'),11);assert.equal(run('s.totalDamageDealt'),123);assert.equal(run('s.emberActivations'),6);
// The new requirements apply exactly at each boundary and are reflected in the next-tier text.
for(const [id,thresholds,metric] of [['light',[200,400,800],'damage'],['heavy',[300,600,1200],'damage'],['enchant',[5,8,12],'embers'],['heal',[7,10,15],'embers']]){
 for(let tier=0;tier<3;tier++){
  const limit=thresholds[tier];setup(metric==='damage'?limit-1:0,metric==='embers'?limit-1:0);
  assert.equal(run(`evolutionLevel('${id}')`),tier);assert(run(`initialSkillDescription('${id}').includes('${metric==='damage'?'累计造成':'累计激活过'}${limit}')`));
  run(metric==='damage'?`s.totalDamageDealt=${limit}`:`s.emberActivations=${limit}`);
  assert.equal(run(`evolutionLevel('${id}')`),tier+1);assert.equal((run(`evolutionDiamonds('${id}')`).match(/◆/g)||[]).length,tier+1);
  if(tier===2)assert(!run(`initialSkillDescription('${id}').includes('下一级')`));
 }
}
console.log('PASS: all evolution tiers, actual damage thresholds, Boss entry, mark / burn / Rampart / Maple interactions, free enchant dice and global overheal conversion.');
