import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Module } from "$/domain/entities/Module";
import { Id } from "$/domain/entities/Ref";

export interface ModuleRepository {
    get(metadata: MetadataItem): FutureData<Module[]>;
    getByIds(ids: Id[]): FutureData<Module[]>;
}
