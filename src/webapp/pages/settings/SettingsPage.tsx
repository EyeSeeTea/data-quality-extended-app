import React from "react";
import Button from "@material-ui/core/Button";

import i18n from "$/utils/i18n";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import styled from "styled-components";
import { useSettings } from "$/webapp/hooks/useSettings";
import { ModulesTable } from "$/webapp/components/modules-table/ModulesTable";
import { MenuButton } from "$/webapp/components/menu-button/MenuButton";

export const SettingsPage: React.FC = React.memo(() => {
    const {
        onConfigurateNewProgram,
        onBackHomePage,
        qualityIssuesPrograms,
        onEditNewProgram,
        currentOptionsToEdit,
    } = useSettings();

    return (
        <PageContainer>
            <PageHeader
                title={i18n.t("Data Quality Analysis Settings")}
                onBackClick={onBackHomePage}
            />

            <RowContainer>
                <RowContainer>
                    <Button
                        aria-controls="simple-menu"
                        aria-haspopup="true"
                        variant="contained"
                        color="primary"
                        onClick={onConfigurateNewProgram}
                    >
                        {i18n.t("Set up data quality analysis")}
                    </Button>
                </RowContainer>

                {currentOptionsToEdit.length > 0 && (
                    <MenuButton
                        label={i18n.t("Edit data quality analysis setup")}
                        items={currentOptionsToEdit}
                        onItemSelected={onEditNewProgram}
                        buttonVariant="outlined"
                    />
                )}
            </RowContainer>

            {qualityIssuesPrograms && (
                <ModulesTable qualityIssuesPrograms={qualityIssuesPrograms} />
            )}
        </PageContainer>
    );
});

const RowContainer = styled.div`
    display: flex;
    gap: 16px;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    margin-inline-end: 4px;
`;
