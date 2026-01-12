import { Maybe } from "$/utils/ts-utils";
import { Id, NamedCodeRef, NamedRef, Ref } from "./Ref";

export interface OptionSet extends NamedCodeRef {
    options: Array<{ id: Id; name: string; code: string }>;
}

export interface ProgramStage extends NamedCodeRef {
    description: string;
    code: string;
    sortOrder: number;
}

export interface MetadataItem {
    trackedEntityTypes: { dataQuality: NamedCodeRef };
    organisationUnits: { global: NamedCodeRef };
    dataSets: { module1: NamedCodeRef; module2: NamedCodeRef };
    optionSets: { action: OptionSet; status: OptionSet };
    trackedEntityAttributes: {
        endDate: NamedCodeRef;
        module: NamedCodeRef;
        name: NamedCodeRef;
        startDate: NamedCodeRef;
        status: NamedCodeRef;
        lastModification: NamedCodeRef;
        countries: NamedCodeRef;
        sequential: NamedCodeRef;
    };
    dataElements: {
        issueNumber: NamedCodeRef;
        azureUrl: NamedCodeRef;
        period: NamedCodeRef;
        country: NamedCodeRef;
        dataElement: NamedCodeRef;
        categoryOption: NamedCodeRef;
        description: NamedCodeRef;
        followUp: NamedCodeRef;
        status: NamedCodeRef;
        action: NamedCodeRef;
        actionDescription: NamedCodeRef;
        contactEmails: NamedCodeRef;
        comments: NamedCodeRef;
        correlative: NamedCodeRef;
        sectionNumber: NamedCodeRef;
    };
    programs: { qualityIssues: NamedRef & { programStages: ProgramStage[] } };
    userGroups: Maybe<NHWAUserGroups>;
}

export type NHWAUserGroups = {
    dataCaptureModule1: NamedCodeRef & { users: Ref[] };
    dataCaptureModule2And4: NamedCodeRef & { users: Ref[] };
};
