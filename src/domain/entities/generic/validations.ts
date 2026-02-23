import { StepType } from "$/domain/entities/StepSettings";
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

export function validateMustBeANumber(value: unknown): ValidationErrorKey[] {
    return Number.isFinite(value) ? [] : ["must_be_a_number"];
}

export function validateAtLeastOneStep(items: unknown[]): ValidationErrorKey[] {
    return items.length >= 1 ? [] : ["at_least_one_step_required"];
}

export function validateNoDuplicateStepTypes(stepTypes: StepType[]): ValidationErrorKey[] {
    const uniqueTypesCount = new Set(stepTypes).size;
    return uniqueTypesCount === stepTypes.length ? [] : ["duplicate_step_types"];
}

export function validateOneOf<T extends readonly string[]>(
    value: any,
    allowed: T
): ValidationErrorKey[] {
    return allowed.includes(value) ? [] : ["invalid_value"];
}

export function validateAtLeastOneDisaggregation(
    disaggregations?: unknown[]
): ValidationErrorKey[] {
    const count = disaggregations?.length ?? 0;
    return count > 0 ? [] : ["at_least_one_disaggregation_required"];
}
