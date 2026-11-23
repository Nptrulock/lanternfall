'use strict';
/* Lanternfall — UI */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UI = {banner:'forge', tab:'battle', sel:0, partyView:'hero', village:'overview', codex:'bestiary', bag:'gear', lastPanel:0, pointer:false, battleKey:null, wide:false, modalOpen:false, version:'1.0'};
window.__G = G; window.__D = D; window.__UI = UI;

/* ---------------- helpers ---------------- */
const pct = (a,b) => b>0 ? Math.max(0,Math.min(100,a/b*100)) : 0;
const bar = (v,max,cls,label) => `<div class="bar ${cls||''}"><i style="width:${pct(v,max)}%"></i>${label!=null?`<span>${label}</span>`:''}</div>`;
const statLine = st => Object.entries(st||{}).map(([k,v])=>`${v>0?'+':''}${v} ${D.STAT_NAMES[k]}`).join(', ');
const typeChip = t => `<span class="tchip" style="--tc:${D.TYPES[t].color}">${D.TYPES[t].icon} ${D.TYPES[t].name}</span>`;
const matChip = (m, need) => { const have=G.S.mats[m]||0; const short=need!=null&&have<need;
  return `<button class="mchip ${short?'short':''}" data-a="matInfo" data-m="${m}" title="Where to get">${D.MATS[m].icon} ${D.MATS[m].name} <b>${need!=null?`${have}/${need}`:have}</b> <em>?</em></button>`; };
const goldChip = need => `<span class="mchip ${G.S.gold<need?'short':''}">🪙 <b>${G.S.gold}/${need}</b></span>`;
const rname = (u, it) => { it=it||defOf(u); const r=u.relic?4:(u.r||0); return `<span class="rn r${r}">${it.icon} ${esc(it.name)}${r&&!u.relic?` <small>${D.RARITY[r].name}</small>`:''}</span>`; };
function skillName(id){ const s=D.SKILLS[id]; return `${D.TYPES[s.type].icon} ${s.name}`; }
function guard(name, fn, el){ try{ return fn(); }catch(e){ console.error(name, e); if(el) el.innerHTML=`<div class="err">⚠️ Something went wrong drawing this page (${esc(name)}). The game is still running.<br><small>${esc(e.message)}</small><br><button data-a="tab" data-t="battle">Back to battle</button></div>`; return ''; } }

/* ---------------- toasts ---------------- */
G.toast = (msg, kind) => { const t=document.createElement('div'); t.className='toast '+(kind||''); t.textContent=msg; $('#toasts').appendChild(t); setTimeout(()=>t.classList.add('out'), 3600); setTimeout(()=>t.remove(), 4200); while($('#toasts').children.length>4) $('#toasts').firstChild.remove(); };

/* ---------------- modal ---------------- */
function modal(html, cls){ const m=$('#modal'); m.className=cls||''; m.innerHTML=`<div class="mbox" role="dialog">${html}<button class="mclose" data-a="closeModal" aria-label="Close">✕</button></div>`; UI.modalOpen=true; }
function closeModal(){ $('#modal').className='hidden'; $('#modal').innerHTML=''; UI.modalOpen=false; }

/* ---------------- header / hint / tabs ---------------- */
function renderTop(){
  const S=G.S;
  $('#res').innerHTML = S.started ? `<span title="Gold">🪙 ${S.gold.toLocaleString()}</span><span title="Diamonds (gear pulls)">💎 ${S.diamonds}</span><span title="Village level">🏘️ ${villageLevel()}</span>` : '';
}
function renderHint(){
  const S=G.S; const el=$('#hint');
  if(!S.started || S.flags.tutDone){ el.innerHTML=''; el.style.display='none'; return; }
  let i=D.TUTORIAL.findIndex(t=>!t.done(S));
  if(i<0){ S.flags.tutDone=1; el.style.display='none'; return; }
  el.style.display='';
  el.innerHTML = `<span class="hn">Tip ${i+1}/${D.TUTORIAL.length}</span> ${esc(D.TUTORIAL[i].text)} <button class="lnk" data-a="tutSkip">Hide tips</button>`;
}
const TABS = [['battle','⚔️','Battle'],['party','👥','Party'],['village','🏘️','Village'],['map','🗺️','Map'],['codex','📖','Codex']];
function renderTabs(){
  $('#tabs').innerHTML = TABS.filter(t=>!(UI.wide&&t[0]==='battle')).map(([id,ic,n])=>{
    let badge=''; if(id==='party' && partyAlerts()) badge='<i class="dot"></i>'; if(id==='village' && villageAlerts()) badge='<i class="dot"></i>'; if(id==='map' && bossReady(G.S.zone)) badge='<i class="dot"></i>';
    return `<button class="tab ${UI.tab===id?'on':''}" data-a="tab" data-t="${id}"><b>${ic}</b><span>${n}</span>${badge}</button>`; }).join('');
}
function partyAlerts(){ const S=G.S; return S.chars.some(c=>D.JOB_ORDER.some(j=>!c.job&&jobUnlocked(c,j)) || (c.job && D.JOBS[c.job].tree.some(n=>nodeAvailable(c,c.job,n).ok))) || S.inv.some(u=>u.relic && equippedBy(u.uid)<0); }
function villageAlerts(){ const S=G.S; return workersUsed()<workerSlots() || D.BUILD_ORDER.some(b=>canBuild(b).ok) || D.BANNER_ORDER.some(b=>canBuildBanner(b).ok) || (S.diamonds>=D.PULL_COST && S.stats.pulls<1); }

/* ---------------- battle column ---------------- */
function battleSkeleton(){
  $('#battleCol').innerHTML = `
  <div id="zoneBar"></div>
  <div id="scene"><div id="sky"></div><div id="ground"></div><div id="enemies"></div><div id="floaters"></div><div id="sceneMsg"></div></div>
  <div id="msgwin" class="dq" aria-live="polite"></div>
  <div id="pwins"></div>
  <div id="learnStrip"></div>
  <div id="buffs"></div>`;
}
function renderZoneBar(){
  const S=G.S, Z=D.ZONES[S.zone], z=S.zones[S.zone];
  const ready=bossReady(S.zone);
  const prog = !z.boss ? `Boss: ${Math.min(z.wins,Z.wins)}/${Z.wins} wins` : `Boss beaten ✓ · rematch ${Math.min(z.sinceBoss,25)}/25`;
  $('#zoneBar').innerHTML = `<div class="zname"><b>${Z.name}</b><small>Lv ${Z.lv} · ${prog}</small>${bar(z.boss?z.sinceBoss:z.wins, z.boss?25:Z.wins,'thin gold')}</div>
    <div class="zbtns">
      ${ready?`<button class="btn boss pulse" data-a="boss">👑 Fight boss</button>`:''}
      <button class="btn ${S.auto&&!S.wiped?'':'go'}" data-a="auto">${S.wiped?'▶ Revive & go':S.auto?'⏸ Pause':'▶ Auto-battle'}</button>
      <button class="btn sm" data-a="speed" title="Battle speed">${S.settings.speed}×</button>
    </div>`;
}
function renderScene(){
  const S=G.S, B=S.battle, Z=D.ZONES[S.zone];
  const scene=$('#scene'); scene.style.setProperty('--sky1',Z.sky[0]); scene.style.setProperty('--sky2',Z.sky[1]); scene.style.setProperty('--g1',Z.bg[0]); scene.style.setProperty('--g2',Z.bg[1]);
  const key = B ? B.key || (B.key = Math.random().toString(36).slice(2)) : 'none';
  const el=$('#enemies');
  if(UI.battleKey!==key){ UI.battleKey=key;
    el.innerHTML = B ? B.enemies.map((e,i)=>`<div class="enemy ${e.boss?'boss':''}" id="en${i}"><div class="spr">${e.icon}</div><div class="ename">${esc(e.name)}</div><div class="ehp">${bar(e.hp,e.maxHp,'thin red')}</div></div>`).join('') : '';
  }
  if(B) B.enemies.forEach((e,i)=>{ const n=$('#en'+i); if(!n) return; n.classList.toggle('dead', e.hp<=0); const t=beastTier(e.id);
    n.querySelector('.ehp').innerHTML = bar(e.hp,e.maxHp,'thin red', t>=1?`${e.hp}/${e.maxHp}`:null) + (e.poison?'<span class="st">☠️</span>':'') + (e.stun?'<span class="st">💫</span>':'') + (t>=2?`<span class="wk">weak: ${D.ELEMENTS[e.weak].split(' ')[0]}</span>`:''); });
  let msg='';
  if(S.wiped) msg=`<div class="wipe dq"><b>💀 The party has fallen.</b><p>Villagers carried everyone home. Everyone is healed. Nothing was lost; auto-battle is paused.</p><div class="row"><button class="btn go" data-a="auto">▶ Revive &amp; keep fighting here</button>${S.zone>0?`<button class="btn" data-a="zone" data-z="${S.zone-1}">◀ Go back to ${esc(D.ZONES[S.zone-1].name)}</button>`:''}</div><small>Tip: level up, learn skills, eat at the Tavern or buy gear, then try again.</small></div>`;
  else if(S.rest>0) msg=`<div class="rest">⛺ Resting at camp… ${Math.ceil(S.rest/S.settings.speed)}s</div>`;
  else if(!S.auto) msg=`<div class="rest">⏸ Paused — tap ▶ Auto-battle</div>`;
  $('#sceneMsg').innerHTML=msg;
}
function renderLog(){
  const L=G.S.log.slice(-7);
  $('#msgwin').innerHTML = L.map(l=>`<div class="ln ${l.c}">${esc(l.m)}</div>`).join('') || '<div class="ln">…</div>';
}
function renderPWins(){
  const S=G.S;
  $('#pwins').innerHTML = S.chars.map((c,i)=>{ const d=calc(c, S.battle&&S.battle.buffs); const low=c.hp>0&&c.hp<d.maxHp*.3; const job=c.job?D.JOBS[c.job].icon:'';
    return `<button class="pwin dq ${c.hp<=0?'ko':low?'low':''}" id="pw${i}" data-a="openChar" data-i="${i}">
      <div class="pn">${esc(c.name)}</div><div class="pl">${D.RACES[c.race].icon}${job} Lv ${c.lv}</div>
      <div class="ps"><span>HP</span><b>${c.hp}</b><small>/${d.maxHp}</small></div>${bar(c.hp,d.maxHp,'thin hpb')}
      <div class="ps"><span>MP</span><b>${c.mp}</b><small>/${d.maxMp}</small></div>${bar(c.mp,d.maxMp,'thin mpb')}
    </button>`; }).join('');
}
function learningOf(c){ // [{sid, ap, need}] for gear skills not yet learned
  const out=[]; for(const u of charGear(c)) for(const sid of defOf(u).skills) if(!c.learned[sid] && !out.some(x=>x.sid===sid)) out.push({sid, ap:c.ap[sid]||0, need:D.SKILLS[sid].ap}); return out.sort((a,b)=>b.ap/b.need-a.ap/a.need); }
function renderLearn(){
  const S=G.S;
  $('#learnStrip').innerHTML = `<div class="lshead">📘 Learning from gear <small>(+1 AP per win)</small></div>` + S.chars.map((c,i)=>{ const L=learningOf(c);
    if(!L.length) return `<div class="lsrow" data-a="openChar" data-i="${i}"><b>${esc(c.name)}</b><span class="muted warnl">all learned — equip new gear ›</span></div>`;
    const x=L[0]; return `<div class="lsrow" data-a="openChar" data-i="${i}"><b>${esc(c.name)}</b><span class="sk">${skillName(x.sid)}</span>${bar(x.ap,x.need,'thin ap',`${x.ap}/${x.need}`)}${L.length>1?`<small>+${L.length-1}</small>`:''}</div>`; }).join('');
}
function renderBuffs(){
  const S=G.S; const b=[];
  if(S.food) b.push(`${D.FOOD[S.food.id].icon} ${D.FOOD[S.food.id].name} (${D.FOOD[S.food.id].desc}) · ${S.food.left} battles`);
  if(S.elixir) b.push(`${D.POTION[S.elixir.id].icon} ${D.POTION[S.elixir.id].name} · ${S.elixir.left} battles`);
  const p=['potion','hi_potion','ether','phoenix_down'].filter(k=>S.pots[k]>0).map(k=>`${D.POTION[k].icon}${S.pots[k]}`).join(' ');
  $('#buffs').innerHTML = (b.length?b.map(x=>`<span class="buff">${x}</span>`).join(''):`<span class="muted">No meal or elixir active — visit the Tavern / Apothecary.</span>`) + (p?`<span class="buff">Bag: ${p}</span>`:'');
}
function renderMini(){
  const S=G.S; const el=$('#mini');
  if(UI.wide || UI.tab==='battle' || !S.started){ el.innerHTML=''; el.style.display='none'; return; }
  el.style.display='';
  const last=S.log[S.log.length-1];
  el.innerHTML = `<button class="minib" data-a="tab" data-t="battle"><span>⚔️ ${esc(D.ZONES[S.zone].name)} ${S.wiped?'· 💀 fallen':S.rest>0?'· ⛺ resting':!S.auto?'· ⏸':''}</span>
    <span class="mhp">${S.chars.map(c=>{const d=calc(c);return `<i class="${c.hp<=0?'ko':''}" style="--p:${pct(c.hp,d.maxHp)}%"></i>`}).join('')}</span><small>${last?esc(last.m):''}</small></button>`;
}
function animate(){
  const ev=G.ev.splice(0); if(!ev.length) return;
  const fl=$('#floaters'); if(!fl) return;
  for(const e of ev){
    if(e.t==='hitE'||e.t==='missE'){ const n=$('#en'+e.i); if(!n) continue; n.classList.remove('hit'); void n.offsetWidth; n.classList.add('hit');
      float(fl, n, e.t==='missE'?'miss':e.dmg, e.t==='missE'?'miss':e.how==='crit'?'crit':e.how==='poison'?'poison':''); }
    if(e.t==='killE'){ const n=$('#en'+e.i); if(n) n.classList.add('dying'); }
    if(e.t==='hitP'||e.t==='missP'||e.t==='healP'||e.t==='koP'){ const n=$('#pw'+e.i); if(!n) continue; const cl=e.t==='healP'?'healed':e.t==='missP'?'dodged':'shake'; n.classList.remove(cl); void n.offsetWidth; n.classList.add(cl);
      if(e.t==='hitP'&&e.dmg) floatP(n, '-'+e.dmg, 'hurt'); if(e.t==='healP'&&e.amt) floatP(n, '+'+e.amt, 'heal'); if(e.t==='missP') floatP(n,'miss','miss'); }
    if(e.t==='relic'){ const r=D.RELIC[e.id]; modal(`<div class="relicpop"><div class="big">${r.icon}</div><h2>Relic found!</h2><h3>${r.name}</h3><p>${esc(r.desc)}</p><p>Houses the vital skill <b>${skillName(r.skill)}</b>: ${esc(D.SKILLS[r.skill].desc)}</p><p class="muted">Equip it in Party → a hero → Relic slot. Anyone wearing it can use the skill right away; ${D.SKILLS[r.skill].ap} AP masters it for good.</p><button class="btn go" data-a="closeModal">Wonderful</button></div>`); }
  }
}
function float(fl, n, txt, cls){ const r=n.getBoundingClientRect(), p=fl.getBoundingClientRect(); const f=document.createElement('div'); f.className='fl '+cls; f.textContent=txt; f.style.left=(r.left-p.left+r.width/2)+'px'; f.style.top=(r.top-p.top+r.height*.3)+'px'; fl.appendChild(f); setTimeout(()=>f.remove(), 900); }
function floatP(n, txt, cls){ const f=document.createElement('div'); f.className='flp '+cls; f.textContent=txt; n.appendChild(f); setTimeout(()=>f.remove(), 900); }
function renderBattle(){
  if(!$('#zoneBar')) battleSkeleton();
  renderZoneBar(); renderScene(); renderLog(); renderPWins(); renderLearn(); renderBuffs(); animate();
}

/* ---------------- party panel ---------------- */
function panelParty(){
  const S=G.S; G.S.flags.sawParty=1; const ci=UI.sel, c=S.chars[ci];
  const chips = S.chars.map((x,i)=>`<button class="chip ${i===ci?'on':''}" data-a="sel" data-i="${i}">${D.RACES[x.race].icon} ${esc(x.name)} <small>Lv ${x.lv}</small></button>`).join('') + `<button class="chip ${UI.partyView==='bag'?'on':''}" data-a="pview" data-v="bag">🎒 Bag</button>`;
  if(UI.partyView==='bag') return `<div class="chips">${chips}</div>${panelBag()}`;
  const d=calc(c), r=D.RACES[c.race];
  const views=[['hero','Overview'],['gear','Gear & skills'],['job','Job'],['race','Race']];
  let h=`<div class="chips">${chips}</div>
  <div class="card hero-card"><div class="hc-top"><div class="hc-ic">${r.icon}</div><div><h2>${esc(c.name)} <button class="lnk" data-a="rename" data-i="${ci}">✏️</button></h2>
    <div class="muted">${r.name} · ${c.job?D.JOBS[c.job].icon+' '+D.JOBS[c.job].name:'Jobless'} · Lv ${c.lv}</div></div></div>
    ${bar(c.xp, xpNeed(c.lv), 'xp', `XP ${c.xp}/${xpNeed(c.lv)}`)}
    <div class="stats">${['hp','mp','str','def','mag','agi'].map(k=>`<div><span>${D.STAT_NAMES[k]}</span><b>${k==='hp'?`${c.hp}/${d.maxHp}`:k==='mp'?`${c.mp}/${d.maxMp}`:d[k]}</b></div>`).join('')}</div>
    <div class="tactic">Tactic: ${[['auto','⚖️ Balanced'],['attack','🗡️ Attack only'],['heal','💚 Healer']].map(([t,n])=>`<button class="chip ${c.tactic===t?'on':''}" data-a="tactic" data-t="${t}">${n}</button>`).join('')}</div>
  </div>
  <div class="chips sub">${views.map(([v,n])=>`<button class="chip ${UI.partyView===v?'on':''}" data-a="pview" data-v="${v}">${n}${v==='job'&&(!c.job&&D.JOB_ORDER.some(j=>jobUnlocked(c,j))||c.job&&D.JOBS[c.job].tree.some(n=>nodeAvailable(c,c.job,n).ok))?' <i class="dot in"></i>':''}</button>`).join('')}</div>`;
  if(UI.partyView==='hero') h+=heroOverview(c,ci,d);
  if(UI.partyView==='gear') h+=heroGear(c,ci);
  if(UI.partyView==='job') h+=heroJob(c,ci);
  if(UI.partyView==='race') h+=heroRace(c);
  return h;
}
function heroOverview(c,ci,d){
  const L=learningOf(c); const n=typeCounts(c);
  return `<div class="card"><h3>📘 Learning now</h3>${L.length?L.map(x=>`<div class="lrow"><span>${skillName(x.sid)} <small class="muted">${D.SKILLS[x.sid].kind}</small></span>${bar(x.ap,x.need,'ap',`${x.ap}/${x.need} AP`)}</div>`).join(''):'<p class="muted">Nothing to learn from current gear. Equip gear with new skills.</p><div class="row"><button class="btn sm go" data-a="autoEquip">🔄 Swap in gear with new skills</button><button class="btn sm" data-a="vview" data-v="smithy">⚒️ Visit the Smithy</button></div>'}
    <p class="muted small">Every battle won gives +1 AP to each skill on the gear a hero is wearing (+3 for bosses). Fill the bar and the skill is learned forever, even after the gear comes off. While worn, gear skills can be used before they're learned.</p></div>
  <div class="card"><h3>🎖️ Path to a job</h3><div class="types">${Object.keys(D.TYPES).filter(t=>!['vital','job'].includes(t)).map(t=>{ const base=D.JOB_ORDER.find(j=>Object.keys(D.JOBS[j].req).length===1&&D.JOBS[j].req[t]); const need=D.JOBS[base].req[t];
    return `<div class="trow">${typeChip(t)} ${bar(Math.min(n[t]||0,need),need,'thin',`${n[t]||0}/${need}`)} <small>${D.JOBS[base].icon} ${D.JOBS[base].name}</small></div>`; }).join('')}</div>
    <p class="muted small">Learn 3 skills of one type to unlock its job. Advanced jobs need 4 + 3 of two types and a mentor at the Guild Hall.</p></div>`;
}
function itemCard(u, ci, slot){
  if(!u) return `<div class="slot empty"><div class="sl">${D.SLOT_NAMES[slot]}</div><div class="muted">Empty</div><button class="btn sm" data-a="pickSlot" data-s="${slot}">Equip…</button></div>`;
  const it=defOf(u), c=G.S.chars[ci];
  return `<div class="slot ${u.relic?'relic':''}"><div class="sl">${D.SLOT_NAMES[slot]}</div><div class="iname">${rname(u,it)}</div><div class="muted small">${statLine(it.stats)}${!u.relic&&u.r>=2?` · +${D.RARITY[u.r].ap} AP/win`:''}</div>
    ${it.skills.map(s=>`<div class="lrow"><span>${skillName(s)}</span>${c.learned[s]?'<span class="ok">✓ learned</span>':bar(c.ap[s]||0,D.SKILLS[s].ap,'ap thin',`${c.ap[s]||0}/${D.SKILLS[s].ap}`)}</div>`).join('')}
    <div class="row"><button class="btn sm" data-a="pickSlot" data-s="${slot}">Change</button><button class="btn sm ghost" data-a="unequip" data-s="${slot}">Remove</button></div></div>`;
}
function heroGear(c,ci){
  const ss=skillSet(c);
  const groups={}; for(const id in ss){ const s=D.SKILLS[id]; (groups[s.type]=groups[s.type]||[]).push(id); }
  return `<div class="card"><div class="row between"><h3>🧰 Equipment</h3><button class="btn sm" data-a="autoEquip" title="Every hero puts on bag gear with skills they haven't learned">🔄 Swap in new-skill gear</button></div><div class="slots">${D.SLOTS.map(s=>itemCard(c.equip[s]!=null?invItem(c.equip[s]):null, ci, s)).join('')}</div></div>
  <div class="card"><h3>📗 Skills available</h3>${Object.keys(groups).length?Object.entries(groups).map(([t,ids])=>`<div class="sgroup">${typeChip(t)}<div>${ids.map(id=>{const s=D.SKILLS[id];return `<div class="skl"><b>${s.name}</b> <small class="muted">${s.kind}${s.mp?` · ${s.mp} MP`:''} · ${ss[id]==='learned'?'learned':ss[id]==='job'?'job skill':'from gear'}</small><div class="small">${esc(s.desc)}</div></div>`}).join('')}</div></div>`).join(''):'<p class="muted">No skills yet.</p>'}
  <p class="muted small">Passive skills work automatically. Actives are used by the auto-battle AI when they're the best move.</p></div>`;
}
function heroJob(c,ci){
  const S=G.S; let h='';
  h+=`<div class="card"><h3>🎖️ Jobs</h3><div class="jobs">${D.JOB_ORDER.map(j=>{ const J=D.JOBS[j], n=typeCounts(c), ok=jobUnlocked(c,j);
    const reqs=Object.entries(J.req).map(([t,k])=>`<span class="${(n[t]||0)>=k?'ok':'short'}">${D.TYPES[t].icon} ${n[t]||0}/${k} ${D.TYPES[t].name}</span>`).join(' ');
    const ment = J.mentor ? (()=>{ const m=D.MENTOR[J.mentor]; return `<span class="${S.buildings.guild>=m.gl?'ok':'short'}">🏛️ Guild Hall Lv ${S.buildings.guild}/${m.gl}</span>`; })() : '';
    return `<div class="job ${c.job===j?'on':''} ${ok?'':'locked'}"><div class="jt">${J.icon} <b>${J.name}</b> <small class="muted">${esc(J.desc)}</small></div><div class="small">${reqs} ${ment}</div><div class="small muted">Job bonus: ${statLine(J.stats)}${c.jobs[j]?` · ${c.jobs[j].jp} JP`:''}</div>
      ${c.job===j?'<span class="ok">Current job</span>':ok?`<button class="btn sm go" data-a="setJob" data-j="${j}">Become ${J.name}</button>`:''}</div>`; }).join('')}</div>
    ${c.job?`<button class="btn sm ghost" data-a="setJob" data-j="">Go jobless</button>`:''}<p class="muted small">Switching jobs is free. Each job keeps its own JP and learned nodes; only the current job's tree is active.</p></div>`;
  if(c.job){ const J=D.JOBS[c.job], jt=c.jobs[c.job];
    h+=`<div class="card"><h3>${J.icon} ${J.name} skill tree <span class="jp">${jt.jp} JP</span></h3><p class="muted small">+1 JP per win (+3 boss)${mentorHere(c.job)?' · +1 from your mentor':''}.</p><div class="tree">${[1,2,3].map(t=>`<div class="tier"><div class="tl">Tier ${t}${t===3?' (needs mentor)':''}</div>${J.tree.filter(n=>n.tier===t).map(n=>{ const a=nodeAvailable(c,c.job,n), own=jt.nodes[n.id];
      return `<div class="node ${own?'own':a.ok?'can':''}"><b>${n.name}</b><div class="small">${esc(n.desc)}${n.eff.grant?' — '+esc(D.SKILLS[n.eff.grant].desc):''}</div>${own?'<span class="ok">✓ Learned</span>':a.ok?`<button class="btn sm go" data-a="node" data-n="${n.id}">Learn (${n.cost} JP)</button>`:`<small class="short">${esc(a.why)}</small>`}</div>`; }).join('')}</div>`).join('')}</div>
      ${mentorHere(c.job)?`<button class="btn sm" data-a="lesson">🏛️ Mentor lesson: +5 JP for ${mentorLessonCost(c)} gold</button>`:''}</div>`; }
  return h;
}
function heroRace(c){
  const r=D.RACES[c.race];
  return `<div class="card"><h3>${r.icon} ${r.name} traits</h3><p class="muted">${esc(r.desc)}</p>${r.traits.map(t=>`<div class="trait ${c.lv>=t.lv?'on':''}"><b>Lv ${t.lv} · ${t.name}</b> ${c.lv>=t.lv?'<span class="ok">✓</span>':`<small class="muted">unlocks at Lv ${t.lv}</small>`}<div class="small">${esc(t.desc)}</div></div>`).join('')}
    <p class="muted small">Growth per level: ${Object.entries(r.grow).map(([k,v])=>`${D.STAT_NAMES[k]} ${v}`).join(' · ')} (stats grow slowly; fractions add up over levels).</p></div>`;
}
function panelBag(){
  const S=G.S; const v=UI.bag;
  let h=`<div class="chips sub">${[['gear','Gear'],['mats','Materials'],['pots','Potions']].map(([k,n])=>`<button class="chip ${v===k?'on':''}" data-a="bagv" data-v="${k}">${n}</button>`).join('')}</div>`;
  if(v==='gear'){ const items=S.inv.slice().sort((a,b)=>((b.relic?9:b.r||0)-(a.relic?9:a.r||0))||((defOf(b).tier||9)-(defOf(a).tier||9)));
    const mastered=S.inv.filter(u=>equippedBy(u.uid)<0&&isMastered(u));
    h+=`<div class="card"><div class="row between"><h3>Gear (${items.length})</h3>${mastered.length?`<button class="btn sm" data-a="sellMastered">Sell ${mastered.length} mastered</button>`:''}</div><p class="muted small">“Mastered” = every hero already learned all its skills. Tap an item to see where it comes from.</p>
      <div class="ilist">${items.map(u=>{ const it=defOf(u), w=equippedBy(u.uid); return `<div class="irow"><button class="lnk il" data-a="itemInfo" data-u="${u.uid}">${rname(u,it)}</button><small class="muted">${statLine(it.stats)} · ${it.skills.map(s=>D.SKILLS[s].name).join(', ')}</small>${w>=0?`<small class="ok">worn by ${esc(S.chars[w].name)}</small>`:`<button class="btn sm ghost" data-a="sell" data-u="${u.uid}">Sell ${sellPrice(u)}g</button>`}</div>`; }).join('')}</div></div>`; }
  if(v==='mats') h+=`<div class="card"><h3>Materials</h3><p class="muted small">Tap any material to see where to get it and what uses it.</p><div class="mgrid">${Object.keys(D.MATS).map(m=>matChip(m)).join('')}</div>
    ${(()=>{ const g=['quartz','silver','nugget'].reduce((a,m)=>a+(S.mats[m]||0)*D.MATS[m].sell,0); return `<div class="row"><button class="btn sm ${g?'go':''}" data-a="sellGems" ${g?'':'disabled'}>Sell mined gems (🔹🪙🟡) for ${g} gold</button></div>`; })()}</div>`;
  if(v==='pots') h+=`<div class="card"><h3>Potions</h3>${D.POTIONS.filter(p=>!p.elixir).map(p=>`<div class="irow"><span>${p.icon} ${p.name} ×${S.pots[p.id]||0}</span><small class="muted">${esc(p.desc)}</small></div>`).join('')}<p class="muted small">Buy more at the Apothecary (Village). Turn auto-use on/off in ⚙️ Settings.</p></div>`;
  return h;
}

/* ---------------- village panel ---------------- */
function buildingArt(b){ const L=G.S.buildings[b]; const B=D.BUILDINGS[b]; const tier=L===0?0:L<3?1:L<6?2:3;
  return `<div class="bld t${tier}" data-a="vview" data-v="${b==='library'?'library':b}"><div class="roof"></div><div class="body"><span>${L?B.icon:'🪧'}</span></div><div class="bname">${B.name}</div><div class="stars">${L?'★'.repeat(L):'plot'}</div></div>`; }
function panelVillage(){
  const S=G.S; const v=UI.village;
  const subs=[['overview','🏘️ Overview'],['gacha','💎 Gear Halls'],['smithy','⚒️ Smithy'],['tavern','🍺 Tavern'],['apothecary','⚗️ Apothecary'],['guild','🏛️ Guild Hall'],['library','📚 Library']];
  let h=`<div class="village-scene">${D.BUILD_ORDER.map(buildingArt).join('')}</div><div class="village-scene halls">${D.BANNER_ORDER.map(hallArt).join('')}</div>
    <div class="chips sub">${subs.map(([k,n])=>`<button class="chip ${v===k?'on':''}" data-a="vview" data-v="${k}">${n}</button>`).join('')}</div>`;
  if(v==='overview') h+=villageOverview();
  else if(v==='gacha') h+=villageGacha();
  else if(v==='smithy') h+=villageSmithy();
  else if(v==='tavern') h+=villageTavern();
  else if(v==='apothecary') h+=villageApo();
  else if(v==='guild') h+=villageGuild();
  else if(v==='library') h+=villageLibrary();
  return h;
}
function costHtml(c){ return `${c.gold?goldChip(c.gold):''}${Object.entries(c.mats).map(([m,n])=>matChip(m,n)).join('')}`; }
function buildCard(b){
  const S=G.S, B=D.BUILDINGS[b], L=S.buildings[b], c=buildCost(b), a=canBuild(b), p=D.PROFS[B.prof];
  return `<div class="card bcard"><div class="row between"><h3>${B.icon} ${B.name} <small>Lv ${L}/${D.BMAX}</small></h3><button class="lnk" data-a="vview" data-v="${b}">Open ›</button></div>
    <p class="small muted">${esc(B.unlock)}</p>
    ${c?`<div class="need"><span class="small">Next (Lv ${c.lv}) needs:</span> <span class="mchip ${S.profs[B.prof].lv<c.prof?'short':''}">${p.icon} ${p.name} Lv <b>${S.profs[B.prof].lv}/${c.prof}</b></span>${costHtml(c)}</div>
    <button class="btn ${a.ok?'go':''}" data-a="build" data-b="${b}" ${a.ok?'':'disabled'}>${L?'Upgrade':'Build'} to Lv ${c.lv}</button>${a.ok?'':`<small class="short"> Missing: ${esc(a.why)}</small>`}`:'<span class="ok">Fully built!</span>'}</div>`;
}
function villageOverview(){
  const S=G.S; const slots=workerSlots(), used=workersUsed(); const nx=D.WORKER_SLOTS.find(w=>w.vl>villageLevel());
  return `<div class="card"><h3>👷 Villagers at work <small>${used}/${slots} assigned</small></h3>
    <p class="muted small">Villagers level professions while you fight, even offline (up to 8h). Profession levels let you upgrade buildings.${nx?` Next worker at village level ${nx.vl} (now ${villageLevel()}).`:''}</p>
    <div class="profs">${D.PROF_ORDER.map(p=>{ const P=D.PROFS[p], pr=S.profs[p], on=!!S.workers[p]; const rate=1+0.05*S.buildings[P.building]; const need=profNeed(pr.lv);
      return `<div class="prof ${on?'on':''}"><div class="row between"><b>${P.icon} ${P.name} <small>Lv ${pr.lv}</small></b><button class="btn sm ${on?'':'go'}" data-a="worker" data-p="${p}" ${!on&&used>=slots?'disabled':''}>${on?'👷 Working — recall':'Assign villager'}</button></div>
        ${bar(pr.xp,need,'profb',`${Math.floor(pr.xp)}/${need}${on?` · next in ${fmtTime((need-pr.xp)/rate)}`:''}`)}
        <div class="small muted">${esc(P.desc)}</div><div class="small">✨ ${esc(profPerk(p).text)}</div></div>`; }).join('')}</div></div>
    ${D.BUILD_ORDER.map(buildCard).join('')}`;
}
function villageSmithy(){
  const S=G.S; const L=S.buildings.smithy; const items=shopItems(); const fu=fusable(); const lim=fuseLimit();
  return buildCard('smithy') + `<div class="card"><h3>⚒️ Basic gear <small>(Common · −${Math.min(40,S.profs.smithing.lv)}% from Smithing)</small></h3><p class="muted small">Starter gear only. Better gear comes from the 💎 Gear Halls.</p>
    <div class="shop">${items.map(it=>{ const p=buyPrice(it); const owned=S.inv.filter(u=>u.id===it.id).length; const newFor=S.chars.filter(c=>it.skills.some(s=>!c.learned[s])).length;
      return `<div class="sitem"><div class="iname">${it.icon} ${esc(it.name)} <small class="muted">${D.SLOT_NAMES[it.slot]}</small></div><div class="small">${statLine(it.stats)}</div>
        <div class="small">${it.skills.map(s=>`<span class="sk">${skillName(s)}</span>`).join(' ')}</div><div class="small muted">${newFor?`${newFor} hero${newFor>1?'es':''} can still learn from this`:'everyone has mastered these'}${owned?` · you own ${owned}`:''}</div>
        <button class="btn sm ${S.gold>=p?'go':''}" data-a="buy" data-id="${it.id}" ${S.gold>=p?'':'disabled'}>Buy ${p}g</button></div>`; }).join('')}</div></div>
    <div class="card"><h3>🔨 Fuse duplicates</h3><p class="muted small">3 unworn copies of the same item and rarity → 1 of the next rarity. Smithy Lv ${L} can fuse up to <b>${lim?D.RARITY[lim].name:'nothing yet (Lv 2 needed)'}</b>${lim<4?` · Lv ${(lim+1)*2} allows ${D.RARITY[lim+1].name}`:''}.</p>
      ${fu.length?fu.map(f=>{ const it=D.ITEM[f.id]; const c=fuseCost(f.r); return `<div class="irow"><span>${rname({id:f.id,r:f.r})} ×${f.n}</span>${f.ok?`<button class="btn sm ${S.gold>=c?'go':''}" data-a="fuse" data-id="${f.id}" data-r="${f.r}" ${S.gold>=c?'':'disabled'}>Fuse → ${D.RARITY[f.r+1].name} (${c}g)</button>`:`<small class="short">needs Smithy Lv ${(f.r+1)*2}</small>`}</div>`; }).join(''):'<p class="muted small">No triples yet. Duplicate pulls pile up here.</p>'}</div>
    <div class="card"><h3>💰 Sell</h3><p class="muted small">Sell unworn gear and mined gems from 👥 Party → 🎒 Bag. Smithy levels add +5% sell price each.</p><button class="btn sm" data-a="gobag">Open Bag</button></div>`;
}
function villageTavern(){
  const S=G.S, L=S.buildings.tavern;
  return buildCard('tavern') + `<div class="card"><h3>🍺 Meals <small>(one at a time · lasts +${S.profs.cooking.lv*3}% from Cooking)</small></h3>
    ${S.food?`<p>Now eating: ${D.FOOD[S.food.id].icon} <b>${D.FOOD[S.food.id].name}</b> — ${S.food.left} battles left.</p>`:''}
    ${L?'':'<p class="short">Build the Tavern first (Cooking Lv 1).</p>'}
    <div class="shop">${D.FOODS.map(f=>{ const ok=f.tav<=L; return `<div class="sitem ${ok?'':'locked'}"><div class="iname">${f.icon} ${f.name}</div><div class="small"><b>${f.desc}</b> for ${mealBattles(f)} battles (whole party)</div>
      ${ok?`<div class="need">${goldChip(f.gold)}${Object.entries(f.mats).map(([m,n])=>matChip(m,n)).join('')}</div><button class="btn sm ${canAfford(f.gold,f.mats)?'go':''}" data-a="food" data-id="${f.id}" ${canAfford(f.gold,f.mats)?'':'disabled'}>Eat</button>`:`<small class="muted">Tavern Lv ${f.tav}</small>`}</div>`; }).join('')}</div></div>`;
}
function villageApo(){
  const S=G.S, L=S.buildings.apothecary;
  return buildCard('apothecary') + `<div class="card"><h3>⚗️ Potions & elixirs <small>(−${Math.min(40,S.profs.alchemy.lv)}% gold from Alchemy)</small></h3>
    ${S.elixir?`<p>Active elixir: ${D.POTION[S.elixir.id].icon} <b>${D.POTION[S.elixir.id].name}</b> — ${S.elixir.left} battles left.</p>`:''}
    ${L?'':'<p class="short">Build the Apothecary first (Alchemy Lv 1).</p>'}
    <div class="shop">${D.POTIONS.map(p=>{ const ok=p.apo<=L; const g=potCost(p); return `<div class="sitem ${ok?'':'locked'}"><div class="iname">${p.icon} ${p.name} ${p.elixir?'<small class="muted">elixir</small>':`<small class="muted">have ${S.pots[p.id]||0}</small>`}</div><div class="small">${esc(p.desc)}</div>
      ${ok?`<div class="need">${goldChip(g)}${Object.entries(p.mats).map(([m,n])=>matChip(m,n)).join('')}</div><div class="row"><button class="btn sm ${canAfford(g,p.mats)?'go':''}" data-a="pot" data-id="${p.id}" data-n="1" ${canAfford(g,p.mats)?'':'disabled'}>${p.elixir?'Drink':'Buy 1'}</button>${p.elixir?'':`<button class="btn sm" data-a="pot" data-id="${p.id}" data-n="5" ${canAfford(g*5,Object.fromEntries(Object.entries(p.mats).map(([m,n])=>[m,n*5])))?'':'disabled'}>Buy 5</button>`}</div>`:`<small class="muted">Apothecary Lv ${p.apo}</small>`}</div>`; }).join('')}</div></div>`;
}
function villageGuild(){
  const S=G.S, L=S.buildings.guild;
  return buildCard('guild') + `<div class="card"><h3>🏛️ Mentors</h3><p class="muted small">Mentors give +1 JP per win to heroes in their job, unlock tier-3 job skills, sell lessons (+5 JP), and the later ones unlock advanced jobs.</p>
    ${D.MENTORS.map(m=>{ const here=L>=m.gl; const J=D.JOBS[m.job]; return `<div class="mentor ${here?'on':''}"><b>${J.icon} ${m.name}</b> <small class="muted">${J.name}</small> ${here?'<span class="ok">in residence</span>':`<small class="short">arrives at Guild Hall Lv ${m.gl}</small>`}<div class="small">${esc(m.desc)}</div></div>`; }).join('')}</div>`;
}
function villageLibrary(){
  const S=G.S, L=S.buildings.library;
  return buildCard('library') + `<div class="card"><h3>📚 Bestiary knowledge</h3><p class="muted small">Kills teach you about a monster, but the Library has to be big enough to record it. Knowledge makes that monster weaker for good.</p>
    ${D.BEAST_TIERS.slice(1).map((t,i)=>`<div class="trait ${L>=t.lib?'on':''}"><b>Tier ${i+1}: ${t.kills} kills · Library Lv ${t.lib}</b><div class="small">${esc(t.label)}</div></div>`).join('')}
    <button class="btn sm" data-a="gocodex" data-v="bestiary">Open the Bestiary</button></div>`;
}

function hallArt(b){ const L=G.S.banners[b], B=D.BANNERS[b]; const tier=L===0?0:L<3?1:L<6?2:3;
  return `<div class="bld hall t${tier} ${UI.banner===b&&UI.village==='gacha'?'sel':''}" data-a="hall" data-b="${b}"><div class="roof"></div><div class="body"><span>${L?B.icon:'🪧'}</span></div><div class="bname">${B.name}</div><div class="stars">${L?'★'.repeat(L):'plot'}</div></div>`; }
function ratesTable(b){ const L=G.S.banners[b]; const cur=L?bannerRates(b,L):null, nx=L<D.BMAX?bannerRates(b,L+1):null;
  return `<table class="rates"><tr><th>Rarity</th><th>Now${L?` (Lv ${L})`:''}</th>${nx?`<th>Next (Lv ${L+1})</th>`:''}<th>Gear bonus</th></tr>${D.RARITY.map((r,i)=>`<tr><td><span class="rn r${i}">${r.name}</span></td><td>${cur?cur[i]+'%':'—'}</td>${nx?`<td class="${cur&&nx[i]>cur[i]?'ok':''}">${nx[i]}%</td>`:''}<td class="small">stats ×${r.mult}${r.ap?`, +${r.ap} AP/win`:''}</td></tr>`).join('')}</table>`; }
function villageGacha(){
  const S=G.S; const b=UI.banner||'forge', B=D.BANNERS[b], L=S.banners[b];
  const chips=D.BANNER_ORDER.map(k=>`<button class="chip ${k===b?'on':''}" data-a="hall" data-b="${k}">${D.BANNERS[k].icon} ${D.BANNERS[k].name} <small>${S.banners[k]?'Lv '+S.banners[k]:'unbuilt'}</small></button>`).join('');
  const c=bannerCost(b), a=canBuildBanner(b);
  const up = c ? `<div class="need"><span class="small">${L?'Upgrade':'Build'} to Lv ${c.lv}:</span> <span class="mchip ${S.profs.masonry.lv<c.prof?'short':''}">🧱 Masonry Lv <b>${S.profs.masonry.lv}/${c.prof}</b></span>${costHtml(c)}</div><button class="btn ${a.ok?'go':''}" data-a="buildHall" data-b="${b}" ${a.ok?'':'disabled'}>${L?'Upgrade':'Build'} ${B.name}</button>${a.ok?'':`<small class="short"> Missing: ${esc(a.why)}</small>`}` : '<span class="ok">Fully upgraded!</span>';
  let h=`<div class="chips sub">${chips}</div><div class="card banner" style="--tc:${D.TYPES[B.type].color}"><div class="bhead"><div class="bart">${B.art}</div><div><h3>${B.icon} ${B.name} <small>${L?`Lv ${L}/${D.BMAX}`:'not built yet'}</small></h3><div class="small">${esc(B.desc)} ${typeChip(B.type)} gear</div><div class="small muted">Good for: ${B.jobs}</div></div></div>`;
  if(L){ const pool=bannerPool(b), cap=bannerTierCap(b); const pity=S.pity[b]||0;
    h+=`<div class="pullbar"><div class="dia">💎 <b>${S.diamonds}</b><small>Diamonds</small></div>
      <button class="btn pullb ${S.diamonds>=D.PULL_COST?'go':''}" data-a="pull" data-b="${b}" data-n="1" ${S.diamonds>=D.PULL_COST?'':'disabled'}>Pull ×1<small>💎 ${D.PULL_COST}</small></button>
      <button class="btn pullb ${S.diamonds>=D.PULL10_COST?'go':''}" data-a="pull" data-b="${b}" data-n="10" ${S.diamonds>=D.PULL10_COST?'':'disabled'}>Pull ×10<small>💎 ${D.PULL10_COST} · Rare+ guaranteed</small></button></div>
      <div class="small">Pity: ${bar(pity, D.PITY, 'thin gold', `${pity}/${D.PITY}`)} <span class="muted">An Epic or better is guaranteed within ${D.PITY} pulls on this hall (resets when you get one).</span></div>
      <h4>Pull rates</h4>${ratesTable(b)}
      <h4>Gear in this hall <small class="muted">(tier ${cap+1} and below; newest tier is 3× as likely)</small></h4>
      <div class="pool">${pool.map(it=>{ const own=S.inv.filter(x=>x.id===it.id).length; return `<span class="pi ${it.tier===cap?'top':''}" title="${esc(it.skills.map(s=>D.SKILLS[s].name).join(', '))}">${it.icon} ${esc(it.name)} <small>${it.skills.map(s=>D.TYPES[D.SKILLS[s].type].icon).join('')}${own?` · own ${own}`:''}</small></span>`; }).join('')}</div>
      ${bannerTierCap(b)<Math.min(L,maxZoneOpen()+1)-1||L-1>maxZoneOpen()?`<p class="small muted">Higher-tier gear appears as you open new zones on the Map.</p>`:`<p class="small muted">Upgrade the hall to unlock tier ${cap+2} gear (and better rates).</p>`}`;
  } else h+=ratesTable(b);
  h+=`<div class="upbox">${up}</div></div>
    <div class="card"><h3>💎 Getting Diamonds</h3><ul class="small"><li>⛏️ <b>Mining</b> villagers dig them up slowly (Village → Overview). ${S.workers.mining?'<span class="ok">A villager is mining now.</span>':'<span class="short">Nobody is mining right now.</span>'}</li><li>👑 Bosses: 15 the first time, 3 on every rematch.</li><li>⚔️ Any battle: a rare lucky find (0.4%).</li></ul><p class="small muted">Mining also digs up Stone, Copper and gems (🔹🪙🟡) you can sell in 👥 Party → 🎒 Bag → Materials.</p></div>`;
  return h;
}
function pullAnim(res, b){
  const top=Math.max(...res.map(x=>x.r)); const B=D.BANNERS[b];
  const cards=res.map((x,i)=>{ const it=D.ITEM[x.id]; const st=scaledStats(it.stats,x.r); return `<div class="pcard r${x.r}" style="animation-delay:${1.3+i*0.18}s"><div class="pci">${it.icon}</div><div class="pcn">${esc(it.name)}</div><div class="pcr">${D.RARITY[x.r].name}</div><div class="pcs">${statLine(st)}</div><div class="pck">${it.skills.map(s=>D.TYPES[D.SKILLS[s].type].icon+' '+D.SKILLS[s].name).join('<br>')}</div>${x.isNew?'<div class="pnew">NEW</div>':''}</div>`; }).join('');
  modal(`<div class="pullfx r${top}"><div class="orb">${B.icon}</div><div class="rays"></div><div class="pcards n${res.length}">${cards}</div>
    <div class="pfoot" style="animation-delay:${1.4+res.length*0.18}s"><button class="btn go" data-a="closeModal">Nice!</button>${G.S.diamonds>=(res.length===10?D.PULL10_COST:D.PULL_COST)?`<button class="btn" data-a="pull" data-b="${b}" data-n="${res.length}">Pull ×${res.length} again (💎 ${res.length===10?D.PULL10_COST:D.PULL_COST})</button>`:''}<button class="btn sm ghost" data-a="autoEquipClose">Equip new-skill gear</button></div></div>`, 'pullmodal');
}
/* ---------------- map panel ---------------- */
function panelMap(){
  const S=G.S;
  return `<div class="card"><h3>🗺️ The road from Lanternfall</h3><p class="muted small">Win battles in a zone to draw out its boss. Beat the boss to open the next zone. You can travel back anytime to farm materials. Bosses can be re-fought every 25 wins for a shot at their relic.</p></div>` +
  D.ZONES.map((Z,i)=>{ const z=S.zones[i], un=zoneUnlocked(i), here=S.zone===i, ready=bossReady(i);
    const mats=[...new Set(Z.enemies.flatMap(e=>e.drops.map(d=>d[0])).filter(d=>D.MATS[d]))];
    const relic=D.RELICS.find(r=>r.src.boss===i);
    return `<div class="card zone ${here?'here':''} ${un?'':'locked'}" style="--g1:${Z.bg[0]};--g2:${Z.bg[1]}"><div class="zhead"><div><h3>${i+1}. ${Z.name} ${here?'<small class="ok">● you are here</small>':''}</h3><div class="small muted">Recommended Lv ${Z.lv}</div></div>
      <div class="zicons">${Z.enemies.map(e=>`<span title="${esc(e.name)}">${e.icon}</span>`).join('')}<span class="bossic" title="${esc(Z.boss.name)}">${Z.boss.icon}</span></div></div>
      ${un?`<div class="small">${esc(Z.desc)}</div>${bar(Math.min(z.wins,Z.wins),Z.wins,'thin gold',`${Math.min(z.wins,Z.wins)}/${Z.wins} wins`)}
      <div class="small">Boss: ${Z.boss.icon} <b>${Z.boss.name}</b> ${z.boss?`<span class="ok">✓ beaten ×${z.bossKills}</span>`:''}${relic?` · relic: ${relic.icon} ${relic.name} (1 in ${relic.src.odds} per boss kill)`:''}</div>
      <div class="small">Materials: ${mats.map(m=>matChip(m)).join('')}</div>
      <div class="row">${here?'':`<button class="btn sm go" data-a="zone" data-z="${i}">Travel here</button>`}${ready?`<button class="btn sm boss" data-a="bossZ" data-z="${i}">👑 Challenge ${esc(Z.boss.name)}</button>`:''}</div>`
      :`<div class="small short">🔒 Beat ${esc(D.ZONES[i-1].boss.name)} in ${esc(D.ZONES[i-1].name)} to open.</div>`}</div>`; }).join('');
}

/* ---------------- codex panel ---------------- */
function panelCodex(){
  const v=UI.codex; const subs=[['bestiary','🐾 Bestiary'],['relics','💠 Relics'],['mats','🧱 Materials'],['skills','📗 Skills'],['help','❓ How to play']];
  let h=`<div class="chips sub">${subs.map(([k,n])=>`<button class="chip ${v===k?'on':''}" data-a="cview" data-v="${k}">${n}</button>`).join('')}</div>`;
  if(v==='bestiary') h+=codexBestiary(); if(v==='relics') h+=codexRelics(); if(v==='mats') h+=codexMats(); if(v==='skills') h+=codexSkills(); if(v==='help') h+=helpHtml();
  return h;
}
function codexBestiary(){
  const S=G.S;
  return `<div class="card"><p class="muted small">Library Lv ${S.buildings.library}. Knowledge tiers need kills <i>and</i> Library level. Scholarship villagers also study monsters you've met.</p></div>` + D.ZONES.map((Z,zi)=>{ if(!zoneUnlocked(zi)) return '';
    return `<div class="card"><h3>${Z.name}</h3>${[...Z.enemies, Z.boss].map(e=>{ const k=S.bestiary[e.id]||0; if(!k) return `<div class="beast unk"><span class="bi">❔</span><span class="muted">Not met yet</span></div>`;
      const t=beastTier(e.id), tk=beastTierByKills(e.id), st=enemyStats(e,zi); const nt=D.BEAST_TIERS[t+1];
      return `<div class="beast"><span class="bi">${e.icon}</span><div><b>${e.name}</b> <small class="muted">${k} kills · tier ${t}</small>
        <div class="small">${t>=1?`HP ${st.hp} · ATK ${st.atk} · DEF ${st.def} · AGI ${st.agi}`:'Stats: ??? (10 kills + Library Lv 1)'}${t>=2?` · Weak to <b>${D.ELEMENTS[e.weak]}</b>`:' · Weakness: ???'}</div>
        <div class="small ok">${t?esc(D.BEAST_TIERS[t].label):''}</div>
        ${nt?`<div class="small muted">Next: ${Math.min(k,nt.kills)}/${nt.kills} kills${S.buildings.library<nt.lib?` · <span class="short">Library Lv ${nt.lib} needed</span>`:''}${tk>t?' (kills done — upgrade the Library!)':''}</div>`:''}</div></div>`; }).join('')}</div>`; }).join('');
}
function codexRelics(){
  const S=G.S;
  return `<div class="card"><p class="muted small">Relics are very rare. Each boss guards one (1 in N per boss kill), and any monster in that zone or later has a tiny chance too. Equip in a hero's Relic slot.</p></div>`+D.RELICS.map(r=>{ const n=S.relicsFound[r.id]||0; const Z=D.ZONES[r.src.boss];
    return `<div class="card relic ${n?'found':''}"><h3>${n?r.icon:'❔'} ${n?r.name:'Unknown relic'} ${n?`<small class="ok">found ×${n}</small>`:''}</h3>
      <div class="small">Vital skill: <b>${skillName(r.skill)}</b> — ${esc(D.SKILLS[r.skill].desc)}</div><div class="small muted">Relic bonus: ${statLine(r.stats)}</div>
      <div class="small">Where: ${Z.boss.icon} ${Z.boss.name} (${Z.name}) — 1 in ${r.src.odds} per kill · any monster from ${Z.name} onward — 1 in ${r.src.any.toLocaleString()}</div></div>`; }).join('');
}
function matUses(m){ const u=[];
  for(const b of D.BUILD_ORDER) for(let L=2;L<=D.BMAX;L++){ G.S.buildings; const x=D.BUILD_MATS[b][L-2]; if(x===m) u.push(`${D.BUILDINGS[b].icon} ${D.BUILDINGS[b].name} Lv ${L}`); }
  if(m==='stone') u.push('Every building upgrade');
  D.FOODS.forEach(f=>{ if(f.mats[m]) u.push(`${f.icon} ${f.name}`); }); D.POTIONS.forEach(p=>{ if(p.mats[m]) u.push(`${p.icon} ${p.name}`); });
  return u; }
function codexMats(){
  return `<div class="card"><p class="muted small">Every material, how many you have, where it comes from and what uses it.</p></div>`+Object.keys(D.MATS).map(m=>{ const M=D.MATS[m]; const src=matSources(m);
    return `<div class="card mat"><h3>${M.icon} ${M.name} <small>you have ${G.S.mats[m]||0}</small></h3><div class="small muted">${esc(M.desc)}</div>
      <div class="small"><b>Where to get:</b><ul>${src.map(s=>`<li>${esc(s.text)}${s.p!=null?` — ${Math.round(s.p*100)}% per kill`:''}${s.zi!=null&&!zoneUnlocked(s.zi)?' <span class="short">(zone locked)</span>':''}</li>`).join('')}</ul></div>
      <div class="small"><b>Used for:</b> ${matUses(m).join(' · ')||'—'}</div></div>`; }).join('');
}
function codexSkills(){
  const S=G.S;
  return Object.keys(D.TYPES).filter(t=>t!=='job').map(t=>`<div class="card"><h3>${typeChip(t)}</h3>${Object.entries(D.SKILLS).filter(([id,s])=>s.type===t).map(([id,s])=>{ const who=S.chars.filter(c=>c.learned[id]).map(c=>c.name); const src=skillSources(id);
    return `<div class="skl"><b>${s.name}</b> <small class="muted">${s.kind}${s.mp?` · ${s.mp} MP`:''} · ${s.ap} AP</small><div class="small">${esc(s.desc)}</div>
      <div class="small muted">Gear Halls: ${D.BANNER_ORDER.filter(b=>D.BANNERS[b].type===s.type).map(b=>D.BANNERS[b].icon+' '+D.BANNERS[b].name).join(', ')||'—'} · Gear: ${src.map(x=>x.relicDef?`${x.icon} ${x.name} (relic)`:`${x.icon} ${x.name}${x.shop===1?' (Smithy)':''}`).join(', ')}</div>${who.length?`<div class="small ok">Learned by ${who.map(esc).join(', ')}</div>`:''}</div>`; }).join('')}</div>`).join('');
}
function helpHtml(){
  return `<div class="card help"><h3>How Lanternfall plays</h3>
  <p><b>⚔️ Battles run themselves.</b> Your four heroes fight in turn order (by AGI). Numbers start tiny on purpose: 2 damage is a good hit, misses happen. Growth is slow and steady.</p>
  <p><b>💎 Gear Halls.</b> Most gear comes from pulls at five halls: Forge (martial), Chapel (holy), Arcanum (arcane), Thieves' Den (shadow) and Hunter's Lodge (wild). Pulls cost Diamonds, which Mining villagers dig up slowly (bosses give some too). Upgrading a hall raises its Rare/Epic/Legendary odds; the rates table shows exactly what you'll get. Rarer gear has bigger stats and teaches its skills faster. Duplicates fuse at the Smithy.</p>
  <p><b>🧰 Gear teaches skills.</b> Every weapon, armor, accessory and relic carries skills. Each battle won adds AP; fill the bar and the hero keeps the skill forever. Swap gear around to learn everything.</p>
  <p><b>🎖️ Jobs.</b> Learn 3 skills of one type (Martial, Holy, Arcane, Shadow, Wild) to unlock that job: Knight, Priest, Mage, Thief or Ranger. Jobs earn JP for a skill tree. Advanced jobs (Paladin, Spellblade, Druid, Assassin, Warlock) need 4 + 3 skills of two types and a mentor at the Guild Hall.</p>
  <p><b>🧬 Races</b> unlock new traits at certain levels (shown in Party → Race).</p>
  <p><b>🗺️ Zones & bosses.</b> Win battles to draw out a zone's boss; beat it to open the next zone.</p>
  <p><b>💀 Falling is fine.</b> If everyone is knocked out, villagers carry you home and heal you. Nothing is lost; auto-battle just pauses until you press ▶.</p>
  <p><b>🏘️ The village</b> grows while you fight. Assign villagers to professions. Profession levels + gold + materials upgrade buildings: Smithy (gear), Tavern (meals), Apothecary (potions, elixirs), Library (bestiary: weaker monsters) and Guild Hall (mentors, advanced jobs).</p>
  <p><b>💠 Relics</b> are very rare boss treasures with powerful vital skills.</p>
  <p><b>🌙 Offline:</b> up to 8 hours. Villagers work at full speed, and your party fights at half pace while you're away.</p>
  <p class="muted small">Tap any material chip (with a ?) to see where it comes from.</p></div>`;
}

/* ---------------- party creation ---------------- */
const NAMES=['Aric','Lyra','Bram','Pip','Kara','Thorne','Mira','Gus','Vex','Rowan','Nell','Orrin','Tamsin','Fen','Ivo','Juno'];
let CREATE=[{name:'Aric',race:'human'},{name:'Lyra',race:'elf'},{name:'Bram',race:'dwarf'},{name:'Pip',race:'halfling'}];
function renderCreate(){
  $('#battleCol').innerHTML=''; $('#tabs').innerHTML=''; $('#mini').innerHTML='';
  $('#panel').innerHTML = `<div class="create"><div class="ctitle"><div class="big">🏮</div><h1>Lanternfall</h1><p>Four heroes leave the village of Lanternfall with nothing but a club and a cloth tunic. Choose their names and races.</p></div>
    <div class="cgrid">${CREATE.map((x,i)=>{ const r=D.RACES[x.race]; return `<div class="card cslot"><div class="row"><span class="cnum">${i+1}</span><input id="cn${i}" maxlength="12" value="${esc(x.name)}" aria-label="Hero ${i+1} name" data-i="${i}"><button class="btn sm ghost" data-a="rname" data-i="${i}" title="Random name">🎲</button></div>
      <div class="races">${D.RACE_ORDER.map(k=>`<button class="race ${x.race===k?'on':''}" data-a="crace" data-i="${i}" data-r="${k}"><b>${D.RACES[k].icon}</b><span>${D.RACES[k].name}</span></button>`).join('')}</div>
      <div class="small"><b>${r.icon} ${r.name}:</b> ${esc(r.desc)}</div>
      <div class="small muted">Start: ${Object.entries(r.base).map(([k,v])=>`${D.STAT_NAMES[k]} ${v}`).join(' · ')}</div>
      <div class="small">Traits: ${r.traits.map(t=>`<span class="tr">Lv ${t.lv} ${t.name}</span>`).join(' ')}</div></div>`; }).join('')}</div>
    <div class="cgo"><button class="btn go big" data-a="begin">Begin the adventure ▶</button><button class="lnk" data-a="importOpen">Import a save</button></div></div>`;
}

/* ---------------- main render ---------------- */
function renderPanel(force){
  const S=G.S; const el=$('#panel');
  if(!S.started){ return; }
  const fns={party:panelParty, village:panelVillage, map:panelMap, codex:panelCodex};
  const tab = UI.wide && UI.tab==='battle' ? 'party' : UI.tab;
  if(tab==='battle'){ el.innerHTML=''; return; }
  const sc=el.scrollTop, wsc=window.scrollY;
  const html=guard(tab, ()=>fns[tab](), el); if(html) el.innerHTML=html;
  el.scrollTop=sc; if(Math.abs(window.scrollY-wsc)>2) window.scrollTo(0,wsc);
  UI.lastPanel=Date.now();
}
function layout(){
  const w=window.innerWidth>=1000; if(w!==UI.wide){ UI.wide=w; if(w&&UI.tab==='battle') UI.tab='party'; }
  document.body.classList.toggle('wide', UI.wide);
  document.body.dataset.tab = UI.tab; document.body.classList.toggle('started', !!G.S.started);
}
function renderAll(){
  layout();
  const S=G.S;
  if(!S.started){ renderTop(); renderHint(); if(!$('.create')) renderCreate(); return; }
  if($('.create')) $('#panel').innerHTML='';
  guard('top', renderTop); guard('hint', renderHint); guard('tabs', renderTabs);
  if(UI.wide || UI.tab==='battle'){ $('#battleCol').style.display=''; guard('battle', renderBattle, $('#battleCol')); } else { $('#battleCol').style.display='none'; G.ev.length=0; }
  guard('mini', renderMini);
  renderPanel();
}

/* ---------------- actions ---------------- */
const A = {
  tab(d){ UI.tab=d.t; window.scrollTo(0,0); $('#panel').scrollTop=0; },
  sel(d){ UI.sel=+d.i; if(UI.partyView==='bag') UI.partyView='hero'; },
  pview(d){ UI.partyView=d.v; }, bagv(d){ UI.bag=d.v; }, vview(d){ UI.village=d.v; if(UI.tab!=='village') UI.tab='village'; }, cview(d){ UI.codex=d.v; },
  gobag(){ UI.tab='party'; UI.partyView='bag'; UI.bag='gear'; }, gocodex(d){ UI.tab='codex'; UI.codex=d.v; },
  openChar(d){ UI.sel=+d.i; UI.tab='party'; if(UI.partyView==='bag') UI.partyView='hero'; },
  auto(){ const S=G.S; if(S.wiped){ resume(); return; } S.auto=!S.auto; },
  speed(){ G.S.settings.speed = G.S.settings.speed===1?2:1; },
  boss(){ challengeBoss(G.S.zone); },
  bossZ(d){ challengeBoss(+d.z); UI.tab=UI.wide?UI.tab:'battle'; },
  zone(d){ const S=G.S; setZone(+d.z); if(S.wiped) resume(); S.auto=true; if(!UI.wide) UI.tab='battle'; },
  tactic(d){ G.S.chars[UI.sel].tactic=d.t; },
  pickSlot(d){ const ci=UI.sel, c=G.S.chars[ci], slot=d.s; const S=G.S;
    const list=S.inv.filter(u=>defOf(u).slot===slot).sort((a,b)=>((defOf(b).tier||0)-(defOf(a).tier||0))||((b.r||0)-(a.r||0)));
    modal(`<h2>${D.SLOT_NAMES[slot]} for ${esc(c.name)}</h2>${list.length?`<div class="ilist">${list.map(u=>{ const it=defOf(u), w=equippedBy(u.uid); const nw=it.skills.filter(s=>!c.learned[s]);
      return `<button class="pick ${c.equip[slot]===u.uid?'on':''}" data-a="equip" data-u="${u.uid}"><b>${rname(u,it)}</b> <small>${statLine(it.stats)}</small><div class="small">${it.skills.map(s=>`<span class="${c.learned[s]?'ok':'sk'}">${skillName(s)}${c.learned[s]?' ✓':` ${c.ap[s]||0}/${D.SKILLS[s].ap}`}</span>`).join(' ')}</div>${w>=0?`<small class="muted">worn by ${esc(S.chars[w].name)}${w!==ci?' (will swap)':''}</small>`:''}${nw.length?`<small class="new">${nw.length} new skill${nw.length>1?'s':''} to learn</small>`:''}</button>`; }).join('')}</div>`:`<p class="muted">You have no ${D.SLOT_NAMES[slot].toLowerCase()} in your bag. ${slot==='relic'?'Relics drop very rarely from bosses (see Codex → Relics).':'Pull for gear at a Gear Hall (Village → 💎 Gear Halls), buy basics at the Smithy, or find some in battle.'}</p>`}`); },
  equip(d){ equip(UI.sel, +d.u); closeModal(); },
  unequip(d){ unequip(UI.sel, d.s); },
  setJob(d){ setJob(UI.sel, d.j||null); },
  node(d){ const c=G.S.chars[UI.sel]; buyNode(UI.sel, c.job, d.n); },
  lesson(){ if(!mentorLesson(UI.sel)) G.toast('Not enough gold.'); },
  worker(d){ if(!toggleWorker(d.p)) G.toast('No free villagers. Raise the village level to get more.'); },
  build(d){ build(d.b); },
  buy(d){ if(buyItem(d.id)) G.toast(`Bought ${D.ITEM[d.id].icon} ${D.ITEM[d.id].name}. Equip it in Party → Gear.`,'good'); },
  hall(d){ UI.banner=d.b; UI.village='gacha'; if(UI.tab!=='village') UI.tab='village'; },
  buildHall(d){ buildBanner(d.b); },
  pull(d){ const r=pull(d.b, +d.n); if(!r){ G.toast('Not enough 💎 Diamonds. Put a villager on Mining.'); return; } save(); pullAnim(r, d.b); },
  autoEquipClose(){ closeModal(); A.autoEquip(); },
  fuse(d){ const nu=fuse(d.id, +d.r); if(nu) G.toast(`⚒️ Fused into ${D.RARITY[nu.r].name} ${D.ITEM[d.id].name}!`,'good'); },
  sellGems(){ const g=sellMats(); G.toast(`Sold gems for ${g} gold.`,'good'); },
  sell(d){ const g=sellItem(+d.u); if(g) G.toast(`Sold for ${g} gold.`); },
  autoEquip(){ const n=autoEquipLearn(); G.toast(n?`Equipped ${n} item${n>1?'s':''} with new skills.`:'No spare gear with new skills. Visit the Smithy or keep fighting for drops.'); },
  sellMastered(){ const r=bulkSellMastered(); G.toast(`Sold ${r.n} mastered items for ${r.g} gold.`,'good'); },
  food(d){ if(buyFood(d.id)) G.toast(`${D.FOOD[d.id].icon} The party eats ${D.FOOD[d.id].name}!`,'good'); },
  pot(d){ const n=buyPotion(d.id, +d.n); if(n) G.toast(`${D.POTION[d.id].icon} ${D.POTION[d.id].elixir?'Elixir active!':'Bought '+n+' '+D.POTION[d.id].name}`,'good'); },
  matInfo(d){ const m=d.m, M=D.MATS[m]; const src=matSources(m);
    modal(`<h2>${M.icon} ${M.name}</h2><p>You have <b>${G.S.mats[m]||0}</b>.</p><p class="muted">${esc(M.desc)}</p><h3>Where to get it</h3><ul>${src.map(s=>`<li>${esc(s.text)}${s.p!=null?` — ${Math.round(s.p*100)}% per kill`:''}${s.zi!=null&&!zoneUnlocked(s.zi)?' <span class="short">(zone locked)</span>':s.zi!=null&&G.S.zone!==s.zi?` <button class="btn sm" data-a="zone" data-z="${s.zi}">Go there</button>`:''}</li>`).join('')}</ul><h3>Used for</h3><p>${matUses(m).join(' · ')||'—'}</p>`); },
  itemInfo(d){ const u=invItem(+d.u); if(!u) return; const it=defOf(u); const src=u.relic?[{text:`${D.ZONES[it.src.boss].boss.name} (1 in ${it.src.odds})`}]:itemSources(it.id);
    modal(`<h2>${rname(u,it)}</h2><p>${D.SLOT_NAMES[it.slot]} · ${statLine(it.stats)}${!u.relic&&u.r?` · ${D.RARITY[u.r].name}: stats ×${D.RARITY[u.r].mult}${D.RARITY[u.r].ap?`, +${D.RARITY[u.r].ap} AP per win`:''}`:''}</p><h3>Skills</h3>${it.skills.map(s=>`<p><b>${skillName(s)}</b> (${D.SKILLS[s].ap} AP): ${esc(D.SKILLS[s].desc)}<br><small class="muted">Learned by: ${G.S.chars.filter(c=>c.learned[s]).map(c=>esc(c.name)).join(', ')||'nobody yet'}</small></p>`).join('')}<h3>Where it comes from</h3><ul>${src.map(s=>`<li>${esc(s.text)}${s.p!=null?` — ${(s.p*100).toFixed(1)}% per kill`:''}</li>`).join('')}</ul>`); },
  rename(d){ const c=G.S.chars[+d.i]; const n=prompt('New name', c.name); if(n&&n.trim()) c.name=n.trim().slice(0,12); },
  closeModal(){ closeModal(); },
  tutSkip(){ G.S.flags.tutDone=1; },
  help(){ modal(helpHtml()); },
  settings(){ const S=G.S, s=S.settings; const tg=(k,n,desc)=>`<label class="tg"><input type="checkbox" data-set="${k}" ${s[k]?'checked':''}> <span><b>${n}</b><br><small class="muted">${desc}</small></span></label>`;
    modal(`<h2>⚙️ Settings</h2>${tg('usePots','Use potions automatically','Potions below 35% HP, Ethers when a caster runs dry, Phoenix Downs on fallen allies.')}${tg('autoRest','Rest at camp when hurt','After a battle, rest a few seconds to full HP when the party is low.')}${tg('autoBoss','Auto-challenge bosses','Fight the boss as soon as it appears (off = you choose when).')}
      <p>Battle speed: <button class="btn sm" data-a="speed">${s.speed}×</button></p>
      <h3>Save</h3><p class="muted small">Saves automatically every few seconds on this device.</p><div class="row"><button class="btn sm" data-a="exportSave">Export save</button><button class="btn sm" data-a="importOpen">Import save</button><button class="btn sm danger" data-a="resetAsk">Hard reset</button></div>
      <p class="muted small">Lanternfall v${UI.version} · played ${fmtTime(S.stats.play)} · ${S.stats.wins} wins · ${S.stats.losses} falls</p>`); },
  exportSave(){ const s=exportSave(); modal(`<h2>Export save</h2><p class="muted small">Copy this text and keep it somewhere safe.</p><textarea id="exp" readonly>${s}</textarea><div class="row"><button class="btn sm go" data-a="copyExp">Copy</button></div>`); setTimeout(()=>{ const t=$('#exp'); if(t){ t.focus(); t.select(); } },50); },
  copyExp(){ const t=$('#exp'); t.select(); try{ navigator.clipboard.writeText(t.value).then(()=>G.toast('Copied!')); }catch(e){ document.execCommand('copy'); G.toast('Copied!'); } },
  importOpen(){ modal(`<h2>Import save</h2><p class="muted small">Paste a save exported from Lanternfall. This replaces your current game.</p><textarea id="imp" placeholder="Paste save here"></textarea><div class="row"><button class="btn sm go" data-a="importDo">Import</button></div><p id="imperr" class="short"></p>`); },
  importDo(){ try{ importSave($('#imp').value); closeModal(); G.toast('Save imported!','good'); UI.battleKey=null; }catch(e){ $('#imperr').textContent=e.message; } },
  resetAsk(){ modal(`<h2>Hard reset?</h2><p>This deletes your party, village and everything else. It can't be undone. Export your save first if you might want it back.</p><div class="row"><button class="btn danger" data-a="resetDo">Yes, delete everything</button><button class="btn" data-a="closeModal">Cancel</button></div>`); },
  resetDo(){ hardReset(); closeModal(); UI.tab='battle'; UI.battleKey=null; $('#battleCol').innerHTML=''; save(); },
  crace(d){ syncNames(); CREATE[+d.i].race=d.r; renderCreate(); },
  rname(d){ syncNames(); CREATE[+d.i].name=pick(NAMES.filter(n=>!CREATE.some(x=>x.name===n))); renderCreate(); },
  begin(){ syncNames(); createParty(CREATE); UI.tab=UI.wide?'party':'battle'; save(); $('#panel').innerHTML=''; },
};
function syncNames(){ CREATE.forEach((x,i)=>{ const el=$('#cn'+i); if(el) x.name=el.value.trim()||x.name; }); }

document.addEventListener('click', e=>{
  const t=e.target.closest('[data-a]'); if(!t || t.disabled) return;
  if(t.id==='modal') return;
  const a=t.dataset.a; if(!A[a]) return;
  e.preventDefault();
  try{ A[a](t.dataset); }catch(err){ console.error(err); G.toast('Oops: '+err.message); }
  save(); renderAll();
});
document.addEventListener('change', e=>{ const k=e.target.dataset&&e.target.dataset.set; if(k){ G.S.settings[k]=e.target.checked; save(); } });
$('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });
document.addEventListener('pointerdown', ()=>{ UI.pointer=true; }, {passive:true});
document.addEventListener('pointerup', ()=>{ setTimeout(()=>UI.pointer=false, 250); }, {passive:true});
document.addEventListener('pointercancel', ()=>{ UI.pointer=false; }, {passive:true});
window.addEventListener('resize', ()=>{ UI.battleKey=null; renderAll(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

/* ---------------- loop ---------------- */
let lastT=Date.now(), lastSave=Date.now(), lastBattleDraw=0;
function welcomeBack(sum){
  if(!sum || sum.sec<60) return;
  const mats=Object.entries(sum.mats).map(([m,n])=>`${D.MATS[m].icon} ${n}`).join(' ');
  modal(`<h2>🌙 Welcome back!</h2><p class="muted">You were away ${fmtTime(sum.sec)}${sum.sec>=OFFLINE_CAP?' (8h max)':''}.</p>
    <ul class="wb"><li>⚔️ ${sum.wins} battles won${sum.wiped?' — then the party fell and is resting at the village (press ▶ to continue)':''}</li><li>🪙 +${sum.gold} gold · ✨ +${sum.xp} XP each</li>${sum.diamonds?`<li>💎 +${sum.diamonds} Diamonds</li>`:''}
    ${sum.levels?`<li>⬆️ ${sum.levels} level-ups</li>`:''}${sum.learned.length?`<li>🎉 Learned: ${sum.learned.map(esc).join(', ')}</li>`:''}${sum.items.length?`<li>🎁 Found: ${sum.items.map(esc).join(', ')}</li>`:''}
    ${sum.profUps?`<li>🏘️ ${sum.profUps} profession level-ups</li>`:''}${mats?`<li>🧱 Materials: ${mats}</li>`:''}</ul><button class="btn go" data-a="closeModal">Continue</button>`);
}
function loop(){
  const now=Date.now(); let dt=now-lastT; lastT=now;
  try{
    if(dt>15000){ const sum=offline(dt/1000); welcomeBack(sum); UI.battleKey=null; }
    else tick(dt);
  }catch(e){ console.error('tick', e); }
  if(now-lastSave>5000){ save(); lastSave=now; }
  // battle area redraws every frame-ish; panel every ~1.2s unless the user is touching it
  if(G.S.started){ if(UI.wide||UI.tab==='battle'){ if(now-lastBattleDraw>150){ guard('battle', renderBattle, $('#battleCol')); lastBattleDraw=now; } } else { G.ev.length=0; guard('mini', renderMini); }
    guard('top', renderTop);
    if(now-UI.lastPanel>1200 && !UI.pointer && !UI.modalOpen && !(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))){ guard('tabs', renderTabs); guard('hint', renderHint); renderPanel(); } }
}
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) save(); else { loop(); } });
window.addEventListener('pagehide', save);

/* test-only fast-forward (used by the headless test; not exposed in the UI) */
window.__debug = {
  battles(n){ const q=G.quiet; G.quiet=true; try{ for(let b=0;b<n && !G.S.wiped;b++){ let g=0; if(!G.S.battle) startBattle(false); while(G.S.battle && g++<400) step(); if(G.S.rest>0) finishRest(); } } finally{ G.quiet=q; } save(); renderAll(); },
  profs(sec){ tickProfs(sec); save(); renderAll(); },
  away(sec){ save(); G.S.last=Date.now()-sec*1000; localStorage.setItem(SAVE_KEY, JSON.stringify(G.S)); G.noSave=true; },
};

load();
if(G.S.started){ const away=(Date.now()-(G.S.last||Date.now()))/1000; if(away>60){ const sum=offline(away); setTimeout(()=>welcomeBack(sum), 300); } }
G.S.battle=null; // a reload starts a fresh fight
renderAll();
setInterval(loop, 100);
