import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// material-ui
import { styled } from '@mui/material/styles'
import {
    Box,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Alert,
    CircularProgress,
    useTheme
} from '@mui/material'

// Project imports
import MainCard from '@/ui-component/cards/MainCard'
import { IconArrowLeft } from '@tabler/icons-react'

// Styled components
const StyledForm = styled('form')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3)
}))

const FieldGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1)
}))

const HelpText = styled(Typography)(({ theme }) => ({
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5)
}))

const RequiredMark = styled('span')(({ theme }) => ({
    color: theme.palette.error.main,
    marginLeft: theme.spacing(0.5)
}))

const NewPrompt = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const [name, setName] = useState('')
    const [prompt, setPrompt] = useState('')
    const [type, setType] = useState('text')
    const [labels, setLabels] = useState('production')
    const [response, setResponse] = useState(null)
    const [error, setError] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const BASE_URL = 'http://10.10.20.156:3000'
    const API_ENDPOINT = `${BASE_URL}/api/public/v2/prompts`

    const headers = {
        Authorization:
            'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ==',
        'Content-Type': 'application/json'
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setResponse(null)
        setIsSubmitting(true)

        const payload = {
            name,
            prompt,
            type,
            labels: labels
                .split(',')
                .map((label) => label.trim())
                .filter((label) => label),
            config: {},
            isActive: true
        }

        try {
            const res = await axios.post(API_ENDPOINT, payload, { headers })
            setResponse(res.data)
        } catch (err) {
            setError(err.response?.data || 'Unknown error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleBack = () => {
        navigate('/prompt-management')
    }

    return (
        <MainCard title='Create New Prompt'>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button startIcon={<IconArrowLeft />} onClick={handleBack} sx={{ color: theme.palette.text.secondary }}>
                    Back to Prompt Management
                </Button>
            </Box>

            <StyledForm onSubmit={handleSubmit}>
                <FieldGroup>
                    <Typography variant='subtitle1' sx={{ color: theme.palette.text.primary }}>
                        Prompt Name <RequiredMark>*</RequiredMark>
                    </Typography>
                    <TextField
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='Enter a descriptive name for your prompt'
                        required
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: theme.palette.background.paper,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                }
                            }
                        }}
                    />
                    <HelpText>Choose a clear, descriptive name for easy identification</HelpText>
                </FieldGroup>

                <FieldGroup>
                    <Typography variant='subtitle1' sx={{ color: theme.palette.text.primary }}>
                        Prompt Content <RequiredMark>*</RequiredMark>
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder='Enter your prompt content here...'
                        required
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: theme.palette.background.paper,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                }
                            }
                        }}
                    />
                    <HelpText>Write the actual prompt text that will be used</HelpText>
                </FieldGroup>

                <FieldGroup>
                    <Typography variant='subtitle1' sx={{ color: theme.palette.text.primary }}>
                        Prompt Type
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>Select prompt type</InputLabel>
                        <Select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            label='Select prompt type'
                            sx={{
                                backgroundColor: theme.palette.background.paper,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.divider
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                }
                            }}
                        >
                            <MenuItem value='text'>Text Prompt</MenuItem>
                            <MenuItem value='chat'>Chat Prompt</MenuItem>
                        </Select>
                    </FormControl>
                    <HelpText>Select the type of prompt you&apos;re creating</HelpText>
                </FieldGroup>

                <FieldGroup>
                    <Typography variant='subtitle1' sx={{ color: theme.palette.text.primary }}>
                        Labels
                    </Typography>
                    <TextField
                        fullWidth
                        value={labels}
                        onChange={(e) => setLabels(e.target.value)}
                        placeholder='e.g., email, marketing, customer-service'
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: theme.palette.background.paper,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                }
                            }
                        }}
                    />
                    <HelpText>Add comma-separated labels for better organization</HelpText>
                </FieldGroup>

                <Button
                    type='submit'
                    variant='contained'
                    disabled={isSubmitting}
                    sx={{
                        mt: 2,
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                            backgroundColor: theme.palette.primary.dark
                        },
                        '&:disabled': {
                            backgroundColor: theme.palette.action.disabledBackground,
                            color: theme.palette.action.disabled
                        }
                    }}
                >
                    {isSubmitting ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} color='inherit' />
                            Creating...
                        </Box>
                    ) : (
                        'Create Prompt'
                    )}
                </Button>
            </StyledForm>

            {response && (
                <Alert severity='success' sx={{ mt: 3 }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>
                        ✅ Success!
                    </Typography>
                    <Box
                        component='pre'
                        sx={{
                            margin: 0,
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            color: theme.palette.text.primary,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            backgroundColor: theme.palette.background.paper,
                            p: 2,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`
                        }}
                    >
                        {JSON.stringify(response, null, 2)}
                    </Box>
                </Alert>
            )}

            {error && (
                <Alert severity='error' sx={{ mt: 3 }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>
                        ❌ Error
                    </Typography>
                    <Box
                        component='pre'
                        sx={{
                            margin: 0,
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            color: theme.palette.text.primary,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            backgroundColor: theme.palette.background.paper,
                            p: 2,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`
                        }}
                    >
                        {JSON.stringify(error, null, 2)}
                    </Box>
                </Alert>
            )}
        </MainCard>
    )
}

export default NewPrompt
