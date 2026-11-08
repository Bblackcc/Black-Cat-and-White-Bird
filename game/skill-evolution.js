/* Initial-skill evolution. Progress persists across the training-to-Boss handoff. */
cfg.bossCatMax=120;cfg.bossBirdMax=100;
const initialEvolution={
 light:{thresholds:[200,400,800],metric:'damage',descriptions:[
  '轻击：投掷一枚骰子，造成相应点数的物理伤害',
  '轻击：投掷一枚骰子，造成相应点数的物理伤害，同时造成该点数一半的法术伤害',
  '轻击：投掷一枚骰子，造成相应点数x1.5的物理伤害，同时造成该点数的法术伤害',
  '轻击：投掷一枚骰子，造成相应点数x2的物理伤害，同时造成该点数x1.5的法术伤害。如果攻击时敌方身上存在标记，则将黑猫的全部物理护盾转化为物理伤害附加到本次攻击上（此次转化视作破盾，可触发金毛的“披靡”），攻击后将白鸟的物理护盾转移一半到黑猫身上。如果攻击时敌方身上存在燃烧，则本次攻击时将敌方身上的燃烧层数补充至上限（比如敌方原本存在两层燃烧，本次攻击后补充至上限五层燃烧）']},
 heavy:{thresholds:[300,600,1200],metric:'damage',descriptions:[
  '重击：投掷两枚骰子，将两枚骰子点数相加后除以二，分别对敌方物理护盾和血量造成这两部分伤害',
  '重击：投掷两枚骰子，将两枚骰子点数相加后除以二，分别对敌方物理护盾和血量造成这两部分伤害，同时再对敌方法术护盾造成一次同样的伤害',
  '重击：投掷两枚骰子，将两枚骰子点数相加，分别对敌方物理护盾和血量造成一次该伤害，同时再对敌方法术护盾造成一次该伤害一半的伤害',
  '重击：投掷两枚骰子，将两枚骰子点数相加，分别对敌方血量、物理护盾和法术护盾造成一次该伤害。如果攻击时敌方身上存在标记，则主动触发一次该标记，按照本次对敌方造成的伤害结算反击，并清除该标记（本次清除不会触发“煮雨”的补充标记）（若敌方标记为巨龙篡夺后的标记，则不触发反击，仅清除标记）如果攻击时敌方身上存在燃烧层数，则补充两层额外燃烧层数，可超出五层上限（比如在本次攻击时敌方已存在五层燃烧，再叠加两层，变为七层燃烧）']},
 enchant:{thresholds:[5,8,12],metric:'embers',descriptions:[
  '附魔：投掷一枚骰子，为下次攻击附加该点数x2的法术伤害',
  '附魔：投掷一枚骰子，为下次攻击附加该点数x2的法术伤害，同时投掷一枚不消耗行动力的骰子，附加该点数的物理伤害',
  '附魔：投掷一枚骰子，为下次攻击附加该点数x2.5的法术伤害，同时投掷一枚不消耗行动力的骰子，附加该点数x1.5的物理伤害',
  '附魔：投掷一枚骰子，为下次攻击附加该点数x3的法术伤害，同时投掷一枚不消耗行动力的骰子，附加该点数x2的物理伤害。如果下一次攻击已经附带了燃烧层数，则下次攻击燃烧层数附着到敌方身上后，立刻结算所有燃烧伤害，并视作敌方受到结算燃烧伤害（使“枫林晚”生效）']},
 heal:{thresholds:[7,10,15],metric:'embers',descriptions:[
  '恢复：投掷一枚骰子，选择一名角色恢复该点数的血量',
  '恢复：投掷一枚骰子，选择一名角色恢复该点数的血量，并使另一位角色恢复该点数一半的血量',
  '恢复：投掷一枚骰子，选择一名角色恢复该点数x1.5的血量，并使另一位角色恢复该点数的血量',
  '恢复：投掷一枚骰子，选择一名角色恢复该点数x2的血量，并使另一位角色恢复该点数x1.5的血量。如果本次回血超出血量上限，黑猫超出部分转化为下次攻击附加的物理伤害，白鸟超出部分转化为下次攻击附加的法术伤害。其他回血技能使用后超出上限的部分也按该规则转化伤害']}
};
function isInitialSkill(id){return Object.hasOwn(initialEvolution,id)}
function activatedEmbers(){return Math.max(0,(s.emberActivations||0)+(s.emberReady||0)-(s.evolutionEmberOffset||0))}
function evolutionLevel(id){const def=initialEvolution[id];if(!def)return 0;const progress=def.metric==='damage'?(s.totalDamageDealt||0):activatedEmbers();return def.thresholds.filter(value=>progress>=value).length}
function initialSkillDescription(id){const def=initialEvolution[id],level=evolutionLevel(id);let text=def.descriptions[level];if(level<3){const count=def.thresholds[level],progress=def.metric==='damage'?(s.totalDamageDealt||0):activatedEmbers();text+=`\n\n下一级嬗变（${['一级','二级','三级'][level]}）解锁条件：${def.metric==='damage'?`累计造成${count}点任意伤害`:`累计激活过${count}个灵魂余烬（放弃加护也计入）`}。当前进度 ${format(progress)} / ${count}。\n解锁后：${def.descriptions[level+1]}`}else text+='\n\n嬗变已达最高等级。';return text}
function evolutionDiamonds(id){const level=evolutionLevel(id);return level?`<span class="evolution-diamonds" aria-label="嬗变${level}级">${'◆'.repeat(level)}</span>`:''}
function evolutionTooltipMarkup(description){
 const escape=text=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const split=description.indexOf('\n解锁后：');
 if(split<0)return escape(description);
 return escape(description.slice(0,split))+`\n<span class="evolution-next-effect">${escape(description.slice(split+1))}</span>`;
}
function recordEvolutionDamage(state,key,previous,value){if(!state.over&&['enemy','shield','magicShield'].includes(key)&&Number.isFinite(previous)&&Number.isFinite(value)&&previous>value)state.totalDamageDealt=(state.totalDamageDealt||0)+previous-value}

const hpBeforeEvolution=maxHp;
maxHp=function(who){if(s.battleMode!=='boss')return hpBeforeEvolution(who);return(who==='cat'?cfg.bossCatMax:cfg.bossBirdMax)+(talentActive('fox')?20:0)+(talentActive('gold')?20:0)};
function initializeBossParty(){for(const who of ['cat','bird']){s[who]=maxHp(who);for(const type of ['physical','magic']){const key=shieldFor(who,type);s[key]=(s[key]||0)+5;s[key+'Max']=Math.max(s[key+'Max']||0,s[key])}}}
const resetBeforeEvolution=resetBattle;
resetBattle=function(mode='puppet',phase=1){resetBeforeEvolution(mode,phase);s.totalDamageDealt=0;s.enchantPhysical=0;s.enchantDetonate=false;s.overflowBonus={physical:0,magic:0};if(s.battleMode==='boss')initializeBossParty();syncChapterSettings();render()};
const syncBeforeEvolution=syncChapterSettings;
syncChapterSettings=function(){syncBeforeEvolution();if(s.battleMode==='boss'){$('catMax').value=cfg.bossCatMax;$('birdMax').value=cfg.bossBirdMax}};

function overflowHealingActive(){return hasPartySkill('heal')&&evolutionLevel('heal')===3}
function applyHealing(who,amount){const gain=Math.max(0,Math.min(amount,maxHp(who)-s[who])),overflow=Math.max(0,amount-gain);s[who]+=gain;if(overflowHealingActive()&&overflow>0){s.overflowBonus??={physical:0,magic:0};s.overflowBonus[who==='cat'?'physical':'magic']+=overflow}return{gain,overflow:overflowHealingActive()?overflow:0}}
healParty=function(amount){return{cat:applyHealing('cat',amount).gain,bird:applyHealing('bird',amount).gain}};
function consumeAttackBonuses(){const bonus={physical:(s.goldCharge?.physical||0)+(s.overflowBonus?.physical||0),magic:(s.goldCharge?.magic||0)+(s.overflowBonus?.magic||0)};s.goldCharge={physical:0,magic:0};s.overflowBonus={physical:0,magic:0};return bonus}
function evolutionHit(amount,type,damage){const hit=type==='physical'?damageEnemyPhysical(amount):damageEnemyMagic(amount);damage.hp+=hit.hp;damage[type]+=hit.shield;damage[type+'Total']=(damage[type+'Total']||0)+hit.hp+hit.shield;return hit}
function evolutionBodyHit(amount,damage){const hp=Math.min(s.enemy,Math.max(0,amount));s.enemy-=hp;damage.hp+=hp;damage.physicalTotal=(damage.physicalTotal||0)+hp}
function burstActiveMark(damage){
 const enemy=s.enemies[s.targetIndex],stolen=enemy.markStolen||enemy.markOwner==='dragon'||enemy.usurpedMark;
 s.marked=false;enemy.markStolen=false;enemy.usurpedMark=false;delete enemy.markOwner;
 if(stolen)return{damage:emptyDamage(),text:'巨龙篡夺的标记已清除，不触发反击。'};
 const response=emptyDamage();for(const type of ['physical','magic']){const base=damage[type+'Total']||0;if(base<=0)continue;evolutionHit(base*2,type,response);for(const who of ['cat','bird'])addPartyShield(who,base,type)}
 return{damage:response,text:`主动触发标记：以本次实际伤害 ${format((damage.physicalTotal||0)+(damage.magicTotal||0))} 为基数，结算双倍同类型反击与全队护盾；清除标记，不触发煮雨补标。`};
}
function resolveBasicAttack(id,d1,d2,level=evolutionLevel(id)){
 const damage=emptyDamage(),breaks=[],notes=[],sum=d1+(d2||0),marked=s.marked,burning=s.enemyBurn>0,burnAttached=s.pendingBurnLayers>0,burst=s.enchantDetonate&&burnAttached,bonus=consumeAttackBonuses();
 let converted=0;if(id==='light'&&level===3&&marked){converted=s.catShield;s.catShield=0;if(converted>0)breaks.push({type:'physical',attack:converted})}
 if(id==='light'){evolutionHit(d1*[1,1,1.5,2][level], 'physical',damage);evolutionHit(d1*[0,.5,1,1.5][level],'magic',damage)}
 else{const amount=level<2?sum/2:sum;evolutionHit(amount,'physical',damage);evolutionBodyHit(amount,damage);if(level>0)evolutionHit(level===3?sum:sum/2,'magic',damage)}
 evolutionHit(converted+bonus.physical+(s.enchantPhysical||0),'physical',damage);evolutionHit(bonus.magic+s.enchant,'magic',damage);s.enchant=0;s.enchantPhysical=0;s.enchantDetonate=false;
 const burn=applyPendingBurn();mergeDamage(damage,burn.damage);damage.magicTotal=(damage.magicTotal||0)+(burn.damage.hp||0)+(burn.damage.magic||0);if(burn.text)notes.push(burn.text);
 if(id==='light'&&level===3){if(marked){const moved=s.birdShield/2;s.birdShield-=moved;s.catShield+=moved;s.catShieldMax=Math.max(s.catShieldMax,s.catShield);notes.push(`转化黑猫物理护盾 ${format(converted)} 点，白鸟向黑猫转移 ${format(moved)} 点物理护盾。`)}if(burning){s.enemyBurn=Math.max(5,s.enemyBurn);notes.push('燃烧已补充至至少5层。')}}
 if(id==='heavy'&&level===3){if(burning){s.enemyBurn+=2;notes.push(`额外叠加2层燃烧，现为 ${s.enemyBurn} 层，可超过5层。`)}if(marked){const response=burstActiveMark(damage);mergeDamage(damage,response.damage);notes.push(response.text)}}
 return{damage,breaks,notes,burst:burst&&s.enemyBurn>0};
}
function evolutionPursuit(faces,damage){if(talentActive('crane'))for(const face of faces)mergeDamage(damage,applyCranePursuit(face))}
function detonateEvolvedEnchantment(result,done){
 if(!result.burst){done();return}const count=s.enemyBurn;
 rollD4Batch(count,'附魔嬗变 · 燃烧立即结算',faces=>{const total=faces.reduce((a,b)=>a+b,0),hit=damageEnemyMagic(total);s.enemyBurn=0;mergeDamage(result.damage,{hp:hit.hp,magic:hit.shield});evolutionPursuit(faces,result.damage);const healing=hasPartySkill('maple')?healParty((hit.hp+hit.shield)*2,'maple'):null;result.notes.push(`燃烧立即结算：${count} 枚D4为 ${faces.join('、')}，造成 ${total} 点法术伤害${healing?`；枫林晚恢复黑猫 ${format(healing.cat)}、白鸟 ${format(healing.bird)} 点生命`:''}。`);done()});
}
function rollFreeEnchantDie(firstFace,done){
 let ticks=0;$('dicePair').classList.add('double');$('dice').textContent=firstFace;$('dice2').classList.add('rolling');$('diceCaption').textContent='附魔嬗变 · 额外免费骰子…';
 diceTimer=setInterval(()=>{$('dice2').textContent=rollPartyDie();if(++ticks>=9){clearInterval(diceTimer);const face=rollPartyDie();$('dice2').textContent=face;$('dice2').classList.remove('rolling');$('diceCaption').textContent=`附魔骰 ${firstFace} · 免费骰 ${face}`;setTimeout(()=>done(face),350)}},85);
}
function completeInitialRoll(id,who,faces,result){
 const damage=result.damage;if(damage.hp||damage.physical||damage.magic){showEnemyDamage(damage.hp,damage.physical,damage.magic);$('puppet').classList.remove('hit');void $('puppet').offsetWidth;$('puppet').classList.add('hit')}
 s.busy=false;$('diceWrap').classList.remove('show');clearDragonDice();$('dice').classList.remove('d4','crane-roll','gold-roll');$('dice2').classList.remove('crane-roll','gold-roll');render();setDialog(who==='cat'?'黑猫':'白鸟',`掷出 ${faces.join('、')} 点。${result.notes.join(' ')}`,`行动力剩余 ${s.ap}/${maxActionPoints()}`);checkEnd();tutorialSkillResolved(id);if(s.over)return;if(s.emberReady>0)beginEmberRoll();else passUnusedActionPoints();
}
const finishBeforeEvolution=finishRoll;
finishRoll=function(id,who,d1,d2){
 if(!isInitialSkill(id)){finishBeforeEvolution(id,who,d1,d2);return}
 const level=evolutionLevel(id),faces=d2==null?[d1]:[d1,d2];$('dice').textContent=d1;$('dice').classList.remove('rolling');$('dice2').classList.remove('rolling');if(d2!=null)$('dice2').textContent=d2;$('diceCaption').textContent=`${skillDefs[id].name}${' ◆'.repeat(level)} · ${faces.join(' + ')}`;
 setTimeout(()=>{
  if(id==='light'||id==='heavy'){
   const result=resolveBasicAttack(id,d1,d2,level);result.notes.unshift(`${skillDefs[id].name}造成生命伤害 ${format(result.damage.hp)}、物理护盾伤害 ${format(result.damage.physical)}、法术护盾伤害 ${format(result.damage.magic)}。`);evolutionPursuit(faces,result.damage);detonateEvolvedEnchantment(result,()=>dealGoldenBreaks(result.breaks,0,[],notes=>{if(notes.length)result.notes.push(`披靡：${notes.join('；')}。`);completeInitialRoll(id,who,faces,result)}));
  }else if(id==='enchant'){
   const apply=free=>{s.enchant=d1*[2,2,2.5,3][level];s.enchantPhysical=free*[0,1,1.5,2][level];s.enchantDetonate=level===3;const used=level?[d1,free]:[d1],result={damage:emptyDamage(),notes:[`下一次轻击或重击附加 ${format(s.enchant)} 点法术伤害${level?`及 ${format(s.enchantPhysical)} 点物理伤害（额外骰子不消耗行动力）`:''}。`]};evolutionPursuit(used,result.damage);completeInitialRoll(id,who,used,result)};
   if(level)rollFreeEnchantDie(d1,apply);else apply(0);
  }else{
   const other=who==='cat'?'bird':'cat',primary=applyHealing(who,d1*[1,1,1.5,2][level]),secondary=applyHealing(other,d1*[0,.5,1,1.5][level]),result={damage:emptyDamage(),notes:[`${who==='cat'?'黑猫':'白鸟'}恢复 ${format(primary.gain)} 点生命，${other==='cat'?'黑猫':'白鸟'}恢复 ${format(secondary.gain)} 点生命。${primary.overflow+secondary.overflow?`溢出治疗 ${format(primary.overflow+secondary.overflow)} 点已储存为对应角色的下一次攻击附加伤害。`:''}`]};evolutionPursuit(faces,result.damage);completeInitialRoll(id,who,faces,result);
  }
 },720);
};

resetBattle('puppet');startTutorial();
