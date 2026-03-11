import { CountryRepository } from "$/domain/repositories/CountryRepository";
import { IssueRepository } from "$/domain/repositories/IssueRepository";
import { OutlierRepository } from "$/domain/repositories/OutlierRepository";
import { SequentialRepository } from "$/domain/repositories/SequentialRepository";
import { GetAnalysisByIdUseCase } from "$/domain/usecases/GetAnalysisByIdUseCase";
import { GetCountriesByIdsUseCase } from "$/domain/usecases/GetCountriesByIdsUseCase";
import { RemoveQualityUseCase } from "$/domain/usecases/RemoveQualityUseCase";
import { RunOutlierUseCase } from "$/domain/usecases/RunOutlierUseCase";
import { UpdateStatusAnalysisUseCase } from "$/domain/usecases/UpdateStatusAnalysisUseCase";
import { AnalysisSectionD2Repository } from "./data/repositories/AnalysisSectionD2Repository";
import { AnalysisSectionTestRepository } from "./data/repositories/AnalysisSectionTestRepository";
import { CountryD2Repository } from "./data/repositories/CountryD2Repository";
import { CountryTestRepository } from "./data/repositories/CountryTestRepository";
import { IssueD2Repository } from "./data/repositories/IssueD2Repository";
import { IssueTestRepository } from "./data/repositories/IssueTestRepository";
import { MetadataD2Repository } from "./data/repositories/MetadataD2Repository";
import { MetadataTestRepository } from "./data/repositories/MetadataTestRepository";
import { ModuleD2Repository } from "./data/repositories/ModuleD2Repository";
import { ModuleTestRepository } from "./data/repositories/ModuleTestRepository";
import { OutlierD2Repository } from "./data/repositories/OutlierD2Repository";
import { OutlierTestRepository } from "./data/repositories/OutlierTestRepository";
import { QualityAnalysisD2Repository } from "./data/repositories/QualityAnalysisD2Repository";
import { QualityAnalysisTestRepository } from "./data/repositories/QualityAnalysisTestRepository";
import { SequentialD2Repository } from "./data/repositories/SequentialD2Repository";
import { SequentialTestRepository } from "./data/repositories/SequentialTestRepository";
import { SettingsD2Repository } from "./data/repositories/SettingsD2Repository";
import { SettingsTestRepository } from "./data/repositories/SettingsTestRepository";
import { UserD2Repository } from "./data/repositories/UserD2Repository";
import { UserTestRepository } from "./data/repositories/UserTestRepository";
import { AnalysisSectionRepository } from "./domain/repositories/AnalysisSectionRepository";
import { MetadataRepository } from "./domain/repositories/MetadataRepository";
import { ModuleRepository } from "./domain/repositories/ModuleRepository";
import { QualityAnalysisRepository } from "./domain/repositories/QualityAnalysisRepository";
import { SettingsRepository } from "./domain/repositories/SettingsRepository";
import { UserRepository } from "./domain/repositories/UserRepository";
import { CreateQualityAnalysisUseCase } from "./domain/usecases/CreateQualityAnalysisUseCase";
import { GetCurrentUserUseCase } from "./domain/usecases/GetCurrentUserUseCase";
import { GetModulesUseCase } from "./domain/usecases/GetModulesUseCase";
import { GetOutlierIssuesUseCase } from "./domain/usecases/GetOutlierIssuesUseCase";
import { GetQualityAnalysisUseCase } from "./domain/usecases/GetQualityAnalisysUseCase";
import { GetSettingsUseCase } from "./domain/usecases/GetSettingsUseCase";
import { SaveIssueUseCase } from "./domain/usecases/SaveIssueUseCase";
import { SaveConfigAnalysisUseCase } from "./domain/usecases/SaveConfigAnalysisUseCase";
import { ValidationRuleGroupRepository } from "./domain/repositories/ValidationRuleGroupRepository";
import { GetAllIssuesUseCase } from "./domain/usecases/GetAllIssuesUseCase";
import { D2Api } from "./types/d2-api";
import { RunPractitionersValidationUseCase } from "./domain/usecases/RunPractitionersValidationUseCase";
import { DataValueRepository } from "$/domain/repositories/DataValueRepository";
import { DataValueD2Repository } from "./data/repositories/DataValueD2Repository";
import { DataValueTestRepository } from "./data/repositories/DataValueTestRepository";
import { GetDisaggregationsUseCase } from "$/domain/usecases/GetDisaggregationsUseCase";
import { GetMissingDisaggregatesUseCase } from "./domain/usecases/GetMissingDisaggregatesUseCase";
import { ValidateMidwiferyAndPersonnelUseCase } from "./domain/usecases/ValidateMidwiferyAndPersonnelUseCase";
import { ValidationRuleD2Repository } from "./data/repositories/ValidationRuleGroupD2Repository";
import { ValidationRuleTestRepository } from "./data/repositories/ValidationRuleGroupTestRepository";
import { GetValidationRuleGroupUseCase } from "./domain/usecases/GetValidationRuleGroupUseCase";
import { CopyContactEmailsUseCase } from "$/domain/usecases/CopyContactEmailsUseCase";
import { RunValidationsUseCase } from "./domain/usecases/RunValidationsUseCase";
import { ValidationRuleAnalysisD2Repository } from "./data/repositories/ValidationRuleAnalysisD2Repository";
import { ValidationRuleAnalysisRepository } from "./domain/repositories/ValidationRuleAnalysisRepository";
import { ValidationRuleAnalysisTestRepository } from "./data/repositories/ValidationRuleAnalysisTestRepository";
import { ExportIssuesUseCase } from "$/domain/usecases/ExportIssuesUseCase";
import { IssueExportRepository } from "$/domain/repositories/IssueExportRepository";
import { IssueSpreadSheetRepository } from "./data/repositories/IssueSpreadSheetRepository";
import { IssueSpreadSheetTestRepository } from "./data/repositories/IssueSpreadSheetTestRepository";
import { CreateIssueUseCase } from "$/domain/usecases/CreateIssueUseCase";
import { QualityIssuesProgramD2Repository } from "$/data/repositories/QualityIssuesProgramD2Repository";
import { GetAllConfiguredQualityIssuesProgramsUseCase } from "$/domain/usecases/GetAllConfiguredQualityIssuesProgramsUseCase";
import { QualityIssuesProgramTestRepository } from "$/data/repositories/QualityIssuesProgramTestRepository";
import { QualityIssuesProgramRepository } from "$/domain/repositories/QualityIssuesProgramRepository";
import { GetMetadataItemUseCase } from "$/domain/usecases/GetMetadataItemUseCase";
import { GetAllQualityIssuesProgramsUseCase } from "$/domain/usecases/GetAllQualityIssuesProgramsUseCase";
import { GetAllModulesUseCase } from "$/domain/usecases/GetAllModulesUseCase";
import { GetPaginatedModulesUseCase } from "$/domain/usecases/GetPaginatedModulesUseCase";
import { DataQualityIssuesProgramConfigRepository } from "$/domain/repositories/DataQualityIssuesProgramConfigRepository";
import { DataQualityIssuesProgramConfigD2Repository } from "$/data/repositories/DataQualityIssuesProgramConfigD2Repository";
import { SaveDataQualityIssuesProgramConfigUseCase } from "$/domain/usecases/SaveDataQualityIssuesProgramConfigUseCase";
import { DataQualityIssuesProgramConfigTestRepository } from "$/data/repositories/DataQualityIssuesProgramConfigTestRepository";
import { GetDataQualityWorkflowSettingsUseCase } from "$/domain/usecases/GetDataQualityWorkflowSettingsUseCase";
import { DataQualityWorkflowSettingsRepository } from "$/domain/repositories/DataQualityWorkflowSettingsRepository";
import { DataQualityWorkflowSettingsD2Repository } from "$/data/repositories/DataQualityWorkflowSettingsD2Repository";
import { DataQualityWorkflowSettingsTestRepository } from "$/data/repositories/DataQualityWorkflowSettingsTestRepository";
import { GetDataQualityIssuesProgramConfigUseCase } from "$/domain/usecases/GetDataQualityIssuesProgramConfigUseCase";
import { RemoveDataQualityAnalysisConfigUseCase } from "$/domain/usecases/RemoveDataQualityAnalysisConfigUseCase";
import { SendNotificationUseCase } from "$/domain/usecases/SendNotificationUseCase";
import { IssueNotificationRepository } from "$/domain/repositories/IssueNotificationRepository";
import { IssueNotificationD2Repository } from "$/data/repositories/IssueNotificationD2Repository";
import { IssueNotificationTestRepository } from "$/data/repositories/IssueNotificationTestRepository";
import { GetUserByIdentifierUseCase } from "$/domain/usecases/GetUserByIdentifierUseCase";
import { UserGroupRepository } from "$/domain/repositories/UserGroupRepository";
import { UserGroupD2Repository } from "$/data/repositories/UserGroupD2Repository";
import { UserGroupTestRepository } from "$/data/repositories/UserGroupTestRepository";
import { GetIssueNotificationsUseCase } from "$/domain/usecases/GetIssueNotificationsUseCase";

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

type Repositories = {
    usersRepository: UserRepository;
    qualityAnalysisRepository: QualityAnalysisRepository;
    metadataRepository: MetadataRepository;
    settingsRepository: SettingsRepository;
    moduleRepository: ModuleRepository;
    analysisSectionRepository: AnalysisSectionRepository;
    outlierRepository: OutlierRepository;
    issueRepository: IssueRepository;
    countryRepository: CountryRepository;
    sequentialRepository: SequentialRepository;
    dataValueRepository: DataValueRepository;
    validationRuleGroupRepository: ValidationRuleGroupRepository;
    validationRuleAnalysisRepository: ValidationRuleAnalysisRepository;
    issueExportRepository: IssueExportRepository;
    qualityIssuesProgramRepository: QualityIssuesProgramRepository;
    dataQualityIssuesProgramConfigRepository: DataQualityIssuesProgramConfigRepository;
    dataQualityWorkflowSettingsRepository: DataQualityWorkflowSettingsRepository;
    issueNotificationRepository: IssueNotificationRepository;
    userGroupRepository: UserGroupRepository;
};

function getCompositionRoot(repositories: Repositories) {
    return {
        countries: {
            getByIds: new GetCountriesByIdsUseCase(repositories.countryRepository),
        },
        users: { getCurrent: new GetCurrentUserUseCase(repositories.usersRepository) },
        modules: {
            get: new GetModulesUseCase(repositories.moduleRepository),
            getAllBase: new GetAllModulesUseCase(repositories.moduleRepository),
            getDisaggregations: new GetDisaggregationsUseCase(repositories.moduleRepository),
            getPaginated: new GetPaginatedModulesUseCase(repositories.moduleRepository),
        },
        qualityAnalysis: {
            get: new GetQualityAnalysisUseCase(repositories.qualityAnalysisRepository),
            getById: new GetAnalysisByIdUseCase(repositories.qualityAnalysisRepository),
            create: new CreateQualityAnalysisUseCase(
                repositories.qualityAnalysisRepository,
                repositories.usersRepository,
                repositories.settingsRepository,
                repositories.analysisSectionRepository,
                repositories.sequentialRepository
            ),
            remove: new RemoveQualityUseCase(repositories.qualityAnalysisRepository),
            saveConfig: new SaveConfigAnalysisUseCase(repositories.qualityAnalysisRepository),
            updateStatus: new UpdateStatusAnalysisUseCase(repositories.qualityAnalysisRepository),
            validationRuleGroup: {
                get: new GetValidationRuleGroupUseCase(repositories.validationRuleGroupRepository),
            },
        },
        outlier: {
            get: new GetOutlierIssuesUseCase(repositories.issueRepository),
            run: new RunOutlierUseCase(
                repositories.outlierRepository,
                repositories.qualityAnalysisRepository,
                repositories.issueRepository,
                repositories.moduleRepository
            ),
        },
        practitioners: {
            run: new RunPractitionersValidationUseCase(
                repositories.qualityAnalysisRepository,
                repositories.moduleRepository,
                repositories.dataValueRepository,
                repositories.issueRepository
            ),
        },
        missingDisaggregates: {
            get: new GetMissingDisaggregatesUseCase(
                repositories.qualityAnalysisRepository,
                repositories.moduleRepository,
                repositories.dataValueRepository,
                repositories.issueRepository
            ),
        },
        issues: {
            save: new SaveIssueUseCase(
                repositories.qualityAnalysisRepository,
                repositories.issueRepository,
                repositories.usersRepository
            ),
            copyEmails: new CopyContactEmailsUseCase(
                repositories.qualityAnalysisRepository,
                repositories.issueRepository
            ),
            export: new ExportIssuesUseCase(
                repositories.issueRepository,
                repositories.issueExportRepository
            ),
            create: new CreateIssueUseCase(
                repositories.qualityAnalysisRepository,
                repositories.issueRepository
            ),
            getNotifications: new GetIssueNotificationsUseCase(
                repositories.issueNotificationRepository
            ),
            sendNotification: new SendNotificationUseCase(repositories.issueNotificationRepository),
            searchUserAndUserGroup: new GetUserByIdentifierUseCase(
                repositories.usersRepository,
                repositories.userGroupRepository
            ),
        },
        settings: { get: new GetSettingsUseCase(repositories.settingsRepository) },
        summary: {
            get: new GetAllIssuesUseCase(repositories.issueRepository),
        },
        nursingMidwifery: {
            validate: new ValidateMidwiferyAndPersonnelUseCase(
                repositories.qualityAnalysisRepository,
                repositories.issueRepository,
                repositories.dataValueRepository,
                repositories.moduleRepository
            ),
        },
        validationRules: {
            get: new GetValidationRuleGroupUseCase(repositories.validationRuleGroupRepository),
            run: new RunValidationsUseCase(
                repositories.qualityAnalysisRepository,
                repositories.issueRepository,
                repositories.validationRuleAnalysisRepository,
                repositories.validationRuleGroupRepository,
                repositories.countryRepository
            ),
        },
        qualityIssuesProgram: {
            getAllConfigured: new GetAllConfiguredQualityIssuesProgramsUseCase(
                repositories.qualityIssuesProgramRepository
            ),
            getAll: new GetAllQualityIssuesProgramsUseCase(
                repositories.qualityIssuesProgramRepository
            ),
        },
        metadataItem: {
            get: new GetMetadataItemUseCase(repositories.metadataRepository),
        },
        dataQualityIssuesProgramConfig: {
            save: new SaveDataQualityIssuesProgramConfigUseCase(
                repositories.dataQualityIssuesProgramConfigRepository
            ),
            get: new GetDataQualityIssuesProgramConfigUseCase(
                repositories.dataQualityIssuesProgramConfigRepository
            ),
            remove: new RemoveDataQualityAnalysisConfigUseCase(
                repositories.dataQualityIssuesProgramConfigRepository,
                repositories.qualityAnalysisRepository
            ),
        },
        dataQualityWorkflowSettings: {
            get: new GetDataQualityWorkflowSettingsUseCase(
                repositories.dataQualityWorkflowSettingsRepository
            ),
        },
    };
}

export function getWebappCompositionRoot(api: D2Api) {
    const repositories: Repositories = {
        usersRepository: new UserD2Repository(api),
        qualityAnalysisRepository: new QualityAnalysisD2Repository(api),
        metadataRepository: new MetadataD2Repository(api),
        settingsRepository: new SettingsD2Repository(api),
        moduleRepository: new ModuleD2Repository(api),
        analysisSectionRepository: new AnalysisSectionD2Repository(),
        outlierRepository: new OutlierD2Repository(api),
        issueRepository: new IssueD2Repository(api),
        countryRepository: new CountryD2Repository(api),
        sequentialRepository: new SequentialD2Repository(api),
        dataValueRepository: new DataValueD2Repository(api),
        validationRuleGroupRepository: new ValidationRuleD2Repository(api),
        validationRuleAnalysisRepository: new ValidationRuleAnalysisD2Repository(api),
        issueExportRepository: new IssueSpreadSheetRepository(),
        qualityIssuesProgramRepository: new QualityIssuesProgramD2Repository(api),
        dataQualityIssuesProgramConfigRepository: new DataQualityIssuesProgramConfigD2Repository(
            api
        ),
        dataQualityWorkflowSettingsRepository: new DataQualityWorkflowSettingsD2Repository(api),
        issueNotificationRepository: new IssueNotificationD2Repository(api),
        userGroupRepository: new UserGroupD2Repository(api),
    };

    return getCompositionRoot(repositories);
}

export function getTestCompositionRoot() {
    const repositories: Repositories = {
        usersRepository: new UserTestRepository(),
        qualityAnalysisRepository: new QualityAnalysisTestRepository(),
        metadataRepository: new MetadataTestRepository(),
        settingsRepository: new SettingsTestRepository(),
        moduleRepository: new ModuleTestRepository(),
        analysisSectionRepository: new AnalysisSectionTestRepository(),
        outlierRepository: new OutlierTestRepository(),
        issueRepository: new IssueTestRepository(),
        countryRepository: new CountryTestRepository(),
        sequentialRepository: new SequentialTestRepository(),
        dataValueRepository: new DataValueTestRepository(),
        validationRuleGroupRepository: new ValidationRuleTestRepository(),
        validationRuleAnalysisRepository: new ValidationRuleAnalysisTestRepository(),
        issueExportRepository: new IssueSpreadSheetTestRepository(),
        qualityIssuesProgramRepository: new QualityIssuesProgramTestRepository(),
        dataQualityIssuesProgramConfigRepository:
            new DataQualityIssuesProgramConfigTestRepository(),
        dataQualityWorkflowSettingsRepository: new DataQualityWorkflowSettingsTestRepository(),
        issueNotificationRepository: new IssueNotificationTestRepository(),
        userGroupRepository: new UserGroupTestRepository(),
    };

    return getCompositionRoot(repositories);
}
