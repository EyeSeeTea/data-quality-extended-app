import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";
import { StepSettings, StepType } from "$/domain/entities/StepSettings";

export type StepSettingsDatastore = {
    type: StepType;
    programStageId: string;
    order: number;
    disaggregations?: SectionDisaggregation[];
    name: string;
};

export function mapStepsDatastoreToStepSettings(steps: StepSettingsDatastore[]): StepSettings[] {
    return steps.map(step => ({
        type: step.type,
        sectionId: step.programStageId,
        order: step.order,
        disaggregations: step.disaggregations || [],
        name: step.name,
    }));
}

export function mapStepSettingsToDatastore(steps: StepSettings[]): StepSettingsDatastore[] {
    return steps.map(step => ({
        type: step.type,
        programStageId: step.sectionId,
        order: step.order,
        disaggregations: step.disaggregations,
        name: step.name,
    }));
}
