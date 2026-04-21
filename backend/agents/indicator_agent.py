from crewai import Agent

def get_indicator_agent(llm):
    return Agent(
        role="Indicator Analyst",
        goal="Analyze which indicators contributed most to wins and losses in the backtest results",
        backstory="You are an expert technical analyst with 20 years of experience analyzing trading indicators and their performance across different market conditions",
        llm=llm,
        verbose=True
    )
