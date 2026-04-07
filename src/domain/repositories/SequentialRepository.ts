import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Sequential } from "$/domain/entities/Sequential";

export interface SequentialRepository {
    get(metadata: MetadataItem): FutureData<Sequential>;
}
