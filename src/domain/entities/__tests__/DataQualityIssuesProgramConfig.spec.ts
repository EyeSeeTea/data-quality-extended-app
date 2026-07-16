import { describe, expect, it } from "vitest";
import {
    DataQualityIssuesProgramConfig,
    DataQualityIssuesProgramConfigAttrs,
} from "$/domain/entities/DataQualityIssuesProgramConfig";
import { ValidationErrorKey } from "$/domain/entities/generic/Errors";

const baseAttrs: DataQualityIssuesProgramConfigAttrs = {
    selectedProgramCode: "PROGRAM",
    selectedModuleCodes: ["M1", "M2"],
    selectedModulePeriodTypes: ["Monthly", "Monthly"],
    defaultSettings: {
        dataSet: "DS",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        usePreviousPeriod: false,
        orgUnits: ["ou1"],
    },
    steps: [],
};

function buildErrorKeys(attrs: DataQualityIssuesProgramConfigAttrs): ValidationErrorKey[] {
    return DataQualityIssuesProgramConfig.build(attrs).match({
        error: errors => errors.flatMap(error => error.errors),
        success: () => [],
    });
}

describe("DataQualityIssuesProgramConfig", () => {
    describe("same-periodType validation", () => {
        it("does not report mixed_period_type when all datasets share a periodicity", () => {
            const errorKeys = buildErrorKeys({
                ...baseAttrs,
                selectedModulePeriodTypes: ["Monthly", "Monthly"],
            });
            expect(errorKeys).not.toContain("mixed_period_type");
        });

        it("reports mixed_period_type when datasets have different periodicities", () => {
            const errorKeys = buildErrorKeys({
                ...baseAttrs,
                selectedModulePeriodTypes: ["Monthly", "Quarterly"],
            });
            expect(errorKeys).toContain("mixed_period_type");
        });

        it("does not report mixed_period_type when periodicities are not provided (read path)", () => {
            const errorKeys = buildErrorKeys({
                ...baseAttrs,
                selectedModulePeriodTypes: undefined,
            });
            expect(errorKeys).not.toContain("mixed_period_type");
        });
    });
});
