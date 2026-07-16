import { FutureData } from "$/data/api-futures";
import { Maybe } from "$/utils/ts-utils";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Code, Id } from "$/domain/entities/Ref";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { PeriodType } from "$/domain/entities/PeriodType";

export interface QualityAnalysisRepository {
    get(options: QualityAnalysisOptions): FutureData<QualityAnalysisPaginated>;
    getById(id: Id, metadata: MetadataItem): FutureData<QualityAnalysis>;
    save(qualityAnalysis: QualityAnalysis[], metadata: MetadataItem): FutureData<void>;
    remove(id: Id): FutureData<void>;
    removeAll(analysisProgramCode: Code): FutureData<void>;
}

export type Pagination = {
    page: number;
    pageCount: number;
    pageSize: number;
    total: number;
};

export type QualityAnalysisOptions = {
    pagination: Pick<Pagination, "page" | "pageSize">;
    sorting: { field: string; order: "asc" | "desc" };
    filters: {
        endDate: Maybe<string>;
        module: Maybe<string>;
        name: Maybe<string>;
        startDate: Maybe<string>;
        status: Maybe<string>;
        ids: Maybe<Id[]>;
        periodType: Maybe<PeriodType>;
    };
    metadata: MetadataItem;
};

export type QualityAnalysisPaginated = {
    rows: QualityAnalysis[];
    pagination: Pagination;
};
