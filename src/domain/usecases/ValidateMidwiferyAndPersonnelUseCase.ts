import _ from "lodash";

import { FutureData } from "$/data/api-futures";
import { DataElement } from "$/domain/entities/DataElement";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Id, Period } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import { DataValueRepository } from "$/domain/repositories/DataValueRepository";
import { ModuleRepository } from "$/domain/repositories/ModuleRepository";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import { DataValue } from "$/domain/entities/DataValue";
import { MidwiferyNursing } from "$/domain/entities/MidwiferyPersonnel";
import { SettingsRepository } from "$/domain/repositories/SettingsRepository";
import { SectionDisaggregation } from "$/domain/entities/Settings";
import { UCIssue } from "./common/UCIssue";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { IssueRepository } from "$/domain/repositories/IssueRepository";

import { UCAnalysis } from "./common/UCAnalysis";
import { UCDataValue } from "./common/UCDataValue";
import { getCurrentSection } from "./common/utils";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export class ValidateMidwiferyAndPersonnelUseCase {
    analysisUseCase: UCAnalysis;
    dataValueUseCase: UCDataValue;
    issueUseCase: UCIssue;
    constructor(
        private analysisRepository: QualityAnalysisRepository,
        private issueRepository: IssueRepository,
        private dataValueRepository: DataValueRepository,
        private moduleRepository: ModuleRepository,
        private settingsRepository: SettingsRepository
    ) {
        this.analysisUseCase = new UCAnalysis(this.analysisRepository);
        this.dataValueUseCase = new UCDataValue(this.dataValueRepository);
        this.issueUseCase = new UCIssue(this.issueRepository);
    }

    execute(options: ValidateMidwiferyAndPersonnelOptions): FutureData<QualityAnalysis> {
        return this.getSettingsSections(options).flatMap(disaggregations => {
            return this.validateMidwiferyAndPersonnel(options, disaggregations);
        });
    }

    private getSettingsSections(
        options: ValidateMidwiferyAndPersonnelOptions
    ): FutureData<SectionDisaggregation[]> {
        return this.settingsRepository
            .get(options.metadata.programs.qualityIssues.code)
            .flatMap(settings => {
                const section = settings.sections?.find(
                    section => section.id === options.sectionId
                );
                if (!section)
                    return Future.error(
                        new Error(`Cannot found section settings: ${options.sectionId}`)
                    );
                const onlySelectedDisaggregations = section.disaggregations.filter(disaggregation =>
                    options.disaggregationsIds.includes(disaggregation.id)
                );
                return Future.success(onlySelectedDisaggregations);
            });
    }

    private validateMidwiferyAndPersonnel(
        options: ValidateMidwiferyAndPersonnelOptions,
        disaggregations: SectionDisaggregation[]
    ): FutureData<QualityAnalysis> {
        return this.getAnalysis(options).flatMap(analysis => {
            return this.getDataElementsWithValues(analysis).flatMap(
                ({ dataElements, dataValues }) => {
                    const midwiferyNursingValues = this.getMidwiferyPersonnelValues(
                        dataValues,
                        dataElements,
                        disaggregations
                    );

                    return this.issueUseCase
                        .getTotalIssuesBySection(analysis, options.sectionId, options.metadata)
                        .flatMap(totalIssues => {
                            const issues = this.createIssues(
                                midwiferyNursingValues,
                                analysis,
                                options.sectionId,
                                totalIssues
                            );
                            return this.persistIssues(issues, analysis, options, issues.length);
                        });
                }
            );
        });
    }

    private persistIssues(
        issues: QualityAnalysisIssue[],
        analysis: QualityAnalysis,
        options: ValidateMidwiferyAndPersonnelOptions,
        totalIssues: number
    ): FutureData<QualityAnalysis> {
        return this.issueUseCase
            .getRelatedIssues(issues, options.sectionId, options.metadata)
            .flatMap(dismissedIssues => {
                return this.issueUseCase
                    .save(dismissedIssues, analysis.id, options.metadata)
                    .flatMap(() => {
                        const analysisToUpdate = this.analysisUseCase.updateAnalysis(
                            analysis,
                            options.sectionId,
                            totalIssues
                        );
                        return this.analysisRepository
                            .save([analysisToUpdate], options.metadata)
                            .flatMap(() => {
                                return Future.success(analysisToUpdate);
                            });
                    });
            });
    }

    private createIssues(
        midwiferyNursing: MidwiferyNursing[],
        analysis: QualityAnalysis,
        sectionId: Id,
        totalIssues: number
    ): QualityAnalysisIssue[] {
        const section = getCurrentSection(analysis, sectionId);
        const onlyGreaterMidwifery = midwiferyNursing.filter(
            midwifery => midwifery.isMidwiferyGreater
        );
        const sectionNumber = this.issueUseCase.getSectionNumber(analysis.sections, sectionId);
        return onlyGreaterMidwifery.map((midwifery, index) => {
            const currentNumber = totalIssues + (index + 1);
            const prefix = `${analysis.sequential.value}-${sectionNumber}`;
            const issueNumber = this.issueUseCase.generateIssueNumber(currentNumber, prefix);
            return this.issueUseCase.buildDefaultIssue(
                {
                    categoryOptionComboId: midwifery.combination.id,
                    countryId: midwifery.countryId,
                    period: midwifery.period,
                    dataElementId: midwifery.midwifery.dataElement.id,
                    description: "Midwifery personnel count is higher than Nursing personnel count",
                    issueNumber: issueNumber,
                    correlative: String(currentNumber),
                },
                section.id
            );
        });
    }

    private getMidwiferyPersonnelValues(
        dataValues: Record<string, DataValue[]>,
        dataElements: DataElement[],
        disaggregations: SectionDisaggregation[]
    ): MidwiferyNursing[] {
        const dataValuesByKeys = _(dataValues).keys().value();

        return _(dataValuesByKeys)
            .map((key): MidwiferyNursing[] => {
                const dvCountryPeriod = dataValues[key];
                const [countryId, period] = key.split(".");
                if (!countryId || !period) {
                    throw Error(`Cannot found country or period: ${key}`);
                }
                if (!dvCountryPeriod) return [];

                return _(disaggregations)
                    .map(settingDisaggregation => {
                        const currentDataElements = this.getDataElementsBySettingType(
                            settingDisaggregation,
                            dataElements
                        );
                        const dataElementsToCheck =
                            this.getDataElementsToCheck(settingDisaggregation);
                        if (this.isOccupation(settingDisaggregation)) {
                            const result = this.getOccupationValues(
                                currentDataElements,
                                dataElementsToCheck,
                                dvCountryPeriod,
                                period,
                                countryId
                            );
                            return result;
                        } else {
                            const result = this.getMidwiferyNursingValues(
                                dataElementsToCheck,
                                currentDataElements,
                                dvCountryPeriod,
                                period,
                                countryId
                            );
                            return result;
                        }
                    })
                    .flatten()
                    .value();
            })
            .flatten()
            .value();
    }

    private getMidwiferyNursingValues(
        dataElementsToCheck: string[][],
        dataElements: DataElement[],
        dataValues: DataValue[],
        period: Period,
        countryId: Id
    ) {
        return _(dataElementsToCheck)
            .flatMap(dataElementToCheck => {
                const [nursing, midwifery] = dataElementToCheck;
                if (!nursing || !midwifery) return [];
                const personnelDe = dataElements.find(de => de.originalName.includes(nursing));
                const midwiferyDe = dataElements.find(de => de.originalName.includes(midwifery));

                if (!personnelDe || !midwiferyDe) return [];

                const combinations = personnelDe?.disaggregation?.options || [];

                const result = _(combinations)
                    .map(combination => {
                        const personnelDv = dataValues.find(
                            dv =>
                                dv.dataElementId === personnelDe?.id &&
                                dv.categoryOptionComboId === combination.id
                        );
                        const midwiferyDv = dataValues.find(
                            dv =>
                                dv.dataElementId === midwiferyDe?.id &&
                                dv.categoryOptionComboId === combination.id
                        );

                        return MidwiferyNursing.build({
                            combination: combination,
                            midwifery: { dataElement: midwiferyDe, dataValue: midwiferyDv },
                            personnel: { dataElement: personnelDe, dataValue: personnelDv },
                            isMidwiferyGreater: false,
                            period: period,
                            countryId: countryId,
                        });
                    })
                    .value();

                return result;
            })
            .value();
    }

    private getOccupationValues(
        dataElements: DataElement[],
        dataElementsToCheck: string[][],
        dataValues: DataValue[],
        period: Period,
        countryId: Id
    ) {
        return _(dataElements)
            .flatMap(dataElement => {
                return _(dataElementsToCheck)
                    .map(dataElementToCheck => {
                        const [nursing, midwifery] = dataElementToCheck;
                        if (!nursing || !midwifery) return undefined;

                        const nursingCombination = dataElement.disaggregation?.options.find(
                            option => option.name === nursing
                        );
                        const midwiferyCombination = dataElement.disaggregation?.options.find(
                            option => option.name === midwifery
                        );

                        if (!nursingCombination || !midwiferyCombination) return undefined;

                        const nursingDv = dataValues.find(
                            dataValue =>
                                dataValue.dataElementId === dataElement.id &&
                                dataValue.categoryOptionComboId === nursingCombination?.id
                        );
                        const midwiferyDv = dataValues.find(
                            dataValue =>
                                dataValue.dataElementId === dataElement.id &&
                                dataValue.categoryOptionComboId === midwiferyCombination?.id
                        );

                        return MidwiferyNursing.build({
                            combination: midwiferyCombination,
                            midwifery: { dataElement: dataElement, dataValue: midwiferyDv },
                            personnel: { dataElement: dataElement, dataValue: nursingDv },
                            isMidwiferyGreater: false,
                            period: period,
                            countryId: countryId,
                        });
                    })
                    .compact()
                    .value();
            })
            .value();
    }

    private getDataElementsToCheck(sectionDisaggregation: SectionDisaggregation): string[][] {
        if (sectionDisaggregation.type === "edu_occupations") {
            return [
                ["2. Nursing Professionals", "5. Midwifery Professionals"],
                ["3. Nursing Associate Professionals", "6. Midwifery Associate Professionals"],
                ["4. Nurses not further defined", "7. Midwives not further defined"],
            ];
        } else if (sectionDisaggregation.type === "key_occupations") {
            return [["2. Nursing Personnel", "3. Midwifery Personnel"]];
        } else {
            return [["2 - Nursing Personnel", "3 - Midwifery personnel"]];
        }
    }

    private getDataElementsBySettingType(
        settingDisaggregation: SectionDisaggregation,
        dataElements: DataElement[]
    ): DataElement[] {
        if (this.isOccupation(settingDisaggregation)) {
            return dataElements.filter(dataElement => {
                const disaggregationFromName = dataElement.name.split(" - ")[0];
                return (
                    settingDisaggregation.disaggregationId === dataElement.disaggregation?.id &&
                    disaggregationFromName === settingDisaggregation.id
                );
            });
        } else {
            return dataElements.filter(
                dataElement => dataElement.disaggregation?.id === settingDisaggregation.id
            );
        }
    }

    private isOccupation(sectionDisaggregation: SectionDisaggregation): boolean {
        return (
            sectionDisaggregation.type === "edu_occupations" ||
            sectionDisaggregation.type === "key_occupations"
        );
    }

    private getAnalysis(
        options: ValidateMidwiferyAndPersonnelOptions
    ): FutureData<QualityAnalysis> {
        return this.analysisUseCase.getById(options.analysisId, options.metadata);
    }

    private getDataElementsWithValues(
        analysis: QualityAnalysis
    ): FutureData<{ dataValues: Record<string, DataValue[]>; dataElements: DataElement[] }> {
        return this.moduleRepository.getByIds([analysis.module.id]).flatMap(modules => {
            const module = modules[0];
            if (!module) throw Error(`Module not found: ${analysis.module.id}`);

            const sorted = _(module.dataElements)
                .sortBy(dataElement => dataElement.name)
                .value();

            return this.getDataValues(analysis, sorted);
        });
    }

    private getDataValues(
        analysis: QualityAnalysis,
        dataElements: DataElement[]
    ): FutureData<{ dataValues: Record<string, DataValue[]>; dataElements: DataElement[] }> {
        return this.dataValueUseCase
            .get(
                analysis.countriesAnalysis,
                [analysis.module.id],
                [analysis.startDate, analysis.endDate]
            )
            .flatMap(dataValues => {
                const dataElementsByKey = _(dataElements)
                    .keyBy(de => de.id)
                    .value();

                const filteredDataValues = dataValues.filter(dataValue =>
                    Boolean(dataElementsByKey[dataValue.dataElementId])
                );

                const dvByCountryPeriod =
                    this.dataValueUseCase.getByCountryAndPeriod(filteredDataValues);

                return Future.success({ dataElements, dataValues: dvByCountryPeriod });
            });
    }
}

type ValidateMidwiferyAndPersonnelOptions = {
    analysisId: Id;
    sectionId: Id;
    disaggregationsIds: Id[];
    metadata: MetadataItem;
};
