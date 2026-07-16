import { describe, expect, it } from "vitest";
import { getModulesPeriodType } from "$/webapp/components/analysis-filter/AnalysisFilter";
import { Module } from "$/domain/entities/Module";

function buildModule(id: string, periodType: string): Module {
    return {
        id,
        name: `Module ${id}`,
        code: `M${id}`,
        periodType,
        dataElements: [],
        disaggregations: [],
    };
}

describe("getModulesPeriodType", () => {
    it("returns the periodType of the module matching the selected Dataset filter", () => {
        const modules = [buildModule("1", "Yearly"), buildModule("2", "Yearly")];

        const result = getModulesPeriodType(modules, "2");

        expect(result).toBe("Yearly");
    });

    it("falls back to any configured module's periodType when no Dataset filter is selected", () => {
        const modules = [buildModule("1", "Yearly"), buildModule("2", "Yearly")];

        const result = getModulesPeriodType(modules, undefined);

        expect(result).toBe("Yearly");
    });

    it("falls back to any configured module's periodType when the selected id matches no module", () => {
        const modules = [buildModule("1", "Monthly")];

        const result = getModulesPeriodType(modules, "missing-id");

        expect(result).toBe("Monthly");
    });

    it("defaults to free date (empty periodType) when no module is configured at all", () => {
        const result = getModulesPeriodType([], undefined);

        expect(result).toBe("");
    });
});
