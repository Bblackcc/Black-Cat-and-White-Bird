/* One looping media element follows the encounter and never restarts on ordinary UI renders. */
const battleMusicTracks={
 puppet:{name:'碎骨',file:'assets/塞壬唱片-MSR,林ゆうき - 碎骨.mp3'},
 boss1:{name:'塔露拉',file:'assets/塞壬唱片-MSR,林ゆうき - 塔露拉.mp3'},
 boss2:{name:'切尔诺伯格',file:'assets/塞壬唱片-MSR,林ゆうき - 切尔诺伯格.mp3'},
 boss3:{name:'黑蛇',file:'assets/塞壬唱片-MSR,林ゆうき - 黑蛇.mp3'},
 ending:{name:'曙光',file:'assets/塞壬唱片-MSR,林ゆうき - 曙光.mp3'}
};
class BattleMusicController{
 constructor(audio){this.audio=audio;this.key='';this.loadedKey='';this.unlocked=false;this.muted=false;this.volume=.18;this.gain=1;this.generation=0;this.pending=null;this.fadeFrame=null;this.fadeVersion=0;this.fadingOut=false;audio.loop=true;audio.preload='metadata';this.applyVolume()}
 applyVolume(){this.audio.volume=Math.max(0,Math.min(1,this.volume*this.gain))}
 cancelFade(){this.fadeVersion++;if(this.fadeFrame!==null)cancelAnimationFrame(this.fadeFrame);this.fadeFrame=null}
 fadeTo(target,duration,done){
  this.cancelFade();const version=this.fadeVersion,start=performance.now(),from=this.gain;
  const tick=now=>{
   if(version!==this.fadeVersion)return;
   const progress=Math.max(0,Math.min(1,(now-start)/duration));
   // Smooth endpoints avoid a sudden audible jump at either end of the transition.
   const eased=progress*progress*(3-2*progress);this.gain=from+(target-from)*eased;this.applyVolume();
   if(progress<1)this.fadeFrame=requestAnimationFrame(tick);else{this.fadeFrame=null;if(done)done()}
  };this.fadeFrame=requestAnimationFrame(tick);
 }
 switchTrack(fadeIn){
  this.cancelFade();this.fadingOut=false;this.audio.pause();this.loadedKey=this.key;
  this.audio.src=encodeURI(battleMusicTracks[this.key].file);this.audio.currentTime=0;this.audio.loop=true;this.gain=fadeIn?0:1;this.applyVolume();this.play();
 }
 sync(mode,phase=1){
  const key=mode==='ending'?'ending':mode==='boss'?`boss${Math.max(1,Math.min(3,phase||1))}`:'puppet';
  if(key===this.key)return;
  this.key=key;this.generation++;
  if(!this.loadedKey||!this.unlocked||this.muted||this.audio.paused||this.volume===0){this.switchTrack(false);return}
  if(this.loadedKey===key){this.fadingOut=false;this.fadeTo(1,800);return}
  this.fadingOut=true;
  this.fadeTo(0,650,()=>this.switchTrack(true));
 }
 play(){
  if(!this.unlocked||this.muted||!this.key||this.fadingOut||!this.audio.paused||this.pending===this.generation)return;
  const generation=this.generation;this.pending=generation;
  try{Promise.resolve(this.audio.play()).then(()=>{
   if(generation===this.generation&&!this.fadingOut&&!this.muted&&this.gain<1)this.fadeTo(1,800);
  }).catch(()=>{
   // A denied first play or an interrupted track change is retried on the next player gesture.
  }).finally(()=>{if(this.pending===generation)this.pending=null})}catch{if(this.pending===generation)this.pending=null}
 }
 unlock(){this.unlocked=true;this.play()}
 setMuted(muted){this.muted=!!muted;this.audio.muted=this.muted;if(this.muted){this.cancelFade();if(this.loadedKey!==this.key)this.switchTrack(false);this.fadingOut=false;this.gain=1;this.applyVolume()}else this.unlock()}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));this.applyVolume();this.setMuted(this.volume===0)}
}
const battleMusic=new BattleMusicController(new Audio());
function syncBattleMusic(){battleMusic.sync(s.endingMusic?'ending':s.battleMode,s.bossPhase);updateBattleMusicControls()}
function updateBattleMusicControls(){
 const toggle=document.getElementById('musicToggle');
 const slider=document.getElementById('musicVolume'),value=document.getElementById('musicVolumeValue');if(slider)slider.value=String(Math.round(battleMusic.volume*100));if(value)value.textContent=Math.round(battleMusic.volume*100)+'%';
 if(toggle){toggle.textContent=battleMusic.muted?'开启音乐':'静音';toggle.setAttribute('aria-pressed',String(battleMusic.muted))}
}
const musicPanel=document.createElement('div');musicPanel.className='music-panel';
musicPanel.innerHTML='<div>背景音乐</div><div class="music-controls"><button type="button" id="musicToggle" aria-pressed="false">静音</button><label for="musicVolume">音量 <output id="musicVolumeValue" for="musicVolume">18%</output></label><input id="musicVolume" type="range" min="0" max="100" step="1" value="18" aria-label="背景音乐音量"></div>';
document.querySelector('.chapter-card').appendChild(musicPanel);
document.getElementById('musicToggle').onclick=()=>{battleMusic.setMuted(!battleMusic.muted);updateBattleMusicControls()};
document.getElementById('musicVolume').oninput=event=>{battleMusic.setVolume(Number(event.target.value)/100);updateBattleMusicControls()};
document.addEventListener('pointerdown',()=>battleMusic.unlock(),{capture:true,passive:true});
document.addEventListener('keydown',()=>battleMusic.unlock(),{capture:true});
window.addEventListener('pagehide',()=>battleMusic.audio.pause());
window.addEventListener('pageshow',()=>battleMusic.play());
const renderBeforeMusic=render;
render=function(){renderBeforeMusic();syncBattleMusic()};
syncBattleMusic();
