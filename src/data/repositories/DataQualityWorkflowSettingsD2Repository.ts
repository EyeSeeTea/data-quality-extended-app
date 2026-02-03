import { D2Api } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";
import { DataQualityWorkflowSettings } from "$/domain/entities/DataQualityWorkflowSettings";
import { DATA_QUALITY_NAMESPACE } from "$/data/common/DataStoreConfig";
import { DataQualityWorkflowSettingsRepository } from "$/domain/repositories/DataQualityWorkflowSettingsRepository";
import { Future } from "$/domain/entities/generic/Future";
import { getErrors } from "$/domain/entities/generic/Errors";
import {
    mapStepsDatastoreToStepSettings,
    StepSettingsDatastore,
} from "$/data/repositories/entities/StepSettingsDatastore";

export class DataQualityWorkflowSettingsD2Repository
    implements DataQualityWorkflowSettingsRepository
{
    constructor(private api: D2Api) {}

    get(programCode: Code): FutureData<DataQualityWorkflowSettings> {
        return this.getStepsFromDatastoreKey(programCode).flatMap(stepsDatastore => {
            const steps = mapStepsDatastoreToStepSettings(stepsDatastore);

            return DataQualityWorkflowSettings.build({ steps }).match({
                error: errors => Future.error(new Error(getErrors(errors))),
                success: settings => Future.success(settings),
            });
        });
    }

    private getStepsFromDatastoreKey(programCode: Code): FutureData<StepSettingsDatastore[]> {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);

        return apiToFuture(dataStore.get<StepSettingsDatastore[]>(`steps-${programCode}`)).flatMap(
            stepsDatastore => {
                if (!stepsDatastore)
                    return Future.error(
                        new Error(
                            `Cannot found ${DATA_QUALITY_NAMESPACE}/${`steps-${programCode}`} in datastore`
                        )
                    );

                return Future.success(stepsDatastore);
            }
        );
    }
}
