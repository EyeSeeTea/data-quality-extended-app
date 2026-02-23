import { FutureData } from "$/data/api-futures";
import { DataQualityWorkflowSettings } from "$/domain/entities/DataQualityWorkflowSettings";
import { Code } from "$/domain/entities/Ref";
import { DataQualityWorkflowSettingsRepository } from "$/domain/repositories/DataQualityWorkflowSettingsRepository";

export class GetDataQualityWorkflowSettingsUseCase {
    constructor(
        private dataQualityWorkflowSettingsRepository: DataQualityWorkflowSettingsRepository
    ) {}

    execute(programCode: Code): FutureData<DataQualityWorkflowSettings> {
        return this.dataQualityWorkflowSettingsRepository.get(programCode);
    }
}
