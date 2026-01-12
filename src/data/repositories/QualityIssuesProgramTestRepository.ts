import { Future } from "$/domain/entities/generic/Future";
import { FutureData } from "$/data/api-futures";
import { QualityIssuesProgramRepository } from "$/domain/repositories/QualityIssuesProgramRepository";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";

export class QualityIssuesProgramTestRepository implements QualityIssuesProgramRepository {
    getAll(): FutureData<QualityIssuesProgram[]> {
        return Future.success([]);
    }
}
