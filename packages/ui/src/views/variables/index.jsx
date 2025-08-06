import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import moment from 'moment'

// material-ui
import { styled } from '@mui/material/styles'
import { tableCellClasses } from '@mui/material/TableCell'
import {
    Button,
    Box,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Typography,
    TextField,
    InputAdornment,
    Fade,
    Container,
    alpha
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import AddEditVariableDialog from './AddEditVariableDialog'

import ErrorBoundary from '@/ErrorBoundary'
import { StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import { Available } from '@/ui-component/rbac/available'
import { refreshVariablesCache } from '@/ui-component/input/suggestionOption'

// API
import variablesApi from '@/api/variables'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import { IconTrash, IconEdit, IconX, IconPlus, IconVariable, IconSearch } from '@tabler/icons-react'
import VariablesEmptySVG from '@/assets/images/variables_empty.svg'

// const
import { useError } from '@/store/context/ErrorContext'

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

const LoadingSkeleton = styled(Skeleton)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[700], 0.3) : alpha(theme.palette.grey[300], 0.3),
    borderRadius: 8,
    '&::after': {
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.1)}, transparent)`
    }
}))

const VariableIconContainer = styled(Box)(({ theme }) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    marginRight: 12,
    flexShrink: 0,

    '&:hover': {
        transform: 'scale(1.05)',
        borderColor: theme.palette.primary.main,
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
    }
}))

const StyledChip = styled(Chip)(({ theme }) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    borderRadius: 12,
    transition: 'all 0.2s ease',

    '&.MuiChip-colorInfo': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.2) : alpha(theme.palette.info.main, 0.1),
        color: theme.palette.info.main,
        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
    },

    '&.MuiChip-colorSecondary': {
        backgroundColor:
            theme.palette.mode === 'dark' ? alpha(theme.palette.secondary.main, 0.2) : alpha(theme.palette.secondary.main, 0.1),
        color: theme.palette.secondary.main,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
    },

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
    }
}))

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    padding: 8,
    borderRadius: 8,
    transition: 'all 0.2s ease',

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
    },

    '&.MuiIconButton-colorPrimary': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
            borderColor: theme.palette.primary.main
        }
    },

    '&.MuiIconButton-colorError': {
        backgroundColor: alpha(theme.palette.error.main, 0.08),
        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
        '&:hover': {
            backgroundColor: alpha(theme.palette.error.main, 0.15),
            borderColor: theme.palette.error.main
        }
    }
}))

// ==============================|| Variables ||============================== //

const Variables = () => {
    const theme = useTheme()
    const _customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()
    useNotifier()
    const { error, setError } = useError()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [isLoading, setLoading] = useState(true)
    const [showVariableDialog, setShowVariableDialog] = useState(false)
    const [variableDialogProps, setVariableDialogProps] = useState({})
    const [variables, setVariables] = useState([])

    const { confirm } = useConfirm()

    const getAllVariables = useApi(variablesApi.getAllVariables)

    const [search, setSearch] = useState('')
    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    function filterVariables(data) {
        if (!search) return true
        return (
            data.name.toLowerCase().includes(search.toLowerCase()) ||
            (data.value && data.value.toLowerCase().includes(search.toLowerCase())) ||
            data.type.toLowerCase().includes(search.toLowerCase())
        )
    }

    // Get filtered data
    const filteredData = variables ? variables.filter(filterVariables) : []

    const addNew = () => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            customBtnId: 'btn_confirmAddingVariable',
            data: {}
        }
        setVariableDialogProps(dialogProp)
        setShowVariableDialog(true)
    }

    const edit = (variable) => {
        const dialogProp = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            data: variable
        }
        setVariableDialogProps(dialogProp)
        setShowVariableDialog(true)
    }

    const deleteVariable = async (variable) => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete variable ${variable.name}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await variablesApi.deleteVariable(variable.id)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'Variable deleted',
                        options: {
                            key: new Date().getTime() + Math.random(),
                            variant: 'success',
                            action: (key) => (
                                <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                    <IconX />
                                </Button>
                            )
                        }
                    })
                    onConfirm()
                }
            } catch (error) {
                enqueueSnackbar({
                    message: `Failed to delete Variable: ${
                        typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                    }`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        }
    }

    const onConfirm = () => {
        setShowVariableDialog(false)
        getAllVariables.request()
        refreshVariablesCache()
    }

    useEffect(() => {
        getAllVariables.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllVariables.error) {
            setError(getAllVariables.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllVariables.error])

    useEffect(() => {
        setLoading(getAllVariables.loading)
    }, [getAllVariables.loading])

    useEffect(() => {
        if (getAllVariables.data) {
            setVariables(getAllVariables.data)
        }
    }, [getAllVariables.data])

    const LoadingState = () => (
        <Stack spacing={2.5}>
            <Skeleton
                variant='rectangular'
                width='100%'
                height={88}
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

    const renderLoadingRow = () => (
        <StyledTableRow>
            <StyledTableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LoadingSkeleton variant='circular' width={32} height={32} />
                    <LoadingSkeleton variant='text' width='60%' height={24} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='rounded' width={60} height={24} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <Available permission={'variables:create,variables:update'}>
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={32} height={32} />
                </StyledTableCell>
            </Available>
            <Available permission={'variables:delete'}>
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={32} height={32} />
                </StyledTableCell>
            </Available>
        </StyledTableRow>
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
                        src={VariablesEmptySVG}
                        alt='No Variables'
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
                    {search ? 'No variables found' : 'Ready to create global variables?'}
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
                    {search
                        ? `No variables match your search "${search}". Try adjusting your search terms.`
                        : 'Create your first variable to manage dynamic values across your workflows'}
                </Typography>

                {!search && (
                    <StyledPermissionButton
                        permissionId={'variables:create'}
                        variant='contained'
                        onClick={addNew}
                        startIcon={<IconVariable size={20} />}
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            backgroundColor: '#0096c7',
                            boxShadow: 'none',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                backgroundColor: '#007ea7',
                                boxShadow: 'none'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        Create Your First Variable
                    </StyledPermissionButton>
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
                                        <IconVariable size={28} color={theme.palette.primary.main} />
                                        <Typography
                                            variant='h3'
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Variables
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
                                        Create and manage global variables
                                    </Typography>
                                </Box>

                                {/* Controls */}
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={3}
                                    alignItems={{ xs: 'stretch', sm: 'center' }}
                                    justifyContent='space-between'
                                >
                                    <TextField
                                        placeholder='Search variables by name, value, or type...'
                                        value={search}
                                        onChange={onSearchChange}
                                        size='medium'
                                        sx={{
                                            flexGrow: 1,
                                            maxWidth: { xs: '100%', sm: 420 },
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: theme.palette.background.paper,
                                                fontSize: '0.95rem',
                                                border: 'none',
                                                boxShadow: `0 2px 8px ${alpha(theme.palette.grey[500], 0.1)}`,
                                                transition: 'all 0.3s ease-in-out',
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: `0 4px 16px ${alpha(theme.palette.grey[500], 0.15)}`
                                                },
                                                '&.Mui-focused': {
                                                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}, 0 4px 16px ${alpha(
                                                        theme.palette.grey[500],
                                                        0.15
                                                    )}`
                                                },
                                                '& fieldset': {
                                                    border: 'none'
                                                }
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    <IconSearch size={20} color={theme.palette.text.secondary} />
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <Stack direction='row' spacing={2.5} alignItems='center'>
                                        {/* Action Buttons */}
                                        <Stack direction='row' spacing={1.5} alignItems='center'>
                                            <StyledPermissionButton
                                                permissionId={'variables:create'}
                                                variant='contained'
                                                onClick={addNew}
                                                startIcon={<IconPlus size={18} />}
                                                sx={{
                                                    borderRadius: 2,
                                                    px: 3,
                                                    py: 1.2,
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    backgroundColor: theme.palette.primary.main,
                                                    boxShadow: 'none',
                                                    minWidth: 'auto',
                                                    height: 40,
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        transform: 'translateY(-1px)',
                                                        backgroundColor: theme.palette.primary.dark,
                                                        boxShadow: 'none'
                                                    }
                                                }}
                                            >
                                                Add Variable
                                            </StyledPermissionButton>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Paper>

                        {/* Content */}
                        {isLoading ? (
                            <LoadingState />
                        ) : (
                            <>
                                {filteredData && filteredData.length > 0 ? (
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
                                            <StyledTableContainer component={Paper}>
                                                <StyledTable aria-label='variables table'>
                                                    <TableHead>
                                                        <TableRow>
                                                            <StyledTableCell style={{ width: '25%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Variable Name
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '25%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Value
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '12%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Type
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '16%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Last Updated
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '16%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Created
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <Available permissionId={'variables:update'}>
                                                                <StyledTableCell style={{ width: '3%' }}>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 600,
                                                                            color: 'inherit',
                                                                            textTransform: 'uppercase',
                                                                            letterSpacing: '0.025em'
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </Typography>
                                                                </StyledTableCell>
                                                            </Available>
                                                            <Available permissionId={'variables:delete'}>
                                                                <StyledTableCell style={{ width: '3%' }}>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 600,
                                                                            color: 'inherit',
                                                                            textTransform: 'uppercase',
                                                                            letterSpacing: '0.025em'
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </Typography>
                                                                </StyledTableCell>
                                                            </Available>
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
                                                            filteredData.map((variable, index) => (
                                                                <StyledTableRow key={`${variable.id}-${index}`}>
                                                                    <StyledTableCell component='th' scope='row'>
                                                                        <Box
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center'
                                                                            }}
                                                                        >
                                                                            <VariableIconContainer>
                                                                                <IconVariable
                                                                                    size={18}
                                                                                    color={theme.palette.primary.main}
                                                                                />
                                                                            </VariableIconContainer>
                                                                            <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                                                                {variable.name}
                                                                            </Box>
                                                                        </Box>
                                                                    </StyledTableCell>
                                                                    <StyledTableCell>
                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: '0.8125rem',
                                                                                fontWeight: 400,
                                                                                color: theme.palette.text.secondary,
                                                                                fontFamily: 'monospace',
                                                                                maxWidth: '200px',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap'
                                                                            }}
                                                                        >
                                                                            {variable.value}
                                                                        </Typography>
                                                                    </StyledTableCell>
                                                                    <StyledTableCell>
                                                                        <StyledChip
                                                                            color={variable.type === 'static' ? 'info' : 'secondary'}
                                                                            size='small'
                                                                            label={variable.type}
                                                                        />
                                                                    </StyledTableCell>
                                                                    <StyledTableCell>
                                                                        <Box
                                                                            sx={{
                                                                                color: theme.palette.text.secondary,
                                                                                fontSize: '0.8rem',
                                                                                lineHeight: 1.2
                                                                            }}
                                                                        >
                                                                            {moment(variable.updatedDate).format('MMM DD, YYYY')}
                                                                            <br />
                                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                                {moment(variable.updatedDate).format('HH:mm')}
                                                                            </span>
                                                                        </Box>
                                                                    </StyledTableCell>
                                                                    <StyledTableCell>
                                                                        <Box
                                                                            sx={{
                                                                                color: theme.palette.text.secondary,
                                                                                fontSize: '0.8rem',
                                                                                lineHeight: 1.2
                                                                            }}
                                                                        >
                                                                            {moment(variable.createdDate).format('MMM DD, YYYY')}
                                                                            <br />
                                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                                {moment(variable.createdDate).format('HH:mm')}
                                                                            </span>
                                                                        </Box>
                                                                    </StyledTableCell>
                                                                    <Available permission={'variables:create,variables:update'}>
                                                                        <StyledTableCell>
                                                                            <StyledIconButton
                                                                                title='Edit'
                                                                                color='primary'
                                                                                onClick={() => edit(variable)}
                                                                            >
                                                                                <IconEdit size={18} />
                                                                            </StyledIconButton>
                                                                        </StyledTableCell>
                                                                    </Available>
                                                                    <Available permission={'variables:delete'}>
                                                                        <StyledTableCell>
                                                                            <StyledIconButton
                                                                                title='Delete'
                                                                                color='error'
                                                                                onClick={() => deleteVariable(variable)}
                                                                            >
                                                                                <IconTrash size={18} />
                                                                            </StyledIconButton>
                                                                        </StyledTableCell>
                                                                    </Available>
                                                                </StyledTableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </StyledTable>
                                            </StyledTableContainer>
                                        </Paper>
                                    </Fade>
                                ) : (
                                    <EmptyState />
                                )}
                            </>
                        )}
                    </Stack>
                )}

                <AddEditVariableDialog
                    show={showVariableDialog}
                    dialogProps={variableDialogProps}
                    onCancel={() => setShowVariableDialog(false)}
                    onConfirm={onConfirm}
                    setError={setError}
                />

                <ConfirmDialog />
            </MainCard>
        </Container>
    )
}

export default Variables
