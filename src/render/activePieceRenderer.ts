import type {Hat,Point} from '../math/tiling';
import {hashUnit,seedHash} from '../random/coordinateHash';

export type PiecePose={x:number;y:number;angle:number;mirrored:boolean};
export type PieceTextureSpec={u:number;v:number;scale:number};
export type ActivePiece={id:string;sequence:number;pose:PiecePose;texture:PieceTextureSpec};

export function pieceId(worldSeed:string,sequence:number){return`piece-v1/${sequence}/${seedHash(`${worldSeed}/${sequence}`).toString(16).padStart(8,'0')}`}
export function pieceTexture(worldSeed:string,sequence:number):PieceTextureSpec{
 const seed=seedHash(`${worldSeed}/math-piece-v1`);
 return{u:hashUnit(seed,1,sequence,0),v:hashUnit(seed,2,sequence,0),scale:.34+hashUnit(seed,3,sequence,0)*.3};
}

export function localHat(base:Hat){return base.polygon.map(v=>({x:v.x-base.center.x,y:v.y-base.center.y}))}
export function piecePolygon(base:Hat,pose:PiecePose){
 const c=Math.cos(pose.angle),s=Math.sin(pose.angle),flip=pose.mirrored?-1:1;
 return localHat(base).map(v=>{const x=v.x*flip;return{x:pose.x+c*x-s*v.y,y:pose.y+s*x+c*v.y}});
}

function path(points:Point[]){const p=new Path2D();points.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));p.closePath();return p}

export function drawMathPiece(ctx:CanvasRenderingContext2D,base:Hat,piece:ActivePiece,image:HTMLImageElement,zoom:number,options:{alpha?:number;shadow?:number}={}){
 const local=localHat(base),shape=path(local),minX=Math.min(...local.map(p=>p.x)),maxX=Math.max(...local.map(p=>p.x)),minY=Math.min(...local.map(p=>p.y)),maxY=Math.max(...local.map(p=>p.y)),w=maxX-minX,h=maxY-minY;
 ctx.save();ctx.globalAlpha=options.alpha??1;ctx.translate(piece.pose.x,piece.pose.y);ctx.rotate(piece.pose.angle);ctx.scale(piece.pose.mirrored?-1:1,1);
 const shadow=options.shadow??1;
 if(shadow>0){ctx.save();ctx.shadowColor=`rgba(37,29,18,${.36*shadow})`;ctx.shadowBlur=11;ctx.shadowOffsetX=3;ctx.shadowOffsetY=5;ctx.fillStyle='#d6c69f';ctx.fill(shape);ctx.restore()}
 ctx.save();ctx.clip(shape);ctx.fillStyle='#d6c69f';ctx.fillRect(minX,minY,w,h);
 if(image.complete&&image.naturalWidth){
  const aspect=w/h,cropW=image.naturalWidth*piece.texture.scale,cropH=Math.min(image.naturalHeight*piece.texture.scale,cropW/aspect),finalW=Math.min(cropW,cropH*aspect),sx=piece.texture.u*Math.max(0,image.naturalWidth-finalW),sy=piece.texture.v*Math.max(0,image.naturalHeight-cropH);
  ctx.drawImage(image,sx,sy,finalW,cropH,minX,minY,w,h);
 }
 ctx.restore();ctx.strokeStyle='rgba(70,60,43,.62)';ctx.lineWidth=1.15/zoom;ctx.stroke(shape);ctx.restore();
}
