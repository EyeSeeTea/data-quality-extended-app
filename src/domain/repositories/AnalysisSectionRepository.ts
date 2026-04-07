import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";

export interface AnalysisSectionRepository {
    get(metadata: MetadataItem): FutureData<QualityAnalysisSection[]>;
}
