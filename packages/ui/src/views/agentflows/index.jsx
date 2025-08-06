import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// material-ui
import { Box, Stack, Typography, TextField, InputAdornment, Fade, Skeleton, Container, Paper, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import AgentsEmptySVG from '@/assets/images/agents_empty.svg'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import { FlowListTable } from '@/ui-component/table/FlowListTable'
import ErrorBoundary from '@/ErrorBoundary'
import { StyledPermissionButton } from '@/ui-component/button/RBACButtons'

// API
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL, AGENTFLOW_ICONS } from '@/store/constant'
import { useError } from '@/store/context/ErrorContext'

// icons
import { IconPlus, IconSearch, IconRobot, IconNetwork } from '@tabler/icons-react'

// ==============================|| AGENTS ||============================== //

const Agentflows = () => {
    const navigate = useNavigate()
    const theme = useTheme()

    const [isLoading, setLoading] = useState(true)
    const [images, setImages] = useState({})
    const [icons, setIcons] = useState({})
    const [search, setSearch] = useState('')
    const { error, setError } = useError()

    const getAllAgentflows = useApi(chatflowsApi.getAllAgentflows)

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    function filterFlows(data) {
        return (
            data.name.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
            (data.category && data.category.toLowerCase().indexOf(search.toLowerCase()) > -1) ||
            data.id.toLowerCase().indexOf(search.toLowerCase()) > -1
        )
    }

    const addNew = () => {
        navigate('/agentcanvas')
    }

    const _goToCanvas = (selectedAgentflow) => {
        navigate(`/agentcanvas/${selectedAgentflow.id}`)
    }

    useEffect(() => {
        getAllAgentflows.request('AGENTFLOW')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllAgentflows.error) {
            setError(getAllAgentflows.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllAgentflows.error])

    useEffect(() => {
        setLoading(getAllAgentflows.loading)
    }, [getAllAgentflows.loading])

    useEffect(() => {
        if (getAllAgentflows.data) {
            try {
                const agentflows = getAllAgentflows.data
                const images = {}
                const icons = {}
                for (let i = 0; i < agentflows.length; i += 1) {
                    const flowDataStr = agentflows[i].flowData
                    const flowData = JSON.parse(flowDataStr)
                    const nodes = flowData.nodes || []
                    images[agentflows[i].id] = []
                    icons[agentflows[i].id] = []
                    for (let j = 0; j < nodes.length; j += 1) {
                        if (nodes[j].data.name === 'stickyNote' || nodes[j].data.name === 'stickyNoteAgentflow') continue
                        const foundIcon = AGENTFLOW_ICONS.find((icon) => icon.name === nodes[j].data.name)
                        if (foundIcon) {
                            icons[agentflows[i].id].push(foundIcon)
                        } else {
                            const imageSrc = `${baseURL}/api/v1/node-icon/${nodes[j].data.name}`
                            if (!images[agentflows[i].id].some((img) => img.imageSrc === imageSrc)) {
                                images[agentflows[i].id].push({
                                    imageSrc,
                                    label: nodes[j].data.label
                                })
                            }
                        }
                    }
                }
                setImages(images)
                setIcons(icons)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllAgentflows.data])

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
                        src={AgentsEmptySVG}
                        alt='No Agents'
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
                    Ready to orchestrate intelligent agents?
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
                    Create your first agent workflow and build sophisticated multi-agent systems
                </Typography>

                <StyledPermissionButton
                    permissionId={'agentflows:create'}
                    variant='contained'
                    onClick={addNew}
                    startIcon={<IconNetwork size={20} />}
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
                    Create Your First Agent
                </StyledPermissionButton>
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
                                        <IconRobot size={28} color={theme.palette.primary.main} />
                                        <Typography
                                            variant='h3'
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Agent Mesh
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
                                        Multi-agent systems, workflow orchestration
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
                                        placeholder='Search name, category, or ID...'
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
                                        {/* Version Toggle */}
                                        <StyledPermissionButton
                                            permissionId={'agentflows:create'}
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
                                            Add New Agent
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
                                {getAllAgentflows.data && getAllAgentflows.data.length > 0 ? (
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
                                            <FlowListTable
                                                isAgentCanvas={true}
                                                isAgentflowV2={true}
                                                data={getAllAgentflows.data}
                                                images={images}
                                                icons={icons}
                                                isLoading={isLoading}
                                                filterFunction={filterFlows}
                                                updateFlowsApi={getAllAgentflows}
                                                setError={setError}
                                            />
                                        </Paper>
                                    </Fade>
                                ) : (
                                    <EmptyState />
                                )}
                            </>
                        )}
                    </Stack>
                )}
                <ConfirmDialog />
            </MainCard>
        </Container>
    )
}

export default Agentflows
