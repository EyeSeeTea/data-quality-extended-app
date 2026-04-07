import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Future } from "$/domain/entities/generic/Future";
import {
    QualityAnalysisPaginated,
    QualityAnalysisRepository,
} from "$/domain/repositories/QualityAnalysisRepository";
import { FutureData } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";

export class QualityAnalysisTestRepository implements QualityAnalysisRepository {
    getById(): FutureData<QualityAnalysis> {
        throw new Error("Method not implemented.");
    }
    remove(): FutureData<void> {
        throw new Error("Method not implemented.");
    }
    save(): FutureData<any> {
        throw new Error("Method not implemented.");
    }
    get(): FutureData<QualityAnalysisPaginated> {
        return Future.success({
            pagination: { page: 1, total: 10, pageSize: 5, pageCount: 2 },
            rows: [],
        });
    }
    removeAll(_analysisProgramCode: Code): FutureData<void> {
        return Future.success(undefined);
    }
}
