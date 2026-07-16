import { Either } from "./generic/Either";
import { ValidationError } from "./generic/Errors";
import { Struct } from "./generic/Struct";
import { validateDateRange, validateRequired } from "./generic/validations";
import { ModuleBase } from "./Module";
import { Id } from "./Ref";

export interface SettingsAttrs {
    endDate: string;
    module: ModuleBase;
    startDate: string;
    countryIds: Id[];
    usePreviousPeriod: boolean;
}

export class Settings extends Struct<SettingsAttrs>() {
    static build(attrs: SettingsAttrs): Either<ValidationError<Settings>[], Settings> {
        const settings = new Settings(attrs);

        const errors: ValidationError<Settings>[] = [
            {
                property: "module" as const,
                errors: validateRequired(settings.module.id),
                value: settings.module.id,
            },
            ...(settings.usePreviousPeriod
                ? []
                : [
                      {
                          property: "startDate" as const,
                          errors: validateRequired(settings.startDate),
                          value: settings.startDate,
                      },
                      {
                          property: "endDate" as const,
                          errors: validateRequired(settings.endDate),
                          value: settings.endDate,
                      },
                      {
                          property: "startDate" as const,
                          errors: validateDateRange(settings.startDate, settings.endDate),
                          value: { startDate: settings.startDate, endDate: settings.endDate },
                      },
                  ]),
        ].filter(validation => validation.errors.length > 0);

        if (errors.length === 0) {
            return Either.success(settings);
        } else {
            return Either.error(errors);
        }
    }
}
