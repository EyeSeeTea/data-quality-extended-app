import { Future } from "$/domain/entities/generic/Future";
import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgramRepository } from "$/domain/repositories/DataQualityIssuesProgramRepository";
import { DataQualityIssuesProgram } from "$/domain/entities/DataQualityIssuesProgram";

export class DataQualityIssuesProgramTestRepository implements DataQualityIssuesProgramRepository {
    getAll(): FutureData<DataQualityIssuesProgram[]> {
        return Future.success([]);
    }
}
