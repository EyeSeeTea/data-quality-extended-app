import { User } from "$/domain/entities/User";
import { UserRepository } from "$/domain/repositories/UserRepository";
import { D2Api } from "$/types/d2-api";
import { FutureData } from "$/data/api-futures";
import { D2User } from "$/data/common/D2User";

export class UserD2Repository implements UserRepository {
    private d2User: D2User;
    constructor(private api: D2Api) {
        this.d2User = new D2User(this.api);
    }

    getByIds(ids: string[]): FutureData<User[]> {
        return this.d2User.getByIds(ids);
    }

    getByIdentifiable(identifiable: string): FutureData<User[]> {
        return this.d2User.getByIdentifiable(identifiable);
    }

    public getCurrent(): FutureData<User> {
        return this.d2User.getCurrent();
    }

    public getByUsernames(userIds: string[]): FutureData<User[]> {
        return this.d2User.getByUsernames(userIds);
    }
}
