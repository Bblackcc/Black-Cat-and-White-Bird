/* A separate opaque layer keeps combat UI behind the finale. */
const bossEndingLines=[
 ['汐霂','...诶？诶！？你居然...你居然真的打败了巨龙？打完了...我做的游戏？'],
 ['岧峣','（赞许地鼓掌）'],
 ['汐霂','虽然说这只是个没什么深度的小游戏吧...但...但毕竟，能有人玩到最后，成功打败boss，我就已经...非常非常满足了...'],
 ['岧峣','（认同地点头）'],
 ['汐霂','啊...岧姐姐你也说两句啊...'],
 ['岧峣','...额...非常感谢您游玩我们的游戏...还请多多支持我们黑猫与白鸟...'],
 ['汐霂','别说这种很像广告的话...啊，不过说的也是...如果您对我们的故事感兴趣的话，请吃原作小说《黑猫与白鸟》，在本游戏的文件夹中附带了pdf文件，非常短的您可以现在就...'],
 ['岧峣','...谁刚才说的别说广告...'],
 ['汐霂','啊哈哈...不过还是再次感谢您完整游玩了本游戏，真的感激不尽（鞠躬）'],
 ['岧峣','感激不尽...'],
 ['汐霂','还有原作...岧姐姐你能帮我说两句话嘛...'],
 ['岧峣','唉...（扶额）你好，请支持我们黑猫与白鸟，拜托了。'],
 ['汐霂','好耶！那就，以上，拜拜喽~'],
 ['岧峣','...再见。']
];
const gameEnding={active:false,index:0,state:null,completed:false,exited:false};
const endingOverlay=document.createElement('div');endingOverlay.id='gameEndingOverlay';endingOverlay.hidden=true;
endingOverlay.innerHTML='<section id="endingBubble" role="dialog" aria-modal="true" aria-label="通关对话" tabindex="-1"><div class="tutorial-portrait"><img id="endingAvatar" alt=""></div><div class="tutorial-copy"><div class="tutorial-heading"><b id="endingSpeaker"></b><span id="endingProgress"></span></div><p id="endingText"></p><div class="tutorial-actions"><span>单击继续</span><button type="button" id="endingNext">继续 ▸</button></div></div></section><section id="endingResult" hidden><h2 id="endingResultTitle">感谢游玩《黑猫与白鸟》</h2><p id="endingResultText"></p><button type="button" id="endingMenu">打开菜单</button></section>';
document.body.appendChild(endingOverlay);
const exitGameButton=document.createElement('button');exitGameButton.type='button';exitGameButton.id='exitGameButton';exitGameButton.textContent='退出游戏';exitGameButton.onclick=exitGame;document.querySelector('.chapter-card').appendChild(exitGameButton);

function clearEndingCombatUI(){
 hideSkillTooltip();document.querySelector('.settings').open=false;
 if(typeof hideBossRetryMenu==='function')hideBossRetryMenu();
 if(typeof battleBroadcast!=='undefined')battleBroadcast.clear();
 clearInterval(diceTimer);clearTimeout(bannerTimer);clearDragonDice();
 for(const [id,name] of [['diceWrap','show'],['turnBanner','show'],['bossLore','show'],['emberOverlay','show'],['phaseTransition','active']])document.getElementById(id).classList.remove(name);
}
function startBossEnding(){
 if(gameEnding.state===s)return;
 if(typeof cancelTurnQuiz==='function')cancelTurnQuiz();
 stopTutorial();clearEndingCombatUI();toggleChapterMenu(false);
 gameEnding.state=s;gameEnding.index=0;gameEnding.active=true;gameEnding.completed=false;gameEnding.exited=false;
 s.over=true;s.busy=true;document.body.classList.add('game-ending');endingOverlay.hidden=false;
 s.endingMusic=true;if(typeof syncBattleMusic==='function')syncBattleMusic();
 document.body.appendChild(document.getElementById('chapterOverlay'));
 document.getElementById('endingBubble').hidden=false;document.getElementById('endingResult').hidden=true;
 paintBossEnding();document.getElementById('endingBubble').focus?.();
}
function paintBossEnding(){
 const [speaker,text]=bossEndingLines[gameEnding.index];
 document.getElementById('endingSpeaker').textContent=speaker;document.getElementById('endingText').textContent=text;
 document.getElementById('endingProgress').textContent=`${gameEnding.index+1} / ${bossEndingLines.length}`;
 const avatar=document.getElementById('endingAvatar');avatar.src=speaker==='汐霂'?'assets/ximo-avatar.png':'assets/tiaoyao-avatar.png';avatar.alt=speaker+'的头像';
}
function nextBossEnding(){
 if(!gameEnding.active)return;
 if(++gameEnding.index<bossEndingLines.length){paintBossEnding();return}
 gameEnding.active=false;gameEnding.completed=true;
 showEndingResult('感谢游玩《黑猫与白鸟》','');toggleChapterMenu(true);
}
function showEndingResult(title,text){
 document.getElementById('endingBubble').hidden=true;document.getElementById('endingResult').hidden=false;
 document.getElementById('endingResultTitle').textContent=title;document.getElementById('endingResultText').textContent=text;
 document.getElementById('endingMenu').textContent=gameEnding.exited?'返回菜单':'打开菜单';
}
function stopGameEnding(){
 gameEnding.active=false;gameEnding.completed=false;gameEnding.exited=false;gameEnding.state=null;endingOverlay.hidden=true;document.body.classList.remove('game-ending');
 document.getElementById('game').appendChild(document.getElementById('chapterOverlay'));
}
function exitGame(){
 if(typeof cancelTurnQuiz==='function')cancelTurnQuiz();
 stopTutorial();clearEndingCombatUI();toggleChapterMenu(false);
 gameEnding.active=false;gameEnding.exited=true;s.over=true;s.busy=true;
 document.body.classList.add('game-ending');endingOverlay.hidden=false;
 document.body.appendChild(document.getElementById('chapterOverlay'));
 showEndingResult('游戏已退出','如果窗口没有自动关闭，请手动关闭此页面。');
 if(typeof battleMusic!=='undefined'){battleMusic.setMuted(true);battleMusic.audio.pause();}
 try{window.close()}catch{/* Browser tabs may disallow scripted closing; keep the exit screen. */}
}
document.getElementById('endingNext').onclick=event=>{event.stopPropagation();nextBossEnding()};
endingOverlay.addEventListener('click',event=>{if(!event.target.closest('button'))nextBossEnding()});
document.getElementById('endingMenu').onclick=()=>toggleChapterMenu(true);
document.addEventListener('keydown',event=>{
 if(!gameEnding.active)return;
 if(['Enter',' ','Escape'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();if(event.key!=='Escape'&&!event.repeat)nextBossEnding()}
},true);
const checkBeforeGameEnding=checkEnd;
checkEnd=function(){
 if(gameEnding.active||gameEnding.exited||gameEnding.completed)return true;
 const won=s.battleMode==='boss'&&s.bossPhase===3&&(s.enemies?s.enemies[0].hp:s.enemy)<=0;
 // Cover the battlefield synchronously, before the victory render and cleanup callbacks.
 if(won)startBossEnding();
 return checkBeforeGameEnding();
};
const resetBeforeGameEnding=resetBattle;
resetBattle=function(...args){stopGameEnding();return resetBeforeGameEnding(...args)};
const tooltipBeforeGameEnding=showSkillTooltip;
showSkillTooltip=function(...args){if(gameEnding.active||gameEnding.completed||gameEnding.exited){hideSkillTooltip();return}return tooltipBeforeGameEnding(...args)};
