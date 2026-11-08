/* Dragon phase III: the dragon and its two independently targetable soldiers. */
function dragonPhaseThree(){return s.battleMode==='boss'&&s.bossPhase===3}
const phaseThreeDamageDisplayBefore=showEnemyDamage;
showEnemyDamage=function(hp,physical,magic=0){const result=phaseThreeDamageDisplayBefore(hp,physical,magic);if(dragonPhaseThree()&&s.targetIndex===0&&(hp>0||physical>0||magic>0)){const art=$('puppet');art.classList.remove('hit');void art.offsetWidth;art.classList.add('hit')}return result};
function phaseThreeBoss(fn){return s.enemies?withEnemy(0,fn):fn()}
const phaseThreeNames={summit:'登峰造极',peak:'凌绝顶',returnSky:'回天'};
const phaseThreePaidNames={...phaseThreeNames,divine:'宛若神明',ruin:'城欲摧',liujia:'六甲穷日',duanhong:'断虹明'};
const phaseThreeStatsBefore=battleStats;
battleStats=function(){const enemy=s.enemies?.[s.targetIndex];return dragonPhaseThree()&&enemy?.soldier?{enemyMax:enemy.hpMax,shield:enemy.physicalMax,magicShield:enemy.magicMax}:phaseThreeStatsBefore()};
const phaseThreeBudgetBefore=enemyActionDice,phaseThreeSidesBefore=enemyDieSides;
enemyActionDice=function(){return dragonPhaseThree()?(s.phase3Actor>0?2:10+Math.min(2,s.phase3EnemyPurpleTotal||0)):phaseThreeBudgetBefore()};
enemyDieSides=function(){return dragonPhaseThree()?(cfg.enemyDieSides||10):phaseThreeSidesBefore()};
const phaseThreeInitBefore=initDragonStage;
initDragonStage=function(phase){
 phaseThreeInitBefore(phase);if(phase!==3||!s.enemies)return;
 s.phase3Initialized=true;
 s.targetIndex=0;s.enemies=s.enemies.slice(0,1);s.enemies[0].name='巨龙';
 s.phase3Turn=s.turn==='enemy'?1:0;s.phase3UltimateTurn=0;s.phase3Borrowed=0;s.phase3PartyDebt=0;s.phase3ReclaimDamage=0;s.phase3EnemyPurpleTotal=0;s.phase3EnemyPurpleLeft=0;s.phase3NormalAp=10;s.phase3Actor=0;
 s.phase3Required=[];s.phase3RequiredPreparedTurn=-1;
 s.phase3Burnout={cat:[null,null,null,null],bird:[null,null,null,null]};s.phase3SoldierDeadline=null;s.phase3PartyTarget=0;
 s.dragonUses={summit:0,peak:0,returnSky:0,divine:0,ruin:0,apocalypse:0,liujia:0,duanhong:0,moon:0};
 if(s.turn==='enemy')s.enemyAp=enemyActionDice();
};

// The third slot uses the same node routing as the existing enemy roster.
const thirdEnemy=document.getElementById('enemy').cloneNode(true);thirdEnemy.id='enemy-third';thirdEnemy.hidden=true;
thirdEnemy.querySelectorAll('[id]').forEach(node=>node.id+='-third');document.getElementById('enemy-second').after(thirdEnemy);
thirdEnemy.addEventListener('click',()=>selectEnemy(2));thirdEnemy.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectEnemy(2)}});
thirdEnemy.setAttribute('role','button');thirdEnemy.tabIndex=0;
const phaseThreeSoldierViews=new Map(),phaseThreeSoldierFadeMs=420;
function clearPhaseThreeSoldierViews(){
 for(const [index,view] of phaseThreeSoldierViews){clearTimeout(view.timer);const node=document.getElementById(index===1?'enemy-second':'enemy-third');node.classList.remove('soldier-entering','soldier-leaving');node.hidden=true}
 phaseThreeSoldierViews.clear();
}
function renderPhaseThreeSoldierVisibility(node,index,enemy){
 let view=phaseThreeSoldierViews.get(index);
 if(view&&(view.state!==s||enemy&&view.enemy!==enemy)){clearTimeout(view.timer);node.classList.remove('soldier-entering','soldier-leaving');phaseThreeSoldierViews.delete(index);view=null}
 if(!view){if(!enemy){node.hidden=true;return false}view={state:s,enemy,phase:'hidden',timer:null};phaseThreeSoldierViews.set(index,view)}
 const alive=!!enemy&&enemy.hp>0&&!enemy.dismissed;
 if(alive&&(view.phase==='hidden'||view.phase==='leaving')){
  clearTimeout(view.timer);view.phase='entering';node.hidden=false;node.classList.remove('soldier-leaving');node.classList.add('soldier-entering');
  view.timer=setTimeout(()=>{if(phaseThreeSoldierViews.get(index)!==view||s!==view.state||view.phase!=='entering')return;view.phase='visible';node.classList.remove('soldier-entering')},phaseThreeSoldierFadeMs);
 }else if(!alive&&(view.phase==='entering'||view.phase==='visible')){
  clearTimeout(view.timer);view.phase='leaving';node.classList.remove('soldier-entering');node.classList.add('soldier-leaving');
  view.timer=setTimeout(()=>{if(phaseThreeSoldierViews.get(index)!==view||s!==view.state||view.phase!=='leaving')return;view.phase='hidden';node.hidden=true;node.classList.remove('soldier-leaving')},phaseThreeSoldierFadeMs);
 }
 node.hidden=view.phase==='hidden';node.tabIndex=alive?0:-1;node.setAttribute('aria-hidden',alive?'false':'true');
 return !!enemy&&!node.hidden;
}
function renderPhaseThreeEnemies(){
 const selected=s.targetIndex;
 for(let index=0;index<3;index++){
  const node=document.getElementById('enemy'+(index===1?'-second':index===2?'-third':'')),enemy=s.enemies[index];
  if(index>0){if(!renderPhaseThreeSoldierVisibility(node,index,enemy))continue}else node.hidden=!enemy;
  if(!enemy)continue;
  withEnemy(index,()=>{
   const stats=battleStats();node.classList.toggle('boss-enemy',index===0);node.classList.toggle('death-soldier',index>0);node.classList.toggle('enemy-selected',selected===index);node.classList.toggle('enemy-defeated',enemy.hp<=0);
   node.classList.toggle('soldier-cang',enemy.soldier==='cang');node.classList.toggle('soldier-he',enemy.soldier==='he');node.style.opacity=index>0?'':enemy.hp<=0?'.28':'1';node.setAttribute('aria-label',`选择${enemy.name}为目标`);
   $('enemyName').textContent=enemy.name;$('enemySub').textContent=index===0?'暴君·毁灭':'死士 · 召唤物';$('puppet').classList.toggle('boss-art',index===0);
   $('enemyPortrait').src=index===0?'assets/dragon-stage-3.png':`assets/death-soldier-${enemy.soldier}.png`;$('enemyPortrait').alt=enemy.name;
   $('enemyHp').textContent=`${format(enemy.hp)} / ${stats.enemyMax} HP`;$('enemyBar').style.width=`${Math.max(0,enemy.hp/stats.enemyMax*100)}%`;
   for(const [type,value,maximum] of [['physical',enemy.physical,stats.shield],['magic',enemy.magic,stats.magicShield]]){
    $(type==='physical'?'shieldBar':'magicShieldBar').style.width=`${Math.min(100,Math.max(0,value/Math.max(1,maximum)*100))}%`;
    $(type==='physical'?'shieldLabel':'magicShieldLabel').textContent=`${type==='physical'?'物理':'法术'}护盾 ${format(value)} / ${maximum}`;
   }
   $('markTag').classList.toggle('on',!!enemy.marked||!!enemy.remnant);$('markTag').classList.toggle('remnant',!!enemy.remnant);$('markTag').title=enemy.remnant?'残念：护盾受伤时反伤，并获得等量同类型护盾':'狸猫标记';renderPhaseTwoMarkArt(!!enemy.remnant);
   $('burnStatus').classList.toggle('on',(enemy.burn||0)+(enemy.deadFire||0)>0);$('burnStatus').title=`燃烧 ${enemy.burn||0} 层 · 死火 ${enemy.deadFire||0} 层`;$('burnStack').innerHTML=Array.from({length:enemy.burn||0},()=>'<img src="assets/burn-flame.png" alt="燃烧">').join('')+Array.from({length:enemy.deadFire||0},()=>'<img src="assets/dead-fire.png" alt="死火">').join('');
  });
 }
}
const phaseThreeRosterBefore=renderEnemyRoster;
renderEnemyRoster=function(){if(dragonPhaseThree()){if(!s.enemies)return;if(!s.phase3Initialized)initDragonStage(3);document.getElementById('game').classList.remove('dual-puppets');renderPhaseThreeEnemies();const setting=document.getElementById('puppetCountSetting');if(setting)setting.hidden=true;return}if(phaseThreeSoldierViews.size)clearPhaseThreeSoldierViews();thirdEnemy.hidden=true;return phaseThreeRosterBefore()};
const phaseThreeRenderBefore=render;
render=function(){phaseThreeRenderBefore();$('game').classList.toggle('dragon-phase-three',dragonPhaseThree());if(dragonPhaseThree()&&s.enemies)renderPhaseThreeEnemies()};
const phaseThreeCheckBefore=checkEnd;
checkEnd=function(){
 if(!dragonPhaseThree())return phaseThreeCheckBefore();
 if(s.enemies[0].hp<=0){s.enemies=s.enemies.slice(0,1);s.targetIndex=0;const ended=phaseThreeCheckBefore();if(ended)clearPhaseThreeDiceDisplay();return ended}
 if(!s.enemies[s.targetIndex]||s.enemy<=0)s.targetIndex=0;
 const ended=phaseThreeBoss(phaseThreeCheckBefore);if(ended)clearPhaseThreeDiceDisplay();return ended;
};
const phaseThreeSettingsBefore=applySettings;
applySettings=function(...args){return dragonPhaseThree()?phaseThreeBoss(()=>phaseThreeSettingsBefore(...args)):phaseThreeSettingsBefore(...args)};

// Ten dice remain visible together for Return to Heaven.
for(let index=7;index<=10;index++){const die=document.createElement('div');die.id='dice'+index;die.className='dice';die.style.display='none';$('dicePair').appendChild(die)}
const phaseThreeClearBefore=clearDragonDice;
clearDragonDice=function(){phaseThreeClearBefore();$('dicePair').classList.remove('phase-three-many');for(let index=1;index<=10;index++){const die=$('dice'+(index===1?'':index));if(!die)continue;die.classList.remove('stolen-roll','rolling','crane-roll','gold-roll');if(index>6)die.style.display='none'}};
function clearPhaseThreeDiceDisplay(){$('diceWrap').classList.remove('show');clearDragonDice();$('diceCaption').textContent=''}
function phaseThreeAnimateDice(count,label,done,owned=[],purple=false,kind=''){
 s.busy=true;render();clearDragonDice();$('dicePair').classList.toggle('double',count===2);$('dicePair').classList.toggle('phase-three-many',count>2);
 const nodes=Array.from({length:10},(_,index)=>$('dice'+(index===0?'':index+1)));
 nodes.forEach((node,index)=>{node.style.display=index<count?'grid':'none';node.classList.toggle('rolling',index<count);node.classList.toggle('crane-roll',owned.includes(index));node.classList.toggle('stolen-roll',purple&&index<count&&kind!=='apocalypse');node.classList.toggle('dragon-purple',kind==='apocalypse'&&index<3);node.classList.toggle('dragon-black',kind==='apocalypse'&&index===3)});
 $('diceWrap').classList.add('show');$('diceCaption').textContent=label;let ticks=0;const state=s;
 diceTimer=setInterval(()=>{
  if(s!==state||!dragonPhaseThree()){clearInterval(diceTimer);return}
  for(let index=0;index<count;index++)nodes[index].textContent=String(owned.includes(index)?rollPartyDie():rollEnemyDie());
  if(++ticks<12)return;clearInterval(diceTimer);
  const shown=nodes.slice(0,count).map((_,index)=>owned.includes(index)?rollPartyDie():rollEnemyDie());shown.forEach((face,index)=>{nodes[index].textContent=String(face);nodes[index].classList.remove('rolling')});
  done(shown.map((face,index)=>owned.includes(index)?0:face),shown,owned);
 },75);
}
const phaseThreeRollBefore=rollDragonAction;
function phaseThreeSoldiersWillAct(){return (s.phase3SoldierDeadline==null||s.phase3Turn<s.phase3SoldierDeadline)&&s.enemies.some(enemy=>enemy.soldier&&!enemy.dismissed&&enemy.hp>0)}
rollDragonAction=function(id,cost){
 if(!dragonPhaseThree()||!phaseThreePaidNames[id])return phaseThreeRollBefore(id,cost);
 const total=enemyActionDice(),spent=total-s.enemyAp,owned=[],intercept=talentActive('crane')&&hasPartySkill('skyfall');
 if(intercept&&spent===0)owned.push(0);if(intercept&&spent+cost>=total&&id!=='peak'&&!phaseThreeSoldiersWillAct()&&!owned.includes(cost-1))owned.push(cost-1);
 s.enemyAp-=cost;s.dragonDiceSpent=spent+cost;s.dragonUses[id]=(s.dragonUses[id]||0)+1;
 s.phase3NormalAp=Math.max(0,(s.phase3NormalAp??10)-cost);
 phaseThreeAnimateDice(cost,`${phaseThreePaidNames[id]} · ${cost}枚${dieName(enemyDieSides())}`,(faces,shown,taken)=>resolveDragonSkill(id,faces,shown,taken),owned);
};
function phaseThreeReturnSky(faces){
 const sum=faces.reduce((a,b)=>a+b,0),type=s.shield===s.magicShield?(Math.random()<.5?'physical':'magic'):(s.shield>s.magicShield?'physical':'magic'),key=type==='physical'?'shield':'magicShield',converted=s[key];
 s[key]=0;const bonus=converted>100?converted/10:converted,amount=sum+bonus;
 return{type,converted,sum,amount,packet:{targets:['cat','bird'],physical:type==='physical'?amount:0,magic:type==='magic'?amount:0,label:`回天：骰子合计${sum} + ${format(converted)}${converted>100?'÷10':''} = ${format(amount)}`}};
}
// Gui Xin debts are created this enemy turn, withheld next player turn, and used only if not reclaimed.
function stealPhaseThreeDie(){if(!dragonPhaseThree()||s.turn!=='enemy'||s.over)return 0;const before=s.phase3Borrowed||0;s.phase3Borrowed=Math.min(2,before+1);return s.phase3Borrowed-before}
const phaseThreePacketBefore=phaseTwoDamagePacket,phaseThreeDealBefore=dragonDeal,phaseThreeGraspBefore=dragonGrasp;
phaseTwoDamagePacket=function(packet){if(dragonPhaseThree()&&!s.phase3Actor&&s.divineBuff&&(packet.physical>0||packet.magic>0)){packet={...packet,physical:packet.physical+s.divineBuff.physical,magic:packet.magic+s.divineBuff.magic};s.divineBuff=null}const result=phaseThreePacketBefore(packet);if(!s.phase3Actor&&result.hp+result.physicalShield+result.magicShield>0)stealPhaseThreeDie();return result};
dragonDeal=function(...args){const result=phaseThreeDealBefore(...args);if(result.hp+result.physicalShield+result.magicShield>0)stealPhaseThreeDie();return result};
function phaseThreeGraspActive(){return dragonPhaseThree()&&s.phase3Turn>=3&&!s.phase3Actor}
dragonGrasp=function(loss){return dragonPhaseThree()&&!phaseThreeGraspActive()?{pGain:0,mGain:0,hpGain:0,triggered:false}:phaseThreeGraspBefore(loss)};
const phaseThreeMaxApBefore=maxActionPoints;
maxActionPoints=function(){return Math.max(0,phaseThreeMaxApBefore()-(dragonPhaseThree()?(s.phase3PartyDebt||0):0))};
const phaseThreeDamageRecordBefore=recordEvolutionDamage;
recordEvolutionDamage=function(state,key,previous,value){
 phaseThreeDamageRecordBefore(state,key,previous,value);
 if(state!==s||!dragonPhaseThree()||s.turn!=='player'||s.over||!['enemy','shield','magicShield'].includes(key)||!(previous>value)||!s.phase3PartyDebt)return;
 s.phase3ReclaimDamage=(s.phase3ReclaimDamage||0)+previous-value;
 while(s.phase3PartyDebt>0&&s.phase3ReclaimDamage>=50){s.phase3ReclaimDamage-=50;s.phase3PartyDebt--;s.ap++}
};
const phaseThreeStartBefore=startEnemyTurn;
startEnemyTurn=function(...args){
 if(dragonPhaseThree()&&!s.over){s.phase3PartyTarget=s.targetIndex;s.targetIndex=0;s.phase3Turn++;s.phase3EnemyPurpleTotal=Math.min(2,s.phase3PartyDebt||0);s.phase3EnemyPurpleLeft=s.phase3EnemyPurpleTotal;s.phase3PartyDebt=0;s.phase3Borrowed=0;s.phase3NormalAp=10;s.phase3Actor=0;s.phase3EndingTurn=false;s.phase3SoldierQueue=null}
 return phaseThreeStartBefore(...args);
};
const phaseThreePlayerBefore=beginPlayerTurn;
beginPlayerTurn=function(...args){
 if(dragonPhaseThree()&&!s.over){s.phase3PartyDebt=Math.min(2,s.phase3Borrowed||0);s.phase3Borrowed=0;s.phase3ReclaimDamage=0;s.phase3Actor=0;s.targetIndex=s.enemies[s.phase3PartyTarget]?.hp>0&&!s.enemies[s.phase3PartyTarget]?.dismissed?s.phase3PartyTarget:0}
 return phaseThreePlayerBefore(...args);
};

function phaseThreeSummonSoldiers(faces){
 if(s.phase3SoldierDeadline!=null&&s.enemies.some(enemy=>enemy.soldier&&!enemy.dismissed&&enemy.hp>0))return '死士仍在战场上，本次召唤不刷新下一回合的击杀期限。';
 const sum=faces[0]+faces[1],hp=sum<=10?20:sum;
 const make=(soldier,name,physical,magic)=>({soldier,name,hp,hpMax:hp,physical,physicalMax:physical,magic,magicMax:magic,burn:0,marked:false,dismissed:false});
 s.enemies=[s.enemies[0],make('he','死士（赫）',999,0),make('cang','死士（苍）',0,999)];s.phase3SoldierDeadline=s.phase3Turn+1;s.phase3SummonedTurn=s.phase3Turn;s.targetIndex=0;
 return `凌绝顶：${faces[0]}+${faces[1]}=${sum}，两名死士各有${hp}点生命；赫拥有999物理护盾，苍拥有999法术护盾。请在接下来一个我方回合内击杀。`;
}
function dismissPhaseThreeSoldiers(){for(const enemy of s.enemies)if(enemy.soldier){enemy.dismissed=true;enemy.hp=0;enemy.marked=false;enemy.burn=0}if(s.targetIndex>0)s.targetIndex=0;s.phase3SoldierDeadline=null}
function phaseThreeDeadlinePlan(){
 const alive=s.enemies.filter(enemy=>enemy.soldier&&!enemy.dismissed&&enemy.hp>0),he=alive.some(enemy=>enemy.soldier==='he'),cang=alive.some(enemy=>enemy.soldier==='cang');
 return{count:he&&cang?4:he||cang?2:0,physical:he,magic:cang,pShield:he?alive.filter(enemy=>he&&cang||enemy.soldier==='he').reduce((n,e)=>n+e.physical,0):0,mShield:cang?alive.filter(enemy=>he&&cang||enemy.soldier==='cang').reduce((n,e)=>n+e.magic,0):0};
}
function resolvePhaseThreeDeadline(done){
 if(s.phase3SoldierDeadline==null||s.phase3Turn<s.phase3SoldierDeadline){done();return}
 const plan=phaseThreeDeadlinePlan();if(!plan.count){dismissPhaseThreeSoldiers();done();return}
 s.targetIndex=0;phaseThreeAnimateDice(plan.count,'凌绝顶 · 死士期限已到 · 免费骰',faces=>{
  const sum=faces.reduce((a,b)=>a+b,0);s.shield+=plan.pShield;s.magicShield+=plan.mShield;dismissPhaseThreeSoldiers();
  runPhaseTwoPackets([{targets:['cat','bird'],physical:plan.physical?sum:0,magic:plan.magic?sum:0,label:`凌绝顶到期：${faces.join('+')}=${sum}；吸收物理盾${plan.pShield}、法术盾${plan.mShield}`}],()=>{s.busy=false;clearPhaseThreeDiceDisplay();done()});
 });
}
function resolvePhaseThreeSoldier(index,faces){
 const enemy=s.enemies[index];if(!enemy||enemy.hp<=0||enemy.dismissed)return;
 const sum=faces.reduce((a,b)=>a+b,0),physical=enemy.soldier==='he',name=physical?'炽血':'冻焰';if(sum>0)stealPhaseThreeDie();
 return{targets:['cat','bird'],physical:physical?sum:0,magic:physical?0:sum,label:`${enemy.name} · ${name}：${faces.join('+')}=${sum}，夺取下回合1枚骰子（全局上限2枚）`};
}
function runPhaseThreeSoldiers(done){
 if(s.over)return;if(!s.phase3SoldierQueue)s.phase3SoldierQueue=s.enemies.map((enemy,index)=>enemy.soldier&&enemy.hp>0&&!enemy.dismissed?index:-1).filter(index=>index>0);
 const index=s.phase3SoldierQueue.shift();if(index==null){s.phase3Actor=0;s.targetIndex=0;s.enemyAp=0;s.busy=false;clearPhaseThreeDiceDisplay();done();return}
 const enemy=s.enemies[index];if(!enemy||enemy.hp<=0||enemy.dismissed){runPhaseThreeSoldiers(done);return}
 s.phase3Actor=index;s.targetIndex=index;s.enemyAp=2;
 const laterSoldier=s.phase3SoldierQueue.some(next=>s.enemies[next]?.hp>0&&!s.enemies[next]?.dismissed);
 const owned=talentActive('crane')&&hasPartySkill('skyfall')&&!laterSoldier?[1]:[];
 phaseThreeAnimateDice(2,`${enemy.name} · ${enemy.soldier==='he'?'炽血':'冻焰'} · 双${dieName(enemyDieSides())}`,(faces,shown,taken)=>{
  s.enemyAp=0;s.allyDamageDisplay={cat:0,bird:0};if(taken.length){const chase=emptyDamage();for(const i of taken)mergeDamage(chase,applyCranePursuit(shown[i]));showEnemyDamage(chase.hp,chase.physical,chase.magic)}
  if(taken.length)consumePhaseThreeBurnout('skyfall',null,taken.length);
  if(checkEnd())return;const packet=resolvePhaseThreeSoldier(index,faces);if(!packet){clearPhaseThreeDiceDisplay();runPhaseThreeSoldiers(done);return}
  runPhaseTwoPackets([packet],notes=>{s.allyDamageDisplay=null;s.busy=false;clearPhaseThreeDiceDisplay();render();setDialog(enemy.name,notes.join(' '),'死士行动结束');setTimeout(()=>{s.phase3Actor=0;s.targetIndex=0;runPhaseThreeSoldiers(done)},550)});
 },owned);
}
const phaseThreeBurnTickBefore=resolveEnemyBurnTick;
resolveEnemyBurnTick=function(...args){
 if(!dragonPhaseThree())return phaseThreeBurnTickBefore(...args);if(s.over||s.phase3EndingTurn)return;
 s.phase3EndingTurn=true;resolvePhaseThreeDeadline(()=>runPhaseThreeSoldiers(()=>{s.targetIndex=0;phaseThreeBurnTickBefore(...args)}));
};

function beginPhaseThreeDamageDisplay(){s.allyDamageDisplay={cat:0,bird:0};for(const who of ['cat','bird'])$(`${who}Damage`).classList.remove('show')}
function finishPhaseThreeSkill(text){settleDragonRemnant(()=>{s.allyDamageDisplay=null;s.busy=false;finishDragonAction(text,'第三阶段 · 技能结算完成')})}
function resolvePhaseThreeSkill(id,faces,shown=faces,owned=[]){
 beginPhaseThreeDamageDisplay();s.targetIndex=0;s.remnantTransaction={state:s,who:s.selected,physical:0,magic:0,triggered:false};
 if(owned.length){const chase=emptyDamage();for(const i of owned)mergeDamage(chase,applyCranePursuit(shown[i]));showEnemyDamage(chase.hp,chase.physical,chase.magic)}if(checkEnd())return;
 if(id==='summit'){finishPhaseThreeSkill(applyPhaseThreeBurnout(faces));return}
 if(id==='peak'){finishPhaseThreeSkill(phaseThreeSummonSoldiers(faces));return}
 const result=phaseThreeReturnSky(faces);runPhaseTwoPackets([result.packet],notes=>finishPhaseThreeSkill(notes.join(' ')));
}
const phaseThreeResolveBefore=resolveDragonSkill;
resolveDragonSkill=function(id,...args){if(!dragonPhaseThree())return phaseThreeResolveBefore(id,...args);if(phaseThreeNames[id])return resolvePhaseThreeSkill(id,...args);if(phaseTwoNames[id]){s.phase2CastForm=phaseTwoMoonForm();return resolvePhaseTwoSkill(id,...args)}return phaseThreeResolveBefore(id,...args)};
function rollPhaseThreeStolenDie(){
 s.phase3EnemyPurpleLeft--;s.enemyAp--;s.dragonDiceSpent++;const owned=talentActive('crane')&&hasPartySkill('skyfall')&&s.enemyAp===0&&!phaseThreeSoldiersWillAct()?[0]:[];
 phaseThreeAnimateDice(1,'归心 · 紫色骰子决定继承技能',(faces,shown,taken)=>{
  if(taken.length){const chase=applyCranePursuit(shown[0]);showEnemyDamage(chase.hp,chase.physical,chase.magic);consumePhaseThreeBurnout('skyfall');finishPhaseThreeSkill('落九天接管了归心紫骰，本次继承技能取消。');return}
  const id=faces[0]%2?'apocalypse':'moon',cost=id==='apocalypse'?4:phaseTwoMoonCost();
  s.dragonUses[id]=(s.dragonUses[id]||0)+1;phaseThreeAnimateDice(cost,`归心${faces[0]}点 · ${id==='apocalypse'?'天启':'袭月'} · 免费${cost}骰`,(values,visible)=>resolveDragonSkill(id,values,visible,[]),[],true,id);
 },owned,true);
}
const phaseThreeEnemyActBefore=enemyAct;
function preparePhaseThreeRequired(){
 if(s.phase3RequiredPreparedTurn===s.phase3Turn)return;
 s.phase3RequiredPreparedTurn=s.phase3Turn;s.phase3Required??=[];
 if(s.phase3Turn===1)for(const id of ['summit','peak'])if(!s.phase3Required.some(item=>item.id===id))s.phase3Required.push({id,cost:2,due:1});
 for(const [id,period,cost] of [['returnSky',5,10],['peak',3,2],['summit',4,2]])if(s.phase3Turn>0&&s.phase3Turn%period===0&&!s.phase3Required.some(item=>item.id===id))s.phase3Required.push({id,cost,due:s.phase3Turn});
 s.phase3Required.sort((a,b)=>Number(b.id==='returnSky')-Number(a.id==='returnSky')||a.due-b.due);
}
enemyAct=function(){
 if(!dragonPhaseThree())return phaseThreeEnemyActBefore();if(s.over)return;s.targetIndex=0;s.phase3Actor=0;
 preparePhaseThreeRequired();
 if(s.phase3NormalAp>0){
  const required=s.phase3Required[0];if(required&&s.phase3NormalAp>=required.cost){s.phase3Required.shift();if(required.id==='returnSky')s.phase3UltimateTurn=s.phase3Turn;rollDragonAction(required.id,required.cost);return}
  let id='liujia',cost=1;
  if(!s.divineBuff&&s.phase3NormalAp>=3&&Math.random()<.35)id='divine';
  else if(s.phase3NormalAp>=2){if(s.enemy<battleStats().enemyMax&&Math.random()<.25)id='duanhong';else id=Math.random()<.5?'ruin':'liujia';cost=['ruin','duanhong'].includes(id)?2:1}
  rollDragonAction(id,cost);return;
 }
 if(s.phase3EnemyPurpleLeft>0){rollPhaseThreeStolenDie();return}resolveEnemyBurnTick();
};

function phaseThreeBurnoutSlots(id,who=null){
 if(!dragonPhaseThree()||!s.phase3Burnout)return[];const found=[];
 for(const owner of who?[who]:['cat','bird'])loadout[owner].forEach((skill,index)=>{const entry=s.phase3Burnout[owner][index];if(skill===id&&entry?.id===id&&entry.remaining>0)found.push({owner,index,entry})});return found;
}
function applyPhaseThreeBurnout(faces){
 if(faces[0]<=0||faces[1]<=0)return '登峰造极的骰子被接管，焚尽未生效。';
 const low=faces[0]<=enemyDieSides()/2,count=low?2:4,remaining=low?Math.ceil(faces[1]/2):faces[1],slots=[];
 for(const owner of ['cat','bird'])loadout[owner].forEach((id,index)=>{if(id&&!isInitialSkill(id))slots.push({owner,index,id})});
 for(let index=slots.length-1;index>0;index--){const other=Math.floor(Math.random()*(index+1));[slots[index],slots[other]]=[slots[other],slots[index]]}
 const chosen=slots.slice(0,count);for(const slot of chosen){const previous=s.phase3Burnout[slot.owner][slot.index];s.phase3Burnout[slot.owner][slot.index]={id:slot.id,remaining:previous?.id===slot.id?Math.min(previous.remaining,remaining):remaining}}
 return `登峰造极：${faces[0]}、${faces[1]}；${chosen.length?chosen.map(slot=>`${slot.owner==='cat'?'黑猫':'白鸟'}的「${skillDefs[slot.id].name}」剩余${s.phase3Burnout[slot.owner][slot.index].remaining}次`).join('、'):'当前没有可施加焚尽的英杰技能'}。重复焚尽取新旧剩余次数较小值。初始四技能不受影响，被动每次生效也扣除1次。`;
}
function syncPhaseThreeTalents(previousAp){
 s.cat=Math.min(s.cat,maxHp('cat'));s.bird=Math.min(s.bird,maxHp('bird'));
 if(s.turn==='player')s.ap=Math.max(0,s.ap+maxActionPoints()-previousAp);
 if(!talentActive('tanuki'))for(const enemy of s.enemies)enemy.marked=false;
 if(!talentActive('fox')){s.pendingBurn=0;s.pendingBurnLayers=0;for(const enemy of s.enemies)enemy.burn=0}
 if(!goldMechanicActive())s.goldCharge={physical:0,magic:0};
}
function consumePhaseThreeBurnout(id,who=null,count=1,slots=null){
 if(!dragonPhaseThree()||isInitialSkill(id))return;
 const affected=slots||phaseThreeBurnoutSlots(id,who),oldAp=maxActionPoints();let removed=false;
 for(const slot of affected){if(loadout[slot.owner][slot.index]!==id||s.phase3Burnout[slot.owner][slot.index]!==slot.entry)continue;slot.entry.remaining=Math.max(0,slot.entry.remaining-count);if(slot.entry.remaining===0){loadout[slot.owner][slot.index]=null;s.phase3Burnout[slot.owner][slot.index]=null;removed=true}}
 if(removed)syncPhaseThreeTalents(oldAp);
}
function consumePhaseThreeActiveBurnout(){const use=s.phase3ActiveSkillUse;s.phase3ActiveSkillUse=null;if(use)consumePhaseThreeBurnout(use.id,use.who,1,use.slots)}
const phaseThreeFinishRollBefore=finishRoll;
finishRoll=function(id,who,...args){
 if(dragonPhaseThree()){
  s.remnantTransaction={state:s,who,physical:0,magic:0,triggered:false};
  if(!isInitialSkill(id)){const slot=s.phase3ChosenSlot,snapshot=phaseThreeBurnoutSlots(id,who);s.phase3ActiveSkillUse={id,who,slots:slot?.who===who&&loadout[who][slot.index]===id?snapshot.filter(item=>item.index===slot.index):snapshot.slice(0,1)}}
  s.phase3ChosenSlot=null;
 }
 return phaseThreeFinishRollBefore(id,who,...args);
};
const phaseThreeInstallBefore=installEquippedSkill;
installEquippedSkill=function(index){if(dragonPhaseThree()&&s.equipSkill&&s.phase3Burnout)s.phase3Burnout[s.selected][index]=null;return phaseThreeInstallBefore(index)};
const phaseThreeMountainBefore=applyMountainSea;
applyMountainSea=function(){const holders=['cat','bird'].filter(who=>hasSkill(who,'mountain')&&(s[`${who}Shield`]>0||s[`${who}MagicShield`]>0)),notes=phaseThreeMountainBefore();for(const who of holders)consumePhaseThreeBurnout('mountain',who);return notes};
const phaseThreeHealBefore=healParty;
healParty=function(amount,source){const result=phaseThreeHealBefore(amount);if(source==='maple')consumePhaseThreeBurnout('maple');return result};
const phaseThreeResolveSkyfallBefore=resolveDragonSkill,phaseThreeFinishActionBefore=finishDragonAction;
resolveDragonSkill=function(id,faces,shown=faces,owned=[]){if(dragonPhaseThree())s.phase3SkyfallUses=(s.phase3SkyfallUses||0)+owned.length;return phaseThreeResolveSkyfallBefore(id,faces,shown,owned)};
finishDragonAction=function(...args){if(dragonPhaseThree()){if(s.phase3SkyfallUses)consumePhaseThreeBurnout('skyfall',null,s.phase3SkyfallUses);s.phase3SkyfallUses=0}return phaseThreeFinishActionBefore(...args)};
const phaseThreeRemnantBefore=phaseTwoRemnant,phaseThreeDeadBefore=phaseTwoDeadFire;
phaseTwoRemnant=function(){return dragonPhaseThree()?!!phaseTwoEnemy()?.remnant:phaseThreeRemnantBefore()};
phaseTwoDeadFire=function(){return dragonPhaseThree()?(phaseTwoEnemy()?.deadFire||0):phaseThreeDeadBefore()};

const phaseThreeSkillRenderBefore=renderSkills;
renderSkills=function(){
 phaseThreeSkillRenderBefore();if(!dragonPhaseThree()||!s.phase3Burnout||s.equipSkill||s.over)return;
 const who=s.selected,buttons=Array.from($('skillButtons').children);
 buttons.forEach((button,index)=>{if(!button.dataset.skillId)return;const click=button.onclick;button.onclick=()=>{s.phase3ChosenSlot={who,index};click()};const entry=s.phase3Burnout[who][index];if(entry?.id!==loadout[who][index])return;button.classList.add('burnout');const badge=document.createElement('span');badge.className='burnout-count';badge.textContent=`焚尽 · 剩余${entry.remaining}次`;button.appendChild(badge);button.dataset.skillDesc+=`\n\n焚尽：剩余${entry.remaining}次使用。主动释放或被动生效各消耗1次，耗尽后从当前技能槽清除，可通过灵魂余烬重新获得。`});
};
const phaseThreeStatus=document.createElement('div');phaseThreeStatus.id='phaseThreeStatus';phaseThreeStatus.hidden=true;document.querySelector('.turn').appendChild(phaseThreeStatus);
const phaseThreeFinalRenderBefore=render;
render=function(){
 phaseThreeFinalRenderBefore();phaseThreeStatus.hidden=!dragonPhaseThree();if(!dragonPhaseThree())return;
 phaseThreeStatus.textContent=`归心：下回合夺骰 ${s.phase3Borrowed||0}/2 · 当前待夺回 ${s.phase3PartyDebt||0}枚`+(s.phase3PartyDebt?`（伤害 ${format(s.phase3ReclaimDamage||0)}/50）`:'');
 if(s.turn==='enemy'&&!s.phase3Actor){const icons=Array.from($('ap').children);icons.forEach((icon,index)=>{icon.classList.toggle('stolen',index>=10);icon.classList.toggle('off',index<10?index>=(s.phase3NormalAp||0):index-10>=(s.phase3EnemyPurpleLeft||0))})}
};
const phaseThreeLore={
 divine:dragonSkillLore.divine,
 ruin:dragonSkillLore.ruin+'（第三阶段：巨龙物理护盾与法术护盾总和高于100时，不造成第二段根据护盾值增加的伤害。）',
 summit:'（主动）登峰造极：投掷两枚骰子，第一枚骰子若投出小于骰子上限一半的点数（123或12345），则随机选择两个我方英杰技能，施加“焚尽状态”，根据第二枚骰子投出点数除以二决定该英杰技能的剩余使用次数（使用次数耗尽后该英杰技能将被烧尽，从技能槽中清除（但仍可被新的灵魂余烬加入到技能槽中，并非永久移除））；第一枚骰子若投出大于骰子上限一半的点数（456或678910），则随机选择四个我方英杰技能，施加“焚尽状态”，根据第二枚骰子投出点数决定该英杰技能的剩余使用次数。施加焚尽状态后的我方技能将被紫色的框框住，并显示剩余可用次数。进入第三阶段的第一个敌方回合内必定释放一次，之后每4回合必定释放一次，重复施加时取当前次数与新次数中的较小值，不会增加当前剩余次数。',
 peak:'（主动）凌绝顶：投掷两枚骰子，召唤两名死士，若在下一回合内未将两名死士击杀，则投掷四枚不消耗行动力的骰子，将四枚骰子点数相加，造成一次该点数的物理伤害，同时造成一次该点数的法术伤害，并清除死士，将死士的所有护盾增加至自身；若击杀死士（苍）但未击杀死士（赫），则将投掷两枚骰子，造成点数相加的物理伤害，并清除死士（赫），将死士（赫）的所有物理护盾增加至自身；若击杀死士（赫）但未击杀死士（苍），则将投掷两枚骰子，造成点数相加的法术伤害，并清除死士（苍），将死士（苍）的所有法术护盾增加至自身；进入第三阶段的第一个敌方回合内必定释放一次，之后每三回合必定释放一次。两名死士均被击杀则不触发追加伤害。召唤骰子相加不超过10时，两名死士各20血；超过10时，各为点数和的血量。赫拥有999物理盾、0法术盾，使用双D10点数和的全体物理攻击“炽血”；苍拥有0物理盾、999法术盾，使用双D10点数和的全体法术攻击“冻焰”；两者各夺取我方下回合1枚骰子。',
 returnSky:'（主动）回天：投掷十枚骰子，将十枚骰子的点数相加，并消耗自身持有护盾值更高一端的全部护盾，转化为相应属性伤害叠加到原伤害中，原伤害类型与护盾转化类型一致。（例如此时物理护盾更多，则将物理护盾转化为物理伤害叠加至原先的物理伤害上），若此时自身拥有该类型护盾值>100时，将该附加伤害除以10。该技能每5回合必定释放一次'
};
const phaseThreeHasLoreBefore=dragonHasLore,phaseThreeLoreBefore=renderDragonLore;
dragonHasLore=function(){return dragonPhaseThree()||phaseThreeHasLoreBefore()};
renderDragonLore=function(){
 if(!dragonPhaseThree())return phaseThreeLoreBefore();
 const descriptions={...dragonSkillLore,...phaseTwoLore,...phaseThreeLore},names={divine:'宛若神明',ruin:'城欲摧',apocalypse:'天启',...phaseTwoNames,...phaseThreeNames};
 const used=Object.entries(descriptions).filter(([id])=>s.dragonUses[id]>0).map(([id,text])=>`<div class="boss-skill-lore"><strong>${names[id]} · 已使用 ${s.dragonUses[id]} 次</strong><br>${text}</div>`).join('');
 $('bossLore').innerHTML='<strong>巨龙 · 魔王 · 暴君 · 毁灭</strong><div class="boss-skill-lore"><strong>第三阶段天赋</strong><br>初始拥有10枚骰子，每枚骰子为'+dieName(enemyDieSides())+'。</div><div class="boss-skill-lore"><strong>特殊机制：归心</strong><br>每回合造成一次伤害夺取我方下回合一枚骰子，上限为两枚。该骰子在使用时若掷出奇数，则使用一阶段技能天启；若掷出偶数，则使用二阶段技能袭月（该骰子显示在行动力上为紫色）。我方在下回合中每对敌方造成50点伤害可夺回一枚骰子。未夺回的骰子加入巨龙下个敌方回合，每枚紫骰决定阶段后免费投掷所选技能需要的骰子。</div><div class="boss-skill-lore"><strong>特殊机制：攫取（进入三阶段两回合后开启）</strong><br>每回合首次造成伤害和最后一次造成伤害时，获得与造成伤害相同的血量/盾值。实际扣除我方多少物理护盾、法术护盾和生命，就分别获得等量物理护盾、法术护盾和生命。从本阶段第3个敌方回合开始生效，死士攻击不触发巨龙攫取。</div><div class="boss-skill-lore">强力技能分别有每3、4、5回合的固定节奏；发生冲突时优先释放10骰技能。基础骰子不足时，其余必放技能顺延到下一回合优先补放。</div>'+used;
};

// Soldiers share the dragon's lore panel style without changing the selected target.
const soldierLore=document.createElement('div');soldierLore.id='soldierLore';soldierLore.className='boss-lore';soldierLore.setAttribute('role','tooltip');document.getElementById('game').appendChild(soldierLore);
let soldierLoreIndex=null,soldierLoreTimer;
function hideSoldierLore(immediate=false){clearTimeout(soldierLoreTimer);const hide=()=>{soldierLore.classList.remove('show');soldierLoreIndex=null};if(immediate)hide();else soldierLoreTimer=setTimeout(hide,170)}
function showSoldierLore(index){
 const enemy=s.enemies?.[index];if(!dragonPhaseThree()||!enemy?.soldier||enemy.dismissed||enemy.hp<=0)return;
 clearTimeout(soldierLoreTimer);clearTimeout(bossLoreHideTimer);document.getElementById('bossLore').classList.remove('show');soldierLoreIndex=index;
 const physical=enemy.soldier==='he',type=physical?'物理':'法术',skill=physical?'炽血':'冻焰';
 soldierLore.innerHTML=`<strong>${enemy.name} · 死士 · 召唤物</strong><div class="boss-skill-lore"><strong>天赋</strong><br>初始拥有两枚骰子，每枚骰子为${dieName(enemyDieSides())}。<br>初始物理护盾：${physical?999:0}；初始法术护盾：${physical?0:999}。</div><div class="boss-skill-lore"><strong>（主动）${skill}</strong><br>投掷两枚骰子，对我方所有单位造成点数相加的${type}伤害，并夺取我方下回合的一枚骰子。</div>`;
 soldierLore.classList.add('show');requestAnimationFrame(()=>{
  if(soldierLoreIndex!==index)return;const anchor=document.getElementById(index===1?'enemyName-second':'enemyName-third').getBoundingClientRect(),box=soldierLore.getBoundingClientRect();
  const left=Math.max(12,Math.min(innerWidth-box.width-12,anchor.left+anchor.width/2-box.width/2));let top=anchor.top-box.height-10;if(top<10)top=anchor.bottom+10;
  soldierLore.style.left=left+'px';soldierLore.style.top=Math.max(10,Math.min(innerHeight-box.height-10,top))+'px';
 });
}
for(const index of [1,2])for(const base of ['enemyName','enemySub']){
 const name=document.getElementById(base+(index===1?'-second':'-third'));name.tabIndex=0;name.setAttribute('aria-describedby','soldierLore');
 name.addEventListener('pointerenter',()=>showSoldierLore(index));name.addEventListener('pointerleave',()=>hideSoldierLore());name.addEventListener('focus',()=>showSoldierLore(index));name.addEventListener('blur',()=>hideSoldierLore());
}
soldierLore.addEventListener('pointerenter',()=>clearTimeout(soldierLoreTimer));soldierLore.addEventListener('pointerleave',()=>hideSoldierLore());
for(const id of ['enemyName','enemySub'])document.getElementById(id).addEventListener('pointerenter',()=>hideSoldierLore(true));
const renderBeforeSoldierLore=render;
render=function(...args){const result=renderBeforeSoldierLore(...args);if(soldierLoreIndex!==null){const enemy=s.enemies?.[soldierLoreIndex];if(!dragonPhaseThree()||!enemy?.soldier||enemy.dismissed||enemy.hp<=0)hideSoldierLore(true)}return result};
window.addEventListener('resize',()=>{if(soldierLoreIndex!==null)showSoldierLore(soldierLoreIndex)});
