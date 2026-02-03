import { useCallback, useEffect, useMemo, useState } from "react";
import { Code } from "$/domain/entities/Ref";
import { useHistory } from "react-router-dom";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { useSnackbar } from "@eyeseetea/d2-ui-components/snackbar";
import { useLoading } from "@eyeseetea/d2-ui-components/loading";
import { useAppContext } from "$/webapp/contexts/app-context";
import i18n from "$/utils/i18n";
import { Maybe } from "$/utils/ts-utils";

type Option = { text: string; value: string };
type State = {
    selectedProgramCode: Maybe<Code>;
    configuredQualityProgramIssuesOptions: Maybe<Option[]>;
    onSelectQualityProgramIssues: (code: Maybe<string>) => void;
    qualityIssuesPrograms: Maybe<QualityIssuesProgram[]>;
};

export function useConfiguredQualityIssuesProgram(): State {
    const { compositionRoot } = useAppContext();
    const snackBar = useSnackbar();
    const loading = useLoading();
    const history = useHistory();

    const [selectedProgramCode, setSelectedProgramCode] = useState<Code | undefined>(undefined);
    const [qualityIssuesPrograms, setQualityIssuesPrograms] = useState<
        QualityIssuesProgram[] | undefined
    >(undefined);

    useEffect(() => {
        loading.show(true, i18n.t("Loading..."));
        compositionRoot.qualityIssuesProgram.getAllConfigured.execute().run(
            programs => {
                setQualityIssuesPrograms(programs);
                loading.hide();
            },
            err => {
                loading.hide();
                snackBar.error(
                    i18n.t("Error loading Data Quality Issues Programs: {{message}}", {
                        message: err.message,
                        nsSeparator: false,
                    })
                );
            }
        );
    }, [compositionRoot.qualityIssuesProgram.getAllConfigured, loading, snackBar]);

    useEffect(() => {
        if (qualityIssuesPrograms?.length === 1) {
            const [program] = qualityIssuesPrograms;

            if (!program) return;

            setSelectedProgramCode(program.code);
            history.push(`/${program.code}/dashboard`);
        }
    }, [qualityIssuesPrograms, history]);

    const configuredQualityProgramIssuesOptions = useMemo(() => {
        return qualityIssuesPrograms?.map(program => ({
            text: program.name,
            value: program.code,
        }));
    }, [qualityIssuesPrograms]);

    const onSelectQualityProgramIssues = useCallback(
        (value: Code | undefined) => {
            setSelectedProgramCode(value);
            history.push(`/${value}/dashboard`);
        },
        [history, setSelectedProgramCode]
    );

    return {
        selectedProgramCode: selectedProgramCode,
        configuredQualityProgramIssuesOptions: configuredQualityProgramIssuesOptions,
        onSelectQualityProgramIssues: onSelectQualityProgramIssues,
        qualityIssuesPrograms: qualityIssuesPrograms,
    };
}
