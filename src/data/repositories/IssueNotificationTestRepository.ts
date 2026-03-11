import { FutureData } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { IssueNotificationOptions } from "$/domain/repositories/IssueNotificationRepository";

export class IssueNotificationTestRepository {
    send(_options: IssueNotificationOptions): FutureData<void> {
        return Future.success(undefined);
    }
}
