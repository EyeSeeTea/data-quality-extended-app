import React, { useEffect } from "react";
import { Wizard, WizardStep, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import styled from "styled-components";
import { useHistory, useParams } from "react-router-dom";

import { PageHeader } from "$/webapp/components/page-header/PageHeader";
import { PageContainer } from "$/webapp/components/page-container/PageContainer";
import { useAnalysisById } from "$/webapp/hooks/useAnalysis";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import i18n from "$/utils/i18n";
import _ from "$/domain/entities/generic/Collection";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { Maybe } from "$/utils/ts-utils";
import { getErrors } from "$/domain/entities/generic/Errors";
import { Code } from "$/domain/entities/Ref";
import { useDataQualityWorkflowSettings } from "$/webapp/hooks/useDataQualityWorkflowSettings";
import { buildStepsFromSections, useStyles } from "$/webapp/pages/analysis/buildStepsFromSections";
import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";

const defaultOutlierParams = { algorithm: "Z_SCORE", threshold: "3" };

export const AnalysisPage: React.FC<PageProps> = React.memo(() => {
    const { id, qualityIssuesProgramCode } = useParams<{
        id: string;
        qualityIssuesProgramCode: Code;
    }>();
    const {
        workflowSettings,
        isLoading: isWorkflowSettingsLoading,
        error: workflowSettingsError,
    } = useDataQualityWorkflowSettings(qualityIssuesProgramCode);
    const { analysis, setAnalysis, isLoading, error } = useAnalysisById({ id: id });

    const [currentSection, setSection] = React.useState<string>("outliers");
    const history = useHistory();
    const loading = useLoading();
    const snackbar = useSnackbar();
    const classes = useStyles();
    const [qualityFilters, setQualityFilters] = React.useState(defaultOutlierParams);
    const [countrySelected, setCountrySelected] = React.useState(false);

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

    useEffect(() => {
        if (isLoading || isWorkflowSettingsLoading) loading.show();
        else loading.hide();
    }, [isLoading, isWorkflowSettingsLoading, loading]);

    useEffect(() => {
        if (error) snackbar.error(error);
        if (workflowSettingsError) snackbar.error(workflowSettingsError);
    }, [error, workflowSettingsError, snackbar]);

    const analysisSteps = React.useMemo(() => {
        if (!analysis || !workflowSettings) return [];

        return buildStepsFromSections({
            analysis: analysis,
            updateAnalysis: setAnalysis,
            classes: classes,
            filters: qualityFilters,
            onFilterChange: onFilterChange,
            setCountrySelected: setCountrySelected,
            workflowSettings: workflowSettings,
        });
    }, [
        analysis,
        setAnalysis,
        classes,
        onFilterChange,
        qualityFilters,
        setCountrySelected,
        workflowSettings,
    ]);

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
    disaggregations: Maybe<SectionDisaggregation[]>;
};

export type UpdateAnalysisState = React.Dispatch<React.SetStateAction<Maybe<QualityAnalysis>>>;
