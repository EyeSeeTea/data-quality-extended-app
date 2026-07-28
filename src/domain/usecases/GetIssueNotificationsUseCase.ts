import {
    GetIssueNotificationsOptions,
    IssueNotificationRepository,
} from "$/domain/repositories/IssueNotificationRepository";

export class GetIssueNotificationsUseCase {
    constructor(private issueNotificationRepository: IssueNotificationRepository) {}

    execute(options: GetIssueNotificationsOptions) {
        return this.issueNotificationRepository.get(options);
    }
}
