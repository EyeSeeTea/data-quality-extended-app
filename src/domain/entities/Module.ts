import { DataElement } from "./DataElement";
import { NamedCodeRef, NamedRef } from "./Ref";

type ModuleExtra = {
    dataElements: DataElement[];
    disaggregations: NamedRef[];
};

export type ModuleBase = NamedCodeRef;

export type Module = ModuleBase & ModuleExtra;
