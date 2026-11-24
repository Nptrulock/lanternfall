# 🏮 Lanternfall

A slow, cozy idle RPG for a party of three. You start in a painted town, choose where to go on a hand-drawn world map, and watch Dragon Quest-style battles play out one action at a time. Gear teaches skills (FF9 style), jobs grow on sphere grids (FFX style), and a town grows while you are away. Plain HTML/CSS/JS, no build step, saves to `localStorage`.

**Play:** https://nptrulock.github.io/lanternfall/

## How it plays (v2)
- **Three heroes, six races** (Human, Elf, Dwarf, Halfling, Orc, Beastkin). Each race gains traits as it levels.
- **Town first.** The game opens in Lanternfall. Nothing fights until you pick a zone on the 🗺️ Map or at the 🔥 campfire and **set out**.
- **Slow, readable battles.** Auto-battle with about 1.2 s per action and several rounds per fight. Early numbers are single digits.
- **Stamina.** Every battle costs each hero 1 stamina (a boss costs 4). When anyone runs out, the party walks home and stops until you send it out again. Heroes in town can:
  - 😴 rest (stamina recovers twice as fast),
  - 🎯 train Endurance at the Training Grounds (more max stamina and faster recovery), or
  - 🎓 study with a mentor.
- **Battles give** XP, gold, AP (skill learning), JP (job grid), zone progress and bestiary kills. **They never drop items or materials.**
- **Town work gives items.**
  - You start with **one worker**. Hire more at the 🏛️ Town Hall for gold, at a rising cost (60, 220, 650…).
  - Workers can do Mining (stone, gems, slow 💎), Foraging, Smithing (the odd Common piece of gear), Cooking (meals eaten when you set out) and Scholarship.
- **Gear halls (gacha) are the main source of gear.** There are five halls: Forge, Chapel, Arcanum, Thieves' Den and Hunter's Lodge.
  - One pull is 💎5; ten pulls are 💎45, with a Rare+ guaranteed.
  - Pity guarantees an Epic within 60 pulls.
  - The Market sells only plain Common basics, at a premium. The Forge fuses 3 duplicates into the next rarity.
- **Jobs.**
  - A base job opens after one learned skill of its type. Advanced jobs need 2+2 skills plus rank 3 with that job's mentor.
  - Each job has a 19-node sphere grid (3 branches, with cross links) paid for with JP.
  - **Lock-in:** for each job, a hero can lock ONE unlocked ability and keep it after switching to another job.
- **Mentors.** There are 12 mentors, 2 per building.
  - Studying raises a rank (up to 10) that gives a growing bonus and a smaller matching minus (e.g. +DEF / −AGI).
  - Rank 1 unlocks that mentor's job as a **subjob**: half its stats plus its command.
- **Bestiary.** Kill counts weaken a foe for good, in tiers at 10/30/80/200 kills (gated by Library level), and some tiers give 💎.
  - Rare ✨ Gilded variants appear in 2% of fights.
  - Complete a zone's collection (every foe Mastered, every Gilded variant beaten, and the boss) to earn its relic. Relics are never dropped.
- **Offline.** Workers keep working for up to 12 h. An expedition in progress keeps fighting at normal pace until stamina runs out, then the party rests.

## Pacing (from `tools/sim.js`)
| Milestone | Active player (non-stop) | Regular player (3 sessions/day, 95 min) |
|---|---|---|
| First skill learned | ~18 min | ~18 min into day 1 |
| First job | ~25 min | day 1 midday |
| Zone 2 | ~1.2 h | ~12 h after starting (day 1 evening) |
| Zone 3 | ~3.8 h | ~1.9 days |
| Zone 4 | — | ~4.5 days |
| Zone 5 | — | ~8.2 days |

## Files
- `data.js`: all content (races, skills, jobs and sphere grids, items, relics, zones, town, mentors, gacha rates).
- `engine.js`: simulation (no DOM), saves (v3; older saves are backed up and a fresh start begins).
- `ui.js`, `style.css`, `index.html`: the interface (parchment and wood, phone first). Every page render is guarded.
- `art/`: painted portraits, maps, battle backdrops, mentors and monsters (webp). `tools/art.py` rebuilds them from the sources.
- `tools/sim.js`: pacing sim. `node tools/sim.js active 8` or `node tools/sim.js regular 12`.
- `tools/test.py`: headless Chrome test at iPhone, iPad landscape and desktop. `python3 tools/test.py <url>`. Screenshots go to `shots/`.
