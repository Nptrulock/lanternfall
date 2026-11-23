// Headless balance sim: node tools/sim.js [hours] [races]
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={console,Math,localStorage:{getItem(){return null},setItem(){},removeItem(){}}};vm.createContext(ctx);
const R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
vm.runInContext(R('data.js')+R('engine.js')+';this.G=G;this.D=D;',ctx);
const F=ctx, {G,D}=ctx;
G.S=F.newState(); G.quiet=true;
const races=(process.argv[3]||'human,elf,dwarf,halfling').split(',');
F.createParty(races.map((r,i)=>({name:'P'+i,race:r})));
const HOURS=+process.argv[2]||10; let t=0, battles=0; const out=[];
const hits={}; const _log=F.log; F.log=(m,c)=>{ const x=/(attacks|strikes)!.* takes (\d+) damage/.exec(m); if(x){const z=G.S.zone;hits[z]=hits[z]||[0,0,0];hits[z][0]+=+x[2];hits[z][1]++; if(+x[2]<10)hits[z][2]++;} _log(m,c); };
function manage(){
  const S=G.S;
  for(const b of D.BUILD_ORDER) F.build(b);
  const slots=F.workerSlots(); const order=['masonry','smithing','alchemy','cooking','scholarship']; S.workers={}; order.slice(0,slots).forEach(p=>S.workers[p]=true);
  for(const it of F.shopItems()) if(!S.inv.some(u=>u.id===it.id) && S.gold>F.buyPrice(it)+20) F.buyItem(it.id);
  if(!S.food){ const f=[...D.FOODS].reverse().find(f=>f.tav<=S.buildings.tavern && F.canAfford(f.gold,f.mats)); if(f) F.buyFood(f.id); }
  if((S.pots.potion||0)<6) F.buyPotion('potion',4);
  S.chars.forEach((c,ci)=>{ for(const slot of ['weapon','armor','acc']){
    const cand=S.inv.filter(u=>!u.relic&&D.ITEM[u.id].slot===slot&&(F.equippedBy(u.uid)<0||c.equip[slot]===u.uid));
    if(!cand.length) continue; const maxT=Math.max(...cand.map(u=>D.ITEM[u.id].tier));
    const score=u=>{const it=D.ITEM[u.id];const un=it.skills.filter(s=>!c.learned[s]).length;return it.tier*10+(un?(it.tier>=maxT-1?15:0):0)+Object.values(it.stats).reduce((a,b)=>a+b,0)};
    cand.sort((a,b)=>score(b)-score(a)); F.equip(ci,cand[0].uid); }
    const rel=S.inv.find(u=>u.relic&&F.equippedBy(u.uid)<0); if(rel&&!c.equip.relic) F.equip(ci,rel.uid);
    if(!c.job){ const j=D.JOB_ORDER.find(j=>F.jobUnlocked(c,j)); if(j) F.setJob(ci,j); }
    if(c.job) for(const n of D.JOBS[c.job].tree) F.buyNode(ci,c.job,n.id);
  });
}
let farm=0, bossWait=0, zoneStart=0;
while(t<HOURS*3600){
  manage();
  const S=G.S;
  if(S.wiped){ out.push(`${(t/3600).toFixed(2)}h wipe z${S.zone}${S.lastBoss?' (boss)':''} lv ${S.chars.map(c=>c.lv)}`); F.resume(); if(!S.lastBoss && S.zone>0){ F.setZone(S.zone-1); farm=60; } else bossWait=40; }
  const boss=F.bossReady(S.zone) && bossWait<=0 && farm<=0; S.lastBoss=boss; if(bossWait>0) bossWait--;
  if(farm>0){ farm--; if(farm===0){ const nz=S.zones.findIndex(z=>!z.boss); F.setZone(Math.max(0,nz)); } }
  F.startBattle(boss); let g=0; while(S.battle&&g++<600){ const lb=S.log.length; F.step(); t+=0.6;
}
  if(S.rest>0){ t+=6; F.finishRest(); } t+=1.1; battles++;
  F.tickProfs(0.6*g+7.1);
  if(S.zones[S.zone].boss && S.zone+1<D.ZONES.length && farm<=0 && !S.zones[S.zone+1].wins){ out.push(`${(t/3600).toFixed(2)}h beat ${D.ZONES[S.zone].boss.name} b=${battles} lv ${S.chars.map(c=>c.lv)} g ${S.gold} jobs ${S.chars.map(c=>c.job)} learned ${S.chars.map(c=>Object.keys(c.learned).length)} B ${Object.values(S.buildings)} P ${D.PROF_ORDER.map(p=>S.profs[p].lv)}`); F.setZone(S.zone+1); }
}
console.log(JSON.stringify(G.S.mats), F.canBuild("smithy"), F.canBuild("guild"));
console.log(out.join('\n'));
const S=G.S; console.log('end', (t/3600).toFixed(1)+'h', 'zone', S.zone, 'wins', S.stats.wins,'losses',S.stats.losses,'lv',S.chars.map(c=>c.lv), 'gold',S.gold, 'relics', JSON.stringify(S.relicsFound));
console.log('avg phys hit per zone', Object.entries(hits).map(([z,[a,n,sd]])=>z+':'+(a/n).toFixed(1)+' ('+Math.round(sd/n*100)+'% <10)').join(' '));
S.chars.forEach((c,i)=>{const d=F.calc(c);console.log(c.name,c.race,c.lv,c.job,'hp',d.maxHp,'str',d.str,'def',d.def,'mag',d.mag,'agi',d.agi)});
