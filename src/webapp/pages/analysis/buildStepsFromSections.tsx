import React from "react";
import { ClassNameMap } from "@material-ui/styles";
import { makeStyles } from "@material-ui/core";
import SettingsIcon from "@material-ui/icons/Settings";
import ListAltIcon from "@material-ui/icons/ListAlt";
import { WizardStep } from "@eyeseetea/d2-ui-components";

import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import i18n from "$/utils/i18n";
import { UpdateAnalysisState } from "$/webapp/pages/analysis/AnalysisPage";
import { getComponentByStepType } from "$/webapp/pages/analysis/steps";
import _ from "$/domain/entities/generic/Collection";
import customTheme from "$/webapp/pages/app/themes/customTheme";
import { Maybe } from "$/utils/ts-utils";
import { ConfigurationStep } from "$/webapp/pages/analysis/steps/ConfigurationStep";
import { SummaryStep } from "$/webapp/pages/analysis/SummaryStep";
import { DataQualityWorkflowSettings } from "$/domain/entities/DataQualityWorkflowSettings";

export const useStyles = makeStyles(() => ({
    circle: {
        alignItems: "center",
        borderRadius: "50%",
        color: "#fff",
        display: "flex",
        height: "24px",
        justifyContent: "center",
        width: "24px",
    },
    pending: {
        backgroundColor: "#8E8E8E",
    },
    completed: {
        backgroundColor: customTheme.color.intenseGreen,
    },
    error: {
        backgroundColor: customTheme.color.error,
    },
    largeIcon: {
        fontSize: "20px",
        color: "#fff",
        backgroundColor: "#1976d2",
        borderRadius: 50,
        padding: "0.125rem",
    },
}));

function StepIcon(props: {
    text: string;
    hasIssues: boolean;
    isPending: boolean;
    isCompleted: boolean;
}) {
    const { text, hasIssues, isPending, isCompleted } = props;
    const classes = useStyles();

    const buildIconClasses = React.useMemo(() => {
        const baseClasses = [classes.circle];

        if (isCompleted) {
            return [...baseClasses, classes.completed].join(" ");
        } else if (hasIssues) {
            return [...baseClasses, classes.error].join(" ");
        } else if (isPending) {
            return [...baseClasses, classes.pending].join(" ");
        } else {
            return [...baseClasses, classes.pending].join(" ");
        }
    }, [classes, hasIssues, isCompleted, isPending]);
    return <div className={buildIconClasses}>{text}</div>;
}

export function buildStepsFromSections(options: {
    analysis: QualityAnalysis;
    updateAnalysis: UpdateAnalysisState;
    classes: ClassNameMap<"circle" | "pending" | "completed" | "error" | "largeIcon">;
    filters: { algorithm: string; threshold: string };
    onFilterChange: (value: Maybe<string>, filterAttribute: string) => void;
    setCountrySelected: React.Dispatch<React.SetStateAction<boolean>>;
    workflowSettings: DataQualityWorkflowSettings;
}): WizardStep[] {
    const {
        analysis,
        updateAnalysis,
        classes,
        filters,
        onFilterChange,
        setCountrySelected,
        workflowSettings,
    } = options;

    const sectionSteps = _(analysis.sections)
        .map((section): Maybe<WizardStep & { id: string }> => {
            const stepSettings = workflowSettings.steps.find(s => s.sectionId === section.id);
            const stepType = stepSettings?.type;
            if (!stepType || !stepSettings) return undefined;

            const StepComponent = getComponentByStepType(stepType);
            if (!StepComponent) return undefined;

            const index = analysis.sections.findIndex(s => s.id === section.id) + 1;
            const isPending = QualityAnalysisSection.isPending(section);
            const hasIssues = section.status === "success_with_issues";
            const isCompleted = section.status === "success";

            return {
                id: section.id,
                icon: (
                    <StepIcon
                        isCompleted={isCompleted}
                        isPending={isPending}
                        text={String(index)}
                        hasIssues={hasIssues}
                    />
                ),
                key: section.name.toLowerCase(),
                label: section.name,
                props: { analysis: analysis },
                component: () => (
                    <StepComponent
                        analysis={analysis}
                        section={section}
                        title={section.description || section.name}
                        updateAnalysis={updateAnalysis}
                        qualityFilters={filters}
                        updateQualityFilters={onFilterChange}
                        disaggregations={stepSettings.disaggregations}
                    />
                ),
            };
        })
        .compact()
        .value();

    return [
        {
            key: "configuration",
            label: i18n.t("Configuration"),
            props: { analysis },
            component: () => (
                <ConfigurationStep
                    updateCountry={setCountrySelected}
                    updateAnalysis={updateAnalysis}
                    analysis={analysis}
                />
            ),
            completed: false,
            icon: <SettingsIcon className={classes.largeIcon} />,
        },
        ...sectionSteps,
        {
            icon: <ListAltIcon className={classes.largeIcon} />,
            key: "Summary",
            props: { analysis },
            label: i18n.t("Summary"),
            component: () => <SummaryStep analysis={analysis} name={i18n.t("Summary")} />,
            completed: false,
        },
    ];
}
