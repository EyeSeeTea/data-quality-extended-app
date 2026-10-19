import { NHWAUserGroups } from "$/domain/entities/MetadataItem";
import { QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { Maybe } from "$/utils/ts-utils";

export function hasUserGroups(userGroups: Maybe<NHWAUserGroups>): boolean {
    return !!userGroups && Object.keys(userGroups).length > 0;
}

export function getQualityAnalysisId(row: QualityAnalysisIssue): string {
    return `${row.id}:${row.number}`;
}

export function parseQualityAnalysisId(qualityAnalysisId: string): {
    issueId: string;
    issueNumber: string;
} {
    const [id, number] = qualityAnalysisId.split(":");

    if (!id || !number) {
        throw new Error(`Invalid quality analysis ID: ${qualityAnalysisId}`);
    }

    return { issueId: id, issueNumber: number };
}
