import { FutureData } from "$/data/api-futures";
import { Ref } from "$/domain/entities/Ref";

export interface IssueNotificationRepository {
    // get(issueId: string): FutureData<void>;
    send(notificationOptions: IssueNotificationOptions): FutureData<void>;
}

export type IssueNotificationOptions = {
    issueId: string;
    users: Ref[];
    userGroups: Ref[];
};
