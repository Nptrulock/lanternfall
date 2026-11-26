'use strict';
/* Lanternfall — game data (no logic) */
const D = {};

D.TYPES = {
  martial:{name:'Martial', icon:'⚔️', color:'#e07a5f'},
  holy:{name:'Holy', icon:'✨', color:'#f2cc8f'},
  arcane:{name:'Arcane', icon:'🔮', color:'#7aa2f7'},
  shadow:{name:'Shadow', icon:'🌑', color:'#b48ead'},
  wild:{name:'Wild', icon:'🌿', color:'#81b29a'},
  vital:{name:'Vital (Relic)', icon:'💠', color:'#ffd166'},
  job:{name:'Job', icon:'🎖️', color:'#c0c0c0'},
};
D.ELEMENTS = {fire:'🔥 Fire', ice:'❄️ Ice', bolt:'⚡ Bolt', holy:'✨ Holy', shadow:'🌑 Shadow', wild:'🌿 Wild', phys:'🗡️ Physical'};
D.STATS = ['hp','mp','str','def','mag','agi'];
D.STAT_NAMES = {hp:'HP', mp:'MP', str:'STR', def:'DEF', mag:'MAG', agi:'AGI'};

/* ---------------- races ----------------
   base = level-1 stats, grow = per-level gain (fractional, accumulates slowly)
   traits unlock at levels; scale = value grows with level where noted */
D.RACES = {
  human:{name:'Human', icon:'🧑', desc:'Adaptable all-rounders who learn skills a little faster.',
    base:{hp:12,mp:4,str:3,def:2,mag:2,agi:3}, grow:{hp:1.4,mp:.5,str:.3,def:.3,mag:.3,agi:.3},
    traits:[
      {lv:1, name:'Quick Study', desc:'+1 bonus AP every 4th battle won.', eff:{apEvery:4}},
      {lv:3, name:'Adaptable', desc:'+4% XP from battles.', eff:{xp:.04}},
      {lv:6, name:'Second Wind', desc:'Once per battle, below 30% HP: heal 2 + 1 per 8 levels.', eff:{secondWind:2, swScale:8}},
      {lv:12, name:'Versatile', desc:'+1 STR, DEF, MAG and AGI.', eff:{stat:{str:1,def:1,mag:1,agi:1}}},
      {lv:15, name:'Resourceful', desc:'+6% gold from battles.', eff:{gold:.06}},
      {lv:20, name:'Fast Learner', desc:'+1 bonus AP every 2nd battle won (replaces Quick Study).', eff:{apEvery:2}},
      {lv:30, name:'Heroic Spirit', desc:'+10% damage and healing.', eff:{dmgPct:.10, healPct:.10}},
    ]},
  elf:{name:'Elf', icon:'🧝', desc:'Graceful spellcasters. Fragile, but magic comes naturally.',
    base:{hp:9,mp:7,str:2,def:1,mag:4,agi:4}, grow:{hp:1.1,mp:.8,str:.2,def:.2,mag:.45,agi:.35},
    traits:[
      {lv:1, name:'Keen Senses', desc:'+5% hit chance.', eff:{hit:.05}},
      {lv:3, name:'Gifted', desc:'+1 max MP.', eff:{stat:{mp:1}}},
      {lv:5, name:'Mana Spring', desc:'Regain 1 MP every 3 rounds in battle.', eff:{mpEvery:3}},
      {lv:11, name:'Spellweave', desc:'+1 spell damage (+1 more per 10 levels).', eff:{spellFlat:1, sfScale:10}},
      {lv:15, name:'Clearcast', desc:'+5% spell damage.', eff:{spellPct:.05}},
      {lv:18, name:'Starlit Mind', desc:'+3 max MP and +1 MAG.', eff:{stat:{mp:3,mag:1}}},
      {lv:28, name:'Eldritch Echo', desc:'15% chance to cast a spell twice for free.', eff:{echo:.15}},
    ]},
  dwarf:{name:'Dwarf', icon:'🧔', desc:'Stout and stubborn. Hard to knock down, slow to move.',
    base:{hp:15,mp:3,str:4,def:3,mag:1,agi:1}, grow:{hp:1.7,mp:.35,str:.35,def:.4,mag:.2,agi:.15},
    traits:[
      {lv:1, name:'Stout', desc:'+2 max HP.', eff:{stat:{hp:2}}},
      {lv:3, name:'Steady', desc:'+1 DEF.', eff:{stat:{def:1}}},
      {lv:7, name:'Stoneskin', desc:'Take 1 less damage from every hit (min 1).', eff:{dr:1}},
      {lv:13, name:'Forgeborn', desc:'Weapons and armor give +1 more of their main stat.', eff:{gearPlus:1}},
      {lv:16, name:'Deep Pockets', desc:'+5% gold from battles.', eff:{gold:.05}},
      {lv:21, name:'Unbreakable', desc:'Survive one lethal hit per battle at 1 HP.', eff:{endure:1}},
      {lv:30, name:'Mountain Heart', desc:'+8 max HP, +2 DEF.', eff:{stat:{hp:8,def:2}}},
    ]},
  halfling:{name:'Halfling', icon:'🧒', desc:'Small, quick and lucky. Earns more gold and dodges blows.',
    base:{hp:10,mp:4,str:2,def:2,mag:2,agi:5}, grow:{hp:1.2,mp:.45,str:.25,def:.25,mag:.3,agi:.45},
    traits:[
      {lv:1, name:'Lucky', desc:'+4% dodge.', eff:{dodge:.04}},
      {lv:3, name:'Nimble', desc:'+1 AGI.', eff:{stat:{agi:1}}},
      {lv:5, name:'Coin Sense', desc:'+10% gold from battles.', eff:{gold:.10}},
      {lv:10, name:'Light Fingers', desc:'+1 AGI and +3% dodge.', eff:{stat:{agi:1}, dodge:.03}},
      {lv:14, name:'Opportunist', desc:'+4% XP from battles.', eff:{xp:.04}},
      {lv:17, name:'Lucky Break', desc:'+6% critical hit chance.', eff:{crit:.06}},
      {lv:26, name:'Fortune\'s Favor', desc:'+5% crit and +15% gold.', eff:{crit:.05, gold:.15}},
    ]},
  orc:{name:'Orc', icon:'👹', desc:'Brutal fighters whose rage grows as they bleed.',
    base:{hp:14,mp:2,str:5,def:2,mag:1,agi:2}, grow:{hp:1.6,mp:.25,str:.45,def:.3,mag:.15,agi:.25},
    traits:[
      {lv:1, name:'Brute', desc:'+1 physical damage.', eff:{physFlat:1}},
      {lv:3, name:'Battle Lust', desc:'+3% physical damage.', eff:{physPct:.03}},
      {lv:6, name:'Bloodrage', desc:'+2 STR while below half HP.', eff:{rage:2}},
      {lv:12, name:'Thick Hide', desc:'+1 DEF and +3 max HP.', eff:{stat:{def:1,hp:3}}},
      {lv:16, name:'War Trophy', desc:'+5% gold from battles.', eff:{gold:.05}},
      {lv:19, name:'Savage Swing', desc:'Attacks have a 12% chance to hit every enemy.', eff:{cleaveChance:.12}},
      {lv:29, name:'Warlord', desc:'+15% physical damage.', eff:{physPct:.15}},
    ]},
  beastkin:{name:'Beastkin', icon:'🦊', desc:'Wild hunters with sharp instincts and fast reflexes.',
    base:{hp:11,mp:3,str:3,def:1,mag:2,agi:5}, grow:{hp:1.3,mp:.35,str:.35,def:.25,mag:.2,agi:.45},
    traits:[
      {lv:1, name:'Pounce', desc:'Always acts early in the first round.', eff:{first:1}},
      {lv:3, name:'Keen Nose', desc:'+4% XP from battles.', eff:{xp:.04}},
      {lv:6, name:'Feral Instinct', desc:'+5% crit chance.', eff:{crit:.05}},
      {lv:11, name:'Pack Hunter', desc:'+1 damage for each other living ally (max +3).', eff:{pack:1}},
      {lv:15, name:'Trail Runner', desc:'+3 max stamina.', eff:{stam:3}},
      {lv:18, name:'Twin Claws', desc:'10% chance to attack twice.', eff:{double:.10}},
      {lv:27, name:'Apex', desc:'+2 STR and +2 AGI.', eff:{stat:{str:2,agi:2}}},
    ]},
};
D.RACE_ORDER = ['human','elf','dwarf','halfling','orc','beastkin'];

/* ---------------- skills ----------------
   kind: 'active' or 'passive'. ap = battles of AP to learn permanently.
   active eff: phys(mult) | spell(power, el) | heal(power) | revive(pct) | buff | debuff | poison | steal | hits | all */
D.SKILLS = {
  // Martial
  power_strike:{name:'Power Strike', type:'martial', kind:'active', ap:10, mp:2, tgt:'enemy', eff:{phys:1.6}, desc:'A heavy blow: 160% attack damage.'},
  toughness:{name:'Toughness', type:'martial', kind:'passive', ap:12, eff:{stat:{hp:3}}, desc:'+3 max HP.'},
  iron_skin:{name:'Iron Skin', type:'martial', kind:'passive', ap:15, eff:{stat:{def:1}}, desc:'+1 DEF.'},
  cleave:{name:'Cleave', type:'martial', kind:'active', ap:22, mp:3, tgt:'all', eff:{phys:.8}, desc:'Hit every enemy for 80% damage.'},
  war_cry:{name:'War Cry', type:'martial', kind:'active', ap:24, mp:3, tgt:'party', eff:{buff:{str:1}}, desc:'Whole party +1 STR for the battle.'},
  counter:{name:'Counter', type:'martial', kind:'passive', ap:28, eff:{counter:.12}, desc:'12% chance to strike back when hit.'},
  sunder:{name:'Sunder', type:'martial', kind:'active', ap:30, mp:2, tgt:'enemy', eff:{phys:1.2, debuff:{def:2}}, desc:'120% damage and lowers enemy DEF by 2.'},
  double_strike:{name:'Double Strike', type:'martial', kind:'passive', ap:40, eff:{double:.10}, desc:'10% chance to attack twice.'},
  // Holy
  heal:{name:'Heal', type:'holy', kind:'active', ap:8, mp:2, tgt:'ally', eff:{heal:4}, desc:'Restore 4 + MAG HP to one ally.'},
  blessing:{name:'Blessing', type:'holy', kind:'passive', ap:12, eff:{stat:{hp:2,mp:1}}, desc:'+2 max HP, +1 max MP.'},
  holy_light:{name:'Holy Light', type:'holy', kind:'active', ap:14, mp:2, tgt:'enemy', eff:{spell:3, el:'holy'}, desc:'Holy damage (3 + MAG). Undead hate it.'},
  protect:{name:'Protect', type:'holy', kind:'active', ap:20, mp:3, tgt:'party', eff:{buff:{def:1}}, desc:'Whole party +1 DEF for the battle.'},
  prayer:{name:'Prayer', type:'holy', kind:'passive', ap:24, eff:{regen:1}, desc:'Heal 1 HP at the start of each of your turns.'},
  circle:{name:'Healing Circle', type:'holy', kind:'active', ap:28, mp:5, tgt:'party', eff:{heal:3}, desc:'Restore 3 + ½MAG HP to the whole party.'},
  raise:{name:'Raise', type:'holy', kind:'active', ap:34, mp:6, tgt:'ko', eff:{revive:.3}, desc:'Revive a fallen ally at 30% HP.'},
  // Arcane
  fire:{name:'Fire', type:'arcane', kind:'active', ap:8, mp:1, tgt:'enemy', eff:{spell:2, el:'fire'}, desc:'Fire damage to one enemy (power 2 + MAG).'},
  frost:{name:'Frost', type:'arcane', kind:'active', ap:10, mp:1, tgt:'enemy', eff:{spell:2, el:'ice'}, desc:'Ice damage to one enemy (power 2 + MAG).'},
  mana_font:{name:'Mana Font', type:'arcane', kind:'passive', ap:12, eff:{stat:{mp:2}}, desc:'+2 max MP.'},
  spark:{name:'Spark', type:'arcane', kind:'active', ap:14, mp:2, tgt:'enemy', eff:{spell:4, el:'bolt'}, desc:'Lightning damage (4 + MAG).'},
  focus:{name:'Focus', type:'arcane', kind:'passive', ap:18, eff:{stat:{mag:1}}, desc:'+1 MAG.'},
  flame_wave:{name:'Flame Wave', type:'arcane', kind:'active', ap:30, mp:4, tgt:'all', eff:{spell:3, el:'fire'}, desc:'Fire damage to every enemy.'},
  thunder:{name:'Thunder', type:'arcane', kind:'active', ap:36, mp:4, tgt:'enemy', eff:{spell:8, el:'bolt'}, desc:'Big lightning damage (8 + MAG).'},
  // Shadow
  backstab:{name:'Backstab', type:'shadow', kind:'active', ap:10, mp:1, tgt:'enemy', eff:{phys:1.3, crit:.25}, desc:'130% damage, +25% crit chance.'},
  steal:{name:'Steal', type:'shadow', kind:'active', ap:12, mp:0, tgt:'enemy', eff:{steal:1}, desc:'Try to pick an enemy\'s pocket for gold.'},
  evasion:{name:'Evasion', type:'shadow', kind:'passive', ap:15, eff:{dodge:.06}, desc:'+6% dodge.'},
  poison_blade:{name:'Poison Blade', type:'shadow', kind:'active', ap:16, mp:2, tgt:'enemy', eff:{phys:.8, poison:1}, desc:'80% damage and poisons (1 + ⅕MAG per turn, 3 turns).'},
  shadowstep:{name:'Shadowstep', type:'shadow', kind:'passive', ap:20, eff:{stat:{agi:2}}, desc:'+2 AGI.'},
  greed:{name:'Greed', type:'shadow', kind:'passive', ap:22, eff:{gold:.15}, desc:'+15% gold from battles.'},
  night_shade:{name:'Nightshade', type:'shadow', kind:'active', ap:32, mp:3, tgt:'enemy', eff:{spell:6, el:'shadow'}, desc:'Shadow damage (6 + MAG).'},
  // Wild
  aimed_shot:{name:'Aimed Shot', type:'wild', kind:'active', ap:8, mp:1, tgt:'enemy', eff:{phys:1.2, sure:1}, desc:'120% damage that never misses.'},
  herbal_lore:{name:'Herbal Lore', type:'wild', kind:'passive', ap:10, eff:{postHeal:2}, desc:'Heal 2 HP after every battle.'},
  keen_eye:{name:'Keen Eye', type:'wild', kind:'passive', ap:12, eff:{hit:.06, crit:.04}, desc:'+6% hit, +4% crit.'},
  entangle:{name:'Entangle', type:'wild', kind:'active', ap:18, mp:2, tgt:'enemy', eff:{debuff:{agi:3}, stun:.35}, desc:'Vines: enemy −3 AGI and 35% chance to lose a turn.'},
  thorn_hide:{name:'Thorn Hide', type:'wild', kind:'passive', ap:18, eff:{thorns:1}, desc:'Attackers take 1 damage.'},
  beast_call:{name:'Beast Call', type:'wild', kind:'active', ap:22, mp:3, tgt:'random', eff:{spell:2, el:'wild', hits:3}, desc:'A beast strikes 3 random enemies (2 + ½MAG each).'},
  // Vital (relic) skills
  rebirth:{name:'Rebirth', type:'vital', kind:'passive', ap:250, eff:{rebirth:.5}, desc:'Once per battle, rise again at 50% HP when knocked out.'},
  valor:{name:'Valor', type:'vital', kind:'active', ap:250, mp:4, tgt:'enemy', eff:{phys:3, sure:1}, desc:'A hero\'s blow: 300% damage that never misses.'},
  starfall:{name:'Starfall', type:'vital', kind:'active', ap:250, mp:6, tgt:'all', eff:{spell:10, el:'arcane'}, desc:'Stars rain on every enemy (10 + MAG).'},
  miracle:{name:'Miracle', type:'vital', kind:'active', ap:250, mp:8, tgt:'party', eff:{heal:99, reviveAll:1}, desc:'Fully heal and revive the whole party.'},
  midas:{name:'Midas Touch', type:'vital', kind:'passive', ap:250, eff:{gold:1}, desc:'Double gold from battles (party-wide).'},
  haste:{name:'Haste', type:'vital', kind:'passive', ap:250, eff:{haste:.5}, desc:'50% chance to act twice every round.'},
  dragonblood:{name:'Dragonblood', type:'vital', kind:'passive', ap:250, eff:{stat:{hp:6,str:3,def:3,mag:3,agi:3}}, desc:'+6 HP and +3 to every other stat.'},
  // Job-exclusive (from job trees; only usable while that job is active)
  shield_bash:{name:'Shield Bash', type:'job', kind:'active', mp:2, tgt:'enemy', eff:{phys:1.1, stun:.5}, desc:'110% damage, 50% chance to stun.'},
  sanctuary:{name:'Sanctuary', type:'job', kind:'active', mp:4, tgt:'party', eff:{heal:4}, desc:'Restore 4 + ½MAG HP to the whole party.'},
  arcane_bolt:{name:'Arcane Bolt', type:'job', kind:'active', mp:3, tgt:'enemy', eff:{spell:7, el:'arcane'}, desc:'Pure arcane damage (7 + MAG), no weakness needed.'},
  mug:{name:'Mug', type:'job', kind:'active', mp:1, tgt:'enemy', eff:{phys:1.2, steal:1}, desc:'Hit for 120% and steal at the same time.'},
  volley:{name:'Volley', type:'job', kind:'active', mp:3, tgt:'all', eff:{phys:.9, sure:1}, desc:'Arrows hit every enemy for 90%, never miss.'},
  holy_blade:{name:'Holy Blade', type:'job', kind:'active', mp:3, tgt:'enemy', eff:{phys:1.5, el:'holy', selfHeal:2}, desc:'150% holy-edged strike; heal yourself 2.'},
  elemental_edge:{name:'Elemental Edge', type:'job', kind:'active', mp:2, tgt:'enemy', eff:{phys:1.3, weakSeek:1}, desc:'130% strike that always uses the target\'s weakness.'},
  thornstorm:{name:'Thornstorm', type:'job', kind:'active', mp:4, tgt:'all', eff:{spell:4, el:'wild', partyHeal:2}, desc:'Wild damage to all enemies, heal party 2.'},
  assassinate:{name:'Assassinate', type:'job', kind:'active', mp:3, tgt:'enemy', eff:{phys:2, crit:.4}, desc:'200% damage, +40% crit chance.'},
  rally:{name:'Rally', type:'job', kind:'active', mp:3, tgt:'party', eff:{buff:{str:1, def:1}}, desc:'Party +1 STR and +1 DEF for the battle.'},
  divine:{name:'Divine Light', type:'job', kind:'active', mp:4, tgt:'enemy', eff:{spell:8, el:'holy'}, desc:'Holy damage (8 + MAG).'},
  drain:{name:'Drain', type:'job', kind:'active', mp:3, tgt:'enemy', eff:{spell:5, el:'shadow', lifesteal:.5}, desc:'Shadow damage (5 + MAG), heal half of it.'},
};

// v2 pacing: mastering a skill takes many fights (AP = wins wearing the gear)
for(const id in D.SKILLS){ const s=D.SKILLS[id]; if(s.ap) s.ap = s.type==='vital' ? 600 : s.ap*3; }

/* Higher-tier job commands and mentor gifts (no AP — unlocked, not learned from gear).
   Gear passives (with AP already at the v2 scale) add worn bonuses even before they're mastered. */
Object.assign(D.SKILLS, {
  crush:{name:'Crush', type:'job', kind:'active', mp:4, tgt:'enemy', eff:{phys:2.4}, desc:'A crushing blow: 240% attack damage.'},
  benediction:{name:'Benediction', type:'job', kind:'active', mp:5, tgt:'party', eff:{heal:6, buff:{def:1}}, desc:'Heal the party (6 + ½MAG) and +1 DEF for the battle.'},
  meteor:{name:'Meteor', type:'job', kind:'active', mp:6, tgt:'all', eff:{spell:10, el:'fire'}, desc:'Fire damage to every enemy (10 + MAG).'},
  umbral_strike:{name:'Umbral Strike', type:'job', kind:'active', mp:4, tgt:'enemy', eff:{phys:2.1, crit:.25}, desc:'210% damage with +25% crit chance.'},
  grove_guard:{name:'Grove Guard', type:'job', kind:'active', mp:4, tgt:'party', eff:{heal:4, buff:{hp:4}}, desc:'Heal the party (4 + ½MAG) and +4 max HP for the battle.'},
  // mentor rank-10 gifts
  aldric_oath:{name:"Aldric's Oath", type:'job', kind:'passive', eff:{dr:1, stat:{def:1}}, desc:'Take 1 less damage per hit and +1 DEF. Unique to Sir Aldric.'},
  brann_bulwark:{name:"Brann's Bulwark", type:'job', kind:'passive', eff:{stat:{hp:8}, taunt:.15}, desc:'+8 max HP and draw a little more aggro. Unique to Lord Commander Brann.'},
  dorrin_swing:{name:"Anvil Swing", type:'job', kind:'passive', eff:{physPct:.08}, desc:'+8% physical damage. Unique to Dorrin Anvilhand.'},
  kaia_tempo:{name:"Kaia's Tempo", type:'job', kind:'passive', eff:{double:.08}, desc:'8% chance to attack twice. Unique to Duelist Kaia.'},
  sela_mercy:{name:"Sela's Mercy", type:'job', kind:'passive', eff:{healPct:.12}, desc:'+12% healing. Unique to Sister Sela.'},
  ansel_light:{name:"Ansel's Light", type:'job', kind:'passive', eff:{holyPct:.2, stat:{mp:2}}, desc:'+20% holy damage and +2 MP. Unique to Brother Ansel.'},
  vey_insight:{name:"Vey's Insight", type:'job', kind:'passive', eff:{spellPct:.1}, desc:'+10% spell damage. Unique to Magister Vey.'},
  morwen_pact:{name:"Morwen's Pact", type:'job', kind:'passive', eff:{killMp:1, shadowPct:.1}, desc:'Regain 1 MP on a kill and +10% shadow damage. Unique to Morwen.'},
  pell_cut:{name:"Pell's Cut", type:'job', kind:'passive', eff:{crit:.06, gold:.08}, desc:'+6% crit and +8% gold. Unique to Pell.'},
  whisper_veil:{name:"The Whisper's Veil", type:'job', kind:'passive', eff:{dodge:.08, first:1}, desc:'+8% dodge and act first in round 1. Unique to the Whisper.'},
  ysolde_eye:{name:"Ysolde's Eye", type:'job', kind:'passive', eff:{hit:.06, crit:.05}, desc:'+6% hit and +5% crit. Unique to Ysolde.'},
  moss_root:{name:"Moss's Roots", type:'job', kind:'passive', eff:{postHeal:3, stam:4}, desc:'Heal 3 HP after every battle and +4 max stamina. Unique to Moss.'},
  // worn / learned gear passives
  fortune:{name:'Fortune', type:'martial', kind:'passive', ap:36, eff:{gold:.06}, desc:'+6% gold from battles.'},
  trophies:{name:'Trophies', type:'wild', kind:'passive', ap:36, eff:{xp:.06}, desc:'+6% XP from battles.'},
  vigor:{name:'Vigor', type:'holy', kind:'passive', ap:30, eff:{stam:3}, desc:'+3 max stamina.'},
  ward:{name:'Ward', type:'arcane', kind:'passive', ap:30, eff:{dodge:.04}, desc:'+4% dodge.'},
  edge:{name:'Keen Edge', type:'shadow', kind:'passive', ap:36, eff:{crit:.04}, desc:'+4% critical chance.'},
  purse_charm:{name:'Deep Purse', type:'shadow', kind:'passive', ap:42, eff:{gold:.08}, desc:'+8% gold from battles.'},
  // third-tier mentor rank-10 gifts
  rowan_stand:{name:'Rowan\'s Stand', type:'job', kind:'passive', eff:{endure:1,stat:{hp:6}}, desc:'Survive one lethal hit per battle at 1 HP and +6 HP. Unique to Ser Rowan.'},
  varka_line:{name:'Varka\'s Line', type:'job', kind:'passive', eff:{dr:1,physPct:0.08}, desc:'Take 1 less damage and +8% physical damage. Unique to Lady Varka.'},
  ione_exact:{name:'Ione\'s Measure', type:'job', kind:'passive', eff:{healPct:0.1,holyPct:0.12}, desc:'+10% healing and +12% holy damage. Unique to Sister Ione.'},
  calder_plant:{name:'Calder\'s Stance', type:'job', kind:'passive', eff:{postHeal:4,stat:{hp:6}}, desc:'Heal 4 HP after every battle and +6 HP. Unique to Father Calder.'},
  quill_word:{name:'Quill\'s Word', type:'job', kind:'passive', eff:{spellPct:0.12,stat:{mp:3}}, desc:'+12% spell damage and +3 MP. Unique to Magister Quill.'},
  nyx_ending:{name:'Nyx\'s Appendix', type:'job', kind:'passive', eff:{spellPct:0.08,mpEvery:3}, desc:'+8% spell damage; regain 1 MP every 3rd round. Unique to Archivist Nyx.'},
  coil_late:{name:'Coil\'s Timing', type:'job', kind:'passive', eff:{crit:0.08,first:1}, desc:'+8% crit and act first in round 1. Unique to Coil.'},
  vel_second:{name:'Vel\'s Second Shadow', type:'job', kind:'passive', eff:{dodge:0.08,shadowPct:0.1}, desc:'+8% dodge and +10% shadow damage. Unique to Vel of the Veil.'},
  briar_watch:{name:'Briar\'s Watch', type:'job', kind:'passive', eff:{thorns:2,stat:{hp:8}}, desc:'Attackers take 2 damage and +8 HP. Unique to Briar Holt.'},
  fenn_hold:{name:'Fenn\'s Hold', type:'job', kind:'passive', eff:{dr:1,stam:5}, desc:'Take 1 less damage and +5 max stamina. Unique to Fenn of the Vale.'},
  // unique item skills (one per item; AP already at the v2 scale; strength follows the item's tier band)
  bronze_guard:{name:'Bronze Guard', type:'martial', kind:'passive', ap:36, eff:{physPct:0.04}, desc:'+4% physical damage.'},
  quiet_bead:{name:'Quiet Beads', type:'holy', kind:'passive', ap:30, eff:{regen:1,stat:{mp:1}}, desc:'Heal 1 HP at the start of each of your turns and +1 max MP.'},
  starlight:{name:'Starlight', type:'arcane', kind:'active', ap:36, mp:2, tgt:'enemy', eff:{spell:3,el:'arcane'}, desc:'Arcane damage to one enemy (3 + MAG).'},
  willow_chant:{name:'Willow Chant', type:'arcane', kind:'passive', ap:36, eff:{spellPct:0.04}, desc:'+4% spell damage.'},
  chapel_smite:{name:'Chapel Smite', type:'holy', kind:'active', ap:36, mp:2, tgt:'enemy', eff:{phys:1.3,el:'holy'}, desc:'130% holy-edged damage.'},
  yew_shot:{name:'Yew Shot', type:'wild', kind:'active', ap:36, mp:1, tgt:'enemy', eff:{phys:1.4,sure:1}, desc:'140% damage that never misses.'},
  silk_cut:{name:'Silk Cut', type:'shadow', kind:'active', ap:36, mp:1, tgt:'enemy', eff:{phys:1.2,crit:0.15}, desc:'120% damage with +15% crit chance.'},
  supple_hide:{name:'Supple Hide', type:'martial', kind:'passive', ap:36, eff:{dodge:0.04}, desc:'+4% dodge.'},
  ore_sense:{name:'Ore Sense', type:'martial', kind:'passive', ap:48, eff:{gold:0.04,stat:{hp:2}}, desc:'+4% gold from battles and +2 max HP.'},
  reed_volley:{name:'Reed Volley', type:'wild', kind:'active', ap:54, mp:3, tgt:'all', eff:{phys:0.75}, desc:'Hit every enemy for 75% damage.'},
  mire_salve:{name:'Mire Salve', type:'wild', kind:'passive', ap:48, eff:{postHeal:3}, desc:'Heal 3 HP after every battle.'},
  reed_sway:{name:'Reed Sway', type:'wild', kind:'passive', ap:48, eff:{dodge:0.06}, desc:'+6% dodge.'},
  cinder_ward:{name:'Cinder Ward', type:'martial', kind:'passive', ap:84, eff:{dr:1}, desc:'Take 1 less damage per hit.'},
  ember_luck:{name:'Ember Luck', type:'martial', kind:'passive', ap:84, eff:{crit:0.06,gold:0.04}, desc:'+6% crit and +4% gold from battles.'},
  ash_stride:{name:'Ash Stride', type:'martial', kind:'passive', ap:72, eff:{stam:4}, desc:'+4 max stamina.'},
  frost_edge:{name:'Frost Edge', type:'martial', kind:'active', ap:90, mp:3, tgt:'enemy', eff:{phys:1.8,el:'ice'}, desc:'180% ice-edged damage.'},
  yeti_hide:{name:'Yeti Hide', type:'martial', kind:'passive', ap:84, eff:{stat:{hp:9},postHeal:3}, desc:'+9 max HP and +3 HP after every battle.'},
  night_sight:{name:'Night Sight', type:'wild', kind:'passive', ap:84, eff:{hit:0.08,crit:0.06}, desc:'+8% hit and +6% crit.'},
  rime_mark:{name:'Rime Mark', type:'arcane', kind:'passive', ap:84, eff:{stat:{mp:3},spellPct:0.08}, desc:'+3 max MP and +8% spell damage.'},
  snow_drift:{name:'Snow Drift', type:'arcane', kind:'passive', ap:84, eff:{dodge:0.08}, desc:'+8% dodge.'},
  soul_cut:{name:'Soul Cut', type:'shadow', kind:'active', ap:120, mp:4, tgt:'enemy', eff:{phys:2.2,crit:0.2}, desc:'220% damage with +20% crit chance.'},
  grave_bolt:{name:'Grave Bolt', type:'shadow', kind:'active', ap:120, mp:4, tgt:'enemy', eff:{spell:10,el:'shadow'}, desc:'Shadow damage (10 + MAG).'},
  darksteel_wall:{name:'Darksteel Wall', type:'martial', kind:'passive', ap:120, eff:{dr:1,stat:{def:3}}, desc:'Take 1 less damage per hit and +3 DEF.'},
  last_rites:{name:'Last Rites', type:'holy', kind:'passive', ap:120, eff:{healPct:0.12,regen:2}, desc:'+12% healing and heal 2 HP at the start of each of your turns.'},
  ruin_veil:{name:'Ruin Veil', type:'shadow', kind:'passive', ap:120, eff:{dodge:0.1,stat:{mp:3}}, desc:'+10% dodge and +3 max MP.'},
  fang_slash:{name:'Fang Slash', type:'martial', kind:'active', ap:135, mp:4, tgt:'enemy', eff:{phys:2.4}, desc:'240% damage.'},
  wyrmfire:{name:'Wyrmfire', type:'arcane', kind:'active', ap:135, mp:6, tgt:'all', eff:{spell:8,el:'fire'}, desc:'Fire damage to every enemy (8 + MAG).'},
  scale_ward:{name:'Scale Ward', type:'wild', kind:'passive', ap:135, eff:{thorns:4,stat:{def:3}}, desc:'Attackers take 4 damage and +3 DEF.'},
  wyrmheart:{name:'Wyrmheart', type:'holy', kind:'passive', ap:135, eff:{stam:6,stat:{hp:8}}, desc:'+6 max stamina and +8 max HP.'},
  wyrm_step:{name:'Wyrm Step', type:'martial', kind:'passive', ap:135, eff:{stam:6,dodge:0.06}, desc:'+6 max stamina and +6% dodge.'},
  quilted_guard:{name:'Quilted Guard', type:'martial', kind:'passive', ap:30, eff:{stat:{hp:2}}, desc:'+2 max HP.'},
  pilgrim_step:{name:'Pilgrim Step', type:'holy', kind:'passive', ap:30, eff:{stam:2}, desc:'+2 max stamina.'},
  oak_oath:{name:'Oak Oath', type:'martial', kind:'passive', ap:30, eff:{hit:0.04}, desc:'+4% hit.'},
  lamp_glow:{name:'Lamp Glow', type:'arcane', kind:'passive', ap:30, eff:{spellPct:0.04}, desc:'+4% spell damage.'},
  tunnel_crack:{name:'Tunnel Crack', type:'martial', kind:'active', ap:48, mp:2, tgt:'enemy', eff:{phys:1.3,debuff:{def:1}}, desc:'130% damage and lowers enemy DEF by 1.'},
  copper_arc:{name:'Copper Arc', type:'arcane', kind:'active', ap:48, mp:2, tgt:'enemy', eff:{spell:4,el:'bolt'}, desc:'Lightning damage (4 + MAG).'},
  chain_snap:{name:'Chain Snap', type:'martial', kind:'active', ap:48, mp:2, tgt:'enemy', eff:{phys:1.3,stun:0.25}, desc:'130% damage, 25% chance to stun.'},
  shaft_shot:{name:'Shaft Shot', type:'wild', kind:'active', ap:48, mp:2, tgt:'enemy', eff:{phys:1.3,sure:1}, desc:'130% damage that never misses.'},
  hard_hat:{name:'Hard Hat', type:'martial', kind:'passive', ap:48, eff:{stat:{hp:4}}, desc:'+4 max HP.'},
  dust_veil:{name:'Dust Veil', type:'shadow', kind:'passive', ap:48, eff:{dodge:0.05}, desc:'+5% dodge.'},
  copper_guard:{name:'Copper Guard', type:'martial', kind:'passive', ap:48, eff:{stat:{def:1}}, desc:'+1 DEF.'},
  wick_ward:{name:'Wick Ward', type:'holy', kind:'passive', ap:48, eff:{stat:{mp:2},dodge:0.04}, desc:'+2 max MP and +4% dodge.'},
  ore_bond:{name:'Ore Bond', type:'martial', kind:'passive', ap:48, eff:{stam:2}, desc:'+2 max stamina.'},
  pit_light:{name:'Pit Light', type:'holy', kind:'passive', ap:48, eff:{hit:0.05}, desc:'+5% hit.'},
  short_fuse:{name:'Short Fuse', type:'martial', kind:'passive', ap:48, eff:{crit:0.05}, desc:'+5% crit.'},
  mapped_path:{name:'Mapped Path', type:'wild', kind:'passive', ap:48, eff:{hit:0.04,stam:2}, desc:'+4% hit and +2 max stamina.'},
  fen_sweep:{name:'Fen Sweep', type:'martial', kind:'active', ap:54, mp:3, tgt:'all', eff:{phys:0.8}, desc:'Hit every enemy for 80% damage.'},
  fen_bless:{name:'Fen Blessing', type:'holy', kind:'active', ap:54, mp:3, tgt:'ally', eff:{heal:4}, desc:'Restore 4 + MAG HP to one ally.'},
  reed_pierce:{name:'Reed Pierce', type:'wild', kind:'active', ap:54, mp:2, tgt:'enemy', eff:{phys:1.4,sure:1}, desc:'140% damage that never misses.'},
  peat_crush:{name:'Peat Crush', type:'martial', kind:'active', ap:54, mp:3, tgt:'enemy', eff:{phys:1.5}, desc:'150% damage.'},
  peat_warmth:{name:'Peat Warmth', type:'wild', kind:'passive', ap:54, eff:{stam:2,postHeal:2}, desc:'+2 max stamina and +2 HP after every battle.'},
  bog_brace:{name:'Bog Brace', type:'martial', kind:'passive', ap:54, eff:{stat:{def:1,hp:3}}, desc:'+1 DEF and +3 max HP.'},
  lily_hush:{name:'Lily Hush', type:'holy', kind:'passive', ap:54, eff:{stat:{mp:2},healPct:0.08}, desc:'+2 max MP and +8% healing.'},
  fen_slip:{name:'Fen Slip', type:'shadow', kind:'passive', ap:54, eff:{dodge:0.06}, desc:'+6% dodge.'},
  cattail_sway:{name:'Cattail Sway', type:'wild', kind:'passive', ap:54, eff:{stat:{agi:1}}, desc:'+1 AGI.'},
  frog_leap:{name:'Frog Leap', type:'wild', kind:'passive', ap:54, eff:{stat:{agi:1},dodge:0.04}, desc:'+1 AGI and +4% dodge.'},
  moss_seal:{name:'Moss Seal', type:'arcane', kind:'passive', ap:54, eff:{postHeal:3}, desc:'Heal 3 HP after every battle.'},
  marsh_toll:{name:'Marsh Toll', type:'holy', kind:'active', ap:54, mp:3, tgt:'enemy', eff:{spell:4,el:'holy'}, desc:'Holy damage (4 + MAG).'},
  bog_call:{name:'Bog Call', type:'wild', kind:'active', ap:54, mp:3, tgt:'random', eff:{spell:3,el:'wild',hits:2}, desc:'A beast strikes 2 random enemies (3 + ½MAG each).'},
  ash_thrust:{name:'Ash Thrust', type:'martial', kind:'active', ap:84, mp:3, tgt:'enemy', eff:{phys:1.9}, desc:'190% damage.'},
  cinder_cut:{name:'Cinder Cut', type:'martial', kind:'active', ap:84, mp:3, tgt:'enemy', eff:{phys:1.7,el:'fire'}, desc:'170% fire-edged damage.'},
  hearth_bloom:{name:'Hearth Bloom', type:'arcane', kind:'active', ap:84, mp:4, tgt:'enemy', eff:{spell:7,el:'fire'}, desc:'Fire damage (7 + MAG).'},
  slag_smash:{name:'Slag Smash', type:'martial', kind:'active', ap:84, mp:3, tgt:'enemy', eff:{phys:1.8,debuff:{def:2}}, desc:'180% damage and lowers enemy DEF by 2.'},
  ember_shaft:{name:'Ember Shaft', type:'wild', kind:'active', ap:84, mp:3, tgt:'enemy', eff:{phys:1.7,el:'fire',sure:1}, desc:'170% fire-edged damage that never misses.'},
  soot_slash:{name:'Soot Slash', type:'shadow', kind:'active', ap:84, mp:3, tgt:'enemy', eff:{phys:1.6,crit:0.2}, desc:'160% damage with +20% crit chance.'},
  basalt_shell:{name:'Basalt Shell', type:'martial', kind:'passive', ap:84, eff:{stat:{def:3,hp:6}}, desc:'+3 DEF and +6 max HP.'},
  hearth_veil:{name:'Hearth Veil', type:'holy', kind:'passive', ap:84, eff:{stat:{mp:3},healPct:0.08}, desc:'+3 max MP and +8% healing.'},
  cinder_fade:{name:'Cinder Fade', type:'shadow', kind:'passive', ap:84, eff:{dodge:0.08,stat:{agi:1}}, desc:'+8% dodge and +1 AGI.'},
  ash_visor:{name:'Ash Visor', type:'wild', kind:'passive', ap:84, eff:{hit:0.06,stat:{hp:3}}, desc:'+6% hit and +3 max HP.'},
  pumice_grip:{name:'Pumice Grip', type:'martial', kind:'passive', ap:84, eff:{physPct:0.08}, desc:'+8% physical damage.'},
  smoke_step:{name:'Smoke Step', type:'shadow', kind:'passive', ap:84, eff:{stat:{agi:3}}, desc:'+3 AGI.'},
  ember_pulse:{name:'Ember Pulse', type:'arcane', kind:'passive', ap:84, eff:{spellPct:0.08,stat:{mag:1}}, desc:'+8% spell damage and +1 MAG.'},
  slag_seal:{name:'Slag Seal', type:'martial', kind:'passive', ap:84, eff:{stat:{def:3}}, desc:'+3 DEF.'},
  hearth_keep:{name:'Hearth Keep', type:'holy', kind:'passive', ap:84, eff:{regen:2,stat:{hp:4}}, desc:'Heal 2 HP at the start of each of your turns and +4 max HP.'},
  spark_catch:{name:'Spark Catch', type:'arcane', kind:'passive', ap:84, eff:{crit:0.08}, desc:'+8% crit.'},
  ash_warder:{name:'Ash Warder', type:'wild', kind:'passive', ap:84, eff:{thorns:3}, desc:'Attackers take 3 damage.'},
  cinder_focus:{name:'Cinder Focus', type:'arcane', kind:'passive', ap:84, eff:{stat:{mag:3}}, desc:'+3 MAG.'},
  rime_split:{name:'Rime Split', type:'martial', kind:'active', ap:90, mp:3, tgt:'enemy', eff:{phys:2,el:'ice'}, desc:'200% ice-edged damage.'},
  frost_lunge:{name:'Frost Lunge', type:'martial', kind:'active', ap:90, mp:3, tgt:'enemy', eff:{phys:1.8,el:'ice',stun:0.3}, desc:'180% ice-edged damage, 30% chance to stun.'},
  snow_burst:{name:'Snow Burst', type:'arcane', kind:'active', ap:90, mp:4, tgt:'enemy', eff:{spell:8,el:'ice'}, desc:'Ice damage (8 + MAG).'},
  peak_shot:{name:'Peak Shot', type:'wild', kind:'active', ap:90, mp:3, tgt:'enemy', eff:{phys:1.9,sure:1}, desc:'190% damage that never misses.'},
  ice_lash:{name:'Ice Lash', type:'arcane', kind:'active', ap:90, mp:4, tgt:'all', eff:{spell:5,el:'ice'}, desc:'Ice damage to every enemy (5 + MAG).'},
  owl_stab:{name:'Owl Stab', type:'shadow', kind:'active', ap:90, mp:3, tgt:'enemy', eff:{phys:1.8,crit:0.25}, desc:'180% damage with +25% crit chance.'},
  rime_shell:{name:'Rime Shell', type:'martial', kind:'passive', ap:90, eff:{stat:{def:3},dr:1}, desc:'+3 DEF and take 1 less damage per hit.'},
  frost_links:{name:'Frost Links', type:'holy', kind:'passive', ap:90, eff:{stat:{hp:9},dodge:0.04}, desc:'+9 max HP and +4% dodge.'},
  peak_warmth:{name:'Peak Warmth', type:'holy', kind:'passive', ap:90, eff:{stam:4,postHeal:4}, desc:'+4 max stamina and +4 HP after every battle.'},
  owl_down:{name:'Owl Down', type:'wild', kind:'passive', ap:90, eff:{hit:0.08,stat:{agi:2}}, desc:'+8% hit and +2 AGI.'},
  ice_tread:{name:'Ice Tread', type:'martial', kind:'passive', ap:90, eff:{stam:4,stat:{def:2}}, desc:'+4 max stamina and +2 DEF.'},
  snow_hoodwink:{name:'Snow Hoodwink', type:'shadow', kind:'passive', ap:90, eff:{dodge:0.09}, desc:'+9% dodge.'},
  rime_kiss:{name:'Rime Kiss', type:'arcane', kind:'passive', ap:90, eff:{spellPct:0.08,stat:{mp:2}}, desc:'+8% spell damage and +2 max MP.'},
  peak_chime:{name:'Peak Chime', type:'holy', kind:'passive', ap:90, eff:{healPct:0.1,stat:{mag:2}}, desc:'+10% healing and +2 MAG.'},
  yeti_bite:{name:'Yeti Bite', type:'martial', kind:'passive', ap:90, eff:{physPct:0.08,stat:{hp:3}}, desc:'+8% physical damage and +3 max HP.'},
  ice_reflect:{name:'Ice Reflect', type:'arcane', kind:'passive', ap:90, eff:{thorns:3,stat:{def:2}}, desc:'Attackers take 3 damage and +2 DEF.'},
  true_north:{name:'True North', type:'wild', kind:'passive', ap:90, eff:{hit:0.08,crit:0.04}, desc:'+8% hit and +4% crit.'},
  soft_glide:{name:'Soft Glide', type:'wild', kind:'passive', ap:90, eff:{dodge:0.08,stam:3}, desc:'+8% dodge and +3 max stamina.'},
  grave_reap:{name:'Grave Reap', type:'shadow', kind:'active', ap:120, mp:5, tgt:'all', eff:{phys:1}, desc:'Hit every enemy for 100% damage.'},
  ruin_cleave:{name:'Ruin Cleave', type:'martial', kind:'active', ap:120, mp:4, tgt:'enemy', eff:{phys:2.1}, desc:'210% damage.'},
  shade_arrow:{name:'Shade Arrow', type:'shadow', kind:'active', ap:120, mp:4, tgt:'enemy', eff:{phys:2,el:'shadow',sure:1}, desc:'200% shadow-edged damage that never misses.'},
  crypt_word:{name:'Crypt Word', type:'arcane', kind:'active', ap:120, mp:5, tgt:'enemy', eff:{spell:12,el:'arcane'}, desc:'Arcane damage (12 + MAG).'},
  void_prick:{name:'Void Prick', type:'shadow', kind:'active', ap:120, mp:4, tgt:'enemy', eff:{phys:2,crit:0.3}, desc:'200% damage with +30% crit chance.'},
  fell_blow:{name:'Fell Blow', type:'martial', kind:'active', ap:120, mp:4, tgt:'enemy', eff:{phys:2.2,debuff:{def:3}}, desc:'220% damage and lowers enemy DEF by 3.'},
  dusk_point:{name:'Dusk Point', type:'shadow', kind:'active', ap:120, mp:4, tgt:'enemy', eff:{phys:2.1}, desc:'210% damage.'},
  crypt_wall:{name:'Crypt Wall', type:'martial', kind:'passive', ap:120, eff:{dr:1,stat:{hp:12}}, desc:'Take 1 less damage per hit and +12 max HP.'},
  shade_skin:{name:'Shade Skin', type:'wild', kind:'passive', ap:120, eff:{dodge:0.12}, desc:'+12% dodge.'},
  ruin_weave:{name:'Ruin Weave', type:'arcane', kind:'passive', ap:120, eff:{spellPct:0.12,stat:{mp:4}}, desc:'+12% spell damage and +4 max MP.'},
  grave_brow:{name:'Grave Brow', type:'holy', kind:'passive', ap:120, eff:{stat:{def:5}}, desc:'+5 DEF.'},
  fell_drape:{name:'Fell Drape', type:'shadow', kind:'passive', ap:120, eff:{shadowPct:0.1,stat:{mag:2}}, desc:'+10% shadow damage and +2 MAG.'},
  void_fold:{name:'Void Fold', type:'arcane', kind:'passive', ap:120, eff:{stat:{mp:5},dodge:0.08}, desc:'+5 max MP and +8% dodge.'},
  dusk_links:{name:'Dusk Links', type:'martial', kind:'passive', ap:120, eff:{physPct:0.1}, desc:'+10% physical damage.'},
  crypt_mark:{name:'Crypt Mark', type:'holy', kind:'passive', ap:120, eff:{regen:3}, desc:'Heal 3 HP at the start of each of your turns.'},
  last_light:{name:'Last Light', type:'holy', kind:'passive', ap:120, eff:{stat:{mp:4},holyPct:0.12}, desc:'+4 max MP and +12% holy damage.'},
  ruin_luck:{name:'Ruin Luck', type:'shadow', kind:'passive', ap:120, eff:{gold:0.06,crit:0.05}, desc:'+6% gold from battles and +5% crit.'},
  shade_face:{name:'Shade Face', type:'shadow', kind:'passive', ap:120, eff:{stat:{agi:5}}, desc:'+5 AGI.'},
  void_hum:{name:'Void Hum', type:'arcane', kind:'passive', ap:120, eff:{stat:{mag:5}}, desc:'+5 MAG.'},
  fell_bind:{name:'Fell Bind', type:'martial', kind:'passive', ap:120, eff:{stat:{hp:15},stam:5}, desc:'+15 max HP and +5 max stamina.'},
  dusk_omen:{name:'Dusk Omen', type:'wild', kind:'passive', ap:120, eff:{hit:0.1,crit:0.06}, desc:'+10% hit and +6% crit.'},
  wyrm_sweep:{name:'Wyrm Sweep', type:'martial', kind:'active', ap:135, mp:5, tgt:'all', eff:{phys:1.1}, desc:'Hit every enemy for 110% damage.'},
  sunscale_cut:{name:'Sunscale Cut', type:'holy', kind:'active', ap:135, mp:5, tgt:'enemy', eff:{phys:2.3,el:'holy'}, desc:'230% holy-edged damage.'},
  drake_shot:{name:'Drake Shot', type:'wild', kind:'active', ap:135, mp:5, tgt:'enemy', eff:{phys:2.2,el:'fire',sure:1}, desc:'220% fire-edged damage that never misses.'},
  spine_flare:{name:'Spine Flare', type:'arcane', kind:'active', ap:135, mp:6, tgt:'enemy', eff:{spell:14,el:'bolt'}, desc:'Lightning damage (14 + MAG).'},
  fang_rip:{name:'Fang Rip', type:'shadow', kind:'active', ap:135, mp:5, tgt:'enemy', eff:{phys:2.3,crit:0.3}, desc:'230% damage with +30% crit chance.'},
  hoard_crush:{name:'Hoard Crush', type:'martial', kind:'active', ap:135, mp:5, tgt:'enemy', eff:{phys:2.5}, desc:'250% damage.'},
  emberwyrm_lash:{name:'Emberwyrm Lash', type:'arcane', kind:'active', ap:135, mp:6, tgt:'all', eff:{spell:10,el:'fire'}, desc:'Fire damage to every enemy (10 + MAG).'},
  sunscale_shell:{name:'Sunscale Shell', type:'holy', kind:'passive', ap:135, eff:{dr:1,stat:{def:5}}, desc:'Take 1 less damage per hit and +5 DEF.'},
  wyrm_bulwark:{name:'Wyrm Bulwark', type:'martial', kind:'passive', ap:135, eff:{stat:{hp:20},dr:1}, desc:'+20 max HP and take 1 less damage per hit.'},
  drake_hide:{name:'Drake Hide', type:'wild', kind:'passive', ap:135, eff:{thorns:5,dodge:0.1}, desc:'Attackers take 5 damage and +10% dodge.'},
  hoard_weave:{name:'Hoard Weave', type:'arcane', kind:'passive', ap:135, eff:{spellPct:0.15,stat:{mp:5}}, desc:'+15% spell damage and +5 max MP.'},
  spine_crown:{name:'Spine Crown', type:'martial', kind:'passive', ap:135, eff:{stat:{str:5,hp:8}}, desc:'+5 STR and +8 max HP.'},
  ashwyrm_drape:{name:'Ashwyrm Drape', type:'arcane', kind:'passive', ap:135, eff:{spellPct:0.12,stat:{mag:3}}, desc:'+12% spell damage and +3 MAG.'},
  fang_stride:{name:'Fang Stride', type:'shadow', kind:'passive', ap:135, eff:{stat:{agi:6},stam:6}, desc:'+6 AGI and +6 max stamina.'},
  sunscale_heart:{name:'Sunscale Heart', type:'holy', kind:'passive', ap:135, eff:{stat:{hp:10},healPct:0.12}, desc:'+10 max HP and +12% healing.'},
  wyrm_gaze:{name:'Wyrm Gaze', type:'arcane', kind:'passive', ap:135, eff:{stat:{mag:6}}, desc:'+6 MAG.'},
  hoard_pact:{name:'Hoard Pact', type:'shadow', kind:'passive', ap:135, eff:{gold:0.06,physPct:0.08}, desc:'+6% gold from battles and +8% physical damage.'},
  drake_call:{name:'Drake Call', type:'wild', kind:'active', ap:135, mp:5, tgt:'random', eff:{spell:4,el:'wild',hits:4}, desc:'A beast strikes 4 random enemies (4 + ½MAG each).'},
  spine_vigil:{name:'Spine Vigil', type:'holy', kind:'passive', ap:135, eff:{postHeal:6,stam:6}, desc:'Heal 6 HP after every battle and +6 max stamina.'},
  fang_oath:{name:'Fang Oath', type:'martial', kind:'passive', ap:135, eff:{crit:0.12}, desc:'+12% crit.'},
  ashwyrm_pulse:{name:'Ashwyrm Pulse', type:'arcane', kind:'passive', ap:135, eff:{killMp:1,stat:{mp:4}}, desc:'Regain 1 MP on a kill and +4 max MP.'},
  scale_keep:{name:'Scale Keep', type:'martial', kind:'passive', ap:135, eff:{stat:{def:5,hp:8}}, desc:'+5 DEF and +8 max HP.'},
  leech_sip:{name:'Leech Sip', type:'shadow', kind:'active', ap:54, mp:2, tgt:'enemy', eff:{phys:1.2,selfHeal:2}, desc:'120% damage; heal yourself 2.'},
});

/* ---------------- jobs (sphere grids) ----------------
   Base jobs open after ONE learned skill of their type. Advanced jobs need 2+2 learned skills AND rank 3 with one of their mentors.
   Each job: a command skill (usable right away), and a grid of 3 branches × 6 nodes, spreading out from the core.
   Ability nodes (the big ones) can be LOCKED IN: one per job, kept when the hero switches to another job. */
const A = (n, eff, d) => ({n, eff, d});
D.RING_COST = [0, 6, 10, 16, 24, 34, 46];
D.JOBS = {
  knight:{name:'Knight', icon:'🛡️', type:'martial', req:{martial:1}, stats:{hp:4,def:1}, cmd:'shield_bash', desc:'A sturdy front-liner who shields the party.', branches:[
    ['Bulwark', ['def1','hp3', A('Iron Wall',{dr:1},'Take 1 less damage per hit'), 'def1','hp4', A('Last Stand',{endure:1},'Survive one lethal hit per battle at 1 HP')]],
    ['Arms',    ['str1','hp2', A('Heavy Arms',{physPct:.12},'+12% physical damage'), 'str1','str1', A('Cleaving Blow',{cleaveChance:.12},'Attacks have a 12% chance to hit every enemy')]],
    ['Command', ['hp2','def1', A('Taunt',{taunt:.4},'Enemies target you 40% more often'), 'mp2','def1', A('Rally',{grant:'rally'},'Learn Rally: party +1 STR and +1 DEF for the battle')]],
    ['Honor',   ['hp3','str1', A('Knightly Bearing',{hit:.05, stat:{hp:3}},'+5% hit and +3 HP'), 'def1','hp3', A("Honor's Shield",{postHeal:3, dr:1},'Heal 3 HP after every battle; take 1 less damage')]],
  ]},
  priest:{name:'Priest', icon:'⛪', type:'holy', req:{holy:1}, stats:{mp:3,mag:1}, cmd:'sanctuary', desc:'Keeps the party standing.', branches:[
    ['Mercy', ['mp2','mag1', A('Gentle Hands',{healPct:.2},'+20% healing'), 'mp2','mag1', A('Grace',{healPct:.3},'+30% more healing')]],
    ['Faith', ['hp3','def1', A('Serenity',{mpEvery:3},'Regain 1 MP every 3 rounds'), 'hp3','mp2', A('Guardian Angel',{rebirth:.25},'Once per battle, rise again at 25% HP')]],
    ['Smite', ['mag1','mag1', A('Smite',{holyPct:.4},'+40% holy damage'), 'mag1','mp2', A('Divine Light',{grant:'divine'},'Learn Divine Light (holy damage 8 + MAG)')]],
    ['Comfort',['hp2','mp2', A('Comfort',{regen:1, healPct:.1},'Heal 1 HP at the start of your turns; +10% healing'), 'mp2','hp3', A('Hearth',{stam:4, postHeal:4},'+4 max stamina; heal 4 HP after every battle')]],
  ]},
  mage:{name:'Mage', icon:'🧙', type:'arcane', req:{arcane:1}, stats:{mp:3,mag:1}, cmd:'arcane_bolt', desc:'Elemental destruction.', branches:[
    ['Elements', ['mag1','mp2', A('Elementalist',{spellPct:.15},'+15% spell damage'), 'mag1','mag1', A('Exploit',{weakPct:.5},'Weakness hits deal +50% more')]],
    ['Mind',     ['mp2','mp2', A('Thrift',{mpCut:1},'Spells cost 1 less MP (min 1)'), 'mag1','mp3', A('Mana Tide',{mpEvery:2},'Regain 1 MP every 2 rounds')]],
    ['Ward',     ['hp3','def1', A('Arcane Shield',{dodge:.06},'+6% dodge'), 'hp3','mag1', A('Archmage',{spellPct:.2, stat:{mag:2}},'+20% spell damage, +2 MAG')]],
    ['Lore',     ['mp2','mag1', A('Deep Lore',{xp:.06},'+6% XP from battles'), 'mp3','mag1', A('Sage',{mpEvery:3, spellFlat:1},'Regain 1 MP every 3 rounds; +1 spell damage')]],
  ]},
  thief:{name:'Thief', icon:'🗝️', type:'shadow', req:{shadow:1}, stats:{agi:2}, cmd:'mug', desc:'Quick hands, quicker blades.', branches:[
    ['Blade',   ['str1','agi1', A('Vital Spots',{crit:.08},'+8% critical chance'), 'str1','agi1', A('Shadow Dance',{double:.15},'15% chance to attack twice')]],
    ['Evasion', ['agi1','hp2', A('Blur',{dodge:.08},'+8% dodge'), 'agi1','def1', A('Phantom Step',{dodge:.06, first:1},'+6% dodge and always act first in round 1')]],
    ['Greed',   ['agi1','mp2', A('Pockets',{gold:.15},'+15% gold from battles'), 'agi1','str1', A('Golden Touch',{gold:.25},'+25% more gold from battles')]],
    ['Guile',   ['hp2','agi1', A('Slippery',{dodge:.05, first:1},'+5% dodge; act first in round 1'), 'agi1','str1', A('Underhanded',{crit:.06, gold:.08},'+6% crit and +8% gold')]],
  ]},
  ranger:{name:'Ranger', icon:'🏹', type:'wild', req:{wild:1}, stats:{agi:1,str:1}, cmd:'volley', desc:'Precise shots and trail lore.', branches:[
    ['Aim',   ['agi1','str1', A('Steady Aim',{hit:.06},'+6% hit chance'), 'str1','agi1', A('Deadeye',{crit:.1},'+10% critical chance')]],
    ['Trail', ['hp3','def1', A('Trailwise',{postHeal:3},'Heal 3 HP after every battle'), 'hp3','agi1', A('Hardy',{stam:6},'+6 max stamina (longer expeditions)')]],
    ['Beast', ['str1','mag1', A("Hunter's Mark",{physPct:.12},'+12% physical damage'), 'mag1','str1', A('Beast Bond',{wildPct:.5, pack:1},'+50% wild damage; +1 damage per living ally')]],
    ['Camp',  ['hp3','agi1', A('Campcraft',{stam:4, gold:.05},'+4 max stamina and +5% gold'), 'hp3','str1', A('Trail Cook',{postHeal:5, xp:.05},'Heal 5 HP after every battle; +5% XP')]],
  ]},
  paladin:{name:'Paladin', icon:'🦁', type:'holy', adv:1, req:{martial:2, holy:2}, stats:{hp:6,def:2,mag:1}, cmd:'holy_blade', desc:'Holy knight: strikes and shields.', branches:[
    ['Oath',  ['def1','hp4', A('Aegis',{dr:1},'Take 1 less damage per hit'), 'def1','hp4', A('Martyr',{taunt:.3, rebirth:.5},'Draw attacks; rise once at 50% HP')]],
    ['Faith', ['mag1','mp2', A('Faith',{healPct:.2},'+20% healing'), 'mag1','mp2', A('Holy Aura',{regen:1},'Heal 1 HP at the start of each of your turns')]],
    ['Zeal',  ['str1','str1', A('Judgement',{holyPct:.5},'+50% holy damage'), 'str1','def1', A('Crusader',{physPct:.15},'+15% physical damage')]],
    ['Mercy', ['mp2','hp3', A('Lay Hands',{healPct:.15, regen:1},'+15% healing; heal 1 HP at the start of your turns'), 'def1','mp2', A('Vow of Care',{postHeal:5, stat:{hp:4}},'Heal 5 HP after every battle; +4 HP')]],
  ]},
  spellblade:{name:'Spellblade', icon:'🗡️', type:'arcane', adv:1, req:{martial:2, arcane:2}, stats:{str:1,mag:1,agi:1}, cmd:'elemental_edge', desc:'Steel and spell in one swing.', branches:[
    ['Runes', ['str1','mag1', A('Arcane Steel',{physPct:.1, spellPct:.1},'+10% physical and spell damage'), 'str1','mag1', A('Weakpoint',{weakPct:.6},'Weakness hits deal +60% more')]],
    ['Dance', ['agi1','agi1', A('Blade Dance',{double:.12},'12% chance to attack twice'), 'agi1','hp3', A('Riposte',{counter:.15},'15% chance to strike back when hit')]],
    ['Focus', ['mp2','mp2', A('Battle Focus',{mpEvery:3},'Regain 1 MP every 3 rounds'), 'mag1','mp2', A('Spell Echo',{echo:.12},'12% chance to cast a spell twice')]],
    ['Weave', ['str1','mag1', A('Woven Edge',{crit:.06, spellPct:.08},'+6% crit and +8% spell damage'), 'agi1','mp2', A('Flux',{mpCut:1, hit:.04},'Spells cost 1 less MP (min 1); +4% hit')]],
  ]},
  druid:{name:'Druid', icon:'🌳', type:'wild', adv:1, req:{wild:2, holy:2}, stats:{hp:3,mp:3,mag:1}, cmd:'thornstorm', desc:"Nature's healer and storm.", branches:[
    ['Root',  ['hp3','def1', A('Rooted',{dr:1},'Take 1 less damage per hit'), 'hp4','def1', A('Barkskin',{thorns:2},'Attackers take 2 damage')]],
    ['Bloom', ['mp2','mag1', A('Wellspring',{regen:1},'Heal 1 HP at the start of each of your turns'), 'mag1','mp2', A('Bloom',{healPct:.3},'+30% healing')]],
    ['Storm', ['mag1','mag1', A('Wild Heart',{wildPct:.5},'+50% wild damage'), 'mag1','mag1', A('Renewal',{postHeal:6},'Heal 6 HP after every battle')]],
    ['Moon',  ['mp2','hp3', A('Moonwell',{mpEvery:3, healPct:.1},'Regain 1 MP every 3 rounds; +10% healing'), 'mag1','hp3', A('Night Bloom',{stam:5, regen:1},'+5 max stamina; heal 1 HP at the start of your turns')]],
  ]},
  assassin:{name:'Assassin', icon:'🥷', type:'shadow', adv:1, req:{shadow:2, wild:2}, stats:{agi:2,str:1}, cmd:'assassinate', desc:'One perfect strike.', branches:[
    ['Venom',  ['agi1','mag1', A('Poisoner',{poisonPlus:2},'Your poisons tick for +2'), 'agi1','str1', A('Lethality',{critDmg:.5},'Critical hits deal +50% more')]],
    ['Ambush', ['agi1','agi1', A('Ambush',{first:1, crit:.06},'Act first in round 1, +6% crit'), 'agi1','str1', A('Execution',{crit:.1},'+10% critical chance')]],
    ['Shade',  ['hp2','agi1', A('Phantom',{dodge:.1},'+10% dodge'), 'def1','hp3', A('Unseen',{double:.1},'10% chance to attack twice')]],
    ['Silence',['agi1','mp2', A('Quiet Step',{first:1, gold:.08},'Act first in round 1; +8% gold'), 'agi1','hp2', A('Blackout',{dodge:.06, crit:.06},'+6% dodge and +6% crit')]],
  ]},
  warlock:{name:'Warlock', icon:'🕯️', type:'arcane', adv:1, req:{arcane:2, shadow:2}, stats:{mag:2,mp:2}, cmd:'drain', desc:'Dark pacts, draining power.', branches:[
    ['Hex',   ['mag1','mp2', A('Hex',{shadowPct:.3},'+30% shadow damage'), 'mag1','mag1', A('Void Lord',{spellPct:.25},'+25% spell damage')]],
    ['Pact',  ['mp2','hp2', A('Soul Harvest',{killMp:2},'Regain 2 MP on each kill'), 'mp2','mag1', A('Dark Pact',{mpCut:1},'Spells cost 1 less MP (min 1)')]],
    ['Curse', ['mag1','agi1', A('Dark Insight',{spellPct:.15},'+15% spell damage'), 'mag1','mp2', A('Echoing Doom',{echo:.15},'15% chance to cast a spell twice')]],
    ['Blight',['hp2','mag1', A('Wither',{shadowPct:.15, gold:.05},'+15% shadow damage and +5% gold'), 'mp2','mag1', A('Night Pact',{mpEvery:2, spellPct:.08},'Regain 1 MP every 2 rounds; +8% spell damage')]],
  ]},
  // Higher-tier jobs (adv:2): slightly stronger, gated by skills + mentor rank 5 + an advanced job of the same archetype.
  champion:{name:'Champion', icon:'⚔️', type:'martial', adv:2, req:{martial:4}, needRank:5, from:['paladin','spellblade'], stats:{hp:8,str:2,def:2}, cmd:'crush', desc:'A master of the field. Heavy blows, heavier presence.', branches:[
    ['Might',   ['str1','hp4', A('Overpower',{physPct:.18},'+18% physical damage'), 'str1','str1', A('Colossus',{physPct:.12, physFlat:1},'+12% more physical damage and +1 flat')]],
    ['Guard',   ['def1','hp4', A('Bastion',{dr:1, stat:{hp:6}},'Take 1 less damage; +6 HP'), 'def1','hp4', A('Unbowed',{endure:1, taunt:.2},'Survive one lethal hit per battle; draw more aggro')]],
    ['Presence',['hp3','str1', A('War Horn',{hit:.06, gold:.08},'+6% hit and +8% gold'), 'mp2','hp3', A('Legend',{xp:.08, postHeal:4},'+8% XP; heal 4 HP after every battle')]],
    ['Mastery', ['str1','def1', A('Master-at-Arms',{cleaveChance:.12, crit:.06},'12% chance to hit every enemy; +6% crit'), 'str1','hp4', A('Peerless',{physPct:.1, stat:{str:2}},'+10% physical damage and +2 STR')]],
  ]},
  oracle:{name:'Oracle', icon:'🌟', type:'holy', adv:2, req:{holy:4}, needRank:5, from:['paladin','druid'], stats:{mp:5,mag:2,hp:4}, cmd:'benediction', desc:'Sees the thread of a fight and knits the party back together.', branches:[
    ['Sight',   ['mag1','mp2', A('Foresight',{hit:.08, dodge:.04},'+8% hit and +4% dodge'), 'mp3','mag1', A('Prophecy',{xp:.08},'+8% XP from battles')]],
    ['Grace',   ['mp2','hp3', A('Graceful Hands',{healPct:.25},'+25% healing'), 'mag1','mp2', A('Miracle Worker',{healPct:.15, rebirth:.3},'+15% more healing; rise once at 30% HP')]],
    ['Aegis',   ['def1','hp4', A('Sanctuary',{dr:1},'Take 1 less damage per hit'), 'hp4','mp2', A('Warding Light',{regen:1, stat:{hp:6}},'Heal 1 HP at the start of your turns; +6 HP')]],
    ['Mastery', ['mag1','mp3', A('High Prayer',{holyPct:.3, mpEvery:2},'+30% holy damage; regain 1 MP every 2 rounds'), 'mag1','hp3', A('Beacon',{healPct:.1, stam:5},'+10% healing and +5 max stamina')]],
  ]},
  archmage:{name:'Archmage', icon:'🌌', type:'arcane', adv:2, req:{arcane:4}, needRank:5, from:['spellblade','warlock'], stats:{mp:6,mag:3}, cmd:'meteor', desc:'The top of the tower. Spells that reshape a battlefield.', branches:[
    ['Fire',    ['mag1','mp2', A('Pyromaster',{spellPct:.2},'+20% spell damage'), 'mag1','mag1', A('Cataclysm',{spellPct:.12, weakPct:.4},'+12% more spell damage; +40% weakness bonus')]],
    ['Mind',    ['mp3','mp2', A('Bottomless',{mpCut:1, mpEvery:2},'Spells cost 1 less MP; regain 1 MP every 2 rounds'), 'mp3','mag1', A('Overchannel',{echo:.18},'18% chance to cast a spell twice')]],
    ['Ward',    ['hp3','def1', A('Prism',{dodge:.08},'+8% dodge'), 'hp4','mp2', A('Astral Body',{stat:{mp:4,mag:1}, stam:4},'+4 MP, +1 MAG, +4 max stamina')]],
    ['Mastery', ['mag1','mp3', A('Scholar-King',{xp:.1},'+10% XP from battles'), 'mag1','mag1', A('Ascendant',{spellPct:.1, spellFlat:2},'+10% spell damage and +2 spell power')]],
  ]},
  nightblade:{name:'Nightblade', icon:'🌒', type:'shadow', adv:2, req:{shadow:4}, needRank:5, from:['assassin','warlock'], stats:{agi:3,str:1}, cmd:'umbral_strike', desc:'A blade that arrives a breath before the light does.', branches:[
    ['Edge',    ['str1','agi1', A('Razor',{crit:.1, critDmg:.25},'+10% crit and +25% crit damage'), 'str1','agi1', A('Vanish-Strike',{double:.14},'14% chance to attack twice')]],
    ['Shade',   ['agi1','hp2', A('Living Shadow',{dodge:.12},'+12% dodge'), 'agi1','def1', A('No Trace',{first:1, gold:.1},'Act first in round 1; +10% gold')]],
    ['Venom',   ['agi1','mag1', A('Night Toxin',{poisonPlus:2},'Your poisons tick for +2'), 'agi1','str1', A('Quiet Kill',{physPct:.12, crit:.06},'+12% physical damage and +6% crit')]],
    ['Mastery', ['agi1','hp3', A('Umbral Gift',{xp:.06, stam:4},'+6% XP and +4 max stamina'), 'agi1','str1', A('Master of Night',{dodge:.06, gold:.08},'+6% dodge and +8% gold')]],
  ]},
  warden:{name:'Warden', icon:'🦌', type:'wild', adv:2, req:{wild:4}, needRank:5, from:['druid','assassin'], stats:{hp:6,agi:2,mag:1}, cmd:'grove_guard', desc:'Guardian of the wild places. The forest fights with them.', branches:[
    ['Grove',   ['hp4','def1', A('Ironwood',{dr:1, thorns:2},'Take 1 less damage; attackers take 2'), 'hp4','def1', A('Ancient Bark',{stat:{hp:8,def:1}},'+8 HP and +1 DEF')]],
    ['Hunt',    ['str1','agi1', A('Wild Hunt',{physPct:.12, pack:1},'+12% physical damage; +1 per living ally'), 'agi1','str1', A('Pack Leader',{hit:.06, crit:.06},'+6% hit and +6% crit')]],
    ['Season',  ['mp2','mag1', A('Spring',{healPct:.2, regen:1},'+20% healing; heal 1 HP at the start of your turns'), 'mag1','hp3', A('Harvest',{postHeal:6, gold:.06},'Heal 6 HP after every battle; +6% gold')]],
    ['Mastery', ['hp3','agi1', A('Deep Roots',{stam:6, xp:.06},'+6 max stamina and +6% XP'), 'str1','mag1', A('Old Growth',{wildPct:.4, stat:{hp:4}},'+40% wild damage and +4 HP')]],
  ]},
};
D.JOB_ORDER = ['knight','priest','mage','thief','ranger','paladin','spellblade','druid','assassin','warlock','champion','oracle','archmage','nightblade','warden'];
// Build each job's grid: node ids jid.b.i ; core node 'core'. Layout: polar coordinates for the sphere-grid view.
(function(){
  const statName = {hp:'HP', mp:'MP', str:'STR', def:'DEF', mag:'MAG', agi:'AGI'};
  for(const jid in D.JOBS){ const j=D.JOBS[jid]; const nodes=[{id:'core', name:j.name+' Core', core:1, ring:0, cost:0, eff:{}, desc:`Become a ${j.name}: +${Object.entries(j.stats).map(([k,v])=>v+' '+statName[k]).join(', +')} and the ${'{cmd}'} command.`, x:0, y:0, links:[]}];
    j.branches.forEach(([bname, list], b)=>{ const nb=j.branches.length; const base = -90 + b*(360/nb);
      list.forEach((spec, i)=>{ const ring=i+1; const ang=(base + (i%2? 14:-14)*(i<5?1:0)) * Math.PI/180; const r=ring*1;
        let n; if(typeof spec==='string'){ const m=spec.match(/^([a-z]+)(\d+)$/); n={name:`+${m[2]} ${statName[m[1]]}`, eff:{stat:{[m[1]]:+m[2]}}, desc:`+${m[2]} ${statName[m[1]]}`, stat:m[1]}; }
        else n={name:spec.n, eff:spec.eff, desc:spec.d, ability:1};
        Object.assign(n, {id:`${b}.${i}`, branch:b, bname, ring, cost:Math.round(D.RING_COST[ring]*(n.ability?1.5:1)), x:Math.cos(ang)*r, y:Math.sin(ang)*r, links:[]});
        nodes.push(n);
      }); });
    const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
    const link=(a,b)=>{ byId[a].links.push(b); byId[b].links.push(a); };
    const nb=j.branches.length;
    for(let b=0;b<nb;b++){ link('core', `${b}.0`); for(let i=1;i<6;i++) link(`${b}.${i-1}`, `${b}.${i}`); }
    // cross links make it a web: ring 3 of neighbouring branches
    for(let b=0;b<nb;b++){ link(`${b}.3`, `${(b+1)%nb}.3`); }
    j.nodes=nodes; j.node=byId; nodes[0].desc=nodes[0].desc.replace('{cmd}', '“'+(D.SKILLS[j.cmd]?D.SKILLS[j.cmd].name:j.cmd)+'”');
    j.totalJp = nodes.reduce((a,n)=>a+n.cost,0);
  }
})();

/* ---------------- equipment ----------------
   slot: weapon | armor | acc. skills: taught by wearing it. tier = zone it belongs to. shop = Market level that sells it (null = gear halls / fusing only) */
D.BAND_OF = t => t<=1?'low':t<=3?'mid':t<=5?'top':'exclusive';
D.BAND_SCALE = {low:1, mid:2, top:3, exclusive:5};
D.BAND_LABEL = {low:'Low', mid:'Mid', top:'Top', exclusive:'Exclusive'};
const I = (id, name, icon, slot, tier, stats, skills, price, shop, bonus) => Object.assign({id, name, icon, slot, tier, band:D.BAND_OF(tier), stats, skills, price, shop}, bonus?{bonus}:{});
D.ITEMS = [
  // tier 0 — starter/shop
  I('stick','Oak Club','🏏','weapon',0,{str:1},['power_strike'],12,1),
  I('rod','Acolyte Rod','🪄','weapon',0,{str:1,mag:1},['heal'],14,1),
  I('wand','Ember Wand','🪄','weapon',0,{mag:1},['fire'],14,1),
  I('knife','Rusty Knife','🔪','weapon',0,{str:1,agi:1},['backstab'],13,1),
  I('sling','Hunter\'s Sling','🪃','weapon',0,{str:1},['aimed_shot'],13,1),
  I('tunic','Cloth Tunic','👕','armor',0,{def:1},['blessing'],10,1),
  I('hide','Hide Vest','🦺','armor',0,{def:1,hp:1},['toughness'],12,1),
  I('charm','Clover Charm','🍀','acc',0,{agi:1},['keen_eye'],15,1),
  I('ring_mp','Glass Ring','💍','acc',0,{mp:1},['mana_font'],16,null),
  I('gel_bangle','Gel Bangle','📿','acc',0,{hp:2},['herbal_lore'],0,null),
  // tier 0 — gear-hall only
  I('bsword','Bronze Shortsword','🗡️','weapon',0,{str:2},['bronze_guard'],20,null),
  I('buckler','Wooden Buckler','🛡️','acc',0,{def:1},['iron_skin'],18,null),
  I('beads','Prayer Beads','📿','acc',0,{mp:1},['quiet_bead'],20,null),
  I('vestment','Linen Vestment','🥼','armor',0,{def:1,mp:1},['holy_light'],18,null),
  I('tome','Apprentice Tome','📕','acc',0,{mag:1},['frost'],18,null),
  I('star_robe','Starry Robe','🧥','armor',0,{def:1,mag:1},['starlight'],20,null),
  I('hood','Rogue Hood','🎭','armor',0,{def:1,agi:1},['evasion'],18,null),
  I('lockpick','Lockpick Set','🪛','acc',0,{agi:1},['steal'],18,null),
  I('snare','Snare Kit','🪤','acc',0,{agi:1},['entangle'],18,null),
  // tier 1 — Whisperwood
  I('spear','Ash Spear','🔱','weapon',1,{str:2},['cleave'],40,2),
  I('staff','Willow Staff','🦯','weapon',1,{mag:2},['willow_chant'],42,2),
  I('mace','Chapel Mace','🔨','weapon',1,{str:2,mag:1},['chapel_smite'],45,null),
  I('bow','Yew Bow','🏹','weapon',1,{str:2,agi:1},['yew_shot'],44,2),
  I('dagger','Silk Dagger','🗡️','weapon',1,{str:1,agi:2},['silk_cut'],48,null),
  I('leather','Leather Armor','🥋','armor',1,{def:2},['supple_hide'],38,2),
  I('robe','Novice Robe','👘','armor',1,{def:1,mp:2},['spark'],40,null),
  I('bark','Barkskin Mail','🪵','armor',1,{def:2,hp:2},['thorn_hide'],0,null),
  I('amulet','Prayer Bead','📿','acc',1,{mp:1,mag:1},['prayer'],50,null),
  // tier 2 — Copper Mines
  I('axe','Miner\'s Axe','🪓','weapon',2,{str:3},['sunder'],90,3),
  I('scepter','Bone Scepter','🦴','weapon',2,{mag:3},['night_shade'],0,null),
  I('kris','Venom Kris','🗡️','weapon',2,{str:2,agi:2},['poison_blade'],95,null),
  I('chain','Copper Mail','⛓️','armor',2,{def:3},['protect'],85,3),
  I('cloak','Dusk Cloak','🧥','armor',2,{def:2,agi:2},['shadowstep'],0,null),
  I('lens','Seer\'s Lens','🔍','acc',2,{mag:2},['focus'],100,null),
  I('fang','Wolf Fang Necklace','🦷','acc',2,{str:1,agi:1},['beast_call'],0,null),
  // tier 3 — Sunken Marsh
  I('halberd','Bog Halberd','🔱','weapon',3,{str:4},['war_cry'],180,null),
  I('lily_staff','Lily Staff','🌸','weapon',3,{mag:4,mp:2},['circle'],0,null),
  I('croc_mail','Croc Mail','🐊','armor',3,{def:4,hp:4},['counter'],170,null),
  I('purse','Hag\'s Purse','👛','acc',3,{agi:2},['greed'],0,null),
  I('marsh_bow','Reed Longbow','🏹','weapon',3,{str:3,agi:2},['reed_volley'],175,null),
  // tier 4 — Ashen Highlands
  I('flamberge','Flamberge','⚔️','weapon',4,{str:6},['double_strike'],0,null),
  I('ember_rod','Ember Scepter','🔥','weapon',4,{mag:6},['flame_wave'],340,null),
  I('ash_plate','Ashen Plate','🛡️','armor',4,{def:6,hp:6},['cinder_ward'],320,null),
  I('phoenix_ring','Cinder Ring','💍','acc',4,{mag:2,hp:3},['raise'],0,null),
  // tier 5 — Frostpeak
  I('ice_brand','Ice Brand','🗡️','weapon',5,{str:8,agi:1},['frost_edge'],600,null),
  I('glacier_staff','Glacier Staff','🧊','weapon',5,{mag:8,mp:3},['thunder'],0,null),
  I('yeti_coat','Yeti Coat','🧥','armor',5,{def:8,hp:10},['yeti_hide'],560,null),
  I('owl_charm','Owl Charm','🦉','acc',5,{mag:3,agi:3},['night_sight'],0,null),
  // tier 6 — Shadowfell Ruins
  I('soul_blade','Soulreaver','🗡️','weapon',6,{str:11,agi:2},['soul_cut'],0,null),
  I('lich_staff','Lich Staff','🦯','weapon',6,{mag:11,mp:4},['grave_bolt'],1100,null),
  I('dark_plate','Darksteel Plate','🛡️','armor',6,{def:11,hp:14},['darksteel_wall'],1000,null),
  I('grave_ring','Grave Ring','💍','acc',6,{mp:4,mag:3},['last_rites'],0,null),
  // tier 7 — Dragon's Spine
  I('dragon_sword','Dragonfang','⚔️','weapon',7,{str:15,agi:3},['fang_slash'],0,null),
  I('dragon_staff','Wyrm Staff','🪄','weapon',7,{mag:15,mp:6},['wyrmfire'],2200,null),
  I('dragon_mail','Dragonscale Mail','🐲','armor',7,{def:15,hp:20},['scale_ward'],2000,null),
  I('dragon_charm','Wyrmheart Charm','🧡','acc',7,{hp:8,mag:4},['wyrmheart'],0,null,{bonus:{xp:.05,stam:2}}),
  I('scout_cap','Scout Cap','🧢','armor',0,{def:1,agi:1},['vigor'],16,null,{bonus:{stam:1}}),
  I('lucky_coin','Lucky Coin','🪙','acc',0,{agi:1},['fortune'],22,null,{bonus:{gold:.03}}),
  I('hunter_band','Hunter Band','🎀','acc',1,{str:1,agi:1},['trophies'],0,null,{bonus:{xp:.03}}),
  I('ward_pin','Ward Pin','📌','acc',1,{def:1,mp:1},['ward'],0,null,{bonus:{dodge:.02}}),
  I('miner_gloves','Miner Gloves','🧤','armor',2,{def:2,hp:2},['ore_sense'],0,null,{bonus:{gold:.04}}),
  I('keen_whet','Keen Whetstone','🪓','acc',2,{str:1},['edge'],0,null,{bonus:{crit:.03}}),
  I('swamp_charm','Swamp Charm','🧿','acc',3,{mag:2,hp:2},['mire_salve'],0,null,{bonus:{stam:2}}),
  I('reed_cloak','Reed Cloak','🧥','armor',3,{def:3,agi:2},['reed_sway'],0,null,{bonus:{dodge:.03}}),
  I('cinder_band','Cinder Band','💍','acc',4,{str:2,mag:2},['ember_luck'],0,null,{bonus:{gold:.04,crit:.02}}),
  I('ash_greaves','Ash Greaves','🥾','armor',4,{def:5,hp:4},['ash_stride'],0,null,{bonus:{stam:2}}),
  I('frost_talisman','Frost Talisman','❄️','acc',5,{mag:3,def:1},['rime_mark'],0,null,{bonus:{xp:.04}}),
  I('snow_cloak','Snow Cloak','🧣','armor',5,{def:7,hp:6},['snow_drift'],0,null,{bonus:{gold:.05}}),
  I('shade_sigil','Shade Sigil','🌑','acc',6,{agi:3,mag:2},['purse_charm'],0,null,{bonus:{crit:.04,gold:.05}}),
  I('ruin_mantle','Ruin Mantle','🧥','armor',6,{def:10,mp:3},['ruin_veil'],0,null,{bonus:{dodge:.04,stam:2}}),
  I('wyrm_greaves','Wyrm Greaves','👢','armor',7,{def:12,hp:10},['wyrm_step'],0,null,{bonus:{stam:3,xp:.05}}),
  // v5 expansion — weighted toward mid / top / exclusive bands; each item has one unique skill
  I('padded','Padded Jack','🥋','armor',1,{def:2,hp:1},['quilted_guard'],40,2),
  I('pilgrim_cloak','Pilgrim Cloak','🧥','armor',1,{def:1,mp:1},['pilgrim_step'],42,null),
  I('oak_torc','Oak Torc','🥏','acc',1,{str:1,hp:1},['oak_oath'],48,2),
  I('lamp_charm','Lamp Charm','🪔','acc',1,{mag:1},['lamp_glow'],48,null),
  I('tunnel_pick','Tunnel Pick','⛏️','weapon',2,{str:3,agi:1},['tunnel_crack'],92,3),
  I('copper_rod','Copper Rod','🪄','weapon',2,{mag:3},['copper_arc'],94,null),
  I('short_flail','Short Flail','⛓️','weapon',2,{str:3},['chain_snap'],90,null),
  I('mine_bow','Mine Bow','🏹','weapon',2,{str:2,agi:2},['shaft_shot'],93,null),
  I('miner_helm','Miner Helm','⛑️','armor',2,{def:3,hp:2},['hard_hat'],88,null),
  I('dust_wrap','Dust Wrap','🧣','armor',2,{def:2,agi:2},['dust_veil'],90,null),
  I('copper_plate','Copper Cuirass','🛡️','armor',2,{def:3,hp:1},['copper_guard'],92,null),
  I('lamp_robe','Lamp Robe','👘','armor',2,{def:2,mp:2},['wick_ward'],90,null),
  I('copper_band','Copper Band','💍','acc',2,{def:1,str:1},['ore_bond'],96,3),
  I('pit_lantern','Pit Lantern','🏮','acc',2,{mag:1,agi:1},['pit_light'],98,null),
  I('blast_fuse','Blast Fuse','🧨','acc',2,{str:2},['short_fuse'],95,null),
  I('cave_map','Cave Map','🗺️','acc',2,{agi:2},['mapped_path'],97,null),
  I('fen_glaive','Fen Glaive','🗡️','weapon',3,{str:4,agi:1},['fen_sweep'],176,null),
  I('marsh_crozier','Marsh Crozier','🦯','weapon',3,{mag:4,mp:1},['fen_bless'],180,null),
  I('reed_spear','Reed Spear','🔱','weapon',3,{str:3,agi:2},['reed_pierce'],175,null),
  I('peat_maul','Peat Maul','🔨','weapon',3,{str:4},['peat_crush'],178,null),
  I('peat_coat','Peat Coat','🧥','armor',3,{def:4,hp:3},['peat_warmth'],172,null),
  I('bog_plate','Bog Plate','🛡️','armor',3,{def:4,hp:2},['bog_brace'],174,null),
  I('lily_veil','Lily Veil','👗','armor',3,{def:3,mp:2},['lily_hush'],170,null),
  I('fen_leathers','Fen Leathers','🥋','armor',3,{def:3,agi:3},['fen_slip'],173,null),
  I('cattail_cape','Cattail Cape','🧣','armor',3,{def:3,mag:2},['cattail_sway'],171,null),
  I('frog_charm','Frog Charm','🐸','acc',3,{agi:2,hp:2},['frog_leap'],178,null),
  I('moss_ring','Moss Ring','💍','acc',3,{mag:2,hp:2},['moss_seal'],180,null),
  I('marsh_bell','Marsh Bell','🔔','acc',3,{mp:2,mag:1},['marsh_toll'],182,null),
  I('leech_vial','Leech Vial','🧪','acc',3,{str:1,hp:3},['leech_sip'],176,null),
  I('bog_whistle','Bog Whistle','🪈','acc',3,{agi:2,mag:1},['bog_call'],179,null),
  I('ash_pike','Ash Pike','🔱','weapon',4,{str:6,agi:1},['ash_thrust'],330,null),
  I('cinder_blade','Cinder Blade','⚔️','weapon',4,{str:5,mag:2},['cinder_cut'],335,null),
  I('hearth_staff','Hearth Staff','🪄','weapon',4,{mag:6},['hearth_bloom'],340,null),
  I('slag_hammer','Slag Hammer','🔨','weapon',4,{str:6},['slag_smash'],328,null),
  I('ember_bow','Ember Bow','🏹','weapon',4,{str:4,agi:3},['ember_shaft'],332,null),
  I('soot_kukri','Soot Kukri','🗡️','weapon',4,{str:4,agi:3},['soot_slash'],334,null),
  I('basalt_mail','Basalt Mail','🛡️','armor',4,{def:6,hp:5},['basalt_shell'],320,null),
  I('hearth_robe','Hearth Robe','👘','armor',4,{def:4,mp:4},['hearth_veil'],322,null),
  I('cinder_cloak','Cinder Cloak','🧥','armor',4,{def:5,agi:2},['cinder_fade'],324,null),
  I('ash_helm','Ash Helm','⛑️','armor',4,{def:5,hp:4},['ash_visor'],318,null),
  I('pumice_braces','Pumice Braces','🥋','armor',4,{def:5,str:1},['pumice_grip'],319,null),
  I('smoke_sash','Smoke Sash','🧣','armor',4,{def:4,mag:2,agi:1},['smoke_step'],321,null),
  I('ember_bead','Ember Bead','📿','acc',4,{mag:3},['ember_pulse'],340,null),
  I('slag_ring','Slag Ring','💍','acc',4,{str:2,def:2},['slag_seal'],338,null),
  I('hearth_stone','Hearth Stone','🪨','acc',4,{hp:4,mp:2},['hearth_keep'],342,null),
  I('spark_locket','Spark Locket','🔗','acc',4,{mag:2,agi:2},['spark_catch'],344,null),
  I('ash_totem','Ash Totem','🗿','acc',4,{str:2,hp:3},['ash_warder'],336,null),
  I('cinder_lens','Cinder Lens','🔍','acc',4,{mag:3},['cinder_focus'],345,null),
  I('rime_axe','Rime Axe','🪓','weapon',5,{str:8},['rime_split'],590,null),
  I('frost_spear','Frost Spear','🔱','weapon',5,{str:7,agi:2},['frost_lunge'],595,null),
  I('snow_wand','Snow Wand','🪄','weapon',5,{mag:8},['snow_burst'],600,null),
  I('peak_bow','Peak Bow','🏹','weapon',5,{str:6,agi:3},['peak_shot'],598,null),
  I('ice_flail','Ice Flail','⛓️','weapon',5,{str:7,mag:1},['ice_lash'],592,null),
  I('owl_dagger','Owl Dagger','🗡️','weapon',5,{str:5,agi:4},['owl_stab'],596,null),
  I('rime_plate','Rime Plate','🛡️','armor',5,{def:8,hp:8},['rime_shell'],560,null),
  I('frost_mail','Frost Mail','⛓️','armor',5,{def:7,hp:6,agi:1},['frost_links'],555,null),
  I('peak_parka','Peak Parka','🧥','armor',5,{def:7,hp:8},['peak_warmth'],558,null),
  I('owl_mantle','Owl Mantle','🦉','armor',5,{def:6,mag:3},['owl_down'],562,null),
  I('ice_greaves','Ice Greaves','🥾','armor',5,{def:7,hp:5},['ice_tread'],554,null),
  I('snow_hood','Snow Hood','🧢','armor',5,{def:6,agi:3},['snow_hoodwink'],556,null),
  I('rime_charm','Rime Charm','❄️','acc',5,{mag:3,def:2},['rime_kiss'],600,null),
  I('peak_bell','Peak Bell','🔔','acc',5,{mp:3,mag:2},['peak_chime'],605,null),
  I('yeti_tooth','Yeti Tooth','🦷','acc',5,{str:3,hp:4},['yeti_bite'],598,null),
  I('ice_mirror','Ice Mirror','🪞','acc',5,{mag:3,def:1},['ice_reflect'],610,null),
  I('frost_compass','Frost Compass','🧭','acc',5,{agi:3,mag:1},['true_north'],602,null),
  I('owl_feather','Owl Feather','🪶','acc',5,{agi:3,mp:2},['soft_glide'],604,null),
  I('grave_scythe','Grave Scythe','🦴','weapon',6,{str:11,agi:1},['grave_reap'],1080,null),
  I('ruin_glaive','Ruin Glaive','🔱','weapon',6,{str:10,mag:2},['ruin_cleave'],1090,null),
  I('shade_bow','Shade Bow','🏹','weapon',6,{str:8,agi:5},['shade_arrow'],1070,null),
  I('crypt_staff','Crypt Staff','🦯','weapon',6,{mag:11,mp:3},['crypt_word'],1100,null),
  I('void_dagger','Void Dagger','🗡️','weapon',6,{str:8,agi:5},['void_prick'],1060,null),
  I('fell_mace','Fell Mace','🔨','weapon',6,{str:11},['fell_blow'],1085,null),
  I('dusk_rapier','Dusk Rapier','⚔️','weapon',6,{str:9,agi:4},['dusk_point'],1075,null),
  I('crypt_plate','Crypt Plate','🛡️','armor',6,{def:11,hp:12},['crypt_wall'],1000,null),
  I('shade_leathers','Shade Leathers','🥋','armor',6,{def:9,agi:4},['shade_skin'],990,null),
  I('ruin_robe','Ruin Robe','👘','armor',6,{def:8,mp:5,mag:2},['ruin_weave'],1010,null),
  I('grave_helm','Grave Helm','⛑️','armor',6,{def:10,hp:10},['grave_brow'],995,null),
  I('fell_cloak','Fell Cloak','🧥','armor',6,{def:9,mag:3},['fell_drape'],1005,null),
  I('void_wrap','Void Wrap','🧣','armor',6,{def:8,agi:3,mp:3},['void_fold'],1008,null),
  I('dusk_mail','Dusk Mail','⛓️','armor',6,{def:10,hp:8,agi:2},['dusk_links'],1002,null),
  I('crypt_seal','Crypt Seal','🪪','acc',6,{mag:3,def:2},['crypt_mark'],1100,null),
  I('grave_candle','Grave Candle','🕯️','acc',6,{mp:4,mag:2},['last_light'],1110,null),
  I('ruin_coin','Ruin Coin','🪙','acc',6,{agi:3,str:2},['ruin_luck'],1090,null,{gold:0.04}),
  I('shade_mask','Shade Mask','🎭','acc',6,{agi:4},['shade_face'],1080,null),
  I('void_bead','Void Bead','🔮','acc',6,{mag:4,mp:2},['void_hum'],1120,null),
  I('fell_band','Fell Band','💍','acc',6,{str:3,hp:6},['fell_bind'],1095,null),
  I('dusk_charm','Dusk Charm','🌙','acc',6,{agi:3,mag:2},['dusk_omen'],1105,null),
  I('wyrm_halberd','Wyrm Halberd','🔱','weapon',7,{str:15,agi:2},['wyrm_sweep'],2100,null),
  I('sunscale_blade','Sunscale Blade','⚔️','weapon',7,{str:14,mag:3},['sunscale_cut'],2150,null),
  I('dragon_bow','Dragon Bow','🏹','weapon',7,{str:12,agi:6},['drake_shot'],2120,null),
  I('spine_staff','Spine Staff','🪄','weapon',7,{mag:15,mp:5},['spine_flare'],2200,null),
  I('fang_kukri','Fang Kukri','🗡️','weapon',7,{str:12,agi:6},['fang_rip'],2110,null),
  I('hoard_maul','Hoard Maul','🔨','weapon',7,{str:16},['hoard_crush'],2180,null),
  I('emberwyrm_rod','Emberwyrm Rod','🔥','weapon',7,{mag:14,str:2},['emberwyrm_lash'],2160,null),
  I('sunscale_mail','Sunscale Mail','🐲','armor',7,{def:15,hp:16},['sunscale_shell'],2000,null),
  I('wyrm_plate','Wyrm Plate','🛡️','armor',7,{def:16,hp:18},['wyrm_bulwark'],2050,null),
  I('drake_leathers','Drake Leathers','🥋','armor',7,{def:12,agi:5},['drake_hide'],1980,null),
  I('hoard_robe','Hoard Robe','👘','armor',7,{def:11,mp:6,mag:3},['hoard_weave'],2020,null),
  I('spine_helm','Spine Helm','⛑️','armor',7,{def:14,hp:12},['spine_crown'],2010,null),
  I('ashwyrm_cloak','Ashwyrm Cloak','🧥','armor',7,{def:13,mag:4},['ashwyrm_drape'],1990,null),
  I('fang_greaves','Fang Greaves','👢','armor',7,{def:13,hp:10,agi:2},['fang_stride'],1970,null),
  I('sunscale_charm','Sunscale Charm','🧡','acc',7,{hp:8,str:3},['sunscale_heart'],2200,null),
  I('wyrm_eye','Wyrm Eye','👁️','acc',7,{mag:5,agi:3},['wyrm_gaze'],2250,null),
  I('hoard_ring','Hoard Ring','💍','acc',7,{str:3,mag:3,def:2},['hoard_pact'],2220,null,{gold:0.05}),
  I('drake_whistle','Drake Whistle','🪈','acc',7,{agi:5,str:2},['drake_call'],2180,null),
  I('spine_idol','Spine Idol','🗿','acc',7,{hp:10,mp:4},['spine_vigil'],2240,null),
  I('fang_torc','Fang Torc','🦴','acc',7,{str:4,agi:3},['fang_oath'],2190,null),
  I('ashwyrm_bead','Ashwyrm Bead','📿','acc',7,{mag:5,mp:3},['ashwyrm_pulse'],2260,null),
  I('scale_locket','Scale Locket','🔗','acc',7,{def:3,hp:8},['scale_keep'],2210,null),
];

D.ITEM = {}; D.ITEMS.forEach(it => D.ITEM[it.id] = it);
D.SLOTS = ['weapon','armor','acc','relic'];
D.SLOT_NAMES = {weapon:'Weapon', armor:'Armor', acc:'Accessory', relic:'Relic'};

/* ---------------- relics ----------------
   Never dropped. Each zone's relic is the reward for completing that zone's bestiary collection
   (every foe Mastered, every Gilded variant defeated, boss beaten). Each houses one vital skill (600 AP). */
D.RELICS = [
  {id:'phoenix', name:'Phoenix Feather', icon:'🪶', skill:'rebirth', stats:{hp:4}, zone:0, desc:'Warm to the touch, it refuses to let its bearer fall.'},
  {id:'crest', name:'Hero\'s Crest', icon:'🎖️', skill:'valor', stats:{str:2}, zone:1, desc:'Worn by the last hero of the realm.'},
  {id:'midas', name:'Gilded Hand', icon:'🖐️', skill:'midas', stats:{agi:1}, zone:2, desc:'Everything it touches turns valuable.'},
  {id:'chalice', name:'Saint\'s Chalice', icon:'🏆', skill:'miracle', stats:{mp:4,mag:1}, zone:3, desc:'Its water mends anything.'},
  {id:'hourglass', name:'Hourglass of Ages', icon:'⏳', skill:'haste', stats:{agi:3}, zone:4, desc:'Time bends around whoever holds it.'},
  {id:'moonstone', name:'Moonstone Tiara', icon:'👑', skill:'starfall', stats:{mag:3,mp:3}, zone:5, desc:'Pulls the stars down from the sky.'},
  {id:'dragonheart', name:'Dragon Heart', icon:'❤️‍🔥', skill:'dragonblood', stats:{hp:5}, zone:6, desc:'Still beating, centuries later.'},
];
D.RELIC = {}; D.RELICS.forEach(r => D.RELIC[r.id] = r);

/* ---------------- enemies & zones ----------------
   stats are built from zone power × role. weak: element taking ×1.5 */
D.ROLES = {
  normal:{hp:1, atk:1, def:1, agi:1, mag:0},
  brute:{hp:1.35, atk:1.15, def:.9, agi:.75, mag:0},
  quick:{hp:.8, atk:.9, def:.7, agi:1.5, mag:0},
  tank:{hp:1.6, atk:.85, def:1.6, agi:.6, mag:0},
  caster:{hp:.85, atk:.7, def:.7, agi:1, mag:1.15},
};
D.ZP = {hp:[28,46,68,96,130,172,222,282], atk:[4,6,8,11,14,18,23,29], def:[0,1,3,5,7,10,13,17], agi:[2,4,5,7,9,11,13,15],
        xp:[2,4,7,11,17,25,36,50], gold:[2,4,7,11,16,23,32,44]};
const E = (id, name, icon, role, weak, drops, extra) => Object.assign({id, name, icon, role, weak, drops}, extra || {});
D.ZONES = [
  {id:'meadow', name:'Greenhollow Meadow', lv:'1–3', bg:['#7fc96b','#3d7a3a'], sky:['#8ecbf0','#d9f1ff'], wins:80, mx:44, my:63,
    desc:'Gentle fields just outside the village. Slimes and rabbits. A good place to learn.',
    enemies:[
      E('slime','Blue Slime','💧','normal','fire',[['gel',.35],['gel_bangle',.02],['ring_mp',.015]]),
      E('rabbit','Horned Rabbit','🐇','quick','wild',[['fur',.3],['charm',.02]]),
      E('mushling','Mushling','🍄','tank','fire',[['herb',.3],['tunic',.02]]),
      E('bee','Buzzbee','🐝','quick','ice',[['herb',.2],['knife',.02]]),
    ],
    boss:E('king_slime','King Slime','💧','tank','fire',[['gel',1],['gel_bangle',.3],['ring_mp',.3]], {boss:1, hat:'👑'})},
  {id:'wood', name:'Whisperwood', lv:'3–7', bg:['#3f7d4a','#1f4027'], sky:['#5d8f6b','#a9d1a4'], wins:150, mx:15, my:69,
    desc:'Old trees that murmur at night. Wolves hunt in packs here.',
    enemies:[
      E('wolf','Grey Wolf','🐺','quick','fire',[['fur',.35],['bow',.02]]),
      E('sapling','Treant Sapling','🌳','tank','fire',[['timber',.35],['bark',.025]]),
      E('imp','Forest Imp','👺','caster','holy',[['herb',.25],['robe',.025],['amulet',.02]]),
      E('spider','Webspinner','🕷️','normal','fire',[['silk',.35],['dagger',.025]]),
    ],
    boss:E('elder_treant','Elder Treant','🌲','tank','fire',[['timber',1],['mace',.3],['bark',.3]], {boss:1})},
  {id:'mines', name:'Old Copper Mines', lv:'7–11', bg:['#6b5a4a','#2e241c'], sky:['#3a2f28','#5a4a3c'], wins:280, mx:79, my:52,
    desc:'Abandoned tunnels. Bats in the dark, golems in the deep.',
    enemies:[
      E('bat','Cave Bat','🦇','quick','wild',[['bone',.2],['cloak',.02]]),
      E('kobold','Kobold Digger','🦎','normal','ice',[['copper',.35],['kris',.02]]),
      E('golem','Rock Golem','🗿','tank','bolt',[['stone',.5],['copper',.3]]),
      E('skeleton','Skeleton Miner','💀','brute','holy',[['bone',.35],['scepter',.02],['lens',.015]]),
    ],
    boss:E('troll','Cave Troll','🧌','brute','fire',[['copper',1],['fang',.3],['lens',.3]], {boss:1})},
  {id:'marsh', name:'Sunken Marsh', lv:'11–15', bg:['#5c6b3a','#26301a'], sky:['#6f7d5a','#a8b38c'], wins:450, mx:22, my:46,
    desc:'Fog, frogs and a hag who never shares. Poison bites here.',
    enemies:[
      E('frog','Bog Frog','🐸','normal','ice',[['lily',.25],['herb',.3]]),
      E('wisp','Marsh Wisp','🔥','caster','ice',[['lily',.3],['lily_staff',.015]]),
      E('hag','Swamp Hag','🧙‍♀️','caster','holy',[['herb',.3],['purse',.02]]),
      E('croc','Mud Croc','🐊','brute','bolt',[['scale',.35],['marsh_bow',.015]]),
    ],
    boss:E('hydra','Marsh Hydra','🐍','brute','fire',[['scale',1],['lily_staff',.3],['purse',.3]], {boss:1})},
  {id:'ash', name:'Ashen Highlands', lv:'15–20', bg:['#7a4a3a','#3a1f18'], sky:['#c2694a','#f0b088'], wins:650, mx:80, my:25,
    desc:'A volcanic plateau. Everything here burns.',
    enemies:[
      E('salamander','Salamander','🦎','quick','ice',[['ember',.3],['phoenix_ring',.012]]),
      E('hawk','Ember Hawk','🦅','quick','bolt',[['ember',.25],['flamberge',.01]]),
      E('wraith','Ash Wraith','👻','caster','holy',[['ecto',.2],['ember',.2]]),
      E('lava_golem','Lava Golem','🌋','tank','ice',[['stone',.5],['ember',.35]]),
    ],
    boss:E('salamander_lord','Salamander Lord','🔥','brute','ice',[['ember',1],['flamberge',.3],['phoenix_ring',.3]], {boss:1})},
  {id:'frost', name:'Frostpeak', lv:'20–26', bg:['#cfe3ef','#7d98ad'], sky:['#9fb7c9','#e8f3fb'], wins:850, mx:20, my:17,
    desc:'Icy cliffs and howling wind. Bring fire.',
    enemies:[
      E('yeti','Yeti','🦍','brute','fire',[['frost',.3],['fur',.3]]),
      E('ice_wolf','Ice Wolf','🐺','quick','fire',[['frost',.25],['fur',.3]]),
      E('frost_wisp','Frost Wisp','❄️','caster','fire',[['frost',.35],['glacier_staff',.01]]),
      E('owl','Snow Owl','🦉','quick','bolt',[['frost',.2],['owl_charm',.012]]),
    ],
    boss:E('frost_giant','Frost Giant','🧊','brute','fire',[['frost',1],['glacier_staff',.3],['owl_charm',.3]], {boss:1})},
  {id:'ruins', name:'Shadowfell Ruins', lv:'26–33', bg:['#3a3048','#15111d'], sky:['#2a2238','#4a3d5c'], wins:1050, mx:48, my:21,
    desc:'A fallen kingdom ruled by the dead. Holy light burns them.',
    enemies:[
      E('ghoul','Ghoul','🧟','brute','holy',[['bone',.35],['ecto',.25]]),
      E('vamp_bat','Vampire Bat','🦇','quick','holy',[['ecto',.25],['soul_blade',.008]]),
      E('dark_knight','Dark Knight','🛡️','tank','holy',[['ecto',.3],['grave_ring',.01]]),
      E('necro','Necromancer','🧙','caster','holy',[['ecto',.35],['bone',.3]]),
    ],
    boss:E('lich','The Lich King','☠️','caster','holy',[['ecto',1],['soul_blade',.3],['grave_ring',.3]], {boss:1})},
  {id:'spine', name:'Dragon\'s Spine', lv:'33–40', bg:['#5a2a2a','#1d0c0c'], sky:['#7a2e1e','#d0703a'], wins:1300, mx:50, my:8,
    desc:'The mountain where the last dragon sleeps.',
    enemies:[
      E('drake','Fire Drake','🐲','brute','ice',[['dscale',.25],['dragon_sword',.006]]),
      E('wyvern','Wyvern','🦖','quick','bolt',[['dscale',.25],['dragon_mail',.008]]),
      E('cultist','Dragon Cultist','🧛','caster','holy',[['dscale',.2],['ecto',.3]]),
      E('ancient_golem','Ancient Golem','🗿','tank','bolt',[['stone',.6],['dscale',.2]]),
    ],
    boss:E('elder_dragon','Ignarath the Elder Dragon','🐉','brute','ice',[['dscale',1],['dragon_sword',.3],['dragon_mail',.3]], {boss:1})},
];
/* ---------------- town of Lanternfall ----------------
   Fighting earns gold, XP, AP, JP and bestiary progress. It never drops items.
   Items, materials and gear come from town work (professions), the mine and the gear halls. */
D.MATS = {
  stone:{name:'Stone', icon:'🪨', desc:'Building block for every town upgrade.', sell:1},
  timber:{name:'Timber', icon:'🪵', desc:'Sawn logs for buildings.', sell:1},
  herb:{name:'Wild Herb', icon:'🌿', desc:'Used in tavern meals.', sell:1},
  fur:{name:'Soft Fur', icon:'🧶', desc:'Warm pelts for meals and the lodge.', sell:2},
  copper:{name:'Copper Ore', icon:'🟠', desc:'Metal for the forge and smithing.', sell:2},
  silk:{name:'Spider Silk', icon:'🕸️', desc:'Fine thread from the Whisperwood edge.', sell:3},
  iron:{name:'Iron Ore', icon:'⛓️', desc:'Strong ore from the deep shafts.', sell:4},
  lily:{name:'Bog Lily', icon:'🪷', desc:'A rare flower from the marsh road.', sell:6},
  ember:{name:'Ash Ember', icon:'🔥', desc:'Still warm. From the ash vein.', sell:9},
  frost:{name:'Frost Crystal', icon:'❄️', desc:'Never melts. From the frost vein.', sell:14},
  ecto:{name:'Ectoplasm', icon:'👻', desc:'Ghostly residue the scholars distill.', sell:20},
  dscale:{name:'Dragon Scale', icon:'🐉', desc:'Shed scales dug from the Spine.', sell:30},
  quartz:{name:'Quartz', icon:'🔹', desc:'A pretty crystal from the mine. Sell it for gold.', sell:2, gem:1},
  silver:{name:'Silver Ore', icon:'🪙', desc:'Valuable ore. Sell it for gold.', sell:6, gem:1},
  nugget:{name:'Gold Nugget', icon:'🟡', desc:'A lucky find deep in the mine. Sell it for gold.', sell:15, gem:1},
};
// Professions: a worker assigned to one levels it up and produces its goods. Some goods need a zone reached first (new trade route).
// out: [mat, seconds per unit at Lv1, min seconds, minLv, zone needed (index of a zone that must be OPEN)]
D.PROFS = {
  mining:{name:'Mining', icon:'⛏️', place:'mine', desc:'Digs slowly for 💎 Diamonds (one dig at a time, extra miners don\'t speed it up), plus stone, ore and gems.',
    out:[['diamond',3000,1800,1,0],['stone',40,12,1,0],['quartz',180,60,1,0],['copper',75,20,2,0],['iron',140,40,5,2],['silver',400,120,6,0],['ember',300,90,10,4],['frost',360,110,14,5],['nugget',900,300,12,0],['dscale',900,300,20,7]]},
  foraging:{name:'Foraging', icon:'🪓', place:'lodge', desc:'Cuts timber and gathers herbs, fur and silk around town.',
    out:[['timber',40,12,1,0],['herb',50,15,1,0],['fur',90,25,3,0],['silk',150,45,4,1],['lily',300,90,8,3]]},
  smithing:{name:'Smithing', icon:'⚒️', place:'forge', desc:'Smelts ore and now and then forges a Common piece of gear. Raises Market sell prices.',
    out:[['gear',2400,900,1,0]]},
  cooking:{name:'Cooking', icon:'🍳', place:'tavern', desc:'Cooks meals from herbs and fur. The party eats one when it sets out.', out:[]},
  scholarship:{name:'Scholarship', icon:'📜', place:'library', desc:'Researches seen foes (lowers the kills needed for their next bestiary bonus — never adds kills) and later distills ectoplasm.',
    out:[['study',120,30,1,0],['ecto',600,200,12,6]]},
  masonry:{name:'Masonry', icon:'🧱', place:'hall', desc:'Cuts stone and timber and is required to raise most buildings past the first level.',
    out:[['stone',50,15,1,0],['timber',55,16,1,0],['copper',200,60,6,2]]},
  banking:{name:'Banking', icon:'🏦', place:'hall', desc:'Tends the town coffers. Deposited gold earns slow interest; interest can be changed into 💎 at a steep rate.',
    out:[]},
};
D.PROF_ORDER = ['mining','foraging','smithing','cooking','scholarship','masonry','banking'];
D.WORKER_COST = [0, 60, 220, 650, 1600, 3800, 8500]; // gold to hire worker #2, #3, ...
D.WORKER_NAMES = ['Tam','Odile','Bram','Wynn','Hesper','Corin','Lio'];

// Buildings on the town map. x/y = % position on art/town_map.webp
D.PLACES = {
  hall:    {name:'Town Hall', icon:'🏛️', x:71, y:18, desc:'Hire workers, set their professions, and keep gold in the town bank.', kind:'hall'},
  market:  {name:'Market', icon:'⚖️', x:38, y:36, desc:'Buy basic gear, sell spares and gems.', kind:'market', build:1},
  forge:   {name:'Forge', icon:'🔥', x:22, y:20, desc:'Gear hall for warriors. Fuse duplicates. Mentors: Dorrin, Kaia; at Lv 5, Lady Varka.', kind:'banner', banner:'forge'},
  chapel:  {name:'Chapel', icon:'⛪', x:85, y:34, desc:'Gear hall for healers. Mentors: Sela, Ansel; at Lv 5, Sister Ione.', kind:'banner', banner:'chapel'},
  arcanum: {name:'Arcanum', icon:'🔮', x:73, y:57, desc:'Gear hall for mages. Mentors: Vey, Morwen; at Lv 5, Magister Quill and Archivist Nyx.', kind:'banner', banner:'arcanum'},
  den:     {name:"Thieves' Den", icon:'🗝️', x:39, y:76, desc:'Gear hall for rogues. Mentors: Pell, the Whisper; at Lv 5, Coil and Vel of the Veil.', kind:'banner', banner:'den'},
  lodge:   {name:"Hunter's Lodge", icon:'🏹', x:13, y:83, desc:'Gear hall for rangers. Mentors: Ysolde, Moss; at Lv 5, Briar Holt and Fenn of the Vale.', kind:'banner', banner:'lodge'},
  training:{name:'Training Grounds', icon:'🎯', x:23, y:61, desc:'Raise stamina. Mentors: Aldric, Brann; at Lv 5, Ser Rowan and Father Calder.', kind:'training', build:1},
  tavern:  {name:'Tavern', icon:'🍺', x:89, y:24, desc:'Meals that buff the next expedition.', kind:'tavern', build:1},
  library: {name:'Library', icon:'📚', x:47, y:9, desc:'Bestiary and collection rewards.', kind:'library', build:1},
  mine:    {name:'Mine', icon:'⛏️', x:86, y:78, desc:'Where diamonds come from.', kind:'mine'},
};
D.PLACE_ORDER = ['hall','market','training','forge','mine','tavern','library','chapel','arcanum','den','lodge'];
// Upgradeable buildings (non-hall): level 0 = not built.
D.BMAX = 8;
D.BUILD = {
  market:  {prof:'smithing', start:1, unlock:'Each level: one more stall slot in the rotating stock, +5% sell prices, and slightly better goods.'},
  training:{prof:null, start:1, unlock:'Each level: +5 Endurance cap, 10% faster training, and a slightly higher cap on Focus Drill bonuses.'},
  tavern:  {prof:'cooking', start:0, unlock:'Each level adds a new meal recipe. Meals stack: the party eats one of each packed dish.'},
  library: {prof:'scholarship', start:0, unlock:'Each level lowers the kills needed for every bestiary bonus (it never adds kills).'},
  forge:   {prof:null, start:1, banner:1, unlock:'Lv 1: Dorrin arrives. Each level: +1% physical damage for the party and better Forge banner rates. Lv 3: Kaia arrives. Lv 8: the Forge can fuse Mythic gear.'},
  chapel:  {prof:null, start:0, banner:1, unlock:'Lv 1: Sela arrives. Each level: +1.5% healing and holy damage, and better Chapel banner rates. Lv 3: Ansel arrives.'},
  arcanum: {prof:null, start:0, banner:1, unlock:'Lv 1: Vey arrives. Each level: +1.5% spell damage, and better Arcanum banner rates. Lv 3: Morwen arrives.'},
  den:     {prof:null, start:0, banner:1, unlock:'Lv 1: Pell arrives. Each level: +1.5% shadow damage and +0.5% crit, and better Den banner rates. Lv 3: The Whisper arrives.'},
  lodge:   {prof:null, start:0, banner:1, unlock:'Lv 1: Ysolde arrives. Each level: +1.5% nature damage and a little after-battle healing, and better Lodge banner rates. Lv 3: Moss arrives.'},
};
// Per-level auras from job halls, so every building level is a visible increase.
D.BUILD_AURA = {
  forge:   {physPct:.01},
  chapel:  {healPct:.015, holyPct:.015},
  arcanum: {spellPct:.015},
  den:     {shadowPct:.015, crit:.005},
  lodge:   {wildPct:.015, postHeal:.5},
};
D.BUILD_ORDER = ['market','training','tavern','library','forge','chapel','arcanum','den','lodge'];
// cost to reach level L (1..8): gold, stone, timber, + the building's flavour material, + profession level if it has one
D.BUILD_COST = [null,
  {prof:1, masonry:0, gold:40, stone:8, timber:8},
  {prof:3, masonry:1, gold:150, stone:20, timber:15},
  {prof:6, masonry:2, gold:450, stone:40, timber:30},
  {prof:10, masonry:4, gold:1100, stone:70, timber:50},
  {prof:15, masonry:7, gold:2500, stone:110, timber:80},
  {prof:21, masonry:11, gold:5000, stone:160, timber:120},
  {prof:28, masonry:16, gold:9500, stone:230, timber:170},
  {prof:36, masonry:22, gold:17000, stone:320, timber:240},
];
D.BUILD_MATS = { // flavour material for levels 2..8 (amount = 3 × level)
  market:  ['copper','copper','iron','lily','ember','frost','dscale'],
  training:['fur','copper','iron','iron','ember','frost','dscale'],
  tavern:  ['herb','fur','silk','lily','ember','frost','ecto'],
  library: ['herb','silk','silk','lily','ecto','frost','ecto'],
  forge:   ['copper','copper','iron','iron','ember','frost','dscale'],
  chapel:  ['herb','silk','silk','lily','ember','ecto','dscale'],
  arcanum: ['quartz','silk','iron','lily','ember','frost','dscale'],
  den:     ['fur','silk','iron','lily','ecto','ecto','dscale'],
  lodge:   ['fur','timber','silk','lily','ember','frost','dscale'],
};

/* ---------------- stamina ----------------
   Each hero has stamina. Every battle costs 1 (a boss costs 4). When anyone runs out, the party walks home to rest.
   In town stamina recovers; resting recovers twice as fast. Endurance (trained at the Training Grounds) raises the cap and recovery. */
D.STAM = {base:20, perLv:3, battle:1, boss:4, regenSec:45, restMult:2, regenPerLv:.04, minDepart:5};

/* ---------------- mentors ---------------- 
   Training under a mentor (in town) slowly raises a bonus stat and lowers another.
   Rank 1 opens a base or mid-tier job as a main job; rank 3 opens it as a sub job.
   Third-tier mentors (Champion, Oracle, Archmage, Nightblade, Warden) arrive at building Lv 5, grant two rising stats and a larger minus, and help open those jobs at rank 5. */
D.MENTORS = [
  {id:'aldric', name:'Sir Aldric', place:'training', job:'knight', plus:'def', minus:'agi', need:1, line:'Stand your ground. Speed is for people who expect to miss.', gifts:{5:{name:'Shield Drill',desc:'+1 DEF',eff:{stat:{def:1}}},7:{name:'Hold Fast',desc:'+4 max HP and +3% hit',eff:{stat:{hp:4},hit:.03}},10:{name:"Aldric's Oath",desc:'A unique passive: take 1 less damage and +1 DEF.',grant:'aldric_oath'}}},
  {id:'brann', name:'Lord Commander Brann', place:'training', job:'paladin', plus:'hp', minus:'agi', need:3, line:'A shield is a promise. Keep it.', gifts:{5:{name:'Heavy Guard',desc:'+4 max HP',eff:{stat:{hp:4}}},7:{name:'Command Voice',desc:'Enemies target you a little more; +1 DEF',eff:{taunt:.1,stat:{def:1}}},10:{name:"Brann's Bulwark",desc:'A unique passive: +8 HP and a little more aggro.',grant:'brann_bulwark'}}},
  {id:'dorrin', name:'Dorrin Anvilhand', place:'forge', job:'knight', plus:'str', minus:'mag', need:1, line:'Swing like you mean it. Think later.', gifts:{5:{name:'Heavy Hands',desc:'+1 STR',eff:{stat:{str:1}}},7:{name:'Forge Temper',desc:'+4 max HP and +4% physical damage',eff:{stat:{hp:4},physPct:.04}},10:{name:'Anvil Swing',desc:'A unique passive: +8% physical damage.',grant:'dorrin_swing'}}},
  {id:'kaia', name:'Duelist Kaia', place:'forge', job:'spellblade', plus:'str', minus:'def', need:3, line:'Steel and spell are one motion. Again.', gifts:{5:{name:'Quick Step',desc:'+1 AGI',eff:{stat:{agi:1}}},7:{name:'Duelist Rhythm',desc:'+4% crit and +1 STR',eff:{crit:.04,stat:{str:1}}},10:{name:"Kaia's Tempo",desc:'A unique passive: 8% chance to attack twice.',grant:'kaia_tempo'}}},
  {id:'sela', name:'Mother Sela', place:'chapel', job:'priest', plus:'mag', minus:'str', need:1, line:'Mend first. The fight can wait a breath.', gifts:{5:{name:'Gentle Hands',desc:'+8% healing',eff:{healPct:.08}},7:{name:'Quiet Ward',desc:'+2 max MP and +1 MAG',eff:{stat:{mp:2,mag:1}}},10:{name:"Sela's Mercy",desc:'A unique passive: +12% healing.',grant:'sela_mercy'}}},
  {id:'ansel', name:'Brother Ansel', place:'chapel', job:'paladin', plus:'def', minus:'mag', need:3, line:'Faith is a wall, and walls are built slowly.', gifts:{5:{name:'Blessed Steel',desc:'+8% holy damage',eff:{holyPct:.08}},7:{name:'Firm Faith',desc:'+4 max HP and +1 DEF',eff:{stat:{hp:4,def:1}}},10:{name:"Ansel's Light",desc:'A unique passive: +20% holy damage and +2 MP.',grant:'ansel_light'}}},
  {id:'vey', name:'Magister Vey', place:'arcanum', job:'mage', plus:'mag', minus:'hp', need:1, line:'Mind the formula. Fire forgives nothing.', gifts:{5:{name:'Focus Word',desc:'+1 MAG',eff:{stat:{mag:1}}},7:{name:'Clear Channel',desc:'+2 max MP and +5% spell damage',eff:{stat:{mp:2},spellPct:.05}},10:{name:"Vey's Insight",desc:'A unique passive: +10% spell damage.',grant:'vey_insight'}}},
  {id:'morwen', name:'Morwen the Pale', place:'arcanum', job:'warlock', plus:'mp', minus:'def', need:3, line:'Every power has a price. Pay it gladly.', gifts:{5:{name:'Umbral Ink',desc:'+8% shadow damage',eff:{shadowPct:.08}},7:{name:'Pact Bread',desc:'Regain 1 MP on a kill',eff:{killMp:1}},10:{name:"Morwen's Pact",desc:'A unique passive: +1 MP on a kill and +10% shadow damage.',grant:'morwen_pact'}}},
  {id:'pell', name:'Quickfinger Pell', place:'den', job:'thief', plus:'agi', minus:'hp', need:1, line:'Never be where the blow lands.', gifts:{5:{name:'Light Fingers',desc:'+1 AGI',eff:{stat:{agi:1}}},7:{name:'Cut Purse',desc:'+6% gold and +3% crit',eff:{gold:.06,crit:.03}},10:{name:"Pell's Cut",desc:'A unique passive: +6% crit and +8% gold.',grant:'pell_cut'}}},
  {id:'whisper', name:'The Whisper', place:'den', job:'assassin', plus:'str', minus:'def', need:3, line:'…', gifts:{5:{name:'Soft Step',desc:'+4% dodge',eff:{dodge:.04}},7:{name:'Early Shadow',desc:'Act first in round 1; +1 AGI',eff:{first:1,stat:{agi:1}}},10:{name:"The Whisper's Veil",desc:'A unique passive: +8% dodge and act first in round 1.',grant:'whisper_veil'}}},
  {id:'ysolde', name:'Warden Ysolde', place:'lodge', job:'ranger', plus:'agi', minus:'mp', need:1, line:'Read the wind, then loose.', gifts:{5:{name:'Keen Sight',desc:'+4% hit',eff:{hit:.04}},7:{name:'Called Shot',desc:'+1 AGI and +4% crit',eff:{stat:{agi:1},crit:.04}},10:{name:"Ysolde's Eye",desc:'A unique passive: +6% hit and +5% crit.',grant:'ysolde_eye'}}},
  {id:'moss', name:'Elder Moss', place:'lodge', job:'druid', plus:'hp', minus:'str', need:3, line:'Roots first. Then the storm.', gifts:{5:{name:'Green Thumb',desc:'+3 HP after every battle',eff:{postHeal:3}},7:{name:'Long Walk',desc:'+4 max stamina and +3 max HP',eff:{stam:4,stat:{hp:3}}},10:{name:"Moss's Roots",desc:'A unique passive: heal 3 HP after every battle and +4 max stamina.',grant:'moss_root'}}},
  {id:'rowan', name:'Ser Rowan', place:'training', job:'champion', plus:'str', plus2:'hp', minus:'mag', minusScale:2, need:5, line:'The field does not grade your form. It grades whether you are still standing.', gifts:{5:{name:'Field Hours',desc:'+1 STR',eff:{stat:{str:1}}},7:{name:'Still Standing',desc:'+6 max HP and +1 STR',eff:{stat:{hp:6,str:1}}},10:{name:"Rowan's Stand",desc:'A unique passive: survive one lethal hit per battle and +6 HP.',grant:'rowan_stand'}}},
  {id:'varka', name:'Lady Varka', place:'forge', job:'champion', plus:'def', plus2:'str', minus:'agi', minusScale:2, need:5, line:'Hold the line, then walk through it.', gifts:{5:{name:'Line Drill',desc:'+1 DEF',eff:{stat:{def:1}}},7:{name:'Through the Line',desc:'+1 STR and +1 DEF',eff:{stat:{str:1,def:1}}},10:{name:"Varka's Line",desc:'A unique passive: take 1 less damage and +8% physical damage.',grant:'varka_line'}}},
  {id:'ione', name:'Sister Ione', place:'chapel', job:'oracle', plus:'mag', plus2:'mp', minus:'str', minusScale:2, need:5, line:'The light is not gentle. It is exact.', gifts:{5:{name:'Exact Word',desc:'+1 MAG',eff:{stat:{mag:1}}},7:{name:'Measured Light',desc:'+2 max MP and +1 MAG',eff:{stat:{mp:2,mag:1}}},10:{name:"Ione's Measure",desc:'A unique passive: +10% healing and +12% holy damage.',grant:'ione_exact'}}},
  {id:'calder', name:'Father Calder', place:'training', job:'oracle', plus:'hp', plus2:'mag', minus:'agi', minusScale:2, need:5, line:'Pray with your feet planted. The wounded cannot wait for poetry.', gifts:{5:{name:'Planted Feet',desc:'+4 max HP',eff:{stat:{hp:4}}},7:{name:'Field Prayer',desc:'+1 MAG and +4 max HP',eff:{stat:{mag:1,hp:4}}},10:{name:"Calder's Stance",desc:'A unique passive: heal 4 HP after every battle and +6 HP.',grant:'calder_plant'}}},
  {id:'quill', name:'Magister Quill', place:'arcanum', job:'archmage', plus:'mag', plus2:'mp', minus:'hp', minusScale:2, need:5, line:'A precise word is worth a cart of firewood.', gifts:{5:{name:'Precise Word',desc:'+1 MAG',eff:{stat:{mag:1}}},7:{name:'Ink and Ash',desc:'+2 max MP and +1 MAG',eff:{stat:{mp:2,mag:1}}},10:{name:"Quill's Word",desc:'A unique passive: +12% spell damage and +3 MP.',grant:'quill_word'}}},
  {id:'nyx', name:'Archivist Nyx', place:'arcanum', job:'archmage', plus:'mag', plus2:'def', minus:'str', minusScale:2, need:5, line:'I have read every ending. Yours is not among the cheap ones.', gifts:{5:{name:'Marginalia',desc:'+1 MAG',eff:{stat:{mag:1}}},7:{name:'Hard Binding',desc:'+1 DEF and +1 MAG',eff:{stat:{def:1,mag:1}}},10:{name:"Nyx's Appendix",desc:'A unique passive: +8% spell damage; regain 1 MP every 3rd round.',grant:'nyx_ending'}}},
  {id:'coil', name:'Coil', place:'den', job:'nightblade', plus:'agi', plus2:'str', minus:'def', minusScale:2, need:5, line:'If they saw you coming, you were already late.', gifts:{5:{name:'Late Step',desc:'+1 AGI',eff:{stat:{agi:1}}},7:{name:'Already Gone',desc:'+1 STR and +1 AGI',eff:{stat:{str:1,agi:1}}},10:{name:"Coil's Timing",desc:'A unique passive: +8% crit and act first in round 1.',grant:'coil_late'}}},
  {id:'vel', name:'Vel of the Veil', place:'den', job:'nightblade', plus:'agi', plus2:'mp', minus:'hp', minusScale:2, need:5, line:'The second shadow is the one that cuts.', gifts:{5:{name:'Second Veil',desc:'+1 AGI',eff:{stat:{agi:1}}},7:{name:'Cutting Shade',desc:'+2 max MP and +1 AGI',eff:{stat:{mp:2,agi:1}}},10:{name:"Vel's Second Shadow",desc:'A unique passive: +8% dodge and +10% shadow damage.',grant:'vel_second'}}},
  {id:'briar', name:'Briar Holt', place:'lodge', job:'warden', plus:'hp', plus2:'str', minus:'mag', minusScale:2, need:5, line:'The wood keeps its own watch. I only loan it my hands.', gifts:{5:{name:'Wood Watch',desc:'+4 max HP',eff:{stat:{hp:4}}},7:{name:'Loan of Hands',desc:'+1 STR and +4 max HP',eff:{stat:{str:1,hp:4}}},10:{name:"Briar's Watch",desc:'A unique passive: attackers take 2 damage and +8 HP.',grant:'briar_watch'}}},
  {id:'fenn', name:'Fenn of the Vale', place:'lodge', job:'warden', plus:'hp', plus2:'def', minus:'agi', minusScale:2, need:5, line:'Roots do not rush, and they do not yield.', gifts:{5:{name:'Unrushed',desc:'+4 max HP',eff:{stat:{hp:4}}},7:{name:'Unyielding',desc:'+1 DEF and +4 max HP',eff:{stat:{def:1,hp:4}}},10:{name:"Fenn's Hold",desc:'A unique passive: take 1 less damage and +5 max stamina.',grant:'fenn_hold'}}},
];
D.MENTOR = {}; D.MENTORS.forEach(m => D.MENTOR[m.id] = m);
D.MENTOR_MAX = 10;
// per rank: bonus grows every rank (hp ×2, mp ×1.5 rounded), minus grows every 3rd rank
D.MENTOR_PLUS = r => r;                      // every rank gives a visible +1 (HP ×3, MP ×2)
D.MENTOR_MINUS = r => Math.floor(r/3);       // −1 at rank 3, 6, 9
D.MENTOR_GIFT_RANKS = [5,7,10];

/* ---------------- tavern meals (cooked by the Cooking worker, eaten when the party sets out) ---------------- */
D.FOODS = [
  {id:'stew', name:'Rabbit Stew', icon:'🍲', tav:1, cook:1, mats:{herb:2, fur:1}, buff:{str:1}, desc:'+1 STR (stacks with other packed meals)'},
  {id:'bread', name:'Herb Bread', icon:'🍞', tav:2, cook:4, mats:{herb:4}, buff:{hp:4}, desc:'+4 max HP for one expedition'},
  {id:'pie', name:'Honey Pie', icon:'🥧', tav:3, cook:8, mats:{herb:4, silk:1}, buff:{agi:2, mag:1}, desc:'+2 AGI, +1 MAG'},
  {id:'roast', name:"Hunter's Roast", icon:'🍖', tav:4, cook:12, mats:{fur:5, herb:4}, buff:{str:2, def:1}, desc:'+2 STR, +1 DEF'},
  {id:'chowder', name:'Marsh Chowder', icon:'🥣', tav:5, cook:17, mats:{lily:3, herb:6}, buff:{hp:10, mp:3}, desc:'+10 HP, +3 MP'},
  {id:'chili', name:'Ember Chili', icon:'🌶️', tav:6, cook:23, mats:{ember:3, fur:6}, buff:{str:3, mag:3}, desc:'+3 STR, +3 MAG'},
  {id:'feast', name:'Royal Feast', icon:'🍱', tav:7, cook:30, mats:{frost:3, fur:8, herb:10}, buff:{hp:12, str:3, def:3, mag:3, agi:3}, desc:'+12 HP, +3 to all'},
  {id:'dragon_soup', name:'Dragonfire Broth', icon:'🫕', tav:8, cook:38, mats:{dscale:2, ember:6}, buff:{hp:20, str:5, def:5, mag:5, agi:4}, desc:'+20 HP, +5 STR/DEF/MAG, +4 AGI'},
];
D.FOOD = {}; D.FOODS.forEach(f => D.FOOD[f.id] = f);
D.COOK_SEC = 300; // seconds per meal at Cooking Lv1 (−2% per level, min 90)

/* ---------------- bestiary ----------------
   Kills teach the Library about a foe. Each tier weakens that foe for good. Tiers past 1 need Library levels.
   Rare "Gilded" variants (2%) give triple gold and count for the zone collection. */
D.BEAST_TIERS = [
  {kills:0, lib:0, red:0, label:'Unknown'},
  {kills:15, lib:0, red:.05, label:'Studied — stats shown, −5% ATK/DEF/AGI'},
  {kills:50, lib:0, red:.10, label:'Known — weakness shown, −10% ATK/DEF/AGI', dia:1},
  {kills:150, lib:0, red:.15, label:'Mastered — −15% ATK/DEF/AGI, +25% weakness damage', dia:3},
  {kills:400, lib:0, red:.22, label:'Legend — −22% ATK/DEF/AGI, +50% weakness damage', dia:5},
];
// Library levels lower these kill counts (they never add kills). Scholarship research also lowers them.
D.LIB_KILL_REDUCE = 0.07; // 7% fewer kills needed per Library level, min 50% of the listed count
D.STAGES = 10;
D.STAGE_REWARD = {gold:8, jp:1}; // base gold × (zone+1); a diamond on stages 5 and 10
D.FUSE_NEED = 10;
D.DRILL = {cooldown:45, cap:80, perfect:3, good:1, unit:0.001}; // cap 8% XP/gold; +0.3% / +0.1% per success; 45s cooldown
D.BANK = {rateDay:0.008, workerBonus:0.0015, goldPerDia:600, maxRateDay:0.02};
D.MARKET_EVERY = 8*3600;
D.BOSS_REMATCH = 20; // fights in the last stage between auto rematches, after the first boss kill
D.BOSS_CHANCE = 0; // rematches are deterministic (countdown in the battle UI)

D.VARIANT_CHANCE = .02;
// Zone collection: every foe Mastered (tier 3) + every Gilded variant defeated + boss beaten = the zone's relic.

D.TUTORIAL = [
  {id:'town', text:'Welcome to Lanternfall. Tap the 🏛️ Town Hall and give your one worker a job (Mining digs up 💎).', done:s=>Object.keys(s.workers).length>0},
  {id:'depart', text:'Tap the 🔥 campfire (or the 🗺️ Map) and set out for Greenhollow Meadow. Battles only start when you choose to go.', done:s=>s.stats.departs>=1},
  {id:'win', text:'Your party fights on its own. Wins give XP, gold, AP (skill progress) and JP. They never drop items.', done:s=>s.stats.wins>=5},
  {id:'learn', text:'Each piece of gear teaches skills. Keep fighting until someone learns one for good (👥 Party → Skills).', done:s=>s.stats.learned>=1},
  {id:'job', text:'One learned skill of a type opens a job. 👥 Party → Job: pick it, then spend JP on the grid.', done:s=>s.chars.some(c=>c.job)},
  {id:'stamina', text:'When stamina runs out the party walks home. In town, heroes rest, train Endurance, or study with mentors.', done:s=>s.stats.returns>=1},
  {id:'pull', text:'Gear comes from the gear halls. Visit the 🔥 Forge and pull with 💎 Diamonds.', done:s=>s.stats.pulls>=1},
  {id:'boss', text:'Win enough battles in a zone and its boss appears. Beat it to open the next zone.', done:s=>s.zones[0].boss},
];

/* ---------------- gear gacha ----------------
   Gear has a rarity. Five gear halls each hold gear for one skill type. Upgrading a hall improves its rates
   and unlocks higher-tier gear (capped by how far you've travelled). Pulls cost 💎 Diamonds (the Mine, first boss kills, bestiary rewards). */
D.RARITY = [
  {name:'Common', short:'C', color:'#8a8f98', mult:1, ap:0, sell:1},
  {name:'Uncommon', short:'U', color:'#3f8f4f', mult:1.5, ap:0, sell:1.8},
  {name:'Rare', short:'R', color:'#2f6fbf', mult:2.3, ap:1, sell:3.5},
  {name:'Epic', short:'E', color:'#8a3fbf', mult:3.5, ap:2, sell:7},
  {name:'Legendary', short:'L', color:'#c27a12', mult:5.2, ap:3, sell:14},
  {name:'Mythic', short:'M', color:'#c43a4a', mult:8, ap:5, sell:28},
];
D.BANNERS = {
  forge:{name:'Forge', icon:'🔥', type:'martial', jobs:'Knight · Paladin · Spellblade', desc:'Swords, axes and heavy armor for front-liners.'},
  chapel:{name:'Chapel', icon:'⛪', type:'holy', jobs:'Priest · Paladin · Druid', desc:'Rods, robes and charms for healers.'},
  arcanum:{name:'Arcanum', icon:'🔮', type:'arcane', jobs:'Mage · Spellblade · Warlock', desc:'Staves and robes for spellcasters.'},
  den:{name:"Thieves' Den", icon:'🗝️', type:'shadow', jobs:'Thief · Assassin · Warlock', desc:'Daggers and cloaks for rogues.'},
  lodge:{name:"Hunter's Lodge", icon:'🏹', type:'wild', jobs:'Ranger · Druid · Assassin', desc:'Bows and charms for rangers.'},
};
D.BANNER_ORDER = ['forge','chapel','arcanum','den','lodge'];
// rarity rates (%) by hall level 1..8: [C, U, R, E, L, Mythic] — high rarities stay scarce for longevity
D.BANNER_RATES = [null,
  [70,22,6.4,1.4,0.18,0.02],[64,24,8.5,2.9,0.52,0.08],[58,26,10.8,4.2,0.85,0.15],[52,27,13,6.2,1.5,0.3],
  [46,28,15.2,8,2.3,0.5],[40,29,17.4,9.6,3.2,0.8],[35,29,19.2,11.2,4.2,1.4],[30,29,21,12.8,5.2,2.0]];
D.PULL_COST = 5; D.PULL10_COST = 45; D.PITY = 60; D.PITY_MYTHIC = 180; // Epic+ by 60; Mythic by 180; every 10-pull has a Rare+
D.START_DIAMONDS = 10;

D.TOWN_POS = {x:52, y:82}; // Lanternfall on the world map
if(typeof module!=='undefined') module.exports={D};
