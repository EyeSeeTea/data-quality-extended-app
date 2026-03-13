import { ConfirmationDialog, useSnackbar } from "@eyeseetea/d2-ui-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import i18n from "$/utils/i18n";
import { Id } from "$/domain/entities/Ref";
import { useAppContext } from "$/webapp/contexts/app-context";
import _ from "lodash";
import {
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
import styled from "styled-components";
import { parseQualityAnalysisId } from "$/webapp/components/issues/IssueTable";

type RecipientSearchProps = {
    selectedUsers: SearchResult[];
    onAddUser: (user: SearchResult) => void;
    onRemoveUser: (id: Id) => void;
};

const RecipientSearch: React.FC<RecipientSearchProps> = React.memo(props => {
    const { selectedUsers, onAddUser, onRemoveUser } = props;
    const { compositionRoot, currentUser } = useAppContext();
    const snackbar = useSnackbar();

    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isListOpen, setIsListOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const hideList = useCallback(() => {
        setSearchText("");
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
                            snackbar.error(`Error searching users: ${error.message}`);
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
        [compositionRoot.issues.searchUserAndUserGroup, currentUser, snackbar]
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
    const noUsers = useMemo(
        () => isListOpen && hasSearched && searchResults.length === 0,
        [isListOpen, hasSearched, searchResults]
    );

    return (
        <SearchBox>
            {selectedUsers.length > 0 && (
                <SelectedUsersContainer>
                    {selectedUsers.map(user => (
                        <Chip
                            key={user.id}
                            label={user.name}
                            size="small"
                            onDelete={() => onRemoveUser(user.id)}
                        />
                    ))}
                </SelectedUsersContainer>
            )}

            <TextField
                fullWidth
                label={i18n.t("To")}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
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
                    <StyledPaper elevation={4}>
                        {displaySearchResults && (
                            <List>
                                {filteredResults.map(result => (
                                    <ListItem
                                        button
                                        key={result.id}
                                        onClick={() => onAddUser(result)}
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
                        )}

                        {noUsers && (
                            <NoUsersContainer>
                                {i18n.t("No users or user groups found")}
                            </NoUsersContainer>
                        )}
                    </StyledPaper>
                </ClickAwayListener>
            )}
        </SearchBox>
    );
});

type NotificationModalProps = {
    analysisId: Id;
    sectionId: Maybe<Id>;
    isOpen: boolean;
    issueId: Id;
    issueNumber: string;
    onClose: () => void;
    onSendSuccess: () => void;
};

export const NotificationModal: React.FC<NotificationModalProps> = React.memo(props => {
    const { analysisId, sectionId, isOpen, issueId, issueNumber, onClose, onSendSuccess } = props;
    const { compositionRoot, currentUser } = useAppContext();
    const snackbar = useSnackbar();
    const { metadataItem } = useMetadataItemContext();

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<SearchResult[]>([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSubject(generatePlaceholderSubject(issueNumber));
            setMessage("");
            setSelectedUsers([]);
        }
    }, [isOpen, issueNumber]);

    const closeModal = useCallback(() => {
        setSubject("");
        setMessage("");
        setSelectedUsers([]);
        onClose();
    }, [onClose]);

    const sendNotification = useCallback(() => {
        setSending(true);

        compositionRoot.issues.sendNotification
            .execute({
                analysisId: analysisId,
                sectionId: sectionId,
                issueId: issueId,
                issueNumber: issueNumber,
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
                    closeModal();
                    onSendSuccess();
                },
                error => {
                    setSending(false);
                    snackbar.error(error.message);
                }
            );
    }, [
        compositionRoot.issues.sendNotification,
        analysisId,
        sectionId,
        issueId,
        issueNumber,
        message,
        metadataItem,
        selectedUsers,
        subject,
        currentUser,
        snackbar,
        closeModal,
        onSendSuccess,
    ]);

    const addUser = useCallback(
        (newUser: SearchResult) => setSelectedUsers(prev => [...prev, newUser]),
        []
    );

    const removeUser = useCallback(
        (id: string) => setSelectedUsers(prev => prev.filter(user => user.id !== id)),
        []
    );

    const disableSave = useMemo(
        () => sending || selectedUsers.length === 0 || !subject.trim() || !message.trim(),
        [sending, selectedUsers, subject, message]
    );

    return (
        <ConfirmationDialog
            isOpen={isOpen}
            title={i18n.t(`New notification for issue ${issueNumber}`)}
            description={i18n.t("Select users and user groups to notify about this issue")}
            onCancel={closeModal}
            onSave={sendNotification}
            saveText={i18n.t("Send notification")}
            cancelText={i18n.t("Cancel")}
            maxWidth="lg"
            disableSave={disableSave}
            fullWidth
        >
            <RecipientSearch
                selectedUsers={selectedUsers}
                onAddUser={addUser}
                onRemoveUser={removeUser}
            />

            <TextField
                fullWidth
                label={i18n.t("Subject")}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                margin="normal"
            />

            <TextField
                fullWidth
                multiline
                minRows={4}
                label={i18n.t("Message")}
                value={message}
                onChange={e => setMessage(e.target.value)}
                margin="normal"
            />
        </ConfirmationDialog>
    );
});

export function useIssueNotification(props: { analysisId: Id; sectionId: Maybe<Id> }) {
    const { analysisId, sectionId } = props;

    const [modalState, setModalState] = useState<NotificationModalState>(
        emptyNotificationModalState
    );
    const [reload, setReload] = useState(0);

    const openNotificationModal = useCallback((compositeId: Id) => {
        const { issueId, issueNumber } = parseQualityAnalysisId(compositeId);

        setModalState({
            isOpen: true,
            issueId: issueId,
            issueNumber: issueNumber,
        });
    }, []);

    const closeNotificationModal = useCallback(() => {
        setModalState(emptyNotificationModalState);
    }, []);

    const onSendSuccess = useCallback(() => {
        setReload(prev => prev + 1);
    }, []);

    return {
        reload,
        openNotificationModal,
        notificationModalProps: {
            analysisId,
            sectionId,
            isOpen: modalState.isOpen,
            issueId: modalState.issueId,
            issueNumber: modalState.issueNumber,
            onClose: closeNotificationModal,
            onSendSuccess,
        },
    };
}

type NotificationModalState = {
    isOpen: boolean;
    issueId: Id;
    issueNumber: string;
};

const generatePlaceholderSubject = (issueNumber: string): string =>
    i18n.t("Data Quality Issue detected: {{issueNumber}}", {
        issueNumber: issueNumber,
        nsSeparator: false,
    });

const emptyNotificationModalState: NotificationModalState = {
    isOpen: false,
    issueId: "",
    issueNumber: "",
};

const SearchBox = styled.div`
    position: relative;
    margin-block-end: 16px;
`;

const SelectedUsersContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-block-end: 8px;
`;

const NoUsersContainer = styled.div`
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const StyledPaper = styled(Paper)`
    max-height: 200px;
    overflow: auto;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    margin-block-start: 4px;
`;
