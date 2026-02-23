import React, { useState } from "react";
import { useAppContext } from "$/webapp/contexts/app-context";
import { Id } from "$/domain/entities/Ref";
import { Option } from "$/webapp/entities/Option";
import _ from "$/domain/entities/generic/Collection";
import { UpdateAnalysisState } from "$/webapp/pages/analysis/AnalysisPage";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Maybe } from "$/utils/ts-utils";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";

export function useDisaggregatesStep(props: UseDisaggregatesStepProps) {
    const { analysis, sectionId, updateAnalysis, disaggregations } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const [reload, refreshReload] = React.useState(0);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = React.useState<Maybe<string>>(undefined);

    const [selectedDisaggregations, setSelectedDisaggregations] = React.useState<string[]>([]);

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
        setSelectedDisaggregations(disaggregationOptions.map(item => item.value));
    }, [disaggregationOptions]);

    const handleChange = React.useCallback((values: string[]) => {
        setSelectedDisaggregations(values);
    }, []);

    const runAnalysis = React.useCallback(() => {
        if (!analysis) return false;
        setLoading(true);
        compositionRoot.missingDisaggregates.get
            .execute({
                analysisId: analysis.id,
                disaggregationsIds: selectedDisaggregations,
                sectionId: sectionId,
                metadata: metadataItem,
                sectionDisaggregations: disaggregations || [],
            })
            .run(
                result => {
                    refreshReload(reload + 1);
                    updateAnalysis(result);
                    setLoading(false);
                },
                err => {
                    setError(err.message);
                    setLoading(false);
                }
            );
    }, [
        analysis,
        compositionRoot.missingDisaggregates.get,
        metadataItem,
        reload,
        sectionId,
        selectedDisaggregations,
        updateAnalysis,
        disaggregations,
    ]);

    return {
        analysis,
        disaggregationOptions: disaggregationOptions,
        handleChange,
        runAnalysis,
        selectedDisaggregations,
        reload,
        isLoading,
        error,
    };
}

type UseDisaggregatesStepProps = {
    analysis: QualityAnalysis;
    sectionId: Id;
    updateAnalysis: UpdateAnalysisState;
    disaggregations: Maybe<SectionDisaggregation[]>;
};
