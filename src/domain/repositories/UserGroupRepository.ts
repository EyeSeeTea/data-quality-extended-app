import { FutureData } from "$/data/api-futures";
import { UserGroup } from "$/domain/entities/UserGroup";

export interface UserGroupRepository {
    getByIdentifiable(identifiable: string): FutureData<UserGroup[]>;
}
