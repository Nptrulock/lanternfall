# 🏮 Lanternfall

A slow, cozy idle RPG for a party of three. You start in a painted town, choose where to go on a hand-drawn world map, and watch Dragon Quest-style battles play out one action at a time. Gear teaches skills (FF9 style), jobs grow on sphere grids (FFX style), and a town grows while you are away. Plain HTML/CSS/JS, no build step, saves to `localStorage`.

**Play:** https://nptrulock.github.io/lanternfall/

## How it plays (v2.1 playtest pass)
- **Three heroes, six races** (Human, Elf, Dwarf, Halfling, Orc, Beastkin). Each race gains more traits as it levels, including small XP, gold and stamina bonuses.
- **Town first.** The game opens in Lanternfall. Nothing fights until you pick a zone on the 🗺️ Map or at the 🔥 campfire and **set out**.
- **Slow, readable battles.** Auto-battle with about 1.2 s per action and several rounds per fight. Early numbers are single digits. Zones are still long: Meadow still takes 80 wins to the boss, sliced into stages 1–10 with a small reward at each stage.
- **Stamina.** Every battle costs each hero 1 stamina (a boss costs 4). When anyone runs out, the party walks home and stops until you send it out again. Heroes in town can:
  - 😴 rest (stamina recovers twice as fast),
  - 🎯 train Endurance at the Training Grounds (more max stamina and faster recovery) and play a short **Focus Drill** for a tiny permanent XP/gold bonus, or
  - 🎓 study with a mentor. The campfire shows mentoring progress next to time-until-stamina-full.
- **Skills** learned for auto-battle can be toggled on or off per skill (for example, leave Entangle off).
- **Battles give** XP, gold, AP (skill learning), JP (job grid), zone progress and bestiary kills. **They never drop items or materials.**
- **Town work gives items.**
  - You start with **one worker**. Hire more at the 🏛️ Town Hall for gold, at a rising cost (60, 220, 650…).
  - Workers can do Mining, Foraging, Smithing, Cooking, Scholarship, **Masonry** (required to raise most buildings past the first level) and **Banking** (deposit gold at the Town Hall bank for slow interest; interest can be changed into 💎 at a steep rate).
  - Cooking packs meals; when you set out the party eats **one of each** packed dish and the buffs stack.
- **Gear halls (gacha) are the main source of gear.** There are five halls: Forge, Chapel, Arcanum, Thieves' Den and Hunter's Lodge. There are **8 tiers** of equipment and **six rarities**, including **Mythic** (8× a Common's stats).
  - One pull is 💎5; ten pulls are 💎45, with a Rare+ guaranteed.
  - Pity guarantees an Epic within 60 pulls and a Mythic within 180. A **daily featured** strong item can be claimed once a day.
  - The Market keeps a **small rotating stall** (not a full catalog). The Forge fuses **10** duplicates into the next rarity (Mythic only at a maxed Forge). Inventory can be sorted by rarity, tier, slot or name.
- **Jobs.**
  - A base job opens after one learned skill of its type, or after rank 1 with that job's mentor. Advanced jobs need their skill requirements plus rank 1 with a mentor of that craft. Five higher-tier jobs (Champion, Oracle, Archmage, Nightblade, Warden) need rank 5 and a related advanced job.
  - Each job has a sphere grid with **4 branches**, paid for with JP.
  - **Lock-in:** for each job, a hero can lock ONE unlocked ability and keep it after switching to another job.
  - A **sub job** uses half the job's stats plus every unlocked skill and passive on that job (not the raw stat nodes).
- **Mentors.** There are 12 mentors, 2 per building. Some share a class but give different stat boosts.
  - Every rank gives a visible stat change (a growing bonus; a smaller minus every 3rd rank).
  - Rank 1 unlocks the **main job**. Rank 3 unlocks the **sub job**. Ranks 5, 7 and 10 grant a gift only that mentor can give.
- **Bestiary.** Combat kills weaken a foe for good, in tiers at 15/50/150/400 kills. The Library and scholarship **lower the kills needed**; they never add kills. Each entry shows XP and gold earned from that foe.
  - Once a boss is unlocked it can auto-appear every so often (and is guaranteed again after 20 wins).
  - Rare ✨ Gilded variants appear in 2% of fights.
  - Complete a zone's collection (every foe Mastered, every Gilded variant beaten, and the boss) to earn its relic. Relics are never dropped.
- **Saves** from the v2 redesign (save version 3) migrate safely to version 4. Older pre-redesign saves still start a new journey, with the old file backed up. All v2 save protection (rolling backups, recovery screen, save codes, typed-RESET hard reset) is kept.
- **Offline.** Workers keep working for up to 12 h. An expedition in progress keeps fighting at normal pace until stamina runs out, then the party rests.

## Keeping your save safe
- **💾 Save** (top bar) is the one-tap **Copy save code** button. From there you can also paste a code, see your backups, or hard reset (you must type `RESET`). Every few days a gentle reminder offers to copy the code again.
- **iPhone:** Safari can clear a website's data after about 7 days without a visit. In a Safari tab the game shows a one-time "Add to Home Screen" prompt (Share → Add to Home Screen), and shows a smaller one again 3 days after you dismiss it. The Home Screen app has its own storage, so copy your save code in Safari and paste it into the app.
- The game asks the browser for persistent storage (`navigator.storage.persist()`) where it is supported.
- **Backups** are kept in this browser:
  - the last 3 autosave backups (one every 10 minutes of play),
  - 1 daily backup,
  - "before the last hard reset",
  - "before the last restore".
- **A save that can't load never turns into a new game.** The damaged save is kept under `lanternfall.save.broken` and a recovery screen offers Restore backup, Export the damaged save, or Paste a save code.

## Pacing (from `tools/sim.js`, after the v2.1 playtest pass)
| Milestone | Active player (non-stop) | Regular player (3 sessions/day, 95 min) |
|---|---|---|
| First skill learned | ~18 min | ~8 h into day 1 |
| First job | ~25 min | day 1 midday |
| Zone 2 | ~1.2 h | ~20 h (day 1 evening) |
| Zone 3 | ~3.5 h | ~2.3 days |
| Zone 4 | ~8.9 h | ~4.5 days |
| Zone 5 | — | ~7.8 days |

Early zones are kept on the v2 clock (zone 2 still ~75 minutes of active play, zone 3 still about two days of regular play). Later zones are a little faster than v2 because heroes are stronger (deeper mentors, better gear, race traits); later-zone enemies were scaled up so the calendar does not collapse.

## Files
- `data.js`: all content (races, skills, jobs and sphere grids, items, relics, zones, town, mentors, gacha rates).
- `engine.js`: simulation (no DOM), saves (v4; v3 playtest saves migrate safely; older pre-redesign saves are backed up and a fresh start begins).
- `ui.js`, `style.css`, `index.html`: the interface (parchment and wood, phone first). Every page render is guarded.
- `art/`: painted portraits, maps, battle backdrops, mentors and monsters (webp). `tools/art.py` rebuilds them from the sources.
- `tools/sim.js`: pacing sim. `node tools/sim.js active 8` or `node tools/sim.js regular 12`.
- `tools/test_save.py`: save-safety tests (iPhone Safari user agent, `navigator.standalone` mocked). `python3 tools/test_save.py <url>`.
- `manifest.webmanifest`, `art/apple-touch-icon.png`, `art/icon-*.png`: Home Screen app manifest and icons.
- `tools/test.py`: headless Chrome test at iPhone, iPad landscape and desktop. `python3 tools/test.py <url>`. Screenshots go to `shots/`.
