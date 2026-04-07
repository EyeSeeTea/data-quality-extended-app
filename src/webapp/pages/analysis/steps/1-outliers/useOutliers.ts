import React from "react";

import { useAppContext } from "$/webapp/contexts/app-context";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Id } from "$/domain/entities/Ref";
import { Maybe } from "$/utils/ts-utils";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";

export const thresholdList = [
    { value: "1", text: "1.0" },
    { value: "1.5", text: "1.5" },
    { value: "2", text: "2.0" },
    { value: "2.5", text: "2.5" },
    { value: "3", text: "3.0" },
    { value: "3.5", text: "3.5" },
    { value: "4", text: "4.0" },
    { value: "4.5", text: "4.5" },
    { value: "5", text: "5.0" },
];

export const algorithmList = [
    { value: "Z_SCORE", text: "Z-score" },
    { value: "MOD_Z_SCORE", text: "Modified Z-score" },
    { value: "MIN_MAX", text: "Minmax values" },
];

export function useAnalysisOutlier(props: UseRunAnalysisProps) {
    const { onSucess } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const [isLoading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<Maybe<string>>(undefined);

    const runAnalysisOutlier = React.useCallback(
        (options: RunAnalysisOptionsProps) => {
            const { sectionId, algorithm, analysisId, threshold } = options;
            setLoading(true);
            compositionRoot.outlier.run
                .execute({
                    sectionId: sectionId,
                    algorithm: algorithm,
                    qualityAnalysisId: analysisId,
                    threshold: threshold,
                    metadata: metadataItem,
                })
                .run(
                    qualityAnalysis => {
                        setLoading(false);
                        onSucess(qualityAnalysis);
                    },
                    err => {
                        setError(err.message);
                        setLoading(false);
                    }
                );
        },
        [compositionRoot.outlier.run, onSucess, metadataItem]
    );

    return {
        runAnalysisOutlier,
        isLoading,
        error,
    };
}

type UseRunAnalysisProps = { onSucess: (qualityAnalysis: QualityAnalysis) => void };
type RunAnalysisOptionsProps = {
    algorithm: string;
    analysisId: Id;
    sectionId: Id;
    threshold: string;
};
