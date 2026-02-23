import { FutureData } from "$/data/api-futures";
import { IssueRepository } from "$/domain/repositories/IssueRepository";
import { UCIssue } from "$/domain/usecases/common/UCIssue";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { Id, Period } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import { UCAnalysis } from "$/domain/usecases/common/UCAnalysis";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Maybe } from "$/utils/ts-utils";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export type IssueTemplate = {
    categoryOptionComboId: Maybe<Id>;
    countryId: Maybe<Id>;
    dataElementId: Maybe<Id>;
    description: string;
    period: Maybe<Period>;
};

export class CreateIssueUseCase {
    private issueUseCase: UCIssue;
    private analysisUseCase: UCAnalysis;

    constructor(
        private analysisRepository: QualityAnalysisRepository,
        private issueRepository: IssueRepository
    ) {
        this.issueUseCase = new UCIssue(this.issueRepository);
        this.analysisUseCase = new UCAnalysis(this.analysisRepository);
    }

    execute(options: CreateIssueUseCaseOptions): FutureData<Maybe<QualityAnalysis>> {
        const { qualityAnalysisId, sectionId, issues, metadata } = options;

        if (issues.length <= 0) return Future.success(undefined);

        return this.fetchAnalysisAndTotalIssues(qualityAnalysisId, sectionId, metadata).flatMap(
            analysisAndTotalIssues => {
                const issuesToCreate = this.buildIssues({
                    issues,
                    sectionId,
                    metadata: options.metadata,
                    ...analysisAndTotalIssues,
                });
                const analysisUpdate = this.analysisUseCase.updateAnalysis(
                    analysisAndTotalIssues.analysis,
                    sectionId,
                    issues.length + analysisAndTotalIssues.totalIssues
                );
                return this.saveIssuesAndUpdateAnalysis(
                    issuesToCreate,
                    analysisUpdate,
                    options.metadata
                );
            }
        );
    }

    private fetchAnalysisAndTotalIssues(
        qualityAnalysisId: Id,
        sectionId: Id,
        metadata: MetadataItem
    ): FutureData<AnalysisAndTotalIssues> {
        return this.analysisUseCase
            .getById(qualityAnalysisId, metadata)
            .flatMap(analysis =>
                this.issueUseCase
                    .getTotalIssuesBySection(analysis, sectionId, metadata)
                    .map(totalIssues => ({ analysis, totalIssues }))
            );
    }

    private buildIssues(
        params: Omit<CreateIssueUseCaseOptions, "qualityAnalysisId"> & AnalysisAndTotalIssues
    ): QualityAnalysisIssue[] {
        const { issues, sectionId, analysis, totalIssues } = params;

        const sectionNumber = this.issueUseCase.getSectionNumber(analysis.sections, sectionId);
        const prefix = `${analysis.sequential.value}-${sectionNumber}`;

        return issues.map((issue, index) => {
            const currentNumber = totalIssues + 1 + index;
            const issueNumber = this.issueUseCase.generateIssueNumber(currentNumber, prefix);
            return this.issueUseCase.buildDefaultIssue(
                {
                    categoryOptionComboId: issue.categoryOptionComboId,
                    countryId: issue.countryId,
                    dataElementId: issue.dataElementId,
                    period: issue.period,
                    description: issue.description,
                    correlative: String(currentNumber),
                    issueNumber: issueNumber,
                },
                sectionId
            );
        });
    }

    private saveIssuesAndUpdateAnalysis(
        issues: QualityAnalysisIssue[],
        analysis: QualityAnalysis,
        metadata: MetadataItem
    ): FutureData<QualityAnalysis> {
        return this.issueUseCase
            .save(issues, analysis.id, metadata)
            .flatMap(() => this.analysisRepository.save([analysis], metadata).map(() => analysis));
    }
}

type CreateIssueUseCaseOptions = {
    issues: IssueTemplate[];
    qualityAnalysisId: Id;
    sectionId: Id;
    metadata: MetadataItem;
};

type AnalysisAndTotalIssues = { analysis: QualityAnalysis; totalIssues: number };
