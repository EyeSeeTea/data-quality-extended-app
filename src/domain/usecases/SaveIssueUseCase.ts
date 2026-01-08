import { FutureData } from "$/data/api-futures";
import { User } from "$/domain/entities/User";
import { IssueAction } from "$/domain/entities/IssueAction";
import { IssueStatus } from "$/domain/entities/IssueStatus";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { IssuePropertyName, QualityAnalysisIssue } from "$/domain/entities/QualityAnalysisIssue";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { Id } from "$/domain/entities/Ref";
import { Future } from "$/domain/entities/generic/Future";
import { QualityAnalysisRepository } from "$/domain/repositories/QualityAnalysisRepository";
import { UserRepository } from "$/domain/repositories/UserRepository";
import _ from "$/domain/entities/generic/Collection";
import { Maybe } from "$/utils/ts-utils";
import { IssueRepository } from "$/domain/repositories/IssueRepository";

export class SaveIssueUseCase {
    constructor(
        private analysisRepository: QualityAnalysisRepository,
        private issueRepository: IssueRepository,
        private userRepository: UserRepository
    ) {}

    execute(options: SaveIssueOptions): FutureData<SaveIssueResponse> {
        return Future.joinObj({
            analysis: this.getAnalysis(options),
            issue: this.getIssueById(options.issue.id),
        }).flatMap(({ analysis, issue }) => {
            return this.generateContactEmails(analysis, options, issue, options.metadata).flatMap(
                contactEmails => {
                    const issueToUpdate = this.buildIssueWithNewValue(
                        options,
                        issue,
                        contactEmails,
                        options.metadata
                    );
                    const analysisUpdate = QualityAnalysis.build({
                        ...analysis,
                        sections: analysis.sections.map(section => {
                            if (section.id !== issue.type) return section;
                            return QualityAnalysisSection.create({
                                ...section,
                                issues: [issueToUpdate],
                            });
                        }),
                    }).get();

                    return this.analysisRepository.save([analysisUpdate]).flatMap(() => {
                        return Future.success({ contactEmailsChanged: Boolean(contactEmails) });
                    });
                }
            );
        });
    }

    private getIssueById(issueId: Id): FutureData<QualityAnalysisIssue> {
        return this.issueRepository.getById(issueId);
    }

    private generateContactEmails(
        analysis: QualityAnalysis,
        options: SaveIssueOptions,
        issue: QualityAnalysisIssue,
        metadata: MetadataItem
    ): FutureData<Maybe<ContactEmailsUsers>> {
        if (options.propertyToUpdate === "followUp" && options.valueToUpdate === true) {
            const usersIds = this.getUsersIdsFromGroup(analysis, metadata);
            if (usersIds.length === 0) return Future.success(undefined);

            return this.getUsersByIds(usersIds, issue).flatMap(users => {
                const contactEmails = this.getContactEmailsUsers(users);
                return Future.success(contactEmails);
            });
        }
        return Future.success(undefined);
    }

    private getContactEmailsUsers(users: User[]): Maybe<ContactEmailsUsers> {
        const firstUser = _(users).first();
        if (!firstUser) return undefined;
        const ccUsers = users.slice(1);
        return { to: firstUser, cc: ccUsers };
    }

    private getUsersByIds(userIds: Id[], issue: QualityAnalysisIssue): FutureData<User[]> {
        return this.userRepository.getByIds(userIds).flatMap(users => {
            const loggedInUsersWithEmail = this.getLoggedInUsersWithEmail(users);
            const usersInCountry = this.getUsersInIssueCountry(loggedInUsersWithEmail, issue);
            const usersInRegion = this.getUsersInIssueRegion(loggedInUsersWithEmail, issue);
            const targetUsers = usersInCountry.length > 0 ? usersInCountry : usersInRegion;
            return Future.success(targetUsers);
        });
    }

    private getUsersInIssueCountry(users: User[], issue: QualityAnalysisIssue): User[] {
        return _(users)
            .map(user => {
                const userIsInIssueCountry = user.countries.some(
                    country => country.writeAccess && country.id === issue.country?.id
                );
                return userIsInIssueCountry ? user : undefined;
            })
            .compact()
            .value();
    }

    private getUsersInIssueRegion(users: User[], issue: QualityAnalysisIssue): User[] {
        const firstPathSegmentRegex = /[^/]+/;
        return _(users)
            .map(user => {
                const userInIssueRegion = user.countries.some(country => {
                    if (!issue.country) return false;
                    return (
                        country.writeAccess &&
                        firstPathSegmentRegex.test(country.path) ===
                            firstPathSegmentRegex.test(issue.country.path)
                    );
                });
                return userInIssueRegion ? user : undefined;
            })
            .compact()
            .value();
    }

    private getLoggedInUsersWithEmail(users: User[]): User[] {
        return _(users)
            .map(user => {
                if (!user.email || !user.lastLogin) return undefined;
                return user;
            })
            .compact()
            .sortBy(user => user.lastLogin, {
                compareFn: (first, second) => {
                    if (!first || !second) return 0;
                    return first < second ? 1 : first > second ? -1 : 0;
                },
            })
            .value();
    }

    private getUsersIdsFromGroup(analysis: QualityAnalysis, metadata: MetadataItem): Id[] {
        if (analysis.module.name.toLocaleLowerCase().includes("module 1")) {
            return metadata.userGroups.dataCaptureModule1.users.map(user => user.id);
        } else if (analysis.module.name.toLocaleLowerCase().includes("module 2")) {
            return metadata.userGroups.dataCaptureModule2And4.users.map(user => user.id);
        } else {
            return [];
        }
    }

    private buildIssueWithNewValue(
        options: SaveIssueOptions,
        issue: QualityAnalysisIssue,
        contactEmails: Maybe<ContactEmailsUsers>,
        metadata: MetadataItem
    ): QualityAnalysisIssue {
        switch (options.propertyToUpdate) {
            case "azureUrl": {
                if (this.isUrl(options.valueToUpdate as string))
                    return this.setNewValue(issue, options);
                throw Error("Invalid URL");
            }
            case "actionDescription": {
                return this.setNewValue(issue, options);
            }
            case "contactEmails": {
                return this.setNewValue(issue, options);
            }
            case "comments": {
                return this.setNewValue(issue, options);
            }
            case "description": {
                return this.setNewValue(issue, options);
            }
            case "status": {
                const actionSelected = metadata.optionSets.nhwaStatus.options.find(
                    option => option.code === options.valueToUpdate
                );
                if (!actionSelected) return issue;

                return QualityAnalysisIssue.create({
                    ...issue,
                    status: IssueStatus.create(actionSelected),
                });
            }
            case "action": {
                const actionSelected = metadata.optionSets.nhwaAction.options.find(
                    option => option.code === options.valueToUpdate
                );
                if (!actionSelected) return options.issue;

                return QualityAnalysisIssue.create({
                    ...issue,
                    action: IssueAction.create(actionSelected),
                });
            }
            case "followUp": {
                const value = options.valueToUpdate as boolean;
                return QualityAnalysisIssue.create({
                    ...issue,
                    contactEmails: value
                        ? this.getContactEmailsString(contactEmails)
                        : options.issue.contactEmails,
                    followUp: value,
                });
            }
            default:
                return options.issue;
        }
    }

    private getContactEmailsString(contactEmails: Maybe<ContactEmailsUsers>): string {
        if (!contactEmails) return "";
        const to = `TO: ${contactEmails.to.email}`;
        const cc = contactEmails.cc.map(user => user.email).join(";");
        return cc ? `${to} || CC:${cc}` : to;
    }

    private setNewValue(
        issue: QualityAnalysisIssue,
        options: SaveIssueOptions
    ): QualityAnalysisIssue {
        return QualityAnalysisIssue.create({
            ...issue,
            [options.propertyToUpdate]: options.valueToUpdate,
        });
    }

    private getAnalysis(options: SaveIssueOptions): FutureData<QualityAnalysis> {
        return this.analysisRepository.getById(options.analysisId);
    }

    private isUrl(value: string): boolean {
        if (!value) return true;
        // Expresión regular para validar una URL
        const regex = /^(http|https):\/\/[^ "]+$/;

        // Verifica si el texto coincide con la expresión regular
        return regex.test(value);
    }
}

type SaveIssueOptions = {
    analysisId: Id;
    issue: QualityAnalysisIssue;
    propertyToUpdate: IssuePropertyName;
    valueToUpdate: string | boolean;
    metadata: MetadataItem;
};

type ContactEmailsUsers = { to: User; cc: User[] };

type SaveIssueResponse = {
    contactEmailsChanged: boolean;
};
