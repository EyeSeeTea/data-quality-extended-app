import React from "react";
import Button from "@material-ui/core/Button";

import i18n from "$/utils/i18n";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import styled from "styled-components";
import { useSettings } from "$/webapp/hooks/useSettings";
import { ModulesTable } from "$/webapp/components/modules-table/ModulesTable";

export const SettingsPage: React.FC = React.memo(() => {
    const { onConfigurateNewProgram, onBackHomePage, qualityIssuesPrograms } = useSettings();

    return (
        <PageContainer>
            <PageHeader title={i18n.t("Settings")} onBackClick={onBackHomePage} />

            <Container>
                <RowContainer>
                    <Button
                        aria-controls="simple-menu"
                        aria-haspopup="true"
                        variant="contained"
                        color="primary"
                        onClick={onConfigurateNewProgram}
                    >
                        {i18n.t("Configurate new program")}
                    </Button>
                </RowContainer>
            </Container>

            {qualityIssuesPrograms && (
                <ModulesTable qualityIssuesPrograms={qualityIssuesPrograms} />
            )}
        </PageContainer>
    );
});

const Container = styled.div``;

const RowContainer = styled.div`
    margin-block: 16px;
    display: flex;
    gap: 16px;
    flex-direction: row;
    justify-content: flex-end;
`;
