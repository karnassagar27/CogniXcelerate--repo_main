import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import axios from 'axios'

// material-ui
import { styled } from '@mui/material/styles'
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    IconButton,
    useTheme,
    Pagination,
    Stack,
    Fade,
    Skeleton,
    Container,
    alpha
} from '@mui/material'
import { tableCellClasses } from '@mui/material/TableCell'

// Project imports
import PromptDetailsDialog from '@/ui-component/dialog/PromptDetailsDialog'
import MainCard from '@/ui-component/cards/MainCard'
import { IconTrash, IconPlus, IconCrown, IconCrownOff, IconMessage } from '@tabler/icons-react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

// store
import { enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'

// Enhanced styled components matching the chatflows styling
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
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

const PromptBadge = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'inline-block',
    '&:hover': {
        backgroundColor: theme.palette.primary.dark
    }
}))

const LabelChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[700],
    fontSize: '0.75rem',
    height: '20px'
}))

const PromptManagement = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const dispatch = useDispatch()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const [prompts, setPrompts] = useState([])
    const [meta, setMeta] = useState({ totalPages: 1 })
    const [page, setPage] = useState(1)
    const limit = 10
    const [showDetailsDialog, setShowDetailsDialog] = useState(false)
    const [selectedPromptName, setSelectedPromptName] = useState('')
    const [expandedPrompts, setExpandedPrompts] = useState(new Set())
    const [promptVersions, setPromptVersions] = useState({})

    const fetchPrompts = async (pageToFetch = page) => {
        try {
            const response = await axios.get(`http://10.10.20.156:3000/api/public/v2/prompts?page=${pageToFetch}&limit=${limit}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:
                        'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                }
            })

            // Filter out prompts that have "deleted" label
            const filteredPrompts = (response.data.data || []).filter((prompt) => {
                // Check if any version has "deleted" label
                const hasDeletedLabel =
                    prompt.labels?.includes('deleted') || prompt.versions?.some((version) => version.labels?.includes('deleted'))
                return !hasDeletedLabel
            })

            setPrompts(filteredPrompts)
            if (response.data.meta) setMeta(response.data.meta)
        } catch (error) {
            console.error('Error fetching prompts:', error)
        }
    }

    useEffect(() => {
        fetchPrompts(page)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    const handlePageChange = (event, value) => {
        setPage(value)
    }

    const handlePromptClick = (promptName) => {
        console.log('Prompt clicked:', promptName)
        setSelectedPromptName(promptName)
        setShowDetailsDialog(true)
    }

    const handleCloseDetailsDialog = () => {
        setShowDetailsDialog(false)
        setSelectedPromptName('')
    }

    const handleNewPrompt = () => {
        navigate('/new-prompt')
    }

    const handleVersionClick = async (prompt) => {
        try {
            console.log('Version button clicked for prompt:', prompt)

            // Check if we already have versions for this prompt
            if (promptVersions[prompt.name]) {
                // Toggle expansion
                const newExpanded = new Set(expandedPrompts)
                if (newExpanded.has(prompt.name)) {
                    newExpanded.delete(prompt.name)
                } else {
                    newExpanded.add(prompt.name)
                }
                setExpandedPrompts(newExpanded)
                return
            }

            // First, get the base prompt to find max version
            const allVersions = []

            try {
                const baseResponse = await axios.get(`http://10.10.20.156:3000/api/public/v2/prompts/${prompt.name}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization:
                            'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                    }
                })

                const baseData = baseResponse.data
                console.log('Base prompt data:', baseData)

                // Determine max version from the response
                let maxVersion = 1
                console.log('Base data versions:', prompt.versions)

                if (prompt.versions && Array.isArray(prompt.versions)) {
                    // Use the maximum value from the versions array
                    maxVersion = Math.max(...prompt.versions)
                    console.log('Using versions array max:', maxVersion)
                } else if (prompt.version) {
                    maxVersion = prompt.version
                    console.log('Using single version number:', maxVersion)
                } else if (prompt.versions && typeof prompt.versions === 'object') {
                    // If versions is an object with version numbers as keys
                    maxVersion = Math.max(...Object.keys(prompt.versions).map((v) => parseInt(v)))
                    console.log('Using versions object max:', maxVersion)
                }

                console.log('Final max version determined:', maxVersion)

                // Fetch all versions from 1 to maxVersion
                console.log(`Starting to fetch ${maxVersion} versions...`)
                for (let version of prompt.versions) {
                    try {
                        console.log(`Fetching version ${version} for prompt: ${prompt.name}`)

                        const versionResponse = await axios.get(
                            `http://10.10.20.156:3000/api/public/v2/prompts/${prompt.name}?version=${version}`,
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization:
                                        'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                                }
                            }
                        )

                        const versionData = versionResponse.data
                        console.log(`Version ${version} data:`, versionData)
                        console.log(`Successfully fetched version ${version}`)

                        // Add version number to the data
                        const versionWithNumber = {
                            ...versionData,
                            versionNumber: version
                        }

                        // Only add version if it doesn't have "deleted" label
                        if (!versionData.labels?.includes('deleted')) {
                            allVersions.push(versionWithNumber)
                            console.log(`Added version ${version} to allVersions array`)
                        } else {
                            console.log(`Skipping version ${version} - marked as deleted`)
                        }
                    } catch (versionError) {
                        console.log(`Version ${version} not found:`, versionError.response?.status)
                        console.log(`Version ${version} error details:`, versionError.response?.data)
                        // Continue to next version
                    }
                }

                console.log('Total versions found:', allVersions.length)
                console.log('All fetched versions:', allVersions)
            } catch (error) {
                console.error('Error fetching base prompt:', error)
                // Fallback to default version
                allVersions.push(prompt)
            }

            // Store versions for this prompt
            setPromptVersions((prev) => ({
                ...prev,
                [prompt.name]: allVersions
            }))

            // Expand the prompt
            setExpandedPrompts((prev) => new Set([...prev, prompt.name]))

            console.log('Total versions found:', allVersions.length)

            console.log('All fetched versions:', allVersions)

            // Store versions for this prompt
            setPromptVersions((prev) => ({
                ...prev,
                [prompt.name]: allVersions
            }))

            // Expand the prompt
            setExpandedPrompts((prev) => new Set([...prev, prompt.name]))
        } catch (error) {
            console.error('Error fetching prompt versions:', error)
            // Fallback to default version
            setPromptVersions((prev) => ({
                ...prev,
                [prompt.name]: [prompt]
            }))
            setExpandedPrompts((prev) => new Set([...prev, prompt.name]))
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleString()
    }

    const setVersionAsProduction = async (promptName, versionNumber) => {
        try {
            console.log(`Setting version ${versionNumber} as production for prompt: ${promptName}`)

            // Always fetch ALL versions from API to ensure we have complete data
            let allVersions = []
            try {
                console.log('Fetching ALL versions for production change...')
                const currentPrompt = prompts.find((p) => p.name === promptName)

                if (currentPrompt && currentPrompt.versions && Array.isArray(currentPrompt.versions)) {
                    console.log('Found versions array:', currentPrompt.versions)

                    // Fetch each version individually to ensure we have all versions
                    for (const versionNum of currentPrompt.versions) {
                        try {
                            console.log(`Fetching version ${versionNum}...`)
                            const versionResponse = await axios.get(
                                `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}?version=${versionNum}`,
                                {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization:
                                            'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                                    }
                                }
                            )

                            const versionData = versionResponse.data
                            allVersions.push({
                                ...versionData,
                                versionNumber: versionNum
                            })
                            console.log(`Fetched version ${versionNum}`)
                        } catch (versionError) {
                            console.log(`Version ${versionNum} not found, skipping...`)
                        }
                    }
                } else {
                    // Fallback for single version prompts
                    console.log('Single version prompt detected')
                    const response = await axios.get(`http://10.10.20.156:3000/api/public/v2/prompts/${promptName}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization:
                                'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                        }
                    })
                    allVersions = [
                        {
                            ...response.data,
                            versionNumber: response.data.version || 1
                        }
                    ]
                }

                console.log('All versions for production change:', allVersions)
            } catch (fetchError) {
                console.error('❌ Error fetching prompt versions:', fetchError)
                enqueueSnackbar('Error fetching prompt versions', { variant: 'error' })
                return
            }

            const targetVersion = allVersions.find((v) => v.versionNumber === versionNumber)

            if (!targetVersion) {
                console.error('❌ Target version not found')
                enqueueSnackbar('Version not found', { variant: 'error' })
                return
            }

            // Check if this version is already production
            if (targetVersion.labels?.includes('production')) {
                console.log('Version is already production')
                enqueueSnackbar('This version is already production', { variant: 'info' })
                return
            }

            console.log('Current labels:', targetVersion.labels)
            console.log('Target version:', targetVersion)

            // Check if we're moving from higher to lower version
            const currentProductionVersion = allVersions.find((v) => v.labels?.includes('production'))
            const isDowngrading = currentProductionVersion && targetVersion.versionNumber < currentProductionVersion.versionNumber

            if (isDowngrading) {
                console.log(
                    `Downgrading production from version ${currentProductionVersion.versionNumber} to version ${targetVersion.versionNumber}`
                )
                console.log(`This might cause API validation issues`)
            }

            // First, remove production label from all versions
            for (const version of allVersions) {
                if (version.labels?.includes('production')) {
                    // Skip removing production from higher versions during downgrade
                    if (isDowngrading && version.versionNumber > targetVersion.versionNumber) {
                        console.log(`Skipping removal of production from version ${version.versionNumber} during downgrade`)
                        continue
                    }

                    try {
                        console.log(`Removing production from version ${version.versionNumber}`)
                        const labelsWithoutProduction = version.labels?.filter((label) => label !== 'production') || []
                        console.log(`New labels for version ${version.versionNumber}:`, labelsWithoutProduction)

                        // Remove production label by setting labels without production
                        await axios.patch(
                            `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}/versions/${version.versionNumber}`,
                            {
                                newLabels: labelsWithoutProduction.length > 0 ? labelsWithoutProduction : ['']
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization:
                                        'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                                }
                            }
                        )
                        console.log(`Removed production label from version ${version.versionNumber}`)
                    } catch (error) {
                        console.log(
                            `Error removing production from version ${version.versionNumber}:`,
                            error.response?.data || error.message
                        )
                        // If removing production fails, continue anyway - the new version will become production
                        console.log(`Continuing to set new production version despite removal error`)
                    }
                }
            }

            // Add production label to the selected version
            const currentLabels = targetVersion.labels || []
            const newLabels = [...currentLabels.filter((label) => label !== 'production'), 'production']

            // Ensure we have valid labels (not empty array)
            if (newLabels.length === 0) {
                newLabels.push('production')
            }

            console.log(`Adding production to version ${versionNumber}`)
            console.log(`Current labels:`, currentLabels)
            console.log(`New labels:`, newLabels)

            // For downgrades, try setting production first, then remove from old version
            if (isDowngrading) {
                console.log(`Downgrade detected - setting new production first`)
            }

            // Use the working format - just production label
            const response = await axios.patch(
                `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}/versions/${versionNumber}`,
                {
                    newLabels: ['production']
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization:
                            'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                    }
                }
            )

            console.log('Production version updated successfully:', response.data)

            // Update local state immediately to show changes
            const updatedVersions =
                promptVersions[promptName]?.map((version) => ({
                    ...version,
                    labels:
                        version.versionNumber === versionNumber
                            ? [...(version.labels || []).filter((label) => label !== 'production'), 'production']
                            : (version.labels || []).filter((label) => label !== 'production')
                })) || []

            setPromptVersions((prev) => ({
                ...prev,
                [promptName]: updatedVersions
            }))

            // Update main prompt list to show production status
            setPrompts((prev) =>
                prev.map((prompt) =>
                    prompt.name === promptName
                        ? { ...prompt, isProduction: true, productionVersion: versionNumber }
                        : { ...prompt, isProduction: false, productionVersion: null }
                )
            )

            // Show success message
            enqueueSnackbar('Production version updated successfully', { variant: 'success' })
        } catch (error) {
            console.error(' Error setting production version:', error)
            console.error('error response:', error.response?.data)
            console.error('Error status:', error.response?.status)
            console.error('Error details:', error.response?.data?.error)
            enqueueSnackbar(`Failed to update production version: ${error.response?.data?.message || error.message}`, { variant: 'error' })
        }
    }

    const deletePrompt = async (promptName) => {
        try {
            console.log(`Deleting prompt: ${promptName}`)

            // Get all versions for this prompt
            let allVersions = promptVersions[promptName] || []

            // Always fetch ALL versions from API to ensure we have complete data
            try {
                console.log('Fetching ALL versions for prompt:', promptName)
                const currentPrompt = prompts.find((p) => p.name === promptName)

                if (currentPrompt && currentPrompt.versions && Array.isArray(currentPrompt.versions)) {
                    console.log('Found versions array:', currentPrompt.versions)
                    allVersions = []

                    // Fetch each version individually to ensure we have all versions
                    for (const versionNumber of currentPrompt.versions) {
                        try {
                            console.log(`Fetching version ${versionNumber}...`)
                            const versionResponse = await axios.get(
                                `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}?version=${versionNumber}`,
                                {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization:
                                            'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                                    }
                                }
                            )

                            const versionData = versionResponse.data
                            allVersions.push({
                                ...versionData,
                                versionNumber: versionNumber
                            })
                            console.log(`Fetched version ${versionNumber}`)
                        } catch (versionError) {
                            console.log(`Version ${versionNumber} not found, skipping...`)
                        }
                    }

                    console.log(`Total versions fetched: ${allVersions.length}`)
                } else {
                    // Fallback for single version prompts
                    console.log('Single version prompt detected')
                    const response = await axios.get(`http://10.10.20.156:3000/api/public/v2/prompts/${promptName}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization:
                                'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                        }
                    })
                    allVersions = [
                        {
                            ...response.data,
                            versionNumber: response.data.version || 1
                        }
                    ]
                }

                console.log('All versions to be deleted:', allVersions)
            } catch (fetchError) {
                console.error('Error fetching prompt versions:', fetchError)
                enqueueSnackbar('Error fetching prompt versions', { variant: 'error' })
                return
            }

            if (allVersions.length === 0) {
                console.error(' No versions found for prompt')
                enqueueSnackbar('No versions found for this prompt', { variant: 'error' })
                return
            }

            // Use for loop to update ALL versions with "deleted" label (not just production versions)
            console.log(`Starting to mark ALL ${allVersions.length} versions as deleted`)

            let successCount = 0
            let errorCount = 0

            for (const version of allVersions) {
                ////onsole.log('allVersions', allVersions)
                try {
                    console.log(`Marking version ${version.versionNumber} as deleted`)
                    console.log(`Current labels for version ${version.versionNumber}:`, version.labels)

                    // Use the PATCH URL to update labels - mark ALL versions as deleted
                    console.log(`Sending PATCH request for version ${version.versionNumber} with newLabels: ['deleted']`)

                    // Try different approaches to see which one works
                    const requestBody = {
                        newLabels: ['deleted']
                    }

                    console.log(`Request body:`, requestBody)

                    const response = await axios.patch(
                        `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}/versions/${version.versionNumber}`,
                        requestBody,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization:
                                    'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                            }
                        }
                    )

                    console.log(`Successfully marked version ${version.versionNumber} as deleted`)
                    console.log(`Response for version ${version.versionNumber}:`, response.data)
                    console.log(`Response status:`, response.status)

                    // Verify the change by fetching the version again
                    try {
                        const verifyResponse = await axios.get(
                            `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}?version=${version.versionNumber}`,
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization:
                                        'Basic cGStbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ=='
                                }
                            }
                        )
                        console.log(`Verification - Version ${version.versionNumber} labels after update:`, verifyResponse.data.labels)
                    } catch (verifyError) {
                        console.log(`Could not verify version ${version.versionNumber}:`, verifyError.message)
                    }

                    successCount++
                } catch (error) {
                    console.error(`Error marking version ${version.versionNumber} as deleted:`, error.response?.data || error.message)
                    console.error(` Error status:`, error.response?.status)
                    errorCount++
                    // Continue with other versions even if one fails
                    console.log(` Continuing with other versions despite error on version ${version.versionNumber}`)
                }
            }

            console.log(`Completed marking versions as deleted - Success: ${successCount}, Errors: ${errorCount}`)

            // Update local state to reflect the changes - ALL versions should have deleted label
            const updatedVersions = allVersions.map((version) => ({
                ...version,
                labels: ['deleted'] // Force ALL versions to have only 'deleted' label
            }))

            setPromptVersions((prev) => ({
                ...prev,
                [promptName]: updatedVersions
            }))

            // Remove the prompt from the main prompts list (since it's now deleted)
            setPrompts((prev) => prev.filter((prompt) => prompt.name !== promptName))

            // Force refresh the prompts list to ensure UI updates
            console.log('Refreshing prompts list to show changes...')
            await fetchPrompts(page)

            // Show success message in the notification bar
            console.log('Showing success message in notification bar...')

            enqueueSnackbar({
                message: `Successfully deleted prompt "${promptName}" with ${allVersions.length} versions`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'success',
                    autoHideDuration: 3000
                }
            })
        } catch (error) {
            console.error(' Error deleting prompt:', error)
            console.error(' Error response:', error.response?.data)
            console.error('Error status:', error.response?.status)
            enqueueSnackbar(`Failed to delete prompt: ${error.response?.data?.message || error.message}`, { variant: 'error' })
        }
    }

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
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='100' y='100' text-anchor='middle' dy='.3em' fill='%23999' font-size='16'%3ENo Prompts%3C/text%3E%3C/svg%3E"
                        alt='No Prompts'
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
                    Ready to manage your prompts?
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
                    Create your first prompt and start building intelligent conversational experiences
                </Typography>

                <Button
                    variant='contained'
                    onClick={handleNewPrompt}
                    startIcon={<IconPlus size={20} />}
                    sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        backgroundColor: theme.palette.primary.main,
                        boxShadow: 'none',
                        '&:hover': {
                            transform: 'translateY(-1px)',
                            backgroundColor: theme.palette.primary.dark,
                            boxShadow: 'none'
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Create Your First Prompt
                </Button>
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
                                    <IconMessage size={28} color={theme.palette.primary.main} />
                                    <Typography
                                        variant='h3'
                                        sx={{
                                            fontWeight: 700,
                                            color: theme.palette.text.primary
                                        }}
                                    >
                                        Prompt Management
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
                                    Manage and organize your AI prompts with version control
                                </Typography>
                            </Box>

                            {/* Controls */}
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={3}
                                alignItems={{ xs: 'stretch', sm: 'center' }}
                                justifyContent='flex-end'
                            >
                                <Button
                                    variant='contained'
                                    onClick={handleNewPrompt}
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
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-1px)',
                                            backgroundColor: theme.palette.primary.dark,
                                            boxShadow: 'none'
                                        }
                                    }}
                                >
                                    New Prompt
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Content */}
                    {prompts.length === 0 ? (
                        <EmptyState />
                    ) : (
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
                                    <StyledTable>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>Name</StyledTableCell>
                                                <StyledTableCell>Versions</StyledTableCell>
                                                <StyledTableCell>Last Updated</StyledTableCell>
                                                <StyledTableCell>Labels</StyledTableCell>
                                                <StyledTableCell>Actions</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {prompts.map((prompt, index) => {
                                                const isExpanded = expandedPrompts.has(prompt.name)
                                                const versions = promptVersions[prompt.name] || []

                                                return (
                                                    <React.Fragment key={`${index}-fragment`}>
                                                        <StyledTableRow key={`${index}-main`}>
                                                            <StyledTableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <PromptBadge
                                                                        onClick={() => handlePromptClick(prompt.name)}
                                                                        title='Click to view details'
                                                                    >
                                                                        {prompt.name}
                                                                    </PromptBadge>
                                                                </Box>
                                                            </StyledTableCell>
                                                            <StyledTableCell>{prompt.versions?.length || 0}</StyledTableCell>
                                                            <StyledTableCell>
                                                                {prompt.lastUpdatedAt?.slice(0, 19).replace('T', ' ')}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                                    {prompt.labels?.map((label, i) => (
                                                                        <LabelChip key={i} label={label} size='small' />
                                                                    ))}
                                                                </Box>
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                                    <IconButton
                                                                        size='small'
                                                                        sx={{ color: theme.palette.primary.main }}
                                                                        title={isExpanded ? 'Hide Versions' : 'View Versions'}
                                                                        onClick={() => handleVersionClick(prompt)}
                                                                    >
                                                                        {isExpanded ? (
                                                                            <ExpandLessIcon fontSize='small' />
                                                                        ) : (
                                                                            <ExpandMoreIcon fontSize='small' />
                                                                        )}
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size='small'
                                                                        sx={{ color: theme.palette.error.main }}
                                                                        title='Delete'
                                                                        onClick={() => {
                                                                            if (
                                                                                window.confirm(
                                                                                    `Are you sure you want to delete prompt "${prompt.name}"? This action cannot be undone.`
                                                                                )
                                                                            ) {
                                                                                deletePrompt(prompt.name)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <IconTrash size={16} />
                                                                    </IconButton>
                                                                </Box>
                                                            </StyledTableCell>
                                                        </StyledTableRow>

                                                        {/* Version Details Rows */}
                                                        {isExpanded &&
                                                            versions.length > 0 &&
                                                            versions.map((version, versionIndex) => (
                                                                <StyledTableRow key={`${index}-version-${versionIndex}`}>
                                                                    <StyledTableCell colSpan={5}>
                                                                        <Box
                                                                            sx={{
                                                                                backgroundColor: theme.palette.background.default,
                                                                                p: 2,
                                                                                borderRadius: 1,
                                                                                border: `1px solid ${theme.palette.divider}`
                                                                            }}
                                                                        >
                                                                            <Box
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    justifyContent: 'space-between',
                                                                                    alignItems: 'center',
                                                                                    mb: 2
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    variant='subtitle1'
                                                                                    sx={{
                                                                                        fontWeight: 'bold',
                                                                                        color: theme.palette.primary.main
                                                                                    }}
                                                                                >
                                                                                    Version{' '}
                                                                                    {version.versionNumber ||
                                                                                        version.version ||
                                                                                        versionIndex + 1}
                                                                                </Typography>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                    {/* Production Indicator */}
                                                                                    {version.labels?.includes('production') && (
                                                                                        <Chip
                                                                                            icon={<IconCrown size={16} />}
                                                                                            label='Production'
                                                                                            size='small'
                                                                                            color='success'
                                                                                            sx={{ ml: 1 }}
                                                                                        />
                                                                                    )}
                                                                                    {/* Change Production Button */}
                                                                                    {!version.labels?.includes('production') &&
                                                                                        version.labels && (
                                                                                            <IconButton
                                                                                                size='small'
                                                                                                onClick={() =>
                                                                                                    setVersionAsProduction(
                                                                                                        prompt.name,
                                                                                                        version.versionNumber ||
                                                                                                            version.version ||
                                                                                                            versionIndex + 1
                                                                                                    )
                                                                                                }
                                                                                                title='Set as Production'
                                                                                                sx={{
                                                                                                    color: theme.palette.warning.main,
                                                                                                    '&:hover': {
                                                                                                        backgroundColor:
                                                                                                            theme.palette.warning.light,
                                                                                                        color: theme.palette.warning
                                                                                                            .contrastText
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                <IconCrownOff size={16} />
                                                                                            </IconButton>
                                                                                        )}
                                                                                </Box>
                                                                            </Box>

                                                                            <Box
                                                                                sx={{
                                                                                    display: 'grid',
                                                                                    gridTemplateColumns: '1fr 1fr',
                                                                                    gap: 2,
                                                                                    mb: 2
                                                                                }}
                                                                            >
                                                                                <Box>
                                                                                    <Typography variant='subtitle2' color='text.secondary'>
                                                                                        Created: {formatDate(version.createdAt)}
                                                                                    </Typography>
                                                                                    <Typography variant='subtitle2' color='text.secondary'>
                                                                                        Updated: {formatDate(version.updatedAt)}
                                                                                    </Typography>
                                                                                </Box>
                                                                                <Box>
                                                                                    <Typography
                                                                                        variant='subtitle2'
                                                                                        color='text.secondary'
                                                                                        gutterBottom
                                                                                    >
                                                                                        Labels:
                                                                                    </Typography>
                                                                                    <Box
                                                                                        sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}
                                                                                    >
                                                                                        {version.labels?.map((label, i) => (
                                                                                            <LabelChip
                                                                                                key={`${prompt.name}-version-${versionIndex}-label-${i}`}
                                                                                                label={label}
                                                                                                size='small'
                                                                                            />
                                                                                        ))}
                                                                                    </Box>
                                                                                </Box>
                                                                            </Box>

                                                                            <Box>
                                                                                <Typography
                                                                                    variant='subtitle2'
                                                                                    color='text.secondary'
                                                                                    gutterBottom
                                                                                >
                                                                                    Prompt Content:
                                                                                </Typography>
                                                                                <Box
                                                                                    sx={{
                                                                                        backgroundColor:
                                                                                            theme.palette.mode === 'dark'
                                                                                                ? '#1e1e1e'
                                                                                                : '#f5f5f5',
                                                                                        p: 2,
                                                                                        borderRadius: 1,
                                                                                        border: `1px solid ${theme.palette.divider}`,
                                                                                        maxHeight: '200px',
                                                                                        overflow: 'auto'
                                                                                    }}
                                                                                >
                                                                                    <Typography
                                                                                        variant='body2'
                                                                                        sx={{
                                                                                            fontFamily: 'monospace',
                                                                                            fontSize: '0.875rem',
                                                                                            lineHeight: 1.5,
                                                                                            whiteSpace: 'pre-wrap',
                                                                                            wordBreak: 'break-word'
                                                                                        }}
                                                                                    >
                                                                                        {version.prompt || 'No content available'}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>
                                                                        </Box>
                                                                    </StyledTableCell>
                                                                </StyledTableRow>
                                                            ))}
                                                    </React.Fragment>
                                                )
                                            })}
                                        </TableBody>
                                    </StyledTable>
                                </StyledTableContainer>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Pagination count={meta.totalPages || 1} page={page} onChange={handlePageChange} color='primary' />
                                </Box>
                            </Paper>
                        </Fade>
                    )}
                </Stack>
                <PromptDetailsDialog show={showDetailsDialog} onCancel={handleCloseDetailsDialog} promptName={selectedPromptName} />
            </MainCard>
        </Container>
    )
}

export default PromptManagement
