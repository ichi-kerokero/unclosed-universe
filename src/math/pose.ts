import type {Hat} from './tiling';

const normAngle=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));

export function relativeHatPose(base:Hat,target:Hat){
 const b=base.T,d=b[0]*b[4]-b[1]*b[3],a00=(target.T[0]*b[4]-target.T[1]*b[3])/d,a10=(target.T[3]*b[4]-target.T[4]*b[3])/d,mirrored=(target.T[0]*target.T[4]-target.T[1]*target.T[3])*d<0;
 return{x:target.center.x,y:target.center.y,angle:normAngle(Math.atan2(mirrored?-a10:a10,mirrored?-a00:a00)),mirrored};
}
