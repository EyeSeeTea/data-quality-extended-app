import { D2Api } from "@eyeseetea/d2-api/2.41";
import type { D2TrackerEventToPost } from "@eyeseetea/d2-api/api/trackerEvents";

export { CancelableResponse } from "@eyeseetea/d2-api";
export { D2Api } from "@eyeseetea/d2-api/2.41";
export type { MetadataPick } from "@eyeseetea/d2-api/2.41";

/* The mock adapter is axios-only, and d2-api defaults to the fetch backend. */
export function getMockApi() {
    const api = new D2Api({ backend: "xhr" });
    return { api, mock: api.getMockAdapter() };
}
export type {
    D2TrackerTrackedEntity,
    TrackedEntitiesGetResponse,
    TrackedOrderBase,
} from "@eyeseetea/d2-api/api/trackerTrackedEntities";
export type { D2TrackerEnrollment } from "@eyeseetea/d2-api/api/trackerEnrollments";
export type {
    D2TrackerEvent,
    D2TrackerEventToPost,
    DataValue,
} from "@eyeseetea/d2-api/api/trackerEvents";

type TrackerPostPayload = NonNullable<Parameters<D2Api["tracker"]["post"]>[1]>;
export type TrackedEntityToPost = NonNullable<TrackerPostPayload["trackedEntities"]>[number];

// New data values only need the data element and the value: the server fills the audit fields
export type DataValueToPost = D2TrackerEventToPost["dataValues"][number];
