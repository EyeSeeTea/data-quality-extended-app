import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";

import { memo, useState, MouseEvent } from "react";
import styled from "styled-components";

export type Item = {
    label: string;
    id: string;
    disabled?: boolean;
};

type Props = {
    label: string;
    items: Item[];
    onItemSelected: (id: string) => void;
    buttonVariant?: "text" | "outlined" | "contained";
};

export const MenuButton: React.FC<Props> = memo(
    ({ label, items, onItemSelected, buttonVariant = "contained" }) => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

        const onOpenMenu = (event: MouseEvent<HTMLButtonElement>) => {
            setAnchorEl(event.currentTarget);
        };

        const handleClose = () => {
            setAnchorEl(null);
        };

        const handleClick = (item: Item) => {
            if (!item.disabled) {
                onItemSelected(item.id);
            }
        };

        return (
            <Container>
                <Button
                    aria-controls="simple-menu"
                    aria-haspopup="true"
                    variant={buttonVariant}
                    color="primary"
                    onClick={onOpenMenu}
                    endIcon={anchorEl ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                >
                    {label}
                </Button>
                <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {items.map(item => (
                        <MenuItem key={item.id} onClick={handleClose} disabled={item.disabled}>
                            <Button
                                variant="text"
                                color="primary"
                                onClick={() => handleClick(item)}
                            >
                                {item.label}
                            </Button>
                        </MenuItem>
                    ))}
                </Menu>
            </Container>
        );
    }
);

const Container = styled.div`
    margin-inline-start: 1rem;
`;
