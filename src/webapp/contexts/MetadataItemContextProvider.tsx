import { MetadataItem } from "$/domain/entities/MetadataItem";
import { Code } from "$/domain/entities/Ref";
import { setupLogger } from "$/utils/logger";
import { useAppContext } from "$/webapp/contexts/app-context";
import { MetadataItemContext } from "$/webapp/contexts/metadata-item-context";
import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { PropsWithChildren, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const MetadataItemContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { qualityIssuesProgramCode } = useParams<{
        qualityIssuesProgramCode: Code;
    }>();
    const { compositionRoot, api } = useAppContext();
    const snackBar = useSnackbar();
    const loading = useLoading();

    const [metadataItem, setMetadataItem] = useState<MetadataItem | undefined>(undefined);

    useEffect(() => {
        if (!metadataItem && qualityIssuesProgramCode) {
            loading.show(true, "Loading...");
            compositionRoot.metadataItem.get.execute(qualityIssuesProgramCode).run(
                metadata => {
                    setMetadataItem(metadata);
                    loading.hide();
                },
                err => {
                    snackBar.error(`Error loading Metadata Item: ${err.message}`);
                    loading.hide();
                }
            );
        }
    }, [
        compositionRoot.metadataItem.get,
        loading,
        metadataItem,
        qualityIssuesProgramCode,
        setMetadataItem,
        snackBar,
    ]);

    useEffect(() => {
        async function initLogger() {
            if (!metadataItem) return;

            await setupLogger(api.baseUrl, metadataItem.programs.qualityIssues.id);
        }
        initLogger();
    }, [api, compositionRoot, metadataItem]);

    if (!metadataItem) return null;

    return (
        <MetadataItemContext.Provider
            value={{ metadataItem: metadataItem, setMetadataItem: setMetadataItem }}
        >
            {children}
        </MetadataItemContext.Provider>
    );
};
