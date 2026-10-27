# Shiny live simulator  --  run from the project root:  shiny::runApp("R/app.R")
# Needs models/ipl_score_rf_model.rds and models/ipl_collapse_log_model.rds (created by knitting IDS_CS.Rmd)
library(shiny)
library(randomForest)

rf_fit <- readRDS("models/ipl_score_rf_model.rds")
lr_fit <- readRDS("models/ipl_collapse_log_model.rds")

ui <- fluidPage(
  titlePanel("IPL Live Simulator: expected score & collapse risk"),
  sidebarLayout(
    sidebarPanel(
      sliderInput("overs", "Overs completed", 6, 18, 10, step = 1),
      numericInput("score", "Current score", 85, min = 0, max = 250),
      sliderInput("wk", "Wickets lost", 0, 9, 2),
      numericInput("r12", "Runs in last 12 balls", 15, min = 0, max = 60),
      sliderInput("w12", "Wickets in last 12 balls", 0, 4, 0)
    ),
    mainPanel(
      h3(textOutput("exp")),
      h3(textOutput("risk")),
      helpText("Collapse = 3 or more wickets in the next 12 legal balls.")
    )
  )
)

server <- function(input, output) {
  snap <- reactive(data.frame(
    checkpoint_overs = input$overs, cum_score = input$score, cum_wickets = input$wk,
    current_run_rate = input$score / input$overs,
    runs_last12 = input$r12, wkts_last12 = input$w12))
  col <- reactive(data.frame(
    ball = input$overs * 6, cum_score = input$score, cum_wickets = input$wk,
    current_run_rate = input$score / input$overs,
    runs_last12 = input$r12, wkts_last12 = input$w12, innings_num = 1))
  output$exp  <- renderText(paste("Expected final score:", round(predict(rf_fit, snap()))))
  output$risk <- renderText(sprintf("Collapse risk (next 12 balls): %.1f%%",
                                    100 * predict(lr_fit, col(), type = "response")))
}

shinyApp(ui, server)

