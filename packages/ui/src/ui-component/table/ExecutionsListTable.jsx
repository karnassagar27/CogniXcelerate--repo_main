import { useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import moment from 'moment'
import { styled } from '@mui/material/styles'
import {
    Box,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    useTheme,
    Checkbox,
    alpha
} from '@mui/material'
import { tableCellClasses } from '@mui/material/TableCell'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { IconLoader, IconCircleXFilled } from '@tabler/icons-react'

// Enhanced styled components matching FlowListTable
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
        backdropFilter: 'blur(8px)',
        '& .MuiTableSortLabel-root': {
            color: 'inherit',
            fontWeight: 600,
            '&:hover': {
                color: theme.palette.primary.main
            },
            '&.Mui-active': {
                color: theme.palette.primary.main,
                '& .MuiTableSortLabel-icon': {
                    color: theme.palette.primary.main
                }
            }
        }
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

const getIconFromStatus = (state, theme) => {
    switch (state) {
        case 'FINISHED':
            return CheckCircleIcon
        case 'ERROR':
        case 'TIMEOUT':
            return ErrorIcon
        case 'TERMINATED':
            // eslint-disable-next-line react/display-name
            return (props) => {
                const IconWrapper = (props) => <IconCircleXFilled {...props} color={theme.palette.error.main} />
                IconWrapper.displayName = 'TerminatedIcon'
                return <IconWrapper {...props} />
            }
        case 'STOPPED':
            return StopCircleIcon
        case 'INPROGRESS':
            // eslint-disable-next-line react/display-name
            return (props) => {
                const IconWrapper = (props) => (
                    // eslint-disable-next-line
                    <IconLoader {...props} color={theme.palette.warning.dark} className={`spin-animation ${props.className || ''}`} />
                )
                IconWrapper.displayName = 'InProgressIcon'
                return <IconWrapper {...props} />
            }
    }
}

const getIconColor = (state) => {
    switch (state) {
        case 'FINISHED':
            return 'success.dark'
        case 'ERROR':
        case 'TIMEOUT':
            return 'error.main'
        case 'TERMINATED':
        case 'STOPPED':
            return 'error.main'
        case 'INPROGRESS':
            return 'warning.main'
    }
}

export const ExecutionsListTable = ({ data, isLoading, onExecutionRowClick, onSelectionChange }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const localStorageKeyOrder = 'executions_order'
    const localStorageKeyOrderBy = 'executions_orderBy'

    const [order, setOrder] = useState(localStorage.getItem(localStorageKeyOrder) || 'desc')
    const [orderBy, setOrderBy] = useState(localStorage.getItem(localStorageKeyOrderBy) || 'updatedDate')
    const [selected, setSelected] = useState([])

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc'
        const newOrder = isAsc ? 'desc' : 'asc'
        setOrder(newOrder)
        setOrderBy(property)
        localStorage.setItem(localStorageKeyOrder, newOrder)
        localStorage.setItem(localStorageKeyOrderBy, property)
    }

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = data.map((n) => n.id)
            setSelected(newSelected)
            onSelectionChange && onSelectionChange(newSelected)
        } else {
            setSelected([])
            onSelectionChange && onSelectionChange([])
        }
    }

    const handleClick = (event, id) => {
        event.stopPropagation()
        const selectedIndex = selected.indexOf(id)
        let newSelected = []

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id)
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1))
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1))
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1))
        }

        setSelected(newSelected)
        onSelectionChange && onSelectionChange(newSelected)
    }

    const isSelected = (id) => selected.indexOf(id) !== -1

    const sortedData = data
        ? [...data].sort((a, b) => {
              if (orderBy === 'name') {
                  return order === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '')
              } else if (orderBy === 'updatedDate') {
                  return order === 'asc'
                      ? new Date(a.updatedDate) - new Date(b.updatedDate)
                      : new Date(b.updatedDate) - new Date(a.updatedDate)
              } else if (orderBy === 'createdDate') {
                  return order === 'asc'
                      ? new Date(a.createdDate) - new Date(b.createdDate)
                      : new Date(b.createdDate) - new Date(a.createdDate)
              }
              return 0
          })
        : []

    const renderLoadingRow = () => (
        <StyledTableRow>
            <StyledTableCell padding='checkbox'>
                <LoadingSkeleton variant='rectangular' width={18} height={18} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='circular' width={24} height={24} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='75%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='60%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
        </StyledTableRow>
    )

    return (
        <StyledTableContainer component={Paper}>
            <StyledTable size='medium' aria-label='executions table'>
                <TableHead>
                    <TableRow>
                        <StyledTableCell padding='checkbox'>
                            <Checkbox
                                color='primary'
                                indeterminate={selected.length > 0 && selected.length < data?.length}
                                checked={data?.length > 0 && selected.length === data?.length}
                                onChange={handleSelectAllClick}
                                inputProps={{
                                    'aria-label': 'select all executions'
                                }}
                                sx={{
                                    '&.Mui-checked': {
                                        color: theme.palette.primary.main
                                    },
                                    '&.MuiCheckbox-indeterminate': {
                                        color: theme.palette.primary.main
                                    }
                                }}
                            />
                        </StyledTableCell>
                        <StyledTableCell style={{ width: '10%' }}>Status</StyledTableCell>
                        <StyledTableCell style={{ width: '20%' }}>
                            <TableSortLabel
                                active={orderBy === 'updatedDate'}
                                direction={order}
                                onClick={() => handleRequestSort('updatedDate')}
                            >
                                Last Updated
                            </TableSortLabel>
                        </StyledTableCell>
                        <StyledTableCell style={{ width: '25%' }}>
                            <TableSortLabel active={orderBy === 'name'} direction={order} onClick={() => handleRequestSort('name')}>
                                Agentflow
                            </TableSortLabel>
                        </StyledTableCell>
                        <StyledTableCell style={{ width: '20%' }}>Session</StyledTableCell>
                        <StyledTableCell style={{ width: '20%' }}>
                            <TableSortLabel
                                active={orderBy === 'createdDate'}
                                direction={order}
                                onClick={() => handleRequestSort('createdDate')}
                            >
                                Created
                            </TableSortLabel>
                        </StyledTableCell>
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
                        sortedData.map((row, index) => {
                            const isItemSelected = isSelected(row.id)
                            const labelId = `enhanced-table-checkbox-${index}`

                            return (
                                <StyledTableRow
                                    hover
                                    key={`${row.id}-${index}`}
                                    role='checkbox'
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    selected={isItemSelected}
                                >
                                    <StyledTableCell padding='checkbox'>
                                        <Checkbox
                                            color='primary'
                                            checked={isItemSelected}
                                            onClick={(event) => handleClick(event, row.id)}
                                            inputProps={{
                                                'aria-labelledby': labelId
                                            }}
                                            sx={{
                                                '&.Mui-checked': {
                                                    color: theme.palette.primary.main
                                                }
                                            }}
                                        />
                                    </StyledTableCell>
                                    <StyledTableCell onClick={() => onExecutionRowClick(row)}>
                                        <Box
                                            component={getIconFromStatus(row.state, theme)}
                                            className='labelIcon'
                                            sx={{
                                                color: getIconColor(row.state),
                                                fontSize: '1.25rem',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        />
                                    </StyledTableCell>
                                    <StyledTableCell onClick={() => onExecutionRowClick(row)}>
                                        {moment(row.updatedDate).format('MMM D, YYYY h:mm A')}
                                    </StyledTableCell>
                                    <StyledTableCell onClick={() => onExecutionRowClick(row)}>{row.agentflow?.name}</StyledTableCell>
                                    <StyledTableCell onClick={() => onExecutionRowClick(row)}>{row.sessionId}</StyledTableCell>
                                    <StyledTableCell onClick={() => onExecutionRowClick(row)}>
                                        {moment(row.createdDate).format('MMM D, YYYY h:mm A')}
                                    </StyledTableCell>
                                </StyledTableRow>
                            )
                        })
                    )}
                </TableBody>
            </StyledTable>
        </StyledTableContainer>
    )
}

ExecutionsListTable.propTypes = {
    data: PropTypes.array,
    isLoading: PropTypes.bool,
    onExecutionRowClick: PropTypes.func,
    onSelectionChange: PropTypes.func,
    className: PropTypes.string
}

ExecutionsListTable.displayName = 'ExecutionsListTable'
