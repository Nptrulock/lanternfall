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
      {lv:6, name:'Second Wind', desc:'Once per battle, below 30% HP: heal 2 + 1 per 8 levels.', eff:{secondWind:2, swScale:8}},
      {lv:12, name:'Versatile', desc:'+1 STR, DEF, MAG and AGI.', eff:{stat:{str:1,def:1,mag:1,agi:1}}},
      {lv:20, name:'Fast Learner', desc:'+1 bonus AP every 2nd battle won (replaces Quick Study).', eff:{apEvery:2}},
      {lv:30, name:'Heroic Spirit', desc:'+10% damage and healing.', eff:{dmgPct:.10, healPct:.10}},
    ]},
  elf:{name:'Elf', icon:'🧝', desc:'Graceful spellcasters. Fragile, but magic comes naturally.',
    base:{hp:9,mp:7,str:2,def:1,mag:4,agi:4}, grow:{hp:1.1,mp:.8,str:.2,def:.2,mag:.45,agi:.35},
    traits:[
      {lv:1, name:'Keen Senses', desc:'+5% hit chance.', eff:{hit:.05}},
      {lv:5, name:'Mana Spring', desc:'Regain 1 MP every 3 rounds in battle.', eff:{mpEvery:3}},
      {lv:11, name:'Spellweave', desc:'+1 spell damage (+1 more per 10 levels).', eff:{spellFlat:1, sfScale:10}},
      {lv:18, name:'Starlit Mind', desc:'+3 max MP and +1 MAG.', eff:{stat:{mp:3,mag:1}}},
      {lv:28, name:'Eldritch Echo', desc:'15% chance to cast a spell twice for free.', eff:{echo:.15}},
    ]},
  dwarf:{name:'Dwarf', icon:'🧔', desc:'Stout and stubborn. Hard to knock down, slow to move.',
    base:{hp:15,mp:3,str:4,def:3,mag:1,agi:1}, grow:{hp:1.7,mp:.35,str:.35,def:.4,mag:.2,agi:.15},
    traits:[
      {lv:1, name:'Stout', desc:'+2 max HP.', eff:{stat:{hp:2}}},
      {lv:7, name:'Stoneskin', desc:'Take 1 less damage from every hit (min 1).', eff:{dr:1}},
      {lv:13, name:'Forgeborn', desc:'Weapons and armor give +1 more of their main stat.', eff:{gearPlus:1}},
      {lv:21, name:'Unbreakable', desc:'Survive one lethal hit per battle at 1 HP.', eff:{endure:1}},
      {lv:30, name:'Mountain Heart', desc:'+8 max HP, +2 DEF.', eff:{stat:{hp:8,def:2}}},
    ]},
  halfling:{name:'Halfling', icon:'🧒', desc:'Small, quick and lucky. Finds more gold and dodges blows.',
    base:{hp:10,mp:4,str:2,def:2,mag:2,agi:5}, grow:{hp:1.2,mp:.45,str:.25,def:.25,mag:.3,agi:.45},
    traits:[
      {lv:1, name:'Lucky', desc:'+4% dodge.', eff:{dodge:.04}},
      {lv:5, name:'Coin Sense', desc:'+10% gold from battles.', eff:{gold:.10}},
      {lv:10, name:'Light Fingers', desc:'+30% chance for enemies to drop materials.', eff:{matFind:.3}},
      {lv:17, name:'Lucky Break', desc:'+6% critical hit chance.', eff:{crit:.06}},
      {lv:26, name:'Fortune\'s Favor', desc:'Relic and gear drops 25% more likely.', eff:{dropFind:.25}},
    ]},
  orc:{name:'Orc', icon:'👹', desc:'Brutal fighters whose rage grows as they bleed.',
    base:{hp:14,mp:2,str:5,def:2,mag:1,agi:2}, grow:{hp:1.6,mp:.25,str:.45,def:.3,mag:.15,agi:.25},
    traits:[
      {lv:1, name:'Brute', desc:'+1 physical damage.', eff:{physFlat:1}},
      {lv:6, name:'Bloodrage', desc:'+2 STR while below half HP.', eff:{rage:2}},
      {lv:12, name:'Thick Hide', desc:'+1 DEF and +3 max HP.', eff:{stat:{def:1,hp:3}}},
      {lv:19, name:'Savage Swing', desc:'Attacks have a 12% chance to hit every enemy.', eff:{cleaveChance:.12}},
      {lv:29, name:'Warlord', desc:'+15% physical damage.', eff:{physPct:.15}},
    ]},
  beastkin:{name:'Beastkin', icon:'🦊', desc:'Wild hunters with sharp instincts and fast reflexes.',
    base:{hp:11,mp:3,str:3,def:1,mag:2,agi:5}, grow:{hp:1.3,mp:.35,str:.35,def:.25,mag:.2,agi:.45},
    traits:[
      {lv:1, name:'Pounce', desc:'Always acts early in the first round.', eff:{first:1}},
      {lv:6, name:'Feral Instinct', desc:'+5% crit chance.', eff:{crit:.05}},
      {lv:11, name:'Pack Hunter', desc:'+1 damage for each other living ally (max +3).', eff:{pack:1}},
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
  steal:{name:'Steal', type:'shadow', kind:'active', ap:12, mp:0, tgt:'enemy', eff:{steal:1}, desc:'Try to steal gold or a material.'},
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
  midas:{name:'Midas Touch', type:'vital', kind:'passive', ap:250, eff:{gold:1, dropFind:1}, desc:'Double gold and double gear/material drops (party-wide).'},
  haste:{name:'Haste', type:'vital', kind:'passive', ap:250, eff:{haste:.5}, desc:'50% chance to act twice every round.'},
  dragonblood:{name:'Dragonblood', type:'vital', kind:'passive', ap:250, eff:{stat:{hp:6,str:3,def:3,mag:3,agi:3}}, desc:'+6 HP and +3 to every other stat.'},
  // Job-exclusive (from job trees; only usable while that job is active)
  shield_bash:{name:'Shield Bash', type:'job', kind:'active', mp:2, tgt:'enemy', eff:{phys:1.1, stun:.5}, desc:'110% damage, 50% chance to stun.'},
  sanctuary:{name:'Sanctuary', type:'job', kind:'active', mp:4, tgt:'party', eff:{heal:6}, desc:'Restore 6 + ½MAG HP to the whole party.'},
  arcane_bolt:{name:'Arcane Bolt', type:'job', kind:'active', mp:3, tgt:'enemy', eff:{spell:7, el:'arcane'}, desc:'Pure arcane damage (7 + MAG), no weakness needed.'},
  mug:{name:'Mug', type:'job', kind:'active', mp:1, tgt:'enemy', eff:{phys:1.2, steal:1}, desc:'Hit for 120% and steal at the same time.'},
  volley:{name:'Volley', type:'job', kind:'active', mp:3, tgt:'all', eff:{phys:.9, sure:1}, desc:'Arrows hit every enemy for 90%, never miss.'},
  holy_blade:{name:'Holy Blade', type:'job', kind:'active', mp:3, tgt:'enemy', eff:{phys:1.5, el:'holy', selfHeal:2}, desc:'150% holy-edged strike; heal yourself 2.'},
  elemental_edge:{name:'Elemental Edge', type:'job', kind:'active', mp:2, tgt:'enemy', eff:{phys:1.3, weakSeek:1}, desc:'130% strike that always uses the target\'s weakness.'},
  thornstorm:{name:'Thornstorm', type:'job', kind:'active', mp:4, tgt:'all', eff:{spell:4, el:'wild', partyHeal:2}, desc:'Wild damage to all enemies, heal party 2.'},
  assassinate:{name:'Assassinate', type:'job', kind:'active', mp:3, tgt:'enemy', eff:{phys:2, crit:.4}, desc:'200% damage, +40% crit chance.'},
  drain:{name:'Drain', type:'job', kind:'active', mp:3, tgt:'enemy', eff:{spell:5, el:'shadow', lifesteal:.5}, desc:'Shadow damage (5 + MAG), heal half of it.'},
};

/* ---------------- jobs ----------------
   req: learned skills per type. advanced jobs also need a mentor at the Guild Hall. */
const N = (id, name, tier, cost, eff, desc, req) => ({id, name, tier, cost, eff, desc, req});
D.JOBS = {
  knight:{name:'Knight', icon:'🛡️', req:{martial:3}, stats:{hp:4,def:1}, desc:'A sturdy front-liner.', tree:[
    N('k1','Shield Training',1,4,{stat:{def:1}},'+1 DEF'),
    N('k2','Vigor',1,6,{stat:{hp:4}},'+4 max HP'),
    N('k3','Shield Bash',2,10,{grant:'shield_bash'},'Learn Shield Bash (stun)','k1'),
    N('k4','Heavy Arms',2,14,{physPct:.15},'+15% physical damage','k2'),
    N('k5','Bulwark',2,14,{dr:1},'Take 1 less damage per hit','k1'),
    N('k6','Taunt',3,24,{taunt:.35},'Enemies target you 35% more often','k5'),
    N('k7','Last Stand',3,32,{endure:1},'Survive one lethal hit per battle','k4'),
  ]},
  priest:{name:'Priest', icon:'⛪', req:{holy:3}, stats:{mp:3,mag:1}, desc:'Keeps the party standing.', tree:[
    N('p1','Devotion',1,4,{stat:{mp:2}},'+2 max MP'),
    N('p2','Gentle Hands',1,6,{healPct:.2},'+20% healing'),
    N('p3','Sanctuary',2,10,{grant:'sanctuary'},'Learn Sanctuary (party heal)','p2'),
    N('p4','Serenity',2,12,{mpEvery:3},'Regain 1 MP every 3 rounds','p1'),
    N('p5','Smite',2,14,{holyPct:.4},'+40% holy damage','p1'),
    N('p6','Guardian Angel',3,24,{rebirth:.25},'Once per battle, rise at 25% HP','p3'),
    N('p7','Grace',3,32,{healPct:.3, stat:{mag:2}},'+30% healing, +2 MAG','p3'),
  ]},
  mage:{name:'Mage', icon:'🧙', req:{arcane:3}, stats:{mp:3,mag:1}, desc:'Elemental destruction.', tree:[
    N('m1','Study',1,4,{stat:{mag:1}},'+1 MAG'),
    N('m2','Deep Reserves',1,6,{stat:{mp:3}},'+3 max MP'),
    N('m3','Arcane Bolt',2,10,{grant:'arcane_bolt'},'Learn Arcane Bolt','m1'),
    N('m4','Elementalist',2,14,{spellPct:.2},'+20% spell damage','m1'),
    N('m5','Thrift',2,12,{mpCut:1},'Spells cost 1 less MP (min 1)','m2'),
    N('m6','Exploit',3,24,{weakPct:.5},'Weakness hits deal +50% more','m4'),
    N('m7','Archmage',3,32,{spellPct:.25, stat:{mag:2}},'+25% spell damage, +2 MAG','m4'),
  ]},
  thief:{name:'Thief', icon:'🗝️', req:{shadow:3}, stats:{agi:2}, desc:'Quick hands, quicker blades.', tree:[
    N('t1','Fleet Foot',1,4,{stat:{agi:1}},'+1 AGI'),
    N('t2','Pockets',1,6,{gold:.15},'+15% gold'),
    N('t3','Mug',2,10,{grant:'mug'},'Learn Mug','t2'),
    N('t4','Vital Spots',2,14,{crit:.08},'+8% crit','t1'),
    N('t5','Blur',2,14,{dodge:.08},'+8% dodge','t1'),
    N('t6','Treasure Hunter',3,24,{dropFind:.4, matFind:.4},'+40% gear and material drops','t3'),
    N('t7','Shadow Dance',3,32,{double:.15, stat:{agi:2}},'15% double attack, +2 AGI','t4'),
  ]},
  ranger:{name:'Ranger', icon:'🏹', req:{wild:3}, stats:{agi:1,str:1}, desc:'Precise shots and nature lore.', tree:[
    N('r1','Steady Aim',1,4,{hit:.06},'+6% hit'),
    N('r2','Trailwise',1,6,{postHeal:2},'Heal 2 HP after battle'),
    N('r3','Volley',2,10,{grant:'volley'},'Learn Volley (hits all)','r1'),
    N('r4','Hunter\'s Mark',2,14,{physPct:.15},'+15% physical damage','r1'),
    N('r5','Camouflage',2,12,{dodge:.07},'+7% dodge','r2'),
    N('r6','Beast Bond',3,24,{wildPct:.5, stat:{str:1}},'+50% wild damage, +1 STR','r3'),
    N('r7','Deadeye',3,32,{crit:.1, stat:{agi:2}},'+10% crit, +2 AGI','r4'),
  ]},
  paladin:{name:'Paladin', icon:'🦁', req:{martial:4, holy:3}, mentor:'paladin', stats:{hp:6,def:2,mag:1}, desc:'Holy knight: strikes and shields.', tree:[
    N('pa1','Oath',1,6,{stat:{def:1,hp:3}},'+1 DEF, +3 HP'),
    N('pa2','Faith',1,8,{healPct:.2},'+20% healing'),
    N('pa3','Holy Blade',2,14,{grant:'holy_blade'},'Learn Holy Blade','pa1'),
    N('pa4','Aegis',2,18,{dr:1},'Take 1 less damage per hit','pa1'),
    N('pa5','Judgement',3,30,{holyPct:.5, physPct:.1},'+50% holy, +10% physical damage','pa3'),
    N('pa6','Martyr',3,40,{rebirth:.5, taunt:.3},'Rise once at 50%; draw enemy attacks','pa4'),
  ]},
  spellblade:{name:'Spellblade', icon:'🗡️', req:{martial:4, arcane:3}, mentor:'spellblade', stats:{str:1,mag:1,agi:1}, desc:'Steel and spell in one swing.', tree:[
    N('sb1','Runic Edge',1,6,{stat:{str:1,mag:1}},'+1 STR, +1 MAG'),
    N('sb2','Battle Focus',1,8,{stat:{mp:3}},'+3 max MP'),
    N('sb3','Elemental Edge',2,14,{grant:'elemental_edge'},'Learn Elemental Edge','sb1'),
    N('sb4','Arcane Steel',2,18,{physPct:.12, spellPct:.12},'+12% physical and spell damage','sb1'),
    N('sb5','Exploit',3,30,{weakPct:.6},'Weakness hits deal +60% more','sb3'),
    N('sb6','Blade Dance',3,40,{double:.15, stat:{agi:2}},'15% double attack, +2 AGI','sb4'),
  ]},
  druid:{name:'Druid', icon:'🌳', req:{wild:4, holy:3}, mentor:'druid', stats:{hp:3,mp:3,mag:1}, desc:'Nature\'s healer and storm.', tree:[
    N('d1','Rooted',1,6,{stat:{hp:3,def:1}},'+3 HP, +1 DEF'),
    N('d2','Wellspring',1,8,{regen:1},'Heal 1 HP each turn'),
    N('d3','Thornstorm',2,14,{grant:'thornstorm'},'Learn Thornstorm','d1'),
    N('d4','Bloom',2,18,{healPct:.3},'+30% healing','d2'),
    N('d5','Wild Heart',3,30,{wildPct:.6, stat:{mag:2}},'+60% wild damage, +2 MAG','d3'),
    N('d6','Renewal',3,40,{postHeal:6, mpEvery:2},'Heal 6 after battle, +1 MP every 2 rounds','d4'),
  ]},
  assassin:{name:'Assassin', icon:'🥷', req:{shadow:4, wild:3}, mentor:'assassin', stats:{agi:2,str:1}, desc:'One perfect strike.', tree:[
    N('as1','Silent Step',1,6,{stat:{agi:2}},'+2 AGI'),
    N('as2','Poisoner',1,8,{poisonPlus:2},'Poisons tick +2'),
    N('as3','Assassinate',2,14,{grant:'assassinate'},'Learn Assassinate','as1'),
    N('as4','Ambush',2,18,{first:1, crit:.08},'Act first, +8% crit','as1'),
    N('as5','Lethality',3,30,{critDmg:.5},'Crits deal +50% more','as3'),
    N('as6','Phantom',3,40,{dodge:.12, double:.1},'+12% dodge, 10% double attack','as4'),
  ]},
  warlock:{name:'Warlock', icon:'🕯️', req:{arcane:4, shadow:3}, mentor:'warlock', stats:{mag:2,mp:2}, desc:'Dark pacts, draining power.', tree:[
    N('w1','Pact',1,6,{stat:{mag:1,mp:2}},'+1 MAG, +2 MP'),
    N('w2','Hex',1,8,{shadowPct:.3},'+30% shadow damage'),
    N('w3','Drain',2,14,{grant:'drain'},'Learn Drain (lifesteal)','w2'),
    N('w4','Dark Insight',2,18,{spellPct:.2},'+20% spell damage','w1'),
    N('w5','Soul Harvest',3,30,{killMp:2},'Regain 2 MP on each kill','w3'),
    N('w6','Void Lord',3,40,{spellPct:.3, stat:{mag:3}},'+30% spell damage, +3 MAG','w4'),
  ]},
};
D.JOB_ORDER = ['knight','priest','mage','thief','ranger','paladin','spellblade','druid','assassin','warlock'];

/* ---------------- materials ---------------- */
D.MATS = {
  stone:{name:'Stone', icon:'🪨', desc:'Building block for every village upgrade.', sell:1},
  quartz:{name:'Quartz', icon:'🔹', desc:'A pretty crystal from the mine. Sell it for gold.', sell:4},
  silver:{name:'Silver Ore', icon:'🪙', desc:'Valuable ore from the mine. Sell it for gold.', sell:10},
  nugget:{name:'Gold Nugget', icon:'🟡', desc:'A lucky find deep in the mine. Sell it for gold.', sell:25},
  herb:{name:'Wild Herb', icon:'🌿', desc:'Used in potions and food.'},
  gel:{name:'Slime Gel', icon:'🟢', desc:'Sticky. Potions and the first village upgrades.'},
  fur:{name:'Soft Fur', icon:'🧶', desc:'Warm pelts for cooking and the tavern.'},
  timber:{name:'Living Timber', icon:'🪵', desc:'Strong wood for buildings.'},
  silk:{name:'Spider Silk', icon:'🕸️', desc:'Fine thread for the library and gear.'},
  copper:{name:'Copper Ore', icon:'🟠', desc:'Metal for the forge and smithy. Sells for a little gold.', sell:2},
  bone:{name:'Old Bone', icon:'🦴', desc:'Grim but useful: alchemy and the guild hall.'},
  lily:{name:'Bog Lily', icon:'🪷', desc:'Rare flower for strong potions.'},
  scale:{name:'Croc Scale', icon:'🐊', desc:'Tough hide for upgrades.'},
  ember:{name:'Ash Ember', icon:'🔥', desc:'Still warm. Smithy and tavern.'},
  frost:{name:'Frost Crystal', icon:'❄️', desc:'Never melts. Apothecary and library.'},
  ecto:{name:'Ectoplasm', icon:'👻', desc:'Ghostly residue for the guild hall.'},
  dscale:{name:'Dragon Scale', icon:'🐉', desc:'The finest material in the land.'},
};

/* ---------------- equipment ----------------
   slot: weapon | armor | acc. skills: taught by wearing it. tier = zone it belongs to. shop = smithy level to buy (null = drop only) */
const I = (id, name, icon, slot, tier, stats, skills, price, shop) => ({id, name, icon, slot, tier, stats, skills, price, shop});
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
  I('bsword','Bronze Shortsword','🗡️','weapon',0,{str:2},['power_strike','toughness'],20,null),
  I('buckler','Wooden Buckler','🛡️','acc',0,{def:1},['iron_skin'],18,null),
  I('beads','Prayer Beads','📿','acc',0,{mp:1},['heal','blessing'],20,null),
  I('vestment','Linen Vestment','🥼','armor',0,{def:1,mp:1},['holy_light'],18,null),
  I('tome','Apprentice Tome','📕','acc',0,{mag:1},['frost'],18,null),
  I('star_robe','Starry Robe','🧥','armor',0,{def:1,mag:1},['mana_font','fire'],20,null),
  I('hood','Rogue Hood','🎭','armor',0,{def:1,agi:1},['evasion'],18,null),
  I('lockpick','Lockpick Set','🪛','acc',0,{agi:1},['steal'],18,null),
  I('snare','Snare Kit','🪤','acc',0,{agi:1},['entangle'],18,null),
  // tier 1 — Whisperwood
  I('spear','Ash Spear','🔱','weapon',1,{str:2},['cleave'],40,2),
  I('staff','Willow Staff','🦯','weapon',1,{mag:2},['frost'],42,2),
  I('mace','Chapel Mace','🔨','weapon',1,{str:2,mag:1},['holy_light'],45,null),
  I('bow','Yew Bow','🏹','weapon',1,{str:2,agi:1},['entangle'],44,2),
  I('dagger','Silk Dagger','🗡️','weapon',1,{str:1,agi:2},['steal','evasion'],48,null),
  I('leather','Leather Armor','🥋','armor',1,{def:2},['iron_skin'],38,2),
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
  I('halberd','Bog Halberd','🔱','weapon',3,{str:4},['war_cry'],180,4),
  I('lily_staff','Lily Staff','🌸','weapon',3,{mag:4,mp:2},['circle'],0,null),
  I('croc_mail','Croc Mail','🐊','armor',3,{def:4,hp:4},['counter'],170,4),
  I('purse','Hag\'s Purse','👛','acc',3,{agi:2},['greed'],0,null),
  I('marsh_bow','Reed Longbow','🏹','weapon',3,{str:3,agi:2},['aimed_shot','entangle'],175,null),
  // tier 4 — Ashen Highlands
  I('flamberge','Flamberge','⚔️','weapon',4,{str:6},['double_strike'],0,null),
  I('ember_rod','Ember Scepter','🔥','weapon',4,{mag:6},['flame_wave'],340,5),
  I('ash_plate','Ashen Plate','🛡️','armor',4,{def:6,hp:6},['iron_skin','toughness'],320,5),
  I('phoenix_ring','Cinder Ring','💍','acc',4,{mag:2,hp:3},['raise'],0,null),
  // tier 5 — Frostpeak
  I('ice_brand','Ice Brand','🗡️','weapon',5,{str:8,agi:1},['cleave','sunder'],600,6),
  I('glacier_staff','Glacier Staff','🧊','weapon',5,{mag:8,mp:3},['thunder'],0,null),
  I('yeti_coat','Yeti Coat','🧥','armor',5,{def:8,hp:10},['counter','toughness'],560,6),
  I('owl_charm','Owl Charm','🦉','acc',5,{mag:3,agi:3},['keen_eye','focus'],0,null),
  // tier 6 — Shadowfell Ruins
  I('soul_blade','Soulreaver','🗡️','weapon',6,{str:11,agi:2},['double_strike','backstab'],0,null),
  I('lich_staff','Lich Staff','🦯','weapon',6,{mag:11,mp:4},['night_shade','thunder'],1100,7),
  I('dark_plate','Darksteel Plate','🛡️','armor',6,{def:11,hp:14},['protect','counter'],1000,7),
  I('grave_ring','Grave Ring','💍','acc',6,{mp:4,mag:3},['prayer','circle'],0,null),
  // tier 7 — Dragon's Spine
  I('dragon_sword','Dragonfang','⚔️','weapon',7,{str:15,agi:3},['war_cry','double_strike'],0,null),
  I('dragon_staff','Wyrm Staff','🪄','weapon',7,{mag:15,mp:6},['flame_wave','raise'],2200,8),
  I('dragon_mail','Dragonscale Mail','🐲','armor',7,{def:15,hp:20},['thorn_hide','iron_skin'],2000,8),
];
D.ITEM = {}; D.ITEMS.forEach(it => D.ITEM[it.id] = it);
D.SLOTS = ['weapon','armor','acc','relic'];
D.SLOT_NAMES = {weapon:'Weapon', armor:'Armor', acc:'Accessory', relic:'Relic'};

/* ---------------- relics ----------------
   Very rare. Equip in the relic slot. Each houses one vital skill (250 AP to master). odds = 1 in N */
D.RELICS = [
  {id:'phoenix', name:'Phoenix Feather', icon:'🪶', skill:'rebirth', stats:{hp:4}, src:{boss:1, odds:29, any:9000}, desc:'Warm to the touch, it refuses to let its bearer fall.'},
  {id:'crest', name:'Hero\'s Crest', icon:'🎖️', skill:'valor', stats:{str:2}, src:{boss:2, odds:29, any:9000}, desc:'Worn by the last hero of the realm.'},
  {id:'midas', name:'Gilded Hand', icon:'🖐️', skill:'midas', stats:{agi:1}, src:{boss:3, odds:33, any:12000}, desc:'Everything it touches turns valuable.'},
  {id:'chalice', name:'Saint\'s Chalice', icon:'🏆', skill:'miracle', stats:{mp:4,mag:1}, src:{boss:4, odds:33, any:12000}, desc:'Its water mends anything.'},
  {id:'hourglass', name:'Hourglass of Ages', icon:'⏳', skill:'haste', stats:{agi:3}, src:{boss:5, odds:37, any:15000}, desc:'Time bends around whoever holds it.'},
  {id:'moonstone', name:'Moonstone Tiara', icon:'👑', skill:'starfall', stats:{mag:3,mp:3}, src:{boss:6, odds:37, any:15000}, desc:'Pulls the stars down from the sky.'},
  {id:'dragonheart', name:'Dragon Heart', icon:'❤️‍🔥', skill:'dragonblood', stats:{hp:5}, src:{boss:7, odds:41, any:18000}, desc:'Still beating, centuries later.'},
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
D.ZP = {hp:[5,10,18,30,46,66,92,124], atk:[3,5,7,10,14,18,23,29], def:[0,1,3,5,8,11,15,19], agi:[2,4,5,7,9,11,13,15],
        xp:[2,4,8,13,20,30,44,62], gold:[1,3,5,9,14,21,30,42]};
const E = (id, name, icon, role, weak, drops, extra) => Object.assign({id, name, icon, role, weak, drops}, extra || {});
D.ZONES = [
  {id:'meadow', name:'Greenhollow Meadow', lv:'1–3', bg:['#7fc96b','#3d7a3a'], sky:['#8ecbf0','#d9f1ff'], wins:30,
    desc:'Gentle fields just outside the village. Slimes and rabbits. A good place to learn.',
    enemies:[
      E('slime','Blue Slime','💧','normal','fire',[['gel',.35],['gel_bangle',.02],['ring_mp',.015]]),
      E('rabbit','Horned Rabbit','🐇','quick','wild',[['fur',.3],['charm',.02]]),
      E('mushling','Mushling','🍄','tank','fire',[['herb',.3],['tunic',.02]]),
      E('bee','Buzzbee','🐝','quick','ice',[['herb',.2],['knife',.02]]),
    ],
    boss:E('king_slime','King Slime','💧','tank','fire',[['gel',1],['gel_bangle',.3],['ring_mp',.3]], {boss:1, hat:'👑'})},
  {id:'wood', name:'Whisperwood', lv:'3–7', bg:['#3f7d4a','#1f4027'], sky:['#5d8f6b','#a9d1a4'], wins:50,
    desc:'Old trees that murmur at night. Wolves hunt in packs here.',
    enemies:[
      E('wolf','Grey Wolf','🐺','quick','fire',[['fur',.35],['bow',.02]]),
      E('sapling','Treant Sapling','🌳','tank','fire',[['timber',.35],['bark',.025]]),
      E('imp','Forest Imp','👺','caster','holy',[['herb',.25],['robe',.025],['amulet',.02]]),
      E('spider','Webspinner','🕷️','normal','fire',[['silk',.35],['dagger',.025]]),
    ],
    boss:E('elder_treant','Elder Treant','🌲','tank','fire',[['timber',1],['mace',.3],['bark',.3]], {boss:1})},
  {id:'mines', name:'Old Copper Mines', lv:'7–11', bg:['#6b5a4a','#2e241c'], sky:['#3a2f28','#5a4a3c'], wins:80,
    desc:'Abandoned tunnels. Bats in the dark, golems in the deep.',
    enemies:[
      E('bat','Cave Bat','🦇','quick','wild',[['bone',.2],['cloak',.02]]),
      E('kobold','Kobold Digger','🦎','normal','ice',[['copper',.35],['kris',.02]]),
      E('golem','Rock Golem','🗿','tank','bolt',[['stone',.5],['copper',.3]]),
      E('skeleton','Skeleton Miner','💀','brute','holy',[['bone',.35],['scepter',.02],['lens',.015]]),
    ],
    boss:E('troll','Cave Troll','🧌','brute','fire',[['copper',1],['fang',.3],['lens',.3]], {boss:1})},
  {id:'marsh', name:'Sunken Marsh', lv:'11–15', bg:['#5c6b3a','#26301a'], sky:['#6f7d5a','#a8b38c'], wins:110,
    desc:'Fog, frogs and a hag who never shares. Poison bites here.',
    enemies:[
      E('frog','Bog Frog','🐸','normal','ice',[['lily',.25],['herb',.3]]),
      E('wisp','Marsh Wisp','🔥','caster','ice',[['lily',.3],['lily_staff',.015]]),
      E('hag','Swamp Hag','🧙‍♀️','caster','holy',[['herb',.3],['purse',.02]]),
      E('croc','Mud Croc','🐊','brute','bolt',[['scale',.35],['marsh_bow',.015]]),
    ],
    boss:E('hydra','Marsh Hydra','🐍','brute','fire',[['scale',1],['lily_staff',.3],['purse',.3]], {boss:1})},
  {id:'ash', name:'Ashen Highlands', lv:'15–20', bg:['#7a4a3a','#3a1f18'], sky:['#c2694a','#f0b088'], wins:140,
    desc:'A volcanic plateau. Everything here burns.',
    enemies:[
      E('salamander','Salamander','🦎','quick','ice',[['ember',.3],['phoenix_ring',.012]]),
      E('hawk','Ember Hawk','🦅','quick','bolt',[['ember',.25],['flamberge',.01]]),
      E('wraith','Ash Wraith','👻','caster','holy',[['ecto',.2],['ember',.2]]),
      E('lava_golem','Lava Golem','🌋','tank','ice',[['stone',.5],['ember',.35]]),
    ],
    boss:E('salamander_lord','Salamander Lord','🔥','brute','ice',[['ember',1],['flamberge',.3],['phoenix_ring',.3]], {boss:1})},
  {id:'frost', name:'Frostpeak', lv:'20–26', bg:['#cfe3ef','#7d98ad'], sky:['#9fb7c9','#e8f3fb'], wins:170,
    desc:'Icy cliffs and howling wind. Bring fire.',
    enemies:[
      E('yeti','Yeti','🦍','brute','fire',[['frost',.3],['fur',.3]]),
      E('ice_wolf','Ice Wolf','🐺','quick','fire',[['frost',.25],['fur',.3]]),
      E('frost_wisp','Frost Wisp','❄️','caster','fire',[['frost',.35],['glacier_staff',.01]]),
      E('owl','Snow Owl','🦉','quick','bolt',[['frost',.2],['owl_charm',.012]]),
    ],
    boss:E('frost_giant','Frost Giant','🧊','brute','fire',[['frost',1],['glacier_staff',.3],['owl_charm',.3]], {boss:1})},
  {id:'ruins', name:'Shadowfell Ruins', lv:'26–33', bg:['#3a3048','#15111d'], sky:['#2a2238','#4a3d5c'], wins:200,
    desc:'A fallen kingdom ruled by the dead. Holy light burns them.',
    enemies:[
      E('ghoul','Ghoul','🧟','brute','holy',[['bone',.35],['ecto',.25]]),
      E('vamp_bat','Vampire Bat','🦇','quick','holy',[['ecto',.25],['soul_blade',.008]]),
      E('dark_knight','Dark Knight','🛡️','tank','holy',[['ecto',.3],['grave_ring',.01]]),
      E('necro','Necromancer','🧙','caster','holy',[['ecto',.35],['bone',.3]]),
    ],
    boss:E('lich','The Lich King','☠️','caster','holy',[['ecto',1],['soul_blade',.3],['grave_ring',.3]], {boss:1})},
  {id:'spine', name:'Dragon\'s Spine', lv:'33–40', bg:['#5a2a2a','#1d0c0c'], sky:['#7a2e1e','#d0703a'], wins:250,
    desc:'The mountain where the last dragon sleeps.',
    enemies:[
      E('drake','Fire Drake','🐲','brute','ice',[['dscale',.25],['dragon_sword',.006]]),
      E('wyvern','Wyvern','🦖','quick','bolt',[['dscale',.25],['dragon_mail',.008]]),
      E('cultist','Dragon Cultist','🧛','caster','holy',[['dscale',.2],['ecto',.3]]),
      E('ancient_golem','Ancient Golem','🗿','tank','bolt',[['stone',.6],['dscale',.2]]),
    ],
    boss:E('elder_dragon','Ignarath the Elder Dragon','🐉','brute','ice',[['dscale',1],['dragon_sword',.3],['dragon_mail',.3]], {boss:1})},
];

/* ---------------- village ----------------
   Each profession builds one building. Building level N needs profession level, gold and materials. */
D.PROFS = {
  smithing:{name:'Smithing', icon:'⚒️', building:'smithy', desc:'Hammer and anvil. Builds the Smithy: more gear for sale.'},
  cooking:{name:'Cooking', icon:'🍳', building:'tavern', desc:'Feeds the village. Builds the Tavern: food buffs.'},
  alchemy:{name:'Alchemy', icon:'⚗️', building:'apothecary', desc:'Brews remedies. Builds the Apothecary: potions and elixirs. Also gathers Wild Herbs.'},
  scholarship:{name:'Scholarship', icon:'📜', building:'library', desc:'Studies monsters. Builds the Library: bestiary knowledge = weaker enemies.'},
  masonry:{name:'Masonry', icon:'🧱', building:'guild', desc:'Quarries stone (used in every upgrade). Builds the Guild Hall (job mentors) and all five gear halls.'},
  mining:{name:'Mining', icon:'⛏️', building:null, desc:'Digs slowly for 💎 Diamonds (gear pulls), plus Stone, Copper and gems you can sell.'},
};
D.PROF_ORDER = ['mining','masonry','smithing','cooking','alchemy','scholarship'];
D.BUILDINGS = {
  smithy:{name:'Smithy', icon:'⚒️', prof:'smithing', unlock:'Sells basic gear and buys your spares. Each level raises sell prices and unlocks fusing 3 copies of an item into the next rarity.'},
  tavern:{name:'Tavern', icon:'🍺', prof:'cooking', unlock:'Each level adds a new meal (party buff for a number of battles).'},
  apothecary:{name:'Apothecary', icon:'⚗️', prof:'alchemy', unlock:'Each level adds potions and elixirs.'},
  library:{name:'Library', icon:'📚', prof:'scholarship', unlock:'Each level lets the bestiary teach one more tier of enemy weaknesses.'},
  guild:{name:'Guild Hall', icon:'🏛️', prof:'masonry', unlock:'Each level brings new mentors: JP bonuses, tier-3 job skills and advanced jobs.'},
};
D.BUILD_ORDER = ['smithy','tavern','apothecary','library','guild'];
D.BMAX = 8;
// level index = target level (1..8). prof = required profession level.
D.BUILD_COST = [null,
  {prof:1, gold:0, stone:0},
  {prof:3, gold:40, stone:5},
  {prof:6, gold:120, stone:12},
  {prof:10, gold:300, stone:25},
  {prof:15, gold:700, stone:40},
  {prof:21, gold:1500, stone:60},
  {prof:28, gold:3000, stone:90},
  {prof:36, gold:6000, stone:130},
];
// each building's flavor material for levels 2..8 (amount = 2 × level)
D.BUILD_MATS = {
  smithy:    ['gel','timber','copper','scale','ember','frost','dscale'],
  tavern:    ['fur','fur','silk','lily','ember','frost','ecto'],
  apothecary:['herb','silk','bone','lily','ember','frost','ecto'],
  library:   ['gel','silk','bone','scale','ecto','frost','dscale'],
  guild:     ['fur','timber','bone','scale','ember','ecto','dscale'],
};
D.WORKER_SLOTS = [{vl:0, n:2}, {vl:5, n:3}, {vl:14, n:4}, {vl:28, n:5}, {vl:45, n:6}]; // vl = village level (sum of building levels)

D.FOODS = [
  {id:'stew', name:'Rabbit Stew', icon:'🍲', tav:1, gold:15, mats:{fur:2}, battles:20, buff:{str:1}, desc:'+1 STR'},
  {id:'bread', name:'Herb Bread', icon:'🍞', tav:2, gold:25, mats:{herb:3}, battles:25, buff:{hp:4}, desc:'+4 max HP'},
  {id:'pie', name:'Honey Pie', icon:'🥧', tav:3, gold:50, mats:{herb:3, gel:3}, battles:25, buff:{agi:2, mag:1}, desc:'+2 AGI, +1 MAG'},
  {id:'roast', name:'Hunter\'s Roast', icon:'🍖', tav:4, gold:120, mats:{fur:6, herb:4}, battles:30, buff:{str:2, def:1}, desc:'+2 STR, +1 DEF'},
  {id:'chowder', name:'Marsh Chowder', icon:'🥣', tav:5, gold:260, mats:{lily:4, herb:6}, battles:30, buff:{hp:10, mp:3}, desc:'+10 HP, +3 MP'},
  {id:'chili', name:'Ember Chili', icon:'🌶️', tav:6, gold:520, mats:{ember:5, fur:6}, battles:35, buff:{str:3, mag:3}, desc:'+3 STR, +3 MAG'},
  {id:'feast', name:'Royal Feast', icon:'🍱', tav:7, gold:1000, mats:{frost:5, fur:10, herb:10}, battles:40, buff:{hp:12, str:3, def:3, mag:3, agi:3}, desc:'+12 HP, +3 to all'},
  {id:'dragon_soup', name:'Dragonfire Broth', icon:'🫕', tav:8, gold:2200, mats:{dscale:3, ember:8}, battles:50, buff:{hp:20, str:5, def:5, mag:5, agi:4}, desc:'+20 HP, +5 STR/DEF/MAG, +4 AGI'},
];
D.POTIONS = [
  {id:'potion', name:'Potion', icon:'🧪', apo:1, gold:8, mats:{herb:1}, use:{heal:10}, desc:'Heals 10 HP. Used automatically below 35% HP.'},
  {id:'ether', name:'Ether', icon:'💧', apo:2, gold:20, mats:{herb:1, gel:1}, use:{mp:5}, desc:'Restores 5 MP. Used automatically when a caster runs dry.'},
  {id:'phoenix_down', name:'Phoenix Down', icon:'🪶', apo:3, gold:45, mats:{herb:2, bone:1}, use:{revive:.5}, desc:'Revives a fallen ally at 50% HP during battle.'},
  {id:'hi_potion', name:'Hi-Potion', icon:'⚗️', apo:4, gold:40, mats:{lily:1, herb:1}, use:{heal:30}, desc:'Heals 30 HP. Used before regular Potions.'},
  {id:'elixir_might', name:'Tonic of Might', icon:'💪', apo:2, gold:30, mats:{herb:2, gel:2}, elixir:{str:2}, battles:25, desc:'Party +2 STR for 25 battles.'},
  {id:'elixir_ward', name:'Ironbark Draught', icon:'🛡️', apo:3, gold:60, mats:{herb:2, timber:2}, elixir:{def:2}, battles:25, desc:'Party +2 DEF for 25 battles.'},
  {id:'elixir_mind', name:'Sage Draught', icon:'🧠', apo:5, gold:150, mats:{lily:2, silk:2}, elixir:{mag:3, mp:3}, battles:30, desc:'Party +3 MAG, +3 MP for 30 battles.'},
  {id:'elixir_swift', name:'Quicksilver', icon:'⚡', apo:6, gold:300, mats:{ember:2, frost:1}, elixir:{agi:4}, battles:30, desc:'Party +4 AGI for 30 battles.'},
  {id:'elixir_hero', name:'Hero\'s Elixir', icon:'🌟', apo:8, gold:1200, mats:{dscale:1, ecto:3}, elixir:{str:5, def:5, mag:5, agi:5}, battles:40, desc:'Party +5 to all stats for 40 battles.'},
];
D.POTION = {}; D.POTIONS.forEach(p => D.POTION[p.id] = p);
D.FOOD = {}; D.FOODS.forEach(f => D.FOOD[f.id] = f);
// Guild Hall mentors
D.MENTORS = [
  {id:'knight', name:'Sir Aldric', job:'knight', gl:1, desc:'Knight mentor: +1 JP per win for Knights; unlocks Knight tier-3 skills.'},
  {id:'priest', name:'Mother Sela', job:'priest', gl:1, desc:'Priest mentor: +1 JP per win for Priests; unlocks Priest tier-3 skills.'},
  {id:'mage', name:'Magister Vey', job:'mage', gl:2, desc:'Mage mentor: +1 JP per win for Mages; unlocks Mage tier-3 skills.'},
  {id:'thief', name:'Quickfinger Pell', job:'thief', gl:2, desc:'Thief mentor: +1 JP per win for Thieves; unlocks Thief tier-3 skills.'},
  {id:'ranger', name:'Warden Ysolde', job:'ranger', gl:3, desc:'Ranger mentor: +1 JP per win for Rangers; unlocks Ranger tier-3 skills.'},
  {id:'paladin', name:'Lord Commander Brann', job:'paladin', gl:4, desc:'Unlocks the Paladin job (Martial 4 + Holy 3) and trains it.'},
  {id:'spellblade', name:'Duelist Kaia', job:'spellblade', gl:5, desc:'Unlocks the Spellblade job (Martial 4 + Arcane 3) and trains it.'},
  {id:'druid', name:'Elder Moss', job:'druid', gl:6, desc:'Unlocks the Druid job (Wild 4 + Holy 3) and trains it.'},
  {id:'assassin', name:'The Whisper', job:'assassin', gl:7, desc:'Unlocks the Assassin job (Shadow 4 + Wild 3) and trains it.'},
  {id:'warlock', name:'Morwen the Pale', job:'warlock', gl:8, desc:'Unlocks the Warlock job (Arcane 4 + Shadow 3) and trains it.'},
];
D.MENTOR = {}; D.MENTORS.forEach(m => D.MENTOR[m.id] = m);
// Bestiary: kills needed per knowledge tier; library level needed per tier; enemy stat reduction per tier
D.BEAST_TIERS = [
  {kills:0, lib:0, red:0, label:'Unknown'},
  {kills:10, lib:1, red:.05, label:'Studied: stats shown, −5% ATK/DEF/AGI'},
  {kills:30, lib:2, red:.10, label:'Known: weakness shown, −10% ATK/DEF/AGI'},
  {kills:80, lib:4, red:.15, label:'Mastered: −15% ATK/DEF/AGI, +25% weakness damage'},
  {kills:200, lib:6, red:.22, label:'Legendary lore: −22% ATK/DEF/AGI, +50% weakness damage'},
];

D.TUTORIAL = [
  {id:'fight', text:'Your party fights on its own. Watch the battle log: every win gives XP, gold and AP.', done:s=>s.stats.wins>=3},
  {id:'party', text:'Open 👥 Party. Each piece of gear teaches skills. The bars show progress; learn one to keep it forever.', done:s=>s.flags.sawParty},
  {id:'village', text:'Open 🏘️ Village and assign a worker to a profession. Professions level while you fight, even offline.', done:s=>Object.values(s.workers).some(Boolean)},
  {id:'shop', text:'Buy gear at the Smithy to learn new skills. Different gear = different skill types.', done:s=>s.stats.bought>=1},
  {id:'learn', text:'Keep winning until someone learns a skill permanently (AP bar fills).', done:s=>s.stats.learned>=1},
  {id:'boss', text:'Win enough battles in a zone and its boss appears on the 🗺️ Map. Beat it to unlock the next zone.', done:s=>s.zones[0].boss},
  {id:'job', text:'3 learned skills of one type (e.g. 3 Martial) unlock a Job. Jobs earn JP for a skill tree.', done:s=>s.chars.some(c=>c.job)},
];

/* ---------------- gear gacha ----------------
   Gear has a rarity. Five gear halls (built with Masonry) each hold gear for one skill type. Upgrading a hall improves its rates
   and unlocks higher-tier gear (capped by how far you've travelled). Pulls cost 💎 Diamonds (Mining, bosses, rare battle finds). */
D.RARITY = [
  {name:'Common', short:'C', color:'#c9ced8', mult:1, ap:0, sell:1},
  {name:'Uncommon', short:'U', color:'#6fe08a', mult:1.3, ap:0, sell:1.6},
  {name:'Rare', short:'R', color:'#5fa8ff', mult:1.7, ap:1, sell:3},
  {name:'Epic', short:'E', color:'#c77dff', mult:2.3, ap:2, sell:6},
  {name:'Legendary', short:'L', color:'#ffb547', mult:3.2, ap:3, sell:12},
];
D.BANNERS = {
  forge:{name:'Forge', icon:'🔥', type:'martial', jobs:'Knight · Paladin · Spellblade', desc:'Swords, axes and heavy armor for front-liners.', art:'⚔️'},
  chapel:{name:'Chapel', icon:'⛪', type:'holy', jobs:'Priest · Paladin · Druid', desc:'Rods, robes and charms for healers.', art:'✨'},
  arcanum:{name:'Arcanum', icon:'🔮', type:'arcane', jobs:'Mage · Spellblade · Warlock', desc:'Staves and robes for spellcasters.', art:'🪄'},
  den:{name:'Thieves\' Den', icon:'🗝️', type:'shadow', jobs:'Thief · Assassin · Warlock', desc:'Daggers and cloaks for rogues.', art:'🗡️'},
  lodge:{name:'Hunter\'s Lodge', icon:'🏹', type:'wild', jobs:'Ranger · Druid · Assassin', desc:'Bows and charms for rangers.', art:'🌿'},
};
D.BANNER_ORDER = ['forge','chapel','arcanum','den','lodge'];
// rarity rates (%) by hall level 1..8: [Common, Uncommon, Rare, Epic, Legendary]
D.BANNER_RATES = [null,
  [72,22,5,0.9,0.1],[66,25,7,1.7,0.3],[60,27,10,2.5,0.5],[54,29,12.5,3.7,0.8],
  [48,30,15.5,5.3,1.2],[42,31,18.5,6.9,1.6],[37,31,21,8.8,2.2],[32,31,23.5,10.5,3.0]];
D.PULL_COST = 5; D.PULL10_COST = 45; D.PITY = 60; // Epic or better guaranteed by pull 60; every 10-pull has a Rare or better
D.BANNER_COST = [null,
  {prof:2, gold:60, stone:6},
  {prof:4, gold:150, stone:12},
  {prof:7, gold:400, stone:25},
  {prof:11, gold:900, stone:40},
  {prof:16, gold:1800, stone:60},
  {prof:22, gold:3500, stone:85},
  {prof:29, gold:6500, stone:115},
  {prof:37, gold:11000, stone:150},
];
D.BANNER_MATS = {
  forge:  ['copper','copper','copper','scale','ember','frost','dscale'],
  chapel: ['herb','bone','bone','lily','ember','ecto','dscale'],
  arcanum:['gel','silk','silk','lily','ember','frost','dscale'],
  den:    ['fur','silk','bone','scale','ecto','ecto','dscale'],
  lodge:  ['fur','timber','timber','scale','ember','frost','dscale'],
};
D.MINING = [ // what a Mining villager digs up: one every `every` seconds (faster with level), from minLv
  {mat:'diamond', every:240, min:60, minLv:1},
  {mat:'stone', every:30, min:10, minLv:1},
  {mat:'quartz', every:45, min:15, minLv:1},
  {mat:'copper', every:70, min:20, minLv:3},
  {mat:'silver', every:120, min:40, minLv:6},
  {mat:'nugget', every:300, min:90, minLv:12},
];
D.TUTORIAL.splice(3, 1, {id:'gacha', text:'Gear comes from the gear halls. Village → 💎 Gear Halls → pull at the Forge with Diamonds. Mining digs up more Diamonds.', done:s=>s.stats.pulls>=1});
