import React from "react";
import styled from "styled-components";
import { InputLabel, Select, MenuItem, Input } from "@material-ui/core";

import i18n from "$/utils/i18n";
import { Code } from "$/domain/entities/Ref";

type Props = {
    value: Code | undefined;
    onChange: (code: Code | undefined) => void;
    options: { text: string; value: string }[];
};

export const ProgramSelectionStep: React.FC<Props> = React.memo(props => {
    const { value, onChange, options } = props;
    return (
        <Container>
            <ProgramSelectorContainer>
                <InputLabel id="program-selection-label">{i18n.t("Select Program")}</InputLabel>

                <StyledSelect
                    labelId="program-selection-label"
                    id="program-selection"
                    value={value}
                    onChange={e => onChange(e.target.value as Code)}
                    input={<Input />}
                >
                    {options.map(option => (
                        <MenuItem key={option.text} value={option.value}>
                            {option.text}
                        </MenuItem>
                    ))}
                </StyledSelect>
            </ProgramSelectorContainer>
        </Container>
    );
});

const Container = styled.div``;

const ProgramSelectorContainer = styled.div`
    margin: 8px 0 16px 0;

    > div {
        min-width: 300px;
    }
`;

const StyledSelect = styled(Select)`
    margin-block: 8px;
`;
