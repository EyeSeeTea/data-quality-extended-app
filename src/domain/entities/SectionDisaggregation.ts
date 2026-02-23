import { Id } from "$/domain/entities/Ref";
import { Maybe } from "$/utils/ts-utils";

export type SectionDisaggregation = {
    id: Id;
    disaggregationId: Id;
    name: string;
    type: "combos" | "key_occupations" | "edu_occupations";
    combinations: string[];
    nursingMidwifery: Maybe<string[][]>;
};
