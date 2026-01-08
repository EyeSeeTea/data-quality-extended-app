import React from "react";
import { useAppContext } from "$/webapp/contexts/app-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { Module } from "$/domain/entities/Module";

export function useModules() {
    const { compositionRoot, metadata } = useAppContext();
    const snackBar = useSnackbar();
    const [modules, setModules] = React.useState<Module[]>([]);

    React.useEffect(() => {
        compositionRoot.modules.get.execute({ metadata: metadata }).run(setModules, err => {
            snackBar.error(err.message);
        });
    }, [compositionRoot.modules.get, snackBar, metadata]);

    return modules;
}
