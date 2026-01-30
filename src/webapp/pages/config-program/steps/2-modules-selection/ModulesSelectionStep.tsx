import React from "react";
import styled from "styled-components";
import { Select, InputLabel, MenuItem, Input } from "@material-ui/core";

import i18n from "$/utils/i18n";
import { Code } from "$/domain/entities/Ref";

type Props = {
    values: Code[];
    onChange: (codes: Code[]) => void;
    modulesOptions: { text: string; value: string }[];
};

export const ModulesSelectionStep: React.FC<Props> = React.memo(props => {
    const { values, onChange, modulesOptions } = props;

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

    return (
        <Container>
            <SelectorContainer>
                <InputLabel id="modules-selection-label">
                    {i18n.t("Add Datasets to Program")}
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
                >
                    {modulesOptions.map(option => (
                        <MenuItem key={option.text} value={option.value}>
                            {option.text}
                        </MenuItem>
                    ))}
                </StyledMultiSelect>
            </SelectorContainer>
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
