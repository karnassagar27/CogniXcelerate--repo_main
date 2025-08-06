import { useState, useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

// material-ui
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fade,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useTheme,
    alpha,
    Alert,
    Skeleton,
    FormControl,
    OutlinedInput,
    Chip,
    TableSortLabel,
    Tooltip,
    Tabs,
    Tab
} from '@mui/material'
import {
    IconEraser,
    IconTrash,
    IconWorld,
    IconRobot,
    IconCode,
    IconCopy,
    IconCheck,
    IconSearch,
    IconMessages,
    IconApi
} from '@tabler/icons-react'
import PerfectScrollbar from 'react-perfect-scrollbar'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'
import { StyledButton } from '@/ui-component/button/StyledButton'
import APICodeDialog from '@/views/chatflows/APICodeDialog'

// API
import scraperApi from '@/api/scraper'
import chatflowsApi from '@/api/chatflows'

// utils
import useNotifier from '@/utils/useNotifier'

// utils
import moment from 'moment'

// store
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// Add custom styles to prevent shrinking
const preventShrinkingStyles = {
    '& .MuiContainer-root': {
        minWidth: '100% !important',
        width: '100% !important'
    },
    '& .MuiPaper-root': {
        minWidth: '100% !important',
        width: '100% !important'
    }
}

// ==============================|| KNOWLEDGE BASE SCRAP LINKS ||============================== //

const KnowledgeBaseScrapLinks = () => {
    const theme = useTheme()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const _closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [loading, setLoading] = useState(false)
    const [selectedLinks, setSelectedLinks] = useState([])
    const [url, setUrl] = useState('')
    const [relativeLinksMethod, setRelativeLinksMethod] = useState('webCrawl')
    const [linkLimit, setLinkLimit] = useState(10) // Default to 10, but user can change
    const [showWebContainer, setShowWebContainer] = useState(false)
    const [showDocumentContainer, setShowDocumentContainer] = useState(false)

    // Document chatflow state
    const [trainingBot, setTrainingBot] = useState(false)
    const [botId, setBotId] = useState('')
    const [showBotDialog, setShowBotDialog] = useState(false)
    const [embedCode, setEmbedCode] = useState('')
    const [copied, setCopied] = useState(false)
    const [chunkSize, setChunkSize] = useState(1000)
    const [chunkOverlap, setChunkOverlap] = useState(200)

    // Table state
    const [chatflows, setChatflows] = useState([])
    const [isLoadingChatflows, setIsLoadingChatflows] = useState(true)
    const [search, setSearch] = useState('')
    const [orderBy, setOrderBy] = useState('createdDate')
    const [order, setOrder] = useState('desc')

    // API Dialog state
    const [apiDialogOpen, setApiDialogOpen] = useState(false)
    const [apiDialogProps, setApiDialogProps] = useState({})

    // Delete Dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [chatflowToDelete, setChatflowToDelete] = useState(null)

    const [selectedTab, setSelectedTab] = useState(0)

    const handleFetchLinks = async () => {
        setLoading(true)
        try {
            const fetchLinksResp = await scraperApi.fetchLinks(url, relativeLinksMethod, linkLimit)
            if (fetchLinksResp.data) {
                setSelectedLinks(fetchLinksResp.data.links)
                enqueueSnackbar({
                    message: `Successfully fetched ${fetchLinksResp.data.links.length} links (limited to ${linkLimit})`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success'
                    }
                })
            }
        } catch (error) {
            enqueueSnackbar({
                message:
                    typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data || 'Error fetching links',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true
                }
            })
        }
        setLoading(false)
    }

    const handleChangeLink = (index, event) => {
        const { value } = event.target
        const links = [...selectedLinks]
        links[index] = value
        setSelectedLinks(links)
    }

    const handleRemoveLink = (index) => {
        const links = [...selectedLinks]
        links.splice(index, 1)
        setSelectedLinks(links)
    }

    const handleRemoveAllLinks = () => {
        setSelectedLinks([])
    }

    const handleSaveLinks = () => {
        // console.log('Scraped links:', selectedLinks)
        enqueueSnackbar({
            message: `Successfully saved ${selectedLinks.length} links`,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'success'
            }
        })
    }

    const toggleWebContainer = () => {
        setShowWebContainer(!showWebContainer)
    }

    const handleCreateDocumentChatflow = async () => {
        if (selectedLinks.length === 0) {
            enqueueSnackbar({
                message: 'Please add some links first before creating the document chatflow',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'warning'
                }
            })
            return
        }

        setTrainingBot(true)
        try {
            // Get all chatflows to find document_sample
            const allChatflowsResponse = await chatflowsApi.getAllChatflows()
            const documentSample = allChatflowsResponse.data.find((chatflow) => chatflow.name === 'document_sample')

            if (!documentSample) {
                throw new Error('document_sample chatflow not found. Please create a chatflow named "document_sample" first.')
            }

            // Get the document_sample chatflow as template and duplicate it
            const documentSampleResponse = await chatflowsApi.getSpecificChatflow(documentSample.id)

            if (!documentSampleResponse.data) {
                throw new Error('Failed to get document_sample template')
            }

            // Parse the flow data
            const flowData = JSON.parse(documentSampleResponse.data.flowData)

            // Find the Cheerio Web Scraper node and update its URL
            const cheerioNode = flowData.nodes.find((node) => node.data.name === 'cheerioWebScraper')
            if (cheerioNode) {
                cheerioNode.data.inputs.url = url
                cheerioNode.data.inputs.selectedLinks = selectedLinks
                cheerioNode.data.inputs.limit = linkLimit.toString()
                cheerioNode.data.inputs.relativeLinksMethod = relativeLinksMethod
            }

            // Create new chatflow with modified data
            const chatflowData = {
                name: `Document Chat - ${url}`,
                type: 'CHATFLOW',
                flowData: JSON.stringify(flowData)
            }

            // Create the chatflow
            const chatflowResponse = await chatflowsApi.createNewChatflow(chatflowData)

            if (chatflowResponse.data && chatflowResponse.data.id) {
                const newBotId = chatflowResponse.data.id
                setBotId(newBotId)

                // Generate embed code
                const baseURL = window.location.origin
                const generatedEmbedCode = `<script type="module">
    import Chatbot from "https://cdn.jsdelivr.net/npm/cognixcelerate-embed/dist/web.js"
    Chatbot.init({
        chatflowid: "${newBotId}",
        apiHost: "${baseURL}",
    })
</script>`

                setEmbedCode(generatedEmbedCode)
                setShowBotDialog(true)

                enqueueSnackbar({
                    message: `Document chatflow created successfully! Bot ID: ${newBotId}`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success'
                    }
                })

                // Refresh the table to show the new chatflow
                loadChatflows()
            } else {
                throw new Error('Failed to create chatflow')
            }
        } catch (error) {
            console.error('Error creating document chatflow:', error)
            enqueueSnackbar({
                message: 'Error creating document chatflow. Please try again.',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error'
                }
            })
        }
        setTrainingBot(false)
    }

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(embedCode)
            setCopied(true)
            enqueueSnackbar({
                message: 'Embed code copied to clipboard!',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'success'
                }
            })
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            enqueueSnackbar({
                message: 'Failed to copy code',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error'
                }
            })
        }
    }

    // Table functions
    const loadChatflows = useCallback(async () => {
        setIsLoadingChatflows(true)
        try {
            const response = await chatflowsApi.getAllChatflows()
            if (response.data) {
                // Filter only document chatflows (those created from this page)
                const documentChatflows = response.data.filter((chatflow) => chatflow.name && chatflow.name.includes('Document Chat -'))
                setChatflows(documentChatflows)
            }
        } catch (error) {
            console.error('Error loading chatflows:', error)
            enqueueSnackbar({
                message: 'Error loading document chatflows',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error'
                }
            })
        }
        setIsLoadingChatflows(false)
    }, [])

    const handleSearchChange = (event) => {
        setSearch(event.target.value)
    }

    const filterChatflows = (data) => {
        return (
            data?.name.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
            (data.category && data.category.toLowerCase().indexOf(search.toLowerCase()) > -1) ||
            data?.id.toLowerCase().indexOf(search.toLowerCase()) > -1
        )
    }

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc'
        setOrder(isAsc ? 'desc' : 'asc')
        setOrderBy(property)
    }

    const handleRowClick = (chatflow) => {
        navigate(`/canvas/${chatflow.id}`)
    }

    const _createNewChatflow = () => {
        navigate('/canvas')
    }

    const handleAPIDialogClick = (chatflow) => {
        // If file type is file, isFormDataRequired = true
        let isFormDataRequired = false
        try {
            const flowData = JSON.parse(chatflow.flowData)
            const nodes = flowData.nodes
            for (const node of nodes) {
                if (node.data.inputParams && node.data.inputParams.find((param) => param.type === 'file')) {
                    isFormDataRequired = true
                    break
                }
            }
        } catch (e) {
            console.error(e)
        }

        // If sessionId memory, isSessionMemory = true
        let isSessionMemory = false
        try {
            const flowData = JSON.parse(chatflow.flowData)
            const nodes = flowData.nodes
            for (const node of nodes) {
                if (node.data.inputParams && node.data.inputParams.find((param) => param.name === 'sessionId')) {
                    isSessionMemory = true
                    break
                }
            }
        } catch (e) {
            console.error(e)
        }

        setApiDialogProps({
            title: 'Embed in website or use as API',
            chatflowid: chatflow.id,
            chatflowApiKeyId: chatflow.apikeyid,
            isFormDataRequired,
            isSessionMemory,
            isAgentCanvas: false,
            isAgentflowV2: false
        })
        setApiDialogOpen(true)
    }

    const handleDeleteClick = (chatflow) => {
        setChatflowToDelete(chatflow)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!chatflowToDelete) return

        try {
            await chatflowsApi.deleteChatflow(chatflowToDelete.id)

            enqueueSnackbar({
                message: `Document chatflow "${chatflowToDelete.name}" deleted successfully`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'success'
                }
            })

            // Refresh the table
            loadChatflows()
        } catch (error) {
            console.error('Error deleting chatflow:', error)
            enqueueSnackbar({
                message: 'Error deleting document chatflow. Please try again.',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error'
                }
            })
        }

        setDeleteDialogOpen(false)
        setChatflowToDelete(null)
    }

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false)
        setChatflowToDelete(null)
    }

    // Load chatflows on component mount
    useEffect(() => {
        loadChatflows()
    }, [loadChatflows])

    // Apply global styles to prevent shrinking
    useEffect(() => {
        const style = document.createElement('style')
        style.textContent = `
            .knowledge-base-container {
                min-width: 100% !important;
                width: 100% !important;
            }
            .knowledge-base-container .MuiContainer-root {
                min-width: 100% !important;
                width: 100% !important;
            }
            .knowledge-base-container .MuiPaper-root {
                min-width: 100% !important;
                width: 100% !important;
            }
        `
        document.head.appendChild(style)

        return () => {
            document.head.removeChild(style)
        }
    }, [])

    return (
        <Container
            maxWidth={false}
            className='knowledge-base-container'
            sx={{
                py: 3,
                px: { xs: 2, sm: 3, md: 4 },
                minWidth: '100%',
                width: '100%',
                ...preventShrinkingStyles
            }}
        >
            <MainCard
                maxWidth='full'
                sx={{
                    border: 'none',
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                    width: '100%',
                    maxWidth: 'none !important',
                    minWidth: '100%'
                }}
            >
                <Stack spacing={3} sx={{ width: '100%' }}>
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
                                    <IconWorld size={28} color={theme.palette.primary.main} />
                                    <Typography
                                        variant='h3'
                                        sx={{
                                            fontWeight: 700,
                                            color: theme.palette.text.primary
                                        }}
                                    >
                                        Chat Agent
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
                                    Scrape web content and create document-based chatflows
                                </Typography>
                            </Box>

                            {/* Tabs */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
                                <Tabs
                                    value={selectedTab}
                                    onChange={(_, newValue) => setSelectedTab(newValue)}
                                    textColor='primary'
                                    indicatorColor='primary'
                                    sx={{
                                        minHeight: 48,
                                        '& .MuiTab-root': {
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                            minHeight: 48,
                                            color: theme.palette.text.primary,
                                            borderRadius: 2,
                                            px: 3,
                                            py: 1,
                                            mr: 2,
                                            '&.Mui-selected': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                                color: theme.palette.primary.main
                                            }
                                        }
                                    }}
                                >
                                    <Tab label='Scrap Links' />
                                    <Tab label='Scrap Documents' />
                                    <Tab label='One Drive' />
                                </Tabs>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* Render the correct panel based on the selected tab */}
                    {selectedTab === 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Typography
                                variant='h4'
                                gutterBottom
                                sx={{
                                    fontWeight: 700,
                                    color: theme.palette.primary.main,
                                    mb: 3
                                }}
                            >
                                Web Container Scraper
                            </Typography>

                            {/* URL Input Section */}
                            <Box sx={{ mb: 4 }}>
                                <Stack flexDirection='row' gap={1} sx={{ width: '100%' }}>
                                    <FormControl sx={{ mt: 1, width: '100%', display: 'flex', flexShrink: 1 }} size='small'>
                                        <OutlinedInput
                                            id='url'
                                            size='small'
                                            type='text'
                                            value={url}
                                            name='url'
                                            placeholder='Enter URL to scrape...'
                                            onChange={(e) => {
                                                setUrl(e.target.value)
                                            }}
                                        />
                                    </FormControl>
                                    <Button
                                        disabled={!url}
                                        sx={{ borderRadius: '12px', mt: 1, display: 'flex', flexShrink: 0 }}
                                        size='small'
                                        variant='contained'
                                        onClick={handleFetchLinks}
                                    >
                                        Add & Train
                                    </Button>
                                </Stack>
                            </Box>

                            {/* Link Limit Configuration */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                    Link Limitation Settings
                                </Typography>
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant='body2' color='text.secondary' gutterBottom>
                                            Maximum Links to Scrape
                                        </Typography>
                                        <FormControl fullWidth size='small'>
                                            <OutlinedInput
                                                type='number'
                                                value={linkLimit}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    if (value === '') {
                                                        setLinkLimit(1)
                                                    } else {
                                                        const numValue = parseInt(value)
                                                        if (!isNaN(numValue)) {
                                                            setLinkLimit(Math.max(1, Math.min(1000, numValue)))
                                                        }
                                                    }
                                                }}
                                                inputProps={{
                                                    min: 1,
                                                    max: 1000,
                                                    step: 1
                                                }}
                                                placeholder='Enter number of links (1-1000)'
                                                sx={{ borderRadius: 2 }}
                                            />
                                        </FormControl>
                                    </Box>
                                    <Box>
                                        <Typography variant='body2' color='text.secondary'>
                                            Set to 0 for unlimited links
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                                            Higher limits may take longer to process
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Text Splitter Configuration */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                    Text Splitter Settings
                                </Typography>
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant='body2' color='text.secondary' gutterBottom>
                                            Chunk Size
                                        </Typography>
                                        <FormControl fullWidth size='small'>
                                            <OutlinedInput
                                                type='number'
                                                value={chunkSize}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 1000
                                                    setChunkSize(Math.max(100, Math.min(10000, value)))
                                                }}
                                                inputProps={{
                                                    min: 100,
                                                    max: 10000,
                                                    step: 100
                                                }}
                                                placeholder='Chunk size (100-10000)'
                                                sx={{ borderRadius: 2 }}
                                            />
                                        </FormControl>
                                    </Box>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant='body2' color='text.secondary' gutterBottom>
                                            Chunk Overlap
                                        </Typography>
                                        <FormControl fullWidth size='small'>
                                            <OutlinedInput
                                                type='number'
                                                value={chunkOverlap}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 200
                                                    setChunkOverlap(Math.max(0, Math.min(chunkSize, value)))
                                                }}
                                                inputProps={{
                                                    min: 0,
                                                    max: chunkSize,
                                                    step: 50
                                                }}
                                                placeholder='Chunk overlap (0-chunkSize)'
                                                sx={{ borderRadius: 2 }}
                                            />
                                        </FormControl>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Relative Links Method Selection */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                    Scraping Method
                                </Typography>
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant='body2' color='text.secondary' gutterBottom>
                                            Get Relative Links Method
                                        </Typography>
                                        <FormControl fullWidth size='small'>
                                            <OutlinedInput
                                                select
                                                value={relativeLinksMethod}
                                                onChange={(e) => setRelativeLinksMethod(e.target.value)}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <option value='webCrawl'>Web Crawl</option>
                                                <option value='scrapeXMLSitemap'>Scrape XML Sitemap</option>
                                            </OutlinedInput>
                                        </FormControl>
                                    </Box>
                                    <Box>
                                        <Typography variant='body2' color='text.secondary'>
                                            {relativeLinksMethod === 'webCrawl'
                                                ? 'Crawl relative links from HTML URL'
                                                : 'Scrape relative links from XML sitemap URL'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Scraped Links Section */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography sx={{ fontWeight: 500 }}>
                                    Scraped Links {selectedLinks.length > 0 && `(${selectedLinks.length})`}
                                </Typography>
                                {selectedLinks.length > 0 ? (
                                    <Button
                                        sx={{ height: 'max-content', width: 'max-content' }}
                                        variant='outlined'
                                        color='error'
                                        title='Clear All Links'
                                        onClick={handleRemoveAllLinks}
                                        startIcon={<IconEraser />}
                                    >
                                        Clear All
                                    </Button>
                                ) : null}
                            </Box>

                            {/* Links List */}
                            <>
                                {loading && <BackdropLoader open={loading} />}
                                {selectedLinks.length > 0 ? (
                                    <PerfectScrollbar
                                        style={{
                                            height: '100%',
                                            maxHeight: '320px',
                                            overflowX: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 4
                                        }}
                                    >
                                        {selectedLinks.map((link, index) => (
                                            <div key={index} style={{ display: 'flex', width: '100%' }}>
                                                <Box sx={{ display: 'flex', width: '100%' }}>
                                                    <OutlinedInput
                                                        sx={{ width: '100%' }}
                                                        key={index}
                                                        type='text'
                                                        onChange={(e) => handleChangeLink(index, e)}
                                                        size='small'
                                                        value={link}
                                                        name={`link_${index}`}
                                                    />
                                                </Box>
                                                <Box sx={{ width: 'auto', flexGrow: 1 }}>
                                                    <IconButton
                                                        sx={{ height: 30, width: 30 }}
                                                        size='small'
                                                        color='error'
                                                        onClick={() => handleRemoveLink(index)}
                                                        edge='end'
                                                    >
                                                        <IconTrash />
                                                    </IconButton>
                                                </Box>
                                            </div>
                                        ))}
                                    </PerfectScrollbar>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ my: 2 }}>Links scraped from the URL will appear here</Typography>
                                    </div>
                                )}
                            </>

                            {/* Action Buttons */}
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Stack direction='row' spacing={2}>
                                    {selectedLinks.length > 0 && (
                                        <StyledButton
                                            variant='contained'
                                            onClick={handleSaveLinks}
                                            sx={{
                                                bgcolor: theme.palette.primary.main,
                                                '&:hover': {
                                                    bgcolor: theme.palette.primary.dark
                                                }
                                            }}
                                        >
                                            Save Links
                                        </StyledButton>
                                    )}
                                </Stack>

                                <StyledButton
                                    variant='contained'
                                    onClick={handleCreateDocumentChatflow}
                                    disabled={trainingBot || selectedLinks.length === 0}
                                    startIcon={trainingBot ? null : <IconRobot size={20} />}
                                    sx={{
                                        bgcolor: theme.palette.success.main,
                                        '&:hover': {
                                            bgcolor: theme.palette.success.dark
                                        },
                                        '&:disabled': {
                                            bgcolor: theme.palette.grey[300],
                                            color: theme.palette.grey[500]
                                        }
                                    }}
                                >
                                    {trainingBot ? 'Creating Chatflow...' : 'Create Document Chatflow'}
                                </StyledButton>
                            </Box>
                        </Paper>
                    )}
                    {selectedTab === 1 && (
                        <Paper
                            sx={{
                                mt: 2,
                                p: 4,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                            }}
                        >
                            <Typography variant='h4' gutterBottom sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 3 }}>
                                Scrap Documents (Coming Soon)
                            </Typography>
                            <Typography color='text.secondary'>This is a placeholder for the Scrap Documents panel.</Typography>
                        </Paper>
                    )}
                    {selectedTab === 2 && (
                        <Paper
                            sx={{
                                mt: 2,
                                p: 4,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                            }}
                        >
                            <Typography variant='h4' gutterBottom sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 3 }}>
                                One Drive (Coming Soon)
                            </Typography>
                            <Typography color='text.secondary'>This is a placeholder for the One Drive panel.</Typography>
                        </Paper>
                    )}

                    {/* Document Chatflows Table - Only show when Scrap Links tab is active */}
                    {selectedTab === 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: `0 2px 12px ${alpha(theme.palette.grey[500], 0.08)}`
                            }}
                        >
                            <Stack spacing={3}>
                                {/* Table Header */}
                                <Box>
                                    <Stack direction='row' alignItems='center' spacing={1.5} mb={1}>
                                        <IconMessages size={28} color={theme.palette.primary.main} />
                                        <Typography
                                            variant='h4'
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Knowledge Base Chatflows
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
                                        View and manage your document-based chatflows created from web scraping
                                    </Typography>
                                </Box>

                                {/* Search and Controls */}
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={3}
                                    alignItems={{ xs: 'stretch', sm: 'center' }}
                                    justifyContent='space-between'
                                >
                                    <TextField
                                        placeholder='Search chatflows, categories, or IDs...'
                                        value={search}
                                        onChange={handleSearchChange}
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
                                </Stack>

                                {/* Table Content */}
                                {isLoadingChatflows ? (
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
                                ) : (
                                    <>
                                        {chatflows && chatflows.length > 0 ? (
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
                                                    <TableContainer>
                                                        <Table>
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell
                                                                        sortDirection={orderBy === 'name' ? order : false}
                                                                        sx={{ fontWeight: 600 }}
                                                                    >
                                                                        <TableSortLabel
                                                                            active={orderBy === 'name'}
                                                                            direction={orderBy === 'name' ? order : 'asc'}
                                                                            onClick={() => handleRequestSort('name')}
                                                                        >
                                                                            Name
                                                                        </TableSortLabel>
                                                                    </TableCell>

                                                                    <TableCell
                                                                        sortDirection={orderBy === 'createdDate' ? order : false}
                                                                        sx={{ fontWeight: 600 }}
                                                                    >
                                                                        <TableSortLabel
                                                                            active={orderBy === 'createdDate'}
                                                                            direction={orderBy === 'createdDate' ? order : 'asc'}
                                                                            onClick={() => handleRequestSort('createdDate')}
                                                                        >
                                                                            Created
                                                                        </TableSortLabel>
                                                                    </TableCell>
                                                                    <TableCell
                                                                        sortDirection={orderBy === 'updatedDate' ? order : false}
                                                                        sx={{ fontWeight: 600 }}
                                                                    >
                                                                        <TableSortLabel
                                                                            active={orderBy === 'updatedDate'}
                                                                            direction={orderBy === 'updatedDate' ? order : 'asc'}
                                                                            onClick={() => handleRequestSort('updatedDate')}
                                                                        >
                                                                            Updated
                                                                        </TableSortLabel>
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {chatflows
                                                                    .filter(filterChatflows)
                                                                    .sort((a, b) => {
                                                                        const aValue = a[orderBy]
                                                                        const bValue = b[orderBy]
                                                                        if (order === 'desc') {
                                                                            return bValue > aValue ? 1 : -1
                                                                        }
                                                                        return aValue > bValue ? 1 : -1
                                                                    })
                                                                    .map((chatflow) => (
                                                                        <TableRow
                                                                            key={chatflow.id}
                                                                            hover
                                                                            onClick={() => handleRowClick(chatflow)}
                                                                            sx={{
                                                                                cursor: 'pointer',
                                                                                '&:hover': {
                                                                                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                                                                }
                                                                            }}
                                                                        >
                                                                            <TableCell>
                                                                                <Stack direction='row' alignItems='center' spacing={1}>
                                                                                    <IconRobot
                                                                                        size={20}
                                                                                        color={theme.palette.primary.main}
                                                                                    />
                                                                                    <Box>
                                                                                        <Typography
                                                                                            variant='body1'
                                                                                            sx={{ fontWeight: 600 }}
                                                                                        >
                                                                                            {chatflow.name}
                                                                                        </Typography>
                                                                                        <Typography
                                                                                            variant='caption'
                                                                                            color='text.secondary'
                                                                                        >
                                                                                            ID: {chatflow.id}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Stack>
                                                                            </TableCell>

                                                                            <TableCell>
                                                                                <Typography variant='body2'>
                                                                                    {moment(chatflow.createdDate).format(
                                                                                        'MMM DD, YYYY HH:mm'
                                                                                    )}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Typography variant='body2'>
                                                                                    {moment(chatflow.updatedDate).format(
                                                                                        'MMM DD, YYYY HH:mm'
                                                                                    )}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Stack direction='row' spacing={1}>
                                                                                    <Tooltip title='Open in Canvas'>
                                                                                        <IconButton
                                                                                            size='small'
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation()
                                                                                                handleRowClick(chatflow)
                                                                                            }}
                                                                                            sx={{
                                                                                                color: theme.palette.primary.main,
                                                                                                '&:hover': {
                                                                                                    backgroundColor: alpha(
                                                                                                        theme.palette.primary.main,
                                                                                                        0.1
                                                                                                    )
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <IconCode size={20} />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                    <Tooltip title='Embed in website or use as API'>
                                                                                        <IconButton
                                                                                            size='small'
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation()
                                                                                                handleAPIDialogClick(chatflow)
                                                                                            }}
                                                                                            sx={{
                                                                                                color: theme.palette.secondary.main,
                                                                                                '&:hover': {
                                                                                                    backgroundColor: alpha(
                                                                                                        theme.palette.secondary.main,
                                                                                                        0.1
                                                                                                    )
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <IconApi size={18} />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                    <Tooltip title='Delete Document Chatflow'>
                                                                                        <IconButton
                                                                                            size='small'
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation()
                                                                                                handleDeleteClick(chatflow)
                                                                                            }}
                                                                                            sx={{
                                                                                                color: theme.palette.error.main,
                                                                                                '&:hover': {
                                                                                                    backgroundColor: alpha(
                                                                                                        theme.palette.error.main,
                                                                                                        0.1
                                                                                                    )
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <IconTrash size={16} />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                </Stack>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </Paper>
                                            </Fade>
                                        ) : (
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: { xs: 4, sm: 6, md: 8 },
                                                    textAlign: 'center',
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                                    borderRadius: 3,
                                                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    minWidth: { xs: '100%', sm: 'auto' },
                                                    width: '100%'
                                                }}
                                            >
                                                <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                                                    <IconMessages
                                                        size={80}
                                                        color={theme.palette.primary.main}
                                                        style={{
                                                            opacity: 0.6,
                                                            width: '100%',
                                                            maxWidth: '80px',
                                                            height: 'auto'
                                                        }}
                                                    />
                                                </Box>

                                                <Typography
                                                    variant='h4'
                                                    gutterBottom
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: theme.palette.primary.main,
                                                        mb: 2,
                                                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                                                    }}
                                                >
                                                    No Knowledge Base Chatflows Yet
                                                </Typography>

                                                <Typography
                                                    variant='body1'
                                                    color='text.secondary'
                                                    sx={{
                                                        mb: { xs: 3, sm: 4 },
                                                        maxWidth: { xs: '100%', sm: 480 },
                                                        mx: 'auto',
                                                        lineHeight: 1.6,
                                                        fontSize: { xs: '1rem', sm: '1.1rem' },
                                                        px: { xs: 2, sm: 0 }
                                                    }}
                                                >
                                                    Create your first document chatflow by scraping web content above
                                                </Typography>

                                                <StyledButton
                                                    variant='contained'
                                                    onClick={() => setSelectedTab(0)}
                                                    startIcon={<IconWorld size={20} />}
                                                    sx={{
                                                        borderRadius: 2,
                                                        px: { xs: 3, sm: 4 },
                                                        py: { xs: 1.25, sm: 1.5 },
                                                        fontSize: { xs: '0.9rem', sm: '0.95rem' },
                                                        fontWeight: 600,
                                                        textTransform: 'none',
                                                        backgroundColor: theme.palette.primary.main,
                                                        boxShadow: 'none',
                                                        minWidth: { xs: '200px', sm: 'auto' },
                                                        width: { xs: '100%', sm: 'auto' },
                                                        '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            backgroundColor: theme.palette.primary.dark,
                                                            boxShadow: 'none'
                                                        },
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }}
                                                >
                                                    Start Scraping Links
                                                </StyledButton>
                                            </Paper>
                                        )}
                                    </>
                                )}
                            </Stack>
                        </Paper>
                    )}

                    {/* Document Chatflow Result Dialog */}
                    <Dialog open={showBotDialog} onClose={() => setShowBotDialog(false)} maxWidth='md' fullWidth>
                        <DialogTitle>
                            <Stack direction='row' spacing={2} alignItems='center'>
                                <IconRobot size={24} color={theme.palette.success.main} />
                                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                    Document Chatflow Created! 📄🤖
                                </Typography>
                            </Stack>
                        </DialogTitle>
                        <DialogContent>
                            <Stack spacing={3}>
                                <Alert severity='success' sx={{ mb: 2 }}>
                                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                        Your document-based chatflow has been successfully created!
                                    </Typography>
                                    <Typography variant='body2' sx={{ mt: 1 }}>
                                        Chatflow ID: <strong>{botId}</strong>
                                    </Typography>
                                </Alert>

                                <Divider />

                                <Box>
                                    <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                        <IconCode size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                        Embed Code
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                        Copy and paste this code into any HTML file to embed your document chatflow:
                                    </Typography>

                                    <Box
                                        sx={{
                                            position: 'relative',
                                            border: `1px solid ${theme.palette.grey[300]}`,
                                            borderRadius: 2,
                                            p: 2,
                                            bgcolor: theme.palette.grey[50]
                                        }}
                                    >
                                        <TextField
                                            multiline
                                            rows={6}
                                            value={embedCode}
                                            variant='outlined'
                                            fullWidth
                                            InputProps={{
                                                readOnly: true,
                                                sx: {
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.875rem'
                                                }
                                            }}
                                        />
                                        <Button
                                            variant='contained'
                                            onClick={handleCopyCode}
                                            startIcon={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                minWidth: 'auto',
                                                px: 2,
                                                py: 0.5,
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {copied ? 'Copied!' : 'Copy'}
                                        </Button>
                                    </Box>
                                </Box>

                                <Alert severity='info'>
                                    <Typography variant='body2'>
                                        <strong>How to use:</strong>
                                    </Typography>
                                    <Typography variant='body2' sx={{ mt: 1 }}>
                                        1. Copy the embed code above
                                    </Typography>
                                    <Typography variant='body2'>2. Paste it into the &lt;body&gt; tag of any HTML file</Typography>
                                    <Typography variant='body2'>3. Open the HTML file in a browser</Typography>
                                    <Typography variant='body2'>4. Start chatting with your document-based bot!</Typography>
                                </Alert>

                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: theme.palette.info[50],
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.info[200]}`
                                    }}
                                >
                                    <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
                                        Chatflow Template:
                                    </Typography>
                                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                        <Chip label='document_sample Template' size='small' color='primary' />
                                        <Chip label='Updated URL Only' size='small' color='secondary' />
                                    </Stack>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowBotDialog(false)}>Close</Button>
                        </DialogActions>
                    </Dialog>
                </Stack>
            </MainCard>
            {apiDialogOpen && <APICodeDialog show={apiDialogOpen} dialogProps={apiDialogProps} onCancel={() => setApiDialogOpen(false)} />}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} maxWidth='sm' fullWidth>
                <DialogTitle>
                    <Stack direction='row' spacing={2} alignItems='center'>
                        <IconTrash size={24} color={theme.palette.error.main} />
                        <Typography variant='h6' sx={{ fontWeight: 600 }}>
                            Delete Document Chatflow
                        </Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography variant='body1' sx={{ mb: 2 }}>
                        Are you sure you want to delete the document chatflow &quot;{chatflowToDelete?.name}&quot;?
                    </Typography>
                    <Alert severity='warning' sx={{ mb: 2 }}>
                        <Typography variant='body2'>
                            <strong>Warning:</strong> This action cannot be undone. The chatflow and all its associated data will be
                            permanently deleted.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color='inherit'>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} variant='contained' color='error' startIcon={<IconTrash size={16} />}>
                        Delete Chatflow
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}

export default KnowledgeBaseScrapLinks
