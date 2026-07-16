import {
    D2TrackerEnrollment,
    DataValue,
    D2TrackerEvent,
    D2Api,
    D2TrackerTrackedEntity,
    TrackedEntitiesGetResponse,
} from "$/types/d2-api";
import {
    QualityAnalysisOptions,
    QualityAnalysisPaginated,
    QualityAnalysisRepository,
} from "$/domain/repositories/QualityAnalysisRepository";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Code, Id } from "$/domain/entities/Ref";
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
import { DataStore } from "@eyeseetea/d2-api/api";

const DEFAULT_PAGE_SIZE = 500;
const DEFAULT_DELETE_CHUNK_SIZE = 300;

export class QualityAnalysisD2Repository implements QualityAnalysisRepository {
    d2DataElement: D2DataElement;
    d2CategoryOption: D2CategoryOption;
    d2OrgUnit: D2OrgUnit;
    d2User: D2User;

    constructor(private api: D2Api) {
        this.d2DataElement = new D2DataElement(this.api);
        this.d2CategoryOption = new D2CategoryOption(this.api);
        this.d2OrgUnit = new D2OrgUnit(this.api);
        this.d2User = new D2User(this.api);
    }

    get(options: QualityAnalysisOptions): FutureData<QualityAnalysisPaginated> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                ouMode: "SELECTED",
                orgUnit: options.metadata.organisationUnits.global.id,
                fields: { orgUnit: true, trackedEntity: true, attributes: true, enrollments: true },
                program: this.getIdOrThrow(options.metadata.programs.qualityIssues?.id),
                page: options.pagination.page,
                pageSize: options.pagination.pageSize,
                // TODO: Update d2-api to support para "trackedEntities" since "trackedEntity"
                // is deprecated
                // @ts-ignore
                trackedEntities: options.filters.ids ? options.filters.ids.join(";") : undefined,
                filter:
                    this.buildFilters(options.filters, options.metadata)?.join(",") || undefined,
                order: this.buildOrder(options.sorting, options.metadata) || undefined,
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
                    options.metadata.programs.qualityIssues.programStages
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
                        .map(tei =>
                            this.buildQualityAnalysis(tei, sectionInformation, options.metadata)
                        )
                        .compact()
                        .value(),
                };
            });
        });
    }

    getById(id: string, metadata: MetadataItem): FutureData<QualityAnalysis> {
        return this.get({
            filters: {
                endDate: undefined,
                ids: [id],
                module: undefined,
                name: undefined,
                startDate: undefined,
                status: undefined,
                periodType: undefined,
            },
            pagination: {
                page: 1,
                pageSize: DEFAULT_PAGE_SIZE,
            },
            sorting: {
                field: "name",
                order: "desc",
            },
            metadata: metadata,
        }).flatMap(analysis => {
            const firstAnalysis = analysis.rows[0];
            if (!firstAnalysis)
                return Future.error(new Error(`Cannot find qualityAnalysis: ${id}`));
            return Future.success(firstAnalysis);
        });
    }

    save(qualityAnalysis: QualityAnalysis[], metadata: MetadataItem): FutureData<void> {
        const qualityIds = qualityAnalysis.map(record => record.id);
        const $requests = Future.sequential(
            _(qualityIds)
                .chunk(50)
                .map(qaIds => {
                    return Future.joinObj({
                        saveTeis: this.buildTeisRequests(qaIds, qualityAnalysis, metadata),
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

    removeAll(analysisProgramCode: Code): FutureData<void> {
        return Future.joinObj({
            programId: this.getProgramIdByCode(analysisProgramCode),
            globalOrgUnitId: this.getGlobalOrgUnitId(),
        }).flatMap(({ programId, globalOrgUnitId }) => {
            return this.getAllD2TrackerTrackedEntities(programId, globalOrgUnitId).flatMap(teis => {
                if (teis.length === 0) return Future.success(undefined);
                const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);

                return Future.sequential(
                    _(teis)
                        .chunk(DEFAULT_DELETE_CHUNK_SIZE)
                        .map(chunk => this.deleteFromProgramAndDatastore(chunk, dataStore))
                        .value()
                ).map(() => undefined);
            });
        });
    }

    private getAllD2TrackerTrackedEntities(
        programId: Id,
        orgUnit: Id
    ): FutureData<D2TrackerTrackedEntity[]> {
        const teis: D2TrackerTrackedEntity[] = [];
        const pageSize = DEFAULT_PAGE_SIZE;
        const firstPage = 1;

        const fetchPage = (
            page: number,
            accTeis: D2TrackerTrackedEntity[]
        ): FutureData<D2TrackerTrackedEntity[]> => {
            return apiToFuture(
                this.api.tracker.trackedEntities.get({
                    ouMode: "SELECTED",
                    fields: {
                        trackedEntity: true,
                    },
                    program: programId,
                    orgUnit: orgUnit,
                    page: page,
                    pageSize: pageSize,
                    totalPages: true,
                })
            ).flatMap((response: TrackedEntitiesGetResponse) => {
                const apiTeis: D2TrackerTrackedEntity[] = buildTrackerResponse(response).instances;
                const nextAccTeis = [...accTeis, ...apiTeis];

                // @ts-ignore. The d2-api types should be updated to reflect that pageCount is always returned when totalPages is true
                const pageCount = response.pageCount;
                const nextPage = (response.page ?? page) + 1;

                if (pageCount !== undefined && nextPage <= pageCount) {
                    return fetchPage(nextPage, nextAccTeis);
                }

                return Future.success(nextAccTeis);
            });
        };

        return fetchPage(firstPage, teis);
    }

    private getProgramIdByCode(programCode: Code): FutureData<Id> {
        return apiToFuture(
            this.api.models.programs.get({
                fields: {
                    id: true,
                },
                filter: {
                    code: { eq: programCode },
                },
                programStatus: "ACTIVE",
                skipPaging: true,
            })
        ).flatMap(programsResponse => {
            const program = programsResponse.objects?.[0];
            if (!program) {
                return Future.error(new Error(`Program with code ${programCode} not found.`));
            }
            return Future.success(program.id);
        });
    }

    private getGlobalOrgUnitId(): FutureData<Id> {
        return apiToFuture(
            this.api.models.organisationUnits.get({
                fields: { id: true },
                filter: { level: { eq: "1" } },
            })
        ).flatMap(d2Response => {
            const d2OrgUnit = d2Response.objects[0];
            if (!d2OrgUnit) return Future.error(new Error(`Global organisation unit not found`));

            return Future.success(d2OrgUnit.id);
        });
    }

    private deleteFromProgramAndDatastore(
        teis: D2TrackerTrackedEntity[],
        dataStore: DataStore
    ): FutureData<void> {
        return apiToFuture(
            this.api.tracker.post({ importStrategy: "DELETE" }, { trackedEntities: teis })
        ).flatMap(d2Response => {
            if (d2Response?.status === "ERROR") {
                return Future.error(new Error(d2Response.message));
            }

            const idsDeleted: Id[] =
                d2Response?.bundleReport?.typeReportMap?.TRACKED_ENTITY?.objectReports?.map(
                    r => r.uid
                ) ?? [];
            if (idsDeleted.length === 0) return Future.success(undefined);

            return Future.sequential(idsDeleted.map(id => apiToFuture(dataStore.delete(id)))).map(
                () => undefined
            );
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

    private buildTeisRequests(
        qaIds: string[],
        qualityAnalysis: QualityAnalysis[],
        metadata: MetadataItem
    ) {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                ouMode: "SELECTED",
                orgUnit: metadata.organisationUnits.global.id,
                program: metadata.programs.qualityIssues.id,
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
                    qAnalysis.id,
                    metadata
                );

                const attributes = this.buildAttributesFromQualityAnalysis(
                    existingTei,
                    qAnalysis,
                    metadata
                );

                return {
                    ...(existingTei || {}),
                    trackedEntityType: metadata.trackedEntityTypes.dataQuality.id,
                    trackedEntity: qAnalysis.id,
                    orgUnit: metadata.organisationUnits.global.id,
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
        qualityAnalysis: QualityAnalysis,
        metadata: MetadataItem
    ) {
        const existingAttributes = existingTei?.attributes || [];
        const currentAttributes = [
            {
                attribute: metadata.trackedEntityAttributes.sequential.id,
                value: qualityAnalysis.sequential.value,
            },
            {
                attribute: metadata.trackedEntityAttributes.countries.id,
                value: qualityAnalysis.countriesAnalysis.join(","),
            },
            {
                attribute: metadata.trackedEntityAttributes.endDate.id,
                value: QualityAnalysis.normalizePeriodBoundary(qualityAnalysis.endDate, "end"),
            },
            {
                attribute: metadata.trackedEntityAttributes.module.id,
                value: qualityAnalysis.module.id,
            },
            {
                attribute: metadata.trackedEntityAttributes.startDate.id,
                value: QualityAnalysis.normalizePeriodBoundary(qualityAnalysis.startDate, "start"),
            },
            {
                attribute: metadata.trackedEntityAttributes.status.id,
                value: qualityAnalysis.status as string,
            },
            {
                attribute: metadata.trackedEntityAttributes.name.id,
                value: qualityAnalysis.name,
            },
            {
                attribute: metadata.trackedEntityAttributes.lastModification.id,
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
        teiId: Id,
        metadata: MetadataItem
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
            orgUnit: metadata.organisationUnits.global.id,
            orgUnitName: this.getValueOrDefault(firstEnrollment?.orgUnitName),
            program: metadata.programs.qualityIssues.id,
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

                    return {
                        ...event,
                        dataValues: this.getDataValuesFromIssues(event, issue, metadata),
                    };
                })
                .compact()
                .value(),
        };
    }

    private getDataValuesFromIssues(
        event: D2TrackerEvent,
        issue: QualityAnalysisIssue,
        metadata: MetadataItem
    ): DataValue[] {
        const programStageIndex = getProgramStageIndexById(issue.type, metadata);

        const currentDataValues = [
            {
                dataElement: metadata.dataElements.correlative.id,
                value: this.getValueOrDefault(issue.correlative),
            },
            {
                dataElement: metadata.dataElements.action.id,
                value: this.getValueOrDefault(issue.action?.code),
            },
            {
                dataElement: metadata.dataElements.actionDescription.id,
                value: this.getValueOrDefault(issue.actionDescription),
            },
            {
                dataElement: metadata.dataElements.azureUrl.id,
                value: this.getValueOrDefault(issue.azureUrl),
            },
            {
                dataElement: metadata.dataElements.contactEmails.id,
                value: this.getValueOrDefault(issue.contactEmails),
            },
            {
                dataElement: metadata.dataElements.comments.id,
                value: this.getValueOrDefault(issue.comments),
            },
            {
                dataElement: metadata.dataElements.categoryOption.id,
                value: this.getValueOrDefault(issue.categoryOption?.id),
            },
            {
                dataElement: metadata.dataElements.country.id,
                value: this.getValueOrDefault(issue.country?.id),
            },
            {
                dataElement: metadata.dataElements.dataElement.id,
                value: this.getValueOrDefault(issue.dataElement?.id),
            },
            {
                dataElement: metadata.dataElements.description.id,
                value: this.getValueOrDefault(issue.description),
            },
            {
                dataElement: metadata.dataElements.followUp.id,
                value: issue.followUp ? "true" : "false",
            },
            {
                dataElement: metadata.dataElements.issueNumber.id,
                value: this.getValueOrDefault(issue.number),
            },
            {
                dataElement: metadata.dataElements.period.id,
                value: this.getValueOrDefault(issue.period),
            },
            {
                dataElement: metadata.dataElements.status.id,
                value: this.getValueOrDefault(issue.status?.code),
            },
            {
                dataElement: metadata.dataElements.sectionNumber.id,
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

    private buildFilters(
        filters: QualityAnalysisOptions["filters"],
        metadata: MetadataItem
    ): Maybe<string[]> {
        const nameFilter = filters.name
            ? `${metadata.trackedEntityAttributes.name.id}:LIKE:${filters.name}`
            : undefined;

        // Overlap filter: startDate <= window end AND endDate >= window start. A legacy
        // bare-year endDate ("2024") sorts *before* any full ISO date in that same year,
        // so a precise `GE` would wrongly exclude it — coarsen to year granularity, but
        // only for `Yearly`/unknown periodType, the only ones with legacy bare-year data.
        const canHaveLegacyYearData = !filters.periodType || filters.periodType === "Yearly";

        const endDateLowerBound =
            canHaveLegacyYearData && filters.startDate
                ? filters.startDate.slice(0, 4)
                : filters.startDate;

        const startDateFilter = filters.endDate
            ? `${metadata.trackedEntityAttributes.startDate.id}:LE:${filters.endDate}`
            : undefined;

        const endDateFilter = endDateLowerBound
            ? `${metadata.trackedEntityAttributes.endDate.id}:GE:${endDateLowerBound}`
            : undefined;

        const moduleFilter = filters.module
            ? `${metadata.trackedEntityAttributes.module.id}:EQ:${filters.module}`
            : undefined;

        const status = filters.status
            ? `${metadata.trackedEntityAttributes.status.id}:EQ:${filters.status}`
            : undefined;

        const allFilters = _([endDateFilter, moduleFilter, nameFilter, startDateFilter, status])
            .compact()
            .value();

        return allFilters.length > 0 ? allFilters : undefined;
    }

    private buildOrder(
        sorting: QualityAnalysisOptions["sorting"],
        metadata: MetadataItem
    ): Maybe<string> {
        switch (sorting.field) {
            case "endDate":
                return `${this.getIdOrThrow(metadata.trackedEntityAttributes.endDate.id)}:${
                    sorting.order
                }`;
            case "startDate":
                return `${this.getIdOrThrow(metadata.trackedEntityAttributes.startDate.id)}:${
                    sorting.order
                }`;
            case "module":
                return `${this.getIdOrThrow(metadata.trackedEntityAttributes.module.id)}:${
                    sorting.order
                }`;
            case "status":
                return `${this.getIdOrThrow(metadata.trackedEntityAttributes.status.id)}:${
                    sorting.order
                }`;
            case "name":
                return `${this.getIdOrThrow(metadata.trackedEntityAttributes.name.id)}:${
                    sorting.order
                }`;
            case "lastModification":
                return `${this.getIdOrThrow(
                    metadata.trackedEntityAttributes.lastModification.id
                )}:${sorting.order}`;
        }
        return undefined;
    }

    private buildQualityAnalysis(
        entity: D2TrackerTrackedEntity,
        sectionStatus: AnalysisSectionStatus[],
        metadata: MetadataItem
    ): Maybe<QualityAnalysis> {
        if (!entity.trackedEntity) return undefined;
        const attributesById = this.buildAttributesById(entity);

        const enrollment = _(entity.enrollments || []).first();
        if (!enrollment) return undefined;

        const moduleId = this.getValueOrDefault(
            attributesById.get(this.getIdOrThrow(metadata.trackedEntityAttributes.module.id))
        );

        const allowedModules = getDefaultModules(metadata);
        const module = allowedModules.find(module => module.id === moduleId);
        if (!module) return undefined;

        const statusValue = this.getValueOrDefault(
            attributesById.get(this.getIdOrThrow(metadata.trackedEntityAttributes.status.id))
        );
        const status = this.buildQualityStatus(statusValue);

        const sectionsInfo = sectionStatus.find(section => section.id === entity.trackedEntity);
        const sections = this.buildSections(sectionsInfo, [], metadata);

        const countriesAnalysis = attributesById.get(
            this.getIdOrThrow(metadata.trackedEntityAttributes.countries.id)
        );
        const countriesIdsAnalysis = countriesAnalysis?.split(",") || [];

        return QualityAnalysis.build({
            id: entity.trackedEntity,
            name: this.getValueOrDefault(
                attributesById.get(this.getIdOrThrow(metadata.trackedEntityAttributes.name.id))
            ),
            endDate: QualityAnalysis.normalizePeriodBoundary(
                this.getValueOrDefault(
                    attributesById.get(
                        this.getIdOrThrow(metadata.trackedEntityAttributes.endDate.id)
                    )
                ),
                "end"
            ),
            sections: sections,
            module: module,
            startDate: QualityAnalysis.normalizePeriodBoundary(
                this.getValueOrDefault(
                    attributesById.get(
                        this.getIdOrThrow(metadata.trackedEntityAttributes.startDate.id)
                    )
                ),
                "start"
            ),
            status: status,
            lastModification: this.getValueOrDefault(
                attributesById.get(
                    this.getIdOrThrow(metadata.trackedEntityAttributes.lastModification.id)
                )
            ),
            countriesAnalysis: countriesIdsAnalysis,
            sequential: {
                value: this.getValueOrDefault(
                    attributesById.get(
                        this.getIdOrThrow(metadata.trackedEntityAttributes.sequential.id)
                    )
                ),
            },
        }).get();
    }

    private buildSections(
        sectionsInfo: Maybe<AnalysisSectionStatus>,
        qaIssues: QualityAnalysisIssue[],
        metadata: MetadataItem
    ): QualityAnalysisSection[] {
        return metadata.programs.qualityIssues.programStages.map((programStage, index) => {
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
