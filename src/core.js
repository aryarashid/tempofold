export const SCHEMA_VERSION = 1;
export const MAX_IMPORT_BYTES = 512 * 1024;
export const CATEGORIES = ['Welcome', 'Present', 'Discuss', 'Activity', 'Break', 'Closing'];
export const clone = value => JSON.parse(JSON.stringify(value));

const fail = message => { throw new Error(message); };
function object(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`);
  if (Object.keys(value).some(key => !keys.includes(key))) fail(`${label} contains an unsupported field.`);
}
function string(value, min, max, label) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(`${label} must contain ${min} to ${max} characters.`);
  return value;
}
function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(`${label} must be a whole number between ${min} and ${max}.`);
  return value;
}

export function validateAgenda(input) {
  object(input, ['schemaVersion', 'title', 'startTime', 'blocks'], 'Agenda');
  if (input.schemaVersion !== SCHEMA_VERSION) fail('This file uses an unsupported agenda version. Expected version 1.');
  string(input.title, 1, 120, 'Agenda title');
  if (typeof input.startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime)) fail('Start time must use HH:MM in 24-hour time.');
  if (!Array.isArray(input.blocks) || input.blocks.length < 1 || input.blocks.length > 100) fail('An agenda needs 1 to 100 blocks.');
  const ids = new Set();
  for (const block of input.blocks) {
    object(block, ['id', 'title', 'category', 'duration', 'minimum', 'protected', 'notes'], 'Block');
    string(block.id, 1, 80, 'Block ID');
    if (ids.has(block.id)) fail('Every block must have a unique ID.');
    ids.add(block.id);
    string(block.title, 1, 120, 'Block title');
    if (!CATEGORIES.includes(block.category)) fail('Choose a supported block category.');
    integer(block.duration, 1, 14400, 'Duration in seconds');
    integer(block.minimum, 1, block.duration, 'Minimum in seconds');
    if (typeof block.protected !== 'boolean') fail('Protected must be true or false.');
    string(block.notes, 0, 3000, 'Notes');
  }
  if (totalSeconds(input) > 86400) fail('The agenda must fit within 24 hours.');
  return clone(input);
}

export function parseAgenda(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) fail('The JSON file must be 512 KB or smaller.');
  let parsed;
  try { parsed = JSON.parse(text); } catch { fail('This file is not valid JSON. Export an agenda from TempoFold or use an example file.'); }
  return validateAgenda(parsed);
}

export const totalSeconds = agenda => agenda.blocks.reduce((sum, block) => sum + block.duration, 0);
export const idleSession = () => ({state:'idle', index:0, elapsedMs:0, anchor:null, startedAt:null, endAt:null, actuals:[]});

export function startSession(agenda, now) {
  return {state:'running', index:0, elapsedMs:0, anchor:now, startedAt:now, endAt:now + totalSeconds(agenda)*1000, actuals:[]};
}

export function elapsed(session, now) {
  return session.elapsedMs + (session.state === 'running' ? Math.max(0, now - session.anchor) : 0);
}

export function togglePause(session, now) {
  if (session.state === 'running') return {...session, state:'paused', elapsedMs:elapsed(session,now), anchor:null};
  if (session.state === 'paused') return {...session, state:'running', anchor:now};
  return session;
}

export function nextBlock(agenda, session, now) {
  if (!['running','paused'].includes(session.state)) return session;
  const actuals = [...session.actuals, elapsed(session, now)];
  if (session.index === agenda.blocks.length-1) return {...session, state:'finished', anchor:null, elapsedMs:elapsed(session,now), actuals, finishedAt:now};
  return {...session, index:session.index+1, elapsedMs:0, anchor:session.state === 'running' ? now : null, actuals};
}

export function forecast(agenda, session, now) {
  if (session.state === 'idle') return {remaining:totalSeconds(agenda), finish:null, overtime:0};
  if (session.state === 'finished') return {remaining:0, finish:session.finishedAt, overtime:(session.finishedAt-session.endAt)/1000};
  const remaining = Math.max(0, agenda.blocks[session.index].duration - elapsed(session,now)/1000)
    + agenda.blocks.slice(session.index+1).reduce((sum,b) => sum+b.duration,0);
  return {remaining, finish:now+remaining*1000, overtime:(now+remaining*1000-session.endAt)/1000};
}

// Deterministic first-to-last allocation. The current block is never a candidate.
export function recoveryPlan(agenda, currentIndex, seconds) {
  integer(currentIndex, -1, agenda.blocks.length-1, 'Current block index');
  integer(seconds, 0, 86400, 'Recovery time in seconds');
  let unresolved = seconds;
  const changes = [];
  agenda.blocks.forEach((block,index) => {
    if (index <= currentIndex || block.protected || unresolved === 0) return;
    const cut = Math.min(block.duration-block.minimum, unresolved);
    if (cut > 0) { changes.push({id:block.id, title:block.title, before:block.duration, after:block.duration-cut, cut}); unresolved -= cut; }
  });
  return {requested:seconds, recovered:seconds-unresolved, unresolved, changes};
}

export function applyRecovery(agenda, plan) {
  const next = clone(agenda);
  for (const change of plan.changes) {
    const block = next.blocks.find(b => b.id === change.id);
    if (!block || block.protected || block.duration !== change.before || change.after < block.minimum || change.after > change.before) fail('This preview is out of date. Open recovery again.');
    block.duration = change.after;
  }
  return validateAgenda(next);
}

export function validateSession(input, agenda) {
  object(input, ['state','index','elapsedMs','anchor','startedAt','endAt','actuals','finishedAt'], 'Saved timer');
  if (!['idle','running','paused','finished'].includes(input.state)) fail('Invalid saved timer state.');
  integer(input.index,0,agenda.blocks.length-1,'Saved block index');
  integer(input.elapsedMs,0,Number.MAX_SAFE_INTEGER,'Saved elapsed time');
  if (!Array.isArray(input.actuals) || input.actuals.some(n=>!Number.isSafeInteger(n)||n<0)) fail('Invalid saved block history.');
  const expected = input.state === 'finished' ? agenda.blocks.length : input.state === 'idle' ? 0 : input.index;
  if (input.actuals.length !== expected) fail('Saved timer history does not match the agenda.');
  for (const key of ['anchor','startedAt','endAt']) {
    const nullable = input.state === 'idle' || (key === 'anchor' && input.state !== 'running');
    if (nullable && input[key] === null) continue;
    integer(input[key],0,8640000000000000,`Saved ${key}`);
  }
  if (input.state === 'finished') integer(input.finishedAt,0,8640000000000000,'Finish timestamp');
  return clone(input);
}

const block = (id,title,category,duration,minimum,protect,notes) => ({id,title,category,duration:duration*60,minimum:minimum*60,protected:protect,notes});
export const EXAMPLES = [
  {schemaVersion:1,title:'Product demo',startTime:'10:00',blocks:[
    block('demo-welcome','Set the scene','Welcome',1,1,true,'Name the audience and the problem. All product details in this example are fictional.'),
    block('demo-walk','Show the main workflow','Present',5,3,false,'Walk through one complete task. Skip optional settings if time is short.'),
    block('demo-questions','Questions and discussion','Discuss',4,2,false,'Take questions about the demonstrated workflow. Park unrelated questions for follow-up.'),
    block('demo-close','Close with the next step','Closing',2,2,true,'Summarize what was shown. Agree on one next step and its owner.')
  ]},
  {schemaVersion:1,title:'From ideas to a shared plan',startTime:'09:00',blocks:[
    block('work-welcome','Arrive and align','Welcome',5,5,true,'Welcome everyone. Explain the decision we need to make and the ending time.'),
    block('work-frame','Frame the challenge','Present',10,7,false,'Share the fictional project brief. Clarify the problem before suggesting solutions.'),
    block('work-ideas','Explore possibilities','Activity',15,10,false,'Write ideas silently, then discuss in pairs. If shortened, collect one idea per person.'),
    block('work-break','Take a breath','Break',5,3,false,'Offer a quiet pause. Adjust for participants’ access needs before shortening the break.'),
    block('work-decide','Choose the next experiment','Discuss',15,10,false,'Compare options against the goal. Agree on one small experiment.'),
    block('work-close','Commit and close','Closing',10,10,true,'Record an owner, a next step and a date. Give each person space for a final reflection.')
  ]},
  {schemaVersion:1,title:'Community listening session',startTime:'18:00',blocks:[
    block('community-open','Welcome and agreements','Welcome',5,5,true,'Introduce the fictional session. Explain respectful participation and how notes will be used.'),
    block('community-stories','Hear local perspectives','Discuss',15,10,false,'Invite a range of voices. Use a visible speaking order and allow people to pass.'),
    block('community-map','Map shared priorities','Activity',15,10,false,'Group themes on paper. Ask what is missing before choosing priorities.'),
    block('community-close','Read back and close','Closing',10,10,true,'Read back the priorities. Explain the next meeting and how participants can correct the notes.')
  ]}
];
