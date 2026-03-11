# Data Quality Extended

Data Quality Extended is a DHIS2 application designed to help users **assess and improve the quality of their data**.

The app allows users to analyze the quality of their DHIS2 Data Sets, automatically detect potential data quality issues (such as outliers or validation rule violations), or manually register additional issues when needed, providing a single place to review, track, and follow up on data quality problems.

## Prerequisites

### DHIS2 Metadata Requirements

The app requires at least a **Tracker Program** with predefined metadata codes.

Multiple Data Quality Tracker Programs can be created in the same DHIS2 instance.

Each program **must follow exactly the same metadata structure** described below.
The only allowed difference between programs is the **prefix used in `code` and `name` values**,
which uniquely identifies each Data Quality program.

For every additional program:

-   All **codes and names must be identical** to the ones described in this document,
    replacing the placeholder `PREFIX` with a user-defined prefix (for example: `TEST`, `MAL`, `WHO`).
-   The **same prefix may be reused only for the Tracker Program code** by changing the numeric suffix  
    (for example: `TEST_DQI_001`, `TEST_DQI_002`, `TEST_DQI_003`).
-   All other metadata objects (Tracked Entity Type, Data Elements, Tracked Entity Attributes, Option Sets, Program Stages)
    **must keep exactly the same codes**, with no numeric variations.
-   No other changes to codes, names, value types, or structure are allowed.

This allows the application to support multiple Data Quality analyses in parallel,
while still being able to identify and configure each program correctly.

If the metadata does not follow these rules, the application will not work correctly.

### Metadata

#### Tracker Program

-   One **Tracker Program** with the following code:

    `PREFIX_DQI_001`

The program **must be assigned to the Organisation Unit at level 1** (the root Organisation Unit),
otherwise users will not be able to enroll or capture data and the app will not work correctly.

**Analysis steps and Program Stages**

In the application, each Program Stage represents a step in the data quality analysis workflow.
The application presents these steps as sequential stages of the analysis and uses the events of each Program Stage to store, track, and follow up on data quality issues.

The application supports the analysis steps described below and can also support custom analysis steps, as long as a corresponding application component (UI and logic) has been developed and integrated into the app.

> **Note**
>
> The configuration of analysis steps is stored in the DHIS2 DataStore in namespace `data-quality` under the key: `steps-PROGRAM_CODE`
> where `PROGRAM_CODE` corresponds to the code of the Data Quality Tracker Program
> (for example: `steps_TEST_DQI_001`).
> For custom analysis steps, users must ensure that all steps are correctly configured in this key.
>
> If the configuration in this DataStore entry is incorrect,
> custom analysis steps will not be displayed or executed correctly.

##### Program Stage: Outliers

This Program Stage is used to store **data quality issues detected through outlier analysis**,
based on the standard DHIS2 min–max outlier detection functionality.

-   **Name:** Outliers
-   **Scheduled days from start:** `0`
-   **Repeatable:** enabled
-   **Auto-generate event:** enabled
-   **Hide due date:** enabled
-   **Open data entry form after enrollment:** enabled

All other options should remain with their default values.

##### Program Stage: Validation

This Program Stage is used to store **data quality issues detected through validation rules analysis**.

-   **Name:** Validation
-   **Scheduled days from start:** `1`
-   **Repeatable:** enabled
-   **Auto-generate event:** enabled
-   **Hide due date:** enabled
-   **Open data entry form after enrollment:** enabled

All other options should remain with their default values.

##### Program Stage: Manual Issues

This Program Stage is used to **manually register data quality issues**
that cannot be automatically detected through data analysis.

-   **Name:** Manual Issues
-   **Scheduled days from start:** `0`
-   **Repeatable:** enabled
-   **Auto-generate event:** enabled
-   **Hide due date:** enabled
-   **Open data entry form after enrollment:** disabled

All other options should remain with their default values.

##### Data Elements assignment (all Program Stages)

All Program Stages defined in this program **must have the same set of Data Elements assigned**.

All Data Elements defined in the metadata section **must be assigned to every Program Stage**.

Unless stated otherwise for a specific stage, the following Data Elements  
**must be marked as compulsory in all Program Stages**:

-   `PREFIX_DQI_Issue_Number`
-   `PREFIX_DQI_Issue_Correlative_Number`
-   `PREFIX_DQI_Section_Number`

All other Data Elements must be assigned as **non-compulsory**.

#### Tracked Entity Type

-   One **Tracked Entity Type** with the following **name**:

    `PREFIX_DQI - Data Quality Analysis`

#### Tracked Entity Attributes (TEA)

> **Default value type:** All Tracked Entity Attributes are **TEXT** unless stated otherwise.

The following Tracked Entity Attributes **must exist** (codes must match exactly):

-   `PREFIX_DQI_TEA_Name`
-   `PREFIX_DQI_TEA_Dataset`
-   `PREFIX_DQI_TEA_Status`
-   `PREFIX_DQI_TEA_Start_Date`
-   `PREFIX_DQI_TEA_End_Date`
-   `PREFIX_DQI_TEA_Last_Modification`
-   `PREFIX_DQI_TEA_Countries_Analysis` — **LONG_TEXT**
-   `PREFIX_DQI_TEA_Sequential` — **TEXT**
    -   **Unique**: entire system
    -   **Automatically generated** with pattern: `SEQUENTIAL(######)`

#### Data Elements

> **Default value type:** All Data Elements are **TEXT** unless stated otherwise.

The Tracker Program stages must include Data Elements with the following codes:

-   `PREFIX_DQI_Action` — **Option Set:** `PREFIX_DQI_Action`
-   `PREFIX_DQI_Action_Description` — **LONG_TEXT**
-   `PREFIX_DQI_Azure_URL` — **URL**
-   `PREFIX_DQI_Category_Option`
-   `PREFIX_DQI_Comments` — **LONG_TEXT**
-   `PREFIX_DQI_Contact_Emails` — **LONG_TEXT**
-   `PREFIX_DQI_Issue_Correlative_Number` — **NUMBER**
-   `PREFIX_DQI_Country` — **ORGANISATION_UNIT**
    -   Aggregation type: **Average** (sum in org unit hierarchy)
-   `PREFIX_DQI_DataElement`
-   `PREFIX_DQI_Description` — **LONG_TEXT**
-   `PREFIX_DQI_Follow-Up` — **BOOLEAN** (Yes/No)
-   `PREFIX_DQI_Issue_Number` — **TEXT**
-   `PREFIX_DQI_Period` — **TEXT**
-   `PREFIX_DQI_Section_Number` — **NUMBER**
-   `PREFIX_DQI_Status` — **Option Set:** `PREFIX_DQI_Status`
-   `PREFIX_DQI_Conversation_ID` - **TEXT**

#### Option Sets

The following Option Sets **must exist**:

-   `PREFIX_DQI_Action`

    -   Name: No action — Code: `0`
    -   Name: Data modification from HQ — Code: `1`
    -   Name: Data modification from country — Code: `2`

-   `PREFIX_DQI_Status`
    -   Name: Not treated — Code: `0`
    -   Name: In treatment — Code: `1`
    -   Name: Waiting for focal point — Code: `2`
    -   Name: Resolved — Code: `3`
    -   Name: Dismissed — Code: `4`

### Datastore

The app uses a **DHIS2 DataStore entry** with:

-   **Namespace:** `data-quality`
-   **Key:** `programs-template`

This DataStore entry is **mandatory** and must be created **exactly as shown below**.

The JSON must be **copied and pasted verbatim** into the DataStore.
**Do NOT replace the `PREFIX` placeholder in this template.**

The `programs-template` entry is used by the application to **validate and check**
that the Tracker Program metadata has been correctly created and follows the required structure.

If this DataStore entry is missing, incorrectly named, or modified,
the application will not be able to recognize or configure the program and will not work correctly.

#### Template structure

```json
{
    "dataElements": {
        "action": "PREFIX_DQI_Action",
        "actionDescription": "PREFIX_DQI_Action_Description",
        "azureUrl": "PREFIX_DQI_Azure_URL",
        "categoryOption": "PREFIX_DQI_Category_Option",
        "comments": "PREFIX_DQI_Comments",
        "contactEmails": "PREFIX_DQI_Contact_Emails",
        "conversationId": "PREFIX_DQI_Conversation_ID",
        "correlative": "PREFIX_DQI_Issue_Correlative_Number",
        "country": "PREFIX_DQI_Country",
        "dataElement": "PREFIX_DQI_DataElement",
        "description": "PREFIX_DQI_Description",
        "followUp": "PREFIX_DQI_Follow-Up",
        "issueNumber": "PREFIX_DQI_Issue_Number",
        "period": "PREFIX_DQI_Period",
        "sectionNumber": "PREFIX_DQI_Section_Number",
        "status": "PREFIX_DQI_Status"
    },
    "dataSets": [],
    "optionSets": {
        "action": "PREFIX_DQI_Action",
        "status": "PREFIX_DQI_Status"
    },
    "programs": {
        "qualityIssues": "PREFIX_DQI_001"
    },
    "trackedEntityAttributes": {
        "countries": "PREFIX_DQI_TEA_Countries_Analysis",
        "endDate": "PREFIX_DQI_TEA_End_Date",
        "lastModification": "PREFIX_DQI_TEA_Last_Modification",
        "module": "PREFIX_DQI_TEA_Dataset",
        "name": "PREFIX_DQI_TEA_Name",
        "sequential": "PREFIX_DQI_TEA_Sequential",
        "startDate": "PREFIX_DQI_TEA_Start_Date",
        "status": "PREFIX_DQI_TEA_Status"
    },
    "trackedEntityTypes": {
        "dataQuality": "PREFIX_DQI - Data Quality Analysis"
    }
}
```

> **Note**
>
> After completing the Data Quality Analysis setup in the application,
> users must ensure that the configuration stored in the DHIS2 DataStore
> under the key `programs-PROGRAM_CODE` is correctly defined,
> where `PROGRAM_CODE` corresponds to the code of the Data Quality Tracker Program
> (for example: `steps_TEST_DQI_001`).
>
> The **Contact Emails auto-fill** feature relies on the configuration stored in the DHIS2 DataStore
> under the key `programs-PROGRAM_CODE`.
> To enable this feature, the `userGroups` property must be correctly defined in this configuration.
> If the `userGroups` configuration is missing or incorrect,
> the Contact Emails auto-fill feature will not work.

## Setup

```
$ nvm use # uses node version in .nvmrc
$ yarn install
```

## Build

Build a production distributable DHIS2 zip file:

```
$ yarn build
```

## Development

Copy `.env` to `.env.local` and configure DHIS2 instance to use. Then start the development server:

```
$ yarn start
```

Now in your browser, go to `http://localhost:8081`.

## Tests

```
$ yarn test
```

## Some development tips

### Clean architecture folder structure

-   `src/domain`: Domain layer of the app (entities, use cases, repository definitions)
-   `src/data`: Data of the app (repository implementations)
-   `src/webapp/pages`: Main React components.
-   `src/webapp/components`: React components.
-   `src/utils`: Misc utilities.
-   `i18n/`: Contains literal translations (gettext format)
-   `public/`: General non-React webapp resources.

## Data structures

-   `Future.ts`: Async values, similar to promises, but cancellables and with type-safe errors.
-   `Collection.ts`: Similar to Lodash, provides a wrapper over JS arrays.
-   `Obj.ts`: Similar to Lodash, provides a wrapper over JS objects.
-   `HashMap.ts`: Similar to ES6 map, but immutable.
-   `Struct.ts`: Base class for typical classes with attributes. Features: create, update.
-   `Either.ts`: Either a success value or an error.

## Docs

We use [TypeDoc](https://typedoc.org/example/):

```
$ yarn generate-docs
```

### i18n

Update i18n .po files from `i18n.t(...)` calls in the source code:

```
$ yarn localize
```

### Scripts

Check the example script, entry `"script-example"`in `package.json`->scripts and `src/scripts/example.ts`.

### Misc Notes

-   Requests to DHIS2 will be transparently proxied (see `vite.config.ts` -> `server.proxy`) from `http://localhost:8081/dhis2/xyz` to `${VITE_DHIS2_BASE_URL}/xyz`. This prevents CORS and cross-domain problems.

-   You can use `.env` variables within the React app: `const value = import.meta.env.NAME;`
