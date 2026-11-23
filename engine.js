'use strict';
/* Lanternfall — engine (no DOM). Exposes G. */
const G = {S:null, ev:[], quiet:false, toast:null, now:()=>Date.now()};
const SAVE_KEY = 'lanternfall.save';
const SAVE_V = 1;
const rnd = (a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)], chance=p=>Math.random()<p;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmtTime=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}h ${m}m`:m?`${m}m ${x}s`:`${x}s`};

/* ---------------- curves ---------------- */
const xpNeed = L => Math.round(10*Math.pow(L,2.3)+2);
const profNeed = L => Math.round(30*Math.pow(L,1.6));
const MAX_LV = 60;

/* ---------------- state ---------------- */
function newChar(name, race){
  const c = {name, race, lv:1, xp:0, hp:1, mp:0, equip:{weapon:null,armor:null,acc:null,relic:null}, ap:{}, learned:{}, job:null, jobs:{}, tactic:'auto'};
  return c;
}
function newState(){
  return {v:SAVE_V, created:Date.now(), last:Date.now(), started:false,
    chars:[], gold:30, inv:[], nextUid:1, mats:{}, pots:{potion:3}, food:null, elixir:null,
    zone:0, zones:D.ZONES.map(()=>({wins:0, boss:false, bossKills:0, sinceBoss:0})), auto:true, wiped:false, battle:null, rest:0,
    profs:Object.fromEntries(D.PROF_ORDER.map(p=>[p,{lv:1,xp:0,acc:0}])), workers:{}, buildings:{smithy:1,tavern:0,apothecary:0,library:0,guild:0},
    bestiary:{}, relicsFound:{}, flags:{}, tut:0,
    stats:{wins:0, losses:0, kills:0, bosses:0, bought:0, learned:0, goldEarned:0, battles:0, relics:0, play:0},
    settings:{speed:1, usePots:true, autoRest:true, autoBoss:false},
    log:[]};
}
/* versioned migrations: index i upgrades a save from v=i to v=i+1 */
const MIGRATIONS = [
  s => { s.v = 1; return s; }, // v0 (pre-release) -> v1
];
function migrate(s){
  if(typeof s.v!=='number') s.v=0;
  while(s.v<SAVE_V){ s = MIGRATIONS[s.v](s); }
  // fill any missing fields from a fresh state (forward-compatible)
  const f = newState();
  for(const k in f) if(s[k]===undefined) s[k]=f[k];
  for(const k in f.settings) if(s.settings[k]===undefined) s.settings[k]=f.settings[k];
  for(const k in f.stats) if(s.stats[k]===undefined) s.stats[k]=f.stats[k];
  for(const p of D.PROF_ORDER) if(!s.profs[p]) s.profs[p]={lv:1,xp:0,acc:0};
  for(const b of D.BUILD_ORDER) if(s.buildings[b]===undefined) s.buildings[b]=0;
  while(s.zones.length<D.ZONES.length) s.zones.push({wins:0,boss:false,bossKills:0,sinceBoss:0});
  s.chars.forEach(c=>{ for(const k of ['ap','learned','jobs']) c[k]=c[k]||{}; c.equip=Object.assign({weapon:null,armor:null,acc:null,relic:null}, c.equip||{}); if(!c.tactic)c.tactic='auto'; });
  return s;
}
function save(){ try{ G.S.last=Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G.S)); return true; }catch(e){ console.warn('save failed', e); return false; } }
function load(){
  let raw=null; try{ raw=localStorage.getItem(SAVE_KEY); }catch(e){}
  if(raw){ try{ G.S = migrate(JSON.parse(raw)); return true; }catch(e){ console.warn('bad save, starting fresh', e); try{localStorage.setItem(SAVE_KEY+'.broken', raw)}catch(_){} } }
  G.S = newState(); return false;
}
function exportSave(){ save(); return btoa(unescape(encodeURIComponent(JSON.stringify(G.S)))); }
function importSave(str){
  str=(str||'').trim(); let obj;
  try{ obj = JSON.parse(decodeURIComponent(escape(atob(str)))); }catch(e){ try{ obj=JSON.parse(str); }catch(e2){ throw new Error('That doesn\'t look like a Lanternfall save.'); } }
  if(!obj || !Array.isArray(obj.chars)) throw new Error('That doesn\'t look like a Lanternfall save.');
  G.S = migrate(obj); G.S.battle=null; save(); return true;
}
function hardReset(){ try{localStorage.removeItem(SAVE_KEY)}catch(e){} G.S=newState(); }

function log(msg, cls){ const S=G.S; S.log.push({m:msg, c:cls||''}); if(S.log.length>60) S.log.splice(0, S.log.length-60); }
function emit(e){ if(!G.quiet){ G.ev.push(e); if(G.ev.length>200) G.ev.splice(0,100); } }
function toast(msg, kind){ if(!G.quiet && G.toast) G.toast(msg, kind); if(G.sum) G.sum.notes.push(msg); }

/* ---------------- items ---------------- */
function addItem(id){ const u={uid:G.S.nextUid++, id}; G.S.inv.push(u); return u; }
function addRelic(id){ const u={uid:G.S.nextUid++, relic:id}; G.S.inv.push(u); return u; }
function invItem(uid){ return G.S.inv.find(x=>x.uid===uid); }
function defOf(u){ return u.relic ? Object.assign({slot:'relic', skills:[D.RELIC[u.relic].skill], price:500}, D.RELIC[u.relic]) : D.ITEM[u.id]; }
function equippedBy(uid){ return G.S.chars.findIndex(c=>Object.values(c.equip).includes(uid)); }
function charGear(c){ return D.SLOTS.map(s=>c.equip[s]!=null?invItem(c.equip[s]):null).filter(Boolean); }

/* ---------------- derived stats ---------------- */
const SUM_KEYS = ['hit','crit','dodge','counter','double','regen','postHeal','gold','matFind','dropFind','dr','physFlat','physPct','spellPct','healPct','holyPct','wildPct','shadowPct','weakPct','spellFlat','echo','haste','taunt','first','rage','cleaveChance','pack','critDmg','mpCut','killMp','poisonPlus','thorns','dmgPct','endure','gearPlus'];
function addEff(d, eff, src){
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
// all skills currently usable: { id: source }
function skillSet(c){
  const out = {};
  for(const id in c.learned) out[id]='learned';
  for(const u of charGear(c)) for(const id of defOf(u).skills) if(!out[id]) out[id]='gear';
  if(c.job){ const jt=c.jobs[c.job]; if(jt) for(const n of D.JOBS[c.job].tree) if(jt.nodes&&jt.nodes[n.id]&&n.eff.grant) out[n.eff.grant]='job'; }
  return out;
}
function calc(c, battleBuffs){
  const r = D.RACES[c.race];
  const d = {lv:c.lv, f:{}};
  for(const k of D.STATS) d[k] = r.base[k] + Math.floor(r.grow[k]*(c.lv-1) + 1e-9);
  for(const t of raceTraits(c)) addEff(d, t.eff);
  // gear
  const gp = raceTraits(c).some(t=>t.eff.gearPlus) ? 1 : 0;
  for(const u of charGear(c)){ const it=defOf(u); for(const k in it.stats) d[k]+=it.stats[k];
    if(gp && it.slot==='weapon') d[it.stats.mag>it.stats.str?'mag':'str']+=1; if(gp && it.slot==='armor') d.def+=1; }
  // passives (learned or worn)
  const ss = skillSet(c);
  for(const id in ss){ const s=D.SKILLS[id]; if(s.kind==='passive') addEff(d, s.eff); }
  // job
  if(c.job){ const j=D.JOBS[c.job]; for(const k in j.stats) d[k]+=j.stats[k];
    const jt=c.jobs[c.job]; if(jt) for(const n of j.tree) if(jt.nodes[n.id]) addEff(d, n.eff); }
  // party buffs
  const S=G.S;
  if(S.food && S.food.left>0) for(const k in D.FOOD[S.food.id].buff) d[k]+=D.FOOD[S.food.id].buff[k];
  if(S.elixir && S.elixir.left>0) for(const k in D.POTION[S.elixir.id].elixir) d[k]+=D.POTION[S.elixir.id].elixir[k];
  if(battleBuffs) for(const k in battleBuffs) d[k]+=battleBuffs[k];
  d.maxHp = Math.max(1, d.hp); d.maxMp = Math.max(0, d.mp);
  return d;
}
function typeCounts(c){ const n={}; for(const id in c.learned){ const t=D.SKILLS[id].type; n[t]=(n[t]||0)+1; } return n; }
function jobUnlocked(c, jid){
  const j=D.JOBS[jid], n=typeCounts(c);
  for(const t in j.req) if((n[t]||0)<j.req[t]) return false;
  if(j.mentor && G.S.buildings.guild < D.MENTOR[j.mentor].gl) return false;
  return true;
}
function mentorHere(jid){ const m=D.MENTORS.find(m=>m.job===jid); return m && G.S.buildings.guild>=m.gl; }
function nodeAvailable(c, jid, n){
  const jt=c.jobs[jid]||{nodes:{}};
  if(jt.nodes[n.id]) return {ok:false, why:'Learned'};
  if(n.req && !jt.nodes[n.req]) return {ok:false, why:'Needs '+D.JOBS[jid].tree.find(x=>x.id===n.req).name};
  if(n.tier>=3 && !mentorHere(jid)) { const m=D.MENTORS.find(m=>m.job===jid); return {ok:false, why:`Needs mentor ${m.name} (Guild Hall Lv ${m.gl})`}; }
  if((jt.jp||0)<n.cost) return {ok:false, why:`Needs ${n.cost} JP`};
  return {ok:true};
}
function setJob(ci, jid){ const c=G.S.chars[ci]; if(jid && !jobUnlocked(c,jid)) return false; c.job=jid||null; if(jid && !c.jobs[jid]) c.jobs[jid]={jp:0, nodes:{}}; fixHpMp(c); return true; }
function buyNode(ci, jid, nid){ const c=G.S.chars[ci], n=D.JOBS[jid].tree.find(x=>x.id===nid); const a=nodeAvailable(c,jid,n); if(!a.ok) return false; const jt=c.jobs[jid]; jt.jp-=n.cost; jt.nodes[nid]=1; log(`🎖️ ${c.name} learned ${n.name} (${D.JOBS[jid].name}).`,'good'); fixHpMp(c); return true; }
function fixHpMp(c){ const d=calc(c); c.hp=Math.min(c.hp, d.maxHp); c.mp=Math.min(c.mp, d.maxMp); }

/* ---------------- village ---------------- */
function villageLevel(){ return D.BUILD_ORDER.reduce((a,b)=>a+G.S.buildings[b],0); }
function workerSlots(){ const vl=villageLevel(); let n=1; for(const w of D.WORKER_SLOTS) if(vl>=w.vl) n=w.n; return n; }
function workersUsed(){ return Object.values(G.S.workers).filter(Boolean).length; }
function toggleWorker(p){ const S=G.S; if(S.workers[p]){ delete S.workers[p]; return true; } if(workersUsed()>=workerSlots()) return false; S.workers[p]=true; return true; }
function buildCost(b){ const L=G.S.buildings[b]+1; if(L>D.BMAX) return null; const c=D.BUILD_COST[L]; const mats={}; if(c.stone) mats.stone=c.stone; if(L>=2){ const x=D.BUILD_MATS[b][L-2]; mats[x]=(mats[x]||0)+2*L; } return {lv:L, prof:c.prof, gold:c.gold, mats}; }
function canBuild(b){ const c=buildCost(b); if(!c) return {ok:false, why:'Max level'}; const S=G.S, p=D.BUILDINGS[b].prof;
  const miss=[]; if(S.profs[p].lv<c.prof) miss.push(`${D.PROFS[p].name} Lv ${c.prof}`); if(S.gold<c.gold) miss.push(`${c.gold} gold`);
  for(const m in c.mats) if((S.mats[m]||0)<c.mats[m]) miss.push(`${c.mats[m]} ${D.MATS[m].name}`);
  return {ok:!miss.length, why:miss.join(', ')}; }
function build(b){ const a=canBuild(b); if(!a.ok) return false; const c=buildCost(b), S=G.S; S.gold-=c.gold; for(const m in c.mats) S.mats[m]-=c.mats[m]; S.buildings[b]=c.lv;
  log(`🏗️ The ${D.BUILDINGS[b].name} is now level ${c.lv}!`,'good'); toast(`🏗️ ${D.BUILDINGS[b].name} upgraded to Lv ${c.lv}`,'good'); return true; }
function profPerk(p){ const L=G.S.profs[p].lv;
  switch(p){
    case 'masonry': return {every:Math.max(5, 20-L*0.5), mat:'stone', text:`Quarries 1 Stone every ${Math.max(5,20-L*0.5).toFixed(1)}s`};
    case 'alchemy': return {every:Math.max(8, 30-L*0.6), mat:'herb', text:`Gathers 1 Wild Herb every ${Math.max(8,30-L*0.6).toFixed(1)}s · potions −${Math.min(40,L)}% gold`};
    case 'smithing': return {text:`Shop prices −${Math.min(40,L)}% · sell for +${Math.min(40,L)}%`};
    case 'cooking': return {text:`Meals last +${L*3}% more battles`};
    case 'scholarship': return {every:Math.max(10, 60-L*1.2), text:`Studies 1 bestiary entry every ${Math.max(10,60-L*1.2).toFixed(0)}s (counts as a kill toward knowledge)`};
  } }
function tickProfs(dt){
  const S=G.S;
  for(const p in S.workers){ if(!S.workers[p]) continue; const pr=S.profs[p]; if(pr.lv>=MAX_LV) continue;
    const rate = 1 + 0.05*S.buildings[D.PROFS[p].building];
    pr.xp += dt*rate;
    while(pr.xp>=profNeed(pr.lv) && pr.lv<MAX_LV){ pr.xp-=profNeed(pr.lv); pr.lv++; log(`${D.PROFS[p].icon} ${D.PROFS[p].name} reached Lv ${pr.lv}.`,'good'); toast(`${D.PROFS[p].icon} ${D.PROFS[p].name} Lv ${pr.lv}`,'good'); if(G.sum) G.sum.profUps++; }
    const pk=profPerk(p);
    if(pk.every){ pr.acc=(pr.acc||0)+dt; let n=Math.floor(pr.acc/pk.every); pr.acc-=n*pk.every;
      if(n>0){ if(pk.mat){ S.mats[pk.mat]=(S.mats[pk.mat]||0)+n; if(G.sum) G.sum.mats[pk.mat]=(G.sum.mats[pk.mat]||0)+n; }
        else if(p==='scholarship'){ const seen=Object.keys(S.bestiary); if(seen.length) for(let i=0;i<n;i++){ const e=pick(seen); S.bestiary[e]++; } } } }
  }
}
function shopDiscount(){ return 1-Math.min(40,G.S.profs.smithing.lv)/100; }
function sellPrice(u){ const it=defOf(u); if(u.relic) return 400; return Math.max(1, Math.floor((it.price||Math.round(20*Math.pow(2.1,it.tier)))*0.4*(1+Math.min(40,G.S.profs.smithing.lv)/100))); }
function shopItems(){ const S=G.S; const maxTier=Math.max(...S.zones.map((z,i)=>i<=S.zone||z.wins>0||(i>0&&S.zones[i-1].boss)?i:0)); return D.ITEMS.filter(it=>it.shop && it.shop<=S.buildings.smithy); }
function buyPrice(it){ return Math.ceil(it.price*shopDiscount()); }
function buyItem(id){ const it=D.ITEM[id], p=buyPrice(it), S=G.S; if(!it.shop||it.shop>S.buildings.smithy||S.gold<p) return false; S.gold-=p; addItem(id); S.stats.bought++; return true; }
function sellItem(uid){ const S=G.S; const i=S.inv.findIndex(x=>x.uid===uid); if(i<0||equippedBy(uid)>=0) return 0; const g=sellPrice(S.inv[i]); S.inv.splice(i,1); S.gold+=g; return g; }
// items whose skills are all learned by everyone who could need them = "mastered" (safe to sell): all skills learned by all 4 chars, or duplicates
function isMastered(u){ const it=defOf(u); return !u.relic && it.skills.every(s=>G.S.chars.every(c=>c.learned[s])); }
function bulkSellMastered(){ let g=0,n=0; for(const u of [...G.S.inv]) if(equippedBy(u.uid)<0 && isMastered(u)){ g+=sellItem(u.uid); n++; } return {g,n}; }
function potCost(p){ return Math.ceil(p.gold*(1-Math.min(40,G.S.profs.alchemy.lv)/100)); }
function canAfford(gold, mats){ const S=G.S; if(S.gold<gold) return false; for(const m in mats) if((S.mats[m]||0)<mats[m]) return false; return true; }
function pay(gold, mats){ const S=G.S; S.gold-=gold; for(const m in mats) S.mats[m]-=mats[m]; }
function buyPotion(id, n){ n=n||1; const p=D.POTION[id], S=G.S; if(p.apo>S.buildings.apothecary) return 0; let k=0;
  for(let i=0;i<n;i++){ if(!canAfford(potCost(p), p.mats)) break; pay(potCost(p), p.mats);
    if(p.elixir){ S.elixir={id, left:p.battles}; k++; break; } S.pots[id]=(S.pots[id]||0)+1; k++; } return k; }
function mealBattles(f){ return Math.round(f.battles*(1+0.03*G.S.profs.cooking.lv)); }
function buyFood(id){ const f=D.FOOD[id], S=G.S; if(f.tav>S.buildings.tavern||!canAfford(f.gold,f.mats)) return false; pay(f.gold,f.mats); S.food={id, left:mealBattles(f)}; G.S.chars.forEach(fixHpMp); return true; }
function mentorLessonCost(c){ const jt=c.jobs[c.job]; const spent=D.JOBS[c.job].tree.filter(n=>jt.nodes[n.id]).length; return 30*Math.pow(2,spent); }
function mentorLesson(ci){ const c=G.S.chars[ci]; if(!c.job||!mentorHere(c.job)) return false; const cost=mentorLessonCost(c); if(G.S.gold<cost) return false; G.S.gold-=cost; c.jobs[c.job].jp+=5; return true; }

/* ---------------- materials: where to get ---------------- */
function matSources(m){
  const out=[];
  D.ZONES.forEach((z,zi)=>{ for(const e of [...z.enemies, z.boss]) for(const [d,p] of e.drops) if(d===m) out.push({kind:'enemy', text:`${e.icon} ${e.name}${e.boss?' (boss)':''} — ${z.name}`, p, zi}); });
  if(m==='stone') out.unshift({kind:'prof', text:'🧱 Masonry worker (Village) — automatic'});
  if(m==='herb') out.unshift({kind:'prof', text:'⚗️ Alchemy worker (Village) — automatic'});
  return out;
}
function itemSources(id){
  const out=[]; const it=D.ITEM[id];
  if(it.shop) out.push({text:`⚒️ Smithy shop (needs Smithy Lv ${it.shop})`});
  D.ZONES.forEach(z=>{ for(const e of [...z.enemies, z.boss]) for(const [d,p] of e.drops) if(d===id) out.push({text:`${e.icon} ${e.name}${e.boss?' (boss)':''} — ${z.name}`, p}); });
  return out;
}
function skillSources(sid){ const out=[]; D.ITEMS.forEach(it=>{ if(it.skills.includes(sid)) out.push(it); }); D.RELICS.forEach(r=>{ if(r.skill===sid) out.push(Object.assign({relicDef:1}, r)); }); return out; }

/* ---------------- bestiary ---------------- */
function beastTier(eid){ const k=G.S.bestiary[eid]||0, lib=G.S.buildings.library; let t=0; D.BEAST_TIERS.forEach((x,i)=>{ if(i>0 && k>=x.kills && lib>=x.lib) t=i; }); return t; }
function beastTierByKills(eid){ const k=G.S.bestiary[eid]||0; let t=0; D.BEAST_TIERS.forEach((x,i)=>{ if(i>0 && k>=x.kills) t=i; }); return t; }
function enemyStats(e, zi){
  const r=D.ROLES[e.role], P=D.ZP; const b=e.boss?{hp:5,atk:1.25,def:1.2,agi:1.1,xp:8,gold:10}:{hp:1,atk:1,def:1,agi:1,xp:1,gold:1};
  const st = {hp:Math.max(3,Math.round(P.hp[zi]*r.hp*b.hp)), atk:Math.max(2,Math.round(P.atk[zi]*r.atk*b.atk)), def:Math.round(P.def[zi]*r.def*b.def), agi:Math.max(1,Math.round(P.agi[zi]*r.agi*b.agi)),
    mag:r.mag?Math.round(P.atk[zi]*r.mag*b.atk):0, xp:Math.round(P.xp[zi]*(r.hp+r.atk)/2*b.xp), gold:Math.max(1,Math.round(P.gold[zi]*b.gold))};
  return st;
}

/* ---------------- battle ---------------- */
function bossReady(zi){ const z=G.S.zones[zi]; return (!z.boss && z.wins>=D.ZONES[zi].wins) || (z.boss && z.sinceBoss>=25); }
function zoneUnlocked(zi){ return zi===0 || G.S.zones[zi-1].boss; }
function spawn(zi, boss){
  const Z=D.ZONES[zi]; const list = boss ? [Z.boss] : (()=>{ const n = zi===0 ? (chance(.15)?3:chance(.5)?2:1) : (chance(.3)?3:chance(.6)?2:1); const a=[]; for(let i=0;i<n;i++) a.push(pick(Z.enemies)); return a; })();
  const cnt={};
  return list.map((e,i)=>{ const st=enemyStats(e,zi); const t=beastTier(e.id), red=D.BEAST_TIERS[t].red;
    const same=list.filter(x=>x.id===e.id).length>1; cnt[e.id]=(cnt[e.id]||0)+1;
    return {id:e.id, name:e.name+(same?' '+'ABC'[cnt[e.id]-1]:''), icon:e.icon, weak:e.weak, boss:!!e.boss, role:e.role, zi,
      hp:st.hp, maxHp:st.hp, atk:Math.max(1,Math.round(st.atk*(1-red))), def:Math.round(st.def*(1-red)), agi:Math.max(1,Math.round(st.agi*(1-red))), mag:Math.round(st.mag*(1-red)),
      xp:st.xp, gold:st.gold, poison:null, stun:0, deb:{}, idx:i};
  });
}
function startBattle(boss){
  const S=G.S; const zi=S.zone;
  S.battle = {zi, boss:!!boss, enemies:spawn(zi, boss), round:0, queue:[], buffs:{}, cs:S.chars.map(()=>({used:{}})), done:false};
  const names = S.battle.enemies.map(e=>e.name);
  log(boss ? `⚠️ ${names[0]} blocks the path!` : (names.length===1? `${names[0]} appears!` : `${names.join(', ')} appear!`), boss?'boss':'');
  emit({t:'start'});
}
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
  for(const id in ss){ const s=D.SKILLS[id]; if(s.kind!=='active') continue; const cost=Math.max(s.mp?1:0,(s.mp||0)-(s.eff.spell||s.eff.heal?(d.f.mpCut||0):0)); out.push({id, s, cost}); }
  return out;
}
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
    if(S.settings.usePots && (S.pots.phoenix_down||0)>0 && !cs.used.down){ cs.used.down=1; S.pots.phoenix_down--; const t=S.chars[ko[0].i]; t.hp=Math.max(1,Math.round(calc(t).maxHp*.5)); log(`${c.name} uses a Phoenix Down! ${t.name} is revived.`,'heal'); emit({t:'healP',i:ko[0].i,amt:t.hp}); return; } }
  // 2) heal
  const healThr = c.tactic==='heal' ? .65 : .45;
  const hurt = party.filter(o=>{ const md=calc(o.c,B.buffs); return o.c.hp < md.maxHp*healThr; }).sort((a,b)=>a.c.hp/calc(a.c).maxHp - b.c.hp/calc(b.c).maxHp);
  if(hurt.length && c.tactic!=='attack'){
    const aoe=skills.filter(k=>k.s.tgt==='party'&&k.s.eff.heal); const one=skills.filter(k=>k.s.tgt==='ally'&&k.s.eff.heal);
    if(hurt.length>=2 && aoe.length){ useSkill(aoe.sort((a,b)=>b.s.eff.heal-a.s.eff.heal)[0]); return; }
    if(one.length){ useSkill(one[0], hurt[0].i); return; }
    if(aoe.length){ useSkill(aoe[0]); return; }
  }
  // 3) potion for self
  if(S.settings.usePots && c.hp < d.maxHp*.35 && !cs.used.pot2){ const pid=(S.pots.hi_potion>0&&d.maxHp-c.hp>14)?'hi_potion':(S.pots.potion>0?'potion':(S.pots.hi_potion>0?'hi_potion':null));
    if(pid){ cs.used.pot2=(cs.used.pot2||0)+0; cs.potN=(cs.potN||0)+1; if(cs.potN>=3) cs.used.pot2=1; S.pots[pid]--; const h=healChar(ci, D.POTION[pid].use.heal); log(`${c.name} drinks a ${D.POTION[pid].name}. +${h} HP.`,'heal'); return; } }
  // 4) ether
  const allSk=usableSkills(c,d); const caster=allSk.some(k=>k.s.eff.spell||k.s.eff.heal);
  if(S.settings.usePots && caster && c.mp<2 && (S.pots.ether||0)>0 && !cs.used.ether && c.tactic!=='attack'){ cs.used.ether=1; S.pots.ether--; c.mp=Math.min(d.maxMp, c.mp+5); log(`${c.name} drinks an Ether. +5 MP.`,'heal'); return; }
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
  if(chance(.55)){ e.stolen=1; const def=findEnemyDef(e.id); const mats=def.drops.filter(([d])=>D.MATS[d]);
    if(mats.length && chance(.6)){ const m=pick(mats)[0]; S.mats[m]=(S.mats[m]||0)+1; log(`${c.name} steals ${D.MATS[m].icon} ${D.MATS[m].name}!`,'good'); }
    else { const g=Math.max(1,Math.round(e.gold*1.5)); S.gold+=g; S.stats.goldEarned+=g; log(`${c.name} steals ${g} gold!`,'good'); } }
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
// one action. returns ms until next action (scaled by caller)
function step(){
  const S=G.S;
  if(!S.started || S.wiped) return 0;
  if(S.rest>0) return 0;
  if(!S.battle){ startBattle(S.settings.autoBoss && bossReady(S.zone) || S.pendingBoss); S.pendingBoss=false; return 700; }
  const B=S.battle;
  if(!B.queue.length) newRound();
  const a=B.queue.shift();
  if(a){ if(a.side==='p'){ if(S.chars[a.i].hp>0) playerTurn(a.i, a.haste); } else enemyTurn(a.i); }
  if(!liveEnemies().length){ victory(); return 1100; }
  if(!living().length){ defeat(); return 0; }
  return 600;
}
function victory(){
  const S=G.S, B=S.battle; const zi=B.zi; const Z=D.ZONES[zi];
  let xp=0, gold=0; B.enemies.forEach(e=>{ xp+=e.xp; gold+=e.gold; S.bestiary[e.id]=(S.bestiary[e.id]||0)+1; S.stats.kills++; });
  const ds=S.chars.map(c=>calc(c,B.buffs));
  const goldB = Math.min(1.5, ds.reduce((a,d)=>a+(d.f.gold||0),0));
  const midas = ds.some(d=>d.f.gold>=1);
  gold = Math.round(gold*(1+Math.min(1,goldB- (midas?1:0)))*(midas?2:1)*rnd(.8,1.2));
  const matF = 1+Math.max(...ds.map(d=>d.f.matFind||0)) + (midas?1:0);
  const dropF = 1+Math.max(...ds.map(d=>d.f.dropFind||0)) + (midas?1:0);
  S.gold+=gold; S.stats.goldEarned+=gold; S.stats.wins++; S.stats.battles++;
  log(`Victory! +${xp} XP, +${gold} gold.`, 'win');
  if(G.sum){ G.sum.wins++; G.sum.gold+=gold; G.sum.xp+=xp; }
  // drops
  for(const e of B.enemies){ const def=findEnemyDef(e.id);
    for(const [d,p] of def.drops){
      if(D.MATS[d]){ if(chance(Math.min(1,p*matF))){ const n=e.boss?ri(2,4):1; S.mats[d]=(S.mats[d]||0)+n; log(`Found ${D.MATS[d].icon} ${D.MATS[d].name}${n>1?' ×'+n:''}.`,'loot'); if(G.sum) G.sum.mats[d]=(G.sum.mats[d]||0)+n; } }
      else if(chance(Math.min(1,p*dropF))){ addItem(d); const it=D.ITEM[d]; log(`✨ Found ${it.icon} ${it.name}!`,'rare'); toast(`✨ Found ${it.icon} ${it.name}!`,'rare'); if(G.sum) G.sum.items.push(it.name); }
    }
    // relics
    for(const r of D.RELICS){ let odds=0; if(e.boss && r.src.boss===e.zi) odds=1/r.src.odds; else if(!e.boss && e.zi>=r.src.boss) odds=1/r.src.any;
      if(odds && chance(odds*dropF)){ addRelic(r.id); S.relicsFound[r.id]=(S.relicsFound[r.id]||0)+1; S.stats.relics++; log(`💠 RELIC! ${r.icon} ${r.name}!`,'relic'); toast(`💠 RELIC FOUND: ${r.icon} ${r.name}! Equip it in Party.`,'relic'); emit({t:'relic', id:r.id}); if(G.sum) G.sum.items.push('💠 '+r.name); } }
  }
  // xp / ap / jp
  S.chars.forEach((c,i)=>{ const d=ds[i]; const alive=c.hp>0;
    if(alive){ c.xp+=xp; while(c.xp>=xpNeed(c.lv) && c.lv<MAX_LV){ c.xp-=xpNeed(c.lv); c.lv++; const t=D.RACES[c.race].traits.find(t=>t.lv===c.lv);
        log(`⬆️ ${c.name} is now level ${c.lv}!`,'level'); emit({t:'lvl', i}); if(t){ log(`🧬 ${c.name} gains the ${D.RACES[c.race].name} trait “${t.name}”!`,'good'); toast(`🧬 ${c.name}: new racial trait ${t.name}`,'good'); }
        if(G.sum) G.sum.levels++; } }
    if(alive){ c.wins=(c.wins||0)+1; let ap = B.boss?3:1; if(d.f.apEvery && c.wins % d.f.apEvery===0) ap++;
      for(const u of charGear(c)) for(const sid of defOf(u).skills){ if(c.learned[sid]) continue; c.ap[sid]=(c.ap[sid]||0)+ap;
        if(c.ap[sid]>=D.SKILLS[sid].ap){ c.learned[sid]=1; delete c.ap[sid]; S.stats.learned++; const sk=D.SKILLS[sid]; log(`🎉 ${c.name} learned ${sk.name}!`,'learn'); toast(`🎉 ${c.name} learned ${D.TYPES[sk.type].icon} ${sk.name}!`,'learn'); if(G.sum) G.sum.learned.push(c.name+': '+sk.name);
          for(const jid of D.JOB_ORDER){ if(!c.jobUnl) c.jobUnl={}; if(!c.jobUnl[jid] && jobUnlocked(c,jid)){ c.jobUnl[jid]=1; log(`🎖️ ${c.name} can now become a ${D.JOBS[jid].name}!`,'good'); toast(`🎖️ ${c.name} can become a ${D.JOBS[jid].name}! (Party → Job)`,'learn'); } } } }
      if(c.job){ const jt=c.jobs[c.job]; jt.jp=(jt.jp||0)+(B.boss?3:1)+(mentorHere(c.job)?1:0); }
    }
    // after-battle recovery
    const md=calc(c); if(c.hp<=0) c.hp=1; else c.hp=Math.min(md.maxHp, c.hp+(d.f.postHeal||0)); c.mp=Math.min(md.maxMp, c.mp+1);
  });
  // zone progress
  const z=S.zones[zi]; z.wins++; if(z.boss) z.sinceBoss++;
  if(B.boss){ S.stats.bosses++; z.bossKills++; z.sinceBoss=0;
    if(!z.boss){ z.boss=true; log(`🏆 ${Z.boss.name} is defeated! ${zi+1<D.ZONES.length? D.ZONES[zi+1].name+' is now open.':'You have conquered Lanternfall!'}`,'boss'); toast(`🏆 Boss defeated! ${zi+1<D.ZONES.length? D.ZONES[zi+1].name+' unlocked (Map).':''}`,'relic'); if(G.sum) G.sum.notes.push('Beat '+Z.boss.name); } }
  // buffs tick
  if(S.food){ if(--S.food.left<=0){ log(`Your meal wore off.`); S.food=null; S.chars.forEach(fixHpMp); } }
  if(S.elixir){ if(--S.elixir.left<=0){ log(`Your elixir wore off.`); S.elixir=null; S.chars.forEach(fixHpMp); } }
  S.battle=null; emit({t:'win'});
  // camp rest
  const tot=S.chars.reduce((a,c)=>a+c.hp,0), max=S.chars.reduce((a,c)=>a+calc(c).maxHp,0);
  if(S.settings.autoRest && (tot/max<.5 || S.chars.some(c=>c.hp/calc(c).maxHp<.25))){ S.rest=6; log('⛺ The party makes camp to rest…'); }
}
function finishRest(){ const S=G.S; S.rest=0; S.chars.forEach(c=>{ const d=calc(c); c.hp=d.maxHp; c.mp=d.maxMp; }); log('The party is rested and ready.','good'); }
function defeat(){
  const S=G.S; S.stats.losses++; S.battle=null; S.wiped=true; S.auto=false; S.rest=0;
  log('💀 The party has fallen… villagers carry everyone home.','ko'); emit({t:'wipe'});
  S.chars.forEach(c=>{ const d=calc(c); c.hp=d.maxHp; c.mp=d.maxMp; });
  if(G.sum) G.sum.wiped=true;
}
function resume(){ const S=G.S; S.wiped=false; S.auto=true; S.chars.forEach(c=>{ const d=calc(c); c.hp=Math.max(c.hp,1); }); }
function setZone(zi){ const S=G.S; if(!zoneUnlocked(zi)) return false; S.zone=zi; S.battle=null; S.rest=0; log(`🗺️ The party travels to ${D.ZONES[zi].name}.`); return true; }
function challengeBoss(zi){ const S=G.S; if(!zoneUnlocked(zi)||!bossReady(zi)) return false; S.zone=zi; S.battle=null; S.rest=0; S.pendingBoss=true; if(S.wiped) resume(); S.auto=true; return true; }

/* ---------------- equip ---------------- */
function equip(ci, uid){ const S=G.S, c=S.chars[ci], u=invItem(uid); if(!u) return false; const slot=defOf(u).slot;
  const o=equippedBy(uid); if(o>=0){ const oc=S.chars[o]; for(const s in oc.equip) if(oc.equip[s]===uid) oc.equip[s]=null; fixHpMp(oc); }
  c.equip[slot]=uid; fixHpMp(c); return true; }
function unequip(ci, slot){ const c=G.S.chars[ci]; c.equip[slot]=null; fixHpMp(c); }

/* ---------------- party creation ---------------- */
function createParty(list){ const S=G.S; S.chars=list.map(x=>newChar(x.name.trim().slice(0,12)||'Hero', x.race));
  const starter={martial:'stick', holy:'rod', arcane:'wand', shadow:'knife', wild:'sling'};
  // each hero gets a starter weapon fitting their race, plus a tunic
  const pref={human:'stick', elf:'wand', dwarf:'stick', halfling:'knife', orc:'stick', beastkin:'sling'};
  const used=new Set();
  S.chars.forEach((c,i)=>{ let w=pref[c.race]; if(used.has(w)) w=['rod','wand','knife','sling','stick'].find(x=>!used.has(x))||w; used.add(w);
    const u=addItem(w); c.equip.weapon=u.uid; const a=addItem('tunic'); c.equip.armor=a.uid; const d=calc(c); c.hp=d.maxHp; c.mp=d.maxMp; });
  S.started=true; S.auto=true; log('The party sets out from the village of Lanternfall.','good');
}

/* ---------------- time ---------------- */
let _acc=0;
function tick(dtMs){
  const S=G.S; if(!S.started) return;
  const dt=dtMs/1000; S.stats.play+=dt;
  tickProfs(dt);
  if(S.rest>0){ S.rest-=dt*S.settings.speed; if(S.rest<=0) finishRest(); return; }
  if(!S.auto || S.wiped) return;
  _acc -= dtMs*S.settings.speed;
  let guard=0;
  while(_acc<=0 && guard++<5 && S.auto && !S.wiped && !(S.rest>0)){ const w=step(); _acc += w||600; }
}
// offline: professions run at full speed; battles simulated quickly at 50% of the online pace
const OFFLINE_CAP = 8*3600;
function offline(sec){
  const S=G.S; sec=Math.min(sec, OFFLINE_CAP); if(sec<5||!S.started) return null;
  const sum = G.sum = {sec, wins:0, gold:0, xp:0, levels:0, learned:[], items:[], mats:{}, profUps:0, wiped:false, notes:[], battles:0};
  const q=G.quiet; G.quiet=true;
  try{
    // professions in 10s chunks
    let left=sec; while(left>0){ const c=Math.min(10,left); tickProfs(c); left-=c; }
    if(S.auto && !S.wiped){
      const n=Math.min(3000, Math.floor(sec/12*0.5)); S.battle=null; S.rest=0;
      for(let b=0;b<n && !S.wiped;b++){ let g=0; startBattle(bossReady(S.zone)&&S.settings.autoBoss); while(S.battle && g++<400){ step(); if(S.wiped) break; } if(S.rest>0) finishRest(); if(S.battle){ S.battle=null; } sum.battles++; }
    }
  } finally { G.quiet=q; G.sum=null; }
  S.log=S.log.slice(-20);
  return sum;
}

if(typeof module!=='undefined') module.exports={G};
