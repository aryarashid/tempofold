import {CATEGORIES, EXAMPLES, MAX_IMPORT_BYTES, clone, validateAgenda, parseAgenda, totalSeconds, idleSession, startSession, elapsed, togglePause, nextBlock, forecast, recoveryPlan, applyRecovery, validateSession} from './core.js';

const $ = id => document.getElementById(id);
const KEY = 'tempofold.v1';
let agenda = clone(EXAMPLES[1]);
let session = idleSession();
let undo = null;
let preview = null;
let editing = null;
let confirmAction = null;
let blocked = false;
let conflict = false;
let rawSaved = null;
let persistenceError = '';
try {
  rawSaved = localStorage.getItem(KEY);
  if (rawSaved) {
    const saved = JSON.parse(rawSaved);
    agenda = validateAgenda(saved.agenda);
    session = validateSession(saved.session, agenda);
    if (saved.undo) undo = validateAgenda(saved.undo);
  }
} catch (error) {
  blocked = true;
  agenda = clone(EXAMPLES[1]);
  session = idleSession();
  persistenceError = `Saved work could not be restored. ${error.message} An example is shown. Saving is paused so the saved data stays intact.`;
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(text, action, className='quiet') {
  const node = element('button',text,className);
  node.type = 'button';
  node.addEventListener('click',action);
  return node;
}
function announce(message) {
  $('notice').replaceChildren(element('span',message));
  $('notice').hidden = false;
}
function canChange() {
  if (conflict) { announce('Another tab changed the saved workshop. Export your current agenda, then reload this tab before making changes.'); return false; }
  return true;
}
function save() {
  if (blocked || conflict) { $('save-status').textContent = 'Saving paused'; return; }
  try {
    localStorage.setItem(KEY, JSON.stringify({agenda,session,undo}));
    $('save-status').textContent = 'Saved on this device';
  } catch {
    $('save-status').textContent = 'Not saved. Export a backup.';
    announce('Your browser could not save this work. Keep this tab open and export JSON to back up your agenda.');
  }
}
function download(text, name, type='application/json') {
  const url = URL.createObjectURL(new Blob([text],{type}));
  const link = element('a');
  link.href = url; link.download = name; link.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function duration(seconds) {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole/60), rest = whole%60;
  return rest ? `${minutes ? `${minutes}m ` : ''}${rest}s` : `${minutes} min`;
}
function countdown(seconds) {
  const value = Math.ceil(Math.abs(seconds));
  const h = Math.floor(value/3600), m=Math.floor((value%3600)/60), s=value%60;
  return `${h ? `${h}:` : ''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function clock(timestamp) { return new Date(timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
function plannedClock(offset) {
  const [h,m]=agenda.startTime.split(':').map(Number);
  const seconds=h*3600+m*60+offset;
  return `${String(Math.floor(seconds/3600)%24).padStart(2,'0')}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}${seconds>=86400 ? ' +1 day' : ''}`;
}
const active = () => ['running','paused'].includes(session.state);

function render() {
  $('agenda-title').textContent = agenda.title;
  $('agenda-meta').textContent = `${duration(totalSeconds(agenda))} planned · ${agenda.blocks.length} blocks · Run sheet starts ${agenda.startTime}`;
  $('edit-agenda').disabled = session.state !== 'idle';
  $('add-block').disabled = session.state !== 'idle' || agenda.blocks.length >= 100;
  $('edit-hint').textContent = session.state === 'idle' ? 'Edit the agenda before starting. Changes save automatically on this device.' : 'The agenda is locked during a session. Reset the timer to edit. Recovery can still adjust future flexible blocks.';
  $('blocks').replaceChildren();
  $('time-rail').replaceChildren();
  let offset=0;
  agenda.blocks.forEach((block,index)=>{
    const rail = element('span',undefined,block.protected ? 'rail-protected' : 'rail-flex');
    rail.style.flexGrow=String(block.duration);
    rail.title=block.title;
    $('time-rail').append(rail);
    const item=element('li',undefined,'block');
    if(active() && session.index === index) { item.classList.add('is-current'); item.setAttribute('aria-current','step'); }
    if((active() && index<session.index) || session.state==='finished') item.classList.add('is-complete');
    const time=element('div',undefined,'block-time');
    time.append(element('span',plannedClock(offset)),element('strong',duration(block.duration)));
    offset+=block.duration;
    const body=element('div',undefined,'block-body');
    const meta=element('div',undefined,'block-meta');
    meta.append(element('span',block.category),element('span',block.protected ? 'Protected' : `Flexible · min ${duration(block.minimum)}`,block.protected?'protection protected':'protection flexible'));
    if(item.classList.contains('is-complete')) meta.append(element('span','Completed','completed-label'));
    if(item.classList.contains('is-current')) meta.append(element('span','Current','current-marker'));
    body.append(meta,element('h3',block.title));
    if(block.notes) body.append(element('p',block.notes,'block-notes'));
    if(!block.protected) { const flex=element('div',undefined,'flex-capacity'); const min=element('span'); min.style.width=`${block.minimum/block.duration*100}%`; flex.append(min); flex.setAttribute('aria-hidden','true'); body.append(flex); }
    const actions=element('div',undefined,'block-actions');
    const edit=button('Edit',()=>openBlock(index)); edit.setAttribute('aria-label',`Edit ${block.title}`);
    const up=button('↑',()=>moveBlock(index,-1),'icon-button'); up.setAttribute('aria-label',`Move ${block.title} up`);
    const down=button('↓',()=>moveBlock(index,1),'icon-button'); down.setAttribute('aria-label',`Move ${block.title} down`);
    const remove=button('Remove',()=>ask('Remove this block?',`“${block.title}” will be removed. You can export the agenda first to keep a backup.`,()=>{agenda.blocks.splice(index,1); undo=null; save(); render();},'Remove block'));
    remove.setAttribute('aria-label',`Remove ${block.title}`);
    for (const b of [edit,up,down,remove]) b.disabled=session.state!=='idle';
    up.disabled ||= index===0; down.disabled ||= index===agenda.blocks.length-1; remove.disabled ||= agenda.blocks.length===1;
    actions.append(edit,up,down,remove);
    item.append(time,body,actions); $('blocks').append(item);
  });
  $('undo').hidden = !undo;
  $('rehearse').hidden = session.state !== 'idle';
  $('reset-session').hidden = session.state === 'idle';
  $('next').hidden = !active();
  $('next').textContent = session.index === agenda.blocks.length-1 ? 'Finish workshop' : 'Next block';
  $('start-pause').hidden=session.state==='finished';
  $('start-pause').textContent=session.state==='idle'?'Start workshop':session.state==='running'?'Pause timer':'Resume timer';
  $('recover').disabled=session.state==='finished';
  renderTimer(); renderPrint();
}

function renderTimer() {
  const now=Date.now();
  const current=agenda.blocks[session.index];
  const left=current.duration-elapsed(session,now)/1000;
  const over=active() && left<0;
  $('session-state').textContent={idle:'Ready',running:'Running',paused:'Paused',finished:'Finished'}[session.state];
  $('current-label').textContent=session.state==='finished'?'Workshop complete':`${session.state==='idle'?'First':'Current'} · ${current.title}`;
  $('countdown').textContent=session.state==='finished'?'Done':`${over?'+':''}${countdown(left)}`;
  $('countdown').classList.toggle('is-over',over);
  $('timer-caption').textContent=session.state==='finished'?'Your ending has its moment.':over?'Overtime on this block':session.state==='paused'?'Block timer paused':'Remaining in this block';
  $('timer-progress').style.width=`${session.state==='finished'?100:Math.min(100,elapsed(session,now)/1000/current.duration*100)}%`;
  $('timer-notes').textContent=session.state==='finished'?'Reset the timer to rehearse again. Export your agenda to keep any recovery adjustments.':current.notes;
  const f=forecast(agenda,session,now);
  $('target-finish').textContent=session.state==='idle'?'Set when started':clock(session.endAt);
  $('projected-finish').textContent=f.finish?clock(f.finish):'Set when started';
  let status='Start sets the finish target. Run-sheet times are a planning guide.';
  if(session.state!=='idle') {
    const diff=Math.round(f.overtime);
    status=diff>0?`${duration(diff)} ${session.state==='finished'?'finished after':'behind'} target`:diff<0?`${duration(-diff)} ${session.state==='finished'?'finished before':'ahead of'} target`:'On target';
  }
  $('timing-status').textContent=status;
  $('timing-status').classList.toggle('late',f.overtime>=1);
  $('pause-note').hidden=session.state!=='paused';
  if(active() && now<session.anchor) $('timing-status').textContent='Device clock moved backward. Check the clock before trusting finish projections.';
}

function renderPrint() {
  const sheet=$('print-sheet'); sheet.replaceChildren(element('h1',agenda.title));
  sheet.append(element('p',`TempoFold facilitator run sheet · ${duration(totalSeconds(agenda))} · Planned start ${agenda.startTime}`));
  if(session.state!=='idle') sheet.append(element('p','Run sheet uses the current agenda durations. Live timer history is not included.'));
  let offset=0;
  for(const block of agenda.blocks) {
    const row=element('section',undefined,'print-block');
    row.append(element('h2',`${plannedClock(offset)} · ${block.title}`),element('p',`${duration(block.duration)} · ${block.category} · ${block.protected?'Protected':`Flexible, minimum ${duration(block.minimum)}`}`),element('p',block.notes));
    offset+=block.duration; sheet.append(row);
  }
  sheet.append(element('p',`Planned finish ${plannedClock(offset)}. Protected blocks keep their duration. Flexible blocks require a reviewed recovery plan before shortening.`));
}

function field(label,name,type,value,options={}) {
  const wrap=element('label',label,'field');
  const input=element(type==='textarea'?'textarea':type==='select'?'select':'input');
  input.name=name; input.id=`edit-${name}`;
  if(type==='select') for(const option of CATEGORIES) { const item=element('option',option); item.value=option; input.append(item); }
  else if(type!=='textarea') input.type=type;
  if(type==='checkbox') input.checked=value; else input.value=value;
  for(const [key,val] of Object.entries(options)) input.setAttribute(key,String(val));
  wrap.append(input); return wrap;
}
function openBlock(index) {
  if(!canChange() || session.state!=='idle') return;
  editing=index;
  const b=index===-1?{title:'',category:'Activity',duration:300,minimum:180,protected:false,notes:''}:agenda.blocks[index];
  $('editor-heading').textContent=index===-1?'Add a block':'Edit block';
  $('editor-fields').replaceChildren(field('Block title','title','text',b.title,{required:true,maxlength:120}),field('Category','category','select',b.category),field('Duration in minutes','duration','number',b.duration/60,{required:true,min:1/60,max:240,step:'any',inputmode:'decimal'}),field('Minimum in minutes','minimum','number',b.minimum/60,{required:true,min:1/60,max:240,step:'any',inputmode:'decimal'}),field('Protect this block. Recovery will keep its full duration.','protected','checkbox',b.protected),field('Facilitator notes','notes','textarea',b.notes,{maxlength:3000,rows:4}));
  $('editor-error').textContent=''; $('editor').showModal();
}
function openDetails() {
  if(!canChange() || session.state!=='idle') return;
  editing='details'; $('editor-heading').textContent='Agenda details';
  $('editor-fields').replaceChildren(field('Agenda title','title','text',agenda.title,{required:true,maxlength:120}),field('Run-sheet start time','startTime','time',agenda.startTime,{required:true}),element('p','The live timer starts when you press Start workshop. This time labels the printed agenda.','muted'));
  $('editor-error').textContent=''; $('editor').showModal();
}
$('editor-form').addEventListener('submit',event=>{
  event.preventDefault(); if(!canChange()) return;
  const values=new FormData(event.currentTarget); const next=clone(agenda);
  if(editing==='details') { next.title=values.get('title').trim(); next.startTime=values.get('startTime'); }
  else {
    const block={id:editing===-1?crypto.randomUUID():agenda.blocks[editing].id,title:values.get('title').trim(),category:values.get('category'),duration:Math.round(Number(values.get('duration'))*60),minimum:Math.round(Number(values.get('minimum'))*60),protected:values.get('protected')==='on',notes:values.get('notes')};
    if(editing===-1) next.blocks.push(block); else next.blocks[editing]=block;
  }
  try { agenda=validateAgenda(next); undo=null; save(); render(); $('editor').close(); announce($('save-status').textContent==='Saved on this device'?'Agenda saved.':'Agenda updated in this tab. Saving is unavailable. Export JSON to keep a backup.'); } catch(error) { $('editor-error').textContent=error.message; }
});
function moveBlock(index,direction) {
  if(!canChange() || session.state!=='idle') return;
  [agenda.blocks[index],agenda.blocks[index+direction]]=[agenda.blocks[index+direction],agenda.blocks[index]];
  undo=null; save(); render();
  $('blocks').children[index+direction].querySelector('button').focus();
}
function ask(title,message,action,label) {
  if(!canChange()) return;
  confirmAction=action; $('confirm-title').textContent=title; $('confirm-message').textContent=message; $('confirm-action').textContent=label; $('confirm').showModal();
}
$('confirm-action').addEventListener('click',()=>{ if(!canChange()) return; $('confirm').close(); const action=confirmAction; confirmAction=null; action?.(); });
function replaceAgenda(next) {
  ask('Replace this agenda?','This replaces the current agenda and resets its live timer. Export JSON first if you want to keep your current agenda.',()=>{agenda=next;session=idleSession();undo=null;save();render();announce('Agenda replaced. The timer is ready.');},'Replace agenda');
}
$('examples').addEventListener('change',event=>{
  const value=event.target.value; if(!value) return;
  const next=value==='blank'?{schemaVersion:1,title:'Untitled workshop',startTime:'09:00',blocks:[{id:crypto.randomUUID(),title:'Opening',category:'Welcome',duration:300,minimum:300,protected:true,notes:''}]}:clone(EXAMPLES[Number(value)]);
  replaceAgenda(next); event.target.value='';
});
$('edit-agenda').addEventListener('click',openDetails);
$('add-block').addEventListener('click',()=>openBlock(-1));
$('export').addEventListener('click',()=>download(JSON.stringify(agenda,null,2)+'\n',`${agenda.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'agenda'}.tempofold.json`));
$('import').addEventListener('click',()=>{if(!canChange())return; $('import-text').value='';$('import-error').textContent='';$('import-dialog').showModal();});
$('choose-file').addEventListener('click',()=>$('import-file').click());
function importText(text) {
  try { const next=parseAgenda(text);$('import-dialog').close();replaceAgenda(next); }
  catch(error) { $('import-error').textContent=`Import stopped. ${error.message} Your current work has not changed.`; }
}
$('paste-import-form').addEventListener('submit',event=>{event.preventDefault();importText($('import-text').value);});
$('import-file').addEventListener('change',async event=>{
  const file=event.target.files[0]; event.target.value=''; if(!file) return;
  try {
    if(file.size>MAX_IMPORT_BYTES) throw new Error('The JSON file must be 512 KB or smaller.');
    importText(await file.text());
  } catch(error) { $('import-error').textContent=`Import stopped. ${error.message} Your current work has not changed.`; }
});
$('start-pause').addEventListener('click',()=>{
  if(!canChange()) return;
  session=session.state==='idle'?startSession(agenda,Date.now()):togglePause(session,Date.now());
  save();render();announce(session.state==='running'?'Timer running.':'Timer paused. The finish target stays fixed.');
});
$('next').addEventListener('click',()=>{
  if(!canChange()) return;
  session=nextBlock(agenda,session,Date.now()); undo=null;save();render();
  announce(session.state==='finished'?'Workshop finished.':`Now ${agenda.blocks[session.index].title}.`);
});
$('reset-session').addEventListener('click',()=>ask('Reset the timer?','This clears the live timer and its history. Your agenda and any applied duration changes stay as they are.',()=>{session=idleSession();undo=null;save();render();announce('Timer reset. Agenda durations kept.');},'Reset timer'));
$('rehearse').addEventListener('click',()=>ask('Try a synthetic delay?','This rehearsal marks the first block complete, seven minutes late, and starts the next block now. The agenda stays the same. Reset the timer when finished.',()=>{
  const now=Date.now(),first=agenda.blocks[0].duration*1000;
  session=startSession(agenda,now-first-420000);
  session=nextBlock(agenda,session,now);undo=null;save();render();announce('Synthetic rehearsal started with a seven-minute delay.');
},'Start delayed rehearsal'));

function previewRecovery() {
  const number=Number($('recover-minutes').value);
  const seconds=Math.round(number*60);
  if(!Number.isFinite(number)||seconds<1||seconds>86400) { $('recovery-summary').textContent='Enter a recovery time from 1 second to 1,440 minutes.'; $('apply-recovery').disabled=true;preview=null;return; }
  const index=session.state==='idle'?-1:session.index;
  preview=recoveryPlan(agenda,index,seconds);
  $('recovery-rows').replaceChildren();
  for(const change of preview.changes) { const row=element('tr');for(const text of [change.title,duration(change.before),duration(change.after),duration(change.cut)]) row.append(element('td',text));$('recovery-rows').append(row); }
  $('recovery-table').hidden=preview.changes.length===0;
  $('recovery-summary').textContent=preview.unresolved?`Can recover ${duration(preview.recovered)} of ${duration(preview.requested)}. ${duration(preview.unresolved)} remains unresolved.`:`Can recover all ${duration(preview.requested)}. Review ${preview.changes.length} proposed ${preview.changes.length===1?'change':'changes'} below.`;
  $('recovery-explanation').textContent=preview.unresolved?'There is no more time available above the minimums of future flexible blocks. Keep the later finish, or reset the timer to revise the agenda. Protected blocks will not shrink.':'Apply changes these durations only. Your finish target and timer history stay the same.';
  $('apply-recovery').textContent=preview.unresolved?'Apply available recovery':'Apply these changes';
  $('apply-recovery').disabled=preview.recovered===0;
}
$('recover').addEventListener('click',()=>{
  if(!canChange()) return;
  const seconds=Math.max(60,Math.ceil(forecast(agenda,session,Date.now()).overtime));
  $('recover-minutes').value=String(Number((Math.min(86400,seconds)/60).toFixed(2)));
  previewRecovery();$('recovery').showModal();
});
$('recovery-form').addEventListener('submit',event=>{event.preventDefault();previewRecovery();});
$('recover-minutes').addEventListener('input',()=>{preview=null;$('apply-recovery').disabled=true;$('recovery-summary').textContent='Update the preview to review this recovery time.';});
$('apply-recovery').addEventListener('click',()=>{
  if(!canChange()||!preview) return;
  try { const next=applyRecovery(agenda,preview);undo=clone(agenda);agenda=next;save();render();$('recovery').close();announce(`Recovered ${duration(preview.recovered)}. ${preview.unresolved?`${duration(preview.unresolved)} is still unresolved. `:''}Undo is available until the next block.`); } catch(error) { $('recovery-summary').textContent=error.message; $('apply-recovery').disabled=true; }
});
$('undo').addEventListener('click',()=>{if(!canChange()||!undo)return;agenda=undo;undo=null;save();render();announce('Recovery undone. Previous agenda durations restored.');});
$('print').addEventListener('click',()=>{renderPrint();window.print();});
$('help').addEventListener('click',()=>$('help-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(node=>node.addEventListener('click',()=>$(node.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog=>{const heading=dialog.querySelector('h2');heading.id ||= `${dialog.id}-heading`;dialog.setAttribute('aria-labelledby',heading.id);});
window.addEventListener('storage',event=>{
  if(event.key!==KEY || event.newValue===event.oldValue) return;
  conflict=true; $('save-status').textContent='Another tab changed this workshop';
  announce('Another tab changed the saved workshop. Changes in this tab are paused. Export your current agenda, then reload to use the latest saved work.');
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderTimer();});

render();
if(persistenceError) {
  announce(persistenceError);
  $('storage-actions').hidden=false;
  if(rawSaved) $('storage-actions').append(button('Download saved data',()=>download(rawSaved,'tempofold-saved-data.json')));
  $('storage-actions').append(button('Replace saved data',()=>ask('Replace saved data?','The saved data could not be restored. Download it first if you need to keep it. This will enable saving for the agenda currently shown.',()=>{blocked=false;$('storage-actions').hidden=true;save();announce('Saving enabled for the current agenda.');},'Replace saved data')));
} else if(!rawSaved) save();
else if(active()) announce(`Restored the ${session.state} timer for ${agenda.blocks[session.index].title}. The finish target was kept.`);
setInterval(renderTimer,250);

async function offlineSetup() {
  if(!('serviceWorker' in navigator)) { $('offline-status').textContent='Offline reload unavailable in this browser.';return; }
  try {
    const registration=await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
    $('offline-status').textContent='App files cached for offline use.';
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)announce('A new TempoFold version is ready. Export a backup, then close all TempoFold tabs and reopen to update.');});});
  } catch { $('offline-status').textContent='Offline cache unavailable. Keep this tab open.'; }
}
offlineSetup();
