import {describe,expect,it} from 'vitest';
import {TilingEngine} from '../src/math/tiling';
import {relativeHatPose} from '../src/math/pose';
import {piecePolygon} from '../src/render/activePieceRenderer';

describe('H/T/P/F direct-limit patch',()=>{
 it('keeps every existing Hat ID stable when the root expands',()=>{const e=new TilingEngine(2),before=[...e.hats].map(([id,h])=>[id,h.T] as const);e.ensureLevel(3);for(const [id,T] of before)expect(e.hats.get(id)?.T).toEqual(T)});
 it('has a nonempty edge frontier around the initial Hat',()=>{const e=new TilingEngine(2),id=e.initialId(),f=e.frontier(new Set([id]));expect(f.size).toBeGreaterThan(0);for(const n of f)expect(e.hats.get(id)?.neighbors.has(n)).toBe(true)});
 it('uses path-derived, versioned IDs without duplicates',()=>{const e=new TilingEngine(3),ids=[...e.hats.keys()];expect(new Set(ids).size).toBe(ids.length);expect(ids.every(id=>id.startsWith('hat-v1/Hinf/L'))).toBe(true)});
 it('reconstructs every normal and mirrored target pose exactly',()=>{const e=new TilingEngine(3),base=e.hats.get(e.initialId())!;for(const target of e.hats.values()){const poly=piecePolygon(base,relativeHatPose(base,target));for(let i=0;i<poly.length;i++)expect(Math.hypot(poly[i].x-target.polygon[i].x,poly[i].y-target.polygon[i].y)).toBeLessThan(1e-10)}});
});
