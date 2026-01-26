import { FutureData } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";
import { DataQualityWorkflowSettings } from "$/domain/entities/DataQualityWorkflowSettings";

export interface DataQualityWorkflowSettingsRepository {
    get(programCode: Code): FutureData<DataQualityWorkflowSettings>;
}
