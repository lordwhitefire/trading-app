from fastapi import APIRouter

router = APIRouter()

@router.get("/translate")
async def translate():
    return {"message": "Translation endpoint not implemented"}
