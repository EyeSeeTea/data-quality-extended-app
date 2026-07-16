import React from "react";
import { Dropdown } from "@eyeseetea/d2-ui-components";
import styled from "styled-components";

import i18n from "$/utils/i18n";
import { Module } from "$/domain/entities/Module";
import { PeriodType } from "$/domain/entities/PeriodType";
import { qualityAnalysisStatus } from "$/domain/entities/QualityAnalysisStatus";
import { Maybe } from "$/utils/ts-utils";
import { MenuButton } from "$/webapp/components/menu-button/MenuButton";
import { Id } from "$/domain/entities/Ref";
import { PeriodDateSelector } from "$/webapp/components/period-selector/PeriodDateSelector";

type AnalysisFiltersProps = {
    modules: Module[];
    initialFilters: AnalysisFilterState;
    onChange: React.Dispatch<React.SetStateAction<AnalysisFilterState>>;
    onCreateAnalysis: (module: Module) => void;
};

export function getModulesPeriodType(modules: Module[], selectedModuleId: Maybe<Id>): PeriodType {
    const selectedModule = modules.find(module => module.id === selectedModuleId);
    return selectedModule?.periodType ?? modules[0]?.periodType ?? "";
}

export const AnalysisFilters: React.FC<AnalysisFiltersProps> = props => {
    const { modules, initialFilters, onChange, onCreateAnalysis } = props;

    const modulesFilters = modules.map(module => {
        return { value: module.id, text: module.name };
    });

    const filterPeriodType: PeriodType = getModulesPeriodType(modules, initialFilters.module);

    const analysisStatus = qualityAnalysisStatus.map(status => {
        return { value: status, text: status };
    });

    const onFilterChange = React.useCallback<
        (value: Maybe<string>, filterAttribute: string) => void
    >(
        (value, filterAttribute) => {
            onChange(prev => ({ ...prev, [filterAttribute]: value }));
        },
        [onChange]
    );

    const onModuleSelected = (moduleId: Id) => {
        const selectedModule = modules.find(module => module.id === moduleId);
        if (!selectedModule) return false;
        onCreateAnalysis(selectedModule);
    };

    return (
        <>
            <Dropdown
                items={modulesFilters}
                onChange={value => onFilterChange(value, "module")}
                value={initialFilters.module}
                label={i18n.t("Dataset")}
            />

            <PeriodDateSelectorContainer>
                <PeriodDateSelector
                    label={i18n.t("Start Date")}
                    periodType={filterPeriodType}
                    edge="start"
                    value={initialFilters.startDate ?? ""}
                    onChange={value => onFilterChange(value, "startDate")}
                />
            </PeriodDateSelectorContainer>

            <PeriodDateSelectorContainer>
                <PeriodDateSelector
                    label={i18n.t("End Date")}
                    periodType={filterPeriodType}
                    edge="end"
                    value={initialFilters.endDate ?? ""}
                    onChange={value => onFilterChange(value, "endDate")}
                />
            </PeriodDateSelectorContainer>

            <Dropdown
                items={analysisStatus}
                onChange={value => onFilterChange(value, "status")}
                value={initialFilters.status}
                label={i18n.t("Status")}
            />

            <MenuButton
                label={i18n.t("New Data Quality Report")}
                items={modules.map(module => ({ id: module.id, label: module.name }))}
                onItemSelected={onModuleSelected}
            />
        </>
    );
};

export type AnalysisFilterState = {
    endDate: Maybe<string>;
    module: Maybe<string>;
    name: Maybe<string>;
    startDate: Maybe<string>;
    status: Maybe<string>;
};

export const initialFilters: AnalysisFilterState = {
    endDate: undefined,
    module: undefined,
    name: undefined,
    startDate: undefined,
    status: undefined,
};

const PeriodDateSelectorContainer = styled.div`
    margin-inline-start: 10px;

    > div {
        margin-block-end: 24px;
    }
`;
