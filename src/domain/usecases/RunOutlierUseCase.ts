import { FutureData } from "$/data/api-futures";
import { Outlier } from "$/domain/entities/Outlier";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Id } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import { IssueRepository } from "$/domain/repositories/IssueRepository";
import { OutlierRepository } from "$/domain/repositories/OutlierRepository";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import _ from "$/domain/entities/generic/Collection";
import { ModuleRepository } from "$/domain/repositories/ModuleRepository";
import { DataElement } from "$/domain/entities/DataElement";
import { UCIssue } from "./common/UCIssue";
import { UCAnalysis } from "./common/UCAnalysis";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export class RunOutlierUseCase {
    private issueUseCase: UCIssue;
    private analysisUseCase: UCAnalysis;
    constructor(
        private outlierRepository: OutlierRepository,
        private analysisRepository: QualityAnalysisRepository,
        private issueRepository: IssueRepository,
        private moduleRepository: ModuleRepository
    ) {
        this.analysisUseCase = new UCAnalysis(this.analysisRepository);
        this.issueUseCase = new UCIssue(this.issueRepository);
    }

    execute(options: RunOutlierUseCaseOptions): FutureData<QualityAnalysis> {
        return this.analysisUseCase
            .getById(options.qualityAnalysisId, options.metadata)
            .flatMap(analysis => {
                return this.getNumericDataElements(analysis.module.id).flatMap(dataElements => {
                    return this.getOutliers(
                        options,
                        analysis.startDate,
                        analysis.endDate,
                        analysis.countriesAnalysis,
                        dataElements.map(dataElement => dataElement.id),
                        analysis.module.id
                    ).flatMap(outliers => {
                        return this.issueUseCase
                            .getTotalIssuesBySection(analysis, options.sectionId, options.metadata)
                            .flatMap(totalIssues => {
                                const issues = this.generateIssuesFromOutliers(
                                    outliers,
                                    analysis,
                                    totalIssues,
                                    options
                                );
                                return this.saveIssues(issues, analysis, options);
                            })
                            .flatMap(() => {
                                const analysisToUpdate = this.analysisUseCase.updateAnalysis(
                                    analysis,
                                    options.sectionId,
                                    outliers.length
                                );
                                return this.analysisRepository
                                    .save([analysisToUpdate], options.metadata)
                                    .map(() => analysisToUpdate);
                            });
                    });
                });
            });
    }

    private getNumericDataElements(moduleId: Id): FutureData<DataElement[]> {
        return this.moduleRepository.getByIds([moduleId]).flatMap(modules => {
            const module = modules[0];
            if (!module) return Future.error(new Error(`Cannot find module: ${moduleId}`));
            return Future.success(module.dataElements.filter(dataElement => dataElement.isNumber));
        });
    }

    private getOutliers(
        options: RunOutlierUseCaseOptions,
        startDate: string,
        endDate: string,
        countryIds: Id[],
        dataElements: Id[],
        moduleId: Id
    ): FutureData<Outlier[]> {
        const $requests = _(dataElements)
            .chunk(100)
            .map(dataElementsIds => {
                return this.outlierRepository.export({
                    algorithm: options.algorithm,
                    countryIds: countryIds,
                    endDate: endDate,
                    startDate: startDate,
                    moduleId: moduleId,
                    threshold: options.threshold,
                    dataElementIds: dataElementsIds,
                });
            })
            .value();
        return Future.sequential($requests).flatMap(result => {
            return Future.success(_(result).flatten().value());
        });
    }

    private generateIssuesFromOutliers(
        outliers: Outlier[],
        analysis: QualityAnalysis,
        totalIssues: number,
        options: RunOutlierUseCaseOptions
    ): QualityAnalysisIssue[] {
        if (outliers.length === 0) return [];
        const sectionNumber = this.issueUseCase.getSectionNumber(
            analysis.sections,
            options.sectionId
        );
        return outliers.map((outlier, index) => {
            const currentNumber = totalIssues + 1 + index;
            const prefix = `${analysis.sequential.value}-${sectionNumber}`;
            const issueNumber = this.issueUseCase.generateIssueNumber(currentNumber, prefix);
            return this.issueUseCase.buildDefaultIssue(
                {
                    categoryOptionComboId: outlier.categoryOptionId,
                    correlative: String(currentNumber),
                    countryId: outlier.countryId,
                    dataElementId: outlier.dataElementId,
                    description: this.getDescriptionIssue(outlier, options),
                    issueNumber: issueNumber,
                    period: outlier.period,
                },
                options.sectionId
            );
        });
    }

    private saveIssues(
        issuesToSave: QualityAnalysisIssue[],
        analysis: QualityAnalysis,
        options: RunOutlierUseCaseOptions
    ): FutureData<void> {
        return this.issueUseCase
            .getRelatedIssues(issuesToSave, options.sectionId, options.metadata)
            .flatMap(existingIssues => {
                return this.issueUseCase.save(existingIssues, analysis.id, options.metadata);
            });
    }

    private getDescriptionIssue(outlier: Outlier, options: RunOutlierUseCaseOptions): string {
        return outlier.zScore
            ? `An outlier was detected using ${
                  options.algorithm
              } with a value of ${outlier.zScore.toFixed(2)}, which is over the threshold ${
                  options.threshold
              } configured`
            : "";
    }
}

type RunOutlierUseCaseOptions = {
    qualityAnalysisId: Id;
    algorithm: string;
    threshold: string;
    sectionId: Id;
    metadata: MetadataItem;
};
