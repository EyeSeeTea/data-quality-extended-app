import React from "react";

import { InputInline } from "./InputInline";
import { IssuePropertyName, QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { CheckboxInline } from "./CheckboxInline";
import { SelectorInline } from "./SelectorInline";
import { useAppContext } from "$/webapp/contexts/app-context";
import { SnackbarState, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { Code, Id } from "$/domain/entities/Ref";
import i18n from "$/utils/i18n";
import { useParams } from "react-router-dom";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";

type UpdateIssuePropertyProps = {
    analysisId: Id;
    issue: QualityAnalysisIssue;
    field: IssuePropertyName;
    setRefresh?: React.Dispatch<React.SetStateAction<number>>;
};

function getContactEmailNotification(
    field: IssuePropertyName,
    value: boolean,
    emailChanged: boolean,
    snackbar: SnackbarState
) {
    if (field === "followUp" && value === true && !emailChanged) {
        snackbar.warning(
            i18n.t(
                "No user with Capture rights and Organisation Unit or Region associated to the issue was found"
            )
        );
    }
}

export function useUpdateIssueProperty(props: UpdateIssuePropertyProps) {
    const { analysisId, field, issue, setRefresh } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();
    const loading = useLoading();
    const snackbar = useSnackbar();

    const updateIssue = React.useCallback(
        (value: string | boolean) => {
            loading.show(true, i18n.t("Updating Issue..."));
            compositionRoot.issues.save
                .execute({
                    analysisId: analysisId,
                    issue: issue,
                    propertyToUpdate: field,
                    valueToUpdate: value,
                    metadata: metadataItem,
                })
                .run(
                    result => {
                        loading.hide();
                        snackbar.success(i18n.t("Issue Updated"));
                        if (setRefresh) setRefresh(refresh => refresh + 1);
                        getContactEmailNotification(
                            field,
                            value as boolean,
                            Boolean(result.contactEmailsChanged),
                            snackbar
                        );
                    },
                    err => {
                        if (setRefresh) setRefresh(refresh => refresh + 1);
                        snackbar.error(err.message);
                        loading.hide();
                    }
                );
        },
        [
            compositionRoot.issues.save,
            loading,
            snackbar,
            issue,
            analysisId,
            field,
            setRefresh,
            metadataItem,
        ]
    );

    return { updateIssue };
}

export const EditIssueValue: React.FC<EditIssueValueProps> = React.memo(props => {
    const { id } = useParams<{
        id: string;
        qualityIssuesProgramCode: Code;
    }>();
    const { metadataItem } = useMetadataItemContext();
    const { issue, field, setRefresh } = props;
    const { updateIssue } = useUpdateIssueProperty({
        analysisId: id,
        field: field,
        issue: issue,
        setRefresh,
    });

    const onSave = (value: string | boolean) => {
        updateIssue(value);
    };

    switch (field) {
        case "comments":
            return <InputInline value={issue.comments} onSave={onSave} />;
        case "contactEmails":
            return (
                <InputInline
                    key={issue.contactEmails}
                    value={issue.contactEmails}
                    onSave={onSave}
                />
            );
        case "description":
            return <InputInline value={issue.description} onSave={onSave} />;
        case "actionDescription":
            return <InputInline value={issue.actionDescription} onSave={onSave} />;
        case "azureUrl":
            return (
                <InputInline
                    key={issue.azureUrl}
                    inputType="url"
                    value={issue.azureUrl}
                    onSave={onSave}
                />
            );
        case "followUp":
            return (
                <CheckboxInline
                    key={`${issue.id}_${issue.followUp}`}
                    value={issue.followUp}
                    onChange={onSave}
                />
            );
        case "status":
            return (
                <SelectorInline
                    items={metadataItem.optionSets.nhwaStatus.options.map(option => {
                        return { id: option.code, label: option.name };
                    })}
                    value={issue.status?.name || ""}
                    onChange={onSave}
                />
            );
        case "action":
            return (
                <SelectorInline
                    items={metadataItem.optionSets.nhwaAction.options.map(option => {
                        return { id: option.code, label: option.name };
                    })}
                    value={issue.action?.name || ""}
                    onChange={onSave}
                />
            );
        default:
            return null;
    }
});

type EditIssueValueProps = {
    issue: QualityAnalysisIssue;
    field: IssuePropertyName;
    setRefresh?: React.Dispatch<React.SetStateAction<number>>;
};
