import { D2Api } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Id } from "$/domain/entities/Ref";
import _ from "$/domain/entities/generic/Collection";
import { DataElement } from "$/domain/entities/DataElement";
import { MetadataPick } from "$/types/d2-api";

export class D2DataElement {
    constructor(private api: D2Api) {}

    getByIds(ids: Id[]): FutureData<DataElement[]> {
        return apiToFuture(
            this.api.models.dataElements.get({
                fields: dataElementFields,
                filter: { id: { in: ids } },
            })
        ).map(d2Response => {
            return d2Response.objects.map((d2DataElement: D2DataElementEntity): DataElement => {
                return {
                    id: d2DataElement.id,
                    code: d2DataElement.code,
                    originalName: d2DataElement.formName,
                    name:
                        d2DataElement.displayFormName ||
                        d2DataElement.displayShortName ||
                        d2DataElement.displayName,
                    isNumber:
                        d2DataElement.valueType === "NUMBER" ||
                        d2DataElement.valueType.includes("INTEGER"),
                    disaggregation: d2DataElement.categoryCombo
                        ? {
                              id: d2DataElement.categoryCombo.id,
                              name: d2DataElement.categoryCombo.displayName,
                              options: d2DataElement.categoryCombo.categoryOptionCombos,
                          }
                        : undefined,
                };
            });
        });
    }
}

const dataElementFields = {
    id: true,
    formName: true,
    code: true,
    displayFormName: true,
    displayName: true,
    displayShortName: true,
    valueType: true,
    categoryCombo: {
        id: true,
        displayName: true,
        categoryOptionCombos: { id: true, name: true },
    },
} as const;

type D2DataElementEntity = MetadataPick<{
    dataElements: { fields: typeof dataElementFields };
}>["dataElements"][number];
