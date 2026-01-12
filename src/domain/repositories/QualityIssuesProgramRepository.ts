import { FutureData } from "$/data/api-futures";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";

export interface QualityIssuesProgramRepository {
    getAll(): FutureData<QualityIssuesProgram[]>;
}
