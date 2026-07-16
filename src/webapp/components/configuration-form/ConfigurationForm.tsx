import React from "react";
import { Button, TextField } from "@material-ui/core";
import { Dropdown, OrgUnitsSelector } from "@eyeseetea/d2-ui-components";

import i18n from "$/utils/i18n";
import { useAppContext } from "$/webapp/contexts/app-context";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { validateDateRange } from "$/domain/entities/generic/validations";
import { Maybe } from "$/utils/ts-utils";
import { PeriodDateSelector } from "$/webapp/components/period-selector/PeriodDateSelector";
import { Id } from "$/domain/entities/Ref";
import _ from "$/domain/entities/generic/Collection";
import styled from "styled-components";
import { getDefaultModules } from "$/data/common/D2Module";
import { Alert } from "@material-ui/lab";
import { ORG_UNIT_LEVELS, ORG_UNIT_SELECTABLE_LEVELS } from "$/webapp/utils/form";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { useCountriesByIds } from "$/webapp/hooks/useCountriesByIds";

export function getIdFromCountriesPaths(paths: string[]): string[] {
    return _(paths)
        .map(path => {
            return _(path.split("/")).last() || undefined;
        })
        .compact()
        .value();
}

export const ConfigurationForm: React.FC<ConfigurationFormProps> = React.memo(props => {
    const { initialData, onSave, updateCountry } = props;
    const { api, currentUser } = useAppContext();
    const { metadataItem } = useMetadataItemContext();
    const { countries } = useCountriesByIds(initialData.countriesAnalysis);
    const [formData, setFormData] = React.useState<QualityAnalysis>(() => {
        return initialData;
    });
    const [selectedOrgUnits, setSelectedOrgUnits] = React.useState<Id[]>([]);
    const inputRef = React.useRef<HTMLInputElement>();

    React.useEffect(() => {
        if (countries && countries.length > 0) {
            setSelectedOrgUnits(countries.map(country => country.path));
        }
    }, [countries]);

    const modules = getDefaultModules(metadataItem);
    const moduleItems = modules.map(module => ({ value: module.id, text: module.name }));

    const onFormSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!formData) return undefined;
            if (!inputRef.current?.value) return undefined;
            if (formData) {
                QualityAnalysis.build({
                    ...formData,
                    name: inputRef.current.value,
                    countriesAnalysis: getIdFromCountriesPaths(selectedOrgUnits),
                }).match({
                    success: onSave,
                    // Nothing to do: the inline Start/End Date Alert already reports
                    // date_range_invalid, and the Save button is disabled while it holds.
                    error: () => undefined,
                });
            }
        },
        [formData, onSave, selectedOrgUnits]
    );

    const onChangeModule = (value: Maybe<string>) => {
        const selectedModule = modules.find(module => module.id === value);
        if (selectedModule) {
            setFormData(prev => {
                const candidate = {
                    ...prev,
                    module: { ...selectedModule, dataElements: [], disaggregations: [] },
                };
                return QualityAnalysis.build(candidate).match({
                    success: qualityAnalysis => qualityAnalysis,
                    error: () => new QualityAnalysis(candidate),
                });
            });
        }
    };

    const onChangePeriod = (value: Maybe<string>, attributeName: string) => {
        if (!value) return false;
        setFormData(prev => {
            const candidate = { ...prev, [attributeName]: value };
            return QualityAnalysis.build(candidate).match({
                success: qualityAnalysis => qualityAnalysis,
                error: () => new QualityAnalysis(candidate),
            });
        });
    };

    const dateRangeErrors = validateDateRange(formData.startDate, formData.endDate);
    const hasDateRangeError = dateRangeErrors.length > 0;

    const onOrgUnitsChange = (value: Id[]) => {
        setSelectedOrgUnits(value);
        updateCountry(value.length > 0);
    };

    const disableSave = QualityAnalysis.hasExecutedSections(formData);
    const selectorClass = disableSave ? "config-form-selector disabled" : "config-form-selector";

    return (
        <Form onSubmit={onFormSubmit}>
            {selectedOrgUnits.length === 0 && (
                <AlertContainer>
                    <Alert severity="error">
                        {i18n.t("Select at least one organisation unit")}
                    </Alert>
                </AlertContainer>
            )}

            {hasDateRangeError && (
                <AlertContainer>
                    <Alert severity="error">
                        {i18n.t("Start Date must not be later than End Date")}
                    </Alert>
                </AlertContainer>
            )}

            <FormControlsContainer>
                <StyledTextField
                    inputRef={inputRef}
                    name="name"
                    label={i18n.t("Name")}
                    defaultValue={formData?.name}
                />
                <DropdownWrapper>
                    <Dropdown
                        className={selectorClass}
                        hideEmpty
                        items={moduleItems}
                        onChange={onChangeModule}
                        value={formData?.module.id}
                        label={i18n.t("Module")}
                    />

                    <PeriodDateSelectorContainer>
                        <PeriodDateSelector
                            className={selectorClass}
                            label={i18n.t("Start Date")}
                            periodType={formData.module.periodType}
                            edge="start"
                            value={formData?.startDate ?? ""}
                            onChange={value => onChangePeriod(value, "startDate")}
                            disabled={disableSave}
                            clearable={false}
                        />
                    </PeriodDateSelectorContainer>

                    <PeriodDateSelectorContainer>
                        <PeriodDateSelector
                            className={selectorClass}
                            label={i18n.t("End Date")}
                            periodType={formData.module.periodType}
                            edge="end"
                            value={formData?.endDate ?? ""}
                            onChange={value => onChangePeriod(value, "endDate")}
                            disabled={disableSave}
                            clearable={false}
                        />
                    </PeriodDateSelectorContainer>
                </DropdownWrapper>
            </FormControlsContainer>

            <OrgUnitContainer $disabled={disableSave}>
                <OrgUnitsSelector
                    api={api}
                    onChange={onOrgUnitsChange}
                    selected={selectedOrgUnits}
                    levels={ORG_UNIT_LEVELS}
                    selectableLevels={ORG_UNIT_SELECTABLE_LEVELS}
                    rootIds={currentUser.countries.map(country => country.id)}
                    withElevation={false}
                />
            </OrgUnitContainer>

            <ActionsContainer>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={hasDateRangeError}
                >
                    {i18n.t("Save Config Analysis")}
                </Button>
            </ActionsContainer>
        </Form>
    );
});

type ConfigurationFormProps = {
    initialData: QualityAnalysis;
    onSave: (data: QualityAnalysis) => void;
    updateCountry: React.Dispatch<React.SetStateAction<boolean>>;
};

const Form = styled.form``;

const FormControlsContainer = styled.div`
    display: flex;
    gap: 1.5rem;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 1.25rem;
    flex-wrap: wrap;
`;

const DropdownWrapper = styled.div`
    display: flex;
    gap: 1rem;
    align-items: flex-end;
`;

const StyledTextField = styled(TextField)`
    width: 40%;
    margin-inline-end: 1rem;
`;

const OrgUnitContainer = styled.div<{ $disabled?: boolean }>`
    pointer-events: ${props => (props.$disabled ? "none" : "auto")};
    opacity: ${props => (props.$disabled ? "0.7" : "1")};
`;

const ActionsContainer = styled.div`
    text-align: right;
`;

const AlertContainer = styled.div`
    margin-block: 1em;
`;

const PeriodDateSelectorContainer = styled.div`
    > div {
        margin-block-end: 0px;
    }
`;
