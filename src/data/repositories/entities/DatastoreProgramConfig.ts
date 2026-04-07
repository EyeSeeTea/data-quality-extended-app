import { Code } from "$/domain/entities/Ref";

type DataElements = {
    action: Code;
    actionDescription: Code;
    azureUrl: Code;
    categoryOption: Code;
    comments: Code;
    contactEmails: Code;
    correlative: Code;
    country: Code;
    dataElement: Code;
    description: Code;
    followUp: Code;
    issueNumber: Code;
    period: Code;
    sectionNumber: Code;
    status: Code;
};

type OptionSets = {
    action: Code;
    status: Code;
};

type Program = {
    qualityIssues: Code;
};

type TrackedEntityAttributes = {
    countries: Code;
    endDate: Code;
    lastModification: Code;
    module: Code;
    name: Code;
    sequential: Code;
    startDate: Code;
    status: Code;
};

type Name = string;
type TrackedEntityType = {
    dataQuality: Name;
};

export type DatastoreProgramConfig = {
    dataElements: DataElements;
    dataSets: Code[];
    optionSets: OptionSets;
    programs: Program;
    trackedEntityAttributes: TrackedEntityAttributes;
    trackedEntityTypes: TrackedEntityType;
};

function extractPrefixFromProgramCode(programCode: Code): string {
    const [prefix] = programCode.split("_DQI_");

    if (!prefix) {
        throw new Error(
            `Invalid programCode format. Expected <PREFIX>_DQI_<number>, got: ${programCode}`
        );
    }

    return prefix;
}

function mapCodes<T extends Record<string, Code>>(obj: T, prefix: string): T {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, value.replace(/^PREFIX/, prefix)])
    ) as T;
}

export function buildProgramConfigByProgramCode(
    template: DatastoreProgramConfig,
    programCode: Code,
    dataSets: Code[]
): DatastoreProgramConfig {
    const prefix = extractPrefixFromProgramCode(programCode);

    return {
        dataElements: mapCodes(template.dataElements, prefix),
        dataSets: dataSets,
        optionSets: mapCodes(template.optionSets, prefix),
        programs: { qualityIssues: programCode },
        trackedEntityAttributes: mapCodes(template.trackedEntityAttributes, prefix),
        trackedEntityTypes: {
            dataQuality: template.trackedEntityTypes.dataQuality.replace(/^PREFIX/, prefix),
        },
    };
}
