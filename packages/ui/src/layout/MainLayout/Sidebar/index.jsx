
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Drawer, useMediaQuery, IconButton, Tooltip, Typography } from '@mui/material'

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar'
import { BrowserView, MobileView } from 'react-device-detect'

// project imports
import MenuList from './MenuList'
import CloudMenuList from '@/layout/MainLayout/Sidebar/CloudMenuList'

// icons
import { IconMenu2, IconX } from '@tabler/icons-react'

// store
import { drawerWidth, collapsedDrawerWidth, headerHeight } from '@/store/constant'

// ==============================|| SIDEBAR DRAWER ||============================== //

const Sidebar = ({ drawerOpen, drawerToggle, window, selectedMenu }) => {
    const theme = useTheme()
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'))
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

    const drawer = (
        <>
            {/* Menu Header with Logo, Title, and Toggle Button */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: drawerOpen ? 'space-between' : 'center',
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'rgba(255,255,255,0.1)',
                    minHeight: '60px',
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                {drawerOpen ? (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '36px' }}>{/* Empty space to balance the layout */}</Box>
                        <Typography
                            variant='subtitle2'
                            sx={{
                                fontWeight: 500,
                                color: theme.palette.text.secondary,
                                fontSize: '0.875rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                position: 'absolute',
                                left: '50%',
                                transform: 'translateX(-50%)'
                            }}
                        >
                            Menu
                        </Typography>
                        <Tooltip title='Collapse Menu' placement='right'>
                            <IconButton
                                onClick={drawerToggle}
                                sx={{
                                    color: theme.palette.text.primary,
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover
                                    }
                                }}
                            >
                                <IconX size={20} />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <Tooltip title='Expand Menu' placement='right'>
                        <IconButton
                            onClick={drawerToggle}
                            sx={{
                                color: theme.palette.text.primary,
                                '&:hover': {
                                    backgroundColor: theme.palette.action.hover
                                }
                            }}
                        >
                            <IconMenu2 size={20} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Menu Content */}
            <BrowserView>
                <PerfectScrollbar
                    component='div'
                    style={{
                        height: !matchUpMd ? 'calc(100vh - 140px)' : `calc(100vh - ${headerHeight + 84}px)`,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <MenuList selectedMenu={selectedMenu} drawerOpen={drawerOpen} />
                    <CloudMenuList drawerOpen={drawerOpen} />
                </PerfectScrollbar>
            </BrowserView>
            <MobileView>
                <Box sx={{ px: 2 }}>
                    <MenuList selectedMenu={selectedMenu} drawerOpen={drawerOpen} />
                    <CloudMenuList drawerOpen={drawerOpen} />
                </Box>
            </MobileView>
        </>
    )

    const container = window !== undefined ? () => window.document.body : undefined

    return (
        <Box
            component='nav'
            sx={{
                flexShrink: { md: 0 },
                width: matchUpMd ? (drawerOpen ? drawerWidth : collapsedDrawerWidth) : 'auto'
            }}
            aria-label='mailbox folders'
        >
            {isAuthenticated && (
                <Drawer
                    container={container}
                    variant={matchUpMd ? 'persistent' : 'temporary'}
                    anchor='left'
                    open={true}
                    onClose={drawerToggle}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
                            background: 'transparent',
                            color: theme.palette.text.primary,
                            [theme.breakpoints.up('md')]: {
                                top: `${headerHeight}px`
                            },
                            borderRight: 'none',
                            overflowX: 'hidden',
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.leavingScreen
                            })
                        }
                    }}
                    ModalProps={{ keepMounted: true }}
                    color='inherit'
                >
                    {drawer}
                </Drawer>
            )}
        </Box>
    )
}

Sidebar.propTypes = {
    drawerOpen: PropTypes.bool,
    drawerToggle: PropTypes.func,
    window: PropTypes.object,
    selectedMenu: PropTypes.string
}

export default Sidebar
