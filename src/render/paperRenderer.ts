import {hashUnit,seedHash} from '../random/coordinateHash';

export type ViewCamera={x:number;y:number;zoom:number};

export class PaperRenderer{
 private readonly seed=seedHash('unclosed-universe-paper-v1');

 draw(ctx:CanvasRenderingContext2D,width:number,height:number,cam:ViewCamera){
  ctx.save();
  ctx.fillStyle='#d8c89f';
  ctx.fillRect(0,0,width,height);
  ctx.translate(width/2-cam.x*cam.zoom,height/2-cam.y*cam.zoom);
  ctx.scale(cam.zoom,cam.zoom);
  const minX=cam.x-width/(2*cam.zoom),maxX=cam.x+width/(2*cam.zoom),minY=cam.y-height/(2*cam.zoom),maxY=cam.y+height/(2*cam.zoom);
  this.drawAge(ctx,minX,maxX,minY,maxY,cam.zoom);
  this.drawGrid(ctx,minX,maxX,minY,maxY,cam.zoom);
  this.drawFibres(ctx,minX,maxX,minY,maxY,cam.zoom);
  ctx.restore();
 }

 private drawAge(ctx:CanvasRenderingContext2D,minX:number,maxX:number,minY:number,maxY:number,zoom:number){
  const cell=18,fromX=Math.floor(minX/cell)-1,toX=Math.floor(maxX/cell)+1,fromY=Math.floor(minY/cell)-1,toY=Math.floor(maxY/cell)+1;
  for(let iy=fromY;iy<=toY;iy++)for(let ix=fromX;ix<=toX;ix++){
   if(hashUnit(this.seed,1,ix,iy)>.58)continue;
   const x=(ix+hashUnit(this.seed,2,ix,iy))*cell,y=(iy+hashUnit(this.seed,3,ix,iy))*cell,r=3+hashUnit(this.seed,4,ix,iy)*9;
   const warm=hashUnit(this.seed,5,ix,iy)>.45,g=ctx.createRadialGradient(x,y,0,x,y,r);
   g.addColorStop(0,warm?'rgba(119,79,31,.055)':'rgba(88,104,88,.035)');g.addColorStop(1,'rgba(120,88,40,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  if(zoom>24){
   ctx.globalAlpha=Math.min(.1,(zoom-24)/300);
   const fine=4,fx0=Math.floor(minX/fine)-1,fx1=Math.floor(maxX/fine)+1,fy0=Math.floor(minY/fine)-1,fy1=Math.floor(maxY/fine)+1;
   for(let iy=fy0;iy<=fy1;iy++)for(let ix=fx0;ix<=fx1;ix++)if(hashUnit(this.seed,6,ix,iy)>.86){const x=(ix+hashUnit(this.seed,7,ix,iy))*fine,y=(iy+hashUnit(this.seed,8,ix,iy))*fine,r=.05+hashUnit(this.seed,9,ix,iy)*.16;ctx.fillStyle='#745f3f';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
   ctx.globalAlpha=1;
  }
 }

 private drawGrid(ctx:CanvasRenderingContext2D,minX:number,maxX:number,minY:number,maxY:number,zoom:number){
  const step=.5,minorPx=step*zoom,minorAlpha=Math.max(0,Math.min(.34,(minorPx-5)/18)),startX=Math.floor(minX/step),endX=Math.ceil(maxX/step),startY=Math.floor(minY/step),endY=Math.ceil(maxY/step);
  ctx.beginPath();
  for(let i=startX;i<=endX;i++)if(((i%5)+5)%5!==0){const x=i*step;ctx.moveTo(x,minY);ctx.lineTo(x,maxY)}
  for(let i=startY;i<=endY;i++)if(((i%5)+5)%5!==0){const y=i*step;ctx.moveTo(minX,y);ctx.lineTo(maxX,y)}
  ctx.strokeStyle=`rgba(57,83,78,${minorAlpha})`;ctx.lineWidth=.7/zoom;ctx.stroke();
  ctx.beginPath();
  for(let i=startX;i<=endX;i++)if(((i%5)+5)%5===0){const x=i*step;ctx.moveTo(x,minY);ctx.lineTo(x,maxY)}
  for(let i=startY;i<=endY;i++)if(((i%5)+5)%5===0){const y=i*step;ctx.moveTo(minX,y);ctx.lineTo(maxX,y)}
  ctx.strokeStyle='rgba(49,75,70,.42)';ctx.lineWidth=1.05/zoom;ctx.stroke();
 }

 private drawFibres(ctx:CanvasRenderingContext2D,minX:number,maxX:number,minY:number,maxY:number,zoom:number){
  if(zoom<32)return;
  const cell=3,x0=Math.floor(minX/cell)-1,x1=Math.floor(maxX/cell)+1,y0=Math.floor(minY/cell)-1,y1=Math.floor(maxY/cell)+1;
  ctx.lineWidth=.35/zoom;ctx.strokeStyle='rgba(91,70,43,.16)';ctx.beginPath();
  for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++)if(hashUnit(this.seed,10,ix,iy)>.74){const x=(ix+hashUnit(this.seed,11,ix,iy))*cell,y=(iy+hashUnit(this.seed,12,ix,iy))*cell,len=.2+hashUnit(this.seed,13,ix,iy)*.8,a=(hashUnit(this.seed,14,ix,iy)-.5)*.45;ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len)}
  ctx.stroke();
 }
}
