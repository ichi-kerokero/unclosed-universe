import {coordinateHash,hashUnit,seedHash} from '../../random/coordinateHash';
import type {ViewCamera} from '../paperRenderer';

type AnyCanvas=HTMLCanvasElement|OffscreenCanvas;
type AnyContext=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;
export type WorldBounds={minX:number;maxX:number;minY:number;maxY:number};
export type EventKind='ultra'|'01'|'02'|'03'|'04';
export type CosmosEvent={id:string;kind:EventKind;x:number;y:number;width:number;height:number;rotation:number;alpha:number;blend:GlobalCompositeOperation};

const CHUNK_PIXELS=256,GUTTER=4,CACHE_LIMIT=72;
const EVENT_PATHS:Record<EventKind,string>={ultra:'assets/universe/ultra_deep_field.png','01':'assets/universe/events/01.png','02':'assets/universe/events/02.png','03':'assets/universe/events/03.png','04':'assets/universe/events/04.png'};

function canvas2d(width:number,height:number){
 const canvas:AnyCanvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(width,height):Object.assign(document.createElement('canvas'),{width,height});
 const ctx=canvas.getContext('2d') as AnyContext|null;
 if(!ctx)throw new Error('Canvas 2D is unavailable');
 return{canvas,ctx};
}

function intersects(bounds:WorldBounds,x:number,y:number,w:number,h:number){return x+w/2>=bounds.minX&&x-w/2<=bounds.maxX&&y+h/2>=bounds.minY&&y-h/2<=bounds.maxY}

export function cosmosEvents(worldSeed:string,bounds:WorldBounds){
 const seed=seedHash(worldSeed),result:CosmosEvent[]=[];
 const origin:CosmosEvent={id:'canonical-origin',kind:'ultra',x:0,y:0,width:22,height:22,rotation:-.18,alpha:.7,blend:'screen'};
 if(intersects(bounds,origin.x,origin.y,origin.width,origin.height))result.push(origin);
 const cell=34,pad=30,x0=Math.floor((bounds.minX-pad)/cell),x1=Math.floor((bounds.maxX+pad)/cell),y0=Math.floor((bounds.minY-pad)/cell),y1=Math.floor((bounds.maxY+pad)/cell);
 const priority=(x:number,y:number)=>coordinateHash(seed,101,x,y);
 for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
  const own=priority(ix,iy);let chosen=true;
  for(let ny=iy-1;ny<=iy+1&&chosen;ny++)for(let nx=ix-1;nx<=ix+1;nx++)if((nx!==ix||ny!==iy)&&priority(nx,ny)<own){chosen=false;break}
  if(!chosen)continue;
  const t=hashUnit(seed,102,ix,iy),kind:EventKind=t<.14?'ultra':t<.34?'01':t<.55?'02':t<.79?'03':'04';
  const base=kind==='02'?8:kind==='01'?12:kind==='03'?19:kind==='04'?24:25,scale=.72+hashUnit(seed,103,ix,iy)*.7;
  const width=base*scale,height=width*(.82+hashUnit(seed,104,ix,iy)*.35),x=(ix+0.18+hashUnit(seed,105,ix,iy)*.64)*cell,y=(iy+0.18+hashUnit(seed,106,ix,iy)*.64)*cell;
  const alpha=kind==='04'?.18:kind==='02'?.42:kind==='01'?.48:kind==='03'?.68:.62,blend:GlobalCompositeOperation=kind==='03'?'source-over':'screen';
  if(intersects(bounds,x,y,width,height))result.push({id:`event/${ix}/${iy}`,kind,x,y,width,height,rotation:(hashUnit(seed,107,ix,iy)-.5)*Math.PI*2,alpha,blend});
 }
 return result;
}

class EventAssets{
 private images=new Map<EventKind,CanvasImageSource>();
 private loading=new Set<EventKind>();
 constructor(private readonly invalidate:()=>void){}
 get(kind:EventKind){
  const ready=this.images.get(kind);if(ready){this.images.delete(kind);this.images.set(kind,ready);return ready}
  if(this.loading.has(kind))return;
  this.loading.add(kind);const img=new Image();img.decoding='async';img.src=`${import.meta.env.BASE_URL}${EVENT_PATHS[kind]}`;
  img.onload=()=>{const size=1024,{canvas,ctx}=canvas2d(size,size);ctx.clearRect(0,0,size,size);ctx.drawImage(img,0,0,size,size);if(kind==='ultra'){ctx.globalCompositeOperation='destination-in';const g=ctx.createRadialGradient(size/2,size/2,size*.24,size/2,size/2,size*.5);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.68,'rgba(255,255,255,.92)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,size,size);ctx.globalCompositeOperation='source-over'}this.images.set(kind,canvas);while(this.images.size>3)this.images.delete(this.images.keys().next().value!);this.loading.delete(kind);this.invalidate()};
  img.onerror=()=>this.loading.delete(kind);
 }
}

export class CosmosRenderer{
 private readonly seed:number;
 private readonly cache=new Map<string,{canvas:AnyCanvas}>();
 private readonly assets:EventAssets;
 constructor(readonly worldSeed:string,invalidate:()=>void){this.seed=seedHash(worldSeed);this.assets=new EventAssets(invalidate)}

 draw(ctx:CanvasRenderingContext2D,bounds:WorldBounds,cam:ViewCamera){
  const lod=Math.max(-1,Math.min(4,Math.floor(Math.log2(cam.zoom/16)))),pixelsPerWorld=16*2**lod,span=CHUNK_PIXELS/pixelsPerWorld;
  const x0=Math.floor(bounds.minX/span),x1=Math.floor(bounds.maxX/span),y0=Math.floor(bounds.minY/span),y1=Math.floor(bounds.maxY/span);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
   const key=`${lod}/${ix}/${iy}`,entry=this.touch(key)??this.createChunk(key,ix,iy,lod,pixelsPerWorld,span);
   ctx.drawImage(entry.canvas,GUTTER,GUTTER,CHUNK_PIXELS,CHUNK_PIXELS,ix*span,iy*span,span,span);
  }
  this.drawEvents(ctx,bounds);
 }

 private touch(key:string){const value=this.cache.get(key);if(value){this.cache.delete(key);this.cache.set(key,value)}return value}
 private createChunk(key:string,ix:number,iy:number,lod:number,pixelsPerWorld:number,span:number){
  const total=CHUNK_PIXELS+GUTTER*2,{canvas,ctx}=canvas2d(total,total),bleed=GUTTER/pixelsPerWorld,minX=ix*span-bleed,minY=iy*span-bleed,maxX=(ix+1)*span+bleed,maxY=(iy+1)*span+bleed;
  ctx.setTransform(pixelsPerWorld,0,0,pixelsPerWorld,-minX*pixelsPerWorld,-minY*pixelsPerWorld);ctx.fillStyle='#02050a';ctx.fillRect(minX,minY,maxX-minX,maxY-minY);
  this.drawClouds(ctx,{minX,maxX,minY,maxY});this.drawStars(ctx,{minX,maxX,minY,maxY},lod);
  const value={canvas};this.cache.set(key,value);while(this.cache.size>CACHE_LIMIT)this.cache.delete(this.cache.keys().next().value!);return value;
 }

 private drawClouds(ctx:AnyContext,b:WorldBounds){
  const cell=11,pad=10,x0=Math.floor((b.minX-pad)/cell),x1=Math.floor((b.maxX+pad)/cell),y0=Math.floor((b.minY-pad)/cell),y1=Math.floor((b.maxY+pad)/cell),colors=[['18,37,78',.12],['55,25,81',.105],['11,65,71',.075],['85,42,38',.055]] as const;
  for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
   const x=(ix+hashUnit(this.seed,2,ix,iy))*cell,y=(iy+hashUnit(this.seed,3,ix,iy))*cell,r=3.5+hashUnit(this.seed,4,ix,iy)*5.5,[rgb,a]=colors[Math.floor(hashUnit(this.seed,5,ix,iy)*colors.length)];
   const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
 }

 private drawStars(ctx:AnyContext,b:WorldBounds,lod:number){
  const cell=.55,x0=Math.floor(b.minX/cell)-1,x1=Math.floor(b.maxX/cell)+1,y0=Math.floor(b.minY/cell)-1,y1=Math.floor(b.maxY/cell)+1;
  for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
   if(hashUnit(this.seed,10,ix,iy)>.58)continue;
   const x=(ix+.08+hashUnit(this.seed,11,ix,iy)*.84)*cell,y=(iy+.08+hashUnit(this.seed,12,ix,iy)*.84)*cell,bright=hashUnit(this.seed,13,ix,iy),r=.008+bright**4*.075,color=bright>.88?'255,225,170':hashUnit(this.seed,14,ix,iy)>.6?'190,215,255':'238,241,255';
   ctx.fillStyle=`rgba(${color},${.38+bright*.6})`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
   if(bright>.955&&lod>=0){ctx.strokeStyle=`rgba(${color},${.18+bright*.25})`;ctx.lineWidth=.008;ctx.beginPath();ctx.moveTo(x-r*2.8,y);ctx.lineTo(x+r*2.8,y);ctx.moveTo(x,y-r*2.8);ctx.lineTo(x,y+r*2.8);ctx.stroke()}
  }
 }

 private drawEvents(ctx:CanvasRenderingContext2D,bounds:WorldBounds){
  for(const event of cosmosEvents(this.worldSeed,bounds)){
   const image=this.assets.get(event.kind);if(!image)continue;
   ctx.save();ctx.globalAlpha=event.alpha;ctx.globalCompositeOperation=event.blend;ctx.translate(event.x,event.y);ctx.rotate(event.rotation);ctx.drawImage(image,-event.width/2,-event.height/2,event.width,event.height);ctx.restore();
  }
 }
}
