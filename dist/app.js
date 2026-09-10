import {chapters,equipment,sources} from './content.js';
import {createWorld} from './world.js';
chapters.forEach((chapter,i)=>{chapter.number=String(i+1).padStart(2,'0');});
let current=0,currentEquipment=null,activeFlow=null;
const nav=document.querySelector('#chapters'),lesson=document.querySelector('#lesson-content');
const icon=(color)=>`<svg viewBox="0 0 80 66" aria-hidden="true"><path d="M10 20 40 4l30 16v31L40 65 10 50Z" fill="${color}" opacity=".25"/><path d="m10 20 30 15 30-15M40 35v30M10 20 40 4l30 16v31L40 65 10 50Z" stroke="${color}" fill="none" stroke-width="2"/><path d="m24 19 16-8 16 8-16 8Z" fill="${color}"/><path d="M18 31v5l14 7v-5Zm0 12v5l14 7v-5ZM49 40v7l7-3v-7Z" fill="${color}"/></svg>`;
const world=createWorld(document.querySelector('#world'),select);
nav.innerHTML=chapters.map((c,i)=>`<button data-chapter="${i}"><span class="nav-number">${String(i+1).padStart(2,'0')}</span>${c.name}<span class="nav-arrow" aria-hidden="true">↗</span></button>`).join('');
nav.addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)showChapter(Number(b.dataset.chapter));});
function render(){const c=chapters[current],e=currentEquipment?equipment[currentEquipment]:null;document.documentElement.style.setProperty('--accent',c.color);nav.querySelectorAll('button').forEach((b,i)=>{if(i===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
document.querySelector('#world-label').textContent=c.number+' / '+(e?e.name:c.id==='overview'?'THE WHOLE SYSTEM':c.name).toUpperCase();
document.querySelector('#chapter-count').textContent=String(current+1).padStart(2,'0')+' / 06';document.querySelector('#previous').disabled=current===0;document.querySelector('#next').disabled=current===chapters.length-1;
lesson.innerHTML=`<div class="lesson-kicker"><span>${e?'EQUIPMENT DETAIL':'A CLOSER LOOK'}</span><span>${c.number} — ${e?'DETAIL':current===0?'START HERE':c.name.toUpperCase()}</span></div>${e?'<button class="back-equipment">← Back to '+c.name+'</button>':''}<div class="lesson-icon">${icon(c.color)}</div><h2>${e?e.name:c.title}</h2><p class="lesson-lead">${e?e.description:c.lead}</p>${e?`<p class="micro-label">WHERE IT FITS</p><p class="equipment-path">${e.path}</p>`:`<p class="micro-label">${current===0?'FIVE SYSTEMS TO EXPLORE':'LOOK INSIDE'}</p><div class="component-list">${c.items.map(id=>`<button data-equipment="${id}" aria-pressed="false">${equipment[id]?.name||chapters.find(v=>v.id===id)?.name||id}<span aria-hidden="true">↗</span></button>`).join('')}</div>`}<div class="insight"><p class="micro-label">${e?'WHY IT MATTERS':c.insight.toUpperCase()}</p><p>${e?e.insight:c.fact}</p></div>${e?.source?`<a class="source-link" href="${e.source}" target="_blank" rel="noreferrer">Read the source ↗</a>`:''}`;
lesson.querySelector('.back-equipment')?.addEventListener('click',()=>showChapter(current));lesson.querySelectorAll('[data-equipment]').forEach(b=>b.onclick=()=>select(b.dataset.equipment));}
function showChapter(i){current=Math.max(0,Math.min(chapters.length-1,i));currentEquipment=null;world.select(chapters[current].id);render();}
function select(id){if(equipment[id]){setFlow(null);current=chapters.findIndex(c=>c.id===equipment[id].chapter);currentEquipment=id;world.select(id);render();}else{const i=chapters.findIndex(c=>c.id===id);if(i>=0)showChapter(i);}}
document.querySelector('#previous').onclick=()=>showChapter(current-1);document.querySelector('#next').onclick=()=>showChapter(current+1);
document.querySelector('#rotate-left').onclick=()=>world.rotate(-1);document.querySelector('#rotate-right').onclick=()=>world.rotate(1);document.querySelector('#reset-view').onclick=()=>world.reset();
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;const motion=document.querySelector('#motion-button');function updateMotion(){motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Play animation':'Pause animation');motion.textContent=paused?'▷':'Ⅱ';world.pause(paused);}motion.onclick=()=>{paused=!paused;updateMotion();};updateMotion();
const captions={power:'Utility → transformer → switchgear → UPS → distribution → server',cooling:'Red = heat transfer. Blue = coolant return. The loops exchange heat at the CDU.',network:'Outside fiber → network switches → rack → server. Traffic travels both ways.'};
function setFlow(id){activeFlow=id;if(id&&currentEquipment)showChapter(0);world.flow(id);document.querySelectorAll('[data-flow]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flow===id)));document.querySelector('#flow-caption').textContent=captions[id]||'Drag to orbit · Scroll to zoom · Click equipment to explore';}
document.querySelectorAll('[data-flow]').forEach(b=>b.onclick=()=>setFlow(activeFlow===b.dataset.flow?null:b.dataset.flow));
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey)return;if(/^[1-6]$/.test(e.key))showChapter(Number(e.key)-1);});
const dialog=document.querySelector('#about-dialog');document.querySelector('#about-button').onclick=()=>dialog.showModal();document.querySelector('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.querySelector('#source-list').innerHTML='<p class="eyebrow">FURTHER READING</p>'+sources.map(s=>`<p><a href="${s.url}" target="_blank" rel="noreferrer">${s.title} ↗</a></p>`).join('');
showChapter(0);setFlow(null);
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tool={name:'explore_datacenter',title:'Explore the datacenter',description:'Select a learning chapter or equipment detail and optionally trace power, heat, or data in the visible datacenter model.',inputSchema:{type:'object',properties:{chapter:{type:'string',enum:chapters.map(c=>c.id)},equipment:{type:'string',enum:Object.keys(equipment)},flow:{type:'string',enum:['power','cooling','network','none']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Expected an object');
    if(Object.keys(input).some(k=>!['chapter','equipment','flow'].includes(k)))throw Error('Unknown option');
    if(input.chapter!==undefined&&!chapters.some(c=>c.id===input.chapter))throw Error('Unknown chapter');
    if(input.equipment!==undefined&&!Object.hasOwn(equipment,input.equipment))throw Error('Unknown equipment');
    if(input.flow!==undefined&&!['power','cooling','network','none'].includes(input.flow))throw Error('Unknown flow');
    if(input.chapter&&input.equipment&&equipment[input.equipment].chapter!==input.chapter)throw Error('Equipment does not belong to this chapter');
    if(input.equipment&&input.flow&&input.flow!=='none')throw Error('Select either equipment detail or a campus flow');
    if(input.chapter)showChapter(chapters.findIndex(c=>c.id===input.chapter));
    if(input.equipment)select(input.equipment);
    if(input.flow!==undefined)setFlow(input.flow==='none'?null:input.flow);
    return {chapter:chapters[current].id,equipment:currentEquipment,flow:activeFlow,title:lesson.querySelector('h2').textContent,graphicsAvailable:!!document.querySelector('#world canvas')};
  }};
  try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
