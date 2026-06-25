import _ from "lodash";

import {
    QualityAnalysisIssue,
    QualityAnalysisIssueAttrs,
} from "$/domain/entities/QualityAnalysisIssue";
import { IssueExportRepository } from "$/domain/repositories/IssueExportRepository";
import { FutureData } from "$/data/api-futures";
import { Workbook, WorkbookSheet, exportToSpreadsheet } from "$/data/common/SpreadSheet";
import i18n from "$/utils/i18n";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export class IssueSpreadSheetRepository implements IssueExportRepository {
    export(issues: QualityAnalysisIssue[], metadata: MetadataItem): FutureData<void> {
        const issuesByGroup = _(issues).groupBy("type").value();

        const sheets = _(metadata.programs.qualityIssues.programStages)
            .map(programStage => {
                const issuesInStep = issuesByGroup[programStage.id];
                if (!issuesInStep) return undefined;

                const sheet: WorkbookSheet<keyof IssueExport> = {
                    name: programStage.name.replace(/[/?*[\]]/g, ""),
                    columns: _.keys(issuesFields) as Array<keyof IssueExport>,
                    columnsInfo: {
                        id: { title: i18n.t("ID") },
                        number: { title: i18n.t("Number") },
                        azureUrl: { title: i18n.t("Azure URL") },
                        period: { title: i18n.t("Period") },
                        country: { title: i18n.t("Org Unit") },
                        dataElement: { title: i18n.t("Data Element") },
                        categoryOption: { title: i18n.t("Category") },
                        description: { title: i18n.t("Description") },
                        followUp: { title: i18n.t("Follow Up") },
                        status: { title: i18n.t("Status") },
                        action: { title: i18n.t("Action") },
                        actionDescription: { title: i18n.t("Action Description") },
                        comments: { title: i18n.t("Comments") },
                        contactEmails: { title: i18n.t("Contact Emails") },
                    },
                    records: issuesInStep.map(
                        (
                            record
                        ): Record<keyof IssueExport, string | number | boolean | undefined> => ({
                            id: record.id,
                            number: record.number,
                            azureUrl: record.azureUrl,
                            period: record.period,
                            country: record.country?.name,
                            dataElement: record.dataElement?.name,
                            categoryOption: record.categoryOption?.name,
                            description: record.description,
                            followUp: record.followUp ? i18n.t("Yes") : i18n.t("No"),
                            status: record.status?.name,
                            action: record.action?.name,
                            actionDescription: record.actionDescription,
                            comments: record.comments,
                            contactEmails: record.contactEmails,
                        })
                    ),
                };

                return sheet;
            })
            .compact()
            .value();

        const workbook: Workbook = { name: "issues", sheets: sheets };
        return exportToSpreadsheet(workbook);
    }
}

type IssueExport = Omit<QualityAnalysisIssueAttrs, "correlative" | "type">;

export const issuesFields: Record<keyof IssueExport, null> = {
    id: null,
    number: null,
    azureUrl: null,
    period: null,
    country: null,
    dataElement: null,
    categoryOption: null,
    description: null,
    followUp: null,
    status: null,
    action: null,
    actionDescription: null,
    comments: null,
    contactEmails: null,
};
