import { FutureData } from "$/data/api-futures";
import { MetadataRepository } from "$/domain/repositories/MetadataRepository";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Code } from "$/domain/entities/Ref";

export class MetadataTestRepository implements MetadataRepository {
    get(_selectedQualityIssuesProgramCode: Code): FutureData<MetadataItem> {
        throw new Error("Method not implemented.");
    }
}
