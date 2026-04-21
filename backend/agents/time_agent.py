from crewai import Agent

def get_time_agent(llm):
    return Agent(
        role="Time Analyst",
        goal="Identify the best and worst performing hours and days from backtest results",
        backstory="You are a market timing specialist who understands how time of day and day of week affects trading performance and signal quality",
        llm=llm,
        verbose=True
    )
