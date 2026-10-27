# =============================================================================
# functions.R  --  helpers for IPL score forecasting & batting-collapse model
# Author : A Badri | Roll No: 160124771305 | AI & DS, Section I1
# =============================================================================
suppressPackageStartupMessages({
  library(jsonlite)
  library(dplyr)
})

CHECKPOINT_BALLS <- c(36, 60, 90, 108)   # 6, 10, 15, 18 overs
COLLAPSE_WINDOW  <- 12                   # legal balls
COLLAPSE_WICKETS <- 3                    # wickets that define a collapse

# -----------------------------------------------------------------------------
# parse_match(): one Cricsheet JSON file -> one row per LEGAL BALL per innings
#   * keeps innings 1 and 2 only (super overs ignored)
#   * keeps only full 20-over matches
#   * extras (wides / no-balls) are folded into the legal ball they follow
#   * "retired hurt" is not counted as a wicket
# -----------------------------------------------------------------------------
parse_match <- function(path) {
  m <- tryCatch(jsonlite::fromJSON(path, simplifyVector = FALSE),
                error = function(e) NULL)
  if (is.null(m) || is.null(m$innings) || is.null(m$info)) return(NULL)
  info <- m$info
  if (!is.null(info$overs) && as.numeric(info$overs) != 20) return(NULL)

  match_id <- tools::file_path_sans_ext(basename(path))
  season   <- if (!is.null(info$season)) as.character(info$season) else NA_character_
  venue    <- if (!is.null(info$venue))  as.character(info$venue)  else NA_character_

  out <- list()
  for (i in seq_len(min(2, length(m$innings)))) {
    inn <- m$innings[[i]]
    if (isTRUE(inn$super_over)) next
    dels <- unlist(lapply(inn$overs, function(ov) ov$deliveries), recursive = FALSE)
    if (length(dels) == 0) next

    runs  <- vapply(dels, function(d) as.numeric(d$runs$total), numeric(1))
    legal <- vapply(dels, function(d)
      as.numeric(is.null(d$extras$wides) && is.null(d$extras$noballs)), numeric(1))
    wk    <- vapply(dels, function(d) {
      if (is.null(d$wickets)) return(0)
      as.numeric(sum(vapply(d$wickets, function(w)
        !(w$kind %in% c("retired hurt", "retired not out")), logical(1))))
    }, numeric(1))

    # bucket every delivery into the legal ball it belongs to
    k <- pmax(cumsum(legal), 1)
    n <- max(k)
    lv <- factor(k, levels = seq_len(n))
    runs_b <- as.numeric(tapply(runs, lv, sum))
    wk_b   <- as.numeric(tapply(wk,   lv, sum))

    cum_runs <- cumsum(runs_b)
    cum_wk   <- cumsum(wk_b)
    lag12 <- function(x) dplyr::lag(x, COLLAPSE_WINDOW, default = 0)

    # all-out innings: future window is padded with "no more wickets";
    # innings that ended because the target was chased are left NA (unknown)
    final_wk <- tail(cum_wk, 1)
    pad <- if (final_wk >= 10) final_wk else NA_real_

    out[[length(out) + 1]] <- data.frame(
      match_id      = match_id,
      season        = season,
      venue         = venue,
      innings_num   = i,
      batting_team  = as.character(inn$team),
      ball          = seq_len(n),
      cum_score     = cum_runs,
      cum_wickets   = cum_wk,
      runs_last12   = cum_runs - lag12(cum_runs),
      wkts_last12   = cum_wk   - lag12(cum_wk),
      wkts_next12   = dplyr::lead(cum_wk, COLLAPSE_WINDOW, default = pad) - cum_wk,
      final_score   = tail(cum_runs, 1),
      final_wickets = final_wk,
      stringsAsFactors = FALSE
    )
  }
  if (length(out) == 0) return(NULL)
  dplyr::bind_rows(out)
}

# parse every JSON in a folder (numeric file names = Cricsheet match ids)
parse_all_matches <- function(data_dir) {
  files <- list.files(data_dir, pattern = "^[0-9]+\\.json$",
                      full.names = TRUE, recursive = TRUE)
  if (length(files) == 0)
    stop("No Cricsheet match JSON files found in: ", data_dir)
  message("Parsing ", length(files), " match files ...")
  parts <- lapply(files, parse_match)
  parts <- parts[!vapply(parts, is.null, logical(1))]
  dplyr::bind_rows(parts) %>%
    mutate(
      overs_bowled     = ball / 6,
      current_run_rate = cum_score / overs_bowled,
      is_collapse      = as.integer(wkts_next12 >= COLLAPSE_WICKETS)
    )
}

# regression metrics
eval_metrics <- function(actual, predicted) {
  c(MAE  = mean(abs(actual - predicted)),
    RMSE = sqrt(mean((actual - predicted)^2)),
    R2   = 1 - sum((actual - predicted)^2) / sum((actual - mean(actual))^2))
}

# classification metrics at a threshold
class_metrics <- function(actual, prob, threshold) {
  pred <- as.integer(prob >= threshold)
  tp <- sum(pred == 1 & actual == 1); fp <- sum(pred == 1 & actual == 0)
  fn <- sum(pred == 0 & actual == 1); tn <- sum(pred == 0 & actual == 0)
  precision <- ifelse(tp + fp == 0, 0, tp / (tp + fp))
  recall    <- ifelse(tp + fn == 0, 0, tp / (tp + fn))
  f1        <- ifelse(precision + recall == 0, 0, 2 * precision * recall / (precision + recall))
  list(tp = tp, fp = fp, fn = fn, tn = tn,
       accuracy = (tp + tn) / length(actual),
       precision = precision, recall = recall, f1 = f1)
}

# threshold that maximises F1 (search on TRAINING predictions only)
best_f1_threshold <- function(actual, prob) {
  grid <- seq(0.05, 0.95, by = 0.01)
  f1s  <- vapply(grid, function(t) class_metrics(actual, prob, t)$f1, numeric(1))
  grid[which.max(f1s)]
}

# live "what-if" helper used by the notebook and the Shiny app
predict_situation <- function(score, wickets, overs, runs_last12, wkts_last12,
                              score_model, collapse_model, innings_num = 1) {
  crr <- score / overs
  snap <- data.frame(checkpoint_overs = overs, cum_score = score,
                     cum_wickets = wickets, current_run_rate = crr,
                     runs_last12 = runs_last12, wkts_last12 = wkts_last12)
  col <- data.frame(ball = overs * 6, cum_score = score, cum_wickets = wickets,
                    current_run_rate = crr, runs_last12 = runs_last12,
                    wkts_last12 = wkts_last12, innings_num = innings_num)
  list(
    expected_score = round(as.numeric(predict(score_model, newdata = snap))),
    collapse_prob  = as.numeric(predict(collapse_model, newdata = col, type = "response"))
  )
}
