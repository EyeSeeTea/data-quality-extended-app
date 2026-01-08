import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";

import { useAppContext } from "$/webapp/contexts/app-context";
import { Id } from "$/domain/entities/Ref";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { DataElement } from "$/domain/entities/DataElement";
import _ from "$/domain/entities/generic/Collection";
import { Maybe } from "$/utils/ts-utils";
import { IssueTemplate } from "$/domain/usecases/CreateIssueUseCase";
import { getIdFromCountriesPaths } from "$/webapp/components/configuration-form/ConfigurationForm";
import { generatePeriodYearOptions } from "$/webapp/utils/form";

type UseAddIssueDialogProps = {
    analysis: QualityAnalysis;
    onAddIssue: (issues: IssueTemplate[]) => void;
};

export function useAddIssueDialog(props: UseAddIssueDialogProps) {
    const { analysis, onAddIssue } = props;
    const { compositionRoot, metadata } = useAppContext();
    const snackBar = useSnackbar();

    const [addIssueForm, updateAddIssueForm] = React.useState<AddIssueForm>({
        orgUnitPaths: [],
        periods: [],
        dataElementId: undefined,
        categoryOptionIds: [],
        description: "",
    });
    const [dataElements, setDataElements] = React.useState<DataElement[]>([]);

    const issues = React.useMemo(
        () =>
            buildAllIssues({
                ...addIssueForm,
                orgUnitIds: getIdFromCountriesPaths(addIssueForm.orgUnitPaths),
            }),
        [addIssueForm]
    );

    const dataElementOptions = React.useMemo(
        () =>
            _(dataElements)
                .sortBy(dataElement => dataElement.name)
                .map(({ name, id }) => ({ text: name, value: id }))
                .value(),
        [dataElements]
    );
    const dataElementsMap = React.useMemo(
        () => _(dataElements).keyBy(dataElement => dataElement.id),
        [dataElements]
    );
    const categoryOptionOptions = React.useMemo(() => {
        if (addIssueForm.dataElementId) {
            return (
                dataElementsMap
                    .get(addIssueForm.dataElementId)
                    ?.disaggregation?.options.map(({ id, name }) => ({ text: name, value: id })) ??
                []
            );
        } else {
            return [];
        }
    }, [dataElementsMap, addIssueForm]);

    const periodOptions = React.useMemo(() => {
        const { startDate, endDate } = analysis;
        const startYear = parseInt(startDate);
        const endYear = parseInt(endDate);

        return generatePeriodYearOptions(startYear, endYear);
    }, [analysis]);

    const onSave = React.useCallback(() => {
        onAddIssue(issues);
    }, [onAddIssue, issues]);

    const updateForm = React.useCallback(
        (field: keyof AddIssueForm) => (value: Maybe<Id[]>) => {
            const newValue =
                ["dataElementId", "description"].includes(field) && value ? value[0] : value;
            updateAddIssueForm(prev => ({
                ...prev,
                [field]: newValue,
            }));
        },
        []
    );

    React.useEffect(() => {
        compositionRoot.modules.get.execute({ ids: [analysis.module.id], metadata: metadata }).run(
            modules => {
                const module = modules[0];
                if (module) {
                    setDataElements(module.dataElements);
                }
            },
            err => {
                snackBar.error(err.message);
            }
        );
    }, [compositionRoot, analysis, snackBar, metadata]);

    return {
        addIssueForm,
        updateForm,
        dataElementOptions,
        categoryOptionOptions,
        periodOptions,
        onSave,
        issuesToAddCount: issues.length,
    };
}

type BuildIssueProps = Omit<AddIssueForm, "orgUnitPaths"> & { orgUnitIds: Id[] };
function buildAllIssues(props: BuildIssueProps): IssueTemplate[] {
    const { orgUnitIds, periods, dataElementId, categoryOptionIds, description } = props;

    if (!orgUnitIds.length && !periods.length && !dataElementId && !description) {
        return [];
    }

    const periodsList = periods.length > 0 ? periods : [""];
    const categoryList = categoryOptionIds.length > 0 ? categoryOptionIds : [""];
    const orgUnitList = orgUnitIds.length > 0 ? orgUnitIds : [""];

    const product = _([periodsList, categoryList, orgUnitList]).cartesian().value();

    return product.map(([period, categoryOption, orgUnit]) => ({
        period,
        categoryOptionComboId: categoryOption,
        countryId: orgUnit,
        description: description,
        dataElementId: dataElementId,
    }));
}

type AddIssueForm = {
    orgUnitPaths: Id[];
    periods: Id[];
    dataElementId: Maybe<Id>;
    categoryOptionIds: Id[];
    description: string;
};
