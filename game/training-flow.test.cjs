// State-flow regression checks; lightweight DOM stubs do not validate visual layout.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').resolve(__dirname,'../Black Cat and White Bird.html'),'utf8'),elements=new Map(),timers=[];
class Element{
 constructor(id=''){this.id=id;this.style={};this.dataset={};this.children=[];this.attrs={};this.hidden=false;this.value='';this.textContent='';const classes=new Set();this.classList={add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>{on=on===undefined?!classes.has(x):on;on?classes.add(x):classes.delete(x);return on}}}
 set innerHTML(value){this._html=value;this.children=[];for(const match of value.matchAll(/id="([^"]+)"/g))if(!elements.has(match[1]))elements.set(match[1],new Element(match[1]))}
 get innerHTML(){return this._html||''}
 appendChild(child){this.children.push(child);if(child.id)elements.set(child.id,child);return child}
 append(child){return this.appendChild(child)} prepend(child){this.children.unshift(child);if(child.id)elements.set(child.id,child)}
 after(child){if(child.id)elements.set(child.id,child)}
 addEventListener(){}setAttribute(key,value){this.attrs[key]=value}getAttribute(key){return this.attrs[key]}
 getBoundingClientRect(){return{left:0,top:0,right:150,bottom:60,width:150,height:60}}
 querySelectorAll(){return[]}cloneNode(){return new Element()}closest(){return null}
}
for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],new Element(match[1]));
for(const suffix of ['-second','-third'])for(const id of ['enemyName','enemySub','puppet','enemyPortrait','markTag','shieldTag','burnStatus','burnStack','enemyBar','enemyHp','shieldBar','shieldLabel','magicShieldBar','magicShieldLabel','floatHp','floatShield','floatMagicShield'])elements.set(id+suffix,new Element(id+suffix));
const extras=new Map();const doc={body:new Element('body'),getElementById:id=>elements.get(id)||null,createElement:()=>new Element(),addEventListener(){},querySelectorAll:()=>[],querySelector:selector=>{if(!extras.has(selector))extras.set(selector,new Element());return extras.get(selector)}};
const context={console,document:doc,window:{addEventListener(){}},innerWidth:1440,innerHeight:900,requestAnimationFrame:fn=>fn(),setTimeout:(fn)=>{const item={fn,active:true,once:true};timers.push(item);return item},clearTimeout:t=>{if(t)t.active=false},setInterval:fn=>{const item={fn,active:true};timers.push(item);return item},clearInterval:t=>{if(t)t.active=false}};
vm.createContext(context);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);vm.runInContext(fs.readFileSync(require.resolve('./game-expansion.js'),'utf8'),context);vm.runInContext(fs.readFileSync(require.resolve('./skill-evolution.js'),'utf8'),context);vm.runInContext(fs.readFileSync(require.resolve('./boss-retry.js'),'utf8'),context);vm.runInContext(fs.readFileSync(require.resolve('./dragon-phase-two.js'),'utf8'),context);vm.runInContext(fs.readFileSync(require.resolve('./dragon-phase-three.js'),'utf8'),context);
const run=code=>vm.runInContext(code,context);
function flushUntil(predicate){for(let tick=0;tick<500;tick++){if(run(predicate))return;const tasks=timers.filter(t=>t.active);assert(tasks.length,'no pending timer before expected state: '+predicate);for(const task of tasks){if(task.once)task.active=false;task.fn()}}throw Error('timer limit: '+predicate)}
assert.equal(run('s.battleMode'),'puppet');assert.equal(run('s.enemies.length'),2);assert.equal(run('tutorial.index'),0);
run('selectEnemy(1);damageEnemyPhysical(12)');assert.equal(run('s.enemies[0].hp'),60);assert.equal(run('s.enemies[1].hp'),56);assert.equal(run('s.enemies[0].physical'),8);assert.equal(run('s.enemies[1].physical'),0);
run('startTutorial();for(let i=0;i<6;i++)nextTutorial();useSkill("light","cat")');flushUntil('tutorial.index===7');assert.equal(run('s.ap'),3);assert.equal(run('s.turn'),'player');
run('nextTutorial();nextTutorial();selectHero("bird");nextTutorial();useSkill("enchant","bird")');flushUntil('tutorial.index===12');assert.equal(run('s.ap'),2);assert(run('s.enchant>0'));
run('nextTutorial();selectHero("cat");useSkill("heavy","cat")');flushUntil('tutorial.index===15');assert.equal(run('s.ap'),0);assert.equal(run('s.turn'),'player');assert.equal(run('s.emberReady'),1);
run('nextTutorial();nextTutorial()');flushUntil('s.emberPhase==="offer"&&!tutorial.waiting');assert.equal(run('tutorial.index'),17);assert.equal(run('s.turn'),'player');
run('nextTutorial();selectBoonSkill("tanuki","stone")');assert.equal(run('tutorial.index'),19);run('nextTutorial();installEquippedSkill(2)');assert.equal(run('tutorial.index'),21);assert.equal(run('loadout.cat[2]'),'stone');assert(run('talentActive("tanuki")'));
run('while(tutorial.index<28)nextTutorial()');assert.equal(run('tutorial.index'),28);
// Each puppet owns two action points. An exhausted first puppet hands control to the second.
run('stopTutorial();resetBattle("puppet");s.turn="enemy";s.puppetBudgets=[0,2];s.enemyRoundDice=4;s.enemyAp=2;enemyAct()');assert.equal(run('s.targetIndex'),1);assert.equal(run('availableEnemyAp()<=2'),true);
// Dead puppets are not victory while another remains; targeting automatically moves to a live unit.
run('timersClear=0;s.enemies[0].hp=0;s.enemies[1].hp=30;s.targetIndex=0;s.busy=false;checkEnd()');assert.equal(run('s.over'),false);assert.equal(run('s.targetIndex'),1);
// Training victory enters Boss and retains equipped skills and acquired blessings.
run('startTutorial();const coverSamples=[],renderBeforeCover=render;render=function(){if(tutorial.transitioning)coverSamples.push(!tutorialBlackout.hidden);return renderBeforeCover()};loadout.cat[2]="stone";s.tanukiUnlocked=true;s.enemies.forEach(e=>e.hp=0);checkEnd()');assert.equal(elements.get('tutorialBlackout').hidden,false);flushUntil('s.battleMode==="boss"');assert.equal(elements.get('tutorialBlackout').hidden,false);assert(run('coverSamples.length>0&&coverSamples.every(Boolean)'));run('render=renderBeforeCover');assert.equal(run('tutorial.index'),29);assert.equal(run('loadout.cat[2]'),'stone');assert.equal(run('enemyDieSides()'),10);run('nextTutorial();nextTutorial();nextTutorial()');assert.equal(run('tutorial.fading'),true);flushUntil('!tutorial.active');assert.equal(run('tutorial.active'),false);assert.equal(run('s.busy'),false);assert.equal(elements.get('tutorialBlackout').hidden,true);
// The setting can also produce a single puppet with the original four-die enemy turn.
run('cfg.puppetCount=1;resetBattle("puppet")');assert.equal(run('s.enemies.length'),1);assert.equal(run('enemyActionDice()'),4);
// Exercise a full enemy round, including the real light/heavy random action scheduler.
timers.length=0;
run('cfg.puppetCount=2;cfg.catMax=999;cfg.birdMax=999;resetBattle("puppet");const spentByPuppet=[0,0],resolveForBudgetTest=resolveEnemyMove;resolveEnemyMove=function(move,...args){spentByPuppet[s.targetIndex]+=move==="heavy"?2:1;resolveForBudgetTest(move,...args)};startEnemyTurn()');
flushUntil('s.turn==="player"&&s.round===2');assert.equal(run('spentByPuppet[0]'),2);assert.equal(run('spentByPuppet[1]'),2);
// Area attacks and burn detonations must update each enemy separately.
run('resetBattle("puppet");s.enemies.forEach(e=>{e.physical=0;e.magic=0});damageEnemyPhysical(4);damageOtherEnemies(4,0)');assert.equal(run('s.enemies[0].hp'),56);assert.equal(run('s.enemies[1].hp'),56);
run('s.enemies[0].burn=2;s.enemies[1].burn=1;detonateEnemyBurn([1,2,4])');assert.equal(run('s.enemies[0].hp'),53);assert.equal(run('s.enemies[1].hp'),52);assert.equal(run('totalEnemyBurn()'),0);
// Tight stepped paths surround portraits; skills use compact pixel boxes.
assert.match(run('tutorialSpotlight({left:500,top:200,width:100,height:150},"portrait").shape("none","white")'),/^<path .*stroke="white".*shape-rendering="crispEdges"/);
assert.equal(run('tutorialSpotlight({left:500,top:200,width:100,height:150},"portrait").bounds.width'),112);
assert.equal(run('tutorialSpotlight({left:500,top:200,width:400,height:60},"box").bounds.width'),408);
assert(!run('tutorialSpotlight({left:500,top:200,width:400,height:60},"box").shape("none","white")').includes('<ellipse'));
for(const target of [{left:650,top:250,right:800,bottom:420},{left:1100,top:680,right:1250,bottom:800},{left:10,top:10,right:130,bottom:140}]){
 context.geometryTarget=target;const result=run('chooseTutorialPosition([geometryTarget],640,210,1440,900)');const [x,y]=result;
 assert(x>=18&&x+640<=1422);assert(y>=18&&y+210<=882);
 const overlap=Math.max(0,Math.min(x+640,target.right)-Math.max(x,target.left))*Math.max(0,Math.min(y+210,target.bottom)-Math.max(y,target.top));assert.equal(overlap,0);
 const distance=Math.hypot(Math.max(target.left-x-640,x-target.right,0),Math.max(target.top-y-210,y-target.bottom,0));assert(distance<=21,'dialogue stays beside spotlight');
}
// Hover over dimmed skills cannot reveal tooltips; only the current teaching target is allowed.
const hoveredSkill=new Element('hovered-light');hoveredSkill.dataset.skillId='light';hoveredSkill.dataset.skillDesc='轻击说明';context.hoveredSkill=hoveredSkill;
run('tutorial.active=true;tutorial.index=0;tutorial.waiting=false;s.busy=false;showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip'),null);assert.equal(elements.get('skillTooltipGlobal').textContent,'');
run('tutorial.index=6;showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip===hoveredSkill'),true);
run('tutorial.index=10;showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip'),null);
run('tutorial.index=6;tutorial.waiting=true;showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip'),null);
run('tutorial.waiting=false;tutorial.layoutKey="";positionTutorialBubble([{left:500,top:250,right:650,bottom:400}],"light")');const pinnedPosition=[elements.get('tutorialBubble').style.left,elements.get('tutorialBubble').style.top];
run('positionTutorialBubble([{left:10,top:10,right:1200,bottom:700}],"light")');assert.deepEqual([elements.get('tutorialBubble').style.left,elements.get('tutorialBubble').style.top],pinnedPosition);
run('stopTutorial()');
// Skip confirmation draws either speaker, preserves the current lesson on cancel, and fades on confirm.
run('startTutorial();const savedRandom=Math.random;Math.random=()=>.1;requestTutorialSkip()');assert.equal(run('tutorial.skipPrompt[0]'),'汐霂');assert.equal(run('tutorial.active'),true);assert.equal(run('tutorial.index'),0);
assert.equal(run('tutorial.skipPrompt[1]'),'真的不看看新手教程吗？很快很简单的......');run('cancelTutorialSkip()');assert.equal(run('tutorial.skipPrompt'),null);assert.equal(run('tutorial.index'),0);
run('Math.random=()=>.9;requestTutorialSkip()');assert.equal(run('tutorial.skipPrompt[0]'),'岧峣');assert.equal(run('tutorial.skipPrompt[1]'),'到时候看不懂机制被打败了可别哭哦。');run('confirmTutorialSkip();Math.random=savedRandom');assert.equal(run('tutorial.fading'),true);assert.equal(run('tutorial.active'),true);flushUntil('!tutorial.active');assert.equal(run('tutorial.fading'),false);
run('startTutorial();tutorial.index=6;requestTutorialSkip();tutorialEvent("skill:light");cancelTutorialSkip()');assert.equal(run('tutorial.index'),7);run('stopTutorial()');
// The tooltip remains centered above its skill, regardless of the dialogue location.
context.tooltipGeometry={anchor:{left:950,top:650,right:1130,bottom:740,width:180,height:90},bubble:{left:150,top:510,right:890,bottom:850}};
const aboveTip=run('skillTooltipAboveRect(tooltipGeometry.anchor,480,76,1440)');assert.equal(aboveTip.top,566);assert.equal(aboveTip.bottom,642);assert.equal(aboveTip.left,800);
const movedDialogue=run('chooseTeachingDialoguePosition([skillTooltipAboveRect(tooltipGeometry.anchor,480,76,1440),tooltipGeometry.anchor],624,220,1440,900)');
assert.equal(Math.max(0,Math.min(movedDialogue[0]+624,aboveTip.right)-Math.max(movedDialogue[0],aboveTip.left))*Math.max(0,Math.min(movedDialogue[1]+220,aboveTip.bottom)-Math.max(movedDialogue[1],aboveTip.top)),0);
// All blessing states block underlying skill hover, including regular non-tutorial offers.
run('stopTutorial();s.emberPhase="offer";showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip'),null);
run('s.emberPhase="locked";showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip'),null);
run('s.emberPhase="";s.equipSkill="wind";showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip'),null);
run('s.equipSkill="";showSkillTooltip(hoveredSkill)');assert.equal(run('activeSkillTooltip===hoveredSkill'),true);
run('showBoonOffer("tanuki")');assert.equal(run('activeSkillTooltip'),null);run('s.emberPhase="";document.getElementById("emberOverlay").classList.remove("show")');
// Narrative dialogue is centered; only skip prompts use the captured button anchor.
for(const index of [0,1,2,22,23,24,25,26,27,29,30,31]){
 run(`tutorial.active=true;tutorial.index=${index};tutorial.skipPrompt=null;tutorial.layoutKey="";tutorial.waiting=false;paintTutorial()`);
 assert.equal(elements.get('tutorialBubble').style.left,'645px');assert.equal(elements.get('tutorialBubble').style.top,'420px');assert.equal(elements.get('tutorialDimSurface').style.opacity,'1');
}
run('stopTutorial()');
// The opposite narrator has 75% selection weight; rare lines cannot occur in the first five clicks.
assert.equal(run('pickTutorialSkipLine(1,"汐霂",()=>.4)[0]'),'岧峣');assert.equal(run('pickTutorialSkipLine(1,null,()=>.4)[0]'),'汐霂');
assert.equal(run('pickTutorialSkipLine(1,"岧峣",()=>.6)[0]'),'汐霂');assert.equal(run('pickTutorialSkipLine(1,null,()=>.6)[0]'),'岧峣');
for(let count=1;count<=5;count++){context.skipCountForTest=count;assert.notEqual(run('pickTutorialSkipLine(skipCountForTest,null,()=>0)[1]'),run('tutorialSkipEasterEggs["汐霂"]'))}
assert.equal(run('pickTutorialSkipLine(6,null,()=>0)[1]'),run('tutorialSkipEasterEggs["汐霂"]'));
assert.equal(run('pickTutorialSkipLine(6,null,(()=>{const draws=[.9,.01];return()=>draws.shift()})())[1]'),run('tutorialSkipEasterEggs["岧峣"]'));
assert.equal(run('pickTutorialSkipLine(6,null,()=>.99)[1]'),run('tutorialSkipLines["岧峣"][1]'));
run('startTutorial();tutorial.skipPressCount=5;tutorial.lastSkipSpeaker=null;const countRandom=Math.random;Math.random=()=>0;requestTutorialSkip();Math.random=countRandom');assert.equal(run('tutorial.skipPressCount'),6);assert.equal(run('tutorial.skipPrompt[1]'),run('tutorialSkipEasterEggs["汐霂"]'));assert.equal(run('tutorial.skipAnchor.width'),150);assert.notEqual(elements.get('tutorialBubble').style.left,'645px');
run('cancelTutorialSkip();stopTutorial()');
for(const avatar of ['assets/ximo-avatar.png','assets/tiaoyao-avatar.png'])assert(fs.statSync(require('node:path').resolve(__dirname,'..',avatar)).size>1000);
// Skill lessons use the lower-left space, leaving the dice / caption and right-side tooltip visible.
context.lessonObstacles=[{left:650,top:240,right:930,bottom:445},{left:820,top:690,right:1040,bottom:790},{left:820,top:500,right:1300,bottom:675}];
const lessonPosition=run('chooseTeachingDialoguePosition(lessonObstacles,624,220,1440,900)');
assert.equal(lessonPosition[0],32);assert.equal(lessonPosition[1],662);
for(const r of context.lessonObstacles){const overlap=Math.max(0,Math.min(lessonPosition[0]+624,r.right)-Math.max(lessonPosition[0],r.left))*Math.max(0,Math.min(lessonPosition[1]+220,r.bottom)-Math.max(lessonPosition[1],r.top));assert.equal(overlap,0)}
context.diceObstacle={left:650,top:240,right:930,bottom:445};
const protectedTip=run('skillTooltipAboveRect({left:820,top:690,right:1040,bottom:790,width:220,height:100},480,220,1440)');
assert.equal(protectedTip.bottom,682);assert.equal(protectedTip.left,690);
const bubbleAway=run('chooseTeachingDialoguePosition([skillTooltipAboveRect({left:820,top:690,right:1040,bottom:790,width:220,height:100},480,220,1440),diceObstacle],624,220,1440,900)');
assert.equal(Math.max(0,Math.min(bubbleAway[0]+624,protectedTip.right)-Math.max(bubbleAway[0],protectedTip.left))*Math.max(0,Math.min(bubbleAway[1]+220,protectedTip.bottom)-Math.max(bubbleAway[1],protectedTip.top)),0);
assert(!html.includes('点击黑猫或白鸟，查看当前可用技能'));
console.log('PASS: tutorial sequence, independent enemies, AP allocation, target switching, blessing placement, Boss handoff and one-puppet setting.');
module.exports={run,flushUntil,context,elements,timers};
