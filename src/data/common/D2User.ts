import { UserGroup } from "$/domain/entities/UserGroup";
import { Future } from "$/domain/entities/generic/Future";
import { User } from "$/domain/entities/User";
import { D2Api, MetadataPick } from "$/types/d2-api";
import { apiToFuture, FutureData } from "$/data/api-futures";
import _ from "$/domain/entities/generic/Collection";

export class D2User {
    constructor(private api: D2Api) {}

    getByIds(ids: string[]): FutureData<User[]> {
        const $requests = Future.sequential(
            _(ids)
                .chunk(50)
                .map(usersIds => {
                    return apiToFuture(
                        this.api.models.users.get({
                            fields: userFields,
                            filter: { id: { in: usersIds } },
                            paging: false,
                        })
                    ).map(d2Response => {
                        return d2Response.objects.map((d2User): User => {
                            return this.buildUser(d2User);
                        });
                    });
                })
                .value()
        );

        return Future.sequential([$requests]).flatMap(users => {
            const first = _(users).first();
            if (!first) return Future.success([]);
            const allUsers = _(first).flatten().value();
            return Future.success(allUsers);
        });
    }

    getCurrent(): FutureData<User> {
        return apiToFuture(this.api.currentUser.get({ fields: userFields })).map(d2User => {
            return this.buildUser(d2User);
        });
    }

    getByUsernames(userIds: string[]): FutureData<User[]> {
        return apiToFuture(
            this.api.models.users
                .get({ fields: userFields, filter: { username: { in: userIds } } })
                .map(d2Response => {
                    return d2Response.data.objects.map(d2User => {
                        return this.buildUser(d2User);
                    });
                })
        );
    }

    private buildUser(d2User: D2UserEntity) {
        const readAccessCountries = d2User.teiSearchOrganisationUnits.map(d2OrgUnit => {
            return { ...d2OrgUnit, writeAccess: false };
        });
        const writeAccessCountries = d2User.organisationUnits.map(d2OrgUnit => {
            return { ...d2OrgUnit, writeAccess: true };
        });
        return new User({
            id: d2User.id,
            name: d2User.displayName,
            userGroups: d2User.userGroups.map(d2UserGroup => {
                return UserGroup.build({
                    id: d2UserGroup.id,
                    name: d2UserGroup.name,
                    usersIds: d2UserGroup.users.map(d2User => d2User.id),
                }).get();
            }),
            countries: [...readAccessCountries, ...writeAccessCountries],
            email: d2User.email,
            // @ts-expect-error - upgrade d2-api for up-to-date types
            lastLogin: d2User.lastLogin,
            // @ts-expect-error - upgrade d2-api for up-to-date types
            username: d2User.username,
            // @ts-expect-error - upgrade d2-api for up-to-date types
            userRoles: d2User.userRoles,
        });
    }
}

const userFields = {
    id: true,
    displayName: true,
    email: true,
    userGroups: { id: true, name: true, users: true },
    lastLogin: true,
    username: true,
    userRoles: { id: true, name: true, authorities: true },
    teiSearchOrganisationUnits: { id: true, name: true, path: true },
    organisationUnits: { id: true, name: true, path: true },
} as const;

type D2UserEntity = MetadataPick<{ users: { fields: typeof userFields } }>["users"][number];
