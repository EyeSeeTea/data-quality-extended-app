import React from "react";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { TableColumn } from "@eyeseetea/d2-ui-components";

import i18n from "$/utils/i18n";
import { EditIssueValue } from "./EditIssueValue";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { hasUserGroups } from "$/webapp/components/issues/utils";

export function useIssueColumns() {
    const { metadataItem } = useMetadataItemContext();

    const [refresh, setRefresh] = React.useState(0);

    const issueColumns = React.useMemo(() => {
        const baseColumns: TableColumn<QualityAnalysisIssue>[] = [
            { name: "number", text: i18n.t("Issue"), sortable: true },
            { name: "country", text: i18n.t("Country"), sortable: false },
            {
                name: "period",
                text: i18n.t("Period"),
                sortable: false,
                getValue: value => value.period,
            },
            { name: "dataElement", text: i18n.t("Data Element"), sortable: false },
            {
                name: "categoryOption",
                text: i18n.t("Category"),
                sortable: false,
            },
            {
                name: "description",
                text: i18n.t("Description"),
                sortable: false,
                getValue: (issue: QualityAnalysisIssue) => {
                    const description = issue.description;
                    const [groupLine, ruleLine, valuesLine] = description.split("\n");

                    const isStructured =
                        groupLine?.startsWith("Rule Group: ") &&
                        ruleLine?.startsWith("Rule: ") &&
                        valuesLine?.startsWith("Values: ");

                    if (!isStructured) return description;

                    // guaranteed non-undefined by isStructured check above
                    const group = groupLine ?? "";
                    const rule = ruleLine ?? "";
                    const values = valuesLine ?? "";

                    const label = (prefix: string, line: string) => (
                        <>
                            <strong>{prefix}</strong>
                            {line.slice(prefix.length)}
                        </>
                    );

                    return (
                        <span>
                            {label("Rule Group:", group)}
                            <br />
                            {label("Rule:", rule)}
                            <br />
                            {label("Values:", values)}
                        </span>
                    );
                },
            },
            {
                name: "status",
                text: i18n.t("Status"),
                sortable: false,
                getValue: value => {
                    return <EditIssueValue key={value.id} field="status" issue={value} />;
                },
            },
            {
                name: "azureUrl",
                text: i18n.t("Azure URL"),
                sortable: false,
                hidden: true,
                getValue: value => {
                    return (
                        <EditIssueValue
                            key={value.id}
                            field="azureUrl"
                            issue={value}
                            setRefresh={setRefresh}
                        />
                    );
                },
            },
            {
                name: "followUp",
                text: i18n.t("Follow Up"),
                sortable: false,
                getValue: value => (
                    <EditIssueValue
                        key={value.id}
                        field="followUp"
                        issue={value}
                        setRefresh={setRefresh}
                    />
                ),
            },
            {
                name: "action",
                text: i18n.t("Action"),
                sortable: false,
                getValue: value => {
                    return <EditIssueValue key={value.id} field="action" issue={value} />;
                },
            },
            {
                name: "actionDescription",
                text: i18n.t("Action Description"),
                sortable: false,
                hidden: true,
                getValue: value => {
                    return (
                        <EditIssueValue key={value.id} field="actionDescription" issue={value} />
                    );
                },
            },
            {
                name: "comments",
                text: i18n.t("Comments"),
                sortable: false,
                hidden: true,
                getValue: value => {
                    return <EditIssueValue key={value.id} field="comments" issue={value} />;
                },
            },
        ];

        const actionIndex = baseColumns.findIndex(c => c.name === "action");

        const columnsWithContactEmails: TableColumn<QualityAnalysisIssue>[] = [
            ...baseColumns.slice(0, actionIndex + 1),
            {
                name: "contactEmails",
                text: i18n.t("Contact Emails"),
                sortable: false,
                hidden: false,
                getValue: (value: QualityAnalysisIssue) => {
                    return <EditIssueValue key={value.id} field="contactEmails" issue={value} />;
                },
            },
            ...baseColumns.slice(actionIndex + 1),
        ];

        return hasUserGroups(metadataItem.userGroups) ? columnsWithContactEmails : baseColumns;
    }, [metadataItem.userGroups]);

    return { refresh, setRefresh, issueColumns };
}
