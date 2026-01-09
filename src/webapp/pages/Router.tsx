import { HashRouter, Route, Switch } from "react-router-dom";
import { AnalysisPage } from "./analysis/AnalysisPage";
import i18n from "$/utils/i18n";
import { LandingPage } from "$/webapp/pages/landing/LandingPage";
import { MetadataItemContextProvider } from "$/webapp/contexts/MetadataItemContextProvider";
import { DashboardPage } from "$/webapp/pages/dashboard/DashboardPage";

export function Router() {
    return (
        <HashRouter>
            <Switch>
                <Route
                    path="/:qualityIssuesProgramCode/analysis/:id"
                    render={() => (
                        <MetadataItemContextProvider>
                            <AnalysisPage name={i18n.t("Analysis")} />
                        </MetadataItemContextProvider>
                    )}
                />

                <Route
                    path="/:qualityIssuesProgramCode/dashboard"
                    render={() => (
                        <MetadataItemContextProvider>
                            <DashboardPage name={i18n.t("Data Quality Analysis")} />
                        </MetadataItemContextProvider>
                    )}
                />

                {/* Default route */}
                <Route
                    path="/"
                    render={() => <LandingPage name={i18n.t("Data Quality Analysis")} />}
                />
            </Switch>
        </HashRouter>
    );
}
