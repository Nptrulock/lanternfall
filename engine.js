'use strict';
/* Lanternfall v2 — engine (no DOM). Exposes G. */
const G = {S:null, ev:[], quiet:false, toast:null, now:()=>Date.now(), cv:1};
const SAVE_KEY = 'lanternfall.save';
const SAVE_V = 5;
const rnd = (a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)], chance=p=>Math.random()<p;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmtTime=s=>{s=Math.max(0,Math.floor(s));const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;return d?`${d}d ${h}h`:h?`${h}h ${m}m`:m?`${m}m ${x}s`:`${x}s`};
const dirty=()=>{ G.cv++; };

/* ---------------- pacing ---------------- */
const PACE = {action:1200, between:2600, victory:1600, start:900};
const xpNeed = L => Math.round(9*Math.pow(L,2.25)+6);
const profNeed = L => Math.round(300*Math.pow(L,1.9));        // seconds of work per profession level
const enduranceNeed = L => Math.round(300*Math.pow(L,1.45));   // seconds of training per Endurance level
const mentorNeed = r => Math.round(600*Math.pow(r+1,1.5));     // seconds of study for the next mentor rank
const MAX_LV = 60;

/* ---------------- state ---------------- */
function newChar(name, race){
  return {name, race, lv:1, xp:0, hp:1, mp:0, stam:D.STAM.base, endLv:1, endXp:0, act:'rest',
    equip:{weapon:null,armor:null,acc:null,relic:null}, ap:{}, learned:{}, job:null, sub:null, jobs:{}, locks:{}, mentors:{}, tactic:'auto', wins:0,
    skillOff:{}, drill:{xp:0,gold:0,n:0,last:0}};
}
function newState(){
  const b={}; for(const k of D.BUILD_ORDER) b[k]=D.BUILD[k].start;
  return {v:SAVE_V, created:Date.now(), last:Date.now(), started:false,
    chars:[], gold:20, diamonds:D.START_DIAMONDS, inv:[], nextUid:1, mats:{}, meals:{}, food:null, foods:[],
    loc:'town', exp:null, zone:0, zones:D.ZONES.map(()=>({wins:0, boss:false, bossKills:0, sinceBoss:0, stages:0})), battle:null, pendingBoss:false, pause:0,
    profs:Object.fromEntries(D.PROF_ORDER.map(p=>[p,{lv:1,xp:0,acc:{}}])), workers:{}, hired:1, buildings:b, pity:{}, pityM:{},
    bestiary:{}, variants:{}, beastRewards:{}, relicsFound:{}, flags:{}, tut:0,
    bank:{gold:0, earned:0, convertAcc:0}, market:{at:0, list:[]}, feature:{day:'', id:null, r:0, taken:0}, research:{},
    beastXp:{}, beastGold:{}, bagSort:'rarity',
    stats:{wins:0, losses:0, kills:0, bosses:0, bought:0, learned:0, goldEarned:0, battles:0, relics:0, play:0, pulls:0, diamondsEarned:0, departs:0, returns:0, rounds:0, battleMs:0, stages:0, drills:0, interest:0},
    settings:{autoBoss:false},
    log:[]};
}
/* Save versions: v1/v2 were the first release. v3 is the town-first redesign (fresh start). v4 is the playtest pass; v5 is the gear/mentor/drill/battle-UI pass. v3 and v4 saves migrate safely. */
function migrateV3to4(s){
  try{
    if(s.zones && s.bestiary && D && D.ZONES){
      D.ZONES.forEach((Z,i)=>{ const z=s.zones[i]; if(!z||!Z||!Z.boss) return; const id=Z.boss.id; const real=z.bossKills||0; if((s.bestiary[id]||0)>real) s.bestiary[id]=real; });
    }
    if(Array.isArray(s.chars)) for(const c of s.chars){
      if(!c||!c.mentors) continue;
      for(const mid in c.mentors){ if((c.mentors[mid].rank||0)>=1) c.mentors[mid].legacySub=1; }
    }
    if(typeof s.food==='string' && s.food) s.foods=[s.food];
    s.v=4;
  }catch(e){ s.v=4; }
}
function migrateV4to5(s){
  try{
    s.v=5;
  }catch(e){ s.v=5; }
}
function migrate(s){
  if(!s || typeof s!=='object') throw new Error('The save is not readable data.');
  if(typeof s.v!=='number') s.v=0;
  if(s.v<3) throw Object.assign(new Error('old'), {oldSave:true});
  if(s.v===3) migrateV3to4(s);
  if(s.v===4) migrateV4to5(s);
  if(s.v>SAVE_V) throw new Error('This save is from a newer version of Lanternfall.');
  if(!Array.isArray(s.chars)) throw new Error('The save has no party.');
  if(s.started && s.chars.length!==3) throw new Error('The party in the save is damaged.');
  for(const c of s.chars) if(!c || !D.RACES[c.race] || typeof c.lv!=='number') throw new Error('A hero in the save is damaged.');
  const f = newState();
  for(const k in f) if(s[k]===undefined||s[k]===null) s[k]=f[k];
  for(const k in f.settings) if(s.settings[k]===undefined) s.settings[k]=f.settings[k];
  for(const k in f.stats) if(s.stats[k]===undefined) s.stats[k]=f.stats[k];
  for(const p of D.PROF_ORDER) if(!s.profs[p]) s.profs[p]={lv:1,xp:0,acc:{}};
  for(const b of D.BUILD_ORDER) if(s.buildings[b]===undefined) s.buildings[b]=D.BUILD[b].start;
  if(!Array.isArray(s.zones)) throw new Error('The zone list in the save is damaged.');
  while(s.zones.length<D.ZONES.length) s.zones.push({wins:0,boss:false,bossKills:0,sinceBoss:0,stages:0});
  s.zones.forEach(z=>{ if(z.stages==null) z.stages=Math.min(D.STAGES||10, Math.floor((z.wins||0)*(D.STAGES||10)/(80))); });
  if(!Array.isArray(s.inv)) throw new Error('The inventory in the save is damaged.');
  const nc=newChar('x','human');
  s.chars.forEach(c=>{ for(const k in nc) if(c[k]===undefined) c[k]=JSON.parse(JSON.stringify(nc[k])); c.equip=Object.assign({weapon:null,armor:null,acc:null,relic:null}, c.equip||{}); c.skillOff=c.skillOff||{}; c.drill=Object.assign({xp:0,gold:0,n:0,last:0}, c.drill||{}); });
  if(!s.bank) s.bank={gold:0,earned:0,convertAcc:0};
  if(!s.market) s.market={at:0,list:[]};
  if(!s.feature) s.feature={day:'',id:null,r:0,taken:0};
  if(!s.research) s.research={};
  if(!s.beastXp) s.beastXp={};
  if(!s.beastGold) s.beastGold={};
  if(!s.pityM) s.pityM={};
  if(!Array.isArray(s.foods)) s.foods=s.food? [s.food]:[];
  return s;
}
/* ---------------- saving, backups & recovery ----------------
   main save: SAVE_KEY. Rolling backups: .auto1 (newest) .. .auto3, rotated at most every BAK_EVERY of play,
   plus .daily (first save of each calendar day). A save that fails to load is kept under .broken and is never overwritten by a new game. */
const BAK_AUTO = [SAVE_KEY+'.auto1', SAVE_KEY+'.auto2', SAVE_KEY+'.auto3'];
const BAK_DAILY = SAVE_KEY+'.daily', BAK_META = SAVE_KEY+'.bakmeta', BROKEN_KEY = SAVE_KEY+'.broken', PRERESET_KEY = SAVE_KEY+'.prereset', PRERESTORE_KEY = SAVE_KEY+'.prerestore';
const BAK_EVERY = 10*60*1000;
const lsGet = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
const lsSet = (k,v) => { try{ localStorage.setItem(k,v); return true; }catch(e){ console.warn('storage write failed', k, e); return false; } };
function bakMeta(){ try{ return JSON.parse(lsGet(BAK_META)||'{}')||{}; }catch(e){ return {}; } }
function rollBackups(raw, force){
  const m=bakMeta(), now=Date.now();
  if(force || !m.auto || now-m.auto>=BAK_EVERY || !lsGet(BAK_AUTO[0])){
    const t=m.autoAt||[];
    for(let i=BAK_AUTO.length-1;i>0;i--){ const prev=lsGet(BAK_AUTO[i-1]); if(prev){ lsSet(BAK_AUTO[i], prev); t[i]=t[i-1]; } }
    lsSet(BAK_AUTO[0], raw); t[0]=now; m.autoAt=t.slice(0,BAK_AUTO.length); m.auto=now; }
  const day=new Date(now).toDateString();
  if(m.day!==day || !lsGet(BAK_DAILY)){ lsSet(BAK_DAILY, raw); m.day=day; m.dailyAt=now; }
  lsSet(BAK_META, JSON.stringify(m));
}
function save(force){
  if(G.noSave || G.loadFailed || !G.S) return false;
  G.S.last=Date.now(); const raw=JSON.stringify(G.S);
  const ok=lsSet(SAVE_KEY, raw);
  if(ok && G.S.started) rollBackups(raw, force===true);
  return ok;
}
function saveSummary(s){ if(!s||!s.chars||!s.chars.length) return 'no party yet';
  return `${s.chars.map(c=>`${c.name} Lv ${c.lv}`).join(', ')} · ${(s.stats&&s.stats.wins)||0} wins · ${fmtTime((s.stats&&s.stats.play)||0)} played`; }
// every backup slot with whether it can actually be restored
function listBackups(){ const m=bakMeta(); const out=[];
  const add=(key,label,at)=>{ const raw=lsGet(key); if(!raw) return; let ok=false, sum='', err='';
    try{ const s=migrate(JSON.parse(raw)); ok=!!s.started; sum=saveSummary(s); if(!ok) err='no party yet'; }catch(e){ err=e.oldSave?'from the first version':e.message; }
    out.push({key,label,at:at||null,ok,sum,err}); };
  BAK_AUTO.forEach((k,i)=>add(k, i===0?'Latest autosave backup':`Autosave backup ${i+1}`, (m.autoAt||[])[i]));
  add(BAK_DAILY, 'Daily backup', m.dailyAt); add(PRERESET_KEY, 'Before the last hard reset', m.preresetAt); add(PRERESTORE_KEY, 'Before the last restore', m.prerestoreAt);
  return out; }
function restoreBackup(key){ const raw=lsGet(key); if(!raw) throw new Error('That backup is empty.');
  const s=migrate(JSON.parse(raw)); if(!s.started) throw new Error('That backup has no party yet.');
  if(!G.loadFailed && G.S && G.S.started){ lsSet(PRERESTORE_KEY, JSON.stringify(G.S)); const m=bakMeta(); m.prerestoreAt=Date.now(); lsSet(BAK_META, JSON.stringify(m)); }   // the game being replaced is kept
  G.S=s; G.S.battle=null; G.loadFailed=null; dirty(); save(); return true; }
function startFreshAfterFail(){ G.loadFailed=null; G.S=newState(); dirty(); }   // the damaged save stays under BROKEN_KEY
function load(){
  const raw=lsGet(SAVE_KEY);
  G.newJourney=false; G.loadFailed=null;
  if(raw){ try{ G.S = migrate(JSON.parse(raw)); dirty(); return true; }catch(e){
      if(e.oldSave){ lsSet(SAVE_KEY+'.v2backup', raw); try{ localStorage.removeItem(SAVE_KEY); }catch(_){} G.newJourney=true; }
      else { console.warn('save failed to load', e); lsSet(BROKEN_KEY, raw); lsSet(BROKEN_KEY+'.at', String(Date.now()));
        G.loadFailed={reason:'broken', msg:e.message||String(e), raw}; } } }
  else if(listBackups().some(b=>b.ok)) G.loadFailed={reason:'missing', msg:'The main save is missing, but a backup was found.', raw:null};
  G.S = newState(); dirty(); return false;
}
function exportSave(){ save(); return btoa(unescape(encodeURIComponent(JSON.stringify(G.S)))); }
function encodeRaw(raw){ return btoa(unescape(encodeURIComponent(raw))); }
function importSave(str){
  str=(str||'').trim(); let obj;
  try{ obj = JSON.parse(decodeURIComponent(escape(atob(str)))); }catch(e){ try{ obj=JSON.parse(str); }catch(e2){ throw new Error('That doesn\'t look like a Lanternfall save.'); } }
  if(!obj || !Array.isArray(obj.chars)) throw new Error('That doesn\'t look like a Lanternfall save.');
  try{ obj = migrate(obj); }catch(e){ if(e.oldSave) throw new Error('That save is from the first version of Lanternfall. v2 is a fresh start.'); throw e; }
  if(G.S && G.S.started) rollBackups(JSON.stringify(G.S), true);   // keep what was there before the import
  G.S=obj; G.S.battle=null; G.loadFailed=null; dirty(); save(); return true;
}
function hardReset(){ const raw=lsGet(SAVE_KEY); if(raw){ lsSet(PRERESET_KEY, raw); const m=bakMeta(); m.preresetAt=Date.now(); lsSet(BAK_META, JSON.stringify(m)); }
  try{localStorage.removeItem(SAVE_KEY)}catch(e){} G.S=newState(); dirty(); }

function log(msg, cls){ const S=G.S; S.log.push({m:msg, c:cls||''}); if(S.log.length>60) S.log.splice(0, S.log.length-60); }
function emit(e){ if(!G.quiet){ G.ev.push(e); if(G.ev.length>200) G.ev.splice(0,100); } }
function toast(msg, kind){ if(!G.quiet && G.toast) G.toast(msg, kind); if(G.sum) G.sum.notes.push(msg); }

/* ---------------- items ---------------- */
function addItem(id, r){ const u={uid:G.S.nextUid++, id, r:r||0}; G.S.inv.push(u); return u; }
function addRelic(id){ const u={uid:G.S.nextUid++, relic:id}; G.S.inv.push(u); return u; }
function invItem(uid){ return G.S.inv.find(x=>x.uid===uid); }
function scaledStats(st, r){ const m=D.RARITY[r||0].mult, o={}; for(const k in st) o[k]=Math.max(1,Math.round(st[k]*m)); return o; }
function defOf(u){ if(u.relic) return Object.assign({slot:'relic', skills:[D.RELIC[u.relic].skill], price:500, r:4}, D.RELIC[u.relic]);
  const it=D.ITEM[u.id]; if(!u.r) return Object.assign({r:0}, it); return Object.assign({}, it, {r:u.r, stats:scaledStats(it.stats,u.r)}); }
function equippedBy(uid){ return G.S.chars.findIndex(c=>Object.values(c.equip).includes(uid)); }
function charGear(c){ return D.SLOTS.map(s=>c.equip[s]!=null?invItem(c.equip[s]):null).filter(Boolean); }

/* ---------------- derived stats ---------------- */
const SUM_KEYS = ['hit','crit','dodge','counter','double','regen','postHeal','gold','xp','dr','physFlat','physPct','spellPct','healPct','holyPct','wildPct','shadowPct','weakPct','spellFlat','echo','haste','taunt','first','rage','cleaveChance','pack','critDmg','mpCut','killMp','poisonPlus','thorns','dmgPct','endure','gearPlus','stam'];
function addEff(d, eff){
  if(!eff) return;
  if(eff.stat) for(const k in eff.stat) d[k]+=eff.stat[k];
  for(const k of SUM_KEYS) if(eff[k]) d.f[k]=(d.f[k]||0)+eff[k];
  if(eff.apEvery) d.f.apEvery = Math.min(d.f.apEvery||99, eff.apEvery);
  if(eff.mpEvery) d.f.mpEvery = Math.min(d.f.mpEvery||99, eff.mpEvery);
  if(eff.rebirth) d.f.rebirth = Math.max(d.f.rebirth||0, eff.rebirth);
  if(eff.secondWind) d.f.secondWind = eff.secondWind + Math.floor(d.lv/(eff.swScale||99));
  if(eff.spellFlat && eff.sfScale) d.f.spellFlat += Math.floor(d.lv/eff.sfScale);
}
function raceTraits(c){ return D.RACES[c.race].traits.filter(t=>c.lv>=t.lv); }
// grid nodes a hero has unlocked in a job
function jobNodes(c, jid){ const jt=c.jobs[jid]; if(!jt) return []; return D.JOBS[jid].nodes.filter(n=>jt.nodes[n.id]); }
// abilities kept from other jobs (lock-in): one node per job, active when that job is NOT the main job
function lockedNodes(c){ const out=[]; for(const jid in c.locks){ if(jid===c.job) continue; const n=D.JOBS[jid]&&D.JOBS[jid].node[c.locks[jid]]; if(n && c.jobs[jid]&&c.jobs[jid].nodes[n.id]) out.push({jid, n}); } return out; }
// all skills currently usable: { id: source }
function skillSet(c){
  const out = {};
  for(const id in c.learned) out[id]='learned';
  for(const u of charGear(c)) for(const id of defOf(u).skills) if(!out[id]) out[id]='gear';
  if(c.job){ out[D.JOBS[c.job].cmd]='job'; for(const n of jobNodes(c,c.job)) if(n.eff.grant) out[n.eff.grant]='job'; }
  if(c.sub && subjobOk(c, c.sub)){ out[D.JOBS[c.sub].cmd] = out[D.JOBS[c.sub].cmd]||'sub'; for(const n of jobNodes(c,c.sub)) if(n.eff.grant && !out[n.eff.grant]) out[n.eff.grant]='sub'; }
  for(const {n} of lockedNodes(c)) if(n.eff.grant && !out[n.eff.grant]) out[n.eff.grant]='lock';
  for(const mid in (c.mentors||{})){ const r=mentorRank(c,mid); const g=D.MENTOR[mid]&&D.MENTOR[mid].gifts; if(!g) continue;
    for(const rk of (D.MENTOR_GIFT_RANKS||[5,7,10])) if(r>=rk && g[rk] && g[rk].grant && !out[g[rk].grant]) out[g[rk].grant]='mentor'; }
  return out;
}
function isAbilityNode(n){ if(!n||!n.eff) return false; if(n.eff.grant) return true; const ks=Object.keys(n.eff); if(!ks.length) return false; if(ks.length===1 && ks[0]==='stat') return false; return true; }

function mentorRank(c, mid){ return (c.mentors[mid]&&c.mentors[mid].rank)||0; }
function mentorStatAmt(stat, v){ return stat==='hp'?v*3:stat==='mp'?v*2:v; }
function mentorMinusAmt(m, r){ const mn=D.MENTOR_MINUS(r); if(!mn) return 0; const base=m.minus==='hp'?mn*2:mn; return Math.round(base*(m.minusScale||1)); }
function mentorEff(c){ const o={}; for(const mid in c.mentors){ const r=mentorRank(c,mid); if(!r) continue; const m=D.MENTOR[mid]; if(!m) continue;
    const plus=D.MENTOR_PLUS(r);
    o[m.plus]=(o[m.plus]||0)+mentorStatAmt(m.plus, plus);
    if(m.plus2) o[m.plus2]=(o[m.plus2]||0)+mentorStatAmt(m.plus2, plus);
    const mn=mentorMinusAmt(m,r); if(mn) o[m.minus]=(o[m.minus]||0)-mn; } return o; }
function mentorGifts(c){ const out=[]; for(const mid in (c.mentors||{})){ const r=mentorRank(c,mid); const g=D.MENTOR[mid]&&D.MENTOR[mid].gifts; if(!g) continue;
    for(const rk of (D.MENTOR_GIFT_RANKS||[5,7,10])) if(r>=rk && g[rk] && g[rk].eff) out.push(g[rk].eff); } return out; }

const _calc = new WeakMap();
function calcBase(c){
  const hit=_calc.get(c); if(hit && hit.v===G.cv) return hit.d;
  const r = D.RACES[c.race];
  const d = {lv:c.lv, f:{}};
  for(const k of D.STATS) d[k] = r.base[k] + Math.floor(r.grow[k]*(c.lv-1) + 1e-9);
  for(const t of raceTraits(c)) addEff(d, t.eff);
  const gp = raceTraits(c).some(t=>t.eff.gearPlus) ? 1 : 0;
  for(const u of charGear(c)){ const it=defOf(u); for(const k in it.stats) d[k]+=it.stats[k];
    if(gp && it.slot==='weapon') d[it.stats.mag>it.stats.str?'mag':'str']+=1; if(gp && it.slot==='armor') d.def+=1;
    if(it.bonus) addEff(d, it.bonus); }
  const ss = skillSet(c);
  for(const id in ss){ const s=D.SKILLS[id]; if(s && s.kind==='passive') addEff(d, s.eff); }
  if(c.job){ const j=D.JOBS[c.job]; for(const k in j.stats) d[k]+=j.stats[k]; for(const n of jobNodes(c,c.job)) if(!n.eff.grant) addEff(d, n.eff); }
  if(c.sub && subjobOk(c,c.sub)){ const j=D.JOBS[c.sub]; for(const k in j.stats) d[k]+=Math.max(1,Math.floor(j.stats[k]/2));
    for(const n of jobNodes(c,c.sub)) if(isAbilityNode(n) && !n.eff.grant) addEff(d, n.eff); }
  for(const {n} of lockedNodes(c)) if(!n.eff.grant) addEff(d, n.eff);
  const me=mentorEff(c); for(const k in me) d[k]+=me[k];
  for(const eff of mentorGifts(c)) addEff(d, eff);
  if(c.drill){ const u=(D.DRILL&&D.DRILL.unit)||0.001; d.f.xp=(d.f.xp||0)+(c.drill.xp||0)*u; d.f.gold=(d.f.gold||0)+(c.drill.gold||0)*u; }
  const S=G.S;
  if(S && D.BUILD_AURA){ for(const b in D.BUILD_AURA){ const L=S.buildings[b]||0; if(!L) continue; const a=D.BUILD_AURA[b]; const sc={}; for(const k in a){ if(k==='stat') continue; sc[k]=(a[k]||0)*L; } addEff(d, sc); } }
  const meals=(S && S.loc==='exp') ? (Array.isArray(S.foods)&&S.foods.length? S.foods : (S.food?[S.food]:[])) : [];
  for(const fid of meals){ const f=D.FOOD[fid]; if(f&&f.buff) for(const k in f.buff) d[k]+=f.buff[k]; }
  for(const k of ['str','def','mag','agi']) d[k]=Math.max(k==='def'?0:1, d[k]);
  d.maxHp = Math.max(4, d.hp); d.maxMp = Math.max(0, d.mp);
  d.maxStam = D.STAM.base + D.STAM.perLv*(c.endLv-1) + (d.f.stam||0);
  _calc.set(c, {v:G.cv, d}); return d;
}
function calc(c, buffs){ const b=calcBase(c); if(!buffs) return b; let any=false; for(const k in buffs) if(buffs[k]){ any=true; break; } if(!any) return b;
  const d=Object.assign({}, b); for(const k in buffs) d[k]+=buffs[k]; d.maxHp=Math.max(4,d.hp); d.maxMp=Math.max(0,d.mp); return d; }
function maxStam(c){ return calcBase(c).maxStam; }
function typeCounts(c){ const n={}; for(const id in c.learned){ const t=D.SKILLS[id]&&D.SKILLS[id].type; if(t) n[t]=(n[t]||0)+1; } return n; }
function bestMentorRank(c, jid){ let r=0; for(const m of D.MENTORS) if(m.job===jid) r=Math.max(r, mentorRank(c,m.id)); return r; }
function jobReqMet(c, jid){ const j=D.JOBS[jid], n=typeCounts(c); for(const t in j.req) if((n[t]||0)<j.req[t]) return false; return true; }
function jobMentorNeed(j){ if(!j) return 0; if(j.needRank!=null) return j.needRank; if(j.adv===2) return 5; if(j.adv) return 1; return 0; }
function bestJobMentorRank(c, jid){ let r=bestMentorRank(c,jid); const j=D.JOBS[jid]; if(j&&j.from) for(const fid of j.from) r=Math.max(r, bestMentorRank(c,fid)); return r; }
function jobFromOk(c, jid){ const j=D.JOBS[jid]; if(!j||!j.from) return true; return j.from.some(fid=>c.job===fid || c.sub===fid || !!c.jobs[fid]); }
function jobUnlocked(c, jid){ const j=D.JOBS[jid]; const need=jobMentorNeed(j); const mr=bestJobMentorRank(c,jid);
  if(j.adv){ if(!jobReqMet(c,jid)) return false; if(mr<need) return false; if(!jobFromOk(c,jid)) return false; return true; }
  return jobReqMet(c,jid) || mr>=1; }
function jobWhy(c, jid){ const j=D.JOBS[jid], n=typeCounts(c), miss=[];
  for(const t in j.req) if((n[t]||0)<j.req[t]) miss.push(`${j.req[t]} learned ${D.TYPES[t].name} skill${j.req[t]>1?'s':''} (have ${n[t]||0})`);
  const need=jobMentorNeed(j), mr=bestJobMentorRank(c,jid);
  if(need && mr<need){ const ids=j.from? j.from.concat(jid):[jid]; const ms=D.MENTORS.filter(m=>ids.includes(m.job)).map(m=>m.name).join(' or ')||'a mentor of this craft'; miss.push(`rank ${need} with ${ms}`); }
  if(!jobFromOk(c,jid)) miss.push('first walk the path of '+(j.from||[]).map(id=>D.JOBS[id].name).join(' or '));
  return miss.join(' · '); }
function subjobOk(c, jid){ if(!jid || jid===c.job || !D.JOBS[jid]) return false;
  if(bestJobMentorRank(c,jid)>=3) return true;
  for(const mid in (c.mentors||{})){ if(c.mentors[mid]&&c.mentors[mid].legacySub && D.MENTOR[mid] && (D.MENTOR[mid].job===jid || (D.JOBS[jid].from||[]).includes(D.MENTOR[mid].job))) return true; }
  return false; }
function setJob(ci, jid){ const c=G.S.chars[ci]; if(jid && !jobUnlocked(c,jid)) return false; c.job=jid||null; if(jid && !c.jobs[jid]) c.jobs[jid]={jp:0, nodes:{core:1}}; if(c.sub===jid) c.sub=null; dirty(); fixHpMp(c); return true; }
function setSub(ci, jid){ const c=G.S.chars[ci]; if(jid && !subjobOk(c,jid)) return false; c.sub=jid||null; if(jid && !c.jobs[jid]) c.jobs[jid]={jp:0, nodes:{core:1}}; dirty(); fixHpMp(c); return true; }
function nodeAvailable(c, jid, n){
  const jt=c.jobs[jid]||{jp:0, nodes:{}};
  if(jt.nodes[n.id]) return {ok:false, why:'Unlocked', have:1};
  if(c.job!==jid) return {ok:false, why:'Only the main job earns JP'};
  if(!n.links.some(l=>jt.nodes[l])) return {ok:false, why:'Unlock a linked node first'};
  if((jt.jp||0)<n.cost) return {ok:false, why:`Needs ${n.cost} JP (have ${jt.jp||0})`};
  return {ok:true};
}
function buyNode(ci, jid, nid){ const c=G.S.chars[ci], n=D.JOBS[jid].node[nid]; if(!n) return false; const a=nodeAvailable(c,jid,n); if(!a.ok) return false; const jt=c.jobs[jid]; jt.jp-=n.cost; jt.nodes[nid]=1; dirty();
  log(`✦ ${c.name} unlocked ${n.name} (${D.JOBS[jid].name}).`,'good'); fixHpMp(c); return true; }
function jobProgress(c, jid){ const jt=c.jobs[jid]; if(!jt) return {n:0, of:D.JOBS[jid].nodes.length-1}; return {n:Object.keys(jt.nodes).filter(k=>k!=='core').length, of:D.JOBS[jid].nodes.length-1}; }
function lockable(c, jid){ return jobNodes(c,jid).filter(n=>n.ability); }
function setLock(ci, jid, nid){ const c=G.S.chars[ci]; if(!nid){ delete c.locks[jid]; dirty(); return true; }
  const n=D.JOBS[jid].node[nid]; if(!n||!n.ability||!(c.jobs[jid]&&c.jobs[jid].nodes[nid])) return false; c.locks[jid]=nid; dirty(); fixHpMp(c); return true; }
function fixHpMp(c){ const d=calcBase(c); c.hp=Math.min(c.hp, d.maxHp); c.mp=Math.min(c.mp, d.maxMp); c.stam=Math.min(c.stam, d.maxStam); }

/* ---------------- town: workers & professions ---------------- */
function workerSlots(){ return G.S.hired; }
function workersUsed(){ return Object.values(G.S.workers).reduce((a,b)=>a+(b||0),0); }
function hireCost(){ const n=G.S.hired; return n<D.WORKER_COST.length ? D.WORKER_COST[n] : null; }
function hire(){ const S=G.S, c=hireCost(); if(c==null||S.gold<c) return false; S.gold-=c; S.hired++; log(`🧑‍🌾 ${D.WORKER_NAMES[S.hired-1]||'A new worker'} joins the town (${S.hired} workers).`,'good'); toast(`🧑‍🌾 Hired a worker (${S.hired} total)`,'good'); return true; }
// workers[prof] = number assigned
function assign(p, delta){ const S=G.S; const cur=S.workers[p]||0; if(delta>0 && workersUsed()>=workerSlots()) return false; const n=Math.max(0,cur+delta); if(n) S.workers[p]=n; else delete S.workers[p]; return true; }
function zoneOpen(zi){ return zi===0 || G.S.zones[zi-1].boss; }
function profEvery(o, L){ return Math.max(o[2], o[1]*Math.pow(0.965, L-1)); }
function profOutputs(p){ const L=G.S.profs[p].lv; return D.PROFS[p].out.map(o=>({key:o[0], every:profEvery(o,L), minLv:o[3], zone:o[4], ok:L>=o[3] && zoneOpen(o[4])})); }
function cookEvery(){ return Math.max(90, D.COOK_SEC*(1-0.02*(G.S.profs.cooking.lv-1))); }
function bestMeal(){ const S=G.S; const ok=D.FOODS.filter(f=>f.tav<=S.buildings.tavern && f.cook<=S.profs.cooking.lv); return ok; }
function gain(mat, n){ const S=G.S; if(mat==='diamond'){ S.diamonds+=n; S.stats.diamondsEarned+=n; if(G.sum) G.sum.diamonds=(G.sum.diamonds||0)+n; return; }
  S.mats[mat]=(S.mats[mat]||0)+n; if(G.sum) G.sum.mats[mat]=(G.sum.mats[mat]||0)+n; }
function tickProfs(dt){
  const S=G.S;
  for(const p in S.workers){ const w=S.workers[p]||0; if(!w) continue; const pr=S.profs[p];
    if(pr.lv<MAX_LV){ pr.xp += dt*w; while(pr.xp>=profNeed(pr.lv) && pr.lv<MAX_LV){ pr.xp-=profNeed(pr.lv); pr.lv++; log(`${D.PROFS[p].icon} ${D.PROFS[p].name} reached Lv ${pr.lv}.`,'good'); toast(`${D.PROFS[p].icon} ${D.PROFS[p].name} Lv ${pr.lv}`,'good'); if(G.sum) G.sum.profUps++; } }
    pr.acc=pr.acc||{};
    if(p==='cooking'){ const list=bestMeal(); if(!list.length) continue; pr.acc.meal=(pr.acc.meal||0)+dt*w; const ev=cookEvery();
      while(pr.acc.meal>=ev){ // cook the best recipe we have ingredients for
        const f=[...list].reverse().find(f=>Object.entries(f.mats).every(([m,n])=>(S.mats[m]||0)>=n)); if(!f){ pr.acc.meal=Math.min(pr.acc.meal, ev); break; }
        pr.acc.meal-=ev; for(const m in f.mats) S.mats[m]-=f.mats[m]; S.meals[f.id]=(S.meals[f.id]||0)+1; if(G.sum) G.sum.meals=(G.sum.meals||0)+1; }
      continue; }
    for(const o of profOutputs(p)){ if(!o.ok) continue; pr.acc[o.key]=(pr.acc[o.key]||0)+dt*(o.key==='diamond'?1:w); const n=Math.floor(pr.acc[o.key]/o.every); if(n<=0) continue; pr.acc[o.key]-=n*o.every;
      if(o.key==='gear'){ for(let i=0;i<n;i++) smithForge(); }
      else if(o.key==='study'){ const seen=Object.keys(S.bestiary).filter(id=>!isBossId(id)); for(let i=0;i<n && seen.length;i++){ addResearch(pick(seen), 1); } }
      else gain(o.key, n); }
  }
}
// Smithing occasionally forges a Common piece from the Forge pool (or any type if no hall built)
function smithForge(){ const S=G.S; const types=D.BANNER_ORDER.filter(b=>S.buildings[b]>0).map(b=>D.BANNERS[b].type); const cap=Math.min(maxZoneOpen(), Math.floor(S.profs.smithing.lv/6));
  const pool=D.ITEMS.filter(it=>it.tier<=cap && it.skills.some(s=>types.includes(D.SKILLS[s].type))); if(!pool.length) return;
  const it=pick(pool); addItem(it.id, 0); log(`⚒️ The smithy forged a ${it.icon} ${it.name}.`,'loot'); toast(`⚒️ Smithy forged ${it.icon} ${it.name}`,'good'); if(G.sum) G.sum.items.push(it.name); }
function profPerkText(p){ const L=G.S.profs[p].lv;
  if(p==='cooking') return `Cooks a meal every ${fmtTime(cookEvery())} (needs ingredients and a Tavern recipe)`;
  if(p==='banking') return `Town Bank earns ${(bankRate()*100).toFixed(2)}% interest per day`+(G.S.workers.banking?` (${G.S.workers.banking} banker${G.S.workers.banking>1?'s':''} tending the books)`:' — assign a banker to raise the rate');
  if(p==='scholarship') return (profOutputs(p).map(o=>{ const nm=o.key==='study'?'📜 research (lowers kills needed, never adds kills)':o.key==='ecto'?(D.MATS.ecto?D.MATS.ecto.icon+' '+D.MATS.ecto.name:'ecto'):o.key;
    if(o.ok) return `${nm} every ${fmtTime(o.every)}`; const why=L<o.minLv?`Lv ${o.minLv}`:`reach ${D.ZONES[o.zone].name}`; return `${nm} — ${why}`; }).join(' · ')||'Researches seen foes');
  const outs=profOutputs(p); if(!outs.length) return D.PROFS[p].desc;
  return outs.map(o=>{ const nm=o.key==='diamond'?'💎 Diamond':o.key==='gear'?'🗡️ Common gear':o.key==='study'?'📜 research':(D.MATS[o.key]?D.MATS[o.key].icon+' '+D.MATS[o.key].name:o.key);
    if(o.ok) return `${nm} every ${fmtTime(o.every)}`; const why=L<o.minLv?`Lv ${o.minLv}`:`reach ${D.ZONES[o.zone].name}`; return `${nm} — ${why}`; }).join(' · '); }

/* ---------------- buildings ---------------- */
function buildCost(b){ const L=G.S.buildings[b]+1; if(L>D.BMAX) return null; const c=D.BUILD_COST[L]; const mats={stone:c.stone, timber:c.timber};
  if(L>=2){ const x=D.BUILD_MATS[b][L-2]; mats[x]=(mats[x]||0)+3*L; } const prof=D.BUILD[b].prof; return {lv:L, prof, profLv:prof?c.prof:0, masonry:c.masonry||0, gold:c.gold, mats}; }
function canBuild(b){ const c=buildCost(b); if(!c) return {ok:false, why:'Max level'}; const S=G.S;
  const miss=[]; if(c.prof && S.profs[c.prof].lv<c.profLv) miss.push(`${D.PROFS[c.prof].name} Lv ${c.profLv}`);
  if(c.masonry && ((S.profs.masonry&&S.profs.masonry.lv)||0)<c.masonry) miss.push(`Masonry Lv ${c.masonry}`);
  if(S.gold<c.gold) miss.push(`${c.gold} gold`);
  for(const m in c.mats) if((S.mats[m]||0)<c.mats[m]) miss.push(`${c.mats[m]} ${D.MATS[m].name}`);
  return {ok:!miss.length, why:miss.join(', ')}; }
function build(b){ const a=canBuild(b); if(!a.ok) return false; const c=buildCost(b), S=G.S; S.gold-=c.gold; for(const m in c.mats) S.mats[m]-=c.mats[m]; S.buildings[b]=c.lv;
  const nm=D.PLACES[b].name; log(`🏗️ The ${nm} is now level ${c.lv}!`,'good'); toast(`🏗️ ${nm} ${c.lv===1?'built':'upgraded to Lv '+c.lv}`,'good'); dirty(); return true; }
function canAfford(gold, mats){ const S=G.S; if(S.gold<gold) return false; for(const m in mats) if((S.mats[m]||0)<mats[m]) return false; return true; }
function pay(gold, mats){ const S=G.S; S.gold-=gold; for(const m in mats) S.mats[m]-=mats[m]; }

/* ---------------- market ---------------- */
function sellBonus(){ return 1+Math.min(40,G.S.profs.smithing.lv)/100 + 0.05*G.S.buildings.market; }
function sellPrice(u){ const it=defOf(u); if(u.relic) return 0; return Math.max(1, Math.floor((it.price||Math.round(20*Math.pow(2.1,it.tier)))*0.4*D.RARITY[u.r||0].sell*sellBonus())); }
function marketSlots(){ const L=G.S.buildings.market||1; return 2+Math.floor((L-1)/2); }
function refreshMarket(force){
  const S=G.S; S.market=S.market||{at:0,list:[]}; const now=G.now(); const every=D.MARKET_EVERY||8*3600;
  if(!force && Array.isArray(S.market.list) && S.market.list.length && now-S.market.at<every) return S.market;
  const pool=D.ITEMS.filter(it=>it.shop && it.shop<=S.buildings.market);
  const n=Math.min(marketSlots(), pool.length); const bag=pool.slice();
  for(let i=bag.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=bag[i]; bag[i]=bag[j]; bag[j]=t; }
  S.market={at:now, list:bag.slice(0,n).map(it=>it.id)}; return S.market;
}
function marketLeft(){ const at=(G.S.market&&G.S.market.at)||0; return Math.max(0, (D.MARKET_EVERY||8*3600) - (G.now()-at)/1000); }
function shopItems(){ refreshMarket(false); const ids=(G.S.market&&G.S.market.list)||[]; return ids.map(id=>D.ITEM[id]).filter(Boolean); }
function buyPrice(it){ return Math.ceil(it.price*3); }
function buyItem(id){ const it=D.ITEM[id], p=buyPrice(it), S=G.S; if(!it||S.gold<p) return false;
  refreshMarket(false); const inStock=((S.market&&S.market.list)||[]).includes(id); if(!inStock) return false;
  S.gold-=p; addItem(id); S.stats.bought++; return true; }
function sellItem(uid){ const S=G.S; const i=S.inv.findIndex(x=>x.uid===uid); if(i<0||S.inv[i].relic||equippedBy(uid)>=0) return 0; const g=sellPrice(S.inv[i]); S.inv.splice(i,1); S.gold+=g; return g; }
function isMastered(u){ const it=defOf(u); return !u.relic && it.skills.every(s=>G.S.chars.every(c=>c.learned[s])); }
function bulkSellMastered(){ let g=0,n=0; for(const u of [...G.S.inv]) if(equippedBy(u.uid)<0 && isMastered(u)){ g+=sellItem(u.uid); n++; } return {g,n}; }
function sellMats(){ const S=G.S; let g=0; for(const m in D.MATS){ if(!D.MATS[m].gem) continue; const n=S.mats[m]||0; if(n){ g+=n*D.MATS[m].sell; S.mats[m]=0; } } S.gold+=g; return g; }

/* ---------------- stamina, training, mentors (in town) ---------------- */
function stamRegenSec(c){ return D.STAM.regenSec/(1+D.STAM.regenPerLv*(c.endLv-1)); }
function enduranceCap(){ return 5*G.S.buildings.training; }
function mentorNeedLv(mid){ const m=D.MENTOR[mid]; return m.need<=1?1:m.need<=3?3:5; }
function mentorAvailable(mid){ const m=D.MENTOR[mid]; return (G.S.buildings[m.place]||0)>=mentorNeedLv(mid); }
function setAct(ci, act){ const c=G.S.chars[ci]; if(act.startsWith('m:') && !mentorAvailable(act.slice(2))) return false; if(act==='train' && c.endLv>=enduranceCap()) return false;
  if(act.startsWith('m:') && mentorRank(c,act.slice(2))>=D.MENTOR_MAX) return false; c.act=act; return true; }
function tickTown(dt){
  const S=G.S; if(S.loc!=='town') return;
  for(const c of S.chars){
    const ms=maxStam(c); const rate=(c.act==='rest'?D.STAM.restMult:1)/stamRegenSec(c);
    if(c.stam<ms){ c.stam=Math.min(ms, c.stam+dt*rate); }
    const d=calcBase(c); c.hp=d.maxHp; c.mp=d.maxMp;
    if(c.act==='train'){ if(c.endLv>=enduranceCap()){ c.act='rest'; continue; } c.endXp+=dt*(1+0.1*(S.buildings.training-1));
      while(c.endXp>=enduranceNeed(c.endLv) && c.endLv<enduranceCap()){ c.endXp-=enduranceNeed(c.endLv); c.endLv++; dirty(); log(`🎯 ${c.name}'s Endurance is now ${c.endLv} (max stamina ${maxStam(c)}).`,'good'); toast(`🎯 ${c.name}: Endurance ${c.endLv}`,'good'); if(G.sum) G.sum.notes.push(`${c.name}: Endurance ${c.endLv}`); } }
    else if(c.act.startsWith('m:')){ const mid=c.act.slice(2), m=D.MENTOR[mid]; if(!mentorAvailable(mid)){ c.act='rest'; continue; }
      const st=c.mentors[mid]=c.mentors[mid]||{rank:0, xp:0}; if(st.rank>=D.MENTOR_MAX){ c.act='rest'; continue; }
      st.xp+=dt; while(st.xp>=mentorNeed(st.rank) && st.rank<D.MENTOR_MAX){ st.xp-=mentorNeed(st.rank); st.rank++; dirty(); fixHpMp(c);
        const j=D.JOBS[m.job]; const gift=m.gifts&&m.gifts[st.rank];
        let msg=`${c.name} reached rank ${st.rank} with ${m.name} (+${D.MENTOR_PLUS(st.rank)} ${m.plus.toUpperCase()}).`;
        if(st.rank===1) msg=`${c.name} can now take ${j.icon} ${j.name} as a main job.`;
        if(st.rank===3) msg=`${c.name} can now take ${j.icon} ${j.name} as a sub job.`;
        if(gift) msg=`${c.name} learned ${gift.name} from ${m.name}: ${gift.desc}`;
        log(`🎓 ${msg}`,'learn'); toast(`🎓 ${msg}`,'learn'); if(G.sum) G.sum.notes.push(msg); } }
  }
}

/* ---------------- sources (for the "where to get it" UI) ---------------- */
function matSources(m){
  const out=[];
  for(const p of D.PROF_ORDER) for(const o of D.PROFS[p].out) if(o[0]===m){ const z=o[4]?` once ${D.ZONES[o[4]].name} is open`:''; out.push({kind:'prof', text:`${D.PROFS[p].icon} ${D.PROFS[p].name} worker (Town Hall) — from Lv ${o[3]}${z}`}); }
  return out;
}
function itemSources(id){
  const out=[]; const it=D.ITEM[id];
  if(it.shop) out.push({text:`⚖️ Market (Lv ${it.shop}+) — Common, ${buyPrice(it)} gold`});
  for(const b of D.BANNER_ORDER) if(it.skills.some(x=>D.SKILLS[x].type===D.BANNERS[b].type)) out.push({text:`💎 ${D.BANNERS[b].icon} ${D.BANNERS[b].name} pulls (hall Lv ${it.tier+1}+, ${D.ZONES[it.tier].name} reached)`});
  out.push({text:`⚒️ Smithing worker now and then forges a Common one (Smithing Lv ${it.tier*6}+)`});
  return out;
}
function skillSources(sid){ const out=[]; D.ITEMS.forEach(it=>{ if(it.skills.includes(sid)) out.push(it); }); D.RELICS.forEach(r=>{ if(r.skill===sid) out.push(Object.assign({relicDef:1}, r)); }); return out; }

/* ---------------- bestiary & collection ---------------- */
function isBossId(eid){ return D.ZONES.some(Z=>Z.boss && Z.boss.id===eid); }
function killsNeeded(tier){ const base=D.BEAST_TIERS[tier].kills; const lib=(G.S.buildings&&G.S.buildings.library)||0; const red=Math.min(0.5, (D.LIB_KILL_REDUCE||0.07)*lib); return Math.max(Math.ceil(base*0.5), Math.round(base*(1-red))); }
function beastNeed(eid, tier){ const need=killsNeeded(tier); const res=isBossId(eid)?0:((G.S.research&&G.S.research[eid])||0); return Math.max(Math.ceil(D.BEAST_TIERS[tier].kills*0.4), need-res); }
function beastTier(eid){ const k=G.S.bestiary[eid]||0; let t=0; D.BEAST_TIERS.forEach((x,i)=>{ if(i>0 && k>=beastNeed(eid,i)) t=i; }); return t; }
function beastTierByKills(eid){ const k=G.S.bestiary[eid]||0; let t=0; D.BEAST_TIERS.forEach((x,i)=>{ if(i>0 && k>=x.kills) t=i; }); return t; }
function addKill(eid, n, study){ if(study) return addResearch(eid, n); const S=G.S; const before=beastTier(eid); S.bestiary[eid]=(S.bestiary[eid]||0)+n; checkBeast(eid, before); }
function addResearch(eid, n){ const S=G.S; if(!eid||isBossId(eid)) return; S.research=S.research||{}; const before=beastTier(eid); S.research[eid]=(S.research[eid]||0)+(n||1); checkBeast(eid, before); }
function checkBeast(eid, before){ const S=G.S; const t=beastTier(eid); if(t<=before) return; const def=findEnemyDef(eid);
  for(let k=before+1;k<=t;k++){ const T=D.BEAST_TIERS[k]; const key=eid+':'+k; if(S.beastRewards[key]) continue; S.beastRewards[key]=1;
    let msg=`📚 Bestiary: ${def.name} is now ${T.label.split(' —')[0]}.`; if(T.dia){ gain('diamond', T.dia); msg+=` +${T.dia} 💎`; }
    log(msg,'good'); toast(msg,'good'); }
  checkCollections(); }
function recheckBeasts(){ for(const eid in G.S.bestiary) checkBeast(eid, 0); }
function zoneCollection(zi){ const S=G.S, Z=D.ZONES[zi];
  const foes=Z.enemies.map(e=>({e, t:beastTier(e.id), k:S.bestiary[e.id]||0, gilded:!!S.variants[e.id]}));
  const done = foes.every(f=>f.t>=3) && foes.every(f=>f.gilded) && S.zones[zi].boss;
  const relic=D.RELICS.find(r=>r.zone===zi);
  return {foes, boss:S.zones[zi].boss, done, relic, got:relic && S.relicsFound[relic.id]}; }
function checkCollections(){ const S=G.S; D.ZONES.forEach((z,zi)=>{ const c=zoneCollection(zi); if(c.done && c.relic && !c.got){ addRelic(c.relic.id); S.relicsFound[c.relic.id]=1; S.stats.relics++;
  log(`💠 Collection complete: ${z.name}! The Library awards ${c.relic.icon} ${c.relic.name}.`,'relic'); toast(`💠 RELIC: ${c.relic.icon} ${c.relic.name} — ${z.name} collection complete!`,'relic'); emit({t:'relic', id:c.relic.id}); if(G.sum) G.sum.items.push('💠 '+c.relic.name); } }); }
function enemyStats(e, zi){
  const r=D.ROLES[e.role], P=D.ZP; const b=e.boss?{hp:4.5,atk:1.25,def:1.2,agi:1.1,xp:8,gold:10}:{hp:1,atk:1,def:1,agi:1,xp:1,gold:1};
  const late=zi<1?1:zi===1?1.22:zi===2?1.20:1+0.22*(zi-2); // mid zones a little sturdier so unique mid-tier gear does not shrink the calendar
  return {hp:Math.max(3,Math.round(P.hp[zi]*r.hp*b.hp*late)), atk:Math.max(2,Math.round(P.atk[zi]*r.atk*b.atk*late)), def:Math.round(P.def[zi]*r.def*b.def*late), agi:Math.max(1,Math.round(P.agi[zi]*r.agi*b.agi)),
    mag:r.mag?Math.round(P.atk[zi]*r.mag*b.atk*late):0, xp:Math.round(P.xp[zi]*(r.hp+r.atk)/2*b.xp), gold:Math.max(1,Math.round(P.gold[zi]*b.gold))};
}

/* ---------------- battle ---------------- */
function living(){ return G.S.chars.map((c,i)=>({c,i})).filter(x=>x.c.hp>0); }
function liveEnemies(){ return G.S.battle.enemies.filter(e=>e.hp>0); }
function newRound(){
  const B=G.S.battle; B.round++;
  const actors=[];
  G.S.chars.forEach((c,i)=>{ if(c.hp>0){ const d=calc(c,B.buffs); let init=d.agi*rnd(.7,1.3); if(B.round===1&&d.f.first) init+=100; actors.push({side:'p', i, init});
      if(d.f.haste && chance(d.f.haste)) actors.push({side:'p', i, init:init*.5, haste:1}); } });
  B.enemies.forEach((e,i)=>{ if(e.hp>0) actors.push({side:'e', i, init:(e.agi-(e.deb.agi||0))*rnd(.7,1.3)}); });
  actors.sort((a,b)=>b.init-a.init); B.queue=actors;
}
function hitChance(aAgi, tAgi, bonus, dodge){ return clamp(0.86 + (bonus||0) + (aAgi-tAgi)*0.015 - (dodge||0), 0.55, 0.98); }
function enemyDef(e){ return Math.max(0, e.def-(e.deb.def||0)); }
function weakMult(d, e, el){
  if(!el || el!==e.weak) return 1;
  const t=beastTier(e.id); return 1.5 + (d.f.weakPct||0) + (t>=4?.5:t>=3?.25:0);
}
function dealToEnemy(ai, e, dmg, how, pre){
  const B=G.S.battle; dmg=Math.max(0,Math.round(dmg)); e.hp=Math.max(0,e.hp-dmg); emit({t:'hitE', i:e.idx, dmg, how});
  if(pre) pre(dmg);
  if(e.hp<=0){ log(`${e.name} is defeated!`,'kill'); emit({t:'killE', i:e.idx}); const c=G.S.chars[ai]; if(c){ const d=calc(c,B.buffs); if(d.f.killMp) c.mp=Math.min(d.maxMp, c.mp+d.f.killMp); } }
  return dmg;
}
function physOn(ci, d, e, mult, opts){
  opts=opts||{}; const c=G.S.chars[ci];
  if(!opts.sure && !chance(hitChance(d.agi, e.agi-(e.deb.agi||0), d.f.hit))){ log(`${c.name} misses ${e.name}!`,'miss'); emit({t:'missE', i:e.idx}); return 0; }
  let str=d.str + (d.f.rage && c.hp<d.maxHp/2 ? d.f.rage : 0);
  let raw = str*mult*rnd(.85,1.15) + (d.f.physFlat||0) + (d.f.pack? Math.min(3, living().length-1):0);
  const crit = chance(0.04 + (d.f.crit||0) + (opts.crit||0));
  let el = opts.el; if(opts.weakSeek) el=e.weak;
  let dmg = crit ? raw*(1.5+(d.f.critDmg||0)) : raw - enemyDef(e)*0.6;
  dmg *= (1+(d.f.physPct||0)+(d.f.dmgPct||0)) * weakMult(d,e,el) * (el==='holy'?1+(d.f.holyPct||0):1);
  if(dmg<1) dmg = chance(.5)?1:0;
  return dealToEnemy(ci, e, dmg, crit?'crit':'', dmg=>log(dmg===0? `${c.name} hits ${e.name}, but it shrugs it off.` : `${c.name} ${opts.verb||'attacks'}! ${crit?'Critical! ':''}${e.name} takes ${dmg} damage.${el&&el===e.weak?' (weakness!)':''}`, crit?'crit':''));
}
function spellOn(ci, d, e, power, el, scale){
  const c=G.S.chars[ci];
  let raw=(power + d.mag*scale + (d.f.spellFlat||0))*rnd(.9,1.1) - enemyDef(e)*0.25;
  const elPct = el==='holy'?d.f.holyPct: el==='wild'?d.f.wildPct: el==='shadow'?d.f.shadowPct: 0;
  raw *= (1+(d.f.spellPct||0)+(d.f.dmgPct||0)+(elPct||0)) * weakMult(d,e,el);
  if(raw<1) raw=1;
  return dealToEnemy(ci, e, raw, el, dmg=>log(`${e.name} takes ${dmg} ${el&&D.ELEMENTS[el]?D.ELEMENTS[el].split(' ')[1].toLowerCase()+' ':''}damage.${el===e.weak?' (weakness!)':''}`));
}
function healChar(ci, amt, d){ const c=G.S.chars[ci], md=calc(c,G.S.battle&&G.S.battle.buffs); const before=c.hp; c.hp=Math.min(md.maxHp, c.hp+Math.round(amt)); const h=c.hp-before; emit({t:'healP', i:ci, amt:h}); return h; }
function usableSkills(c, d){
  const ss=skillSet(c), out=[];
  for(const id in ss){ const s=D.SKILLS[id]; if(!s||s.kind!=='active') continue; if(c.skillOff&&c.skillOff[id]) continue; const cost=Math.max(s.mp?1:0,(s.mp||0)-(s.eff.spell||s.eff.heal?(d.f.mpCut||0):0)); out.push({id, s, cost}); }
  return out;
}
function toggleSkill(ci, sid){ const c=G.S.chars[ci]; if(!c||!D.SKILLS[sid]) return false; c.skillOff=c.skillOff||{}; if(c.skillOff[sid]) delete c.skillOff[sid]; else c.skillOff[sid]=1; dirty(); return true; }

function playerTurn(ci, extra){
  const S=G.S, B=S.battle, c=S.chars[ci]; const d=calc(c,B.buffs); const cs=B.cs[ci];
  if(d.f.regen && c.hp>0 && c.hp<d.maxHp){ const h=healChar(ci, d.f.regen); }
  if(d.f.mpEvery && B.round % d.f.mpEvery===0 && !extra) c.mp=Math.min(d.maxMp, c.mp+1);
  if(d.f.secondWind && !cs.used.sw && c.hp<d.maxHp*.3){ cs.used.sw=1; const h=healChar(ci, d.f.secondWind); log(`${c.name} catches a second wind! +${h} HP.`,'heal'); }
  const foes=liveEnemies(); if(!foes.length) return;
  const party=living(); const ko=S.chars.map((x,i)=>({x,i})).filter(o=>o.x.hp<=0);
  const skills=usableSkills(c,d).filter(k=>k.cost<=c.mp);
  const has=id=>skills.find(k=>k.id===id);
  const useSkill=(k, target)=>{ c.mp-=k.cost; return doSkill(ci, d, k.id, target); };
  // 1) revive the fallen
  if(ko.length){ const rv=skills.find(k=>k.s.eff.revive||k.s.eff.reviveAll); if(rv){ useSkill(rv, ko[0].i); return; }
  }
  // 2) heal
  const healThr = c.tactic==='heal' ? .65 : .45;
  const hurt = party.filter(o=>{ const md=calc(o.c,B.buffs); return o.c.hp < md.maxHp*healThr; }).sort((a,b)=>a.c.hp/calc(a.c).maxHp - b.c.hp/calc(b.c).maxHp);
  if(hurt.length && c.tactic!=='attack'){
    const aoe=skills.filter(k=>k.s.tgt==='party'&&k.s.eff.heal); const one=skills.filter(k=>k.s.tgt==='ally'&&k.s.eff.heal);
    if(hurt.length>=2 && aoe.length){ useSkill(aoe.sort((a,b)=>b.s.eff.heal-a.s.eff.heal)[0]); return; }
    if(one.length){ useSkill(one[0], hurt[0].i); return; }
    if(aoe.length){ useSkill(aoe[0]); return; }
  }
  const allSk=usableSkills(c,d); const caster=allSk.some(k=>k.s.eff.spell||k.s.eff.heal);
  // 5) skills
  if(c.tactic!=='attack' && skills.length){
    const healerReserve = allSk.some(k=>k.s.eff.heal) ? 2 : 0;
    const boss = B.boss; const mpRatio = d.maxMp? c.mp/d.maxMp : 0;
    const best = bestOffense(ci, d, skills, foes);
    // buffs early
    const buff=skills.find(k=>k.s.eff.buff && !B.buffsUsed?.[k.id]);
    if(buff && B.round<=2 && (foes.length>=2||boss)){ B.buffsUsed=B.buffsUsed||{}; B.buffsUsed[buff.id]=1; useSkill(buff); return; }
    const deb=skills.find(k=>(k.s.eff.debuff||k.s.eff.stun) && !k.s.eff.phys && foes.some(f=>!f.deb[k.id]));
    if(deb && (boss||foes.some(f=>f.maxHp>=20)) && chance(.4)){ const f=foes.filter(f=>!f.deb[deb.id]).sort((a,b)=>b.hp-a.hp)[0]; f.deb[deb.id]=1; useSkill(deb, f.idx); return; }
    const st=skills.find(k=>k.s.eff.steal && !k.s.eff.phys); if(st && chance(.2)){ const f=pick(foes); if(!f.stolen){ useSkill(st, f.idx); return; } }
    if(best && (c.mp - best.cost >= healerReserve || boss) && (mpRatio>.25 || boss || best.cost<=1) && best.score > best.atk*1.08){ useSkill(best.k, best.t); return; }
  }
  // 6) attack
  attack(ci, d, foes);
}
function estPhys(d, e, mult){ return Math.max(.5, d.str*mult - enemyDef(e)*0.6) }
function bestOffense(ci, d, skills, foes){
  let best=null; const tgt=foes.slice().sort((a,b)=>a.hp-b.hp)[0];
  const atk = estPhys(d, tgt, 1)*(1+(d.f.physPct||0));
  for(const k of skills){ const ef=k.s.eff; let sc=0, t=tgt.idx;
    if(ef.phys){ const tw = ef.weakSeek ? tgt : (foes.find(f=>f.weak===ef.el)||tgt); t=tw.idx; sc = estPhys(d,tw,ef.phys)*(1+(d.f.physPct||0))*weakMult(d,tw,ef.weakSeek?tw.weak:ef.el)*(1+(ef.crit||0)); if(k.s.tgt==='all') sc*=foes.length; if(ef.debuff) sc+=1; if(ef.poison) sc+=2; if(ef.steal) sc+=1; if(ef.stun) sc+=1.5; }
    else if(ef.spell){ const tw=foes.find(f=>f.weak===ef.el)||tgt; t=tw.idx; const one=Math.max(1,(ef.spell + d.mag*(k.s.tgt==='enemy'?.7:.4) - enemyDef(tw)*.25))*weakMult(d,tw,ef.el); sc = k.s.tgt==='all'? one*foes.length : ef.hits? one*.6*ef.hits : one; }
    else continue;
    sc /= (1 + k.cost*0.08);
    if(!best || sc>best.score) best={k, score:sc, t, cost:k.cost, atk};
  }
  return best;
}
function attack(ci, d, foes){
  const S=G.S, c=S.chars[ci]; const e=foes.slice().sort((a,b)=>a.hp-b.hp)[0];
  if(d.f.cleaveChance && foes.length>1 && chance(d.f.cleaveChance)){ log(`${c.name} swings wildly at everyone!`); foes.forEach(f=>{ if(f.hp>0) physOn(ci,d,f,.9,{verb:'slashes'}); }); return; }
  physOn(ci, d, e, 1);
  if(d.f.double && chance(d.f.double)){ const f2=liveEnemies(); if(f2.length){ log(`${c.name} strikes again!`); physOn(ci, d, f2[0], 1); } }
}
function doSkill(ci, d, sid, target){
  const S=G.S, B=S.battle, c=S.chars[ci], s=D.SKILLS[sid], ef=s.eff;
  log(`${c.name} uses ${s.name}!`, 'skill'); emit({t:'skill', i:ci, sid});
  const foes=liveEnemies();
  const doOne = (e)=>{
    if(ef.phys){ const dmg=physOn(ci,d,e,ef.phys,{sure:ef.sure, crit:ef.crit, el:ef.el, weakSeek:ef.weakSeek, verb:'strikes'});
      if(ef.selfHeal) healChar(ci, ef.selfHeal);
      if(dmg>0 && ef.debuff) for(const k in ef.debuff){ e.deb[k]=(e.deb[k]||0)+ef.debuff[k]; log(`${e.name}'s ${D.STAT_NAMES[k]} falls by ${ef.debuff[k]}.`); }
      if(dmg>0 && ef.poison && e.hp>0){ e.poison={dmg:1+Math.floor(d.mag/5)+(d.f.poisonPlus||0), turns:3}; log(`${e.name} is poisoned!`); }
      if(dmg>0 && ef.stun && e.hp>0 && chance(ef.stun)){ e.stun=1; log(`${e.name} is stunned!`); }
      if(ef.steal) stealFrom(ci, e);
    } else if(ef.spell){ const scale = s.tgt==='enemy'?.7:(ef.hits?.35:.4); const dmg=spellOn(ci,d,e,ef.spell,ef.el,scale);
      if(ef.lifesteal) { const h=healChar(ci, dmg*ef.lifesteal); if(h) log(`${c.name} drains ${h} HP.`,'heal'); }
      if(d.f.echo && chance(d.f.echo) && e.hp>0 && s.tgt==='enemy'){ log(`✨ The spell echoes!`); spellOn(ci,d,e,ef.spell,ef.el,scale); }
    } else if(ef.debuff || ef.stun){ for(const k in (ef.debuff||{})){ e.deb[k]=(e.deb[k]||0)+ef.debuff[k]; } log(`${e.name} is tangled up${ef.debuff?` (−${Object.values(ef.debuff)[0]} ${D.STAT_NAMES[Object.keys(ef.debuff)[0]]})`:''}.`);
      if(ef.stun && chance(ef.stun)){ e.stun=1; log(`${e.name} can't move!`); } }
    else if(ef.steal) stealFrom(ci, e);
  };
  if(s.tgt==='enemy'){ const e=B.enemies[target]&&B.enemies[target].hp>0?B.enemies[target]:foes[0]; doOne(e); }
  else if(s.tgt==='all'){ foes.forEach(e=>{ if(e.hp>0) doOne(e); }); }
  else if(s.tgt==='random'){ for(let i=0;i<(ef.hits||1);i++){ const f=liveEnemies(); if(!f.length) break; doOne(pick(f)); } }
  else if(s.tgt==='ally'){ const h=healChar(target, (ef.heal + d.mag*.7)*(1+(d.f.healPct||0))*rnd(.9,1.1)); log(`${S.chars[target].name} recovers ${h} HP.`,'heal'); }
  else if(s.tgt==='ko'){ const t=S.chars[target]; if(t.hp<=0){ t.hp=Math.max(1,Math.round(calc(t).maxHp*ef.revive)); emit({t:'healP',i:target,amt:t.hp}); log(`${t.name} is revived!`,'heal'); } }
  else if(s.tgt==='party'){
    if(ef.reviveAll) S.chars.forEach((t,i)=>{ if(t.hp<=0){ t.hp=1; } });
    if(ef.heal){ const amt=(ef.heal + d.mag*(ef.heal>=99?0:.5))*(1+(d.f.healPct||0)); let tot=0; living().forEach(o=>{ tot+=healChar(o.i, ef.heal>=99?999:amt*rnd(.9,1.1)); }); log(`The party recovers ${tot} HP.`,'heal'); }
    if(ef.buff){ for(const k in ef.buff) B.buffs[k]=(B.buffs[k]||0)+ef.buff[k]; log(`The party feels stronger! (+${Object.values(ef.buff)[0]} ${D.STAT_NAMES[Object.keys(ef.buff)[0]]})`,'good'); }
  }
  if(ef.partyHeal){ let tot=0; living().forEach(o=>{ tot+=healChar(o.i, ef.partyHeal); }); if(tot) log(`The party recovers ${tot} HP.`,'heal'); }
}
function stealFrom(ci, e){
  const S=G.S, c=S.chars[ci]; if(e.stolen){ log(`${e.name} has nothing left to steal.`); return; }
  if(chance(.55)){ e.stolen=1; const g=Math.max(1,Math.round(e.gold*1.5)); S.gold+=g; S.stats.goldEarned+=g; if(S.exp) S.exp.gold+=g; log(`${c.name} pinches ${g} gold!`,'good'); }
  else log(`${c.name} couldn't steal anything.`,'miss');
}
const _edef={}; function findEnemyDef(id){ if(_edef[id]) return _edef[id]; for(const z of D.ZONES) for(const e of [...z.enemies,z.boss]) if(e.id===id) return (_edef[id]=e); }
function enemyTurn(ei){
  const S=G.S, B=S.battle, e=B.enemies[ei]; if(e.hp<=0) return;
  if(e.poison){ const p=e.poison; dealToEnemy(-1, e, p.dmg, 'poison', d=>log(`${e.name} takes ${d} poison damage.`)); if(--p.turns<=0) e.poison=null; if(e.hp<=0) return; }
  if(e.stun){ e.stun=0; log(`${e.name} is stunned and can't act.`,'miss'); return; }
  const party=living(); if(!party.length) return;
  // pick target, weighted by taunt
  const w=party.map(o=>1+(calc(o.c,B.buffs).f.taunt||0)); let r=Math.random()*w.reduce((a,b)=>a+b,0), t=party[0]; for(let k=0;k<party.length;k++){ r-=w[k]; if(r<=0){ t=party[k]; break; } }
  const special = e.boss ? chance(.28) : (e.role==='caster' && chance(.35));
  if(special && e.role==='caster' || (special && e.boss && chance(.4))){
    const all = e.boss || chance(.3);
    log(all ? `${e.name} casts a dark storm!` : `${e.name} casts a spell!`, 'enemy');
    (all?party:[t]).forEach(o=>{ const d=calc(o.c,B.buffs); const dmg=(e.mag||e.atk)*(all?.55:1)*rnd(.85,1.15) - d.def*0.3 - (d.f.dr||0); hurtChar(o.i, d, Math.max(1,dmg), e); });
    return;
  }
  const heavy = special;
  if(heavy) log(`${e.name} winds up a mighty blow!`, 'enemy');
  const d=calc(t.c,B.buffs);
  if(!chance(hitChance(e.agi-(e.deb.agi||0), d.agi, 0, d.f.dodge))){ log(`${e.name} attacks! ${t.c.name} dodges.`,'miss'); emit({t:'missP', i:t.i}); return; }
  let dmg = e.atk*(heavy?1.6:1)*rnd(.85,1.15) - d.def*0.6 - (d.f.dr||0);
  if(dmg<1) dmg = chance(.6)?1:0;
  if(!heavy) log(`${e.name} attacks!`, 'enemy');
  hurtChar(t.i, d, dmg, e);
  if(t.c.hp>0 && d.f.counter && chance(d.f.counter) && e.hp>0){ log(`${t.c.name} counters!`); physOn(t.i, d, e, 1); }
  if(d.f.thorns && e.hp>0){ dealToEnemy(t.i, e, d.f.thorns, 'thorn', x=>log(`Thorns prick ${e.name} for ${x}.`)); }
}
function hurtChar(ci, d, dmg, e){
  const S=G.S, B=S.battle, c=S.chars[ci], cs=B.cs[ci]; dmg=Math.max(0,Math.round(dmg));
  c.hp-=dmg; emit({t:'hitP', i:ci, dmg});
  log(dmg? `${c.name} takes ${dmg} damage.` : `${c.name} takes no damage!`, dmg?'hurt':'miss');
  if(c.hp<=0){
    if(d.f.endure && !cs.used.endure){ cs.used.endure=1; c.hp=1; log(`${c.name} endures the blow!`,'good'); return; }
    c.hp=0;
    if(d.f.rebirth && !cs.used.rebirth){ cs.used.rebirth=1; c.hp=Math.max(1,Math.round(d.maxHp*d.f.rebirth)); log(`🪶 ${c.name} rises again!`,'heal'); emit({t:'healP',i:ci,amt:c.hp}); return; }
    log(`${c.name} is knocked out!`,'ko'); emit({t:'koP', i:ci});
  }
}

/* ---------------- expeditions ----------------
   The game opens in town. The player picks a zone and sets out; battles only happen on an expedition.
   Each battle costs stamina. When anyone is out of stamina (or the party falls) everyone walks home to rest. */
function zoneStage(zi, wins){ const need=D.ZONES[zi].wins, n=D.STAGES||10; const w=(wins==null)? (G.S.zones[zi].wins||0):wins; return Math.min(n, Math.floor(w*n/need)); }
function grantStage(zi, before, after){ const n=D.STAGES||10; const a=zoneStage(zi,before), b=zoneStage(zi,after); if(b<=a) return;
  const S=G.S; for(let s=a+1;s<=b;s++){ const gold=(D.STAGE_REWARD.gold||8)*(zi+1); S.gold+=gold; S.stats.goldEarned+=gold; S.stats.stages=(S.stats.stages||0)+1; S.zones[zi].stages=s;
    S.chars.forEach(c=>{ if(c.job&&c.jobs[c.job]) c.jobs[c.job].jp=(c.jobs[c.job].jp||0)+(D.STAGE_REWARD.jp||1); });
    let extra=''; if(s===5||s===10){ gain('diamond',1); extra=' +1💎'; }
    log(`🚩 ${D.ZONES[zi].name} stage ${s}/${n}: +${gold} gold${extra}.`,'good'); toast(`🚩 Stage ${s}/${n}${extra}`,'good'); } }
function bossReady(zi){ const z=G.S.zones[zi]; return (!z.boss && z.wins>=D.ZONES[zi].wins) || (z.boss && z.sinceBoss>=(D.BOSS_REMATCH||20)); }
function winsToNextStage(zi, wins){ const need=D.ZONES[zi].wins, n=D.STAGES||10; const w=(wins==null)?(G.S.zones[zi].wins||0):wins; const s=zoneStage(zi,w); if(s>=n) return 0; return Math.max(0, Math.ceil((s+1)*need/n)-w); }
function fightsToBoss(zi){ const z=G.S.zones[zi]; if(!z.boss) return null; return Math.max(0, (D.BOSS_REMATCH||20)-(z.sinceBoss||0)); }
function bossMayAppear(zi){ return bossReady(zi); }

function zoneUnlocked(zi){ return zoneOpen(zi); }
function maxZoneOpen(){ let m=0; D.ZONES.forEach((z,i)=>{ if(zoneOpen(i)) m=i; }); return m; }
function partyStam(){ return Math.min(...G.S.chars.map(c=>c.stam)); }
function canDepart(){ const S=G.S; if(S.loc!=='town') return {ok:false, why:'Already out'}; const low=S.chars.filter(c=>c.stam<D.STAM.minDepart);
  if(low.length) return {ok:false, why:`${low.map(c=>c.name).join(', ')} need${low.length>1?'':'s'} at least ${D.STAM.minDepart} stamina`}; return {ok:true}; }
function depart(zi, boss){ const S=G.S; if(!zoneOpen(zi)) return false; const a=canDepart(); if(!a.ok) return false;
  S.zone=zi; S.loc='exp'; S.exp={zi, battles:0, wins:0, gold:0, xp:0, start:Date.now()}; S.battle=null; S.pause=PACE.start; S.pendingBoss=!!boss && bossReady(zi);
  // eat one of each packed meal so their buffs stack; a later recipe never replaces an earlier one
  S.food=null; S.foods=[]; const ate=[];
  for(const f of D.FOODS){ if((S.meals[f.id]||0)>0){ S.meals[f.id]--; S.foods.push(f.id); ate.push(`${f.icon} ${f.name}`); } }
  if(ate.length){ S.food=S.foods[S.foods.length-1]; log(`${ate.join(', ')} — the party eats one of each packed dish.`,'good'); }
  S.chars.forEach(c=>{ const d=calcBase(c); c.hp=d.maxHp; c.mp=d.maxMp; });
  dirty(); S.stats.departs++; log(`🔥 The party sets out for ${D.ZONES[zi].name}.`,'good'); emit({t:'depart'}); return true; }
function goHome(reason){ const S=G.S; if(S.loc!=='exp') return; const e=S.exp||{};
  S.loc='town'; S.battle=null; S.pendingBoss=false; S.pause=0; S.food=null; S.foods=[]; S.stats.returns++;
  S.lastExp=Object.assign({}, e, {reason, end:Date.now(), zi:S.zone});
  const msg = reason==='wipe' ? '💀 The party fell. Villagers carried everyone home to Lanternfall.' : reason==='tired' ? '😮‍💨 The party is out of stamina and walks home to rest.' : '🏠 The party returns to Lanternfall.';
  log(msg, reason==='wipe'?'ko':'good'); toast(msg, reason==='wipe'?'bad':'good');
  S.chars.forEach(c=>{ if(c.act!=='train' && !c.act.startsWith('m:')) c.act='rest'; });
  dirty(); S.chars.forEach(c=>{ const d=calcBase(c); c.hp=d.maxHp; c.mp=d.maxMp; }); emit({t:'home', reason}); if(G.sum) G.sum.home=reason; }
function challengeBoss(zi){ const S=G.S; if(!zoneOpen(zi)||!bossReady(zi)) return false; if(S.loc==='town') return depart(zi, true); if(S.zone!==zi) return false; S.pendingBoss=true; return true; }
function spawn(zi, boss){
  const Z=D.ZONES[zi]; const list = boss ? [Z.boss] : (()=>{ const n = zi===0 ? (chance(.12)?3:chance(.45)?2:1) : (chance(.25)?3:chance(.55)?2:1); const a=[]; for(let i=0;i<n;i++) a.push(pick(Z.enemies)); return a; })();
  const cnt={};
  return list.map((e,i)=>{ const st=enemyStats(e,zi); const t=beastTier(e.id), red=D.BEAST_TIERS[t].red;
    const gild = !e.boss && chance(D.VARIANT_CHANCE);
    const same=list.filter(x=>x.id===e.id).length>1; cnt[e.id]=(cnt[e.id]||0)+1;
    const hp=Math.round(st.hp*(gild?2:1));
    return {id:e.id, name:(gild?'Gilded ':'')+e.name+(same?' '+'ABC'[cnt[e.id]-1]:''), icon:e.icon, hat:e.hat, weak:e.weak, boss:!!e.boss, gild, role:e.role, zi,
      hp, maxHp:hp, atk:Math.max(1,Math.round(st.atk*(1-red))), def:Math.round(st.def*(1-red)), agi:Math.max(1,Math.round(st.agi*(1-red))), mag:Math.round(st.mag*(1-red)),
      xp:st.xp*(gild?3:1), gold:st.gold*(gild?3:1), poison:null, stun:0, deb:{}, idx:i};
  });
}
function startBattle(boss){
  const S=G.S; const zi=S.zone;
  S.battle = {zi, boss:!!boss, enemies:spawn(zi, boss), round:0, queue:[], buffs:{}, cs:S.chars.map(()=>({used:{}})), done:false};
  const names = S.battle.enemies.map(e=>e.name);
  log(boss ? `⚠️ ${names[0]} blocks the path!` : (names.length===1? `${names[0]} appears!` : `${names.join(', ')} appear!`), boss?'boss':'');
  if(S.battle.enemies.some(e=>e.gild)){ log('✨ A rare Gilded foe!','rare'); toast('✨ A Gilded foe appeared!','rare'); }
  emit({t:'start'});
}
// one action. returns ms until the next one
function step(){
  const S=G.S;
  if(!S.started || S.loc!=='exp') return 0;
  if(!S.battle){
    const autoBoss = S.pendingBoss || ((S.settings.autoBoss && bossReady(S.zone)) || (S.zones[S.zone].boss && bossMayAppear(S.zone)));
    const boss = autoBoss;
    const cost = boss ? D.STAM.boss : D.STAM.battle;
    if(S.chars.some(c=>c.stam < cost)){ if(boss && !S.chars.some(c=>c.stam<D.STAM.battle)){ S.pendingBoss=false; log('Too tired to face the boss; fighting on.'); } else { goHome('tired'); return 0; } }
    const b2 = S.pendingBoss || ((S.settings.autoBoss && bossReady(S.zone)) || (S.zones[S.zone].boss && bossMayAppear(S.zone))); const c2 = b2?D.STAM.boss:D.STAM.battle;
    S.pendingBoss=false; S.chars.forEach(c=>{ c.stam=Math.max(0, c.stam-c2); });
    startBattle(b2); S.battle.t0=S.stats.play; return PACE.start;
  }
  const B=S.battle;
  let a=null, g=0;
  while(g++<20){ if(!B.queue.length) newRound(); a=B.queue.shift(); if(!a) continue; if(a.side==='p' ? S.chars[a.i].hp>0 : B.enemies[a.i].hp>0) break; a=null; }
  if(a){ if(a.side==='p') playerTurn(a.i, a.haste); else enemyTurn(a.i); }
  if(!liveEnemies().length){ victory(); return PACE.between; }
  if(!living().length){ defeat(); return 0; }
  return PACE.action;
}
function levelUp(c, i){ let n=0; while(c.xp>=xpNeed(c.lv) && c.lv<MAX_LV){ c.xp-=xpNeed(c.lv); c.lv++; n++; const t=D.RACES[c.race].traits.find(t=>t.lv===c.lv);
    log(`⬆️ ${c.name} is now level ${c.lv}!`,'level'); emit({t:'lvl', i}); if(t){ log(`🧬 ${c.name} gains the ${D.RACES[c.race].name} trait “${t.name}”!`,'good'); toast(`🧬 ${c.name}: new racial trait ${t.name}`,'good'); }
    if(G.sum) G.sum.levels++; } if(n) dirty(); }
function victory(){
  const S=G.S, B=S.battle; const zi=B.zi; const Z=D.ZONES[zi];
  let xp=0, gold=0; B.enemies.forEach(e=>{ xp+=e.xp; gold+=e.gold; addKill(e.id, 1); S.stats.kills++;
    S.beastXp[e.id]=(S.beastXp[e.id]||0)+e.xp; S.beastGold[e.id]=(S.beastGold[e.id]||0)+e.gold;
    if(e.gild){ const first=!S.variants[e.id]; S.variants[e.id]=(S.variants[e.id]||0)+1; if(first){ log(`📚 First Gilded ${findEnemyDef(e.id).name} recorded in the bestiary!`,'rare'); checkCollections(); } } });
  const ds=S.chars.map(c=>calc(c,B.buffs));
  const midas = ds.some(d=>d.f.gold>=1);
  const goldB = Math.min(1, ds.reduce((a,d)=>a+(d.f.gold||0),0) - (midas?1:0));
  const xpB = Math.min(0.35, ds.reduce((a,d)=>a+(d.f.xp||0),0));
  gold = Math.max(1, Math.round(gold*(1+goldB)*(midas?2:1)*rnd(.85,1.15)));
  xp = Math.max(1, Math.round(xp*(1+xpB)));
  S.gold+=gold; S.stats.goldEarned+=gold; S.stats.wins++; S.stats.battles++; S.stats.rounds+=B.round;
  if(S.exp){ S.exp.wins++; S.exp.battles++; S.exp.gold+=gold; S.exp.xp+=xp; }
  log(`Victory! +${xp} XP, +${gold} gold.`, 'win');
  if(G.sum){ G.sum.wins++; G.sum.gold+=gold; G.sum.xp+=xp; G.sum.battles++; }
  if(B.boss && !S.zones[zi].boss){ gain('diamond', 10); log('💎 +10 Diamonds for the first victory over this boss!','relic'); }
  // xp / ap / jp — fighting never drops items
  S.chars.forEach((c,i)=>{ const d=ds[i]; const alive=c.hp>0;
    if(alive){ c.xp+=xp; levelUp(c,i); }
    if(alive){ c.wins=(c.wins||0)+1; let ap = B.boss?3:1; if(d.f.apEvery && c.wins % d.f.apEvery===0) ap++;
      for(const u of charGear(c)) for(const sid of defOf(u).skills){ if(c.learned[sid]) continue; c.ap[sid]=(c.ap[sid]||0)+ap+(u.relic?0:D.RARITY[u.r||0].ap);
        if(c.ap[sid]>=D.SKILLS[sid].ap){ c.learned[sid]=1; delete c.ap[sid]; S.stats.learned++; dirty(); const sk=D.SKILLS[sid]; log(`🎉 ${c.name} learned ${sk.name}!`,'learn'); toast(`🎉 ${c.name} learned ${D.TYPES[sk.type].icon} ${sk.name}!`,'learn'); if(G.sum) G.sum.learned.push(c.name+': '+sk.name);
          for(const jid of D.JOB_ORDER){ if(!c.jobUnl) c.jobUnl={}; if(!c.jobUnl[jid] && jobUnlocked(c,jid)){ c.jobUnl[jid]=1; log(`🎖️ ${c.name} can now become a ${D.JOBS[jid].name}!`,'good'); toast(`🎖️ ${c.name} can become a ${D.JOBS[jid].name}! (Party → Job)`,'learn'); } } } }
      if(c.job){ const jt=c.jobs[c.job]; jt.jp=(jt.jp||0)+(B.boss?5:1); }
    }
    const md=calcBase(c); if(c.hp<=0) c.hp=1; else c.hp=Math.min(md.maxHp, c.hp+Math.round(md.maxHp*.15)+(d.f.postHeal||0)); c.mp=Math.min(md.maxMp, c.mp+1);
  });
  const z=S.zones[zi]; if(!B.boss){ const before=z.wins; z.wins++; if(z.boss) z.sinceBoss++; grantStage(zi, before, z.wins); }
  if(B.boss){ S.stats.bosses++; z.bossKills++; z.sinceBoss=0;
    if(!z.boss){ z.boss=true; dirty(); log(`🏆 ${Z.boss.name} is defeated! ${zi+1<D.ZONES.length? D.ZONES[zi+1].name+' is now open.':'You have conquered Lanternfall!'}`,'boss'); toast(`🏆 Boss defeated! ${zi+1<D.ZONES.length? D.ZONES[zi+1].name+' is open on the Map.':''}`,'relic'); if(G.sum) G.sum.notes.push('Beat '+Z.boss.name); checkCollections(); } }
  S.battle=null; emit({t:'win'});
}
function defeat(){ const S=G.S; S.stats.losses++; S.stats.battles++; S.battle=null; if(S.exp) S.exp.battles++; if(G.sum) G.sum.wiped=true; emit({t:'wipe'}); goHome('wipe'); }

/* ---------------- equip ---------------- */
function equip(ci, uid){ const S=G.S, c=S.chars[ci], u=invItem(uid); if(!u) return false; const slot=defOf(u).slot;
  const o=equippedBy(uid); if(o>=0){ const oc=S.chars[o]; for(const s in oc.equip) if(oc.equip[s]===uid) oc.equip[s]=null; dirty(); fixHpMp(oc); }
  c.equip[slot]=uid; dirty(); fixHpMp(c); return true; }
function unequip(ci, slot){ const c=G.S.chars[ci]; c.equip[slot]=null; dirty(); fixHpMp(c); }
function autoEquipLearn(){
  const S=G.S; let n=0;
  S.chars.forEach((c,ci)=>{ for(const slot of ['weapon','armor','acc']){
    const cur=c.equip[slot]!=null?invItem(c.equip[slot]):null;
    if(cur && defOf(cur).skills.some(s=>!c.learned[s])) continue;
    const cand=S.inv.filter(u=>!u.relic && D.ITEM[u.id].slot===slot && equippedBy(u.uid)<0 && D.ITEM[u.id].skills.some(s=>!c.learned[s]))
      .sort((a,b)=>(D.ITEM[b.id].tier+(b.r||0)*.5)-(D.ITEM[a.id].tier+(a.r||0)*.5));
    if(cand.length){ equip(ci, cand[0].uid); n++; }
  } });
  return n;
}

/* ---------------- gacha ---------------- */
function bannerTierCap(b){ const L=G.S.buildings[b]; return Math.max(0, Math.min(L-1, maxZoneOpen())); }
function bannerPool(b){ const t=D.BANNERS[b].type, cap=bannerTierCap(b); return D.ITEMS.filter(it=>it.tier<=cap && it.skills.some(s=>D.SKILLS[s].type===t)); }
function bannerRates(b, L){ L=L==null?G.S.buildings[b]:L; return D.BANNER_RATES[Math.max(1,Math.min(D.BMAX,L))]; }
function rollRarity(rates, minR){ let x=Math.random()*100, r=0; for(let i=0;i<rates.length;i++){ x-=rates[i]; if(x<=0){ r=i; break; } r=i; } return Math.max(r, minR||0); }
function featuredItem(){ const S=G.S; S.feature=S.feature||{day:'',id:null,r:0,taken:0}; const day=new Date(G.now()).toDateString();
  if(S.feature.day!==day || !S.feature.id || !D.ITEM[S.feature.id]){
    const cap=Math.max(0, ...D.BANNER_ORDER.map(b=>S.buildings[b]?bannerTierCap(b):0));
    const pool=D.ITEMS.filter(it=>it.tier>=Math.min(Math.max(cap-1,2),6) && it.tier<=Math.max(cap,3) && (it.skills.length||it.bonus));
    const bag=pool.length?pool:D.ITEMS.filter(it=>it.tier>=2);
    const it=bag[Math.floor(Math.random()*bag.length)]||D.ITEMS[D.ITEMS.length-1];
    const r=Math.min((D.RARITY.length-1), cap>=7?5:cap>=5?4:3);
    S.feature={day, id:it.id, r, taken:0};
  }
  return S.feature;
}
function pullFeatured(){ const S=G.S, f=featuredItem(); if(f.taken || S.diamonds<D.PULL_COST) return null;
  S.diamonds-=D.PULL_COST; f.taken=1; const u=addItem(f.id, f.r); S.stats.pulls++; log(`⭐ Featured ${D.RARITY[f.r].name} ${D.ITEM[f.id].icon} ${D.ITEM[f.id].name}!`,'rare'); return {uid:u.uid,id:f.id,r:f.r,isNew:true,featured:1}; }
function pull(b, n){
  const S=G.S; n=n===10?10:1; const cost=n===10?D.PULL10_COST:D.PULL_COST; if(!S.buildings[b]||S.diamonds<cost) return null;
  S.diamonds-=cost; const pool=bannerPool(b), cap=bannerTierCap(b), rates=bannerRates(b); const out=[];
  S.pityM=S.pityM||{};
  for(let i=0;i<n;i++){
    S.pity[b]=(S.pity[b]||0)+1; S.pityM[b]=(S.pityM[b]||0)+1; let minR=0;
    if(S.pity[b]>=D.PITY) minR=3;
    if(D.PITY_MYTHIC && S.pityM[b]>=D.PITY_MYTHIC) minR=5;
    if(n===10 && i===9 && !out.some(x=>x.r>=2)) minR=Math.max(minR,2);
    const r=rollRarity(rates, minR); if(r>=3) S.pity[b]=0; if(r>=5) S.pityM[b]=0;
    const w=pool.map(it=>it.tier===cap?3:1); let x=Math.random()*w.reduce((a,c)=>a+c,0), it=pool[0]; for(let k=0;k<pool.length;k++){ x-=w[k]; if(x<=0){ it=pool[k]; break; } }
    const u=addItem(it.id, r); out.push({uid:u.uid, id:it.id, r, isNew:!S.inv.some(v=>v.uid!==u.uid && v.id===it.id)});
    S.stats.pulls++;
    if(r>=3) log(`💎 ${D.RARITY[r].name} pull: ${it.icon} ${it.name}!`, 'rare');
  }
  return out;
}
// Forge fusing: 3 unworn copies of the same item & rarity -> 1 of the next rarity
function fuseLimit(){ const L=G.S.buildings.forge||0; return L>=8?5:Math.min(4, Math.floor(L/2)); }
function fuseCost(r){ return 40*Math.pow(3,r); }
function fuseNeed(){ return D.FUSE_NEED||10; }
function fusable(){ const S=G.S, g={}, need=fuseNeed(); for(const u of S.inv){ if(u.relic||equippedBy(u.uid)>=0) continue; const k=u.id+':'+(u.r||0); (g[k]=g[k]||[]).push(u); }
  return Object.entries(g).filter(([k,a])=>a.length>=need).map(([k,a])=>({id:a[0].id, r:a[0].r||0, n:a.length, ok:(a[0].r||0)+1<=fuseLimit()&&(a[0].r||0)<((D.RARITY.length)-1)})); }
function fuse(id, r){ const S=G.S, need=fuseNeed(); if(r+1>fuseLimit()) return false; const a=S.inv.filter(u=>!u.relic&&u.id===id&&(u.r||0)===r&&equippedBy(u.uid)<0); if(a.length<need||S.gold<fuseCost(r)) return false;
  S.gold-=fuseCost(r); for(const u of a.slice(0,need)) S.inv.splice(S.inv.indexOf(u),1); const nu=addItem(id, r+1); log(`⚒️ Fused ${need} ${D.ITEM[id].name} into a ${D.RARITY[r+1].name} one!`,'good'); return nu; }

/* ---------------- party creation ---------------- */
function createParty(list){ const S=G.S; S.chars=list.slice(0,3).map(x=>newChar(x.name.trim().slice(0,12)||'Hero', x.race));
  const pref={human:'stick', elf:'wand', dwarf:'stick', halfling:'knife', orc:'stick', beastkin:'sling'};
  const used=new Set();
  S.chars.forEach((c,i)=>{ let w=pref[c.race]; if(used.has(w)) w=['rod','wand','knife','sling','stick'].find(x=>!used.has(x))||w; used.add(w);
    const u=addItem(w); c.equip.weapon=u.uid; const a=addItem('tunic'); c.equip.armor=a.uid; dirty(); const d=calcBase(c); c.hp=d.maxHp; c.mp=d.maxMp; c.stam=d.maxStam; });
  S.started=true; S.loc='town'; log('Three companions arrive in the village of Lanternfall.','good'); dirty();
}


/* ---------------- bank, drill, bag sort ---------------- */
function bankRate(){ const S=G.S; const w=S.workers.banking||0; const lv=(S.profs.banking&&S.profs.banking.lv)||1; const B=D.BANK||{rateDay:0.008,workerBonus:0.0015,maxRateDay:0.02}; return Math.min(B.maxRateDay, (B.rateDay||0.008)+w*(B.workerBonus||0.0015)+(lv-1)*0.0004); }
function tickBank(dt){ const S=G.S; if(!S||!S.bank) return; if(S.bank.gold>0){ const inc=S.bank.gold*bankRate()*(dt/86400); S.bank.gold+=inc; S.bank.earned=(S.bank.earned||0)+inc; if(S.stats) S.stats.interest=(S.stats.interest||0)+inc; } }
function bankDeposit(n){ const S=G.S; n=Math.floor(n); if(n<=0||S.gold<n) return false; S.gold-=n; S.bank.gold+=n; dirty(); return true; }
function bankWithdraw(n){ const S=G.S; n=Math.min(Math.floor(n), Math.floor(S.bank.gold)); if(n<=0) return false; S.bank.gold-=n; S.gold+=n; dirty(); return true; }
function bankConvert(n){ const S=G.S, rate=(D.BANK&&D.BANK.goldPerDia)||600; n=Math.floor(n)||1; const need=n*rate; if((S.bank.earned||0)<need || S.bank.gold<need) return false; S.bank.gold-=need; S.bank.earned-=need; gain('diamond', n); dirty(); return true; }
function drillCap(){ return ((D.DRILL&&D.DRILL.cap)||80) + Math.max(0, ((G.S.buildings.training||1)-1)*4); }
function drillWindow(ci, n){ const c=G.S.chars[ci]; const nn=(n!=null)?n:((c&&c.drill&&c.drill.n)||0);
  const duration=Math.max(0.65, 1.75 - nn*0.035); const width=Math.max(7, 22 - nn*0.4);
  const maxLeft=Math.max(4, 96-width); const left=4+Math.random()*Math.max(0, maxLeft-4);
  const slack=Math.max(6, 18-nn*0.3);
  return {left, width, duration, slack, n:nn}; }
function canDrill(ci){ const c=G.S.chars[ci]; if(!c || c.act!=='train' || G.S.loc!=='town') return false; const last=(c.drill&&c.drill.last)||0; return G.now()-last >= ((D.DRILL&&D.DRILL.cooldown)||45)*1000; }
function drillWait(ci){ const c=G.S.chars[ci]; if(!c) return 0; const last=(c.drill&&c.drill.last)||0; return Math.max(0, ((D.DRILL&&D.DRILL.cooldown)||45) - (G.now()-last)/1000); }
function applyDrill(ci, quality){ const c=G.S.chars[ci]; if(!c) return null; c.drill=Object.assign({xp:0,gold:0,n:0,last:0}, c.drill||{}); c.drill.last=G.now();
  if(quality==='miss') return {ok:false, drill:c.drill, pts:0};
  const pts=quality==='perfect'?((D.DRILL&&D.DRILL.perfect)||3):((D.DRILL&&D.DRILL.good)||1);
  const cap=drillCap(); c.drill.xp=Math.min(cap, (c.drill.xp||0)+pts); c.drill.gold=Math.min(cap, (c.drill.gold||0)+pts); c.drill.n=(c.drill.n||0)+1;
  if(G.S.stats) G.S.stats.drills=(G.S.stats.drills||0)+1; dirty();
  log(`🎯 ${c.name} finishes a Focus Drill (${quality}). Permanent XP/gold +${((c.drill.xp||0)*((D.DRILL&&D.DRILL.unit)||0.001)*100).toFixed(1)}%.`,'good');
  return {ok:true, drill:c.drill, pts, quality}; }
function sortInv(mode){ const S=G.S; mode=mode||S.bagSort||'rarity'; S.bagSort=mode;
  const w={weapon:0,armor:1,acc:2,relic:3};
  const key={
    rarity: u=>[-(u.relic?5:(u.r||0)), -(defOf(u).tier||0), w[defOf(u).slot]||9, (defOf(u).name||'')],
    tier:   u=>[-(defOf(u).tier||0), -(u.relic?5:(u.r||0)), w[defOf(u).slot]||9, (defOf(u).name||'')],
    slot:   u=>[w[defOf(u).slot]||9, -(u.relic?5:(u.r||0)), -(defOf(u).tier||0), (defOf(u).name||'')],
    name:   u=>[(defOf(u).name||''), -(u.r||0)]
  }[mode]||null;
  if(!key) return S.inv;
  S.inv.sort((a,b)=>{ const ka=key(a), kb=key(b); for(let i=0;i<ka.length;i++){ if(ka[i]<kb[i]) return -1; if(ka[i]>kb[i]) return 1; } return 0; });
  return S.inv;
}

/* ---------------- time ---------------- */
function tick(dtMs){
  const S=G.S; if(!S.started) return;
  const dt=dtMs/1000; S.stats.play+=dt;
  tickProfs(dt); tickTown(dt); tickBank(dt);
  if(S.loc!=='exp') return;
  S.pause -= dtMs; let guard=0;
  while(S.pause<=0 && guard++<6 && S.loc==='exp'){ const w=step(); S.pause += (w||PACE.action); }
  if(S.loc!=='exp') S.pause=0;
}
// offline: town work runs for the whole absence; an expedition keeps fighting at the normal pace until stamina runs out, then the party rests in town.
const OFFLINE_CAP = 12*3600;
function offline(sec){
  const S=G.S; sec=Math.min(sec, OFFLINE_CAP); if(sec<5||!S.started) return null;
  const sum = G.sum = {sec, wins:0, gold:0, xp:0, levels:0, learned:[], items:[], mats:{}, profUps:0, wiped:false, notes:[], battles:0, home:null, fightSec:0};
  const q=G.quiet; G.quiet=true;
  try{
    let t=0; const total=sec*1000; let g=0;
    if(S.loc==='exp'){ t=Math.max(0,S.pause); S.pause=0; while(t<total && S.loc==='exp' && g++<300000){ t += (step()||PACE.action); } }
    sum.fightSec=Math.min(sec, t/1000);
    let left=sec; while(left>0){ const c=Math.min(10,left); tickProfs(c); tickBank(c); left-=c; }
    let town=sec-sum.fightSec; while(town>0 && S.loc==='town'){ const c=Math.min(10,town); tickTown(c); town-=c; }
    if(S.loc==='exp') S.pause=PACE.action;
  } finally { G.quiet=q; G.sum=null; }
  S.log=S.log.slice(-25);
  return sum;
}

if(typeof module!=='undefined') module.exports={G};
