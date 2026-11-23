# 🏮 Lanternfall

A party-of-four incremental idle RPG. Dragon Quest-style battle screen, FF9-style "gear teaches skills", jobs with skill trees, a village that grows while you fight, and gear-hall pulls for rarer gear. Plain HTML/CSS/JS, no build step, saves to `localStorage`.

**Play:** https://nptrulock.github.io/lanternfall/

## How it plays
- **Make 4 heroes.** Give each a name and a race. There are 6 races:
  - **Human:** learns faster.
  - **Elf:** caster.
  - **Dwarf:** tough.
  - **Halfling:** lucky, finds more gold.
  - **Orc:** gets stronger when hurt.
  - **Beastkin:** quick hunter.

  Each race unlocks 5 traits at levels 1 to 30, so a hero keeps changing as it levels.
- **Battles run on their own.** Enemies show at the top, the battle log sits in the middle and the party's HP/MP windows are at the bottom. Turn order goes by AGI. Numbers stay small for a long time (2–6 damage, real misses, 10–20 HP), and growth is slow on purpose.
- **Gear teaches skills.** Every item carries 1–2 skills in 5 types: ⚔️ Martial, ✨ Holy, 🔮 Arcane, 🌑 Shadow and 🌿 Wild.
  - Each win gives the skills on worn gear +1 AP, and bosses give +3.
  - Rare and better gear adds +1 to +3 AP per win.
  - A full bar means the skill is learned forever.
- **Jobs.** Learning 3 skills of one type unlocks that type's job: Knight, Priest, Mage, Thief or Ranger.
  - Advanced jobs need 4 + 3 skills across two types and a Guild Hall mentor: Paladin, Spellblade, Druid, Assassin and Warlock.
  - Jobs earn JP (job points) to spend on a 6–7 node skill tree. Tier 3 of each tree needs that job's mentor.
- **💎 Gear halls (gacha).** There are 5 halls, built and upgraded with Masonry: 🔥 Forge (martial), ⛪ Chapel (holy), 🔮 Arcanum (arcane), 🗝️ Thieves' Den (shadow) and 🏹 Hunter's Lodge (wild).
  - A pull costs 5 Diamonds, or 45 for 10. A 10-pull always includes at least one Rare.
  - **Pity:** you're guaranteed an Epic or better within 60 pulls on each hall.
  - Each hall has a rates table. Upgrading a hall improves its odds and opens higher-tier gear, capped by how far you've travelled:

    | Hall level | Common | Uncommon | Rare | Epic | Legendary |
    |---|---|---|---|---|---|
    | 1 | 72% | 22% | 5% | 0.9% | 0.1% |
    | 4 | 54% | 29% | 12.5% | 3.7% | 0.8% |
    | 8 | 32% | 31% | 23.5% | 10.5% | 3% |

  - Rarity multiplies item stats: ×1, ×1.3, ×1.7, ×2.3 and ×3.2.
  - The Smithy fuses 3 copies of an item into the next rarity.
  - **Diamonds:**
    - ⛏️ Mining villagers dig them up slowly, about one every 4 minutes at first.
    - Bosses give 15 the first time and 3 on each rematch.
    - Battles have a 0.4% chance to drop one.
    - Mining also turns up Stone, Copper, and gems you can sell.
- **Zones.** There are 8 zones, from Greenhollow Meadow to Dragon's Spine. Win battles to make the zone's boss appear, then beat it to open the next zone. Bosses can be fought again every 25 wins.
- **💀 Falling is cheap.** If the whole party is knocked out, villagers carry everyone home fully healed and nothing is lost. Auto-battle pauses until you press ▶.
- **💠 Relics.** There are 7 very rare relics: one from each boss after the first (1 in 29 to 41 per kill), plus a tiny chance from any monster. Each holds a vital skill: Rebirth, Valor, Midas Touch, Miracle, Haste, Starfall or Dragonblood.
- **🏘️ Village.** Assign villagers to 6 professions: Mining, Masonry, Smithing, Cooking, Alchemy and Scholarship. They keep working offline.
  - Profession level, gold and materials upgrade the buildings, and each building's look changes as it grows:

    | Building | What it does |
    |---|---|
    | Smithy | Basic gear, selling, fusing |
    | Tavern | Meals that buff the party for N battles |
    | Apothecary | Potions, Ethers, Phoenix Downs and timed elixirs |
    | Library | Bestiary knowledge tiers: monsters lose ATK/DEF/AGI and their weakness is revealed |
    | Guild Hall | Mentors: +JP, tier-3 nodes and advanced jobs |

  - Every material chip (marked with ?) shows have/need, where to get it and what uses it.
- **Offline.** You get up to 8 hours with a welcome-back summary. Villagers work at full speed, and the party fights at about half pace.
- **Settings:** auto-potions, camp rest, auto-boss, 1×/2× battle speed, export/import save, hard reset.

## Files
- `data.js`: all content (races, skills, jobs, items, relics, zones, village, gacha rates).
- `engine.js`: simulation (no DOM), saves and versioned migrations.
- `ui.js`, `style.css`, `index.html`: the interface. Every page render is guarded, so one broken page can't freeze the game.
- `tools/sim.js`: headless balance sim. Run `node tools/sim.js <hours> [races]`.
- `tools/test.py`: headless Chrome test at iPhone, iPad landscape and desktop. Run `python3 tools/test.py <url>`. Screenshots go to `shots/`.
