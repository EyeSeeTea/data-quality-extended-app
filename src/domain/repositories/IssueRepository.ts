import { RowsPaginated } from "$/domain/entities/Pagination";
import { Id, Period } from "$/domain/entities/Ref";
import { Maybe } from "$/utils/ts-utils";
import { FutureData } from "$/data/api-futures";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { Pagination } from "$/domain/entities/Pagination";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export interface IssueRepository {
    get(options: GetIssuesOptions): FutureData<RowsPaginated<QualityAnalysisIssue>>;
    getById(id: Id, metadata: MetadataItem): FutureData<QualityAnalysisIssue>;
    create(
        issues: QualityAnalysisIssue,
        qualityAnalysisId: Id,
        metadata: MetadataItem
    ): FutureData<void>;
}

export type GetIssuesOptions = {
    pagination: Pick<Pagination, "page" | "pageSize">;
    sorting: { field: string; order: "asc" | "desc" };
    filters: {
        actions: Maybe<string[]>;
        countries: string[];
        name: Maybe<string>;
        periods: Period[];
        status: Maybe<string[]>;
        analysisIds: Maybe<Id[]>;
        sectionId: Maybe<Id>;
        id: Maybe<Id>;
        followUp: Maybe<string>;
        step: Maybe<string[]>;
        search: Maybe<string>;
    };
    metadata: MetadataItem;
};
