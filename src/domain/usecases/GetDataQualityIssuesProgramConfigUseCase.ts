import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";
import { Code } from "$/domain/entities/Ref";
import { DataQualityIssuesProgramConfigRepository } from "$/domain/repositories/DataQualityIssuesProgramConfigRepository";

export class GetDataQualityIssuesProgramConfigUseCase {
    constructor(
        private dataQualityIssuesProgramConfigRepository: DataQualityIssuesProgramConfigRepository
    ) {}

    execute(code: Code): FutureData<DataQualityIssuesProgramConfig> {
        return this.dataQualityIssuesProgramConfigRepository.get(code);
    }
}
