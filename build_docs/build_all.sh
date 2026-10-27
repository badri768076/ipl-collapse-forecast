#!/usr/bin/env bash
# Rebuild the slide deck, PDF report and URLs/conclusion docx from results/metrics.json + figures/
# Needs: node + pptxgenjs (npm i pptxgenjs), python3 + reportlab python-docx pillow
set -e
cd "$(dirname "$0")/.."
node build_docs/build_deck.js
python3 build_docs/build_report.py
