export type CameraSave={x:number;y:number;zoom:number};
export type AudioSave={muted:boolean;volume:number};
export type PiecePoseSave={x:number;y:number;angle:number;mirrored:boolean};

export type SaveV1={schemaVersion:1;mathRuleSetVersion:'hat-htpf-v1';openedHatIds:string[];undo:string[];camera:CameraSave;audio:AudioSave};
export type SaveV2={
 schemaVersion:2;
 mathRuleSetVersion:'hat-htpf-v1';
 cosmos:{worldSeed:string;generatorVersion:'cosmos-v1';assetSetVersion:'cosmos-assets-v1';paperVersion:'paper-v1'};
 openedHatIds:string[];
 undo:string[];
 camera:CameraSave;
 audio:AudioSave;
 pieces:{activePieceId:string|null;activePieceSequence:number|null;nextPieceSequence:number;textureVersion:'math-piece-v1';activePose:PiecePoseSave|null;pendingSpawnAt:number|null};
};
export type Save=SaveV1|SaveV2;
const DB='unclosed-universe',STORE='snapshots',KEY='current';
const db=()=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
export async function loadSave(){try{const d=await db();return await new Promise<Save|undefined>((resolve,reject)=>{const tx=d.transaction(STORE),r=tx.objectStore(STORE).get(KEY);r.onsuccess=()=>resolve(r.result as Save|undefined);r.onerror=()=>reject(r.error)})}catch{return undefined}}
export async function save(v:SaveV2){try{const d=await db();await new Promise<void>((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(v,KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}catch{/* Play remains available if storage is blocked. */}}
