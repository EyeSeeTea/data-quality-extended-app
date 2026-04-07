import { FutureData } from "$/data/api-futures";
import { Code } from "$/domain/entities/Ref";
import { Settings } from "$/domain/entities/Settings";

export interface SettingsRepository {
    get(selectedQualityIssuesProgramCode: Code): FutureData<Settings>;
}
