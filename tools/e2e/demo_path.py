"""Walk the P0 demo path in a real (headless) browser against a running `make dev`.

Records page errors, console errors and failed API calls at every step, saves a screenshot per
step and times the whole path. Exit code 1 if anything went wrong.

    pip install playwright && playwright install chromium     # once, in any virtualenv
    make dev                                                  # in another terminal
    python tools/e2e/demo_path.py                             # BASE=http://localhost:5173 by default

Set CHROMIUM=/path/to/chrome to use an already-installed browser build.
"""

import os
import re
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:5173")
OUT = Path(os.environ.get("SHOTS", Path(__file__).parent / "shots"))
OUT.mkdir(parents=True, exist_ok=True)
USERS = {
    "analyst": ("epidemiologist@rbc.gov.rw", "epi123"),
    "reviewer": ("s.icyeza@rbc.gov.rw", "epi123"),
    "policymaker": ("policymaker@moh.gov.rw", "policy123"),
}
t0 = time.time()
problems: list[tuple[str, list[str]]] = []


class Session:
    def __init__(self, browser, role):
        self.ctx = browser.new_context(viewport={"width": 1440, "height": 900}, accept_downloads=True)
        self.page = self.ctx.new_page()
        self.issues: list[str] = []
        pg = self.page
        pg.on("pageerror", lambda e: self.issues.append(f"page error: {e}"))
        pg.on("console", lambda m: m.type == "error" and self.issues.append(f"console: {m.text[:300]}"))
        pg.on("response", lambda r: r.status >= 400 and "/api/" in r.url
              and self.issues.append(f"HTTP {r.status} {r.request.method} {r.url.replace(BASE, '')}"))
        email, password = USERS[role]
        pg.goto(f"{BASE}/login")
        pg.fill('input[type="email"]', email)
        pg.fill('input[placeholder="Enter your password"]', password)
        pg.keyboard.press("Enter")
        pg.wait_for_url("**/mfa", timeout=10000)
        pg.get_by_role("button", name="Continue").click()
        pg.wait_for_timeout(1000)

    def go(self, route):
        self.page.goto(f"{BASE}{route}")
        self.settle()

    def settle(self, ms=600):
        try:
            self.page.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass
        self.page.wait_for_timeout(ms)

    def step(self, name):
        self.settle()
        self.page.screenshot(path=str(OUT / f"{len(list(OUT.glob('*.png'))):02d}_{name}.png"))
        if self.issues:
            problems.append((name, list(self.issues)))
        self.issues.clear()
        print(f"{time.time() - t0:6.1f}s  {name:24s} {self.page.url.replace(BASE, '')}")


def main() -> int:
    title = f"Demo path brief {int(time.time()) % 100000}"
    with sync_playwright() as p:
        exe = os.environ.get("CHROMIUM")
        browser = p.chromium.launch(**({"executable_path": exe} if exe else {}))

        a = Session(browser, "analyst")
        pg = a.page
        for route, name in [("/population", "population"), ("/presets", "presets"),
                            ("/intervention-library", "interventions"), ("/scenarios", "scenarios")]:
            a.go(route)
            a.step(name)

        # Geographic run of the seeded Rubavu scenario with late detection (10 initial cases).
        a.go("/simulation")
        pg.get_by_text("Choose a scenario to run").click()
        pg.get_by_label("Search scenarios").fill("Rubavu seed")
        pg.get_by_role("option").filter(has_text="Rubavu seed").first.click()
        pg.locator('input[type="number"]').nth(1).fill("10")
        pg.get_by_text("Geographic (30 districts)").click()
        district = pg.locator("select:visible").filter(has=pg.locator("option", has_text="Rubavu"))
        district.wait_for(timeout=10000)
        district.select_option(label=next(o for o in district.locator("option").all_inner_texts() if "Rubavu" in o))
        a.step("run_form")
        pg.get_by_role("button", name=re.compile("Run simulation")).last.click()
        pg.get_by_role("button", name=re.compile("View full results")).wait_for(timeout=60000)
        a.step("run_completed")
        pg.get_by_role("button", name=re.compile("View full results")).click()
        a.settle()
        run_id = pg.url.rstrip("/").split("/")[-1].split("?")[0]
        capacity = pg.locator("select:visible").first
        capacity.select_option(index=1)
        a.step("results_capacity")

        a.go(f"/scenario?runs=RUN-0100,{run_id}")
        pg.locator("select:visible").filter(has=pg.locator("option", has_text="beds")).first.select_option(index=1)
        a.step("comparison")

        a.go(f"/geographic?run={run_id}&capacity=cap-moh-districts-q3")
        pg.get_by_text("Beds vs capacity", exact=True).click()
        a.step("geographic")

        a.go(f"/reports?run={run_id}")
        pg.locator("input:visible").first.fill(title)
        pg.locator("textarea:visible").first.fill("Scenario estimates for a late-detected outbreak seeded in Rubavu.")
        pg.get_by_role("button", name="Save draft").click()
        pg.get_by_text(title).first.wait_for(timeout=10000)
        card = pg.locator("li, article, div.border").filter(has_text=title).filter(
            has=pg.get_by_role("button", name=re.compile("Submit for approval"))).last
        card.get_by_role("button", name=re.compile("Submit for approval")).click()
        a.step("report_submitted")

        r = Session(browser, "reviewer")
        r.go("/reports")
        card = r.page.locator("li, article, div.border").filter(has_text=title).filter(
            has=r.page.get_by_role("button", name="Approve")).last
        card.get_by_role("button", name="Approve").click()
        r.step("report_approved")

        m = Session(browser, "policymaker")
        m.go("/reports")
        m.page.get_by_text(title).first.click()
        m.settle()
        with m.page.expect_download(timeout=30000) as download:
            m.page.get_by_role("button", name=re.compile("Download|PDF")).last.click()
        pdf_ok = Path(download.value.path()).read_bytes()[:5] == b"%PDF-"
        m.step("policy_report_pdf")
        browser.close()

    elapsed = time.time() - t0
    print(f"\nP0 path in {elapsed:.0f}s; PDF downloaded: {pdf_ok}; screenshots in {OUT}")
    for name, issues in problems:
        print(f"  {name}: {issues}")
    return 0 if pdf_ok and not problems else 1


if __name__ == "__main__":
    sys.exit(main())
