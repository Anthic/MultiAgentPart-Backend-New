import { Types } from "mongoose"

export interface ICitation {
    citationKey : string
    title : string
    url : string
    doi?: string
    authors? : string[]
    year? : string
}

export interface IPeerReviewResult {
  overallScore: number;
  methodologyFeedback: string;
  domainFeedback: string;
  clarityFeedback: string;
}
export interface IPaper {
  userId: string;
  title: string;
  contentMarkdown: string;
  abstract?: string;
  citations: ICitation[];
  peerReviewResults?: IPeerReviewResult;
  attachedNotes: Types.ObjectId[];
  slidesMarkdown?: string;     
  slideCount?: number;          
  status: 'draft' | 'in_review' | 'published' | 'archived';
  createdAt?: Date;
  updatedAt?: Date;
}