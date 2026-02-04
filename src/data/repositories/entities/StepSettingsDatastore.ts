import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";
import {
    isStepTypeWithDisagg,
    StepSettings,
    StepTypeWithDisagg,
    StepTypeWithoutDisagg,
} from "$/domain/entities/StepSettings";

type StepSettingsDatastoreBase = {
    programStageId: string;
    order: number;
    name: string;
};

type StepSettingsDatastoreWithDisagg = StepSettingsDatastoreBase & {
    type: StepTypeWithDisagg;
    disaggregations: SectionDisaggregation[];
};

type StepSettingsDatastoreWithoutDisagg = StepSettingsDatastoreBase & {
    type: StepTypeWithoutDisagg;
    disaggregations?: never;
};

export type StepSettingsDatastore =
    | StepSettingsDatastoreWithDisagg
    | StepSettingsDatastoreWithoutDisagg;

export function mapStepsDatastoreToStepSettings(steps: StepSettingsDatastore[]): StepSettings[] {
    return steps.map(step => {
        if (isStepTypeWithDisagg(step.type)) {
            return {
                type: step.type,
                sectionId: step.programStageId,
                order: step.order,
                name: step.name,
                disaggregations: step.disaggregations ?? [],
            };
        }

        return {
            type: step.type,
            sectionId: step.programStageId,
            order: step.order,
            name: step.name,
        };
    });
}

export function mapStepSettingsToDatastore(steps: StepSettings[]): StepSettingsDatastore[] {
    return steps.map(step => {
        if (isStepTypeWithDisagg(step.type)) {
            return {
                type: step.type,
                programStageId: step.sectionId,
                order: step.order,
                name: step.name,
                disaggregations: step.disaggregations ?? [],
            };
        }

        return {
            type: step.type,
            programStageId: step.sectionId,
            order: step.order,
            name: step.name,
        };
    });
}
