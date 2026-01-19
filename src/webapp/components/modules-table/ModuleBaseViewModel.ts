import { ModuleBase } from "$/domain/entities/Module";
import { Code } from "$/domain/entities/Ref";
import { Maybe } from "$/utils/ts-utils";

type DataQualityIssuesProgram = {
    dataQualityIssuesProgramCode: Maybe<Code>;
    dataQualityIssuesProgramName: string;
};

export type ModuleBaseViewModel = ModuleBase & DataQualityIssuesProgram;
