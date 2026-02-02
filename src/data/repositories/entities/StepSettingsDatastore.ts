import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";
import { StepType } from "$/domain/entities/StepSettings";

export type StepSettingsDatastore = {
    type: StepType;
    programStageId: string;
    order: number;
    disaggregations?: SectionDisaggregation[];
};
