import React from "react";
import { Wizard } from "@eyeseetea/d2-ui-components";

import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import i18n from "$/utils/i18n";
import { useConfigProgram } from "$/webapp/pages/config-program/hooks/useConfigProgram";
import { CircularProgress } from "@material-ui/core";

export const ConfigProgramPage: React.FC = React.memo(() => {
    const { onBackSettingsPage, steps, onStepChangeRequest, initialStepKey } = useConfigProgram();

    return (
        <PageContainer>
            <PageHeader
                title={i18n.t("Data Quality Analysis Setup")}
                onBackClick={onBackSettingsPage}
            />

            {steps.length === 0 ? (
                <CircularProgress />
            ) : (
                <Wizard
                    lastClickableStepIndex={steps.length}
                    initialStepKey={initialStepKey}
                    steps={steps}
                    onStepChangeRequest={onStepChangeRequest}
                    useSnackFeedback
                />
            )}
        </PageContainer>
    );
});
