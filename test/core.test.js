import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLES,clone,validateAgenda,parseAgenda,MAX_IMPORT_BYTES,totalSeconds,idleSession,startSession,elapsed,togglePause,nextBlock,forecast,recoveryPlan,applyRecovery,validateSession} from '../src/core.js';

const workshop=()=>clone(EXAMPLES[1]);
const T=1_800_000_000_000;

test('all original examples validate and have the promised duration',()=>{
  assert.deepEqual(EXAMPLES.map(a=>totalSeconds(validateAgenda(a))),[720,3600,2700]);
});
test('JSON round trip preserves every field and Unicode notes',()=>{
  const a=workshop();a.blocks[0].notes='Silence, then café discussion. 日本語';
  assert.deepEqual(parseAgenda(JSON.stringify(a)),a);
});
test('recovery only changes future flexible blocks and stops at minimums',()=>{
  const a=workshop(),original=clone(a);
  const plan=recoveryPlan(a,1,7*60);
  assert.deepEqual(plan.changes.map(c=>[c.id,c.cut]),[['work-ideas',300],['work-break',120]]);
  assert.equal(plan.unresolved,0);
  const after=applyRecovery(a,plan);
  for(let i=0;i<a.blocks.length;i++){
    if(i<=1||a.blocks[i].protected)assert.deepEqual(after.blocks[i],a.blocks[i]);
    assert.ok(after.blocks[i].duration>=a.blocks[i].minimum);
  }
  assert.deepEqual(a,original,'planning and application must not mutate their input');
});
test('impossible recovery reports the exact unresolved seconds',()=>{
  const a=workshop();const plan=recoveryPlan(a,3,421);
  assert.equal(plan.recovered,300);assert.equal(plan.unresolved,121);
  assert.equal(plan.changes.length,1);assert.equal(plan.changes[0].id,'work-decide');
  const none=recoveryPlan(a,4,60);assert.equal(none.recovered,0);assert.equal(none.unresolved,60);
});
test('apply and undo restores the entire agenda exactly',()=>{
  const a=workshop();const undo=clone(a);const after=applyRecovery(a,recoveryPlan(a,0,271));
  assert.notDeepEqual(after,a);assert.deepEqual(undo,a);
  assert.equal(totalSeconds(a)-totalSeconds(after),271);
});
test('recovery invariants across indexes, requests and protected blocks',()=>{
  for(const a of EXAMPLES)for(let index=-1;index<a.blocks.length;index++)for(const request of [0,1,59,60,419,720,3600,86400]){
    const plan=recoveryPlan(a,index,request);const after=applyRecovery(a,plan);
    assert.equal(plan.recovered+plan.unresolved,request);
    assert.equal(totalSeconds(a)-totalSeconds(after),plan.recovered);
    after.blocks.forEach((b,i)=>{assert.ok(b.duration>=a.blocks[i].minimum);assert.ok(b.duration<=a.blocks[i].duration);if(i<=index||b.protected)assert.deepEqual(b,a.blocks[i]);});
  }
});
test('stale previews fail instead of applying a different cut',()=>{
  const a=workshop(),plan=recoveryPlan(a,0,60);a.blocks[1].duration-=1;
  assert.throws(()=>applyRecovery(a,plan),/out of date/);
});
test('timestamps advance through background time and JSON refresh without a tick',()=>{
  const a=workshop(),s=startSession(a,T);const reloaded=validateSession(JSON.parse(JSON.stringify(s)),a);
  assert.equal(elapsed(reloaded,T+427000),427000);
  assert.equal(forecast(a,reloaded,T+427000).overtime,127);
  assert.equal(reloaded.index,0,'overtime never auto-advances a block');
});
test('pause, refresh and resume do not count paused time as block elapsed',()=>{
  const a=workshop();let s=startSession(a,T);
  s=togglePause(s,T+90000);assert.equal(elapsed(s,T+600000),90000);
  s=validateSession(JSON.parse(JSON.stringify(s)),a);
  assert.equal(forecast(a,s,T+150000).overtime,60,'pause delays the fixed target');
  s=togglePause(s,T+600000);assert.equal(elapsed(s,T+630000),120000);
  assert.equal(s.endAt,T+3600000);
});
test('early next, overtime next, paused next and final finish keep honest timestamps',()=>{
  const a=clone(EXAMPLES[0]);let s=startSession(a,T);
  s=nextBlock(a,s,T+30000);assert.equal(s.index,1);assert.deepEqual(s.actuals,[30000]);
  s=togglePause(s,T+40000);s=nextBlock(a,s,T+100000);
  assert.equal(s.state,'paused');assert.equal(s.index,2);assert.equal(elapsed(s,T+900000),0);
  s=togglePause(s,T+100000);s=nextBlock(a,s,T+500000);s=nextBlock(a,s,T+800000);
  assert.equal(s.state,'finished');assert.equal(s.finishedAt,T+800000);assert.equal(forecast(a,s,T+9999999).overtime,80);
  assert.deepEqual(validateSession(s,a),s);
});
test('clock moving backward never produces a negative block elapsed time',()=>{
  const s=startSession(workshop(),T);assert.equal(elapsed(s,T-10000),0);
});
test('recovery affects future projection without rewriting the target or history',()=>{
  const a=workshop();let s=startSession(a,T);s=nextBlock(a,s,T+720000);
  assert.equal(forecast(a,s,T+720000).overtime,420);
  const after=applyRecovery(a,recoveryPlan(a,s.index,420));
  assert.equal(forecast(after,s,T+720000).overtime,0);assert.equal(s.endAt,T+3600000);
  assert.deepEqual(s.actuals,[720000]);
});
test('invalid imports throw and never mutate existing work',()=>{
  const existing=workshop(),before=clone(existing);
  const mutations=[a=>a.schemaVersion=2,a=>a.title='',a=>a.blocks=[],a=>a.blocks.push(clone(a.blocks[0])),a=>a.blocks[0].minimum=301,a=>a.blocks[0].duration=-1,a=>a.blocks[0].protected='true',a=>a.blocks[0].category='Unknown',a=>a.blocks[0].notes='x'.repeat(3001),a=>a.startTime='25:00',a=>a.extra=true];
  for(const mutate of mutations){const next=clone(existing);mutate(next);assert.throws(()=>parseAgenda(JSON.stringify(next)));}
  assert.throws(()=>parseAgenda('{broken'));
  assert.throws(()=>parseAgenda('{"__proto__":{},"schemaVersion":1}'),/unsupported field/);
  assert.deepEqual(existing,before);
});
test('import caps both blocks, duration and UTF-8 file size',()=>{
  const a=workshop();a.blocks=Array.from({length:101},(_,i)=>({...a.blocks[0],id:String(i)}));assert.throws(()=>validateAgenda(a),/100 blocks/);
  assert.throws(()=>parseAgenda(' '.repeat(MAX_IMPORT_BYTES+1)),/512 KB/);
  assert.throws(()=>parseAgenda('あ'.repeat(MAX_IMPORT_BYTES/2)),/512 KB/);
  const long=workshop();long.blocks=Array.from({length:7},(_,i)=>({...long.blocks[0],id:String(i),duration:14400}));assert.throws(()=>validateAgenda(long),/24 hours/);
});
test('HTML-looking text remains plain agenda data',()=>{
  const a=workshop();a.title='<img src=x onerror=alert(1)>';a.blocks[0].notes='<script>throw Error("executed")</script>';
  const result=parseAgenda(JSON.stringify(a));assert.equal(result.title,a.title);assert.equal(result.blocks[0].notes,a.blocks[0].notes);
});
test('invalid saved timer does not silently become a fresh session',()=>{
  const a=workshop();assert.deepEqual(validateSession(idleSession(),a),idleSession());
  for(const bad of [{...startSession(a,T),anchor:null},{...startSession(a,T),index:100},{...startSession(a,T),actuals:[0]},{...startSession(a,T),elapsedMs:-1}])assert.throws(()=>validateSession(bad,a));
});
