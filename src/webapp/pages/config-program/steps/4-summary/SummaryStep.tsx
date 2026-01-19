import { Button } from "@material-ui/core";
import React from "react";
import styled from "styled-components";

import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";
import i18n from "$/utils/i18n";

type Props = {
    configProgramState: DataQualityIssuesProgramConfig;
    onSaveConfiguration: () => void;
};

export const SummaryStep: React.FC<Props> = React.memo(props => {
    const { configProgramState, onSaveConfiguration } = props;
    return (
        <div>
            <div>
                <ul>
                    <li key={configProgramState.selectedProgramCode}>
                        {i18n.t("Data Quality Issues Program: ")}
                        {configProgramState.selectedProgramCode}
                    </li>

                    <li key={configProgramState.selectedProgramCode}>
                        {i18n.t("Modules: ")}
                        <ul>
                            {configProgramState.selectedModuleCodes.map(moduleCode => (
                                <li key={moduleCode}>{moduleCode}</li>
                            ))}
                        </ul>
                    </li>

                    <li>
                        {i18n.t("Default settings: ")}
                        <ul>
                            <li key={configProgramState.defaultSettings.dataSet}>
                                {i18n.t("Module: ")} {configProgramState.defaultSettings.dataSet}
                            </li>

                            <li key={configProgramState.defaultSettings.startDate}>
                                {i18n.t("Start date: ")}
                                {configProgramState.defaultSettings.startDate}
                            </li>

                            <li key={configProgramState.defaultSettings.endDate}>
                                {i18n.t("End date: ")} {configProgramState.defaultSettings.endDate}
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>

            <ButtonContainer>
                <Button
                    aria-controls="simple-menu"
                    aria-haspopup="true"
                    variant="contained"
                    color="primary"
                    onClick={onSaveConfiguration}
                >
                    {i18n.t("Save Configuration")}
                </Button>
            </ButtonContainer>
        </div>
    );
});

const ButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-inline-end: 16px;
`;
