import { FutureData } from "$/data/api-futures";
import {
    NotificationOptions,
    NotificationRepository,
} from "$/domain/repositories/NotificationRepository";

export class SendNotificationUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    execute(options: NotificationOptions): FutureData<void> {
        return this.notificationRepository.send(options);
    }
}
