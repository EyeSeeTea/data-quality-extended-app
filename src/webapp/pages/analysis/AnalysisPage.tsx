import React, { useEffect } from "react";
import { Wizard, WizardStep, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { ClassNameMap } from "@material-ui/styles";
import { makeStyles } from "@material-ui/core";
import SettingsIcon from "@material-ui/icons/Settings";
import ListAltIcon from "@material-ui/icons/ListAlt";
import styled from "styled-components";
import { useHistory, useParams } from "react-router-dom";

import customTheme from "$/webapp/pages/app/themes/customTheme";
import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import { getComponentFromSectionName } from "./steps";
import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import { useAnalysisById } from "$/webapp/hooks/useAnalysis";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { ConfigurationStep } from "./steps/ConfigurationStep";
import i18n from "$/utils/i18n";
import _ from "$/domain/entities/generic/Collection";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { Maybe } from "$/utils/ts-utils";
import { SummaryStep } from "./SummaryStep";
import { getErrors } from "$/domain/entities/generic/Errors";
import { Code } from "$/domain/entities/Ref";

const defaultOutlierParams = { algorithm: "Z_SCORE", threshold: "3" };

const useStyles = makeStyles(() => ({
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

function buildStepsFromSections(
    analysis: QualityAnalysis,
    updateAnalysis: UpdateAnalysisState,
    classes: ClassNameMap<"circle" | "pending" | "completed" | "error" | "largeIcon">,
    qualityFilters: { algorithm: string; threshold: string },
    onQualityFilterChange: (value: Maybe<string>, filterAttribute: string) => void,
    setCountrySelected: React.Dispatch<React.SetStateAction<boolean>>
): WizardStep[] {
    const sectionSteps = _(analysis.sections)
        .map((section): Maybe<WizardStep & { id: string }> => {
            const StepComponent = getComponentFromSectionName(section.name);
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
                        qualityFilters={qualityFilters}
                        updateQualityFilters={onQualityFilterChange}
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

export const AnalysisPage: React.FC<PageProps> = React.memo(() => {
    const { id, qualityIssuesProgramCode } = useParams<{
        id: string;
        qualityIssuesProgramCode: Code;
    }>();

    const [currentSection, setSection] = React.useState<string>("outliers");
    const history = useHistory();
    const loading = useLoading();
    const snackbar = useSnackbar();
    const classes = useStyles();
    const [qualityFilters, setQualityFilters] = React.useState(defaultOutlierParams);

    const onFilterChange = React.useCallback<
        (value: Maybe<string>, filterAttribute: string) => void
    >(
        (value, filterAttribute) => {
            setQualityFilters(prev => ({ ...prev, [filterAttribute]: value }));
        },
        [setQualityFilters]
    );
    const onBackToDashboard = () => {
        history.push(`/${qualityIssuesProgramCode}/dashboard`);
    };

    const { analysis, setAnalysis, isLoading, error } = useAnalysisById({ id: id });
    const [countrySelected, setCountrySelected] = React.useState(false);

    useEffect(() => {
        if (isLoading) loading.show();
        else loading.hide();
    }, [isLoading, loading]);

    useEffect(() => {
        if (error) snackbar.error(error);
    }, [error, snackbar]);

    const analysisSteps = React.useMemo(() => {
        if (!analysis) return [];
        return buildStepsFromSections(
            analysis,
            setAnalysis,
            classes,
            qualityFilters,
            onFilterChange,
            setCountrySelected
        );
    }, [analysis, setAnalysis, classes, onFilterChange, qualityFilters, setCountrySelected]);

    const onStepChange = React.useCallback(
        (value: string) => {
            if (!analysis) return;
            const section = analysis.sections.find(s => s.name.toLowerCase() === value);
            setSection(section?.name || value);
        },
        [analysis]
    );

    const validateAnalysis = React.useCallback(
        async (currentStep: WizardStep) => {
            if (!currentStep.props) return Promise.resolve([]);
            const currentAnalysis = currentStep.props as { analysis: QualityAnalysis };
            return QualityAnalysis.updateConfiguration(currentAnalysis.analysis).match({
                success: () => {
                    return Promise.resolve([]);
                },
                error: errors => {
                    const errorMessage = countrySelected
                        ? i18n.t("You must save the Analysis configuration before running any step")
                        : getErrors(errors);
                    return Promise.resolve([errorMessage]);
                },
            });
        },
        [countrySelected]
    );

    if (!analysis) return null;

    const firstSectionName = _(analysis.sections).first()?.name.toLowerCase();
    if (!firstSectionName) {
        console.warn(`Cannot found sections in analysis: ${analysis.name}`);
        return null;
    }

    return (
        <PageContainer>
            <PageHeader
                title={`${analysis.name} - ${currentSection}`}
                onBackClick={onBackToDashboard}
            />
            <Stepper
                lastClickableStepIndex={analysisSteps.length}
                initialStepKey="configuration"
                steps={analysisSteps}
                onStepChange={onStepChange}
                onStepChangeRequest={validateAnalysis}
                useSnackFeedback
            />
        </PageContainer>
    );
});

const Stepper = styled(Wizard)`
    .MuiStepper-root {
        overflow-x: scroll;
    }
`;

type PageProps = { name: string };

export type PageStepProps = {
    analysis: QualityAnalysis;
    section: QualityAnalysisSection;
    updateAnalysis: UpdateAnalysisState;
    title: string;
    qualityFilters: { algorithm: string; threshold: string };
    updateQualityFilters: (value: Maybe<string>, filterAttribute: string) => void;
};

export type UpdateAnalysisState = React.Dispatch<React.SetStateAction<Maybe<QualityAnalysis>>>;
