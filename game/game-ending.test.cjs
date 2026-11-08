const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {run,context,elements,timers}=require('./training-flow.test.cjs');
vm.runInContext(fs.readFileSync(require.resolve('./game-ending.js'),'utf8'),context);
function setup(phase=3){timers.length=0;run(`stopTutorial();resetBattle('boss',${phase});s.busy=false;s.over=false`)}
// Only the final dragon defeat starts the finale, including victory while targeting a soldier.
setup(1);run('s.enemy=0;checkEnd()');assert.equal(run('gameEnding.active'),false);
setup(3);run('phaseThreeSummonSoldiers([5,5]);s.targetIndex=1;s.enemy=0;checkEnd()');assert.equal(run('gameEnding.active'),false);
setup(3);run('phaseThreeSummonSoldiers([5,5]);s.enemies[0].hp=0;s.targetIndex=2;checkEnd()');
assert.equal(run('gameEnding.active'),true);assert.equal(run('s.over'),true);assert.equal(run('endingOverlay.hidden'),false);
assert.equal(elements.get('endingSpeaker').textContent,'汐霂');assert.equal(elements.get('endingProgress').textContent,'1 / 14');
assert.equal(run('tutorial.active'),false);assert.equal(elements.get('chapterOverlay').classList.contains('show'),false);
assert.equal(run('document.body.children.includes(document.getElementById("chapterOverlay"))'),true,'menu is outside the isolated game stacking context');
// A victory render cannot occur before the opaque cover is visible.
setup();run('const coverChecks=[],renderBeforeEndingTest=render;render=function(){coverChecks.push(!endingOverlay.hidden);renderBeforeEndingTest()};s.enemy=0;checkEnd();render=renderBeforeEndingTest');
assert(run('coverChecks.length>0&&coverChecks.every(Boolean)'));
// Repeated victory checks never restart the conversation, and each click shows the next original line.
run('nextBossEnding();checkEnd()');assert.equal(run('gameEnding.index'),1);assert.equal(elements.get('endingText').textContent,'（赞许地鼓掌）');
assert.equal(elements.get('endingAvatar').src,'assets/tiaoyao-avatar.png');
for(let index=2;index<14;index++){
 run('nextBossEnding()');assert.equal(run('gameEnding.active'),true);
 assert.equal(elements.get('endingText').textContent,run(`bossEndingLines[${index}][1]`));
 assert.equal(elements.get('chapterOverlay').classList.contains('show'),false);
}
assert.equal(elements.get('endingText').textContent,'...再见。');
run('nextBossEnding()');assert.equal(run('gameEnding.active'),false);assert.equal(run('gameEnding.completed'),true);
assert.equal(elements.get('chapterOverlay').classList.contains('show'),true);assert.equal(elements.get('endingBubble').hidden,true);
run('nextBossEnding();checkEnd()');assert.equal(run('gameEnding.index'),14);
// Selecting a chapter clears the cover and allows a new playthrough.
run('selectChapter("puppet")');assert.equal(run('gameEnding.completed'),false);assert.equal(run('endingOverlay.hidden'),true);assert.equal(run('s.over'),false);
// Exit halts music and requests native closing; denied closing retains a useful fallback screen.
run('let closeCalls=0,pauseCalls=0;const battleMusic={muted:false,setMuted(value){this.muted=value},audio:{pause(){pauseCalls++}}};window.close=()=>{closeCalls++};exitGame()');
assert.equal(run('closeCalls'),1);assert.equal(run('pauseCalls'),1);assert.equal(run('battleMusic.muted'),true);
assert.equal(run('s.over'),true);assert.equal(run('gameEnding.exited'),true);assert.equal(elements.get('endingResultTitle').textContent,'游戏已退出');
assert.match(elements.get('endingResultText').textContent,/手动关闭/);
run('window.close=()=>{throw Error("not permitted")};exitGame()');assert.equal(run('endingOverlay.hidden'),false);
run('selectChapter("boss")');assert.equal(run('gameEnding.exited'),false);assert.equal(run('s.over'),false);
assert.equal(elements.get('exitGameButton').textContent,'退出游戏');
console.log('PASS: final victory dialogue, all 14 lines, opaque cover, menu handoff, restart and browser exit fallback.');
