import _ from "lodash";
import { D2Api, MetadataPick } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { QualityIssuesProgramRepository } from "$/domain/repositories/QualityIssuesProgramRepository";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { DATA_QUALITY_NAMESPACE, dataStoreKeys } from "$/data/common/DataStoreConfig";
import { Code } from "$/domain/entities/Ref";

const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_PAGE_SIZE = 100;

export class QualityIssuesProgramD2Repository implements QualityIssuesProgramRepository {
    constructor(private api: D2Api) {}

    getAllConfigured(): FutureData<QualityIssuesProgram[]> {
        return this.getProgramsFromDatastore().flatMap(qualityIssuesProgramDatastore => {
            return this.getProgramsByChunkedCodes(
                qualityIssuesProgramDatastore.map(
                    (program: QualityIssuesProgramDatastore): Code => program.code
                )
            ).flatMap(programs => {
                return Future.success(
                    this.buildQualityIssuesPrograms(programs, qualityIssuesProgramDatastore)
                );
            });
        });
    }

    getAll(): FutureData<QualityIssuesProgram[]> {
        return this.getProgramsFromDatastore().flatMap(qualityIssuesProgramDatastore => {
            return this.getAllDataQualityIssuesPrograms().flatMap(allPrograms => {
                return Future.success(
                    this.buildQualityIssuesPrograms(allPrograms, qualityIssuesProgramDatastore)
                );
            });
        });
    }

    private buildQualityIssuesPrograms(
        programs: D2Program[],
        qualityIssuesProgramDatastore: QualityIssuesProgramDatastore[]
    ): QualityIssuesProgram[] {
        return programs.map(program => {
            const modules =
                qualityIssuesProgramDatastore.find(
                    (programDatastore: QualityIssuesProgramDatastore) =>
                        programDatastore.code === program.code
                )?.dataSets || [];
            return {
                id: program.id,
                name: program.name,
                code: program.code,
                modules: modules,
            };
        });
    }

    private getProgramsFromDatastore(): FutureData<QualityIssuesProgramDatastore[]> {
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
            return Future.success(qualityIssuesProgramDatastore);
        });
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

    private getAllDataQualityIssuesPrograms(): FutureData<D2Program[]> {
        const programs: D2Program[] = [];
        let page = 1;
        let pageCount: number | undefined;

        const fetchPage = (): FutureData<D2Program[]> => {
            return apiToFuture(
                this.api.models.programs.get({
                    fields: programFields,
                    totalPages: true,
                    pageSize: DEFAULT_PAGE_SIZE,
                    page: page,
                    filter: {
                        code: {
                            like: "DQI",
                        },
                    },
                    programStatus: "ACTIVE",
                })
            ).flatMap(response => {
                const apiPrograms: D2Program[] = response.objects ?? [];
                programs.push(...apiPrograms);

                const pager = response.pager ?? response;
                pageCount = pager.pageCount;
                page = pager.page + 1;

                if (pageCount !== undefined && page <= pageCount) {
                    return fetchPage();
                }

                return Future.success(programs);
            });
        };

        return fetchPage();
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
    dataSets: Code[];
};
