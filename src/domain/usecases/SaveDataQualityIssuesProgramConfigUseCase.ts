import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";
import { Either } from "$/domain/entities/generic/Either";
import { getErrors, ValidationError } from "$/domain/entities/generic/Errors";
import { Future } from "$/domain/entities/generic/Future";
import { Code, Id } from "$/domain/entities/Ref";
import { StepSettings } from "$/domain/entities/StepSettings";
import { DataQualityIssuesProgramConfigRepository } from "$/domain/repositories/DataQualityIssuesProgramConfigRepository";
import { Maybe } from "$/utils/ts-utils";

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
                return this.dataQualityIssuesProgramConfigRepository.save(configuration, {
                    isEdit: configurationOptions.isEdit,
                });
            },
        });
    }
}

export type DataQualityIssuesProgramConfigOptions = {
    selectedProgramCode: Maybe<Code>;
    selectedModuleCodes: Code[];
    selectedModulePeriodTypes: string[];
    defaultSettings: {
        dataSet: Maybe<Code>;
        endDate: Maybe<string>;
        startDate: Maybe<string>;
        usePreviousPeriod: boolean;
        orgUnits: Id[];
        orgUnitPaths: string[];
    };
    steps: StepSettings[];
    isEdit: boolean;
};

export const initialState: DataQualityIssuesProgramConfigOptions = {
    selectedProgramCode: undefined,
    selectedModuleCodes: [],
    selectedModulePeriodTypes: [],
    defaultSettings: {
        dataSet: undefined,
        endDate: undefined,
        startDate: undefined,
        usePreviousPeriod: false,
        orgUnits: [],
        orgUnitPaths: [],
    },
    steps: [],
    isEdit: false,
};

function mapToDataQualityIssuesProgramConfig(
    selectedOptions: DataQualityIssuesProgramConfigOptions
): Either<ValidationError<DataQualityIssuesProgramConfig>[], DataQualityIssuesProgramConfig> {
    return DataQualityIssuesProgramConfig.build({
        selectedProgramCode: selectedOptions.selectedProgramCode as Code,
        selectedModuleCodes: selectedOptions.selectedModuleCodes,
        selectedModulePeriodTypes: selectedOptions.selectedModulePeriodTypes,
        defaultSettings: {
            dataSet: selectedOptions.defaultSettings.dataSet as Code,
            startDate: selectedOptions.defaultSettings.startDate as string,
            endDate: selectedOptions.defaultSettings.endDate as string,
            orgUnits: selectedOptions.defaultSettings.orgUnits,
            usePreviousPeriod: selectedOptions.defaultSettings.usePreviousPeriod,
        },
        steps: selectedOptions.steps,
    });
}
