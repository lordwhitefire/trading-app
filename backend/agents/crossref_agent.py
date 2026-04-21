from crewai import Agent

def get_crossref_agent(llm):
    return Agent(
        role="Cross Reference Analyst",
        goal="Find overlapping signals across multiple strategies and identify which strategy fits which market condition",
        backstory="You are a multi-strategy portfolio analyst who specializes in finding correlations and conflicts between different trading strategies",
        llm=llm,
        verbose=True
    )
