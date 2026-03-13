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
