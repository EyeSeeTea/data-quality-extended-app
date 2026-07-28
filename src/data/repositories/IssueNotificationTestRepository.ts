import { FutureData } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import { IssueNotification } from "$/domain/entities/IssueNotification";
import {
    IssueNotificationOptions,
    IssueNotificationRepository,
} from "$/domain/repositories/IssueNotificationRepository";

export class IssueNotificationTestRepository implements IssueNotificationRepository {
    get(): FutureData<IssueNotification> {
        return Future.success({
            id: "test-id",
            subject: "Test Issue Notification",
            messages: [
                {
                    id: "test-message-id",
                    name: "Test Message",
                    sender: {
                        id: "test-sender-id",
                        displayName: "Test Sender",
                    },
                },
            ],
        });
    }

    send(_options: IssueNotificationOptions): FutureData<void> {
        return Future.success(undefined);
    }
}
