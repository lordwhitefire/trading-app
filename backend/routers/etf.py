from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/etf")

@router.get("/")
async def get_etf_data():
    try:
        etf_data = fetch_etf_data()
        return etf_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
