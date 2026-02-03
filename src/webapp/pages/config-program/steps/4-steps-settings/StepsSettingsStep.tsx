import React, { useCallback } from "react";
import styled from "styled-components";
import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    TextField,
} from "@material-ui/core";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import WarningIcon from "@material-ui/icons/Warning";

import i18n from "$/utils/i18n";
import { ACCEPTED_SECTION_NAMES, StepSettings } from "$/domain/entities/StepSettings";
import { NamedRef } from "$/domain/entities/Ref";
import {
    buildRows,
    Row,
    rowsToValue,
} from "$/webapp/pages/config-program/steps/4-steps-settings/utils";

type Props = {
    value: StepSettings[];
    onChange: (steps: StepSettings[]) => void;
    sections: NamedRef[];
    isEdit: boolean;
};

export const StepsSettingsStep: React.FC<Props> = React.memo(props => {
    const { value, onChange, sections, isEdit } = props;
    const [rows, setRows] = React.useState<Row[]>(() => buildRows(value, sections, { isEdit }));

    React.useEffect(() => {
        const nextRows = buildRows(value, sections, { isEdit });
        setRows(nextRows);

        if (!isEdit && value.length === 0) {
            const defaultValue = rowsToValue(nextRows);
            if (defaultValue.length > 0) onChange(defaultValue);
        }
    }, [value, sections, onChange, isEdit]);

    const onMoveStep = useCallback(
        (index: number, direction: -1 | 1) => {
            setRows(prev => {
                const current = prev[index];
                if (!current?.stepType) return prev;

                const target = index + direction;
                if (target < 0 || target >= prev.length) return prev;

                const targetRow = prev[target];
                if (!targetRow?.stepType) return prev;

                const next = prev.map((row, i) => {
                    if (i === index) return targetRow;
                    if (i === target) return current;
                    return row;
                });

                onChange(rowsToValue(next));
                return next;
            });
        },
        [onChange]
    );

    const onCustomNameChange = useCallback(
        (index: number, customName: string) => {
            setRows(prev => {
                const current = prev[index];
                if (!current) return prev;

                const next = prev.map((row, i) =>
                    i === index ? { ...row, customName: customName } : row
                );

                onChange(rowsToValue(next));
                return next;
            });
        },
        [onChange]
    );

    return (
        <RootPaper elevation={0}>
            <Typography variant="h6">{i18n.t("Steps Configuration")}</Typography>

            <List>
                {rows.map((row, index) => {
                    const noStepTypeMatch = !row.stepType;
                    const canMoveUp = !!row.stepType && index > 0 && !!rows[index - 1]?.stepType;
                    const canMoveDown =
                        !!row.stepType && index < rows.length - 1 && !!rows[index + 1]?.stepType;

                    return (
                        <ListItem key={row.sectionId} disableGutters>
                            <RowContent>
                                <Left>
                                    <ListItemText primary={`${index + 1}. ${row.sectionName}`} />
                                </Left>

                                {noStepTypeMatch ? (
                                    <WarningLine>
                                        <WarningIcon fontSize="small" />
                                        <WarningText>
                                            <div>
                                                {i18n.t(
                                                    "No match found for this section name, so it cannot be configured."
                                                )}
                                            </div>
                                            <div>
                                                {i18n.t(
                                                    `Accepted section names: ${ACCEPTED_SECTION_NAMES.join(
                                                        ", "
                                                    )}`,
                                                    { nsSeparator: false }
                                                )}
                                            </div>
                                        </WarningText>
                                    </WarningLine>
                                ) : (
                                    <>
                                        <Middle>
                                            <TextFieldWrapper>
                                                <TextField
                                                    fullWidth
                                                    label={i18n.t("Custom name")}
                                                    value={row.customName}
                                                    onChange={e =>
                                                        onCustomNameChange(index, e.target.value)
                                                    }
                                                />
                                            </TextFieldWrapper>
                                        </Middle>

                                        {isEdit ? null : (
                                            <Actions>
                                                <IconButton
                                                    onClick={() => onMoveStep(index, -1)}
                                                    size="small"
                                                    disabled={!canMoveUp}
                                                >
                                                    <ArrowUpwardIcon fontSize="small" />
                                                </IconButton>

                                                <IconButton
                                                    onClick={() => onMoveStep(index, 1)}
                                                    size="small"
                                                    disabled={!canMoveDown}
                                                >
                                                    <ArrowDownwardIcon fontSize="small" />
                                                </IconButton>
                                            </Actions>
                                        )}
                                    </>
                                )}
                            </RowContent>
                        </ListItem>
                    );
                })}
            </List>
        </RootPaper>
    );
});

const RootPaper = styled(Paper)`
    padding: 16px;
`;

const RowContent = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-block-start: 12px;
`;

const Left = styled.div`
    flex: 0 0 360px;
`;

const Middle = styled.div`
    flex: 1 1 auto;
    display: flex;
    justify-content: flex-start;
    min-width: 0;
`;

const Actions = styled.div`
    display: flex;
    gap: 4px;
`;

const TextFieldWrapper = styled.div`
    width: 360px;
    max-width: 360px;
    flex: 0 0 360px;
`;

const WarningLine = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 6px;
    opacity: 0.9;
`;

const WarningText = styled.div`
    font-size: 14px;
    line-height: 16px;
`;
