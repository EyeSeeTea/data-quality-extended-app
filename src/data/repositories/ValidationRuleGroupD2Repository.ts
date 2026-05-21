import { Id } from "$/domain/entities/Ref";
import { ValidationRuleGroup } from "$/domain/entities/ValidationRuleGroup";
import { Future } from "$/domain/entities/generic/Future";
import { ValidationRuleGroupRepository } from "$/domain/repositories/ValidationRuleGroupRepository";
import { D2Api } from "$/types/d2-api";
import { FutureData, apiToFuture } from "$/data/api-futures";

export class ValidationRuleD2Repository implements ValidationRuleGroupRepository {
    constructor(private api: D2Api) {}

    get(): FutureData<ValidationRuleGroup[]> {
        return apiToFuture(
            this.api.models.validationRuleGroups.get({
                fields: { id: true, name: true, description: true },
                paging: false,
            })
        ).map(d2Response => d2Response.objects);
    }

    getById(id: Id): FutureData<ValidationRuleGroup> {
        return apiToFuture(
            this.api.models.validationRuleGroups.get({
                fields: { id: true, name: true, description: true },
                filter: { id: { eq: id } },
            })
        ).flatMap(d2Response => {
            const firstResult = d2Response.objects[0];
            if (!firstResult) return Future.error(new Error("Cannot found validation rule"));
            return Future.success(firstResult);
        });
    }
}
