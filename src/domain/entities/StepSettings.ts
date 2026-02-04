import { Id } from "$/domain/entities/Ref";
import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";
import { UnionFromValues } from "$/utils/ts-utils";

export const StepTypes = [
    "OUTLIERS",
    "DISAGGREGATES",
    "DOUBLE_COUNTS_AND_MISSING_GP",
    "MISSING_NURSES",
    "VALIDATION",
    "MANUAL_ISSUES",
] as const;

export type StepType = UnionFromValues<typeof StepTypes>;
export type StepTypeWithDisagg = "DISAGGREGATES" | "MISSING_NURSES";
export type StepTypeWithoutDisagg = Exclude<StepType, StepTypeWithDisagg>;

type StepSettingsBase = {
    sectionId: Id;
    order: number;
    name: string;
};

type StepSettingsWithDisaggregations = StepSettingsBase & {
    type: StepTypeWithDisagg;
    disaggregations: SectionDisaggregation[];
};

type StepSettingsWithoutDisaggregations = StepSettingsBase & {
    type: StepTypeWithoutDisagg;
    disaggregations?: never;
};

export function isStepTypeWithDisagg(type: StepType): type is StepTypeWithDisagg {
    return type === "DISAGGREGATES" || type === "MISSING_NURSES";
}

export type StepSettings = StepSettingsWithDisaggregations | StepSettingsWithoutDisaggregations;

const normalizeSectionNameToKey = (name: string) => name.trim().toUpperCase().replace(/\s+/g, "_");

const NAME_TO_STEP_TYPE: Record<string, StepType> = {
    OUTLIERS: "OUTLIERS",
    DISAGGREGATES: "DISAGGREGATES",
    DOUBLE_COUNTS_AND_MISSING_GP: "DOUBLE_COUNTS_AND_MISSING_GP",
    MISSING_NURSES: "MISSING_NURSES",
    VALIDATION: "VALIDATION",
    MANUAL_ISSUES: "MANUAL_ISSUES",
};

export function resolveStepTypeFromSectionName(name: string): StepType | undefined {
    const key = normalizeSectionNameToKey(name);
    return NAME_TO_STEP_TYPE[key];
}
