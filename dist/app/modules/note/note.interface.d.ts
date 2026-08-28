export interface INote {
    userId: string;
    title: string;
    content: string;
    sourceUrl?: string;
    tags: string[];
    embeddingId?: string;
    audioUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
