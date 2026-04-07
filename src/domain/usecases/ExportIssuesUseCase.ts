import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { Id } from "$/domain/entities/Ref";
import { IssueExportRepository } from "$/domain/repositories/IssueExportRepository";
import { GetIssuesOptions, IssueRepository } from "$/domain/repositories/IssueRepository";
import { UCIssue } from "./common/UCIssue";

export class ExportIssuesUseCase {
    private issueUseCase: UCIssue;
    constructor(
        private issueRepository: IssueRepository,
        private issueExportRepository: IssueExportRepository
    ) {
        this.issueUseCase = new UCIssue(this.issueRepository);
    }

    execute(options: ExportIssuesOptions): FutureData<void> {
        return this.getIssuesWithFilters(options).flatMap(issues => {
            return this.issueExportRepository.export(issues, options.metadata);
        });
    }

    private getIssuesWithFilters(options: ExportIssuesOptions): FutureData<QualityAnalysisIssue[]> {
        return this.issueUseCase.getAllIssues(
            {
                ...options.filters,
                analysisIds: [options.analysisId],
            },
            {
                initialPage: 1,
                issues: [],
            },
            options.metadata
        );
    }
}

type ExportIssuesOptions = {
    analysisId: Id;
    filters: GetIssuesOptions["filters"];
    metadata: MetadataItem;
};
