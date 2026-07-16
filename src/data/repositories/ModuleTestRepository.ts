import { Module, ModuleBase } from "$/domain/entities/Module";
import { Future } from "$/domain/entities/generic/Future";
import {
    ModuleRepository,
    ModulesBasePaginated,
    ModulesPaginatedOptions,
    ModulesSortingFilterOptions,
} from "$/domain/repositories/ModuleRepository";
import { FutureData } from "$/data/api-futures";

const testModules: Module[] = [
    {
        id: "module-monthly",
        code: "MONTHLY",
        name: "Monthly Module",
        periodType: "Monthly",
        dataElements: [],
        disaggregations: [],
    },
    {
        id: "module-yearly",
        code: "YEARLY",
        name: "Yearly Module",
        periodType: "Yearly",
        dataElements: [],
        disaggregations: [],
    },
];

export class ModuleTestRepository implements ModuleRepository {
    getByIds(): FutureData<Module[]> {
        return Future.success(testModules);
    }
    get(): FutureData<Module[]> {
        return Future.success(testModules);
    }

    getAllBase(_options?: ModulesSortingFilterOptions): FutureData<ModuleBase[]> {
        return Future.success([]);
    }

    getPaginated(_options: ModulesPaginatedOptions): FutureData<ModulesBasePaginated> {
        return Future.success({
            rows: [],
            pagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 },
        });
    }
}
