import React from "react";
import { ObjectsTable, useObjectsTable } from "@eyeseetea/d2-ui-components";
import styled from "styled-components";

import { useGetModuleRows } from "$/webapp/components/modules-table/useGetModuleRows";
import { useModulesTableConfig } from "$/webapp/components/modules-table/useModulesTableConfig";
import { QualityIssuesProgram } from "$/domain/entities/QualityIssuesProgram";

type ModulesTableProps = {
    qualityIssuesPrograms: QualityIssuesProgram[];
    paginated?: boolean;
};

export const ModulesTable: React.FC<ModulesTableProps> = React.memo(props => {
    const { qualityIssuesPrograms, paginated = false } = props;

    const { tableConfig } = useModulesTableConfig(paginated);

    const { getRows, loading } = useGetModuleRows(qualityIssuesPrograms, paginated);

    const config = useObjectsTable(tableConfig, getRows);

    return (
        <Container>
            <ObjectsTable
                loading={loading}
                {...config}
                paginationOptions={{
                    renderPosition: {
                        top: paginated,
                        bottom: paginated,
                    },
                }}
            />
        </Container>
    );
});

const Container = styled.div``;
