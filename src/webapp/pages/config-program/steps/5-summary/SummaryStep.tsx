import { Button, CircularProgress } from "@material-ui/core";
import React, { useMemo } from "react";
import styled from "styled-components";

import i18n from "$/utils/i18n";
import { DataQualityIssuesProgramConfigOptions } from "$/domain/usecases/SaveDataQualityIssuesProgramConfigUseCase";
import { useCountriesByIds } from "$/webapp/hooks/useCountriesByIds";
import { Option } from "$/webapp/entities/Option";

type Props = {
    configProgramState: DataQualityIssuesProgramConfigOptions;
    onSaveConfiguration: () => void;
    programs: Option[];
    modules: Option[];
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

    const defaultModule = React.useMemo(() => {
        return (
            modules.find(m => m.value === configProgramState.defaultSettings.dataSet)?.text ||
            configProgramState.defaultSettings.dataSet
        );
    }, [configProgramState.defaultSettings.dataSet, modules]);

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <div>
            <div>
                <ul>
                    <li key={configProgramState.selectedProgramCode}>
                        {i18n.t("Data Quality Analysis Location: ", { nsSeparator: false })}
                        <ul>
                            <li>{programName}</li>
                        </ul>
                    </li>

                    <li key={configProgramState.selectedProgramCode}>
                        {i18n.t("Selected Datasets to be analysed: ", { nsSeparator: false })}
                        <ul>
                            {moduleNames.map(module => (
                                <li key={module}>{module}</li>
                            ))}
                        </ul>
                    </li>

                    <li>
                        {i18n.t("Default analysis settings: ", { nsSeparator: false })}
                        <ul>
                            <li key={defaultModule}>
                                {i18n.t("Dataset: ", { nsSeparator: false })} {defaultModule}
                            </li>

                            {configProgramState.defaultSettings.usePreviousYear ? (
                                <li key={configProgramState.defaultSettings.endDate}>
                                    {i18n.t("Use previous year for start and end dates")}
                                </li>
                            ) : (
                                <>
                                    <li key={configProgramState.defaultSettings.startDate}>
                                        {i18n.t("Start date: ", { nsSeparator: false })}
                                        {configProgramState.defaultSettings.startDate}
                                    </li>

                                    <li key={configProgramState.defaultSettings.endDate}>
                                        {i18n.t("End date: ", { nsSeparator: false })}{" "}
                                        {configProgramState.defaultSettings.endDate}
                                    </li>
                                </>
                            )}

                            {configProgramState.defaultSettings.orgUnits.length > 0 && (
                                <li key={configProgramState.defaultSettings.orgUnits.join(",")}>
                                    {i18n.t("Organisation Units: ", { nsSeparator: false })}{" "}
                                    {countries?.map(country => country.name).join(", ")}
                                </li>
                            )}
                        </ul>
                    </li>

                    <li key={configProgramState.selectedProgramCode}>
                        {i18n.t("Steps: ", { nsSeparator: false })}
                        <ul>
                            {configProgramState.steps
                                .sort((a, b) => a.order - b.order)
                                .map(step => (
                                    <li key={step.type}>
                                        {step.order}. {step.name}
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
                    {i18n.t("Save setup")}
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
