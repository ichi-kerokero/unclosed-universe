import {describe,expect,it} from 'vitest';
import {coordinateHash,hashUnit,seedHash} from '../src/random/coordinateHash';
import {cosmosEvents} from '../src/render/cosmos/cosmosRenderer';
import {pieceId,pieceTexture} from '../src/render/activePieceRenderer';

describe('deterministic world field',()=>{
 it('is stable for positive, negative, and large safe coordinates',()=>{const seed=seedHash('world');for(const [x,y] of [[0,0],[-17,29],[2**34+7,-(2**35)+3]])expect(coordinateHash(seed,4,x,y,2)).toBe(coordinateHash(seed,4,x,y,2))});
 it('does not collapse high coordinate bits',()=>{const seed=seedHash('world');expect(coordinateHash(seed,1,5,9)).not.toBe(coordinateHash(seed,1,2**32+5,9));expect(hashUnit(seed,2,-1,-1)).toBeGreaterThanOrEqual(0)});
 it('returns the same events when overlapping world queries see them',()=>{const a=cosmosEvents('shared',{minX:-500,maxX:500,minY:-500,maxY:500}),event=a.find(e=>e.id!=='canonical-origin')!;const b=cosmosEvents('shared',{minX:event.x-event.width,maxX:event.x+event.width,minY:event.y-event.height,maxY:event.y+event.height});expect(b.find(e=>e.id===event.id)).toEqual(event);expect(a.find(e=>e.id==='canonical-origin')).toEqual(cosmosEvents('shared',{minX:-1,maxX:20,minY:-1,maxY:20}).find(e=>e.id==='canonical-origin'))});
});

describe('active piece identity',()=>{
 it('is stable by sequence and independent of a destination Hat',()=>{expect(pieceId('shared',12)).toBe(pieceId('shared',12));expect(pieceTexture('shared',12)).toEqual(pieceTexture('shared',12));expect(pieceId('shared',12)).not.toBe(pieceId('shared',13))});
});
