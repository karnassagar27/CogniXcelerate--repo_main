import * as PropTypes from 'prop-types'
import moment from 'moment/moment'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// material-ui
import {
    Button,
    Box,
    Chip,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Popover,
    Collapse,
    Typography,
    TextField,
    InputAdornment,
    Fade,
    Container,
    alpha
} from '@mui/material'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import { useTheme, styled } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import APIKeyDialog from './APIKeyDialog'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import ErrorBoundary from '@/ErrorBoundary'
import { PermissionButton, StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import { Available } from '@/ui-component/rbac/available'

// API
import apiKeyApi from '@/api/apikey'
import { useError } from '@/store/context/ErrorContext'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import {
    IconTrash,
    IconEdit,
    IconCopy,
    IconChevronsUp,
    IconChevronsDown,
    IconX,
    IconPlus,
    IconEye,
    IconEyeOff,
    IconFileUpload,
    IconSearch,
    IconKey
} from '@tabler/icons-react'
import APIEmptySVG from '@/assets/images/api_empty.svg'
import UploadJSONFileDialog from '@/views/apikey/UploadJSONFileDialog'

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

const StyledChip = styled(Chip)(({ theme }) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
    transition: 'all 0.2s ease',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
    }
}))

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    padding: 6,
    borderRadius: 8,
    transition: 'all 0.2s ease',
    marginLeft: 4,

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
    },

    '&.MuiIconButton-colorSuccess': {
        backgroundColor: alpha(theme.palette.success.main, 0.08),
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        '&:hover': {
            backgroundColor: alpha(theme.palette.success.main, 0.15),
            borderColor: theme.palette.success.main
        }
    }
}))

const CollapsibleTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
        fontSize: '0.8125rem',
        padding: '8px 16px'
    }
}))

const UsageBadge = styled(Box)(({ theme }) => ({
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    padding: '4px 8px',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.info.main, 0.08),
    borderRadius: 6,
    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
    display: 'inline-block',
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.15) : alpha(theme.palette.info.main, 0.12),
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.25)}`
    }
}))

function APIKeyRow(props) {
    const [open, setOpen] = useState(false)
    const theme = useTheme()

    return (
        <>
            <StyledTableRow>
                <StyledTableCell scope='row' style={{ width: '15%' }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{props.apiKey.keyName}</Typography>
                </StyledTableCell>
                <StyledTableCell style={{ width: '40%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.8125rem',
                                color: theme.palette.text.secondary,
                                flex: 1
                            }}
                        >
                            {props.showApiKeys.includes(props.apiKey.apiKey)
                                ? props.apiKey.apiKey
                                : `${props.apiKey.apiKey.substring(0, 2)}${'•'.repeat(18)}${props.apiKey.apiKey.substring(
                                      props.apiKey.apiKey.length - 5
                                  )}`}
                        </Typography>
                        <StyledIconButton title='Copy' color='success' onClick={props.onCopyClick} size='small'>
                            <IconCopy size={16} />
                        </StyledIconButton>
                        <StyledIconButton title='Show' color='inherit' onClick={props.onShowAPIClick} size='small'>
                            {props.showApiKeys.includes(props.apiKey.apiKey) ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </StyledIconButton>
                        <Popover
                            open={props.open}
                            anchorEl={props.anchorEl}
                            onClose={props.onClose}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right'
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left'
                            }}
                        >
                            <Typography
                                variant='h6'
                                sx={{
                                    pl: 2,
                                    pr: 2,
                                    py: 1,
                                    color: 'white',
                                    background: props.theme.palette.success.dark,
                                    borderRadius: 1,
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}
                            >
                                Copied!
                            </Typography>
                        </Popover>
                    </Box>
                </StyledTableCell>
                <StyledTableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UsageBadge>{props.apiKey.chatFlows.length}</UsageBadge>
                        {props.apiKey.chatFlows.length > 0 && (
                            <StyledIconButton aria-label='expand row' size='small' color='inherit' onClick={() => setOpen(!open)}>
                                {open ? <IconChevronsUp size={16} /> : <IconChevronsDown size={16} />}
                            </StyledIconButton>
                        )}
                    </Box>
                </StyledTableCell>
                <StyledTableCell>
                    <Typography
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.8rem'
                        }}
                    >
                        {moment(props.apiKey.createdAt).format('MMM DD, YYYY')}
                    </Typography>
                </StyledTableCell>
                <Available permission={'apikeys:update,apikeys:create'}>
                    <StyledTableCell>
                        <StyledIconButton title='Edit' color='primary' onClick={props.onEditClick} size='small'>
                            <IconEdit size={16} />
                        </StyledIconButton>
                    </StyledTableCell>
                </Available>
                <Available permission={'apikeys:delete'}>
                    <StyledTableCell>
                        <StyledIconButton title='Delete' color='error' onClick={props.onDeleteClick} size='small'>
                            <IconTrash size={16} />
                        </StyledIconButton>
                    </StyledTableCell>
                </Available>
            </StyledTableRow>
            {open && (
                <TableRow sx={{ '& td': { border: 0 } }}>
                    <StyledTableCell sx={{ p: 2 }} colSpan={6}>
                        <Collapse in={open} timeout='auto' unmountOnExit>
                            <Box
                                sx={{
                                    borderRadius: 12,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                    overflow: 'hidden',
                                    backgroundColor:
                                        theme.palette.mode === 'dark'
                                            ? alpha(theme.palette.background.paper, 0.4)
                                            : alpha(theme.palette.grey[50], 0.6)
                                }}
                            >
                                <CollapsibleTable aria-label='chatflow table'>
                                    <TableHead sx={{ height: 40 }}>
                                        <TableRow>
                                            <StyledTableCell sx={{ width: '30%', fontSize: '0.75rem', padding: '8px 16px' }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        color: 'inherit',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.025em'
                                                    }}
                                                >
                                                    Chatflow Name
                                                </Typography>
                                            </StyledTableCell>
                                            <StyledTableCell sx={{ width: '20%', fontSize: '0.75rem', padding: '8px 16px' }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        color: 'inherit',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.025em'
                                                    }}
                                                >
                                                    Modified On
                                                </Typography>
                                            </StyledTableCell>
                                            <StyledTableCell sx={{ width: '50%', fontSize: '0.75rem', padding: '8px 16px' }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        color: 'inherit',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.025em'
                                                    }}
                                                >
                                                    Category
                                                </Typography>
                                            </StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {props.apiKey.chatFlows.map((flow, index) => (
                                            <TableRow key={index}>
                                                <StyledTableCell sx={{ padding: '8px 16px' }}>
                                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{flow.flowName}</Typography>
                                                </StyledTableCell>
                                                <StyledTableCell sx={{ padding: '8px 16px' }}>
                                                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                                                        {moment(flow.updatedDate).format('MMM DD, YYYY')}
                                                    </Typography>
                                                </StyledTableCell>
                                                <StyledTableCell sx={{ padding: '8px 16px' }}>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {flow.category &&
                                                            flow.category
                                                                .split(';')
                                                                .filter((tag) => tag.trim())
                                                                .map((tag, index) => (
                                                                    <StyledChip key={index} label={tag.trim()} size='small' />
                                                                ))}
                                                    </Box>
                                                </StyledTableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </CollapsibleTable>
                            </Box>
                        </Collapse>
                    </StyledTableCell>
                </TableRow>
            )}
        </>
    )
}

APIKeyRow.propTypes = {
    apiKey: PropTypes.any,
    showApiKeys: PropTypes.arrayOf(PropTypes.any),
    onCopyClick: PropTypes.func,
    onShowAPIClick: PropTypes.func,
    open: PropTypes.bool,
    anchorEl: PropTypes.any,
    onClose: PropTypes.func,
    theme: PropTypes.any,
    onEditClick: PropTypes.func,
    onDeleteClick: PropTypes.func
}

const APIKey = () => {
    const theme = useTheme()
    const _customization = useSelector((state) => state.customization)

    const dispatch = useDispatch()
    useNotifier()
    const { error, setError } = useError()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [isLoading, setLoading] = useState(true)
    const [showDialog, setShowDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [apiKeys, setAPIKeys] = useState([])
    const [anchorEl, setAnchorEl] = useState(null)
    const [showApiKeys, setShowApiKeys] = useState([])
    const openPopOver = Boolean(anchorEl)

    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [uploadDialogProps, setUploadDialogProps] = useState({})

    const [search, setSearch] = useState('')
    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    function filterKeys(data) {
        if (!search) return true
        return data.keyName.toLowerCase().includes(search.toLowerCase())
    }

    // Get filtered data
    const filteredData = apiKeys ? apiKeys.filter(filterKeys) : []

    const { confirm } = useConfirm()

    const getAllAPIKeysApi = useApi(apiKeyApi.getAllAPIKeys)

    const onShowApiKeyClick = (apikey) => {
        const index = showApiKeys.indexOf(apikey)
        if (index > -1) {
            const newShowApiKeys = showApiKeys.filter(function (item) {
                return item !== apikey
            })
            setShowApiKeys(newShowApiKeys)
        } else {
            setShowApiKeys((prevkeys) => [...prevkeys, apikey])
        }
    }

    const handleClosePopOver = () => {
        setAnchorEl(null)
    }

    const addNew = () => {
        const dialogProp = {
            title: 'Add New API Key',
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            customBtnId: 'btn_confirmAddingApiKey'
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const edit = (key) => {
        const dialogProp = {
            title: 'Edit API Key',
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            customBtnId: 'btn_confirmEditingApiKey',
            key
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const uploadDialog = () => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Upload',
            data: {}
        }
        setUploadDialogProps(dialogProp)
        setShowUploadDialog(true)
    }

    const deleteKey = async (key) => {
        const confirmPayload = {
            title: `Delete`,
            description:
                key.chatFlows.length === 0
                    ? `Delete key [${key.keyName}] ? `
                    : `Delete key [${key.keyName}] ?\n There are ${key.chatFlows.length} chatflows using this key.`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel',
            customBtnId: 'btn_initiateDeleteApiKey'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await apiKeyApi.deleteAPI(key.id)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'API key deleted',
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
                    message: `Failed to delete API key: ${
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
        setShowDialog(false)
        setShowUploadDialog(false)
        getAllAPIKeysApi.request()
    }

    useEffect(() => {
        getAllAPIKeysApi.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllAPIKeysApi.error) {
            setError(getAllAPIKeysApi.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllAPIKeysApi.error])

    useEffect(() => {
        setLoading(getAllAPIKeysApi.loading)
    }, [getAllAPIKeysApi.loading])

    useEffect(() => {
        if (getAllAPIKeysApi.data) {
            setAPIKeys(getAllAPIKeysApi.data)
        }
    }, [getAllAPIKeysApi.data])

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
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LoadingSkeleton variant='text' width='70%' height={20} />
                    <LoadingSkeleton variant='circular' width={24} height={24} />
                    <LoadingSkeleton variant='circular' width={24} height={24} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='rounded' width={40} height={24} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <Available permission={'apikeys:update,apikeys:create'}>
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={24} height={24} />
                </StyledTableCell>
            </Available>
            <Available permission={'apikeys:delete'}>
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={24} height={24} />
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
                        src={APIEmptySVG}
                        alt='No API Keys'
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
                    {search ? 'No API keys found' : 'Ready to secure your API access?'}
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
                        ? `No API keys match your search "${search}". Try adjusting your search terms.`
                        : 'Create your first API key to enable secure authentication for your applications'}
                </Typography>

                {!search && (
                    <StyledPermissionButton
                        permissionId={'apikeys:create'}
                        variant='contained'
                        onClick={addNew}
                        startIcon={<IconKey size={20} />}
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
                        Create Your First API Key
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
                                        <IconKey size={28} color={theme.palette.primary.main} />
                                        <Typography
                                            variant='h3'
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Access Keys
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
                                        API & SDK authentication keys
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
                                        placeholder='Search access keys by name...'
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
                                            <PermissionButton
                                                permissionId={'apikeys:import'}
                                                variant='outlined'
                                                onClick={uploadDialog}
                                                startIcon={<IconFileUpload size={18} />}
                                                sx={{
                                                    borderRadius: 2,
                                                    px: 3,
                                                    py: 1.2,
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    height: 40,
                                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                                    color: theme.palette.primary.main,
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        transform: 'translateY(-1px)',
                                                        borderColor: theme.palette.primary.main,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                                                    }
                                                }}
                                            >
                                                Import Keys
                                            </PermissionButton>

                                            <StyledPermissionButton
                                                permissionId={'apikeys:create'}
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
                                                Create Key
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
                                                <StyledTable aria-label='API keys table'>
                                                    <TableHead>
                                                        <TableRow>
                                                            <StyledTableCell style={{ width: '15%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Key Name
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '40%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    API Key
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '15%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Usage
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '15%' }}>
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
                                                            <Available permission={'apikeys:update,apikeys:create'}>
                                                                <StyledTableCell style={{ width: '7%' }}>
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
                                                            <Available permission={'apikeys:delete'}>
                                                                <StyledTableCell style={{ width: '8%' }}>
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
                                                            filteredData.map((key, index) => (
                                                                <APIKeyRow
                                                                    key={`${key.id}-${index}`}
                                                                    apiKey={key}
                                                                    showApiKeys={showApiKeys}
                                                                    onCopyClick={(event) => {
                                                                        navigator.clipboard.writeText(key.apiKey)
                                                                        setAnchorEl(event.currentTarget)
                                                                        setTimeout(() => {
                                                                            handleClosePopOver()
                                                                        }, 1500)
                                                                    }}
                                                                    onShowAPIClick={() => onShowApiKeyClick(key.apiKey)}
                                                                    open={openPopOver}
                                                                    anchorEl={anchorEl}
                                                                    onClose={handleClosePopOver}
                                                                    theme={theme}
                                                                    onEditClick={() => edit(key)}
                                                                    onDeleteClick={() => deleteKey(key)}
                                                                />
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

                <APIKeyDialog
                    show={showDialog}
                    dialogProps={dialogProps}
                    onCancel={() => setShowDialog(false)}
                    onConfirm={onConfirm}
                    setError={setError}
                />
                {showUploadDialog && (
                    <UploadJSONFileDialog
                        show={showUploadDialog}
                        dialogProps={uploadDialogProps}
                        onCancel={() => setShowUploadDialog(false)}
                        onConfirm={onConfirm}
                    />
                )}
                <ConfirmDialog />
            </MainCard>
        </Container>
    )
}

export default APIKey
