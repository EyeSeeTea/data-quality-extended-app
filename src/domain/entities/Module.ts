import { DataElement } from "./DataElement";
import { PeriodType } from "./PeriodType";
import { NamedCodeRef, NamedRef } from "./Ref";

type ModuleExtra = {
    dataElements: DataElement[];
    disaggregations: NamedRef[];
};

export type ModuleBase = NamedCodeRef & {
    periodType: PeriodType;
};

export type Module = ModuleBase & ModuleExtra;
