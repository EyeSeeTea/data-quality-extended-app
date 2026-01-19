import { Route, Redirect, RouteProps } from "react-router-dom";

import { useAppContext } from "$/webapp/contexts/app-context";

type AdminRouteProps = RouteProps & {
    redirectTo?: string;
    render: RouteProps["render"];
};

export function AdminRoute({ redirectTo = "/", render, ...restProps }: AdminRouteProps) {
    const { currentUser } = useAppContext();

    return (
        <Route
            {...restProps}
            render={props =>
                currentUser.isAdmin() ? render?.(props) ?? null : <Redirect to={redirectTo} />
            }
        />
    );
}
