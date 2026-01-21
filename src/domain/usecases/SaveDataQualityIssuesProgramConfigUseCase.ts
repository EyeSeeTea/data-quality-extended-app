import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";
import { Either } from "$/domain/entities/generic/Either";
import { getErrors, ValidationError } from "$/domain/entities/generic/Errors";
import { Future } from "$/domain/entities/generic/Future";
import { Code, Id } from "$/domain/entities/Ref";
import { DataQualityIssuesProgramConfigRepository } from "$/domain/repositories/DataQualityIssuesProgramConfigRepository";

export class SaveDataQualityIssuesProgramConfigUseCase {
    constructor(
        private dataQualityIssuesProgramConfigRepository: DataQualityIssuesProgramConfigRepository
    ) {}

    execute(configurationOptions: DataQualityIssuesProgramConfigOptions): FutureData<void> {
        const result = mapToDataQualityIssuesProgramConfig(configurationOptions);
        return result.match({
            error: errors => {
                const errorMessages = getErrors(errors);
                return Future.error(new Error(errorMessages));
            },
            success: configuration => {
                return this.dataQualityIssuesProgramConfigRepository.save(configuration);
            },
        });
    }
}

export type DataQualityIssuesProgramConfigOptions = {
    selectedProgramCode: Code | undefined;
    selectedModuleCodes: Code[];
    defaultSettings: {
        dataSet: Code | undefined;
        endDate: string | undefined;
        startDate: string | undefined;
        usePreviousYear: boolean;
        orgUnits: Id[];
        orgUnitPaths: string[];
    };
};
export const initialState: DataQualityIssuesProgramConfigOptions = {
    selectedProgramCode: undefined,
    selectedModuleCodes: [],
    defaultSettings: {
        dataSet: undefined,
        endDate: undefined,
        startDate: undefined,
        usePreviousYear: false,
        orgUnits: [],
        orgUnitPaths: [],
    },
};

function mapToDataQualityIssuesProgramConfig(
    selectedOptions: DataQualityIssuesProgramConfigOptions
): Either<ValidationError<DataQualityIssuesProgramConfig>[], DataQualityIssuesProgramConfig> {
    return DataQualityIssuesProgramConfig.build({
        selectedProgramCode: selectedOptions.selectedProgramCode as Code,
        selectedModuleCodes: selectedOptions.selectedModuleCodes,
        defaultSettings: {
            dataSet: selectedOptions.defaultSettings.dataSet as Code,
            startDate: selectedOptions.defaultSettings.startDate as string,
            endDate: selectedOptions.defaultSettings.endDate as string,
            orgUnits: selectedOptions.defaultSettings.orgUnits,
            usePreviousYear: selectedOptions.defaultSettings.usePreviousYear,
        },
    });
}
