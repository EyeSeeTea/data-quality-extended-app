import _ from "lodash";
import { D2Api, MetadataPick } from "$/types/d2-api";
import { DataQualityIssuesProgramConfigRepository } from "$/domain/repositories/DataQualityIssuesProgramConfigRepository";
import { apiToFuture, FutureData } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";
import { Code } from "$/domain/entities/Ref";
import {
    buildProgramConfigByProgramCode,
    DatastoreProgramConfig,
} from "$/data/repositories/entities/DatastoreProgramConfig";
import { DATA_QUALITY_NAMESPACE, dataStoreKeys } from "$/data/common/DataStoreConfig";
import { DataStore } from "@eyeseetea/d2-api/api";

export class DataQualityIssuesProgramConfigD2Repository
    implements DataQualityIssuesProgramConfigRepository
{
    constructor(private api: D2Api) {}

    save(configuration: DataQualityIssuesProgramConfig): FutureData<void> {
        if (!configuration.selectedProgramCode) {
            return Future.error(new Error("No program selected"));
        }
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);

        return this.getProgramConfigTemplate(dataStore).flatMap(template => {
            const datastoreProgramConfig: DatastoreProgramConfig = buildProgramConfigByProgramCode(
                template,
                configuration.selectedProgramCode,
                configuration.selectedModuleCodes
            );

            return this.checkProgramMetadataCodes(
                configuration.selectedProgramCode,
                datastoreProgramConfig
            ).flatMap(programMetadata => {
                return this.saveInDatastorePrograms(
                    dataStore,
                    programMetadata.code,
                    programMetadata.name,
                    configuration.selectedModuleCodes
                ).flatMap(() => {
                    return this.saveProgramConfig(
                        dataStore,
                        programMetadata.code,
                        datastoreProgramConfig
                    ).flatMap(() => {
                        return this.saveProgramSettings(
                            dataStore,
                            programMetadata.code,
                            configuration.defaultSettings
                        );
                    });
                });
            });
        });
    }

    private checkProgramMetadataCodes(
        programCode: Code,
        datastoreProgramConfig: DatastoreProgramConfig
    ): FutureData<D2Program> {
        return this.getProgramMetadata(programCode).flatMap(programMetadata => {
            const validProgramStages = this.checkProgramStages(
                datastoreProgramConfig,
                programMetadata.programStages
            );

            const validTrackedEntityAttributes = this.checkTrackedEntityAttributes(
                datastoreProgramConfig,
                programMetadata.programTrackedEntityAttributes
            );

            const validTrackedEntityType =
                programMetadata.trackedEntityType?.name ===
                datastoreProgramConfig.trackedEntityTypes.dataQuality;

            if (!validProgramStages || !validTrackedEntityAttributes || !validTrackedEntityType) {
                const reasons = [
                    !validProgramStages ? "program stages data elements" : undefined,
                    !validTrackedEntityAttributes ? "tracked entity attributes" : undefined,
                    !validTrackedEntityType ? "tracked entity type" : undefined,
                ].filter(Boolean);

                return Future.error(
                    new Error(
                        `Program metadata does not match expected configuration. Invalid: ${reasons.join(
                            ", "
                        )}.`
                    )
                );
            }

            return Future.success(programMetadata);
        });
    }

    private checkTrackedEntityAttributes(
        datastoreProgramConfig: DatastoreProgramConfig,
        programTrackedEntityAttributes: D2Program["programTrackedEntityAttributes"]
    ): boolean {
        const expectedTEAs: Code[] = Object.values(datastoreProgramConfig.trackedEntityAttributes);

        const actualTEAs = new Set(
            (programTrackedEntityAttributes ?? []).map(p => p.trackedEntityAttribute.code)
        );
        const missingTEAs = expectedTEAs.filter(code => !actualTEAs.has(code));

        return missingTEAs.length === 0;
    }

    private checkProgramStages(
        datastoreProgramConfig: DatastoreProgramConfig,
        programStages: D2Program["programStages"]
    ): boolean {
        const expectedStageDEs: Code[] = Object.values(datastoreProgramConfig.dataElements);
        const wrongProgramStages = (programStages ?? []).flatMap(stage => {
            const stageDEs = (stage.programStageDataElements ?? []).map(
                psde => psde.dataElement.code
            );

            const missingDEs = expectedStageDEs.filter(code => !stageDEs.includes(code));

            const actionCode = datastoreProgramConfig.dataElements.action;
            const statusCode = datastoreProgramConfig.dataElements.status;

            const action = (stage.programStageDataElements ?? []).find(
                psde => psde.dataElement.code === actionCode
            );
            const status = (stage.programStageDataElements ?? []).find(
                psde => psde.dataElement.code === statusCode
            );

            const actionOptionSet = action?.dataElement.optionSet?.code;
            const statusOptionSet = status?.dataElement.optionSet?.code;

            const wrongActionOptionSet =
                actionOptionSet !== datastoreProgramConfig.optionSets.action;
            const wrongStatusOptionSet =
                statusOptionSet !== datastoreProgramConfig.optionSets.status;

            if (missingDEs.length === 0 && !wrongActionOptionSet && !wrongStatusOptionSet)
                return [];

            return [
                {
                    stageCode: stage.code,
                    missingDEs,
                    optionSetIssues: [
                        ...(wrongActionOptionSet
                            ? [
                                  {
                                      dataElement: actionCode,
                                      expected: datastoreProgramConfig.optionSets.action,
                                      actual: actionOptionSet,
                                  },
                              ]
                            : []),
                        ...(wrongStatusOptionSet
                            ? [
                                  {
                                      dataElement: statusCode,
                                      expected: datastoreProgramConfig.optionSets.status,
                                      actual: statusOptionSet,
                                  },
                              ]
                            : []),
                    ],
                },
            ];
        });

        return wrongProgramStages.length === 0;
    }

    private getProgramMetadata(programCode: Code): FutureData<D2Program> {
        return apiToFuture(
            this.api.models.programs.get({
                fields: programFields,
                filter: {
                    code: { eq: programCode },
                },
            })
        ).flatMap(programs => {
            const program: D2Program | undefined = programs.objects[0];
            if (!program) {
                return Future.error(new Error(`Program with code ${programCode} not found`));
            }
            return Future.success(program);
        });
    }

    private getProgramConfigTemplate(dataStore: DataStore): FutureData<DatastoreProgramConfig> {
        return apiToFuture(
            dataStore.get<DatastoreProgramConfig>(dataStoreKeys.PROGRAMS_TEMPLATE)
        ).flatMap(template => {
            if (!template)
                return Future.error(
                    new Error(`Cannot found program configuration template in datastore`)
                );

            return Future.success(template);
        });
    }

    private saveProgramConfig(
        dataStore: DataStore,
        programCode: Code,
        datastoreProgramConfig: DatastoreProgramConfig
    ): FutureData<void> {
        return apiToFuture(dataStore.save(`programs-${programCode}`, datastoreProgramConfig))
            .map(() => undefined)
            .mapError(err => new Error(`Cannot save program config. ${String(err)}`));
    }

    private saveInDatastorePrograms(
        dataStore: DataStore,
        programCode: Code,
        programName: string,
        dataSets: Code[]
    ): FutureData<void> {
        return apiToFuture(dataStore.get<DatastoreProgram[]>(dataStoreKeys.PROGRAMS)).flatMap(
            programs => {
                if (!programs) return Future.error(new Error(`Cannot found programs in datastore`));
                const programsUpdated = [
                    ...programs.filter(p => p.code !== programCode),
                    { code: programCode, dataSets, name: programName },
                ];

                return apiToFuture(dataStore.save(dataStoreKeys.PROGRAMS, programsUpdated))
                    .map(() => undefined)
                    .mapError(
                        err => new Error(`Cannot save programs in datastore. ${String(err)}`)
                    );
            }
        );
    }

    private saveProgramSettings(
        dataStore: DataStore,
        programCode: Code,
        defaultSettings: DataQualityIssuesProgramConfig["defaultSettings"]
    ): FutureData<void> {
        return apiToFuture(
            dataStore.save(`settings-${programCode}`, { defaultConfig: defaultSettings })
        )
            .map(() => undefined)
            .mapError(err => new Error(`Cannot save program settings. ${String(err)}`));
    }
}

const programFields = {
    code: true,
    name: true,
    programTrackedEntityAttributes: {
        trackedEntityAttribute: {
            code: true,
        },
    },
    trackedEntityType: {
        name: true,
    },
    programStages: {
        code: true,
        programStageDataElements: {
            dataElement: {
                code: true,
                optionSet: { code: true },
            },
        },
    },
} as const;

export type D2Program = MetadataPick<{
    programs: {
        fields: typeof programFields;
    };
}>["programs"][number];

type DatastoreProgram = {
    code: Code;
    name: string;
    dataSets: Code[];
};
