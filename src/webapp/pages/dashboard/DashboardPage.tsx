import React from "react";
import { ObjectsTable, useObjectsTable } from "@eyeseetea/d2-ui-components";
import styled from "styled-components";
import SettingsIcon from "@material-ui/icons/Settings";
import { IconButton } from "material-ui";
import { useHistory, useParams } from "react-router-dom";

import i18n from "$/utils/i18n";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import {
    AnalysisFilterState,
    AnalysisFilters,
    initialFilters,
} from "$/webapp/components/analysis-filter/AnalysisFilter";
import {
    useAnalysisMethods,
    useGetRows,
    useTableConfig,
} from "$/webapp/hooks/useQualityAnalysisTable";
import { useModules } from "$/webapp/hooks/useModule";
import { Module } from "$/domain/entities/Module";
import { Code, Id } from "$/domain/entities/Ref";
import { ActionType } from "$/webapp/components/analysis-actions/AnalysisActions";
import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import { useAppContext } from "$/webapp/contexts/app-context";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { useConfiguredQualityIssuesProgram } from "$/webapp/hooks/useConfiguredQualityIssuesProgram";

export const DashboardPage: React.FC = React.memo(() => {
    const { qualityIssuesProgramCode } = useParams<{
        qualityIssuesProgramCode: Code;
    }>();
    const { metadataItem } = useMetadataItemContext();
    const { configuredQualityProgramIssuesOptions } = useConfiguredQualityIssuesProgram();

    const [reload, refreshReload] = React.useState(0);
    const [selectedIds, setSelectedIds] = React.useState<{ action: ActionType; ids: Id[] }>();
    const [filters, setFilters] = React.useState<AnalysisFilterState>(initialFilters);
    const history = useHistory();
    const { currentUser } = useAppContext();

    const { createQualityAnalysis, removeQualityAnalysis, updateStatusQualityAnalysis } =
        useAnalysisMethods({
            onSuccess: id => {
                history.push(`/${qualityIssuesProgramCode}/analysis/${id}`);
            },
            onRemove: () => {
                setSelectedIds(undefined);
                refreshReload(reload + 1);
            },
        });

    const { tableConfig } = useTableConfig({
        onRemoveQualityAnalysis: React.useCallback(
            (ids, action) => {
                if (action === "open" && ids[0]) {
                    history.push(`/${qualityIssuesProgramCode}/analysis/${ids[0]}`);
                } else {
                    setSelectedIds({ action, ids });
                }
            },
            [history, qualityIssuesProgramCode]
        ),
    });

    const { getRows, loading } = useGetRows(filters, reload);

    const modules = useModules();

    const config = useObjectsTable(tableConfig, getRows);

    const onCreateAnalysis = React.useCallback(
        (selectedModule: Module) => {
            createQualityAnalysis(selectedModule, "");
        },
        [createQualityAnalysis]
    );

    const onRemoveAnalysis = React.useCallback(() => {
        if (!selectedIds) return false;
        if (selectedIds.action === "delete") {
            removeQualityAnalysis(selectedIds.ids);
        } else if (selectedIds.action === "inprogress" || selectedIds.action === "completed") {
            updateStatusQualityAnalysis(selectedIds.ids, selectedIds.action);
        }
    }, [removeQualityAnalysis, selectedIds, updateStatusQualityAnalysis]);

    const filterComponents = React.useMemo(() => {
        return (
            <AnalysisFilters
                modules={modules}
                initialFilters={filters}
                onChange={setFilters}
                onCreateAnalysis={onCreateAnalysis}
            />
        );
    }, [filters, modules, onCreateAnalysis]);

    const onBackHomePage = React.useCallback(() => history.push("/"), [history]);

    const goToSettings = React.useCallback(() => {
        history.push(`/settings`);
    }, [history]);

    return (
        <PageContainer>
            <HeaderContainer>
                <PageHeader
                    title={i18n.t(
                        `Data Quality Analysis: ${metadataItem.programs.qualityIssues.name}`
                    )}
                    onBackClick={
                        configuredQualityProgramIssuesOptions?.length === 1
                            ? undefined
                            : onBackHomePage
                    }
                />

                {currentUser.isAdmin() && (
                    <StyledIconButton onClick={goToSettings} style={{ position: "absolute" }}>
                        <SettingsIcon />
                    </StyledIconButton>
                )}
            </HeaderContainer>

            <ObjectsTable
                loading={loading}
                {...config}
                filterComponents={filterComponents}
                paginationOptions={{ renderPosition: { bottom: true, top: false } }}
                hideSelectionMessages
            />
            <ConfirmationDialog
                isOpen={selectedIds && selectedIds.ids.length > 0}
                title={i18n.t("Are you sure you want to {{action}} the selected rows?", {
                    action: selectedIds && selectedIds.action === "delete" ? "remove" : "update",
                })}
                onSave={onRemoveAnalysis}
                onCancel={() => setSelectedIds(undefined)}
                saveText={i18n.t("Yes, {{actionButton}}", {
                    actionButton:
                        selectedIds && selectedIds.action === "delete" ? "Delete" : "Update",
                })}
                cancelText={i18n.t("Cancel")}
                fullWidth={true}
                disableEnforceFocus
            />
        </PageContainer>
    );
});

const HeaderContainer = styled.div`
    position: relative;
`;

const StyledIconButton = styled(IconButton)`
    top: 0;
    right: 0;
`;
