import React, { useCallback } from "react";
import styled from "styled-components";
import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    InputLabel,
    Select,
    MenuItem,
    FormControl,
} from "@material-ui/core";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

import i18n from "$/utils/i18n";
import { StepType, StepTypes, StepSettings } from "$/domain/entities/StepSettings";
import { NamedRef } from "$/domain/entities/Ref";
import { getStepTypeLabel } from "$/webapp/pages/config-program/getStepTypeLabel";
import {
    buildRows,
    isStepTypeDisabledForRow,
    Row,
    rowsToValue,
} from "$/webapp/pages/config-program/steps/4-steps-settings/utils";

type Props = {
    value: StepSettings[];
    onChange: (steps: StepSettings[]) => void;
    sections: NamedRef[];
};

export const StepsSettingsStep: React.FC<Props> = React.memo(props => {
    const { value, onChange, sections } = props;
    const [rows, setRows] = React.useState<Row[]>(() => buildRows(value, sections));

    React.useEffect(() => {
        setRows(buildRows(value, sections));
    }, [value, sections]);

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

    const onStepTypeChange = useCallback(
        (index: number, stepType?: StepType) => {
            setRows(prev => {
                const current = prev[index];
                if (!current) return prev;

                const next = prev.map((row, i) =>
                    i === index ? { ...row, stepType: stepType || undefined } : row
                );

                onChange(rowsToValue(next));
                return next;
            });
        },
        [onChange]
    );

    const stepsAlreadyUsed = React.useMemo(
        () => rows.map(row => row.stepType).filter((row): row is StepType => !!row),
        [rows]
    );

    return (
        <RootPaper elevation={0}>
            <Typography variant="h6">{i18n.t("Steps Configuration")}</Typography>

            <List>
                {rows.map((row, index) => {
                    const canMoveUp = !!row.stepType && index > 0 && !!rows[index - 1]?.stepType;
                    const canMoveDown =
                        !!row.stepType && index < rows.length - 1 && !!rows[index + 1]?.stepType;

                    return (
                        <ListItem key={row.sectionId} disableGutters>
                            <RowContent>
                                <Left>
                                    <ListItemText primary={`${index + 1}. ${row.sectionName}`} />
                                </Left>

                                <Middle>
                                    <DropdownWrapper>
                                        <FormControl fullWidth>
                                            <InputLabel>{i18n.t("Step type")}</InputLabel>
                                            <Select
                                                value={row.stepType ?? ""}
                                                onChange={e =>
                                                    onStepTypeChange(
                                                        index,
                                                        (e.target.value as StepType) || undefined
                                                    )
                                                }
                                            >
                                                <MenuItem value="">
                                                    <em>{i18n.t("<No value>")}</em>
                                                </MenuItem>

                                                {StepTypes.map(step => (
                                                    <MenuItem
                                                        key={step}
                                                        value={step}
                                                        disabled={isStepTypeDisabledForRow(
                                                            step,
                                                            row,
                                                            stepsAlreadyUsed
                                                        )}
                                                    >
                                                        {getStepTypeLabel(step)}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </DropdownWrapper>
                                </Middle>

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

const DropdownWrapper = styled.div`
    width: 360px;
    max-width: 360px;
    flex: 0 0 360px;
`;
