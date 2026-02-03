import { Id, NamedRef } from "$/domain/entities/Ref";
import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";
import {
    resolveStepTypeFromSectionName,
    StepSettings,
    StepType,
} from "$/domain/entities/StepSettings";

export type Row = {
    sectionId: Id;
    sectionName: string;
    stepType?: StepType;
    customName: string;
    disaggregations?: SectionDisaggregation[];
};

export function buildRows(value: StepSettings[], sections: NamedRef[]): Row[] {
    const bySection = value.reduce(
        (map, step) => map.set(step.sectionId, step),
        new Map<string, StepSettings>()
    );

    const configuredOrderedSectionIds = [...value]
        .sort((a, b) => a.order - b.order)
        .map(step => step.sectionId);

    const allSectionIds = sections.map(section => section.id);

    const remainingSectionIds = allSectionIds.filter(
        id => !configuredOrderedSectionIds.includes(id)
    );

    const sectionIdOrder = [...configuredOrderedSectionIds, ...remainingSectionIds];

    const sectionNameById = new Map(sections.map(section => [section.id, section.name] as const));

    const allRows = sectionIdOrder.map(sectionId => {
        const found = bySection.get(sectionId);
        const sectionName = sectionNameById.get(sectionId) ?? sectionId;

        return {
            sectionId,
            sectionName,
            stepType: resolveStepTypeFromSectionName(sectionName),
            customName: found?.name ?? sectionName,
            disaggregations: found?.disaggregations,
        };
    });

    const configurable = allRows.filter(r => !!r.stepType);
    const nonConfigurable = allRows.filter(r => !r.stepType);

    return [...configurable, ...nonConfigurable];
}

export function rowsToValue(rows: Row[]): StepSettings[] {
    return rows
        .filter((row): row is Row & { stepType: StepType } => !!row.stepType)
        .map((row, index) => ({
            type: row.stepType,
            sectionId: row.sectionId,
            order: index + 1,
            name: row.customName,
            disaggregations: row.disaggregations,
        }));
}
