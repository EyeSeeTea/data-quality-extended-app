import React from "react";
import { Id } from "$/domain/entities/Ref";
import { useAppContext } from "$/webapp/contexts/app-context";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { UpdateAnalysisState } from "$/webapp/pages/analysis/AnalysisPage";
import { Maybe } from "$/utils/ts-utils";
import _ from "$/domain/entities/generic/Collection";

export function useNursingMidwiferyStep(props: UseNursingMidwiferyStepProps) {
    const { analysis, section, updateAnalysis } = props;
    const { compositionRoot, metadata } = useAppContext();
    const [isLoading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<Maybe<string>>(undefined);
    const [reload, refreshReload] = React.useState(0);
    const [disaggregations, setDisaggregations] = React.useState<{ value: Id; text: string }[]>([]);
    const [selectedDisaggregations, setSelectedDissagregations] = React.useState<string[]>([]);

    React.useEffect(() => {
        compositionRoot.nursingMidwifery.getDisaggregations.execute(section.id).run(
            result => {
                const selectedDisaggregations = result.map(item => ({
                    value: item.id,
                    text: item.name,
                }));
                setDisaggregations(selectedDisaggregations);
                setSelectedDissagregations(selectedDisaggregations.map(item => item.value));
            },
            error => {
                setError(error.message);
            }
        );
    }, [section.id, compositionRoot.nursingMidwifery.getDisaggregations]);

    const handleChange = (values: string[]) => {
        setSelectedDissagregations(values);
    };

    const runAnalysis = React.useCallback(() => {
        setLoading(true);
        compositionRoot.nursingMidwifery.validate
            .execute({
                analysisId: analysis.id,
                disaggregationsIds: selectedDisaggregations,
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
        analysis,
        compositionRoot.nursingMidwifery.validate,
        reload,
        updateAnalysis,
        selectedDisaggregations,
        section.id,
        metadata,
    ]);

    return {
        analysis,
        reload,
        disaggregations,
        selectedDisaggregations,
        handleChange,
        runAnalysis,
        isLoading,
        error,
    };
}

type UseNursingMidwiferyStepProps = {
    analysis: QualityAnalysis;
    section: QualityAnalysisSection;
    updateAnalysis: UpdateAnalysisState;
};
