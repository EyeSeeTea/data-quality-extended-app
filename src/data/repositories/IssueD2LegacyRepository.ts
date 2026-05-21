/**
 * Legacy implementation of IssueRepository for DHIS2 ≤ 2.41.
 *
 * Differs from IssueD2Repository only in the tracker API response shape and
 * query-parameter names:
 *   - Response: `.instances[]` (not `.events[]`)
 *   - Pagination: flat fields (`pageSize`, `page`, …) instead of nested `.pager`
 *   - Params: `ouMode` / `orgUnit` (not `orgUnitMode` / `orgUnits`)
 */
import {
    D2ApiLegacy,
    D2TrackerEnrollment,
    DataValue,
    TrackerEventsResponseLegacy,
} from "$/types/d2-api-legacy";
import { D2Api } from "$/types/d2-api";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { GetIssuesOptions, IssueRepository } from "$/domain/repositories/IssueRepository";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { RowsPaginated } from "$/domain/entities/Pagination";
import { Future } from "$/domain/entities/generic/Future";
import { logger } from "$/utils/logger";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import _ from "$/domain/entities/generic/Collection";
import { Id } from "$/domain/entities/Ref";
import { D2DataElement } from "$/data/common/D2DataElement";
import { D2CategoryOption } from "$/data/common/D2CategoryOption";
import { D2OrgUnit } from "$/data/common/D2Country";
import { D2User } from "$/data/common/D2User";
import { Country } from "$/domain/entities/Country";
import { DataElement } from "$/domain/entities/DataElement";
import { CategoryOption } from "$/domain/entities/CategoryOption";
import { HashMap } from "$/domain/entities/generic/HashMap";
import { Maybe } from "$/utils/ts-utils";
import { IssueAction } from "$/domain/entities/IssueAction";
import { IssueStatus } from "$/domain/entities/IssueStatus";
import { getProgramStageIndexById } from "$/data/common/utils";

export class IssueD2LegacyRepository implements IssueRepository {
    d2DataElement: D2DataElement;
    d2CategoryOption: D2CategoryOption;
    d2OrgUnit: D2OrgUnit;
    d2User: D2User;

    constructor(private api: D2ApiLegacy) {
        // Non-tracker helpers use only api.models.* which is identical in both
        // package versions, so the cast is safe.
        const apiCompat = this.api as unknown as D2Api;
        this.d2DataElement = new D2DataElement(apiCompat);
        this.d2CategoryOption = new D2CategoryOption(apiCompat);
        this.d2OrgUnit = new D2OrgUnit(apiCompat);
        this.d2User = new D2User(apiCompat);
    }

    get(options: GetIssuesOptions): FutureData<RowsPaginated<QualityAnalysisIssue>> {
        const { filters, pagination } = options;
        const filtersParams = this.buildFilters(options.filters, options.metadata);
        return apiToFuture(
            this.api.tracker.events.get({
                programStage: filters.sectionId ? filters.sectionId : undefined,
                fields: issueEventFields,
                totalPages: true,
                trackedEntity: filters.analysisIds ? filters.analysisIds.join(";") : undefined,
                page: pagination.page,
                pageSize: pagination.pageSize,
                order: filtersParams
                    ? undefined
                    : `${this.getDataElementIdOrThrow(
                          "sectionNumber",
                          options.metadata
                      )}:asc,${this.buildOrder(options.sorting, options.metadata)}`,
                filter: filtersParams,
                event: filters.id ? filters.id : undefined,
            })
        ).flatMap(d2Response => {
            const instances = d2Response.instances;
            const orgUnitIds = this.getRelatedIdsFromDataValues(
                instances,
                this.getDataElementIdOrThrow("country", options.metadata)
            );
            const dataElementIds = this.getRelatedIdsFromDataValues(
                instances,
                this.getDataElementIdOrThrow("dataElement", options.metadata)
            );
            const categoryOptionIds = this.getRelatedIdsFromDataValues(
                instances,
                this.getDataElementIdOrThrow("categoryOption", options.metadata)
            );
            return Future.joinObj({
                countries: this.d2OrgUnit.getByIds(orgUnitIds),
                dataElements: this.d2DataElement.getByIds(dataElementIds),
                categoryOptions: this.d2CategoryOption.getByIds(categoryOptionIds),
            }).flatMap(({ countries, dataElements, categoryOptions }) => {
                return Future.success({
                    pagination: {
                        pageSize: d2Response.pageSize,
                        pageCount: d2Response.pageCount ?? d2Response.pager?.pageCount ?? 1,
                        page: d2Response.page,
                        total: d2Response.total || 0,
                    },
                    rows: this.buildIssues(
                        instances,
                        countries,
                        dataElements,
                        categoryOptions,
                        options.metadata
                    ),
                });
            });
        });
    }

    getById(id: Id, metadata: MetadataItem): FutureData<QualityAnalysisIssue> {
        return apiToFuture(
            this.api.tracker.events.get({
                fields: issueEventFields,
                event: id ? id : undefined,
            })
        ).flatMap(d2Response => {
            const d2Event = d2Response.instances[0];
            if (!d2Event) return Future.error(new Error(`Cannot found event: ${id}`));

            const orgUnitIds = this.getRelatedIdsFromDataValues(
                [d2Event],
                this.getDataElementIdOrThrow("country", metadata)
            );
            const dataElementIds = this.getRelatedIdsFromDataValues(
                [d2Event],
                this.getDataElementIdOrThrow("dataElement", metadata)
            );
            const categoryOptionIds = this.getRelatedIdsFromDataValues(
                [d2Event],
                this.getDataElementIdOrThrow("categoryOption", metadata)
            );
            return Future.joinObj({
                countries: this.d2OrgUnit.getByIds(orgUnitIds),
                dataElements: this.d2DataElement.getByIds(dataElementIds),
                categoryOptions: this.d2CategoryOption.getByIds(categoryOptionIds),
            }).flatMap(({ countries, dataElements, categoryOptions }) => {
                const issues = this.buildIssues(
                    [d2Event],
                    countries,
                    dataElements,
                    categoryOptions,
                    metadata
                );
                const firstIssue = _(issues).first();
                if (!firstIssue) return Future.error(new Error(`Cannot found event: ${id}`));
                return Future.success(firstIssue);
            });
        });
    }

    create(issue: QualityAnalysisIssue, analysisId: Id, metadata: MetadataItem): FutureData<void> {
        const programStageId = issue.type;
        if (!programStageId)
            return Future.error(new Error(`Cannot found programStage: ${programStageId}`));

        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                ouMode: "SELECTED",
                orgUnit: metadata.organisationUnits.global.id,
                fields: { trackedEntity: true, enrollments: true },
                program: metadata.programs.qualityIssues.id,
                trackedEntity: analysisId,
            })
        ).flatMap(d2Response => {
            const instances = d2Response.instances;
            const tei = instances.find(tei => tei.trackedEntity === analysisId);
            if (!tei) return Future.error(new Error(`Cannot found TEI: ${tei}`));
            const enrollment = _(tei.enrollments || []).first() as Maybe<D2TrackerEnrollment>;
            if (!enrollment)
                return Future.error(new Error(`Cannot found Enrollment in TEI: ${tei}`));

            const programStageIndex = getProgramStageIndexById(issue.type, metadata);

            return Future.fromPromise(
                logger.info({
                    config: {
                        trackedEntityId: analysisId,
                        programStageId: programStageId,
                        enrollmentId: enrollment.enrollment,
                    },
                    messages: [
                        { id: metadata.dataElements.correlative.id, value: issue.correlative },
                        { id: metadata.dataElements.status.id, value: issue.status?.code || "" },
                        { id: metadata.dataElements.issueNumber.id, value: issue.number },
                        { id: metadata.dataElements.country.id, value: issue.country?.id || "" },
                        { id: metadata.dataElements.description.id, value: issue.description },
                        { id: metadata.dataElements.action.id, value: issue.action?.code || "" },
                        {
                            id: metadata.dataElements.dataElement.id,
                            value: issue.dataElement?.id || "",
                        },
                        { id: metadata.dataElements.azureUrl.id, value: issue.azureUrl },
                        {
                            id: metadata.dataElements.actionDescription.id,
                            value: issue.actionDescription,
                        },
                        { id: metadata.dataElements.period.id, value: issue.period || "" },
                        {
                            id: metadata.dataElements.categoryOption.id,
                            value: issue.categoryOption?.id || "",
                        },
                        {
                            id: metadata.dataElements.followUp.id,
                            value: issue.followUp ? "true" : "false",
                        },
                        {
                            id: metadata.dataElements.contactEmails.id,
                            value: issue.contactEmails,
                        },
                        { id: metadata.dataElements.comments.id, value: issue.comments },
                        {
                            id: metadata.dataElements.sectionNumber.id,
                            value: String(programStageIndex + 1),
                        },
                    ],
                })
            );
        });
    }

    private buildIssues(
        events: D2IssueEvent[],
        countries: Country[],
        dataElements: DataElement[],
        categoryOptions: CategoryOption[],
        metadata: MetadataItem
    ): QualityAnalysisIssue[] {
        return _(events)
            .map(d2Event => {
                const issueType = metadata.programs.qualityIssues.programStages.find(
                    programStage => programStage.id === d2Event.programStage
                );
                if (!issueType) {
                    console.warn(`Cannot find program stage: ${d2Event.programStage}`);
                    return undefined;
                }
                if (d2Event.dataValues.length === 0) return undefined;

                const dataValuesById = this.buildDataElementsById(d2Event.dataValues);
                const countryId = this.getDataValue(dataValuesById, "country", metadata);
                const country = countries.find(country => country.id === countryId);
                const issueAction = this.getValueFromOptionSet(
                    dataValuesById,
                    this.getDataElementIdOrThrow("action", metadata),
                    "action",
                    metadata
                );
                const issueStatus = this.getValueFromOptionSet(
                    dataValuesById,
                    this.getDataElementIdOrThrow("status", metadata),
                    "status",
                    metadata
                );
                const categoryOptionId = this.getDataValue(
                    dataValuesById,
                    "categoryOption",
                    metadata
                );
                const categoryOption = categoryOptions.find(
                    categoryOption => categoryOption.id === categoryOptionId
                );
                const dataElementId = this.getDataValue(dataValuesById, "dataElement", metadata);
                const dataElement = dataElements.find(
                    dataElement => dataElement.id === dataElementId
                );

                return new QualityAnalysisIssue({
                    action: issueAction,
                    actionDescription: this.getDataValue(
                        dataValuesById,
                        "actionDescription",
                        metadata
                    ),
                    azureUrl: this.getDataValue(dataValuesById, "azureUrl", metadata),
                    categoryOption: categoryOption,
                    country: country,
                    dataElement: dataElement,
                    description: this.getDataValue(dataValuesById, "description", metadata),
                    followUp: this.getDataValue(dataValuesById, "followUp", metadata) === "true",
                    id: d2Event.event,
                    number: this.getDataValue(dataValuesById, "issueNumber", metadata),
                    period: this.getDataValue(dataValuesById, "period", metadata),
                    status: issueStatus,
                    type: issueType.id,
                    comments: this.getDataValue(dataValuesById, "comments", metadata),
                    contactEmails: this.getDataValue(dataValuesById, "contactEmails", metadata),
                    correlative: this.getDataValue(dataValuesById, "correlative", metadata),
                });
            })
            .compact()
            .value();
    }

    private getValueFromOptionSet(
        dataValuesById: HashMap<string, string>,
        dataElementId: Id,
        key: keyof MetadataItem["optionSets"],
        metadata: MetadataItem
    ): Maybe<IssueStatus | IssueAction> {
        const value = this.getValueOrDefault(dataValuesById.get(dataElementId));
        const option = metadata.optionSets[key].options.find(option => option.code === value);
        return option ? new IssueAction(option) : undefined;
    }

    private buildDataElementsById(dataValues: DataValue[]): HashMap<Id, string> {
        const attributesByPair = _(dataValues)
            .map(a => [a.dataElement, a.value] as [Id, string])
            .value();
        return HashMap.fromPairs(attributesByPair);
    }

    private getDataValue(
        dataValuesById: HashMap<Id, string>,
        dataElementName: DataElementKey,
        metadata: MetadataItem
    ): string {
        return this.getValueOrDefault(
            dataValuesById.get(this.getDataElementIdOrThrow(dataElementName, metadata))
        );
    }

    private getValueOrDefault(value: Maybe<string>, defaultValue?: string): string {
        return value || defaultValue || "";
    }

    private getRelatedIdsFromDataValues(events: D2IssueEvent[], dataElementId: Id): Id[] {
        return _(events)
            .map(d2Event =>
                _(d2Event.dataValues)
                    .map(dataValue =>
                        dataValue.dataElement === dataElementId ? dataValue.value : undefined
                    )
                    .compact()
                    .value()
            )
            .flatten()
            .value();
    }

    private getDataElementIdOrThrow(key: DataElementKey, metadata: MetadataItem): string {
        const metadataItem = metadata.dataElements[key];
        if (!metadataItem) throw Error(`cannot found: ${key} indataElements`);
        return metadataItem.id;
    }

    private buildOrder(
        sorting: GetIssuesOptions["sorting"],
        metadata: MetadataItem
    ): Maybe<string> {
        switch (sorting.field) {
            case "number":
                return `${this.getDataElementIdOrThrow("correlative", metadata)}:${sorting.order}`;
            case "status":
                return `${this.getDataElementIdOrThrow("status", metadata)}:${sorting.order}`;
            case "period":
                return `${this.getDataElementIdOrThrow("period", metadata)}:${sorting.order}`;
            case "description":
                return `${this.getDataElementIdOrThrow("description", metadata)}:${sorting.order}`;
            case "followUp":
                return `${this.getDataElementIdOrThrow("followUp", metadata)}:${sorting.order}`;
            case "action":
                return `${this.getDataElementIdOrThrow("action", metadata)}:${sorting.order}`;
            case "actionDescription":
                return `${this.getDataElementIdOrThrow("actionDescription", metadata)}:${
                    sorting.order
                }`;
            case "azureUrl":
                return `${this.getDataElementIdOrThrow("azureUrl", metadata)}:${sorting.order}`;
        }
        return undefined;
    }

    private buildFilters(
        filter: GetIssuesOptions["filters"],
        metadata: MetadataItem
    ): Maybe<string> {
        const numberFilter = filter.name
            ? `${metadata.dataElements.issueNumber.id}:LIKE:${filter.name}`
            : undefined;
        const periodsFilter = this.buildFilterMultipleValue(
            filter.periods,
            metadata.dataElements.period.id
        );
        const statusFilter = this.buildFilterMultipleValue(
            filter.status,
            metadata.dataElements.status.id
        );
        const actionsFilter = this.buildFilterMultipleValue(
            filter.actions,
            metadata.dataElements.action.id
        );
        const countriesFilter = this.buildFilterMultipleValue(
            filter.countries,
            metadata.dataElements.country.id
        );
        const followUpFilter = this.buildFollowUpFilter(filter.followUp, metadata);
        const stepFilter = this.buildFilterMultipleValue(
            filter.step,
            metadata.dataElements.sectionNumber.id
        );
        const allFilters = _([
            numberFilter,
            periodsFilter,
            statusFilter,
            actionsFilter,
            countriesFilter,
            followUpFilter,
            stepFilter,
        ])
            .compact()
            .value();
        return allFilters.length > 0 ? allFilters.join(",") : undefined;
    }

    private buildFilterMultipleValue(value: Maybe<string[]>, dataElementId: Id): Maybe<string> {
        const valueSeparatedByComma = value ? value.join(";") : undefined;
        return valueSeparatedByComma ? `${dataElementId}:IN:${valueSeparatedByComma}` : undefined;
    }

    private buildFollowUpFilter(
        followUpValue: Maybe<string>,
        metadata: MetadataItem
    ): Maybe<string> {
        if (followUpValue === "1") {
            return `${metadata.dataElements.followUp.id}:eq:true`;
        } else if (followUpValue === "0") {
            return `${metadata.dataElements.followUp.id}:eq:false`;
        }
        return undefined;
    }
}

type DataElementKey = keyof MetadataItem["dataElements"];

const issueEventFields = { dataValues: true, event: true, programStage: true } as const;

type D2IssueEvent = TrackerEventsResponseLegacy<typeof issueEventFields>["instances"][number];
