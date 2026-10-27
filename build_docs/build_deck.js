// Builds docs/IDS_ppt.pptx. Reads ../results/metrics.json and ../figures/*.png when present;
// otherwise results slides show clearly marked blanks.
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");
let applyTheme = async () => {}; // optional: theme-colour patcher (only available in the authoring sandbox)
try { applyTheme = require(process.env.APPLY_THEME || "/root/.claude/skills/synced/dc8d2f42-c991-4bca-a3b2-b4da72d43261_0d081698-5b13-41ca-adb4-c30da63e5a3c/pptx/scripts/apply_theme.js").applyTheme; } catch (e) {}

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "docs", "IDS_ppt.pptx");
const M = fs.existsSync(path.join(ROOT, "results/metrics.json"))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, "results/metrics.json"))) : null;
const fig = (n) => { const p = path.join(ROOT, "figures", n); return fs.existsSync(p) ? p : null; };
const f = (v, d = 2) => (v === undefined || v === null || isNaN(v)) ? "—" : Number(v).toFixed(d);

const THEME = {
  name: "IPL Collapse",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: { dk1: "1A1A1A", lt1: "FFFFFF", dk2: "0B3D2E", lt2: "EEF3F0",
    accent1: "0B3D2E", accent2: "E4572E", accent3: "F2C14E", accent4: "2E7D5B",
    accent5: "6B7280", accent6: "1C7293", hlink: "1C7293", folHlink: "6B7280" },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "A Badri";
pres.title = "IPL Score Forecasting & Batting-Collapse Detection";
const C = pres.SchemeColor;
const W = 13.33;

const FOOT = "A Badri · 160124771305 · AI & DS · Section I1";
pres.defineSlideMaster({
  title: "CONTENT", background: { color: "FFFFFF" },
  objects: [
    { text: { text: FOOT, options: { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: "right" },
  placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontSize: 34, bold: true, color: C.text2, margin: 0, valign: "middle" }, text: "" },
});
pres.defineSlideMaster({ title: "DARK", background: { color: "0B3D2E" } });

const sections = [["Intro"], ["Data & Method"], ["Results"], ["Wrap-up"]];
let secIdx = -1;
const newSection = (t) => pres.addSection({ title: t });

function content(title, notes, sectionTitle) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle });
  s.addText(title, { placeholder: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, margin: 0, fontSize: 34, bold: true, color: C.text2, fontFace: "Cambria", valign: "middle" });
  if (notes) s.addNotes(notes);
  return s;
}
function placeholderBox(s, x, y, w, h, label) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: "EEF3F0" }, line: { color: "6B7280", dashType: "dash", width: 1 }, objectName: "Pending figure" });
  s.addText(label, { x, y, w, h, align: "center", valign: "middle", fontSize: 14, color: C.accent5, italic: true, isTextBox: true, margin: 12 });
}
function figOrBox(s, name, x, y, w, h, label) {
  const p = fig(name);
  if (p) s.addImage({ path: p, x, y, w, h, sizing: { type: "contain", w, h }, altText: label });
  else placeholderBox(s, x, y, w, h, label + "\n(appears after knitting IDS_CS.Rmd on your data)");
}
function card(s, x, y, w, h, head, body, color) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.background2 }, objectName: head + " card" });
  s.addText(head, { x: x + 0.25, y: y + 0.2, w: w - 0.5, h: 0.5, fontSize: 20, bold: true, color: color || C.text2, margin: 0, isTextBox: true, fontFace: "Cambria" });
  s.addText(body, { x: x + 0.25, y: y + 0.8, w: w - 0.5, h: h - 1.0, fontSize: 15, color: C.text1, margin: 0, valign: "top", isTextBox: true, paraSpaceAfter: 6 });
}
function ball(s, x, y, d, kind) { // cricket "ball" motif
  const fill = kind === "W" ? C.accent2 : (kind === "4" ? C.accent3 : C.background2);
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: kind ? fill : "9CA3AF", width: 1 }, objectName: "ball " + kind });
  s.addText(kind, { x, y, w: d, h: d, align: "center", valign: "middle", fontSize: 14, bold: true, color: kind === "W" ? C.background1 : C.text1, margin: 0, isTextBox: true });
}

// ---------- 1. Title ----------
newSection("Intro");
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Intro" });
  s.addText("IDS CASE STUDY", { x: 0.8, y: 0.7, w: 8, h: 0.4, fontSize: 16, bold: true, color: C.accent3, charSpacing: 4, margin: 0, isTextBox: true });
  s.addText("IPL Score Forecasting & Batting-Collapse Detection", { x: 0.8, y: 1.3, w: 11.2, h: 1.9, fontSize: 46, bold: true, fontFace: "Cambria", color: C.background1, margin: 0, valign: "top", isTextBox: true });
  s.addText("Machine learning in R on 1,169 official ball-by-ball matches", { x: 0.8, y: 3.3, w: 11, h: 0.5, fontSize: 20, color: "CADCD2", margin: 0, isTextBox: true });
  // motif: a 12-ball window, 3 wickets
  const kinds = ["1", "0", "4", "W", "1", "0", "W", "2", "1", "W", "0", "1"];
  kinds.forEach((k, i) => ball(s, 0.8 + i * 0.62, 4.25, 0.5, k === "0" || k === "1" || k === "2" ? k : k));
  s.addText("12 legal balls · 3 wickets = a collapse", { x: 0.8, y: 4.9, w: 8, h: 0.35, fontSize: 14, italic: true, color: "CADCD2", margin: 0, isTextBox: true });
  s.addText([
    { text: "A Badri", options: { bold: true, fontSize: 22, breakLine: true } },
    { text: "Roll No: 160124771305   ·   Branch: AI & DS   ·   Section: I1", options: { fontSize: 16 } },
  ], { x: 0.8, y: 5.9, w: 11, h: 0.9, color: C.background1, margin: 0, isTextBox: true });
  s.addNotes("Introduce yourself and the project: predicting the final score and the risk of a batting collapse from the last 12 balls.");
}

// ---------- 2. Problem ----------
{
  const s = content("Why a run-rate is not enough", "Two innings at 80/2 after 10 overs can finish 150 or 190. We want a model that sees momentum and wickets.", "Intro");
  s.addText([
    { text: "Run rate × 20 ignores how the runs came.", options: { bullet: true, breakLine: true } },
    { text: "Two sides on 80/2 after 10 overs can finish far apart.", options: { bullet: true, breakLine: true } },
    { text: "A burst of wickets (a collapse) changes the whole innings.", options: { bullet: true, breakLine: true } },
    { text: "Captains, analysts and broadcasters want an early warning.", options: { bullet: true } },
  ], { x: 0.6, y: 1.6, w: 6.4, h: 4.2, fontSize: 20, color: C.text1, paraSpaceAfter: 12, valign: "top", margin: 0, isTextBox: true });
  const stats = [["1,169", "IPL matches"], ["12", "balls of context"], ["4", "forecast checkpoints"]];
  stats.forEach(([n, l], i) => {
    const y = 1.5 + i * 1.7;
    s.addShape(pres.shapes.OVAL, { x: 8.0, y, w: 1.5, h: 1.5, fill: { color: C.accent1 }, objectName: "stat " + l });
    s.addText(n, { x: 8.0, y, w: 1.5, h: 1.5, align: "center", valign: "middle", fontSize: 26, bold: true, color: C.background1, margin: 0, isTextBox: true });
    s.addText(l, { x: 9.8, y, w: 3, h: 1.5, valign: "middle", fontSize: 20, color: C.text1, margin: 0, isTextBox: true });
  });
}

// ---------- 3. Objectives ----------
{
  const s = content("Two questions, answered ball by ball", "Regression for the expected score, classification for collapse risk.", "Intro");
  card(s, 0.6, 1.6, 5.9, 4.6, "1 · Forecast the score",
    [{ text: "Expected final innings total", options: { bullet: true, breakLine: true } },
     { text: "At 6, 10, 15 and 18 overs", options: { bullet: true, breakLine: true } },
     { text: "Regression models vs. run-rate × 20", options: { bullet: true } }]);
  card(s, 6.83, 1.6, 5.9, 4.6, "2 · Detect a collapse",
    [{ text: "Will the side lose 3+ wickets in the next 12 balls?", options: { bullet: true, breakLine: true } },
     { text: "Inputs: runs and wickets of the last 12 balls + match state", options: { bullet: true, breakLine: true } },
     { text: "Classification models with AUC, precision, recall", options: { bullet: true } }], C.accent2);
}

// ---------- 4. Dataset ----------
newSection("Data & Method");
{
  const s = content("Data: official ball-by-ball JSON from Cricsheet", "One JSON per match. We flatten it to one row per legal ball.", "Data & Method");
  const boxes = [["info", "teams · venue\nseason · overs"], ["innings", "batting team\n1st / 2nd"], ["overs", "over number\ndeliveries[]"], ["deliveries", "runs · extras\nwickets[]"]];
  boxes.forEach(([h, b], i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.8, w: 2.6, h: 2.1, fill: { color: i === 3 ? C.accent2 : C.accent1 }, objectName: h });
    s.addText(h, { x, y: 1.95, w: 2.6, h: 0.5, align: "center", fontSize: 22, bold: true, fontFace: "Cambria", color: C.background1, margin: 0, isTextBox: true });
    s.addText(b, { x, y: 2.55, w: 2.6, h: 1.1, align: "center", valign: "top", fontSize: 15, color: C.background1, margin: 0, isTextBox: true });
    if (i < 3) s.addText("›", { x: x + 2.6, y: 2.4, w: 0.5, h: 0.8, align: "center", valign: "middle", fontSize: 36, bold: true, color: C.accent5, margin: 0, isTextBox: true });
  });
  s.addText([
    { text: "1,169 matches, licensed ball-by-ball records", options: { bullet: true, breakLine: true } },
    { text: "Kept: innings 1–2 of full 20-over games; super overs and shortened games removed", options: { bullet: true, breakLine: true } },
    { text: "Wides / no-balls are folded into the legal ball so the ball counter is exact", options: { bullet: true } },
  ], { x: 0.6, y: 4.4, w: 12, h: 2.2, fontSize: 18, color: C.text1, paraSpaceAfter: 8, valign: "top", margin: 0, isTextBox: true });
}

// ---------- 5. Pipeline ----------
{
  const s = content("End-to-end pipeline in R", "Each step is a function in R/functions.R and a chunk in IDS_CS.Rmd.", "Data & Method");
  const steps = [["Parse", "JSON → one row per legal ball"], ["Engineer", "last-12-ball runs & wickets"], ["Split", "80/20 by match"], ["Model", "regression + classification"], ["Evaluate", "MAE · RMSE · AUC · F1"]];
  steps.forEach(([h, b], i) => {
    const x = 0.6 + i * 2.45;
    s.addShape(pres.shapes.OVAL, { x: x + 0.55, y: 2.0, w: 1.1, h: 1.1, fill: { color: i % 2 ? C.accent4 : C.accent1 }, objectName: "step " + (i + 1) });
    s.addText(String(i + 1), { x: x + 0.55, y: 2.0, w: 1.1, h: 1.1, align: "center", valign: "middle", fontSize: 32, bold: true, color: C.background1, margin: 0, isTextBox: true });
    s.addText(h, { x, y: 3.35, w: 2.2, h: 0.5, align: "center", fontSize: 22, bold: true, fontFace: "Cambria", color: C.text2, margin: 0, isTextBox: true });
    s.addText(b, { x, y: 3.9, w: 2.2, h: 1.0, align: "center", valign: "top", fontSize: 15, color: C.text1, margin: 0, isTextBox: true });
  });
  s.addText("Deliverables: Rmd report · saved .rds models · Shiny simulator · metrics.json", { x: 0.6, y: 5.8, w: 12, h: 0.5, fontSize: 16, italic: true, color: C.accent5, margin: 0, isTextBox: true });
}

// ---------- 6. Features ----------
{
  const s = content("Features engineered for every checkpoint", "The last-12-ball features are what a plain run rate cannot see.", "Data & Method");
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: "0B3D2E" }, fontSize: 16 } });
  const rows = [
    [hdr("Feature"), hdr("Meaning"), hdr("Captures")],
    ["cum_score, cum_wickets", "Score and wickets at the checkpoint", "Current state"],
    ["current_run_rate", "Score ÷ overs bowled", "Average pace"],
    ["runs_last12", "Runs in the last 12 legal balls", "Momentum"],
    ["wkts_last12", "Wickets in the last 12 legal balls", "Pressure / collapse signal"],
    ["checkpoint_overs", "6, 10, 15 or 18", "Balls remaining"],
  ].map((r, i) => i === 0 ? r : r.map((t) => ({ text: t, options: { fontSize: 16, color: "1A1A1A", fill: { color: i % 2 ? "FFFFFF" : "EEF3F0" } } })));
  s.addTable(rows, { x: 0.6, y: 1.6, w: 12.1, colW: [3.6, 5.0, 3.5], rowH: 0.62, border: { type: "solid", color: "D1D5DB", pt: 0.75 }, valign: "middle" });
  s.addText("Both models see the same inputs: recent runs and recent wickets plus the match state.", { x: 0.6, y: 5.7, w: 12, h: 0.5, fontSize: 16, italic: true, color: C.accent5, margin: 0, isTextBox: true });
}

// ---------- 7. Collapse definition ----------
{
  const s = content("What counts as a collapse?", "Label is computed from the NEXT 12 balls; features come from the LAST 12 balls only, so there is no leakage.", "Data & Method");
  const past = ["1", "0", "4", "1", "0", "W", "1", "2", "0", "1", "W", "0"];
  const future = ["1", "W", "0", "W", "1", "0", "W", "1", "0", "0", "2", "1"];
  s.addText("LAST 12 BALLS  →  model input", { x: 0.6, y: 1.55, w: 8, h: 0.35, fontSize: 14, bold: true, color: C.accent5, margin: 0, isTextBox: true });
  past.forEach((k, i) => ball(s, 0.6 + i * 1.02, 1.95, 0.8, k));
  s.addText("NEXT 12 BALLS  →  label", { x: 0.6, y: 3.2, w: 8, h: 0.35, fontSize: 14, bold: true, color: C.accent5, margin: 0, isTextBox: true });
  future.forEach((k, i) => ball(s, 0.6 + i * 1.02, 3.6, 0.8, k));
  s.addText([
    { text: "Collapse = 1 ", options: { bold: true, color: C.accent2 } },
    { text: "if the side loses 3 or more wickets in the next 12 legal balls, else 0. (Illustration above is an example, not real data.)", options: {} },
  ], { x: 0.6, y: 5.1, w: 12, h: 1.2, fontSize: 18, color: C.text1, margin: 0, valign: "top", isTextBox: true });
}

// ---------- 8. Models ----------
{
  const s = content("Models compared", "Simple baselines first, then ridge, forests and boosting.", "Data & Method");
  card(s, 0.6, 1.6, 5.9, 4.7, "Score forecasting",
    [{ text: "Mean baseline", options: { bullet: true, breakLine: true } },
     { text: "Run-rate × 20 projection", options: { bullet: true, breakLine: true } },
     { text: "Linear and Ridge regression", options: { bullet: true, breakLine: true } },
     { text: "Random Forest", options: { bullet: true, breakLine: true } },
     { text: "Gradient Boosting (CV-tuned trees)", options: { bullet: true } }]);
  card(s, 6.83, 1.6, 5.9, 4.7, "Collapse detection",
    [{ text: "Logistic regression", options: { bullet: true, breakLine: true } },
     { text: "Random Forest classifier", options: { bullet: true, breakLine: true } },
     { text: "Decision threshold tuned for F1 on training data only", options: { bullet: true, breakLine: true } },
     { text: "Collapses are rare, so accuracy alone misleads", options: { bullet: true } }], C.accent2);
}

// ---------- 9. Evaluation ----------
{
  const s = content("Honest evaluation setup", "Splitting by match prevents the same innings leaking into train and test.", "Data & Method");
  const items = [["80 / 20", "split by match", "No innings appears in both train and test"], ["MAE · RMSE · R²", "forecast quality", "Reported per model and per checkpoint"], ["AUC · P · R · F1", "collapse quality", "Threshold chosen on training data only"]];
  items.forEach(([h, sub, b], i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.7, w: 3.9, h: 4.2, fill: { color: C.background2 }, objectName: h });
    s.addText(h, { x: x + 0.25, y: 2.0, w: 3.4, h: 0.9, fontSize: 30, bold: true, fontFace: "Cambria", color: C.accent1, margin: 0, isTextBox: true });
    s.addText(sub, { x: x + 0.25, y: 2.95, w: 3.4, h: 0.5, fontSize: 18, bold: true, color: C.accent2, margin: 0, isTextBox: true });
    s.addText(b, { x: x + 0.25, y: 3.6, w: 3.4, h: 1.8, fontSize: 16, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  });
}

// ---------- 10. Forecast results ----------
newSection("Results");
{
  const s = content("Results: score forecasting", "Read the best model from the table; compare it with run-rate x 20.", "Results");
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: "0B3D2E" }, fontSize: 15, align: "center" } });
  const order = ["Baseline", "Run-rate x 20", "Linear", "Ridge", "RandomForest", "GradientBoost"];
  const byName = {};
  if (M && M.forecast) M.forecast.forEach((r) => (byName[r.Model] = r));
  const best = M && M.best_model;
  const rows = [[hdr("Model"), hdr("MAE"), hdr("RMSE"), hdr("R²")]].concat(order.map((m, i) => {
    const r = byName[m] || {};
    const hi = best === m;
    const o = (t, a) => ({ text: t, options: { fontSize: 15, align: a || "center", bold: hi, color: "1A1A1A", fill: { color: hi ? "F2C14E" : (i % 2 ? "EEF3F0" : "FFFFFF") } } });
    return [o(m, "left"), o(f(r.MAE)), o(f(r.RMSE)), o(f(r.R2, 3))];
  }));
  s.addTable(rows, { x: 0.6, y: 1.55, w: 6.2, colW: [2.3, 1.3, 1.3, 1.3], rowH: 0.55, border: { type: "solid", color: "D1D5DB", pt: 0.75 }, valign: "middle" });
  s.addText(M ? "Hold-out matches · best model highlighted" : "— = fill by knitting IDS_CS.Rmd on your 1,169 matches", { x: 0.6, y: 5.6, w: 6.2, h: 0.6, fontSize: 14, italic: true, color: C.accent5, margin: 0, isTextBox: true });
  figOrBox(s, "fig3_mae_by_checkpoint.png", 7.1, 1.55, 5.6, 4.6, "MAE by checkpoint");
}

// ---------- 11. Collapse results ----------
{
  const s = content("Results: collapse detection", "Collapses are rare so we look at AUC, precision, recall and F1.", "Results");
  const L = (M && M.collapse && M.collapse.logistic) || {};
  const R = (M && M.collapse && M.collapse.random_forest) || {};
  const tiles = [["AUC", f(Math.max(L.auc || 0, R.auc || 0) || undefined, 3)], ["Precision", f(L.precision, 3)], ["Recall", f(L.recall, 3)], ["F1", f(L.f1, 3)]];
  tiles.forEach(([l, v], i) => {
    const x = 0.6 + (i % 2) * 3.1, y = 1.6 + Math.floor(i / 2) * 2.3;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.9, h: 2.1, fill: { color: C.background2 }, objectName: l });
    s.addText(v, { x, y: y + 0.25, w: 2.9, h: 1.0, align: "center", fontSize: 40, bold: true, fontFace: "Cambria", color: C.accent1, margin: 0, isTextBox: true });
    s.addText(l, { x, y: y + 1.3, w: 2.9, h: 0.5, align: "center", fontSize: 18, color: C.text1, margin: 0, isTextBox: true });
  });
  s.addText(M ? "AUC = best of the two models · P/R/F1 = logistic regression at its tuned threshold" : "— = fill by knitting IDS_CS.Rmd", { x: 0.6, y: 6.25, w: 6.2, h: 0.5, fontSize: 13, italic: true, color: C.accent5, margin: 0, isTextBox: true });
  figOrBox(s, "fig5_roc.png", 7.1, 1.6, 5.6, 4.6, "ROC curves");
}

// ---------- 12. Drivers ----------
{
  const s = content("What drives the predictions", "Feature importance explains the forecast; the heat-map shows when collapses are most common.", "Results");
  figOrBox(s, "fig4_feature_importance.png", 0.6, 1.55, 5.9, 4.8, "Feature importance");
  figOrBox(s, "fig6_collapse_heatmap.png", 6.83, 1.55, 5.9, 4.8, "Collapse rate by overs and wickets");
}

// ---------- 13. Simulator ----------
{
  const s = content("Live what-if simulator (Shiny)", "Run shiny::runApp('R/app.R'). Type the match situation and read both outputs.", "Results");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.6, w: 5.9, h: 4.7, fill: { color: C.background2 }, objectName: "inputs panel" });
  s.addText("Inputs", { x: 0.9, y: 1.8, w: 5, h: 0.5, fontSize: 20, bold: true, fontFace: "Cambria", color: C.text2, margin: 0, isTextBox: true });
  s.addText([
    { text: "Overs completed", options: { bullet: true, breakLine: true } },
    { text: "Current score and wickets lost", options: { bullet: true, breakLine: true } },
    { text: "Runs in the last 12 balls", options: { bullet: true, breakLine: true } },
    { text: "Wickets in the last 12 balls", options: { bullet: true } },
  ], { x: 0.9, y: 2.5, w: 5.3, h: 3.5, fontSize: 18, color: C.text1, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.83, y: 1.6, w: 5.9, h: 4.7, fill: { color: C.accent1 }, objectName: "outputs panel" });
  s.addText("Outputs", { x: 7.13, y: 1.8, w: 5, h: 0.5, fontSize: 20, bold: true, fontFace: "Cambria", color: C.background1, margin: 0, isTextBox: true });
  s.addText([
    { text: "Expected final score", options: { bold: true, fontSize: 22, color: "F2C14E", breakLine: true } },
    { text: "from the Random Forest forecaster", options: { fontSize: 15, breakLine: true } },
    { text: " ", options: { fontSize: 12, breakLine: true } },
    { text: "Collapse risk, next 12 balls", options: { bold: true, fontSize: 22, color: "F2C14E", breakLine: true } },
    { text: "from the logistic collapse model", options: { fontSize: 15 } },
  ], { x: 7.13, y: 2.5, w: 5.3, h: 3.5, color: C.background1, valign: "top", margin: 0, isTextBox: true });
}

// ---------- 14. Limitations ----------
newSection("Wrap-up");
{
  const s = content("Limitations and future work", "Be upfront about what the model cannot see.", "Wrap-up");
  card(s, 0.6, 1.6, 5.9, 4.7, "Limitations",
    [{ text: "No pitch, weather or batter-quality features", options: { bullet: true, breakLine: true } },
     { text: "Only 1st-innings totals are forecast (chases end early)", options: { bullet: true, breakLine: true } },
     { text: "Random match split, not season-wise", options: { bullet: true, breakLine: true } },
     { text: "Collapse threshold (3 in 12) is a modelling choice", options: { bullet: true } }], C.accent2);
  card(s, 6.83, 1.6, 5.9, 4.7, "Future work",
    [{ text: "Add batter / bowler form and venue effects", options: { bullet: true, breakLine: true } },
     { text: "Calibrated gradient-boosted classifier", options: { bullet: true, breakLine: true } },
     { text: "Season-wise validation", options: { bullet: true, breakLine: true } },
     { text: "Deploy the simulator as a hosted dashboard", options: { bullet: true } }]);
}

// ---------- 15. Conclusion ----------
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Wrap-up" });
  s.addText("Conclusion", { x: 0.8, y: 0.6, w: 11, h: 0.9, fontSize: 40, bold: true, fontFace: "Cambria", color: C.background1, margin: 0, isTextBox: true });
  const pts = [["Beyond run rate", "Recent runs and recent wickets give the model context a run-rate × 20 projection cannot use."], ["Two outputs, one pipeline", "Expected score and collapse risk come from the same ball-by-ball features."], ["Reproducible", "Rmd, scripts, saved models and a Shiny app are all in the GitHub project."]];
  pts.forEach(([h, b], i) => {
    const y = 1.9 + i * 1.5;
    s.addShape(pres.shapes.OVAL, { x: 0.8, y, w: 0.9, h: 0.9, fill: { color: C.accent2 }, objectName: "point " + (i + 1) });
    s.addText(String(i + 1), { x: 0.8, y, w: 0.9, h: 0.9, align: "center", valign: "middle", fontSize: 26, bold: true, color: C.background1, margin: 0, isTextBox: true });
    s.addText([{ text: h, options: { bold: true, fontSize: 22, color: "F2C14E", breakLine: true } }, { text: b, options: { fontSize: 17, color: C.background1 } }], { x: 2.0, y: y - 0.1, w: 10.5, h: 1.2, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes("State the model outputs with the numbers from your results slides.");
}

// ---------- 16. Links ----------
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Wrap-up" });
  s.addText("Resources & thank you", { x: 0.8, y: 0.6, w: 11, h: 0.9, fontSize: 40, bold: true, fontFace: "Cambria", color: C.background1, margin: 0, isTextBox: true });
  s.addText([
    { text: "Data: ", options: { bold: true, color: "F2C14E" } }, { text: "cricsheet.org/downloads", options: { breakLine: true, hyperlink: { url: "https://cricsheet.org/downloads/" } } },
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "Code: ", options: { bold: true, color: "F2C14E" } }, { text: "github.com/<your-username>/ipl-collapse-forecast", options: { breakLine: true } },
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "Report & Rmd: ", options: { bold: true, color: "F2C14E" } }, { text: "IDS_CASE_STUDY_REPORT.pdf · IDS_CS.Rmd" },
  ], { x: 0.8, y: 1.9, w: 11.5, h: 2.6, fontSize: 20, color: C.background1, margin: 0, valign: "top", isTextBox: true });
  s.addText([{ text: "A Badri", options: { bold: true, fontSize: 24, breakLine: true } }, { text: "160124771305 · AI & DS · Section I1", options: { fontSize: 16 } }],
    { x: 0.8, y: 5.4, w: 8, h: 1.1, color: C.background1, margin: 0, isTextBox: true });
  s.addText("Questions?", { x: 8.5, y: 5.4, w: 4, h: 1.1, fontSize: 36, bold: true, fontFace: "Cambria", color: "F2C14E", align: "right", margin: 0, isTextBox: true });
}

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("Wrote", OUT, M ? "(with metrics.json)" : "(placeholders for results)");
})();
