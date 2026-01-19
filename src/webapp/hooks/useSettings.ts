import React from "react";
import { useHistory } from "react-router-dom";

import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";
import { useQualityIssuesPrograms } from "$/webapp/pages/config-program/hooks/useQualityIssuesPrograms";

type State = {
    onConfigurateNewProgram: () => void;
    onBackHomePage: () => void;
    qualityIssuesPrograms: QualityIssuesProgram[] | undefined;
    onDownloadMetadataPackageTemplate: () => void;
    openDownloadMetadataPackage: boolean;
    setOpenDownloadMetadataPackage: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useSettings(): State {
    const history = useHistory();

    const { qualityIssuesPrograms } = useQualityIssuesPrograms();
    const [openDownloadMetadataPackage, setOpenDownloadMetadataPackage] = React.useState(false);

    const onDownloadMetadataPackageTemplate = React.useCallback(() => {
        setOpenDownloadMetadataPackage(false);
    }, []);

    const onConfigurateNewProgram = React.useCallback(
        () => history.push("/config-program"),
        [history]
    );

    const onBackHomePage = React.useCallback(() => history.push("/"), [history]);

    return {
        onConfigurateNewProgram: onConfigurateNewProgram,
        onBackHomePage: onBackHomePage,
        qualityIssuesPrograms: qualityIssuesPrograms,
        onDownloadMetadataPackageTemplate: onDownloadMetadataPackageTemplate,
        openDownloadMetadataPackage: openDownloadMetadataPackage,
        setOpenDownloadMetadataPackage: setOpenDownloadMetadataPackage,
    };
}
