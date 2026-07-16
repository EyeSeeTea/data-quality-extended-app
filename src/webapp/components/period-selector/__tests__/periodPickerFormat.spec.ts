import { describe, expect, it } from "vitest";
import { getPeriodPickerFormat } from "$/webapp/components/period-selector/periodPickerFormat";

describe("getPeriodPickerFormat", () => {
    it("returns a year picker for Yearly", () => {
        expect(getPeriodPickerFormat("Yearly")).toEqual({
            unit: "year",
            views: ["year"],
            format: "YYYY",
        });
    });

    it("returns a month+year picker for Monthly", () => {
        expect(getPeriodPickerFormat("Monthly")).toEqual({
            unit: "month",
            views: ["year", "month"],
            format: "MMMM YYYY",
        });
    });

    it("returns a free date picker for a known non-yearly/monthly type (Quarterly)", () => {
        expect(getPeriodPickerFormat("Quarterly")).toEqual({
            unit: "date",
            views: ["year", "month", "date"],
            format: "YYYY-MM-DD",
        });
    });

    it("falls through to the free date picker for an unrecognized/future type", () => {
        expect(getPeriodPickerFormat("SomeFuturePeriodType")).toEqual({
            unit: "date",
            views: ["year", "month", "date"],
            format: "YYYY-MM-DD",
        });
    });
});
