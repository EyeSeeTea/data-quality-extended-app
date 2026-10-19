import { render, screen } from "@testing-library/react";
import { Provider } from "@dhis2/app-runtime";

import { HeaderBar } from "$/webapp/components/header-bar/HeaderBar";

describe("HeaderBar", () => {
    it("renders the DHIS2 header bar when the app is not embedded in an iframe", () => {
        getView();

        expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("does not render the DHIS2 header bar when the app is embedded in an iframe", () => {
        const originalTop = window.top;
        Object.defineProperty(window, "top", { value: {}, configurable: true });

        getView();

        expect(screen.queryByRole("banner")).toBeNull();

        Object.defineProperty(window, "top", { value: originalTop, configurable: true });
    });
});

function getView() {
    return render(
        <Provider config={{ baseUrl: "http://localhost:8080", apiVersion: 30 }}>
            <HeaderBar appName="Data Quality" />
        </Provider>
    );
}
