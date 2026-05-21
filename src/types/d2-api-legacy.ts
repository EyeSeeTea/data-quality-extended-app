/**
 * Re-exports from the legacy d2-api package (1.21.0 / DHIS2 ≤ 2.41).
 *
 * Response shapes differ from the 42.x package:
 *   - Tracked-entity response uses `.instances[]` (not `.trackedEntities[]`)
 *   - Event response uses `.instances[]` (not `.events[]`)
 *   - Pagination fields are at the top level (pageSize, page, pageCount, total)
 *     plus an optional `pager` object, instead of a required nested `pager`.
 *   - Query params use `ouMode` / `orgUnit` (not `orgUnitMode` / `orgUnits`).
 */
import { D2Api as D2ApiLegacyImpl } from "@eyeseetea/d2-api-legacy/2.41";
import { CancelableResponse } from "@eyeseetea/d2-api-legacy";
import type { Selector } from "@eyeseetea/d2-api-legacy/api/base";
import type {
    D2TrackerTrackedEntity,
    D2TrackerTrackedEntitySchema,
    TrackedEntitiesGetResponse as TrackedEntitiesGetResponseLegacyBase,
} from "@eyeseetea/d2-api-legacy/api/trackerTrackedEntities";
import type { D2TrackerEnrollment } from "@eyeseetea/d2-api-legacy/api/trackerEnrollments";
import type {
    D2TrackerEvent,
    D2TrackerEventSchema,
    DataValue,
    TrackerEventsResponse as TrackerEventsResponseLegacyBase,
} from "@eyeseetea/d2-api-legacy/api/trackerEvents";

export type D2ApiLegacy = D2ApiLegacyImpl;
export { D2ApiLegacyImpl, CancelableResponse };
export type { MetadataPick, D2CategoryCombo } from "@eyeseetea/d2-api-legacy/2.41";
export type { D2TrackerTrackedEntity, D2TrackerEnrollment, D2TrackerEvent, DataValue };

export type D2TrackerTrackedEntityFieldsLegacy = Selector<D2TrackerTrackedEntitySchema>;
export type D2TrackerEventFieldsLegacy = Selector<D2TrackerEventSchema>;

export type TrackedEntitiesGetResponseLegacy<Fields extends D2TrackerTrackedEntityFieldsLegacy> =
    TrackedEntitiesGetResponseLegacyBase<Fields>;

export type TrackerEventsResponseLegacy<Fields extends D2TrackerEventFieldsLegacy> =
    TrackerEventsResponseLegacyBase<Fields>;
