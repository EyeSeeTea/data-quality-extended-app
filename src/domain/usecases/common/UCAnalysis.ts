import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { Id } from "$/domain/entities/Ref";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";

export class UCAnalysis {
    constructor(private analysisRepository: QualityAnalysisRepository) {}

    getById(id: Id, metadata: MetadataItem): FutureData<QualityAnalysis> {
        return this.analysisRepository.getById(id, metadata);
    }

    updateAnalysis(analysis: QualityAnalysis, sectionId: Id, totalIssues: number): QualityAnalysis {
        return QualityAnalysis.build({
            ...analysis,
            lastModification: new Date().toISOString(),
            sections: analysis.sections.map(section => {
                if (section.id !== sectionId) return section;
                return QualityAnalysisSection.create({
                    ...section,
                    status: totalIssues === 0 ? "success" : "success_with_issues",
                });
            }),
        }).get();
    }
}
