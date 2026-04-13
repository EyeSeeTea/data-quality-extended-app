import { Outlier } from "$/domain/entities/Outlier";
import { Id } from "$/domain/entities/Ref";
import { Maybe } from "$/utils/ts-utils";
import { FutureData } from "$/data/api-futures";

export interface OutlierRepository {
    export(options: OutlierOptions): FutureData<Outlier[]>;
}

export type OutlierOptions = {
    moduleId: Maybe<Id>;
    countryIds: Id[];
    startDate: string;
    endDate: string;
    algorithm: string;
    threshold: string;
};
