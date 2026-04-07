import React from "react";
import {
    ConfirmationDialog,
    ObjectsTable,
    useLoading,
    useObjectsTable,
    useSnackbar,
} from "@eyeseetea/d2-ui-components";
import styled from "styled-components";

import { useGetModuleRows } from "$/webapp/components/modules-table/useGetModuleRows";
import { useModulesTableConfig } from "$/webapp/components/modules-table/useModulesTableConfig";
import { Code, Id } from "$/domain/entities/Ref";
import { useHistory } from "react-router-dom";
import i18n from "$/utils/i18n";
import { useAppContext } from "$/webapp/contexts/app-context";

type ModulesTableProps = {
    paginated?: boolean;
};

export const ModulesTable: React.FC<ModulesTableProps> = React.memo(props => {
    const { paginated = false } = props;
    const { compositionRoot } = useAppContext();

    const history = useHistory();
    const snackbar = useSnackbar();
    const loading = useLoading();

    const [selectedDataQualityIssuesCode, setSelectedDataQualityIssuesCode] =
        React.useState<Code>();
    const [reload, refreshReload] = React.useState(0);

    const handleConfirmDelete = React.useCallback(() => {
        if (!selectedDataQualityIssuesCode) {
            return;
        }

        loading.show(true, i18n.t("Removing..."));
        return compositionRoot.dataQualityIssuesProgramConfig.remove
            .execute(selectedDataQualityIssuesCode)
            .run(
                () => {
                    snackbar.success(
                        i18n.t("Data quality analysis configuration removed successfully")
                    );
                    loading.hide();
                    setSelectedDataQualityIssuesCode(undefined);
                    refreshReload(reload + 1);
                },
                err => {
                    snackbar.error(err.message);
                    loading.hide();
                    setSelectedDataQualityIssuesCode(undefined);
                    refreshReload(reload + 1);
                }
            );
    }, [
        compositionRoot.dataQualityIssuesProgramConfig.remove,
        loading,
        reload,
        selectedDataQualityIssuesCode,
        snackbar,
    ]);

    const {
        getRows,
        loading: loadingModules,
        allModuleViewsRef,
    } = useGetModuleRows(paginated, reload);

    const onEdit = React.useCallback(
        (id: Id) => {
            const module = allModuleViewsRef.current.find(m => m.id === id);
            if (module?.dataQualityIssuesProgramCode) {
                history.push(`/configuration/${module.dataQualityIssuesProgramCode}`);
            }
        },
        [history, allModuleViewsRef]
    );

    const onRemove = React.useCallback(
        (id: Id) => {
            const module = allModuleViewsRef.current.find(m => m.id === id);
            if (module?.dataQualityIssuesProgramCode) {
                setSelectedDataQualityIssuesCode(module.dataQualityIssuesProgramCode);
            }
        },
        [allModuleViewsRef]
    );

    const { tableConfig } = useModulesTableConfig({
        paginated: paginated,
        onEdit: onEdit,
        onRemove: onRemove,
    });

    const config = useObjectsTable(tableConfig, getRows);

    return (
        <Container>
            <ObjectsTable
                loading={loadingModules}
                {...config}
                paginationOptions={{
                    renderPosition: {
                        top: paginated,
                        bottom: paginated,
                    },
                }}
            />

            <ConfirmationDialog
                isOpen={!!selectedDataQualityIssuesCode && selectedDataQualityIssuesCode.length > 0}
                title={i18n.t("Delete data quality analysis configuration")}
                description={
                    <div>
                        <p>
                            {i18n.t(
                                "This action will permanently delete the data quality analysis configuration."
                            )}
                        </p>
                        <p>
                            {i18n.t(
                                "All data quality analyses created using this configuration, " +
                                    "as well as their associated data quality issues, will also be deleted."
                            )}
                        </p>
                        <p>
                            <strong>
                                {i18n.t(
                                    "This action cannot be undone. Are you sure you want to proceed?"
                                )}
                            </strong>
                        </p>
                    </div>
                }
                onSave={handleConfirmDelete}
                onCancel={() => setSelectedDataQualityIssuesCode(undefined)}
                saveText={i18n.t("Yes, delete")}
                cancelText={i18n.t("Cancel")}
                fullWidth={true}
                disableEnforceFocus
            />
        </Container>
    );
});

const Container = styled.div``;
