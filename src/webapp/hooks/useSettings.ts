import React from "react";
import { useHistory } from "react-router-dom";

import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { useQualityIssuesPrograms } from "$/webapp/pages/config-program/hooks/useQualityIssuesPrograms";

type State = {
    onConfigurateNewProgram: () => void;
    onBackHomePage: () => void;
    qualityIssuesPrograms: QualityIssuesProgram[] | undefined;
};

export function useSettings(): State {
    const history = useHistory();

    const { qualityIssuesPrograms } = useQualityIssuesPrograms();

    const onConfigurateNewProgram = React.useCallback(
        () => history.push("/config-program"),
        [history]
    );

    const onBackHomePage = React.useCallback(() => history.push("/"), [history]);

    return {
        onConfigurateNewProgram: onConfigurateNewProgram,
        onBackHomePage: onBackHomePage,
        qualityIssuesPrograms: qualityIssuesPrograms,
    };
}
