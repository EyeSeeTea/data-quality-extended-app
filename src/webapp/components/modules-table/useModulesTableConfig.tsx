import React from "react";
import { TableAction, TableColumn, TableConfig } from "@eyeseetea/d2-ui-components";
import DeleteOutlinedIcon from "@material-ui/icons/DeleteOutlined";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";

import i18n from "$/utils/i18n";
import { useTableUtils } from "$/webapp/hooks/useTable";
import { ModuleBaseViewModel } from "$/webapp/components/modules-table/ModuleBaseViewModel";
import { Id } from "$/domain/entities/Ref";

type State = {
    tableConfig: TableConfig<ModuleBaseViewModel>;
};

type Props = {
    paginated: boolean;
    onEdit: (id: Id) => void;
    onRemove: (id: Id) => void;
};

export function useModulesTableConfig({ paginated, onEdit, onRemove }: Props): State {
    const modulesColumns: TableColumn<ModuleBaseViewModel>[] = React.useMemo(() => {
        return [
            { name: "name", text: i18n.t("Dataset"), sortable: true },
            {
                name: "dataQualityIssuesProgramName",
                text: i18n.t("Data Quality Analysis Location"),
                sortable: !paginated,
            },
        ];
    }, [paginated]);

    const { saveColumns, columnsToShow } = useTableUtils<ModuleBaseViewModel>({
        storageId: "modules",
        columns: modulesColumns,
    });

    const actions = React.useMemo((): TableAction<ModuleBaseViewModel>[] => {
        return [
            {
                multiple: false,
                name: "Edit",
                icon: <EditOutlinedIcon />,
                text: i18n.t("Edit data quality analysis setup"),
                onClick: (ids: Id[]) => {
                    if (ids[0]) onEdit(ids[0]);
                },
                isActive: (rows: ModuleBaseViewModel[]) =>
                    rows.every(row => !!row.dataQualityIssuesProgramCode),
            },
            {
                multiple: false,
                name: "Delete",
                icon: <DeleteOutlinedIcon />,
                text: i18n.t("Delete data quality analysis"),
                onClick: (ids: Id[]) => {
                    if (ids[0]) onRemove(ids[0]);
                },
                isActive: (rows: ModuleBaseViewModel[]) =>
                    rows.every(row => !!row.dataQualityIssuesProgramCode),
            },
        ];
    }, [onRemove, onEdit]);

    const tableConfig = React.useMemo<TableConfig<ModuleBaseViewModel>>(() => {
        return {
            actions: actions,
            columns: columnsToShow,
            initialSorting: paginated
                ? { field: "name", order: "asc" }
                : { field: "dataQualityIssuesProgramName", order: "asc" },
            paginationOptions: { pageSizeOptions: [10, 25, 50], pageSizeInitialValue: 25 },
            searchBoxLabel: i18n.t("Dataset Name"),
            onReorderColumns: saveColumns,
        };
    }, [actions, columnsToShow, paginated, saveColumns]);

    return { tableConfig };
}
