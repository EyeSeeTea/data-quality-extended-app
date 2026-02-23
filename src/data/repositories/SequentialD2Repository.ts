import { D2Api } from "$/types/d2-api";

import { Sequential } from "$/domain/entities/Sequential";
import { SequentialRepository } from "$/domain/repositories/SequentialRepository";
import { FutureData, apiToFuture } from "$/data/api-futures";
import { MetadataItem } from "$/domain/entities/MetadataItem";
import { DateISOString, Id } from "$/domain/entities/Ref";

export class SequentialD2Repository implements SequentialRepository {
    constructor(private api: D2Api) {}

    get(metadata: MetadataItem): FutureData<Sequential> {
        const url = `/trackedEntityAttributes/${metadata.trackedEntityAttributes.sequential.id}/generate`;
        return apiToFuture<D2SequentialResponse>(
            this.api.request({
                method: "get",
                url: url,
                params: { expiration: 0 },
            })
        )
            .map(d2Response => {
                return d2Response;
            })
            .mapError(err => {
                const error = err as unknown as { response?: { data?: { message: string } } };
                return new Error(error.response?.data?.message || err.message);
            });
    }
}

type D2SequentialResponse = {
    ownerObject: "TRACKEDENTITYATTRIBUTE";
    ownerUid: Id;
    key: string;
    value: string;
    created: DateISOString;
    expiryDate: DateISOString;
};
