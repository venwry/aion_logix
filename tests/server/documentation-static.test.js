import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createServer} from '../../server/index.js';
test('documentation preview serves calculation guide and JSON read-only without exposing server files',async t=>{
 const server=createServer({store:{},accessToken:'documentation-test-key-123456789'});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base='http://127.0.0.1:'+server.address().port;
 for(const p of ['/data_calculation/README.md','/data_calculation/annual_sales.json','/schemas/calculation/annual_sales.schema.json'])assert.equal((await fetch(base+p)).status,200);
 assert.equal((await fetch(base+'/data_calculation/annual_sales.json',{method:'POST',body:'{}'})).status,405);
 assert.equal((await fetch(base+'/server/index.js')).status,404);
 assert.equal((await fetch(base+'/data_calculation/%2e%2e/server/index.js')).status,404);
});
