# One-click run: knits the case study (PDF + HTML), which also writes
# figures/*.png, models/*.rds and results/metrics.json.
# Usage (from the project root):  Rscript R/run_all.R [path/to/json/folder]
args <- commandArgs(trailingOnly = TRUE)
data_dir <- if (length(args) >= 1) args[1] else "data"
if (!requireNamespace("rmarkdown", quietly = TRUE)) install.packages("rmarkdown", repos = "https://cloud.r-project.org")
rmarkdown::render("IDS_CS.Rmd", output_format = "html_document", params = list(data_dir = data_dir))
# PDF needs LaTeX (tinytex::install_tinytex()); skipped quietly if unavailable
try(rmarkdown::render("IDS_CS.Rmd", output_format = "pdf_document", params = list(data_dir = data_dir)))
