import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Id } from "$/domain/entities/Ref";
import {
    D2TrackerEventFields,
    D2TrackerTrackedEntityFields,
    TrackedEntitiesGetResponse,
    TrackerEventsResponse,
} from "$/types/d2-api";

export function getProgramStageIndexById(programStageId: Id, metadata: MetadataItem): number {
    const programStageIndex = metadata.programs.qualityIssues.programStages.findIndex(
        programStage => programStage.id === programStageId
    );
    if (programStageIndex === -1) throw Error(`Cannot found programStage: ${programStageId}`);
    return programStageIndex;
}

export function buildTrackerResponse<Fields extends D2TrackerTrackedEntityFields>(
    response: TrackedEntitiesGetResponse<Fields> & {
        trackedEntities?: TrackedEntitiesGetResponse<Fields>["instances"];
    }
): TrackedEntitiesGetResponse<Fields> {
    if (!response.instances && response.trackedEntities) {
        return { ...response, instances: response.trackedEntities };
    } else if (!response.trackedEntities && response.instances) {
        return response;
    } else {
        return response;
    }
}

export function buildTrackerEventsResponse<Fields extends D2TrackerEventFields>(
    response: TrackerEventsResponse<Fields> & {
        events?: TrackerEventsResponse<Fields>["instances"];
    }
): TrackerEventsResponse<Fields> {
    if (!response.instances && response.events) {
        return { ...response, instances: response.events };
    } else if (!response.events && response.instances) {
        return response;
    } else {
        return response;
    }
}
