import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hash,records,transact} from '../../server/model.js';
import {createServer} from '../../server/index.js';
function fixture(){
 const files={};for(const dir of ['data_foundation','data_storytelling'])for(const f of fs.readdirSync(dir).filter(n=>n.endsWith('.json')))files[dir+'/'+f]=JSON.parse(fs.readFileSync(dir+'/'+f));
 const selected=records(files).slice(0,3);files['data_storytelling/authorization.json'].authorization=files['data_storytelling/authorization.json'].authorization.filter(a=>!selected.some(r=>r.id===a.record_id));
 return {files,request:{action:'authorize_records',records:selected.map(r=>({record_id:r.id,content_sha256:hash(r)}))}};
}
test('batch authorizes exact content with one decision and is idempotent',()=>{
 const {files,request}=fixture(),before=structuredClone(files),result=transact(files,request);
 assert.deepEqual(files,before);assert.equal(result.files['data_storytelling/authorization_decision.json'].authorization_decision.length,files['data_storytelling/authorization_decision.json'].authorization_decision.length+1);
 assert.equal(result.files['data_storytelling/authorization_decision.json'].authorization_decision.at(-1).target.length,3);
 for(const selected of request.records)assert(result.files['data_storytelling/authorization.json'].authorization.some(a=>a.record_id===selected.record_id&&a.state==='authorized'&&a.content_sha256===selected.content_sha256));
 assert.equal(transact(result.files,request).changed,false);
});
test('one stale selection rejects all; empty and duplicate batches rejected',()=>{
 const {files,request}=fixture(),before=structuredClone(files);request.records[2].content_sha256='0'.repeat(64);
 assert.throws(()=>transact(files,request),/changed/);assert.deepEqual(files,before);
 assert.throws(()=>transact(files,{action:'authorize_records',records:[]}),/Select/);
 assert.throws(()=>transact(files,{action:'authorize_records',records:[request.records[0],request.records[0]]}),/duplicate/);
});
test('HTTP batch persists once and never persists a stale batch',async()=>{
 const {files,request}=fixture();let current=files,saves=0;const token='batch-test-access-key-at-least-24';
 const server=createServer({accessToken:token,store:{read:async()=>({files:current,revision:'before'}),save:async(previous,next)=>{saves++;current=next;return 'onecommit';}}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const send=()=>fetch('http://127.0.0.1:'+server.address().port+'/api/authorize',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(request)});
 try{let response=await send();assert.equal(response.status,200);assert.equal((await response.json()).revision,'onecommit');assert.equal(saves,1);request.records[1].content_sha256='0'.repeat(64);response=await send();assert.equal(response.status,409);assert.equal(saves,1);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
