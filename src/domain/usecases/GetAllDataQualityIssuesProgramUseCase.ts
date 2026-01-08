import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgram } from "$/domain/entities/DataQualityIssuesProgram";
import { DataQualityIssuesProgramRepository } from "$/domain/repositories/DataQualityIssuesProgramRepository";

export class GetAllDataQualityIssuesProgramUseCase {
    constructor(private dataQualityIssuesProgramRepository: DataQualityIssuesProgramRepository) {}

    execute(): FutureData<DataQualityIssuesProgram[]> {
        return this.dataQualityIssuesProgramRepository.getAll();
    }
}
