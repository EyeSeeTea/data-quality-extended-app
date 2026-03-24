type Message = {
    id: string;
    name: string;
    sender: {
        id: string;
        displayName: string;
    };
};

export type IssueNotification = {
    id: string;
    subject: string;
    messages: Message[];
};
