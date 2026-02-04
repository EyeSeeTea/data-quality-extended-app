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

export type StepSettings = {
    type: StepType;
    sectionId: Id;
    order: number;
    disaggregations?: SectionDisaggregation[];
    name: string;
};

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
