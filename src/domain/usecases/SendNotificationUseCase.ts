import { FutureData } from "$/data/api-futures";
import {
    IssueNotificationOptions,
    IssueNotificationRepository,
} from "$/domain/repositories/IssueNotificationRepository";

export class SendNotificationUseCase {
    constructor(private issueNotificationRepository: IssueNotificationRepository) {}

    execute(options: IssueNotificationOptions): FutureData<void> {
        return this.issueNotificationRepository.send(options);
    }
}
