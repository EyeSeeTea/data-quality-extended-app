import { HashRouter, Route, Switch } from "react-router-dom";

import { AnalysisPage } from "./analysis/AnalysisPage";
import i18n from "$/utils/i18n";
import { LandingPage } from "$/webapp/pages/landing/LandingPage";
import { MetadataItemContextProvider } from "$/webapp/contexts/MetadataItemContextProvider";
import { DashboardPage } from "$/webapp/pages/dashboard/DashboardPage";
import { SettingsPage } from "$/webapp/pages/settings/SettingsPage";
import { ConfigProgramPage } from "$/webapp/pages/config-program/ConfigProgramPage";
import { AdminRoute } from "$/webapp/pages/AdminRoute";

export function Router() {
    return (
        <HashRouter>
            <Switch>
                <AdminRoute exact path="/settings" render={() => <SettingsPage />} />

                <AdminRoute exact path="/configuration" render={() => <ConfigProgramPage />} />

                <Route
                    path="/:qualityIssuesProgramCode"
                    render={() => (
                        <MetadataItemContextProvider>
                            <Switch>
                                <Route
                                    exact
                                    path="/:qualityIssuesProgramCode/dashboard"
                                    render={() => <DashboardPage />}
                                />
                                <Route
                                    path="/:qualityIssuesProgramCode/analysis/:id"
                                    render={() => <AnalysisPage name={i18n.t("Analysis")} />}
                                />
                            </Switch>
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
