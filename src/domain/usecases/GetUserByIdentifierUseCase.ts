import { FutureData } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { NamedRef } from "$/domain/entities/Ref";
import { User } from "$/domain/entities/User";
import { UserGroup } from "$/domain/entities/UserGroup";
import { UserGroupRepository } from "$/domain/repositories/UserGroupRepository";
import { UserRepository } from "$/domain/repositories/UserRepository";

export class GetUserByIdentifierUseCase {
    constructor(
        private userRepository: UserRepository,
        private userGroupRepository: UserGroupRepository
    ) {}

    execute(identifier: string, sender: User): FutureData<SearchResult[]> {
        return Future.join2(
            this.userRepository.getByIdentifiable(identifier),
            this.userGroupRepository.getByIdentifiable(identifier)
        ).flatMap(([users, userGroups]) =>
            Future.success(mapSearchResults(users, userGroups, sender))
        );
    }
}

export type SearchResult = NamedRef & { type: "user" | "userGroup" };

export const mapSearchResults = (
    users: User[],
    userGroups: UserGroup[],
    sender: User
): SearchResult[] => {
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

    return [...userResults, ...userGroupResults].filter(user => user.id !== sender.id);
};
