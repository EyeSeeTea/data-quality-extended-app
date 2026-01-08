import {
    D2TrackerEnrollment,
    DataValue,
    D2TrackerEvent,
    D2Api,
    D2TrackerTrackedEntity,
} from "$/types/d2-api";
import {
    QualityAnalysisOptions,
    QualityAnalysisPaginated,
    QualityAnalysisRepository,
} from "$/domain/repositories/QualityAnalysisRepository";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Id } from "$/domain/entities/Ref";
import _ from "$/domain/entities/generic/Collection";
import { HashMap } from "$/domain/entities/generic/HashMap";
import { Maybe } from "$/utils/ts-utils";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { Future } from "$/domain/entities/generic/Future";
import { MetadataItem, ProgramStage } from "$/domain/entities/MetadataItem";
import {
    QualityAnalysisStatus,
    qualityAnalysisStatus,
} from "$/domain/entities/QualityAnalysisStatus";
import { Module } from "$/domain/entities/Module";
import {
    QualityAnalysisSection,
    SECTION_PENDING_STATE,
} from "$/domain/entities/QualityAnalysisSection";
import { D2User } from "$/data/common/D2User";
import { D2CategoryOption } from "$/data/common/D2CategoryOption";
import { D2DataElement } from "$/data/common/D2DataElement";
import { D2OrgUnit } from "$/data/common/D2Country";
import { getUid } from "$/utils/uid";
import { getDefaultModules } from "$/data/common/D2Module";
import { buildTrackerResponse, getProgramStageIndexById } from "$/data/common/utils";
import { DATA_QUALITY_NAMESPACE } from "$/data/common/DataStoreConfig";

export class QualityAnalysisD2Repository implements QualityAnalysisRepository {
    d2DataElement: D2DataElement;
    d2CategoryOption: D2CategoryOption;
    d2OrgUnit: D2OrgUnit;
    d2User: D2User;
    allowedModules: Module[];

    constructor(private api: D2Api, private metadata: MetadataItem) {
        this.d2DataElement = new D2DataElement(this.api);
        this.d2CategoryOption = new D2CategoryOption(this.api);
        this.d2OrgUnit = new D2OrgUnit(this.api);
        this.d2User = new D2User(this.api);
        this.allowedModules = getDefaultModules(this.metadata);
    }

    get(options: QualityAnalysisOptions): FutureData<QualityAnalysisPaginated> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                ouMode: "ALL",
                fields: { orgUnit: true, trackedEntity: true, attributes: true, enrollments: true },
                program: this.getIdOrThrow(this.metadata.programs.qualityIssues?.id),
                page: options.pagination.page,
                pageSize: options.pagination.pageSize,
                // TODO: Update d2-api to support para "trackedEntities" since "trackedEntity"
                // is deprecated
                // @ts-ignore
                trackedEntities: options.filters.ids ? options.filters.ids.join(";") : undefined,
                filter: this.buildFilters(options.filters)?.join(",") || undefined,
                // @ts-ignore
                order: this.buildOrder(options.sorting) || undefined,
                totalPages: true,
            })
        ).flatMap(d2Response => {
            const instances = buildTrackerResponse(d2Response).instances;
            const teiIds = _(instances)
                .map(instance => instance.trackedEntity)
                .compact()
                .value();

            return Future.joinObj({
                sectionInformation: this.getSectionInformation(
                    teiIds,
                    this.metadata.programs.qualityIssues.programStages
                ),
            }).map(({ sectionInformation }) => {
                return {
                    pagination: {
                        pageSize: d2Response.pageSize,
                        // @ts-ignore
                        pageCount: d2Response.pageCount,
                        page: d2Response.page,
                        total: d2Response.total || 0,
                    },
                    rows: _(instances)
                        .map(tei => this.buildQualityAnalysis(tei, sectionInformation))
                        .compact()
                        .value(),
                };
            });
        });
    }

    getById(id: string): FutureData<QualityAnalysis> {
        return this.get({
            filters: {
                endDate: undefined,
                ids: [id],
                module: undefined,
                name: undefined,
                startDate: undefined,
                status: undefined,
            },
            pagination: {
                page: 1,
                pageSize: 1e6,
            },
            sorting: {
                field: "name",
                order: "desc",
            },
        }).flatMap(analysis => {
            const firstAnalysis = analysis.rows[0];
            if (!firstAnalysis)
                return Future.error(new Error(`Cannot find qualityAnalysis: ${id}`));
            return Future.success(firstAnalysis);
        });
    }

    save(qualityAnalysis: QualityAnalysis[]): FutureData<void> {
        const qualityIds = qualityAnalysis.map(record => record.id);
        const $requests = Future.sequential(
            _(qualityIds)
                .chunk(50)
                .map(qaIds => {
                    return Future.joinObj({
                        saveTeis: this.buildTeisRequests(qaIds, qualityAnalysis),
                        saveSections: this.buildSectionsRequests(qaIds, qualityAnalysis),
                    });
                })
                .value()
        );

        return Future.sequential([$requests]).flatMap(() => {
            return Future.success(undefined);
        });
    }

    remove(id: Id): FutureData<void> {
        return apiToFuture(
            this.api.tracker.postAsync(
                { importStrategy: "DELETE" },
                { trackedEntities: [{ trackedEntity: id }] }
            )
        ).flatMap(d2JobResponse => {
            return apiToFuture(
                // this rule is being applied outside the context of testing-library
                // more info here: https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/await-async-utils.md
                // eslint-disable-next-line testing-library/await-async-utils
                this.api.system.waitFor("TRACKER_IMPORT_JOB", d2JobResponse.response.id)
            ).flatMap(d2Response => {
                if (d2Response?.status === "ERROR") {
                    return Future.error(new Error(d2Response.message));
                } else {
                    const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);
                    return apiToFuture(dataStore.delete(id)).flatMap(() => {
                        return Future.success(undefined);
                    });
                }
            });
        });
    }

    private getSectionInformation(teiIds: Id[], programStages: ProgramStage[]) {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);
        const $requests = _(teiIds)
            .map(id => {
                return apiToFuture(dataStore.get<Maybe<D2AnalysisDataStore>>(id)).map(
                    d2Response => {
                        return {
                            id: id,
                            extraInfo: this.getSectionsInfoFromStorage(programStages, d2Response),
                        };
                    }
                );
            })
            .compact()
            .value();

        return Future.parallel($requests, { concurrency: 5 }).map(response => {
            const onlyDefinedStatus = _(response)
                .map(record => {
                    if (!record.extraInfo) return undefined;
                    return record;
                })
                .compact()
                .value();
            return onlyDefinedStatus;
        });
    }

    private getSectionsInfoFromStorage(
        programStages: ProgramStage[],
        response: Maybe<D2AnalysisDataStore>
    ): SectionInfo[] {
        return programStages.map(programStage => {
            const section = response?.sections?.find(section => section.id === programStage.id);
            return { id: programStage.id, status: section?.status || SECTION_PENDING_STATE };
        });
    }

    private buildSectionsRequests(qaIds: string[], qualityAnalysis: QualityAnalysis[]) {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);
        const $requests = _(qaIds)
            .map(qualityId => {
                const qAnalysis = qualityAnalysis.find(qa => qa.id === qualityId);
                if (!qAnalysis) return undefined;
                if (qAnalysis.sections.length === 0) return undefined;
                const sections = qAnalysis.sections.map(section => {
                    return { id: section.id, status: section.status };
                });
                return apiToFuture(
                    dataStore.save(qualityId, { sections: sections }).map(response => {
                        if (response.status >= 400) {
                            return Future.error(
                                new Error(`Cannot save section for TEI: ${qualityId}`)
                            );
                        } else {
                            return Future.success(undefined);
                        }
                    })
                );
            })
            .compact()
            .value();
        return Future.sequential($requests);
    }

    private buildTeisRequests(qaIds: string[], qualityAnalysis: QualityAnalysis[]) {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                ouMode: "ALL",
                program: this.metadata.programs.qualityIssues.id,
                fields: { $all: true },
                trackedEntity: qaIds.join(";"),
            })
        ).flatMap(d2Response => {
            const instances = buildTrackerResponse(d2Response).instances;
            const qualityAnalysisToPost = qaIds.map(qaId => {
                const existingTei = instances.find(d2Tei => d2Tei.trackedEntity === qaId);
                const qAnalysis = qualityAnalysis.find(qai => qai.id === qaId);
                if (!qAnalysis) {
                    throw Error(`Cannot find qualityAnalysis: ${qaId}`);
                }

                const enrollments = this.buildEnrollmentsFromQualityAnalysis(
                    existingTei,
                    qAnalysis,
                    qAnalysis.id
                );

                const attributes = this.buildAttributesFromQualityAnalysis(existingTei, qAnalysis);

                return {
                    ...(existingTei || {}),
                    trackedEntityType: this.metadata.trackedEntityTypes.dataQuality.id,
                    trackedEntity: qAnalysis.id,
                    orgUnit: this.metadata.organisationUnits.global.id,
                    attributes: attributes,
                    enrollments: [enrollments],
                };
            });

            return apiToFuture(
                this.api.tracker.post({}, { trackedEntities: qualityAnalysisToPost })
            ).flatMap(res => {
                if (res.status === "ERROR") {
                    return Future.error(new Error(res.message));
                } else {
                    return Future.success(qualityAnalysisToPost);
                }
            });
        });
    }

    private buildAttributesFromQualityAnalysis(
        existingTei: Maybe<D2TrackerTrackedEntity>,
        qualityAnalysis: QualityAnalysis
    ) {
        const existingAttributes = existingTei?.attributes || [];
        const currentAttributes = [
            {
                attribute: this.metadata.trackedEntityAttributes.sequential.id,
                value: qualityAnalysis.sequential.value,
            },
            {
                attribute: this.metadata.trackedEntityAttributes.countries.id,
                value: qualityAnalysis.countriesAnalysis.join(","),
            },
            {
                attribute: this.metadata.trackedEntityAttributes.endDate.id,
                value: qualityAnalysis.endDate,
            },
            {
                attribute: this.metadata.trackedEntityAttributes.module.id,
                value: qualityAnalysis.module.id,
            },
            {
                attribute: this.metadata.trackedEntityAttributes.startDate.id,
                value: qualityAnalysis.startDate,
            },
            {
                attribute: this.metadata.trackedEntityAttributes.status.id,
                value: qualityAnalysis.status as string,
            },
            {
                attribute: this.metadata.trackedEntityAttributes.name.id,
                value: qualityAnalysis.name,
            },
            {
                attribute: this.metadata.trackedEntityAttributes.lastModification.id,
                value: qualityAnalysis.lastModification,
            },
        ];
        return currentAttributes.map(attribute => {
            const d2Attribute = existingAttributes.find(dv => dv.attribute === attribute.attribute);
            return d2Attribute ? { ...d2Attribute, value: attribute.value } : attribute;
        });
    }

    private buildEnrollmentsFromQualityAnalysis(
        existingTei: Maybe<D2TrackerTrackedEntity>,
        qualityAnalysis: QualityAnalysis,
        teiId: Id
    ): D2TrackerEnrollment {
        const currentDate = new Date().toISOString();
        const firstEnrollment = _(existingTei?.enrollments || []).first();
        return {
            ...(firstEnrollment || {}),
            createdAt: this.getValueOrDefault(firstEnrollment?.createdAt, currentDate),
            createdAtClient: this.getValueOrDefault(firstEnrollment?.createdAtClient, currentDate),
            enrolledAt: this.getValueOrDefault(firstEnrollment?.enrolledAt, currentDate),
            followUp: firstEnrollment?.followUp || false,
            deleted: firstEnrollment?.deleted || false,
            occurredAt: this.getValueOrDefault(firstEnrollment?.occurredAt, currentDate),
            storedBy: firstEnrollment?.storedBy || "",
            orgUnit: this.metadata.organisationUnits.global.id,
            orgUnitName: this.getValueOrDefault(firstEnrollment?.orgUnitName),
            program: this.metadata.programs.qualityIssues.id,
            enrollment:
                firstEnrollment?.enrollment || getUid(`quality-analysis-enrollment_${teiId}`),
            relationships: [],
            attributes: [],
            notes: [],
            status: firstEnrollment?.status || "ACTIVE",
            updatedAt: this.getValueOrDefault(firstEnrollment?.updatedAt, currentDate),
            updatedAtClient: this.getValueOrDefault(firstEnrollment?.updatedAtClient, currentDate),
            events: _(firstEnrollment?.events || [])
                .map(event => {
                    const section = qualityAnalysis.sections.find(
                        section => section.id === event.programStage
                    );
                    if (!section) return event;
                    const issue = section.issues.find(issue => issue.id === event.event);
                    if (!issue) return undefined;

                    return { ...event, dataValues: this.getDataValuesFromIssues(event, issue) };
                })
                .compact()
                .value(),
        };
    }

    private getDataValuesFromIssues(
        event: D2TrackerEvent,
        issue: QualityAnalysisIssue
    ): DataValue[] {
        const programStageIndex = getProgramStageIndexById(issue.type, this.metadata);

        const currentDataValues = [
            {
                dataElement: this.metadata.dataElements.correlative.id,
                value: this.getValueOrDefault(issue.correlative),
            },
            {
                dataElement: this.metadata.dataElements.action.id,
                value: this.getValueOrDefault(issue.action?.code),
            },
            {
                dataElement: this.metadata.dataElements.actionDescription.id,
                value: this.getValueOrDefault(issue.actionDescription),
            },
            {
                dataElement: this.metadata.dataElements.azureUrl.id,
                value: this.getValueOrDefault(issue.azureUrl),
            },
            {
                dataElement: this.metadata.dataElements.contactEmails.id,
                value: this.getValueOrDefault(issue.contactEmails),
            },
            {
                dataElement: this.metadata.dataElements.comments.id,
                value: this.getValueOrDefault(issue.comments),
            },
            {
                dataElement: this.metadata.dataElements.categoryOption.id,
                value: this.getValueOrDefault(issue.categoryOption?.id),
            },
            {
                dataElement: this.metadata.dataElements.country.id,
                value: this.getValueOrDefault(issue.country?.id),
            },
            {
                dataElement: this.metadata.dataElements.dataElement.id,
                value: this.getValueOrDefault(issue.dataElement?.id),
            },
            {
                dataElement: this.metadata.dataElements.description.id,
                value: this.getValueOrDefault(issue.description),
            },
            {
                dataElement: this.metadata.dataElements.followUp.id,
                value: issue.followUp ? "true" : "false",
            },
            {
                dataElement: this.metadata.dataElements.issueNumber.id,
                value: this.getValueOrDefault(issue.number),
            },
            {
                dataElement: this.metadata.dataElements.period.id,
                value: this.getValueOrDefault(issue.period),
            },
            {
                dataElement: this.metadata.dataElements.status.id,
                value: this.getValueOrDefault(issue.status?.code),
            },
            {
                dataElement: this.metadata.dataElements.sectionNumber.id,
                value: String(programStageIndex + 1),
            },
        ];
        return currentDataValues.map((dataValue): DataValue => {
            const d2DataValue = event.dataValues.find(
                dv => dv.dataElement === dataValue.dataElement
            );
            return d2DataValue ? { ...d2DataValue, value: dataValue.value } : dataValue;
        });
    }

    private buildFilters(filters: QualityAnalysisOptions["filters"]): Maybe<string[]> {
        const nameFilter = filters.name
            ? `${this.metadata.trackedEntityAttributes.name.id}:LIKE:${filters.name}`
            : undefined;

        const startDateFilter = filters.startDate
            ? `${this.metadata.trackedEntityAttributes.startDate.id}:EQ:${filters.startDate}`
            : undefined;

        const endDateFilter = filters.endDate
            ? `${this.metadata.trackedEntityAttributes.endDate.id}:EQ:${filters.endDate}`
            : undefined;

        const moduleFilter = filters.module
            ? `${this.metadata.trackedEntityAttributes.module.id}:EQ:${filters.module}`
            : undefined;

        const status = filters.status
            ? `${this.metadata.trackedEntityAttributes.status.id}:EQ:${filters.status}`
            : undefined;

        const allFilters = _([endDateFilter, moduleFilter, nameFilter, startDateFilter, status])
            .compact()
            .value();

        return allFilters.length > 0 ? allFilters : undefined;
    }

    private buildOrder(sorting: QualityAnalysisOptions["sorting"]): Maybe<string> {
        switch (sorting.field) {
            case "endDate":
                return `${this.getIdOrThrow(this.metadata.trackedEntityAttributes.endDate.id)}:${
                    sorting.order
                }`;
            case "startDate":
                return `${this.getIdOrThrow(this.metadata.trackedEntityAttributes.startDate.id)}:${
                    sorting.order
                }`;
            case "module":
                return `${this.getIdOrThrow(this.metadata.trackedEntityAttributes.module.id)}:${
                    sorting.order
                }`;
            case "status":
                return `${this.getIdOrThrow(this.metadata.trackedEntityAttributes.status.id)}:${
                    sorting.order
                }`;
            case "name":
                return `${this.getIdOrThrow(this.metadata.trackedEntityAttributes.name.id)}:${
                    sorting.order
                }`;
            case "lastModification":
                return `${this.getIdOrThrow(
                    this.metadata.trackedEntityAttributes.lastModification.id
                )}:${sorting.order}`;
        }
        return undefined;
    }

    private buildQualityAnalysis(
        entity: D2TrackerTrackedEntity,
        sectionStatus: AnalysisSectionStatus[]
    ): Maybe<QualityAnalysis> {
        if (!entity.trackedEntity) return undefined;
        const attributesById = this.buildAttributesById(entity);

        const enrollment = _(entity.enrollments || []).first();
        if (!enrollment) return undefined;

        const moduleId = this.getValueOrDefault(
            attributesById.get(this.getIdOrThrow(this.metadata.trackedEntityAttributes.module.id))
        );

        const module = this.allowedModules.find(module => module.id === moduleId);
        if (!module) return undefined;

        const statusValue = this.getValueOrDefault(
            attributesById.get(this.getIdOrThrow(this.metadata.trackedEntityAttributes.status.id))
        );
        const status = this.buildQualityStatus(statusValue);

        const sectionsInfo = sectionStatus.find(section => section.id === entity.trackedEntity);
        const sections = this.buildSections(sectionsInfo, []);

        const countriesAnalysis = attributesById.get(
            this.getIdOrThrow(this.metadata.trackedEntityAttributes.countries.id)
        );
        const countriesIdsAnalysis = countriesAnalysis?.split(",") || [];

        return QualityAnalysis.build({
            id: entity.trackedEntity,
            name: this.getValueOrDefault(
                attributesById.get(this.getIdOrThrow(this.metadata.trackedEntityAttributes.name.id))
            ),
            endDate: this.getValueOrDefault(
                attributesById.get(
                    this.getIdOrThrow(this.metadata.trackedEntityAttributes.endDate.id)
                )
            ),
            sections: sections,
            module: module,
            startDate: this.getValueOrDefault(
                attributesById.get(
                    this.getIdOrThrow(this.metadata.trackedEntityAttributes.startDate.id)
                )
            ),
            status: status,
            lastModification: this.getValueOrDefault(
                attributesById.get(
                    this.getIdOrThrow(this.metadata.trackedEntityAttributes.lastModification.id)
                )
            ),
            countriesAnalysis: countriesIdsAnalysis,
            sequential: {
                value: this.getValueOrDefault(
                    attributesById.get(
                        this.getIdOrThrow(this.metadata.trackedEntityAttributes.sequential.id)
                    )
                ),
            },
        }).get();
    }

    private buildSections(
        sectionsInfo: Maybe<AnalysisSectionStatus>,
        qaIssues: QualityAnalysisIssue[]
    ): QualityAnalysisSection[] {
        return this.metadata.programs.qualityIssues.programStages.map((programStage, index) => {
            const sectionData = sectionsInfo?.extraInfo?.find(
                section => section.id === programStage.id
            );
            return new QualityAnalysisSection({
                id: programStage.id,
                name: programStage.name,
                description: programStage.description,
                issues: qaIssues.filter(issue => issue.type === programStage.id),
                position: index + 1,
                status: sectionData?.status || "",
            });
        });
    }

    private buildQualityStatus(status: string): QualityAnalysisStatus {
        const statusValue = qualityAnalysisStatus.find(qa => qa === status);
        return statusValue ?? "In Progress";
    }

    private getIdOrThrow(id: Maybe<string>): string {
        if (!id) throw Error(`cannot found: ${id} in metadata`);
        return id;
    }

    private buildAttributesById(entity: D2TrackerTrackedEntity): HashMap<Id, string> {
        const attributesByPair = _(entity.attributes || [])
            .map(a => [a.attribute, a.value] as [Id, string])
            .value();

        return HashMap.fromPairs(attributesByPair);
    }

    private getValueOrDefault(value: Maybe<string>, defaultValue?: string): string {
        return value || defaultValue || "";
    }
}

type D2AnalysisDataStore = { sections: SectionInfo[] };
type SectionInfo = { id: Id; status: string };
type AnalysisSectionStatus = { id: Id; extraInfo: Maybe<SectionInfo[]> };
