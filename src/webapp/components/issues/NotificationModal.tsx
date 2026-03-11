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

type NotificationModalProps = {
    filteredResults: SearchResult[];
    notificationModal: NotificationModalState;
    displaySearchResults: boolean;
    noUsers: boolean;
    searchText: string;
    selectedUsers: SearchResult[];
    closeNotificationModal: () => void;
    sendNotification: () => void;
    hideList: () => void;
    removeSelectedUser: (id: Id) => void;
    updateSearchText: (value: string) => void;
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
        selectedUsers,
        sending,
        closeNotificationModal,
        sendNotification,
        hideList,
        removeSelectedUser,
        updateSearchText,
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
            disableSave={sending || selectedUsers.length === 0}
            fullWidth
        >
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

            {noUsers && (
                <Paper elevation={2} style={{ padding: 16, marginTop: 8 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        {i18n.t("No users or user groups found")}
                    </Box>
                </Paper>
            )}

            {displaySearchResults && (
                <ClickAwayListener onClickAway={hideList}>
                    <Paper
                        elevation={2}
                        style={{
                            maxHeight: 200,
                            overflow: "auto",
                            position: "relative",
                        }}
                    >
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
                                    <ListItemText primary={result.name} secondary={result.id} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </ClickAwayListener>
            )}

            {selectedUsers.length > 0 && (
                <Box display="flex" flexWrap="wrap" mt={1} mb={1} style={{ gap: 8 }}>
                    {selectedUsers.map(user => (
                        <Chip
                            key={user.id}
                            label={user.name}
                            onDelete={() => removeSelectedUser(user.id)}
                        />
                    ))}
                </Box>
            )}
        </ConfirmationDialog>
    );
});

type NotificationModalState = {
    isOpen: boolean;
    issueId: Id;
    issueNumber: string;
};

export function useIssueNotification() {
    const { compositionRoot, currentUser } = useAppContext();
    const snackbar = useSnackbar();

    const [notificationModal, updateNotificationModal] = useState<NotificationModalState>(
        emptyNotificationModalState
    );
    const [searchText, updateSearchText] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<SearchResult[]>([]);
    const [isListOpen, setIsListOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

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
    }, []);

    const closeNotificationModal = useCallback(() => {
        updateSearchText("");
        setSearchResults([]);
        setSelectedUsers([]);
        setIsListOpen(false);
        updateNotificationModal({ isOpen: false, issueId: "", issueNumber: "" });
    }, []);

    const sendNotification = useCallback(() => {
        setSending(true);
        compositionRoot.issues.sendNotification
            .execute({
                issueId: notificationModal.issueNumber,
                users: selectedUsers,
                userGroups: [],
            })
            .run(
                () => {
                    setSending(false);
                    snackbar.success(i18n.t("Notification sent successfully"));
                    closeNotificationModal();
                },
                error => {
                    setSending(false);
                    snackbar.error(error.message);
                    closeNotificationModal();
                }
            );
    }, [
        closeNotificationModal,
        compositionRoot.issues.sendNotification,
        notificationModal.issueNumber,
        selectedUsers,
        snackbar,
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
        selectedUsers: selectedUsers,
        searchResults: searchResults,
        displaySearchResults: displaySearchResults,
        loading: loading,
        sending: sending,
        closeNotificationModal: closeNotificationModal,
        sendNotification: sendNotification,
        hideList: hideList,
        openNotificationModal: openNotificationModal,
        removeSelectedUser: removeSelectedUser,
        updateSearchText: updateSearchText,
        updateSelectedUsers: updateSelectedUsers,
    };
}

const emptyNotificationModalState = {
    isOpen: false,
    issueId: "",
    issueNumber: "",
};
