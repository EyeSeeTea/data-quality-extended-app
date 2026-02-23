import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";
import { Code } from "$/domain/entities/Ref";

export interface DataQualityIssuesProgramConfigRepository {
    save(configuration: DataQualityIssuesProgramConfig, options: SaveOptions): FutureData<void>;
    get(code: Code): FutureData<DataQualityIssuesProgramConfig>;
    remove(code: Code): FutureData<void>;
}

export type SaveOptions = {
    isEdit: boolean;
};
