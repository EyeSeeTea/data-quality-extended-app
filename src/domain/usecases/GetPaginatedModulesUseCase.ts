import { FutureData } from "$/data/api-futures";
import {
    ModuleRepository,
    ModulesBasePaginated,
    ModulesPaginatedOptions,
} from "$/domain/repositories/ModuleRepository";

export class GetPaginatedModulesUseCase {
    constructor(private moduleRepository: ModuleRepository) {}

    execute(options: ModulesPaginatedOptions): FutureData<ModulesBasePaginated> {
        return this.moduleRepository.getPaginated(options);
    }
}
