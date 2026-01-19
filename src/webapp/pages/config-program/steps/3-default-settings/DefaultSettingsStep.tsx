import React from "react";
import styled from "styled-components";
import { Dropdown } from "@eyeseetea/d2-ui-components";

import i18n from "$/utils/i18n";
import { generatePeriodYearOptions } from "$/webapp/utils/form";
import { DataQualityIssuesProgramConfigOptions } from "$/domain/usecases/SaveDataQualityIssuesProgramConfigUseCase";

type Props = {
    values: DataQualityIssuesProgramConfigOptions["defaultSettings"];
    onChange: (patch: Partial<DataQualityIssuesProgramConfigOptions["defaultSettings"]>) => void;
    selectedModuleOptions: {
        text: string;
        value: string;
    }[];
};

const currentYear = new Date().getFullYear();

const periods = generatePeriodYearOptions(2000, currentYear);

export const DefaultSettingsStep: React.FC<Props> = React.memo(props => {
    const { values, onChange, selectedModuleOptions } = props;

    return (
        <Container>
            <SelectorContainer>
                <Dropdown
                    items={selectedModuleOptions}
                    onChange={value => onChange({ dataSet: value })}
                    value={values.dataSet}
                    label={i18n.t("Module")}
                />
            </SelectorContainer>

            <FieldsContainer>
                <Dropdown
                    items={periods}
                    onChange={value => onChange({ startDate: value })}
                    value={values.startDate}
                    label={i18n.t("Start Date")}
                />
                <Dropdown
                    items={periods}
                    onChange={value => onChange({ endDate: value })}
                    value={values.endDate}
                    label={i18n.t("End Date")}
                />
            </FieldsContainer>
        </Container>
    );
});

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-wrap: wrap;
`;

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
