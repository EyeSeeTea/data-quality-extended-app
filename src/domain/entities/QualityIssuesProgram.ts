import { Code, NamedCodeRef, NamedRef } from "$/domain/entities/Ref";

export type QualityIssuesProgram = NamedCodeRef & {
    modules: Code[];
    sections: NamedRef[];
};
