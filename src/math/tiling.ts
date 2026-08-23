/*
 * H/T/P/F construction adapted from isohedral/hatviz (Craig S. Kaplan, 2023).
 * BSD 3-Clause license: /public/licenses/hatviz-BSD-3-Clause.txt
 */
export type Point={x:number;y:number};
export type Matrix=[number,number,number,number,number,number];
type Kind='H'|'T'|'P'|'F'|'H1';
type Child={T:Matrix;node:Node;slot:number};
type Node={shape:Point[];children:Child[];kind?:Kind};
export type Hat={id:string;polygon:Point[];T:Matrix;mirrored:boolean;neighbors:Set<string>;center:Point};

const R=Math.sqrt(3),HR=R/2,I:Matrix=[1,0,0,0,1,0];
const p=(x:number,y:number):Point=>({x,y});
const hex=(x:number,y:number)=>p(x+y/2,HR*y);
const add=(a:Point,b:Point)=>p(a.x+b.x,a.y+b.y), sub=(a:Point,b:Point)=>p(a.x-b.x,a.y-b.y);
export const mul=(A:Matrix,B:Matrix):Matrix=>[A[0]*B[0]+A[1]*B[3],A[0]*B[1]+A[1]*B[4],A[0]*B[2]+A[1]*B[5]+A[2],A[3]*B[0]+A[4]*B[3],A[3]*B[1]+A[4]*B[4],A[3]*B[2]+A[4]*B[5]+A[5]];
export const inv=(T:Matrix):Matrix=>{const d=T[0]*T[4]-T[1]*T[3];return [T[4]/d,-T[1]/d,(T[1]*T[5]-T[2]*T[4])/d,-T[3]/d,T[0]/d,(T[2]*T[3]-T[0]*T[5])/d]};
export const tp=(M:Matrix,P:Point)=>p(M[0]*P.x+M[1]*P.y+M[2],M[3]*P.x+M[4]*P.y+M[5]);
const trans=(x:number,y:number):Matrix=>[1,0,x,0,1,y];
const rot=(a:number):Matrix=>[Math.cos(a),-Math.sin(a),0,Math.sin(a),Math.cos(a),0];
const rotAt=(q:Point,a:number)=>mul(trans(q.x,q.y),mul(rot(a),trans(-q.x,-q.y)));
const seg=(a:Point,b:Point):Matrix=>[b.x-a.x,a.y-b.y,a.x,b.y-a.y,b.x-a.x,a.y];
const match=(a:Point,b:Point,c:Point,d:Point)=>mul(seg(c,d),inv(seg(a,b)));
const intersect=(a:Point,b:Point,c:Point,d:Point)=>{const z=(d.y-c.y)*(b.x-a.x)-(d.x-c.x)*(b.y-a.y),u=((d.x-c.x)*(a.y-c.y)-(d.y-c.y)*(a.x-c.x))/z;return p(a.x+u*(b.x-a.x),a.y+u*(b.y-a.y))};
const outline=[hex(0,0),hex(-1,-1),hex(0,-2),hex(2,-2),hex(2,-1),hex(4,-2),hex(5,-1),hex(4,0),hex(3,0),hex(2,2),hex(0,3),hex(0,2),hex(-1,2)];
const leaf=(kind:Kind):Node=>({shape:outline,children:[],kind});
const child=(node:Node,T:Matrix,n:Node)=>node.children.push({T,node:n,slot:node.children.length});
const Hhat=leaf('H'),H1hat=leaf('H1'),That=leaf('T'),Phat=leaf('P'),Fhat=leaf('F');

function initials():[Node,Node,Node,Node]{
 const Hs=[p(0,0),p(4,0),p(4.5,HR),p(2.5,5*HR),p(1.5,5*HR),p(-.5,HR)],H:Node={shape:Hs,children:[]};
 child(H,match(outline[5],outline[7],Hs[5],Hs[0]),Hhat);child(H,match(outline[9],outline[11],Hs[1],Hs[2]),Hhat);child(H,match(outline[5],outline[7],Hs[3],Hs[4]),Hhat);child(H,mul(trans(2.5,HR),mul([-.5,-HR,0,HR,-.5,0],[.5,0,0,0,-.5,0])),H1hat);
 const Ts=[p(0,0),p(3,0),p(1.5,3*HR)],T:Node={shape:Ts,children:[]};child(T,[.5,0,.5,0,.5,HR],That);
 const Ps=[p(0,0),p(4,0),p(3,2*HR),p(-1,2*HR)],P:Node={shape:Ps,children:[]};child(P,[.5,0,1.5,0,.5,HR],Phat);child(P,mul(trans(0,2*HR),mul([.5,HR,0,-HR,.5,0],[.5,0,0,0,.5,0])),Phat);
 const Fs=[p(0,0),p(3,0),p(3.5,HR),p(3,2*HR),p(-1,2*HR)],F:Node={shape:Fs,children:[]};child(F,[.5,0,1.5,0,.5,HR],Fhat);child(F,mul(trans(0,2*HR),mul([.5,HR,0,-HR,.5,0],[.5,0,0,0,.5,0])),Fhat);return[H,T,P,F];
}
function patch(nodes:[Node,Node,Node,Node]){const rules:(string|number)[][]=[['H'],[0,0,'P',2],[1,0,'H',2],[2,0,'P',2],[3,0,'H',2],[4,4,'P',2],[0,4,'F',3],[2,4,'F',3],[4,1,3,2,'F',0],[8,3,'H',0],[9,2,'P',0],[10,2,'H',0],[11,4,'P',2],[12,0,'H',2],[13,0,'F',3],[14,2,'F',1],[15,3,'H',4],[8,2,'F',1],[17,3,'H',0],[18,2,'P',0],[19,2,'H',2],[20,4,'F',3],[20,0,'P',2],[22,0,'H',2],[23,4,'F',3],[23,0,'F',3],[16,0,'P',2],[9,4,0,2,'T',2],[4,0,'F',3]],map={H:nodes[0],T:nodes[1],P:nodes[2],F:nodes[3]},q:Node={shape:[],children:[]};
 for(const r of rules){if(r.length===1)child(q,I,map[r[0] as keyof typeof map]);else if(r.length===4){const old=q.children[r[0] as number],poly=old.node.shape,a=tp(old.T,poly[((r[1] as number)+1)%poly.length]),b=tp(old.T,poly[r[1] as number]),nn=map[r[2] as keyof typeof map],np=nn.shape;child(q,match(np[r[3] as number],np[((r[3] as number)+1)%np.length],a,b),nn)}else{const ca=q.children[r[0] as number],cb=q.children[r[2] as number],a=tp(cb.T,cb.node.shape[r[3] as number]),b=tp(ca.T,ca.node.shape[r[1] as number]),nn=map[r[4] as keyof typeof map],np=nn.shape;child(q,match(np[r[5] as number],np[((r[5] as number)+1)%np.length],a,b),nn)}}return q;
}
function recenter(n:Node){let c=n.shape.reduce((a,b)=>add(a,b),p(0,0));c=p(c.x/n.shape.length,c.y/n.shape.length);n.shape=n.shape.map(x=>sub(x,c));const M=trans(-c.x,-c.y);n.children.forEach(x=>x.T=mul(M,x.T));}
function next(q:Node):[Node,Node,Node,Node]{const ev=(n:number,i:number)=>tp(q.children[n].T,q.children[n].node.shape[i]),a=ev(8,2),b=ev(21,2),rb=tp(rotAt(a,-2*Math.PI/3),b),p72=ev(7,2),p252=ev(25,2),ll=intersect(a,rb,ev(6,2),p72);let w=sub(ev(6,2),ll),hs=[ll,a];w=tp(rot(-Math.PI/3),w);hs.push(add(hs[1],w),ev(14,2));w=tp(rot(-Math.PI/3),w);hs.push(sub(hs[3],w),ev(6,2));
 const take=(shape:Point[],ids:number[]):Node=>({shape,children:ids.map((i,slot)=>({...q.children[i],slot}))});const H=take(hs,[0,9,16,27,26,6,1,8,10,15]),P=take([p72,add(p72,sub(a,ll)),a,ll],[7,2,3,4,28]),F=take([b,ev(24,2),ev(25,0),p252,add(p252,sub(ll,a))],[21,20,22,23,24,25]);const A=hs[2],B=add(hs[1],sub(hs[4],hs[5])),C=tp(rotAt(B,-Math.PI/3),A),T=take([B,C,A],[11]);[H,T,P,F].forEach(recenter);return[H,T,P,F];}
const keyT=(T:Matrix)=>T.map(v=>Math.round(v*1e7)).join(',');
function flatten(n:Node,W:Matrix,path:number[],out:{T:Matrix;path:number[]}[]){if(n.kind){out.push({T:W,path});return}for(const c of n.children)flatten(c.node,mul(W,c.T),[...path,c.slot],out)}

export class TilingEngine{
 hats=new Map<string,Hat>(); private geometryIds=new Map<string,string>(); level=0; private nodes=initials(); private W:Matrix=I;
 constructor(level=3){this.ensureLevel(level)}
 ensureLevel(target:number){while(this.level<=target){this.ingest();if(this.level===target)break;const nn=next(patch(this.nodes));this.W=mul(this.W,inv(nn[0].children[0].T));this.nodes=nn;this.level++}this.buildAdjacency()}
 private ingest(){const arr:{T:Matrix;path:number[]}[]=[];flatten(this.nodes[0],this.W,[0],arr);for(const x of arr){const g=keyT(x.T);if(this.geometryIds.has(g))continue;const id=`hat-v1/Hinf/L${this.level}/${x.path.join('.')}`;this.geometryIds.set(g,id);const polygon=outline.map(v=>tp(x.T,v)),center=polygon.reduce((a,b)=>add(a,b),p(0,0));center.x/=polygon.length;center.y/=polygon.length;this.hats.set(id,{id,T:x.T,polygon,center,mirrored:x.T[0]*x.T[4]-x.T[1]*x.T[3]<0,neighbors:new Set})}}
 private buildAdjacency(){for(const h of this.hats.values())h.neighbors.clear();const pieces=new Map<string,{id:string}[]>();for(const h of this.hats.values())for(let i=0;i<h.polygon.length;i++){const a=h.polygon[i],b=h.polygon[(i+1)%h.polygon.length],len=Math.round(Math.hypot(b.x-a.x,b.y-a.y));for(let j=0;j<len;j++){const u=p(a.x+(b.x-a.x)*j/len,a.y+(b.y-a.y)*j/len),v=p(a.x+(b.x-a.x)*(j+1)/len,a.y+(b.y-a.y)*(j+1)/len),ka=`${Math.round(u.x*1e6)},${Math.round(u.y*1e6)}`,kb=`${Math.round(v.x*1e6)},${Math.round(v.y*1e6)}`,k=ka<kb?ka+'|'+kb:kb+'|'+ka;const list=pieces.get(k)??[];list.push({id:h.id});pieces.set(k,list)}}for(const list of pieces.values())if(list.length===2&&list[0].id!==list[1].id){this.hats.get(list[0].id)!.neighbors.add(list[1].id);this.hats.get(list[1].id)!.neighbors.add(list[0].id)}}
 initialId(){return [...this.hats.values()].sort((a,b)=>a.center.x*a.center.x+a.center.y*a.center.y-(b.center.x*b.center.x+b.center.y*b.center.y))[0].id}
 frontier(open:Set<string>){const r=new Set<string>();for(const id of open)for(const n of this.hats.get(id)?.neighbors??[])if(!open.has(n))r.add(n);return r}
}
