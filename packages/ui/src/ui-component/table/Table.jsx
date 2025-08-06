import PropTypes from 'prop-types'
import { styled } from '@mui/material/styles'
import {
    TableContainer,
    Table,
    TableHead,
    TableCell,
    TableRow,
    TableBody,
    Paper,
    Chip,
    Stack,
    Typography,
    useTheme,
    alpha
} from '@mui/material'
import { tableCellClasses } from '@mui/material/TableCell'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'

// Enhanced styled components matching the previous tables
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    background:
        theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
}))

const StyledTable = styled(Table)(({ theme }) => ({
    minWidth: 650,
    '& .MuiTableCell-root': {
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
    }
}))

// Improved table header styling - less bulged, more refined
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: alpha(theme.palette.divider, 0.08),

    [`&.${tableCellClasses.head}`]: {
        background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.6) : alpha(theme.palette.grey[50], 0.8),
        color: theme.palette.text.primary,
        fontWeight: 600,
        fontSize: '0.8125rem',
        letterSpacing: '0.025em',
        textTransform: 'uppercase',
        padding: '12px 20px',
        height: 48,
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(8px)'
    },

    [`&.${tableCellClasses.body}`]: {
        fontSize: '0.875rem',
        fontWeight: 400,
        color: theme.palette.text.primary,
        padding: '16px 20px',
        transition: 'all 0.2s ease'
    }
}))

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.04),
        transform: 'translateY(-1px)',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.08)'
    },

    '&:last-child td, &:last-child th': {
        border: 0
    },

    '&:nth-of-type(even)': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.02) : alpha(theme.palette.grey[50], 0.3)
    }
}))

const StyledChip = styled(Chip)(({ theme }) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    borderRadius: 12,
    transition: 'all 0.2s ease',

    '&.MuiChip-colorPrimary': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
    },

    '&:not(.MuiChip-colorPrimary)': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[500], 0.2) : alpha(theme.palette.grey[500], 0.1),
        color: theme.palette.text.secondary,
        border: `1px solid ${alpha(theme.palette.grey[500], 0.3)}`
    },

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
    }
}))

const StyledTypography = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    color: theme.palette.text.primary,
    lineHeight: 1.4
}))

const SchemaContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : alpha(theme.palette.grey[100], 0.6),
    padding: '8px 12px',
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    maxWidth: '300px',
    overflow: 'auto'
}))

export const TableViewOnly = ({ columns, rows, sx }) => {
    const theme = useTheme()

    // Helper function to safely render cell content
    const renderCellContent = (key, row) => {
        if (row[key] === null || row[key] === undefined) {
            return (
                <StyledTypography
                    sx={{
                        fontStyle: 'italic',
                        color: 'text.disabled',
                        fontSize: '0.8125rem'
                    }}
                >
                    —
                </StyledTypography>
            )
        } else if (key === 'enabled') {
            return row[key] ? <StyledChip label='Enabled' color='primary' size='small' /> : <StyledChip label='Disabled' size='small' />
        } else if (key === 'type' && row.schema) {
            // If there's schema information, add a tooltip
            let schemaContent
            if (Array.isArray(row.schema)) {
                // Handle array format: [{ name: "field", type: "string" }, ...]
                schemaContent =
                    '[<br>' +
                    row.schema
                        .map(
                            (item) =>
                                `&nbsp;&nbsp;${JSON.stringify(
                                    {
                                        [item.name]: item.type
                                    },
                                    null,
                                    2
                                )}`
                        )
                        .join(',<br>') +
                    '<br>]'
            } else if (typeof row.schema === 'object' && row.schema !== null) {
                // Handle object format: { "field": "string", "field2": "number", ... }
                schemaContent = JSON.stringify(row.schema, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')
            } else {
                schemaContent = 'No schema available'
            }

            return (
                <Stack direction='row' alignItems='center' spacing={1}>
                    <StyledTypography>{row[key]}</StyledTypography>
                    <TooltipWithParser
                        title={`<div style="font-family: monospace; font-size: 0.75rem;">Schema:<br/>${schemaContent}</div>`}
                    />
                </Stack>
            )
        } else if (typeof row[key] === 'object') {
            // For other objects (that are not handled by special cases above)
            return (
                <StyledTypography
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8125rem',
                        color: 'text.secondary',
                        backgroundColor:
                            theme.palette.mode === 'dark'
                                ? alpha(theme.palette.background.paper, 0.3)
                                : alpha(theme.palette.grey[100], 0.5),
                        padding: '4px 8px',
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {JSON.stringify(row[key])}
                </StyledTypography>
            )
        } else {
            return <StyledTypography>{row[key]}</StyledTypography>
        }
    }

    return (
        <StyledTableContainer component={Paper}>
            <StyledTable sx={sx} aria-label='data table'>
                <TableHead>
                    <TableRow>
                        {columns.map((col, index) => (
                            <StyledTableCell key={index}>
                                <Stack direction='row' alignItems='center' spacing={1}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            color: 'inherit',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.025em'
                                        }}
                                    >
                                        {col === 'enabled' ? 'Override' : col.charAt(0).toUpperCase() + col.slice(1)}
                                    </Typography>
                                    {col === 'enabled' && (
                                        <TooltipWithParser
                                            style={{ marginLeft: 4 }}
                                            title={
                                                'If enabled, this variable can be overridden in API calls and embeds. If disabled, any overrides will be ignored. To change this, go to Security settings in Chatflow Configuration.'
                                            }
                                        />
                                    )}
                                </Stack>
                            </StyledTableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, index) => (
                        <StyledTableRow key={index}>
                            {Object.keys(row).map((key, cellIndex) => {
                                if (key !== 'id' && key !== 'schema') {
                                    return <StyledTableCell key={cellIndex}>{renderCellContent(key, row)}</StyledTableCell>
                                }
                                return null
                            })}
                        </StyledTableRow>
                    ))}
                </TableBody>
            </StyledTable>
        </StyledTableContainer>
    )
}

TableViewOnly.propTypes = {
    rows: PropTypes.array,
    columns: PropTypes.array,
    sx: PropTypes.object
}
