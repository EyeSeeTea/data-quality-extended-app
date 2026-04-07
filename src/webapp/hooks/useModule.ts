import React from "react";
import { useAppContext } from "$/webapp/contexts/app-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { Module } from "$/domain/entities/Module";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";

export function useModules() {
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const snackBar = useSnackbar();
    const [modules, setModules] = React.useState<Module[]>([]);

    React.useEffect(() => {
        compositionRoot.modules.get.execute({ metadata: metadataItem }).run(setModules, err => {
            snackBar.error(err.message);
        });
    }, [compositionRoot.modules.get, snackBar, metadataItem]);

    return modules;
}
