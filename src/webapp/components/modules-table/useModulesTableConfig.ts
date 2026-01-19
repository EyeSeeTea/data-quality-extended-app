import i18n from "$/utils/i18n";
import { useTableUtils } from "$/webapp/hooks/useTable";
import { ModuleBaseViewModel } from "$/webapp/components/modules-table/ModuleBaseViewModel";
import { TableColumn, TableConfig } from "@eyeseetea/d2-ui-components";
import React from "react";

export function useModulesTableConfig(paginated: boolean): {
    tableConfig: TableConfig<ModuleBaseViewModel>;
} {
    const modulesColumns: TableColumn<ModuleBaseViewModel>[] = React.useMemo(() => {
        return [
            { name: "name", text: i18n.t("Module"), sortable: true },
            {
                name: "dataQualityIssuesProgramName",
                text: i18n.t("Data Quality Issues Program"),
                sortable: !paginated,
            },
        ];
    }, [paginated]);

    const { saveColumns, columnsToShow } = useTableUtils<ModuleBaseViewModel>({
        storageId: "modules",
        columns: modulesColumns,
    });

    const tableConfig = React.useMemo<TableConfig<ModuleBaseViewModel>>(() => {
        return {
            actions: [],
            columns: columnsToShow,
            initialSorting: paginated
                ? { field: "name", order: "asc" }
                : { field: "dataQualityIssuesProgramName", order: "asc" },
            paginationOptions: { pageSizeOptions: [10, 25, 50], pageSizeInitialValue: 25 },
            searchBoxLabel: i18n.t("Module Name"),
            onReorderColumns: saveColumns,
        };
    }, [columnsToShow, paginated, saveColumns]);

    return { tableConfig };
}
