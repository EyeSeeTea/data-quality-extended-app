import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";

export type StepSettingsDatastore = {
    type: string;
    programStageId: string;
    order: number;
    disaggregations?: SectionDisaggregation[];
};
