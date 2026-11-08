const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {run,context,elements}=require('./training-flow.test.cjs');
const gestures={},windowEvents={};context.document.addEventListener=(name,handler)=>gestures[name]=handler;context.window.addEventListener=(name,handler)=>windowEvents[name]=handler;
let mediaElements=0;
class FakeAudio{
 constructor(){mediaElements++;this.paused=true;this.src='';this.currentTime=0;this.playCalls=0;this.pauseCalls=0;this.fail=false}
 pause(){this.paused=true;this.pauseCalls++}
 play(){this.playCalls++;if(this.fail)return Promise.reject(new Error('NotAllowedError'));this.paused=false;return Promise.resolve()}
}
context.Audio=FakeAudio;
let animationTime=0,nextFrameId=0;const frames=new Map();
context.performance={now:()=>animationTime};
context.requestAnimationFrame=callback=>{const id=++nextFrameId;frames.set(id,callback);return id};
context.cancelAnimationFrame=id=>frames.delete(id);
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
const advance=async milliseconds=>{animationTime+=milliseconds;const queued=[...frames.values()];frames.clear();for(const callback of queued)callback(animationTime);await settle()};
const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
(async()=>{
 vm.runInContext(fs.readFileSync(require.resolve('./battle-music.js'),'utf8'),context);
 assert(run('musicPanel.innerHTML.includes("背景音乐")'));assert.equal(elements.has('musicTrackLabel'),false);for(const track of Object.values(run('battleMusicTracks')))assert(!run('musicPanel.innerHTML').includes(track.name));
 assert.equal(mediaElements,1);assert.equal(run('battleMusic.key'),'puppet');assert.equal(run('battleMusic.audio.loop'),true);assert.equal(run('battleMusic.audio.playCalls'),0);
 assert.equal(run('battleMusic.audio.volume'),.18);assert.equal(elements.get('musicVolume').value,'18');assert.equal(elements.get('musicVolumeValue').textContent,'18%');
 assert.match(decodeURI(run('battleMusic.audio.src')),/碎骨\.mp3$/);
 for(const track of Object.values(run('battleMusicTracks'))){const file=require('node:path').resolve(__dirname,'..',decodeURI(encodeURI(track.file)));assert(fs.statSync(file).size>1000);const fd=fs.openSync(file,'r'),header=Buffer.alloc(3);fs.readSync(fd,header,0,3,0);fs.closeSync(fd);assert(header.toString()==='ID3'||header[0]===0xff)}
 gestures.pointerdown();await settle();assert.equal(run('battleMusic.audio.playCalls'),1);assert.equal(run('battleMusic.audio.paused'),false);
 run('for(let i=0;i<10;i++)render()');assert.equal(run('battleMusic.audio.playCalls'),1);
 run('s.battleMode="boss";s.bossPhase=1;render()');assert.equal(run('battleMusic.key'),'boss1');assert.match(decodeURI(run('battleMusic.audio.src')),/碎骨\.mp3$/);
 await advance(325);near(run('battleMusic.audio.volume'),.09);assert.equal(run('battleMusic.audio.paused'),false);
 // Slider changes scale the current fade instead of abruptly restoring full volume.
 elements.get('musicVolume').oninput({target:{value:'35'}});near(run('battleMusic.audio.volume'),.175);
 elements.get('musicVolume').oninput({target:{value:'18'}});near(run('battleMusic.audio.volume'),.09);
 await advance(325);assert.match(decodeURI(run('battleMusic.audio.src')),/塔露拉\.mp3$/);assert.equal(run('battleMusic.audio.volume'),0);
 await advance(400);near(run('battleMusic.audio.volume'),.09);run('render()');
 await advance(400);near(run('battleMusic.audio.volume'),.18);
 // Rapid phase switches keep one player and the newest phase's track.
 run('s.bossPhase=2;render()');await advance(200);assert.match(decodeURI(run('battleMusic.audio.src')),/塔露拉\.mp3$/);
 run('s.bossPhase=3;render()');await advance(650);assert.match(decodeURI(run('battleMusic.audio.src')),/黑蛇\.mp3$/);await advance(800);assert.equal(mediaElements,1);assert.equal(run('battleMusic.audio.loop'),true);assert.equal(run('battleMusic.audio.playCalls'),3);
 run('battleMusic.audio.currentTime=88;resetBattle("boss",3)');assert.equal(run('battleMusic.audio.currentTime'),88);assert.equal(run('battleMusic.audio.playCalls'),3);
 run('battleMusic.setMuted(true);resetBattle("puppet")');assert.equal(run('battleMusic.audio.muted'),true);assert.equal(run('battleMusic.audio.paused'),true);assert.equal(run('battleMusic.audio.playCalls'),3);
 elements.get('musicVolume').oninput({target:{value:'35'}});await settle();assert.equal(run('battleMusic.audio.volume'),.35);assert.equal(run('battleMusic.audio.muted'),false);assert.equal(run('battleMusic.audio.playCalls'),4);
 assert.equal(elements.get('musicVolumeValue').textContent,'35%');
 windowEvents.pagehide();assert.equal(run('battleMusic.audio.paused'),true);windowEvents.pageshow();await settle();assert.equal(run('battleMusic.audio.paused'),false);
 // Reversing a switch keeps the current track position; muting cancels pending fades safely.
 run('battleMusic.audio.currentTime=44;battleMusic.sync("boss",2)');await advance(325);
 run('battleMusic.sync("puppet")');await advance(800);assert.match(decodeURI(run('battleMusic.audio.src')),/碎骨\.mp3$/);assert.equal(run('battleMusic.audio.currentTime'),44);near(run('battleMusic.audio.volume'),.35);
 run('battleMusic.sync("boss",2)');await advance(325);run('battleMusic.setMuted(true)');await advance(2000);assert.match(decodeURI(run('battleMusic.audio.src')),/切尔诺伯格\.mp3$/);assert.equal(run('battleMusic.audio.muted'),true);assert.equal(run('battleMusic.audio.paused'),true);
 run('battleMusic.setMuted(false)');await settle();assert.equal(run('battleMusic.audio.paused'),false);near(run('battleMusic.audio.volume'),.35);
 // A rejected autoplay attempt is handled and can be retried on the next gesture.
 context.failedMedia=new FakeAudio();run('const retryMusic=new BattleMusicController(failedMedia);retryMusic.sync("puppet");failedMedia.fail=true;retryMusic.unlock()');await settle();assert.equal(run('retryMusic.pending'),null);assert.equal(run('failedMedia.paused'),true);
 run('failedMedia.fail=false;retryMusic.unlock()');await settle();assert.equal(run('failedMedia.playCalls'),2);assert.equal(run('failedMedia.paused'),false);
 // Victory selects the ending track before the underlying victory render, then keeps it through the menu.
 vm.runInContext(fs.readFileSync(require.resolve('./game-ending.js'),'utf8'),context);
 run('resetBattle("boss",3)');await advance(650);await advance(800);assert.equal(run('battleMusic.loadedKey'),'boss3');
 run('s.enemies[0].hp=0;checkEnd()');assert.equal(run('gameEnding.active'),true);assert.equal(run('battleMusic.key'),'ending');
 assert.match(decodeURI(run('battleMusic.audio.src')),/黑蛇\.mp3$/);
 await advance(325);near(run('battleMusic.audio.volume'),.175);
 run('render()');assert.equal(run('battleMusic.key'),'ending');
 await advance(325);assert.match(decodeURI(run('battleMusic.audio.src')),/曙光\.mp3$/);near(run('battleMusic.audio.volume'),0);
 await advance(400);near(run('battleMusic.audio.volume'),.175);await advance(400);near(run('battleMusic.audio.volume'),.35);
 assert.equal(run('battleMusic.audio.loop'),true);run('battleMusic.audio.currentTime=27;while(gameEnding.active)nextBossEnding();render()');
 assert.equal(run('battleMusic.key'),'ending');assert.equal(run('battleMusic.audio.currentTime'),27);
 run('selectChapter("puppet")');await advance(650);await advance(800);assert.equal(run('battleMusic.loadedKey'),'puppet');
 assert.match(decodeURI(run('battleMusic.audio.src')),/碎骨\.mp3$/);
 console.log('PASS: looping encounter / ending music, victory fade-out / fade-in, menu continuity, volume, rapid switches, mute and autoplay retry.');
})().catch(error=>{console.error(error);process.exitCode=1});
