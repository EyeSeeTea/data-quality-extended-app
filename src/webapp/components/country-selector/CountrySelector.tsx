import React from "react";
import { OrgUnitsSelector } from "@eyeseetea/d2-ui-components";

import { D2Api } from "$/types/d2-api";
import { Id } from "$/domain/entities/Ref";

export const CountrySelector: React.FC<CountrySelectorProps> = props => {
    const { api, onChange, rootIds, selectedCountriesIds: selectedOrgUnits } = props;

    const onOrgUnitsChange = (ids: Id[]) => {
        onChange(ids);
    };

    return (
        <OrgUnitsSelector
            api={api}
            onChange={onOrgUnitsChange}
            selected={selectedOrgUnits}
            rootIds={rootIds}
            withElevation={false}
        />
    );
};

type CountrySelectorProps = {
    api: D2Api;
    onChange: (ids: Id[]) => void;
    rootIds: Id[];
    selectedCountriesIds: Id[];
};
