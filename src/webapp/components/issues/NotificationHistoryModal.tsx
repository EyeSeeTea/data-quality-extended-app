import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import React, { useCallback, useState } from "react";
import i18n from "$/utils/i18n";
import { List, ListItem, ListItemText, Typography } from "@material-ui/core";
import { useAppContext } from "$/webapp/contexts/app-context";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { Maybe } from "$/utils/ts-utils";
import { IssueNotification } from "$/domain/entities/IssueNotification";
import { parseQualityAnalysisId } from "$/webapp/components/issues/IssueTable";

type NotificationHistoryModalProps = {
    isOpen: boolean;
    issueNotification: Maybe<IssueNotification>;
    onClose: () => void;
};

export const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = React.memo(
    props => {
        const { isOpen, issueNotification, onClose } = props;

        return (
            <ConfirmationDialog
                isOpen={isOpen}
                title={i18n.t("Notification History")}
                onCancel={onClose}
                cancelText={i18n.t("Close")}
                maxWidth="md"
                fullWidth
            >
                {issueNotification && issueNotification.messages.length > 0 ? (
                    <>
                        <Typography variant="subtitle1" gutterBottom>
                            {issueNotification.subject}
                        </Typography>
                        <List>
                            {issueNotification.messages.map(message => (
                                <ListItem key={message.id} divider>
                                    <ListItemText
                                        primary={message.name}
                                        secondary={i18n.t("Sent by: {{sender}}", {
                                            sender: message.sender.displayName,
                                            nsSeparator: false,
                                        })}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </>
                ) : (
                    <Typography>{i18n.t("No notifications found for this issue.")}</Typography>
                )}
            </ConfirmationDialog>
        );
    }
);

type NotificationHistoryModalState = {
    isOpen: boolean;
    issueNotification: Maybe<IssueNotification>;
};

const emptyNotificationHistoryModalState: NotificationHistoryModalState = {
    isOpen: false,
    issueNotification: undefined,
};

export function useIssueNotificationHistory(props: {
    analysisId: string;
    sectionId: Maybe<string>;
}) {
    const { analysisId, sectionId } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const [modalState, setModalState] = useState<NotificationHistoryModalState>(
        emptyNotificationHistoryModalState
    );

    const openNotificationHistoryModal = useCallback(
        (compositeId: string) => {
            const { issueId } = parseQualityAnalysisId(compositeId);

            compositionRoot.issues.getNotifications
                .execute({
                    analysisId,
                    sectionId,
                    issueId,
                    metadata: metadataItem,
                })
                .run(
                    issueNotification => {
                        setModalState({
                            isOpen: true,
                            issueNotification,
                        });
                    },
                    error => {
                        setModalState({
                            isOpen: true,
                            issueNotification: undefined,
                        });
                        console.error({ error });
                    }
                );
        },
        [analysisId, sectionId, compositionRoot.issues.getNotifications, metadataItem]
    );

    const closeNotificationHistoryModal = useCallback(() => {
        setModalState(emptyNotificationHistoryModalState);
    }, []);

    return {
        openNotificationHistoryModal,
        notificationHistoryModalProps: {
            isOpen: modalState.isOpen,
            issueNotification: modalState.issueNotification,
            onClose: closeNotificationHistoryModal,
        },
    };
}
