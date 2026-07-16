import { PeriodType } from "$/domain/entities/PeriodType";

export type PeriodPickerView = "year" | "month" | "date";

export type PeriodPickerFormat = {
    unit: PeriodPickerView;
    views: ReadonlyArray<PeriodPickerView>;
    format: string;
};

export function getPeriodPickerFormat(periodType: PeriodType): PeriodPickerFormat {
    switch (periodType) {
        case "Yearly":
            return { unit: "year", views: ["year"], format: "YYYY" };
        case "Monthly":
            return { unit: "month", views: ["year", "month"], format: "MMMM YYYY" };
        default:
            return { unit: "date", views: ["year", "month", "date"], format: "YYYY-MM-DD" };
    }
}
