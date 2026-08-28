import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { IPaper } from "./paper.interface";
import { Paper } from "./paper.model";

const createPaper = async(payload : IPaper, userId : string) : Promise<IPaper> => {
    const result = await Paper.create({
        ...payload,
        userId
    })
    return result
}
const getAllPapers = async(userId : string) : Promise<IPaper[]> =>{
    const result =  await Paper.find({userId}).sort({updatedAt : -1})
    return result
}

const getSinglePaper  = async(id : string, userId : string) : Promise<IPaper> => {
    const result = await Paper.findOne({
        userId, _id : id
    })
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Paper not found")
    }
    return result
}

const updatePaper = async(
    id : string,
    userId : string,
    payload : Partial<IPaper>
) : Promise<IPaper | null> => {
 const isExist = await Paper.findOne({
    _id : id , 
    userId
 })
 if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Paper not found")

 }
 const result = await Paper.findOneAndUpdate({_id : id, userId},payload,{new: true, runValidators: true})

 return result
}

const deletePaper = async (id: string, userId: string): Promise<IPaper | null> => {
  const isExist = await Paper.findOne({ _id: id, userId });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found');
  }
  const result = await Paper.findOneAndDelete({ _id: id, userId });
  return result;
};

const addCitation = async (id: string, userId: string, citation: any) => {
  const paper = await Paper.findOne({ _id: id, userId });
  if (!paper) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found');
  }
  paper.citations.push(citation);
  await paper.save();
  return paper;
};

export const PaperService = {
  createPaper,
  getAllPapers,
  getSinglePaper,
  updatePaper,
  deletePaper,
  addCitation,
};
