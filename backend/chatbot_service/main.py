# main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from fastapi.responses import StreamingResponse
from app.chatbot import get_chat_response, stream_chat_response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    message: str
    history: List[List[str]] = []

@app.post("/chat")
async def chat(message: Message):
    reply = get_chat_response(message.message, message.history)
    return {"response": reply}

@app.post("/stream_chat")
async def stream_chat(message: Message):
    return StreamingResponse(
        stream_chat_response(message.message, message.history),
        media_type="text/plain"
    )
