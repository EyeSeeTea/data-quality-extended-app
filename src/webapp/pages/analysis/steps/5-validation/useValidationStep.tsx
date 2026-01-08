import React from "react";
import { useAppContext } from "$/webapp/contexts/app-context";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { UpdateAnalysisState } from "$/webapp/pages/analysis/AnalysisPage";
import { Maybe } from "$/utils/ts-utils";

export function useValidationStep(props: UseValidationStepProps) {
    const { analysis, section, updateAnalysis } = props;
    const { compositionRoot, validationRuleGroups, metadata } = useAppContext();

    const [isLoading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<Maybe<string>>(undefined);

    const [reload, refreshReload] = React.useState(0);
    const [selectedValidationRule, setSelectedValidationRule] = React.useState<Maybe<string>>("");

    const handleChange = (value: Maybe<string>) => {
        setSelectedValidationRule(value);
    };

    const runAnalysis = React.useCallback(() => {
        setLoading(true);
        compositionRoot.validationRules.run
            .execute({
                qualityAnalysisId: analysis.id,
                validationRuleGroupId: selectedValidationRule || "",
                sectionId: section.id,
                metadata: metadata,
            })
            .run(
                analysis => {
                    refreshReload(reload + 1);
                    updateAnalysis(analysis);
                    setLoading(false);
                },
                err => {
                    setError(err.message);
                    setLoading(false);
                }
            );
    }, [
        compositionRoot.validationRules.run,
        analysis.id,
        selectedValidationRule,
        section.id,
        reload,
        updateAnalysis,
        metadata,
    ]);

    const validationRulesOptions = React.useMemo(() => {
        return validationRuleGroups.map(validationRuleGroup => {
            return { text: validationRuleGroup.name, value: validationRuleGroup.id };
        });
    }, [validationRuleGroups]);

    return {
        analysis,
        reload,
        validationRules: validationRulesOptions,
        handleChange,
        runAnalysis,
        selectedValidationRule,
        setSelectedValidationRule,
        isLoading,
        error,
    };
}

type UseValidationStepProps = {
    analysis: QualityAnalysis;
    section: QualityAnalysisSection;
    updateAnalysis: UpdateAnalysisState;
};
