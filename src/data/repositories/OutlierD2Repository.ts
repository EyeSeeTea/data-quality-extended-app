import { D2Api } from "$/types/d2-api";
import { OutlierOptions, OutlierRepository } from "$/domain/repositories/OutlierRepository";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Id, Period } from "$/domain/entities/Ref";
import { Outlier } from "$/domain/entities/Outlier";
import { Maybe } from "$/utils/ts-utils";

export class OutlierD2Repository implements OutlierRepository {
    constructor(private api: D2Api) {}

    export(options: OutlierOptions): FutureData<Outlier[]> {
        // https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-240/data-validation.html#request-query-parameters
        // The endpoint expects either `ds` (analyze every DE in the data set)
        // or `de` (analyze specific DEs); when both are sent, `de` is silently ignored
        // Omitting `ds` returns error E2200.
        return apiToFuture(
            this.api.request<D2OutlierResponse>({
                method: "get",
                url: "/outlierDetection",
                params: {
                    ds: options.moduleId,
                    ou: options.countryIds,
                    startDate: options.startDate,
                    endDate: options.endDate,
                    algorithm: options.algorithm,
                    threshold: options.threshold,
                },
            })
        )
            .map(response => {
                return response.outlierValues.map(d2Outlier => this.buildOutliers(d2Outlier));
            })
            .mapError(err => {
                const error = err as unknown as { response?: { data?: { message: string } } };
                return new Error(error.response?.data?.message || err.message);
            });
    }

    private buildOutliers(d2Outlier: D2Outlier): Outlier {
        return {
            categoryOptionId: d2Outlier.coc,
            countryId: d2Outlier.ou,
            dataElementId: d2Outlier.de,
            period: d2Outlier.pe,
            zScore: d2Outlier.zScore,
        };
    }
}

type D2Outlier = {
    de: Id;
    pe: Period;
    ou: Id;
    coc: Id;
    aoc: Id;
    zScore: Maybe<number>;
};

type D2OutlierResponse = {
    outlierValues: Array<D2Outlier>;
};
