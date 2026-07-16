import { Future } from "$/domain/entities/generic/Future";
import { FutureData } from "$/data/api-futures";
import {
    DataQualityIssuesProgramConfigRepository,
    SaveOptions,
} from "$/domain/repositories/DataQualityIssuesProgramConfigRepository";
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";
import { Code } from "$/domain/entities/Ref";

export class DataQualityIssuesProgramConfigTestRepository
    implements DataQualityIssuesProgramConfigRepository
{
    save(_configuration: DataQualityIssuesProgramConfig, _options: SaveOptions): FutureData<void> {
        return Future.success(undefined);
    }

    get(code: Code): FutureData<DataQualityIssuesProgramConfig> {
        return Future.success(
            DataQualityIssuesProgramConfig.build({
                selectedProgramCode: code,
                selectedModuleCodes: [],
                defaultSettings: {
                    dataSet: "defaultDataSetCode",
                    startDate: "2023-01-01",
                    endDate: "2023-12-31",
                    orgUnits: [],
                    usePreviousPeriod: false,
                },
                steps: [],
            }).get()
        );
    }

    remove(_code: Code): FutureData<void> {
        return Future.success(undefined);
    }
}
