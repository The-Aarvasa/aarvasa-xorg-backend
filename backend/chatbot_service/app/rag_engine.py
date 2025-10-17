from sentence_transformers import SentenceTransformer, util
import numpy as np
import json
import re

class CompanyRAG:
    def __init__(self, context_path: str):
        with open(context_path, "r", encoding="utf-8") as f:
            raw_text = f.read()

        # Split based on section titles (like Founders, Technology Stack, etc.)
        self.chunks = self.split_by_sections(raw_text)
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.chunk_embeddings = self.embedder.encode(self.chunks, convert_to_tensor=True)

    def split_by_sections(self, text):
        """
        Split the company context into clean sections like Founders, Tech Stack, etc.
        """
        sections = re.split(r"\n(?=[A-Z][A-Za-z\s&]+:)", text)
        grouped = []
        buffer = ""

        for sec in sections:
            if sec.strip() == "":
                continue
            buffer += sec.strip() + "\n\n"
            # Group 1–3 paragraphs max per chunk
            if buffer.count("\n\n") >= 2:
                grouped.append(buffer.strip())
                buffer = ""

        if buffer:
            grouped.append(buffer.strip())

        return grouped

    def retrieve_relevant_chunks(self, query: str, top_k: int = 3) -> str:
        query_embedding = self.embedder.encode(query, convert_to_tensor=True)
        similarities = util.pytorch_cos_sim(query_embedding, self.chunk_embeddings)[0]
        top_indices = np.argsort(-similarities.cpu().numpy())[:top_k]
        top_chunks = "\n\n".join([self.chunks[i] for i in top_indices])
        return top_chunks

class NavigationRAG:
    def __init__(self, json_path: str):
        with open(json_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        self.entries = [f"{entry['name']}: {entry['description']}" for entry in self.data]
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.embeddings = self.embedder.encode(self.entries, convert_to_tensor=True)

    def retrieve_navigation_info(self, query: str, top_k: int = 1):
        query_embedding = self.embedder.encode(query, convert_to_tensor=True)
        similarities = util.pytorch_cos_sim(query_embedding, self.embeddings)[0]
        top_indices = np.argsort(-similarities.cpu().numpy())[:top_k]
        top_entries = [self.data[i] for i in top_indices]
        return top_entries
