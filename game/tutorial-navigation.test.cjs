const assert=require('node:assert/strict');
const {run,flushUntil,elements,timers}=require('./training-flow.test.cjs');
timers.length=0;
run('startTutorial();const navigationRandom=Math.random;Math.random=()=>.1');
assert.equal(run('tutorial.index'),0);assert.equal(elements.get('tutorialBack').disabled,true);
run('previousTutorial()');assert.equal(run('tutorial.index'),0);
run('nextTutorial();nextTutorial();previousTutorial()');assert.equal(run('tutorial.index'),1);assert.equal(run('tutorialReviewing()'),true);
assert.equal(elements.get('tutorialSpeaker').textContent,'岧峣');assert.equal(elements.get('tutorialBack').disabled,false);
run('nextTutorial()');assert.equal(run('tutorial.index'),2);assert.equal(run('tutorialReviewing()'),false);
// Completed action steps become readable history instead of spending a second die.
run('while(tutorial.index<6)nextTutorial();useSkill("light","cat");previousTutorial()');assert.equal(run('tutorial.index'),6,'back is blocked while the skill animation is running');
flushUntil('tutorial.index===7');assert.equal(run('s.ap'),3);run('const enemyAfterLessonLight=JSON.stringify(s.enemies);previousTutorial()');
assert.equal(run('tutorial.index'),6);assert.equal(elements.get('tutorialNext').hidden,false);assert.match(elements.get('tutorialActionHint').textContent,/回看/);
run('useSkill("light","cat");tutorialEvent("skill:light")');assert.equal(run('tutorial.index'),6);assert.equal(run('s.ap'),3);assert.equal(run('JSON.stringify(s.enemies)'),run('enemyAfterLessonLight'));
run('nextTutorial();nextTutorial();nextTutorial();selectHero("bird");nextTutorial();useSkill("enchant","bird")');flushUntil('tutorial.index===12');
run('previousTutorial();useSkill("enchant","bird");nextTutorial()');assert.equal(run('tutorial.index'),12);assert.equal(run('s.ap'),2);
run('nextTutorial();selectHero("cat");useSkill("heavy","cat")');flushUntil('tutorial.index===15');
run('nextTutorial();nextTutorial()');flushUntil('s.emberPhase==="offer"&&!tutorial.waiting');
assert.equal(run('s.emberActivations'),1);run('const emberFaceBeforeHistory=s.emberFace;previousTutorial();nextTutorial()');assert.equal(run('tutorial.index'),17);
assert.equal(run('s.emberFace'),run('emberFaceBeforeHistory'));assert.equal(run('s.emberActivations'),1);assert.equal(run('tutorial.waiting'),false);
run('nextTutorial();selectBoonSkill("tanuki","stone");nextTutorial()');assert.equal(run('tutorial.index'),20);
// The existing return-to-offer action remains an actual skill-selection path, not history review.
run('returnToBoonOffer()');assert.equal(run('tutorial.index'),18);assert.equal(run('tutorialReviewing()'),false);
run('selectBoonSkill("tanuki","stone");nextTutorial();installEquippedSkill(2)');assert.equal(run('tutorial.index'),21);
run('const apAfterLessonInstall=s.ap;previousTutorial()');assert.equal(run('tutorial.index'),20);assert.equal(elements.get('tutorialNext').hidden,false);
run('nextTutorial()');assert.equal(run('tutorial.index'),21);assert.equal(run('loadout.cat[2]'),'stone');assert.equal(run('s.emberActivations'),1);assert.equal(run('s.ap'),run('apAfterLessonInstall'));
// Skip confirmation owns its own controls and cannot step backward accidentally.
run('requestTutorialSkip()');assert.equal(elements.get('tutorialBack').hidden,true);run('previousTutorial()');assert.equal(run('tutorial.index'),21);
run('cancelTutorialSkip()');assert.equal(elements.get('tutorialBack').hidden,false);
// Boss introduction history stays within that scene and preserves the opaque blackout.
run('stopTutorial();resetBattle("boss");tutorial.active=true;tutorial.index=29;tutorial.furthestIndex=29;s.busy=true;tutorialBlackout.hidden=false;paintTutorial()');
assert.equal(elements.get('tutorialBack').disabled,true);run('nextTutorial();previousTutorial()');assert.equal(run('tutorial.index'),29);assert.equal(run('s.battleMode'),'boss');assert.equal(run('tutorialBlackout.hidden'),false);
run('nextTutorial();nextTutorial();previousTutorial()');assert.equal(run('tutorial.index'),30);assert.equal(run('tutorial.fading'),false);
run('nextTutorial()');assert.equal(run('tutorial.index'),31);assert.equal(run('tutorial.fading'),false);run('nextTutorial()');assert.equal(run('tutorial.fading'),true);
flushUntil('!tutorial.active');assert.equal(run('tutorialBlackout.hidden'),true);
run('startTutorial()');assert.equal(run('tutorial.index'),0);assert.equal(run('tutorial.furthestIndex'),0);assert.equal(elements.get('tutorialBack').disabled,true);
run('stopTutorial();Math.random=navigationRandom');
console.log('PASS: previous-step controls, completed-action history without duplicate AP / boons, real boon return, skip controls, Boss scene bounds and replay reset.');
