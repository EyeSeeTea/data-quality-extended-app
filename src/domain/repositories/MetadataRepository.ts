import { MetadataItem } from "$/domain/entities/MetadataItem";
import { FutureData } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";

export interface MetadataRepository {
    get(selectedQualityIssuesProgramCode: Code): FutureData<MetadataItem>;
}
