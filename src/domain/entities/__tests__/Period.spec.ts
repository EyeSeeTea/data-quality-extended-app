import { describe, expect, it } from "vitest";
import { getPeriodsForRange, getPreviousPeriod, getPeriodLabel } from "$/domain/entities/Period";

describe("Period", () => {
    describe("getPeriodsForRange", () => {
        const cases: Array<{
            name: string;
            periodType: string;
            start: string;
            end: string;
            expected: string[];
        }> = [
            {
                name: "Monthly",
                periodType: "Monthly",
                start: "2024-01-01",
                end: "2024-04-30",
                expected: ["202401", "202402", "202403", "202404"],
            },
            {
                name: "Yearly",
                periodType: "Yearly",
                start: "2020-01-01",
                end: "2024-12-31",
                expected: ["2020", "2021", "2022", "2023", "2024"],
            },
            {
                name: "Quarterly",
                periodType: "Quarterly",
                start: "2024-01-01",
                end: "2024-12-31",
                expected: ["2024Q1", "2024Q2", "2024Q3", "2024Q4"],
            },
            {
                name: "Weekly",
                periodType: "Weekly",
                start: "2024-01-01",
                end: "2024-01-14",
                expected: ["2024W1", "2024W2"],
            },
            {
                name: "SixMonthly",
                periodType: "SixMonthly",
                start: "2024-01-01",
                end: "2024-12-31",
                expected: ["2024S1", "2024S2"],
            },
            {
                name: "BiMonthly",
                periodType: "BiMonthly",
                start: "2024-01-01",
                end: "2024-12-31",
                expected: ["202401B", "202402B", "202403B", "202404B", "202405B", "202406B"],
            },
            {
                name: "BiWeekly",
                periodType: "BiWeekly",
                start: "2024-01-01",
                end: "2024-01-28",
                expected: ["2024BiW1", "2024BiW2"],
            },
            {
                name: "SixMonthlyApril",
                periodType: "SixMonthlyApril",
                start: "2024-04-01",
                end: "2025-03-31",
                expected: ["2024AprilS1", "2024AprilS2"],
            },
            {
                name: "FinancialApril",
                periodType: "FinancialApril",
                start: "2024-04-01",
                end: "2025-03-31",
                expected: ["2024April"],
            },
            {
                name: "Daily",
                periodType: "Daily",
                start: "2024-03-01",
                end: "2024-03-03",
                expected: ["20240301", "20240302", "20240303"],
            },
        ];

        cases.forEach(({ name, periodType, start, end, expected }) => {
            it(`expands a ${name} range into the exact DHIS2 period IDs`, () => {
                expect(getPeriodsForRange(periodType, start, end)).toEqual(expected);
            });
        });

        it("includes financial years that overlap (not only those fully contained in) the range", () => {
            // Range Feb–Dec 2024 straddles two FinancialApril years: 2023April
            // (Apr 2023 – Mar 2024) and 2024April (Apr 2024 – Mar 2025). Neither is
            // fully contained in the range, but both intersect it.
            expect(getPeriodsForRange("FinancialApril", "2024-02-01", "2024-12-31")).toEqual([
                "2023April",
                "2024April",
            ]);
        });

        it("degrades to a date-based (daily) expansion for an unrecognized type (no throw)", () => {
            expect(getPeriodsForRange("SomeFuturePeriodType", "2024-03-01", "2024-03-02")).toEqual([
                "20240301",
                "20240302",
            ]);
        });

        it("returns an empty list when a boundary is missing", () => {
            expect(getPeriodsForRange("Monthly", "", "2024-04-30")).toEqual([]);
        });

        it("returns an empty list for an inverted range", () => {
            expect(getPeriodsForRange("Monthly", "2024-04-01", "2024-01-01")).toEqual([]);
        });
    });

    describe("getPreviousPeriod", () => {
        it("returns the previous year for Yearly", () => {
            expect(getPreviousPeriod("Yearly", new Date("2026-07-15"))).toEqual({
                startDate: "2025-01-01",
                endDate: "2025-12-31",
            });
        });

        it("returns the previous month for Monthly", () => {
            expect(getPreviousPeriod("Monthly", new Date("2026-07-15"))).toEqual({
                startDate: "2026-06-01",
                endDate: "2026-06-30",
            });
        });

        it("returns the previous quarter for Quarterly", () => {
            expect(getPreviousPeriod("Quarterly", new Date("2026-08-15"))).toEqual({
                startDate: "2026-04-01",
                endDate: "2026-06-30",
            });
        });

        it("returns the previous ISO week for Weekly", () => {
            expect(getPreviousPeriod("Weekly", new Date("2026-07-15"))).toEqual({
                startDate: "2026-07-06",
                endDate: "2026-07-12",
            });
        });

        it("returns the previous semester for SixMonthly", () => {
            expect(getPreviousPeriod("SixMonthly", new Date("2026-08-15"))).toEqual({
                startDate: "2026-01-01",
                endDate: "2026-06-30",
            });
        });

        it("falls back to the previous day for an unrecognized type (no throw)", () => {
            expect(getPreviousPeriod("SomeFuturePeriodType", new Date("2026-07-15"))).toEqual({
                startDate: "2026-07-14",
                endDate: "2026-07-14",
            });
        });
    });

    describe("getPeriodLabel", () => {
        it("formats a monthly id as month and year", () => {
            expect(getPeriodLabel("Monthly", "202403")).toBe("March 2024");
        });

        it("formats a quarterly id", () => {
            expect(getPeriodLabel("Quarterly", "2024Q1")).toBe("Q1 2024");
        });

        it("uses the raw id as label for uncommon types", () => {
            expect(getPeriodLabel("SixMonthly", "2024S1")).toBe("2024S1");
        });
    });
});
