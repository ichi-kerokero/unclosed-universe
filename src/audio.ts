export class AudioEngine{
 private ctx?:AudioContext;
 private bgm?:HTMLAudioElement;
 private bgmGain?:GainNode;
 private sfx?:GainNode;
 private duckTimer=0;
 private bgmStarted=false;
 private buffers=new Map<string,AudioBuffer>();
 private loading=new Map<string,Promise<AudioBuffer>>();
 private fallback=new Map<string,HTMLAudioElement>();
 muted=false;
 volume=.55;

 async start(fadeIn=false){
  if(!this.ctx)this.initialize(fadeIn);
  if(!this.ctx||!this.bgm)return;
  await this.ctx.resume().catch(()=>{});
  const shouldFade=fadeIn&&!this.bgmStarted&&!this.muted;
  if(shouldFade)this.setBgmLevel(0);
  try{
   if(this.bgm.paused)await this.bgm.play();
   if(!this.bgmStarted){this.bgmStarted=true;if(shouldFade)this.fadeBgmIn();else this.setBgmLevel(this.baseBgmLevel())}
  }catch{/* A later pointer or keyboard action retries playback. */}
 }

 private initialize(fadeIn:boolean){
  this.ctx=new AudioContext();
  this.sfx=this.ctx.createGain();
  this.sfx.connect(this.ctx.destination);
  this.sfx.gain.value=this.muted?0:this.volume;
  for(const path of ['audio/hat-snap.m4a','audio/hat-appears.wav']){
   const url=this.asset(path),el=new Audio(url);el.preload='auto';el.load();this.fallback.set(url,el);void this.preload(url).catch(()=>{});
  }
  this.bgm=new Audio(this.asset('audio/bgm.mp3'));
  this.bgm.loop=true;
  this.bgm.preload='auto';
  this.bgm.muted=this.muted;
  try{
   const source=this.ctx.createMediaElementSource(this.bgm);
   this.bgmGain=this.ctx.createGain();
   source.connect(this.bgmGain);
   this.bgmGain.connect(this.ctx.destination);
   this.bgm.volume=1;
  }catch{this.bgmGain=undefined}
  this.setBgmLevel(fadeIn?0:this.baseBgmLevel());
 }

 private asset(path:string){return`${import.meta.env.BASE_URL}assets/${path}`}
 private baseBgmLevel(){return this.muted?0:.24*this.volume}
 private setBgmLevel(level:number){
  const value=Math.max(0,Math.min(1,level));
  if(this.bgmGain&&this.ctx){this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);this.bgmGain.gain.setValueAtTime(value,this.ctx.currentTime)}
  else if(this.bgm)this.bgm.volume=value;
 }
 private fadeBgmIn(){
  const target=this.baseBgmLevel();
  if(this.bgmGain&&this.ctx){const gain=this.bgmGain.gain;gain.cancelScheduledValues(this.ctx.currentTime);gain.setValueAtTime(0,this.ctx.currentTime);gain.linearRampToValueAtTime(target,this.ctx.currentTime+.65)}
  else this.setBgmLevel(target);
 }

 set(muted:boolean,volume=this.volume){
  this.muted=muted;this.volume=volume;
  if(this.bgm)this.bgm.muted=muted;
  this.setBgmLevel(this.baseBgmLevel());
  if(this.sfx)this.sfx.gain.value=muted?0:volume;
 }

 private preload(url:string){
  if(!this.ctx)return Promise.reject();
  const cached=this.buffers.get(url);if(cached)return Promise.resolve(cached);
  const pending=this.loading.get(url);if(pending)return pending;
  const task=fetch(url).then(r=>r.arrayBuffer()).then(b=>this.ctx!.decodeAudioData(b)).then(buf=>{this.buffers.set(url,buf);this.loading.delete(url);return buf});
  this.loading.set(url,task);return task;
 }
 private playFallback(url:string,gain:number){const source=this.fallback.get(url);if(!source||this.muted)return;const el=source.cloneNode(true) as HTMLAudioElement;el.volume=Math.min(1,this.volume*gain);void el.play().catch(()=>{})}
 private async play(url:string,gain=1){
  if(!this.ctx||!this.sfx||this.muted)return;
  await this.ctx.resume().catch(()=>{});
  const playBuffer=(buf:AudioBuffer)=>{if(this.ctx?.state!=='running'){this.playFallback(url,gain);return}const s=this.ctx.createBufferSource(),g=this.ctx.createGain();g.gain.value=gain;s.buffer=buf;s.connect(g);g.connect(this.sfx!);s.start()};
  const cached=this.buffers.get(url);if(cached)playBuffer(cached);else this.preload(url).then(playBuffer).catch(()=>this.playFallback(url,gain));
 }
 snap(){if(this.bgm&&!this.muted){clearTimeout(this.duckTimer);this.setBgmLevel(this.baseBgmLevel()*.42);this.duckTimer=window.setTimeout(()=>this.setBgmLevel(this.baseBgmLevel()),180)}this.play(this.asset('audio/hat-snap.m4a'))}
 appears(){this.play(this.asset('audio/hat-appears.wav'),.55)}
}
