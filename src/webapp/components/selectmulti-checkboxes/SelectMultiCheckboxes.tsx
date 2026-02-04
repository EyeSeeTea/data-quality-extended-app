import React from "react";

import Select from "@material-ui/core/Select";
import Checkbox from "@material-ui/core/Checkbox";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemText from "@material-ui/core/ListItemText";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import styled from "styled-components";

import _ from "$/domain/entities/generic/Collection";
import { Option } from "$/webapp/entities/Option";

type Props = {
    label: string;
    options: Option[];
    value: string[];
    onChange: (values: string[]) => void;
};

export const SelectMultiCheckboxes: React.FC<Props> = React.memo(
    ({ onChange, options, value, label }) => {
        const onChangeSelector = (event: React.ChangeEvent<{ value: unknown }>) => {
            onChange(event.target.value as string[]);
        };
        return (
            <StyledFormControl>
                <InputLabel id="mutiple-checkbox-label">{label}</InputLabel>
                <Select
                    labelId="mutiple-checkbox-label"
                    id="mutiple-checkbox"
                    multiple
                    value={value}
                    onChange={onChangeSelector}
                    renderValue={selected => {
                        const items = selected as string[];

                        return _(items)
                            .map(item => {
                                const itemDetail = options.find(option => option.value === item);
                                return itemDetail?.text;
                            })
                            .compact()
                            .value()
                            .join(", ");
                    }}
                >
                    {options.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                            <Checkbox checked={value.indexOf(option.value) > -1} />
                            <ListItemText primary={option.text} />
                        </MenuItem>
                    ))}
                </Select>
            </StyledFormControl>
        );
    }
);

const StyledFormControl = styled(FormControl)`
    min-width: 7.5rem;
    max-width: 18.75rem;
`;
