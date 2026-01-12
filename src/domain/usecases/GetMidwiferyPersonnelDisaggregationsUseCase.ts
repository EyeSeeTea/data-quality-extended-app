import { Code, Id } from "$/domain/entities/Ref";
import { SectionDisaggregation } from "$/domain/entities/Settings";
import { SettingsRepository } from "$/domain/repositories/SettingsRepository";
import { Future } from "$/domain/entities/generic/Future";
import _ from "$/domain/entities/generic/Collection";
import { FutureData } from "$/data/api-futures";

export class GetMidwiferyPersonnelDisaggregationsUseCase {
    constructor(private settingsRepository: SettingsRepository) {}

    execute(sectionId: Id, qualityIssuesProgramCode: Code): FutureData<SectionDisaggregation[]> {
        return this.settingsRepository.get(qualityIssuesProgramCode).flatMap(settings => {
            const section = settings.sections?.find(section => section.id === sectionId);
            if (!section)
                return Future.error(new Error(`Cannot found section settings: ${sectionId}`));
            const disaggregationsSorted = _(section.disaggregations)
                .sortBy(disaggregation => disaggregation.name)
                .value();
            return Future.success(disaggregationsSorted);
        });
    }
}
