import { MetadataItem } from "$/domain/entities/MetadataItem";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { Future } from "$/domain/entities/generic/Future";
import { AnalysisSectionRepository } from "$/domain/repositories/AnalysisSectionRepository";
import { FutureData } from "$/data/api-futures";

export class AnalysisSectionD2Repository implements AnalysisSectionRepository {
    get(metadata: MetadataItem): FutureData<QualityAnalysisSection[]> {
        const sections = metadata.programs.qualityIssues.programStages.map(
            (programStage, index) => {
                return QualityAnalysisSection.create({
                    id: programStage.id,
                    description: programStage.description,
                    name: programStage.name,
                    issues: [],
                    position: index + 1,
                    status: "",
                });
            }
        );
        return Future.success(sections);
    }
}
