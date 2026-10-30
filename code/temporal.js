// Calendar precision is retained when an event is used as a process boundary.
export function resolvePoint(point,index){
 if(!point||point.precision==='unknown')return null;
 if(point.precision==='event')return index.get(point.value)?.time||null;
 return point;
}
export function pointBounds(point,index=new Map()){
 const p=resolvePoint(point,index);if(!p||typeof p.value!=='string')return null;
 const [year,month,day]=p.value.split('-').map(Number);const start=Date.UTC(year,(month||1)-1,day||1);
 const end=p.precision==='day'?Date.UTC(year,month-1,day+1)-1:p.precision==='month'?Date.UTC(year,month,1)-1:Date.UTC(year+1,0,1)-1;
 return {start,end,startLabel:p.value,endLabel:p.value,precision:p.precision};
}
