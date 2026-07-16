import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisStatus } from "$/domain/entities/QualityAnalysisStatus";
import { Id } from "$/domain/entities/Ref";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";

export class UpdateStatusAnalysisUseCase {
    constructor(private qualityAnalysisRepository: QualityAnalysisRepository) {}

    execute(ids: Id[], status: QualityAnalysisStatus, metadata: MetadataItem): FutureData<void> {
        return this.qualityAnalysisRepository
            .get({
                filters: {
                    endDate: undefined,
                    module: undefined,
                    name: undefined,
                    startDate: undefined,
                    status: undefined,
                    ids: ids,
                },
                pagination: {
                    page: 1,
                    pageSize: ids.length,
                },
                sorting: {
                    field: "name",
                    order: "desc",
                },
                metadata: metadata,
            })
            .flatMap(response => {
                const updateStatus = response.rows.map(qualityAnalysis => {
                    return QualityAnalysis.build({ ...qualityAnalysis, status: status }).get();
                });
                return this.qualityAnalysisRepository.save(updateStatus, metadata);
            });
    }
}
