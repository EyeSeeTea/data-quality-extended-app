import moment, { Moment } from "moment";

/**
 * Project-owned date/time utility. This module is the single place in the
 * codebase that imports `moment` on behalf of the domain layer, so domain code
 * depends on this wrapper instead of a third-party date library directly. To
 * swap the underlying implementation, change it here only.
 */

export type DateTime = Moment;

export type DateDiffUnit = moment.unitOfTime.Diff;

export type DateDurationUnit = moment.unitOfTime.DurationConstructor;

export type DateParts = { year: number; month: number; date: number };

/** Parse a string with an explicit format, optionally in strict mode. */
export function parseDate(input: string, format: string, strict = false): DateTime {
    return moment(input, format, strict);
}

/** Wrap a native `Date` as a `DateTime`. */
export function dateFromJsDate(date: Date): DateTime {
    return moment(date);
}

/** Wrap an existing date-like value (a `DateTime` or native `Date`) as a `DateTime`. */
export function toDateTime(value: DateTime | Date): DateTime {
    return moment(value);
}

/** Build a `DateTime` from calendar parts (month is 0-indexed, as in `moment`). */
export function dateFromParts(parts: DateParts): DateTime {
    return moment(parts);
}
