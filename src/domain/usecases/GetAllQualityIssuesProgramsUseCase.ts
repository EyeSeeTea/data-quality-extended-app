import { FutureData } from "$/data/api-futures";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { QualityIssuesProgramRepository } from "$/domain/repositories/QualityIssuesProgramRepository";

export class GetAllQualityIssuesProgramsUseCase {
    constructor(private qualityIssuesProgramRepository: QualityIssuesProgramRepository) {}

    execute(): FutureData<QualityIssuesProgram[]> {
        return this.qualityIssuesProgramRepository.getAll();
    }
}
