export interface INote {
  userId: string;
  title: string;
  content: string;
  sourceUrl?: string;
  tags: string[];
  embeddingId?: string;    // Qdrant Vector ID (RAG-ready)
  audioUrl?: string;       // Voice-to-memo support
  createdAt?: Date;
  updatedAt?: Date;
}
