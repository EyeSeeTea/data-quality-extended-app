import { describe, expect, it } from "vitest";
import { isKnownPeriodType } from "$/domain/entities/PeriodType";

describe("PeriodType", () => {
    describe("isKnownPeriodType", () => {
        it("recognizes a known type", () => {
            expect(isKnownPeriodType("Monthly")).toBe(true);
        });

        it("rejects an unknown type", () => {
            expect(isKnownPeriodType("SomeFuturePeriodType")).toBe(false);
        });
    });
});
