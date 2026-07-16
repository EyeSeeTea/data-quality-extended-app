import React from "react";
import {
    GetRows,
    TableConfig,
    useLoading,
    useObjectsTable,
    useSnackbar,
    ObjectsTable,
} from "@eyeseetea/d2-ui-components";
import { useAppContext } from "$/webapp/contexts/app-context";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { GetIssuesOptions } from "$/domain/repositories/IssueRepository";
import i18n from "$/utils/i18n";
import { DateISOString, Id } from "$/domain/entities/Ref";
import { PeriodType } from "$/domain/entities/PeriodType";
import { IssueFilters } from "./IssueFilters";
import { initialFilters } from "$/webapp/utils/issues";
import { Maybe } from "$/utils/ts-utils";
import CloudDownload from "@material-ui/icons/CloudDownload";
import { useTableUtils } from "$/webapp/hooks/useTable";
import { useIssueColumns } from "./IssueColumns";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { hasUserGroups } from "$/webapp/components/issues/utils";

export function useCopyContactEmails(props: UseCopyContactEmailsProps) {
    const { onSuccess } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const loading = useLoading();
    const snackbar = useSnackbar();

    const copyContactEmails = React.useCallback(
        (
            issueId: Id,
            analysisId: Id,
            sectionId: Maybe<Id>,
            filters: GetIssuesOptions["filters"]
        ) => {
            if (!hasUserGroups(metadataItem.userGroups)) return;

            loading.show(true, i18n.t("Copying Contact Emails and marking for Follow-Up"));
            compositionRoot.issues.copyEmails
                .execute({
                    analysisId: analysisId,
                    sectionId: sectionId,
                    issueId: issueId,
                    filters,
                    metadata: metadataItem,
                })
                .run(
                    () => {
                        snackbar.success(i18n.t("Contact emails copied"));
                        loading.hide();
                        if (onSuccess) onSuccess();
                    },
                    error => {
                        snackbar.error(error.message);
                        loading.hide();
                    }
                );
        },
        [compositionRoot.issues.copyEmails, loading, snackbar, onSuccess, metadataItem]
    );

    return copyContactEmails;
}

export function useExportIssues() {
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const loading = useLoading();
    const snackbar = useSnackbar();

    const exportIssues = React.useCallback(
        (analysisId: Id, filters: GetIssuesOptions["filters"]) => {
            loading.show(true, i18n.t("Exporting Issues..."));
            compositionRoot.issues.export
                .execute({ analysisId: analysisId, filters, metadata: metadataItem })
                .run(
                    () => {
                        snackbar.success(i18n.t("Issues exported"));
                        loading.hide();
                    },
                    error => {
                        snackbar.error(error.message);
                        loading.hide();
                    }
                );
        },
        [compositionRoot.issues.export, loading, snackbar, metadataItem]
    );

    return exportIssues;
}

export function useTableConfig(props: UseTableConfigProps) {
    const { analysisId, filters, periodType, sectionId, showExport } = props;
    const { issueColumns, refresh, setRefresh } = useIssueColumns(periodType);
    const { metadataItem } = useMetadataItemContext();

    const { saveColumns, columnsToShow } = useTableUtils<QualityAnalysisIssue>({
        storageId: "issues",
        columns: issueColumns,
    });

    const onSuccess = React.useCallback(() => {
        setRefresh(value => value + 1);
    }, [setRefresh]);

    const copyContactEmails = useCopyContactEmails({ onSuccess: onSuccess });
    const exportIssues = useExportIssues();

    const tableConfig = React.useMemo<TableConfig<QualityAnalysisIssue>>(() => {
        return {
            globalActions: showExport
                ? [
                      {
                          icon: <CloudDownload />,
                          name: "Export",
                          text: i18n.t("Export"),
                          onClick: () => {
                              exportIssues(analysisId, filters);
                          },
                      },
                  ]
                : undefined,
            stickyHeader: true,
            actions: hasUserGroups(metadataItem.userGroups)
                ? [
                      {
                          name: "Extend Contact Emails",
                          text: i18n.t("Extend Follow-Up + Contact Emails"),
                          primary: false,
                          onClick(selectedIds) {
                              const issueId = selectedIds[0];
                              if (!issueId) return false;
                              copyContactEmails(issueId, analysisId, sectionId, filters);
                          },
                      },
                  ]
                : [],
            columns: columnsToShow,
            initialSorting: { field: "number", order: "asc" },
            paginationOptions: {
                pageSizeOptions: [10, 20, 50],
                pageSizeInitialValue: 20,
                renderPosition: { bottom: true, top: false },
            },
            onReorderColumns: saveColumns,
        };
    }, [
        showExport,
        metadataItem.userGroups,
        columnsToShow,
        saveColumns,
        exportIssues,
        analysisId,
        filters,
        copyContactEmails,
        sectionId,
    ]);

    return { tableConfig, refresh };
}

export function useGetRows(
    filters: GetIssuesOptions["filters"],
    reloadKey: number,
    analysisId: Id,
    sectionId: Maybe<Id>,
    refreshIssue: number
) {
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const [loading, setLoading] = React.useState(false);
    const getRows = React.useCallback<GetRows<QualityAnalysisIssue>>(
        (_search, pagination, sorting) => {
            return new Promise((resolve, reject) => {
                if (reloadKey < 0 || refreshIssue < 0)
                    return resolve({
                        pager: { page: 1, pageCount: 1, pageSize: 10, total: 0 },
                        objects: [],
                    });

                setLoading(true);
                return compositionRoot.summary.get
                    .execute({
                        pagination: { page: pagination.page, pageSize: pagination.pageSize },
                        sorting: { field: sorting.field, order: sorting.order },
                        filters: {
                            actions: filters.actions,
                            countries: filters.countries,
                            name: filters.search,
                            periods: filters.periods,
                            status: filters.status,
                            analysisIds: [analysisId],
                            sectionId: sectionId,
                            id: undefined,
                            followUp: filters.followUp,
                            step: filters.step,
                            search: filters.search,
                        },
                        metadata: metadataItem,
                    })
                    .run(
                        response => {
                            setLoading(false);
                            resolve({ pager: response.pagination, objects: response.rows });
                        },
                        err => {
                            setLoading(false);
                            reject(new Error(err.message));
                        }
                    );
            });
        },
        [
            reloadKey,
            refreshIssue,
            compositionRoot.summary.get,
            filters.actions,
            filters.countries,
            filters.periods,
            filters.status,
            filters.followUp,
            filters.step,
            filters.search,
            analysisId,
            sectionId,
            metadataItem,
        ]
    );

    return { getRows, loading };
}

function useAnalysisPeriodInfo(analysisId: Id): {
    periodType: PeriodType;
    startDate: DateISOString;
    endDate: DateISOString;
} {
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();
    const [info, setInfo] = React.useState<{
        periodType: PeriodType;
        startDate: DateISOString;
        endDate: DateISOString;
    }>({ periodType: "Yearly", startDate: "", endDate: "" });

    React.useEffect(() => {
        compositionRoot.qualityAnalysis.getById.execute(analysisId, metadataItem).run(
            analysis =>
                setInfo({
                    periodType: analysis.module.periodType,
                    startDate: analysis.startDate,
                    endDate: analysis.endDate,
                }),
            () => {}
        );
    }, [analysisId, compositionRoot.qualityAnalysis.getById, metadataItem]);

    return info;
}

export const IssueTable: React.FC<IssueTableProps> = React.memo(props => {
    const { analysisId, reload, sectionId, showExport, showStepFilter } = props;
    const [filters, setFilters] = React.useState(initialFilters);
    const analysisPeriodInfo = useAnalysisPeriodInfo(analysisId);

    const { tableConfig, refresh } = useTableConfig({
        filters,
        analysisId: analysisId,
        periodType: analysisPeriodInfo.periodType,
        sectionId: sectionId,
        showExport: showExport,
        showStepFilter: showStepFilter,
    });
    const { getRows, loading } = useGetRows(filters, reload, analysisId, sectionId, refresh);
    const config = useObjectsTable(tableConfig, getRows);

    const filterComponents = React.useMemo(() => {
        return (
            <IssueFilters
                initialFilters={filters}
                showStepFilter={showStepFilter}
                onChange={setFilters}
                periodType={analysisPeriodInfo.periodType}
                rangeStartDate={analysisPeriodInfo.startDate}
                rangeEndDate={analysisPeriodInfo.endDate}
            />
        );
    }, [filters, showStepFilter, analysisPeriodInfo]);

    return (
        <ObjectsTable
            loading={loading}
            {...config}
            filterComponents={filterComponents}
            onChangeSearch={undefined}
        />
    );
});

type IssueTableProps = {
    analysisId: Id;
    reload: number;
    sectionId: Maybe<Id>;
    showExport?: boolean;
    showStepFilter?: boolean;
};

type UseTableConfigProps = {
    analysisId: Id;
    filters: GetIssuesOptions["filters"];
    periodType: PeriodType;
    sectionId: Maybe<Id>;
    showExport?: boolean;
    showStepFilter?: boolean;
};

type UseCopyContactEmailsProps = { onSuccess?: () => void };
