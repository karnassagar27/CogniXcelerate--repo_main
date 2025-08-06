import { useEffect, useState, useRef } from 'react'

// material-ui
import { Box, Stack, Typography, TextField, InputAdornment, Fade, Skeleton, Container, Paper, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ToolDialog from './ToolDialog'
import ErrorBoundary from '@/ErrorBoundary'
import { ToolsTable } from '@/ui-component/table/ToolsListTable'
import { PermissionButton, StyledPermissionButton } from '@/ui-component/button/RBACButtons'

// API
import toolsApi from '@/api/tools'

// Hooks
import useApi from '@/hooks/useApi'
import { useError } from '@/store/context/ErrorContext'

// icons
import { IconPlus, IconFileUpload, IconSearch, IconTool } from '@tabler/icons-react'
import ToolEmptySVG from '@/assets/images/tools_empty.svg'

// ==============================|| TOOLS ||============================== //

const Tools = () => {
    const theme = useTheme()
    const getAllToolsApi = useApi(toolsApi.getAllTools)
    const { error, setError } = useError()

    const [isLoading, setLoading] = useState(true)
    const [showDialog, setShowDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [search, setSearch] = useState('')

    const inputRef = useRef(null)

    const onUploadFile = (file) => {
        try {
            const dialogProp = {
                title: 'Add New Tool',
                type: 'IMPORT',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Save',
                data: JSON.parse(file)
            }
            setDialogProps(dialogProp)
            setShowDialog(true)
        } catch (e) {
            console.error(e)
        }
    }

    const handleFileUpload = (e) => {
        if (!e.target.files) return

        const file = e.target.files[0]

        const reader = new FileReader()
        reader.onload = (evt) => {
            if (!evt?.target?.result) {
                return
            }
            const { result } = evt.target
            onUploadFile(result)
        }
        reader.readAsText(file)
    }

    const addNew = () => {
        const dialogProp = {
            title: 'Add New Tool',
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add'
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const edit = (selectedTool) => {
        const dialogProp = {
            title: 'Edit Tool',
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            data: selectedTool
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const onConfirm = () => {
        setShowDialog(false)
        getAllToolsApi.request()
    }

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    function filterTools(data) {
        if (!search) return true
        return (
            data.name.toLowerCase().includes(search.toLowerCase()) ||
            (data.description && data.description.toLowerCase().includes(search.toLowerCase()))
        )
    }

    // Get filtered data
    const filteredData = getAllToolsApi.data ? getAllToolsApi.data.filter(filterTools) : []

    useEffect(() => {
        getAllToolsApi.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllToolsApi.error) {
            setError(getAllToolsApi.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAllToolsApi.error])

    useEffect(() => {
        setLoading(getAllToolsApi.loading)
    }, [getAllToolsApi.loading])

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
                        src={ToolEmptySVG}
                        alt='No Tools'
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
                    {search ? 'No tools found' : 'Ready to build your toolkit?'}
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
                        ? `No tools match your search "${search}". Try adjusting your search terms.`
                        : 'Create your first tool and empower your agents with external functions and APIs'}
                </Typography>

                {!search && (
                    <StyledPermissionButton
                        permissionId={'tools:create'}
                        variant='contained'
                        onClick={addNew}
                        startIcon={<IconTool size={20} />}
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
                        Create Your First Tool
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
                                        <IconTool size={28} color={theme.palette.primary.main} />
                                        <Typography
                                            variant='h3'
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Tool Kit
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
                                        External functions or APIs the agent can use to take action
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
                                        placeholder='Search tools by name or description...'
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

                                    {/* Action Buttons */}
                                    <Stack direction='row' spacing={1.5} alignItems='center'>
                                        <PermissionButton
                                            permissionId={'tools:create'}
                                            variant='outlined'
                                            onClick={() => inputRef.current.click()}
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
                                            Load Tool
                                        </PermissionButton>
                                        <input
                                            style={{ display: 'none' }}
                                            ref={inputRef}
                                            type='file'
                                            hidden
                                            accept='.json'
                                            onChange={(e) => handleFileUpload(e)}
                                        />

                                        <StyledPermissionButton
                                            permissionId={'tools:create'}
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
                                            Create Tool
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
                                            <ToolsTable data={filteredData} isLoading={isLoading} onSelect={edit} />
                                        </Paper>
                                    </Fade>
                                ) : (
                                    <EmptyState />
                                )}
                            </>
                        )}
                    </Stack>
                )}
            </MainCard>

            <ToolDialog
                show={showDialog}
                dialogProps={dialogProps}
                onCancel={() => setShowDialog(false)}
                onConfirm={onConfirm}
                setError={setError}
            />
        </Container>
    )
}

export default Tools
