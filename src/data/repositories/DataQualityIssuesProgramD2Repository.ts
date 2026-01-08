import { D2Api } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { DataQualityIssuesProgramRepository } from "$/domain/repositories/DataQualityIssuesProgramRepository";
import { DataQualityIssuesProgram } from "$/domain/entities/DataQualityIssuesProgram";
import { DATA_QUALITY_NAMESPACE, dataStoreKeys } from "$/data/common/DataStoreConfig";

export class DataQualityIssuesProgramD2Repository implements DataQualityIssuesProgramRepository {
    constructor(private api: D2Api) {}

    getAll(): FutureData<DataQualityIssuesProgram[]> {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);
        return apiToFuture(
            dataStore.get<DataQualityIssuesProgram[]>(dataStoreKeys.PROGRAMS)
        ).flatMap(dataQualityIssuesPrograms => {
            if (!dataQualityIssuesPrograms)
                return Future.error(
                    new Error(
                        `Cannot found ${DATA_QUALITY_NAMESPACE}/${dataStoreKeys.PROGRAMS} in datastore`
                    )
                );

            return Future.success(dataQualityIssuesPrograms);
        });
    }
}
