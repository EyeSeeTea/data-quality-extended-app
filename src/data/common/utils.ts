import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Id } from "$/domain/entities/Ref";

export function getProgramStageIndexById(programStageId: Id, metadata: MetadataItem): number {
    const programStageIndex = metadata.programs.qualityIssues.programStages.findIndex(
        programStage => programStage.id === programStageId
    );
    if (programStageIndex === -1) throw Error(`Cannot found programStage: ${programStageId}`);
    return programStageIndex;
}
