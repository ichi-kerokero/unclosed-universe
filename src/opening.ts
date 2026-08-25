export type OpeningPhase=
 |'BOOT'
 |'OPENING_FADE_IN'
 |'OPENING_CREDITS'
 |'OPENING_FLOATING_HAT'
 |'OPENING_TRANSITION'
 |'OPENING_INITIAL_UNIVERSE'
 |'PLAY_READY';

export type OpeningFrame={
 phase:OpeningPhase;
 paperVeil:number;
 creditsOpacity:number;
 floatingHatOpacity:number;
 initialUniverseOpacity:number;
 titleOpacity:number;
 playReady:boolean;
};

export const PLAY_READY_AT=8200;
export const TITLE_VISIBLE_AT=8900;

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t)};
const between=(elapsed:number,start:number,end:number)=>smooth((elapsed-start)/(end-start));

export function openingFrame(elapsed:number):OpeningFrame{
 const time=Math.max(0,elapsed);
 let phase:OpeningPhase='BOOT';
 if(time<800)phase='OPENING_FADE_IN';
 else if(time<1800)phase='OPENING_CREDITS';
 else if(time<2500)phase='OPENING_FLOATING_HAT';
 else if(time<5800)phase='OPENING_CREDITS';
 else if(time<6800)phase='OPENING_TRANSITION';
 else if(time<PLAY_READY_AT)phase='OPENING_INITIAL_UNIVERSE';
 else phase='PLAY_READY';

 const pale=.72;
 const paperVeil=time<800?1-(1-pale)*between(time,0,800):time<5800?pale:pale*(1-between(time,5800,7600));
 const creditsIn=between(time,800,1600),creditsOut=1-between(time,5800,7600);
 return{
  phase,
  paperVeil,
  creditsOpacity:creditsIn*creditsOut,
  floatingHatOpacity:between(time,1800,2500),
  initialUniverseOpacity:between(time,6800,PLAY_READY_AT),
  titleOpacity:between(time,PLAY_READY_AT,TITLE_VISIBLE_AT),
  playReady:time>=PLAY_READY_AT,
 };
}
