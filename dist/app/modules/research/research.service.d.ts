import { IPythonJobResponse, IResearchStartRequest } from './research.interface';
export declare const ResearchService: {
    startResearch: (payload: IResearchStartRequest, userId?: string) => Promise<IPythonJobResponse>;
    getJobStatus: (jobId: string) => Promise<IPythonJobResponse>;
    getResearchHistory: (limit?: number, userId?: string) => Promise<{
        records: IPythonJobResponse[];
        count: number;
    }>;
    getHistoryById: (id: string, userId?: string) => Promise<{
        job_id: any;
        status: "done";
        progress: number;
        stage: string;
        result: {
            topic: any;
            report: any;
            critique: any;
            critique_score: any;
            fact_check_score: any;
            rewritten_queries: never[];
            verified_urls: any;
            time_sec: any;
            error: string;
        };
        error: null;
        created_at: any;
    }>;
    getCacheStats: () => Promise<any>;
    checkAgentHealth: () => Promise<any>;
};
