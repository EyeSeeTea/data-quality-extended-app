import { Either } from "$/domain/entities/generic/Either";
import { ValidationError } from "$/domain/entities/generic/Errors";
import { Struct } from "$/domain/entities/generic/Struct";
import { validateDateRange, validateRequired } from "$/domain/entities/generic/validations";
import { Code, Id } from "$/domain/entities/Ref";
interface DataQualityIssuesProgramConfigAttrs {
    selectedProgramCode: Code;
    selectedModuleCodes: Code[];
    defaultSettings: {
        dataSet: Code;
        startDate: string;
        endDate: string;
        orgUnits: Id[];
    };
}

export class DataQualityIssuesProgramConfig extends Struct<DataQualityIssuesProgramConfigAttrs>() {
    static build(
        attrs: DataQualityIssuesProgramConfigAttrs
    ): Either<ValidationError<DataQualityIssuesProgramConfig>[], DataQualityIssuesProgramConfig> {
        const config = new DataQualityIssuesProgramConfig(attrs);
        const ds = config.defaultSettings;

        const errors: ValidationError<DataQualityIssuesProgramConfig>[] = [
            {
                property: "selectedProgramCode" as const,
                errors: validateRequired(config.selectedProgramCode),
                value: config.selectedProgramCode,
                fieldName: "selected program",
            },
            {
                property: "selectedModuleCodes" as const,
                errors: validateRequired(config.selectedModuleCodes),
                value: config.selectedModuleCodes,
                fieldName: "selected modules",
            },
            {
                property: "defaultSettings" as const,
                errors: validateRequired(ds?.dataSet, "field_cannot_be_blank"),
                value: "dataSet",
                fieldName: "default module",
            },
            {
                property: "defaultSettings" as const,
                errors: validateRequired(ds?.startDate, "field_cannot_be_blank"),
                value: "startDate",
                fieldName: "default start date",
            },
            {
                property: "defaultSettings" as const,
                errors: validateRequired(ds?.endDate, "field_cannot_be_blank"),
                value: "endDate",
                fieldName: "default end date",
            },
            {
                property: "defaultSettings" as const,
                errors: validateDateRange(ds?.startDate, ds?.endDate),
                value: { startDate: ds?.startDate, endDate: ds?.endDate },
            },
        ].filter(validation => validation.errors.length > 0);

        return errors.length === 0 ? Either.success(config) : Either.error(errors);
    }
}
