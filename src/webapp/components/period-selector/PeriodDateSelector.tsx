import React from "react";
import { DatePicker } from "@eyeseetea/d2-ui-components";

import { DateISOString } from "$/domain/entities/Ref";
import { PeriodType } from "$/domain/entities/PeriodType";
import { parseDate, toDateTime } from "$/utils/dates";
import { getPeriodPickerFormat } from "./periodPickerFormat";

const ISO_DATE = "YYYY-MM-DD";

export type PeriodDateSelectorProps = {
    label: string;
    periodType: PeriodType;
    value: DateISOString;
    edge: "start" | "end";
    onChange: (isoDate: DateISOString) => void;
    minDate?: DateISOString;
    maxDate?: DateISOString;
    disabled?: boolean;
    className?: string;
    clearable?: boolean;
};

export const PeriodDateSelector: React.FC<PeriodDateSelectorProps> = React.memo(props => {
    const {
        label,
        periodType,
        value,
        edge,
        onChange,
        minDate,
        maxDate,
        disabled,
        className,
        clearable,
    } = props;

    const { unit, views, format } = getPeriodPickerFormat(periodType);

    const dateValue = value ? parseDate(value, ISO_DATE) : null;

    return (
        <DatePicker
            className={className}
            label={label}
            value={dateValue}
            onChange={date => {
                const parsed = date ? toDateTime(date) : null;
                if (!parsed || !parsed.isValid()) {
                    onChange("");
                    return;
                }
                const snapped =
                    edge === "start" ? parsed.clone().startOf(unit) : parsed.clone().endOf(unit);
                onChange(snapped.format(ISO_DATE));
            }}
            views={[...views]}
            format={format}
            minDate={minDate ? parseDate(minDate, ISO_DATE) : undefined}
            maxDate={maxDate ? parseDate(maxDate, ISO_DATE) : undefined}
            disabled={disabled}
            clearable={clearable}
        />
    );
});
