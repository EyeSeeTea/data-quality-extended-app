import React from "react";

import { useAppContext } from "$/webapp/contexts/app-context";
import { Maybe } from "$/utils/ts-utils";
import { DataQualityWorkflowSettings } from "$/domain/entities/DataQualityWorkflowSettings";
import { Code } from "$/domain/entities/Ref";

type State = {
    workflowSettings: Maybe<DataQualityWorkflowSettings>;
    isLoading: boolean;
    error: Maybe<string>;
};

export function useDataQualityWorkflowSettings(qualityIssuesProgramCode: Code): State {
    const { compositionRoot } = useAppContext();

    const [isLoading, setLoading] = React.useState<boolean>(false);
    const [workflowSettings, setWorkflowSettings] = React.useState<
        DataQualityWorkflowSettings | undefined
    >(undefined);
    const [error, setError] = React.useState<Maybe<string>>(undefined);

    React.useEffect(() => {
        setLoading(true);
        compositionRoot.dataQualityWorkflowSettings.get.execute(qualityIssuesProgramCode).run(
            settings => {
                setWorkflowSettings(settings);
                setLoading(false);
            },
            err => {
                setLoading(false);
                setError(err.message);
            }
        );
    }, [compositionRoot.dataQualityWorkflowSettings.get, qualityIssuesProgramCode]);

    return { workflowSettings, isLoading, error };
}
