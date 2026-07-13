import { describe, expect, it } from "vitest";
import { hasUserGroups, shouldNotifyNoContactUser } from "$/webapp/components/issues/utils";
import { NHWAUserGroups } from "$/domain/entities/MetadataItem";

const populatedUserGroups: NHWAUserGroups = {
    dataCaptureModule1: { id: "1", name: "Module 1", code: "M1", users: [{ id: "u1" }] },
    dataCaptureModule2And4: { id: "2", name: "Module 2 and 4", code: "M2", users: [{ id: "u2" }] },
};

describe("shouldNotifyNoContactUser", () => {
    it("returns false when the feature is not configured, followUp is checked and no email was generated", () => {
        const result = shouldNotifyNoContactUser({
            field: "followUp",
            value: true,
            emailChanged: false,
            userGroupsConfigured: false,
        });

        expect(result).toBe(false);
    });

    it("returns true when the feature is configured, followUp is checked and no email was generated", () => {
        const result = shouldNotifyNoContactUser({
            field: "followUp",
            value: true,
            emailChanged: false,
            userGroupsConfigured: true,
        });

        expect(result).toBe(true);
    });

    it("returns false when the feature is configured, followUp is checked and an email was generated", () => {
        const result = shouldNotifyNoContactUser({
            field: "followUp",
            value: true,
            emailChanged: true,
            userGroupsConfigured: true,
        });

        expect(result).toBe(false);
    });

    it("returns false for updates to a field other than followUp", () => {
        const result = shouldNotifyNoContactUser({
            field: "status",
            value: true,
            emailChanged: false,
            userGroupsConfigured: true,
        });

        expect(result).toBe(false);
    });

    it("returns false when followUp is being unset", () => {
        const result = shouldNotifyNoContactUser({
            field: "followUp",
            value: false,
            emailChanged: false,
            userGroupsConfigured: true,
        });

        expect(result).toBe(false);
    });
});

describe("hasUserGroups", () => {
    it("returns false when userGroups is undefined", () => {
        expect(hasUserGroups(undefined)).toBe(false);
    });

    it("returns false when userGroups is an empty object", () => {
        expect(hasUserGroups({} as NHWAUserGroups)).toBe(false);
    });

    it("returns true when userGroups is populated", () => {
        expect(hasUserGroups(populatedUserGroups)).toBe(true);
    });
});
