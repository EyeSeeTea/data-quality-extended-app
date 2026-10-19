import { describe, expect, it } from "vitest";
import {
    getEventsFilter,
    getTrackedEntitiesFilter,
    getTrackerPagination,
} from "$/data/common/utils";

describe("tracker id filters", () => {
    it("should join the ids with commas, the only separator DHIS2 2.41+ accepts", () => {
        expect(getTrackedEntitiesFilter(["tei1", "tei2"])).toEqual({
            trackedEntities: "tei1,tei2",
        });
        expect(getEventsFilter(["event1", "event2"])).toEqual({ events: "event1,event2" });
    });

    it("should not filter when there are no ids", () => {
        expect(getTrackedEntitiesFilter(undefined)).toEqual({});
        expect(getTrackedEntitiesFilter([])).toEqual({});
        expect(getEventsFilter(undefined)).toEqual({});
    });
});

const pagination = { page: 2, pageSize: 25, total: 60, pageCount: 3 };

describe("getTrackerPagination", () => {
    it("should read the pagination from the root of the response (DHIS2 2.40)", () => {
        expect(getTrackerPagination({ ...pagination })).toEqual(pagination);
    });

    it("should read the pagination from pager when it is only there (DHIS2 2.42+)", () => {
        expect(getTrackerPagination({ pager: pagination })).toEqual(pagination);
    });

    it("should prefer pager when the response has both (DHIS2 2.41)", () => {
        const deprecatedRoot = { page: 1, pageSize: 50, total: 0, pageCount: 0 };

        expect(getTrackerPagination({ ...deprecatedRoot, pager: pagination })).toEqual(pagination);
    });

    it("should return an empty last page when the response has no pagination", () => {
        expect(getTrackerPagination({})).toEqual({ page: 1, pageSize: 0, total: 0, pageCount: 0 });
    });
});
