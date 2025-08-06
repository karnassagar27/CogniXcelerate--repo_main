import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

// material-ui
import { Box, Paper, Stack, Typography, Container, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import ManageScrapedLinksDialog from '@/ui-component/dialog/ManageScrapedLinksDialog'

// API

// utils
import useNotifier from '@/utils/useNotifier'

// icons
import { IconDatabase, IconLink } from '@tabler/icons-react'

// store
import {
    HIDE_CANVAS_DIALOG,
    SHOW_CANVAS_DIALOG,
    enqueueSnackbar as enqueueSnackbarAction,
    closeSnackbar as closeSnackbarAction
} from '@/store/actions'

// ==============================|| AI STUDIO KNOWLEDGE BASE ||============================== //

const AIStudioKnowledgeBase = () => {
    const theme = useTheme()
    const dispatch = useDispatch()

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [showScrapLinksDialog, setShowScrapLinksDialog] = useState(false)
    const [scrapLinksDialogProps, setScrapLinksDialogProps] = useState({})

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

    return (
        <Container maxWidth='xl' sx={{ py: 3 }}>
            <MainCard
                sx={{
                    border: 'none',
                    boxShadow: 'none',
                    backgroundColor: 'transparent'
                }}
            >
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
                                        Knowledge Base-Scrap Links
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
                                    Scrape and manage web content for your AI Studio projects
                                </Typography>
                            </Box>

                            {/* Controls */}
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={3}
                                alignItems={{ xs: 'stretch', sm: 'center' }}
                                justifyContent='center'
                            >
                                <StyledPermissionButton
                                    variant='contained'
                                    onClick={onScrapLinksClick}
                                    startIcon={<IconLink size={18} />}
                                    sx={{
                                        borderRadius: 2,
                                        px: 4,
                                        py: 1.5,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        backgroundColor: theme.palette.primary.main,
                                        boxShadow: 'none',
                                        minWidth: 'auto',
                                        height: 48,
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
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Content Placeholder */}
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
                        <Typography
                            variant='h4'
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.primary.main,
                                mb: 2
                            }}
                        >
                            Ready to scrape web content?
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
                            Use the Scrap Links button above to extract and manage web content for your AI Studio projects. This will help
                            you build comprehensive knowledge bases for your AI applications.
                        </Typography>
                    </Paper>
                </Stack>

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

export default AIStudioKnowledgeBase
