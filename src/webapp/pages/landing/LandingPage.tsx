import React, { useCallback, useEffect } from "react";
import { IconButton } from "material-ui";
import styled from "styled-components";
import { Dropdown } from "@eyeseetea/d2-ui-components/dropdown/Dropdown";
import SettingsIcon from "@material-ui/icons/Settings";
import { useHistory } from "react-router-dom";

import i18n from "$/utils/i18n";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import { useConfiguredQualityIssuesProgram } from "$/webapp/hooks/useConfiguredQualityIssuesProgram";
import { useAppContext } from "$/webapp/contexts/app-context";
import { ProgramSelectorContainer } from "$/webapp/pages/config-program/steps/ProgramSelectorContainer";

type Props = { name: string };

export const LandingPage: React.FC<Props> = React.memo(props => {
    const { name } = props;
    const {
        configuredQualityProgramIssuesOptions,
        selectedProgramCode,
        onSelectQualityProgramIssues,
    } = useConfiguredQualityIssuesProgram();
    const { currentUser } = useAppContext();
    const history = useHistory();

    const goToSettings = useCallback(() => {
        history.push(`/settings`);
    }, [history]);

    useEffect(() => {
        if (configuredQualityProgramIssuesOptions?.length === 1) {
            const [program] = configuredQualityProgramIssuesOptions;

            if (!program) return;

            onSelectQualityProgramIssues(program.value);
        }
    }, [configuredQualityProgramIssuesOptions, history, onSelectQualityProgramIssues]);

    if (!configuredQualityProgramIssuesOptions?.length) {
        return null;
    }

    return (
        <PageContainer>
            <HeaderContainer>
                <PageHeader title={i18n.t(name)} />

                {currentUser.isAdmin() && (
                    <StyledIconButton onClick={goToSettings} style={{ position: "absolute" }}>
                        <SettingsIcon />
                    </StyledIconButton>
                )}
            </HeaderContainer>

            <ProgramSelectorContainer>
                <Dropdown
                    items={configuredQualityProgramIssuesOptions}
                    onChange={onSelectQualityProgramIssues}
                    value={selectedProgramCode}
                    label={i18n.t("Data Quality Issues Programs")}
                />
            </ProgramSelectorContainer>
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
