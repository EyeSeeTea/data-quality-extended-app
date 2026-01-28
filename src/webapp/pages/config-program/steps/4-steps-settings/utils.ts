import { Id, NamedRef } from "$/domain/entities/Ref";
import { StepSettings, StepType } from "$/domain/entities/StepSettings";

export type Row = {
    sectionId: Id;
    sectionName: string;
    stepType?: StepType;
};

export function buildRows(value: StepSettings[], sections: NamedRef[]): Row[] {
    const bySection = value.reduce(
        (map, section) => map.set(section.sectionId, section),
        new Map<string, StepSettings>()
    );

    const configuredOrderedSectionIds = [...value]
        .sort((a, b) => a.order - b.order)
        .map(section => section.sectionId);

    const allSectionIds = sections.map(section => section.id);

    const remainingSectionIds = allSectionIds.filter(
        id => !configuredOrderedSectionIds.includes(id)
    );

    const sectionIdOrder = [...configuredOrderedSectionIds, ...remainingSectionIds];

    const sectionNameById = new Map(sections.map(section => [section.id, section.name] as const));

    return sectionIdOrder
        .map(sectionId => {
            const found = bySection.get(sectionId);
            return {
                sectionId: sectionId,
                sectionName: sectionNameById.get(sectionId) ?? sectionId,
                stepType: found?.type,
            };
        })
        .filter(row => !!row.sectionName);
}

export function rowsToValue(rows: Row[]): StepSettings[] {
    return rows
        .filter((row): row is Row & { stepType: StepType } => !!row.stepType)
        .map((row, index) => ({
            type: row.stepType,
            sectionId: row.sectionId,
            order: index + 1,
        }));
}

export function isStepTypeDisabledForRow(stepType: StepType, row: Row, used: StepType[]): boolean {
    if (row.stepType && stepType === row.stepType) return false;
    return used.includes(stepType);
}
