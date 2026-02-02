import React from "react";
import styled from "styled-components";
import { InputLabel, Select, MenuItem, Input, Typography } from "@material-ui/core";

import i18n from "$/utils/i18n";
import { Code } from "$/domain/entities/Ref";
import { ProgramSelectorContainer } from "$/webapp/pages/config-program/steps/ProgramSelectorContainer";
import { Maybe } from "$/utils/ts-utils";

type Option = {
    text: string;
    value: string;
};

type Props = {
    value: Code | undefined;
    onChange: (code: Code | undefined) => void;
    options: Maybe<Option[]>;
    disabled: boolean;
};

export const ProgramSelectionStep: React.FC<Props> = React.memo(props => {
    const { value, onChange, options, disabled } = props;
    if (!options) {
        return null;
    }

    return (
        <Container>
            <ProgramSelectorContainer>
                {options.length > 0 ? (
                    <>
                        <InputLabel id="program-selection-label">
                            {i18n.t("Select where data quality analysis issues will be created")}
                        </InputLabel>

                        <StyledSelect
                            labelId="program-selection-label"
                            id="program-selection"
                            value={value}
                            onChange={e => onChange(e.target.value as Code)}
                            input={<Input />}
                            disabled={disabled}
                        >
                            {options.map(option => (
                                <MenuItem key={option.text} value={option.value}>
                                    {option.text}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    </>
                ) : (
                    <EmptyState>
                        <Typography variant="body1" color="textSecondary">
                            {i18n.t(
                                "No location is available to store data quality analysis issues. Please create one first."
                            )}
                        </Typography>
                    </EmptyState>
                )}
            </ProgramSelectorContainer>
        </Container>
    );
});

const Container = styled.div``;

const StyledSelect = styled(Select)`
    margin-block: 8px;
`;

const EmptyState = styled.div`
    margin-top: 12px;
`;
