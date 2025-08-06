import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'

// Material
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Divider
} from '@mui/material'

// Icons
import { IconVersions } from '@tabler/icons-react'

// Project imports
import { StyledButton } from '@/ui-component/button/StyledButton'

const PromptVersionSelectionDialog = ({ show, onCancel, onConfirm, prompt, versions }) => {
    const portalElement = document.getElementById('portal')
    const [selectedVersion, setSelectedVersion] = useState(null)

    useEffect(() => {
        if (show && versions && Array.isArray(versions) && versions.length > 0) {
                    console.log('Dialog received versions:', versions)
        console.log('First version:', versions[0], 'Type:', typeof versions[0])
            // Default to latest version (first in the list)
            setSelectedVersion(versions[0])
        }
    }, [show, versions])

    const handleVersionSelect = (version) => {
        setSelectedVersion(version)
    }

    const handleConfirm = () => {
        if (selectedVersion) {
            console.log('Dialog handleConfirm - selectedVersion:', selectedVersion, 'Type:', typeof selectedVersion)
            onConfirm(selectedVersion)
        }
    }

    const component = show ? (
        <Dialog
            open={show}
            onClose={onCancel}
            maxWidth='sm'
            fullWidth
            aria-labelledby='version-selection-dialog-title'
        >
            <DialogTitle id='version-selection-dialog-title'>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconVersions />
                    <Typography variant='h6'>Select Production Version</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant='subtitle1' sx={{ fontWeight: 'bold', mb: 1 }}>
                        {prompt?.name || 'Prompt'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        This prompt has multiple production versions available. Please select which production version you would like to use:
                    </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <List>
                    {versions && Array.isArray(versions) && versions.length > 0 ? (
                        versions.map((version, index) => {
                            // Handle both string versions and object versions
                            const versionNumber = typeof version === 'string' ? version : 
                                version.version || version.versionNumber || version.id || `v${index + 1}`
                            const versionDescription = typeof version === 'string' ? '' :
                                version.description || version.name || ''
                            const versionDate = typeof version === 'string' ? '' :
                                version.createdAt || version.updatedAt || version.date || ''
                            
                            return (
                                <ListItem key={index} disablePadding>
                                    <ListItemButton
                                        selected={selectedVersion === version}
                                        onClick={() => handleVersionSelect(version)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 1,
                                            '&.Mui-selected': {
                                                backgroundColor: 'primary.light',
                                                '&:hover': {
                                                    backgroundColor: 'primary.light'
                                                }
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                        Version {versionNumber}
                                                    </span>
                                                    <Chip 
                                                        label="Production" 
                                                        size="small" 
                                                        color="success" 
                                                        variant="outlined"
                                                    />
                                                    {index === 0 && (
                                                        <Chip 
                                                            label="Latest" 
                                                            size="small" 
                                                            color="primary" 
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </span>
                                            }
                                            secondary={
                                                <span>
                                                    {versionDescription && (
                                                        <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'block' }}>
                                                            {versionDescription}
                                                        </span>
                                                    )}
                                                    {versionDate && (
                                                        <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.8rem', display: 'block' }}>
                                                            {new Date(versionDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {!versionDescription && !versionDate && (
                                                        <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'block' }}>
                                                            Version number: {versionNumber}
                                                        </span>
                                                    )}
                                                </span>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            {selectedVersion === version && (
                                                <Chip 
                                                    label="Selected" 
                                                    size="small" 
                                                    color="primary"
                                                />
                                            )}
                                        </ListItemSecondaryAction>
                                    </ListItemButton>
                                </ListItem>
                            )
                        })
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                No versions available for this prompt.
                            </Typography>
                        </Box>
                    )}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color='inherit'>
                    Cancel
                </Button>
                <StyledButton
                    variant='contained'
                    onClick={handleConfirm}
                    disabled={!selectedVersion}
                >
                    Use Selected Version
                </StyledButton>
            </DialogActions>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

PromptVersionSelectionDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func,
    prompt: PropTypes.object,
    versions: PropTypes.array
}

export default PromptVersionSelectionDialog 