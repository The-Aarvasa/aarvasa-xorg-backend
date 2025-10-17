# app/chatbot.py
import os
import openai
from dotenv import load_dotenv
from app.rag_engine import CompanyRAG, NavigationRAG
from app.mcp_orchestrator import MCPOrchestrator

load_dotenv()

openai.api_key = os.getenv("GROQ_API_KEY")
openai.api_base = "https://api.groq.com/openai/v1"

company_rag = CompanyRAG("app/company_context.txt")
nav_rag = NavigationRAG("app/navigation.json")

mcp = MCPOrchestrator(company_rag, nav_rag)

def get_chat_response(user_message: str, chat_history=None):
    try:
        return mcp.route(user_message, chat_history)
    except Exception as e:
        return f"Error from AI: {str(e)}"

def stream_chat_response(user_message: str, chat_history=None):
    try:
        for chunk in mcp.route_stream(user_message, chat_history):
            yield chunk
    except Exception as e:
        yield f"\n[Error] {str(e)}"
