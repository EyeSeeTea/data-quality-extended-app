import { FutureData } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { Id } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import { IssueRepository } from "$/domain/repositories/IssueRepository";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import { SettingsRepository } from "$/domain/repositories/SettingsRepository";
import { Maybe } from "$/utils/ts-utils";

export function getAnalysisAndDefaultSettings(
    qualityAnalysisRepository: QualityAnalysisRepository,
    settingsRepository: SettingsRepository,
    id: Id,
    metadata: MetadataItem
) {
    return Future.joinObj({
        analysis: getQualityAnalysis(qualityAnalysisRepository, id, metadata),
        defaultSettings: settingsRepository.get(),
    });
}

function getQualityAnalysis(
    analysisRepository: QualityAnalysisRepository,
    id: Id,
    metadata: MetadataItem
): FutureData<QualityAnalysis> {
    return analysisRepository.getById(id, metadata).map(analysis => {
        return analysis;
    });
}

export function getCurrentSection(
    analysis: QualityAnalysis,
    sectionId: Id
): QualityAnalysisSection {
    const section = analysis.sections.find(section => section.id === sectionId);
    if (!section) throw Error(`Cannot found section: ${sectionId}`);
    return section;
}

export function getIssues(
    issueRepository: IssueRepository,
    analysis: QualityAnalysis,
    sectionName: string,
    metadata: MetadataItem
): FutureData<number> {
    const section = getCurrentSection(analysis, sectionName);
    return issueRepository
        .get({
            filters: {
                actions: undefined,
                countries: [],
                periods: [],
                analysisIds: [analysis.id],
                name: undefined,
                sectionId: section?.id,
                status: undefined,
                id: undefined,
                followUp: undefined,
                step: undefined,
                search: undefined,
            },
            pagination: { page: 1, pageSize: 10 },
            sorting: { field: "number", order: "asc" },
            metadata: metadata,
        })
        .map(response => {
            return response.pagination.total;
        });
}

export function convertToNumberOrZero(value: Maybe<string>): number {
    return Number(value) || 0;
}

export function isNumerical(value: Maybe<string>): boolean {
    return !isNaN(Number(value));
}
