import { D2Api } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Code, Id } from "$/domain/entities/Ref";
import { DataQualityWorkflowSettings } from "$/domain/entities/DataQualityWorkflowSettings";
import { DATA_QUALITY_NAMESPACE } from "$/data/common/DataStoreConfig";
import { DataQualityWorkflowSettingsRepository } from "$/domain/repositories/DataQualityWorkflowSettingsRepository";
import { Future } from "$/domain/entities/generic/Future";
import { StepSettings, StepType } from "$/domain/entities/StepSettings";
import { getErrors } from "$/domain/entities/generic/Errors";
import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";

export class DataQualityWorkflowSettingsD2Repository
    implements DataQualityWorkflowSettingsRepository
{
    constructor(private api: D2Api) {}

    get(programCode: Code): FutureData<DataQualityWorkflowSettings> {
        return this.getStepsFromDatastoreKey(programCode).flatMap(stepsDatastore => {
            const steps = this.mapStepsDatastoreToStepSettings(stepsDatastore);

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

    private mapStepsDatastoreToStepSettings(steps: StepSettingsDatastore[]): StepSettings[] {
        return steps.map(step => ({
            type: step.type as StepType,
            sectionId: step.programStageId as Id,
            disaggregations: step.disaggregations,
        }));
    }
}

type StepSettingsDatastore = {
    type: string;
    programStageId: string;
    disaggregations?: SectionDisaggregation[];
};
