import React from "react";
import { useHistory } from "react-router-dom";

type State = {
    onConfigurateNewProgram: () => void;
    onBackHomePage: () => void;
};

export function useSettings(): State {
    const history = useHistory();

    const onConfigurateNewProgram = React.useCallback(
        () => history.push("/configuration"),
        [history]
    );

    const onBackHomePage = React.useCallback(() => history.push("/"), [history]);

    return {
        onConfigurateNewProgram: onConfigurateNewProgram,
        onBackHomePage: onBackHomePage,
    };
}
