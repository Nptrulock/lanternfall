'use strict';
/* Lanternfall v2 — UI (phone-first). Town map, world map, expedition battles, party, codex. */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UI = {tab:'town', place:null, placeTab:null, sel:0, heroTab:'overview', codex:'bestiary', mapSel:0, node:null, jobView:null, open:{}, pointer:false, lastPanel:0, modalOpen:false, battleKey:null, gearSlot:null, shopSel:null, shopMode:'buy', version:'2.0'};
window.__G = G; window.__D = D; window.__UI = UI;

/* ---------------- helpers ---------------- */
const setHTML = (el, h) => { if(el && el._h!==h){ el._h=h; el.innerHTML=h; } };
const pct = (a,b) => b>0 ? Math.max(0,Math.min(100,a/b*100)) : 0;
const bar = (v,max,cls,label) => `<div class="bar ${cls||''}"><i style="width:${pct(v,max)}%"></i>${label!=null?`<span>${label}</span>`:''}</div>`;
const statLine = st => Object.entries(st||{}).map(([k,v])=>`${v>0?'+':''}${v} ${D.STAT_NAMES[k]}`).join(', ');
const typeChip = t => `<span class="tchip" style="--tc:${D.TYPES[t].color}">${D.TYPES[t].icon} ${D.TYPES[t].name}</span>`;
const matChip = (m, need) => { const have=G.S.mats[m]||0; const short=need!=null&&have<need;
  return `<button class="mchip ${short?'short':''}" data-a="matInfo" data-m="${m}" title="Where to get">${D.MATS[m].icon} ${D.MATS[m].name} <b>${need!=null?`${have}/${need}`:have}</b> <em>?</em></button>`; };
const goldChip = need => `<span class="mchip ${G.S.gold<need?'short':''}">🪙 <b>${G.S.gold.toLocaleString()}/${need.toLocaleString()}</b></span>`;
const rname = (u, it) => { it=it||defOf(u); const r=u.relic?4:(u.r||0); return `<span class="rn r${r}">${it.icon} ${esc(it.name)}${r&&!u.relic?` <small>${D.RARITY[r].name}</small>`:''}</span>`; };
const skillName = id => { const s=D.SKILLS[id]; return `${D.TYPES[s.type].icon} ${s.name}`; };
const portrait = (c, ci) => { const same=G.S.chars.slice(0,ci).filter(x=>x.race===c.race).length; return `<img class="pt ${same%2?'flip':''}" src="art/race_${c.race}.webp" alt="${esc(c.name)}">`; };
const enemyImg = id => `art/e_${id}.webp`;
const stars = (L, max) => `<span class="stars">${'★'.repeat(Math.min(L,max||8))}${'☆'.repeat(Math.max(0,(max||8)-L))}</span>`;
const costHtml = c => `${c.gold?goldChip(c.gold):''}${Object.entries(c.mats).map(([m,n])=>matChip(m,n)).join('')}${c.prof?`<span class="mchip ${G.S.profs[c.prof].lv<c.profLv?'short':''}">${D.PROFS[c.prof].icon} ${D.PROFS[c.prof].name} <b>Lv ${G.S.profs[c.prof].lv}/${c.profLv}</b></span>`:''}`;
const actName = a => a==='rest'?'😴 Resting (stamina ×2)':a==='train'?'🎯 Training Endurance':a.startsWith('m:')?`🎓 Studying with ${D.MENTOR[a.slice(2)].name}`:a;
function guard(name, fn, el){ try{ return fn(); }catch(e){ console.error(name, e); if(el) el.innerHTML=`<div class="err parch">⚠️ Something went wrong drawing this page (${esc(name)}). The game is still running.<br><small>${esc(e.message)}</small><br><button class="btn" data-a="tab" data-t="town">Back to town</button></div>`; } }
const H2 = (t, sub) => `<h2 class="h2">${t}${sub?`<small>${sub}</small>`:''}</h2>`;

/* ---------------- toasts & modal ---------------- */
G.toast = (msg, kind) => { const t=document.createElement('div'); t.className='toast '+(kind||''); t.textContent=msg; $('#toasts').appendChild(t); setTimeout(()=>t.classList.add('out'), 3600); setTimeout(()=>t.remove(), 4200); while($('#toasts').children.length>4) $('#toasts').firstChild.remove(); };
function modal(html, cls){ const m=$('#modal'); m.className=cls||''; m.innerHTML=`<div class="mbox parch" role="dialog">${html}<button class="mclose" data-a="closeModal" aria-label="Close">✕</button></div>`; UI.modalOpen=true; }
function closeModal(){ $('#modal').className='hidden'; $('#modal').innerHTML=''; UI.modalOpen=false; }

/* ---------------- header / hint / nav ---------------- */
function renderTop(){
  const S=G.S; if(!S.started){ setHTML($('#res'), ''); return; }
  const loc = S.loc==='exp' ? `<span class="loc exp" data-a="tab" data-t="camp">⚔️ ${esc(D.ZONES[S.zone].name)}</span>` : `<span class="loc">🏘️ Lanternfall</span>`;
  setHTML($('#res'), `${loc}<span class="pill" title="Gold — earned by fighting">🪙 ${S.gold.toLocaleString()}</span><span class="pill dia" title="Diamonds — pull gear at the halls">💎 ${S.diamonds}</span>`);
}
function renderHint(){
  const S=G.S; const el=$('#hint');
  if(!S.started || S.flags.tutDone){ el.style.display='none'; return; }
  const i=D.TUTORIAL.findIndex(t=>!t.done(S));
  if(i<0){ S.flags.tutDone=1; el.style.display='none'; return; }
  el.style.display='';
  setHTML(el, `<span class="hn">Guide ${i+1}/${D.TUTORIAL.length}</span> ${esc(D.TUTORIAL[i].text)} <button class="lnk" data-a="tutSkip">hide</button>`);
}
const NAV = [['town','🏘️','Town'],['map','🗺️','Map'],['camp','🔥','Camp'],['party','👥','Party'],['codex','📖','Codex']];
function navAlert(t){ const S=G.S;
  if(t==='town') return workersUsed()<workerSlots() || S.diamonds>=D.PULL_COST;
  if(t==='party') return S.chars.some(c=>(!c.job && D.JOB_ORDER.some(j=>jobUnlocked(c,j))) || (c.job && D.JOBS[c.job].nodes.some(n=>nodeAvailable(c,c.job,n).ok)));
  if(t==='map') return S.loc==='town' && D.ZONES.some((z,i)=>zoneOpen(i)&&bossReady(i)&&!S.zones[i].boss);
  if(t==='camp') return S.loc==='town' && canDepart().ok;
  return false; }
function renderNav(){
  const S=G.S; if(!S.started){ setHTML($('#nav'),''); return; }
  setHTML($('#nav'), NAV.map(([t,ic,l])=>{ const fire=t==='camp'; const lab = fire ? (S.loc==='exp'?'Battle':'Set out') : l;
    return `<button class="nb ${fire?'fire':''} ${UI.tab===t?'on':''} ${fire&&S.loc==='exp'?'burning':''}" data-a="tab" data-t="${t}"><span class="ni">${ic}</span><span class="nl">${lab}</span>${navAlert(t)?'<i class="dot"></i>':''}</button>`; }).join(''));
}

/* ---------------- party creation ---------------- */
const NAMES=['Aric','Lyra','Bram','Pip','Kara','Thorne','Mira','Gus','Vex','Rowan','Nell','Orrin','Tamsin','Fen','Ivo','Sable'];
let CREATE=[{name:'Aric',race:'human'},{name:'Lyra',race:'elf'},{name:'Bram',race:'dwarf'}];
function renderCreate(){
  const v=$('#view');
  v.innerHTML = `<div class="create">
    <div class="ctitle parch"><h1>Lanternfall</h1><p>Three companions arrive at a quiet village on the edge of the map. Name them and choose their kin. Each race grows its own traits as it levels.</p></div>
    ${CREATE.map((x,i)=>`<div class="cslot parch"><div class="cprev">${`<img class="pt" src="art/race_${x.race}.webp" alt="">`}</div>
      <div class="cbody"><label class="cnum">Companion ${i+1}</label><div class="crow"><input id="cn${i}" maxlength="12" value="${esc(x.name)}" aria-label="Name ${i+1}"><button class="btn sm" data-a="rname" data-i="${i}">🎲</button></div>
      <div class="races">${D.RACE_ORDER.map(r=>`<button class="race ${x.race===r?'on':''}" data-a="crace" data-i="${i}" data-r="${r}"><img src="art/race_${r}.webp" alt=""><span>${D.RACES[r].name}</span></button>`).join('')}</div>
      <p class="small">${esc(D.RACES[x.race].desc)}</p>
      <div class="tr">${D.RACES[x.race].traits.map(t=>`<span class="chip" title="${esc(t.desc)}">Lv ${t.lv} · ${esc(t.name)}</span>`).join('')}</div></div></div>`).join('')}
    <button class="btn go big cgo" data-a="begin">Arrive in Lanternfall</button>
    <p class="small center muted">Your save lives in this browser. Copy your save code any time from 💾 Save.</p>
    <p class="center"><button class="lnk dark" data-a="importOpen">Already playing elsewhere? Paste a save code</button></p></div>`;
}

/* ---------------- TOWN ---------------- */
function placeLevel(p){ const P=D.PLACES[p]; return D.BUILD[p]? G.S.buildings[p] : 1; }
function placeAlert(p){ const S=G.S, P=D.PLACES[p];
  if(p==='hall') return workersUsed()<workerSlots() || (hireCost()!=null && S.gold>=hireCost());
  if(P.kind==='banner') return S.buildings[p]>0 && S.diamonds>=D.PULL_COST;
  return false; }
function viewTown(){
  if(UI.place) return viewPlace(UI.place);
  const S=G.S;
  const pins = D.PLACE_ORDER.map(p=>{ const P=D.PLACES[p], L=placeLevel(p), built=L>0;
    return `<button class="pin ${built?'':'unbuilt'} ${placeAlert(p)?'alert':''}" style="left:${P.x}%;top:${P.y}%" data-a="place" data-p="${p}">
      <span class="pm">${built?P.icon:'🔨'}</span><span class="plab">${esc(P.name)}${D.BUILD[p]&&built?` <b>${L}</b>`:''}</span></button>`; }).join('');
  const party = S.chars.map((c,ci)=>`<button class="tp" data-a="hero" data-i="${ci}">${portrait(c,ci)}<span class="tpn">${esc(c.name)} <small>Lv ${c.lv}</small></span>
      ${bar(c.stam, maxStam(c), 'stam', `${Math.floor(c.stam)}/${maxStam(c)}`)}<span class="tpa">${S.loc==='exp'?'⚔️ On expedition':actName(c.act).split(' (')[0]}</span></button>`).join('');
  return `<div class="townwrap"><div class="townmap"><img src="art/town_map.webp" alt="The town of Lanternfall" draggable="false">${pins}
      <div class="mapcap">Lanternfall</div></div>
    <div class="wood panel"><div class="ph"><h3>Your party</h3><span class="small">${S.loc==='exp'?`out in ${esc(D.ZONES[S.zone].name)}`:'in town'}</span></div><div class="tparty">${party}</div>
      ${S.loc==='town' ? `<div class="row gap"><button class="btn go grow" data-a="tab" data-t="camp">🔥 Prepare to set out</button><button class="btn" data-a="place" data-p="hall">🏛️ Workers ${workersUsed()}/${workerSlots()}</button></div>`
        : `<div class="row gap"><button class="btn go grow" data-a="tab" data-t="camp">⚔️ Watch the battle</button></div>`}</div></div>`;
}
function placeHeader(p, tabs){ const P=D.PLACES[p], L=placeLevel(p);
  return `<div class="phead wood"><button class="back" data-a="place" data-p="">‹ Town</button><div class="pt-title"><span>${P.icon}</span><div><h2>${esc(P.name)}</h2>${D.BUILD[p]?`<div class="lvl">${L?`Level ${L} ${stars(L)}`:'Not built yet'}</div>`:''}</div></div></div>
    ${tabs&&tabs.length>1?`<div class="subtabs">${tabs.map(([k,l])=>`<button class="st ${UI.placeTab===k?'on':''}" data-a="ptab" data-k="${k}">${l}</button>`).join('')}</div>`:''}`; }
function upgradeCard(p){ const L=G.S.buildings[p], c=buildCost(p); const ok=canBuild(p); const P=D.PLACES[p];
  const what = D.BUILD[p].banner ? 'Each level improves pull rates and unlocks gear from one zone further (up to the farthest zone you have reached).' : D.BUILD[p].unlock;
  return `<div class="parch card"><h3>${L?`Upgrade to Lv ${c?c.lv:L}`:`Build the ${esc(P.name)}`}</h3><p class="small">${esc(what)}</p>
    ${c?`<div class="chips">${costHtml(c)}</div><button class="btn go" data-a="build" data-b="${p}" ${ok.ok?'':'disabled'}>${L?'Upgrade':'Build'}</button>${ok.ok?'':`<p class="small short">Missing: ${esc(ok.why)}</p>`}`:'<p class="ok">Fully upgraded.</p>'}</div>`; }
function viewPlace(p){
  const P=D.PLACES[p], S=G.S;
  const kind=P.kind; let tabs=[]; let body='';
  const L=placeLevel(p);
  if(kind==='banner'){ tabs=[['pull','💎 Pull'],['mentors','🎓 Mentors'],['up','🏗️ Upgrade']]; if(p==='forge') tabs.splice(2,0,['fuse','⚒️ Fuse']); }
  else if(kind==='training') tabs=[['train','🎯 Endurance'],['mentors','🎓 Mentors'],['up','🏗️ Upgrade']];
  else if(kind==='market') tabs=[['buy','Buy'],['sell','Sell'],['up','🏗️ Upgrade']];
  else if(kind==='tavern'||kind==='library') tabs=[['main',kind==='tavern'?'🍲 Meals':'📚 Studies'],['up','🏗️ Upgrade']];
  if(!tabs.find(t=>t[0]===UI.placeTab)) UI.placeTab=tabs.length?tabs[0][0]:null;
  if(D.BUILD[p] && L<1 && UI.placeTab!=='mentors') UI.placeTab='up';
  const t=UI.placeTab;
  if(t==='up') body=upgradeCard(p);
  else if(t==='mentors') body=placeMentors(p);
  else if(kind==='hall') body=placeHall();
  else if(kind==='mine') body=placeMine();
  else if(kind==='banner') body = t==='fuse'?placeFuse():placeBanner(p);
  else if(kind==='training') body=placeTraining();
  else if(kind==='market') body=placeMarket(t);
  else if(kind==='tavern') body=placeTavern();
  else if(kind==='library') body=placeLibrary();
  return `<div class="place pl-${p}">${placeHeader(p, tabs)}<p class="pdesc">${esc(P.desc)}</p>${body}</div>`;
}
function profRow(p){ const S=G.S, pr=S.profs[p], P=D.PROFS[p]; const need=profNeed(pr.lv); const w=S.workers[p]||0;
  return `<div class="skrow"><div class="tile">${P.icon}</div><div class="skb"><div class="skt"><b>${P.name}</b> <span class="lv">Lv ${pr.lv}</span><span class="wk">${'🧑‍🌾'.repeat(w)||'<i>no worker</i>'}</span></div>
    ${bar(pr.xp, need, 'xp', `${fmtTime(Math.max(0,(need-pr.xp)/Math.max(1,w)))} to Lv ${pr.lv+1}${w?'':' (needs a worker)'} · ${Math.floor(pct(pr.xp,need))}%`)}
    <div class="small">${esc(P.desc)}</div><div class="small out">${esc(profPerkText(p))}</div></div>
    <div class="wbtn"><button class="btn sm" data-a="work" data-p="${p}" data-d="1" ${workersUsed()>=workerSlots()?'disabled':''}>＋</button><button class="btn sm" data-a="work" data-p="${p}" data-d="-1" ${w?'':'disabled'}>－</button></div></div>`; }
function placeHall(){ const S=G.S; const hc=hireCost();
  return `<div class="parch card"><h3>Workers ${workersUsed()}/${workerSlots()}</h3><p class="small">Town work is where items come from: materials, gems, meals, Common gear and 💎. Fighting earns the gold to hire more hands.</p>
    ${hc!=null?`<div class="row gap"><button class="btn go" data-a="hire" ${S.gold>=hc?'':'disabled'}>Hire ${esc(D.WORKER_NAMES[S.hired]||'a worker')} — 🪙 ${hc.toLocaleString()}</button>${S.gold<hc?`<span class="small short">Need ${hc-S.gold} more gold. Fight more!</span>`:''}</div>`:'<p class="ok">Every house in town is working.</p>'}</div>
    <div class="parch card"><h3>Professions</h3><div class="sklist">${D.PROF_ORDER.map(profRow).join('')}</div></div>`; }
function placeMine(){ const S=G.S;
  return `<div class="parch card"><h3>💎 Diamonds: ${S.diamonds}</h3><p class="small">Only the mine digs up Diamonds, and slowly: one dig at a time. They also come from a boss's first defeat (+10) and from bestiary milestones. Spend them in the gear halls.</p>
    <div class="sklist">${profRow('mining')}</div></div><div class="parch card"><h3>Gems for sale</h3><div class="chips">${Object.keys(D.MATS).filter(m=>D.MATS[m].gem).map(m=>matChip(m)).join('')}</div><button class="btn" data-a="sellGems">Sell gems at the Market</button></div>`; }
function mentorCard(m){ const S=G.S; const avail=mentorAvailable(m.id); const j=D.JOBS[m.job];
  const rows=S.chars.map((c,ci)=>{ const st=c.mentors[m.id]||{rank:0,xp:0}; const here=c.act==='m:'+m.id; const r=st.rank, need=mentorNeed(r);
    const plus=D.MENTOR_PLUS(r), minus=D.MENTOR_MINUS(r); const k=v=>m.plus==='hp'?v*3:m.plus==='mp'?v*2:v;
    return `<div class="mrow">${portrait(c,ci)}<div class="grow"><b>${esc(c.name)}</b> <span class="lv">Rank ${r}/${D.MENTOR_MAX}</span>
      ${r<D.MENTOR_MAX?bar(st.xp, need, 'xp', `${here?fmtTime(need-st.xp)+' to rank '+(r+1):'not studying'} · ${Math.floor(pct(st.xp,need))}%`):'<div class="ok small">Mastered</div>'}
      <div class="small">${r?`<span class="up">+${k(plus)} ${D.STAT_NAMES[m.plus]}</span>${minus?` <span class="down">−${m.minus==='hp'?minus*2:minus} ${D.STAT_NAMES[m.minus]}</span>`:''}`:`<span class="muted">Rank 1: +${k(1)} ${D.STAT_NAMES[m.plus]} and the subjob</span>`}${r>=1?` · <span class="ok">${j.icon} ${j.name} subjob open</span>`:''}${j.adv&&r>=3?` · <span class="ok">can be main job</span>`:''}</div></div>
      ${S.loc==='town'?`<button class="btn sm ${here?'on':''}" data-a="act" data-i="${ci}" data-v="${here?'rest':'m:'+m.id}" ${avail?'':'disabled'}>${here?'Stop':'Study'}</button>`:''}</div>`; }).join('');
  return `<div class="parch card mentor"><div class="mhead"><img class="mp" src="art/m_${m.id}.webp" alt=""><div><h3>${esc(m.name)}</h3><div class="small">${j.icon} Teaches the <b>${j.name}</b> subjob${j.adv?' (and the job itself at rank 3)':''}</div>
    <div class="small">Each rank: <span class="up">↑ ${D.STAT_NAMES[m.plus]}</span> grows, <span class="down">↓ ${D.STAT_NAMES[m.minus]}</span> slips every 3rd rank.</div><div class="say">“${esc(m.line)}”</div></div></div>
    ${avail?rows:`<p class="short small">Arrives when the ${esc(D.PLACES[m.place].name)} reaches Lv ${mentorNeedLv(m.id)}.</p>`}</div>`; }
function placeMentors(p){ const S=G.S; return `${S.loc==='exp'?'<p class="parch card small">The party is away. Heroes can study only while they are in town.</p>':''}<p class="small pdesc">Heroes study while the party rests in town (stamina then recovers at the normal rate, not the rest rate). The longer they train, the bigger the bonus and the minus.</p>${D.MENTORS.filter(m=>m.place===p).map(mentorCard).join('')}`; }
function hallArt(b){ return `<div class="hallart hall-${b}"><span>${D.BANNERS[b].icon}</span></div>`; }
function ratesTable(b){ const L=G.S.buildings[b]; const cur=L?bannerRates(b,L):null, nx=L<D.BMAX?bannerRates(b,L+1):null;
  return `<table class="rates"><tr><th>Rarity</th><th>Now</th>${nx?`<th>Lv ${L+1}</th>`:''}</tr>${D.RARITY.map((r,i)=>`<tr><td><span class="rn r${i}">${r.name}</span></td><td>${cur?cur[i]+'%':'—'}</td>${nx?`<td class="${cur&&nx[i]>cur[i]?'up':''}">${nx[i]}%</td>`:''}</tr>`).join('')}</table>`; }
function placeBanner(b){ const S=G.S, B=D.BANNERS[b], L=S.buildings[b];
  if(!L) return upgradeCard(b);
  const pool=bannerPool(b); const cap=bannerTierCap(b);
  return `<div class="banner parch card">${hallArt(b)}<div class="bh"><h3>${B.icon} ${B.name} Hall</h3><div class="small">${esc(B.desc)} For: ${B.jobs}.</div></div>
    <div class="pullbar"><span class="dia">💎 ${S.diamonds}</span><button class="btn go" data-a="pull" data-b="${b}" data-n="1" ${S.diamonds>=D.PULL_COST?'':'disabled'}>Pull ×1 · 💎${D.PULL_COST}</button><button class="btn go" data-a="pull" data-b="${b}" data-n="10" ${S.diamonds>=D.PULL10_COST?'':'disabled'}>Pull ×10 · 💎${D.PULL10_COST}</button></div>
    <div class="small">Pity: <b>${S.pity[b]||0}/${D.PITY}</b> — an Epic or better is guaranteed by pull ${D.PITY}. Every ×10 includes a Rare or better.</div>
    ${S.diamonds<D.PULL_COST?`<p class="small short">Diamonds come from the ⛏️ Mine (a Mining worker), first boss wins and bestiary milestones.</p>`:''}</div>
    <div class="parch card"><h3>Rates</h3>${ratesTable(b)}<p class="small">Higher rarity = bigger stats and faster skill learning (Rare +1 AP per win, Epic +2, Legendary +3).</p></div>
    <div class="parch card"><h3>In this hall (tiers 0–${cap})</h3><div class="pool">${pool.map(it=>`<button class="pi" data-a="itemInfo" data-id="${it.id}"><span>${it.icon}</span>${esc(it.name)}<small>${it.skills.map(s=>D.SKILLS[s].name).join(', ')}</small></button>`).join('')}</div>
    <p class="small muted">Upgrade the hall and travel farther to unlock stronger gear.</p></div>`; }
function placeFuse(){ const S=G.S; const f=fusable();
  return `<div class="parch card"><h3>⚒️ Fuse duplicates</h3><p class="small">Three unworn copies of the same item and rarity become one of the next rarity. The Forge level sets the highest rarity you can fuse into (now: <b>${D.RARITY[fuseLimit()]?D.RARITY[fuseLimit()].name:'—'}</b>).</p>
    ${f.length?f.map(x=>`<div class="srow"><span>${rname({id:x.id,r:x.r})} ×${x.n}</span><button class="btn sm" data-a="fuse" data-id="${x.id}" data-r="${x.r}" ${x.ok&&S.gold>=fuseCost(x.r)?'':'disabled'}>Fuse → ${D.RARITY[x.r+1]?D.RARITY[x.r+1].name:'max'} · 🪙${fuseCost(x.r)}</button></div>`).join(''):'<p class="muted small">No set of three duplicates yet.</p>'}</div>`; }
function placeTraining(){ const S=G.S; const cap=enduranceCap();
  return `<div class="parch card"><h3>🎯 Endurance</h3><p class="small">Stamina decides how long an expedition lasts: every battle costs 1 (a boss costs ${D.STAM.boss}). Training Endurance raises max stamina (+${D.STAM.perLv} per level) and recovery speed. The Training Grounds level caps Endurance at <b>${cap}</b>.</p>
    ${S.chars.map((c,ci)=>{ const need=enduranceNeed(c.endLv); const here=c.act==='train';
      return `<div class="mrow">${portrait(c,ci)}<div class="grow"><b>${esc(c.name)}</b> <span class="lv">Endurance ${c.endLv}</span>
        ${bar(c.stam, maxStam(c), 'stam', `Stamina ${Math.floor(c.stam)}/${maxStam(c)}`)}
        ${c.endLv<cap?bar(c.endXp, need, 'xp', `${here?fmtTime(need-c.endXp)+' to Endurance '+(c.endLv+1):'not training'} · ${Math.floor(pct(c.endXp,need))}%`):`<div class="small">At the cap — upgrade the grounds.</div>`}
        <div class="small muted">Recovers 1 stamina every ${fmtTime(stamRegenSec(c))} (${fmtTime(stamRegenSec(c)/D.STAM.restMult)} when resting).</div></div>
        ${S.loc==='town'?`<div class="col"><button class="btn sm ${here?'on':''}" data-a="act" data-i="${ci}" data-v="train" ${c.endLv>=cap?'disabled':''}>Train</button><button class="btn sm ${c.act==='rest'?'on':''}" data-a="act" data-i="${ci}" data-v="rest">Rest</button></div>`:''}</div>`; }).join('')}</div>`; }
function compareFor(c, it, r){ // stat deltas if hero equipped this
  const cur=c.equip[it.slot]!=null?invItem(c.equip[it.slot]):null; const a=cur?defOf(cur).stats:{}; const b=scaledStats(it.stats, r||0); const keys=new Set([...Object.keys(a),...Object.keys(b)]);
  return [...keys].map(k=>{ const d=(b[k]||0)-(a[k]||0); return d?`<span class="${d>0?'up':'down'}">${D.STAT_NAMES[k]} ${d>0?'▲':'▼'}${Math.abs(d)}</span>`:''; }).join(' ') || '<span class="muted">same</span>'; }
function placeMarket(t){ const S=G.S;
  if(t==='sell'){ const items=S.inv.filter(u=>!u.relic && equippedBy(u.uid)<0);
    const gems=Object.keys(D.MATS).filter(m=>D.MATS[m].gem && S.mats[m]); const gv=gems.reduce((a,m)=>a+S.mats[m]*D.MATS[m].sell,0);
    return `<div class="shop"><div class="keeper parch"><img src="art/shopkeeper.webp" alt=""><div class="say">“Spare gear? I'll take it. Mastered pieces — whose skills everyone already knows — are safe to sell.”</div></div>
      <div class="parch card"><div class="row gap"><button class="btn" data-a="sellMastered">Sell all mastered</button><button class="btn" data-a="sellGems" ${gv?'':'disabled'}>Sell gems · 🪙${gv}</button></div>
      <table class="slist"><tr><th>Item</th><th>Price</th><th></th></tr>${items.map(u=>`<tr><td>${rname(u)}${isMastered(u)?' <small class="ok">mastered</small>':''}</td><td>🪙${sellPrice(u)}</td><td><button class="btn sm" data-a="sell" data-uid="${u.uid}">Sell</button></td></tr>`).join('')||'<tr><td colspan="3" class="muted">Nothing unworn to sell.</td></tr>'}</table></div></div>`; }
  const items=shopItems(); if(!UI.shopSel||!items.find(i=>i.id===UI.shopSel)) UI.shopSel=items[0]&&items[0].id;
  const sel=D.ITEM[UI.shopSel];
  return `<div class="shop"><div class="keeper parch"><img src="art/shopkeeper.webp" alt=""><div class="say">“Only plain, honest gear here — the good stuff comes out of the halls. ${S.buildings.market<3?'Upgrade my stall and I\'ll stock more.':''}”</div></div>
    <div class="parch card"><table class="slist"><tr><th>Item</th><th>Price</th><th>Owned</th></tr>${items.map(it=>`<tr class="${it.id===UI.shopSel?'sel':''}" data-a="shopSel" data-id="${it.id}"><td>${it.icon} ${esc(it.name)}</td><td class="${S.gold<buyPrice(it)?'short':''}">🪙${buyPrice(it)}</td><td>${S.inv.filter(u=>u.id===it.id).length}</td></tr>`).join('')}</table></div>
    ${sel?`<div class="parch card tip"><h3>${sel.icon} ${esc(sel.name)} <small>${D.SLOT_NAMES[sel.slot]} · Common</small></h3><div class="small">${statLine(sel.stats)}</div><div class="small">Teaches: ${sel.skills.map(s=>`<b>${skillName(s)}</b> <span class="muted">(${D.SKILLS[s].ap} AP)</span>`).join(', ')}</div>
      <div class="cmp">${S.chars.map((c,ci)=>`<div class="cmpc">${portrait(c,ci)}<b>${esc(c.name)}</b><div class="small">${compareFor(c, sel, 0)}</div><div class="small">${sel.skills.filter(s=>!c.learned[s]).length?'<span class="ok">new skills</span>':'<span class="muted">knows these</span>'}</div></div>`).join('')}</div>
      <button class="btn go" data-a="buy" data-id="${sel.id}" ${S.gold>=buyPrice(sel)?'':'disabled'}>Buy · 🪙${buyPrice(sel)}</button></div>`:''}</div>`; }
function placeTavern(){ const S=G.S; const L=S.buildings.tavern;
  return `<div class="parch card"><h3>🍲 Larder</h3><p class="small">A Cooking worker cooks the best recipe you have ingredients for. The party eats the best meal in the larder each time it sets out; the buff lasts that whole expedition.</p>
    <div class="chips">${D.FOODS.filter(f=>S.meals[f.id]).map(f=>`<span class="chip">${f.icon} ${esc(f.name)} ×${S.meals[f.id]}</span>`).join('')||'<span class="muted small">Empty.</span>'}</div>
    <p class="small">${S.workers.cooking?`🧑‍🍳 Cooking: ${esc(profPerkText('cooking'))}`:'<span class="short">No Cooking worker — assign one at the 🏛️ Town Hall.</span>'}</p></div>
    <div class="parch card"><h3>Recipes</h3>${D.FOODS.map(f=>{ const ok=f.tav<=L && f.cook<=S.profs.cooking.lv;
      return `<div class="srow ${ok?'':'dim'}"><span>${f.icon} <b>${esc(f.name)}</b> <small>${esc(f.desc)}</small></span><span class="chips">${Object.entries(f.mats).map(([m,n])=>matChip(m,n)).join('')}</span>${ok?'':`<small class="muted">Tavern Lv ${f.tav} · Cooking Lv ${f.cook}</small>`}</div>`; }).join('')}</div>`; }
function placeLibrary(){ const S=G.S; const L=S.buildings.library;
  return `<div class="parch card"><h3>📚 The bestiary</h3><p class="small">Every kill teaches the scholars about a foe. Each tier weakens that foe for good. Library level ${L} unlocks up to tier <b>${D.BEAST_TIERS.reduce((a,t,i)=>t.lib<=L?i:a,0)}</b>.</p>
    <table class="rates"><tr><th>Tier</th><th>Kills</th><th>Library</th><th>Effect</th></tr>${D.BEAST_TIERS.slice(1).map((t,i)=>`<tr class="${t.lib<=L?'':'dim'}"><td>${i+1}</td><td>${t.kills}</td><td>Lv ${t.lib}</td><td class="small">${esc(t.label.split('— ')[1]||t.label)}${t.dia?` · +${t.dia}💎`:''}</td></tr>`).join('')}</table>
    <p class="small">Complete a zone's collection — every foe Mastered, every rare <b>Gilded</b> variant defeated, and the boss beaten — and the Library awards that zone's relic.</p>
    <button class="btn" data-a="codexGo" data-k="bestiary">Open the bestiary</button></div>`; }

/* ---------------- WORLD MAP ---------------- */
function viewMap(){
  const S=G.S; if(!zoneOpen(UI.mapSel)) UI.mapSel=0;
  const pins=D.ZONES.map((z,i)=>{ const open=zoneOpen(i), st=S.zones[i], ready=open&&bossReady(i)&&!st.boss;
    return `<button class="zpin ${open?'':'locked'} ${st.boss?'cleared':''} ${ready?'ready':''} ${UI.mapSel===i?'on':''} ${S.loc==='exp'&&S.zone===i?'here':''}" style="left:${z.mx}%;top:${z.my}%" data-a="mapSel" data-z="${i}">
      <span class="seal">${open?(st.boss?'✓':i+1):'🔒'}</span><span class="zl">${esc(z.name)}</span></button>`; }).join('');
  const town=`<div class="tpin" style="left:${D.TOWN_POS.x}%;top:${D.TOWN_POS.y}%">🏮<span>Lanternfall</span></div>`;
  return `<div class="worldmap"><img src="art/world_map.webp" alt="World map" draggable="false">${town}${pins}</div>${zoneCard(UI.mapSel)}`;
}
function zoneCard(i){ const S=G.S, Z=D.ZONES[i], st=S.zones[i], open=zoneOpen(i);
  if(!open) return `<div class="parch card zc"><h3>🔒 ${esc(Z.name)}</h3><p class="small">Defeat ${esc(D.ZONES[i-1].boss.name)} in ${esc(D.ZONES[i-1].name)} to open the road.</p></div>`;
  const ready=bossReady(i); const col=zoneCollection(i);
  const foes=Z.enemies.map(e=>{ const t=beastTier(e.id); return `<button class="zf" data-a="beast" data-e="${e.id}"><img src="${enemyImg(e.id)}" alt="" class="${S.bestiary[e.id]?'':'unseen'}"><span>${S.bestiary[e.id]?esc(e.name):'???'}</span><small>${S.bestiary[e.id]||0} kills · T${t}${S.variants[e.id]?' · ✨':''}</small></button>`; }).join('');
  const here = S.loc==='exp' && S.zone===i;
  const dep=canDepart();
  return `<div class="parch card zc"><div class="zh"><h3>${esc(Z.name)}</h3><span class="chip">Lv ${Z.lv}</span></div><p class="small">${esc(Z.desc)}</p>
    <div class="zfoes">${foes}<button class="zf boss" data-a="beast" data-e="${Z.boss.id}"><img src="${enemyImg(Z.boss.id)}" alt="" class="${st.bossKills?'':'unseen'}"><span>${st.bossKills?esc(Z.boss.name):'Boss'}</span><small>${st.boss?'defeated ✓':'guards the road'}</small></button></div>
    ${!st.boss?bar(Math.min(st.wins,Z.wins), Z.wins, 'zone', `Battles won ${Math.min(st.wins,Z.wins)}/${Z.wins} — then the boss appears`):`<div class="small ok">Boss defeated. It returns after ${40} more wins here (${st.sinceBoss}/40) for another try.</div>`}
    <div class="small">Collection: ${col.foes.filter(f=>f.t>=3).length}/${col.foes.length} Mastered · ${col.foes.filter(f=>f.gilded).length}/${col.foes.length} Gilded seen · boss ${col.boss?'✓':'✗'} → ${col.relic?`${col.relic.icon} ${esc(col.relic.name)} ${col.got?'<b class="ok">claimed</b>':''}`:'—'}</div>
    <div class="row gap">${S.loc==='town'?`<button class="btn go grow" data-a="depart" data-z="${i}" ${dep.ok?'':'disabled'}>🔥 Set out</button>${ready?`<button class="btn boss" data-a="departBoss" data-z="${i}" ${dep.ok&&S.chars.every(c=>c.stam>=D.STAM.boss)?'':'disabled'}>👑 Face ${esc(Z.boss.name)}</button>`:''}`
      : here ? `<button class="btn go grow" data-a="tab" data-t="camp">⚔️ Watch the battle</button>${ready?`<button class="btn boss" data-a="boss" data-z="${i}">👑 Boss next</button>`:''}` : `<span class="small muted">The party is out in ${esc(D.ZONES[S.zone].name)}.</span>`}</div>
    ${S.loc==='town'&&!dep.ok?`<p class="small short">${esc(dep.why)}. Rest in town to recover.</p>`:''}</div>`; }

/* ---------------- CAMP (in town) / BATTLE (on expedition) ---------------- */
function viewCamp(){ const S=G.S; if(S.loc==='exp') return null; // battle is drawn by renderBattle
  const dep=canDepart(); const zi=Math.max(0, Math.min(maxZoneOpen(), UI.mapSel)); const Z=D.ZONES[zi];
  const meal=[...D.FOODS].reverse().find(f=>(S.meals[f.id]||0)>0);
  const opts=S.chars.map((c,ci)=>{ const ms=D.MENTORS.filter(m=>mentorAvailable(m.id)&&mentorRank(c,m.id)<D.MENTOR_MAX);
    return `<div class="campc parch">${portrait(c,ci)}<div class="grow"><b>${esc(c.name)}</b> <small>Lv ${c.lv} ${D.RACES[c.race].name}${c.job?' · '+D.JOBS[c.job].icon+' '+D.JOBS[c.job].name:''}</small>
      ${bar(c.stam, maxStam(c), 'stam', `Stamina ${Math.floor(c.stam)}/${maxStam(c)}${c.stam<maxStam(c)?' · full in '+fmtTime((maxStam(c)-c.stam)*stamRegenSec(c)/(c.act==='rest'?D.STAM.restMult:1)):''}`)}
      <div class="acts"><button class="btn sm ${c.act==='rest'?'on':''}" data-a="act" data-i="${ci}" data-v="rest">😴 Rest</button><button class="btn sm ${c.act==='train'?'on':''}" data-a="act" data-i="${ci}" data-v="train" ${c.endLv>=enduranceCap()?'disabled':''}>🎯 Train</button>
        <select data-sel="act" data-i="${ci}" aria-label="Mentor"><option value="">🎓 Mentor…</option>${ms.map(m=>`<option value="m:${m.id}" ${c.act==='m:'+m.id?'selected':''}>${esc(m.name)} (${D.JOBS[m.job].name}) r${mentorRank(c,m.id)}</option>`).join('')}</select></div>
      <div class="small muted">${actName(c.act)}</div></div></div>`; }).join('');
  const le=S.lastExp;
  return `<div class="camp">${H2('🔥 The campfire', 'Rest, train, then choose where to go')}
    ${le?`<div class="parch card small">Last expedition — ${esc(D.ZONES[le.zi].name)}: ${le.wins||0} wins, +${le.gold||0} gold, +${le.xp||0} XP. ${le.reason==='wipe'?'The party fell and was carried home.':le.reason==='tired'?'Came home when stamina ran out.':'Came home early.'}</div>`:''}
    ${opts}
    <div class="parch card"><div class="row gap wrap"><label class="small">Destination <select data-sel="zone">${D.ZONES.map((z,i)=>zoneOpen(i)?`<option value="${i}" ${i===zi?'selected':''}>${i+1}. ${esc(z.name)} (Lv ${z.lv})</option>`:'').join('')}</select></label>
      <span class="small">${meal?`Packed meal: ${meal.icon} ${esc(meal.name)} (${esc(meal.desc)})`:'No meal packed (Tavern).'}</span></div>
      <div class="row gap"><button class="btn go big grow" data-a="depart" data-z="${zi}" ${dep.ok?'':'disabled'}>Set out for ${esc(Z.name)}</button>${bossReady(zi)&&!S.zones[zi].boss?`<button class="btn boss" data-a="departBoss" data-z="${zi}" ${dep.ok&&S.chars.every(c=>c.stam>=D.STAM.boss)?'':'disabled'}>👑 Boss</button>`:''}</div>
      ${dep.ok?`<p class="small muted">Each battle costs 1 stamina. With ${Math.floor(partyStam())} stamina the party can fight about ${Math.floor(partyStam())} battles (~${fmtTime(Math.floor(partyStam())*40)}).</p>`:`<p class="small short">${esc(dep.why)}.</p>`}</div></div>`; }
function battleSkeleton(){
  return `<div class="battle"><div id="expbar" class="wood"></div><div id="scene" class="scene"><div id="foes"></div><div id="floaters"></div><div id="sceneMsg"></div></div>
    <div id="pwins"></div><div id="msgwin" class="dq"></div><div id="learn"></div></div>`; }
function renderBattle(){
  const v=$('#view'); if(!v.querySelector('.battle')){ v.innerHTML=battleSkeleton(); v._h=null; UI.battleKey=null; }
  const S=G.S, B=S.battle, Z=D.ZONES[S.zone], st=S.zones[S.zone];
  const e=S.exp||{};
  setHTML($('#expbar'), `<div class="eb1"><b>${esc(Z.name)}</b><span class="small">Trip: ${e.wins||0} wins · 🪙${e.gold||0}</span><button class="btn sm" data-a="home">🏠 Return</button></div>
    ${!st.boss?bar(Math.min(st.wins,Z.wins), Z.wins, 'zone thin', `${Math.min(st.wins,Z.wins)}/${Z.wins} wins to the boss`):''}${bossReady(S.zone)&&!st.boss&&!(B&&B.boss)&&!S.pendingBoss?`<button class="btn boss sm" data-a="boss" data-z="${S.zone}">👑 Fight the boss next</button>`:''}${S.pendingBoss?'<div class="small boss">👑 The boss is next!</div>':''}`);
  const scene=$('#scene'); const bg=`url(art/bg_${Z.id}.webp)`; if(scene.style.backgroundImage.indexOf(Z.id)<0) scene.style.backgroundImage=bg;
  const key=B?(B.enemies.map(x=>x.name).join('|')+':'+(B.t0||0)):'none';
  if(UI.battleKey!==key){ UI.battleKey=key;
    $('#foes').innerHTML = B ? B.enemies.map((x,i)=>`<div class="foe ${x.boss?'boss':''} ${x.gild?'gild':''} n${B.enemies.length}" id="en${i}"><img src="${enemyImg(x.id)}" alt="${esc(x.name)}"><div class="fname">${esc(x.name)}</div><div class="fhp"><i></i></div><div class="fst"></div></div>`).join('') : '';
  }
  if(B) B.enemies.forEach((x,i)=>{ const n=$('#en'+i); if(!n) return; n.classList.toggle('dead', x.hp<=0); const t=beastTier(x.id); const showHp=t>=1||x.boss;
    n.querySelector('.fhp i').style.width=pct(x.hp,x.maxHp)+'%'; const s=[]; if(showHp) s.push(`${x.hp}/${x.maxHp}`); if(t>=2&&x.weak) s.push('weak '+D.ELEMENTS[x.weak].split(' ')[0]); if(x.poison) s.push('☠️'); if(x.stun) s.push('💫');
    const f=n.querySelector('.fst'); const h=s.join(' · '); if(f._h!==h){ f._h=h; f.textContent=h; } });
  setHTML($('#sceneMsg'), B?'':`<span>${S.chars.some(c=>c.stam<1)?'The party is tired…':'The party walks on…'}</span>`);
  setHTML($('#pwins'), S.chars.map((c,ci)=>{ const d=calc(c, B&&B.buffs);
    return `<div class="pwin dq ${c.hp<=0?'ko':''} ${c.hp>0&&c.hp<d.maxHp*.3?'low':''}" id="pw${ci}"><div class="pn">${esc(c.name)}<small>${c.job?D.JOBS[c.job].icon:''}Lv${c.lv}</small></div>
      <div class="pv"><span>HP</span><b>${c.hp}</b><small>/${d.maxHp}</small></div><div class="pv"><span>MP</span><b>${c.mp}</b><small>/${d.maxMp}</small></div>
      <div class="pst" title="Stamina"><i style="width:${pct(c.stam,maxStam(c))}%"></i><span>ST ${Math.floor(c.stam)}</span></div></div>`; }).join(''));
  setHTML($('#msgwin'), S.log.slice(-6).map(l=>`<div class="ln ${l.c}">${esc(l.m)}</div>`).join(''));
  setHTML($('#learn'), `<div class="wood panel small"><div class="ph"><h3>Learning</h3><button class="lnk" data-a="tab" data-t="party">Party ›</button></div>${S.chars.map((c,ci)=>{ const L=learningOf(c)[0];
    return `<div class="lrow"><b>${esc(c.name)}</b> ${L?`${skillName(L.sid)} ${bar(L.ap, L.need, 'ap thin', `${L.ap}/${L.need} AP`)}`:'<span class="muted">nothing left to learn from this gear</span>'}</div>`; }).join('')}</div>`);
  animate();
}
function learningOf(c){ const out=[]; for(const u of charGear(c)) for(const sid of defOf(u).skills){ if(c.learned[sid]||out.find(o=>o.sid===sid)) continue; out.push({sid, ap:c.ap[sid]||0, need:D.SKILLS[sid].ap, u}); } return out.sort((a,b)=>b.ap/b.need-a.ap/a.need); }
function animate(){
  const ev=G.ev.splice(0); if(!ev.length) return;
  const fl=$('#floaters');
  for(const e of ev){
    if(!fl) continue;
    if(e.t==='hitE'||e.t==='missE'){ const n=$('#en'+e.i); if(!n) continue; n.classList.remove('hit'); void n.offsetWidth; n.classList.add('hit');
      float(fl, n, e.t==='missE'?'miss':e.dmg, e.t==='missE'?'miss':e.how==='crit'?'crit':e.how==='poison'?'poison':''); }
    if(e.t==='killE'){ const n=$('#en'+e.i); if(n) n.classList.add('dying'); }
    if(e.t==='hitP'||e.t==='missP'||e.t==='healP'||e.t==='koP'){ const n=$('#pw'+e.i); if(!n) continue; const cl=e.t==='healP'?'healed':e.t==='missP'?'dodged':'shake'; n.classList.remove(cl); void n.offsetWidth; n.classList.add(cl);
      if(e.t==='hitP'&&e.dmg) floatP(n, '-'+e.dmg, 'hurt'); if(e.t==='healP'&&e.amt) floatP(n, '+'+e.amt, 'heal'); if(e.t==='missP') floatP(n,'miss','miss'); }
  }
}
function relicPop(id){ const r=D.RELIC[id]; modal(`<div class="relicpop"><div class="big">${r.icon}</div><h2>A relic!</h2><h3>${esc(r.name)}</h3><p>${esc(r.desc)}</p><p>Houses the vital skill <b>${skillName(r.skill)}</b>: ${esc(D.SKILLS[r.skill].desc)}</p><p class="small muted">Equip it in Party → a hero → Gear → Relic. ${D.SKILLS[r.skill].ap} AP masters it for good.</p><button class="btn go" data-a="closeModal">Wonderful</button></div>`); }
function float(fl, n, txt, cls){ const r=n.getBoundingClientRect(), p=fl.getBoundingClientRect(); const f=document.createElement('div'); f.className='fl '+cls; f.textContent=txt; f.style.left=(r.left-p.left+r.width/2)+'px'; f.style.top=(r.top-p.top+r.height*.25)+'px'; fl.appendChild(f); setTimeout(()=>f.remove(), 1100); }
function floatP(n, txt, cls){ const f=document.createElement('div'); f.className='flp '+cls; f.textContent=txt; n.appendChild(f); setTimeout(()=>f.remove(), 1000); }

/* ---------------- PARTY ---------------- */
const HERO_TABS=[['overview','Hero'],['skills','Skills'],['job','Job grid'],['gear','Gear']];
function viewParty(){ const S=G.S; const ci=Math.min(UI.sel, S.chars.length-1), c=S.chars[ci];
  const pick=S.chars.map((h,i)=>`<button class="hpick ${i===ci?'on':''}" data-a="sel" data-i="${i}">${portrait(h,i)}<span>${esc(h.name)}</span><small>Lv ${h.lv}</small></button>`).join('');
  const tabs=HERO_TABS.map(([k,n])=>`<button class="stab ${UI.heroTab===k?'on':''}" data-a="htab" data-k="${k}">${n}</button>`).join('');
  const body = UI.heroTab==='skills'?heroSkills(c,ci) : UI.heroTab==='job'?heroJob(c,ci) : UI.heroTab==='gear'?heroGear(c,ci) : heroOverview(c,ci);
  return `<div class="hpicks">${pick}</div><div class="stabs">${tabs}</div>${body}`; }
function heroOverview(c, ci){ const d=calcBase(c), R=D.RACES[c.race]; const me=mentorEff(c);
  const statRow=k=>`<div class="st"><span>${D.STAT_NAMES[k]}</span><b>${k==='hp'?d.maxHp:k==='mp'?d.maxMp:d[k]}</b>${me[k]?`<small class="${me[k]>0?'up':'down'}">${me[k]>0?'+':''}${me[k]} mentor</small>`:''}</div>`;
  const ms=D.MENTORS.filter(m=>mentorRank(c,m.id)>0);
  return `<div class="parch card hero"><div class="hh"><img class="pbig ${G.S.chars.slice(0,ci).some(x=>x.race===c.race)?'flip':''}" src="art/race_${c.race}.webp" alt=""><div><h3>${esc(c.name)}</h3>
    <div class="small">Lv ${c.lv} ${R.name}${c.job?` · ${D.JOBS[c.job].icon} ${D.JOBS[c.job].name}`:' · no job yet'}${c.sub?` / ${D.JOBS[c.sub].icon} ${D.JOBS[c.sub].name} (sub)`:''}</div>
    ${bar(c.xp, xpNeed(c.lv), 'xp', `XP ${c.xp}/${xpNeed(c.lv)}`)}${bar(c.stam, maxStam(c), 'stam', `Stamina ${Math.floor(c.stam)}/${maxStam(c)} · Endurance ${c.endLv}`)}
    <div class="small muted">${actName(c.act)}</div></div></div>
    <div class="stats">${D.STATS.map(statRow).join('')}</div></div>
    <div class="parch card"><h3>${R.name} traits</h3>${R.traits.map(t=>`<div class="small ${c.lv>=t.lv?'':'dim'}"><b>Lv ${t.lv} ${esc(t.name)}</b> — ${esc(t.desc)}</div>`).join('')}</div>
    <div class="parch card"><h3>🎓 Mentors</h3>${ms.length?ms.map(m=>`<div class="srow"><img class="mini" src="art/m_${m.id}.webp" alt=""><span><b>${esc(m.name)}</b> rank ${mentorRank(c,m.id)} · <span class="up">+${(m.plus==='hp'?3:m.plus==='mp'?2:1)*D.MENTOR_PLUS(mentorRank(c,m.id))} ${D.STAT_NAMES[m.plus]}</span>${D.MENTOR_MINUS(mentorRank(c,m.id))?` <span class="down">−${(m.minus==='hp'?2:1)*D.MENTOR_MINUS(mentorRank(c,m.id))} ${D.STAT_NAMES[m.minus]}</span>`:''} · ${D.JOBS[m.job].icon} ${D.JOBS[m.job].name} subjob</span></div>`).join(''):'<p class="small muted">No mentor yet. Mentors live in the town buildings (Training Grounds, Forge, Chapel…). Studying with one opens their subjob.</p>'}</div>`; }
function skillSourceText(sid){ const src=skillSources(sid); if(!src.length) return 'from a job grid'; return src.slice(0,3).map(x=>x.relicDef?`${x.icon} ${x.name} (relic — ${D.ZONES[x.zone].name} collection)`:`${x.icon} ${x.name}${x.shop?' (Market)':' (gear halls)'}`).join(', '); }
function heroSkills(c, ci){ const ss=skillSet(c); const groups={};
  for(const sid in D.SKILLS){ const s=D.SKILLS[sid]; if(s.type==='job' && !ss[sid]) continue; (groups[s.type]=groups[s.type]||[]).push(sid); }
  const learnedN=Object.keys(c.learned).length;
  return `<div class="wood panel"><div class="ph"><h3>Skills</h3><span class="small">${learnedN} mastered</span></div><p class="small pd">Wear gear to learn its skills: each win gives AP. At full AP the skill is mastered for good, even without the gear.</p>
    ${Object.entries(groups).map(([t,ids])=>{ const T=D.TYPES[t]||{name:t,icon:'•'}; const open=UI.open['sk_'+t]!==false; const have=ids.filter(id=>c.learned[id]).length;
      return `<div class="cat"><button class="cath" data-a="toggle" data-k="sk_${t}"><span>${T.icon} ${T.name}</span><small>${have}/${ids.length}</small><i>${open?'▾':'▸'}</i></button>${open?`<div class="sklist">${ids.map(sid=>{ const s=D.SKILLS[sid]; const ap=c.ap[sid]||0, L=!!c.learned[sid], src=ss[sid];
        return `<div class="skrow ${L?'done':src?'act':'dim'}"><div class="tile">${(D.TYPES[s.type]||{}).icon||'✦'}</div><div class="grow"><div class="sn"><b>${esc(s.name)}</b> <small>${s.kind==='passive'?'passive':s.mp?s.mp+' MP':''}</small>${src&&src!=='learned'?` <span class="tag">${src==='gear'?'from gear':src==='lock'?'🔒 locked in':src==='sub'?'subjob':'job'}</span>`:''}</div>
          <div class="small">${esc(s.desc)}</div>${s.ap?(L?'<div class="small ok">Mastered ✓</div>':bar(ap, s.ap, 'ap', `${ap}/${s.ap} AP${src==='gear'?'':' — '+skillSourceText(sid)}`)):''}</div></div>`; }).join('')}</div>`:''}</div>`; }).join('')}</div>`; }
function gridPos(n){ if(n.core) return [0,0]; const i=+n.id.split('.')[1], b=n.branch; const r=58+i*44; const a=(-90+b*120+(i-2.5)*7)*Math.PI/180; return [Math.cos(a)*r, Math.sin(a)*r, r, a]; }
function gridSvg(c, jid){ const j=D.JOBS[jid], jt=c.jobs[jid]||{nodes:{}};
  let lines='', nodes=''; const seen=new Set();
  for(const n of j.nodes) for(const l of n.links){ const k=[n.id,l].sort().join('-'); if(seen.has(k)) continue; seen.add(k); const m=j.node[l]; const p1=gridPos(n), p2=gridPos(m); const lit=jt.nodes[n.id]&&jt.nodes[l];
    if(!n.core && !m.core && n.branch!==m.branch){ const r=(p1[2]+p2[2])/2; const sw=(p1[0]*p2[1]-p1[1]*p2[0])>0?1:0; lines+=`<path d="M${p1[0].toFixed(1)},${p1[1].toFixed(1)} A${r},${r} 0 0 ${sw} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" class="${lit?'lit':''}"/>`; }
    else lines+=`<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" class="${lit?'lit':''}"/>`; }
  for(const n of j.nodes){ const [x,y]=gridPos(n); const own=!!jt.nodes[n.id]; const av=!own && nodeAvailable(c,jid,n).ok; const locked=c.locks[jid]===n.id; const r=n.core?20:n.ability?15:10;
    const col=n.core||n.ability?'#f2cc8f':({hp:'#6fcf73',mp:'#5aa9e6',str:'#e07a5f',def:'#d9b23a',mag:'#c08ee0',agi:'#7ad1c4'}[n.stat]||'#ccc');
    nodes+=`<g class="node ${own?'own':''} ${av?'av':''} ${UI.node===n.id?'sel':''} ${locked?'locked':''} ${n.ability?'abil':''}" data-a="node" data-n="${n.id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="${r+9}" class="halo"/><circle r="${r}" fill="${col}" class="orb"/>${n.ability?`<text y="5" class="glyph">${locked?'🔒':'★'}</text>`:''}${n.core?`<text y="7" class="glyph core">${j.icon}</text>`:''}${!n.ability&&!n.core?`<text y="4" class="sl">${D.STAT_NAMES[n.stat][0]}</text>`:''}</g>`; }
  const labels=j.branches.map(([bn],b)=>{ const p=gridPos(j.node[b+'.5']); const x=Math.max(-250,Math.min(250,p[0]*1.12)), y=p[1]*1.12+(b===0?-6:28); return `<text class="bl" x="${x.toFixed(0)}" y="${y.toFixed(0)}">${esc(bn)}</text>`; }).join('');
  return `<svg class="sgrid" viewBox="-320 -330 640 610" role="img" aria-label="${j.name} grid"><defs><radialGradient id="glow"><stop offset="0" stop-color="#9fd3ff" stop-opacity=".6"/><stop offset="1" stop-color="#9fd3ff" stop-opacity="0"/></radialGradient></defs>${lines}${nodes}${labels}</svg>`; }
function heroJob(c, ci){ const S=G.S; const jid=UI.jobView&&D.JOBS[UI.jobView]?UI.jobView:(c.job||D.JOB_ORDER.find(j=>jobUnlocked(c,j))||'knight'); UI.jobView=jid; const j=D.JOBS[jid], jt=c.jobs[jid];
  const list=D.JOB_ORDER.map(k=>{ const J=D.JOBS[k]; const un=jobUnlocked(c,k), sub=subjobOk(c,k); const pr=jobProgress(c,k);
    return `<button class="jchip ${k===jid?'on':''} ${un?'':'locked'} ${c.job===k?'main':''} ${c.sub===k?'sub':''}" data-a="jobView" data-j="${k}"><span>${un||sub?J.icon:'🔒'}</span>${J.name}<small>${c.job===k?'main':c.sub===k?'sub':`${pr.n}/${pr.of}`}${c.locks[k]?' · 🔒':''}</small></button>`; }).join('');
  const n=UI.node&&j.node[UI.node]?j.node[UI.node]:null;
  const lockN=c.locks[jid]?j.node[c.locks[jid]]:null;
  let info='';
  if(n){ const own=jt&&jt.nodes[n.id]; const av=nodeAvailable(c,jid,n);
    info=`<div class="ninfo"><b>${esc(n.name)}</b> <small>${n.core?'core':n.bname+' · ring '+n.ring}${n.ability?' · ability':''}</small><div class="small">${esc(n.desc)}</div>
      ${own?'<span class="ok small">Unlocked ✓</span>':`<button class="btn sm go" data-a="buyNode" data-n="${n.id}" ${av.ok?'':'disabled'}>Unlock · ${n.cost} JP</button> <small class="${av.ok?'':'short'}">${av.ok?'':esc(av.why)}</small>`}
      ${own&&n.ability?(lockN&&lockN.id===n.id?`<button class="btn sm" data-a="lock" data-n="">Release lock-in</button>`:`<button class="btn sm lockbtn" data-a="lock" data-n="${n.id}">🔒 Lock in — keep after switching jobs</button>`):''}</div>`; }
  const why=jobUnlocked(c,jid)?'':jobWhy(c,jid);
  return `<div class="jobs">${list}</div>
    <div class="sphere"><div class="sg-corner">${portrait(c,ci)}<div><b>${esc(c.name)}</b><small>${j.icon} ${j.name}</small><small>JP <b>${jt?jt.jp||0:0}</b></small></div></div>${gridSvg(c,jid)}${info}</div>
    <div class="parch card"><div class="row gap wrap">${c.job===jid?`<span class="chip ok">Main job</span>`:jobUnlocked(c,jid)?`<button class="btn go" data-a="setJob" data-j="${jid}">Make ${j.name} the main job</button>`:`<span class="small short">Locked: needs ${esc(why)}</span>`}
      ${c.sub===jid?`<button class="btn" data-a="setSub" data-j="">Remove subjob</button>`:subjobOk(c,jid)?`<button class="btn" data-a="setSub" data-j="${jid}">Set as subjob</button>`:c.job!==jid?`<span class="small muted">Subjob: study with ${D.MENTORS.filter(m=>m.job===jid).map(m=>esc(m.name)).join(' or ')}</span>`:''}</div>
      <p class="small">${esc(j.desc)} Command: <b>${skillName(j.cmd)}</b>. Main job: full stats, earns JP (1 per win, 5 per boss) and its unlocked nodes apply. Subjob: half its stats, its command and granted skills.</p>
      <div class="lockbox"><h3>🔒 Lock-in for ${j.name}</h3><p class="small">Pick ONE unlocked ability from this grid. It stays active when ${esc(c.name)} switches to another job.</p>
      ${lockN?`<div class="locked-pick">🔒 <b>${esc(lockN.name)}</b> — ${esc(lockN.desc)} ${c.job===jid?'<small class="muted">(active now as part of the main job; kept after switching)</small>':'<small class="ok">active now via lock-in</small>'}</div>`:`<div class="small muted">${lockable(c,jid).length?'Tap a ★ ability node you own, then “Lock in”.':'No ability unlocked yet in this grid.'}</div>`}</div>
      ${Object.keys(c.locks).length?`<div class="small">All lock-ins: ${Object.entries(c.locks).map(([k,nid])=>`${D.JOBS[k].icon} ${esc(D.JOBS[k].node[nid].name)}`).join(' · ')}</div>`:''}</div>`; }
function heroGear(c, ci){ const S=G.S;
  return D.SLOTS.map(slot=>{ const uid=c.equip[slot]; const u=uid!=null?invItem(uid):null; const open=UI.gearSlot===slot;
    const cands=S.inv.filter(x=>defOf(x).slot===slot && x.uid!==uid && equippedBy(x.uid)<0);
    return `<div class="parch card gslot"><div class="row"><b class="grow">${D.SLOT_NAMES[slot]}</b>${u?rname(u):'<span class="muted">empty</span>'}</div>
      ${u?`<div class="small">${statLine(defOf(u).stats)} · teaches ${defOf(u).skills.map(s=>`${skillName(s)} ${c.learned[s]?'✓':`<small>${c.ap[s]||0}/${D.SKILLS[s].ap}</small>`}`).join(', ')}</div>`:''}
      <div class="row gap">${cands.length?`<button class="btn sm" data-a="gslot" data-s="${slot}">${open?'Close':'Change ('+cands.length+')'}</button>`:`<span class="small muted">${slot==='relic'?'Relics come from completing a zone collection (Library).':'Get more from the gear halls, the Market or the Forge.'}</span>`}${u?`<button class="btn sm" data-a="unequip" data-s="${slot}">Remove</button>`:''}</div>
      ${open?`<div class="cands">${cands.map(x=>{ const it=defOf(x); const nw=it.skills.filter(s=>!c.learned[s]).length;
        return `<div class="srow"><span class="grow">${rname(x)}<div class="small">${slot==='relic'?statLine(it.stats):compareFor(c, D.ITEM[x.id], x.r)}${nw?' · <span class="ok">'+nw+' new skill'+(nw>1?'s':'')+'</span>':''}</div></span><button class="btn sm go" data-a="equip" data-uid="${x.uid}">Equip</button></div>`; }).join('')}</div>`:''}</div>`; }).join(''); }

/* ---------------- CODEX ---------------- */
const CODEX=[['bestiary','🐾 Bestiary'],['relics','💠 Relics'],['mats','🧱 Materials'],['save','💾 Save'],['help','❓ Guide'],['settings','⚙️ Settings']];
function viewCodex(){ const v=UI.codex; let h=`<div class="stabs">${CODEX.map(([k,n])=>`<button class="stab ${v===k?'on':''}" data-a="cview" data-v="${k}">${n}</button>`).join('')}</div>`;
  h += v==='relics'?codexRelics() : v==='mats'?codexMats() : v==='help'?helpHtml() : v==='settings'?settingsHtml() : v==='save'?saveHtml() : codexBestiary(); return h; }
function codexBestiary(){ const S=G.S; const L=S.buildings.library;
  return `<p class="small pdesc">Kills teach the Library about each foe. Tiers weaken that foe for good (Library Lv ${L} unlocks up to tier ${D.BEAST_TIERS.reduce((a,t,i)=>t.lib<=L?i:a,0)}). Rare ✨ Gilded variants appear 1 in ${Math.round(1/D.VARIANT_CHANCE)} fights. Complete a zone's collection for its relic.</p>` +
  D.ZONES.map((Z,zi)=>{ if(!zoneOpen(zi) && !S.zones[zi].wins) return `<div class="parch card dim"><h3>🔒 ${esc(Z.name)}</h3></div>`; const col=zoneCollection(zi);
    return `<div class="parch card"><div class="zh"><h3>${esc(Z.name)}</h3>${col.relic?`<span class="chip ${col.got?'ok':''}">${col.relic.icon} ${esc(col.relic.name)} ${col.got?'✓':''}</span>`:''}</div>
      <div class="beasts">${col.foes.map(f=>{ const k=f.k, t=f.t, T=D.BEAST_TIERS[t], nx=D.BEAST_TIERS[t+1]; const seen=k>0;
        return `<button class="beast ${seen?'':'unseen'}" data-a="beast" data-e="${f.e.id}"><img src="${enemyImg(f.e.id)}" alt=""><b>${seen?esc(f.e.name):'???'}</b><small>${k} kills · ${T.label.split(' —')[0]}${f.gilded?' · ✨':''}</small>${nx?bar(k, nx.kills, 'xp thin', `${k}/${nx.kills}`):'<small class="ok">complete</small>'}</button>`; }).join('')}
      <button class="beast boss ${S.zones[zi].bossKills?'':'unseen'}" data-a="beast" data-e="${Z.boss.id}"><img src="${enemyImg(Z.boss.id)}" alt=""><b>${S.zones[zi].bossKills?esc(Z.boss.name):'Boss'}</b><small>${S.zones[zi].bossKills} defeats</small></button></div>
      <div class="small">Collection: ${col.foes.filter(f=>f.t>=3).length}/${col.foes.length} Mastered · ${col.foes.filter(f=>f.gilded).length}/${col.foes.length} Gilded · boss ${col.boss?'✓':'✗'}</div></div>`; }).join(''); }
function findEnemy(id){ for(const [zi,Z] of D.ZONES.entries()){ const e=Z.enemies.find(x=>x.id===id); if(e) return {e, zi}; if(Z.boss.id===id) return {e:Z.boss, zi}; } return null; }
function codexRelics(){ const S=G.S; return `<p class="small pdesc">Relics are never dropped. Each one is the Library's reward for completing a zone's collection. Each houses a vital skill (${D.SKILLS[D.RELICS[0].skill].ap} AP).</p>`+D.RELICS.map(r=>{ const got=S.relicsFound[r.id];
  return `<div class="parch card srow ${got?'':'dim'}"><span class="big">${got?r.icon:'❔'}</span><span class="grow"><b>${got?esc(r.name):'Unknown relic'}</b><div class="small">${got?esc(r.desc)+' · ':''}${skillName(r.skill)}: ${esc(D.SKILLS[r.skill].desc)}</div><div class="small muted">Complete the ${esc(D.ZONES[r.zone].name)} collection.</div></span></div>`; }).join(''); }
function matUses(m){ const u=[]; for(const b in D.BUILD){ for(let L=1;L<=D.BMAX;L++){ const c=(D.BUILD_COST[L]||{}); if((D.BUILD_MATS[b]===m && L>=2) || (c.mats&&c.mats[m])){ u.push(`${D.PLACES[b]?D.PLACES[b].icon:''} ${D.PLACES[b]?D.PLACES[b].name:b} upgrades`); break; } } }
  for(const f of D.FOODS) if(f.mats[m]) u.push(`${f.icon} ${f.name}`); if(D.MATS[m].gem) u.push(`sells for 🪙${D.MATS[m].sell}`); return [...new Set(u)]; }
function codexMats(){ const S=G.S; return `<p class="small pdesc">Battles never drop materials. Town workers gather them (🏛️ Town Hall). Tap any one to see where it comes from.</p><div class="parch card"><div class="sklist">${Object.keys(D.MATS).map(m=>{ const M=D.MATS[m];
  return `<button class="skrow" data-a="matInfo" data-m="${m}"><div class="tile">${M.icon}</div><div class="grow"><b>${esc(M.name)}</b> <span class="chip">${S.mats[m]||0}</span><div class="small">${esc(M.desc)}</div><div class="small muted">${matSources(m).map(s=>esc(s.text)).join(' · ')}</div></div></button>`; }).join('')}</div></div>`; }
function helpHtml(){ return `<div class="parch card help"><h3>How Lanternfall plays</h3>
  <p><b>🔥 Set out.</b> Nothing fights until you choose a zone on the 🗺️ Map or at the campfire. The party then battles on its own, one action at a time.</p>
  <p><b>😮‍💨 Stamina.</b> Each battle costs every hero 1 stamina (a boss costs ${D.STAM.boss}). When anyone runs out, the party walks home to rest. Train Endurance at the 🎯 Training Grounds for longer trips.</p>
  <p><b>⚔️ Battles give</b> XP, gold, AP (skill learning), JP (job grid), zone progress and bestiary kills. <b>They never drop items.</b></p>
  <p><b>🏘️ Town work gives items:</b> one worker at the start (hire more with gold at the 🏛️ Town Hall). Mining digs stone, gems and slow 💎 Diamonds. Smithing forges the odd Common piece. Cooking makes meals eaten when you set out.</p>
  <p><b>💎 Gear halls</b> (Forge, Chapel, Arcanum, Thieves' Den, Lodge) are the main source of gear. Every piece teaches skills; wear it and win to master them.</p>
  <p><b>🧭 Jobs.</b> A base job opens after one learned skill of its type. Each job has a sphere grid paid for with JP. Lock in ONE ability per job to keep it after switching.</p>
  <p><b>🎓 Mentors.</b> Heroes in town can study with a mentor: a growing bonus, a smaller minus, and that mentor's job as a subjob. Rank 3 with an advanced-job mentor opens that job.</p>
  <p><b>📚 Bestiary.</b> Kill counts weaken foes (with the Library). Master every foe in a zone, beat its Gilded variants and the boss to earn that zone's relic.</p></div>`; }
function settingsHtml(){ const S=G.S; return `<div class="parch card"><h3>⚙️ Settings</h3><label class="tg"><input type="checkbox" data-set="autoBoss" ${S.settings.autoBoss?'checked':''}> <span><b>Auto-challenge bosses</b><br><small class="muted">Fight a zone's boss as soon as it appears (off = you choose).</small></span></label>
  <button class="btn sm" data-a="tutReset">Show the guide again</button></div>
  <div class="parch card"><h3>💾 Save</h3><p class="small muted">Save codes, backups and hard reset live on the Save page.</p><button class="btn sm" data-a="codexGo" data-k="save">Open 💾 Save</button>
  <p class="small muted">Lanternfall v${UI.version} · played ${fmtTime(S.stats.play)} · ${S.stats.wins} wins · ${S.stats.losses} falls · ${S.stats.departs} expeditions</p></div>`; }

/* ---------------- pulls ---------------- */
function pullAnim(res, b){
  const top=Math.max(...res.map(x=>x.r)); const B=D.BANNERS[b];
  const cards=res.map((x,i)=>{ const it=D.ITEM[x.id]; const st=scaledStats(it.stats,x.r); return `<div class="pcard r${x.r}" style="animation-delay:${.9+i*.15}s"><div class="pci">${it.icon}</div><div class="pcn">${esc(it.name)}</div><div class="pcr">${D.RARITY[x.r].name}</div><div class="pcs">${statLine(st)}</div><div class="pck">${it.skills.map(s=>skillName(s)).join('<br>')}</div>${x.isNew?'<div class="pnew">NEW</div>':''}</div>`; }).join('');
  modal(`<div class="pullfx r${top}"><div class="orb">${B.icon}</div><div class="pcards n${res.length}">${cards}</div>
    <div class="pfoot" style="animation-delay:${1+res.length*.15}s"><button class="btn go" data-a="closeModal">Nice!</button><button class="btn sm" data-a="autoEquipClose">Equip new-skill gear</button></div></div>`, 'pullmodal'); }

/* ---------------- save safety: codes, backups, Home Screen, persistent storage ---------------- */
const DAY=864e5, A2HS_KEY='lanternfall.a2hs', A2HS_RESHOW=3*DAY, NUDGE_EVERY=3*DAY;
G.persist={supported:!!(navigator.storage&&navigator.storage.persist), granted:null};
function requestPersist(){ if(!G.persist.supported) return Promise.resolve(false);
  return navigator.storage.persisted().then(p=>p||navigator.storage.persist()).then(r=>{ G.persist.granted=!!r; return !!r; }).catch(()=>false); }
const envIOS=()=>{ const ua=navigator.userAgent||''; return /iPhone|iPad|iPod/.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1); };
// Safari on iOS defines navigator.standalone: false in a browser tab, true when opened from the Home Screen
const envSafariTab=()=>envIOS() && navigator.standalone===false && !(window.matchMedia && matchMedia('(display-mode: standalone)').matches);
function a2hsState(){ try{ return JSON.parse(localStorage.getItem(A2HS_KEY)||'{}')||{}; }catch(e){ return {}; } }
function a2hsSet(st){ try{ localStorage.setItem(A2HS_KEY, JSON.stringify(st)); }catch(e){} }
// pure decision, unit-tested: {safariTab, now, st:{dismissedAt}} -> 'full' | 'gentle' | null
function a2hsDecision(env){ if(!env.safariTab) return null; const st=env.st||{}; if(!st.dismissedAt) return 'full'; return env.now-st.dismissedAt>=A2HS_RESHOW ? 'gentle' : null; }
function relTime(t){ if(!t) return 'never'; const d=Date.now()-t; return d<60e3?'just now':d<36e5?Math.floor(d/6e4)+' min ago':d<DAY?Math.floor(d/36e5)+' h ago':Math.floor(d/DAY)+' days ago'; }
const SHARE_ICON='<svg class="shareic" viewBox="0 0 20 24" aria-label="Share"><path d="M10 2v13M5.5 6.5 10 2l4.5 4.5M6 10H3v12h14V10h-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function a2hsSteps(){ return `<ol class="a2steps"><li>Tap <b>Share</b> ${SHARE_ICON} in Safari's toolbar.</li><li>Scroll down and choose <b>Add to Home Screen</b>.</li><li>Open Lanternfall from its new 🏮 icon.</li></ol>`; }
function renderA2HS(){ const el=$('#a2hs'); if(!el) return;
  const mode = G.loadFailed ? null : (UI.a2hsForce || a2hsDecision({safariTab:envSafariTab(), now:Date.now(), st:a2hsState()}));
  if(!mode || UI.a2hsHidden){ el.className='hidden'; setHTML(el,''); return; }
  const started=G.S&&G.S.started;
  el.className='parch a2hs '+mode;
  if(mode==='gentle' && !UI.a2hsOpen) setHTML(el, `<div class="a2row"><img src="art/apple-touch-icon.png" alt=""><span>📲 Add Lanternfall to your Home Screen so Safari can't clear your save.</span><button class="btn sm" data-a="a2hsOpen">How?</button><button class="mclose" data-a="a2hsLater" aria-label="Dismiss">✕</button></div>`);
  else setHTML(el, `<button class="mclose" data-a="a2hsLater" aria-label="Dismiss">✕</button><div class="a2row"><img src="art/apple-touch-icon.png" alt=""><div><h3>Keep your journey safe</h3>
    <p class="small">Safari may erase a website's saved data after about 7 days without a visit. On your Home Screen, Lanternfall runs as its own app and keeps its save.</p></div></div>${a2hsSteps()}
    ${started?`<p class="small"><b>Your save doesn't move by itself.</b> The Home Screen app has its own storage. Copy your save code first, then in the app choose <b>Paste a save code</b>.</p><div class="row gap"><button class="btn go" data-a="copyCode">📋 Copy save code</button><button class="btn" data-a="a2hsLater">Not now</button></div>`
      :`<div class="row gap"><button class="btn" data-a="a2hsLater">Not now</button></div>`}`); }
function nudgeDue(){ const S=G.S; if(!S||!S.started||G.loadFailed) return false; const f=S.flags||{};
  const last=Math.max(f.lastCopy||0, f.nudgeSnooze||0, S.created||0); return S.stats.play>=1800 && Date.now()-last>=NUDGE_EVERY; }
function renderNudge(){ const el=$('#nudge'); if(!el) return; if(!nudgeDue()){ el.className='hidden'; setHTML(el,''); return; }
  const f=G.S.flags; el.className='parch nudge';
  setHTML(el, `<span>💾 ${f.lastCopy?`It's been ${relTime(f.lastCopy).replace(' ago','')} since you copied your save code.`:"You haven't copied your save code yet."} Keep a copy somewhere safe.</span><div class="row gap"><button class="btn sm go" data-a="copyCode">📋 Copy code</button><button class="btn sm" data-a="nudgeLater">Later</button></div>`); }
function copyText(t){ const fallback=()=>{ const ta=document.createElement('textarea'); ta.value=t; ta.setAttribute('readonly',''); ta.style.cssText='position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0,t.length); let ok=false; try{ ok=document.execCommand('copy'); }catch(e){} ta.remove(); return ok; };
  try{ if(navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(()=>true, ()=>fallback()); }catch(e){}
  return Promise.resolve(fallback()); }
function codeModal(code, title, note){ modal(`<h2>${title}</h2><p class="small muted">${note}</p><textarea id="exp" readonly>${esc(code)}</textarea><div class="row gap"><button class="btn sm go" data-a="copyExp">📋 Copy</button></div>`);
  setTimeout(()=>{ const t=$('#exp'); if(t){ t.focus(); t.select(); } },50); }
function backupRows(onFail){ const list=listBackups(); if(!list.length) return '<p class="small muted">No backups yet. One is made every 10 minutes of play and once a day.</p>';
  return list.map(b=>`<div class="srow bak ${b.ok?'':'dim'}"><span class="grow"><b>${esc(b.label)}</b> <small class="muted">${b.at?relTime(b.at):''}</small><div class="small">${esc(b.ok?b.sum:'Can\'t be restored: '+b.err)}</div></span>${b.ok?`<button class="btn sm ${onFail?'go':''}" data-a="${onFail?'restoreDo':'restoreAsk'}" data-k="${esc(b.key)}">Restore</button>`:''}</div>`).join(''); }
function saveHtml(){ const S=G.S, f=S.flags||{}; const pst=G.persist; const ios=envIOS(), tab=envSafariTab(), standalone=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
  return `<div class="parch card savecode"><h3>💾 Your save code</h3><p class="small">Your game is stored in this browser. A save code is a copy of it you can keep anywhere (Notes, a message to yourself) and paste back to restore your game, on this device or another.</p>
    <button class="btn go big" data-a="copyCode">📋 Copy save code</button><p class="small muted">Last copied: ${relTime(f.lastCopy)}</p>
    <div class="row gap wrap"><button class="btn sm" data-a="exportSave">Show the code</button><button class="btn sm" data-a="importOpen">Paste a save code</button></div></div>
  <div class="parch card"><h3>🛡️ Protection</h3>
    <div class="srow"><span class="grow"><b>Storage</b><div class="small">${!pst.supported?'This browser can’t mark storage as persistent. Keep your save code handy.':pst.granted?'<span class="ok">Persistent ✓</span> The browser has agreed not to clear it on its own.':'Not marked persistent yet. The browser decides; keep your save code handy.'}</div></span></div>
    ${ios?`<div class="srow"><span class="grow"><b>Home Screen</b><div class="small">${standalone?'<span class="ok">Running from the Home Screen ✓</span>':tab?'In a Safari tab, Safari may clear the save after 7 days without a visit.':'Open Lanternfall in Safari to add it to your Home Screen.'}</div></span>${tab?'<button class="btn sm" data-a="a2hsShow">How to add</button>':''}</div>`:''}
    <div class="srow"><span class="grow"><b>Backups</b><div class="small">The last 3 autosave backups (one every 10 minutes of play) plus one daily backup are kept in this browser.</div></span></div></div>
  <div class="parch card"><h3>🗂️ Backups</h3>${backupRows(false)}</div>
  <div class="parch card"><h3>Hard reset</h3><p class="small">Deletes this game and starts over. A copy is kept as a “Before the last hard reset” backup.</p><button class="btn sm danger" data-a="resetAsk">Hard reset…</button></div>`; }
function renderLoadFailed(){ const L=G.loadFailed; const v=$('#view'); const broken=L.reason==='broken';
  setHTML($('#res'),''); setHTML($('#nav'),''); $('#hint').style.display='none';
  setHTML(v, `<div class="loadfail"><div class="parch card"><h1>⚠️ ${broken?'Your save couldn’t load':'We couldn’t find your save'}</h1>
    <p>${broken?`Something in the saved game is damaged (<i>${esc(L.msg)}</i>). Nothing has been deleted: the damaged save is kept safely in this browser.`:'The main save is missing, but a backup was found in this browser.'}</p></div>
    <div class="parch card"><h3>Restore a backup</h3>${backupRows(true)}</div>
    <div class="parch card"><h3>Other options</h3><div class="row gap wrap">${broken?'<button class="btn" data-a="exportBroken">Export the damaged save</button>':''}<button class="btn" data-a="importOpen">Paste a save code</button></div>
      <details class="small"><summary>Start a new game instead</summary><p>${broken?'The damaged save stays in this browser as a backup copy.':''} Your backups are kept too.</p><button class="btn sm danger" data-a="freshAfterFail">Start a new game</button></details></div></div>`); }

/* ---------------- render ---------------- */
const VIEWS={town:viewTown, map:viewMap, camp:viewCamp, party:viewParty, codex:viewCodex};
function renderView(force){
  const S=G.S, v=$('#view'); if(!S.started) return;
  document.body.dataset.tab=UI.tab;
  if(UI.tab==='camp' && S.loc==='exp'){ guard('battle', renderBattle, v); return; }
  if(v.querySelector('.battle')){ v.innerHTML=''; v._h=null; }
  const html=guard(UI.tab, ()=>VIEWS[UI.tab](), v); if(html!=null) setHTML(v, html);
  UI.lastPanel=Date.now(); }
function renderAll(){
  const S=G.S; document.body.classList.toggle('started', !!S.started && !G.loadFailed);
  guard('a2hs', renderA2HS); guard('nudge', renderNudge);
  if(G.loadFailed){ renderLoadFailed(); return; }
  if(!S.started){ renderTop(); setHTML($('#nav'),''); $('#hint').style.display='none'; if(!$('.create')) renderCreate(); return; }
  if($('.create')) $('#view').innerHTML='';
  guard('top', renderTop); guard('hint', renderHint); guard('nav', renderNav); renderView();
}

/* ---------------- actions ---------------- */
const ACT = {
  tab(d){ UI.tab=d.t; if(d.t==='town' && UI.tab==='town') {} window.scrollTo(0,0); if(d.t!=='town') UI.place=UI.place; },
  place(d){ UI.place=d.p||null; UI.placeTab=null; UI.tab='town'; window.scrollTo(0,0); },
  ptab(d){ UI.placeTab=d.k; },
  hero(d){ UI.sel=+d.i; UI.tab='party'; UI.heroTab='overview'; },
  sel(d){ UI.sel=+d.i; UI.node=null; UI.jobView=null; UI.gearSlot=null; },
  htab(d){ UI.heroTab=d.k; UI.node=null; },
  cview(d){ UI.codex=d.v; }, codexGo(d){ UI.tab='codex'; UI.codex=d.k; },
  toggle(d){ UI.open[d.k] = UI.open[d.k]===false; },
  mapSel(d){ UI.mapSel=+d.z; },
  depart(d){ if(depart(+d.z, false)){ UI.mapSel=+d.z; UI.tab='camp'; window.scrollTo(0,0); } else G.toast(canDepart().why||'Cannot set out','bad'); },
  departBoss(d){ if(challengeBoss(+d.z)){ UI.tab='camp'; window.scrollTo(0,0); } },
  boss(d){ if(challengeBoss(+d.z)) G.toast('👑 The boss will be the next fight.','good'); },
  home(){ goHome('manual'); UI.tab='camp'; },
  act(d){ if(!setAct(+d.i, d.v)) G.toast('Not available yet.','bad'); },
  hire(){ if(!hire()) G.toast('Not enough gold — fight more!','bad'); },
  work(d){ if(!assign(d.p, +d.d)) G.toast('No free worker. Hire one at the Town Hall.','bad'); },
  build(d){ if(!build(d.b)) G.toast('Missing materials or gold.','bad'); },
  pull(d){ const r=pull(d.b, +d.n); if(!r){ G.toast('Not enough 💎. Put a worker on Mining.','bad'); return; } save(); pullAnim(r, d.b); },
  autoEquipClose(){ closeModal(); const n=autoEquipLearn(); G.toast(n?`Equipped ${n} item${n>1?'s':''} with new skills.`:'Nothing new to equip.'); },
  fuse(d){ const nu=fuse(d.id, +d.r); if(nu) G.toast(`⚒️ Fused into ${D.RARITY[nu.r].name} ${D.ITEM[d.id].name}!`,'good'); },
  shopSel(d){ UI.shopSel=d.id; },
  buy(d){ if(buyItem(d.id)) G.toast(`Bought ${D.ITEM[d.id].icon} ${D.ITEM[d.id].name}. Equip it in Party → Gear.`,'good'); else G.toast('Not enough gold.','bad'); },
  sell(d){ const g=sellItem(+d.uid); if(g) G.toast(`Sold for ${g} gold.`); },
  sellMastered(){ const r=bulkSellMastered(); G.toast(`Sold ${r.n} mastered item${r.n===1?'':'s'} for ${r.g} gold.`,'good'); },
  sellGems(){ const g=sellMats(); G.toast(g?`Sold gems for ${g} gold.`:'No gems to sell.'); },
  jobView(d){ UI.jobView=d.j; UI.node=null; },
  node(d){ UI.node = UI.node===d.n ? null : d.n; },
  buyNode(d){ if(!buyNode(UI.sel, UI.jobView, d.n)) G.toast('Not yet.','bad'); },
  lock(d){ if(setLock(UI.sel, UI.jobView, d.n||null)) G.toast(d.n?`🔒 Locked in ${D.JOBS[UI.jobView].node[d.n].name}. Kept after switching jobs.`:'Lock-in released.','good'); },
  setJob(d){ if(setJob(UI.sel, d.j||null)) G.toast(`${G.S.chars[UI.sel].name} is now a ${D.JOBS[d.j].name}.`,'good'); },
  setSub(d){ if(setSub(UI.sel, d.j||null)) G.toast(d.j?`Subjob: ${D.JOBS[d.j].name}`:'Subjob removed'); },
  gslot(d){ UI.gearSlot = UI.gearSlot===d.s ? null : d.s; },
  equip(d){ equip(UI.sel, +d.uid); UI.gearSlot=null; },
  unequip(d){ unequip(UI.sel, d.s); },
  beast(d){ const f=findEnemy(d.e); if(!f) return; const {e, zi}=f; const k=G.S.bestiary[e.id]||0; const t=beastTier(e.id); const st=enemyStats(e, zi); const seen=k>0||(e.boss&&G.S.zones[zi].bossKills);
    modal(`<div class="beastpop"><img src="${enemyImg(e.id)}" alt="" class="${seen?'':'unseen'}"><h2>${seen?esc(e.name):'???'}</h2><p class="small">${esc(D.ZONES[zi].name)}${e.boss?' · boss':''} · ${k} kills</p>
      ${t>=1||e.boss&&seen?`<p>HP ${st.hp} · ATK ${st.atk} · DEF ${st.def} · AGI ${st.agi}</p>`:'<p class="muted small">Stats shown at tier 1 (10 kills, Library Lv 1).</p>'}${t>=2?`<p>Weak to ${D.ELEMENTS[e.weak]||'—'}</p>`:''}
      <table class="rates">${D.BEAST_TIERS.slice(1).map((T,i)=>`<tr class="${t>i?'ok':''}"><td>${t>i?'✓':''}</td><td>${T.kills} kills</td><td>Library ${T.lib}</td><td class="small">${esc(T.label)}${T.dia?` · +${T.dia}💎`:''}</td></tr>`).join('')}</table>
      ${!e.boss?`<p class="small">✨ Gilded variant: ${G.S.variants[e.id]?'<b class="ok">defeated</b>':'not yet seen'} (×2 HP, ×3 XP and gold).</p>`:''}<button class="btn" data-a="closeModal">Close</button></div>`); },
  matInfo(d){ const m=d.m, M=D.MATS[m]; const src=matSources(m);
    modal(`<h2>${M.icon} ${esc(M.name)}</h2><p>You have <b>${G.S.mats[m]||0}</b>.</p><p class="muted">${esc(M.desc)}</p><h3>Where to get it</h3><ul>${src.map(s=>`<li>${esc(s.text)}</li>`).join('')||'<li>—</li>'}</ul><h3>Used for</h3><p>${matUses(m).map(esc).join(' · ')||'—'}</p><button class="btn" data-a="place" data-p="hall">🏛️ Assign a worker</button>`); },
  itemInfo(d){ const it=D.ITEM[d.id]; if(!it) return;
    modal(`<h2>${it.icon} ${esc(it.name)}</h2><p>${D.SLOT_NAMES[it.slot]} · ${statLine(it.stats)} (Common; higher rarities scale stats)</p><h3>Skills</h3>${it.skills.map(s=>`<p><b>${skillName(s)}</b> (${D.SKILLS[s].ap} AP): ${esc(D.SKILLS[s].desc)}<br><small class="muted">Learned by: ${G.S.chars.filter(c=>c.learned[s]).map(c=>esc(c.name)).join(', ')||'nobody yet'}</small></p>`).join('')}<h3>Where it comes from</h3><ul>${itemSources(it.id).map(s=>`<li>${esc(s.text)}</li>`).join('')}</ul><p class="small">Owned: ${G.S.inv.filter(u=>u.id===it.id).length}</p>`); },
  closeModal(){ closeModal(); },
  tutSkip(){ G.S.flags.tutDone=1; }, tutReset(){ G.S.flags.tutDone=0; G.toast('The guide is back.'); },
  exportSave(){ codeModal(exportSave(), '💾 Save code', 'Copy this text and keep it somewhere safe. Paste it back with “Paste a save code”.'); },
  exportBroken(){ codeModal(encodeRaw(G.loadFailed.raw), 'Damaged save', 'This is the save that failed to load, as a code. Keep it in case it can be repaired.'); },
  copyExp(){ const t=$('#exp'); t.select(); copyText(t.value).then(ok=>{ if(ok){ if(G.S.started&&!G.loadFailed){ G.S.flags.lastCopy=Date.now(); save(); } G.toast('📋 Copied!','good'); } else G.toast('Select the text and copy it.'); }); },
  copyCode(){ const code=exportSave(); copyText(code).then(ok=>{ if(ok){ G.S.flags.lastCopy=Date.now(); save(); G.toast('📋 Save code copied. Paste it somewhere safe (Notes works).','good'); renderAll(); } else codeModal(code, '💾 Save code', 'Copying was blocked. Select the text below and copy it.'); }); },
  nudgeLater(){ G.S.flags.nudgeSnooze=Date.now(); },
  a2hsLater(){ a2hsSet(Object.assign(a2hsState(), {dismissedAt:Date.now(), n:(a2hsState().n||0)+1})); UI.a2hsForce=null; UI.a2hsOpen=false; UI.a2hsHidden=true; },
  a2hsOpen(){ UI.a2hsOpen=true; }, a2hsShow(){ UI.a2hsForce='full'; UI.a2hsOpen=true; UI.a2hsHidden=false; },
  restoreAsk(d){ modal(`<h2>Restore this backup?</h2><p>Your current game is kept as the “Before the last restore” backup, so you can switch back.</p><div class="row gap"><button class="btn go" data-a="restoreDo" data-k="${esc(d.k)}">Restore</button><button class="btn" data-a="closeModal">Cancel</button></div>`); },
  restoreDo(d){ try{ restoreBackup(d.k); closeModal(); UI.tab='town'; UI.place=null; UI.battleKey=null; $('#view').innerHTML=''; G.toast('Backup restored.','good'); }catch(e){ G.toast('Could not restore: '+e.message,'bad'); } },
  freshAfterFail(){ startFreshAfterFail(); $('#view').innerHTML=''; },
  importOpen(){ modal(`<h2>Import save</h2><p class="muted small">Paste a v2 save. This replaces your current game.</p><textarea id="imp" placeholder="Paste save here"></textarea><div class="row"><button class="btn sm go" data-a="importDo">Import</button></div><p id="imperr" class="short"></p>`); },
  importDo(){ try{ importSave($('#imp').value); closeModal(); G.toast('Save imported!','good'); UI.battleKey=null; UI.tab='town'; UI.place=null; $('#view').innerHTML=''; }catch(e){ $('#imperr').textContent=e.message; } },
  resetAsk(){ modal(`<h2>Hard reset?</h2><p>This deletes your party, town and everything else. A copy is kept as a backup in this browser, but copy your save code first if you might want it back.</p><p>Type <b>RESET</b> to confirm.</p><input id="resetTxt" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="RESET" aria-label="Type RESET"><p id="reseterr" class="short small"></p><div class="row gap"><button class="btn danger" data-a="resetDo">Delete everything</button><button class="btn" data-a="closeModal">Cancel</button></div>`); setTimeout(()=>{ const i=$('#resetTxt'); if(i) i.focus(); },50); },
  resetDo(){ const v=(($('#resetTxt')||{}).value||'').trim(); if(v!=='RESET'){ $('#reseterr').textContent='Type RESET (in capitals) to confirm.'; return; } hardReset(); closeModal(); UI.tab='town'; UI.place=null; $('#view').innerHTML=''; save(); },
  crace(d){ syncNames(); CREATE[+d.i].race=d.r; renderCreate(); },
  rname(d){ syncNames(); const pool=NAMES.filter(n=>!CREATE.some(x=>x.name===n)); CREATE[+d.i].name=pool[Math.floor(Math.random()*pool.length)]; renderCreate(); },
  begin(){ syncNames(); createParty(CREATE); requestPersist(); UI.tab='town'; UI.place=null; save(); $('#view').innerHTML='';
    modal(`<h2>🏮 Welcome to Lanternfall</h2><p>Your companions have arrived. Nothing will attack you here.</p><p>Look around the town first: put your one worker to work at the 🏛️ Town Hall, then tap the 🔥 campfire when you are ready to set out.</p><button class="btn go" data-a="closeModal">Explore the town</button>`); },
};
function syncNames(){ CREATE.forEach((x,i)=>{ const el=$('#cn'+i); if(el) x.name=el.value.trim()||x.name; }); }
document.addEventListener('click', e=>{
  const t=e.target.closest('[data-a]'); if(!t || t.disabled) return;
  const a=t.dataset.a; if(!ACT[a]) return; e.preventDefault();
  try{ ACT[a](t.dataset); }catch(err){ console.error(err); G.toast('Oops: '+err.message,'bad'); }
  save(); renderAll(); });
document.addEventListener('change', e=>{ const el=e.target, ds=el.dataset||{};
  if(ds.set){ G.S.settings[ds.set]=el.checked; save(); }
  if(ds.sel==='act' && el.value){ if(!setAct(+ds.i, el.value)) G.toast('Not available.','bad'); save(); renderAll(); }
  if(ds.sel==='zone'){ UI.mapSel=+el.value; renderAll(); } });
$('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });
document.addEventListener('pointerdown', ()=>{ UI.pointer=true; }, {passive:true});
document.addEventListener('pointerup', ()=>{ setTimeout(()=>UI.pointer=false, 250); }, {passive:true});
document.addEventListener('pointercancel', ()=>{ UI.pointer=false; }, {passive:true});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

/* ---------------- loop ---------------- */
let lastT=Date.now(), lastSave=Date.now(), lastBattleDraw=0;
function welcomeBack(sum){
  if(!sum || sum.sec<60) return;
  const mats=Object.entries(sum.mats).map(([m,n])=>m==='diamond'?'':`${D.MATS[m]?D.MATS[m].icon:''} ${n}`).join(' ');
  const home = sum.home==='wipe'?'The party fell and was carried home to rest.':sum.home==='tired'?'The party ran out of stamina and came home to rest.':'';
  modal(`<h2>🌙 Welcome back</h2><p class="muted">You were away ${fmtTime(sum.sec)}${sum.sec>=OFFLINE_CAP?' (12 h max)':''}.</p>
    <ul class="wb">${sum.battles?`<li>⚔️ ${sum.wins} battles won (${fmtTime(sum.fightSec)} of fighting)</li><li>🪙 +${sum.gold} gold · ✨ +${sum.xp} XP</li>`:''}${home?`<li>🏠 ${home}</li>`:''}${sum.diamonds?`<li>💎 +${sum.diamonds} Diamonds</li>`:''}
    ${sum.levels?`<li>⬆️ ${sum.levels} level-ups</li>`:''}${sum.learned.length?`<li>🎉 Learned: ${sum.learned.map(esc).join(', ')}</li>`:''}${sum.items.length?`<li>🏘️ Town made: ${sum.items.map(esc).join(', ')}</li>`:''}
    ${sum.profUps?`<li>🏘️ ${sum.profUps} profession level-ups</li>`:''}${mats.trim()?`<li>🧱 Gathered: ${mats}</li>`:''}${sum.meals?`<li>🍲 ${sum.meals} meals cooked</li>`:''}</ul><button class="btn go" data-a="closeModal">Continue</button>`); }
function newJourney(){ modal(`<h2>🏮 A new journey</h2><p>Lanternfall has been rebuilt from the ground up: a slower, deeper adventure with a town to grow, mentors, stamina and job grids.</p><p>Your old save could not carry over, so this is a fresh start. (A copy of it is kept in this browser.)</p><button class="btn go" data-a="closeModal">Begin</button>`); }
function loop(){
  const now=Date.now(); let dt=now-lastT; lastT=now;
  try{ if(dt>15000){ const sum=offline(dt/1000); welcomeBack(sum); UI.battleKey=null; } else tick(dt); }catch(e){ console.error('tick', e); }
  if(now-lastSave>5000){ save(); lastSave=now; }
  if(!G.S.started) return;
  if(UI.tab==='camp' && G.S.loc==='exp'){ if(now-lastBattleDraw>120 && !UI.pointer){ guard('battle', renderBattle, $('#view')); lastBattleDraw=now; } }
  else { G.ev.length=0; if(UI.tab==='camp' && $('#view .battle')) renderView(); }
  guard('top', renderTop);
  if(now-UI.lastPanel>1000 && !UI.pointer && !UI.modalOpen && !(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))){ guard('nav', renderNav); guard('hint', renderHint); guard('nudge', renderNudge); if(!(UI.tab==='camp'&&G.S.loc==='exp')) renderView(); else UI.lastPanel=now; }
}
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) save(); else loop(); });
window.addEventListener('pagehide', save);

/* test-only hooks (used by the headless tests; not exposed in the UI) */
window.__debug = {
  battles(n){ const q=G.quiet; G.quiet=true; try{ for(let b=0;b<n && G.S.loc==='exp';b++){ let g=0; do{ step(); }while(G.S.battle && g++<600); } } finally{ G.quiet=q; } save(); renderAll(); },
  fight(n){ return this.battles(n); },
  town(sec){ const q=G.quiet; G.quiet=true; try{ let l=sec; while(l>0){ const c=Math.min(10,l); tickProfs(c); tickTown(c); l-=c; } } finally{ G.quiet=q; } save(); renderAll(); },
  give(o){ const S=G.S; if(o.gold) S.gold+=o.gold; if(o.diamonds) S.diamonds+=o.diamonds; if(o.mats) for(const m in o.mats) S.mats[m]=(S.mats[m]||0)+o.mats[m]; if(o.items) o.items.forEach(([id,r])=>addItem(id,r)); dirty(); save(); renderAll(); },
  away(sec){ save(); G.S.last=Date.now()-sec*1000; localStorage.setItem(SAVE_KEY, JSON.stringify(G.S)); G.noSave=true; },
  ui: UI, render: ()=>renderAll(), a2hsDecision, envSafariTab, nudgeDue, listBackups,
};

load();
if(G.S.started){ const away=(Date.now()-(G.S.last||Date.now()))/1000; if(away>60){ const sum=offline(away); setTimeout(()=>welcomeBack(sum), 300); } }
if(G.S.loc==='exp'){ G.S.battle=null; if(G.S.started) UI.tab='camp'; } // a reload starts a fresh fight
requestPersist().then(()=>{ if(UI.tab==='codex') renderAll(); });
renderAll();
if(G.newJourney) setTimeout(newJourney, 200);
setInterval(loop, 100);
