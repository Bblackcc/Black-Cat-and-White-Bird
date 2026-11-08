/* Training encounter roster and guided introduction. Art belongs in assets/. */
const enemyNodeIds=new Set(['enemy','enemyName','enemySub','puppet','enemyPortrait','markTag','shieldTag','burnStatus','burnStack','enemyBar','enemyHp','shieldBar','shieldLabel','magicShieldBar','magicShieldLabel','floatHp','floatShield','floatMagicShield']);
function resolveEnemyNode(id){const suffix=s.enemies&&s.targetIndex===1?'-second':s.enemies&&s.targetIndex===2?'-third':'';return document.getElementById(enemyNodeIds.has(id)?id+suffix:id)}
const enemyFields={enemy:'hp',shield:'physical',magicShield:'magic',enemyBurn:'burn',marked:'marked'};
cfg.puppetCount=2;
function bindEnemyRoster(){
 const values={hp:s.enemy,physical:s.shield,magic:s.magicShield,burn:s.enemyBurn,marked:s.marked};
 s.targetIndex=0;s.enemies=Array.from({length:s.battleMode==='puppet'?cfg.puppetCount:1},()=>({...values}));
 for(const [key,field] of Object.entries(enemyFields))Object.defineProperty(s,key,{configurable:true,enumerable:true,get(){return this.enemies[this.targetIndex][field]},set(value){const previous=this.enemies[this.targetIndex][field];this.enemies[this.targetIndex][field]=value;if(typeof recordEvolutionDamage==='function')recordEvolutionDamage(this,key,previous,value)}});
}
function withEnemy(index,fn){const state=s,previous=s.targetIndex;s.targetIndex=index;try{return fn()}finally{if(s===state)s.targetIndex=previous<(s.enemies?.length||1)?previous:0}}
function aliveEnemies(){return s.enemies?s.enemies.map((e,i)=>e.hp>0?i:-1).filter(i=>i>=0):[0]}
function damageOtherEnemies(physical,magic){let damage=emptyDamage();if(!s.enemies)return damage;for(const index of aliveEnemies()){if(index===s.targetIndex)continue;withEnemy(index,()=>{const p=damageEnemyPhysical(physical),m=damageEnemyMagic(magic);showEnemyDamage(p.hp+m.hp,p.shield,m.shield);mergeDamage(damage,{hp:p.hp+m.hp,physical:p.shield,magic:m.shield})})}return damage}
function markHealthiestEnemy(){let alive=aliveEnemies();if(!alive.length)return false;const max=Math.max(...alive.map(i=>s.enemies[i].hp)),ties=alive.filter(i=>s.enemies[i].hp===max);return withEnemy(ties[Math.floor(Math.random()*ties.length)],installMark)}
function totalEnemyBurn(){return s.enemies?s.enemies.reduce((sum,e)=>sum+(e.hp>0?e.burn:0),0):s.enemyBurn}
function detonateEnemyBurn(faces){const selected=s.targetIndex;let cursor=0,selectedHit={hp:0,shield:0};for(const index of aliveEnemies()){withEnemy(index,()=>{const count=s.enemyBurn;if(!count)return;const amount=faces.slice(cursor,cursor+count).reduce((a,b)=>a+b,0);cursor+=count;const hit=damageEnemyMagic(amount);s.enemyBurn=0;if(index===selected)selectedHit=hit;else showEnemyDamage(hit.hp,0,hit.shield)})}return selectedHit}
function selectEnemy(index){if(s.busy||s.over||s.turn!=='player'||!s.enemies[index]||s.enemies[index].hp<=0)return;s.targetIndex=index;render();setDialog('向导',`当前攻击目标：${currentEnemyName()}。`,'点击敌方立绘切换目标')}
const rawRender=render;
render=function(){rawRender();renderEnemyRoster();if(typeof tutorial!=='undefined')paintTutorial()};
function renderEnemyRoster(){
 if(!s.enemies)return;const dual=s.battleMode==='puppet'&&s.enemies.length===2;
 document.getElementById('game').classList.toggle('dual-puppets',dual);
 document.getElementById('enemy-second').hidden=!dual;
 s.enemies.forEach((enemy,index)=>withEnemy(index,()=>{
  const node=$('enemy');node.classList.toggle('enemy-selected',s.targetIndex===selectedEnemyIndex());node.classList.toggle('enemy-defeated',enemy.hp<=0);node.style.opacity=enemy.hp<=0?'.32':'1';
  if(s.battleMode==='puppet'){$('enemyName').textContent=dual?`木偶 ${index+1}`:'木偶';$('enemySub').textContent=dual?'训练用 · 每回合两枚骰子':'训练用 · 可调属性';$('enemyPortrait').src='assets/puppet.png';$('puppet').classList.remove('boss-art');node.classList.remove('boss-enemy')}
  $('enemyHp').textContent=`${format(enemy.hp)} / ${battleStats().enemyMax} HP`;$('enemyBar').style.width=`${Math.max(0,enemy.hp/battleStats().enemyMax*100)}%`;
  $('shieldBar').style.width=`${Math.min(100,enemy.physical/Math.max(1,battleStats().shield)*100)}%`;$('shieldLabel').textContent=`物理护盾 ${format(enemy.physical)} / ${battleStats().shield}`;
  $('magicShieldBar').style.width=`${Math.min(100,enemy.magic/Math.max(1,battleStats().magicShield)*100)}%`;$('magicShieldLabel').textContent=`法术护盾 ${format(enemy.magic)} / ${battleStats().magicShield}`;
  $('markTag').classList.toggle('on',enemy.marked);$('burnStatus').classList.toggle('on',enemy.burn>0);$('burnStack').innerHTML=Array.from({length:enemy.burn},()=>'<img src="assets/burn-flame.png" alt="燃烧">').join('');
 }));
 document.querySelectorAll('.enemy-wrap').forEach((node,index)=>node.classList.toggle('enemy-selected',index===s.targetIndex));
 const countSetting=document.getElementById('puppetCountSetting');if(countSetting)countSetting.hidden=s.battleMode!=='puppet';const toggle=document.getElementById('puppetCountToggle');if(toggle)toggle.textContent=cfg.puppetCount===2?'切换为一只木偶':'切换为两只木偶';
}
function selectedEnemyIndex(){return s.targetIndex}
const rawResetBattle=resetBattle;
resetBattle=function(mode='puppet',phase=1){rawResetBattle(mode,phase);bindEnemyRoster();render()};
const rawCurrentEnemyName=currentEnemyName;
currentEnemyName=function(){return s.battleMode==='boss'?(s.enemies?.[s.targetIndex]?.name||'巨龙'):s.enemies?.length===2?`木偶 ${s.targetIndex+1}`:rawCurrentEnemyName()};
const rawApplySettings=applySettings;
applySettings=function(){cfg.puppetCount=Number(document.getElementById('puppetCount').value)===1?1:2;stopTutorial();rawApplySettings()};
const rawSelectChapter=selectChapter;
selectChapter=function(mode){stopTutorial();rawSelectChapter(mode)};
const rawCheckEnd=checkEnd;
checkEnd=function(){
 if(s.enemies&&s.enemy<=0&&aliveEnemies().length){s.targetIndex=aliveEnemies()[0];render()}
 if(s.battleMode==='puppet'&&s.enemies&&!aliveEnemies().length){s.over=true;s.busy=true;render();startTutorialBoss();return true}
 return rawCheckEnd();
};
const rawEnemyActionDice=enemyActionDice;
enemyActionDice=function(){return s.battleMode==='puppet'&&s.enemies?.length===2?(s.enemyRoundDice??aliveEnemies().length*2):rawEnemyActionDice()};
function availableEnemyAp(){return s.battleMode==='puppet'&&s.enemies?.length===2?Math.min(s.enemyAp,s.puppetBudgets?.[s.targetIndex]??2):s.enemyAp}
const rawStartEnemyTurn=startEnemyTurn;
startEnemyTurn=function(){if(s.enemies&&s.battleMode==='puppet'){s.puppetBudgets=s.enemies.map(e=>e.hp>0?(s.enemies.length===2?2:4):0);s.enemyRoundDice=s.puppetBudgets.reduce((a,b)=>a+b,0)}rawStartEnemyTurn()};
const rawEnemyAct=enemyAct;
enemyAct=function(){
 if(s.battleMode==='puppet'&&s.enemies){const next=s.puppetBudgets?.findIndex((budget,i)=>budget>0&&s.enemies[i].hp>0)??-1;if(next<0){s.enemyAp=0;resolveEnemyBurnTick();return}s.targetIndex=next;render()}
 rawEnemyAct();
};
const rawResolveEnemyMove=resolveEnemyMove;
resolveEnemyMove=function(move,...args){if(s.battleMode==='puppet'&&s.puppetBudgets)s.puppetBudgets[s.targetIndex]=Math.max(0,s.puppetBudgets[s.targetIndex]-(move==='heavy'?2:1));rawResolveEnemyMove(move,...args)};
const rawBeginPlayerTurn=beginPlayerTurn;
beginPlayerTurn=function(){if(s.enemies?.length&&s.enemy<=0)s.targetIndex=aliveEnemies()[0]??0;rawBeginPlayerTurn()};
// End-of-turn burns belong to each enemy and each gets one D4, regardless of layers.
const rawEnemyBurnTick=resolveEnemyBurnTick;
resolveEnemyBurnTick=function(){
 if(!s.enemies||s.enemies.length===1){rawEnemyBurnTick();return}
 const targets=aliveEnemies().filter(i=>s.enemies[i].burn>0),previous=s.targetIndex;
 function next(){if(s.over)return;const index=targets.shift();if(index===undefined){s.targetIndex=s.enemies[previous]?.hp>0?previous:(aliveEnemies()[0]??0);s.busy=false;render();beginPlayerTurn();return} s.targetIndex=index;if(s.enemyBurn<=0){next();return}s.busy=true;rollD4Batch(1,`${currentEnemyName()} · 燃烧D4`,faces=>{const hit=damageEnemyMagic(faces[0]);s.enemyBurn=Math.max(0,s.enemyBurn-1);const healed=hasPartySkill('maple')?healParty((hit.hp+hit.shield)*2,'maple'):null;showEnemyDamage(hit.hp,0,hit.shield);render();setDialog('红狐',`${currentEnemyName()} 燃烧造成 ${faces[0]} 点法术伤害，剩余 ${s.enemyBurn} 回合。${healed?`黑猫恢复 ${format(healed.cat)}，白鸟恢复 ${format(healed.bird)}。`:''}`,'敌方回合结束');if(checkEnd())return;setTimeout(next,600)})}next();
};

// Create an independent second enemy view; existing combat rendering routes through $.
const firstEnemy=document.getElementById('enemy'),secondEnemy=firstEnemy.cloneNode(true);
secondEnemy.id='enemy-second';secondEnemy.hidden=true;secondEnemy.classList.remove('boss-enemy');
secondEnemy.querySelectorAll('[id]').forEach(node=>node.id+='-second');firstEnemy.after(secondEnemy);
[firstEnemy,secondEnemy].forEach((node,index)=>{node.addEventListener('click',()=>selectEnemy(index));node.setAttribute('role','button');node.tabIndex=0;node.setAttribute('aria-label',`选择木偶 ${index+1} 为目标`);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectEnemy(index)}})});
const countField=document.createElement('div');countField.className='setting';countField.id='puppetCountSetting';countField.innerHTML='<label for="puppetCount">木偶数量</label><select id="puppetCount"><option value="1">一只木偶</option><option value="2" selected>两只木偶</option></select>';document.querySelector('.settingsbox').prepend(countField);
const countToggle=document.createElement('button');countToggle.type='button';countToggle.id='puppetCountToggle';countToggle.textContent='切换为一只木偶';countToggle.onclick=()=>{document.getElementById('puppetCount').value=cfg.puppetCount===2?'1':'2';applySettings()};countField.appendChild(countToggle);
const replayButton=document.createElement('button');replayButton.type='button';replayButton.textContent='重新体验新手教程';replayButton.onclick=()=>{unlockDebugControls();toggleChapterMenu(false);startTutorial()};document.querySelector('.chapter-card').append(replayButton);

const tutorial={active:false,index:0,furthestIndex:0,waiting:false,offerStarted:false,transitioning:false,skipPressCount:0,lastSkipSpeaker:null};
const tutorialSteps=[
 ['汐霂','欢迎来玩我们的游戏！接下来我和岧姐姐会给大家进行一个简单的新手教程！来岧姐姐跟大家说两句～',''],
 ['岧峣','…额…大家好…请支持我们黑猫与白鸟…',''],
 ['汐霂','哎呀不要这个时候说这种话啦。算了我们还是先教大家怎么玩吧。',''],
 ['汐霂','左边是我们的主角团，点击角色立绘就能切换角色啦。','party'],
 ['汐霂','右侧则是我们要打败的敌人，也是点击立绘就可以切换攻击目标。','enemies'],
 ['岧峣','…这里是技能，每个角色有四个，后面会学到新的技能的…','skills'],
 ['汐霂','把鼠标悬停在技能上，就能查看技能描述。单击鼠标，试试使出“轻击”吧！','light','skill:light'],
 ['岧峣','…消耗了一点行动力，掷出了一枚骰子。一枚骰子就相当于是一点行动吧。','ap'],
 ['汐霂','是的！大家可以在技能框的右侧看到这个技能消耗多少的行动力。','skills'],
 ['岧峣','现在换个角色试试。','bird','hero:bird'],
 ['岧峣','这是一个给下一次攻击附加伤害的技能。需要注意的是，这类技能的附加伤害只有“轻击”和“重击”才能结算，其他的…哦，我是不是说多了…','enchant'],
 ['汐霂','没事啦，马上我们也会讲到。现在先使用一次“附魔”试试。','enchant','skill:enchant'],
 ['汐霂','现在我们给下一次攻击额外附加了法术伤害！','enchant'],
 ['岧峣','换回黑猫来进行攻击。','cat','hero:cat'],
 ['汐霂','这次来试试重击！这个技能能同时对敌方的物理护盾和血量！如果附魔，还能攻击法术护盾！','heavy','skill:heavy'],
 ['岧峣','我方行动力耗尽了，进入敌方回合…','ap'],
 ['汐霂','等一下！我们使用了足够多的骰子，英杰们回应了我们的祈愿！','ember'],
 ['岧峣','选择一个技能放到空技能槽，或者替换原有技能吧。要注意，被动技能也需要放置在槽位中才能生效。','offer'],
 ['汐霂','这里的英杰技能则是刚刚提到过无法被附魔附加伤害的攻击，使用时记得注意这一点哦！','offer','boon'],
 ['岧峣','选一名角色来放置英杰技能吧，两名角色一共可以携带八个技能。如果选错了技能，也可以返回刚刚的界面。','equip'],
 ['汐霂','值得注意的是，黑猫和白鸟初始携带的四个技能如果被替换后则无法再获得哦，取舍时请再三考虑。另外，四个初始技能在满足条件后还能“嬗变”得到强化哦，嬗变到三级更是会解锁独特的效果，有可能会成为意想不到的助力哦~','equip','install'],
 ['岧峣','可以看到，由于一名英杰的技能被加入了技能槽，我们也获得了这名英杰的天赋和特殊机制的加护。','badge'],
 ['汐霂','现在来结合这些新技能，一鼓作气消灭敌人吧！',''],
 ['岧峣','额…我怎么记得，这好像还和思政有点关系来着…',''],
 ['汐霂','哦！那是当然，每个我方回合开始时，都会给你一道思政相关的选择题，答对了则将本回合的骰子升级为十面骰。不过答错了也没关系，还是正常的六面骰。',''],
 ['岧峣','…啊？',''],
 ['汐霂','当然，每个敌方回合开始时，也会出现一道选择题，要是在30秒内答对，则将敌方本回合的骰子变为六面骰；没答出来或是答错了，就要吃十面骰了哦～',''],
 ['岧峣','…根本没有这样的思政游戏…',''],
 ['汐霂','结合新技能消灭所有木偶吧！','free','victory'],
 ['汐霂','接下来就是boss关了…一定要加油啊！',''],
 ['岧峣','…等等我们不是刚打完一关吗？',''],
 ['汐霂','…因为产能只能做到这里了啊哈哈……','']
];
const tutorialBlackout=document.createElement('div');tutorialBlackout.id='tutorialBlackout';tutorialBlackout.hidden=true;tutorialBlackout.setAttribute('aria-hidden','true');document.body.append(tutorialBlackout);
const tutorialHost=document.createElement('div');tutorialHost.id='tutorialHost';tutorialHost.innerHTML='<svg id="tutorialShade" aria-hidden="true"><defs><mask id="tutorialMask" maskUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="white"/><g id="tutorialHoles"></g></mask></defs><rect id="tutorialDimSurface" width="100%" height="100%" fill="#03050b" mask="url(#tutorialMask)"/><g id="tutorialOutlines"></g></svg><section id="tutorialBubble" role="dialog" aria-label="新手教程" aria-live="polite"><div class="tutorial-portrait"><span id="tutorialAvatarFallback"></span><img id="tutorialAvatar" alt=""></div><div class="tutorial-copy"><div class="tutorial-heading"><b id="tutorialSpeaker"></b><span id="tutorialProgress"></span></div><p id="tutorialText"></p><small id="tutorialNote"></small><div class="tutorial-actions"><div class="tutorial-history"><button type="button" id="tutorialSkip">跳过教程</button><button type="button" id="tutorialBack">◂ 上一步</button></div><div class="tutorial-forward"><span id="tutorialActionHint"></span><button type="button" id="tutorialNext">继续 ▸</button></div></div></div></section>';document.body.append(tutorialHost);
document.getElementById('tutorialAvatar').onerror=function(){this.hidden=true};
document.getElementById('tutorialNext').onclick=()=>tutorial.skipPrompt?confirmTutorialSkip():nextTutorial();
document.getElementById('tutorialSkip').onclick=()=>tutorial.skipPrompt?cancelTutorialSkip():requestTutorialSkip();
document.getElementById('tutorialBack').onclick=previousTutorial;
function tutorialScripted(){return tutorial.active&&tutorial.index!==28}
function tutorialReviewing(){return tutorial.active&&tutorial.index<(tutorial.furthestIndex||0)}
function canGoBackTutorial(){return tutorialScripted()&&!tutorial.waiting&&!tutorial.skipPrompt&&!tutorial.fading&&!tutorial.transitioning&&(!s.busy||tutorial.index>=29)&&tutorial.index>(tutorial.index>=29?29:0)}
function previousTutorial(){
 if(!canGoBackTutorial())return;
 tutorial.furthestIndex=Math.max(tutorial.furthestIndex||0,tutorial.index);tutorial.index--;tutorial.layoutKey='';hideSkillTooltip();paintTutorial();
}
function stopTutorial(){clearTimeout(tutorial.fadeTimer);tutorial.active=false;tutorial.waiting=false;tutorial.fading=false;tutorial.skipPrompt=null;tutorial.pendingEvent=null;tutorial.transitioning=false;tutorialBlackout.hidden=true;tutorialBlackout.classList.remove('tutorial-blackout-fading');tutorialHost.classList.remove('tutorial-fading');paintTutorial()}
const tutorialSkipLines={
 '汐霂':['真的不看看新手教程吗？很快很简单的......','不看新手教程就玩的话很可能、很可能会完全看不懂的...!'],
 '岧峣':['...不看新手教程，不会玩可别找我...','到时候看不懂机制被打败了可别哭哦。']
};
const tutorialSkipEasterEggs={
 '汐霂':'欧内该，如果能看完新手教程的话，瓦达西...',
 '岧峣':'真的要跳过吗...你这家伙...真是满脑子都只想着自己呢...'
};
function pickTutorialSkipLine(pressCount,lastSpeaker,random=Math.random){
 const ximoChance=lastSpeaker==='汐霂'?.25:lastSpeaker==='岧峣'?.75:.5;
 const speaker=random()<ximoChance?'汐霂':'岧峣';
 const easterEgg=pressCount>5&&random()<.15;
 const text=easterEgg?tutorialSkipEasterEggs[speaker]:tutorialSkipLines[speaker][Math.min(1,Math.floor(random()*2))];
 return[speaker,text];
}
function requestTutorialSkip(){
 if(!tutorial.active||tutorial.fading||tutorial.skipPrompt)return;
 const r=document.getElementById('tutorialSkip').getBoundingClientRect();tutorial.skipAnchor={left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
 tutorial.skipPressCount++;tutorial.skipPrompt=pickTutorialSkipLine(tutorial.skipPressCount,tutorial.lastSkipSpeaker);tutorial.lastSkipSpeaker=tutorial.skipPrompt[0];
 tutorial.layoutKey='';hideSkillTooltip();paintTutorial();
}
function cancelTutorialSkip(){const pending=tutorial.pendingEvent;tutorial.skipPrompt=null;tutorial.pendingEvent=null;tutorial.layoutKey='';paintTutorial();if(pending)tutorialEvent(pending)}
function confirmTutorialSkip(){
 if(!tutorial.skipPrompt)return;const inBoss=tutorial.index>=29;
 fadeTutorialIntoGame(()=>{stopTutorial();if(inBoss)s.busy=false;render();if(!inBoss&&!s.busy&&!s.emberPhase&&!s.equipSkill)continueAfterEmber()});
}
function fadeTutorialIntoGame(done){
 if(tutorial.fading)return;tutorial.fading=true;hideSkillTooltip();tutorialHost.hidden=false;tutorialHost.classList.add('tutorial-fading');if(!tutorialBlackout.hidden)tutorialBlackout.classList.add('tutorial-blackout-fading');
 tutorial.fadeTimer=setTimeout(()=>{tutorial.fading=false;tutorialHost.hidden=true;tutorialBlackout.hidden=true;tutorialBlackout.classList.remove('tutorial-blackout-fading');tutorialHost.classList.remove('tutorial-fading');paintTutorial();done?.()},480);
}
function startTutorial(){stopTutorial();tutorial.layoutKey='';cfg.puppetCount=Number(document.getElementById('puppetCount').value)||2;resetBattle('puppet');tutorial.active=true;tutorial.index=0;tutorial.furthestIndex=0;tutorial.offerStarted=false;paintTutorial()}
function nextTutorial(){
 if(!tutorial.active||tutorial.waiting||tutorial.skipPrompt||tutorial.fading)return;const step=tutorialSteps[tutorial.index];
 if(tutorialReviewing()){tutorial.index++;tutorial.layoutKey='';paintTutorial();return}
 if(step[3])return;
 if(tutorial.index===31){fadeTutorialIntoGame(()=>{stopTutorial();s.busy=false;render()});return}
 tutorial.index++;enterTutorialStep();
}
function enterTutorialStep(){
 tutorial.furthestIndex=Math.max(tutorial.furthestIndex||0,tutorial.index);
 if(tutorial.index===6){s.selected='cat';render()}
 if(tutorial.index===17&&!tutorial.offerStarted){tutorial.offerStarted=true;tutorial.waiting=true;paintTutorial();rawBeginEmberRoll();return}
 if(tutorial.index===28){fadeTutorialIntoGame(()=>continueAfterEmber());return}
 paintTutorial();
}
function tutorialEvent(event){if(tutorial.skipPrompt){tutorial.pendingEvent=event;return}if(!tutorial.active||tutorial.waiting||tutorial.fading||tutorialReviewing())return;if(tutorialSteps[tutorial.index]?.[3]===event){tutorial.index++;enterTutorialStep()}}
function tutorialSkillResolved(id){tutorialEvent('skill:'+id)}
function tutorialFocusNodes(){
 if(!tutorialScripted()||tutorial.skipPrompt)return[];const focus=tutorialSteps[tutorial.index][2],all=selector=>[...document.querySelectorAll(selector)].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height),art=selector=>all(selector+' .hero-art');
 if(focus==='party')return art('.hero');if(focus==='bird'||focus==='cat')return art('#hero-'+focus);
 if(focus==='enemies')return all('.enemy-wrap:not([hidden]) .puppet');
 if(focus==='skills')return all('#skillButtons > *');
 if(['light','enchant','heavy'].includes(focus))return all(`[data-skill-id="${focus}"]`).concat(all('#skillTooltipGlobal.show'),s.busy?all('#diceWrap.show'):[]);
 if(focus==='ap')return all('#ap');if(focus==='ember')return all('#emberMeter');
 if(focus==='offer')return all('#emberSkills .ember-choice');
 if(focus==='equip')return art('.hero').concat(all('#skillButtons > *'));
 if(focus==='badge')return all('.acquired-hero.unlocked:not(.inactive)');return[];
}
function paintTutorial(){
 if(!document.getElementById('tutorialBubble')||tutorial.fading||tutorial.transitioning)return;const show=tutorialScripted()&&!tutorial.waiting;
 tutorialHost.hidden=!show;document.body.classList.toggle('tutorial-running',show);if(!show)return;
 tutorial.furthestIndex=Math.max(tutorial.furthestIndex||0,tutorial.index);
 const back=document.getElementById('tutorialBack');back.hidden=!!tutorial.skipPrompt;back.disabled=!canGoBackTutorial();
 const [speaker,text,focus,event]=tutorial.skipPrompt?[...tutorial.skipPrompt,'',null]:tutorialSteps[tutorial.index];document.getElementById('tutorialBubble').classList.toggle('skill-lesson',!tutorial.skipPrompt&&['skills','light','enchant','heavy'].includes(focus));document.getElementById('tutorialSpeaker').textContent=speaker;document.getElementById('tutorialText').textContent=text;document.getElementById('tutorialProgress').textContent=`${tutorial.index>=29?tutorial.index-28:tutorial.index+1} / ${tutorial.index>=29?3:28}`;
 const avatar=document.getElementById('tutorialAvatar'),file=speaker==='汐霂'?'assets/ximo-avatar.png':'assets/tiaoyao-avatar.png';if(avatar.getAttribute('src')!==file){avatar.hidden=false;avatar.src=file;avatar.alt=speaker+'的头像'}document.getElementById('tutorialAvatarFallback').textContent=speaker;
 document.getElementById('tutorialNote').textContent='';
 document.getElementById('tutorialNext').textContent=tutorial.skipPrompt?'确认跳过':'继续 ▸';document.getElementById('tutorialSkip').textContent=tutorial.skipPrompt?'继续教程':'跳过教程';document.getElementById('tutorialNext').hidden=!!event&&!tutorialReviewing();document.getElementById('tutorialActionHint').textContent=event?(event.startsWith('skill:')?'请点击高亮技能':event.startsWith('hero:')?'请点击高亮角色':event==='boon'?'请选择一个英杰技能':'选择角色并点击技能槽'):'单击继续';
 if(tutorialReviewing()&&!tutorial.skipPrompt)document.getElementById('tutorialActionHint').textContent='回看 · 单击继续';
 if(tutorial.skipPrompt){document.getElementById('tutorialProgress').textContent='确认跳过';document.getElementById('tutorialActionHint').textContent='也可以继续教程'}
 if(activeSkillTooltip&&!tutorialAllowsSkillTooltip(activeSkillTooltip))hideSkillTooltip();
 const nodes=tutorialFocusNodes(),spots=nodes.map(node=>tutorialSpotlight(node.getBoundingClientRect(),node.classList.contains('hero-art')||node.classList.contains('puppet')?'portrait':'box'));
 document.getElementById('tutorialHoles').innerHTML=spots.map(spot=>spot.shape('black')).join('');
 document.getElementById('tutorialOutlines').innerHTML=spots.filter((spot,index)=>nodes[index].id!=='skillTooltipGlobal').map(spot=>spot.shape('none','white')).join('');
 document.getElementById('tutorialDimSurface').style.opacity=spots.length?'.88':'1';document.getElementById('tutorialDimSurface').setAttribute('fill','#000');
 const anchors=spots.filter((spot,index)=>!['skillTooltipGlobal','diceWrap'].includes(nodes[index].id));
 const reserved=anticipatedSkillTooltipRects(nodes,focus);fitTutorialLessonWidth(reserved,focus);const protectedDice=['light','enchant','heavy'].includes(focus)?[tutorialDiceReservation()]:[];positionTutorialBubble([...anchors.map(spot=>spot.bounds),...reserved,...protectedDice],focus);
}
function tutorialSpotlight(rect,style='box'){
 const padding=style==='portrait'?6:4,left=rect.left-padding,top=rect.top-padding,width=rect.width+padding*2,height=rect.height+padding*2,right=left+width,bottom=top+height,corner=4;
 const path=`M ${left+corner} ${top} H ${right-corner} V ${top+corner} H ${right} V ${bottom-corner} H ${right-corner} V ${bottom} H ${left+corner} V ${bottom-corner} H ${left} V ${top+corner} H ${left+corner} Z`;
 return{bounds:{left,top,right,bottom,width,height},shape:(fill,stroke='none')=>`<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="miter" shape-rendering="crispEdges"/>`};
}
function skillTooltipAboveRect(anchor,width,height,viewportWidth){
 const left=Math.max(12,Math.min(viewportWidth-width-12,anchor.left+anchor.width/2-width/2)),top=Math.max(12,anchor.top-height-8);
 return{left,top,right:left+width,bottom:top+height,width,height};
}
function anticipatedSkillTooltipRects(nodes,focus){
 if(!['skills','light','enchant','heavy'].includes(focus))return[];
 // Reserve the maximum tooltip height up front. Hovering cannot push it into the teaching dialogue.
 return nodes.filter(node=>node.dataset.skillId&&(focus==='skills'||node.dataset.skillId===focus)).map(node=>{
  const r=node.getBoundingClientRect(),width=Math.min(480,innerWidth>=701?innerWidth/2-36:innerWidth-28),height=Math.max(0,Math.min(innerHeight*.44,420,r.top-20));
  return skillTooltipAboveRect(r,width,height,innerWidth);
 });
}
function fitTutorialLessonWidth(reserved,focus){
 const bubble=document.getElementById('tutorialBubble');
 if(!tutorial.skipPrompt&&innerWidth>=701&&['skills','light','enchant','heavy'].includes(focus)&&reserved.length){
  const room=Math.min(...reserved.map(r=>r.left))-56;
  const width=Math.max(240,Math.min(740,innerWidth/2-96,room));bubble.style.width=width+'px';bubble.classList.toggle('narrow-lesson',width<440);
 }else{bubble.style.width='';bubble.classList.remove('narrow-lesson')}
}
function tutorialDiceReservation(){
 const wrap=document.getElementById('diceWrap'),r=wrap.getBoundingClientRect();
 if(wrap.classList.contains('show')&&r.width&&r.height)return{left:r.left-18,top:r.top-18,right:r.right+18,bottom:r.bottom+18};
 const centerX=innerWidth/2,centerY=innerHeight*(innerWidth<=700?.34:.39);
 return{left:centerX-140,top:centerY-90,right:centerX+140,bottom:centerY+115};
}
function chooseTeachingDialoguePosition(rects,width,height,viewportWidth,viewportHeight){
 const preferred=[32,Math.max(48,viewportHeight-height-18)],overlaps=(point)=>rects.some(r=>Math.min(point[0]+width,r.right)>Math.max(point[0],r.left)&&Math.min(point[1]+height,r.bottom)>Math.max(point[1],r.top));
 if(!overlaps(preferred))return preferred;
 return chooseTutorialPosition(rects,width,height,viewportWidth,viewportHeight);
}
function chooseTutorialPosition(rects,width,height,viewportWidth,viewportHeight){
 const margin=18,gap=20,clamp=(value,max)=>Math.max(margin,Math.min(max-margin,value));
 const candidates=[];
 for(const r of rects){const midX=(r.left+r.right)/2,midY=(r.top+r.bottom)/2;
  candidates.push([r.right+gap,midY-height/2],[r.left-width-gap,midY-height/2],[midX-width/2,r.bottom+gap],[midX-width/2,r.top-height-gap]);
 }
 candidates.push([(viewportWidth-width)/2,(viewportHeight-height)/2],[margin,viewportHeight-height-margin],[viewportWidth-width-margin,margin],[margin,margin],[viewportWidth-width-margin,viewportHeight-height-margin]);
 let best=candidates[0],bestScore=Infinity;
 for(const candidate of candidates){const x=clamp(candidate[0],viewportWidth-width),y=clamp(candidate[1],viewportHeight-height);
  const overlap=rects.reduce((sum,r)=>sum+Math.max(0,Math.min(x+width,r.right)-Math.max(x,r.left))*Math.max(0,Math.min(y+height,r.bottom)-Math.max(y,r.top)),0);
  const distance=rects.length?Math.min(...rects.map(r=>Math.hypot(Math.max(r.left-x-width,x-r.right,0),Math.max(r.top-y-height,y-r.bottom,0)))):0;
  const score=overlap*100000+distance+x*.001;
  if(score<bestScore){bestScore=score;best=[x,y]}
 }
 return best;
}
function positionTutorialBubble(rects,focus){
 const bubble=document.getElementById('tutorialBubble'),box=bubble.getBoundingClientRect();
 // Transient hover descriptions never participate in placement. Keep the position for this step.
 const key=[tutorial.index,tutorial.skipPrompt?.[0]||'',focus,['light','enchant','heavy'].includes(focus)?!!s.busy:false,innerWidth,innerHeight,box.width,box.height].join(':');
 if(tutorial.layoutKey===key)return;
 tutorial.layoutKey=key;
 let position;
 if(tutorial.skipPrompt&&tutorial.skipAnchor)position=chooseTutorialPosition([tutorial.skipAnchor],box.width,box.height,innerWidth,innerHeight);
 else if(!focus)position=[(innerWidth-box.width)/2,(innerHeight-box.height)/2];
 else if(['skills','light','enchant','heavy'].includes(focus))position=chooseTeachingDialoguePosition(rects,box.width,box.height,innerWidth,innerHeight);
 else position=chooseTutorialPosition(rects,box.width,box.height,innerWidth,innerHeight);
 const [left,top]=position;bubble.style.left=Math.max(32,left)+'px';bubble.style.top=Math.max(48,top)+'px';
}
// A capturing gate pauses unrelated actions while leaving the spotlight itself interactive.
document.addEventListener('click',event=>{
 if(event.target.closest('#tutorialBubble'))return;
 if(tutorial.fading||tutorial.skipPrompt||tutorial.transitioning){event.preventDefault();event.stopImmediatePropagation();return}
 if(!tutorialScripted())return;
 if(tutorial.waiting){event.preventDefault();event.stopImmediatePropagation();return}
 if(tutorialReviewing()){event.preventDefault();event.stopImmediatePropagation();nextTutorial();return}
 const step=tutorialSteps[tutorial.index],expected=step[3],target=event.target;
 let allow=false;
 if(expected?.startsWith('skill:'))allow=!!target.closest(`[data-skill-id="${expected.split(':')[1]}"]`);
 if(expected?.startsWith('hero:'))allow=!!target.closest('#hero-'+expected.split(':')[1]);
 if(expected==='boon')allow=!!target.closest('.ember-choice');
 if(step[2]==='equip')allow=!!target.closest(tutorial.index===20?'.hero,.equip-target,.boon-return-btn':'.hero,.boon-return-btn');
 if(step[2]==='party')allow=!!target.closest('.hero');if(step[2]==='enemies')allow=!!target.closest('.enemy-wrap');
 if(!allow){event.preventDefault();event.stopImmediatePropagation();if(!expected&&!s.busy)nextTutorial()}
},true);
document.addEventListener('keydown',event=>{if(!tutorialScripted()||tutorial.fading)return;if(event.key==='Escape'){event.preventDefault();document.getElementById('tutorialSkip').click()}else if((event.key===' '||event.key==='Enter')&&!tutorialSteps[tutorial.index][3]&&!event.target.closest('button')){event.preventDefault();nextTutorial()}});
window.addEventListener('resize',paintTutorial);document.addEventListener('pointermove',()=>{if(tutorialScripted())requestAnimationFrame(paintTutorial)},{passive:true});
setInterval(()=>{if(tutorialScripted())paintTutorial()},120);
function tutorialAllowsSkillTooltip(button){
 if(s.emberPhase||s.equipSkill||document.getElementById('emberOverlay').classList.contains('show')||document.getElementById('bossRetryOverlay')?.hidden===false)return false;
 if(tutorial.skipPrompt||tutorial.fading||tutorial.transitioning||document.getElementById('phaseTransition').classList.contains('active'))return false;
 if(!tutorialScripted())return true;
 if(tutorial.waiting||s.busy||!button?.dataset.skillId)return false;
 const focus=tutorialSteps[tutorial.index][2];
 return focus==='skills'||(['light','enchant','heavy'].includes(focus)&&button.dataset.skillId===focus);
}
const rawShowSkillTooltip=showSkillTooltip;
showSkillTooltip=function(button){if(!tutorialAllowsSkillTooltip(button)){hideSkillTooltip();return}rawShowSkillTooltip(button);if(button?.dataset.skillId&&isInitialSkill(button.dataset.skillId)&&activeSkillTooltip===button)document.getElementById('skillTooltipGlobal').innerHTML=evolutionTooltipMarkup(button.dataset.skillDesc);if(activeSkillTooltip===button&&button)requestAnimationFrame(()=>placeSkillTooltipAbove(button))};
function placeSkillTooltipAbove(button){
 if(activeSkillTooltip!==button||!tutorialAllowsSkillTooltip(button)){hideSkillTooltip();return}
 const tip=document.getElementById('skillTooltipGlobal'),anchor=button.getBoundingClientRect();
 tip.style.maxHeight=Math.max(24,Math.min(innerHeight*.44,420,anchor.top-20))+'px';
 const size=tip.getBoundingClientRect(),position=skillTooltipAboveRect(anchor,size.width,size.height,innerWidth);
 tip.style.left=position.left+'px';tip.style.top=position.top+'px';
 // Tooltip position is authoritative. Only the teaching dialogue can move to resolve a collision.
 if(tutorialScripted()&&!tutorial.skipPrompt){
  const bubble=document.getElementById('tutorialBubble'),r=bubble.getBoundingClientRect();
  if(position.left<r.right+10&&position.right>r.left-24&&position.top<r.bottom+10&&position.bottom>r.top-42){
   tutorial.layoutKey='';const nodes=tutorialFocusNodes().filter(node=>!['skillTooltipGlobal','diceWrap'].includes(node.id));
   positionTutorialBubble([...nodes.map(node=>tutorialSpotlight(node.getBoundingClientRect(),'box').bounds),{left:position.left-12,top:position.top-12,right:position.right+12,bottom:position.bottom+12},tutorialDiceReservation()],tutorialSteps[tutorial.index][2]);
  }
 }
}
const rawSelectHero=selectHero;
selectHero=function(who){if(tutorialReviewing())return;rawSelectHero(who);if(s.selected===who&&!s.busy)tutorialEvent('hero:'+who)};
const rawUseSkill=useSkill;
useSkill=function(id,owner=s.selected){if(tutorialReviewing())return;if(tutorialScripted()&&tutorialSteps[tutorial.index][3]!=='skill:'+id)return;rawUseSkill(id,owner)};
const rawBeginEmberRoll=beginEmberRoll;
beginEmberRoll=function(){if(tutorialScripted()&&tutorial.index<17)return;rawBeginEmberRoll()};
const rawShowBoonOffer=showBoonOffer;
showBoonOffer=function(kind){hideSkillTooltip();rawShowBoonOffer(kind);if(tutorial.active&&tutorial.index===17){tutorial.waiting=false;paintTutorial()}};
const rawSelectBoonSkill=selectBoonSkill;
selectBoonSkill=function(kind,id){rawSelectBoonSkill(kind,id);tutorialEvent('boon')};
const rawReturnToBoonOffer=returnToBoonOffer;
returnToBoonOffer=function(){rawReturnToBoonOffer();if(tutorial.active&&[19,20].includes(tutorial.index)){tutorial.index=18;tutorial.furthestIndex=18;tutorial.layoutKey='';paintTutorial()}};
const rawInstallEquippedSkill=installEquippedSkill;
installEquippedSkill=function(index){const had=!!s.equipSkill;rawInstallEquippedSkill(index);if(!talentActive('tanuki'))s.enemies.forEach(e=>e.marked=false);if(!talentActive('fox'))s.enemies.forEach(e=>e.burn=0);if(had&&!s.equipSkill){if(tutorial.active&&tutorial.index===19)tutorial.index=20;tutorialEvent('install')}};
const rawContinueAfterEmber=continueAfterEmber;
continueAfterEmber=function(){if(tutorialScripted())return;rawContinueAfterEmber()};
const rawPassUnusedActionPoints=passUnusedActionPoints;
passUnusedActionPoints=function(){if(tutorialScripted())return false;return rawPassUnusedActionPoints()};
const rawBeginEnemyTurn=beginEnemyTurn;
beginEnemyTurn=function(){if(tutorialScripted())return;rawBeginEnemyTurn()};
function startTutorialBoss(){
 if(tutorial.transitioning)return;tutorial.transitioning=true;tutorialBlackout.hidden=false;tutorialBlackout.classList.remove('tutorial-blackout-fading');tutorialHost.hidden=true;document.getElementById('phaseTransition').classList.add('active');
 const savedLoadout={cat:[...loadout.cat],bird:[...loadout.bird]},saved={};for(const key of ['cat','bird','tanukiUnlocked','foxUnlocked','craneUnlocked','goldUnlocked','diceSpent','emberActivations','totalDamageDealt','catShield','catShieldMax','catMagicShield','catMagicShieldMax','birdShield','birdShieldMax','birdMagicShield','birdMagicShieldMax'])saved[key]=s[key];
 setTimeout(()=>{resetBattle('boss');Object.assign(s,saved);loadout.cat.splice(0,4,...savedLoadout.cat);loadout.bird.splice(0,4,...savedLoadout.bird);initializeBossParty();syncEmberReady();s.ap=maxActionPoints();if(typeof captureBossEntry==='function')captureBossEntry();s.busy=true;tutorial.active=true;tutorial.index=29;tutorial.furthestIndex=29;tutorial.skipPrompt=null;tutorial.layoutKey='';tutorial.waiting=false;tutorial.transitioning=false;render();paintTutorial()},1300);
}

// Every fresh page starts in training. The chapter menu can replay the introduction.
// Bootstrap runs after skill-evolution.js installs the battle hooks.
