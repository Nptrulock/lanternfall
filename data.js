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
  halfling:{name:'Halfling', icon:'🧒', desc:'Small, quick and lucky. Earns more gold and dodges blows.',
    base:{hp:10,mp:4,str:2,def:2,mag:2,agi:5}, grow:{hp:1.2,mp:.45,str:.25,def:.25,mag:.3,agi:.45},
    traits:[
      {lv:1, name:'Lucky', desc:'+4% dodge.', eff:{dodge:.04}},
      {lv:5, name:'Coin Sense', desc:'+10% gold from battles.', eff:{gold:.10}},
      {lv:10, name:'Light Fingers', desc:'+1 AGI and +3% dodge.', eff:{stat:{agi:1}, dodge:.03}},
      {lv:17, name:'Lucky Break', desc:'+6% critical hit chance.', eff:{crit:.06}},
      {lv:26, name:'Fortune\'s Favor', desc:'+5% crit and +15% gold.', eff:{crit:.05, gold:.15}},
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
  ]},
  priest:{name:'Priest', icon:'⛪', type:'holy', req:{holy:1}, stats:{mp:3,mag:1}, cmd:'sanctuary', desc:'Keeps the party standing.', branches:[
    ['Mercy', ['mp2','mag1', A('Gentle Hands',{healPct:.2},'+20% healing'), 'mp2','mag1', A('Grace',{healPct:.3},'+30% more healing')]],
    ['Faith', ['hp3','def1', A('Serenity',{mpEvery:3},'Regain 1 MP every 3 rounds'), 'hp3','mp2', A('Guardian Angel',{rebirth:.25},'Once per battle, rise again at 25% HP')]],
    ['Smite', ['mag1','mag1', A('Smite',{holyPct:.4},'+40% holy damage'), 'mag1','mp2', A('Divine Light',{grant:'divine'},'Learn Divine Light (holy damage 8 + MAG)')]],
  ]},
  mage:{name:'Mage', icon:'🧙', type:'arcane', req:{arcane:1}, stats:{mp:3,mag:1}, cmd:'arcane_bolt', desc:'Elemental destruction.', branches:[
    ['Elements', ['mag1','mp2', A('Elementalist',{spellPct:.15},'+15% spell damage'), 'mag1','mag1', A('Exploit',{weakPct:.5},'Weakness hits deal +50% more')]],
    ['Mind',     ['mp2','mp2', A('Thrift',{mpCut:1},'Spells cost 1 less MP (min 1)'), 'mag1','mp3', A('Mana Tide',{mpEvery:2},'Regain 1 MP every 2 rounds')]],
    ['Ward',     ['hp3','def1', A('Arcane Shield',{dodge:.06},'+6% dodge'), 'hp3','mag1', A('Archmage',{spellPct:.2, stat:{mag:2}},'+20% spell damage, +2 MAG')]],
  ]},
  thief:{name:'Thief', icon:'🗝️', type:'shadow', req:{shadow:1}, stats:{agi:2}, cmd:'mug', desc:'Quick hands, quicker blades.', branches:[
    ['Blade',   ['str1','agi1', A('Vital Spots',{crit:.08},'+8% critical chance'), 'str1','agi1', A('Shadow Dance',{double:.15},'15% chance to attack twice')]],
    ['Evasion', ['agi1','hp2', A('Blur',{dodge:.08},'+8% dodge'), 'agi1','def1', A('Phantom Step',{dodge:.06, first:1},'+6% dodge and always act first in round 1')]],
    ['Greed',   ['agi1','mp2', A('Pockets',{gold:.15},'+15% gold from battles'), 'agi1','str1', A('Golden Touch',{gold:.25},'+25% more gold from battles')]],
  ]},
  ranger:{name:'Ranger', icon:'🏹', type:'wild', req:{wild:1}, stats:{agi:1,str:1}, cmd:'volley', desc:'Precise shots and trail lore.', branches:[
    ['Aim',   ['agi1','str1', A('Steady Aim',{hit:.06},'+6% hit chance'), 'str1','agi1', A('Deadeye',{crit:.1},'+10% critical chance')]],
    ['Trail', ['hp3','def1', A('Trailwise',{postHeal:3},'Heal 3 HP after every battle'), 'hp3','agi1', A('Hardy',{stam:6},'+6 max stamina (longer expeditions)')]],
    ['Beast', ['str1','mag1', A("Hunter's Mark",{physPct:.12},'+12% physical damage'), 'mag1','str1', A('Beast Bond',{wildPct:.5, pack:1},'+50% wild damage; +1 damage per living ally')]],
  ]},
  paladin:{name:'Paladin', icon:'🦁', type:'holy', adv:1, req:{martial:2, holy:2}, stats:{hp:6,def:2,mag:1}, cmd:'holy_blade', desc:'Holy knight: strikes and shields.', branches:[
    ['Oath',  ['def1','hp4', A('Aegis',{dr:1},'Take 1 less damage per hit'), 'def1','hp4', A('Martyr',{taunt:.3, rebirth:.5},'Draw attacks; rise once at 50% HP')]],
    ['Faith', ['mag1','mp2', A('Faith',{healPct:.2},'+20% healing'), 'mag1','mp2', A('Holy Aura',{regen:1},'Heal 1 HP at the start of each of your turns')]],
    ['Zeal',  ['str1','str1', A('Judgement',{holyPct:.5},'+50% holy damage'), 'str1','def1', A('Crusader',{physPct:.15},'+15% physical damage')]],
  ]},
  spellblade:{name:'Spellblade', icon:'🗡️', type:'arcane', adv:1, req:{martial:2, arcane:2}, stats:{str:1,mag:1,agi:1}, cmd:'elemental_edge', desc:'Steel and spell in one swing.', branches:[
    ['Runes', ['str1','mag1', A('Arcane Steel',{physPct:.1, spellPct:.1},'+10% physical and spell damage'), 'str1','mag1', A('Weakpoint',{weakPct:.6},'Weakness hits deal +60% more')]],
    ['Dance', ['agi1','agi1', A('Blade Dance',{double:.12},'12% chance to attack twice'), 'agi1','hp3', A('Riposte',{counter:.15},'15% chance to strike back when hit')]],
    ['Focus', ['mp2','mp2', A('Battle Focus',{mpEvery:3},'Regain 1 MP every 3 rounds'), 'mag1','mp2', A('Spell Echo',{echo:.12},'12% chance to cast a spell twice')]],
  ]},
  druid:{name:'Druid', icon:'🌳', type:'wild', adv:1, req:{wild:2, holy:2}, stats:{hp:3,mp:3,mag:1}, cmd:'thornstorm', desc:"Nature's healer and storm.", branches:[
    ['Root',  ['hp3','def1', A('Rooted',{dr:1},'Take 1 less damage per hit'), 'hp4','def1', A('Barkskin',{thorns:2},'Attackers take 2 damage')]],
    ['Bloom', ['mp2','mag1', A('Wellspring',{regen:1},'Heal 1 HP at the start of each of your turns'), 'mag1','mp2', A('Bloom',{healPct:.3},'+30% healing')]],
    ['Storm', ['mag1','mag1', A('Wild Heart',{wildPct:.5},'+50% wild damage'), 'mag1','mag1', A('Renewal',{postHeal:6},'Heal 6 HP after every battle')]],
  ]},
  assassin:{name:'Assassin', icon:'🥷', type:'shadow', adv:1, req:{shadow:2, wild:2}, stats:{agi:2,str:1}, cmd:'assassinate', desc:'One perfect strike.', branches:[
    ['Venom',  ['agi1','mag1', A('Poisoner',{poisonPlus:2},'Your poisons tick for +2'), 'agi1','str1', A('Lethality',{critDmg:.5},'Critical hits deal +50% more')]],
    ['Ambush', ['agi1','agi1', A('Ambush',{first:1, crit:.06},'Act first in round 1, +6% crit'), 'agi1','str1', A('Execution',{crit:.1},'+10% critical chance')]],
    ['Shade',  ['hp2','agi1', A('Phantom',{dodge:.1},'+10% dodge'), 'def1','hp3', A('Unseen',{double:.1},'10% chance to attack twice')]],
  ]},
  warlock:{name:'Warlock', icon:'🕯️', type:'arcane', adv:1, req:{arcane:2, shadow:2}, stats:{mag:2,mp:2}, cmd:'drain', desc:'Dark pacts, draining power.', branches:[
    ['Hex',   ['mag1','mp2', A('Hex',{shadowPct:.3},'+30% shadow damage'), 'mag1','mag1', A('Void Lord',{spellPct:.25},'+25% spell damage')]],
    ['Pact',  ['mp2','hp2', A('Soul Harvest',{killMp:2},'Regain 2 MP on each kill'), 'mp2','mag1', A('Dark Pact',{mpCut:1},'Spells cost 1 less MP (min 1)')]],
    ['Curse', ['mag1','agi1', A('Dark Insight',{spellPct:.15},'+15% spell damage'), 'mag1','mp2', A('Echoing Doom',{echo:.15},'15% chance to cast a spell twice')]],
  ]},
};
D.JOB_ORDER = ['knight','priest','mage','thief','ranger','paladin','spellblade','druid','assassin','warlock'];
// Build each job's grid: node ids jid.b.i ; core node 'core'. Layout: polar coordinates for the sphere-grid view.
(function(){
  const statName = {hp:'HP', mp:'MP', str:'STR', def:'DEF', mag:'MAG', agi:'AGI'};
  for(const jid in D.JOBS){ const j=D.JOBS[jid]; const nodes=[{id:'core', name:j.name+' Core', core:1, ring:0, cost:0, eff:{}, desc:`Become a ${j.name}: +${Object.entries(j.stats).map(([k,v])=>v+' '+statName[k]).join(', +')} and the ${'{cmd}'} command.`, x:0, y:0, links:[]}];
    j.branches.forEach(([bname, list], b)=>{ const base = -90 + b*120;
      list.forEach((spec, i)=>{ const ring=i+1; const ang=(base + (i%2? 14:-14)*(i<5?1:0)) * Math.PI/180; const r=ring*1;
        let n; if(typeof spec==='string'){ const m=spec.match(/^([a-z]+)(\d+)$/); n={name:`+${m[2]} ${statName[m[1]]}`, eff:{stat:{[m[1]]:+m[2]}}, desc:`+${m[2]} ${statName[m[1]]}`, stat:m[1]}; }
        else n={name:spec.n, eff:spec.eff, desc:spec.d, ability:1};
        Object.assign(n, {id:`${b}.${i}`, branch:b, bname, ring, cost:Math.round(D.RING_COST[ring]*(n.ability?1.5:1)), x:Math.cos(ang)*r, y:Math.sin(ang)*r, links:[]});
        nodes.push(n);
      }); });
    const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
    const link=(a,b)=>{ byId[a].links.push(b); byId[b].links.push(a); };
    for(let b=0;b<3;b++){ link('core', `${b}.0`); for(let i=1;i<6;i++) link(`${b}.${i-1}`, `${b}.${i}`); }
    // cross links make it a web: ring 3 and ring 6 of neighbouring branches
    for(let b=0;b<3;b++){ link(`${b}.3`, `${(b+1)%3}.3`); }
    j.nodes=nodes; j.node=byId; nodes[0].desc=nodes[0].desc.replace('{cmd}', '“'+(D.SKILLS[j.cmd]?D.SKILLS[j.cmd].name:j.cmd)+'”');
    j.totalJp = nodes.reduce((a,n)=>a+n.cost,0);
  }
})();

/* ---------------- equipment ----------------
   slot: weapon | armor | acc. skills: taught by wearing it. tier = zone it belongs to. shop = Market level that sells it (null = gear halls / fusing only) */
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
  I('halberd','Bog Halberd','🔱','weapon',3,{str:4},['war_cry'],180,null),
  I('lily_staff','Lily Staff','🌸','weapon',3,{mag:4,mp:2},['circle'],0,null),
  I('croc_mail','Croc Mail','🐊','armor',3,{def:4,hp:4},['counter'],170,null),
  I('purse','Hag\'s Purse','👛','acc',3,{agi:2},['greed'],0,null),
  I('marsh_bow','Reed Longbow','🏹','weapon',3,{str:3,agi:2},['aimed_shot','entangle'],175,null),
  // tier 4 — Ashen Highlands
  I('flamberge','Flamberge','⚔️','weapon',4,{str:6},['double_strike'],0,null),
  I('ember_rod','Ember Scepter','🔥','weapon',4,{mag:6},['flame_wave'],340,null),
  I('ash_plate','Ashen Plate','🛡️','armor',4,{def:6,hp:6},['iron_skin','toughness'],320,null),
  I('phoenix_ring','Cinder Ring','💍','acc',4,{mag:2,hp:3},['raise'],0,null),
  // tier 5 — Frostpeak
  I('ice_brand','Ice Brand','🗡️','weapon',5,{str:8,agi:1},['cleave','sunder'],600,null),
  I('glacier_staff','Glacier Staff','🧊','weapon',5,{mag:8,mp:3},['thunder'],0,null),
  I('yeti_coat','Yeti Coat','🧥','armor',5,{def:8,hp:10},['counter','toughness'],560,null),
  I('owl_charm','Owl Charm','🦉','acc',5,{mag:3,agi:3},['keen_eye','focus'],0,null),
  // tier 6 — Shadowfell Ruins
  I('soul_blade','Soulreaver','🗡️','weapon',6,{str:11,agi:2},['double_strike','backstab'],0,null),
  I('lich_staff','Lich Staff','🦯','weapon',6,{mag:11,mp:4},['night_shade','thunder'],1100,null),
  I('dark_plate','Darksteel Plate','🛡️','armor',6,{def:11,hp:14},['protect','counter'],1000,null),
  I('grave_ring','Grave Ring','💍','acc',6,{mp:4,mag:3},['prayer','circle'],0,null),
  // tier 7 — Dragon's Spine
  I('dragon_sword','Dragonfang','⚔️','weapon',7,{str:15,agi:3},['war_cry','double_strike'],0,null),
  I('dragon_staff','Wyrm Staff','🪄','weapon',7,{mag:15,mp:6},['flame_wave','raise'],2200,null),
  I('dragon_mail','Dragonscale Mail','🐲','armor',7,{def:15,hp:20},['thorn_hide','iron_skin'],2000,null),
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
  scholarship:{name:'Scholarship', icon:'📜', place:'library', desc:'Studies the bestiary (extra kill credit) and distills ectoplasm later on.',
    out:[['study',120,30,1,0],['ecto',600,200,12,6]]},
};
D.PROF_ORDER = ['mining','foraging','smithing','cooking','scholarship'];
D.WORKER_COST = [0, 60, 220, 650, 1600, 3800, 8500]; // gold to hire worker #2, #3, ...
D.WORKER_NAMES = ['Tam','Odile','Bram','Wynn','Hesper','Corin','Lio'];

// Buildings on the town map. x/y = % position on art/town_map.webp
D.PLACES = {
  hall:    {name:'Town Hall', icon:'🏛️', x:71, y:18, desc:'Hire workers and set their professions.', kind:'hall'},
  market:  {name:'Market', icon:'⚖️', x:38, y:36, desc:'Buy basic gear, sell spares and gems.', kind:'market', build:1},
  forge:   {name:'Forge', icon:'🔥', x:22, y:20, desc:'Gear hall for warriors. Fuse duplicates. Mentors: Dorrin, Kaia.', kind:'banner', banner:'forge'},
  chapel:  {name:'Chapel', icon:'⛪', x:85, y:34, desc:'Gear hall for healers. Mentors: Sela, Ansel.', kind:'banner', banner:'chapel'},
  arcanum: {name:'Arcanum', icon:'🔮', x:73, y:57, desc:'Gear hall for mages. Mentors: Vey, Morwen.', kind:'banner', banner:'arcanum'},
  den:     {name:"Thieves' Den", icon:'🗝️', x:39, y:76, desc:'Gear hall for rogues. Mentors: Pell, the Whisper.', kind:'banner', banner:'den'},
  lodge:   {name:"Hunter's Lodge", icon:'🏹', x:13, y:83, desc:'Gear hall for rangers. Mentors: Ysolde, Moss.', kind:'banner', banner:'lodge'},
  training:{name:'Training Grounds', icon:'🎯', x:23, y:61, desc:'Raise stamina. Mentors: Aldric, Brann.', kind:'training', build:1},
  tavern:  {name:'Tavern', icon:'🍺', x:89, y:24, desc:'Meals that buff the next expedition.', kind:'tavern', build:1},
  library: {name:'Library', icon:'📚', x:47, y:9, desc:'Bestiary and collection rewards.', kind:'library', build:1},
  mine:    {name:'Mine', icon:'⛏️', x:86, y:78, desc:'Where diamonds come from.', kind:'mine'},
};
D.PLACE_ORDER = ['hall','market','training','forge','mine','tavern','library','chapel','arcanum','den','lodge'];
// Upgradeable buildings (non-hall): level 0 = not built.
D.BMAX = 8;
D.BUILD = {
  market:  {prof:'smithing', start:1, unlock:'Each level: more basic gear for sale and +5% sell prices.'},
  training:{prof:null, start:1, unlock:'Each level lets heroes train 5 more Endurance levels, 10% faster.'},
  tavern:  {prof:'cooking', start:0, unlock:'Each level adds a new meal recipe.'},
  library: {prof:'scholarship', start:0, unlock:'Each level lets the bestiary teach one more tier.'},
  forge:   {prof:null, start:1, banner:1}, chapel:{prof:null, start:0, banner:1}, arcanum:{prof:null, start:0, banner:1}, den:{prof:null, start:0, banner:1}, lodge:{prof:null, start:0, banner:1},
};
D.BUILD_ORDER = ['market','training','tavern','library','forge','chapel','arcanum','den','lodge'];
// cost to reach level L (1..8): gold, stone, timber, + the building's flavour material, + profession level if it has one
D.BUILD_COST = [null,
  {prof:1, gold:40, stone:8, timber:8},
  {prof:3, gold:150, stone:20, timber:15},
  {prof:6, gold:450, stone:40, timber:30},
  {prof:10, gold:1100, stone:70, timber:50},
  {prof:15, gold:2500, stone:110, timber:80},
  {prof:21, gold:5000, stone:160, timber:120},
  {prof:28, gold:9500, stone:230, timber:170},
  {prof:36, gold:17000, stone:320, timber:240},
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
   Training under a mentor (in town) slowly raises a bonus stat and lowers another. Rank 1 opens the mentor's job as a SUBJOB.
   Rank 3 lets advanced jobs (Paladin, Spellblade, …) be taken as a main job. */
D.MENTORS = [
  {id:'aldric', name:'Sir Aldric', place:'training', job:'knight', plus:'def', minus:'agi', need:1, line:'Stand your ground. Speed is for people who expect to miss.'},
  {id:'brann', name:'Lord Commander Brann', place:'training', job:'paladin', plus:'hp', minus:'agi', need:3, line:'A shield is a promise. Keep it.'},
  {id:'dorrin', name:'Dorrin Anvilhand', place:'forge', job:'knight', plus:'str', minus:'mag', need:1, line:'Swing like you mean it. Think later.'},
  {id:'kaia', name:'Duelist Kaia', place:'forge', job:'spellblade', plus:'str', minus:'def', need:3, line:'Steel and spell are one motion. Again.'},
  {id:'sela', name:'Mother Sela', place:'chapel', job:'priest', plus:'mag', minus:'str', need:1, line:'Mend first. The fight can wait a breath.'},
  {id:'ansel', name:'Brother Ansel', place:'chapel', job:'paladin', plus:'def', minus:'mag', need:3, line:'Faith is a wall, and walls are built slowly.'},
  {id:'vey', name:'Magister Vey', place:'arcanum', job:'mage', plus:'mag', minus:'hp', need:1, line:'Mind the formula. Fire forgives nothing.'},
  {id:'morwen', name:'Morwen the Pale', place:'arcanum', job:'warlock', plus:'mp', minus:'def', need:3, line:'Every power has a price. Pay it gladly.'},
  {id:'pell', name:'Quickfinger Pell', place:'den', job:'thief', plus:'agi', minus:'hp', need:1, line:'Never be where the blow lands.'},
  {id:'whisper', name:'The Whisper', place:'den', job:'assassin', plus:'str', minus:'def', need:3, line:'…'},
  {id:'ysolde', name:'Warden Ysolde', place:'lodge', job:'ranger', plus:'agi', minus:'mp', need:1, line:'Read the wind, then loose.'},
  {id:'moss', name:'Elder Moss', place:'lodge', job:'druid', plus:'hp', minus:'str', need:3, line:'Roots first. Then the storm.'},
];
D.MENTOR = {}; D.MENTORS.forEach(m => D.MENTOR[m.id] = m);
D.MENTOR_MAX = 10;
// per rank: bonus grows every rank (hp ×2, mp ×1.5 rounded), minus grows every 3rd rank
D.MENTOR_PLUS = r => Math.floor((r+1)/2);   // +1 at rank 1, +1 more every 2 ranks (max +5)
D.MENTOR_MINUS = r => Math.floor(r/3);       // −1 at rank 3, 6, 9

/* ---------------- tavern meals (cooked by the Cooking worker, eaten when the party sets out) ---------------- */
D.FOODS = [
  {id:'stew', name:'Rabbit Stew', icon:'🍲', tav:1, cook:1, mats:{herb:2, fur:1}, buff:{str:1}, desc:'+1 STR for one expedition'},
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
  {kills:10, lib:1, red:.05, label:'Studied — stats shown, −5% ATK/DEF/AGI'},
  {kills:30, lib:2, red:.10, label:'Known — weakness shown, −10% ATK/DEF/AGI', dia:1},
  {kills:80, lib:3, red:.15, label:'Mastered — −15% ATK/DEF/AGI, +25% weakness damage', dia:3},
  {kills:200, lib:5, red:.22, label:'Legend — −22% ATK/DEF/AGI, +50% weakness damage', dia:5},
];
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
  {name:'Uncommon', short:'U', color:'#3f8f4f', mult:1.3, ap:0, sell:1.6},
  {name:'Rare', short:'R', color:'#2f6fbf', mult:1.7, ap:1, sell:3},
  {name:'Epic', short:'E', color:'#8a3fbf', mult:2.3, ap:2, sell:6},
  {name:'Legendary', short:'L', color:'#c27a12', mult:3.2, ap:3, sell:12},
];
D.BANNERS = {
  forge:{name:'Forge', icon:'🔥', type:'martial', jobs:'Knight · Paladin · Spellblade', desc:'Swords, axes and heavy armor for front-liners.'},
  chapel:{name:'Chapel', icon:'⛪', type:'holy', jobs:'Priest · Paladin · Druid', desc:'Rods, robes and charms for healers.'},
  arcanum:{name:'Arcanum', icon:'🔮', type:'arcane', jobs:'Mage · Spellblade · Warlock', desc:'Staves and robes for spellcasters.'},
  den:{name:"Thieves' Den", icon:'🗝️', type:'shadow', jobs:'Thief · Assassin · Warlock', desc:'Daggers and cloaks for rogues.'},
  lodge:{name:"Hunter's Lodge", icon:'🏹', type:'wild', jobs:'Ranger · Druid · Assassin', desc:'Bows and charms for rangers.'},
};
D.BANNER_ORDER = ['forge','chapel','arcanum','den','lodge'];
// rarity rates (%) by hall level 1..8: [Common, Uncommon, Rare, Epic, Legendary]
D.BANNER_RATES = [null,
  [72,22,5,0.9,0.1],[66,25,7,1.7,0.3],[60,27,10,2.5,0.5],[54,29,12.5,3.7,0.8],
  [48,30,15.5,5.3,1.2],[42,31,18.5,6.9,1.6],[37,31,21,8.8,2.2],[32,31,23.5,10.5,3.0]];
D.PULL_COST = 5; D.PULL10_COST = 45; D.PITY = 60; // Epic or better guaranteed by pull 60; every 10-pull has a Rare or better
D.START_DIAMONDS = 10;

D.TOWN_POS = {x:52, y:82}; // Lanternfall on the world map
if(typeof module!=='undefined') module.exports={D};
