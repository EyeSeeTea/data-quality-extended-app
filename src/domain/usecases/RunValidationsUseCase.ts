import { FutureData } from "$/data/api-futures";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Id } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import { IssueRepository } from "$/domain/repositories/IssueRepository";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import _ from "$/domain/entities/generic/Collection";
import { UCIssue } from "./common/UCIssue";
import { UCAnalysis } from "./common/UCAnalysis";
import { ValidationRuleAnalysisRepository } from "$/domain/repositories/ValidationRuleAnalysisRepository";
import { ValidationRuleAnalysis } from "$/domain/entities/ValidationRuleAnalysis";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { ValidationRuleGroupRepository } from "$/domain/repositories/ValidationRuleGroupRepository";
import { ValidationRuleGroup } from "$/domain/entities/ValidationRuleGroup";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { CountryRepository } from "$/domain/repositories/CountryRepository";
import i18n from "$/utils/i18n";

export class RunValidationsUseCase {
    private issueUseCase: UCIssue;
    private analysisUseCase: UCAnalysis;
    constructor(
        private analysisRepository: QualityAnalysisRepository,
        private issueRepository: IssueRepository,
        private validationRuleAnalysisRepository: ValidationRuleAnalysisRepository,
        private validationRuleGroupRepository: ValidationRuleGroupRepository,
        private countryRepository: CountryRepository
    ) {
        this.analysisUseCase = new UCAnalysis(this.analysisRepository);
        this.issueUseCase = new UCIssue(this.issueRepository);
    }

    execute(options: RunValidationsUseCaseOptions): FutureData<QualityAnalysis> {
        if (!options.validationRuleGroupId)
            return Future.error(new Error("Validation Rule Group is required"));
        return Future.joinObj({
            analysis: this.analysisUseCase.getById(options.qualityAnalysisId),
            validationRuleGroup: this.validationRuleGroupRepository.getById(
                options.validationRuleGroupId
            ),
        }).flatMap(({ analysis, validationRuleGroup }) => {
            if (analysis.countriesAnalysis.length === 0)
                return Future.error(new Error(i18n.t("Select at least one organisation unit")));
            const checkAllCountries = this.isGlobalInCountries(
                analysis.countriesAnalysis,
                options.metadata
            );
            return this.getAllCountries(checkAllCountries, analysis).flatMap(countriesIds => {
                return this.getValidationRuleAnalysis(analysis, countriesIds, options).flatMap(
                    rules => {
                        return this.issueUseCase
                            .getTotalIssuesBySection(analysis, options.sectionId)
                            .flatMap(totalIssues => {
                                const issuesToSave = this.buildIssuesFromRules(
                                    rules,
                                    analysis,
                                    totalIssues,
                                    options,
                                    validationRuleGroup
                                );
                                return this.saveIssues(
                                    issuesToSave,
                                    analysis,
                                    options.sectionId
                                ).flatMap(() => {
                                    const analysisUpdate = this.analysisUseCase.updateAnalysis(
                                        analysis,
                                        options.sectionId,
                                        issuesToSave.length
                                    );
                                    return this.analysisRepository
                                        .save([analysisUpdate])
                                        .map(() => analysisUpdate);
                                });
                            });
                    }
                );
            });
        });
    }

    private getAllCountries(isGlobal: boolean, analysis: QualityAnalysis): FutureData<Id[]> {
        return isGlobal
            ? this.countryRepository.getBy({ level: "3" }).map(countries => {
                  return countries.map(country => country.id);
              })
            : Future.success(analysis.countriesAnalysis.map(countryId => countryId));
    }

    private isGlobalInCountries(countriesIds: Id[], metadata: MetadataItem): boolean {
        return countriesIds.includes(metadata.organisationUnits.global.id);
    }

    private getValidationRuleAnalysis(
        analysis: QualityAnalysis,
        countriesIds: Id[],
        options: RunValidationsUseCaseOptions
    ) {
        const concurrencyRequest = 1;
        const $requests = Future.parallel(
            countriesIds.map(countryId =>
                this.validationRuleAnalysisRepository.get({
                    countryId: countryId,
                    startDate: `${analysis.startDate}-01-01`,
                    endDate: `${analysis.endDate}-12-31`,
                    validationRuleGroupId: options.validationRuleGroupId,
                })
            ),
            { concurrency: concurrencyRequest }
        );
        return $requests.flatMap(result => {
            const rules = _(result).flatten().value();
            return Future.success(rules);
        });
    }

    private buildIssuesFromRules(
        rules: ValidationRuleAnalysis[],
        analysis: QualityAnalysis,
        totalIssues: number,
        options: RunValidationsUseCaseOptions,
        validationRuleGroup: ValidationRuleGroup
    ): QualityAnalysisIssue[] {
        const sectionNumber = this.issueUseCase.getSectionNumber(
            analysis.sections,
            options.sectionId
        );
        return rules.map((rule, index) => {
            const currentNumber = totalIssues + 1 + index;
            const prefix = `${analysis.sequential.value}-${sectionNumber}`;
            const issueNumber = this.issueUseCase.generateIssueNumber(currentNumber, prefix);
            return this.issueUseCase.buildDefaultIssue(
                {
                    categoryOptionComboId: rule.categoryOptionId,
                    correlative: String(currentNumber),
                    countryId: rule.countryId,
                    dataElementId: "",
                    description: this.generateDescription(validationRuleGroup, rule),
                    issueNumber: issueNumber,
                    period: rule.period,
                },
                options.sectionId
            );
        });
    }

    private generateDescription(
        validationRuleGroup: ValidationRuleGroup,
        rule: ValidationRuleAnalysis
    ): string {
        if (rule.validationRule.description) {
            return `Validation Rule ${rule.validationRule.name} - ${rule.validationRule.description} associated to the Validation Rule Group ${validationRuleGroup.name} failed: ${rule.leftValue} ${rule.operator} ${rule.rightValue}`;
        } else {
            return `Validation Rule ${rule.validationRule.name} associated to the Validation Rule Group ${validationRuleGroup.name} failed: ${rule.leftValue} ${rule.operator} ${rule.rightValue}`;
        }
    }

    private saveIssues(
        issues: QualityAnalysisIssue[],
        analysis: QualityAnalysis,
        sectionId: Id
    ): FutureData<void> {
        if (issues.length === 0) return Future.success(undefined);
        return this.issueUseCase.getRelatedIssues(issues, sectionId).flatMap(dismissedIssues => {
            return this.issueUseCase.save(dismissedIssues, analysis.id);
        });
    }
}

type RunValidationsUseCaseOptions = {
    qualityAnalysisId: Id;
    validationRuleGroupId: Id;
    sectionId: Id;
    metadata: MetadataItem;
};
