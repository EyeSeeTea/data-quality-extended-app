import { ValidationErrorKey } from "./Errors";

export function validateRequired(
    value: any,
    errorCode: ValidationErrorKey = "field_cannot_be_blank"
): ValidationErrorKey[] {
    const isBlank = !value || (value.length !== undefined && value.length === 0);

    return isBlank ? setErrorCode(errorCode) : [];
}

export function validateMustBeEmpty(value: any): ValidationErrorKey[] {
    const isBlank = !value || (value.length !== undefined && value.length === 0);

    return isBlank ? [] : ["must_be_empty"];
}

export function validateDateRange(startDate?: string, endDate?: string): ValidationErrorKey[] {
    if (!startDate || !endDate) return [];
    return startDate > endDate ? ["date_range_invalid"] : [];
}

function setErrorCode(errorCode?: ValidationErrorKey): ValidationErrorKey[] {
    return errorCode ? [errorCode] : ["field_cannot_be_blank"];
}
