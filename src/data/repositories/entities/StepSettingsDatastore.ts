import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";
import {
    isStepTypeWithDisagg,
    isStepWithDisagg,
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
};

export type StepSettingsDatastore =
    | StepSettingsDatastoreWithDisagg
    | StepSettingsDatastoreWithoutDisagg;

function isDatastoreStepWithDisagg(
    step: StepSettingsDatastore
): step is StepSettingsDatastoreWithDisagg {
    return isStepTypeWithDisagg(step.type);
}

export function mapStepsDatastoreToStepSettings(steps: StepSettingsDatastore[]): StepSettings[] {
    return steps.map(step => {
        if (isDatastoreStepWithDisagg(step)) {
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
    return steps.map((step: StepSettings) => {
        if (isStepWithDisagg(step)) {
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
