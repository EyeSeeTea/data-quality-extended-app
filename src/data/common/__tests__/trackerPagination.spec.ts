import { getNextTrackerPage } from "$/data/common/utils";

// DHIS2 2.40 and 2.41 return the pagination at the root of the tracker response, 2.42+ only in "pager"
const rootOnly = { page: 1, pageSize: 150, total: 320, pageCount: 3 };
const pagerOnly = { pager: { page: 1, pageSize: 150, total: 320, pageCount: 3 } };
// Root and pager disagree: pager must win, so a swapped precedence changes the result
const bothDifferent = { ...rootOnly, pageCount: 1, pager: { ...pagerOnly.pager, pageCount: 3 } };

describe("getNextTrackerPage", () => {
    it.each([
        ["the root (DHIS2 2.40)", rootOnly],
        ["pager (DHIS2 2.42+)", pagerOnly],
    ])("requests the following page while there are more, reading %s", (_name, response) => {
        expect(getNextTrackerPage(response, 1)).toEqual(2);
        expect(getNextTrackerPage(response, 2)).toEqual(3);
    });

    it("gives precedence to pager when the root and pager values differ", () => {
        expect(getNextTrackerPage(bothDifferent, 1)).toEqual(2);
        expect(getNextTrackerPage(bothDifferent, 3)).toBeUndefined();
    });

    it("stops after the last page", () => {
        expect(getNextTrackerPage(pagerOnly, 3)).toBeUndefined();
    });

    it("stops when the response has no pagination instead of repeating a page", () => {
        expect(getNextTrackerPage({}, 1)).toBeUndefined();
    });
});
