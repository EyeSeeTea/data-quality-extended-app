import { FutureData } from "$/data/api-futures";
import { Module } from "$/domain/entities/Module";
import { ModuleRepository } from "$/domain/repositories/ModuleRepository";
import { Id } from "$/domain/entities/Ref";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export class GetModulesUseCase {
    constructor(private moduleRepository: ModuleRepository) {}

    execute(options: GetModulesOptions): FutureData<Module[]> {
        const { ids, metadata } = options;
        return ids?.length
            ? this.moduleRepository.getByIds(ids)
            : this.moduleRepository.get(metadata);
    }
}

export type GetModulesOptions = {
    ids?: Id[];
    metadata: MetadataItem;
};
