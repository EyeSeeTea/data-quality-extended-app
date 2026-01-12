import { Id } from "$/domain/entities/Ref";

export type QualityIssuesProgram = {
    id: string;
    name: string;
    code: string;
    userGroups: QualityIssuesUserGroups;
};

type QualityIssuesUserGroups = {
    adminAccess: Id[];
    captureAccess: Id[];
    readAccess: Id[];
};
