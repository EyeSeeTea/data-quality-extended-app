import { Settings } from "$/domain/entities/Settings";
import { SettingsRepository } from "$/domain/repositories/SettingsRepository";
import { FutureData } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";

export class SettingsTestRepository implements SettingsRepository {
    get(_selectedQualityIssuesProgramCode: Code): FutureData<Settings> {
        throw new Error("Method not implemented.");
    }
}
