import { D2Api } from "$/types/d2-api";

import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Module } from "$/domain/entities/Module";
import { ModuleRepository } from "$/domain/repositories/ModuleRepository";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { getDefaultModules } from "$/data/common/D2Module";
import { DataElement } from "$/domain/entities/DataElement";
import _ from "$/domain/entities/generic/Collection";
import { Maybe } from "$/utils/ts-utils";
import { D2CategoryCombo } from "@eyeseetea/d2-api/2.36";

export class ModuleD2Repository implements ModuleRepository {
    constructor(private api: D2Api) {}

    getByIds(ids: string[]): FutureData<Module[]> {
        return apiToFuture(
            this.api.models.dataSets.get({
                fields: {
                    id: true,
                    displayName: true,
                    code: true,
                    sections: {
                        id: true,
                        dataElements: { id: true },
                    },
                    dataSetElements: {
                        dataElement: {
                            id: true,
                            code: true,
                            formName: true,
                            displayFormName: true,
                            valueType: true,
                            categoryCombo: {
                                id: true,
                                code: true,
                                name: true,
                                displayName: true,
                                categories: {
                                    id: true,
                                    name: true,
                                    categoryOptions: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                categoryOptionCombos: { id: true, name: true },
                            },
                        },
                        categoryCombo: {
                            id: true,
                            code: true,
                            displayName: true,
                            categories: {
                                id: true,
                                name: true,
                                categoryOptions: { id: true, name: true },
                            },
                            categoryOptionCombos: { id: true, name: true },
                        },
                    },
                },
                filter: { id: { in: ids } },
            })
        ).map(d2Response => {
            return d2Response.objects.map((d2DataSet): Module => {
                const sectionDataElements = d2DataSet.sections
                    .flatMap(section => section.dataElements)
                    .map(dataElement => dataElement.id);

                return {
                    id: d2DataSet.id,
                    code: d2DataSet.code,
                    name: d2DataSet.displayName,
                    dataElements: _(d2DataSet.dataSetElements)
                        .map((d2DataSetElement): Maybe<DataElement> => {
                            if (!sectionDataElements.includes(d2DataSetElement.dataElement.id))
                                return undefined;
                            const d2CategoryCombo =
                                d2DataSetElement.categoryCombo ||
                                d2DataSetElement.dataElement.categoryCombo;
                            return {
                                id: d2DataSetElement.dataElement.id,
                                code: d2DataSetElement.dataElement.code,
                                originalName: d2DataSetElement.dataElement.formName,
                                name: d2DataSetElement.dataElement.displayFormName,
                                isNumber:
                                    d2DataSetElement.dataElement.valueType === "NUMBER" ||
                                    d2DataSetElement.dataElement.valueType.includes("INTEGER"),
                                disaggregation: d2CategoryCombo
                                    ? {
                                          id: d2CategoryCombo.id,
                                          name: d2CategoryCombo.displayName,
                                          options: this.getCocOrdered(
                                              d2CategoryCombo as D2CategoryCombo
                                          ),
                                      }
                                    : undefined,
                            };
                        })
                        .compact()
                        .value(),
                    disaggregations: [],
                };
            });
        });
    }

    get(metadata: MetadataItem): FutureData<Module[]> {
        return Future.success(getDefaultModules(metadata));
    }

    private getCocOrdered(categoryCombo: D2CategoryCombo) {
        const categoryOptionsNamesArray = categoryCombo.categories.map(c => {
            return c.categoryOptions.flatMap(co => co.name);
        });

        const cocOrderArray = this.makeCocOrderArray(categoryOptionsNamesArray);
        const result = cocOrderArray.flatMap(cocOrdered => {
            const match = categoryCombo.categoryOptionCombos.find(coc => {
                return coc.name === cocOrdered;
            });
            return match ? match : [];
        });

        return result;
    }

    private makeCocOrderArray(namesArray: string[][]): string[] {
        return namesArray.reduce((prev, current) => {
            return prev
                .map(prevValue => {
                    return current.map(currentValue => {
                        return `${prevValue}, ${currentValue}`;
                    });
                })
                .reduce((prevCombo, currentCombo) => {
                    return prevCombo.concat(currentCombo);
                });
        });
    }
}
