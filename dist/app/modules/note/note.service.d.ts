import { INote } from "./note.interface";
export declare const NoteService: {
    createNote: (payload: INote, userId: string) => Promise<INote>;
    getAllNotes: (userId: string, query: {
        tag?: string;
        search?: string;
    }) => Promise<INote[]>;
    getSingleNote: (id: string, userId: string) => Promise<INote>;
    updateNote: (id: string, userId: string, payload: Partial<INote>) => Promise<INote | null>;
    deleteNote: (id: string, userId: string) => Promise<INote | null>;
    getAllTags: (userId: string) => Promise<string[]>;
};
