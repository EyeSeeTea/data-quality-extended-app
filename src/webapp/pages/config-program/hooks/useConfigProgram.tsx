import { useLoading, useSnackbar, WizardStep } from "@eyeseetea/d2-ui-components";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import i18n from "$/utils/i18n";
import { ProgramSelectionStep } from "$/webapp/pages/config-program/steps/1-program-selection/ProgramSelectionStep";
import { ModulesSelectionStep } from "$/webapp/pages/config-program/steps/2-modules-selection/ModulesSelectionStep";
import { DefaultSettingsStep } from "$/webapp/pages/config-program/steps/3-default-settings/DefaultSettingsStep";
import { SummaryStep } from "$/webapp/pages/config-program/steps/4-summary/SummaryStep";
import { Code } from "$/domain/entities/Ref";
import { useModulesOptions } from "$/webapp/hooks/useModulesOptions";
import { useQualityIssuesPrograms } from "$/webapp/pages/config-program/hooks/useQualityIssuesPrograms";
import { useAppContext } from "$/webapp/contexts/app-context";
import {
    DataQualityIssuesProgramConfigOptions,
    initialState,
} from "$/domain/usecases/SaveDataQualityIssuesProgramConfigUseCase";

type State = {
    onBackSettingsPage: () => void;
    steps: WizardStep[];
    onStepChangeRequest: (currentStep: WizardStep) => Promise<string[] | undefined>;
};

type StepKey = "program-selection" | "modules-selection" | "default-settings" | "summary";

export function useConfigProgram(): State {
    const history = useHistory();
    const loading = useLoading();
    const snackBar = useSnackbar();
    const { compositionRoot } = useAppContext();
    const { qualityIssuesPrograms } = useQualityIssuesPrograms();
    const { modulesOptions } = useModulesOptions();

    const [configProgramState, setConfigProgramState] =
        useState<DataQualityIssuesProgramConfigOptions>(initialState);

    const notConfiguredProgramOptions = useMemo(() => {
        return qualityIssuesPrograms
            ?.filter(program => !program.modules.length)
            ?.map(program => ({
                text: program.name,
                value: program.code,
            }));
    }, [qualityIssuesPrograms]);

    const moduleOptionsNotConfigured = useMemo(() => {
        const allConfiguredModuleCodes =
            qualityIssuesPrograms?.flatMap(program => program.modules) || [];
        return modulesOptions.filter(option => !allConfiguredModuleCodes.includes(option.value));
    }, [qualityIssuesPrograms, modulesOptions]);

    const onBackSettingsPage = React.useCallback(() => history.push("/settings"), [history]);

    const updateConfig = React.useCallback(
        (patch: Partial<DataQualityIssuesProgramConfigOptions>) => {
            setConfigProgramState(prev => ({ ...prev, ...patch }));
        },
        []
    );

    const updateDefaultSettings = React.useCallback(
        (patch: Partial<DataQualityIssuesProgramConfigOptions["defaultSettings"]>) => {
            setConfigProgramState(prev => ({
                ...prev,
                defaultSettings: { ...prev.defaultSettings, ...patch },
            }));
        },
        []
    );

    const selectedModuleOptions = React.useMemo(() => {
        return moduleOptionsNotConfigured.filter(option =>
            configProgramState.selectedModuleCodes.includes(option.value)
        );
    }, [moduleOptionsNotConfigured, configProgramState.selectedModuleCodes]);

    const onSaveConfiguration = React.useCallback(() => {
        loading.show(true, i18n.t("Saving configuration..."));
        compositionRoot.dataQualityIssuesProgramConfig.save.execute(configProgramState).run(
            () => {
                loading.hide();
                snackBar.success(`Configuration saved successfully`);
                history.push("/settings");
            },
            err => {
                loading.hide();
                snackBar.error(`Error saving configuration: ${err.message}`);
            }
        );
    }, [
        compositionRoot.dataQualityIssuesProgramConfig.save,
        configProgramState,
        history,
        loading,
        snackBar,
    ]);

    const steps = React.useMemo((): WizardStep[] => {
        return [
            {
                component: ProgramSelectionStep,
                key: "program-selection",
                label: i18n.t("Data Quality Analysis Location"),
                props: {
                    options: notConfiguredProgramOptions,
                    value: configProgramState.selectedProgramCode,
                    onChange: (selectedProgramCode: Code | undefined) =>
                        updateConfig({ selectedProgramCode }),
                },
            },
            {
                component: ModulesSelectionStep,
                key: "modules-selection",
                label: i18n.t("Dataset Selection"),
                props: {
                    modulesOptions: moduleOptionsNotConfigured,
                    values: configProgramState.selectedModuleCodes,
                    onChange: (selectedModuleCodes: Code[]) =>
                        updateConfig({ selectedModuleCodes }),
                },
            },
            {
                component: DefaultSettingsStep,
                key: "default-settings",
                label: i18n.t("Default Analysis Settings"),
                props: {
                    selectedModuleOptions,
                    values: configProgramState.defaultSettings,
                    onChange: updateDefaultSettings,
                },
            },
            {
                component: SummaryStep,
                key: "summary",
                label: i18n.t("Summary"),
                props: {
                    programs: notConfiguredProgramOptions || [],
                    modules: moduleOptionsNotConfigured,
                    configProgramState: configProgramState,
                    onSaveConfiguration: onSaveConfiguration,
                },
            },
        ];
    }, [
        configProgramState,
        moduleOptionsNotConfigured,
        notConfiguredProgramOptions,
        onSaveConfiguration,
        selectedModuleOptions,
        updateConfig,
        updateDefaultSettings,
    ]);

    const validateStep = React.useCallback(
        async (stepKey: StepKey): Promise<string[] | undefined> => {
            let errors: string[] = [];

            if (stepKey === "program-selection") {
                if (!configProgramState.selectedProgramCode) {
                    errors = [
                        ...errors,
                        i18n.t(
                            "Select a location where data quality analysis issues will be created"
                        ),
                    ];
                }
            }

            if (stepKey === "modules-selection") {
                if (!configProgramState.selectedModuleCodes?.length) {
                    errors = [...errors, i18n.t("Select at least one Dataset")];
                }
            }

            if (stepKey === "default-settings") {
                const { dataSet, startDate, endDate } = configProgramState.defaultSettings ?? {};

                if (!dataSet) {
                    errors = [...errors, i18n.t("Select a default dataset")];
                }

                if (!startDate) {
                    errors = [...errors, i18n.t("Select a start date")];
                }

                if (!endDate) {
                    errors = [...errors, i18n.t("Select an end date")];
                }

                if (startDate && endDate && startDate > endDate) {
                    errors = [...errors, i18n.t("Start date must be before end date")];
                }
            }

            return errors.length ? errors : undefined;
        },
        [configProgramState]
    );

    const onStepChangeRequest = React.useCallback(
        async (currentStep: WizardStep) => {
            return validateStep(currentStep.key as StepKey);
        },
        [validateStep]
    );

    return {
        onBackSettingsPage: onBackSettingsPage,
        steps: steps,
        onStepChangeRequest: onStepChangeRequest,
    };
}
