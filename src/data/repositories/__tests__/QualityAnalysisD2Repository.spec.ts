import { afterEach, describe, expect, it } from "vitest";
import { getMockApi } from "$/types/d2-api";
import { QualityAnalysisD2Repository } from "$/data/repositories/QualityAnalysisD2Repository";

const mockApi = getMockApi();

const programCode = "DQ_ANALYSIS";
const trackedEntitiesUrl = "/tracker/trackedEntities";

type TrackedEntityBody = { trackedEntity: string };

// DHIS2 2.42+ returns the pagination only inside "pager", with no pageCount at the root
function trackedEntitiesPage(page: number, ids: string[]) {
    return {
        pager: { page, pageSize: 2, total: 3, pageCount: 2 },
        trackedEntities: ids.map(trackedEntity => ({ trackedEntity })),
    };
}

function givenADHIS2WithAnalysesInTwoPages() {
    const { mock } = mockApi;

    mock.onGet("/programs").reply(200, { programs: [{ id: "programId" }] });
    mock.onGet("/organisationUnits").reply(200, { organisationUnits: [{ id: "globalOrgUnitId" }] });

    mock.onGet(trackedEntitiesUrl).reply(config => {
        const page = config.params.page;
        return [
            200,
            page === 1
                ? trackedEntitiesPage(1, ["tei1", "tei2"])
                : trackedEntitiesPage(2, ["tei3"]),
        ];
    });

    mock.onPost("/tracker").reply(config => {
        const { trackedEntities } = JSON.parse(config.data) as {
            trackedEntities: TrackedEntityBody[];
        };
        return [
            200,
            {
                status: "OK",
                bundleReport: {
                    typeReportMap: {
                        TRACKED_ENTITY: {
                            objectReports: trackedEntities.map(({ trackedEntity }) => ({
                                uid: trackedEntity,
                            })),
                        },
                    },
                },
            },
        ];
    });

    mock.onDelete(/\/dataStore\/data-quality\/.+/).reply(200, {});
}

function whenRemovingAll() {
    return new QualityAnalysisD2Repository(mockApi.api).removeAll(programCode).toPromise();
}

function deletedTrackedEntities(): string[] {
    return (mockApi.mock.history.post ?? []).flatMap(request =>
        (JSON.parse(request.data).trackedEntities as TrackedEntityBody[]).map(t => t.trackedEntity)
    );
}

function deletedDataStoreKeys(): string[] {
    return (mockApi.mock.history.delete ?? []).map(request => request.url?.split("/").pop() ?? "");
}

describe("QualityAnalysisD2Repository.removeAll", () => {
    afterEach(() => mockApi.mock.reset());

    it("deletes the analyses of every page when the response only has pager (DHIS2 2.42+)", async () => {
        givenADHIS2WithAnalysesInTwoPages();

        await whenRemovingAll();

        expect(deletedTrackedEntities()).toEqual(["tei1", "tei2", "tei3"]);
    });

    it("also deletes the dataStore entry of each analysis", async () => {
        givenADHIS2WithAnalysesInTwoPages();

        await whenRemovingAll();

        expect(deletedDataStoreKeys()).toEqual(["tei1", "tei2", "tei3"]);
    });
});
