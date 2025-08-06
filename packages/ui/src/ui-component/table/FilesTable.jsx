import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { styled } from '@mui/material/styles'
import {
    Box,
    IconButton,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
    alpha
} from '@mui/material'
import { tableCellClasses } from '@mui/material/TableCell'
import { IconTrash } from '@tabler/icons-react'

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

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.error.main,
    backgroundColor: alpha(theme.palette.error.main, 0.08),
    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
    borderRadius: 8,
    padding: 8,
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: alpha(theme.palette.error.main, 0.15),
        borderColor: theme.palette.error.main,
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.25)}`
    },

    '& .MuiSvgIcon-root': {
        fontSize: '1.125rem'
    }
}))

export const FilesTable = ({ data, isLoading, filterFunction, handleDelete }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const formatFileSize = (sizeInMB) => {
        if (sizeInMB < 1) {
            return `${(sizeInMB * 1024).toFixed(0)} KB`
        }
        return `${sizeInMB.toFixed(2)} MB`
    }

    const renderLoadingRow = () => (
        <StyledTableRow>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='90%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='60%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='circular' width={32} height={32} />
            </StyledTableCell>
        </StyledTableRow>
    )

    return (
        <StyledTableContainer component={Paper}>
            <StyledTable size='medium' aria-label='files table'>
                <TableHead>
                    <TableRow>
                        <StyledTableCell component='th' scope='row' style={{ width: '30%' }}>
                            File Name
                        </StyledTableCell>
                        <StyledTableCell style={{ width: '40%' }}>File Path</StyledTableCell>
                        <StyledTableCell style={{ width: '20%' }}>File Size</StyledTableCell>
                        <StyledTableCell style={{ width: '10%' }}>Actions</StyledTableCell>
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
                        data?.filter(filterFunction).map((row, index) => (
                            <StyledTableRow key={`${row.name}-${index}`}>
                                <StyledTableCell>
                                    <Tooltip title={row.name} placement='top'>
                                        <Typography
                                            sx={{
                                                display: '-webkit-box',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                lineHeight: 1.4,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            {row.name.split('/').pop()}
                                        </Typography>
                                    </Tooltip>
                                </StyledTableCell>

                                <StyledTableCell>
                                    <Tooltip title={row.path} placement='top'>
                                        <Typography
                                            sx={{
                                                display: '-webkit-box',
                                                fontSize: '0.8125rem',
                                                fontWeight: 400,
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                lineHeight: 1.3,
                                                color: theme.palette.text.secondary,
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            {row.path}
                                        </Typography>
                                    </Tooltip>
                                </StyledTableCell>

                                <StyledTableCell>
                                    <Typography
                                        sx={{
                                            fontSize: '0.8125rem',
                                            fontWeight: 500,
                                            color: theme.palette.text.secondary,
                                            padding: '4px 8px',
                                            backgroundColor:
                                                theme.palette.mode === 'dark'
                                                    ? alpha(theme.palette.info.main, 0.1)
                                                    : alpha(theme.palette.info.main, 0.08),
                                            borderRadius: 1,
                                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                                            display: 'inline-block',
                                            minWidth: 'fit-content'
                                        }}
                                    >
                                        {formatFileSize(row.size)}
                                    </Typography>
                                </StyledTableCell>

                                <StyledTableCell>
                                    <Tooltip title='Delete file' placement='top'>
                                        <StyledIconButton onClick={() => handleDelete(row)} size='small' aria-label={`Delete ${row.name}`}>
                                            <IconTrash />
                                        </StyledIconButton>
                                    </Tooltip>
                                </StyledTableCell>
                            </StyledTableRow>
                        ))
                    )}
                </TableBody>
            </StyledTable>
        </StyledTableContainer>
    )
}

FilesTable.propTypes = {
    data: PropTypes.array,
    isLoading: PropTypes.bool,
    filterFunction: PropTypes.func,
    handleDelete: PropTypes.func
}
