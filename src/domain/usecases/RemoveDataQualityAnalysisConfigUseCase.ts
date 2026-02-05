import { FutureData } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";
import { DataQualityIssuesProgramConfigRepository } from "$/domain/repositories/DataQualityIssuesProgramConfigRepository";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";

export class RemoveDataQualityAnalysisConfigUseCase {
    constructor(
        private dataQualityIssuesProgramConfigRepository: DataQualityIssuesProgramConfigRepository,
        private qualityAnalysisRepository: QualityAnalysisRepository
    ) {}

    execute(analysisProgramCode: Code): FutureData<void> {
        return this.qualityAnalysisRepository
            .removeAll(analysisProgramCode)
            .flatMap(() => {
                return this.dataQualityIssuesProgramConfigRepository.remove(analysisProgramCode);
            });
    }
}
