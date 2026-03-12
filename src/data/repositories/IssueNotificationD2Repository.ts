import { apiToFuture, FutureData } from "$/data/api-futures";
import { buildTrackerEventsResponse, buildTrackerResponse } from "$/data/common/utils";
import _c from "$/domain/entities/generic/Collection";
import { Future } from "$/domain/entities/generic/Future";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Id, Ref } from "$/domain/entities/Ref";
import {
    GetIssueNotificationsOptions,
    IssueNotificationOptions,
    IssueNotificationRepository,
} from "$/domain/repositories/IssueNotificationRepository";
import { SearchResult } from "$/domain/usecases/GetUserByIdentifierUseCase";
import { D2TrackerEvent, D2TrackerTrackedEntity } from "$/types/d2-api";
import { Maybe } from "$/utils/ts-utils";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import _ from "lodash";

type MessageConversation = {
    id: string;
    subject: string;
    lastSender: Ref;
    lastMessage: string;
};

export type IssueNotification = {
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

    get(options: GetIssueNotificationsOptions): FutureData<IssueNotification> {
        return this.getConversationIdFromEvent(options).flatMap(conversationId =>
            apiToFuture(
                this.api.messageConversations.d2Api.get<IssueNotification>(
                    `/messageConversations/${conversationId}`,
                    {
                        fields: "id,subject,messages[*,sender[id,displayName]]",
                    }
                )
            )
        );
    }

    private getConversationIdFromEvent(options: GetIssueNotificationsOptions): FutureData<string> {
        const { analysisId, sectionId, issueId, metadata } = options;
        const firstPage = 1;
        const events: D2TrackerEvent[] = [];

        const fetchPage = (
            page: number,
            accEvents: D2TrackerEvent[]
        ): FutureData<D2TrackerEvent[]> => {
            return apiToFuture(
                this.api.tracker.events.get({
                    programStage: sectionId,
                    fields: { dataValues: true, event: true, programStage: true },
                    totalPages: true,
                    trackedEntity: analysisId,
                    pageSize: 50,
                    event: issueId,
                })
            ).flatMap(response => {
                const events = buildTrackerEventsResponse(response).instances;
                const nextAccEvents = [...accEvents, ...events];

                // @ts-ignore. The d2-api types should be updated to reflect that pageCount is always returned when totalPages is true
                const pageCount = response.pageCount;
                const nextPage = (response.page ?? page) + 1;

                if (pageCount !== undefined && nextPage <= pageCount) {
                    return fetchPage(nextPage, nextAccEvents);
                }

                return Future.success(nextAccEvents);
            });
        };

        return fetchPage(firstPage, events).flatMap(events => {
            const dataValues = events[0]?.dataValues;
            const conversationId = dataValues?.find(
                dataValue => dataValue.dataElement === metadata.dataElements.conversationId?.id
            )?.value;

            if (!conversationId)
                return Future.error(
                    new Error("Conversation ID not found. No notifications sent yet.")
                );
            return Future.success(conversationId);
        });
    }

    private getMessageConversations(): FutureData<{ messageConversations: MessageConversation[] }> {
        return apiToFuture(
            this.api.messageConversations.d2Api.get<{
                messageConversations: MessageConversation[];
            }>("/messageConversations", {
                fields: "id,subject,lastSender[id],lastMessage",
                filter: "messageType:eq:PRIVATE",
                pageSize: 50,
                order: "lastMessage:desc",
            })
        );
    }

    send(notificationOptions: IssueNotificationOptions): FutureData<void> {
        const { analysisId, sender, message, searchResults, subject, metadata } =
            notificationOptions;

        return Future.join2(
            apiToFuture(
                this.api.tracker.trackedEntities.get({
                    ouMode: "ALL",
                    program: metadata.programs.qualityIssues.id,
                    fields: { $all: true },
                    trackedEntity: analysisId,
                })
            ),
            this.postMessageConversation(searchResults, message, subject)
        ).flatMap(([trackedEntitiesResponse, _]) => {
            const instances = buildTrackerResponse(trackedEntitiesResponse).instances;
            const existingTei = instances.find(d2Tei => d2Tei.trackedEntity === analysisId);

            return this.getMessageConversations().flatMap(({ messageConversations }) => {
                // Assuming that the most recent conversation with the same subject and sender is the one related to this issue notification.
                // This is based on the fact that the conversation is created right before sending the message, and there shouldn't be multiple conversations with the same subject and sender in a short period of time.
                const savedConversation = messageConversations.find(
                    conversation =>
                        conversation.subject === subject && conversation.lastSender.id === sender.id
                );

                if (savedConversation) {
                    return this.saveConversationData(
                        metadata,
                        notificationOptions,
                        savedConversation,
                        existingTei
                    );
                }
                return Future.error(new Error("Failed to find the saved conversation"));
            });
        });
    }

    private saveConversationData(
        metadata: MetadataItem,
        notificationOptions: IssueNotificationOptions,
        savedConversation: MessageConversation,
        existingTei: Maybe<D2TrackerTrackedEntity>
    ): FutureData<void> {
        const { sectionId, issueId } = notificationOptions;

        return apiToFuture(
            this.api.tracker.post(
                {},
                {
                    trackedEntities: this.buildTrackedEntityData({
                        metadata,
                        programStage: sectionId,
                        eventId: issueId,
                        conversationId: savedConversation.id,
                        existingTei: existingTei,
                    }),
                }
            )
        ).flatMap(response => {
            if (response.status === "OK") return Future.success(undefined);
            return Future.error(new Error("Failed to save the conversation"));
        });
    }

    private postMessageConversation(
        searchResults: SearchResult[],
        message: string,
        subject: string
    ): Future<Error, void> {
        const [users, userGroups] = _(searchResults)
            .partition(user => user.type === "user")
            .value();

        return apiToFuture(
            this.api.messageConversations.post({
                users: users,
                userGroups: userGroups,
                text: message,
                subject: subject,
            })
        );
    }

    private buildTrackedEntityData(options: {
        conversationId: Id;
        eventId: Id;
        metadata: MetadataItem;
        programStage: Maybe<string>;
        existingTei: Maybe<D2TrackerTrackedEntity>;
    }): D2TrackerTrackedEntity[] {
        const { conversationId, metadata, programStage, eventId, existingTei } = options;
        const firstEnrollment = _c(existingTei?.enrollments || []).first();
        const conversationIdDataElement = metadata.dataElements.conversationId;

        if (!conversationIdDataElement) {
            console.warn(
                "Conversation ID data element is not defined in metadata. Cannot link the conversation to the issue."
            );
            return [];
        }

        return [
            {
                trackedEntity: existingTei?.trackedEntity,
                orgUnit: metadata.organisationUnits.global.id,
                trackedEntityType: metadata.trackedEntityTypes.dataQuality.id,
                enrollments: [
                    {
                        enrolledAt: new Date().toISOString(),
                        program: metadata.programs.qualityIssues.id,
                        orgUnit: metadata.organisationUnits.global.id,
                        enrollment: firstEnrollment?.enrollment || "",
                        createdAt: firstEnrollment?.createdAt || new Date().toISOString(),
                        createdAtClient:
                            firstEnrollment?.createdAtClient || new Date().toISOString(),
                        updatedAt: firstEnrollment?.updatedAt || new Date().toISOString(),
                        updatedAtClient:
                            firstEnrollment?.updatedAtClient || new Date().toISOString(),
                        status: "ACTIVE",
                        orgUnitName: firstEnrollment?.orgUnitName || "",
                        occurredAt: firstEnrollment?.occurredAt || new Date().toISOString(),
                        followUp: firstEnrollment?.followUp || false,
                        deleted: firstEnrollment?.deleted || false,
                        storedBy: firstEnrollment?.storedBy || "",
                        events: [
                            {
                                event: eventId,
                                status: "ACTIVE",
                                program: metadata.programs.qualityIssues.id,
                                orgUnit: metadata.organisationUnits.global.id,
                                programStage: programStage,
                                occurredAt: new Date().toISOString(),
                                dataValues: [
                                    {
                                        dataElement: conversationIdDataElement.id,
                                        value: conversationId,
                                    },
                                ],
                            },
                        ],
                        relationships: [],
                        attributes: [],
                        notes: [],
                    },
                ],
            },
        ];
    }
}
