"""Server-side PDF rendering of a report (ReportLab), with a fan chart from the linked run (matplotlib)."""

import io
from datetime import datetime

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet  # noqa: E402
from reportlab.lib.units import mm  # noqa: E402
from reportlab.platypus import (  # noqa: E402
    Image,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.config import ESTIMATE_LABEL, ESTIMATE_SENTENCE  # noqa: E402
from app.models import Report, SimulationResult, SimulationRun  # noqa: E402

PRIMARY = colors.HexColor("#0F766E")
MUTED = colors.HexColor("#475569")
AMBER = colors.HexColor("#B45309")
STATUS_LABEL = {"draft": "Draft", "pending_approval": "Pending approval", "approved": "Approved"}


def fan_chart_png(run: SimulationRun, res: SimulationResult, beds: int | None = None) -> bytes | None:
    series = (res.series or {}).get("active") or {}
    med = series.get("median") or []
    if not med:
        return None
    days = list(range(len(med)))
    fig, ax = plt.subplots(figsize=(7.2, 3.0), dpi=150)
    ax.fill_between(
        days,
        series.get("low") or med,
        series.get("high") or med,
        color="#0F766E",
        alpha=0.18,
        linewidth=0,
        label="5–95% of runs",
    )
    ax.plot(days, med, color="#0F766E", linewidth=1.8, label="Median")
    hosp = (res.series or {}).get("hospitalised") or {}
    if hosp.get("median"):
        ax.plot(
            days, hosp["median"], color="#B45309", linewidth=1.2, linestyle="-", label="In hospital (median)"
        )
    if beds:
        ax.axhline(beds, color="#DC2626", linewidth=1, linestyle="--", label=f"Beds available ({beds})")
    ax.set_xlabel("Day")
    ax.set_ylabel("People sick at once")
    ax.set_title(
        f"Active cases · {run.monte_carlo_runs} runs · {ESTIMATE_LABEL.lower()}", fontsize=9, color="#475569"
    )
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", color="#E2E8F0", linewidth=0.6)
    ax.legend(fontsize=7, frameon=False, loc="upper right")
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    return buf.getvalue()


def _fmt_range(block: dict | None, pct: bool = False) -> str:
    if not block or block.get("median") is None:
        return "—"
    f = (lambda v: f"{v * 100:.0f}%") if pct else (lambda v: f"{round(v):,}")
    return f"{f(block['median'])} (5–95%: {f(block['low'])} to {f(block['high'])})"


def render_report(
    report: Report, run: SimulationRun | None, res: SimulationResult | None, beds: int | None = None
) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=report.title,
        author=report.author_name,
    )
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle(
        "h1", parent=ss["Heading1"], textColor=colors.HexColor("#0F172A"), fontSize=18, spaceAfter=4
    )
    h2 = ParagraphStyle(
        "h2", parent=ss["Heading2"], textColor=PRIMARY, fontSize=12, spaceBefore=10, spaceAfter=4
    )
    body = ParagraphStyle("body", parent=ss["BodyText"], fontSize=9.5, leading=13)
    small = ParagraphStyle("small", parent=body, fontSize=8, textColor=MUTED, leading=10.5)
    banner = ParagraphStyle(
        "banner",
        parent=body,
        textColor=AMBER,
        fontSize=9,
        backColor=colors.HexColor("#FFFBEB"),
        borderPadding=5,
        borderColor=colors.HexColor("#FCD34D"),
        borderWidth=0.5,
    )

    story = [
        Paragraph(
            "EpiSim · "
            + {"policy": "Policy report", "hospital": "Hospital report"}.get(report.audience, "Report"),
            small,
        ),
        Paragraph(report.title, h1),
        Paragraph(
            f"{STATUS_LABEL.get(report.status, report.status)} · {report.disease.title() or '—'}"
            f" · by {report.author_name}"
            + (
                f" · approved by {report.approved_by} on {report.approved_on:%d %b %Y}"
                if report.approved_on
                else ""
            )
            + (f" · {report.period}" if report.period else ""),
            small,
        ),
        Spacer(1, 6),
        Paragraph(f"<b>{ESTIMATE_LABEL}.</b> {ESTIMATE_SENTENCE}", banner),
        Spacer(1, 4),
    ]
    snap = run.inputs_snapshot if run else {}
    disease = snap.get("disease") or {}
    if disease.get("provisional"):
        story.append(
            Paragraph(
                f"<b>Provisional parameters.</b> The {disease.get('name')} preset has not been reviewed "
                "by an epidemiologist for use in EpiSim.",
                banner,
            )
        )
    if report.illustrative:
        story.append(Paragraph("<b>Demo data.</b> This report is an illustrative sample record.", banner))
    if report.status != "approved":
        story.append(
            Paragraph(
                "<b>Not approved.</b> This document is a draft and must not be shared with policy makers.",
                banner,
            )
        )

    if report.summary:
        story += [Paragraph("Summary", h2), Paragraph(report.summary, body)]
    if report.key_points:
        story += [
            Paragraph("Key points", h2),
            ListFlowable([ListItem(Paragraph(p, body)) for p in report.key_points], bulletType="bullet"),
        ]
    if report.figures:
        rows = [["Figure", "Value", "Range"]] + [
            [Paragraph(f.get("label", ""), body), f.get("value", ""), Paragraph(f.get("range", ""), body)]
            for f in report.figures
        ]
        t = Table(rows, colWidths=[85 * mm, 30 * mm, 59 * mm])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                ]
            )
        )
        story += [Paragraph("Figures", h2), t]

    if run and res:
        story.append(Paragraph(f"Simulation {run.id}: {(snap.get('scenario') or {}).get('name', '')}", h2))
        png = fan_chart_png(run, res, beds)
        if png:
            story.append(Image(io.BytesIO(png), width=174 * mm, height=72.5 * mm))
        s = res.summary or {}
        rows = [
            ["Result (median and 5–95% range across runs)", ""],
            ["Chance the outbreak takes off (≥20 cases)", f"{(res.p_take_off or 0) * 100:.0f}% of runs"],
            ["Total cases", _fmt_range(s.get("final_cases"))],
            ["Deaths", _fmt_range(s.get("final_deaths"))],
            ["Peak beds needed", _fmt_range(s.get("peak_beds"))],
            ["Health-worker share of infections", _fmt_range(s.get("hcw_share"), pct=True)],
        ]
        t = Table(rows, colWidths=[90 * mm, 84 * mm])
        t.setStyle(
            TableStyle(
                [
                    ("SPAN", (0, 0), (-1, 0)),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                ]
            )
        )
        story.append(t)
        pop = snap.get("population") or {}
        inter = snap.get("interventions") or {}
        story += [
            Spacer(1, 6),
            Paragraph("Inputs", h2),
            Paragraph(
                f"<b>Disease preset:</b> {disease.get('name')} (v{disease.get('preset_version')})"
                + (" — <font color='#B45309'>Provisional</font>" if disease.get("provisional") else ""),
                body,
            ),
            Paragraph(f"<b>Reference:</b> {disease.get('reference') or '—'}", small),
            Paragraph(
                f"<b>Population:</b> {pop.get('dataset_name')} v{pop.get('dataset_version')} "
                f"({pop.get('total', 0):,} people)" + (" — illustrative" if pop.get("illustrative") else ""),
                body,
            ),
            Paragraph(
                f"<b>Interventions:</b> {inter.get('package_name') or 'None'}"
                + (
                    " — effect sizes are placeholders"
                    if any(i.get("placeholder") for i in inter.get("items", []))
                    else ""
                ),
                body,
            ),
            Paragraph(
                f"<b>Run settings:</b> {run.horizon_days} days, {run.initial_cases} initial cases, "
                f"{run.monte_carlo_runs} Monte Carlo runs, seed {run.seed}, engine {run.engine_version}, "
                f"model {run.model_type}.",
                body,
            ),
        ]
    if report.recommendations:
        story += [
            Paragraph("Recommendations", h2),
            ListFlowable([ListItem(Paragraph(p, body)) for p in report.recommendations], bulletType="bullet"),
        ]
    story += [
        Spacer(1, 10),
        Paragraph(
            "Limitations: the model has not been calibrated against real outbreak data or reviewed by an "
            "epidemiologist. Intervention effect sizes are placeholders. "
            "Ranges reflect chance between runs, not "
            "uncertainty about the parameters. Not a forecast.",
            small,
        ),
        Paragraph(f"Generated {datetime.now():%d %b %Y %H:%M} · report {report.id}", small),
    ]
    doc.build(story)
    return buf.getvalue()
