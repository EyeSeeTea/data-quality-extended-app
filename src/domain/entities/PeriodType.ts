export const knownPeriodTypes = [
    "Daily",
    "Weekly",
    "WeeklyWednesday",
    "WeeklyThursday",
    "WeeklySaturday",
    "WeeklySunday",
    "BiWeekly",
    "Monthly",
    "BiMonthly",
    "Quarterly",
    "QuarterlyNov",
    "SixMonthly",
    "SixMonthlyApril",
    "SixMonthlyNov",
    "Yearly",
    "FinancialApril",
    "FinancialJuly",
    "FinancialOct",
    "FinancialNov",
] as const;

export type KnownPeriodType = (typeof knownPeriodTypes)[number];

export type PeriodType = string;

export function isKnownPeriodType(value: string): value is KnownPeriodType {
    return knownPeriodTypes.some(periodType => periodType === value);
}
