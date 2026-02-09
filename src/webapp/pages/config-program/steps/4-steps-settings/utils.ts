import { Id, NamedRef } from "$/domain/entities/Ref";
import { SectionDisaggregation } from "$/domain/entities/SectionDisaggregation";
import {
    isStepTypeWithDisagg,
    isStepWithDisagg,
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

export function buildRows(
    value: StepSettings[],
    sections: NamedRef[],
    options?: { isEdit?: boolean }
): Row[] {
    const { isEdit = false } = options ?? {};
    const sectionNameById = new Map(sections.map(section => [section.id, section.name] as const));

    if (isEdit) {
        return [...value]
            .sort((a, b) => a.order - b.order)
            .map(step => {
                const allowsDisaggregations =
                    step.type === "DISAGGREGATES" || step.type === "MISSING_NURSES";

                return {
                    sectionId: step.sectionId,
                    sectionName: sectionNameById.get(step.sectionId) ?? step.sectionId,
                    stepType: step.type,
                    customName: step.name,
                    disaggregations: allowsDisaggregations ? step.disaggregations : undefined,
                };
            });
    }

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

    const allRows = sectionIdOrder.map(sectionId => {
        const found = bySection.get(sectionId);
        const sectionName = sectionNameById.get(sectionId) ?? sectionId;
        const stepType = resolveStepTypeFromSectionName(sectionName);

        return {
            sectionId: sectionId,
            sectionName: sectionName,
            stepType: stepType,
            customName: found?.name ?? sectionName,
            disaggregations: found && isStepWithDisagg(found) ? found?.disaggregations : undefined,
        };
    });

    const configurable = allRows.filter(r => !!r.stepType);
    const nonConfigurable = allRows.filter(r => !r.stepType);

    return [...configurable, ...nonConfigurable];
}

export function rowsToValue(rows: Row[]): StepSettings[] {
    return rows
        .filter((row): row is Row & { stepType: StepType } => !!row.stepType)
        .map((row, index) => {
            const order = index + 1;

            if (isStepTypeWithDisagg(row.stepType)) {
                return {
                    type: row.stepType,
                    sectionId: row.sectionId,
                    order,
                    name: row.customName,
                    disaggregations: row.disaggregations ?? [],
                };
            }

            return {
                type: row.stepType,
                sectionId: row.sectionId,
                order,
                name: row.customName,
            };
        });
}
