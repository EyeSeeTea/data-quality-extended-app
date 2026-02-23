import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Code } from "$/domain/entities/Ref";
import { MetadataRepository } from "$/domain/repositories/MetadataRepository";

export class GetMetadataItemUseCase {
    constructor(private metadataRepository: MetadataRepository) {}

    execute(selectedQualityIssuesProgramCode: Code): FutureData<MetadataItem> {
        return this.metadataRepository.get(selectedQualityIssuesProgramCode);
    }
}
