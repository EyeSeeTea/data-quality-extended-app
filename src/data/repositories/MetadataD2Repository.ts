import _ from "lodash";

import { D2Api } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { MetadataRepository } from "$/domain/repositories/MetadataRepository";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Future } from "$/domain/entities/generic/Future";
import { Code, NamedCodeRef } from "$/domain/entities/Ref";
import { DATA_QUALITY_NAMESPACE } from "$/data/common/DataStoreConfig";

const METADATA_FIELDS = {
    trackedEntityTypes: {
        fields: { id: true, name: true, code: true },
    },
    dataSets: {
        fields: { id: true, name: true, code: true },
    },
    trackedEntityAttributes: {
        fields: { id: true, name: true, code: true },
    },
    optionSets: {
        fields: { id: true, name: true, code: true, options: { id: true, name: true, code: true } },
    },
    dataElements: {
        fields: { id: true, name: true, code: true },
    },
    programs: {
        fields: {
            id: true,
            name: true,
            code: true,
            programStages: { id: true, code: true, name: true, description: true, sortOrder: true },
        },
        order: "sortOrder:asc",
    },
    userGroups: {
        fields: { id: true, name: true, code: true, users: true },
    },
} as const;

export class MetadataD2Repository implements MetadataRepository {
    constructor(private api: D2Api) {}

    get(selectedQualityIssuesProgramCode: Code): FutureData<MetadataItem> {
        return this.getMetadataCodes(selectedQualityIssuesProgramCode).flatMap(metadataCodes => {
            return this.getGlobalOrgUnit().flatMap((globalOrgUnit: NamedCodeRef) => {
                return this.getIndexedMetadata(metadataCodes).map(
                    (metadata: MetadataItemWithoutOrgUnits) => {
                        const metadataItem: MetadataItem = {
                            ...metadata,
                            organisationUnits: { global: globalOrgUnit },
                        };
                        return metadataItem;
                    }
                );
            });
        });
    }

    private getIndexedMetadata(
        metadataCodes: MetadataCodes
    ): FutureData<MetadataItemWithoutOrgUnits> {
        const codeValues = <T extends Record<string, string>>(obj: T): string[] =>
            Object.values(obj);

        const metadata = {
            ...METADATA_FIELDS,

            trackedEntityTypes: {
                ...METADATA_FIELDS.trackedEntityTypes,
                filter: { name: { in: codeValues(metadataCodes.trackedEntityTypes) } },
            },

            dataSets: {
                ...METADATA_FIELDS.dataSets,
                filter: { code: { in: codeValues(metadataCodes.dataSets) } },
            },

            trackedEntityAttributes: {
                ...METADATA_FIELDS.trackedEntityAttributes,
                filter: { code: { in: codeValues(metadataCodes.trackedEntityAttributes) } },
            },

            optionSets: {
                ...METADATA_FIELDS.optionSets,
                filter: { code: { in: codeValues(metadataCodes.optionSets) } },
            },

            dataElements: {
                ...METADATA_FIELDS.dataElements,
                filter: { code: { in: codeValues(metadataCodes.dataElements) } },
            },

            programs: {
                ...METADATA_FIELDS.programs,
                filter: { code: { in: codeValues(metadataCodes.programs) } },
            },

            userGroups: {
                ...METADATA_FIELDS.userGroups,
                filter: { name: { in: codeValues(metadataCodes.userGroups) } },
            },
        };

        const d2Response = this.api.metadata.get(metadata);

        return apiToFuture(d2Response).flatMap(metadataRequest => {
            const metadataIndexed = _.mapValues(
                metadataRequest,
                (objs, key: keyof typeof metadata) => {
                    const objsByCode = _.keyBy(objs, obj => obj.code);
                    const objsByName = _.keyBy(objs, obj => obj.name);
                    const dictionary = metadataCodes[key];
                    return _.mapValues(dictionary, value => {
                        const obj = objsByCode[value] || objsByName[value];
                        if (!obj)
                            throw Error(`Metadata object not found: ${key}.code/name="${value}"`);
                        return obj;
                    });
                }
            );
            return Future.success(metadataIndexed as unknown as MetadataItemWithoutOrgUnits);
        });
    }

    private getMetadataCodes(selectedQualityIssuesProgramCode: Code): FutureData<MetadataCodes> {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);
        return apiToFuture(
            dataStore.get<MetadataCodes>(`programs-${selectedQualityIssuesProgramCode}`)
        ).flatMap(metadataItemCodes => {
            if (!metadataItemCodes)
                return Future.error(
                    new Error(
                        `Cannot found ${DATA_QUALITY_NAMESPACE}/programs-${selectedQualityIssuesProgramCode} in datastore`
                    )
                );

            return Future.success(metadataItemCodes);
        });
    }

    private getGlobalOrgUnit(): FutureData<NamedCodeRef> {
        return apiToFuture(
            this.api.models.organisationUnits.get({
                fields: { id: true, name: true, code: true },
                filter: { level: { eq: "1" } },
            })
        ).flatMap(d2Response => {
            const d2OrgUnit = d2Response.objects[0];
            if (!d2OrgUnit) return Future.error(new Error(`Global organisation unit not found`));

            return Future.success({
                id: d2OrgUnit.id,
                name: d2OrgUnit.name,
                code: d2OrgUnit.code,
            });
        });
    }
}

type MetadataItemWithoutOrgUnits = Omit<MetadataItem, "organisationUnits">;

type MetadataCodes = {
    trackedEntityTypes: { dataQuality: Code };
    dataSets: { module1: Code; module2: Code };
    optionSets: { action: Code; status: Code };
    trackedEntityAttributes: {
        endDate: Code;
        module: Code;
        name: Code;
        startDate: Code;
        status: Code;
        lastModification: Code;
        countries: Code;
        sequential: Code;
    };
    dataElements: {
        issueNumber: Code;
        azureUrl: Code;
        period: Code;
        country: Code;
        dataElement: Code;
        categoryOption: Code;
        description: Code;
        followUp: Code;
        status: Code;
        action: Code;
        actionDescription: Code;
        contactEmails: Code;
        comments: Code;
        correlative: Code;
        sectionNumber: Code;
    };
    programs: { qualityIssues: Code };
    userGroups: {
        dataCaptureModule1: Code;
        dataCaptureModule2And4: Code;
    };
};
