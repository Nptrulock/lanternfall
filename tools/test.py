#!/usr/bin/env python3
"""Lanternfall v2 headless test (Chrome + touch emulation) at iPhone, iPad landscape and desktop.
usage: python3 tools/test.py [BASE_URL] [sizes]
Covers: 3-hero party creation, opening in town with NO battle, one worker at start + rising hire cost, world map, setting out,
slow multi-round battles, battles drop NO items/materials, stamina drain -> return home, skill learning, job grid + lock-in kept
across a job switch (and a reload), mentors -> subjob, Endurance training, gear-hall pulls, Bravely-style shop, bestiary,
offline welcome-back, v1 save -> new-journey notice, export/import, hard reset, render guard, no horizontal overflow,
zero console errors. Shots of the key screens go to shots/. The __debug hooks are test-only (no UI)."""
import sys, os
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8795/'
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 else None
SHOTS = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots'))
os.makedirs(SHOTS, exist_ok=True)
SIZES = [('iphone', 390, 844, True, 3), ('ipad-land', 1180, 820, True, 2), ('desktop', 1440, 900, False, 1)]
res = []; errs = []; bad = []
def rec(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + (('  ' + str(info)[:400]) if info and not ok else ''), flush=True)
def tap(pg, sel, i=0, touch=True):
    loc = pg.locator(sel).nth(i)
    loc.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(150)
    bb = loc.bounding_box()
    if touch: pg.touchscreen.tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
    else: pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
    pg.wait_for_timeout(300)
def S(pg, expr): return pg.evaluate(f"(()=>{{const S=__G.S;return {expr}}})()")
def shot(pg, tag, name, full=False):
    pg.evaluate("window.scrollTo(0,0)") if not full else None
    pg.screenshot(path=f'{SHOTS}/{tag}-{name}.png', full_page=full)
def nav(pg, t, touch): tap(pg, f'#nav [data-a=tab][data-t={t}]', 0, touch); pg.wait_for_timeout(250)
def place(pg, p, touch):
    nav(pg, 'town', touch)
    if pg.locator('.phead .back').count(): tap(pg, '.phead .back', 0, touch)
    tap(pg, f'.townmap .pin[data-p={p}]', 0, touch)
def close_modal(pg, touch):
    if pg.locator('#modal .mclose').count(): tap(pg, '#modal .mclose', 0, touch)
REFILL = "__G.S.chars.forEach(c=>c.stam=maxStam(c))"
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
        # ---------- party creation (3 heroes) ----------
        rec(f'{tag} create screen shows 3 hero slots with 6 races each', pg.locator('.cslot').count() == 3 and pg.locator('.cslot').nth(0).locator('.race').count() == 6)
        pg.locator('#cn0').fill('Noah'); tap(pg, '[data-a=crace][data-i="2"][data-r=orc]', 0, touch)
        shot(pg, tag, '00-create')
        tap(pg, '[data-a=begin]', 0, touch); pg.wait_for_timeout(400)
        close_modal(pg, touch); pg.wait_for_timeout(2500)
        st = S(pg, "({started:S.started,n:S.chars.length,names:S.chars.map(c=>c.name),races:S.chars.map(c=>c.race),loc:S.loc,battle:!!S.battle,battles:S.stats.battles,tab:__debug.ui.tab})")
        rec(f'{tag} party of 3 created (names + races kept)', st['started'] and st['n'] == 3 and st['names'][0] == 'Noah' and st['races'] == ['human', 'elf', 'orc'], st)
        rec(f'{tag} game opens in TOWN with no battle running', st['loc'] == 'town' and not st['battle'] and st['battles'] == 0 and st['tab'] == 'town' and pg.locator('.townmap').is_visible() and pg.locator('#scene').count() == 0, st)
        rec(f'{tag} town map shows tappable buildings', pg.locator('.townmap .pin').count() >= 10)
        shot(pg, tag, '01-town-start')
        # ---------- workers: one at the start ----------
        st = S(pg, "({hired:S.hired,slots:workerSlots(),used:workersUsed(),cost:hireCost()})")
        rec(f'{tag} exactly ONE worker at the start; the next costs gold', st['hired'] == 1 and st['slots'] == 1 and st['used'] == 0 and st['cost'] and st['cost'] > 0, st)
        place(pg, 'hall', touch)
        tap(pg, '[data-a=work][data-p=mining][data-d="1"]', 0, touch)
        rec(f'{tag} assign the worker to Mining', S(pg, "S.workers.mining===1"))
        rec(f'{tag} a second assignment is blocked (no free worker)', pg.locator('[data-a=work][data-p=foraging][data-d="1"]').is_disabled())
        shot(pg, tag, '02-town-hall')
        # ---------- world map ----------
        nav(pg, 'map', touch)
        rec(f'{tag} world map: 8 zone pins, 7 locked, town marked', pg.locator('.worldmap .zpin').count() == 8 and pg.locator('.worldmap .zpin.locked').count() == 7 and pg.locator('.tpin').count() == 1)
        shot(pg, tag, '03-world-map')
        # ---------- set out: slow battles ----------
        tap(pg, '.zc [data-a=depart][data-z="0"]', 0, touch); pg.wait_for_timeout(500)
        rec(f'{tag} choosing a zone sets out; battle screen shows 3 DQ windows', S(pg, "S.loc==='exp'") and pg.locator('#pwins .pwin').count() == 3)
        a0 = S(pg, "S.log.length"); pg.wait_for_timeout(5000)
        st = S(pg, "({wins:S.stats.wins,acts:S.log.length,foes:S.battle?S.battle.enemies.length:0})")
        rec(f'{tag} pacing: ~1 action per 1.2 s (no instant clears)', st['wins'] <= 1 and (st['acts'] - a0) <= 12, (st, a0))
        shot(pg, tag, '04-mid-battle')
        # ---------- battles drop no items ----------
        st0 = S(pg, "({inv:S.inv.length,mats:JSON.stringify(S.mats),gold:S.gold,xp:S.chars.map(c=>c.xp+c.lv*1000),dia:S.diamonds})")
        pg.evaluate("__G.S.workers={};" + REFILL + ";__debug.battles(12)")
        st1 = S(pg, "({inv:S.inv.length,mats:JSON.stringify(S.mats),gold:S.gold,xp:S.chars.map(c=>c.xp+c.lv*1000),rounds:S.stats.rounds,battles:S.stats.battles,wins:S.stats.wins})")
        rec(f'{tag} battles give gold + XP but NO items or materials', st1['inv'] == st0['inv'] and st1['mats'] == st0['mats'] and st1['gold'] > st0['gold'] and st1['xp'] != st0['xp'], (st0, st1))
        rec(f'{tag} fights last several rounds on average', st1['battles'] and st1['rounds'] / st1['battles'] >= 3, st1)
        # ---------- stamina ----------
        pg.evaluate("if(__G.S.loc!=='exp'){" + REFILL + ";depart(0);}")
        s0 = S(pg, "S.chars.map(c=>c.stam)"); pg.evaluate("__debug.battles(3)"); s1 = S(pg, "S.chars.map(c=>c.stam)")
        rec(f'{tag} every battle drains stamina', all(b2 < a2 for a2, b2 in zip(s0, s1)), (s0, s1))
        pg.evaluate("__debug.battles(400)")
        st = S(pg, "({loc:S.loc,reason:S.lastExp&&S.lastExp.reason,stam:S.chars.map(c=>Math.floor(c.stam))})")
        rec(f'{tag} out of stamina (or fallen) -> party walks home, automation stops', st['loc'] == 'town' and st['reason'] in ('tired', 'wipe'), st)
        nav(pg, 'camp', touch)
        rec(f'{tag} campfire shows stamina + rest/train/mentor choices', pg.locator('.campc').count() == 3 and pg.locator('.campc .bar.stam').count() == 3 and pg.locator('[data-sel=act]').count() == 3)
        shot(pg, tag, '05-camp-stamina')
        # ---------- learn a skill ----------
        pg.evaluate("(()=>{for(let k=0;k<12&&!__G.S.stats.learned;k++){" + REFILL + ";__G.S.loc='town';depart(0);__debug.battles(25);goHome('manual');}})()")
        rec(f'{tag} winning battles fills AP until a skill is learned', S(pg, "S.stats.learned>=1"), S(pg, "S.chars.map(c=>c.ap)"))
        # ---------- jobs: grid + lock-in ----------
        pg.evaluate("(()=>{const c=__G.S.chars[0];c.learned.power_strike=1;c.learned.heal=1;dirty();})()")
        nav(pg, 'party', touch); tap(pg, '[data-a=sel][data-i="0"]', 0, touch); tap(pg, '[data-a=htab][data-k=job]', 0, touch)
        tap(pg, '[data-a=jobView][data-j=knight]', 0, touch); tap(pg, '[data-a=setJob][data-j=knight]', 0, touch)
        rec(f'{tag} first job is easy: 1 Martial skill unlocks Knight', S(pg, "S.chars[0].job") == 'knight')
        pg.evaluate("__G.S.chars[0].jobs.knight.jp=60")
        for nid in ['0.0', '0.1', '0.2']:
            tap(pg, f'.sgrid .node[data-n="{nid}"]', 0, touch); tap(pg, f'[data-a=buyNode][data-n="{nid}"]', 0, touch)
        rec(f'{tag} spend JP on sphere-grid nodes up to an ability', S(pg, "['0.0','0.1','0.2'].every(n=>S.chars[0].jobs.knight.nodes[n])"), S(pg, "S.chars[0].jobs.knight"))
        tap(pg, '[data-a=lock][data-n="0.2"]', 0, touch)
        rec(f'{tag} lock in ONE Knight ability (shown in the job UI)', S(pg, "S.chars[0].locks.knight") == '0.2' and pg.locator('.locked-pick').count() == 1 and pg.locator('.sgrid .node.locked').count() == 1)
        shot(pg, tag, '06-job-grid-lockin', True)
        tap(pg, '[data-a=jobView][data-j=priest]', 0, touch); tap(pg, '[data-a=setJob][data-j=priest]', 0, touch)
        st = S(pg, "({job:S.chars[0].job,locked:lockedNodes(S.chars[0]).map(x=>x.jid+':'+x.n.id),dr:calcBase(S.chars[0]).f.dr||0,hp3:calcBase(S.chars[0]).hp})")
        rec(f'{tag} lock-in persists across a job switch (Iron Wall still active as a Priest)', st['job'] == 'priest' and st['locked'] == ['knight:0.2'] and st['dr'] >= 1, st)
        pg.evaluate("save()"); pg.reload(wait_until='networkidle'); pg.wait_for_timeout(800); close_modal(pg, touch)
        st = S(pg, "({job:S.chars[0].job,lock:S.chars[0].locks.knight,dr:calcBase(S.chars[0]).f.dr||0})")
        rec(f'{tag} lock-in survives a reload', st['job'] == 'priest' and st['lock'] == '0.2' and st['dr'] >= 1, st)
        # ---------- mentors -> subjob ----------
        place(pg, 'training', touch); tap(pg, '[data-a=ptab][data-k=mentors]', 0, touch)
        tap(pg, '.mentor [data-a=act][data-i="1"][data-v="m:aldric"]', 0, touch)
        rec(f'{tag} send a hero to study with a mentor', S(pg, "S.chars[1].act") == 'm:aldric')
        pg.evaluate("__debug.town(6000)")
        st = S(pg, "({r:mentorRank(S.chars[1],'aldric'),sub:subjobOk(S.chars[1],'knight'),me:mentorEff(S.chars[1])})")
        rec(f'{tag} mentor ranks grow a bonus (+DEF) with a minus (-AGI) and open the Knight subjob', st['r'] >= 3 and st['sub'] and st['me'].get('def', 0) > 0 and st['me'].get('agi', 0) < 0, st)
        shot(pg, tag, '07-mentors', True)
        # ---------- training grounds ----------
        tap(pg, '[data-a=ptab][data-k=train]', 0, touch); tap(pg, '[data-a=act][data-i="2"][data-v=train]', 0, touch)
        m0 = S(pg, "maxStam(S.chars[2])"); pg.evaluate("__debug.town(1500)")
        st = S(pg, "({lv:S.chars[2].endLv,ms:maxStam(S.chars[2])})")
        rec(f'{tag} Endurance training raises max stamina', st['lv'] >= 2 and st['ms'] > m0, (m0, st))
        shot(pg, tag, '08-training-grounds', True)
        # ---------- gear hall ----------
        place(pg, 'forge', touch)
        rec(f'{tag} gear hall shows rates, pity and pool', pg.locator('table.rates').count() == 1 and pg.locator('.pool .pi').count() >= 2)
        shot(pg, tag, '09-gacha-hall')
        pg.evaluate("__G.S.diamonds=50"); pg.wait_for_timeout(1100)
        n0 = S(pg, "S.inv.length"); tap(pg, '[data-a=pull][data-n="1"]', 0, touch); pg.wait_for_timeout(1800)
        rec(f'{tag} pull x1 spends 5 diamonds and adds gear', S(pg, "S.diamonds") == 45 and S(pg, "S.inv.length") == n0 + 1 and pg.locator('#modal .pcard').count() == 1)
        close_modal(pg, touch)
        tap(pg, '[data-a=pull][data-n="10"]', 0, touch); pg.wait_for_timeout(3200)
        rs = S(pg, "S.inv.slice(-10).map(u=>u.r)")
        rec(f'{tag} pull x10 gives 10 with a Rare+ guaranteed', pg.locator('#modal .pcard').count() == 10 and max(rs) >= 2, rs)
        shot(pg, tag, '10-pull-x10')
        close_modal(pg, touch)
        # ---------- shop ----------
        pg.evaluate("__G.S.gold+=300; __G.S.market={at:Date.now(),list:['stick','charm']};")
        place(pg, 'market', touch)
        tap(pg, '.slist tr[data-a=shopSel][data-id=charm]', 0, touch)
        rec(f'{tag} shop: price/owned columns, tooltip and party comparison', pg.locator('.slist th', has_text='Owned').count() == 1 and pg.locator('.tip .cmpc').count() == 3 and pg.locator('.keeper img').count() == 1)
        shot(pg, tag, '11-shop', True)
        n0 = S(pg, "S.inv.length"); tap(pg, '.tip [data-a=buy]', 0, touch)
        rec(f'{tag} buy basic gear at the Market', S(pg, "S.inv.length") == n0 + 1)
        # ---------- hire with gold ----------
        pg.evaluate("__G.S.gold+=5000"); place(pg, 'hall', touch)
        c1 = S(pg, "hireCost()"); tap(pg, '[data-a=hire]', 0, touch); c2 = S(pg, "hireCost()")
        rec(f'{tag} hire a second worker with gold; the third costs more', S(pg, "S.hired") == 2 and c2 > c1, (c1, c2))
        # ---------- codex ----------
        nav(pg, 'codex', touch)
        rec(f'{tag} bestiary shows kills and tiers per zone', pg.locator('.beast:not(.unseen)').count() >= 3)
        shot(pg, tag, '12-bestiary')
        tap(pg, '[data-a=cview][data-v=mats]', 0, touch)
        rec(f'{tag} materials list says where each comes from', pg.locator('.skrow[data-a=matInfo]').count() >= 12)
        tap(pg, '.skrow[data-a=matInfo]', 0, touch)
        rec(f'{tag} where-to-get sheet opens', pg.locator('#modal h3', has_text='Where to get it').count() == 1)
        close_modal(pg, touch)

        # ---------- playtest pass: stages, skills, fuse, bank, masonry, study, cooking, gacha ----------
        rec(f'{tag} save version is 4', S(pg, "S.v") == 4)
        rec(f'{tag} fuse requires 10 copies; Mythic only at a maxed Forge', S(pg, "fuseNeed()===10 && fuseLimit()===Math.min(4,Math.floor(S.buildings.forge/2)) && (S.buildings.forge=8, fuseLimit()===5)"))
        place(pg, 'market', touch)
        rec(f'{tag} market shows few rotating slots', S(pg, "shopItems().length") <= 3 and 'Rotating stall' in pg.locator('.shop').inner_text())
        pg.evaluate("(()=>{const c=S.chars[0]; c.learned=c.learned||{}; c.learned.entangle=1; c.skillOff={}; dirty();})()".replace('S.chars','__G.S.chars'))
        nav(pg, 'party', touch); tap(pg, '[data-a=sel][data-i="0"]', 0, touch); tap(pg, '[data-a=htab][data-k=skills]', 0, touch)
        rec(f'{tag} skills show an on/off toggle for auto-battle', pg.locator('[data-a=togSkill][data-sid=entangle]').count() == 1)
        tap(pg, '[data-a=togSkill][data-sid=entangle]', 0, touch)
        rec(f'{tag} toggling Entangle off removes it from auto-battle', S(pg, "!!S.chars[0].skillOff.entangle && !usableSkills(S.chars[0], calcBase(S.chars[0])).some(k=>k.id==='entangle')"))
        # cooking: eat one of each
        pg.evaluate("""(()=>{const S=__G.S; S.loc='town'; S.meals={}; D.FOODS.slice(0,2).forEach(f=>S.meals[f.id]=2); S.chars.forEach(c=>c.stam=maxStam(c)); depart(0,false);})()""")
        rec(f'{tag} setting out eats one of each packed meal', S(pg, "S.foods.length===2 && D.FOODS.slice(0,2).every(f=>S.meals[f.id]===1)"))
        pg.evaluate("goHome('manual')")
        # scholarship must not inflate boss kills
        st = S(pg, """(()=>{S.bestiary.king_slime=2; S.zones[0].bossKills=2; S.research={}; for(let i=0;i<40;i++) addKill('king_slime',1,true); addResearch('king_slime',10); addResearch('slime',5); return {k:S.bestiary.king_slime, r:S.research.king_slime||0, rs:S.research.slime||0};})()""")
        rec(f'{tag} library/scholarship never inflate boss kill counts', st['k'] == 2 and st['r'] == 0 and st['rs'] == 5, st)
        # masonry gate
        st = S(pg, "({why:(S.buildings.training=2,S.profs.masonry.lv=1,S.gold=1e6,S.mats.stone=999,S.mats.timber=999,S.mats.copper=999,canBuild('training').why)})")
        rec(f'{tag} Masonry is required to raise buildings past the first levels', 'Masonry' in (st.get('why') or ''), st)
        # banker
        place(pg, 'hall', touch)
        if pg.locator('[data-a=ptab][data-k=bank]').count():
            tap(pg, '[data-a=ptab][data-k=bank]', 0, touch)
        rec(f'{tag} Town Hall has a Bank tab that can hold gold', pg.locator('.bank').count() == 1 or 'Town Bank' in pg.inner_text('body'))
        pg.evaluate("__G.S.gold+=200; bankDeposit(100); tickBank(86400)")
        rec(f'{tag} deposited gold earns slow interest', S(pg, "S.bank.gold>100 && S.bank.earned>0"))
        # mentor every rank visible
        st = S(pg, "({a:(()=>{const c=S.chars[0]; c.mentors.aldric={rank:1,xp:0}; dirty(); const p1=mentorEff(c).def; c.mentors.aldric.rank=2; dirty(); const p2=mentorEff(c).def; return [p1,p2]})()})")
        rec(f'{tag} every mentor rank changes a visible stat', st['a'][1] > st['a'][0], st)
        if tag == 'iphone':
            # fresh screenshots requested for the playtest pass
            pg.evaluate("__G.S.zones[0].wins=24; __G.S.chars[1].act='m:aldric'; (__G.S.chars[1].mentors.aldric||(__G.S.chars[1].mentors.aldric={rank:1,xp:200}))")
            nav(pg, 'map', touch); pg.wait_for_timeout(200); shot(pg, tag, '20-stages', True)
            nav(pg, 'camp', touch); pg.wait_for_timeout(200); shot(pg, tag, '21-campfire-mentor', True)
            place(pg, 'training', touch); tap(pg, '[data-a=ptab][data-k=train]', 0, touch)
            shot(pg, tag, '22-training-drill', True)
            if pg.locator('[data-a=drillStart]').count():
                tap(pg, '[data-a=drillStart]', 0, touch); pg.wait_for_timeout(400)
                shot(pg, tag, '23-focus-drill-modal')
                close_modal(pg, touch)
            nav(pg, 'party', touch); tap(pg, '[data-a=htab][data-k=skills]', 0, touch)
            shot(pg, tag, '24-skill-toggles', True)
            pg.evaluate("(()=>{const S=__G.S; for(let i=0;i<3;i++) addItem('lucky_coin',5); S.bagSort='rarity'; sortInv('rarity');})()")
            tap(pg, '[data-a=htab][data-k=gear]', 0, touch); pg.wait_for_timeout(200)
            shot(pg, tag, '25-mythic-sorted-inventory', True)
            place(pg, 'market', touch); shot(pg, tag, '26-market-rotation', True)
            place(pg, 'hall', touch)
            if pg.locator('[data-a=ptab][data-k=bank]').count(): tap(pg, '[data-a=ptab][data-k=bank]', 0, touch)
            shot(pg, tag, '27-banker', True)
            place(pg, 'training', touch)
            if pg.locator('[data-a=ptab][data-k=mentors]').count(): tap(pg, '[data-a=ptab][data-k=mentors]', 0, touch)
            shot(pg, tag, '28-mentor-ranks', True)
            nav(pg, 'codex', touch); tap(pg, '[data-a=cview][data-v=bestiary]', 0, touch) if pg.locator('[data-a=cview][data-v=bestiary]').count() else None
            shot(pg, tag, '29-bestiary-xp-gold', True)

        over = []
        for t in ['town', 'map', 'camp', 'party', 'codex']:
            nav(pg, t, touch)
            ov = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            if ov > 1: over.append((t, ov))
        rec(f'{tag} no horizontal overflow on any tab', not over, over)
        # ---------- boss ----------
        pg.evaluate("__G.S.zones[0].wins=80;" + REFILL)
        nav(pg, 'map', touch); tap(pg, '.zc [data-a=departBoss][data-z="0"]', 0, touch); pg.wait_for_timeout(2600)
        rec(f'{tag} after 80 wins the boss can be challenged', S(pg, "!!(S.battle&&S.battle.boss)"), S(pg, "S.battle&&S.battle.enemies.map(e=>e.name)"))
        if W < 1000: shot(pg, tag, '13-boss')
        pg.evaluate("goHome('manual')")
        # ---------- offline ----------
        pg.evaluate("__G.S.workers={mining:1};" + REFILL + ";depart(0);__debug.away(3600)")
        w0 = S(pg, "S.stats.wins"); x0 = S(pg, "S.profs.mining.xp+S.profs.mining.lv*1e6")
        pg.reload(wait_until='networkidle'); pg.wait_for_timeout(1200)
        st = S(pg, "({w:S.stats.wins,x:S.profs.mining.xp+S.profs.mining.lv*1e6,loc:S.loc})")
        rec(f'{tag} 1 h offline: welcome-back; fought until tired, workers kept working', pg.locator('#modal h2', has_text='Welcome back').count() == 1 and st['w'] > w0 and st['x'] > x0, st)
        shot(pg, tag, '14-welcome-back')
        close_modal(pg, touch)
        # ---------- export / reset / import ----------
        nav(pg, 'codex', touch); tap(pg, '#top [data-a=codexGo][data-k=save]', 0, touch); tap(pg, '[data-a=exportSave]', 0, touch)
        code = pg.locator('#exp').input_value(); close_modal(pg, touch)
        tap(pg, '[data-a=resetAsk]', 0, touch); pg.locator('#resetTxt').fill('reset'); tap(pg, '[data-a=resetDo]', 0, touch)
        rec(f'{tag} hard reset refuses anything but RESET', S(pg, "S.started") and pg.locator('#reseterr').inner_text() != '')
        pg.locator('#resetTxt').fill('RESET'); tap(pg, '[data-a=resetDo]', 0, touch); pg.wait_for_timeout(400)
        rec(f'{tag} hard reset returns to party creation', not S(pg, "S.started") and pg.locator('.create').count() == 1)
        pg.evaluate(f"importSave({code!r})"); pg.evaluate("__debug.render()"); pg.wait_for_timeout(300)
        rec(f'{tag} import restores the exported save', S(pg, "S.started && S.chars[0].name==='Noah' && S.chars[0].locks.knight==='0.2'"))
        # ---------- v1 save -> new journey ----------
        pg.evaluate("(()=>{__G.noSave=true;localStorage.setItem('lanternfall.save',JSON.stringify({v:2,started:true,chars:[{name:'Old'}]}))})()")
        pg.reload(wait_until='networkidle'); pg.wait_for_timeout(800)
        st = S(pg, "({v:S.v,started:S.started,backup:!!localStorage.getItem('lanternfall.save.v2backup')})")
        rec(f'{tag} old v1 save -> fresh start, backed up, one-time new-journey notice', st['v'] == 4 and not st['started'] and st['backup'] and pg.locator('#modal h2', has_text='new journey').count() == 1, st)
        close_modal(pg, touch)
        pg.evaluate(f"__G.noSave=false;importSave({code!r});__debug.render()"); pg.wait_for_timeout(300)
        # ---------- render guard ----------
        pg.evaluate("__G.S.chars[0].race='nope'"); nav(pg, 'party', touch); pg.wait_for_timeout(1300)
        rec(f'{tag} render guard: a broken page shows an error box, game keeps running', pg.locator('.err').count() >= 1 and pg.locator('#nav .nb').count() == 5)
        pg.evaluate("__G.S.chars[0].race='human'"); pg.wait_for_timeout(1300)
        errs[:] = [e for e in errs if not (e.startswith(tag + ' console') and any(k in e for k in ('party', 'battle', 'nav', 'tick', 'top', 'town', 'camp', 'map')))]
        ctx.close()
    b.close()
print('console/page errors:', errs or 'none'); print('bad responses:', bad or 'none')
ok = all(res) and not errs and not bad
print(f'{sum(res)}/{len(res)} checks passed' + ('' if ok else ' — FAILURES'))
sys.exit(0 if ok else 1)
