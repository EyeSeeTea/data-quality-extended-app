import { apiToFuture, FutureData } from "$/data/api-futures";
import {
    NotificationOptions,
    NotificationRepository,
} from "$/domain/repositories/NotificationRepository";
import { D2Api } from "@eyeseetea/d2-api/2.36";

export class NotificationD2Repository implements NotificationRepository {
    constructor(private api: D2Api) {}

    send(notificationOptions: NotificationOptions): FutureData<void> {
        const { issueId, users, userGroups } = notificationOptions;
        // send notification and save issue id and notification id to program

        //  this.api.email.sendMessage({
        //     recipients: [userId ?? ""],
        //     subject: "Issue detected with so and so dataset",
        //     text: issueId,
        // });

        // this.api.get("/messageConversations")
        return apiToFuture(
            this.api.messageConversations.post({
                users: users,
                userGroups: userGroups,
                text: issueId,
                subject: "Issue detected with so and so dataset",
            })
        );
    }
}
