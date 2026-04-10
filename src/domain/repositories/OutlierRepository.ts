import { Outlier } from "$/domain/entities/Outlier";
import { Id } from "$/domain/entities/Ref";
import { Maybe } from "$/utils/ts-utils";
import { FutureData } from "$/data/api-futures";

export interface OutlierRepository {
    export(options: OutlierOptions): FutureData<Outlier[]>;
}

// DHIS2 /outlierDetection accepts either `ds` (data set, includes all its data
// elements) or `de` (specific data elements), but not both — when `ds` is
// provided, `de` is silently ignored and the analysis runs over the full data
// set. See:
// https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-240/data-validation.html#request-query-parameters
// > "You must specify either data sets with the ds parameter, which will
// > include all data elements in the data sets, or specify data elements with
// > the de parameter."
// Because this use case always passes `moduleId` (= `ds`), we intentionally do
// not expose `dataElementIds` on these options.
export type OutlierOptions = {
    moduleId: Maybe<Id>;
    countryIds: Id[];
    startDate: string;
    endDate: string;
    algorithm: string;
    threshold: string;
};
