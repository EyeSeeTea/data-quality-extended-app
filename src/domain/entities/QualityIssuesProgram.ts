import { Code, NamedCodeRef } from "$/domain/entities/Ref";

export type QualityIssuesProgram = NamedCodeRef & {
    modules: Code[];
};
