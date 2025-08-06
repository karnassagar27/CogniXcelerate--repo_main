import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// material-ui
import {
    Pagination,
    Box,
    Stack,
    TextField,
    MenuItem,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Tooltip,
    Typography,
    InputAdornment,
    Fade,
    Skeleton,
    Container,
    Paper,
    alpha,
    Chip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ErrorBoundary from '@/ErrorBoundary'
import { Available } from '@/ui-component/rbac/available'

// API
import useApi from '@/hooks/useApi'
import executionsApi from '@/api/executions'
import { useSelector } from 'react-redux'

// icons
import execution_empty from '@/assets/images/executions_empty.svg'
import { IconTrash, IconSearch, IconFileReport, IconCalendar, IconFilter } from '@tabler/icons-react'

// const
import { ExecutionsListTable } from '@/ui-component/table/ExecutionsListTable'
import { ExecutionDetails } from './ExecutionDetails'
import { omit } from 'lodash'

// ==============================|| AGENT EXECUTIONS ||============================== //

const AgentExecutions = () => {
    const theme = useTheme()
    const _customization = useSelector((state) => state.customization)

    const getAllExecutions = useApi(executionsApi.getAllExecutions)
    const deleteExecutionsApi = useApi(executionsApi.deleteExecutions)
    const getExecutionByIdApi = useApi(executionsApi.getExecutionById)

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)
    const [executions, setExecutions] = useState([])
    const [openDrawer, setOpenDrawer] = useState(false)
    const [selectedExecutionData, setSelectedExecutionData] = useState([])
    const [selectedMetadata, setSelectedMetadata] = useState({})
    const [selectedExecutionIds, setSelectedExecutionIds] = useState([])
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [filters, setFilters] = useState({
        state: '',
        startDate: null,
        endDate: null,
        agentflowId: '',
        sessionId: ''
    })
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    })

    // DatePicker styles to fix z-index issue
    const datePickerStyles = `
        .react-datepicker-popper {
            z-index: 9999 !important;
        }
        
        .react-datepicker {
            z-index: 9999 !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
            border: 1px solid ${alpha(theme.palette.divider, 0.2)} !important;
            border-radius: 12px !important;
            font-family: ${theme.typography.fontFamily} !important;
        }
        
        .react-datepicker__header {
            background-color: ${alpha(theme.palette.primary.main, 0.05)} !important;
            border-bottom: 1px solid ${alpha(theme.palette.divider, 0.1)} !important;
            border-radius: 12px 12px 0 0 !important;
        }
        
        .react-datepicker__day--selected {
            background-color: ${theme.palette.primary.main} !important;
            color: white !important;
        }
        
        .react-datepicker__day:hover {
            background-color: ${alpha(theme.palette.primary.main, 0.1)} !important;
        }
        
        .react-datepicker__day--keyboard-selected {
            background-color: ${alpha(theme.palette.primary.main, 0.2)} !important;
        }
    `

    const handleFilterChange = (field, value) => {
        setFilters({
            ...filters,
            [field]: value
        })
    }

    const onDateChange = (field, date) => {
        const updatedDate = new Date(date)
        updatedDate.setHours(0, 0, 0, 0)

        setFilters({
            ...filters,
            [field]: updatedDate
        })
    }

    const handlePageChange = (event, newPage) => {
        setPagination({
            ...pagination,
            page: newPage
        })
    }

    const handleLimitChange = (event) => {
        setPagination({
            ...pagination,
            page: 1,
            limit: parseInt(event.target.value, 10)
        })
    }

    const applyFilters = () => {
        setLoading(true)
        const params = {
            page: pagination.page,
            limit: pagination.limit
        }

        if (filters.state) params.state = filters.state

        if (filters.startDate) {
            const date = new Date(filters.startDate)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            params.startDate = `${year}-${month}-${day}T00:00:00.000Z`
        }

        if (filters.endDate) {
            const date = new Date(filters.endDate)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            params.endDate = `${year}-${month}-${day}T23:59:59.999Z`
        }

        if (filters.agentflowId) params.agentflowId = filters.agentflowId
        if (filters.sessionId) params.sessionId = filters.sessionId

        getAllExecutions.request(params)
    }

    const resetFilters = () => {
        setFilters({
            state: '',
            startDate: null,
            endDate: null,
            agentflowId: '',
            sessionId: ''
        })
        getAllExecutions.request()
    }

    const handleExecutionSelectionChange = (selectedIds) => {
        setSelectedExecutionIds(selectedIds)
    }

    const handleDeleteDialogOpen = () => {
        if (selectedExecutionIds.length > 0) {
            setOpenDeleteDialog(true)
        }
    }

    const handleDeleteDialogClose = () => {
        setOpenDeleteDialog(false)
    }

    const handleDeleteExecutions = () => {
        deleteExecutionsApi.request(selectedExecutionIds)
        setOpenDeleteDialog(false)
    }

    // Check if any filters are applied
    const hasActiveFilters = filters.state || filters.startDate || filters.endDate || filters.sessionId

    // Inject DatePicker styles
    useEffect(() => {
        const styleSheet = document.createElement('style')
        styleSheet.innerText = datePickerStyles
        document.head.appendChild(styleSheet)

        return () => {
            // Clean up styles when component unmounts
            try {
                document.head.removeChild(styleSheet)
            } catch (e) {
                // Style sheet may have already been removed
            }
        }
    }, [datePickerStyles])

    useEffect(() => {
        getAllExecutions.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllExecutions.data) {
            try {
                const { data, total } = getAllExecutions.data
                if (!Array.isArray(data)) return
                setExecutions(data)
                setPagination((prev) => ({ ...prev, total }))
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllExecutions.data])

    useEffect(() => {
        setLoading(getAllExecutions.loading)
    }, [getAllExecutions.loading])

    useEffect(() => {
        setError(getAllExecutions.error)
    }, [getAllExecutions.error])

    useEffect(() => {
        applyFilters()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, pagination.limit])

    useEffect(() => {
        if (deleteExecutionsApi.data) {
            getAllExecutions.request({
                page: pagination.page,
                limit: pagination.limit
            })
            setSelectedExecutionIds([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deleteExecutionsApi.data])

    useEffect(() => {
        if (getExecutionByIdApi.data) {
            const execution = getExecutionByIdApi.data
            const executionDetails =
                typeof execution.executionData === 'string' ? JSON.parse(execution.executionData) : execution.executionData
            setSelectedExecutionData(executionDetails)
            const newMetadata = {
                ...omit(execution, ['executionData']),
                agentflow: {
                    ...selectedMetadata.agentflow
                }
            }
            setSelectedMetadata(newMetadata)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getExecutionByIdApi.data])

    const LoadingState = () => (
        <Stack spacing={2.5}>
            <Skeleton
                variant='rectangular'
                width='100%'
                height={120}
                sx={{
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                }}
            />
            <Stack spacing={2}>
                {[...Array(5)].map((_, index) => (
                    <Skeleton
                        key={index}
                        variant='rectangular'
                        width='100%'
                        height={80}
                        sx={{
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.grey[500], 0.06)
                        }}
                    />
                ))}
            </Stack>
        </Stack>
    )

    const EmptyState = () => (
        <Fade in timeout={800}>
            <Paper
                elevation={0}
                sx={{
                    p: 8,
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    borderRadius: 3,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ mb: 4 }}>
                    <img
                        style={{
                            objectFit: 'cover',
                            height: '180px',
                            width: 'auto',
                            opacity: 0.8,
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))'
                        }}
                        src={execution_empty}
                        alt='No Executions'
                    />
                </Box>

                <Typography
                    variant='h4'
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 2
                    }}
                >
                    {hasActiveFilters ? 'No executions found' : 'No executions yet'}
                </Typography>

                <Typography
                    variant='body1'
                    color='text.secondary'
                    sx={{
                        mb: 4,
                        maxWidth: 480,
                        mx: 'auto',
                        lineHeight: 1.6,
                        fontSize: '1.1rem'
                    }}
                >
                    {hasActiveFilters
                        ? 'No executions match your current filters. Try adjusting your search criteria.'
                        : 'Execute your agent workflows to see traces and logs appear here.'}
                </Typography>

                {hasActiveFilters && (
                    <Button
                        variant='outlined'
                        onClick={resetFilters}
                        startIcon={<IconFilter size={20} />}
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            color: theme.palette.primary.main,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                borderColor: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        Clear All Filters
                    </Button>
                )}
            </Paper>
        </Fade>
    )

    return (
        <Container maxWidth='xl' sx={{ py: 3 }}>
            <MainCard
                sx={{
                    border: 'none',
                    boxShadow: 'none',
                    backgroundColor: 'transparent'
                }}
            >
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack spacing={3}>
                        {/* Header Section */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: `0 2px 12px ${alpha(theme.palette.grey[500], 0.08)}`
                            }}
                        >
                            <Stack spacing={4}>
                                {/* Title */}
                                <Box>
                                    <Stack direction='row' alignItems='center' spacing={1.5} mb={1}>
                                        <IconFileReport size={28} color={theme.palette.primary.main} />
                                        <Typography
                                            variant='h3'
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Trace Logs
                                        </Typography>
                                    </Stack>
                                    <Typography
                                        variant='body1'
                                        color='text.secondary'
                                        sx={{
                                            fontSize: '1.05rem',
                                            fontWeight: 400,
                                            lineHeight: 1.5
                                        }}
                                    >
                                        Monitor and manage AgentMesh Executions
                                    </Typography>
                                </Box>

                                {/* Stats */}
                                {executions && executions.length > 0 && (
                                    <Stack direction='row' spacing={1.5}>
                                        <Chip
                                            label={`${pagination.total} Total Executions`}
                                            size='medium'
                                            variant='outlined'
                                            sx={{
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                height: 32,
                                                borderRadius: 2,
                                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                                color: theme.palette.primary.main,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                            }}
                                        />
                                        {selectedExecutionIds.length > 0 && (
                                            <Chip
                                                label={`${selectedExecutionIds.length} Selected`}
                                                size='medium'
                                                sx={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    height: 32,
                                                    borderRadius: 2,
                                                    backgroundColor: theme.palette.warning.main,
                                                    color: theme.palette.warning.contrastText,
                                                    boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.3)}`
                                                }}
                                            />
                                        )}
                                    </Stack>
                                )}
                            </Stack>
                        </Paper>

                        {/* Filter Section */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                backgroundColor: theme.palette.background.paper,
                                borderRadius: 2.5,
                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                boxShadow: `0 2px 12px ${alpha(theme.palette.grey[500], 0.08)}`
                            }}
                        >
                            <Stack spacing={3}>
                                <Stack direction='row' alignItems='center' spacing={1.5}>
                                    <IconFilter size={20} color={theme.palette.text.secondary} />
                                    <Typography
                                        variant='h6'
                                        sx={{
                                            fontWeight: 600,
                                            color: theme.palette.text.primary,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        Filter Executions
                                    </Typography>
                                </Stack>

                                <Grid container spacing={2} alignItems='center'>
                                    <Grid item xs={12} md={2}>
                                        <FormControl fullWidth size='medium'>
                                            <InputLabel id='state-select-label'>Execution State</InputLabel>
                                            <Select
                                                labelId='state-select-label'
                                                value={filters.state}
                                                label='Execution State'
                                                onChange={(e) => handleFilterChange('state', e.target.value)}
                                                sx={{
                                                    borderRadius: 2,
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: alpha(theme.palette.divider, 0.5)
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: theme.palette.primary.main
                                                    }
                                                }}
                                            >
                                                <MenuItem value=''>All States</MenuItem>
                                                <MenuItem value='INPROGRESS'>In Progress</MenuItem>
                                                <MenuItem value='FINISHED'>Finished</MenuItem>
                                                <MenuItem value='ERROR'>Error</MenuItem>
                                                <MenuItem value='TERMINATED'>Terminated</MenuItem>
                                                <MenuItem value='TIMEOUT'>Timeout</MenuItem>
                                                <MenuItem value='STOPPED'>Stopped</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <DatePicker
                                            selected={filters.startDate}
                                            onChange={(date) => onDateChange('startDate', date)}
                                            selectsStart
                                            startDate={filters.startDate}
                                            className='form-control'
                                            wrapperClassName='datePicker'
                                            maxDate={new Date()}
                                            popperProps={{
                                                strategy: 'fixed',
                                                modifiers: [
                                                    {
                                                        name: 'preventOverflow',
                                                        options: {
                                                            boundary: 'viewport'
                                                        }
                                                    }
                                                ]
                                            }}
                                            popperPlacement='bottom-start'
                                            customInput={
                                                <TextField
                                                    size='medium'
                                                    label='Start Date'
                                                    fullWidth
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position='start'>
                                                                <IconCalendar size={20} color={theme.palette.text.secondary} />
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            '& fieldset': {
                                                                borderColor: alpha(theme.palette.divider, 0.5)
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: theme.palette.primary.main
                                                            }
                                                        }
                                                    }}
                                                />
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <DatePicker
                                            selected={filters.endDate}
                                            onChange={(date) => onDateChange('endDate', date)}
                                            selectsEnd
                                            endDate={filters.endDate}
                                            className='form-control'
                                            wrapperClassName='datePicker'
                                            minDate={filters.startDate}
                                            maxDate={new Date()}
                                            popperProps={{
                                                strategy: 'fixed',
                                                modifiers: [
                                                    {
                                                        name: 'preventOverflow',
                                                        options: {
                                                            boundary: 'viewport'
                                                        }
                                                    }
                                                ]
                                            }}
                                            popperPlacement='bottom-start'
                                            customInput={
                                                <TextField
                                                    size='medium'
                                                    label='End Date'
                                                    fullWidth
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position='start'>
                                                                <IconCalendar size={20} color={theme.palette.text.secondary} />
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            '& fieldset': {
                                                                borderColor: alpha(theme.palette.divider, 0.5)
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: theme.palette.primary.main
                                                            }
                                                        }
                                                    }}
                                                />
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField
                                            fullWidth
                                            label='Session ID'
                                            value={filters.sessionId}
                                            onChange={(e) => handleFilterChange('sessionId', e.target.value)}
                                            size='medium'
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position='start'>
                                                        <IconSearch size={20} color={theme.palette.text.secondary} />
                                                    </InputAdornment>
                                                )
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '& fieldset': {
                                                        borderColor: alpha(theme.palette.divider, 0.5)
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: theme.palette.primary.main
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Stack direction='row' spacing={1.5} alignItems='center'>
                                            <Button
                                                variant='contained'
                                                onClick={applyFilters}
                                                sx={{
                                                    borderRadius: 2,
                                                    px: 3,
                                                    py: 1.2,
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    backgroundColor: theme.palette.primary.main,
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        transform: 'translateY(-1px)',
                                                        backgroundColor: theme.palette.primary.dark,
                                                        boxShadow: 'none'
                                                    },
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            >
                                                Apply Filters
                                            </Button>
                                            <Button
                                                variant='outlined'
                                                onClick={resetFilters}
                                                sx={{
                                                    borderRadius: 2,
                                                    px: 3,
                                                    py: 1.2,
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                                    color: theme.palette.primary.main,
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                                    '&:hover': {
                                                        transform: 'translateY(-1px)',
                                                        borderColor: theme.palette.primary.main,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                                    },
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            >
                                                Reset
                                            </Button>
                                            <Available permissions={['executions:delete']}>
                                                <Tooltip title='Delete selected executions'>
                                                    <span>
                                                        <IconButton
                                                            size='medium'
                                                            color='error'
                                                            onClick={handleDeleteDialogOpen}
                                                            disabled={selectedExecutionIds.length === 0}
                                                            sx={{
                                                                borderRadius: 2,
                                                                width: 44,
                                                                height: 44,
                                                                backgroundColor: alpha(theme.palette.error.main, 0.05),
                                                                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                                                                '&:hover': {
                                                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                                                    transform: 'translateY(-1px)',
                                                                    boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.25)}`
                                                                },
                                                                '&:disabled': {
                                                                    backgroundColor: alpha(theme.palette.grey[500], 0.05),
                                                                    border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`
                                                                },
                                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                            }}
                                                        >
                                                            <IconTrash size={20} />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Available>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Paper>

                        {/* Content */}
                        {isLoading ? (
                            <LoadingState />
                        ) : (
                            <>
                                {executions && executions.length > 0 ? (
                                    <Fade in timeout={600}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                borderRadius: 2.5,
                                                overflow: 'hidden',
                                                backgroundColor: theme.palette.background.paper,
                                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                boxShadow: `0 2px 12px ${alpha(theme.palette.grey[500], 0.08)}`,
                                                transition: 'box-shadow 0.3s ease-in-out',
                                                '&:hover': {
                                                    boxShadow: `0 4px 20px ${alpha(theme.palette.grey[500], 0.12)}`
                                                }
                                            }}
                                        >
                                            <ExecutionsListTable
                                                data={executions}
                                                isLoading={isLoading}
                                                onSelectionChange={handleExecutionSelectionChange}
                                                onExecutionRowClick={(execution) => {
                                                    setOpenDrawer(true)
                                                    const executionDetails =
                                                        typeof execution.executionData === 'string'
                                                            ? JSON.parse(execution.executionData)
                                                            : execution.executionData
                                                    setSelectedExecutionData(executionDetails)
                                                    setSelectedMetadata(omit(execution, ['executionData']))
                                                }}
                                            />

                                            {/* Pagination and Page Size Controls */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    p: 3,
                                                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                    backgroundColor: alpha(theme.palette.grey[50], 0.3)
                                                }}
                                            >
                                                <Stack direction='row' alignItems='center' spacing={2}>
                                                    <Typography
                                                        variant='body2'
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        Items per page:
                                                    </Typography>
                                                    <FormControl
                                                        variant='outlined'
                                                        size='small'
                                                        sx={{
                                                            minWidth: 80,
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 2,
                                                                backgroundColor: theme.palette.background.paper,
                                                                '& fieldset': {
                                                                    borderColor: alpha(theme.palette.divider, 0.5)
                                                                },
                                                                '&:hover fieldset': {
                                                                    borderColor: theme.palette.primary.main
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Select value={pagination.limit} onChange={handleLimitChange} displayEmpty>
                                                            <MenuItem value={10}>10</MenuItem>
                                                            <MenuItem value={50}>50</MenuItem>
                                                            <MenuItem value={100}>100</MenuItem>
                                                            <MenuItem value={1000}>1000</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Stack>
                                                <Pagination
                                                    count={Math.ceil(pagination.total / pagination.limit)}
                                                    page={pagination.page}
                                                    onChange={handlePageChange}
                                                    sx={{
                                                        '& .MuiPaginationItem-root': {
                                                            borderRadius: 2,
                                                            fontWeight: 500,
                                                            '&.Mui-selected': {
                                                                backgroundColor: theme.palette.primary.main,
                                                                color: theme.palette.primary.contrastText,
                                                                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Paper>
                                    </Fade>
                                ) : (
                                    <EmptyState />
                                )}
                            </>
                        )}

                        <ExecutionDetails
                            open={openDrawer}
                            execution={selectedExecutionData}
                            metadata={selectedMetadata}
                            onClose={() => setOpenDrawer(false)}
                            onProceedSuccess={() => {
                                setOpenDrawer(false)
                                getAllExecutions.request()
                            }}
                            onUpdateSharing={() => {
                                getAllExecutions.request()
                            }}
                            onRefresh={(executionId) => {
                                getAllExecutions.request()
                                getExecutionByIdApi.request(executionId)
                            }}
                        />

                        {/* Delete Confirmation Dialog */}
                        <Dialog
                            open={openDeleteDialog}
                            onClose={handleDeleteDialogClose}
                            aria-labelledby='alert-dialog-title'
                            aria-describedby='alert-dialog-description'
                            PaperProps={{
                                sx: {
                                    borderRadius: 3,
                                    boxShadow: `0 8px 32px ${alpha(theme.palette.grey[500], 0.2)}`
                                }
                            }}
                        >
                            <DialogTitle
                                id='alert-dialog-title'
                                sx={{
                                    fontWeight: 600,
                                    fontSize: '1.25rem',
                                    color: theme.palette.text.primary
                                }}
                            >
                                Confirm Deletion
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText
                                    id='alert-dialog-description'
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        fontSize: '1rem',
                                        lineHeight: 1.5
                                    }}
                                >
                                    Are you sure you want to delete {selectedExecutionIds.length} execution
                                    {selectedExecutionIds.length !== 1 ? 's' : ''}? This action cannot be undone.
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions sx={{ p: 3, pt: 1 }}>
                                <Button
                                    onClick={handleDeleteDialogClose}
                                    sx={{
                                        borderRadius: 2,
                                        px: 3,
                                        py: 1,
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        textTransform: 'none'
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteExecutions}
                                    color='error'
                                    variant='contained'
                                    sx={{
                                        borderRadius: 2,
                                        px: 3,
                                        py: 1,
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            boxShadow: 'none'
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Stack>
                )}
            </MainCard>
        </Container>
    )
}

export default AgentExecutions
