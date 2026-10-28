let connectedSnapshot;
export function connection(){try{return JSON.parse(sessionStorage.getItem('aion-backend')||'null');}catch{return null;}}
export function mountConnection(){
 if(document.getElementById('backend-connection'))return;
 const form=document.createElement('form');form.id='backend-connection';form.className='review-toolbar';
 const label=document.createElement('span');label.textContent='Saving service';
 const url=document.createElement('input');url.type='url';url.placeholder='https://your-backend.example';url.setAttribute('aria-label','Backend URL');url.required=true;
 const key=document.createElement('input');key.type='password';key.placeholder='Backend access key';key.setAttribute('aria-label','Backend access key');key.required=true;key.autocomplete='off';
 const button=document.createElement('button');button.className='quiet-button';button.textContent='Connect';
 const disconnect=document.createElement('button');disconnect.type='button';disconnect.className='quiet-button';disconnect.textContent='Disconnect';
 const status=document.createElement('span');status.setAttribute('role','status');const c=connection();url.value=c?.url||'';key.value=c?.token||'';status.textContent=c?'Connected service configured':'Read-only until connected';
 form.append(label,url,key,button,disconnect,status);document.querySelector('.app-header').after(form);
 form.onsubmit=async e=>{e.preventDefault();button.disabled=true;try{const parsed=new URL(url.value);if(parsed.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))throw Error('Use HTTPS for the backend.');const config={url:parsed.origin,token:key.value};const response=await fetch(config.url+'/api/state',{headers:{Authorization:'Bearer '+config.token},cache:'no-store'});if(!response.ok)throw Error('Connection failed. Check the URL and backend access key.');await response.json();sessionStorage.setItem('aion-backend',JSON.stringify(config));location.reload();}catch(error){status.textContent=error.message;button.disabled=false;}};
 disconnect.onclick=()=>{sessionStorage.removeItem('aion-backend');location.reload();};
}
export async function remoteState(){mountConnection();const c=connection();if(!c)return null;if(connectedSnapshot)return connectedSnapshot;const r=await fetch(c.url+'/api/state',{headers:{Authorization:'Bearer '+c.token},cache:'no-store'});if(!r.ok)throw Error('Cannot load the saving service. Reconnect or disconnect to browse published data.');return connectedSnapshot=await r.json();}
export async function saveAuthorization(request){const c=connection();if(!c)throw Error('Connect to the saving service above to authorize and save.');const r=await fetch(c.url+'/api/authorize',{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},body:JSON.stringify(request)});const body=await r.json();if(!r.ok)throw Error(body.error||'Saving failed. Nothing has been marked as saved.');connectedSnapshot=body;return body;}
