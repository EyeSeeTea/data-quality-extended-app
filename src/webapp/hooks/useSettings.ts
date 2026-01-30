import React from "react";
import { useHistory } from "react-router-dom";

import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { useQualityIssuesPrograms } from "$/webapp/pages/config-program/hooks/useQualityIssuesPrograms";
import { Maybe } from "$/utils/ts-utils";

type State = {
    onConfigurateNewProgram: () => void;
    onBackHomePage: () => void;
    qualityIssuesPrograms: Maybe<QualityIssuesProgram[]>;
};

export function useSettings(): State {
    const history = useHistory();

    const { qualityIssuesPrograms } = useQualityIssuesPrograms();

    const onConfigurateNewProgram = React.useCallback(
        () => history.push("/configuration"),
        [history]
    );

    const onBackHomePage = React.useCallback(() => history.push("/"), [history]);

    return {
        onConfigurateNewProgram: onConfigurateNewProgram,
        onBackHomePage: onBackHomePage,
        qualityIssuesPrograms: qualityIssuesPrograms,
    };
}
