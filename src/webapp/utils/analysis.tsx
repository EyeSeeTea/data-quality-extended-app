import i18n from "$/utils/i18n";
import { ProgressStatus } from "$/webapp/components/progress-status/ProgressStatus";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { TableColumn } from "@eyeseetea/d2-ui-components";
import { Tooltip } from "@material-ui/core";

import styled from "styled-components";
import { Tag } from "$/webapp/components/tag/Tag";

function mapAnalysisStatusToColor(sectionStatus: string) {
    switch (sectionStatus) {
        case "pending":
            return "default";
        case "success_with_issues":
            return "danger";
        case "success":
            return "success";
        case "Completed":
            return "success";
        default:
            return "default";
    }
}

export const analysisColumns: TableColumn<QualityAnalysis>[] = [
    { name: "name", text: i18n.t("Name"), sortable: true },
    { name: "module", text: i18n.t("Dataset"), sortable: true },
    {
        name: "startDate",
        text: i18n.t("Start Date"),
        sortable: true,
        getValue: row => row.startDate,
    },
    {
        name: "endDate",
        text: i18n.t("End Date"),
        sortable: true,
        getValue: row => row.endDate,
    },
    {
        name: "status",
        text: i18n.t("Status"),
        sortable: true,
        getValue: row => (
            <Tag name={i18n.t(row.status)} status={mapAnalysisStatusToColor(row.status)} />
        ),
    },
    {
        name: "sections",
        text: i18n.t("Progress"),
        sortable: false,
        getValue: row => {
            return (
                <ProgressContainer>
                    {row.sections.map((value, index) => (
                        <Tooltip key={value.id} title={value.name}>
                            <ProgressStatus
                                position={index + 1}
                                name={value.name}
                                status={mapAnalysisStatusToColor(value.status)}
                            />
                        </Tooltip>
                    ))}
                </ProgressContainer>
            );
        },
    },
    { name: "lastModification", text: i18n.t("Last Modification"), sortable: true },
];

const ProgressContainer = styled.ul`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-inline-start: unset;
`;
