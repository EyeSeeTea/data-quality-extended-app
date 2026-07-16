import { describe, expect, it } from "vitest";
import { resolveStepTypeFromSectionName } from "$/domain/entities/StepSettings";

describe("resolveStepTypeFromSectionName", () => {
    it("matches the exact canonical name, with no prefix (deprecated, backward compatibility only)", () => {
        expect(resolveStepTypeFromSectionName("Outliers")).toBe("OUTLIERS");
        expect(resolveStepTypeFromSectionName("Validation")).toBe("VALIDATION");
        expect(resolveStepTypeFromSectionName("Manual Issues")).toBe("MANUAL_ISSUES");
    });

    it("matches a program-prefixed name (the required convention going forward)", () => {
        expect(resolveStepTypeFromSectionName("TEST_DQI_001_Outliers")).toBe("OUTLIERS");
        expect(resolveStepTypeFromSectionName("TEST_DQI_002_Validation")).toBe("VALIDATION");
        expect(resolveStepTypeFromSectionName("TEST_DQI_001_Manual Issues")).toBe("MANUAL_ISSUES");
    });

    it("matches a program-prefixed name for multi-word step names", () => {
        expect(resolveStepTypeFromSectionName("TEST_DQI_001_Double Counts And Missing GP")).toBe(
            "DOUBLE_COUNTS_AND_MISSING_GP"
        );
        expect(resolveStepTypeFromSectionName("TEST_DQI_001_Missing Nurses")).toBe(
            "MISSING_NURSES"
        );
        expect(resolveStepTypeFromSectionName("TEST_DQI_001_Disaggregates")).toBe("DISAGGREGATES");
    });

    it("is case-insensitive and tolerant of extra whitespace, prefixed or not", () => {
        expect(resolveStepTypeFromSectionName("  outliers  ")).toBe("OUTLIERS");
        expect(resolveStepTypeFromSectionName("test_dqi_001_outliers")).toBe("OUTLIERS");
    });

    it("does not match a name that only contains the canonical name as a substring, with no underscore boundary", () => {
        expect(resolveStepTypeFromSectionName("OutliersExtra")).toBeUndefined();
        expect(resolveStepTypeFromSectionName("SubOutliers")).toBeUndefined();
    });

    it("returns undefined for a name that matches nothing, prefixed or not", () => {
        expect(resolveStepTypeFromSectionName("Custom Stage")).toBeUndefined();
        expect(resolveStepTypeFromSectionName("TEST_DQI_001_Custom Stage")).toBeUndefined();
    });
});
