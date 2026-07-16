import i18n from "$/utils/i18n";

export type ValidationErrorKey =
    | "field_cannot_be_blank"
    | "country_validation"
    | "date_range_invalid"
    | "must_be_empty"
    | "must_be_a_number"
    | "at_least_one_step_required"
    | "duplicate_step_types"
    | "invalid_value"
    | "at_least_one_disaggregation_required"
    | "mixed_period_type";

export const validationErrorMessages: Record<ValidationErrorKey, (fieldName: string) => string> = {
    country_validation: () => i18n.t("Select at least one organisation unit"),
    field_cannot_be_blank: (fieldName: string) =>
        i18n.t(`Cannot be blank: {{fieldName}}`, { fieldName: fieldName, nsSeparator: false }),
    date_range_invalid: () => i18n.t("Start date must be before end date"),
    must_be_empty: (fieldName: string) =>
        i18n.t(`Must be empty: {{fieldName}}`, { fieldName: fieldName, nsSeparator: false }),
    must_be_a_number: (fieldName: string) =>
        i18n.t(`Must be a number: {{fieldName}}`, { fieldName: fieldName, nsSeparator: false }),
    at_least_one_step_required: () => i18n.t("At least one step is required"),
    duplicate_step_types: () => i18n.t("Duplicate step types are not allowed"),
    invalid_value: (fieldName: string) =>
        i18n.t(`Invalid value: {{fieldName}}`, { fieldName: fieldName, nsSeparator: false }),
    at_least_one_disaggregation_required: () => i18n.t("At least one disaggregation is required"),
    mixed_period_type: () =>
        i18n.t("All selected datasets must share the same periodicity (period type)"),
};

export function getErrors<T>(errors: ValidationError<T>[]) {
    return errors
        .map(error => {
            return error.errors.map(err =>
                validationErrorMessages[err](
                    error.fieldName ? error.fieldName : (error.property as string)
                )
            );
        })
        .flat()
        .join("\n");
}

export type ValidationError<T> = {
    property: keyof T;
    value: unknown;
    errors: ValidationErrorKey[];
    fieldName?: string;
};
