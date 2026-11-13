import {datasetPath,schemaVersion} from '../code/model-contract.js';
import {names} from './model.js';
import {isDeepStrictEqual} from 'node:util';
import {Readable} from 'node:stream';
import {blobBody} from './json-stream.js';
import crypto from 'node:crypto';
export class GitHubStore {
 constructor({token,repository,branch='main',fetchImpl=fetch}){this.token=token;this.repository=repository;this.branch=branch;this.fetch=fetchImpl;}
 async api(path,method='GET',body,{raw=false}={}){const streaming=body instanceof Readable;const response=await this.fetch('https://api.github.com/repos/'+this.repository+path,{method,headers:{Authorization:'Bearer '+this.token,Accept:raw?'application/vnd.github.raw+json':'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},...(body?{body:streaming?body:JSON.stringify(body),...(streaming?{duplex:'half'}:{})}:{})});if(!response.ok){
   // A 422 can reject a blob, tree or commit; it does not establish a ref race.
   let details;try{details=await response.json();}catch{}
   const refUpdate=method==='PATCH'&&path.startsWith('/git/refs/heads/');
   const message=typeof details?.message==='string'?details.message:'';
   const reasons=Array.isArray(details?.errors)?details.errors.slice(0,3).map(x=>typeof x==='string'?x:[x?.resource,x?.field,x?.code,x?.message].filter(v=>typeof v==='string').join(' ')).join('; ').slice(0,400):'';
   const conflict=refUpdate&&[409,422].includes(response.status)&&/not a fast forward|non.fast.forward|reference update failed|reference has changed/i.test(message);
   const operation=path==='/git/blobs'?'upload repository file':path==='/git/trees'?'create repository tree':path==='/git/commits'?'create save commit':refUpdate?'update branch':'read repository data';
   const e=new Error(conflict?'The branch changed during saving. Reload before trying again.':`GitHub could not ${operation} (HTTP ${response.status})${message?': '+message.slice(0,400):'.'}${reasons?' — '+reasons:''}`);
   e.status=conflict?409:502;throw e;
  }return response.json();}
 async read({includeHistory=true}={}){
  const ref=await this.api('/git/ref/heads/'+encodeURIComponent(this.branch));const revision=ref.object.sha;
  const commit=await this.api('/git/commits/'+revision);const tree=await this.api('/git/trees/'+commit.tree.sha+'?recursive=1');
  if(tree.truncated)throw Error('Repository tree exceeds the supported size.');
  const lookup=new Map(tree.tree.filter(e=>e.type==='blob').map(e=>[e.path,e]));
  const indexPath='data_storytelling/authorization_decision_index.json';const indexed=includeHistory&&lookup.has(indexPath);
  const required=[...names.map(n=>datasetPath(n)),...['authorization','change','manifest','annotation','change_review'].map(n=>'data_storytelling/'+n+'.json'),...(includeHistory?[indexed?indexPath:'data_storytelling/authorization_decision.json']:[])];
  const files={};
  // Sequential reads bound peak JSON response and parsing buffers.
  for(const path of required){const entry=lookup.get(path);if(!entry)throw Error('Missing repository dataset: '+path);files[path]=await this.api('/git/blobs/'+entry.sha,'GET',undefined,{raw:true});}
  if(indexed){
   const rows=files[indexPath]?.authorization_decision_index;
   if(!Array.isArray(rows)||rows.some(r=>!r||typeof r.id!=='string'||typeof r.action!=='string'||typeof r.path!=='string'||!lookup.has(r.path))||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Authorization history index is invalid or references a missing archive.');
   files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
  }
  const manifestVersion=files['data_storytelling/manifest.json']?.manifest?.[0]?.schema_version;
  if(manifestVersion!==schemaVersion)throw Error('Schema version mismatch: repository manifest '+manifestVersion+'; backend '+schemaVersion+'. Update the deployment and manifest together.');
  return {files,revision,tree:commit.tree.sha,indexedHistory:indexed};
 }
 async save(previous,next){
  const tree=[];
  const historyPath='data_storytelling/authorization_decision.json',indexPath='data_storytelling/authorization_decision_index.json';
  if(previous.indexedHistory){
   const old=previous.files[historyPath].authorization_decision, decisions=next[historyPath].authorization_decision;
   if(old.length!==0)throw Error('Indexed history staging must begin empty.');
   if(decisions.length){
    const existing=previous.files[indexPath].authorization_decision_index;
    const added=[];
    for(const decision of decisions){
     const shardPath='data_storytelling/authorization_decisions/'+crypto.randomUUID()+'.json';
     added.push({...Object.fromEntries(['id','action','change_id','proposal_sha256'].filter(k=>Object.hasOwn(decision,k)).map(k=>[k,decision[k]])),path:shardPath});
     const shard=await this.api('/git/blobs','POST',Readable.from(blobBody({authorization_decision:[decision]})));
     tree.push({path:shardPath,mode:'100644',type:'blob',sha:shard.sha});
    }
    const index=await this.api('/git/blobs','POST',Readable.from(blobBody({authorization_decision_index:[...existing,...added]})));
    tree.push({path:indexPath,mode:'100644',type:'blob',sha:index.sha});
   }
  }
  // Compare JSON values without canonicalizing/copying the full audit archive.
  // Upload changed files sequentially; the tree contains only blob SHAs, never
  // another escaped copy of every changed document in one huge request.
  for(const [path,content] of Object.entries(next))if(!(previous.indexedHistory&&(path===historyPath||path===indexPath))&&!isDeepStrictEqual(content,previous.files[path])){
   const blob=await this.api('/git/blobs','POST',Readable.from(blobBody(content)));
   tree.push({path,mode:'100644',type:'blob',sha:blob.sha});
  }
  if(!tree.length)return previous.revision;
  const created=await this.api('/git/trees','POST',{base_tree:previous.tree,tree});
  const commit=await this.api('/git/commits','POST',{message:tree.every(e=>/data_storytelling\/(annotation|change_review)\.json$/.test(e.path))?'Save Aion editorial feedback':'Save Aion review decisions',tree:created.sha,parents:[previous.revision]});
  await this.api('/git/refs/heads/'+encodeURIComponent(this.branch),'PATCH',{sha:commit.sha,force:false});return commit.sha;
 }
}
