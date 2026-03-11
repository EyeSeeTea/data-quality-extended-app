import { apiToFuture, FutureData } from "$/data/api-futures";
import { Future } from "$/domain/entities/generic/Future";
import {
    IssueNotificationOptions,
    IssueNotificationRepository,
} from "$/domain/repositories/IssueNotificationRepository";
import { D2Api } from "@eyeseetea/d2-api/2.36";

type MessageConversation = {
    id: string;
    subject: string;
};

type IssueNotification = {
    id: string;
    subject: string;
    messages: {
        id: string;
        name: string;
        sender: {
            id: string;
            displayName: string;
        };
    }[];
};
export class IssueNotificationD2Repository implements IssueNotificationRepository {
    constructor(private api: D2Api) {}

    get(conversationId: string): FutureData<IssueNotification> {
        return apiToFuture(
            this.api.messageConversations.d2Api.get<IssueNotification>(
                `/messageConversations/${conversationId}`,
                {
                    fields: "id,subject,messages",
                }
            )
        );
    }

    getMessageConversations(): FutureData<{ messageConversations: MessageConversation[] }> {
        return apiToFuture(
            this.api.messageConversations.d2Api.get<{
                messageConversations: MessageConversation[];
            }>("/messageConversations", {
                fields: "id,subject",
                filter: "messageType:eq:PRIVATE",
                pageSize: 50,
                order: "lastMessage:desc",
            })
        );
    }

    send(notificationOptions: IssueNotificationOptions): FutureData<void> {
        const { issueId, users, userGroups } = notificationOptions;

        // issue number and description and country and period
        // get notiification id here and save to program stage with issue number

        return apiToFuture(
            this.api.messageConversations.post({
                users: users,
                userGroups: userGroups,
                text: issueId,
                subject: generateIssueSubject(issueId),
            })
        ).flatMap(() => {
            return this.getMessageConversations().flatMap(({ messageConversations }) => {
                const savedConversation = messageConversations.find(
                    conversation => conversation.subject === generateIssueSubject(issueId)
                );

                if (savedConversation) {
                    // save conversation id to program stage with issue number
                    console.log({ savedConversation });
                    return Future.success(undefined);
                }

                return Future.error(new Error("Failed to find the saved conversation"));
            });
        });
    }
}

const generateIssueSubject = (issueId: string): string => `Data Quality Issue detected: ${issueId}`;
