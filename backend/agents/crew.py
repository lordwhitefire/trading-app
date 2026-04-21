import os
from crewai import Crew, Task, Agent
from backend.agents.indicator_agent import get_indicator_agent
from backend.agents.time_agent import get_time_agent
from backend.agents.crossref_agent import get_crossref_agent

def run_analysis(backtest_results):
    llm = "gemini/gemini-2.0-flash"
    
    indicator_analyst = get_indicator_agent(llm)
    time_analyst = get_time_agent(llm)
    crossref_analyst = get_crossref_agent(llm)
    
    context = json.dumps(backtest_results)
    
    task1 = Task(
        description=f"Analyze the following backtest results and explain which indicators contributed most to wins vs losses: {context}",
        agent=indicator_analyst,
        expected_output="A clear explanation of indicator performance with recommendations"
    )
    task2 = Task(
        description=f"Analyze the following backtest results and identify the best and worst performing hours and days: {context}",
        agent=time_analyst,
        expected_output="A breakdown of performance by time of day and day of week with recommendations"
    )
    task3 = Task(
        description=f"Analyze the following backtest results and identify overlapping signals and strategy fit: {context}",
        agent=crossref_analyst,
        expected_output="A cross-reference analysis with strategy recommendations per market condition"
    )
    
    crew = Crew(
        agents=[indicator_analyst, time_analyst, crossref_analyst],
        tasks=[task1, task2, task3],
        verbose=True
    )
    
    result = crew.run()
    return str(result)
