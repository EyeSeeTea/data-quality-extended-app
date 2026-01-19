import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";

import { Id } from "$/domain/entities/Ref";
import { useAppContext } from "$/webapp/contexts/app-context";
import { Country } from "$/domain/entities/Country";

export function useCountriesByIds(ids: Id[]) {
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const [countries, setCountries] = React.useState<Country[]>();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (ids.length === 0) return;
        setIsLoading(true);
        compositionRoot.countries.getByIds.execute(ids).run(
            result => {
                setIsLoading(false);
                setCountries(result);
            },
            err => {
                setIsLoading(false);
                snackbar.error(err.message);
            }
        );
    }, [compositionRoot.countries.getByIds, ids, snackbar]);

    return { countries: countries, isLoading: isLoading };
}
