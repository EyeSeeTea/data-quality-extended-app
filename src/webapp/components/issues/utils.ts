import { NHWAUserGroups } from "$/domain/entities/MetadataItem";
import { IssuePropertyName } from "$/domain/entities/QualityAnalysisIssue";
import { Maybe } from "$/utils/ts-utils";

export function hasUserGroups(userGroups: Maybe<NHWAUserGroups>): boolean {
    return !!userGroups && Object.keys(userGroups).length > 0;
}

export function shouldNotifyNoContactUser(params: {
    field: IssuePropertyName;
    value: boolean;
    emailChanged: boolean;
    userGroupsConfigured: boolean;
}): boolean {
    const { field, value, emailChanged, userGroupsConfigured } = params;
    return userGroupsConfigured && field === "followUp" && value === true && !emailChanged;
}
