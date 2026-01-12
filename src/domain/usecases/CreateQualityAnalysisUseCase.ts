import { Id } from "$/domain/entities/Ref";
import { getUid } from "$/utils/uid";
import { FutureData } from "$/data/api-futures";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { getErrors } from "$/domain/entities/generic/Errors";
import { Future } from "$/domain/entities/generic/Future";
import { AnalysisSectionRepository } from "$/domain/repositories/AnalysisSectionRepository";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import { SequentialRepository } from "$/domain/repositories/SequentialRepository";
import { SettingsRepository } from "$/domain/repositories/SettingsRepository";
import { UserRepository } from "$/domain/repositories/UserRepository";
import { MetadataItem } from "$/domain/entities/MetadataItem";

const previousYear = (new Date().getFullYear() - 1).toString();

export class CreateQualityAnalysisUseCase {
    constructor(
        private qualityAnalysisRepository: QualityAnalysisRepository,
        private userRepository: UserRepository,
        private settingsRepository: SettingsRepository,
        private analysisSectionRepository: AnalysisSectionRepository,
        private sequentialRepository: SequentialRepository
    ) {}

    execute(options: CreateQualityAnalysisOptions): FutureData<Id> {
        return Future.joinObj({
            currentUser: this.userRepository.getCurrent(),
            defaultSettings: this.settingsRepository.get(
                options.metadata.programs.qualityIssues.code
            ),
            sections: this.analysisSectionRepository.get(options.metadata),
            sequential: this.sequentialRepository.get(options.metadata),
        }).flatMap(({ currentUser, defaultSettings, sections, sequential }) => {
            const qualityAnalysisName = QualityAnalysis.buildDefaultName(
                options.qualityAnalysis.name,
                currentUser.username
            );

            return QualityAnalysis.build({
                endDate: previousYear,
                id: getUid(`quality-analysis_${new Date().getTime()}`),
                module: options.qualityAnalysis.module,
                name: qualityAnalysisName,
                sections: sections.map(section => {
                    return QualityAnalysisSection.create({
                        ...section,
                        status: QualityAnalysisSection.getInitialStatus(),
                    });
                }),
                startDate: previousYear,
                status: "In Progress",
                lastModification: "",
                countriesAnalysis: defaultSettings.countryIds,
                sequential: { value: `DQ-${sequential.value}` },
            }).match({
                error: errors => {
                    const errorMessages = getErrors(errors);
                    return Future.error(new Error(errorMessages));
                },
                success: entity => {
                    return this.qualityAnalysisRepository
                        .save([entity], options.metadata)
                        .map(() => entity.id);
                },
            });
        });
    }
}

type CreateQualityAnalysisOptions = {
    qualityAnalysis: Pick<QualityAnalysis, "name" | "module">;
    metadata: MetadataItem;
};
