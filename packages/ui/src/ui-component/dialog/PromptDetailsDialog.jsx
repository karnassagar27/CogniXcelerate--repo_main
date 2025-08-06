import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import axios from 'axios'

// MUI
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Chip,
    Stack,
    CircularProgress,
    useTheme
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Project imports
import { HIDE_CANVAS_DIALOG, SHOW_CANVAS_DIALOG } from '@/store/actions'

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary
    }
}))

const StyledCard = styled(Card)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
        borderColor: theme.palette.primary.main
    }
}))

const CodeBlock = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    '& pre': {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        lineHeight: 1.5,
        margin: 0,
        color: theme.palette.text.primary
    }
}))

const PromptDetailsDialog = ({ show, onCancel, promptName }) => {
    const portalElement = document.getElementById('portal')
    const dispatch = useDispatch()
    const customization = useSelector((state) => state.customization)
    const theme = useTheme()

    const [promptDetails, setPromptDetails] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (show) {
            dispatch({ type: SHOW_CANVAS_DIALOG })
        } else dispatch({ type: HIDE_CANVAS_DIALOG })
        return () => dispatch({ type: HIDE_CANVAS_DIALOG })
    }, [show, dispatch])

    useEffect(() => {
        if (show && promptName) {
            fetchPromptDetails()
        }
    }, [show, promptName])

    const fetchPromptDetails = async () => {
        setLoading(true)
        setError(null)
        console.log('Fetching prompt details for:', promptName)

        try {
            // Try direct request first
            const response = await axios.get(`http://10.10.20.156:3000/api/public/v2/prompts/${promptName}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:
                        'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                }
            })

            console.log('API Response:', response.data)
            setPromptDetails(response.data)
        } catch (error) {
            console.error('Error fetching prompt details:', error)
            console.error('Error response:', error.response?.data)
            console.error('Error status:', error.response?.status)

            // Fallback to mock data for testing
            console.log('Using fallback mock data for testing...')
            const mockData = {
                id: '426a5eb5-b44a-41bf-8014-e1418116c50a',
                createdAt: '2025-07-25T04:40:23.058Z',
                updatedAt: '2025-07-28T04:49:55.438Z',
                projectId: 'cmd4e0tes0005p607u2bq1vr5',
                createdBy: 'cmd4dhx2q000jqp07gn7rdzhn',
                prompt: 'You are a professional AI writing assistant. \nAlways write in a clear, formal tone.\nUse bullet points when listing information.\nAvoid using emojis or slang.\nKeep responses concise unless the user explicitly asks for more detail.\n',
                name: promptName,
                version: 1,
                type: 'text',
                isActive: null,
                config: {},
                tags: [],
                labels: ['latest', 'production'],
                commitMessage: null,
                resolutionGraph: null
            }

            setPromptDetails(mockData)
            setError(`API Error: ${error.message}. Using mock data for demonstration.`)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleString()
    }

    const component = show ? (
        <StyledDialog
            onClose={onCancel}
            open={show}
            fullWidth
            maxWidth={'md'}
            aria-labelledby='prompt-details-dialog-title'
            aria-describedby='prompt-details-dialog-description'
        >
            <DialogTitle
                sx={{
                    fontSize: '1rem',
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.background.paper
                }}
                id='prompt-details-dialog-title'
            >
                Prompt Details: {promptName}
            </DialogTitle>
            <DialogContent
                dividers
                sx={{
                    p: 2,
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color='error' gutterBottom>
                            {error}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Please check the browser console for more details.
                        </Typography>
                    </Box>
                ) : promptDetails ? (
                    <Stack spacing={3}>
                        {/* Basic Information */}
                        <StyledCard>
                            <CardContent>
                                <Typography variant='h6' gutterBottom sx={{ color: theme.palette.text.primary }}>
                                    Basic Information
                                </Typography>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            ID
                                        </Typography>
                                        <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
                                            {promptDetails.id}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            Name
                                        </Typography>
                                        <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
                                            {promptDetails.name}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            Version
                                        </Typography>
                                        <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
                                            {promptDetails.version}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            Type
                                        </Typography>
                                        <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
                                            {promptDetails.type}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </StyledCard>

                        {/* Timestamps */}
                        <StyledCard>
                            <CardContent>
                                <Typography variant='h6' gutterBottom sx={{ color: theme.palette.text.primary }}>
                                    Timestamps
                                </Typography>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            Created At
                                        </Typography>
                                        <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
                                            {formatDate(promptDetails.createdAt)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            Updated At
                                        </Typography>
                                        <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
                                            {formatDate(promptDetails.updatedAt)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </StyledCard>

                        {/* Labels and Tags */}
                        <StyledCard>
                            <CardContent>
                                <Typography variant='h6' gutterBottom sx={{ color: theme.palette.text.primary }}>
                                    Labels & Tags
                                </Typography>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                            Labels
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {promptDetails.labels && promptDetails.labels.length > 0 ? (
                                                promptDetails.labels.map((label, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={label}
                                                        size='small'
                                                        color='primary'
                                                        sx={{
                                                            backgroundColor: theme.palette.primary.main,
                                                            color: theme.palette.primary.contrastText
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant='body2' color='text.secondary'>
                                                    No labels
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                            Tags
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {promptDetails.tags && promptDetails.tags.length > 0 ? (
                                                promptDetails.tags.map((tag, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={tag}
                                                        size='small'
                                                        variant='outlined'
                                                        sx={{
                                                            borderColor: theme.palette.divider,
                                                            color: theme.palette.text.primary
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant='body2' color='text.secondary'>
                                                    No tags
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </StyledCard>

                        {/* Prompt Content */}
                        <StyledCard>
                            <CardContent>
                                <Typography variant='h6' gutterBottom sx={{ color: theme.palette.text.primary }}>
                                    Prompt Content
                                </Typography>
                                <CodeBlock>
                                    <pre>{promptDetails.prompt}</pre>
                                </CodeBlock>
                            </CardContent>
                        </StyledCard>

                        {/* Configuration */}
                        {promptDetails.config && Object.keys(promptDetails.config).length > 0 && (
                            <StyledCard>
                                <CardContent>
                                    <Typography variant='h6' gutterBottom sx={{ color: theme.palette.text.primary }}>
                                        Configuration
                                    </Typography>
                                    <CodeBlock>
                                        <pre>{JSON.stringify(promptDetails.config, null, 2)}</pre>
                                    </CodeBlock>
                                </CardContent>
                            </StyledCard>
                        )}
                    </Stack>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color='text.secondary'>No data available</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ backgroundColor: theme.palette.background.paper }}>
                <Button
                    onClick={onCancel}
                    sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover
                        }
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </StyledDialog>
    ) : null

    return createPortal(component, portalElement)
}

PromptDetailsDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func,
    promptName: PropTypes.string
}

export default PromptDetailsDialog
