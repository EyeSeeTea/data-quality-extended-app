import { Id } from "$/domain/entities/Ref";
import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";

export const StepTypes = [
    "OUTLIERS",
    "DISAGGREGATES",
    "DOUBLE_COUNTS_MISSING_GP",
    "MISSING_NURSES",
    "VALIDATION",
    "MANUAL_ISSUES",
] as const;

export type StepType = (typeof StepTypes)[number];

export type StepSettings = {
    type: StepType;
    sectionId: Id;
    order: number;
    disaggregations?: SectionDisaggregation[];
};
