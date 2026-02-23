import React from "react";

import { useAppContext } from "$/webapp/contexts/app-context";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { UpdateAnalysisState } from "$/webapp/pages/analysis/AnalysisPage";
import { Maybe } from "$/utils/ts-utils";
import _ from "$/domain/entities/generic/Collection";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { Option } from "$/webapp/entities/Option";
import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";

export function useNursingMidwiferyStep(props: UseNursingMidwiferyStepProps) {
    const { analysis, section, updateAnalysis, disaggregations } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const [isLoading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<Maybe<string>>(undefined);
    const [reload, refreshReload] = React.useState(0);
    const [selectedDisaggregations, setSelectedDisagregations] = React.useState<string[]>([]);

    const disaggregationOptions: Option[] = React.useMemo(() => {
        if (!disaggregations) return [];
        return disaggregations
            .map(disaggregation => ({
                text: disaggregation.name,
                value: disaggregation.id,
            }))
            .sort((a, b) => a.text.localeCompare(b.text));
    }, [disaggregations]);

    React.useEffect(() => {
        setSelectedDisagregations(disaggregationOptions.map(item => item.value));
    }, [disaggregationOptions]);

    const handleChange = React.useCallback((values: string[]) => {
        setSelectedDisagregations(values);
    }, []);

    const runAnalysis = React.useCallback(() => {
        setLoading(true);
        compositionRoot.nursingMidwifery.validate
            .execute({
                analysisId: analysis.id,
                disaggregationsIds: selectedDisaggregations,
                sectionId: section.id,
                metadata: metadataItem,
                sectionDisaggregations: disaggregations || [],
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
        metadataItem,
        disaggregations,
    ]);

    return {
        analysis,
        reload,
        disaggregationOptions: disaggregationOptions,
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
    disaggregations: Maybe<SectionDisaggregation[]>;
};
