import { FutureData } from "$/data/api-futures";
import { Code, Id } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import _ from "$/domain/entities/generic/Collection";
import { SettingsRepository } from "$/domain/repositories/SettingsRepository";
import { SectionSetting } from "$/domain/entities/Settings";

export class GetCategoryDesaggregationsUseCase {
    constructor(private settingsRepository: SettingsRepository) {}

    execute(sectionId: Id, selectedQualityIssuesProgramCode: Code): FutureData<SectionSetting> {
        return this.settingsRepository.get(selectedQualityIssuesProgramCode).flatMap(settings => {
            const sectionSettings = settings.sections?.find(section => section.id === sectionId);
            if (!sectionSettings)
                return Future.error(new Error(`Cannot found settigs for section: ${sectionId}`));
            return Future.success(sectionSettings);
        });
    }
}
