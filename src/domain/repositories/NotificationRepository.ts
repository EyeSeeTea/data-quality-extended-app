import { FutureData } from "$/data/api-futures";
import { Ref } from "$/domain/entities/Ref";

export interface NotificationRepository {
    // get(issueId: string): FutureData<void>;
    send(notificationOptions: NotificationOptions): FutureData<void>;
}

export type NotificationOptions = {
    issueId: string;
    users: Ref[];
    userGroups: Ref[];
};
