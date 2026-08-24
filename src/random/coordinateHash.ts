const UINT32=0x1_0000_0000;

function mix(h:number,v:number){
 h^=v>>>0;
 h=Math.imul(h,0x85ebca6b);
 h^=h>>>13;
 h=Math.imul(h,0xc2b2ae35);
 return(h^(h>>>16))>>>0;
}

export function seedHash(seed:string){
 let h=0x811c9dc5;
 for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,0x01000193)}
 return h>>>0;
}

function numberParts(value:number){
 const n=Math.trunc(value),lo=n|0,hi=Math.floor(n/UINT32)|0;
 return[lo,hi] as const;
}

export function coordinateHash(seed:number,layer:number,x:number,y:number,slot=0){
 const[x0,x1]=numberParts(x),[y0,y1]=numberParts(y);
 let h=mix(seed,layer);
 h=mix(h,x0);h=mix(h,x1);h=mix(h,y0);h=mix(h,y1);h=mix(h,slot);
 return h>>>0;
}

export const unitFloat=(hash:number)=>(hash>>>0)/UINT32;
export const signedFloat=(hash:number)=>unitFloat(hash)*2-1;

export function hashUnit(seed:number,layer:number,x:number,y:number,slot=0){
 return unitFloat(coordinateHash(seed,layer,x,y,slot));
}
