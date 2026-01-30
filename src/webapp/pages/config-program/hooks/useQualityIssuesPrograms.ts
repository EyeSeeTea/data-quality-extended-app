import { useEffect, useState } from "react";
import { useSnackbar, useLoading } from "@eyeseetea/d2-ui-components";

import { useAppContext } from "$/webapp/contexts/app-context";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import i18n from "$/utils/i18n";

type State = {
    qualityIssuesPrograms: QualityIssuesProgram[] | undefined;
};

export function useQualityIssuesPrograms(): State {
    const { compositionRoot } = useAppContext();
    const snackBar = useSnackbar();
    const loading = useLoading();

    const [qualityIssuesPrograms, setQualityIssuesPrograms] = useState<
        QualityIssuesProgram[] | undefined
    >(undefined);

    useEffect(() => {
        if (!qualityIssuesPrograms) {
            loading.show(true, i18n.t("Loading..."));
            compositionRoot.qualityIssuesProgram.getAll.execute().run(
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
        }
    }, [compositionRoot.qualityIssuesProgram.getAll, loading, qualityIssuesPrograms, snackBar]);

    return {
        qualityIssuesPrograms: qualityIssuesPrograms,
    };
}
