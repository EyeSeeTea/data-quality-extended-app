import React from "react";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { TableColumn } from "@eyeseetea/d2-ui-components";

import i18n from "$/utils/i18n";
import { EditIssueValue } from "./EditIssueValue";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";

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

        if (actionIndex === -1) {
            return baseColumns;
        }

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

        return metadataItem.userGroups && Object.keys(metadataItem.userGroups).length
            ? columnsWithContactEmails
            : baseColumns;
    }, [metadataItem.userGroups]);

    return { refresh, setRefresh, issueColumns };
}
