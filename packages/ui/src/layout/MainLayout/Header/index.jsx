import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// material-ui
import { Button, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import LogoSection from '../LogoSection'
import ProfileSection from './ProfileSection'
import WorkspaceSwitcher from '@/layout/MainLayout/Header/WorkspaceSwitcher'
import OrgWorkspaceBreadcrumbs from '@/layout/MainLayout/Header/OrgWorkspaceBreadcrumbs'
import PricingDialog from '@/ui-component/subscription/PricingDialog'

// assets
import {
    IconX,
    IconSparkles,
    IconTrendingUp, // Used as the new "raising arrow" for both AI Studio and INSIGHTS
    IconRocket,
    IconShield,
    IconFileText
} from '@tabler/icons-react'

// store
import { store } from '@/store'
import { useConfig } from '@/store/context/ConfigContext'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import { logoutSuccess } from '@/store/reducers/authSlice'

// API
import accountApi from '@/api/account.api'

// Hooks
import useApi from '@/hooks/useApi'
import useNotifier from '@/utils/useNotifier'

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header = ({ _handleLeftDrawerToggle, selectedMenu, setSelectedMenu }) => {
    Header.propTypes = {
        _handleLeftDrawerToggle: PropTypes.func,
        selectedMenu: PropTypes.string.isRequired,
        setSelectedMenu: PropTypes.func.isRequired
    }
    const _theme = useTheme()
    const navigate = useNavigate()
    const location = useLocation()

    const _customization = useSelector((state) => state.customization)
    const logoutApi = useApi(accountApi.logout)

    const dispatch = useDispatch()
    const { isEnterpriseLicensed, isCloud, _isOpenSource } = useConfig()
    const currentUser = useSelector((state) => state.auth.user)
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
    const [isPricingOpen, setIsPricingOpen] = useState(false)

    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const signOutClicked = () => {
        logoutApi.request()
        enqueueSnackbar({
            message: 'Logging out...',
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
    }

    useEffect(() => {
        try {
            if (logoutApi.data && logoutApi.data.message === 'logged_out') {
                store.dispatch(logoutSuccess())
                window.location.href = logoutApi.data.redirectTo
            }
        } catch (e) {
            console.error(e)
        }
    }, [logoutApi.data])

    const headerMenus = useMemo(
        () => [
            {
                label: 'AI Studio',
                icon: IconSparkles, // Changed to IconSparkles
                items: [
                    { label: 'RAGflow Studio', path: '/chatflows' },
                    { label: 'Agent Mesh', path: '/agentflows' },
                    { label: 'Knowledge Base', path: '/document-stores' },
                    { label: 'Tool Kit', path: '/tools' }
                ]
            },
            {
                label: 'Prompt Management',
                icon: IconFileText,
                items: [{ label: 'Prompt Management', path: '/prompt-management' }]
            },
            {
                label: 'INSIGHTS',
                icon: IconTrendingUp, // Changed to IconTrendingUp
                items: [
                    { label: 'TrackBoard', path: '/trackboard' },
                    { label: 'RunBoard', path: '/runboard' }
                ]
            },
            {
                label: 'SOLUTIONS',
                icon: IconRocket,
                items: [{ label: 'Solutions', path: '/solutions' }]
            },
            {
                label: 'ADMINISTRATION',
                icon: IconShield,
                items: [
                    { label: 'Credentials', path: '/credentials' },
                    { label: 'Variables', path: '/variables' },
                    { label: 'APIkeys', path: '/apikey' }
                ]
            }
        ],
        []
    )

    // Update selectedMenu on URL change (initial and later)
    useEffect(() => {
        // Always prioritize Prompt Repo for prompt-management routes
        if (location.pathname.startsWith('/prompt-management') || location.pathname.startsWith('/new-prompt')) {
            setSelectedMenu('Prompt Management')
            return
        }
        // Only update selectedMenu from URL if not currently INSIGHTS
        if (selectedMenu !== 'INSIGHTS') {
            const foundMenu = headerMenus.find((menu) => menu.items.some((item) => location.pathname.startsWith(item.path)))
            if (foundMenu) {
                setSelectedMenu(foundMenu.label)
            } else {
                setSelectedMenu(headerMenus[0].label) // fallback
            }
        }
    }, [location.pathname, selectedMenu, setSelectedMenu])

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                py: 1, // Added padding for better vertical spacing
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', // Enhanced shadow for dark background
                bgcolor: '#3949ab' // Much lighter shade of the blue
            }}
        >
            {/* Logo */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, mr: 3 }} component='span'>
                <LogoSection />
            </Box>

            {/* Centered menu buttons */}
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 3, // Increased gap between buttons
                    flexWrap: 'wrap'
                }}
            >
                {headerMenus.map((menu) => {
                    const IconComponent = menu.icon
                    // Capitalize first letter and lowercase the rest
                    const labelFormatted = menu.label.charAt(0).toUpperCase() + menu.label.slice(1).toLowerCase()

                    return (
                        <Button
                            key={menu.label}
                            variant='text'
                            onClick={() => {
                                if (menu.label === 'INSIGHTS') {
                                    navigate('/cognifuse')
                                    setSelectedMenu(menu.label)
                                } else if (menu.label === 'SOLUTIONS') {
                                    setSelectedMenu(menu.label)
                                } else if (menu.label === 'Prompt Management') {
                                    navigate('/prompt-management')
                                    setSelectedMenu('Prompt Management')
                                    return
                                } else if (menu.items.length > 0) {
                                    navigate(menu.items[0].path)
                                    setSelectedMenu(menu.label)
                                } else {
                                    setSelectedMenu(menu.label)
                                }
                            }}
                            startIcon={<IconComponent size={18} />}
                            sx={{
                                whiteSpace: 'nowrap',
                                px: 3, // Increased horizontal padding
                                py: 1.5, // Added vertical padding
                                textTransform: 'none',
                                fontWeight: 'medium',
                                fontSize: '1.1rem',
                                color: '#ffffff',
                                borderRadius: 2, // Increased border radius
                                position: 'relative', // For the active indicator
                                textDecoration: 'none', // Removed underline
                                transition: 'all 0.3s ease-in-out', // Smoother transition
                                backgroundColor: selectedMenu === menu.label ? 'rgba(255,255,255,0.15)' : 'transparent',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: 0,
                                    left: '50%',
                                    width: selectedMenu === menu.label ? '80%' : '0%',
                                    height: '3px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '2px 2px 0 0',
                                    transform: 'translateX(-50%)',
                                    transition: 'width 0.3s ease-in-out'
                                },
                                '&:hover': {
                                    backgroundColor: selectedMenu === menu.label ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                    transform: 'translateY(-1px)', // Subtle lift effect
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', // Enhanced shadow for dark background
                                    '&::after': {
                                        width: selectedMenu === menu.label ? '80%' : '60%'
                                    }
                                },
                                '&:focus-visible': {
                                    outline: `2px solid #ffffff`,
                                    outlineOffset: 2
                                }
                            }}
                            aria-current={selectedMenu === menu.label ? 'page' : undefined}
                        >
                            {labelFormatted}
                        </Button>
                    )
                })}
            </Box>

            {/* Right side components */}
            {isEnterpriseLicensed && isAuthenticated && <WorkspaceSwitcher />}
            {isCloud && isAuthenticated && <OrgWorkspaceBreadcrumbs />}

            {isCloud && currentUser?.isOrganizationAdmin && (
                <Button
                    variant='contained'
                    sx={{
                        mr: 1,
                        ml: 3, // Increased margin
                        borderRadius: 20, // More rounded
                        background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)', // Bright gradient for dark background
                        color: '#ffffff',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)', // Enhanced shadow for dark background
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #45a049 0%, #1976D2 100%)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.4)', // Stronger shadow on hover
                            transform: 'translateY(-2px)' // Lift effect
                        },
                        '&:focus-visible': {
                            outline: `2px solid #ffffff`,
                            outlineOffset: 2
                        }
                    }}
                    onClick={() => setIsPricingOpen(true)}
                    startIcon={<IconSparkles size={20} />}
                >
                    Upgrade
                </Button>
            )}

            {isPricingOpen && isCloud && (
                <PricingDialog
                    open={isPricingOpen}
                    onClose={(planUpdated) => {
                        setIsPricingOpen(false)
                        if (planUpdated) {
                            navigate('/')
                            navigate(0)
                        }
                    }}
                />
            )}

            <Box sx={{ ml: 2 }}>
                {/* Added wrapper for better spacing */}
                <ProfileSection handleLogout={signOutClicked} />
            </Box>
        </Box>
    )
}

Header.propTypes = {
    handleLeftDrawerToggle: PropTypes.func,
    selectedMenu: PropTypes.string,
    setSelectedMenu: PropTypes.func
}

export default Header
