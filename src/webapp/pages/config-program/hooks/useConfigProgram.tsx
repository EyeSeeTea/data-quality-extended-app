import { useLoading, useSnackbar, WizardStep } from "@eyeseetea/d2-ui-components";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import i18n from "$/utils/i18n";
import { ProgramSelectionStep } from "$/webapp/pages/config-program/steps/1-program-selection/ProgramSelectionStep";
import { ModulesSelectionStep } from "$/webapp/pages/config-program/steps/2-modules-selection/ModulesSelectionStep";
import { DefaultSettingsStep } from "$/webapp/pages/config-program/steps/3-default-settings/DefaultSettingsStep";
import { SummaryStep } from "$/webapp/pages/config-program/steps/5-summary/SummaryStep";
import { Code } from "$/domain/entities/Ref";
import { useModulesOptions } from "$/webapp/hooks/useModulesOptions";
import { useQualityIssuesPrograms } from "$/webapp/pages/config-program/hooks/useQualityIssuesPrograms";
import { useAppContext } from "$/webapp/contexts/app-context";
import {
    DataQualityIssuesProgramConfigOptions,
    initialState,
} from "$/domain/usecases/SaveDataQualityIssuesProgramConfigUseCase";
import { StepsSettingsStep } from "$/webapp/pages/config-program/steps/4-steps-settings/StepsSettingsStep";
import { StepSettings } from "$/domain/entities/StepSettings";

type State = {
    onBackSettingsPage: () => void;
    steps: WizardStep[];
    onStepChangeRequest: (currentStep: WizardStep) => Promise<string[] | undefined>;
};

type StepKey =
    | "program-selection"
    | "modules-selection"
    | "default-settings"
    | "steps-settings"
    | "summary";

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
        return (
            qualityIssuesPrograms
                ?.filter(program => !program.modules.length)
                ?.map(program => ({
                    text: program.name,
                    value: program.code,
                })) || []
        );
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

    const sections = useMemo(() => {
        return (
            qualityIssuesPrograms?.find(
                program => program.code === configProgramState.selectedProgramCode
            )?.sections || []
        );
    }, [configProgramState.selectedProgramCode, qualityIssuesPrograms]);

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
                label: i18n.t("Program Selection"),
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
                label: i18n.t("Modules Selection"),
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
                label: i18n.t("Default Settings"),
                props: {
                    selectedModuleOptions,
                    values: configProgramState.defaultSettings,
                    onChange: updateDefaultSettings,
                },
            },
            {
                component: StepsSettingsStep,
                key: "steps-settings",
                label: i18n.t("Steps Configuration"),
                props: {
                    value: configProgramState.steps,
                    onChange: (steps: StepSettings[]) => updateConfig({ steps }),
                    sections: sections,
                },
            },
            {
                component: SummaryStep,
                key: "summary",
                label: i18n.t("Summary"),
                props: {
                    programs: notConfiguredProgramOptions,
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
        sections,
    ]);

    const validateStep = React.useCallback(
        async (stepKey: StepKey): Promise<string[] | undefined> => {
            let errors: string[] = [];

            if (stepKey === "program-selection") {
                if (!configProgramState.selectedProgramCode) {
                    errors = [...errors, i18n.t("Select a program")];
                }
            }

            if (stepKey === "modules-selection") {
                if (!configProgramState.selectedModuleCodes?.length) {
                    errors = [...errors, i18n.t("Select at least one module")];
                }
            }

            if (stepKey === "default-settings") {
                const { dataSet, startDate, endDate, usePreviousYear } =
                    configProgramState.defaultSettings ?? {};

                if (!dataSet) {
                    errors = [...errors, i18n.t("Select a default dataset")];
                }

                if (!usePreviousYear) {
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
            }

            if (stepKey === "steps-settings") {
                const expectedSectionIds = sections.map(s => s.id);
                const configuredSectionIds = (configProgramState.steps ?? []).map(s => s.sectionId);
                const isEverythingConfigured =
                    expectedSectionIds.length === configuredSectionIds.length &&
                    expectedSectionIds.every(id => configuredSectionIds.includes(id));

                if (!isEverythingConfigured) {
                    errors = [...errors, i18n.t("All program stages must be configured")];
                }
            }

            return errors.length ? errors : undefined;
        },
        [
            configProgramState.defaultSettings,
            configProgramState.selectedModuleCodes?.length,
            configProgramState.selectedProgramCode,
            configProgramState.steps,
            sections,
        ]
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
