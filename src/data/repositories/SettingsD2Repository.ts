import _ from "$/domain/entities/generic/Collection";
import { D2Api } from "$/types/d2-api";
import { Settings } from "$/domain/entities/Settings";
import { SettingsRepository } from "$/domain/repositories/SettingsRepository";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Code, Id, NamedCodeRef } from "$/domain/entities/Ref";
import { DATA_QUALITY_NAMESPACE } from "$/data/common/DataStoreConfig";

export class SettingsD2Repository implements SettingsRepository {
    constructor(private api: D2Api) {}

    get(selectedQualityIssuesProgramCode: Code): FutureData<Settings> {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);
        return apiToFuture(
            dataStore.get<D2DataStore>(`settings-${selectedQualityIssuesProgramCode}`)
        ).flatMap(d2Response => {
            if (!d2Response)
                throw Error(
                    `Cannot found ${DATA_QUALITY_NAMESPACE}/${`settings-${selectedQualityIssuesProgramCode}`} in datastore`
                );
            return this.getDataSet(d2Response.defaultConfig.dataSet).map(dataSet => {
                return Settings.build({
                    endDate: d2Response.defaultConfig.endDate,
                    module: dataSet,
                    countryIds: d2Response.defaultConfig.orgUnits,
                    startDate: d2Response.defaultConfig.startDate,
                    usePreviousYear: d2Response.defaultConfig.usePreviousYear,
                }).get();
            });
        });
    }

    private getDataSet(dataSetCode: string): FutureData<NamedCodeRef> {
        return apiToFuture(
            this.api.models.dataSets.get({
                fields: { id: true, code: true, name: true },
                filter: { code: { eq: dataSetCode } },
            })
        ).map(d2Response => {
            const dataSet = _(d2Response.objects).first();
            if (!dataSet) throw Error(`Cannot found dataSet: ${dataSetCode}`);
            return dataSet;
        });
    }
}

type D2DataStore = {
    defaultConfig: Pick<Settings, "endDate" | "startDate" | "usePreviousYear"> & {
        dataSet: string;
        orgUnits: Id[];
    };
};
