import _ from "lodash";
import { D2Api, MetadataPick } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { QualityIssuesProgramRepository } from "$/domain/repositories/QualityIssuesProgramRepository";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { DATA_QUALITY_NAMESPACE, dataStoreKeys } from "$/data/common/DataStoreConfig";
import { Code } from "$/domain/entities/Ref";

const DEFAULT_CHUNK_SIZE = 100;

export class QualityIssuesProgramD2Repository implements QualityIssuesProgramRepository {
    constructor(private api: D2Api) {}

    getAll(): FutureData<QualityIssuesProgram[]> {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);
        return apiToFuture(
            dataStore.get<QualityIssuesProgramDatastore[]>(dataStoreKeys.PROGRAMS)
        ).flatMap(qualityIssuesProgramDatastore => {
            if (!qualityIssuesProgramDatastore)
                return Future.error(
                    new Error(
                        `Cannot found ${DATA_QUALITY_NAMESPACE}/${dataStoreKeys.PROGRAMS} in datastore`
                    )
                );

            return this.getProgramsByChunkedCodes(
                qualityIssuesProgramDatastore.map(
                    (program: QualityIssuesProgramDatastore): Code => program.code
                )
            ).flatMap(programs => {
                return Future.success(programs.map(this.buildQualityIssuesProgram));
            });
        });
    }

    private buildQualityIssuesProgram(program: D2Program): QualityIssuesProgram {
        return {
            id: program.id,
            name: program.name,
            code: program.code,
        };
    }

    private getProgramsByChunkedCodes(codes: Code[]): FutureData<D2Program[]> {
        const chunkedCodes = _(codes).chunk(DEFAULT_CHUNK_SIZE).value();

        return Future.sequential(
            chunkedCodes.flatMap(codesChunk => {
                return apiToFuture(
                    this.api.models.programs.get({
                        fields: programFields,
                        filter: {
                            code: { in: codesChunk },
                        },
                        programStatus: "ACTIVE",
                        skipPaging: true,
                    })
                ).flatMap(programsResponse => {
                    return Future.success(programsResponse.objects);
                });
            })
        ).flatMap(listOfPrograms => Future.success(_(listOfPrograms).flatten().value()));
    }
}

const programFields = {
    id: true,
    code: true,
    name: true,
} as const;

type D2Program = MetadataPick<{
    programs: { fields: typeof programFields };
}>["programs"][number];

export type QualityIssuesProgramDatastore = {
    name: string;
    code: string;
};
