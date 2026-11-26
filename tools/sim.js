// Pacing sim: models real play time to each milestone using the real engine and the real 1.2 s/action battle pace.
//   node tools/sim.js active [hours]      — plays non-stop: sets out again as soon as the party has rested
//   node tools/sim.js regular [days]      — 3 sessions a day (20 + 30 + 45 min), offline in between (offline rules apply)
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={console,Math,localStorage:{getItem(){return null},setItem(){},removeItem(){}}};vm.createContext(ctx);
const R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
vm.runInContext(R('data.js')+R('engine.js')+';this.G=G;this.D=D;this.PACE=PACE;this.dirty=dirty;this.OFFLINE_CAP=OFFLINE_CAP;',ctx);
const F=ctx, {G,D}=ctx;
const MODE=process.argv[2]||'active', SPAN=+process.argv[3]||(MODE==='active'?30:12);
const races=(process.argv[4]||'human,elf,dwarf').split(',');
G.S=F.newState(); G.quiet=true; F.dirty();
F.createParty(races.map((r,i)=>({name:'P'+i,race:r})));
let t=0; const ms={}; const mark=(k,extra)=>{ if(ms[k]==null){ ms[k]=t; } };
const fmt=s=>{ const h=s/3600; return h<1? (s/60).toFixed(0)+' min' : h<48? h.toFixed(1)+' h' : (h/24).toFixed(1)+' days'; };
function minLv(zi){ return +D.ZONES[zi].lv.split('–')[0]; }
function avgLv(){ const S=G.S; return S.chars.reduce((a,c)=>a+c.lv,0)/S.chars.length; }
let bossFails={};
function manage(inSession){
  const S=G.S;
  // workers
  const order=['mining','foraging','masonry','smithing','foraging','cooking','scholarship','banking','mining','foraging'];
  if(S.buildings.tavern<1) order.splice(order.indexOf('cooking'),1);
  if(S.buildings.library<1) order.splice(order.indexOf('scholarship'),1);
  if(S.gold>=(F.hireCost()||1e9)*1.2 && S.hired<6) F.hire();
  S.workers={}; for(let i=0;i<S.hired;i++){ const p=order[i]||'mining'; S.workers[p]=(S.workers[p]||0)+1; }
  for(const b of ['training','forge','tavern','library','market','chapel','arcanum','den','lodge']) F.build(b);
  let k=0; while(S.diamonds>=D.PULL_COST){ const bs=D.BANNER_ORDER.filter(b=>S.buildings[b]); if(!F.pull(bs[(k++ + S.stats.pulls)%bs.length],1)) break; mark('first pull'); }
  for(const u of [...S.inv]) if(F.equippedBy(u.uid)<0 && F.isMastered(u)) F.sellItem(u.uid); F.sellMats();
  for(const f of F.fusable()) if(f.ok) F.fuse(f.id,f.r);
  F.autoEquipLearn();
  S.chars.forEach((c,ci)=>{
    const rel=S.inv.find(u=>u.relic&&F.equippedBy(u.uid)<0); if(rel&&!c.equip.relic) F.equip(ci,rel.uid);
    const want=D.JOB_ORDER.filter(j=>F.jobUnlocked(c,j)); const best=want.filter(j=>D.JOBS[j].adv)[0]||want[0];
    if(best && c.job!==best && (!c.job || D.JOBS[best].adv && !D.JOBS[c.job].adv)) { if(c.job){ const l=F.lockable(c,c.job)[0]; if(l) F.setLock(ci,c.job,l.id); } F.setJob(ci,best); mark('first job'); }
    if(c.job){ let go=true; while(go){ go=false; const nodes=D.JOBS[c.job].nodes.filter(n=>F.nodeAvailable(c,c.job,n).ok).sort((a,b)=>a.cost-b.cost); if(nodes[0]){ F.buyNode(ci,c.job,nodes[0].id); go=true; } } }
    const subs=D.JOB_ORDER.filter(j=>F.subjobOk(c,j)); if(subs.length && !c.sub) F.setSub(ci,subs[0]);
  });
}
function townActs(longAway){ const S=G.S; S.chars.forEach((c,ci)=>{
  if(!longAway){ c.act='rest'; return; }
  // away for a while: study with a mentor or train endurance
  const ms_=D.MENTORS.filter(m=>F.mentorAvailable(m.id) && F.mentorRank(c,m.id)<D.MENTOR_MAX);
  if(ci===0 && c.endLv<F.enduranceCap()) c.act='train'; else if(ms_.length) F.setAct(ci,'m:'+ms_[ci%ms_.length].id); else if(c.endLv<F.enduranceCap()) c.act='train'; else c.act='rest'; }); }
function pickZone(){ const S=G.S; let z=0; for(let i=0;i<D.ZONES.length;i++){ if(F.zoneOpen(i) && avgLv()>=minLv(i)) z=i; } return z; }
function tryDepart(){
  const S=G.S; if(S.loc!=='town') return;
  const full=S.chars.every(c=>c.stam>=F.maxStam(c)-0.01);
  if(!full) return;
  const z=pickZone(); const open=S.zones.findIndex(x=>!x.boss); const bz=open<0?-1:open;
  if(bz>=0 && F.bossReady(bz) && (bossFails[bz]||0)*1 <= (S.stats.wins - (bossFails['w'+bz]||0))/40 && avgLv()>=minLv(bz)+1){ F.depart(bz,true); }
  else F.depart(z);
  manage(true);
}
const STEP=5;
function advance(sec, online){
  const S=G.S; const end=t+sec;
  while(t<end){
    if(S.loc==='exp'){
      const z=S.zone; const wasBoss=S.pendingBoss;
      const w=F.step()||F.PACE.action; const dt=w/1000; t+=dt; S.stats.play+=dt; F.tickProfs(dt);
      if(S.stats.wins>=1) mark('first win'); if(S.stats.learned>=1) mark('first skill learned');
      if(S.loc==='town'){ manage(online); if(S.lastExp && S.lastExp.reason==='wipe'){ const bz=S.zones.findIndex(x=>!x.boss); bossFails[bz]=(bossFails[bz]||0)+1; bossFails['w'+bz]=S.stats.wins; } if(!online) townActs(true); }
    } else {
      F.tickProfs(STEP); F.tickTown(STEP); t+=STEP; S.stats.play+=STEP;
      if(online){ if(Math.floor(t/60)!==Math.floor((t-STEP)/60)) manage(true); tryDepart(); }
    }
    S.zones.forEach((z,i)=>{ if(z.boss) mark(`zone ${i+2} open (${D.ZONES[i+1]?D.ZONES[i+1].name:'END'})`); });
    const lv=avgLv(); for(const L of [5,10,15,20]) if(lv>=L) mark('party avg Lv '+L);
    if(S.hired>=2) mark('2nd worker hired'); if(S.hired>=3) mark('3rd worker hired');
    if(S.stats.learned>=3) mark('3 skills learned'); if(S.stats.learned>=10) mark('10 skills learned');
    if(S.chars.some(c=>c.sub)) mark('first subjob'); if(S.chars.some(c=>c.job&&D.JOBS[c.job].adv)) mark('first advanced job');
    if(S.stats.relics>=1) mark('first relic (zone collection)');
  }
}
const sessions=[[8*3600,20*60],[12.5*3600,30*60],[20*3600,45*60]];
if(MODE==='active'){ advance(SPAN*3600, true); }
else { for(let d=0; d<SPAN; d++){ for(const [st,len] of sessions){ const s=d*86400+st; if(t<s){ // offline gap: one shot like the real game
        const gap=s-t; const S=G.S; G.quiet=true; const sum=F.offline(Math.min(gap, F.OFFLINE_CAP)); t+=Math.min(gap,F.OFFLINE_CAP); if(gap>F.OFFLINE_CAP){ t=s; }
        manage(true); }
      advance(len, true); // play the session
      // leaving: set out if possible, and leave town activities on
      const S=G.S; if(S.loc==='town'){ const ok=F.canDepart().ok; if(ok) F.depart(pickZone()); } townActs(true);
    } } }
const S=G.S;
console.log(`== ${MODE} player, ${MODE==='active'?SPAN+' h non-stop':SPAN+' days × 3 sessions (95 min/day)'} — party ${races.join('/')} ==`);
Object.entries(ms).sort((a,b)=>a[1]-b[1]).forEach(([k,v])=>console.log(('  '+fmt(v)).padEnd(12), k));
const W=S.stats.wins||1;
console.log(`  end: wins ${S.stats.wins} (losses ${S.stats.losses}), avg ${(S.stats.rounds/W).toFixed(1)} rounds/battle, party Lv ${S.chars.map(c=>c.lv)}, zone ${S.zones.findIndex(z=>!z.boss)+1}, gold ${S.gold}, 💎 earned ${S.stats.diamondsEarned}, pulls ${S.stats.pulls}, workers ${S.hired}, items ${S.inv.length}`);
console.log(`  jobs ${S.chars.map(c=>c.job+'/'+c.sub)} learned ${S.chars.map(c=>Object.keys(c.learned).length)} buildings ${JSON.stringify(S.buildings)} profs ${D.PROF_ORDER.map(p=>p+':'+S.profs[p].lv).join(' ')} endurance ${S.chars.map(c=>c.endLv)}`);
