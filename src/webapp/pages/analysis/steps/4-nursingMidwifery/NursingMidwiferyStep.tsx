import React from "react";
import i18n from "$/utils/i18n";

import { useNursingMidwiferyStep } from "./useNursingMidwiferyStep";
import { SelectMultiCheckboxes } from "$/webapp/components/selectmulti-checkboxes/SelectMultiCheckboxes";
import { StepAnalysis } from "$/webapp/pages/analysis/steps/StepAnalysis";
import { PageStepProps } from "$/webapp/pages/analysis/AnalysisPage";

import { UserFeedbackContainer } from "$/webapp/components/user-feedback-container/UserFeedbackContainer";

export const NursingMidwiferyStep: React.FC<PageStepProps> = React.memo(props => {
    const { analysis, section, title, updateAnalysis, disaggregations } = props;
    const {
        disaggregationOptions,
        selectedDisaggregations,
        handleChange,
        reload,
        runAnalysis,
        isLoading,
        error,
    } = useNursingMidwiferyStep({ analysis, section, updateAnalysis, disaggregations });

    return (
        <UserFeedbackContainer isLoading={isLoading} error={error}>
            <StepAnalysis
                id={analysis.id}
                section={section}
                reload={reload}
                title={title}
                onRun={runAnalysis}
            >
                <SelectMultiCheckboxes
                    options={disaggregationOptions}
                    onChange={handleChange}
                    value={selectedDisaggregations}
                    label={i18n.t("CatCombos")}
                />
            </StepAnalysis>
        </UserFeedbackContainer>
    );
});
