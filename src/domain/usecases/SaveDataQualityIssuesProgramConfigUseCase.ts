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
    const { defaultSettings } = selectedOptions;
    // Coalesce the optional wizard values to empty strings so the entity's
    // `validateRequired` reports them as missing, instead of forcing the types with `as`.
    return DataQualityIssuesProgramConfig.build({
        selectedProgramCode: selectedOptions.selectedProgramCode ?? "",
        selectedModuleCodes: selectedOptions.selectedModuleCodes,
        selectedModulePeriodTypes: selectedOptions.selectedModulePeriodTypes,
        defaultSettings: {
            dataSet: defaultSettings.dataSet ?? "",
            startDate: defaultSettings.startDate ?? "",
            endDate: defaultSettings.endDate ?? "",
            orgUnits: defaultSettings.orgUnits,
            usePreviousPeriod: defaultSettings.usePreviousPeriod,
        },
        steps: selectedOptions.steps,
    });
}
