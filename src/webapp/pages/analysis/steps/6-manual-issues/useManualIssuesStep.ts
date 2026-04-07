import React from "react";

import { Maybe } from "$/utils/ts-utils";
import { QualityAnalysis } from "$/domain/entities/QualityAnalysis";
import { QualityAnalysisSection } from "$/domain/entities/QualityAnalysisSection";
import { UpdateAnalysisState } from "$/webapp/pages/analysis/AnalysisPage";
import { AddIssueDialogProps } from "$/webapp/components/add-issue-dialog/AddIssueDialog";
import { IssueTemplate } from "$/domain/usecases/CreateIssueUseCase";
import { useAppContext } from "$/webapp/contexts/app-context";
import { useMetadataItemContext } from "$/webapp/contexts/metadata-item-context";

type UseManualStepProps = {
    analysis: QualityAnalysis;
    section: QualityAnalysisSection;
    updateAnalysis: UpdateAnalysisState;
};

export function useManualIssuesStep(props: UseManualStepProps) {
    const { analysis, section, updateAnalysis } = props;
    const { compositionRoot } = useAppContext();
    const { metadataItem } = useMetadataItemContext();

    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<Maybe<string>>(undefined);
    const [addIssueDialogProps, setAddIssueDialogProps] = React.useState<AddIssueDialogProps>();

    const onAddIssues = React.useCallback(
        (issues: IssueTemplate[]) => {
            setIsLoading(true);
            compositionRoot.issues.create
                .execute({
                    qualityAnalysisId: analysis.id,
                    issues: issues,
                    sectionId: section.id,
                    metadata: metadataItem,
                })
                .run(
                    analysis => {
                        if (analysis) {
                            updateAnalysis(analysis);
                        }
                        setIsLoading(false);
                    },
                    err => {
                        setError(err.message);
                        setIsLoading(false);
                    }
                );
        },
        [compositionRoot, section, analysis, updateAnalysis, metadataItem]
    );

    const closeAddIssueDialog = React.useCallback(() => {
        setAddIssueDialogProps(undefined);
    }, []);

    const openAddIssueDialog = React.useCallback(() => {
        setAddIssueDialogProps({
            onAddIssue: (issues: IssueTemplate[]) => {
                onAddIssues(issues);
                closeAddIssueDialog();
            },
            onClose: closeAddIssueDialog,
            analysis: analysis,
        });
    }, [onAddIssues, closeAddIssueDialog, analysis]);

    return {
        isLoading,
        error,
        addIssueDialogProps,
        openAddIssueDialog,
        onAddIssues,
    };
}
