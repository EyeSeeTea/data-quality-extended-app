import { describe, expect, it } from "vitest";
import { getTrackerPagination } from "$/data/common/utils";

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
