import React from "react";

import i18n from "$/utils/i18n";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import { Dropdown } from "@eyeseetea/d2-ui-components/dropdown/Dropdown";
import styled from "styled-components";
import { useQualityIssuesProgram } from "$/webapp/hooks/useQualityIssuesProgram";

type Props = { name: string };

export const LandingPage: React.FC<Props> = React.memo(props => {
    const { name } = props;
    const { qualityProgramIssuesOptions, selectedProgramCode, onSelectQualityProgramIssues } =
        useQualityIssuesProgram();

    if (!qualityProgramIssuesOptions?.length) {
        return null;
    }

    return (
        <PageContainer>
            <PageHeader title={i18n.t(name)} />

            <ProgramSelectorContainer>
                <Dropdown
                    items={qualityProgramIssuesOptions}
                    onChange={onSelectQualityProgramIssues}
                    value={selectedProgramCode}
                    label={i18n.t("Quality Issues Program")}
                />
            </ProgramSelectorContainer>
        </PageContainer>
    );
});

const ProgramSelectorContainer = styled.div`
    margin: 16px 0;

    > div {
        min-width: 300px;
    }
`;
