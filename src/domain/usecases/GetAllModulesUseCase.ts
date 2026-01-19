import { FutureData } from "$/data/api-futures";
import { ModuleBase } from "$/domain/entities/Module";
import {
    ModuleRepository,
    ModulesSortingFilterOptions,
} from "$/domain/repositories/ModuleRepository";

export class GetAllModulesUseCase {
    constructor(private moduleRepository: ModuleRepository) {}

    execute(options?: ModulesSortingFilterOptions): FutureData<ModuleBase[]> {
        return this.moduleRepository.getAllBase(options);
    }
}
