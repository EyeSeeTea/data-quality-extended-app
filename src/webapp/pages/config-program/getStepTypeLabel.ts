import { StepType } from "$/domain/entities/StepSettings";
import i18n from "$/utils/i18n";

export function getStepTypeLabel(type: StepType) {
    switch (type) {
        case "OUTLIERS":
            return i18n.t("Outliers");
        case "DISAGGREGATES":
            return i18n.t("Disaggregates");
        case "DOUBLE_COUNTS_MISSING_GP":
            return i18n.t("Double counts and missing GP");
        case "MISSING_NURSES":
            return i18n.t("Missing Nurses");
        case "VALIDATION":
            return i18n.t("Validation");
        case "MANUAL_ISSUES":
            return i18n.t("Manual Issues");
        default:
            return i18n.t("Step");
    }
}
