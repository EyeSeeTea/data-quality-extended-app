import { Future } from "$/domain/entities/generic/Future";
import { FutureData } from "$/data/api-futures";
import { DataQualityIssuesProgramConfigRepository } from "$/domain/repositories/DataQualityIssuesProgramConfigRepository";
import { DataQualityIssuesProgramConfig } from "$/domain/entities/DataQualityIssuesProgramConfig";

export class DataQualityIssuesProgramConfigTestRepository
    implements DataQualityIssuesProgramConfigRepository
{
    save(_configuration: DataQualityIssuesProgramConfig): FutureData<void> {
        return Future.success(undefined);
    }
}
