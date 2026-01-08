import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgram } from "$/domain/entities/DataQualityIssuesProgram";

export interface DataQualityIssuesProgramRepository {
    getAll(): FutureData<DataQualityIssuesProgram[]>;
}
