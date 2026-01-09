import React from "react";

import { Id } from "$/domain/entities/Ref";
import { useAppContext } from "$/webapp/contexts/app-context";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { Maybe } from "$/utils/ts-utils";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";

export function useAnalysisById(props: UseAnalysisByIdProps) {
    const { id } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const [isLoading, setLoading] = React.useState<boolean>(false);
    const [analysis, setAnalysis] = React.useState<QualityAnalysis>();
    const [error, setError] = React.useState<Maybe<string>>(undefined);

    React.useEffect(() => {
        setLoading(true);
        compositionRoot.qualityAnalysis.getById.execute(id, metadataItem).run(
            analysis => {
                setAnalysis(analysis);
                setLoading(false);
            },
            err => {
                setLoading(false);
                setError(err.message);
            }
        );
    }, [compositionRoot.qualityAnalysis.getById, id, metadataItem]);

    return { analysis, setAnalysis, isLoading, error };
}

type UseAnalysisByIdProps = { id: Id };
