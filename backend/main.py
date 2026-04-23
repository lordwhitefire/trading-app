from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.routers import backtest, live, news, etf, translator, indicators

app = FastAPI(title="AlphaDesk")

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

@app.get("/")
def health_check():
    return {"status": "AlphaDesk is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
