import { FutureData } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { User } from "$/domain/entities/User";
import { UserGroup } from "$/domain/entities/UserGroup";
import { UserGroupRepository } from "$/domain/repositories/UserGroupRepository";
import { UserRepository } from "$/domain/repositories/UserRepository";
import { NamedRef } from "@eyeseetea/d2-logger/domain/entities/Base";

export class GetUserByIdentifiableUseCase {
    constructor(
        private userRepository: UserRepository,
        private userGroupRepository: UserGroupRepository
    ) {}

    execute(identifiable: string): FutureData<SearchResult[]> {
        return Future.join2(
            this.userRepository.getByIdentifiable(identifiable),
            this.userGroupRepository.getByIdentifiable(identifiable)
        ).flatMap(([users, userGroups]) => Future.success(mapSearchResults(users, userGroups)));
    }
}

export type SearchResult = NamedRef & { type: "user" | "userGroup" };

export const mapSearchResults = (users: User[], userGroups: UserGroup[]): SearchResult[] => {
    const userResults = users.map(user => ({
        id: user.id,
        name: user.username || user.name,
        type: "user" as const,
    }));
    const userGroupResults = userGroups.map(userGroup => ({
        id: userGroup.id,
        name: userGroup.name,
        type: "userGroup" as const,
    }));
    return [...userResults, ...userGroupResults];
};
