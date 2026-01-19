import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";

export interface DataQualityIssuesProgramConfigRepository {
    save(configuration: DataQualityIssuesProgramConfig): FutureData<void>;
}
