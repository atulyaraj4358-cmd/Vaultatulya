const $=s=>document.querySelector(s),KEY='inkwell.v1',MAX=10000;
const idb=(m,v)=>new Promise(r=>{try{const q=indexedDB.open('inkwell',1);q.onupgradeneeded=()=>q.result.createObjectStore('k');q.onerror=()=>r();q.onsuccess=()=>{try{const s=q.result.transaction('k',m==='get'?'readonly':'readwrite').objectStore('k'),x=m==='get'?s.get('S'):s.put(v,'S');x.onsuccess=()=>r(x.result);x.onerror=()=>r()}catch(e){r()}}}catch(e){r()}});
const D={paper:'letter',theme:'cream',ink:'',sound:true,profile:'classic',vol:.7,haptic:true,lampOn:true,warm:2700,int:.6,size:110,spread:135,font:20};
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
const lost=!S||!Array.isArray(S.notes);
if(lost)S={s:{},notes:[],cur:null};S.s={...D,...S.s};if(S.s.size>200||S.s.size<60)S.s.size=110;
let tm;const flush=()=>{const v=$('#sv');try{const j=JSON.stringify(S);idb('put',j);localStorage.setItem(KEY,j);if(v)v.textContent='Saved ✓'}catch(e){if(v)v.textContent='Not saved'}},store=()=>{const v=$('#sv');if(v)v.textContent='Saving…';clearTimeout(tm);tm=setTimeout(flush,300)};
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',flush);
const ta=$('#ta'),pg=$('#page'),root=document.documentElement;
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const hs=i=>{const x=Math.sin(i*12.9898+1.3)*43758.5453;return x-Math.floor(x)};
const cur=()=>S.notes.find(n=>n.id===S.cur);
function apply(){const s=S.s;root.dataset.theme=s.theme;root.dataset.paper=s.paper;root.style.setProperty('--inkb',s.ink||'#23201b');s.ink?root.style.setProperty('--ink',s.ink):root.style.removeProperty('--ink');
const t=(s.warm-2200)/4300;root.style.setProperty('--lamp',[255-45*t,170+55*t,90+165*t].map(Math.round).join(','));
root.style.setProperty('--int',s.int);const rp=160*s.size/100,rw=Math.min(rp*Math.tan(s.spread*Math.PI/360),700);[['--mh',rp/2],['--mw',rw*.8]].forEach(([k,v])=>root.style.setProperty(k,v+'px'));root.style.setProperty('--fs',s.font+'px');
$('#dim').style.display=s.lampOn?'block':'none';const dn=s.lampOn?(s.int<.45?1:s.int<.75?2:3):0;document.querySelectorAll('#pod b').forEach((b,i)=>b.classList.toggle('on',i<dn));Snd.cfg(s);pos()}
function bind(id,k,num){const e=$('#'+id),ck=e.type==='checkbox';ck?e.checked=S.s[k]:e.value=S.s[k];
const f=()=>{S.s[k]=ck?e.checked:num?+e.value:e.value;apply();store()};e.addEventListener('input',f);e.addEventListener('change',f)}
[['paper','paper'],['theme','theme'],['ink','ink'],['profile','profile'],['sound','sound'],['haptic','haptic'],['lampOn','lampOn']].forEach(a=>bind(...a));
[['font','font'],['vol','vol'],['warm','warm'],['int','int'],['size','size'],['spread','spread']].forEach(a=>bind(a[0],a[1],1));
let last='';
function render(){const v=ta.value,p=ta.selectionStart,key=v+'|'+p;if(key===last)return;last=key;let o='';
for(let i=0;i<=v.length;i++){if(i===p)o+='<i class="c"></i>';if(i>=v.length)break;const c=v[i];
o+=c==='\n'?'\n':`<b style="transform:translateY(${((hs(i)-.5)*1.6).toFixed(2)}px) rotate(${((hs(i+7)-.5)*1.8).toFixed(2)}deg);opacity:${(.82+hs(i+3)*.18).toFixed(2)}">${esc(c)}</b>`}
pg.innerHTML=o+'\n';const n=v.length,c=$('#cnt');c.textContent=n+' / '+MAX.toLocaleString('en-US').replace(/,/g,' ');c.classList.toggle('full',n>=MAX);pos()}
function pos(){const c=pg.querySelector('.c');if(!c)return;const r=c.getBoundingClientRect(),sr=document.querySelector('.sheet').getBoundingClientRect(),L=$('#lamp').style,y=r.top+S.s.font*.6;
L.setProperty('--ry',y+'px');L.setProperty('--px',Math.min(Math.max(r.left,sr.left+30),sr.right-30)+'px');L.setProperty('--rx',sr.left-8+'px');L.setProperty('--rw0',sr.width+16+'px');
const d=$('#dim').style;d.setProperty('--lx',r.left+'px');d.setProperty('--ly',y+'px')}
let belled=false,lastTop=0;
function bell(){const c=pg.querySelector('.c');if(!c)return;const r=c.getBoundingClientRect(),pr=pg.getBoundingClientRect();
if(Math.abs(r.top-lastTop)>4){belled=false;lastTop=r.top}
if(!belled&&r.left>pr.right-10*S.s.font*.6){belled=true;Snd.play('bell')}}
const buzz=n=>S.s.haptic&&navigator.vibrate&&navigator.vibrate(n);
let tt;const typing=()=>{document.body.classList.add('typing');clearTimeout(tt);tt=setTimeout(()=>document.body.classList.remove('typing'),2500)};
function tap(){const p=$('#tee');p.classList.remove('tap');void p.offsetWidth;p.classList.add('tap')}
ta.addEventListener('beforeinput',e=>{Snd.init();tap();const t=e.inputType;
if(t.startsWith('insert')&&t!=='insertLineBreak'&&t!=='insertParagraph'&&ta.value.length>=MAX&&ta.selectionStart===ta.selectionEnd){Snd.play('full');return}
if(t==='insertLineBreak'||t==='insertParagraph'){Snd.play('ret');buzz(15);belled=false}
else if(t.startsWith('delete')){Snd.play('back');buzz(8)}
else if(t.startsWith('insert')){Snd.play(e.data===' '?'space':'key');buzz(5)}});
ta.addEventListener('input',()=>{const n=cur();n.t=ta.value;n.u=Date.now();store();render();bell();typing();
pg.querySelector('.c')?.scrollIntoView({block:'nearest'});listNotes()});
ta.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();document.execCommand('insertText',false,'    ')}
if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();dl('inkwell.txt',new Blob([ta.value],{type:'text/plain'}))}
if(e.key==='Escape')closeAll()});
document.addEventListener('selectionchange',()=>{if(document.activeElement===ta)render()});
ta.addEventListener('focus',()=>{document.body.classList.remove('nf');render()});ta.addEventListener('blur',()=>document.body.classList.add('nf'));
$('#desk').addEventListener('scroll',pos);addEventListener('resize',pos);
const vv=window.visualViewport,vh=()=>{root.style.setProperty('--vh',(vv?vv.height:innerHeight)+'px');pos()};vv&&vv.addEventListener('resize',vh);vh();
['pointermove','pointerdown'].forEach(ev=>addEventListener(ev,()=>document.body.classList.remove('typing')));
function closeAll(){$('#panel').hidden=true;$('#notes').hidden=true;ta.focus()}
$('#studioB').onclick=()=>{const p=$('#panel');p.hidden=!p.hidden;$('#notes').hidden=true};
$('#boxB').onclick=()=>$('#notesB').click();$('#shareB').onclick=()=>png(1080,1080,'inkwell.png',true);
const pod=$('#pod');let lp;
pod.addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();lp=setTimeout(()=>{lp=0;S.s.lampOn=!S.s.lampOn;$('#lampOn').checked=S.s.lampOn;apply();store();buzz(20)},550)});
['pointerup','pointerleave'].forEach(v=>pod.addEventListener(v,()=>clearTimeout(lp)));
pod.addEventListener('click',()=>{if(lp===0){lp=undefined;return}const n=S.s.int<.45?1:S.s.int<.75?2:3;S.s.int=[.35,.6,.9][n%3];S.s.lampOn=true;$('#lampOn').checked=true;$('#int').value=S.s.int;apply();store();buzz(8)});
pod.addEventListener('contextmenu',e=>e.preventDefault());
function toast(m,undo){const t=$('#toast');t.textContent=m;if(undo){const b=document.createElement('button');b.textContent='Undo';b.onclick=()=>{undo();t.hidden=true};t.append(b)}t.hidden=false;clearTimeout(t._t);t._t=setTimeout(()=>t.hidden=true,5000)}
function dl(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
const O=['The last thing I remember is','Nobody warned me that','Dear stranger, I need you to know','It started the night','Somewhere between midnight and morning,','If I could tell you one thing, it is that','The letter I never sent says','Tonight the quiet feels like','I keep coming back to the day','On the train home I realised','My grandmother once told me','Before the rain started,'];
const E=[' the window was open.',' nothing was ever lost.',' every clock had stopped.',' I was finally honest.',' the city held its breath.',' the coffee went cold.',' we both pretended not to know.',' the light was perfect.',' I forgot my own name.',' everything felt possible.'];
$('#spark').onclick=()=>{const l=O[Math.random()*12|0]+E[Math.random()*10|0],v=ta.value,add=(v&&!v.endsWith('\n')?'\n':'')+l;
ta.value=(v+add).slice(0,MAX);ta.dispatchEvent(new Event('input'));$('#panel').hidden=true;ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length)};
$('#save').onclick=()=>{clearTimeout(tm);flush();toast('Saved on this device')};
$('#billT').onclick=()=>{const w=28,l=c=>c.repeat(w),t="ATULYA'S INKWELL",d=new Date().toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
const txt=[l('='),' '.repeat((w-t.length)>>1)+t,l('='),'DATE: '+d,l('-'),'ITEM'.padEnd(16)+'QTY'.padEnd(6)+'PRICE',l('-'),''].join('\n'),v=ta.value;
S.s.paper='bill';$('#paper').value='bill';apply();ta.value=((v&&!v.endsWith('\n')?v+'\n':v)+txt).slice(0,MAX);ta.dispatchEvent(new Event('input'));$('#panel').hidden=true;ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length)};
$('#copy').onclick=()=>navigator.clipboard.writeText(ta.value).then(()=>toast('Copied'),()=>toast('Copy failed'));
$('#txt').onclick=()=>dl('inkwell.txt',new Blob([ta.value],{type:'text/plain'}));
function png(w,h,name,share){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d'),cs=getComputedStyle(root),fs=w/30,m=w*.1;
const bill=S.s.paper==='bill';x.fillStyle=bill?'#f7f5ee':cs.getPropertyValue('--paper').trim();x.fillRect(0,0,w,h);x.fillStyle=bill?(S.s.ink||'#23201b'):cs.getPropertyValue('--ink').trim();x.font=fs+'px "Courier New",monospace';
const cols=Math.floor((w-2*m)/(fs*.6));let y=m+fs;const draw=l=>{if(y<h-m)x.fillText(l.trimEnd(),m,y);y+=fs*1.55};
for(const para of ta.value.split('\n')){let line='';for(const wd of para.split(' ')){if((line+wd).length>cols&&line){draw(line);line=''}line+=wd+' '}draw(line)}
cv.toBlob(b=>{if(share&&navigator.canShare){const f=new File([b],name,{type:'image/png'});if(navigator.canShare({files:[f]}))return navigator.share({files:[f]}).catch(()=>{})}dl(name,b)})}
$('#png').onclick=()=>png(1080,1080,'inkwell.png');$('#story').onclick=()=>png(1080,1920,'inkwell-story.png');
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{let s=$('#pgs');if(!s){s=document.createElement('style');s.id='pgs';document.head.append(s)}
s.textContent=`@page{size:${b.dataset.p==='Letter'?'8.5in 11in':b.dataset.p};margin:20mm}`;$('#panel').hidden=true;setTimeout(print,50)});
$('#bak').onclick=()=>dl('inkwell-backup.json',new Blob([JSON.stringify(S)],{type:'application/json'}));
$('#imp').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;const t=await f.text();let ok=false;
try{const j=JSON.parse(t);if(Array.isArray(j.notes)){j.notes.forEach((n,i)=>S.notes.push({id:Date.now()+i,t:String(n.t||'').slice(0,MAX),u:n.u||Date.now()}));ok=true}}catch(_){}
if(!ok)S.notes.push({id:Date.now(),t:t.slice(0,MAX),u:Date.now()});S.cur=S.notes[S.notes.length-1].id;openNote(S.cur);toast('Imported');e.target.value=''};
function newNote(){const n={id:Date.now(),t:'',u:Date.now()};S.notes.push(n);openNote(n.id)}
function openNote(id){S.cur=id;ta.value=cur().t;last='';render();listNotes();store();$('#notes').hidden=true;ta.focus()}
function listNotes(){const q=$('#q').value.toLowerCase(),ul=$('#nl');ul.innerHTML='';
[...S.notes].sort((a,b)=>b.u-a.u).filter(n=>n.t.toLowerCase().includes(q)).forEach(n=>{const li=document.createElement('li');if(n.id===S.cur)li.className='on';
const b=document.createElement('button'),d=document.createElement('button');b.innerHTML='<span></span><small></small>';
b.firstChild.textContent=(n.t.split('\n')[0]||'Untitled').slice(0,40);b.lastChild.textContent=new Date(n.u).toLocaleString();b.onclick=()=>openNote(n.id);
d.textContent='×';d.setAttribute('aria-label','Delete note');d.onclick=()=>{const i=S.notes.indexOf(n);S.notes.splice(i,1);if(!S.notes.length)newNote();else if(S.cur===n.id)openNote(S.notes[0].id);store();listNotes();
toast('Note deleted',()=>{S.notes.splice(i,0,n);openNote(n.id)})};li.append(b,d);ul.append(li)})}
$('#notesB').onclick=()=>{$('#panel').hidden=true;$('#notes').hidden=false;listNotes()};$('#nx').onclick=closeAll;$('#nn').onclick=newNote;$('#q').oninput=listNotes;
if(!cur()){S.notes.length?S.cur=S.notes[0].id:newNote()}ta.value=cur().t;apply();render();listNotes();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');
if(lost)idb('get').then(j=>{try{if(j&&Array.isArray(JSON.parse(j).notes)){localStorage.setItem(KEY,j);location.reload()}}catch(e){}});
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
