const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {run,context,elements}=require('./training-flow.test.cjs');
// A deterministic wall clock exercises the two-minute timer without waiting in real time.
let now=10000,serial=0;const scheduled=new Map(),preferences=new Map();
context.Date=class extends Date{static now(){return now}};
context.setTimeout=(fn,ms=0)=>{const id=++serial;scheduled.set(id,{fn,at:now+ms});return id};
context.setInterval=(fn,ms)=>{const id=++serial;scheduled.set(id,{fn,at:now+ms,every:ms});return id};
context.clearTimeout=context.clearInterval=id=>scheduled.delete(id);
context.localStorage={getItem:key=>preferences.get(key)||null,setItem:(key,val)=>preferences.set(key,val)};
function advance(ms){const end=now+ms;for(let count=0;count<10000;count++){const entry=[...scheduled].filter(([,task])=>task.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry){now=end;return}const [id,task]=entry;now=task.at;if(task.every)task.at+=task.every;else scheduled.delete(id);task.fn()}throw Error('timer loop')}
run('stopTutorial();const randomBeforeBroadcastTest=Math.random;Math.random=()=>.9;showTurnBanner=()=>{}');
vm.runInContext(fs.readFileSync(require.resolve('./battle-broadcast.js'),'utf8'),context);
function setup(mode='boss'){run(`stopTutorial();document.querySelector('.settings').open=false;resetBattle('${mode}');s.busy=false;Math.random=()=>.9;battleBroadcast.setMode('both')`)}
const line=()=>elements.get('broadcastText').textContent;
const event=()=>run('battleBroadcast.current?.type');
function expectEvent(type){advance(200);assert.equal(event(),type)}
setup();run('Math.random=()=>0;battleBroadcast.emit("advantage")');expectEvent('advantage');assert.equal(line(),'真棒！就这样一鼓作气！');assert.match(elements.get('broadcastAvatar').src,/ximo-avatar/);
advance(5500);run('battleBroadcast.emit("heal")');expectEvent('heal');assert.equal(line(),'…还疼吗？…这下应该会好很多…');assert.match(elements.get('broadcastAvatar').src,/tiaoyao-avatar/);
advance(5500);run('battleBroadcast.emit("gold")');expectEvent('gold');assert.equal(line(),'金毛…会有很多人喜欢这样好相处的孩子吧…');
elements.get('broadcastMode').onchange({target:{value:'tiaoyao'}});run('battleBroadcast.emit("crane")');expectEvent('crane');assert.equal(line(),'隐士...自由但尖锐…');assert.equal(preferences.get('blackCatBroadcastMode'),'tiaoyao');
run('battleBroadcast.setMode("ximo");battleBroadcast.emit("fox")');expectEvent('fox');assert.equal(line(),'红狐姐…温柔而火热的…');
run('battleBroadcast.setMode("off");battleBroadcast.emit("warning")');assert.equal(elements.get('battleBroadcast').hidden,true);assert.equal(event(),undefined);
// A quiet turn start ALWAYS encourages; the rare branch replaces the ordinary line.
setup();run('battleBroadcast.setMode("ximo");s.turn="enemy";Math.random=()=>.9;beginPlayerTurn()');expectEvent('encourage');assert.equal(line(),'能和大家一起同行…真的很开心。');
run('battleBroadcast.clear();s.turn="enemy";Math.random=()=>.2;beginPlayerTurn()');expectEvent('encourage');assert.equal(line(),'接敌，准备迎战！');
run('battleBroadcast.clear();s.turn="enemy";Math.random=()=>.01;beginPlayerTurn()');expectEvent('special');assert.equal(line(),'这样的战斗方式吗…真是…受益匪浅…');
run('battleBroadcast.setMode("tiaoyao");s.turn="enemy";beginPlayerTurn()');expectEvent('special');assert.equal(line(),'哈…还不赖。再来啊！');
// Healing or another important turn-start message suppresses fallback encouragement.
setup();run('s.cat=1;applyHealing("cat",2);s.turn="enemy";beginPlayerTurn()');assert.equal(event(),undefined);advance(160);expectEvent('heal');assert.equal(run('battleBroadcast.queue.some(item=>item.type==="encourage"||item.type==="special")'),false);
// The warning precedes Apocalypse on the NEXT enemy turn, and outranks other commentary.
setup();run('resetBattle("boss",3);stopTutorial()');assert.equal(run('dragonAttackImminent()'),true);run('s.phase3Turn=1');assert.equal(run('dragonAttackImminent()'),false);
setup();run('battleBroadcast.setMode("tiaoyao");s.dragonTurn=1;s.turn="enemy";beginPlayerTurn()');assert.notEqual(event(),'warning');
run('battleBroadcast.clear();s.dragonTurn=2;s.turn="enemy";battleBroadcast.enemyBrokeShield=true;beginPlayerTurn()');expectEvent('warning');assert.equal(line(),'…小心点！有什么要来了…');
advance(6000);assert.equal(event(),undefined);assert.equal(run('battleBroadcast.queue.length'),0);
assert.equal(run('battleBroadcast.queue.some(item=>item.type==="encourage"||item.type==="special")'),false);
run('battleBroadcast.clear();s.bossPhase=2;render();s.dragonTurn=2;s.turn="enemy";beginPlayerTurn()');expectEvent('warning');
// Actual shield breaks, both types and independent enemies; merely damaging a shield is silent.
setup('puppet');run('damageEnemyPhysical(3)');advance(160);assert.equal(event(),undefined);run('damageEnemyPhysical(5)');advance(160);expectEvent('advantage');assert.equal(run('s.totalDamageDealt'),8);
run('battleBroadcast.clear();selectEnemy(1);s.enemies[1].magic=4;damageEnemyMagic(4)');advance(160);expectEvent('advantage');
run('battleBroadcast.clear();s.turn="enemy";s.enemies[1].physical=2;damageEnemyPhysical(2)');advance(160);assert.equal(event(),undefined);
setup();run('s.turn="enemy";s.catShield=3;damageAlly("cat",2)');assert.equal(run('battleBroadcast.enemyBrokeShield'),false);
run('damageAlly("cat",1)');assert.equal(run('battleBroadcast.enemyBrokeShield'),true);assert.equal(event(),undefined);run('beginPlayerTurn()');expectEvent('disadvantage');assert.equal(run('battleBroadcast.enemyBrokeShield'),false);
setup();run('s.turn="enemy";s.birdMagicShield=2;damageAlly("bird",2,"magic");beginPlayerTurn()');expectEvent('disadvantage');
// One enemy action can hit both actors with both damage types but speaks only once.
setup();run('battleBroadcast.setMode("ximo");s.turn="enemy";dragonDeal(1,1)');assert.equal(event(),undefined);advance(160);expectEvent('hit');assert.equal(line(),'...有点耍赖了吧...');assert.equal(run('battleBroadcast.queue.length'),0);
setup();run('battleBroadcast.setMode("tiaoyao");s.turn="enemy";damageAlly("cat",1)');advance(160);expectEvent('hit');assert.equal(line(),'...你等下回合的...');
for(const [speaker,expected] of [['ximo','...不能永远依靠她...汐霂，想想办法！'],['tiaoyao','...真是无能啊...岧峣...']]){
 setup();run(`battleBroadcast.setMode('${speaker}');Math.random=()=>.01;s.turn='enemy';damageAlly('cat',1)`);advance(160);expectEvent('specialHit');assert.equal(line(),expected);
}
setup();run('s.turn="enemy";damageAlly("cat",0)');advance(160);assert.equal(event(),undefined);
setup();run('damageAlly("cat",1)');advance(160);assert.equal(event(),undefined);
// Paid skills speak AFTER their actual result, including free evolution dice and hero skills.
setup();run('battleBroadcast.setMode("ximo");s.selected="bird";useSkill("enchant","bird")');advance(1105);assert.equal(event(),undefined);assert.equal(run('s.busy'),true);advance(720);expectEvent('combat');assert.equal(line(),'抱歉哦，这下会很疼的！');assert.equal(run('s.enchant'),12);
setup();run('battleBroadcast.setMode("tiaoyao");s.emberActivations=5;s.busy=true;finishRoll("enchant","bird",4,null)');advance(720);assert.equal(event(),undefined);assert.equal(run('s.busy'),true);advance(1115);expectEvent('combat');assert.equal(line(),'...冲锋吧...一往无前。');
setup();run('battleBroadcast.setMode("ximo");loadout.bird[2]="foxfire";s.foxUnlocked=true;s.enemyBurn=2;s.busy=true;finishRoll("foxfire","bird",3,null)');advance(720);assert.equal(event(),undefined);advance(1850);expectEvent('combat');assert.equal(run('s.enemyBurn'),0);
for(const [speaker,expected] of [['ximo','...你会喜欢这招的...'],['tiaoyao','...就知道你会喜欢...']]){
 setup();run(`battleBroadcast.setMode('${speaker}');Math.random=()=>.01;s.busy=true;finishRoll('enchant','bird',2,null)`);advance(720);expectEvent('specialCombat');assert.equal(line(),expected);
}
// Simply choosing / canceling a heal target never counts as using a skill.
setup();run('s.cat=10;s.selected="bird";useSkill("heal","bird");useSkill("heal","bird")');advance(300);assert.equal(event(),undefined);
// Healing both partners in one resolution produces one line; capped / zero healing does not.
setup();run('s.cat=10;s.bird=10;healParty(3)');advance(160);expectEvent('heal');assert.equal(run('battleBroadcast.queue.length'),0);assert.equal(run('s.cat'),13);assert.equal(run('s.bird'),13);
run('battleBroadcast.clear();s.cat=maxHp("cat");s.bird=maxHp("bird");healParty(10);applyHealing("cat",0)');advance(160);assert.equal(event(),undefined);
// Only installing a blessing triggers its line, not selecting, going back, or abandoning it.
for(const [boon,id] of [['tanuki','stone'],['fox','maple'],['crane','skyfall'],['gold','mountain']]){
 setup();run(`showBoonOffer('${boon}');selectBoonSkill('${boon}','${id}')`);assert.equal(event(),undefined);run('returnToBoonOffer()');assert.equal(event(),undefined);
 run(`selectBoonSkill('${boon}','${id}');installEquippedSkill(2)`);expectEvent(boon);assert.equal(elements.get('battleBroadcast').hidden,false);
}
setup();run('showBoonOffer("fox");abandonBoonOffer()');assert.equal(event(),undefined);
// Underlying combat events never speak over a tutorial or black screen / modal.
setup();run('tutorial.active=true;tutorial.index=0;battleBroadcast.emit("heal")');assert.equal(event(),undefined);run('stopTutorial()');
run('toggleChapterMenu(true);battleBroadcast.emit("gold")');assert.equal(elements.get('battleBroadcast').hidden,true);run('toggleChapterMenu(false);battleBroadcast.pump()');advance(200);assert.equal(elements.get('battleBroadcast').hidden,false);
run('document.querySelector(".settings").open=true;battleBroadcast.tick()');assert.equal(elements.get('battleBroadcast').hidden,true);run('document.querySelector(".settings").open=false;battleBroadcast.pump()');assert.equal(elements.get('battleBroadcast').hidden,false);
run('document.getElementById("phaseTransition").classList.add("active");battleBroadcast.pump()');assert.equal(elements.get('battleBroadcast').hidden,true);
// Reset cancels deferred lines and the idle timer is reset only by actual skill rolls / pauses.
setup();run('s.cat=1;applyHealing("cat",3);resetBattle("boss");s.busy=false');advance(160);assert.equal(event(),undefined);
setup();advance(120000);assert.equal(event(),undefined);advance(500);expectEvent('idle');
run('battleBroadcast.clear();startRoll("light","cat",1);clearInterval(diceTimer);finishRoll("light","cat",1,null)');advance(119000);assert.equal(event(),undefined);advance(1500);expectEvent('idle');
run('battleBroadcast.clear();toggleChapterMenu(true)');advance(130000);assert.equal(event(),undefined);run('toggleChapterMenu(false)');advance(1000);assert.equal(event(),undefined);
// All three special categories use the increased 8% chance, with a strict boundary.
for(const [random,rare] of [[.07,true],[.079,true],[.08,false]]){
 for(const [base,special] of [['combat','specialCombat'],['hit','specialHit']]){setup();run(`Math.random=()=>${random};battleBroadcast.variant('${base}')`);expectEvent(rare?special:base)}
 setup();run(`Math.random=()=>${random};s.turn='enemy';beginPlayerTurn()`);expectEvent(rare?'special':'encourage');
}
for(const speaker of ['ximo','tiaoyao'])assert(fs.statSync(require('node:path').resolve(__dirname,'..',run(`battleBroadcastLines.${speaker}.avatar`))).size>0);
// Simultaneous conditions elect exactly one winner, independent of callback order.
for(const order of [
 ['combat','hit','tanuki'],['combat','tanuki','hit'],['hit','combat','tanuki'],
 ['hit','tanuki','combat'],['tanuki','combat','hit'],['tanuki','hit','combat']
]){
 setup();run('battleBroadcast.lastSpeaker=null;Math.random=()=>0');
 for(const type of order)run(`battleBroadcast.emit('${type}')`);
 assert.equal(event(),undefined);assert.equal(elements.get('battleBroadcast').hidden,true);advance(199);assert.equal(event(),undefined);advance(1);
 assert.equal(event(),'tanuki');assert.equal(run('battleBroadcast.queue.length'),0);assert.equal(run('battleBroadcast.lastSpeaker'),'ximo');assert.equal(line(),'狸猫…是很勇敢的孩子呢…');
 advance(6000);assert.equal(event(),undefined);assert.equal(elements.get('battleBroadcast').hidden,true);
 run('battleBroadcast.emit("combat")');expectEvent('combat');assert.equal(run('battleBroadcast.lastSpeaker'),'tiaoyao');
}
for(const [first,second,winner] of [
 ['combat','hit','hit'],['hit','combat','hit'],['specialCombat','specialHit','specialHit'],
 ['combat','gold','gold'],['gold','combat','gold'],['specialHit','fox','fox'],['crane','specialHit','crane']
]){setup();run(`battleBroadcast.emit('${first}');battleBroadcast.emit('${second}')`);expectEvent(winner);assert.equal(run('battleBroadcast.queue.length'),0);advance(6000);assert.equal(event(),undefined)}
// A deferred multi-target hit still competes with an immediate skill / boon notification.
setup();run('battleBroadcast.lastSpeaker=null;Math.random=()=>0;s.turn="enemy";damageAlly("cat",1);battleBroadcast.emit("combat")');advance(100);run('battleBroadcast.emit("gold")');advance(100);assert.equal(event(),'gold');assert.equal(run('battleBroadcast.lastSpeaker'),'ximo');assert.equal(run('battleBroadcast.queue.length'),0);
// The window also waits for a hit batch started shortly before the decision, preventing a flash of the loser.
setup();run('battleBroadcast.emit("combat")');advance(150);run('s.turn="enemy";damageAlly("cat",1)');advance(50);assert.equal(event(),undefined);advance(110);assert.equal(event(),undefined);advance(200);assert.equal(event(),'hit');assert.equal(run('battleBroadcast.queue.length'),0);
// Visible higher-priority speech also suppresses lower speech instead of queuing it.
setup();run('battleBroadcast.emit("combat")');expectEvent('combat');run('battleBroadcast.emit("hit")');expectEvent('hit');const hitSpeaker=run('battleBroadcast.lastSpeaker');
run('battleBroadcast.emit("specialCombat")');advance(200);assert.equal(event(),'hit');assert.equal(run('battleBroadcast.lastSpeaker'),hitSpeaker);assert.equal(run('battleBroadcast.queue.length'),0);
run('battleBroadcast.emit("fox")');expectEvent('fox');run('battleBroadcast.emit("specialHit")');advance(200);assert.equal(event(),'fox');assert.equal(run('battleBroadcast.queue.length'),0);advance(6000);assert.equal(event(),undefined);
// A healing skill chooses its specific recovery line over the general skill line.
setup();run('s.cat=10;s.busy=true;finishRoll("heal","cat",4,null)');advance(1080);assert.equal(event(),'heal');assert.equal(run('battleBroadcast.queue.length'),0);
// Long async skill chains collect all conditions until the whole action is complete.
setup();run('loadout.cat[2]="skyfall";loadout.bird[2]="foxfire";s.craneUnlocked=true;s.foxUnlocked=true;s.magicShield=1;s.enemyBurn=4;s.busy=true;finishRoll("foxfire","bird",1,null)');
advance(2000);assert.equal(event(),undefined);assert.equal(run('s.busy'),true);assert.equal(run('battleBroadcast.queue[0].type'),'advantage');
advance(2600);assert.equal(event(),'advantage');assert.equal(run('s.busy'),false);assert.equal(run('battleBroadcast.current.scope.committed'),true);assert.equal(run('battleBroadcast.queue.length'),0);
const resolvedSpeaker=run('battleBroadcast.lastSpeaker');advance(4000);assert.equal(event(),undefined);assert.equal(run('battleBroadcast.lastSpeaker'),resolvedSpeaker);
// The matching enemy reaction chain also waits for its resolution rather than interrupting itself.
setup();run('s.turn="enemy";s.busy=true;const enemyActBeforeBroadcastTest=enemyAct;enemyAct=()=>{};resolveEnemyMove("heavy",1,3)');advance(500);assert.equal(event(),undefined);advance(220);assert.equal(event(),'hit');assert.equal(run('battleBroadcast.pendingEnemyAction'),null);run('enemyAct=enemyActBeforeBroadcastTest');
// Equal-priority events cannot restart animation, extend duration, or advance the narrator.
setup();run('battleBroadcast.emit("hit")');expectEvent('hit');const stableSpeaker=run('battleBroadcast.lastSpeaker'),stableUntil=run('battleBroadcast.until');
run('battleBroadcast.emit("specialHit")');advance(200);assert.equal(event(),'hit');assert.equal(run('battleBroadcast.lastSpeaker'),stableSpeaker);assert.equal(run('battleBroadcast.until'),stableUntil);
// Speech expires at its shorter deadline, without waiting for the 500ms housekeeping tick.
assert.equal(run('broadcastDuration("很短的台词")'),2200);assert.equal(run('broadcastDuration("字".repeat(100))'),3400);
setup();run('battleBroadcast.emit("combat")');expectEvent('combat');advance(2199);assert.equal(event(),'combat');advance(1);assert.equal(event(),'combat');assert.equal(elements.get('battleBroadcast').hidden,false);assert(elements.get('battleBroadcast').classList.contains('leaving'));advance(219);assert.equal(elements.get('battleBroadcast').hidden,false);advance(1);assert.equal(event(),undefined);assert.equal(elements.get('battleBroadcast').hidden,true);
// A higher-priority replacement cancels the previous fade completion instead of hiding the new line.
setup();run('battleBroadcast.emit("combat")');expectEvent('combat');advance(2200);assert.equal(run('battleBroadcast.fadingOut'),true);run('battleBroadcast.emit("gold")');expectEvent('gold');advance(30);assert.equal(event(),'gold');assert.equal(elements.get('battleBroadcast').hidden,false);assert.equal(run('battleBroadcast.fadingOut'),false);assert(!elements.get('battleBroadcast').classList.contains('leaving'));
// Acquisition internally renders BEFORE its wrapper emits the hero line. No attack may flash in that gap.
const broadcastText=elements.get('broadcastText'),textDescriptor=Object.getOwnPropertyDescriptor(broadcastText,'textContent');let recordedText=broadcastText.textContent;const displayedLines=[];
Object.defineProperty(broadcastText,'textContent',{configurable:true,get:()=>recordedText,set:value=>{recordedText=value;displayedLines.push(value)}});
setup();run('battleBroadcast.lastSpeaker=null;Math.random=()=>0;showBoonOffer("tanuki");battleBroadcast.emit("combat")');advance(1000);
run('selectBoonSkill("tanuki","stone")');advance(1000);run('installEquippedSkill(2)');
assert.deepEqual(displayedLines,[],'the internal acquisition render must never display the old attack candidate');
advance(200);assert.deepEqual(displayedLines,['狸猫…是很勇敢的孩子呢…']);assert.equal(run('battleBroadcast.lastSpeaker'),'ximo');advance(4000);assert.equal(event(),undefined);assert.equal(displayedLines.length,1);
for(const [boon,id] of [['tanuki','stone'],['fox','maple'],['crane','skyfall'],['gold','mountain']]){
 setup();displayedLines.length=0;run(`battleBroadcast.lastSpeaker=null;Math.random=()=>0;showBoonOffer('${boon}');battleBroadcast.emit('specialCombat')`);advance(1000);run(`selectBoonSkill('${boon}','${id}');installEquippedSkill(2)`);
 assert.deepEqual(displayedLines,[]);advance(200);assert.deepEqual(displayedLines,[run(`battleBroadcastLines.ximo.lines.${boon}[0]`)]);assert.equal(run('battleBroadcast.installingBoon'),0);advance(4000);assert.equal(displayedLines.length,1);
}
// Follow the real paid-skill -> D4 -> offer -> slot flow; queued skill / shield lines are consumed by the blessing.
setup();displayedLines.length=0;run('battleBroadcast.lastSpeaker=null;Math.random=()=>0;s.diceSpent=4;syncEmberReady();s.busy=true;finishRoll("light","cat",1,null)');advance(720);assert.equal(run('s.emberPhase'),'rolling');
advance(1450);assert.equal(run('s.emberPhase'),'offer');assert.deepEqual(displayedLines,[]);
run('selectBoonSkill("tanuki","stone");returnToBoonOffer();selectBoonSkill("tanuki","stone")');advance(1500);assert.deepEqual(displayedLines,[]);
run('installEquippedSkill(2)');assert.deepEqual(displayedLines,[]);advance(200);assert.deepEqual(displayedLines,['狸猫…是很勇敢的孩子呢…']);advance(4000);assert.equal(displayedLines.length,1);
// Abandoning the offer also cannot resurrect the discarded attack line.
setup();displayedLines.length=0;run('Math.random=()=>0;s.diceSpent=4;syncEmberReady();s.busy=true;finishRoll("light","cat",1,null)');advance(2170);run('abandonBoonOffer()');advance(1000);assert.deepEqual(displayedLines,[]);
Object.defineProperty(broadcastText,'textContent',{...textDescriptor,value:recordedText});
// Real full enemy rounds produce exactly first / last hit lines, across both puppets and Dragon buffs.
const hitText=elements.get('broadcastText'),hitTextDescriptor=Object.getOwnPropertyDescriptor(hitText,'textContent'),hitController=run('battleBroadcast'),hitDisplays=[];let latestHitText=hitText.textContent;
Object.defineProperty(hitText,'textContent',{configurable:true,get:()=>latestHitText,set:value=>{latestHitText=value;if(hitController.current?.group==='hit')hitDisplays.push({type:hitController.current.type,moment:hitController.current.scope?.hitMoment,count:hitController.enemyHits.count})}});
for(const [mode,expectedAttacks,intercept] of [['puppet',4,false],['boss',2,false],['puppet',2,true]]){
 setup(mode);hitDisplays.length=0;
 if(intercept)run('loadout.cat[2]="skyfall";s.craneUnlocked=true');
 run('s.cat=10000;s.bird=10000;s.catShield=0;s.catMagicShield=0;s.birdShield=0;s.birdMagicShield=0;Math.random=()=>.9;startEnemyTurn();enemyAct()');
 for(let tick=0;tick<800&&run('s.turn==="enemy"');tick++)advance(100);
 assert.equal(run('s.turn'),'player');advance(300);assert.equal(run('battleBroadcast.enemyHits.count'),expectedAttacks);
 assert.deepEqual(hitDisplays.map(item=>item.moment),['first','last']);assert.deepEqual(hitDisplays.map(item=>item.count),[1,expectedAttacks]);assert.equal(hitDisplays.length,2);
 advance(4000);assert.equal(hitDisplays.length,2);
}
// One hit, including both characters / both shield types, never gets a duplicate last-hit line.
setup();hitDisplays.length=0;run('s.turn="enemy";battleBroadcast.beginEnemyHits();dragonDeal(1,1)');advance(360);assert.equal(run('battleBroadcast.enemyHits.count'),1);
run('battleBroadcast.finishEnemyHits();battleBroadcast.finishEnemyHits()');advance(4000);assert.deepEqual(hitDisplays.map(item=>item.moment),['first']);
// Rapid distinct attacks still get first and last, never the middle ones; rare variants share the cap.
setup();hitDisplays.length=0;run('s.turn="enemy";Math.random=()=>.01;battleBroadcast.beginEnemyHits();damageAlly("cat",1)');advance(360);
for(let i=0;i<3;i++){run('damageAlly("cat",1)');advance(200);assert.equal(hitDisplays.length,1)}
run('battleBroadcast.finishEnemyHits()');advance(200);assert.deepEqual(hitDisplays.map(item=>item.moment),['first','last']);assert(hitDisplays.every(item=>item.type==='specialHit'));
run('battleBroadcast.finishEnemyHits()');advance(4000);assert.equal(hitDisplays.length,2);
// Zero-damage / canceled attacks consume no first or last hit slot, and a fresh turn resets the quota.
setup();hitDisplays.length=0;run('s.turn="enemy";battleBroadcast.beginEnemyHits();damageAlly("cat",0);battleBroadcast.finishEnemyHits()');advance(500);assert.equal(run('battleBroadcast.enemyHits.count'),0);assert.equal(hitDisplays.length,0);
run('battleBroadcast.beginEnemyHits();damageAlly("cat",1)');advance(360);assert.equal(hitDisplays.length,1);assert.equal(hitDisplays[0].moment,'first');
Object.defineProperty(hitText,'textContent',{...hitTextDescriptor,value:latestHitText});
// Desktop placement is left of AP, clear of the title, and keeps the protruding portrait on-screen.
for(const geometry of [
 {game:{left:0,top:0,width:2560},turn:{left:1120,top:20,bottom:170},title:{right:250,bottom:90}},
 {game:{left:0,top:0,width:1440},turn:{left:590,top:20,bottom:170},title:{right:225,bottom:90}},
 {game:{left:0,top:0,width:1024},turn:{left:350,top:20,bottom:170},title:{right:200,bottom:90}},
 {game:{left:30,top:20,width:1440},turn:{left:620,top:40,bottom:190},title:{right:255,bottom:110}}
]){context.broadcastGeometry=geometry;const pos=run('broadcastPlacement(broadcastGeometry.game,broadcastGeometry.turn,broadcastGeometry.title)');assert(pos.left>=18);assert(pos.top>=30);assert(pos.left+pos.width+geometry.game.left<=geometry.turn.left-20);assert(pos.left-18+geometry.game.left>geometry.title.right||pos.top-30+geometry.game.top>=geometry.title.bottom)}
context.broadcastGeometry={game:{left:0,top:0,width:640},turn:{left:180,top:68,bottom:210},title:{right:160,bottom:60}};const mobile=run('broadcastPlacement(broadcastGeometry.game,broadcastGeometry.turn,broadcastGeometry.title)');assert(mobile.left>=18);assert(mobile.left+mobile.width<=640-18);assert(mobile.top-30>=210);
context.broadcastGeometry={game:{left:0,top:0,width:2560},turn:{left:1120,top:20,bottom:170},title:{right:250,bottom:90}};assert.equal(run('broadcastPlacement(broadcastGeometry.game,broadcastGeometry.turn,broadcastGeometry.title).left'),652);
// First Boss death always hints, even over the retry modal; later defeats use the rare branch.
setup();run('battleBroadcast.bossDeaths=0;battleBroadcast.defeatedStates=new WeakSet();battleBroadcast.setMode("ximo");s.cat=0;s.bird=0;checkEnd();showBossRetryMenu()');expectEvent('debugHint');
assert.equal(line(),'...嗯咳咳...右侧有一个神秘的小按钮，如果实在打不过的话...');assert.equal(elements.get('battleBroadcast').hidden,false);
assert(elements.get('battleBroadcast').classList.contains('defeat-hint'));assert.equal(run('battleBroadcast.outsideGame'),true);
run('checkEnd();render();render()');assert.equal(run('battleBroadcast.bossDeaths'),1);assert.equal(run('battleBroadcast.queue.length'),0);
run('restartBossFromEntry()');assert.equal(run('battleBroadcast.outsideGame'),false);assert(!elements.get('battleBroadcast').classList.contains('defeat-hint'));
setup();run('s.cat=0;s.bird=0;checkEnd()');advance(500);assert.equal(event(),undefined);assert.equal(run('battleBroadcast.bossDeaths'),2);
setup();run('battleBroadcast.setMode("tiaoyao");Math.random=()=>.01;s.cat=0;s.bird=0;checkEnd()');expectEvent('debugHint');assert.equal(line(),'...（暗示地向右侧看看）');
setup('puppet');run('s.cat=0;s.bird=0;checkEnd()');advance(500);assert.equal(event(),undefined);assert.equal(run('battleBroadcast.bossDeaths'),3);
// Actual debug edits replace ordinary speech and honor speaker selection / alternation.
for(const [speaker,health,dice,boon] of [['ximo','...血脉...觉醒吧！','...命运...逆转吧！','...灵魂...重燃吧！'],['tiaoyao','...喔，这么高。','...嚯，也行吧。','...哇，这么强。']]){
 setup();run(`battleBroadcast.setMode('${speaker}');syncChapterSettings();document.getElementById('catMax').value=String(cfg.bossCatMax+10);applySettings()`);expectEvent('debugHealth');assert.equal(line(),health);
 run('syncChapterSettings();document.getElementById("partyDieSides").value=cfg.partyDieSides===6?"10":"6";applySettings()');expectEvent('debugDice');assert.equal(line(),dice);
 run('battleBroadcast.clear();s.busy=false;document.getElementById("debugBoon").value="tanuki";debugSummonBoon()');advance(500);assert.equal(event(),undefined);
 run('selectBoonSkill("tanuki","stone");returnToBoonOffer();selectBoonSkill("tanuki","stone");installEquippedSkill(2)');expectEvent('debugBoon');assert.equal(line(),boon);assert.equal(run('s.debugBoonOffer'),false);assert.equal(run('battleBroadcast.queue.length'),0);
}
// Multiple edits in one apply produce one line, with health taking precedence over dice.
setup();run('syncChapterSettings();document.getElementById("catMax").value=String(cfg.bossCatMax+1);document.getElementById("partyDieSides").value=cfg.partyDieSides===6?"10":"6";applySettings()');expectEvent('debugHealth');assert.equal(run('battleBroadcast.queue.length'),0);
setup();run('battleBroadcast.lastSpeaker=null;battleBroadcast.setMode("both");syncChapterSettings();document.getElementById("catMax").value=String(cfg.bossCatMax+1);applySettings()');expectEvent('debugHealth');assert.equal(run('battleBroadcast.lastSpeaker'),'tiaoyao');
run('syncChapterSettings();document.getElementById("partyDieSides").value=cfg.partyDieSides===6?"10":"6";applySettings()');expectEvent('debugDice');assert.equal(run('battleBroadcast.lastSpeaker'),'ximo');
// Rare reviews replace the standard review, and the long secret line has enough reading time.
for(const speaker of ['ximo','tiaoyao']){
 setup();run(`battleBroadcast.setMode('${speaker}');Math.random=()=>.01;syncChapterSettings();document.getElementById('birdMax').value=String(cfg.bossBirdMax+1);applySettings()`);expectEvent('debugSpecial');
 assert.equal(line(),run(`battleBroadcastLines.${speaker}.lines.debugSpecial[0]`));assert.equal(run('battleBroadcast.queue.length'),0);
 if(speaker==='tiaoyao')assert(run('battleBroadcast.until-Date.now()>3400'));
}
// Abandoning / rejecting a debug offer must not tag a later natural boon as a debug edit.
setup();run('document.getElementById("debugBoon").value="tanuki";debugSummonBoon();abandonBoonOffer();showBoonOffer("fox");selectBoonSkill("fox","maple");installEquippedSkill(2)');expectEvent('fox');
setup();run('s.busy=true;debugSummonBoon()');advance(500);assert.equal(event(),undefined);assert(!run('s.debugBoonOffer'));
setup();run('syncChapterSettings();applySettings()');advance(500);assert.equal(event(),undefined);
setup();run('battleBroadcast.setMode("off");syncChapterSettings();document.getElementById("catMax").value=String(cfg.bossCatMax+1);applySettings()');advance(500);assert.equal(event(),undefined);assert.equal(elements.get('battleBroadcast').hidden,true);
// The final narrative takes precedence, including a simultaneous defeat / Boss kill.
vm.runInContext(fs.readFileSync(require.resolve('./game-ending.js'),'utf8'),context);
setup();run('resetBattle("boss",3);s.cat=0;s.bird=0;s.enemies[0].hp=0;const deathsBeforeEnding=battleBroadcast.bossDeaths;checkEnd()');advance(500);
assert.equal(run('gameEnding.active'),true);assert.equal(event(),undefined);assert.equal(run('battleBroadcast.bossDeaths'),run('deathsBeforeEnding'));
run('Math.random=randomBeforeBroadcastTest');
console.log('PASS: battle priority / fades, first-last hit quotas, debug death hints / edits / rare lines, speaker modes, acquisition exclusivity, finale and placement.');

// Menu-only all-blessing asides require four ACTIVE talents, not historical unlock flags.
function allBoonsSetup(){setup();run('battleBroadcast.lastSpeaker=null;toggleChapterMenu(false);loadout.cat[2]="stone";loadout.cat[3]="mountain";loadout.bird[2]="maple";loadout.bird[3]="skyfall";for(const kind of ["tanuki","fox","crane","gold"])s[kind+"Unlocked"]=true')}
allBoonsSetup();run('Math.random=()=>.01;toggleChapterMenu(true)');expectEvent('allBoons');assert.equal(line(),'...组一辈子乐队？');assert.equal(elements.get('battleBroadcast').hidden,false);assert.equal(elements.get('battleBroadcast').classList.contains('menu-comment'),true);
advance(4000);run('toggleChapterMenu(true)');advance(200);assert.equal(event(),undefined);
run('toggleChapterMenu(false);toggleChapterMenu(true)');expectEvent('allBoons');assert.equal(line(),'...我已启动。');
run('toggleChapterMenu(false)');assert.equal(elements.get('battleBroadcast').hidden,true);
allBoonsSetup();run('battleBroadcast.setMode("tiaoyao");Math.random=()=>.01;toggleChapterMenu(true)');expectEvent('allBoons');assert.equal(line(),'...我已启动。');run('toggleChapterMenu(false)');
allBoonsSetup();run('loadout.bird[3]=null;Math.random=()=>.01;toggleChapterMenu(true)');advance(200);assert.equal(event(),undefined);run('toggleChapterMenu(false)');
allBoonsSetup();run('Math.random=()=>.08;toggleChapterMenu(true)');advance(200);assert.equal(event(),undefined);run('toggleChapterMenu(false)');
allBoonsSetup();run('battleBroadcast.setMode("off");Math.random=()=>.01;toggleChapterMenu(true)');advance(200);assert.equal(event(),undefined);run('toggleChapterMenu(false)');
allBoonsSetup();run('Math.random=()=>.01;battleBroadcast.emit("gold");toggleChapterMenu(true)');advance(200);assert.notEqual(event(),'allBoons');run('toggleChapterMenu(false)');
console.log('PASS: all-blessing menu aside eligibility, rarity, speaker alternation and acquisition priority.');
