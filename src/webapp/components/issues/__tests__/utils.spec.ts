import { describe, expect, it } from "vitest";
import { parseQualityAnalysisId } from "$/webapp/components/issues/utils";

describe("parseQualityAnalysisId", () => {
    it("should return the event id and the issue number of a table row id", () => {
        expect(parseQualityAnalysisId("usewIlyVotG:DQ-000003-S03-I01")).toEqual({
            issueId: "usewIlyVotG",
            issueNumber: "DQ-000003-S03-I01",
        });
    });

    it("should throw when the row id has no issue number", () => {
        expect(() => parseQualityAnalysisId("usewIlyVotG")).toThrow();
    });
});
