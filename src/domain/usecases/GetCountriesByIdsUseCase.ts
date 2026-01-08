import { FutureData } from "$/data/api-futures";
import { Country } from "$/domain/entities/Country";
import { Id } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import { CountryRepository } from "$/domain/repositories/CountryRepository";

export class GetCountriesByIdsUseCase {
    constructor(private countryRepository: CountryRepository) {}

    execute(ids: Id[]): FutureData<Country[]> {
        if (ids.length === 0) return Future.success([]);

        return this.countryRepository.getByIds(ids);
    }
}
