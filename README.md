# IPL Score Forecasting & Batting-Collapse Detection (R)

**Introduction to Data Science — Case Study**
**Author:** A Badri · **Roll No:** 160124771305 · **Branch:** AI & DS · **Section:** I1

Machine-learning pipeline in R built on **1,169 IPL matches** of official ball-by-ball data
([Cricsheet](https://cricsheet.org/downloads/), JSON). Using the **runs and wickets of the last 12 balls**
plus the match state, it answers two questions at any point of an innings:

1. **What is the expected final score?** (regression at 6, 10, 15 and 18 overs)
2. **Will the batting side collapse?** (classification: ≥ 3 wickets in the next 12 legal balls)

## Repository layout

```
ipl-collapse-forecast/
├── IDS_CS.Rmd              # main case study (knit to PDF / HTML)
├── R/
│   ├── functions.R         # JSON parser, feature engineering, metrics
│   ├── run_all.R           # one-click knit
│   └── app.R               # Shiny live simulator
├── data/                   # put Cricsheet JSON files here (not committed)
├── figures/                # PNG charts written by the Rmd
├── models/                 # saved .rds models
├── results/metrics.json    # metrics written by the Rmd (feeds the PPT / report)
├── docs/                   # slide deck, PDF report, URLs & conclusion
└── build_docs/             # scripts that rebuild PPT / PDF / DOCX from metrics.json
```

## How to run

1. Download `ipl_json.zip` from <https://cricsheet.org/downloads/ipl_json.zip> and unzip into `data/`.
2. Install R ≥ 4.1 and run:
   ```r
   Rscript R/run_all.R data
   ```
   This installs missing packages, parses all matches, trains every model, and writes
   `figures/`, `models/` and `results/metrics.json`.
3. Live simulator: `shiny::runApp("R/app.R")`.
4. Refresh the deck/report with your real numbers: `bash build_docs/build_all.sh`.

## Method in one minute

| Step | What happens |
|---|---|
| Parse | JSON → one row per **legal ball** (wides/no-balls folded in, super overs & shortened games removed) |
| Features | score, wickets, run rate, **runs in last 12 balls**, **wickets in last 12 balls** |
| Forecast | Baseline, run-rate × 20, Linear, Ridge, Random Forest, Gradient Boosting at 4 checkpoints |
| Collapse label | ≥ 3 wickets in the next 12 legal balls |
| Collapse models | Logistic regression, Random Forest — AUC / precision / recall / F1 |
| Validation | 80/20 split **by match** (no leakage between checkpoints of one innings) |

## Notes & limitations

* First-innings totals only for forecasting (second innings end early when the target is reached).
* No pitch, weather or player-quality features.
* Random match split; a season-wise split is a natural extension.

## License
MIT (code). Data © Cricsheet, used under its terms.
