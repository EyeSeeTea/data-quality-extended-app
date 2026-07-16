import { describe, expect, it } from "vitest";
import { readUsePreviousPeriod } from "$/data/common/DefaultConfigDatastore";

describe("readUsePreviousPeriod (deprecated key retro-compatibility)", () => {
    it("honors the legacy usePreviousYear key when present", () => {
        expect(readUsePreviousPeriod({ usePreviousYear: true })).toBe(true);
    });

    it("prioritizes usePreviousYear over usePreviousPeriod when both are present", () => {
        expect(readUsePreviousPeriod({ usePreviousYear: true, usePreviousPeriod: false })).toBe(
            true
        );
    });

    it("falls back to usePreviousPeriod when the legacy key is absent", () => {
        expect(readUsePreviousPeriod({ usePreviousPeriod: true })).toBe(true);
    });

    it("defaults to false when neither key is present", () => {
        expect(readUsePreviousPeriod({})).toBe(false);
    });
});
