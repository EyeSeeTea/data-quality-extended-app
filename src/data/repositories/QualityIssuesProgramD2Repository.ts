import { D2Api } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { QualityIssuesProgramRepository } from "$/domain/repositories/QualityIssuesProgramRepository";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { DATA_QUALITY_NAMESPACE, dataStoreKeys } from "$/data/common/DataStoreConfig";

export class QualityIssuesProgramD2Repository implements QualityIssuesProgramRepository {
    constructor(private api: D2Api) {}

    getAll(): FutureData<QualityIssuesProgram[]> {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);
        return apiToFuture(dataStore.get<QualityIssuesProgram[]>(dataStoreKeys.PROGRAMS)).flatMap(
            qualityIssuesPrograms => {
                if (!qualityIssuesPrograms)
                    return Future.error(
                        new Error(
                            `Cannot found ${DATA_QUALITY_NAMESPACE}/${dataStoreKeys.PROGRAMS} in datastore`
                        )
                    );

                return Future.success(qualityIssuesPrograms);
            }
        );
    }
}
