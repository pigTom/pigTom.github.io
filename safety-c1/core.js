(function(root){
'use strict';
const BANK='gd-c1-batch6-v1';
const empty=()=>({schema:1,bank:BANK,revision:0,done:{},wrong:[],fav:[],attempts:[],exams:[],session:null,lastBackup:null});
const same=(a,b)=>Array.isArray(a)&&a.slice().sort().join('')===b.split('').sort().join('');
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function score(session,byId){let score=0,correct=0;for(const id of session.queue){const q=byId[id];if(same(session.answers[id]||[],q.a)){correct++;score+=q.s==='多选题'?2:1;}}return {score,correct,total:session.queue.reduce((n,id)=>n+(byId[id].s==='多选题'?2:1),0)};}
function examQueue(qs){const types=[['单选题',50],['多选题',10],['判断题',18]];let queue=[];for(const [t,n] of types){const pool=qs.filter(q=>q.s===t);if(pool.length<n)throw Error('题库题量不足');queue.push(...shuffle(pool).slice(0,n).map(q=>String(q.n)));}const groups=shuffle([...new Set(qs.filter(q=>q.caseGroup).map(q=>q.caseGroup))]).slice(0,3);for(const g of groups)queue.push(...qs.filter(q=>q.caseGroup===g).map(q=>String(q.n)));return queue;}
function validate(data,byId){
 if(!data||data.schema!==1||data.bank!==BANK)throw Error('备份版本或题库不匹配');
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const str=x=>typeof x==='string'&&x.length<500;
 const time=x=>Number.isFinite(x)&&x>=0&&x<1e14;
 const id=x=>(typeof x==='string'||typeof x==='number')&&Object.hasOwn(byId,String(x));
 const ids=x=>Array.isArray(x)&&x.length<=4000&&x.every(id)&&new Set(x.map(String)).size===x.length;
 const answer=(x,k)=>Array.isArray(x)&&x.length<=byId[k].o.length&&new Set(x).size===x.length&&x.every(v=>typeof v==='string'&&/^[A-Z]$/.test(v)&&v.charCodeAt(0)-65<byId[k].o.length);
 function session(s){
  if(!object(s)||!str(s.id)||!str(s.label)||!['practice','exam'].includes(s.mode)||!ids(s.queue)||!s.queue.length||!Number.isInteger(s.pos)||s.pos<0||s.pos>=s.queue.length||!time(s.startedAt)||!object(s.answers)||!object(s.checked))return false;
  if(s.mode==='exam'&&(!time(s.endAt)||s.endAt<s.startedAt))return false;
  if(s.revealed!==undefined&&(!object(s.revealed)||!Object.entries(s.revealed).every(([k,v])=>s.queue.map(String).includes(k)&&v===true)))return false;
  const qset=new Set(s.queue.map(String));
  return Object.entries(s.answers).every(([k,v])=>qset.has(k)&&answer(v,k))&&Object.entries(s.checked).every(([k,v])=>qset.has(k)&&v===true);
 }
 if(!ids(data.wrong)||!ids(data.fav)||!object(data.done)||!Object.entries(data.done).every(([k,v])=>id(k)&&v===true))throw Error('备份中的题目记录无效');
 if(!Array.isArray(data.attempts)||data.attempts.length>200000||!data.attempts.every(a=>object(a)&&str(a.id)&&str(a.sessionId)&&id(a.questionId)&&answer(a.selected,a.questionId)&&time(a.at)&&Number.isFinite(a.elapsedMs)&&a.elapsedMs>=0&&['practice','exam','reveal'].includes(a.kind)&&typeof a.correct==='boolean'))throw Error('备份中的作答记录无效');
 if(new Set(data.attempts.map(a=>a.id)).size!==data.attempts.length)throw Error('作答记录编号重复');
 if(!Array.isArray(data.exams)||data.exams.length>20000||!data.exams.every(e=>object(e)&&str(e.id)&&time(e.finishedAt)&&Number.isFinite(e.score)&&e.score>=0&&Number.isFinite(e.total)&&e.total>0&&e.score<=e.total&&(e.legacy===true||(session(e)&&Number.isInteger(e.correct)&&e.correct>=0&&e.correct<=e.queue.length&&Number.isFinite(e.durationMs)&&e.durationMs>=0))))throw Error('备份中的考试记录无效');
 if(data.session!==null&&!session(data.session))throw Error('备份中的进行中练习无效');
 const clean=empty(); for(const k of ['done','wrong','fav','attempts','exams','session'])clean[k]=JSON.parse(JSON.stringify(data[k]));
 clean.wrong=clean.wrong.map(String);clean.fav=clean.fav.map(String);
 if(clean.session)clean.session.queue=clean.session.queue.map(String);
 clean.lastBackup=time(data.lastBackup)?data.lastBackup:null;
 return clean;
}
root.SafetyCore={BANK,empty,same,shuffle,score,examQueue,validate};
})(typeof window==='undefined'?globalThis:window);