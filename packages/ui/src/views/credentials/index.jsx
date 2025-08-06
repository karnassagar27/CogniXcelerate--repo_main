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
import { PermissionIconButton, StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import CredentialListDialog from './CredentialListDialog'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import AddEditCredentialDialog from './AddEditCredentialDialog'
import ErrorBoundary from '@/ErrorBoundary'

// API
import credentialsApi from '@/api/credentials'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import { IconTrash, IconEdit, IconX, IconPlus, IconShare, IconSearch, IconLock } from '@tabler/icons-react'
import CredentialEmptySVG from '@/assets/images/credential_empty.svg'
import keySVG from '@/assets/images/key.svg'

// const
import { baseURL } from '@/store/constant'
import { SET_COMPONENT_CREDENTIALS } from '@/store/actions'
import { useError } from '@/store/context/ErrorContext'
import ShareWithWorkspaceDialog from '@/ui-component/dialog/ShareWithWorkspaceDialog'

// [All the styled components remain exactly the same - StyledTableContainer, StyledTable, etc.]
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

const CredentialIconContainer = styled(Box)(({ theme }) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.grey[100], 0.8),
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,

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

const StyledPermissionIconButton = styled(PermissionIconButton)(({ theme }) => ({
    padding: 8,
    borderRadius: 8,
    transition: 'all 0.2s ease',

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
    }
}))

const SharedCredentialBadge = styled(Box)(({ theme }) => ({
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    padding: '6px 12px',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.info.main, 0.08),
    borderRadius: 8,
    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
    display: 'inline-block',
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.15) : alpha(theme.palette.info.main, 0.12),
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.25)}`
    }
}))

// ==============================|| Credentials ||============================== //

const Credentials = () => {
    const theme = useTheme()
    const _customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()
    useNotifier()
    const { error, setError } = useError()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [isLoading, setLoading] = useState(true)
    const [showCredentialListDialog, setShowCredentialListDialog] = useState(false)
    const [credentialListDialogProps, setCredentialListDialogProps] = useState({})
    const [showSpecificCredentialDialog, setShowSpecificCredentialDialog] = useState(false)
    const [specificCredentialDialogProps, setSpecificCredentialDialogProps] = useState({})
    const [credentials, setCredentials] = useState([])
    const [componentsCredentials, setComponentsCredentials] = useState([])

    const [showShareCredentialDialog, setShowShareCredentialDialog] = useState(false)
    const [shareCredentialDialogProps, setShareCredentialDialogProps] = useState({})

    const { confirm } = useConfirm()

    const getAllCredentialsApi = useApi(credentialsApi.getAllCredentials)
    const getAllComponentsCredentialsApi = useApi(credentialsApi.getAllComponentsCredentials)

    const [search, setSearch] = useState('')
    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    function filterCredentials(data) {
        if (!search) return true
        return data.credentialName.toLowerCase().includes(search.toLowerCase()) || data.name.toLowerCase().includes(search.toLowerCase())
    }

    // Get filtered data
    const filteredData = credentials ? credentials.filter(filterCredentials) : []

    // [All the existing functions remain the same - listCredential, addNew, edit, share, deleteCredential, etc.]
    const listCredential = () => {
        const dialogProp = {
            title: 'Add New Credential',
            componentsCredentials
        }
        setCredentialListDialogProps(dialogProp)
        setShowCredentialListDialog(true)
    }

    const addNew = (credentialComponent) => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            credentialComponent
        }
        setSpecificCredentialDialogProps(dialogProp)
        setShowSpecificCredentialDialog(true)
    }

    const edit = (credential) => {
        const dialogProp = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            data: credential
        }
        setSpecificCredentialDialogProps(dialogProp)
        setShowSpecificCredentialDialog(true)
    }

    const share = (credential) => {
        const dialogProps = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Share',
            data: {
                id: credential.id,
                name: credential.name,
                title: 'Share Credential',
                itemType: 'credential'
            }
        }
        setShareCredentialDialogProps(dialogProps)
        setShowShareCredentialDialog(true)
    }

    const deleteCredential = async (credential) => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete credential ${credential.name}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await credentialsApi.deleteCredential(credential.id)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'Credential deleted',
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
                    message: `Failed to delete Credential: ${
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

    const onCredentialSelected = (credentialComponent) => {
        setShowCredentialListDialog(false)
        addNew(credentialComponent)
    }

    const onConfirm = () => {
        setShowCredentialListDialog(false)
        setShowSpecificCredentialDialog(false)
        getAllCredentialsApi.request()
    }

    // [All useEffect hooks remain the same]
    useEffect(() => {
        getAllCredentialsApi.request()
        getAllComponentsCredentialsApi.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllCredentialsApi.error) {
            setError(getAllCredentialsApi.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllCredentialsApi.error])

    useEffect(() => {
        setLoading(getAllCredentialsApi.loading)
    }, [getAllCredentialsApi.loading])

    useEffect(() => {
        if (getAllCredentialsApi.data) {
            setCredentials(getAllCredentialsApi.data)
        }
    }, [getAllCredentialsApi.data])

    useEffect(() => {
        if (getAllComponentsCredentialsApi.data) {
            setComponentsCredentials(getAllComponentsCredentialsApi.data)
            dispatch({ type: SET_COMPONENT_CREDENTIALS, componentsCredentials: getAllComponentsCredentialsApi.data })
        }
    }, [getAllComponentsCredentialsApi.data, dispatch])

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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LoadingSkeleton variant='circular' width={40} height={40} />
                    <LoadingSkeleton variant='text' width='60%' height={24} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='circular' width={32} height={32} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='circular' width={32} height={32} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='circular' width={32} height={32} />
            </StyledTableCell>
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
                        src={CredentialEmptySVG}
                        alt='No Credentials'
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
                    {search ? 'No credentials found' : 'Ready to secure your integrations?'}
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
                        ? `No credentials match your search "${search}". Try adjusting your search terms.`
                        : 'Create your first credential and safely store API keys, tokens, and secrets for 3rd party integrations'}
                </Typography>

                {!search && (
                    <StyledPermissionButton
                        permissionId='credentials:create'
                        variant='contained'
                        onClick={listCredential}
                        startIcon={<IconLock size={20} />}
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
                        Add Your First Credential
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
                                        <IconLock size={28} color={theme.palette.primary.main} />
                                        <Typography
                                            variant='h3'
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Credentials
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
                                        API keys, tokens, and secrets for 3rd party integrations
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
                                        placeholder='Search credentials by name or type...'
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
                                        <StyledPermissionButton
                                            permissionId='credentials:create'
                                            variant='contained'
                                            onClick={listCredential}
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
                                            Add Credential
                                        </StyledPermissionButton>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Paper>

                        {/* Content - Table remains exactly the same */}
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
                                                <StyledTable aria-label='credentials table'>
                                                    <TableHead>
                                                        <TableRow>
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
                                                                    Credential Name
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '20%' }}>
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
                                                            <StyledTableCell style={{ width: '20%' }}>
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
                                                                    Share
                                                                </Typography>
                                                            </StyledTableCell>
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
                                                            <StyledTableCell style={{ width: '6%' }}>
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
                                                            filteredData.map((credential, index) => (
                                                                <StyledTableRow key={`${credential.id}-${index}`}>
                                                                    <StyledTableCell scope='row'>
                                                                        <Box
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 2
                                                                            }}
                                                                        >
                                                                            <CredentialIconContainer>
                                                                                <img
                                                                                    style={{
                                                                                        width: '20px',
                                                                                        height: '20px',
                                                                                        objectFit: 'contain',
                                                                                        zIndex: 1
                                                                                    }}
                                                                                    alt={credential.credentialName}
                                                                                    src={`${baseURL}/api/v1/components-credentials-icon/${credential.credentialName}`}
                                                                                    onError={(e) => {
                                                                                        e.target.onerror = null
                                                                                        e.target.src = keySVG
                                                                                    }}
                                                                                />
                                                                            </CredentialIconContainer>
                                                                            <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                                                                {credential.name}
                                                                            </Box>
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
                                                                            {moment(credential.updatedDate).format('MMM DD, YYYY')}
                                                                            <br />
                                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                                {moment(credential.updatedDate).format('HH:mm')}
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
                                                                            {moment(credential.createdDate).format('MMM DD, YYYY')}
                                                                            <br />
                                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                                {moment(credential.createdDate).format('HH:mm')}
                                                                            </span>
                                                                        </Box>
                                                                    </StyledTableCell>
                                                                    {!credential.shared ? (
                                                                        <>
                                                                            <StyledTableCell>
                                                                                <StyledPermissionIconButton
                                                                                    permissionId={'credentials:share'}
                                                                                    display={'feat:workspaces'}
                                                                                    title='Share'
                                                                                    color='primary'
                                                                                    onClick={() => share(credential)}
                                                                                >
                                                                                    <IconShare />
                                                                                </StyledPermissionIconButton>
                                                                            </StyledTableCell>
                                                                            <StyledTableCell>
                                                                                <StyledPermissionIconButton
                                                                                    permissionId={'credentials:create,credentials:update'}
                                                                                    title='Edit'
                                                                                    color='primary'
                                                                                    onClick={() => edit(credential)}
                                                                                >
                                                                                    <IconEdit />
                                                                                </StyledPermissionIconButton>
                                                                            </StyledTableCell>
                                                                            <StyledTableCell>
                                                                                <StyledPermissionIconButton
                                                                                    permissionId={'credentials:delete'}
                                                                                    title='Delete'
                                                                                    color='error'
                                                                                    onClick={() => deleteCredential(credential)}
                                                                                >
                                                                                    <IconTrash />
                                                                                </StyledPermissionIconButton>
                                                                            </StyledTableCell>
                                                                        </>
                                                                    ) : (
                                                                        <StyledTableCell colSpan={3}>
                                                                            <SharedCredentialBadge>Shared Credential</SharedCredentialBadge>
                                                                        </StyledTableCell>
                                                                    )}
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

                <CredentialListDialog
                    show={showCredentialListDialog}
                    dialogProps={credentialListDialogProps}
                    onCancel={() => setShowCredentialListDialog(false)}
                    onCredentialSelected={onCredentialSelected}
                />
                {showSpecificCredentialDialog && (
                    <AddEditCredentialDialog
                        show={showSpecificCredentialDialog}
                        dialogProps={specificCredentialDialogProps}
                        onCancel={() => setShowSpecificCredentialDialog(false)}
                        onConfirm={onConfirm}
                        setError={setError}
                    />
                )}
                {showShareCredentialDialog && (
                    <ShareWithWorkspaceDialog
                        show={showShareCredentialDialog}
                        dialogProps={shareCredentialDialogProps}
                        onCancel={() => setShowShareCredentialDialog(false)}
                        setError={setError}
                    />
                )}
                <ConfirmDialog />
            </MainCard>
        </Container>
    )
}

export default Credentials
