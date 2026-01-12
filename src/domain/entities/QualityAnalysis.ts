import { Either } from "./generic/Either";
import { ValidationError } from "./generic/Errors";
import { Struct } from "./generic/Struct";
import { validateRequired } from "./generic/validations";
import { Module } from "./Module";
import { QualityAnalysisSection } from "./QualityAnalysisSection";
import { QualityAnalysisStatus } from "./QualityAnalysisStatus";
import { Id } from "./Ref";
import { Sequential } from "./Sequential";

export interface QualityAnalysisAttrs {
    id: Id;
    endDate: string;
    module: Module;
    name: string;
    startDate: string;
    status: QualityAnalysisStatus;
    sections: QualityAnalysisSection[];
    lastModification: string;
    countriesAnalysis: Id[];
    sequential: Sequential;
}

export class QualityAnalysis extends Struct<QualityAnalysisAttrs>() {
    static build(
        attrs: QualityAnalysisAttrs
    ): Either<ValidationError<QualityAnalysis>[], QualityAnalysis> {
        const qualityAnalysis = new QualityAnalysis({ ...attrs, name: attrs.name });
        const errors: ValidationError<QualityAnalysis>[] = QualityAnalysis.getErrors(
            qualityAnalysis,
            { validateCountries: false }
        );
        return errors.length === 0 ? Either.success(qualityAnalysis) : Either.error(errors);
    }

    private static getErrors(
        qualityAnalysis: QualityAnalysis,
        options: { validateCountries: boolean }
    ): ValidationError<QualityAnalysis>[] {
        const countryProperty = options.validateCountries
            ? [
                  {
                      property: "countriesAnalysis" as const,
                      errors: validateRequired(
                          qualityAnalysis.countriesAnalysis,
                          "country_validation"
                      ),
                      value: qualityAnalysis.countriesAnalysis,
                  },
              ]
            : [];
        return [
            {
                property: "name" as const,
                errors: validateRequired(qualityAnalysis.name),
                value: qualityAnalysis.name,
            },
            {
                property: "module" as const,
                errors: validateRequired(qualityAnalysis.module.id),
                value: qualityAnalysis.module.id,
            },
            {
                property: "startDate" as const,
                errors: validateRequired(qualityAnalysis.startDate),
                value: qualityAnalysis.startDate,
            },
            {
                property: "endDate" as const,
                errors: validateRequired(qualityAnalysis.endDate),
                value: qualityAnalysis.endDate,
            },
            {
                property: "status" as const,
                errors: validateRequired(qualityAnalysis.status),
                value: qualityAnalysis.status,
            },
            ...countryProperty,
        ].filter(validation => validation.errors.length > 0);
    }

    static updateConfiguration(
        attrs: QualityAnalysisAttrs
    ): Either<ValidationError<QualityAnalysis>[], QualityAnalysis> {
        const qualityAnalysis = this.build(attrs).get();
        const errors: ValidationError<QualityAnalysis>[] = QualityAnalysis.getErrors(
            qualityAnalysis,
            { validateCountries: true }
        );
        return errors.length === 0 ? Either.success(qualityAnalysis) : Either.error(errors);
    }

    static hasExecutedSections(qualityAnalysis: QualityAnalysis): boolean {
        return qualityAnalysis.sections.some(section => section.status !== "pending");
    }

    static buildDefaultName(name: string, prefix: string): string {
        if (!prefix) throw Error("Prefix is required");
        if (name) return name;
        const date = new Date();
        const formattedDate = date.toISOString().replace(/[-:T.]/g, "_");
        return `${prefix} - ${formattedDate}`;
    }
}
