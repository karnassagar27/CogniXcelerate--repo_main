import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { styled } from '@mui/material/styles'
import { tableCellClasses } from '@mui/material/TableCell'
import {
    Box,
    Button,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme,
    alpha
} from '@mui/material'

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
    cursor: 'pointer',
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

const LoadingSkeleton = styled(Skeleton)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[700], 0.3) : alpha(theme.palette.grey[300], 0.3),
    borderRadius: 8,
    '&::after': {
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.1)}, transparent)`
    }
}))

const ToolIconContainer = styled(Box)(({ theme }) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    flexShrink: 0,
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.grey[100], 0.8),
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',

    '&:hover': {
        transform: 'scale(1.05)',
        borderColor: theme.palette.primary.main,
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
    },

    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
            theme.palette.secondary.main,
            0.1
        )} 100%)`,
        opacity: 0,
        transition: 'opacity 0.2s ease'
    },

    '&:hover::before': {
        opacity: 1
    }
}))

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'none',
    textAlign: 'left',
    justifyContent: 'flex-start',
    padding: '4px 8px',
    borderRadius: 8,
    transition: 'all 0.2s ease',
    minHeight: 'auto',

    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        color: theme.palette.primary.dark,
        textDecoration: 'underline'
    }
}))

export const ToolsTable = ({ data, isLoading, onSelect }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const renderLoadingRow = () => (
        <StyledTableRow>
            <StyledTableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LoadingSkeleton variant='circular' width={40} height={40} />
                    <LoadingSkeleton variant='text' width='60%' height={24} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='90%' height={20} />
                <LoadingSkeleton variant='text' width='70%' height={20} sx={{ mt: 1 }} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='rectangular' width={24} height={16} />
            </StyledTableCell>
        </StyledTableRow>
    )

    return (
        <StyledTableContainer component={Paper}>
            <StyledTable size='medium' aria-label='tools table'>
                <TableHead>
                    <TableRow>
                        <StyledTableCell component='th' scope='row' style={{ width: '40%' }}>
                            Tool Name
                        </StyledTableCell>
                        <StyledTableCell style={{ width: '50%' }}>Description</StyledTableCell>
                        <StyledTableCell style={{ width: '10%' }}>&nbsp;</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading ? (
                        <>
                            {[...Array(3)].map((_, index) => (
                                <Box key={index}>{renderLoadingRow()}</Box>
                            ))}
                        </>
                    ) : (
                        data?.map((row, index) => (
                            <StyledTableRow key={`${row.name}-${index}`}>
                                <StyledTableCell>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2
                                        }}
                                    >
                                        <ToolIconContainer>
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundImage: `url(${row.iconSrc})`,
                                                    backgroundSize: 'contain',
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'center center',
                                                    zIndex: 1,
                                                    position: 'relative'
                                                }}
                                            />
                                        </ToolIconContainer>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <StyledButton onClick={() => onSelect(row)} fullWidth disableRipple>
                                                <Typography
                                                    sx={{
                                                        display: '-webkit-box',
                                                        fontSize: 'inherit',
                                                        fontWeight: 'inherit',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden',
                                                        lineHeight: 1.4,
                                                        textAlign: 'left',
                                                        width: '100%'
                                                    }}
                                                >
                                                    {row.templateName || row.name}
                                                </Typography>
                                            </StyledButton>
                                        </Box>
                                    </Box>
                                </StyledTableCell>

                                <StyledTableCell>
                                    <Typography
                                        sx={{
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'pre-line',
                                            fontSize: '0.8125rem',
                                            lineHeight: 1.5,
                                            color: theme.palette.text.secondary,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {row.description || (
                                            <span
                                                style={{
                                                    fontStyle: 'italic',
                                                    color: theme.palette.text.disabled
                                                }}
                                            >
                                                No description available
                                            </span>
                                        )}
                                    </Typography>
                                </StyledTableCell>

                                <StyledTableCell>{/* Empty cell for consistent spacing */}</StyledTableCell>
                            </StyledTableRow>
                        ))
                    )}
                </TableBody>
            </StyledTable>
        </StyledTableContainer>
    )
}

ToolsTable.propTypes = {
    data: PropTypes.array,
    isLoading: PropTypes.bool,
    onSelect: PropTypes.func
}
