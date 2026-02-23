import React from "react";
import _ from "lodash";
import styled from "styled-components";
import { Dropdown, OrgUnitsSelector } from "@eyeseetea/d2-ui-components";

import i18n from "$/utils/i18n";
import {
    generatePeriodYearOptions,
    ORG_UNIT_LEVELS,
    ORG_UNIT_SELECTABLE_LEVELS,
} from "$/webapp/utils/form";
import { DataQualityIssuesProgramConfigOptions } from "$/domain/usecases/SaveDataQualityIssuesProgramConfigUseCase";
import { useAppContext } from "$/webapp/contexts/app-context";
import { Id } from "$/domain/entities/Ref";
import { CheckboxInline } from "$/webapp/components/issues/CheckboxInline";
import { getIdFromCountriesPaths } from "$/webapp/components/configuration-form/ConfigurationForm";
import { Option } from "$/webapp/entities/Option";

type Props = {
    values: DataQualityIssuesProgramConfigOptions["defaultSettings"];
    onChange: (patch: Partial<DataQualityIssuesProgramConfigOptions["defaultSettings"]>) => void;
    selectedModuleOptions: Option[];
};

const currentYear = new Date().getFullYear();

const periods = generatePeriodYearOptions(2000, currentYear);

export const DefaultSettingsStep: React.FC<Props> = React.memo(props => {
    const { api, currentUser } = useAppContext();
    const { values, onChange, selectedModuleOptions } = props;

    const onOrgUnitsChange = React.useCallback(
        (paths: Id[]) => {
            const orgUnitIds = getIdFromCountriesPaths(paths);
            onChange({ orgUnitPaths: paths, orgUnits: orgUnitIds });
        },
        [onChange]
    );

    const onUsePreviousYearChange = React.useCallback(
        (checked: boolean) => {
            if (checked) {
                onChange({ usePreviousYear: true, startDate: "", endDate: "" });
            } else {
                onChange({ usePreviousYear: false });
            }
        },
        [onChange]
    );

    return (
        <Container>
            <SelectorContainer>
                <Dropdown
                    items={selectedModuleOptions}
                    onChange={value => onChange({ dataSet: value })}
                    value={values.dataSet}
                    label={i18n.t("Dataset")}
                />
            </SelectorContainer>

            <FieldsContainer>
                <CheckboxContainer>
                    <CheckboxInline
                        value={values.usePreviousYear}
                        onChange={onUsePreviousYearChange}
                    />
                    <span>{i18n.t("Use previous year for start and end dates")}</span>
                </CheckboxContainer>

                <DisabledWrapper disabled={values.usePreviousYear}>
                    <Dropdown
                        items={periods}
                        onChange={value => onChange({ startDate: value })}
                        value={values.startDate}
                        label={i18n.t("Start Date")}
                    />
                </DisabledWrapper>

                <DisabledWrapper disabled={values.usePreviousYear}>
                    <Dropdown
                        items={periods}
                        onChange={value => onChange({ endDate: value })}
                        value={values.endDate}
                        label={i18n.t("End Date")}
                    />
                </DisabledWrapper>
            </FieldsContainer>

            <OrgUnitContainer>
                <OrgUnitsSelector
                    api={api}
                    onChange={onOrgUnitsChange}
                    selected={values.orgUnitPaths}
                    levels={ORG_UNIT_LEVELS}
                    selectableLevels={ORG_UNIT_SELECTABLE_LEVELS}
                    rootIds={currentUser.countries.map(country => country.id)}
                    withElevation={false}
                />
            </OrgUnitContainer>
        </Container>
    );
});

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-wrap: wrap;
`;

const OrgUnitContainer = styled.div``;

const SelectorContainer = styled.div`
    margin: 8px 0 16px 0;

    > div {
        min-width: 400px;
    }
`;

const FieldsContainer = styled.div`
    display: flex;
    gap: 70px;
    flex-wrap: wrap;
    margin: 8px 0 0 0;

    > div {
        min-width: 125px;
    }
`;

const DisabledWrapper = styled.div<{ disabled?: boolean }>`
    pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
    opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const CheckboxContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0px;
    flex-wrap: nowrap;
`;
