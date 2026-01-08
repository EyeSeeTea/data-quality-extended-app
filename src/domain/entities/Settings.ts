import { Maybe } from "$/utils/ts-utils";
import { Either } from "./generic/Either";
import { ValidationError } from "./generic/Errors";
import { Struct } from "./generic/Struct";
import { validateRequired } from "./generic/validations";
import { Module } from "./Module";
import { Id } from "./Ref";

export interface SettingsAttrs {
    endDate: string;
    module: Module;
    startDate: string;
    countryIds: Id[];
    sections: SectionSetting[];
}

export type SectionSetting = {
    id: Id;
    disaggregations: SectionDisaggregation[];
};

export type SectionDisaggregation = {
    id: Id;
    disaggregationId: Id;
    name: string;
    type: "combos" | "key_occupations" | "edu_occupations";
    combinations: string[];
    nursingMidwifery: Maybe<string[][]>;
};

export class Settings extends Struct<SettingsAttrs>() {
    static build(attrs: SettingsAttrs): Either<ValidationError<Settings>[], Settings> {
        const settings = new Settings(attrs);

        const errors: ValidationError<Settings>[] = [
            {
                property: "endDate" as const,
                errors: validateRequired(settings.endDate),
                value: settings.endDate,
            },
            {
                property: "module" as const,
                errors: validateRequired(settings.module.id),
                value: settings.module.id,
            },
            {
                property: "startDate" as const,
                errors: validateRequired(settings.startDate),
                value: settings.startDate,
            },
        ].filter(validation => validation.errors.length > 0);

        if (errors.length === 0) {
            return Either.success(settings);
        } else {
            return Either.error(errors);
        }
    }
}
