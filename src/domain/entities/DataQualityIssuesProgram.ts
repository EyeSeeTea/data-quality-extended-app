import { Id } from "$/domain/entities/Ref";

export type DataQualityIssuesProgram = {
    id: string;
    name: string;
    code: string;
    userGroups: DataQualityIssuesUserGroups;
};

type DataQualityIssuesUserGroups = {
    adminAccess: Id[];
    captureAccess: Id[];
    readAccess: Id[];
};
