import { useCallback, useEffect, useMemo, useState } from "react";
import { Code } from "$/domain/entities/Ref";
import { useHistory } from "react-router-dom";
import { DataQualityIssuesProgram } from "$/domain/entities/DataQualityIssuesProgram";
import { useSnackbar } from "@eyeseetea/d2-ui-components/snackbar";
import { useLoading } from "@eyeseetea/d2-ui-components/loading";
import { useAppContext } from "$/webapp/contexts/app-context";

type State = {
    selectedProgramCode: Code | undefined;
    qualityProgramIssuesOptions: { text: string; value: string }[];
    onSelectQualityProgramIssues: (code: string | undefined) => void;
};

export function useQualityIssuesProgram(): State {
    const { compositionRoot } = useAppContext();
    const snackBar = useSnackbar();
    const loading = useLoading();
    const history = useHistory();

    const [selectedProgramCode, setSelectedProgramCode] = useState<Code | undefined>(undefined);
    const [dataQualityIssuesPrograms, setDataQualityIssuesPrograms] = useState<
        DataQualityIssuesProgram[] | undefined
    >(undefined);

    useEffect(() => {
        loading.show(true, "Loading...");
        compositionRoot.dataQualityIssuesProgram.getAll.execute().run(
            programs => {
                setDataQualityIssuesPrograms(programs);
                loading.hide();
            },
            err => {
                loading.hide();
                snackBar.error(`Error loading Data Quality Issues Programs: ${err.message}`);
            }
        );
    }, [compositionRoot.dataQualityIssuesProgram.getAll, loading, snackBar]);

    const qualityProgramIssuesOptions = useMemo(() => {
        return (
            dataQualityIssuesPrograms?.map(program => ({
                text: program.name,
                value: program.code,
            })) || []
        );
    }, [dataQualityIssuesPrograms]);

    const onSelectQualityProgramIssues = useCallback(
        (value: Code | undefined) => {
            setSelectedProgramCode(value);
            history.push(`/${value}/dashboard`);
        },
        [history, setSelectedProgramCode]
    );

    return {
        selectedProgramCode,
        qualityProgramIssuesOptions,
        onSelectQualityProgramIssues,
    };
}
