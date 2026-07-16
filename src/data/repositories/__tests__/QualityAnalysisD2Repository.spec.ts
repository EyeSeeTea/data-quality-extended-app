import { describe, expect, it } from "vitest";
import { buildAnalysisFilters } from "$/data/repositories/QualityAnalysisD2Repository";
import { QualityAnalysisOptions } from "$/domain/repositories/QualityAnalysisRepository";

const teaIds = {
    name: "teaName",
    startDate: "teaStart",
    endDate: "teaEnd",
    module: "teaModule",
    status: "teaStatus",
};

type Filters = QualityAnalysisOptions["filters"];

const emptyFilters: Filters = {
    endDate: undefined,
    module: undefined,
    name: undefined,
    startDate: undefined,
    status: undefined,
    ids: undefined,
    periodType: undefined,
};

function buildFilters(overrides: Partial<Filters>): ReturnType<typeof buildAnalysisFilters> {
    return buildAnalysisFilters({ ...emptyFilters, ...overrides }, teaIds);
}

describe("buildAnalysisFilters (dashboard overlap query)", () => {
    describe("periodicity-aware overlap window", () => {
        it("emits both overlap bounds for a Monthly window at full ISO precision", () => {
            const result = buildFilters({
                periodType: "Monthly",
                startDate: "2024-03-01",
                endDate: "2024-09-30",
            });

            expect(result).toEqual(["teaEnd:GE:2024-03-01", "teaStart:LE:2024-09-30"]);
        });

        it("coarsens the endDate lower bound to year granularity for a Yearly window (legacy safety)", () => {
            const result = buildFilters({
                periodType: "Yearly",
                startDate: "2024-03-01",
                endDate: "2024-09-30",
            });

            expect(result).toEqual(["teaEnd:GE:2024", "teaStart:LE:2024-09-30"]);
        });

        it("coarsens the endDate lower bound when the periodType could not be resolved", () => {
            const result = buildFilters({
                periodType: undefined,
                startDate: "2024-03-01",
                endDate: "2024-09-30",
            });

            expect(result).toEqual(["teaEnd:GE:2024", "teaStart:LE:2024-09-30"]);
        });
    });

    describe("half-open windows (single bound)", () => {
        it("emits only the lower bound when just the start bound is set (Monthly, no coarsening)", () => {
            const result = buildFilters({ periodType: "Monthly", startDate: "2024-03-01" });

            expect(result).toEqual(["teaEnd:GE:2024-03-01"]);
        });

        it("coarsens the lower bound to a year when just the start bound is set (Yearly)", () => {
            const result = buildFilters({ periodType: "Yearly", startDate: "2024-03-01" });

            expect(result).toEqual(["teaEnd:GE:2024"]);
        });

        it("emits only the upper bound when just the end bound is set", () => {
            const result = buildFilters({ periodType: "Yearly", endDate: "2024-09-30" });

            expect(result).toEqual(["teaStart:LE:2024-09-30"]);
        });
    });

    describe("other filter terms", () => {
        it("combines name, module and status terms in a stable order", () => {
            const result = buildFilters({
                periodType: "Monthly",
                startDate: "2024-03-01",
                endDate: "2024-09-30",
                name: "issue",
                module: "moduleId",
                status: "In Progress",
            });

            expect(result).toEqual([
                "teaEnd:GE:2024-03-01",
                "teaModule:EQ:moduleId",
                "teaName:LIKE:issue",
                "teaStart:LE:2024-09-30",
                "teaStatus:EQ:In Progress",
            ]);
        });

        it("returns undefined when no filter is set", () => {
            expect(buildFilters({})).toBeUndefined();
        });
    });
});
