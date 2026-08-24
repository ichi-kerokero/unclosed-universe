import './style.css';
import {TilingEngine,type Hat,type Point} from './math/tiling';
import {relativeHatPose} from './math/pose';
import {AudioEngine} from './audio';
import {loadSave,save,type SaveV2} from './persistence';
import {PaperRenderer,type ViewCamera} from './render/paperRenderer';
import {CosmosRenderer,type WorldBounds} from './render/cosmos/cosmosRenderer';
import {drawMathPiece,pieceId,piecePolygon,pieceTexture,type ActivePiece,type PiecePose} from './render/activePieceRenderer';

const WORLD_SEED='unclosed-universe-canonical-2026-01',PIECE_DELAY=5000,OPEN_DURATION=440;
const canvas=document.querySelector<HTMLCanvasElement>('#universe')!,ctx=canvas.getContext('2d')!,undoBtn=document.querySelector<HTMLButtonElement>('#undo')!,resetBtn=document.querySelector<HTMLButtonElement>('#reset')!,soundBtn=document.querySelector<HTMLButtonElement>('#sound')!,message=document.querySelector<HTMLDivElement>('#message')!,hatCount=document.querySelector<HTMLDivElement>('#hat-count')!;
const engine=new TilingEngine(3),audio=new AudioEngine(),paper=new PaperRenderer(),mathTexture=new Image();
mathTexture.decoding='async';mathTexture.src=`${import.meta.env.BASE_URL}assets/cover/opening.png?v=20260823-2`;

const initialHat=engine.hats.get(engine.initialId())!;
let cosmos:CosmosRenderer|undefined,worldSeed=WORLD_SEED,opened=new Set<string>([initialHat.id]),undo:string[]=[],cam:ViewCamera={x:initialHat.center.x,y:initialHat.center.y,zoom:42},drag:PiecePose|undefined,activePiece:ActivePiece|undefined,nextPieceSequence=1,pendingSpawnAt:number|null=null;
let mode:'move'|'rotate'='move',active=false,isTouch=false,pointerStart:Point={x:0,y:0},pointer:Point={x:0,y:0},panning=false,last=pointer,hintElapsed=0,hintTick=0,hint:Hat|undefined,snap:Hat|undefined,dirtySave=0,spawnTimer=0,lastTouchTap=0,raf=0;
const settling=new Map<string,{piece:ActivePiece;start:number}>();

const invalidate=()=>{if(!raf)raf=requestAnimationFrame(draw)};
cosmos=new CosmosRenderer(worldSeed,invalidate);
mathTexture.onload=invalidate;
const world=(q:Point)=>({x:(q.x-canvas.clientWidth/2)/cam.zoom+cam.x,y:(q.y-canvas.clientHeight/2)/cam.zoom+cam.y});
const path=(poly:Point[])=>{const q=new Path2D();poly.forEach((v,i)=>i?q.lineTo(v.x,v.y):q.moveTo(v.x,v.y));q.closePath();return q};
const d2=(a:Point,b:Point)=>(a.x-b.x)**2+(a.y-b.y)**2;
const normAngle=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const visibleBounds=():WorldBounds=>({minX:cam.x-canvas.clientWidth/(2*cam.zoom),maxX:cam.x+canvas.clientWidth/(2*cam.zoom),minY:cam.y-canvas.clientHeight/(2*cam.zoom),maxY:cam.y+canvas.clientHeight/(2*cam.zoom)});
const visibleHat=(h:Hat,b:WorldBounds)=>h.center.x>b.minX-5&&h.center.x<b.maxX+5&&h.center.y>b.minY-5&&h.center.y<b.maxY+5;
const desiredPose=(h:Hat)=>relativeHatPose(engine.hats.get(engine.initialId())!,h);
const dragPolygon=()=>drag?piecePolygon(engine.hats.get(engine.initialId())!,drag):[];
function inside(q:Point,poly:Point[]){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)hit=!hit}return hit}
function partHit(q:Point):'move'|'rotate'|'outside'{const poly=dragPolygon(),radius=(isTouch?30:18)/cam.zoom;if(inside(q,poly))return'move';return poly.some(v=>d2(v,q)<=radius*radius)?'rotate':'outside'}
function nearestFrontier(){let best:Hat|undefined,score=Infinity;if(!drag)return;for(const id of engine.frontier(opened)){const h=engine.hats.get(id)!,pose=desiredPose(h),da=Math.abs(normAngle(pose.angle-drag.angle)),s=d2(h.center,drag)+da*da*2+(pose.mirrored===drag.mirrored?0:.3);if(s<score){score=s;best=h}}return best}
function updateSnap(){snap=nearestFrontier();if(!snap||!drag)return;const pose=desiredPose(snap),positionRadius=isTouch?1.65:1.25,angleRadius=isTouch?.32:.18;if(d2(snap.center,drag)<positionRadius**2&&Math.abs(normAngle(pose.angle-drag.angle))<angleRadius&&pose.mirrored===drag.mirrored){drag.x=snap.center.x;drag.y=snap.center.y;drag.angle=pose.angle}else snap=undefined}

function snapshot():SaveV2{return{schemaVersion:2,mathRuleSetVersion:'hat-htpf-v1',cosmos:{worldSeed,generatorVersion:'cosmos-v1',assetSetVersion:'cosmos-assets-v1',paperVersion:'paper-v1'},openedHatIds:[...opened],undo,camera:cam,audio:{muted:audio.muted,volume:audio.volume},pieces:{activePieceId:activePiece?.id??null,activePieceSequence:activePiece?.sequence??null,nextPieceSequence,textureVersion:'math-piece-v1',activePose:activePiece?{...activePiece.pose}:null,pendingSpawnAt}}}
function persist(){clearTimeout(dirtySave);dirtySave=window.setTimeout(()=>save(snapshot()),180)}
function spawnPosition(){return world({x:Math.max(120,canvas.clientWidth*.78),y:Math.max(160,canvas.clientHeight*.72)})}
function spawnHat(playSound=false){if(activePiece)return;const q=spawnPosition(),sequence=nextPieceSequence++,pose:PiecePose={x:q.x,y:q.y,angle:0,mirrored:false};activePiece={id:pieceId(worldSeed,sequence),sequence,pose,texture:pieceTexture(worldSeed,sequence)};drag=activePiece.pose;pendingSpawnAt=null;mode='move';active=false;hintElapsed=0;hint=undefined;snap=undefined;if(playSound)audio.appears();persist();invalidate()}
function armSpawn(){clearTimeout(spawnTimer);if(activePiece||pendingSpawnAt===null)return;const delay=Math.max(0,pendingSpawnAt-Date.now());spawnTimer=window.setTimeout(()=>spawnHat(true),delay)}
function reset(){const id=engine.initialId();opened=new Set([id]);undo=[];cam={x:engine.hats.get(id)!.center.x,y:engine.hats.get(id)!.center.y,zoom:42};activePiece=undefined;drag=undefined;nextPieceSequence=1;pendingSpawnAt=Date.now()+PIECE_DELAY;hint=undefined;snap=undefined;settling.clear();armSpawn();persist();invalidate()}
function keepActiveVisible(){if(!activePiece)return false;const sx=(activePiece.pose.x-cam.x)*cam.zoom+canvas.clientWidth/2,sy=(activePiece.pose.y-cam.y)*cam.zoom+canvas.clientHeight/2,margin=60;if(sx>=margin&&sx<=canvas.clientWidth-margin&&sy>=margin&&sy<=canvas.clientHeight-margin)return false;const q=spawnPosition();activePiece.pose.x=q.x;activePiece.pose.y=q.y;snap=undefined;hint=undefined;return true}
function resize(){const d=Math.min(2,devicePixelRatio||1),rect=canvas.getBoundingClientRect();canvas.width=Math.round(rect.width*d);canvas.height=Math.round(rect.height*d);if(keepActiveVisible())persist();invalidate()}

function addHatToReveal(h:Hat,now:number){
 const animation=settling.get(h.id),k=animation?Math.min(1,(now-animation.start)/OPEN_DURATION):1,ease=1-(1-k)**3;
 if(animation&&k>=1)settling.delete(h.id);
 if(ease>=.999){const hp=h.polygon;hp.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();return}
 ctx.save();ctx.translate(h.center.x,h.center.y);ctx.scale(ease,ease);ctx.translate(-h.center.x,-h.center.y);h.polygon.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.restore();
}

function draw(){
 raf=0;const d=Math.min(2,devicePixelRatio||1),W=canvas.width/d,H=canvas.height/d,now=performance.now(),bounds=visibleBounds(),visibleOpened=[...opened].map(id=>engine.hats.get(id)).filter((h):h is Hat=>!!h&&visibleHat(h,bounds));ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,W,H);paper.draw(ctx,W,H,cam);
 if(active&&drag&&!panning){if(hintTick)hintElapsed+=now-hintTick;hintTick=now;if(!hint&&hintElapsed>=7000)hint=nearestFrontier()}else hintTick=0;
 if(visibleOpened.length&&cosmos){ctx.save();ctx.beginPath();ctx.save();ctx.translate(W/2-cam.x*cam.zoom,H/2-cam.y*cam.zoom);ctx.scale(cam.zoom,cam.zoom);for(const h of visibleOpened)addHatToReveal(h,now);ctx.restore();ctx.clip();ctx.save();ctx.translate(W/2-cam.x*cam.zoom,H/2-cam.y*cam.zoom);ctx.scale(cam.zoom,cam.zoom);cosmos.draw(ctx,bounds,cam);ctx.restore();ctx.restore()}
 ctx.save();ctx.translate(W/2-cam.x*cam.zoom,H/2-cam.y*cam.zoom);ctx.scale(cam.zoom,cam.zoom);for(const{id,piece,start}of[...settling].map(([id,value])=>({id,...value}))){const h=engine.hats.get(id);if(!h)continue;const k=Math.min(1,(now-start)/OPEN_DURATION);drawMathPiece(ctx,engine.hats.get(engine.initialId())!,piece,mathTexture,cam.zoom,{alpha:1-k,shadow:Math.max(0,1-k*4)})}
 ctx.lineWidth=1/cam.zoom;ctx.strokeStyle='rgba(208,225,232,.38)';for(const h of visibleOpened)ctx.stroke(path(h.polygon));
 if(hint){ctx.save();ctx.setLineDash([.14,.12]);ctx.lineWidth=3/cam.zoom;ctx.strokeStyle=drag?.mirrored===desiredPose(hint).mirrored?'#c6e8ff':'#d89043';ctx.fillStyle='rgba(184,223,255,.08)';ctx.fill(path(hint.polygon));ctx.stroke(path(hint.polygon));ctx.restore()}
 if(snap){ctx.lineWidth=3/cam.zoom;ctx.strokeStyle='#f4f0df';ctx.stroke(path(snap.polygon))}
 if(activePiece)drawMathPiece(ctx,engine.hats.get(engine.initialId())!,activePiece,mathTexture,cam.zoom,{shadow:1});ctx.restore();
 if(hint&&drag&&drag.mirrored!==desiredPose(hint).mirrored)message.textContent='ゴーストは正しい鏡像です — ダブルクリック／ダブルタップで反転';else if(activePiece)message.textContent='正しいHatへ近づけると吸着します';else message.textContent='次のHatを待っています';
 hatCount.textContent=`Hat ${opened.size}枚`;undoBtn.disabled=!undo.length;
 if(active||settling.size)invalidate();
}

canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);void audio.start();isTouch=e.pointerType==='touch';pointer={x:e.offsetX,y:e.offsetY};pointerStart=pointer;last=pointer;if(!drag||e.button===1||e.button===2||e.shiftKey){panning=true;active=false;canvas.classList.add('dragging')}else{const hit=partHit(world(pointer));if(hit==='move')mode='move';else if(hit==='rotate')mode='rotate';else{panning=true;active=false;canvas.classList.add('dragging');invalidate();return}active=true;hintTick=performance.now()}invalidate()});
canvas.addEventListener('pointermove',e=>{pointer={x:e.offsetX,y:e.offsetY};if(panning){cam.x-=(pointer.x-last.x)/cam.zoom;cam.y-=(pointer.y-last.y)/cam.zoom;last=pointer;invalidate();return}if(!drag)return;const w=world(pointer);if(!active){const hit=partHit(w);canvas.style.cursor=hit==='rotate'?'crosshair':hit==='move'?'grab':'default';return}if(mode==='move'){drag.x=w.x;drag.y=w.y}else drag.angle=Math.atan2(w.y-drag.y,w.x-drag.x);updateSnap();invalidate()});
canvas.addEventListener('pointerup',e=>{active=false;const wasPan=panning;if(panning){panning=false;canvas.classList.remove('dragging');persist()}if(!wasPan&&snap&&drag&&activePiece){const target=snap,placed:ActivePiece={...activePiece,pose:{...activePiece.pose}};opened.add(target.id);undo.push(target.id);if(undo.length>10)undo.shift();settling.set(target.id,{piece:placed,start:performance.now()});audio.snap();activePiece=undefined;drag=undefined;hint=undefined;snap=undefined;hintElapsed=0;if(opened.size>engine.hats.size*.6)engine.ensureLevel(engine.level+1);pendingSpawnAt=Date.now()+PIECE_DELAY;armSpawn();persist();lastTouchTap=0;invalidate();return}if(e.pointerType==='touch'&&drag&&d2(pointer,pointerStart)<100){const now=performance.now();if(now-lastTouchTap<360){drag.mirrored=!drag.mirrored;updateSnap();lastTouchTap=0}else lastTouchTap=now}persist();invalidate()});
canvas.addEventListener('pointercancel',()=>{active=false;panning=false;canvas.classList.remove('dragging');persist();invalidate()});
canvas.addEventListener('dblclick',e=>{e.preventDefault();if(drag){drag.mirrored=!drag.mirrored;updateSnap();persist();invalidate()}});
canvas.addEventListener('wheel',e=>{e.preventDefault();const before=world({x:e.offsetX,y:e.offsetY});cam.zoom=Math.max(12,Math.min(180,cam.zoom*Math.exp(-e.deltaY*.001)));const after=world({x:e.offsetX,y:e.offsetY});cam.x+=before.x-after.x;cam.y+=before.y-after.y;persist();invalidate()},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
undoBtn.onclick=()=>{const id=undo.pop();if(id){opened.delete(id);settling.delete(id);persist();invalidate()}};
resetBtn.onclick=()=>{if(confirm('宇宙を最初のHat一枚へ戻しますか？'))reset()};
soundBtn.onclick=async()=>{await audio.start();audio.set(!audio.muted);soundBtn.textContent=audio.muted?'音 ×':'音 ♪';persist()};
addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();else{armSpawn();invalidate()}});

function restoreActive(id:string,sequence:number,pose:PiecePose){activePiece={id,sequence,pose,texture:pieceTexture(worldSeed,sequence)};drag=activePiece.pose}

(async()=>{
 const s=await loadSave();
 if(s?.mathRuleSetVersion==='hat-htpf-v1'){
  const max=Math.max(3,...s.openedHatIds.map(id=>Number(id.match(/\/L(\d+)\//)?.[1]??0)));engine.ensureLevel(max);opened=new Set(s.openedHatIds.filter(id=>engine.hats.has(id)));undo=s.undo.filter(id=>opened.has(id)).slice(-10);cam=s.camera;audio.set(s.audio.muted,s.audio.volume);soundBtn.textContent=audio.muted?'音 ×':'音 ♪';
  if(s.schemaVersion===2){worldSeed=s.cosmos.worldSeed||WORLD_SEED;nextPieceSequence=Math.max(1,s.pieces.nextPieceSequence);pendingSpawnAt=s.pieces.pendingSpawnAt;if(s.pieces.activePieceId&&s.pieces.activePieceSequence!==null&&s.pieces.activePose)restoreActive(s.pieces.activePieceId,s.pieces.activePieceSequence,s.pieces.activePose)}
  else{worldSeed=WORLD_SEED;const sequence=Math.max(1,opened.size);nextPieceSequence=sequence+1;const q=spawnPosition();restoreActive(pieceId(worldSeed,sequence),sequence,{x:q.x,y:q.y,angle:0,mirrored:false})}
 }
 cosmos=new CosmosRenderer(worldSeed,invalidate);
 if(!opened.size)reset();else{if(!activePiece&&pendingSpawnAt===null)pendingSpawnAt=Date.now()+PIECE_DELAY;armSpawn();persist()}
 resize();invalidate();
})();
