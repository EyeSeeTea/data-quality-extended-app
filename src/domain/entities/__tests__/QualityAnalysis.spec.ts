import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QualityAnalysis, QualityAnalysisAttrs } from "$/domain/entities/QualityAnalysis";

function createQualityAnalysis(data: Partial<QualityAnalysisAttrs>) {
    return QualityAnalysis.build({
        ...data,
        status: data.status || "In Progress",
        id: "1",
        module: {
            id: "1",
            code: "1",
            name: "Module 1",
            periodType: "Yearly",
            dataElements: [],
            disaggregations: [],
        },
        name: data.name || "",
        startDate: data.startDate ?? "2021-01-01",
        endDate: data.endDate ?? "2021-01-01",
        sections: [],
        lastModification: "",
        countriesAnalysis: [],
        sequential: { value: "0000001" },
    });
}

describe("Quality Analysis", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should throw Error if required attributes are not present", () => {
        expect(() => createQualityAnalysis({}).get()).toThrow();
    });

    it("should generate a default name with the format: [#{value} - #{currentdate}]", () => {
        const date = new Date("2024-01-31T08:22:51.051Z");
        vi.setSystemTime(date);
        const fakeUserName = "john";
        const qualityAnalysisName = QualityAnalysis.buildDefaultName("", fakeUserName);
        expect(qualityAnalysisName).toBe(`${fakeUserName} - 2024_01_31_08_22_51_051Z`);
    });

    describe("normalizePeriodBoundary", () => {
        it("expands a legacy bare year to the year start / end", () => {
            expect(QualityAnalysis.normalizePeriodBoundary("2024", "start")).toBe("2024-01-01");
            expect(QualityAnalysis.normalizePeriodBoundary("2024", "end")).toBe("2024-12-31");
        });

        it("passes an already-ISO value through unchanged", () => {
            expect(QualityAnalysis.normalizePeriodBoundary("2024-03-15", "start")).toBe(
                "2024-03-15"
            );
            expect(QualityAnalysis.normalizePeriodBoundary("2024-03-15", "end")).toBe("2024-03-15");
        });
    });

    describe("date range validation", () => {
        it("builds successfully when start date is before end date", () => {
            const result = createQualityAnalysis({
                name: "Analysis",
                startDate: "2024-01-01",
                endDate: "2024-12-31",
            });
            expect(result.isSuccess()).toBe(true);
        });

        it("fails with date_range_invalid when the range is inverted", () => {
            const result = createQualityAnalysis({
                name: "Analysis",
                startDate: "2024-12-31",
                endDate: "2024-01-01",
            });
            const errorKeys = result.match({
                error: errors => errors.flatMap(error => error.errors),
                success: () => [],
            });
            expect(errorKeys).toContain("date_range_invalid");
        });
    });
});
