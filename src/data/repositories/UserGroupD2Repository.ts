import { apiToFuture, FutureData } from "$/data/api-futures";
import { D2Api } from "$/types/d2-api";
import { Future } from "$/domain/entities/generic/Future";
import { UserGroup } from "$/domain/entities/UserGroup";
import { UserGroupRepository } from "$/domain/repositories/UserGroupRepository";

export class UserGroupD2Repository implements UserGroupRepository {
    constructor(private api: D2Api) {}

    getByIdentifiable(identifier: string): FutureData<UserGroup[]> {
        return apiToFuture(
            this.api.models.userGroups.get({
                filter: {
                    displayName: {
                        token: identifier,
                    },
                },
                fields: {
                    id: true,
                    displayName: true,
                },
            })
        ).flatMap(({ objects }) => {
            const userGroups = objects.map(d2UserGroup => {
                return new UserGroup({
                    id: d2UserGroup.id,
                    name: d2UserGroup.displayName,
                    usersIds: [], // We don't have the users of the group here, and we don't need them for the notification modal, so we can leave it empty
                });
            });

            return Future.success(userGroups);
        });
    }
}
