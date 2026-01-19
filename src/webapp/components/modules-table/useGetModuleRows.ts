import { GetRows } from "@eyeseetea/d2-ui-components";
import React from "react";

import { ModuleBase } from "$/domain/entities/Module";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import i18n from "$/utils/i18n";
import { useAppContext } from "$/webapp/contexts/app-context";
import { ModuleBaseViewModel } from "$/webapp/components/modules-table/ModuleBaseViewModel";

export function useGetModuleRows(
    qualityIssuesPrograms: QualityIssuesProgram[],
    paginated: boolean
): {
    getRows: GetRows<ModuleBaseViewModel>;
    loading: boolean;
} {
    const { compositionRoot } = useAppContext();

    const [loading, setLoading] = React.useState(false);

    const buildViewModel = React.useCallback(
        (moduleBase: ModuleBase): ModuleBaseViewModel => {
            const program = qualityIssuesPrograms.find(program =>
                program.modules.includes(moduleBase.code)
            );
            return {
                ...moduleBase,
                dataQualityIssuesProgramCode: program?.code,
                dataQualityIssuesProgramName: program?.name || i18n.t("No program assigned"),
            };
        },
        [qualityIssuesPrograms]
    );

    const getRows = React.useCallback<GetRows<ModuleBaseViewModel>>(
        (search, pagination, sorting) => {
            return new Promise((resolve, reject) => {
                setLoading(true);
                return compositionRoot.modules.getAllBase
                    .execute({
                        sorting:
                            sorting.field === "dataQualityIssuesProgramName"
                                ? undefined
                                : { field: sorting.field, order: sorting.order },
                        filters: {
                            name: search,
                        },
                    })
                    .run(
                        response => {
                            setLoading(false);
                            const objectsMapped = response.map(buildViewModel);
                            const objectsSorted =
                                sorting.field === "dataQualityIssuesProgramName"
                                    ? sortByAssignedProgramAndName(objectsMapped, sorting.order)
                                    : objectsMapped;

                            resolve({
                                pager: {
                                    page: 1,
                                    pageSize: objectsSorted.length,
                                    pageCount: 1,
                                    total: objectsSorted.length,
                                },
                                objects: objectsSorted,
                            });
                        },
                        err => {
                            setLoading(false);
                            reject(new Error(err.message));
                        }
                    );
            });
        },
        [buildViewModel, compositionRoot.modules.getAllBase]
    );

    const getRowsPaginated = React.useCallback<GetRows<ModuleBaseViewModel>>(
        (search, pagination, sorting) => {
            return new Promise((resolve, reject) => {
                setLoading(true);
                return compositionRoot.modules.getPaginated
                    .execute({
                        pagination: {
                            page: pagination.page,
                            pageSize: pagination.pageSize,
                        },
                        sorting: { field: sorting.field, order: sorting.order },
                        filters: {
                            name: search,
                        },
                    })
                    .run(
                        response => {
                            setLoading(false);
                            resolve({
                                pager: response.pagination,
                                objects: response.rows.map(buildViewModel),
                            });
                        },
                        err => {
                            setLoading(false);
                            reject(new Error(err.message));
                        }
                    );
            });
        },
        [buildViewModel, compositionRoot.modules.getPaginated]
    );

    return { getRows: paginated ? getRowsPaginated : getRows, loading };
}

const sortByAssignedProgramAndName = (objects: ModuleBaseViewModel[], order: "asc" | "desc") => {
    const assignedFirst = order === "asc";

    return [...objects].sort((a, b) => {
        const aHas = Boolean(a.dataQualityIssuesProgramCode);
        const bHas = Boolean(b.dataQualityIssuesProgramCode);

        if (aHas !== bHas) {
            if (assignedFirst) return aHas ? -1 : 1;
            return aHas ? 1 : -1;
        }

        return (a.name ?? "").localeCompare(b.name ?? "");
    });
};
