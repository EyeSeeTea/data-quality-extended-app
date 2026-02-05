import _ from "lodash";
import { D2Api, MetadataPick } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { QualityIssuesProgramRepository } from "$/domain/repositories/QualityIssuesProgramRepository";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { DATA_QUALITY_NAMESPACE, dataStoreKeys } from "$/data/common/DataStoreConfig";
import { Code } from "$/domain/entities/Ref";
import { DatastoreProgram } from "$/data/repositories/entities/DatastoreProgram";

const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_PAGE_SIZE = 100;

export class QualityIssuesProgramD2Repository implements QualityIssuesProgramRepository {
    constructor(private api: D2Api) {}

    getAllConfigured(): FutureData<QualityIssuesProgram[]> {
        return this.getProgramsFromDatastore().flatMap(qualityIssuesProgramDatastore => {
            return this.getProgramsByChunkedCodes(
                qualityIssuesProgramDatastore.map((program): Code => program.code)
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
        qualityIssuesProgramDatastore: DatastoreProgram[]
    ): QualityIssuesProgram[] {
        return programs.map(program => {
            const modules =
                qualityIssuesProgramDatastore.find(
                    (programDatastore: DatastoreProgram) => programDatastore.code === program.code
                )?.dataSets || [];

            const sections = program.programStages.map(stage => ({
                id: stage.id,
                name: stage.name,
            }));
            return {
                id: program.id,
                name: program.name,
                code: program.code,
                modules: modules,
                sections: sections,
            };
        });
    }

    private getProgramsFromDatastore(): FutureData<DatastoreProgram[]> {
        const dataStore = this.api.dataStore(DATA_QUALITY_NAMESPACE);

        return apiToFuture(dataStore.get<DatastoreProgram[]>(dataStoreKeys.PROGRAMS)).flatMap(
            programs => {
                if (programs) return Future.success(programs);

                const empty: DatastoreProgram[] = [];
                return apiToFuture(dataStore.save(dataStoreKeys.PROGRAMS, empty))
                    .map(() => empty)
                    .mapError(
                        err => new Error(`Cannot init programs in datastore. ${String(err)}`)
                    );
            }
        );
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
                ).map(programsResponse => programsResponse.objects);
            })
        ).map(listOfPrograms => _(listOfPrograms).flatten().value());
    }

    private getAllDataQualityIssuesPrograms(): FutureData<D2Program[]> {
        const programs: D2Program[] = [];
        const pageSize = DEFAULT_PAGE_SIZE;
        const firstPage = 1;

        const fetchPage = (page: number, accPrograms: D2Program[]): FutureData<D2Program[]> => {
            return apiToFuture(
                this.api.models.programs.get({
                    fields: programFields,
                    totalPages: true,
                    pageSize: pageSize,
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
                const nextAccPrograms = [...accPrograms, ...apiPrograms];

                const pager = response.pager;
                const pageCount = pager.pageCount;
                const nextPage = (pager.page ?? page) + 1;

                if (pageCount !== undefined && nextPage <= pageCount) {
                    return fetchPage(nextPage, nextAccPrograms);
                }

                return Future.success(nextAccPrograms);
            });
        };

        return fetchPage(firstPage, programs);
    }
}

const programFields = {
    id: true,
    code: true,
    name: true,
    programStages: {
        id: true,
        name: true,
    },
} as const;

type D2Program = MetadataPick<{
    programs: { fields: typeof programFields };
}>["programs"][number];
