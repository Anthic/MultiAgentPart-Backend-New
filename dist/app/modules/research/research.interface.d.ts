export type ResearchJobStatus = 'queued' | 'running' | 'done' | 'failed';
export interface IResearchResult {
    user_id?: string;
    topic: string;
    report: string;
    critique: string;
    critique_score: number;
    fact_check_score: number;
    rewritten_queries: string[];
    verified_urls: string[];
    time_sec: number;
    error: string;
}
export interface IPythonJobResponse {
    job_id: string;
    user_id?: string;
    status: ResearchJobStatus;
    progress: number;
    stage: string;
    result: IResearchResult | null;
    error: string | null;
    created_at: number;
}
export interface IResearchStartRequest {
    topic: string;
    mode?: 'fast' | 'deep';
}
