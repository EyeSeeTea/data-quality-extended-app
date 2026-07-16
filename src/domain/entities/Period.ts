import _, { Collection } from "$/domain/entities/generic/Collection";
import {
    DateDiffUnit,
    DateDurationUnit,
    DateTime,
    dateFromJsDate,
    dateFromParts,
    parseDate,
} from "$/utils/dates";
import { DateISOString, Period } from "./Ref";
import { PeriodType } from "./PeriodType";

const ISO_DATE = "YYYY-MM-DD";

const weeklyStartDay: Record<string, number> = {
    Weekly: 1,
    WeeklyWednesday: 3,
    WeeklyThursday: 4,
    WeeklySaturday: 6,
    WeeklySunday: 0,
};

const financialMonthByName: Record<string, number> = { April: 3, July: 6, Oct: 9, Nov: 10 };

/** Returns every DHIS2 period ID whose period intersects the `[startIso, endIso]` range. */
export function getPeriodsForRange(
    periodType: PeriodType,
    startIso: DateISOString,
    endIso: DateISOString
): ReadonlyArray<Period> {
    if (!startIso || !endIso) return [];
    const start = parseDate(startIso, ISO_DATE);
    const end = parseDate(endIso, ISO_DATE);
    if (!start.isValid() || !end.isValid() || start.isAfter(end)) return [];
    return generatePeriods(periodType, start, end);
}

/** `getPeriodsForRange` mapped to `{ value, text }` options for the period multi-selects. */
export function getPeriodOptionsForRange(
    periodType: PeriodType,
    startIso: DateISOString,
    endIso: DateISOString
): ReadonlyArray<{ value: string; text: string }> {
    return getPeriodsForRange(periodType, startIso, endIso).map(id => ({
        value: id,
        text: getPeriodLabel(periodType, id),
    }));
}

/** Human-readable label for a DHIS2 period ID; falls back to the raw id for uncommon types. */
export function getPeriodLabel(periodType: PeriodType, periodId: Period): string {
    switch (periodType) {
        case "Yearly":
            return periodId;
        case "Monthly": {
            const parsed = parseDate(periodId, "YYYYMM", true);
            return parsed.isValid() ? parsed.format("MMMM YYYY") : periodId;
        }
        case "Daily": {
            const parsed = parseDate(periodId, "YYYYMMDD", true);
            return parsed.isValid() ? parsed.format("DD MMM YYYY") : periodId;
        }
        case "Quarterly": {
            const match = /^(\d{4})Q([1-4])$/.exec(periodId);
            return match ? `Q${match[2]} ${match[1]}` : periodId;
        }
        default:
            return periodId;
    }
}

/** ISO boundaries of the period immediately preceding `reference`, for any periodicity. */
export function getPreviousPeriod(
    periodType: PeriodType,
    reference: Date = new Date()
): { startDate: DateISOString; endDate: DateISOString } {
    const ref = dateFromJsDate(reference);
    const currentStart = currentPeriodStart(periodType, ref);
    const step = periodStep(periodType);
    const previousStart = currentStart.clone().subtract(step.amount, step.unit);
    const previousEnd = currentStart.clone().subtract(1, "day");
    return {
        startDate: previousStart.format(ISO_DATE),
        endDate: previousEnd.format(ISO_DATE),
    };
}

type StepUnit = DateDiffUnit;

function generatePeriods(periodType: PeriodType, start: DateTime, end: DateTime): string[] {
    switch (periodType) {
        case "Daily":
            return steppedPeriods(start, end, 1, "days", m => m.format("YYYYMMDD"));
        case "Monthly":
            return steppedPeriods(start, end, 1, "months", m => m.format("YYYYMM"));
        case "Yearly":
            return steppedPeriods(start, end, 1, "years", m => m.format("YYYY"));
        case "Quarterly":
            return steppedPeriods(start, end, 1, "quarters", m => m.format("YYYY[Q]Q"));
        case "Weekly":
        case "WeeklyWednesday":
        case "WeeklyThursday":
        case "WeeklySaturday":
        case "WeeklySunday":
            return generateWeeklyPeriods(periodType, start, end);
        case "BiWeekly":
            return generateBiWeeklyPeriods(start, end);
        case "BiMonthly":
            return generateBiMonthlyPeriods(start, end);
        case "QuarterlyNov":
            return generateQuarterlyNovPeriods(start, end);
        case "SixMonthly":
            return generateSixMonthlyPeriods(start, end);
        case "SixMonthlyApril":
            return generateSixMonthlyAprilPeriods(start, end);
        case "SixMonthlyNov":
            return generateSixMonthlyNovPeriods(start, end);
        case "FinancialApril":
        case "FinancialJuly":
        case "FinancialOct":
        case "FinancialNov":
            return generateFinancialPeriods(start, end, periodType);
        default:
            // Non-throwing graceful fallback for unrecognized/future period types.
            return steppedPeriods(start, end, 1, "days", m => m.format("YYYYMMDD"));
    }
}

/** Moments from `alignedStart`, stepping by `amount` `unit`, up to and including `end`. */
function steppedMoments(
    alignedStart: DateTime,
    end: DateTime,
    amount: number,
    unit: StepUnit
): DateTime[] {
    if (alignedStart.isAfter(end)) return [];
    const span = Math.max(0, end.diff(alignedStart, unit));
    const maxIndex = Math.floor(span / amount) + 1;
    return Collection.range(0, maxIndex + 1)
        .map(index => alignedStart.clone().add(index * amount, unit))
        .select(current => current.isSameOrBefore(end))
        .value();
}

function steppedPeriods(
    alignedStart: DateTime,
    end: DateTime,
    amount: number,
    unit: StepUnit,
    format: (current: DateTime) => string
): string[] {
    return steppedMoments(alignedStart, end, amount, unit).map(format);
}

function generateWeeklyPeriods(periodType: PeriodType, start: DateTime, end: DateTime): string[] {
    const startDay = weeklyStartDay[periodType] ?? 1;
    const suffix =
        periodType === "Weekly" ? "W" : `${periodType.replace("Weekly", "").substring(0, 3)}W`;

    const aligned = start.clone().isoWeekday(startDay);
    const weeklyStart = aligned.isAfter(start) ? aligned.clone().subtract(1, "week") : aligned;

    return steppedPeriods(
        weeklyStart,
        end,
        1,
        "weeks",
        current => `${current.isoWeekYear()}${suffix}${current.isoWeek()}`
    );
}

function getBiWeekStart(reference: DateTime): DateTime {
    const isoWeek = reference.isoWeek();
    const startWeek = isoWeek % 2 === 0 ? isoWeek - 1 : isoWeek;
    return reference
        .clone()
        .isoWeekYear(reference.isoWeekYear())
        .isoWeek(startWeek)
        .startOf("isoWeek");
}

function generateBiWeeklyPeriods(start: DateTime, end: DateTime): string[] {
    return steppedPeriods(getBiWeekStart(start), end, 2, "weeks", current => {
        const biWeekNum = Math.ceil(current.isoWeek() / 2);
        return `${current.isoWeekYear()}BiW${biWeekNum}`;
    });
}

function generateBiMonthlyPeriods(start: DateTime, end: DateTime): string[] {
    const startMonth = Math.floor(start.month() / 2) * 2;
    const alignedStart = start.clone().month(startMonth).startOf("month");
    return steppedPeriods(alignedStart, end, 2, "months", current => {
        const biMonthNum = Math.floor(current.month() / 2) + 1;
        return `${current.year()}${String(biMonthNum).padStart(2, "0")}B`;
    });
}

function generateQuarterlyNovPeriods(start: DateTime, end: DateTime): string[] {
    const alignedStart = start.clone().add(2, "months").startOf("quarter").subtract(2, "months");
    return steppedPeriods(alignedStart, end, 3, "months", current => {
        const year = current.year();
        if (current.month() >= 10) return `${year + 1}NovQ1`;
        const quarter = Math.floor((current.month() + 2) / 3) + 1;
        return `${year}NovQ${quarter}`;
    });
}

function generateSixMonthlyPeriods(start: DateTime, end: DateTime): string[] {
    const startMonth = start.month() < 6 ? 0 : 6;
    const alignedStart = start.clone().month(startMonth).startOf("month");
    return steppedPeriods(alignedStart, end, 6, "months", current => {
        const half = current.month() < 6 ? 1 : 2;
        return `${current.year()}S${half}`;
    });
}

function generateSixMonthlyAprilPeriods(start: DateTime, end: DateTime): string[] {
    const year = start.month() >= 3 ? start.year() : start.year() - 1;
    const alignedStart = dateFromParts({ year: year, month: 3, date: 1 });
    return _(steppedMoments(alignedStart, end, 6, "months"))
        .compactMap(current => {
            const periodEnd = current.clone().add(6, "months").subtract(1, "day");
            if (!periodEnd.isSameOrAfter(start)) return undefined;
            const semester = current.month() === 3 ? 1 : 2;
            return `${current.year()}AprilS${semester}`;
        })
        .value();
}

function generateSixMonthlyNovPeriods(start: DateTime, end: DateTime): string[] {
    const alignedStart =
        start.month() >= 5
            ? dateFromParts({ year: start.year(), month: 4, date: 1 })
            : dateFromParts({ year: start.year() - 1, month: 10, date: 1 });
    return _(steppedMoments(alignedStart, end, 6, "months"))
        .compactMap(current => {
            const periodEnd = current.clone().add(6, "months").subtract(1, "day");
            if (!periodEnd.isSameOrAfter(start)) return undefined;
            const isNovStart = current.month() === 10;
            const semester = isNovStart ? 1 : 2;
            const displayYear = isNovStart ? current.year() + 1 : current.year();
            return `${displayYear}NovS${semester}`;
        })
        .value();
}

function generateFinancialPeriods(
    start: DateTime,
    end: DateTime,
    periodType: PeriodType
): string[] {
    const monthName = periodType.replace("Financial", "");
    const startMonthIndex = financialMonthByName[monthName];
    if (startMonthIndex === undefined)
        return steppedPeriods(start, end, 1, "days", m => m.format("YYYYMMDD"));

    return _(Collection.range(start.year(), end.year() + 1).value())
        .compactMap(year => {
            const periodStart = dateFromParts({ year: year, month: startMonthIndex, date: 1 });
            const periodEnd = periodStart.clone().add(1, "year").subtract(1, "day");
            const isContained = periodStart.isSameOrAfter(start) && periodEnd.isSameOrBefore(end);
            return isContained ? `${year}${monthName}` : undefined;
        })
        .value();
}

type PeriodStep = { amount: number; unit: DateDurationUnit };

function periodStep(periodType: PeriodType): PeriodStep {
    switch (periodType) {
        case "Daily":
            return { amount: 1, unit: "days" };
        case "Weekly":
        case "WeeklyWednesday":
        case "WeeklyThursday":
        case "WeeklySaturday":
        case "WeeklySunday":
            return { amount: 1, unit: "weeks" };
        case "BiWeekly":
            return { amount: 2, unit: "weeks" };
        case "Monthly":
            return { amount: 1, unit: "months" };
        case "BiMonthly":
            return { amount: 2, unit: "months" };
        case "Quarterly":
        case "QuarterlyNov":
            return { amount: 3, unit: "months" };
        case "SixMonthly":
        case "SixMonthlyApril":
        case "SixMonthlyNov":
            return { amount: 6, unit: "months" };
        case "Yearly":
        case "FinancialApril":
        case "FinancialJuly":
        case "FinancialOct":
        case "FinancialNov":
            return { amount: 1, unit: "years" };
        default:
            return { amount: 1, unit: "days" };
    }
}

function currentPeriodStart(periodType: PeriodType, ref: DateTime): DateTime {
    switch (periodType) {
        case "Weekly":
        case "WeeklyWednesday":
        case "WeeklyThursday":
        case "WeeklySaturday":
        case "WeeklySunday": {
            const startDay = weeklyStartDay[periodType] ?? 1;
            const aligned = ref.clone().isoWeekday(startDay);
            return (aligned.isAfter(ref) ? aligned.subtract(1, "week") : aligned).startOf("day");
        }
        case "BiWeekly":
            return getBiWeekStart(ref);
        case "Monthly":
            return ref.clone().startOf("month");
        case "BiMonthly":
            return ref
                .clone()
                .month(Math.floor(ref.month() / 2) * 2)
                .startOf("month");
        case "Quarterly":
            return ref.clone().startOf("quarter");
        case "QuarterlyNov": {
            const anchored = ref.clone().add(2, "months").startOf("quarter").subtract(2, "months");
            return anchored.isAfter(ref) ? anchored.subtract(3, "months") : anchored;
        }
        case "SixMonthly":
            return ref
                .clone()
                .month(ref.month() < 6 ? 0 : 6)
                .startOf("month");
        case "SixMonthlyApril": {
            const year = ref.month() >= 3 ? ref.year() : ref.year() - 1;
            const firstHalf = dateFromParts({ year: year, month: 3, date: 1 });
            const secondHalf = firstHalf.clone().add(6, "months");
            return secondHalf.isSameOrBefore(ref) ? secondHalf : firstHalf;
        }
        case "SixMonthlyNov": {
            const firstHalf =
                ref.month() >= 5
                    ? dateFromParts({ year: ref.year(), month: 4, date: 1 })
                    : dateFromParts({ year: ref.year() - 1, month: 10, date: 1 });
            const secondHalf = firstHalf.clone().add(6, "months");
            return secondHalf.isSameOrBefore(ref) ? secondHalf : firstHalf;
        }
        case "Yearly":
            return ref.clone().startOf("year");
        case "FinancialApril":
        case "FinancialJuly":
        case "FinancialOct":
        case "FinancialNov": {
            const monthIndex = financialMonthByName[periodType.replace("Financial", "")];
            if (monthIndex === undefined) return ref.clone().startOf("day");
            const thisYearStart = dateFromParts({ year: ref.year(), month: monthIndex, date: 1 });
            return thisYearStart.isSameOrBefore(ref)
                ? thisYearStart
                : thisYearStart.subtract(1, "year");
        }
        case "Daily":
        default:
            return ref.clone().startOf("day");
    }
}
