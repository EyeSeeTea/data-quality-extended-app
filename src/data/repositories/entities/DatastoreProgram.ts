import { Code } from "$/domain/entities/Ref";

export type DatastoreProgram = {
    code: Code;
    name: string;
    dataSets: Code[];
};
