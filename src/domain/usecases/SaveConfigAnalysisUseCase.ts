import { Id } from "$/domain/entities/Ref";
import { FutureData } from "$/data/api-futures";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import { getErrors } from "$/domain/entities/generic/Errors";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export class SaveConfigAnalysisUseCase {
    constructor(private qualityAnalysisRepository: QualityAnalysisRepository) {}

    execute(options: SaveQualityAnalysisOptions): FutureData<void> {
        return this.getAnalysis(options.qualityAnalysis.id, options.metadata).flatMap(analysis => {
            const wasExecuted = QualityAnalysis.hasExecutedSections(analysis);
            const qualityAnalysisToSave = wasExecuted
                ? QualityAnalysis.build({ ...analysis, name: options.qualityAnalysis.name }).get()
                : this.updateConfigAnalysis(options.qualityAnalysis);
            return this.qualityAnalysisRepository.save([qualityAnalysisToSave], options.metadata);
        });
    }

    private updateConfigAnalysis(analysis: QualityAnalysis): QualityAnalysis {
        return QualityAnalysis.updateConfiguration(analysis).match({
            success: analysis => analysis,
            error: errors => {
                const errorMessage = getErrors(errors);
                throw new Error(errorMessage);
            },
        });
    }

    private getAnalysis(id: Id, metadata: MetadataItem): FutureData<QualityAnalysis> {
        return this.qualityAnalysisRepository.getById(id, metadata);
    }
}

type SaveQualityAnalysisOptions = { qualityAnalysis: QualityAnalysis; metadata: MetadataItem };
