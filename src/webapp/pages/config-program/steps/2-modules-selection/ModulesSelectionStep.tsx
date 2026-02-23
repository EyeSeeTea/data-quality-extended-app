import React from "react";
import styled from "styled-components";
import { Select, InputLabel, MenuItem, Input, Typography } from "@material-ui/core";

import i18n from "$/utils/i18n";
import { Code } from "$/domain/entities/Ref";
import { Option } from "$/webapp/entities/Option";

type Props = {
    values: Code[];
    onChange: (codes: Code[]) => void;
    modulesOptions: Option[];
    disabled: boolean;
};

export const ModulesSelectionStep: React.FC<Props> = React.memo(props => {
    const { values, onChange, modulesOptions, disabled } = props;
    const [selection, setSelection] = React.useState<Code[]>(values);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        if (!open) setSelection(values);
    }, [values, open]);

    const handleOpen = React.useCallback(() => {
        setSelection(values);
        setOpen(true);
    }, [values]);

    const handleClose = React.useCallback(() => {
        setOpen(false);

        const same = selection.length === values.length && selection.every(v => values.includes(v));
        if (!same) onChange(selection);
    }, [selection, values, onChange]);

    const getOptionText = React.useCallback(
        (code: Code) => {
            const option = modulesOptions.find(option => option.value === code);
            return option ? option.text : code;
        },
        [modulesOptions]
    );

    return (
        <Container>
            {modulesOptions.length > 0 ? (
                <SelectorContainer>
                    <InputLabel id="modules-selection-label">
                        {i18n.t("Select datasets for data quality analysis")}
                    </InputLabel>

                    <StyledMultiSelect
                        labelId="modules-selection-label"
                        id="modules-selection"
                        multiple
                        value={selection}
                        onChange={e => setSelection(e.target.value as Code[])}
                        input={<Input />}
                        open={open}
                        onOpen={handleOpen}
                        onClose={handleClose}
                        displayEmpty
                        renderValue={selected => {
                            const codes = selected as Code[];
                            if (!codes?.length) return;
                            return codes?.length === 1 && codes[0]
                                ? getOptionText(codes[0])
                                : i18n.t("{{count}} datasets selected", {
                                      count: codes.length,
                                  });
                        }}
                        disabled={disabled}
                    >
                        {modulesOptions.map(option => (
                            <MenuItem key={option.text} value={option.value}>
                                {option.text}
                            </MenuItem>
                        ))}
                    </StyledMultiSelect>
                </SelectorContainer>
            ) : (
                <EmptyState>
                    <Typography variant="body1" color="textSecondary">
                        {i18n.t("No datasets are available for data quality analysis.")}
                    </Typography>
                </EmptyState>
            )}
        </Container>
    );
});

const Container = styled.div``;

const SelectorContainer = styled.div`
    margin: 8px 0 16px 0;

    > div {
        min-width: 300px;
        max-width: 80vw;
    }
`;

const StyledMultiSelect = styled(Select)`
    margin-block: 8px;
`;

const EmptyState = styled.div`
    margin-top: 12px;
`;
