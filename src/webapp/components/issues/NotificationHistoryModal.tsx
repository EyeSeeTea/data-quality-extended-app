import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import React, { useCallback, useState } from "react";
import i18n from "$/utils/i18n";
import { List, ListItem, ListItemText, Typography } from "@material-ui/core";
import { useAppContext } from "$/webapp/contexts/app-context";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { Maybe } from "$/utils/ts-utils";
import { IssueNotification } from "$/domain/entities/IssueNotification";

type NotificationHistoryModalProps = {
    isOpen: boolean;
    issueNotification: Maybe<IssueNotification>;
    closeNotificationHistoryModal: () => void;
};

export const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = React.memo(
    props => {
        const { isOpen, issueNotification, closeNotificationHistoryModal } = props;

        return (
            <ConfirmationDialog
                isOpen={isOpen}
                title={i18n.t("Notification History")}
                onCancel={closeNotificationHistoryModal}
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

export function useIssueNotificationHistory(props: {
    analysisId: string;
    sectionId: Maybe<string>;
}) {
    const { analysisId, sectionId } = props;

    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const [isOpen, setIsOpen] = useState(false);
    const [issueNotification, setIssueNotification] = useState<IssueNotification>();

    const openNotificationHistoryModal = useCallback(
        (compositeId: string) => {
            const [issueId, _issueNumber] = compositeId.split(":");
            if (!issueId) {
                console.error(`Invalid issue id format: ${compositeId}`);
                return;
            }

            compositionRoot.issues.getNotifications
                .execute({
                    analysisId: analysisId,
                    sectionId: sectionId,
                    issueId: issueId,
                    metadata: metadataItem,
                })
                .run(
                    issueNotification => {
                        setIssueNotification(issueNotification);
                        setIsOpen(true);
                    },
                    error => console.error({ error })
                );
        },
        [analysisId, compositionRoot.issues.getNotifications, metadataItem, sectionId]
    );

    const closeNotificationHistoryModal = useCallback(() => {
        setIsOpen(false);
        setIssueNotification(undefined);
    }, []);

    return {
        isOpen,
        issueNotification,
        openNotificationHistoryModal,
        closeNotificationHistoryModal,
    };
}
