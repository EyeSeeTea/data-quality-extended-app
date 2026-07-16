import _ from "lodash";

import { FutureData } from "$/data/api-futures";
import { Id, Period } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import { DataElement } from "$/domain/entities/DataElement";
import { ModuleRepository } from "$/domain/repositories/ModuleRepository";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import { convertToNumberOrZero, getCurrentSection, isNumerical } from "./common/utils";
import { Maybe } from "$/utils/ts-utils";
import { DataValue } from "$/domain/entities/DataValue";
import { DataValueRepository } from "$/domain/repositories/DataValueRepository";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { IssueRepository } from "$/domain/repositories/IssueRepository";
import { UCIssue } from "./common/UCIssue";
import { UCAnalysis } from "./common/UCAnalysis";
import i18n from "$/utils/i18n";
import { UCDataValue } from "$/domain/usecases/common/UCDataValue";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export class RunPractitionersValidationUseCase {
    issueUseCase: UCIssue;
    analysysUseCase: UCAnalysis;
    private dataValueUseCase: UCDataValue;

    constructor(
        private analysisRepository: QualityAnalysisRepository,
        private moduleRepository: ModuleRepository,
        private dataValueRepository: DataValueRepository,
        private issueRepository: IssueRepository
    ) {
        this.analysysUseCase = new UCAnalysis(this.analysisRepository);
        this.issueUseCase = new UCIssue(this.issueRepository);
        this.dataValueUseCase = new UCDataValue(this.dataValueRepository);
    }

    execute(options: PractitionersValidationOptions): FutureData<QualityAnalysis> {
        if (options.dissagregationsIds.length === 0)
            return Future.error(new Error(i18n.t("No disaggregations selected")));
        return this.validatePractitionersValues(options);
    }

    private validatePractitionersValues(
        options: PractitionersValidationOptions
    ): FutureData<QualityAnalysis> {
        return this.analysysUseCase
            .getById(options.analysisId, options.metadata)
            .flatMap(analysis => {
                if (!analysis.module.name.toLowerCase().includes("module 1")) {
                    return Future.error(
                        new Error(i18n.t("This analysis is not available for this module"))
                    );
                }
                return this.getDataElementsByDisaggregationIds(
                    analysis.module.id,
                    options.dissagregationsIds
                ).flatMap(dataElements => {
                    const practitionerDataElements = this.groupDataElements(dataElements);

                    return this.issueUseCase
                        .getTotalIssuesBySection(analysis, options.sectionId, options.metadata)
                        .flatMap(totalIssues => {
                            return this.getDataValues(analysis).flatMap(dataValues => {
                                const practitionerDataValues = this.getPractitionerDataValues(
                                    dataValues,
                                    dataElements
                                );

                                const dvCountryPeriod =
                                    this.getDataValuesByCountryAndPeriod(practitionerDataValues);

                                const keyDataValues = _(dvCountryPeriod).keys().value();

                                const dataElementsWithValues = _(keyDataValues)
                                    .map((keyDataValue): Maybe<DataElementsLevelWithValues[]> => {
                                        const dataValuesOrgPeriod = dvCountryPeriod[keyDataValue];
                                        const [orgUnit, period] = keyDataValue.split(".");
                                        if (!orgUnit || !period) {
                                            throw Error("Cannot found orgUnit or period");
                                        }
                                        if (!dataValuesOrgPeriod) return [];
                                        const dataElementsWithDv =
                                            this.buildDataElementsWithDataValues(
                                                orgUnit,
                                                period,
                                                practitionerDataElements,
                                                dataValuesOrgPeriod,
                                                practitionerDataValues
                                            );
                                        return dataElementsWithDv;
                                    })
                                    .compact()
                                    .flatten()
                                    .value();

                                const issues = this.buildIssuesFromDataElements(
                                    dataElementsWithValues,
                                    options,
                                    analysis,
                                    totalIssues
                                );

                                const analysisToUpdate = this.analysysUseCase.updateAnalysis(
                                    analysis,
                                    options.sectionId,
                                    issues.length
                                );

                                return this.saveIssues(
                                    issues,
                                    analysisToUpdate,
                                    options.sectionId,
                                    options.metadata
                                );
                            });
                        });
                });
            });
    }

    private saveIssues(
        issues: QualityAnalysisIssue[],
        analysis: QualityAnalysis,
        sectionId: Id,
        metadata: MetadataItem
    ): FutureData<QualityAnalysis> {
        return this.issueUseCase
            .getRelatedIssues(issues, sectionId, metadata)
            .flatMap(dismissedIssues => {
                return this.issueUseCase
                    .save(dismissedIssues, analysis.id, metadata)
                    .flatMap(() => {
                        return this.analysisRepository
                            .save([analysis], metadata)
                            .map(() => analysis);
                    });
            });
    }

    private buildIssuesFromDataElements(
        dataElements: DataElementsLevelWithValues[],
        options: PractitionersValidationOptions,
        analysis: QualityAnalysis,
        totalIssues: number
    ): QualityAnalysisIssue[] {
        const missingPractitionersDataElements = _(dataElements)
            .map(dataElement => {
                const { children, dataValue } = dataElement;

                const isParentEqualToChildren = this.isParentEqualtoChildrenValues(
                    dataValue?.value,
                    children
                );
                const isThirdValueTotal = this.thirdValueAsTotal(dataValue?.value, children);

                if (isParentEqualToChildren || isThirdValueTotal) return undefined;

                const baseIssue = { ...dataElement, result: "issue" };
                if (!isParentEqualToChildren) {
                    return {
                        ...baseIssue,
                        issueMessage: `Value for autocalculated ${dataElement.dataElementParent.name} is incorrect`,
                    };
                } else {
                    return {
                        ...baseIssue,
                        issueMessage: `Values for ${dataElement.dataElementParent.name} subcategories are missing`,
                    };
                }
            })
            .compact()
            .value();

        const child1_1XORChild1_2DataElements = _(dataElements)
            .map(dataElement => this.isChild1XORChild2(dataElement, 1))
            .compact()
            .value();

        const doubleCountDataElements = _(dataElements)
            .map(dataElement => {
                const { children } = dataElement;
                const thirdDv = children[2]?.dataValue;
                if (!thirdDv) return undefined;

                const firstValue = convertToNumberOrZero(children[0]?.dataValue?.value);
                const secondValue = convertToNumberOrZero(children[1]?.dataValue?.value);
                const thirdValue = convertToNumberOrZero(thirdDv.value);

                if (thirdValue === 0) return undefined;

                const deviation = this.calculateDeviation(firstValue, secondValue, thirdValue);

                if (deviation > options.threshold) return undefined;
                return { ...dataElement, deviation };
            })
            .compact()
            .value();

        const missingIssues = missingPractitionersDataElements.map((dataElement, index) => {
            const dataValue = dataElement.dataValue
                ? dataElement.dataValue
                : _(dataElement.children).first()?.dataValue;
            if (!dataValue) {
                console.warn(
                    `Cannot get dataValue for dataElement: ${dataElement.dataElementParent.id}-${dataElement.dataElementParent.name}`
                );
                return undefined;
            }

            return this.buildIssueFromDataValue(
                dataElement.issueMessage,
                dataValue,
                totalIssues + (index + 1),
                analysis,
                options
            );
        });

        const child1XOR2Issues = child1_1XORChild1_2DataElements.map((dataElement, index) => {
            const childDataElement = dataElement.child.dataElement;
            const childDataValue = dataElement.child.dataValue;
            if (!childDataValue || !childDataElement) {
                const de = childDataElement || dataElement.dataElementParent;

                const message = childDataElement
                    ? `Cannot get dataValue for dataElement: ${de.id}-${de.name}`
                    : `Cannot get child dataElement or dataValue for parent dataElement: ${de.id}-${de.name}`;

                console.warn(message);
                return undefined;
            }

            return this.buildIssueFromDataValue(
                `Values for ${childDataElement.name} are missing`,
                childDataValue,
                totalIssues + missingIssues.length + (index + 1),
                analysis,
                options
            );
        });

        const doubleCountedIssues = doubleCountDataElements.map((dataElement, index) => {
            const dataValue = dataElement.dataValue
                ? dataElement.dataValue
                : _(dataElement.children).first()?.dataValue;
            if (!dataValue) {
                console.warn(
                    `Cannot get dataValue for dataElement: ${dataElement.dataElementParent.id}-${dataElement.dataElementParent.name}`
                );
                return undefined;
            }
            const description = `A double count was detected for ${
                dataElement.dataElementParent.name
            }, with a deviation of ${dataElement.deviation.toFixed(2)}% over the threshold ${
                options.threshold
            }% configured`;

            return this.buildIssueFromDataValue(
                description,
                dataValue,
                totalIssues + child1XOR2Issues.length + missingIssues.length + (index + 1),
                analysis,
                options
            );
        });

        return _([...missingIssues, ...child1XOR2Issues, ...doubleCountedIssues])
            .compact()
            .value();
    }

    private buildIssueFromDataValue(
        description: string,
        dataValue: DataValue,
        currentNumber: number,
        analysis: QualityAnalysis,
        options: PractitionersValidationOptions
    ) {
        const section = getCurrentSection(analysis, options.sectionId);
        const { dataElementId, period, countryId, categoryOptionComboId } = dataValue;
        const sectionNumber = this.issueUseCase.getSectionNumber(
            analysis.sections,
            options.sectionId
        );
        const prefix = `${analysis.sequential.value}-${sectionNumber}`;
        const issueNumber = this.issueUseCase.generateIssueNumber(currentNumber, prefix);
        return this.issueUseCase.buildDefaultIssue(
            {
                categoryOptionComboId,
                countryId,
                dataElementId,
                description,
                issueNumber,
                period,
                correlative: String(currentNumber),
            },
            section.id
        );
    }

    private thirdValueAsTotal(value: Maybe<string>, children: DataElementWithValue[]) {
        const firstValue = convertToNumberOrZero(children[0]?.dataValue?.value);
        const secondValue = convertToNumberOrZero(children[1]?.dataValue?.value);
        const thirdValue = convertToNumberOrZero(_(children).last()?.dataValue?.value);

        const parentValue = convertToNumberOrZero(value);

        return firstValue === 0 && secondValue === 0 && thirdValue === parentValue;
    }

    private isParentEqualtoChildrenValues(
        value: Maybe<string>,
        children: DataElementWithValue[]
    ): boolean {
        const sumChildren = _(children)
            .map(deChild => convertToNumberOrZero(deChild.dataValue?.value))
            .sum();
        return sumChildren === convertToNumberOrZero(value);
    }

    private isChild1XORChild2(
        dataElement: DataElementsLevelWithValues,
        parent?: number
    ): Maybe<
        DataElementsLevelWithValues & {
            result: string;
            child: DataElementWithValue;
        }
    > {
        const x_1 = this.findChild(1, dataElement, parent);
        const x_2 = this.findChild(2, dataElement, parent);

        if (!x_1) return undefined;
        if (!x_2) return undefined;

        const firstHasValue = isNumerical(x_1.dataValue?.value);
        const secondHasValue = isNumerical(x_2.dataValue?.value);

        if (x_1.dataValue && firstHasValue && !secondHasValue) {
            return {
                ...dataElement,
                result: "issue",
                child: this.buildChildFromSibling(x_2, x_1.dataValue),
            };
        } else if (!firstHasValue && x_2.dataValue && secondHasValue) {
            return {
                ...dataElement,
                result: "issue",
                child: this.buildChildFromSibling(x_1, x_2.dataValue),
            };
        } else {
            return undefined;
        }
    }

    private findChild(
        childLevel: number,
        dataElementGroup: DataElementsLevelWithValues,
        parent?: number
    ): Maybe<DataElementWithValue> {
        const { children, dataElementParent } = dataElementGroup;
        const parentLevel = dataElementParent.name.split(" - ")[0];

        if (parent !== undefined && String(parent) !== parentLevel) return undefined;

        return children.find(de => {
            const level = de.dataElement.name.split(" - ")[0];
            return level === `${parentLevel}.${childLevel}`;
        });
    }

    private buildChildFromSibling(
        childDataElement: DataElementWithValue,
        siblingDataValue: DataValue
    ): DataElementWithValue {
        const dataValue = childDataElement.dataValue
            ? childDataElement.dataValue
            : {
                  ...siblingDataValue,
                  dataElementId: childDataElement.dataElement.id,
                  value: "",
              };

        return {
            ...childDataElement,
            dataValue,
        };
    }

    private buildDataElementsWithDataValues(
        countryId: Id,
        period: Period,
        dataElements: DataElementsLevel[],
        dataValuesOrgPeriod: DataValue[],
        practitionerDataValues: DataValue[]
    ) {
        return _(dataElements)
            .map((dataElement): DataElementsLevelWithValues[] => {
                const options =
                    dataElement.dataElementParent.disaggregation?.options.map(option => option) ||
                    [];
                const dataElementsWithOptions = _(options)
                    .map(option => {
                        const parentDataValue = dataValuesOrgPeriod.find(dataValue => {
                            return (
                                dataValue.dataElementId === dataElement.dataElementParent.id &&
                                dataValue.countryId === countryId &&
                                dataValue.period === period &&
                                dataValue.categoryOptionComboId === option.id
                            );
                        });

                        const childrenDataValues = _(dataElement.children)
                            .map(deChild => {
                                const dataValue = practitionerDataValues.find(
                                    dv =>
                                        dv.dataElementId === deChild.id &&
                                        dv.countryId === countryId &&
                                        dv.period === period &&
                                        dv.categoryOptionComboId === option.id
                                );
                                return { dataValue, dataElement: deChild };
                            })
                            .compact()
                            .value();

                        if (
                            !parentDataValue &&
                            childrenDataValues.every(child => child.dataValue === undefined)
                        )
                            return undefined;

                        return {
                            dataElementParent: dataElement.dataElementParent,
                            dataValue: parentDataValue,
                            children: childrenDataValues,
                        };
                    })
                    .compact()
                    .value();

                return dataElementsWithOptions;
            })
            .flatten()
            .value();
    }

    private getDataValuesByCountryAndPeriod(dataValues: DataValue[]): Record<string, DataValue[]> {
        return _(dataValues)
            .groupBy(dataValue => {
                return `${dataValue.countryId}.${dataValue.period}`;
            })
            .value();
    }

    private calculateDeviation(first: number, second: number, third: number): number {
        const result = (first + second) / third;
        const deviation = Math.abs(result - 1) * 100;
        return deviation;
    }

    private getPractitionerDataValues(
        dataValues: DataValue[],
        dataElements: DataElement[]
    ): DataValue[] {
        return dataValues.filter(dataValue => {
            const dataElement = dataElements.find(
                dataElement => dataElement.id === dataValue.dataElementId
            );
            return dataElement ? true : false;
        });
    }

    private getDataValues(qualityAnalysis: QualityAnalysis): FutureData<DataValue[]> {
        return this.dataValueUseCase.get(
            qualityAnalysis.countriesAnalysis,
            [qualityAnalysis.module.id],
            qualityAnalysis.module.periodType,
            qualityAnalysis.startDate,
            qualityAnalysis.endDate
        );
    }

    private getDataElementsByDisaggregationIds(
        moduleId: Id,
        disaggregationIds: Id[]
    ): FutureData<DataElement[]> {
        return this.moduleRepository.getByIds([moduleId]).flatMap(modules => {
            const module = modules[0];
            if (!module) return Future.error(new Error(`Cannot find module: ${moduleId}`));
            const dataElements = _(module.dataElements)
                .map(dataElement => {
                    if (!dataElement.disaggregation) return undefined;
                    return disaggregationIds.includes(dataElement.disaggregation.id)
                        ? dataElement
                        : undefined;
                })
                .compact()
                .sortBy(dataElement => dataElement.name)
                .value();
            return Future.success(dataElements);
        });
    }

    private groupDataElements(dataElements: DataElement[]): DataElementsLevel[] {
        const parents = dataElements.filter(dataElementParent => {
            const nivel = dataElementParent.name.split(" - ")[0];
            if (!nivel) return false;
            return Number.isInteger(parseFloat(nivel)) && parseFloat(nivel) <= 3;
        });

        const result = parents.map(dataElementParent => {
            const parentLevel = dataElementParent.name.split(" - ")[0];
            const dataElementChildren = dataElements.filter(dataElementChild => {
                const level = dataElementChild.name.split(" - ")[0];
                if (!level) return false;
                const splitLevel = level.split(".");
                return (
                    splitLevel.length === 2 &&
                    splitLevel[0] === parentLevel &&
                    dataElementParent.disaggregation?.id === dataElementChild.disaggregation?.id
                );
            });

            return { dataElementParent: dataElementParent, children: dataElementChildren };
        });

        return result;
    }
}

type PractitionersValidationOptions = {
    analysisId: Id;
    dissagregationsIds: Id[];
    sectionId: Id;
    threshold: number;
    metadata: MetadataItem;
};

type DataElementsLevel = {
    dataElementParent: DataElement;
    children: DataElement[];
};

type DataElementsLevelWithValues = {
    dataElementParent: DataElement;
    dataValue: Maybe<DataValue>;
    children: DataElementWithValue[];
};

type DataElementWithValue = { dataElement: DataElement; dataValue: Maybe<DataValue> };
