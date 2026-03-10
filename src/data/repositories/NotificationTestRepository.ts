import { FutureData } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";

export class NotificationTestRepository {
    send(): FutureData<void> {
        return Future.success(undefined);
    }
}
