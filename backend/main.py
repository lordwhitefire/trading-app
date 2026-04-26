from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.routers import (
    backtest, live, news, etf,
    translator, indicators, patterns,
    levels, warnings, coins, chat
)

app = FastAPI(title="AlphaDesk", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(backtest.router)
app.include_router(live.router)
app.include_router(news.router)
app.include_router(etf.router)
app.include_router(translator.router)
app.include_router(indicators.router)
app.include_router(patterns.router)
app.include_router(levels.router)
app.include_router(warnings.router)
app.include_router(coins.router)
app.include_router(chat.router)

@app.get("/")
def health_check():
    return {"status": "AlphaDesk is running", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)