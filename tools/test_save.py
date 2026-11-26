#!/usr/bin/env python3
"""Lanternfall save-safety tests (iPhone size, Chrome with an iPhone Safari user agent; navigator.standalone mocked).
usage: python3 tools/test_save.py [BASE_URL]
Covers: Home Screen prompt logic (Safari tab / standalone / desktop, dismiss, gentle re-show after 3 days), manifest + icons,
navigator.storage.persist() call, rolling backups (3 autosaves + daily), corrupted save -> 'couldn't load' screen (raw kept, never
overwritten) -> restore, backup restore round-trip, save code copy from the main menu, save-code reminder, hard reset needs RESET."""
import sys, os, json, time
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8795/'
SHOTS = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots'))
os.makedirs(SHOTS, exist_ok=True)
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
res = []; errs = []
def rec(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + (('  ' + str(info)[:400]) if info and not ok else ''), flush=True)
def S(pg, expr): return pg.evaluate(f"(()=>{{const S=__G.S;return {expr}}})()")
def tap(pg, sel, i=0):
    loc = pg.locator(sel).nth(i); loc.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(120)
    bb = loc.bounding_box(); pg.touchscreen.tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.wait_for_timeout(300)
def mock(standalone):
    sa = 'undefined' if standalone is None else ('true' if standalone else 'false')
    return ("(()=>{ if(%s!==undefined) Object.defineProperty(Navigator.prototype,'standalone',{get:()=>%s,configurable:true});"
            " window.__persistCalls=0; if(navigator.storage){ navigator.storage.persist=()=>{window.__persistCalls++;return Promise.resolve(true)};"
            " navigator.storage.persisted=()=>Promise.resolve(false);} })()") % (sa, sa)
def page(b, standalone=False, ua=UA):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True, user_agent=ua)
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=BASE.split('/lanternfall')[0] if 'github.io' in BASE else BASE.rstrip('/'))
    ctx.add_init_script(mock(standalone))
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('pageerror ' + str(e)))
    pg.on('console', lambda m: m.type == 'error' and errs.append('console ' + m.text))
    return ctx, pg
def fresh(pg):
    pg.goto(BASE, wait_until='networkidle'); pg.evaluate("localStorage.clear()"); pg.reload(wait_until='networkidle'); pg.wait_for_timeout(500)
def begin(pg):
    tap(pg, '[data-a=begin]'); pg.wait_for_timeout(300)
    if pg.locator('#modal .mclose').count(): tap(pg, '#modal .mclose')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    # ---------- pure prompt logic ----------
    ctx, pg = page(b, False); fresh(pg)
    d = pg.evaluate("""(()=>{const f=__debug.a2hsDecision, now=Date.now(), D=864e5; return [
      f({safariTab:true,now,st:{}}), f({safariTab:false,now,st:{}}), f({safariTab:true,now,st:{dismissedAt:now-D}}),
      f({safariTab:true,now,st:{dismissedAt:now-3*D-1}}), f({safariTab:false,now,st:{dismissedAt:now-9*D}})]})()""")
    rec('prompt logic: Safari tab -> full; standalone -> never; dismissed <3 days -> hidden; >=3 days -> gentle', d == ['full', None, None, 'gentle', None], d)
    # ---------- Safari tab (navigator.standalone === false) ----------
    rec('Safari tab detected (iOS UA, standalone false)', pg.evaluate("__debug.envSafariTab()") is True)
    rec('first visit shows the Home Screen prompt (Share -> Add to Home Screen)', pg.locator('#a2hs.full').is_visible() and 'Add to Home Screen' in pg.locator('#a2hs').inner_text())
    begin(pg); pg.wait_for_timeout(300)
    rec('party created with the prompt showing (prompt never blocks the start button)', S(pg, "S.started"))
    rec('in-game prompt offers one-tap save-code copy before moving to the Home Screen app', pg.locator('#a2hs.full [data-a=copyCode]').count() == 1)
    pg.screenshot(path=f'{SHOTS}/iphone-15-home-screen-prompt.png')
    rec('navigator.storage.persist() requested', pg.evaluate("window.__persistCalls") >= 1)
    tap(pg, '#a2hs [data-a=a2hsLater]', 0)
    rec('dismiss hides the prompt and remembers it', not pg.locator('#a2hs').is_visible() and pg.evaluate("!!JSON.parse(localStorage.getItem('lanternfall.a2hs')).dismissedAt"))
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(600)
    rec('after dismissing, a reload within 3 days stays quiet', not pg.locator('#a2hs').is_visible())
    pg.evaluate("localStorage.setItem('lanternfall.a2hs', JSON.stringify({dismissedAt:Date.now()-4*864e5,n:1}))"); pg.reload(wait_until='networkidle'); pg.wait_for_timeout(600)
    rec('still in a Safari tab 4 days later -> gentle re-show', pg.locator('#a2hs.gentle').is_visible())
    tap(pg, '#a2hs [data-a=a2hsOpen]'); rec('gentle banner expands to the steps', 'Add to Home Screen' in pg.locator('#a2hs').inner_text())
    tap(pg, '#a2hs [data-a=a2hsLater]')
    # ---------- manifest / icons ----------
    man = pg.evaluate("fetch(document.querySelector('link[rel=manifest]').href).then(r=>r.json())")
    icons = pg.evaluate("Promise.all([...document.querySelectorAll('link[rel=apple-touch-icon],link[rel=icon]')].map(l=>l.href).concat(['art/icon-512.png','art/icon-maskable-512.png']).map(u=>fetch(u).then(r=>r.status)))")
    rec('web app manifest (name, standalone, theme color, icons) + apple-touch-icon load', man.get('display') == 'standalone' and man.get('name') == 'Lanternfall' and man.get('theme_color') and len(man.get('icons', [])) >= 3 and all(s == 200 for s in icons), (man, icons))
    # ---------- rolling backups ----------
    pg.evaluate("(()=>{for(const g of [101,102,103,104]){__G.S.gold=g;save(true);}})()")
    bk = pg.evaluate("['auto1','auto2','auto3','daily'].map(k=>{const r=localStorage.getItem('lanternfall.save.'+k);return r?JSON.parse(r).gold:null})")
    rec('rolling backups: last 3 autosaves under separate keys + 1 daily', bk[:3] == [104, 103, 102] and bk[3] is not None, bk)
    pg.evaluate("__G.S.gold=104;save()"); bk2 = pg.evaluate("JSON.parse(localStorage.getItem('lanternfall.save.auto1')).gold")
    rec('ordinary autosaves inside 10 minutes do not churn the backups', bk2 == 104)
    # ---------- save code from the main menu + reminder ----------
    tap(pg, '#top [data-a=codexGo][data-k=save]')
    rec('💾 in the top bar opens the Save page (copy, paste, backups, hard reset)', pg.locator('.savecode [data-a=copyCode]').count() == 1 and pg.locator('[data-a=importOpen]').count() >= 1 and pg.locator('.bak').count() >= 4)
    pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(100)
    pg.screenshot(path=f'{SHOTS}/iphone-16-save-code.png')
    tap(pg, '.savecode [data-a=copyCode]'); pg.wait_for_timeout(400)
    clip = pg.evaluate("navigator.clipboard.readText()")
    ok_code = pg.evaluate(f"(()=>{{try{{const o=JSON.parse(decodeURIComponent(escape(atob({json.dumps(clip)}))));return o.chars.length===3}}catch(e){{return false}}}})()")
    rec('one-tap copy puts a valid save code on the clipboard and records the time', ok_code and S(pg, "!!S.flags.lastCopy"), clip[:40])
    pg.evaluate("(()=>{const S=__G.S;S.stats.play=4000;S.created=Date.now()-5*864e5;S.flags.lastCopy=Date.now()-4*864e5;S.flags.nudgeSnooze=0;__debug.render()})()"); pg.wait_for_timeout(200)
    rec('reminder appears after a few days without copying', pg.locator('#nudge [data-a=copyCode]').is_visible())
    pg.screenshot(path=f'{SHOTS}/iphone-17-save-reminder.png')
    tap(pg, '#nudge [data-a=copyCode]'); pg.wait_for_timeout(400)
    rec('one tap in the reminder copies and dismisses it', not pg.locator('#nudge').is_visible() and S(pg, "Date.now()-S.flags.lastCopy<60000"))
    # ---------- backup restore round-trip ----------
    pg.evaluate("(()=>{__G.S.gold=555;__G.S.chars[0].name='Keeper';save(true);__G.S.gold=999;__G.S.chars[0].name='Current';save();})()")
    tap(pg, '#top [data-a=codexGo][data-k=save]'); pg.wait_for_timeout(300)
    tap(pg, '.bak [data-a=restoreAsk][data-k="lanternfall.save.auto1"]'); tap(pg, '#modal [data-a=restoreDo]'); pg.wait_for_timeout(300)
    st = S(pg, "({g:S.gold,n:S.chars[0].name,b1:JSON.parse(localStorage.getItem('lanternfall.save.prerestore')).chars[0].name})")
    rec('restore a backup from the Save page; the replaced game is kept', st['g'] == 555 and st['n'] == 'Keeper' and st['b1'] == 'Current', st)
    pg.evaluate("__debug.render()"); tap(pg, '#top [data-a=codexGo][data-k=save]')
    tap(pg, '.bak [data-a=restoreAsk][data-k="lanternfall.save.prerestore"]'); tap(pg, '#modal [data-a=restoreDo]'); pg.wait_for_timeout(300)
    st2 = S(pg, "({g:S.gold,n:S.chars[0].name})")
    rec('round-trip: the game you replaced was kept as a backup and comes back', st2['n'] == 'Current' and st2['g'] == 999, (st, st2))
    # ---------- v3 -> v4 migrate (boss-kill clamp, grandfathered subjob, new fields) ----------
    pg.evaluate("""(()=>{__G.noSave=true; const s=JSON.parse(localStorage.getItem('lanternfall.save'));
      s.v=3; s.bestiary=s.bestiary||{}; s.bestiary.king_slime=200; s.bestiary.slime=12;
      s.zones[0].boss=true; s.zones[0].bossKills=2;
      s.chars[0].mentors=s.chars[0].mentors||{}; s.chars[0].mentors.sela={rank:2,xp:0};
      delete s.bank; delete s.research; delete s.feature; if(s.profs) delete s.profs.masonry;
      localStorage.setItem('lanternfall.save', JSON.stringify(s));})()""")
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(800)
    if pg.locator('#modal .mclose').count(): tap(pg, '#modal .mclose')
    st = S(pg, "({v:S.v,k:S.bestiary.king_slime,leg:!!(S.chars[0].mentors.sela&&S.chars[0].mentors.sela.legacySub),bank:!!S.bank,mas:!!S.profs.masonry,sub:subjobOk(S.chars[0],'priest')})")
    rec('v3 save migrates to v4, clamps inflated slime-boss kills to real bossKills, grandfathers subjobs, adds bank/masonry', st['v']==4 and st['k']==2 and st['leg'] and st['bank'] and st['mas'] and st['sub'], st)
    # ---------- corrupted save ----------
    good = pg.evaluate("save(true);localStorage.getItem('lanternfall.save')")
    bad_raw = good[:len(good) // 2]
    pg.evaluate(f"__G.noSave=true;localStorage.setItem('lanternfall.save',{json.dumps(bad_raw)})")
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(800)
    rec('corrupted save -> "Your save couldn\'t load" screen, not a new game', pg.locator('.loadfail h1', has_text="couldn").count() == 1 and pg.locator('.create').count() == 0 and pg.locator('#nav .nb').count() == 0)
    pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(100)
    pg.screenshot(path=f'{SHOTS}/iphone-18-load-failed.png')
    pg.wait_for_timeout(6000)
    st = pg.evaluate("({main:localStorage.getItem('lanternfall.save'),broken:localStorage.getItem('lanternfall.save.broken')})")
    rec('raw damaged save kept under a backup key and never overwritten by autosave', st['broken'] == bad_raw and st['main'] == bad_raw)
    tap(pg, '[data-a=exportBroken]')
    rec('the damaged save can be exported as a code', len(pg.locator('#exp').input_value()) > 20)
    tap(pg, '#modal .mclose')
    tap(pg, '.loadfail [data-a=restoreDo]', 0); pg.wait_for_timeout(500)
    st = S(pg, "({started:S.started,n:S.chars.length,main:(()=>{try{return JSON.parse(localStorage.getItem('lanternfall.save')).started}catch(e){return 'bad'}})()})")
    rec('Restore backup brings the game back and writes a good main save', st['started'] and st['n'] == 3 and st['main'] is True and pg.locator('#nav .nb').count() == 5, st)
    # valid JSON that fails validation
    pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('lanternfall.save'));s.chars[1].race='???';__G.noSave=true;localStorage.setItem('lanternfall.save',JSON.stringify(s))})()")
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(600)
    rec('a save that parses but fails migration also shows the recovery screen', pg.locator('.loadfail').count() == 1 and 'hero' in pg.locator('.loadfail').inner_text())
    # missing main save but backups exist
    pg.evaluate("localStorage.removeItem('lanternfall.save')"); pg.reload(wait_until='networkidle'); pg.wait_for_timeout(600)
    rec('missing main save with backups -> offers restore instead of a new game', pg.locator('.loadfail h1', has_text='find').count() == 1)
    tap(pg, '.loadfail [data-a=restoreDo]', 0); pg.wait_for_timeout(400)
    # ---------- hard reset ----------
    tap(pg, '#top [data-a=codexGo][data-k=save]'); tap(pg, '[data-a=resetAsk]')
    pg.locator('#resetTxt').fill('Reset'); tap(pg, '[data-a=resetDo]')
    rec('hard reset ignores anything but RESET', S(pg, "S.started"))
    pg.locator('#resetTxt').fill('RESET'); tap(pg, '[data-a=resetDo]'); pg.wait_for_timeout(300)
    rec('typing RESET resets; a "before reset" backup is kept', not S(pg, "S.started") and pg.evaluate("!!localStorage.getItem('lanternfall.save.prereset')"))
    ctx.close()
    # ---------- standalone (Home Screen app) and desktop: no prompt ----------
    ctx, pg = page(b, True); fresh(pg)
    rec('running from the Home Screen (standalone true) -> no prompt', not pg.locator('#a2hs').is_visible() and pg.evaluate("__debug.envSafariTab()") is False)
    rec('Home Screen app start screen offers "Paste a save code"', pg.locator('.create [data-a=importOpen]').count() == 1)
    ctx.close()
    ctx, pg = page(b, None, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'); fresh(pg)
    rec('desktop browser -> no prompt', not pg.locator('#a2hs').is_visible())
    ctx.close()
    b.close()
print('console/page errors:', errs or 'none')
ok = all(res) and not errs
print(f'{sum(res)}/{len(res)} checks passed' + ('' if ok else ' — FAILURES'))
sys.exit(0 if ok else 1)
