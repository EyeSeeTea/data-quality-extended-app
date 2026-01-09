import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { Id } from "$/domain/entities/Ref";
import { useAppContext } from "$/webapp/contexts/app-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import React from "react";
import { UpdateAnalysisState } from "$/webapp/pages/analysis/AnalysisPage";
import { Maybe } from "$/utils/ts-utils";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";

const doubleCountsList = [
    {
        value: "0",
        text: "+/- 0%",
    },
    {
        value: "1",
        text: "+/- 1%",
    },
    {
        value: "2",
        text: "+/- 2%",
    },
    {
        value: "3",
        text: "+/- 3%",
    },
    {
        value: "4",
        text: "+/- 4%",
    },
    {
        value: "5",
        text: "+/- 5%",
    },
];

export function useGeneralPractitionersStep(props: UseGeneralPractitionersStepProps) {
    const { analysis, section, updateAnalysis } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const snackbar = useSnackbar();

    const [reload, refreshReload] = React.useState(0);
    const [disaggregations, setDisaggregations] = React.useState<{ value: Id; text: string }[]>([]);
    const [selectedDisaggregations, setSelectedDissagregations] = React.useState<string[]>([]);
    const [threshold, setThreshold] = React.useState<string>("1");
    const [isLoading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<Maybe<string>>(undefined);

    const handleChange = (values: string[]) => {
        setSelectedDissagregations(values);
    };

    const valueChange = (value: string | undefined) => {
        if (value) {
            setThreshold(value);
        }
    };

    React.useEffect(() => {
        if (!analysis?.module.id) return;

        compositionRoot.modules.getDisaggregations.execute(analysis.module.id).run(
            disaggregations => {
                const initialDisaggregations = disaggregations.map(disaggregation => {
                    return { value: disaggregation.id, text: disaggregation.name };
                });
                setDisaggregations(initialDisaggregations);
                setSelectedDissagregations(initialDisaggregations.map(item => item.value));
            },
            err => {
                snackbar.error(err.message);
            }
        );
    }, [analysis?.module.id, compositionRoot.modules.getDisaggregations, snackbar]);

    const runAnalysis = React.useCallback(() => {
        setLoading(true);
        compositionRoot.practitioners.run
            .execute({
                analysisId: analysis.id,
                threshold: Number(threshold),
                dissagregationsIds: selectedDisaggregations,
                sectionId: section.id,
                metadata: metadataItem,
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
        section.id,
        compositionRoot.practitioners.run,
        reload,
        updateAnalysis,
        threshold,
        selectedDisaggregations,
        metadataItem,
    ]);

    return {
        analysis,
        disaggregations,
        doubleCountsList,
        handleChange,
        runAnalysis,
        reload,
        selectedDisaggregations,
        updateAnalysis,
        valueChange,
        threshold,
        isLoading,
        error,
    };
}

type UseGeneralPractitionersStepProps = {
    analysis: QualityAnalysis;
    section: QualityAnalysisSection;
    updateAnalysis: UpdateAnalysisState;
};
