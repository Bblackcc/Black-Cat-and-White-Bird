/* Dragon phase II: independent status, turn accounting and multi-segment actions. */
function dragonPhaseTwo(){return s.battleMode==='boss'&&s.bossPhase===2}
function phaseTwoEnemy(){return s.enemies?.[s.targetIndex]}
function phaseTwoRemnant(){return dragonPhaseTwo()&&!!phaseTwoEnemy()?.remnant}
function phaseTwoDeadFire(){return dragonPhaseTwo()?(phaseTwoEnemy()?.deadFire||0):0}
function setPhaseTwoRemnant(on){const enemy=phaseTwoEnemy();if(!enemy)return;enemy.remnant=!!on;enemy.markStolen=!!on;enemy.usurpedMark=!!on;if(on){enemy.marked=false;enemy.markOwner='dragon'}else delete enemy.markOwner}
function convertPhaseTwoMark(){if(!s.marked)return false;s.marked=false;setPhaseTwoRemnant(true);return true}
function convertPhaseTwoBurn(){const count=s.enemyBurn;if(count>0){phaseTwoEnemy().deadFire=phaseTwoDeadFire()+count;s.deadFireNewThisTurn=(s.deadFireNewThisTurn||0)+count;s.enemyBurn=0}return count}
function phaseTwoBurnCap(){return Math.max(0,5-phaseTwoDeadFire())}
function initDragonStage(phase){
 s.dragonTurn=s.turn==='enemy'?1:0;s.dragonApocTurn=0;s.divineBuff=null;s.playerDiceThrown=0;s.phase2PriorPlayerDice=0;s.phase2SealedDice=0;s.phase2SealNext=0;s.phase2EnemyBonus=0;s.phase2NextEnemyBonus=0;s.phase2CounterHits=0;s.deadFireNewThisTurn=0;s.phase2EndSettled=-1;s.remnantTransaction=null;s.phase2ReflectionBreaks=[];
 s.phase2TurnCounterHits=0;s.dragonUses={divine:0,ruin:0,apocalypse:0,liujia:0,duanhong:0,moon:0};
 s.dragonGraspUsed=false;s.dragonDamageEvents=0;s.dragonLastGraspEvent=0;s.dragonLastDamage=null;
 if(phaseTwoEnemy()){setPhaseTwoRemnant(false);phaseTwoEnemy().deadFire=0}
 if(s.turn==='enemy')s.enemyAp=enemyActionDice();
}
const phaseTwoDiceBudgetBefore=enemyActionDice,phaseTwoDieSidesBefore=enemyDieSides,phaseTwoApBefore=maxActionPoints;
enemyActionDice=function(){return dragonPhaseTwo()?8+(s.phase2EnemyBonus||0):phaseTwoDiceBudgetBefore()};
enemyDieSides=function(){return dragonPhaseTwo()?(cfg.enemyDieSides||10):phaseTwoDieSidesBefore()};
maxActionPoints=function(){return Math.max(0,phaseTwoApBefore()-(dragonPhaseTwo()?(s.phase2SealedDice||0):0))};
function recordPhaseTwoPartyDice(count){if(dragonPhaseTwo()&&s.turn==='player'&&!s.retryPreparing)s.playerDiceThrown=(s.playerDiceThrown||0)+count}
const phaseTwoFinishRollBefore=finishRoll;
finishRoll=function(id,who,d1,d2){recordPhaseTwoPartyDice(d2==null?1:2);if(dragonPhaseTwo())s.remnantTransaction={state:s,who,physical:0,magic:0,triggered:false};return phaseTwoFinishRollBefore(id,who,d1,d2)};
const phaseTwoFreeEnchantBefore=rollFreeEnchantDie;
rollFreeEnchantDie=function(face,done){return phaseTwoFreeEnchantBefore(face,extra=>{recordPhaseTwoPartyDice(1);done(extra)})};
const phaseTwoCloudBefore=rollFoxCloud;
rollFoxCloud=function(done){recordPhaseTwoPartyDice(2);return phaseTwoCloudBefore(done)};
const phaseTwoStoneBefore=rollStonePassives;
rollStonePassives=function(holders,index=0,done=startEnemyTurn){if(index<holders.length)recordPhaseTwoPartyDice(1);return phaseTwoStoneBefore(holders,index,done)};
const phaseTwoGoldBefore=dealGoldenBreaks;
dealGoldenBreaks=function(events,index=0,notes=[],done=()=>{}){if(enforcePhaseTwoCounterLimit()){done(notes);return}if(hasPartySkill('rampart')&&index<events.length){recordPhaseTwoPartyDice(1);recordDragonCounter()}return phaseTwoGoldBefore(events,index,notes,result=>{enforcePhaseTwoCounterLimit();done(result)})};
const phaseTwoD4Before=rollD4Batch;
rollD4Batch=function(count,label,done){recordPhaseTwoPartyDice(Math.max(0,count));return phaseTwoD4Before(count,label,done)};
const phaseTwoEmberBefore=beginEmberRoll;
beginEmberRoll=function(){if(s.emberReady>0&&!s.over)recordPhaseTwoPartyDice(1);return phaseTwoEmberBefore()};
const phaseTwoEnemyTurnBefore=startEnemyTurn;
startEnemyTurn=function(){if(dragonPhaseTwo()&&!s.over){s.phase2TurnCounterHits=0;s.phase2PriorPlayerDice=s.playerDiceThrown||0;s.phase2EnemyBonus=s.phase2NextEnemyBonus||0;s.phase2NextEnemyBonus=0;s.deadFireNewThisTurn=0;s.dragonTurn=(s.dragonTurn||0)+1;s.phase2EndSettled=-1}const result=phaseTwoEnemyTurnBefore();if(dragonPhaseTwo()&&!s.over)setDialog('巨龙',`第二阶段的敌方回合开始，拥有${s.enemyAp}枚${dieName(enemyDieSides())}骰子。${s.dragonTurn%3===0?'本回合即将释放袭月。':''}`,`巨龙行动力 ${s.enemyAp}/${enemyActionDice()}`);return result};
const phaseTwoPlayerTurnBefore=beginPlayerTurn;
beginPlayerTurn=function(){if(dragonPhaseTwo()&&!s.over){s.phase2TurnCounterHits=0;s.phase2SealedDice=s.phase2SealNext||0;s.phase2SealNext=0;s.playerDiceThrown=0}return phaseTwoPlayerTurnBefore()};

function phaseTwoCounterLimit(){const total=s.phase2CounterHits||0;return total>=15?1:total>=10?2:total>=5?3:Infinity}
function enforcePhaseTwoCounterLimit(){
 if(!dragonPhaseTwo()||s.turn!=='enemy'||s.enemy<=0||(s.phase2TurnCounterHits||0)<phaseTwoCounterLimit())return false;
 setPhaseTwoRemnant(true);return true;
}
function recordDragonCounter(){if(dragonPhaseTwo()&&s.enemy>0){s.phase2CounterHits=(s.phase2CounterHits||0)+1;if(s.turn==='enemy')s.phase2TurnCounterHits=(s.phase2TurnCounterHits||0)+1}}
const phaseTwoMarkCounterBefore=triggerMarkedCounter;
triggerMarkedCounter=function(type,done=()=>{}){enforcePhaseTwoCounterLimit();if(phaseTwoRemnant()){done('残念不会触发狸猫反击。');return}const counted=dragonPhaseTwo()&&s.marked&&s.enemy>0;if(counted)recordDragonCounter();return phaseTwoMarkCounterBefore(type,note=>{if(counted)enforcePhaseTwoCounterLimit();done(note)})};
const phaseTwoTanukiBefore=resolveTanukiReactions;
resolveTanukiReactions=function(hits,index=0,notes=[],done=()=>{}){enforcePhaseTwoCounterLimit();if(phaseTwoRemnant()){done(notes);return}return phaseTwoTanukiBefore(hits,index,notes,done)};
const phaseTwoBurstBefore=burstActiveMark;
burstActiveMark=function(damage){const normal=dragonPhaseTwo()&&s.marked&&!phaseTwoRemnant();const result=phaseTwoBurstBefore(damage);if(normal&&(result.damage.hp+result.damage.physical+result.damage.magic)>0)recordDragonCounter();return result};
function collectRemnantDamage(type,hit){
 const amount=hit.shield||0;if(!(dragonPhaseTwo()||typeof dragonPhaseThree==='function'&&dragonPhaseThree())||amount<=0)return;
 let tx=s.remnantTransaction;
 if(!tx||tx.state!==s){if(!phaseTwoRemnant())return;tx=s.remnantTransaction={state:s,who:s.selected,physical:0,magic:0,triggered:false,standalone:true}}
 if(!tx.triggered){if(!phaseTwoRemnant())return;tx.triggered=true;setPhaseTwoRemnant(false)}
 tx[type]+=amount;
 if(tx.standalone){s.remnantTransaction=null;const loss=reflectDragonRemnant(tx.who,amount,type);if(loss.breaks.length)s.phase2ReflectionBreaks=(s.phase2ReflectionBreaks||[]).concat(loss.breaks)}
}
function reflectDragonRemnant(who,amount,type){
 const hit=damageAlly(who,amount,type);
 if(s.enemy>0){if(type==='physical')s.shield+=amount;else s.magicShield+=amount}
 return hit;
}
const phaseTwoPhysicalBefore=damageEnemyPhysical,phaseTwoMagicBefore=damageEnemyMagic;
damageEnemyPhysical=function(amount){const hit=phaseTwoPhysicalBefore(amount);collectRemnantDamage('physical',hit);return hit};
damageEnemyMagic=function(amount){const hit=phaseTwoMagicBefore(amount);collectRemnantDamage('magic',hit);return hit};
function settleDragonRemnant(done){
 const tx=s.remnantTransaction;s.remnantTransaction=null;let events=s.phase2ReflectionBreaks||[];s.phase2ReflectionBreaks=[];
 if(tx?.state===s&&tx.triggered){for(const type of ['physical','magic'])if(tx[type]>0){const hit=reflectDragonRemnant(tx.who,tx[type],type);events.push(...hit.breaks)}setDialog('巨龙',`残念反伤：${tx.who==='cat'?'黑猫':'白鸟'}承受 ${format(tx.physical)} 点物理、${format(tx.magic)} 点法术伤害；巨龙获得等量同类型护盾。`,'残念已消耗')}
 if(events.length&&hasPartySkill('rampart')&&s.enemy>0){s.busy=true;dealGoldenBreaks(events,0,[],()=>done());return}done();
}
const phaseTwoCompleteBefore=completeInitialRoll;
completeInitialRoll=function(...args){settleDragonRemnant(()=>phaseTwoCompleteBefore(...args))};
const phaseTwoBasicBefore=resolveBasicAttack;
resolveBasicAttack=function(id,d1,d2,level=evolutionLevel(id)){
 const burned=s.enemyBurn,stolen=phaseTwoRemnant();if(stolen&&id==='heavy'&&level===3)setPhaseTwoRemnant(false);
 const result=phaseTwoBasicBefore(id,d1,d2,level);
 if(dragonPhaseTwo()&&id==='light'&&level===3&&burned>0){s.enemyBurn=Math.max(burned,phaseTwoBurnCap());result.notes=result.notes.map(note=>note==='燃烧已补充至至少5层。'?`死火占用${phaseTwoDeadFire()}层，燃烧补充至${s.enemyBurn}层。`:note)}
 if(stolen&&id==='heavy'&&level===3)result.notes.push('重击嬗变清除了残念，不触发标记反击。');return result;
};
const phaseTwoBurnBefore=applyPendingBurn;
applyPendingBurn=function(){
 if(!(dragonPhaseTwo()||typeof dragonPhaseThree==='function'&&dragonPhaseThree()))return phaseTwoBurnBefore();
 if(s.pendingBurn<=0&&s.pendingBurnLayers<=0)return{damage:emptyDamage(),text:''};
 const raw=s.pendingBurn,layers=s.pendingBurnLayers,before=s.enemyBurn;s.pendingBurn=0;s.pendingBurnLayers=0;
 const hit=raw>0?damageEnemyMagic(raw):{shield:0,hp:0};s.enemyBurn=Math.max(before,Math.min(phaseTwoBurnCap(),before+layers));
 return{damage:{hp:hit.hp,magic:hit.shield},text:`燃烧附加 ${format(raw)} 点法术伤害，叠加 ${s.enemyBurn-before} 层；燃烧 ${s.enemyBurn}、死火 ${phaseTwoDeadFire()}，共占用 ${s.enemyBurn+phaseTwoDeadFire()} 层。`};
};
function healPhaseTwoBoss(amount){if(s.enemy<=0)return 0;const before=s.enemy;s.enemy=Math.min(battleStats().enemyMax,s.enemy+Math.max(0,amount));return s.enemy-before}
const phaseTwoBurnTickBefore=resolveEnemyBurnTick;
resolveEnemyBurnTick=function(){
 if(!dragonPhaseTwo())return phaseTwoBurnTickBefore();if(s.over||s.phase2EndSettled===s.dragonTurn)return;
 s.phase2EndSettled=s.dragonTurn;s.busy=true;
 const lastGrasp=flushLastDragonGrasp(),graspNote=lastGrasp.triggered?dragonGraspNote(lastGrasp):'';
 const ready=Math.max(0,phaseTwoDeadFire()-(s.deadFireNewThisTurn||0));
 const finish=(faces=[])=>{
  const healed=faces.length?healPhaseTwoBoss(faces[0]):0;if(ready>0)phaseTwoEnemy().deadFire=Math.max(0,phaseTwoDeadFire()-1);
  const mark=convertPhaseTwoMark(),burn=convertPhaseTwoBurn(),count=s.phase2PriorPlayerDice||0;
  s.phase2SealNext=count>8?2:count>5?1:0;s.phase2NextEnemyBonus=count>8?1:0;
  s.busy=false;$('diceWrap').classList.remove('show');render();setDialog('巨龙',`${graspNote}${mark?'标记已篡夺为残念。':''}${burn?`${burn}层燃烧已转化为死火。`:''}${faces.length?`死火D4掷出${faces[0]}，恢复${format(healed)}点生命，死火减少1层。`:''}上个我方回合共投掷${count}枚骰子，下一我方回合封印${s.phase2SealNext}枚${s.phase2NextEnemyBonus?'；巨龙下一回合额外获得1枚骰子':''}。`,'篡夺 · 敌方回合结束');
  if(!checkEnd())setTimeout(beginPlayerTurn,500);
 };
 if(ready>0)rollD4Batch(1,'死火 · D4恢复生命',finish);else finish();
};

const phaseTwoNames={liujia:'六甲穷日',duanhong:'断虹明',moon:'袭月'};
function phaseTwoMoonForm(){const marked=!!s.marked||phaseTwoRemnant(),burned=s.enemyBurn>0||phaseTwoDeadFire()>0;return marked&&burned?'full':marked?'mark':burned?'fire':'crescent'}
function phaseTwoMoonCost(form=phaseTwoMoonForm()){return form==='full'?6:form==='crescent'?4:5}
function phaseTwoWeakShield(who){const p=s[shieldFor(who,'physical')],m=s[shieldFor(who,'magic')];return p===m?(Math.random()<.5?'physical':'magic'):(p<m?'physical':'magic')}
function phaseTwoRandomTarget(){const alive=['cat','bird'].filter(who=>s[who]>0);return alive[Math.floor(Math.random()*alive.length)]}
function phaseTwoCrescentPlan(faces,who,magicBonus=0){
 const first=faces[0]*faces[1],second=faces[2]*faces[3],type=phaseTwoWeakShield(who),other=who==='cat'?'bird':'cat',next=first<=36?who:(s[other]>0?other:who);
 return[{targets:[who],physical:type==='physical'?first:0,magic:(type==='magic'?first:0)+magicBonus,label:`弦月首段：${faces[0]}×${faces[1]}=${first}`},{targets:[next],physical:type==='physical'?second:0,magic:type==='magic'?second:0,label:`弦月次段：${faces[2]}×${faces[3]}=${second}`}];
}
function phaseTwoDamagePacket(packet){
 const total={physicalShield:0,magicShield:0,hp:0,hits:[],breaks:[]};
 for(const who of packet.targets){if(!who||s[who]<=0)continue;for(const [type,amount] of [['physical',packet.physical],['magic',packet.magic]]){if(amount<=0)continue;const hit=damageAlly(who,amount,type);total.hp+=hit.hp;total.physicalShield+=hit.physicalShield;total.magicShield+=hit.magicShield;total.breaks.push(...hit.breaks);for(const t of ['physical','magic'])if(hit[t+'Shield']>0)total.hits.push({who,type:t,amount:hit[t+'Shield']})}}
 return total;
}
function runPhaseTwoPackets(packets,done,notes=[]){
 if(s.over||s.enemy<=0||s.cat<=0&&s.bird<=0){checkEnd();return}
 const packet=packets.shift();if(!packet){done(notes);return}
 const damage=phaseTwoDamagePacket(packet),gain=dragonGrasp(damage);notes.push(`${packet.label}；我方生命损失${format(damage.hp)}，物理盾损失${format(damage.physicalShield)}，法术盾损失${format(damage.magicShield)}。${gain.triggered?dragonGraspNote(gain):''}`);render();
 if(checkEnd())return;
 resolveTanukiReactions(damage.hits,0,[],tanuki=>dealGoldenBreaks(damage.breaks,0,[],gold=>{notes.push(...tanuki,...gold);if(!checkEnd())runPhaseTwoPackets(packets,done,notes)}));
}
function finishPhaseTwoSkill(text){settleDragonRemnant(()=>{s.allyDamageDisplay=null;finishDragonAction(text,'第二阶段 · 技能结算完成')})}
function resolvePhaseTwoSkill(id,faces,shown=faces,owned=[]){
 // Keep each ally's total for this cast: later small hits must not overwrite the large opening hit.
 s.allyDamageDisplay={cat:0,bird:0};
 for(const who of ['cat','bird'])$(`${who}Damage`).classList.remove('show');
 const notes=[`${phaseTwoNames[id]}：${shown.join('、')}${owned.length?'；落九天接管的骰子不计入巨龙数值':''}。`];
 s.remnantTransaction={state:s,who:s.selected,physical:0,magic:0,triggered:false};
 if(owned.length){const chase=emptyDamage();for(const i of owned)mergeDamage(chase,applyCranePursuit(shown[i]));showEnemyDamage(chase.hp,chase.physical,chase.magic);notes.push('落九天已结算接管骰子的追击。')}
 const proceed=()=>{
 if(checkEnd())return;
 const done=extra=>finishPhaseTwoSkill(notes.concat(extra||[]).join(' '));
 if(id==='liujia'){
  const face=faces[0],who=phaseTwoRandomTarget(),type=face%2?'physical':'magic',extra=face>0&&phaseTwoRemnant();if(extra)setPhaseTwoRemnant(false);
  const make=(amount,label)=>({targets:[who],physical:type==='physical'?amount:0,magic:type==='magic'?amount:0,label});
  const packets=[make(face*3,`六甲穷日：${face}×3`)];if(extra)packets.push(make(face,'消耗残念追加伤害'));runPhaseTwoPackets(packets,done);return;
 }
 if(id==='duanhong'){
  const base=faces[0]*faces[1],count=phaseTwoDeadFire();notes.push(`基础恢复：${faces[0]}×${faces[1]}=${base}，实际恢复${format(healPhaseTwoBoss(base))}点。`);phaseTwoEnemy().deadFire=0;s.deadFireNewThisTurn=0;
  if(count>0)rollD4Batch(count,'断虹明 · 消耗死火恢复',extra=>{notes.push(`消耗${count}层死火，D4为${extra.join('、')}，额外恢复${format(healPhaseTwoBoss(extra.reduce((a,b)=>a+b,0)))}点。`);done()});else done();return;
 }
 const form=s.phase2CastForm||phaseTwoMoonForm(),counter=s.phase2CounterHits||0;
 const crescent=(offset,bonus=0,prefixNotes=[])=>{const who=phaseTwoRandomTarget();if(!who){checkEnd();return}runPhaseTwoPackets(phaseTwoCrescentPlan(faces.slice(offset,offset+4),who,bonus),extra=>done(prefixNotes.concat(extra)))};
 if(form==='crescent'){crescent(0);return}
 if(form==='mark'){
  convertPhaseTwoMark();const face=faces[0],who=phaseTwoRandomTarget(),type=face%2?'physical':'magic',amount=face*2+counter;
  const packets=face>0?[{targets:[who],physical:type==='physical'?amount:0,magic:type==='magic'?amount:0,label:`半月·残念：${face}×2+${counter}=${amount}`}]:[];
  runPhaseTwoPackets(packets,extra=>crescent(1,0,extra));return;
 }
 convertPhaseTwoBurn();
 if(form==='fire'){
  const count=Math.min(faces[0],phaseTwoDeadFire());rollD4Batch(count,'半月·死火',extra=>{const sum=extra.reduce((a,b)=>a+b,0);notes.push(`保留死火，结算${count}枚D4，共${sum}点；恢复${format(healPhaseTwoBoss(sum))}点，弦月首段额外附加${sum}点法术伤害。`);crescent(1,sum)});return;
 }
 convertPhaseTwoMark();const count=phaseTwoDeadFire();rollD4Batch(count,'满月·死火',extra=>{
  const dead=extra.reduce((a,b)=>a+b,0),sum=faces[0]+faces[1];notes.push(`满月前置：恢复${format(healPhaseTwoBoss(dead))}点，保留残念与${count}层死火。`);
  const packets=[{targets:['cat','bird'],physical:sum,magic:sum,label:`满月：前两骰合计${sum}`}];
  if(counter>0)packets.push({targets:['cat','bird'],physical:counter,magic:0,label:`满月·反击计数追加${counter}点物理伤害`});
  if(dead>0)packets.push({targets:['cat','bird'],physical:0,magic:dead,label:`满月·死火追加${dead}点法术伤害`});
  runPhaseTwoPackets(packets,prefix=>crescent(2,0,prefix));
 });
 };if(owned.length)settleDragonRemnant(proceed);else proceed();
}
// Six visible slots keep the five/six-die Moon forms centered and readable.
for(let i=5;i<=6;i++){const die=document.createElement('div');die.id='dice'+i;die.className='dice';die.style.display='none';$('dicePair').appendChild(die)}
const phaseTwoClearDiceBefore=clearDragonDice;
clearDragonDice=function(){phaseTwoClearDiceBefore();$('dicePair').classList.remove('boss-many');for(let i=1;i<=6;i++){const die=$('dice'+(i===1?'':i));if(die)die.style.display=i>4?'none':''}};
const phaseTwoDragonRollBefore=rollDragonAction;
rollDragonAction=function(id,cost){
 if(!dragonPhaseTwo()||!phaseTwoNames[id])return phaseTwoDragonRollBefore(id,cost);
 const total=enemyActionDice(),spent=total-s.enemyAp,owned=[],intercept=talentActive('crane')&&hasPartySkill('skyfall');
 if(intercept&&spent===0)owned.push(0);if(intercept&&spent+cost===total&&!owned.includes(cost-1))owned.push(cost-1);
 s.enemyAp-=cost;s.dragonDiceSpent=spent+cost;s.dragonUses[id]=(s.dragonUses[id]||0)+1;if(id==='moon')s.phase2CastForm=phaseTwoMoonForm();s.busy=true;render();clearDragonDice();
 $('dicePair').classList.toggle('double',cost>1);$('dicePair').classList.toggle('boss-four',cost===4);$('dicePair').classList.toggle('boss-many',cost>4);
 const nodes=Array.from({length:6},(_,i)=>$('dice'+(i===0?'':i+1)));for(let i=0;i<6;i++){nodes[i].style.display=i<cost?'grid':'none';nodes[i].classList.toggle('rolling',i<cost);nodes[i].classList.toggle('crane-roll',owned.includes(i))}
 $('diceWrap').classList.add('show');$('diceCaption').textContent=`${phaseTwoNames[id]} · ${cost}枚${dieName(enemyDieSides())}`;let ticks=0;
 diceTimer=setInterval(()=>{for(let i=0;i<cost;i++)nodes[i].textContent=String(owned.includes(i)?rollPartyDie():rollEnemyDie());if(++ticks>=12){clearInterval(diceTimer);const shown=nodes.slice(0,cost).map((_,i)=>owned.includes(i)?rollPartyDie():rollEnemyDie());shown.forEach((face,i)=>{nodes[i].textContent=String(face);nodes[i].classList.remove('rolling')});resolveDragonSkill(id,shown.map((face,i)=>owned.includes(i)?0:face),shown,owned)}},75);
};
const phaseTwoDragonResolveBefore=resolveDragonSkill;
resolveDragonSkill=function(id,...args){return dragonPhaseTwo()&&phaseTwoNames[id]?resolvePhaseTwoSkill(id,...args):phaseTwoDragonResolveBefore(id,...args)};
const phaseTwoEnemyActBefore=enemyAct;
enemyAct=function(){
 if(!dragonPhaseTwo())return phaseTwoEnemyActBefore();if(s.over)return;if(s.enemyAp<=0){resolveEnemyBurnTick();return}
 const cost=phaseTwoMoonCost();if(s.dragonTurn>0&&s.dragonTurn%3===0&&s.dragonApocTurn!==s.dragonTurn&&s.enemyAp>=cost){s.dragonApocTurn=s.dragonTurn;rollDragonAction('moon',cost);return}
 if(s.enemyAp>=2&&s.enemy<battleStats().enemyMax&&Math.random()<.35)rollDragonAction('duanhong',2);else rollDragonAction('liujia',1);
};

const phaseTwoLore={
 liujia:'（主动）六甲穷日：投掷一枚骰子，将该骰子点数x3造成伤害。若点数为奇数则造成物理伤害，点数为偶数则造成法术伤害。若自身携带残念，则消耗该残念额外造成一次该点数的相应类型伤害。',
 duanhong:'（主动）断虹明：投掷两枚骰子，为自己恢复两枚点数相乘的血量。若自身携带死火，则消耗全部死火并按照死火数量投掷d4结算额外回血。',
 moon:'（主动）袭月：（分为三种形态）（该技能每三回合必定释放一次）\n1.弦月形态（自身不携带标记/燃烧时）：共投掷四枚骰子，前两枚骰子点数相乘后对一名我方单位造成第一段伤害，若本次伤害＜36，则再对该单位造成剩下两枚骰子相乘的伤害；若本次伤害＞36，则再对另一名单位造成剩下两枚骰子相乘的伤害。伤害类型取决于第一次造成伤害目标护盾值较少的一端。\n2.半月形态（自身携带标记/燃烧其中一种时）：\n（携带标记时）：共投掷五枚骰子。先将标记转化为残念，投掷一枚骰子，点数为奇数造成物理伤害，为偶数造成法术伤害，将其点数x2后，加上第二阶段内自身受到过的累计反击次数，造成一次该数值的伤害。（比如投出2、累计受到过5次反击，则造成2x2+5=9点法术伤害），并保留该残念。再执行弦月形态的四枚骰子。\n（携带死火时）：共投掷五枚骰子。先将所有燃烧转化为死火，投掷一枚骰子，并根据骰子点数，按照燃烧结算逻辑投掷d4并相加（若大于持有死火数量则全部结算），并使下面的伤害附加该相加点数的法术伤害，同时再恢复该点数的血量。并保留所有死火。再执行弦月形态的四枚骰子。\n3.满月形态（自身同时携带标记和燃烧）：共投掷六枚骰子。先将标记转化为残念，将所有燃烧转化为死火，投掷两枚骰子，对我方全体造成两枚骰子相加点数的物理伤害，同时造成该点数的法术伤害，并附带一次等于第二阶段内自身受到过的反击次数的物理伤害，同时附带所有死火结算d4后相加的法术伤害并回复相应血量。并保留该残念与所有死火。再执行弦月形态的四枚骰子。'
};
const phaseTwoLoreBefore=renderDragonLore;
renderDragonLore=function(){
 if(!dragonPhaseTwo())return phaseTwoLoreBefore();
 $('bossLore').innerHTML='<strong>巨龙 · 魔王 · 暴君 · 毁灭</strong><div class="boss-skill-lore"><strong>第二阶段天赋</strong><br>初始拥有8枚骰子，每枚骰子为'+dieName(enemyDieSides())+'。</div><div class="boss-skill-lore"><strong>特殊机制：攫取</strong><br>每回合首次造成伤害和最后一次造成伤害时，获得与造成伤害相同的血量/盾值。实际扣除我方多少物理护盾、法术护盾和生命，就分别获得等量物理护盾、法术护盾和生命。</div><div class="boss-skill-lore"><strong>特殊机制：篡夺</strong><br>敌方回合结束时，将标记转化为残念，残念占用标记位置，存在期间无法施加新标记，也不能触发狸猫反击与煮雨反伤。我方下次对巨龙物理护盾或法术护盾造成伤害时，消耗残念，对攻击者造成等量同类型反伤，并使巨龙获得与反伤数值相同、类型相同的护盾；第二阶段累计受到5／10／15次及以上反击后，同一敌方回合内最多受到3／2／1次反击，达到上限后立即将标记转化为残念，无法再通过煮雨施加标记；标记反击、煮雨反伤和披靡各计一次反击，新回合重置单回合计数。将燃烧转化为占用层数上限的死火。从下一敌方回合结束起，死火投掷一枚D4恢复生命并减少1层，不触发枫林晚或追击。上个我方回合实际投掷超过5枚骰子，下回合封印1枚；超过8枚则封印2枚，并使巨龙下一回合额外获得1枚骰子。<br>本阶段已受到反击：'+(s.phase2CounterHits||0)+'次；本回合反击：'+(s.phase2TurnCounterHits||0)+' / '+(Number.isFinite(phaseTwoCounterLimit())?phaseTwoCounterLimit():'不限')+'。</div>'+Object.entries(phaseTwoLore).filter(([id])=>s.dragonUses[id]>0).map(([id,text])=>'<div class="boss-skill-lore"><strong>'+phaseTwoNames[id]+' · 已使用 '+s.dragonUses[id]+' 次</strong><br>'+text+'</div>').join('');
};
const phaseTwoSeal=document.createElement('div');phaseTwoSeal.id='phaseTwoSeal';phaseTwoSeal.hidden=true;document.querySelector('.turn').appendChild(phaseTwoSeal);
let phaseTwoSeenState=s,phaseTwoSeenPhase=s.bossPhase;
const phaseTwoRenderBefore=render;
function renderPhaseTwoMarkArt(remnant){
 const tag=$('markTag'),source=remnant?'assets/dragon-remnant.png':'assets/tanuki-mark.png';
 if(tag.dataset.iconSource!==source){tag.innerHTML=`<img src="${source}" alt="${remnant?'残念':'狸猫标记'}">`;tag.dataset.iconSource=source}
}
render=function(){
 if(phaseTwoSeenState!==s||phaseTwoSeenPhase!==s.bossPhase){phaseTwoSeenState=s;phaseTwoSeenPhase=s.bossPhase;if(s.battleMode==='boss')initDragonStage(s.bossPhase)}
 phaseTwoRenderBefore();phaseTwoSeal.hidden=!dragonPhaseTwo()||!s.phase2SealedDice;phaseTwoSeal.textContent=`骰子封印：${s.phase2SealedDice||0}枚（本回合）`;
 if(!dragonPhaseTwo()){$('markTag').classList.remove('remnant');renderPhaseTwoMarkArt(false);return}
 const remnant=phaseTwoRemnant(),dead=phaseTwoDeadFire();$('markTag').classList.toggle('on',s.marked||remnant);$('markTag').classList.toggle('remnant',remnant);$('markTag').title=remnant?'残念：占用标记位置，不能施加新标记或触发狸猫反击；物理护盾或法术护盾受伤时消耗，对攻击者造成等量同类型反伤，并获得等量同类型护盾':'狸猫标记';
 renderPhaseTwoMarkArt(remnant);
 $('burnStatus').classList.toggle('on',s.enemyBurn+dead>0);$('burnStatus').title=`燃烧 ${s.enemyBurn} 层 · 死火 ${dead} 层`;
 $('burnStack').innerHTML=Array.from({length:s.enemyBurn},()=>'<img src="assets/burn-flame.png" alt="燃烧">').join('')+Array.from({length:dead},()=>'<img class="dead-fire" src="assets/dead-fire.png" alt="死火">').join('');
};
const phaseTwoCheckBefore=checkEnd;
checkEnd=function(){if(dragonPhaseTwo()&&s.cat<=0&&s.bird<=0){s.allyDamageDisplay=null;s.over=true;s.busy=false;render();setDialog('白鸟','队伍已被巨龙击败。可选择当前阶段、上一阶段或重新随机加护。','队伍倒下');return true}const ended=phaseTwoCheckBefore();if(ended)s.allyDamageDisplay=null;return ended};
function selectBossStage(phase){unlockDebugControls();stopTutorial();toggleChapterMenu(false);document.querySelector('.settings').open=false;resetBattle('boss',Math.max(1,Math.min(3,phase)))}
for(const phase of [2,3]){const button=document.createElement('button');button.id='chapterBossStage'+phase;button.type='button';button.textContent=`巨龙 · 直接进入第${phase}阶段`;button.onclick=()=>selectBossStage(phase);document.querySelector('.chapter-card').appendChild(button)}
document.querySelector('.chapter-card').appendChild(replayButton);
