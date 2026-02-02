import React from "react";
import { Wizard } from "@eyeseetea/d2-ui-components";

import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import i18n from "$/utils/i18n";
import { useConfigProgram } from "$/webapp/pages/config-program/hooks/useConfigProgram";

export const ConfigProgramPage: React.FC = React.memo(() => {
    const { onBackSettingsPage, steps, onStepChangeRequest } = useConfigProgram();

    return (
        <PageContainer>
            <PageHeader
                title={i18n.t("Data Quality Analysis Setup")}
                onBackClick={onBackSettingsPage}
            />

            <Wizard
                lastClickableStepIndex={steps.length}
                initialStepKey="program-selection"
                steps={steps}
                onStepChangeRequest={onStepChangeRequest}
                useSnackFeedback
            />
        </PageContainer>
    );
});
