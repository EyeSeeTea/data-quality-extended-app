import { GeneralPractitionersStep } from "./steps/3-general-practitioners/GeneralPractitionersStep";
import { DisaggregatesStep } from "./steps/2-disaggregates/DisaggregatesStep";
import { NursingMidwiferyStep } from "./steps/4-nursingMidwifery/NursingMidwiferyStep";
import { OutliersStep } from "./steps/1-outliers/OutliersStep";
import { ValidationStep } from "./steps/5-validation/ValidationStep";
import { ManualIssuesStep } from "$/webapp/pages/analysis/steps/6-manual-issues/ManualIssuesStep";

import { StepType } from "$/domain/entities/StepSettings";

const SECTION_COMPONENTS: Record<StepType, React.ComponentType<any>> = {
    OUTLIERS: OutliersStep,
    DISAGGREGATES: DisaggregatesStep,
    DOUBLE_COUNTS_AND_MISSING_GP: GeneralPractitionersStep,
    MISSING_NURSES: NursingMidwiferyStep,
    VALIDATION: ValidationStep,
    MANUAL_ISSUES: ManualIssuesStep,
};

export function getComponentByStepType(stepType: StepType): React.ComponentType<any> | undefined {
    return SECTION_COMPONENTS[stepType];
}
