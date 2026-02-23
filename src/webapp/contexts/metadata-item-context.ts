import React, { useContext } from "react";
import { MetadataItem } from "$/domain/entities/MetadataItem";

export type MetadataItemContextState = {
    metadataItem: MetadataItem;
    setMetadataItem: (item: MetadataItem) => void;
};

export const MetadataItemContext = React.createContext<MetadataItemContextState | null>(null);

export function useMetadataItemContext() {
    const context = useContext(MetadataItemContext);
    if (context) {
        return context;
    } else {
        throw new Error("Metadata Item context uninitialized");
    }
}
