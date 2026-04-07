import { FutureData } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";
import { Settings } from "$/domain/entities/Settings";
import { SettingsRepository } from "$/domain/repositories/SettingsRepository";

export class GetSettingsUseCase {
    constructor(private settingsRepository: SettingsRepository) {}

    execute(selectedQualityIssuesProgramCode: Code): FutureData<Settings> {
        return this.settingsRepository.get(selectedQualityIssuesProgramCode);
    }
}
