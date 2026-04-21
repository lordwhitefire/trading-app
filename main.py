from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import backtest.router as backtest_router
import live.router as live_router
import news.router as news_router
import etf.router as etf_router
import translator.router as translator_router

app = FastAPI()

# Include routers
app.include_router(backtest_router.router)
app.include_router(live_router.router)
app.include_router(news_router.router)
app.include_router(etf_router.router)
app.include_router(translator_router.router)

# Add CORS middleware to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint for health check
@app.get("/")
async def root():
    return {"message": "AlphaDesk is up and running!"}

# Run the app using uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
