import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { INote } from "./note.interface";
import { Note } from "./note.model";

const createNote = async (payload: INote, userId: string): Promise<INote> => {
  const result = await Note.create({ ...payload, userId });
  return result;
};


const getAllNotes  = async (userId : string, query : {tag? : string; search? : string}) : Promise<INote []> => {
    const filter : any = {userId}

    if (query.tag) {
        filter.tags = query.tag.toLowerCase()
    }
    if (query.search) {
        filter.$text = {$search : query.search}
    }

    const result = await Note.find(filter).sort({
        updatedAt : -1
    })
    return result
}

const getSingleNote = async (id: string, userId: string): Promise<INote> => {
  const result = await Note.findOne({ _id: id, userId });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  return result;
};

const updateNote = async (
  id: string,
  userId: string,
  payload: Partial<INote>,
): Promise<INote | null> => {
  const isExist = await Note.findOne({ _id: id, userId });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  const result = await Note.findOneAndUpdate(
    { _id: id, userId },
    payload,
    { new: true, runValidators: true },
  );
  return result;
};


const deleteNote = async (id: string, userId: string): Promise<INote | null> => {
  const isExist = await Note.findOne({ _id: id, userId });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  const result = await Note.findOneAndDelete({ _id: id, userId });
  return result;
};

const getAllTags = async (userId: string): Promise<string[]> => {
  const tags = await Note.distinct('tags', { userId });
  return tags;
};


export const NoteService = {
  createNote,
  getAllNotes,
  getSingleNote,
  updateNote,
  deleteNote,
  getAllTags,
};