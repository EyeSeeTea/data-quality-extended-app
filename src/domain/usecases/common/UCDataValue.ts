import _ from "lodash";

import { FutureData } from "$/data/api-futures";
import { DataValue } from "$/domain/entities/DataValue";
import { DateISOString, Id } from "$/domain/entities/Ref";
import { DataValueRepository } from "$/domain/repositories/DataValueRepository";
import { Future } from "$/domain/entities/generic/Future";
import { getPeriodsForRange } from "$/domain/entities/Period";
import { PeriodType } from "$/domain/entities/PeriodType";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import i18n from "$/utils/i18n";

export class UCDataValue {
    constructor(private dataValueRepository: DataValueRepository) {}

    get(
        countriesIds: Id[],
        moduleIds: Id[],
        periodType: PeriodType,
        startDate: DateISOString,
        endDate: DateISOString
    ): FutureData<DataValue[]> {
        if (countriesIds.length === 0)
            throw new Error(i18n.t("Select at least one organisation unit"));

        const periodsToSearch = getPeriodsForRange(
            periodType,
            QualityAnalysis.normalizePeriodBoundary(startDate, "start"),
            QualityAnalysis.normalizePeriodBoundary(endDate, "end")
        );
        if (periodsToSearch.length === 0) throw new Error("Invalid period");
        const $requests = _(countriesIds)
            .chunk(1)
            .map(countryIds => {
                return this.dataValueRepository.get({
                    moduleIds: moduleIds,
                    countriesIds: countryIds,
                    period: [...periodsToSearch],
                });
            })
            .value();

        return Future.sequential($requests).flatMap(result => {
            return Future.success(_(result).flatten().value());
        });
    }

    getByCountryAndPeriod(dataValues: DataValue[]): Record<string, DataValue[]> {
        return _(dataValues)
            .groupBy(dataValue => {
                return `${dataValue.countryId}.${dataValue.period}`;
            })
            .value();
    }
}
