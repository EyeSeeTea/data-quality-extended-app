import { FutureData } from "$/data/api-futures";
import { IssueNotification } from "$/domain/entities/IssueNotification";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Id } from "$/domain/entities/Ref";
import { User } from "$/domain/entities/User";
import { SearchResult } from "$/domain/usecases/GetUserByIdentifierUseCase";
import { Maybe } from "$/utils/ts-utils";

export interface IssueNotificationRepository {
    get(notificationOptions: GetIssueNotificationsOptions): FutureData<IssueNotification>;
    send(notificationOptions: IssueNotificationOptions): FutureData<void>;
}

export type GetIssueNotificationsOptions = {
    analysisId: Id;
    sectionId: Maybe<Id>;
    issueId: Id;
    metadata: MetadataItem;
};

export type IssueNotificationOptions = GetIssueNotificationsOptions & {
    issueNumber: string;
    message: string;
    searchResults: SearchResult[];
    sender: User;
    subject: string;
};
