import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

// material-ui
import {
    Box,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    InputAdornment,
    Fade,
    Skeleton,
    Container,
    alpha
} from '@mui/material'
import { useTheme, styled } from '@mui/material/styles'
import { tableCellClasses } from '@mui/material/TableCell'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import AddDocStoreDialog from '@/views/docstore/AddDocStoreDialog'
import ErrorBoundary from '@/ErrorBoundary'
import DocumentStoreStatus from '@/views/docstore/DocumentStoreStatus'
import { StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import ManageScrapedLinksDialog from '@/ui-component/dialog/ManageScrapedLinksDialog'

// API
import useApi from '@/hooks/useApi'
import documentsApi from '@/api/documentstore'

// utils
import useNotifier from '@/utils/useNotifier'

// icons
import { IconPlus, IconSearch, IconDatabase, IconLink } from '@tabler/icons-react'
import doc_store_empty from '@/assets/images/doc_store_empty.svg'

// const
import { baseURL } from '@/store/constant'
import { useError } from '@/store/context/ErrorContext'

// store
import {
    HIDE_CANVAS_DIALOG,
    SHOW_CANVAS_DIALOG,
    enqueueSnackbar as enqueueSnackbarAction,
    closeSnackbar as closeSnackbarAction
} from '@/store/actions'

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

const StyledTypography = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    color: theme.palette.text.primary,
    lineHeight: 1.4
}))

const LoaderImageContainer = styled(Box)(({ theme }) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.grey[100], 0.8),
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',

    '&:hover': {
        transform: 'scale(1.1)',
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

const ConnectedFlowsBadge = styled(Typography)(({ theme }) => ({
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    padding: '4px 8px',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.info.main, 0.08),
    borderRadius: 6,
    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
    display: 'inline-block',
    minWidth: 'fit-content',
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.15) : alpha(theme.palette.info.main, 0.12),
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.25)}`
    }
}))

// ==============================|| DOCUMENTS ||============================== //

const Documents = () => {
    const theme = useTheme()
    const _customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()

    const navigate = useNavigate()
    const getAllDocumentStores = useApi(documentsApi.getAllDocumentStores)
    const { error, setError } = useError()

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [isLoading, setLoading] = useState(true)
    const [images, setImages] = useState({})
    const [search, setSearch] = useState('')
    const [showDialog, setShowDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [docStores, setDocStores] = useState([])
    const [showScrapLinksDialog, setShowScrapLinksDialog] = useState(false)
    const [scrapLinksDialogProps, setScrapLinksDialogProps] = useState({})

    function filterDocStores(data) {
        if (!search) return true
        return (
            data.name.toLowerCase().includes(search.toLowerCase()) ||
            (data.description && data.description.toLowerCase().includes(search.toLowerCase()))
        )
    }

    // Get filtered data
    const filteredData = docStores ? docStores.filter(filterDocStores) : []

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    const goToDocumentStore = (id) => {
        navigate('/document-stores/' + id)
    }

    const addNew = () => {
        const dialogProp = {
            title: 'Add New Document Store',
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add'
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const onConfirm = () => {
        setShowDialog(false)
        getAllDocumentStores.request()
    }

    const onScrapLinksClick = () => {
        const dialogProp = {
            url: '',
            selectedLinks: [],
            relativeLinksMethod: 'webCrawl',
            limit: 10
        }
        setScrapLinksDialogProps(dialogProp)
        setShowScrapLinksDialog(true)
    }

    const onScrapLinksDialogSave = (url, links) => {
        setShowScrapLinksDialog(false)
        // Here you can handle the scraped links as needed
        console.log('Scraped links:', links)
        enqueueSnackbar({
            message: `Successfully scraped ${links.length} links`,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'success'
            }
        })
    }

    // Canvas dialog effects for scrap links dialog
    useEffect(() => {
        if (showScrapLinksDialog) dispatch({ type: SHOW_CANVAS_DIALOG })
        else dispatch({ type: HIDE_CANVAS_DIALOG })
        return () => dispatch({ type: HIDE_CANVAS_DIALOG })
    }, [showScrapLinksDialog, dispatch])

    useEffect(() => {
        getAllDocumentStores.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllDocumentStores.error) {
            setError(getAllDocumentStores.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllDocumentStores.error])

    useEffect(() => {
        if (getAllDocumentStores.data) {
            try {
                const docStores = getAllDocumentStores.data
                if (!Array.isArray(docStores)) return
                const loaderImages = {}

                for (let i = 0; i < docStores.length; i += 1) {
                    const loaders = docStores[i].loaders ?? []

                    let totalChunks = 0
                    let totalChars = 0
                    loaderImages[docStores[i].id] = []
                    for (let j = 0; j < loaders.length; j += 1) {
                        const imageSrc = `${baseURL}/api/v1/node-icon/${loaders[j].loaderId}`
                        if (!loaderImages[docStores[i].id].includes(imageSrc)) {
                            loaderImages[docStores[i].id].push(imageSrc)
                        }
                        totalChunks += loaders[j]?.totalChunks ?? 0
                        totalChars += loaders[j]?.totalChars ?? 0
                    }
                    docStores[i].totalDocs = loaders?.length ?? 0
                    docStores[i].totalChunks = totalChunks
                    docStores[i].totalChars = totalChars
                }
                setDocStores(docStores)
                setImages(loaderImages)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllDocumentStores.data])

    useEffect(() => {
        setLoading(getAllDocumentStores.loading)
    }, [getAllDocumentStores.loading])

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
                        src={doc_store_empty}
                        alt='No Document Stores'
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
                    {search ? 'No document stores found' : 'Ready to build your knowledge base?'}
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
                        ? `No document stores match your search "${search}". Try adjusting your search terms.`
                        : 'Create your first document store and enable powerful RAG capabilities for your LLMs'}
                </Typography>

                {!search && (
                    <StyledPermissionButton
                        permissionId={'documentStores:create'}
                        variant='contained'
                        onClick={addNew}
                        startIcon={<IconDatabase size={20} />}
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
                        Create Your First Store
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
                                        <IconDatabase size={28} color={theme.palette.primary.main} />
                                        <Typography
                                            variant='h3'
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Knowledge Base
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
                                        Store and upsert documents for LLM retrieval (RAG)
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
                                        placeholder='Search document stores by name or description...'
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
                                            variant='contained'
                                            onClick={onScrapLinksClick}
                                            startIcon={<IconLink size={18} />}
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
                                            Scrap Links
                                        </StyledPermissionButton>
                                        <StyledPermissionButton
                                            permissionId={'documentStores:create'}
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
                                            Add New Store
                                        </StyledPermissionButton>
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
                                                <StyledTable aria-label='documents table'>
                                                    <TableHead>
                                                        <TableRow>
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
                                                                    Status
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '18%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Name
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
                                                                    Description
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
                                                                    Connected flows
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
                                                                    Total characters
                                                                </Typography>
                                                            </StyledTableCell>
                                                            <StyledTableCell style={{ width: '10%' }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 600,
                                                                        color: 'inherit',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.025em'
                                                                    }}
                                                                >
                                                                    Total chunks
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
                                                                    Loader types
                                                                </Typography>
                                                            </StyledTableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {filteredData.map((data, index) => (
                                                            <StyledTableRow
                                                                onClick={() => goToDocumentStore(data.id)}
                                                                key={`${data.id}-${index}`}
                                                            >
                                                                <StyledTableCell align='center'>
                                                                    <DocumentStoreStatus isTableView={true} status={data.status} />
                                                                </StyledTableCell>
                                                                <StyledTableCell>
                                                                    <StyledTypography
                                                                        sx={{
                                                                            display: '-webkit-box',
                                                                            fontWeight: 500,
                                                                            WebkitLineClamp: 2,
                                                                            WebkitBoxOrient: 'vertical',
                                                                            textOverflow: 'ellipsis',
                                                                            overflow: 'hidden'
                                                                        }}
                                                                    >
                                                                        {data.name}
                                                                    </StyledTypography>
                                                                </StyledTableCell>
                                                                <StyledTableCell>
                                                                    <StyledTypography
                                                                        sx={{
                                                                            display: '-webkit-box',
                                                                            fontSize: '0.8125rem',
                                                                            WebkitLineClamp: 3,
                                                                            WebkitBoxOrient: 'vertical',
                                                                            textOverflow: 'ellipsis',
                                                                            overflow: 'hidden',
                                                                            lineHeight: 1.3,
                                                                            color: 'text.secondary'
                                                                        }}
                                                                    >
                                                                        {data?.description || (
                                                                            <span
                                                                                style={{
                                                                                    fontStyle: 'italic',
                                                                                    color: theme.palette.text.disabled
                                                                                }}
                                                                            >
                                                                                —
                                                                            </span>
                                                                        )}
                                                                    </StyledTypography>
                                                                </StyledTableCell>
                                                                <StyledTableCell>
                                                                    <ConnectedFlowsBadge>{data.whereUsed?.length ?? 0}</ConnectedFlowsBadge>
                                                                </StyledTableCell>
                                                                <StyledTableCell>
                                                                    <StyledTypography
                                                                        sx={{
                                                                            fontSize: '0.8125rem',
                                                                            color: 'text.secondary'
                                                                        }}
                                                                    >
                                                                        {data.totalChars?.toLocaleString() || 0}
                                                                    </StyledTypography>
                                                                </StyledTableCell>
                                                                <StyledTableCell>
                                                                    <StyledTypography
                                                                        sx={{
                                                                            fontSize: '0.8125rem',
                                                                            color: 'text.secondary'
                                                                        }}
                                                                    >
                                                                        {data.totalChunks?.toLocaleString() || 0}
                                                                    </StyledTypography>
                                                                </StyledTableCell>
                                                                <StyledTableCell>
                                                                    {images[data.id] && images[data.id].length > 0 ? (
                                                                        <Box
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'flex-start',
                                                                                gap: 1,
                                                                                flexWrap: 'wrap'
                                                                            }}
                                                                        >
                                                                            {images[data.id].slice(0, 3).map((img, imgIndex) => (
                                                                                <LoaderImageContainer key={`${img}-${imgIndex}`}>
                                                                                    <img
                                                                                        style={{
                                                                                            width: '18px',
                                                                                            height: '18px',
                                                                                            objectFit: 'contain',
                                                                                            zIndex: 1
                                                                                        }}
                                                                                        alt='Loader'
                                                                                        src={img}
                                                                                    />
                                                                                </LoaderImageContainer>
                                                                            ))}
                                                                            {images[data.id].length > 3 && (
                                                                                <StyledTypography
                                                                                    sx={{
                                                                                        fontSize: '0.75rem',
                                                                                        color: 'text.secondary',
                                                                                        ml: 0.5
                                                                                    }}
                                                                                >
                                                                                    +{images[data.id].length - 3}
                                                                                </StyledTypography>
                                                                            )}
                                                                        </Box>
                                                                    ) : (
                                                                        <StyledTypography
                                                                            sx={{
                                                                                fontStyle: 'italic',
                                                                                color: 'text.disabled',
                                                                                fontSize: '0.8125rem'
                                                                            }}
                                                                        >
                                                                            —
                                                                        </StyledTypography>
                                                                    )}
                                                                </StyledTableCell>
                                                            </StyledTableRow>
                                                        ))}
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
                {showDialog && (
                    <AddDocStoreDialog
                        dialogProps={dialogProps}
                        show={showDialog}
                        onCancel={() => setShowDialog(false)}
                        onConfirm={onConfirm}
                    />
                )}
                {showScrapLinksDialog && (
                    <ManageScrapedLinksDialog
                        show={showScrapLinksDialog}
                        dialogProps={scrapLinksDialogProps}
                        onCancel={() => setShowScrapLinksDialog(false)}
                        onSave={onScrapLinksDialogSave}
                    />
                )}
            </MainCard>
        </Container>
    )
}

export default Documents
