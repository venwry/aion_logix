let connectedSnapshot;
function fixedService(){return document.body.dataset.backendUrl||null;}
export function connection(){try{const c=JSON.parse(sessionStorage.getItem('aion-backend')||'null');return fixedService()&&c?.url!==fixedService()?null:c;}catch{return null;}}
// Keep backend diagnostics: a repository or deployment failure is not a rejected access key.
async function fetchState(config){
 let response;
 try{response=await fetch(config.url+'/api/state',{headers:{Authorization:'Bearer '+config.token},cache:'no-store'});}
 catch{throw Error('Cannot reach the saving service. Check that it is running, the URL is correct, and this page origin is allowed by AION_ALLOWED_ORIGINS.');}
 let body;try{body=await response.json();}catch{}
 if(!response.ok){
  if(response.status===401)throw Error('The backend access key was rejected (HTTP 401). Use AION_REVIEW_TOKEN from this Render service, not the GitHub token.');
  const detail=typeof body?.error==='string'?body.error.slice(0,1000):'';
  if(detail)throw Error('Saving service error (HTTP '+response.status+'): '+detail);
  throw Error('Saving service returned HTTP '+response.status+'. '+(response.status>=500?'The service or its upstream dependency is unavailable; check Render logs.':'Check the service URL and deployment configuration.'));
 }
 if(!body||typeof body!=='object'||!body.collections||!Array.isArray(body.changes?.change)||!Array.isArray(body.authorization)||typeof body.revision!=='string')throw Error('The saving service returned an invalid state response (HTTP '+response.status+'). Check the service URL and deployed backend.');
 return body;
}
export function mountConnection(){
 if(document.getElementById('backend-connection'))return;
 const form=document.createElement('form');form.id='backend-connection';form.className='review-toolbar';
 const label=document.createElement('span');label.textContent='Saving service';
 const fixed=fixedService();const url=document.createElement(fixed?'span':'input');
 if(fixed){url.textContent=fixed;url.className='fixed-service-url';}else{url.type='url';url.placeholder='https://your-backend.example';url.setAttribute('aria-label','Backend URL');url.required=true;}
 const key=document.createElement('input');key.type='password';key.placeholder='Backend access key';key.setAttribute('aria-label','Backend access key');key.required=true;key.autocomplete='off';
 const button=document.createElement('button');button.className='quiet-button';button.textContent='Connect';
 const disconnect=document.createElement('button');disconnect.type='button';disconnect.className='quiet-button';disconnect.textContent='Disconnect';
 const status=document.createElement('span');status.setAttribute('role','status');const c=connection();if(!fixed)url.value=c?.url||'';key.value=c?.token||'';status.textContent=c?'Connected service configured':'Read-only until connected';
 form.append(label,url,key,button,disconnect,status);document.querySelector('.app-header').after(form);
 const toggle=document.createElement('button');toggle.type='button';toggle.className='quiet-button saving-service-toggle';toggle.textContent='Saving service';toggle.setAttribute('aria-controls',form.id);
 let hidden=false;try{hidden=localStorage.getItem('aion-saving-service-hidden')==='true';}catch{}
 const visibility=()=>{form.hidden=hidden;toggle.setAttribute('aria-expanded',String(!hidden));};visibility();
 toggle.onclick=()=>{hidden=!hidden;visibility();try{localStorage.setItem('aion-saving-service-hidden',String(hidden));}catch{}};
 document.querySelector('.app-header nav').append(toggle);
 form.onsubmit=async e=>{e.preventDefault();button.disabled=true;status.textContent='Connecting to saving service…';try{const parsed=new URL(fixed||url.value);if(parsed.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))throw Error('Use HTTPS for the backend.');const config={url:parsed.origin,token:key.value};await fetchState(config);sessionStorage.setItem('aion-backend',JSON.stringify(config));location.reload();}catch(error){status.textContent=error.message;button.disabled=false;}};
 disconnect.onclick=()=>{sessionStorage.removeItem('aion-backend');location.reload();};
}
export async function remoteState(){mountConnection();const c=connection();if(!c)return null;if(connectedSnapshot)return connectedSnapshot;try{return connectedSnapshot=await fetchState(c);}catch(error){throw Error(error.message+' Reconnect or disconnect to browse published data.');}}
export async function saveAuthorization(request){
 const c=connection();if(!c)throw Error('Connect to Saving service to save your changes.');
 const uncertain='The saving service connection was interrupted or returned an unreadable response. The commit status is unknown. Your selections remain on this page; retry the same save when the service is ready. Completed decisions will not be committed twice.';
 let r;try{r=await fetch(c.url+'/api/authorize',{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},body:JSON.stringify(request)});}catch{throw Error(uncertain);}
 let body;try{body=await r.json();}catch{throw Error(uncertain+' (HTTP '+r.status+')');}
 if(!r.ok)throw Error(body.error||'Saving failed. Nothing has been marked as saved.');
 connectedSnapshot=body;return body;
}
