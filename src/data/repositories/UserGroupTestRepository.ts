import { FutureData } from "$/data/api-futures";
import { UserGroup } from "$/domain/entities/UserGroup";
import { UserGroupRepository } from "$/domain/repositories/UserGroupRepository";

export class UserGroupTestRepository implements UserGroupRepository {
    getByIdentifiable(): FutureData<UserGroup[]> {
        throw new Error("Method not implemented.");
    }
}
