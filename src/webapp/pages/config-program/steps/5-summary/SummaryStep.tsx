import { Button, CircularProgress } from "@material-ui/core";
import React, { useMemo } from "react";
import styled from "styled-components";

import i18n from "$/utils/i18n";
import { DataQualityIssuesProgramConfigOptions } from "$/domain/usecases/SaveDataQualityIssuesProgramConfigUseCase";
import { useCountriesByIds } from "$/webapp/hooks/useCountriesByIds";
import { getStepTypeLabel } from "$/webapp/pages/config-program/getStepTypeLabel";

type Props = {
    configProgramState: DataQualityIssuesProgramConfigOptions;
    onSaveConfiguration: () => void;
    programs: { text: string; value: string }[];
    modules: { text: string; value: string }[];
};

export const SummaryStep: React.FC<Props> = React.memo(props => {
    const { configProgramState, onSaveConfiguration, modules, programs } = props;
    const { countries, isLoading } = useCountriesByIds(configProgramState.defaultSettings.orgUnits);

    const programName = useMemo(() => {
        return (
            programs.find(p => p.value === configProgramState.selectedProgramCode)?.text ||
            configProgramState.selectedProgramCode
        );
    }, [configProgramState.selectedProgramCode, programs]);

    const moduleNames = useMemo(() => {
        return configProgramState.selectedModuleCodes.map(
            moduleCode => modules.find(m => m.value === moduleCode)?.text || moduleCode
        );
    }, [configProgramState.selectedModuleCodes, modules]);

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <div>
            <div>
                <ul>
                    <li key={configProgramState.selectedProgramCode}>
                        {i18n.t("Data Quality Issues Program: ")}
                        {programName}
                    </li>

                    <li key={configProgramState.selectedProgramCode}>
                        {i18n.t("Modules: ")}
                        <ul>
                            {moduleNames.map(module => (
                                <li key={module}>{module}</li>
                            ))}
                        </ul>
                    </li>

                    <li>
                        {i18n.t("Default settings: ")}
                        <ul>
                            <li key={configProgramState.defaultSettings.dataSet}>
                                {i18n.t("Module: ")} {configProgramState.defaultSettings.dataSet}
                            </li>

                            {configProgramState.defaultSettings.usePreviousYear ? (
                                <li key={configProgramState.defaultSettings.endDate}>
                                    {i18n.t("Use previous year for start and end dates")}
                                </li>
                            ) : (
                                <>
                                    <li key={configProgramState.defaultSettings.startDate}>
                                        {i18n.t("Start date: ")}
                                        {configProgramState.defaultSettings.startDate}
                                    </li>

                                    <li key={configProgramState.defaultSettings.endDate}>
                                        {i18n.t("End date: ")}{" "}
                                        {configProgramState.defaultSettings.endDate}
                                    </li>
                                </>
                            )}

                            <li key={configProgramState.defaultSettings.orgUnits.join(",")}>
                                {i18n.t("Organisation Units: ")}{" "}
                                {countries?.map(country => country.name).join(", ")}
                            </li>
                        </ul>
                    </li>

                    <li key={configProgramState.selectedProgramCode}>
                        {i18n.t("Steps: ")}
                        <ul>
                            {configProgramState.steps
                                .sort((a, b) => a.order - b.order)
                                .map(step => (
                                    <li key={step.type}>
                                        {step.order}. {getStepTypeLabel(step.type)}
                                    </li>
                                ))}
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
