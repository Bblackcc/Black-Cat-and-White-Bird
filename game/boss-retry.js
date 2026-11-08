/* Each phase owns an immutable entry loadout, independent of the ongoing fight. */
let bossEntryCheckpoint=null,bossEntryCheckpoints={},bossRetryRestoring=false;
const bossCheckpointKeys=['totalDamageDealt','diceSpent','emberActivations','emberReady','evolutionEmberOffset','tanukiUnlocked','foxUnlocked','craneUnlocked','goldUnlocked','catShield','catShieldMax','catMagicShield','catMagicShieldMax','birdShield','birdShieldMax','birdMagicShield','birdMagicShieldMax'];
function captureBossEntry(phase=s.bossPhase){
 if(s.battleMode!=='boss'||bossRetryRestoring||s.retryPreparing||s.over)return;
 const state={};for(const key of bossCheckpointKeys)state[key]=s[key]??(key==='evolutionEmberOffset'?0:s[key]);
 const checkpoint={phase,skills:{cat:[...loadout.cat],bird:[...loadout.bird]},state};bossEntryCheckpoints[phase]=checkpoint;if(phase===1)bossEntryCheckpoint=checkpoint;
}
const resetBeforeBossRetry=resetBattle;
resetBattle=function(mode='puppet',phase=1){
 hideBossRetryMenu();if(!bossRetryRestoring){bossEntryCheckpoints={};bossEntryCheckpoint=null}resetBeforeBossRetry(mode,phase);
 if(s.battleMode==='boss'&&!bossRetryRestoring){captureBossEntry();for(let earlier=1;earlier<s.bossPhase;earlier++){bossEntryCheckpoints[earlier]={...bossEntryCheckpoints[s.bossPhase],phase:earlier};if(earlier===1)bossEntryCheckpoint=bossEntryCheckpoints[earlier]}}
};
let checkpointState=s,checkpointPhase=s.bossPhase;
const renderBeforePhaseCheckpoint=render;
render=function(){const changed=checkpointState===s&&checkpointPhase!==s.bossPhase;checkpointState=s;checkpointPhase=s.bossPhase;renderBeforePhaseCheckpoint();if(changed&&s.battleMode==='boss')captureBossEntry()};
function restartBattleAfterEnd(){if(s.battleMode==='boss'&&s.cat<=0&&s.bird<=0)showBossRetryMenu();else resetBattle(s.battleMode,s.bossPhase)}
const bossRetryOverlay=document.createElement('div');bossRetryOverlay.id='bossRetryOverlay';bossRetryOverlay.hidden=true;bossRetryOverlay.className='boss-retry-overlay';
bossRetryOverlay.innerHTML='<section class="boss-retry-card" role="dialog" aria-modal="true" aria-labelledby="bossRetryTitle"><h2 id="bossRetryTitle">再次挑战巨龙</h2><p id="retryDescription"></p><button type="button" id="retryEntryConfig"><strong id="retryEntryTitle"></strong><small>恢复该阶段入场时的英杰技能、嬗变进度与护盾，生命和行动力补满。</small></button><button type="button" id="retryPreviousConfig"><strong id="retryPreviousTitle"></strong><small>恢复上一阶段的入场配置，从上一阶段重新挑战。</small></button><button type="button" id="retryRandomEmbers"><strong id="retryRandomTitle"></strong><small id="retryRandomDetail"></small></button><button type="button" id="retryCancel">返回</button></section>';document.body.append(bossRetryOverlay);
document.getElementById('retryEntryConfig').onclick=()=>restartBossFromEntry();
document.getElementById('retryPreviousConfig').onclick=()=>restartBossFromEntry(Math.max(1,s.bossPhase-1));
document.getElementById('retryRandomEmbers').onclick=()=>restartBossWithEmbers();
document.getElementById('retryCancel').onclick=hideBossRetryMenu;
function retryGrantCount(phase){return phase===3?10:phase===2?6:3}
function showBossRetryMenu(){
 if(s.battleMode!=='boss'||!s.over||s.cat>0||s.bird>0)return;hideSkillTooltip();toggleChapterMenu(false);document.querySelector('.settings').open=false;
 const phase=s.bossPhase,count=retryGrantCount(phase);document.getElementById('retryDescription').textContent=`选择第${phase}阶段的重开方式。`;
 document.getElementById('retryEntryTitle').textContent=`沿用第${phase}阶段入场配置`;
 document.getElementById('retryPreviousConfig').hidden=phase===1;document.getElementById('retryPreviousTitle').textContent=`回到第${Math.max(1,phase-1)}阶段的入场配置`;
 document.getElementById('retryRandomTitle').textContent=`随机获得${count}次英杰加护，从第${phase}阶段重开`;
 document.getElementById('retryRandomDetail').textContent='恢复初始四技能，清空嬗变进度，依次选择加护技能后开始战斗。';bossRetryOverlay.hidden=false;
}
function hideBossRetryMenu(){const overlay=document.getElementById('bossRetryOverlay');if(overlay)overlay.hidden=true}
function resetForBossRetry(phase=1){stopTutorial();hideBossRetryMenu();toggleChapterMenu(false);bossRetryRestoring=true;try{resetBattle('boss',phase)}finally{bossRetryRestoring=false}}
function validBossDefeat(){return s.over&&s.battleMode==='boss'&&s.cat<=0&&s.bird<=0}
function restartBossFromEntry(phase=s.bossPhase){
 if(!validBossDefeat()||![s.bossPhase,Math.max(1,s.bossPhase-1)].includes(phase))return;
 const checkpoint=bossEntryCheckpoints[phase]||bossEntryCheckpoint,entryPhase=checkpoint?.phase||phase;
 resetForBossRetry(entryPhase);
 if(checkpoint){Object.assign(s,checkpoint.state);loadout.cat.splice(0,4,...checkpoint.skills.cat);loadout.bird.splice(0,4,...checkpoint.skills.bird)}
 s.cat=maxHp('cat');s.bird=maxHp('bird');s.ap=maxActionPoints();s.turn='player';s.busy=false;s.over=false;
 for(const key of Object.keys(bossEntryCheckpoints))if(+key>entryPhase)delete bossEntryCheckpoints[key];
 if(!checkpoint)captureBossEntry();render();setDialog('向导',`已恢复第${entryPhase}阶段入场时的英杰技能和嬗变进度，生命补满。`,`从第${entryPhase}阶段重新挑战`);
}
function restartBossWithEmbers(){
 if(!validBossDefeat())return;const phase=s.bossPhase,count=retryGrantCount(phase);
 resetForBossRetry(phase);s.retryPreparing=true;s.retryGrantTotal=count;s.totalDamageDealt=0;s.emberActivations=0;s.emberReady=count;
 s.evolutionEmberOffset=phase>1?count:0;s.diceSpent=emberThresholdForActivation(count);
 setDialog('向导',`嬗变进度已清空，依次随机获得${count}次英杰加护。安置完成后，从第${phase}阶段重新挑战。`,`重新祈愿 · 共${count}次`);beginEmberRoll();
}
const continueBeforeBossRetry=continueAfterEmber,pursuitBeforeBossRetry=applyCranePursuit;
applyCranePursuit=function(face){return s.retryPreparing?emptyDamage():pursuitBeforeBossRetry(face)};
continueAfterEmber=function(){
 if(!s.retryPreparing){continueBeforeBossRetry();return}if(s.emberPhase||s.equipSkill||s.busy)return;
 if(s.emberReady>0){beginEmberRoll();return}
 s.retryPreparing=false;s.cat=maxHp('cat');s.bird=maxHp('bird');s.ap=maxActionPoints();syncEmberReady();captureBossEntry();render();
 setDialog('向导',`${s.retryGrantTotal}次加护已结算，生命与行动力补满，新的入场配置已记录。`,`第${s.bossPhase}阶段 · 重新祈愿完成`);
};
if(s.battleMode==='boss')captureBossEntry();
