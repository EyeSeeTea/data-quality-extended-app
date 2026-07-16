import { Id } from "$/domain/entities/Ref";

// Raw datastore shape of `settings-<programCode>.defaultConfig`. The auto-fill flag is
// stored under the deprecated `usePreviousYear` key on legacy records and under
// `usePreviousPeriod` on records saved after the periodicity change. Reads honor
// `usePreviousYear` first (retro-compatibility); saves persist `usePreviousPeriod`
// only, dropping the legacy key (a lazy per-record upgrade, no bulk migration).
export type DefaultConfigDatastore = {
    dataSet: string;
    startDate: string;
    endDate: string;
    orgUnits: Id[];
    usePreviousPeriod?: boolean;
    usePreviousYear?: boolean;
};

export function readUsePreviousPeriod(config: {
    usePreviousYear?: boolean;
    usePreviousPeriod?: boolean;
}): boolean {
    return config.usePreviousYear ?? config.usePreviousPeriod ?? false;
}
