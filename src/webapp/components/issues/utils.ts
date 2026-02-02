import { NHWAUserGroups } from "$/domain/entities/MetadataItem";
import { Maybe } from "$/utils/ts-utils";

export function hasUserGroups(userGroups: Maybe<NHWAUserGroups>): boolean {
    return !!userGroups && Object.keys(userGroups).length > 0;
}
