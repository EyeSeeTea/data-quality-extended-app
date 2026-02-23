import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";

export interface IssueExportRepository {
    export(issues: QualityAnalysisIssue[], metadata: MetadataItem): FutureData<void>;
}
