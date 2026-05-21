import { D2Api } from "@eyeseetea/d2-api/2.42";
import { CancelableResponse, getMockApiFromClass } from "@eyeseetea/d2-api";
import type {
    D2TrackerTrackedEntity,
    D2TrackerTrackedEntitySchema,
    TrackedEntitiesGetResponse as TrackedEntitiesGetResponseBase,
} from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import type { D2TrackerEnrollment } from "@eyeseetea/d2-api/api/trackerEnrollments";
import type {
    D2TrackerEvent,
    D2TrackerEventSchema,
    DataValue,
    TrackerEventsResponse as TrackerEventsResponseBase,
} from "@eyeseetea/d2-api/api/trackerEvents";
import type { Selector } from "@eyeseetea/d2-api/api/base";

export { CancelableResponse, D2Api };
export type { MetadataPick, D2CategoryCombo } from "@eyeseetea/d2-api/2.42";
export type { D2TrackerTrackedEntity, D2TrackerEnrollment, D2TrackerEvent, DataValue };

export type D2TrackerTrackedEntityFields = Selector<D2TrackerTrackedEntitySchema>;
export type D2TrackerEventFields = Selector<D2TrackerEventSchema>;

export type TrackedEntitiesGetResponse<Fields extends D2TrackerTrackedEntityFields> =
    TrackedEntitiesGetResponseBase<Fields>;

export type TrackerEventsResponse<Fields extends D2TrackerEventFields> =
    TrackerEventsResponseBase<Fields>;

export const getMockApi = getMockApiFromClass(D2Api);
