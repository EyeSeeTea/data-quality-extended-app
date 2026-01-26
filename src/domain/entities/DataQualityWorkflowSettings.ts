import { Either } from "$/domain/entities/generic/Either";
import { Struct } from "$/domain/entities/generic/Struct";
import { ValidationError } from "$/domain/entities/generic/Errors";
import { StepSettings, StepTypes } from "./StepSettings";
import {
    validateAtLeastOneDisaggregation,
    validateAtLeastOneStep,
    validateNoDuplicateStepTypes,
    validateOneOf,
    validateRequired,
} from "$/domain/entities/generic/validations";

export interface DataQualityWorkflowSettingsAttrs {
    steps: StepSettings[];
}

export class DataQualityWorkflowSettings extends Struct<DataQualityWorkflowSettingsAttrs>() {
    static build(
        attrs: DataQualityWorkflowSettingsAttrs
    ): Either<ValidationError<DataQualityWorkflowSettings>[], DataQualityWorkflowSettings> {
        const entity = new DataQualityWorkflowSettings(attrs);

        const stepTypes = entity.steps.map(step => step.type);

        const stepFieldsErrors: ValidationError<DataQualityWorkflowSettings>[] =
            entity.steps.flatMap(step => {
                const requiresDisaggregations =
                    step.type === "DISAGGREGATES" || step.type === "MISSING_NURSES";

                const disaggErrors = requiresDisaggregations
                    ? [
                          {
                              property: "steps" as const,
                              errors: validateRequired(step.disaggregations),
                              value: step.disaggregations,
                          },
                          {
                              property: "steps" as const,
                              errors: validateAtLeastOneDisaggregation(step.disaggregations),
                              value: step.disaggregations?.length ?? 0,
                          },
                      ]
                    : [];

                return [
                    {
                        property: "steps" as const,
                        errors: [
                            ...validateRequired(step.type),
                            ...validateOneOf(step.type, StepTypes),
                        ],
                        value: step.type,
                    },
                    {
                        property: "steps" as const,
                        errors: validateRequired(step.sectionId),
                        value: step.sectionId,
                    },
                    ...disaggErrors,
                ].filter(v => v.errors.length > 0);
            });

        const errors: ValidationError<DataQualityWorkflowSettings>[] = [
            {
                property: "steps" as const,
                errors: validateAtLeastOneStep(entity.steps),
                value: entity.steps.length,
            },
            {
                property: "steps" as const,
                errors: validateNoDuplicateStepTypes(stepTypes),
                value: stepTypes,
            },
            ...stepFieldsErrors,
        ].filter(v => v.errors.length > 0);

        return errors.length === 0 ? Either.success(entity) : Either.error(errors);
    }
}
