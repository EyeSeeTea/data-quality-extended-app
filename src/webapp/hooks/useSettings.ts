import React from "react";
import { useHistory } from "react-router-dom";

import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { useQualityIssuesPrograms } from "$/webapp/pages/config-program/hooks/useQualityIssuesPrograms";
import { Maybe } from "$/utils/ts-utils";
import { Code } from "$/domain/entities/Ref";

type Option = {
    id: Code;
    label: string;
    disabled?: boolean;
};

type State = {
    onConfigurateNewProgram: () => void;
    onEditNewProgram: (code: Code) => void;
    onBackHomePage: () => void;
    qualityIssuesPrograms: Maybe<QualityIssuesProgram[]>;
    currentOptions: Option[];
};

export function useSettings(): State {
    const history = useHistory();

    const { qualityIssuesPrograms } = useQualityIssuesPrograms();

    const onConfigurateNewProgram = React.useCallback(
        () => history.push("/configuration"),
        [history]
    );

    const onEditNewProgram = React.useCallback(
        (code: Code) => history.push(`/configuration/${code}`),
        [history]
    );

    const onBackHomePage = React.useCallback(() => history.push("/"), [history]);

    const currentOptions = React.useMemo(
        () =>
            qualityIssuesPrograms?.map(program => ({
                id: program.code,
                label: program.name,
            })) || [],
        [qualityIssuesPrograms]
    );

    return {
        onConfigurateNewProgram: onConfigurateNewProgram,
        onEditNewProgram: onEditNewProgram,
        onBackHomePage: onBackHomePage,
        qualityIssuesPrograms: qualityIssuesPrograms,
        currentOptions: currentOptions,
    };
}
