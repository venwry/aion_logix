// Emit the same pretty JSON used in repository files without building a second
// archive-sized string. Foundation and storytelling values are plain JSON.
export function* jsonChunks(value, chunkSize=65536) {
 function* tokens(value,depth=0,key='') {
  if(value&&typeof value.toJSON==='function')value=value.toJSON(key);
  if(value&&typeof value==='object'){
   const array=Array.isArray(value);
   const keys=array?Array.from({length:value.length},(_,i)=>String(i)):Object.keys(value).filter(k=>!['undefined','function','symbol'].includes(typeof value[k]));
   yield array?'[':'{';
   for(let i=0;i<keys.length;i++){
    const k=keys[i];yield (i?',\n':'\n')+'  '.repeat(depth+1);
    if(!array)yield JSON.stringify(k)+': ';
    yield* tokens(value[k],depth+1,k);
   }
   if(keys.length)yield '\n'+'  '.repeat(depth);
   yield array?']':'}';
  }else yield JSON.stringify(value)??'null';
 }
 let buffer='';
 for(const token of tokens(value)){
  buffer+=token;
  while(buffer.length>=chunkSize){yield buffer.slice(0,chunkSize);buffer=buffer.slice(chunkSize);}
 }
 if(buffer)yield buffer;
 yield '\n';
}

// GitHub's blob API accepts a JSON string containing the file. Escape one chunk
// at a time rather than JSON.stringify({content: entireArchive}) in memory.
export function* blobBody(value) {
 yield '{"encoding":"utf-8","content":"';
 for(const chunk of jsonChunks(value))yield JSON.stringify(chunk).slice(1,-1);
 yield '"}';
}
