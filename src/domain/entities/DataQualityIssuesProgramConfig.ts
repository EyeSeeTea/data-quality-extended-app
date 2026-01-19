import { Code, Id } from "$/domain/entities/Ref";

export type DataQualityIssuesProgramConfig = {
    selectedProgramCode: Code | undefined;
    selectedModuleCodes: Code[];
    defaultSettings: {
        dataSet: Code | undefined;
        endDate: string | undefined;
        startDate: string | undefined;
        orgUnits: Id[];
    };
};
