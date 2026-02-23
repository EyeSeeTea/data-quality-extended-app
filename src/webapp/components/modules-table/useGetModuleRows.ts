import { GetRows } from "@eyeseetea/d2-ui-components";
import React from "react";

import { ModuleBase } from "$/domain/entities/Module";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import i18n from "$/utils/i18n";
import { useAppContext } from "$/webapp/contexts/app-context";
import { ModuleBaseViewModel } from "$/webapp/components/modules-table/ModuleBaseViewModel";
import { Future } from "$/domain/entities/generic/Future";

type State = {
    getRows: GetRows<ModuleBaseViewModel>;
    loading: boolean;
    allModuleViewsRef: React.MutableRefObject<ModuleBaseViewModel[]>;
};

export function useGetModuleRows(paginated: boolean, reloadKey: number): State {
    const { compositionRoot } = useAppContext();

    const [loading, setLoading] = React.useState(false);
    const allModuleViewsRef = React.useRef<ModuleBaseViewModel[]>([]);

    const getRows = React.useCallback<GetRows<ModuleBaseViewModel>>(
        (search, pagination, sorting) => {
            console.debug(reloadKey);
            return new Promise((resolve, reject) => {
                setLoading(true);
                return Future.joinObj({
                    modulesResponse: compositionRoot.modules.getAllBase.execute({
                        sorting:
                            sorting.field === "dataQualityIssuesProgramName"
                                ? undefined
                                : { field: sorting.field, order: sorting.order },
                        filters: {
                            name: search,
                        },
                    }),
                    qualityIssuesPrograms: compositionRoot.qualityIssuesProgram.getAll.execute(),
                }).run(
                    ({ modulesResponse, qualityIssuesPrograms }) => {
                        setLoading(false);
                        const objectsMapped = !qualityIssuesPrograms
                            ? []
                            : buildViewModels(modulesResponse, qualityIssuesPrograms);
                        const objectsSorted =
                            sorting.field === "dataQualityIssuesProgramName"
                                ? sortByAssignedProgramAndName(objectsMapped, sorting.order)
                                : objectsMapped;
                        allModuleViewsRef.current = objectsSorted;

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
        [compositionRoot.modules.getAllBase, compositionRoot.qualityIssuesProgram.getAll, reloadKey]
    );

    const getRowsPaginated = React.useCallback<GetRows<ModuleBaseViewModel>>(
        (search, pagination, sorting) => {
            console.debug(reloadKey);
            return new Promise((resolve, reject) => {
                setLoading(true);
                return Future.joinObj({
                    modulesResponse: compositionRoot.modules.getPaginated.execute({
                        pagination: {
                            page: pagination.page,
                            pageSize: pagination.pageSize,
                        },
                        sorting: { field: sorting.field, order: sorting.order },
                        filters: {
                            name: search,
                        },
                    }),
                    qualityIssuesPrograms: compositionRoot.qualityIssuesProgram.getAll.execute(),
                }).run(
                    ({ modulesResponse, qualityIssuesPrograms }) => {
                        setLoading(false);
                        const rows = !qualityIssuesPrograms
                            ? []
                            : buildViewModels(modulesResponse.rows, qualityIssuesPrograms);

                        allModuleViewsRef.current = rows;
                        resolve({
                            pager: modulesResponse.pagination,
                            objects: rows,
                        });
                    },
                    err => {
                        setLoading(false);
                        reject(new Error(err.message));
                    }
                );
            });
        },
        [
            compositionRoot.modules.getPaginated,
            compositionRoot.qualityIssuesProgram.getAll,
            reloadKey,
        ]
    );

    return {
        getRows: paginated ? getRowsPaginated : getRows,
        loading: loading,
        allModuleViewsRef: allModuleViewsRef,
    };
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

const buildViewModels = (
    modules: ModuleBase[],
    qualityIssuesPrograms: QualityIssuesProgram[]
): ModuleBaseViewModel[] => {
    return modules.map(moduleBase => {
        const program = qualityIssuesPrograms.find(program =>
            program.modules.includes(moduleBase.code)
        );
        return {
            ...moduleBase,
            dataQualityIssuesProgramCode: program?.code,
            dataQualityIssuesProgramName: program?.name || i18n.t("No configured"),
        };
    });
};
