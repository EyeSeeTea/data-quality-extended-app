import { D2Api } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Id } from "$/domain/entities/Ref";
import _ from "$/domain/entities/generic/Collection";
import { Country } from "$/domain/entities/Country";
import { Future } from "$/domain/entities/generic/Future";
import { CountryOptions } from "$/domain/repositories/CountryRepository";
import { RowsPaginated } from "$/domain/entities/Pagination";
import { MetadataPick } from "$/types/d2-api";

export class D2OrgUnit {
    constructor(private api: D2Api) {}

    getByIds(ids: Id[]): FutureData<Country[]> {
        const $requests = Future.sequential(
            _(ids)
                .chunk(50)
                .map(countriesIds => {
                    return apiToFuture(
                        this.api.models.organisationUnits.get({
                            fields: orgUnitFields,
                            filter: { id: { in: countriesIds } },
                        })
                    ).map(d2Response => {
                        return d2Response.objects.map((d2OrgUnit: D2OrgUnitEntity): Country => {
                            return {
                                id: d2OrgUnit.id,
                                name:
                                    d2OrgUnit.displayShortName ||
                                    d2OrgUnit.displayFormName ||
                                    d2OrgUnit.displayName,
                                path: d2OrgUnit.path,
                                writeAccess: false,
                            };
                        });
                    });
                })
                .value()
        );

        return Future.sequential([$requests]).flatMap(countries => {
            const first = _(countries).first();
            if (!first) return Future.success([]);
            const allCountries = _(first).flatten().value();
            return Future.success(allCountries);
        });
    }

    getAll(
        options: CountryOptions,
        state: { initialPage: number; countries: Country[] }
    ): FutureData<Country[]> {
        const { initialPage, countries } = state;
        return this.getCountries(options, initialPage).flatMap(response => {
            const newCountries = [...countries, ...response.rows];
            if (response.pagination.page >= response.pagination.pageCount) {
                return Future.success(newCountries);
            } else {
                return this.getAll(options, {
                    initialPage: initialPage + 1,
                    countries: newCountries,
                });
            }
        });
    }

    private getCountries(
        options: CountryOptions,
        page: number
    ): FutureData<RowsPaginated<Country>> {
        return apiToFuture(
            this.api.models.organisationUnits.get({
                fields: orgUnitFields,
                filter: { level: { eq: options.level || undefined } },
                page: page,
                pageSize: 100,
            })
        ).map(d2Response => {
            return {
                pagination: {
                    page: d2Response.pager.page,
                    pageCount: d2Response.pager.pageCount,
                    pageSize: d2Response.pager.pageSize,
                    total: d2Response.pager.total,
                },
                rows: d2Response.objects.map((d2OrgUnit: D2OrgUnitEntity) => {
                    return {
                        id: d2OrgUnit.id,
                        name:
                            d2OrgUnit.displayShortName ||
                            d2OrgUnit.displayFormName ||
                            d2OrgUnit.displayName,
                        path: d2OrgUnit.path,
                        writeAccess: false,
                    };
                }),
            };
        });
    }
}

const orgUnitFields = {
    id: true,
    displayName: true,
    displayFormName: true,
    displayShortName: true,
    path: true,
};

type D2OrgUnitEntity = MetadataPick<{
    organisationUnits: { fields: typeof orgUnitFields };
}>["organisationUnits"][number];
