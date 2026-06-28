import chromadb
from typing import List, Dict, Any

class VectorStore:
    def __init__(self, collection_name: str = "companies"):
        try:
            self.client = chromadb.HttpClient(host='localhost', port=8001)
            self.collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            print(f"✅ Connected to ChromaDB: {collection_name}")
        except Exception as e:
            print(f"⚠️ ChromaDB connection failed: {e}")
            print("Using in-memory fallback")
            self.data = {}
    
    def add_companies(self, companies: List[Dict[str, Any]]):
        """Add companies to vector store"""
        if hasattr(self, 'collection'):
            documents = [str(c) for c in companies]
            ids = [f"company_{i}" for i in range(len(companies))]
            self.collection.add(documents=documents, ids=ids)
        else:
            # In-memory fallback
            for c in companies:
                self.data[c.get('name', '')] = c
    
    def search(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for similar companies"""
        if hasattr(self, 'collection'):
            results = self.collection.query(
                query_texts=[query],
                n_results=limit
            )
            return results.get('documents', [[]])[0] if results else []
        else:
            return list(self.data.values())[:limit]