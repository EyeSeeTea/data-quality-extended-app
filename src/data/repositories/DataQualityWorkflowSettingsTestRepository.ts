import { FutureData } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";
import { DataQualityWorkflowSettings } from "$/domain/entities/DataQualityWorkflowSettings";
import { DataQualityWorkflowSettingsRepository } from "$/domain/repositories/DataQualityWorkflowSettingsRepository";

export class DataQualityWorkflowSettingsTestRepository
    implements DataQualityWorkflowSettingsRepository
{
    get(_programCode: Code): FutureData<DataQualityWorkflowSettings> {
        throw new Error("Method not implemented.");
    }
}
