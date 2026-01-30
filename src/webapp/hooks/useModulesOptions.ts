import { useEffect, useMemo, useState } from "react";
import { useSnackbar, useLoading } from "@eyeseetea/d2-ui-components";

import { useAppContext } from "$/webapp/contexts/app-context";
import { ModuleBase } from "$/domain/entities/Module";
import i18n from "$/utils/i18n";

type State = {
    modulesOptions: { text: string; value: string }[];
};

export function useModulesOptions(): State {
    const { compositionRoot } = useAppContext();
    const snackBar = useSnackbar();
    const loading = useLoading();

    const [modules, setModules] = useState<ModuleBase[] | undefined>(undefined);

    useEffect(() => {
        if (!modules) {
            loading.show(true, i18n.t("Loading..."));
            compositionRoot.modules.getAllBase.execute().run(
                allModules => {
                    setModules(allModules);
                    loading.hide();
                },
                err => {
                    loading.hide();
                    snackBar.error(
                        i18n.t("Error loading Datasets: {{message}}", {
                            message: err.message,
                            nsSeparator: false,
                        })
                    );
                }
            );
        }
    }, [modules, loading, snackBar, compositionRoot.modules.getAllBase]);

    const modulesOptions = useMemo(() => {
        return (
            modules?.map(module => ({
                text: module.name,
                value: module.code,
            })) || []
        );
    }, [modules]);

    return {
        modulesOptions: modulesOptions,
    };
}
