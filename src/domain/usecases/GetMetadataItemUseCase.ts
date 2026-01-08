import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { MetadataRepository } from "$/domain/repositories/MetadataRepository";

export class GetMetadataItemUseCase {
    constructor(private metadataRepository: MetadataRepository) {}

    execute(): FutureData<MetadataItem> {
        return this.metadataRepository.get();
    }
}
