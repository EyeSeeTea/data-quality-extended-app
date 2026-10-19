import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Pagination } from "$/domain/entities/Pagination";
import { Id } from "$/domain/entities/Ref";
import { Maybe } from "$/utils/ts-utils";
import { TrackedEntitiesGetResponse } from "$/types/d2-api";
import { TrackerEventsResponse } from "@eyeseetea/d2-api/api/trackerEvents";

export function getProgramStageIndexById(programStageId: Id, metadata: MetadataItem): number {
    const programStageIndex = metadata.programs.qualityIssues.programStages.findIndex(
        programStage => programStage.id === programStageId
    );
    if (programStageIndex === -1) throw Error(`Cannot found programStage: ${programStageId}`);
    return programStageIndex;
}

// d2-api types don't declare the plural filters that replace the deprecated "trackedEntity" and
// "event" params, which DHIS2 2.42+ silently ignores. They are spread into the request params.
export function getTrackedEntitiesFilter(ids: Maybe<Id[]>): { trackedEntities?: string } {
    return ids && ids.length > 0 ? { trackedEntities: ids.join(",") } : {};
}

export function getEventsFilter(ids: Maybe<Id[]>): { events?: string } {
    return ids && ids.length > 0 ? { events: ids.join(",") } : {};
}

type D2TrackerPager = Partial<Pagination>;

// DHIS2 2.40 returns the pagination at the root of tracker responses, 2.41 at the root
// and in "pager", and 2.42+ only in "pager"
export function getTrackerPagination(
    response: D2TrackerPager & { pager?: D2TrackerPager }
): Pagination {
    const pager = response.pager ?? response;

    return {
        page: pager.page ?? 1,
        pageSize: pager.pageSize ?? 0,
        total: pager.total ?? 0,
        pageCount: pager.pageCount ?? 0,
    };
}

export function buildTrackerResponse(
    response: TrackedEntitiesGetResponse & {
        trackedEntities?: TrackedEntitiesGetResponse["instances"];
    }
): TrackedEntitiesGetResponse {
    if (!response.instances && response.trackedEntities) {
        return { ...response, instances: response.trackedEntities };
    } else if (!response.trackedEntities && response.instances) {
        return response;
    } else {
        return response;
    }
}

export function buildTrackerEventsResponse(
    response: TrackerEventsResponse & {
        events?: TrackerEventsResponse["instances"];
    }
): TrackerEventsResponse {
    if (!response.instances && response.events) {
        return { ...response, instances: response.events };
    } else if (!response.events && response.instances) {
        return response;
    } else {
        return response;
    }
}
