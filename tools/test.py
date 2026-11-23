#!/usr/bin/env python3
"""Lanternfall headless test (Chrome + touch emulation) at iPhone, iPad landscape and desktop.
usage: python3 tools/test.py [BASE_URL] [sizes]
Covers: party creation, live battle, learning a skill, gear-hall gacha (x1, x10, pity/rates, building a hall), Mining diamonds,
village workers + profession tick + building, smithy purchase + equip, job unlock + node, boss challenge, party wipe + revive,
offline welcome-back, export/import, hard reset, save migration, render guard, where-to-get sheet, no horizontal overflow,
zero console errors. The __debug fast-forward hooks are test-only (no UI)."""
import sys, os
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8795/'
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 else None
SHOTS = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots'))
os.makedirs(SHOTS, exist_ok=True)
SIZES = [('iphone', 390, 844, True, 3), ('ipad-land', 1180, 820, True, 2), ('desktop', 1440, 900, False, 1)]
res = []; errs = []; bad = []
def rec(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + (('  ' + str(info)[:300]) if info and not ok else ''), flush=True)
def tap(pg, sel, i=0, touch=True):
    loc = pg.locator(sel).nth(i)
    loc.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(120)
    bb = loc.bounding_box()
    if touch: pg.touchscreen.tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
    else: pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
    pg.wait_for_timeout(250)
def S(pg, expr): return pg.evaluate(f"(()=>{{const S=__G.S;return {expr}}})()")
def shot(pg, tag, name): pg.screenshot(path=f'{SHOTS}/{tag}-{name}.png')
def tab(pg, t, touch):
    if pg.locator(f'#tabs [data-a=tab][data-t={t}]').count(): tap(pg, f'#tabs [data-a=tab][data-t={t}]', 0, touch)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for tag, W, H, mob, dpr in SIZES:
        if ONLY and tag not in ONLY: continue
        touch = mob
        ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=dpr, is_mobile=mob, has_touch=True)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e, t=tag: errs.append(t + ' pageerror ' + str(e)))
        pg.on('console', lambda m, t=tag: m.type == 'error' and errs.append(t + ' console ' + m.text))
        pg.on('response', lambda r, t=tag: r.status >= 400 and bad.append(t + f' {r.status} ' + r.url))
        pg.goto(BASE, wait_until='networkidle'); pg.evaluate("localStorage.clear()"); pg.reload(wait_until='networkidle'); pg.wait_for_timeout(600)
        # ---------- party creation ----------
        rec(f'{tag} create screen shows 4 hero slots + 6 races each', pg.locator('.cslot').count() == 4 and pg.locator('.cslot').nth(0).locator('.race').count() == 6)
        pg.locator('#cn0').fill('Noah'); tap(pg, '[data-a=crace][data-i="3"][data-r=orc]', 0, touch); tap(pg, '[data-a=crace][data-i="1"][data-r=beastkin]', 0, touch)
        shot(pg, tag, '01-create')
        tap(pg, '[data-a=begin]', 0, touch); pg.wait_for_timeout(500)
        st = S(pg, "({started:S.started,names:S.chars.map(c=>c.name),races:S.chars.map(c=>c.race),hp:S.chars.map(c=>c.hp)})")
        rec(f'{tag} party created (name + races kept, HP set)', st['started'] and st['names'][0] == 'Noah' and st['races'] == ['human', 'beastkin', 'dwarf', 'orc'] and all(h > 0 for h in st['hp']), st)
        if W < 1000: rec(f'{tag} phone layout opens on the battle screen', pg.locator('#scene').is_visible())
        # ---------- live battle ----------
        pg.wait_for_timeout(9000)
        st = S(pg, "({wins:S.stats.wins,log:S.log.length,enemies:document.querySelectorAll('#enemies .enemy').length,pw:document.querySelectorAll('.pwin').length,maxHp:S.chars.map(c=>calc(c).maxHp)})")
        rec(f'{tag} live auto-battle runs (log, enemies, 4 status windows)', st['log'] > 3 and st['pw'] == 4 and (st['wins'] >= 1 or st['enemies'] >= 1), st)
        rec(f'{tag} small numbers at the start: every hero has 20 HP or less', all(h <= 20 for h in st['maxHp']), st)
        shot(pg, tag, '02-battle')
        # ---------- learn a skill (test-only fast forward) ----------
        pg.evaluate("__debug.battles(14)")
        st = S(pg, "({learned:S.stats.learned,list:S.chars.map(c=>Object.keys(c.learned))})")
        rec(f'{tag} winning battles fills AP and learns a skill permanently', st['learned'] >= 1, st)
        tab(pg, 'party', touch); pg.wait_for_timeout(300)
        rec(f'{tag} party panel shows stats + learning progress', pg.locator('.hero-card .stats').count() == 1)
        shot(pg, tag, '03-party')
        # ---------- village: workers, profession tick, build ----------
        tab(pg, 'village', touch); pg.wait_for_timeout(300)
        tap(pg, '[data-a=worker][data-p=masonry]', 0, touch)
        rec(f'{tag} assign a villager to Masonry', S(pg, "!!S.workers.masonry"))
        pg.evaluate("__debug.profs(400)")
        st = S(pg, "({lv:S.profs.masonry.lv,stone:S.mats.stone||0})")
        rec(f'{tag} profession ticks: Masonry levels and quarries Stone', st['lv'] >= 3 and st['stone'] >= 10, st)
        tap(pg, '[data-a=worker][data-p=cooking]', 0, touch)
        pg.evaluate("__debug.profs(5)"); pg.wait_for_timeout(1400)
        tap(pg, '[data-a=build][data-b=tavern]', 0, touch)
        rec(f'{tag} build the Tavern (building visibly upgrades)', S(pg, "S.buildings.tavern") == 1 and pg.locator('.village-scene:not(.halls) .bld.t1').count() >= 2)
        shot(pg, tag, '04-village')
        tap(pg, '[data-a=matInfo]', 0, touch)
        rec(f'{tag} material chip opens a where-to-get sheet', pg.locator('#modal .mbox h3', has_text='Where to get it').count() == 1)
        shot(pg, tag, '05-where-to-get')
        tap(pg, '#modal .mclose', 0, touch)
        # ---------- gear gacha ----------
        tap(pg, '[data-a=vview][data-v=gacha]', 0, touch); pg.wait_for_timeout(300)
        rec(f'{tag} gear hall shows rates table + pity + gear pool', pg.locator('table.rates').count() == 1 and pg.locator('.pool .pi').count() >= 2)
        shot(pg, tag, '06-gear-hall')
        d0 = S(pg, "S.diamonds"); n0 = S(pg, "S.inv.length")
        tap(pg, '[data-a=pull][data-n="1"]', 0, touch); pg.wait_for_timeout(2400)
        rec(f'{tag} pull ×1 spends 5 diamonds, adds gear, plays the reveal', S(pg, "S.diamonds") == d0 - 5 and S(pg, "S.inv.length") >= n0 + 1 and pg.locator('#modal .pcard').count() == 1, (d0, S(pg, "S.diamonds")))
        tap(pg, '#modal .mclose', 0, touch)
        pg.evaluate("__G.S.diamonds=45"); pg.wait_for_timeout(1300)
        tap(pg, '[data-a=pull][data-n="10"]', 0, touch); pg.wait_for_timeout(3800)
        rs = S(pg, "S.inv.slice(-10).map(u=>u.r)")
        rec(f'{tag} pull ×10 reveals 10 cards with a Rare+ guaranteed', pg.locator('#modal .pcard').count() == 10 and max(rs) >= 2, rs)
        shot(pg, tag, '07-pull-x10')
        tap(pg, '#modal .mclose', 0, touch)
        pg.evaluate("__G.S.gold+=500;__G.S.mats.stone=(__G.S.mats.stone||0)+50;__G.S.profs.masonry.lv=5")
        tap(pg, '[data-a=hall][data-b=chapel]', 0, touch); pg.wait_for_timeout(1300)
        tap(pg, '[data-a=buildHall][data-b=chapel]', 0, touch)
        rec(f'{tag} build the Chapel gear hall (new banner)', S(pg, "S.banners.chapel") == 1 and pg.locator('[data-a=pull][data-b=chapel]').count() >= 1)
        pg.evaluate("__G.S.workers={}"); tap(pg, '[data-a=vview][data-v=overview]', 0, touch); tap(pg, '[data-a=worker][data-p=mining]', 0, touch)
        dd = S(pg, "S.diamonds"); pg.evaluate("__debug.profs(1200)")
        rec(f'{tag} Mining villager digs up Diamonds + sellable gems', S(pg, "S.diamonds") > dd and S(pg, "(S.mats.quartz||0)") > 0)
        # ---------- smithy buy + equip ----------
        pg.evaluate("__G.S.gold+=500"); tap(pg, '[data-a=vview][data-v=smithy]', 0, touch)
        n0 = S(pg, "S.inv.length"); tap(pg, '[data-a=buy][data-id=charm]', 0, touch)
        rec(f'{tag} buy basic gear at the Smithy', S(pg, "S.inv.length") == n0 + 1)
        tab(pg, 'party', touch); tap(pg, '[data-a=sel][data-i="0"]', 0, touch); tap(pg, '[data-a=pview][data-v=gear]', 0, touch); tap(pg, '[data-a=pickSlot][data-s=acc]', 0, touch)
        tap(pg, '#modal [data-a=equip]', pg.locator('#modal [data-a=equip]').count() - 1, touch)
        rec(f'{tag} equip an accessory from the bag', S(pg, "S.chars[0].equip.acc!=null"))
        shot(pg, tag, '08-gear')
        # ---------- jobs ----------
        pg.evaluate("Object.assign(__G.S.chars[0].learned,{power_strike:1,toughness:1,iron_skin:1})")
        tap(pg, '[data-a=pview][data-v=job]', 0, touch); pg.wait_for_timeout(200)
        tap(pg, '[data-a=setJob][data-j=knight]', 0, touch)
        rec(f'{tag} 3 Martial skills unlock Knight; choose it', S(pg, "S.chars[0].job") == 'knight')
        pg.evaluate("__debug.battles(6)"); pg.wait_for_timeout(1400)
        jp = S(pg, "S.chars[0].jobs.knight.jp")
        tap(pg, '[data-a=node][data-n=k1]', 0, touch)
        rec(f'{tag} wins earn JP; buy a job-tree node', jp >= 4 and S(pg, "!!S.chars[0].jobs.knight.nodes.k1"), jp)
        shot(pg, tag, '09-job-tree')
        # ---------- map + boss ----------
        pg.evaluate("__G.S.zones[0].wins=30"); tab(pg, 'map', touch); pg.wait_for_timeout(1400)
        rec(f'{tag} map shows 8 zones', pg.locator('.card.zone').count() == 8)
        shot(pg, tag, '10-map')
        tap(pg, '[data-a=bossZ][data-z="0"]', 0, touch); pg.wait_for_timeout(1800)
        rec(f'{tag} boss challenge starts the King Slime fight', S(pg, "!!(S.battle&&S.battle.boss)"), S(pg, "S.battle&&S.battle.enemies.map(e=>e.name)"))
        if W < 1000: tab(pg, 'battle', touch); pg.wait_for_timeout(500)
        shot(pg, tag, '11-boss')
        pg.evaluate("(()=>{let g=0;while(__G.S.battle&&g++<500)step();if(__G.S.rest>0)finishRest();})()")
        # ---------- wipe + easy revive ----------
        pg.evaluate("(()=>{const S=__G.S;S._z=S.zones.map(z=>z.boss);S.zones.forEach((z,i)=>{if(i<7)z.boss=true});S.zone=7;S.battle=null;S.rest=0;S.auto=true;S.chars.forEach(c=>c.hp=1);startBattle(true);let g=0;while(!S.wiped&&g++<800)step();renderAll();})()")
        pg.wait_for_timeout(500)
        st = S(pg, "({wiped:S.wiped,auto:S.auto,hp:S.chars.map(c=>c.hp)})")
        rec(f'{tag} party wipe pauses automation, heals everyone, shows revive', st['wiped'] and not st['auto'] and all(h > 1 for h in st['hp']) and pg.locator('.wipe').count() == 1, st)
        shot(pg, tag, '12-wipe')
        tap(pg, '.wipe [data-a=zone]', 0, touch)
        rec(f'{tag} one tap: back a zone and resume', S(pg, "!S.wiped && S.auto && S.zone===6"))
        pg.evaluate("(()=>{const S=__G.S;S.zones.forEach((z,i)=>z.boss=S._z[i]);delete S._z;S.zone=0;S.battle=null})()")
        # ---------- codex ----------
        tab(pg, 'codex', touch); pg.wait_for_timeout(300)
        rec(f'{tag} bestiary lists met monsters with kill counts', pg.locator('.beast:not(.unk)').count() >= 3)
        shot(pg, tag, '13-bestiary')
        tap(pg, '[data-a=cview][data-v=mats]', 0, touch); rec(f'{tag} codex lists every material with sources', pg.locator('.card.mat').count() == 17)
        tap(pg, '[data-a=cview][data-v=relics]', 0, touch); rec(f'{tag} relic codex lists 7 relics with odds', pg.locator('.card.relic').count() == 7)
        over = []
        for t in ['party', 'village', 'map', 'codex']:
            tab(pg, t, touch); pg.wait_for_timeout(200)
            ov = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            if ov > 1: over.append((t, ov))
        rec(f'{tag} no horizontal overflow on any tab', not over, over)
        # ---------- offline welcome back ----------
        pg.evaluate("__G.S.auto=true;__G.S.wiped=false;__G.S.workers={masonry:true,mining:true};__debug.away(3600)")
        lv0 = S(pg, "S.profs.masonry.lv"); w0 = S(pg, "S.stats.wins")
        pg.reload(wait_until='networkidle'); pg.wait_for_timeout(1200)
        st = S(pg, "({lv:S.profs.masonry.lv,wins:S.stats.wins})")
        rec(f'{tag} 1h offline: welcome-back summary; villagers + battles progressed', pg.locator('#modal h2', has_text='Welcome back').count() == 1 and st['lv'] > lv0 and st['wins'] > w0, st)
        shot(pg, tag, '14-welcome-back')
        tap(pg, '#modal .mclose', 0, touch)
        # ---------- export / reset / import ----------
        tap(pg, '[data-a=settings]', 0, touch); tap(pg, '[data-a=exportSave]', 0, touch)
        code = pg.locator('#exp').input_value()
        tap(pg, '#modal .mclose', 0, touch)
        tap(pg, '[data-a=settings]', 0, touch); tap(pg, '[data-a=resetAsk]', 0, touch); tap(pg, '[data-a=resetDo]', 0, touch); pg.wait_for_timeout(400)
        rec(f'{tag} hard reset returns to party creation', not S(pg, "S.started") and pg.locator('.create').count() == 1)
        tap(pg, '[data-a=importOpen]', 0, touch); pg.locator('#imp').fill(code); tap(pg, '[data-a=importDo]', 0, touch); pg.wait_for_timeout(400)
        rec(f'{tag} import restores the exported save', S(pg, "S.started && S.chars[0].name==='Noah' && S.chars[0].job==='knight'"))
        # ---------- migration from an older save ----------
        pg.evaluate("(()=>{save();__G.noSave=true;const s=JSON.parse(localStorage.getItem('lanternfall.save'));delete s.v;delete s.settings.autoRest;delete s.bestiary;delete s.banners;delete s.diamonds;s.buildings={smithy:2};s.inv.forEach(u=>delete u.r);localStorage.setItem('lanternfall.save',JSON.stringify(s));})()")
        pg.reload(wait_until='networkidle'); pg.wait_for_timeout(800)
        st = S(pg, "({v:S.v,ar:S.settings.autoRest,b:S.buildings,best:typeof S.bestiary,ban:S.banners,dia:S.diamonds,r:S.inv.every(u=>u.relic||u.r===0)})")
        rec(f'{tag} save migration v0 -> v2 fills missing fields, gear gets rarity', st['v'] == 2 and st['ar'] is True and st['b'].get('guild') == 0 and st['b']['smithy'] == 2 and st['best'] == 'object' and st['ban']['forge'] == 1 and st['dia'] == 25 and st['r'], st)
        # ---------- render guard ----------
        pg.evaluate("__G.S.chars[0].race='nope'"); tab(pg, 'party', touch); pg.wait_for_timeout(1500)
        rec(f'{tag} render guard: a broken page shows an error box, game keeps running', pg.locator('.err').count() >= 1)
        pg.evaluate("__G.S.chars[0].race='human'"); pg.wait_for_timeout(1500)
        errs[:] = [e for e in errs if not (e.startswith(tag + ' console') and ('party' in e or 'battle' in e or 'mini' in e or 'tick' in e or 'top' in e))]
        ctx.close()
    b.close()
print('console/page errors:', errs or 'none'); print('bad responses:', bad or 'none')
ok = all(res) and not errs and not bad
print(f'{sum(res)}/{len(res)} checks passed' + ('' if ok else ' — FAILURES'))
sys.exit(0 if ok else 1)
