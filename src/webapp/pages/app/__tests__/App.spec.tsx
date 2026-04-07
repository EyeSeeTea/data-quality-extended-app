import { render } from "@testing-library/react";

import App from "$/webapp/pages/app/App";
import { getTestContext } from "$/utils/tests";
import { Provider } from "@dhis2/app-runtime";
import { getD2APiFromInstance } from "$/utils/d2-api";

describe("App", () => {
    it("renders the feedback component", async () => {
        const view = getView();

        expect(await view.findByText("Send feedback")).toBeInTheDocument();
    });
});

function getView() {
    const { compositionRoot } = getTestContext();
    const baseUrl = "http://localhost:8080";
    const api = getD2APiFromInstance({ type: "local", url: baseUrl });
    return render(
        <Provider config={{ baseUrl: "http://localhost:8080", apiVersion: 30 }}>
            <App api={api} compositionRoot={compositionRoot} />
        </Provider>
    );
}
