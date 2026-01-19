import React from "react";
import Button from "@material-ui/core/Button";
import CloudDownloadIcon from "@material-ui/icons/CloudDownload";

import i18n from "$/utils/i18n";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import styled from "styled-components";
import { useSettings } from "$/webapp/hooks/useSettings";
import { ModulesTable } from "$/webapp/components/modules-table/ModulesTable";
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";

export const SettingsPage: React.FC = React.memo(() => {
    const {
        onConfigurateNewProgram,
        onBackHomePage,
        qualityIssuesPrograms,
        onDownloadMetadataPackageTemplate,
        openDownloadMetadataPackage,
        setOpenDownloadMetadataPackage,
    } = useSettings();

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

                    <Button
                        aria-controls="simple-menu"
                        aria-haspopup="true"
                        variant="outlined"
                        color="primary"
                        onClick={() => setOpenDownloadMetadataPackage(true)}
                        startIcon={<CloudDownloadIcon />}
                    >
                        {i18n.t("Download metadata template")}
                    </Button>
                </RowContainer>
            </Container>

            {qualityIssuesPrograms && (
                <ModulesTable qualityIssuesPrograms={qualityIssuesPrograms} />
            )}

            <ConfirmationDialog
                isOpen={openDownloadMetadataPackage}
                title={i18n.t("Download metadata package")}
                description={i18n.t("TODO: Add instructions about downloading metadata package.")}
                onSave={onDownloadMetadataPackageTemplate}
                onCancel={() => setOpenDownloadMetadataPackage(false)}
                saveText={i18n.t("Download")}
                cancelText={i18n.t("Cancel")}
                fullWidth={true}
                disableEnforceFocus
            />
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
