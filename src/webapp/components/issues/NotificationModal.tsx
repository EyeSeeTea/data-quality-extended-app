import { ConfirmationDialog, useSnackbar } from "@eyeseetea/d2-ui-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import i18n from "$/utils/i18n";
import { Id } from "$/domain/entities/Ref";
import { useAppContext } from "$/webapp/contexts/app-context";
import _ from "lodash";
import {
    Box,
    Chip,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    InputAdornment,
    IconButton,
    ClickAwayListener,
    CircularProgress,
} from "@material-ui/core";
import { Close as CloseIcon, People as GroupIcon, Person as PersonIcon } from "@material-ui/icons";
import { SearchResult } from "$/domain/usecases/GetUserByIdentifierUseCase";
import { Maybe } from "$/utils/ts-utils";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";

type NotificationModalProps = {
    filteredResults: SearchResult[];
    notificationModal: NotificationModalState;
    displaySearchResults: boolean;
    noUsers: boolean;
    searchText: string;
    subject: string;
    message: string;
    selectedUsers: SearchResult[];
    closeNotificationModal: () => void;
    sendNotification: () => void;
    hideList: () => void;
    removeSelectedUser: (id: Id) => void;
    updateSearchText: (value: string) => void;
    updateSubject: (value: string) => void;
    updateMessage: (value: string) => void;
    updateSelectedUsers: (user: SearchResult) => void;
    loading: boolean;
    sending: boolean;
};

export const NotificationModal: React.FC<NotificationModalProps> = React.memo(props => {
    const {
        filteredResults,
        displaySearchResults,
        loading,
        notificationModal,
        noUsers,
        searchText,
        subject,
        message,
        selectedUsers,
        sending,
        closeNotificationModal,
        sendNotification,
        hideList,
        removeSelectedUser,
        updateSearchText,
        updateSubject,
        updateMessage,
        updateSelectedUsers,
    } = props;

    return (
        <ConfirmationDialog
            isOpen={notificationModal.isOpen}
            title={i18n.t(`New notification for issue ${notificationModal.issueNumber}`)}
            description={i18n.t("Select users and user groups to notify about this issue")}
            onCancel={closeNotificationModal}
            onSave={sendNotification}
            saveText={i18n.t("Send notification")}
            cancelText={i18n.t("Cancel")}
            maxWidth="lg"
            disableSave={
                sending || selectedUsers.length === 0 || !subject.trim() || !message.trim()
            }
            fullWidth
        >
            <Box position="relative" mb={2}>
                {selectedUsers.length > 0 && (
                    <Box display="flex" flexWrap="wrap" style={{ gap: 6 }} mb={1}>
                        {selectedUsers.map(user => (
                            <Chip
                                key={user.id}
                                label={user.name}
                                size="small"
                                onDelete={() => removeSelectedUser(user.id)}
                            />
                        ))}
                    </Box>
                )}

                <TextField
                    fullWidth
                    label={i18n.t("To")}
                    value={searchText}
                    onChange={e => updateSearchText(e.target.value)}
                    disabled={loading}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                {loading ? (
                                    <CircularProgress size={20} style={{ marginRight: 8 }} />
                                ) : null}
                                {searchText && (
                                    <IconButton size="small" onClick={hideList}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </InputAdornment>
                        ),
                    }}
                />

                {(displaySearchResults || noUsers) && (
                    <ClickAwayListener onClickAway={hideList}>
                        <Paper
                            elevation={4}
                            style={{
                                maxHeight: 200,
                                overflow: "auto",
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 10,
                                marginTop: 4,
                            }}
                        >
                            {displaySearchResults && (
                                <List>
                                    {filteredResults.map(result => (
                                        <ListItem
                                            button
                                            key={result.id}
                                            onClick={() => updateSelectedUsers(result)}
                                        >
                                            {result.type === "user" ? (
                                                <PersonIcon style={{ marginRight: 12 }} />
                                            ) : result.type === "userGroup" ? (
                                                <GroupIcon style={{ marginRight: 12 }} />
                                            ) : null}
                                            <ListItemText
                                                primary={result.name}
                                                secondary={result.id}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}

                            {noUsers && (
                                <Box
                                    p={2}
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    {i18n.t("No users or user groups found")}
                                </Box>
                            )}
                        </Paper>
                    </ClickAwayListener>
                )}
            </Box>

            <TextField
                fullWidth
                label={i18n.t("Subject")}
                value={subject}
                onChange={e => updateSubject(e.target.value)}
                margin="normal"
            />

            <TextField
                fullWidth
                multiline
                minRows={4}
                label={i18n.t("Message")}
                value={message}
                onChange={e => updateMessage(e.target.value)}
                margin="normal"
            />
        </ConfirmationDialog>
    );
});

type NotificationModalState = {
    isOpen: boolean;
    issueId: Id;
    issueNumber: string;
};

export function useIssueNotification(props: { analysisId: Id; sectionId: Maybe<Id> }) {
    const { analysisId, sectionId } = props;
    const { compositionRoot, currentUser } = useAppContext();
    const snackbar = useSnackbar();
    const { metadataItem } = useMetadataItemContext();

    const [notificationModal, updateNotificationModal] = useState<NotificationModalState>(
        emptyNotificationModalState
    );
    const [searchText, updateSearchText] = useState("");
    const [subject, updateSubject] = useState("");
    const [message, updateMessage] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<SearchResult[]>([]);
    const [isListOpen, setIsListOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [reload, refreshReload] = useState(0);

    const openNotificationModal = useCallback((compositeId: Id) => {
        const [issueId, issueNumber] = compositeId.split(":");
        if (!issueId || !issueNumber) {
            console.error(`Invalid issue id format: ${compositeId}`);
            return;
        }

        updateNotificationModal({
            isOpen: true,
            issueId: issueId,
            issueNumber: issueNumber,
        });
        updateSubject(generateIssueSubject(issueNumber));
        updateMessage("");
    }, []);

    const closeNotificationModal = useCallback(() => {
        updateSearchText("");
        updateSubject("");
        updateMessage("");
        setSearchResults([]);
        setSelectedUsers([]);
        setIsListOpen(false);
        updateNotificationModal({ isOpen: false, issueId: "", issueNumber: "" });
    }, []);

    const sendNotification = useCallback(() => {
        setSending(true);

        compositionRoot.issues.sendNotification
            .execute({
                analysisId: analysisId,
                sectionId: sectionId,
                issueId: notificationModal.issueId,
                issueNumber: notificationModal.issueNumber,
                message: message,
                metadata: metadataItem,
                searchResults: selectedUsers,
                subject: subject,
                sender: currentUser,
            })
            .run(
                () => {
                    setSending(false);
                    snackbar.success(i18n.t("Notification sent successfully"));
                    closeNotificationModal();
                    refreshReload(reload + 1);
                },
                error => {
                    setSending(false);
                    snackbar.error(error.message);
                    closeNotificationModal();
                }
            );
    }, [
        reload,
        compositionRoot.issues.sendNotification,
        analysisId,
        sectionId,
        notificationModal.issueId,
        notificationModal.issueNumber,
        message,
        metadataItem,
        selectedUsers,
        subject,
        currentUser,
        snackbar,
        closeNotificationModal,
    ]);

    const removeSelectedUser = useCallback(
        (id: string) => setSelectedUsers(selectedUsers.filter(user => user.id !== id)),
        [selectedUsers]
    );

    const hideList = useCallback(() => {
        updateSearchText("");
        setIsListOpen(false);
    }, []);

    const debouncedSearch = useMemo(
        () =>
            _.debounce((query: string) => {
                if (query.trim()) {
                    setLoading(true);
                    compositionRoot.issues.searchUserAndUserGroup.execute(query, currentUser).run(
                        results => {
                            setSearchResults(results);
                            setIsListOpen(true);
                            setLoading(false);
                            setHasSearched(true);
                        },
                        error => {
                            console.error("Error searching users:", error.message);
                            setSearchResults([]);
                            setIsListOpen(true);
                            setLoading(false);
                            setHasSearched(true);
                        }
                    );
                } else {
                    setSearchResults([]);
                    setIsListOpen(true);
                    setLoading(false);
                    setHasSearched(false);
                }
            }, 500),
        [compositionRoot.issues.searchUserAndUserGroup, currentUser]
    );

    useEffect(() => {
        debouncedSearch(searchText);

        return () => {
            debouncedSearch.cancel();
        };
    }, [searchText, debouncedSearch]);

    const filteredResults = useMemo(
        () => searchResults.filter(result => !selectedUsers.find(u => u.id === result.id)),
        [searchResults, selectedUsers]
    );

    const displaySearchResults = useMemo(
        () => filteredResults.length > 0 && isListOpen,
        [filteredResults, isListOpen]
    );

    const updateSelectedUsers = useCallback(
        (newUser: SearchResult) => {
            setSelectedUsers([...selectedUsers, newUser]);
        },
        [selectedUsers]
    );

    const noUsers = useMemo(
        () => isListOpen && hasSearched && searchResults.length === 0,
        [isListOpen, hasSearched, searchResults]
    );

    return {
        filteredResults: filteredResults,
        notificationModal: notificationModal,
        noUsers: noUsers,
        searchText: searchText,
        subject: subject,
        message: message,
        selectedUsers: selectedUsers,
        searchResults: searchResults,
        displaySearchResults: displaySearchResults,
        loading: loading,
        sending: sending,
        reload: reload,
        closeNotificationModal: closeNotificationModal,
        sendNotification: sendNotification,
        hideList: hideList,
        openNotificationModal: openNotificationModal,
        removeSelectedUser: removeSelectedUser,
        updateSearchText: updateSearchText,
        updateSubject: updateSubject,
        updateMessage: updateMessage,
        updateSelectedUsers: updateSelectedUsers,
    };
}

const generateIssueSubject = (issueNumber: string): string =>
    i18n.t("Data Quality Issue detected: {{issueNumber}}", {
        issueNumber: issueNumber,
        nsSeparator: false,
    });

const emptyNotificationModalState = {
    isOpen: false,
    issueId: "",
    issueNumber: "",
};
