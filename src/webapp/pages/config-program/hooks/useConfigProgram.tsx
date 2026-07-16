import { useLoading, useSnackbar, WizardStep } from "@eyeseetea/d2-ui-components";
import React, { useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

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
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";
import { Maybe } from "$/utils/ts-utils";
import { Country } from "$/domain/entities/Country";
import { PeriodType } from "$/domain/entities/PeriodType";
import { validateSamePeriodType } from "$/domain/entities/generic/validations";

type StepKey =
    | "program-selection"
    | "modules-selection"
    | "default-settings"
    | "steps-settings"
    | "summary";

type State = {
    onBackSettingsPage: () => void;
    steps: WizardStep[];
    onStepChangeRequest: (currentStep: WizardStep) => Promise<string[] | undefined>;
    initialStepKey: StepKey;
};

export function useConfigProgram(): State {
    const history = useHistory();
    const loading = useLoading();
    const snackBar = useSnackbar();
    const { qualityIssuesProgramCode } = useParams<{
        qualityIssuesProgramCode: Maybe<Code>;
    }>();
    const { compositionRoot } = useAppContext();
    const { qualityIssuesPrograms } = useQualityIssuesPrograms();
    const { modulesOptions, modules } = useModulesOptions();

    const isEdit = Boolean(qualityIssuesProgramCode);

    const [configProgramState, setConfigProgramState] =
        useState<DataQualityIssuesProgramConfigOptions>();

    React.useEffect(() => {
        if (isEdit && qualityIssuesProgramCode) {
            loading.show(true, i18n.t("Loading..."));

            return compositionRoot.dataQualityIssuesProgramConfig.get
                .execute(qualityIssuesProgramCode)
                .run(
                    configuration => {
                        const orgUnits = configuration.defaultSettings.orgUnits;

                        if (!orgUnits || orgUnits.length === 0) {
                            setConfigProgramState(
                                getDataQualityIssuesProgramConfigOptions(configuration)
                            );
                            loading.hide();
                            return;
                        }

                        compositionRoot.countries.getByIds.execute(orgUnits).run(
                            countries => {
                                setConfigProgramState(
                                    getDataQualityIssuesProgramConfigOptions(
                                        configuration,
                                        countries
                                    )
                                );
                                loading.hide();
                            },
                            err => {
                                loading.hide();
                                snackBar.error(`Error: ${err.message}`);
                            }
                        );
                    },
                    err => {
                        loading.hide();
                        snackBar.error(`Error: ${err.message}`);
                    }
                );
        } else {
            setConfigProgramState(initialState);
        }
    }, [
        compositionRoot.countries.getByIds,
        compositionRoot.dataQualityIssuesProgramConfig.get,
        isEdit,
        loading,
        qualityIssuesProgramCode,
        snackBar,
    ]);

    const programOptions = useMemo(() => {
        const notConfiguredProgramOptions =
            qualityIssuesPrograms
                ?.filter(program => !program.modules.length)
                ?.map(program => ({
                    text: program.name,
                    value: program.code,
                })) ?? [];

        const current = qualityIssuesPrograms?.find(
            p => p.code === configProgramState?.selectedProgramCode
        );

        const currentOption = current
            ? {
                  text: current.name,
                  value: current.code,
              }
            : undefined;

        return currentOption && isEdit
            ? [...notConfiguredProgramOptions, currentOption]
            : notConfiguredProgramOptions;
    }, [configProgramState?.selectedProgramCode, isEdit, qualityIssuesPrograms]);

    const moduleOptionsAvailable = useMemo(() => {
        const allConfigured = qualityIssuesPrograms?.flatMap(program => program.modules) ?? [];
        const editing = isEdit ? configProgramState?.selectedModuleCodes ?? [] : [];

        return modulesOptions.filter(opt => {
            const used = allConfigured.includes(opt.value);
            const inThisConfig = editing.includes(opt.value);
            return !used || inThisConfig;
        });
    }, [configProgramState?.selectedModuleCodes, isEdit, modulesOptions, qualityIssuesPrograms]);

    const onBackSettingsPage = React.useCallback(() => history.push("/settings"), [history]);

    const updateConfig = React.useCallback(
        (patch: Partial<DataQualityIssuesProgramConfigOptions>) => {
            setConfigProgramState(prev => ({ ...(prev ?? initialState), ...patch }));
        },
        []
    );

    const updateDefaultSettings = React.useCallback(
        (patch: Partial<DataQualityIssuesProgramConfigOptions["defaultSettings"]>) => {
            setConfigProgramState(prev => ({
                ...(prev ?? initialState),
                defaultSettings: {
                    ...(prev?.defaultSettings ?? initialState.defaultSettings),
                    ...patch,
                },
            }));
        },
        []
    );

    const selectedModuleOptions = React.useMemo(() => {
        return moduleOptionsAvailable.filter(option =>
            configProgramState?.selectedModuleCodes.includes(option.value)
        );
    }, [moduleOptionsAvailable, configProgramState?.selectedModuleCodes]);

    const periodTypeByCode = React.useMemo<Record<Code, PeriodType>>(() => {
        return Object.fromEntries(modules.map(module => [module.code, module.periodType]));
    }, [modules]);

    const selectedModulePeriodTypes = React.useMemo<PeriodType[]>(() => {
        const codes = configProgramState?.selectedModuleCodes ?? [];
        return codes
            .map(code => periodTypeByCode[code])
            .filter((periodType): periodType is PeriodType => Boolean(periodType));
    }, [configProgramState?.selectedModuleCodes, periodTypeByCode]);

    const defaultDataSetPeriodType = React.useMemo<PeriodType>(() => {
        const dataSet = configProgramState?.defaultSettings?.dataSet;
        return (dataSet ? periodTypeByCode[dataSet] : undefined) ?? "Yearly";
    }, [configProgramState?.defaultSettings?.dataSet, periodTypeByCode]);

    const sections = useMemo(() => {
        return (
            qualityIssuesPrograms?.find(
                program => program.code === configProgramState?.selectedProgramCode
            )?.sections || []
        );
    }, [configProgramState?.selectedProgramCode, qualityIssuesPrograms]);

    const onSaveConfiguration = React.useCallback(() => {
        if (!configProgramState) return;

        loading.show(true, i18n.t("Saving configuration..."));
        compositionRoot.dataQualityIssuesProgramConfig.save
            .execute({ ...configProgramState, selectedModulePeriodTypes })
            .run(
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
        selectedModulePeriodTypes,
        history,
        loading,
        snackBar,
    ]);

    const steps = React.useMemo((): WizardStep[] => {
        if (!configProgramState) {
            return [];
        }

        return [
            {
                component: ProgramSelectionStep,
                key: "program-selection",
                label: i18n.t("Data Quality Analysis Location"),
                props: {
                    disabled: isEdit,
                    options: programOptions,
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
                    disabled: isEdit,
                    modulesOptions: moduleOptionsAvailable,
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
                    defaultDataSetPeriodType,
                },
            },
            {
                component: StepsSettingsStep,
                key: "steps-settings",
                label: i18n.t("Steps Configuration"),
                props: {
                    isEdit: isEdit,
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
                    programs: programOptions,
                    modules: moduleOptionsAvailable,
                    configProgramState: configProgramState,
                    onSaveConfiguration: onSaveConfiguration,
                },
            },
        ];
    }, [
        configProgramState,
        moduleOptionsAvailable,
        programOptions,
        onSaveConfiguration,
        selectedModuleOptions,
        defaultDataSetPeriodType,
        updateConfig,
        updateDefaultSettings,
        sections,
        isEdit,
    ]);

    const validateStep = React.useCallback(
        async (stepKey: StepKey): Promise<string[] | undefined> => {
            let errors: string[] = [];

            if (stepKey === "program-selection") {
                if (!configProgramState?.selectedProgramCode) {
                    errors = [
                        ...errors,
                        i18n.t(
                            "Select a location where data quality analysis issues will be created"
                        ),
                    ];
                }
            }

            if (stepKey === "modules-selection") {
                if (!configProgramState?.selectedModuleCodes?.length) {
                    errors = [...errors, i18n.t("Select at least one Dataset")];
                }

                if (validateSamePeriodType(selectedModulePeriodTypes).length > 0) {
                    errors = [
                        ...errors,
                        i18n.t(
                            "All selected datasets must share the same periodicity (period type)"
                        ),
                    ];
                }
            }

            if (stepKey === "default-settings") {
                const { dataSet, startDate, endDate, usePreviousPeriod } =
                    configProgramState?.defaultSettings ?? {};

                if (!dataSet) {
                    errors = [...errors, i18n.t("Select a default dataset")];
                }

                if (!usePreviousPeriod) {
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
                const configuredSectionIds = (configProgramState?.steps ?? []).map(
                    s => s.sectionId
                );

                if (configuredSectionIds.length === 0) {
                    errors = [...errors, i18n.t("At least one step must be configured")];
                }
            }

            return errors.length ? errors : undefined;
        },
        [
            configProgramState?.defaultSettings,
            configProgramState?.selectedModuleCodes?.length,
            configProgramState?.selectedProgramCode,
            configProgramState?.steps,
            selectedModulePeriodTypes,
        ]
    );

    const onStepChangeRequest = React.useCallback(
        async (currentStep: WizardStep) => {
            return validateStep(currentStep.key as StepKey);
        },
        [validateStep]
    );

    const initialStepKey = useMemo(() => {
        return isEdit ? "default-settings" : "program-selection";
    }, [isEdit]);

    return {
        onBackSettingsPage: onBackSettingsPage,
        steps: steps,
        onStepChangeRequest: onStepChangeRequest,
        initialStepKey: initialStepKey,
    };
}

function getDataQualityIssuesProgramConfigOptions(
    config: DataQualityIssuesProgramConfig,
    countries?: Country[]
): DataQualityIssuesProgramConfigOptions {
    return {
        selectedProgramCode: config.selectedProgramCode,
        selectedModuleCodes: config.selectedModuleCodes,
        selectedModulePeriodTypes: config.selectedModulePeriodTypes ?? [],
        defaultSettings: {
            dataSet: config.defaultSettings.dataSet,
            endDate: config.defaultSettings.endDate,
            startDate: config.defaultSettings.startDate,
            usePreviousPeriod: config.defaultSettings.usePreviousPeriod,
            orgUnits: config.defaultSettings.orgUnits,
            orgUnitPaths: countries?.map(country => country.path) ?? [],
        },
        steps: config.steps,
        isEdit: true,
    };
}
