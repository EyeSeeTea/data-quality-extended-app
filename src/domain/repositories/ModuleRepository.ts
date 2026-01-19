import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Module, ModuleBase } from "$/domain/entities/Module";
import { Id } from "$/domain/entities/Ref";
import { Maybe } from "$/utils/ts-utils";

export interface ModuleRepository {
    get(metadata: MetadataItem): FutureData<Module[]>;
    getByIds(ids: Id[]): FutureData<Module[]>;
    getAllBase(options?: ModulesSortingFilterOptions): FutureData<ModuleBase[]>;
    getPaginated(options: ModulesPaginatedOptions): FutureData<ModulesBasePaginated>;
}

export type Pagination = {
    page: number;
    pageCount: number;
    pageSize: number;
    total: number;
};

export type ModulesSortingFilterOptions = {
    sorting?: { field: string; order: "asc" | "desc" };
    filters: {
        name: Maybe<string>;
    };
};

export type ModulesPaginatedOptions = {
    pagination: Pick<Pagination, "page" | "pageSize">;
    sorting: { field: string; order: "asc" | "desc" };
    filters: {
        name: Maybe<string>;
    };
};

export type ModulesBasePaginated = {
    rows: ModuleBase[];
    pagination: Pagination;
};
