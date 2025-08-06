import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'

// material-ui
import { styled, useTheme } from '@mui/material/styles'
import { AppBar, Box, CssBaseline, Toolbar, useMediaQuery } from '@mui/material'

// project imports
import Header from './Header'
import Sidebar from './Sidebar'
import { drawerWidth, collapsedDrawerWidth, headerHeight } from '@/store/constant'
import { SET_MENU } from '@/store/actions'

// styles
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    ...theme.typography.mainContent,
    ...(!open && {
        backgroundColor: '#f8f9fc',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        transition: theme.transitions.create('all', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        marginRight: 0,
        [theme.breakpoints.up('md')]: {
            marginLeft: 0,
            width: `calc(100% - ${collapsedDrawerWidth}px)`,
            minWidth: `calc(100% - ${collapsedDrawerWidth}px)`,
            paddingLeft: '20px' // Add padding to prevent content from being hidden
        },
        [theme.breakpoints.down('md')]: {
            marginLeft: '20px',
            width: `calc(100% - ${collapsedDrawerWidth}px)`,
            minWidth: `calc(100% - ${collapsedDrawerWidth}px)`,
            padding: '16px'
        },
        [theme.breakpoints.down('sm')]: {
            marginLeft: '10px',
            width: `calc(100% - ${collapsedDrawerWidth}px)`,
            minWidth: `calc(100% - ${collapsedDrawerWidth}px)`,
            padding: '16px',
            marginRight: '10px'
        }
    }),
    ...(open && {
        backgroundColor: '#f8f9fc',
        transition: theme.transitions.create('all', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        }),
        marginLeft: 0,
        marginRight: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        width: `calc(100% - ${drawerWidth}px)`,
        minWidth: `calc(100% - ${drawerWidth}px)`
    })
}))

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = () => {
    const theme = useTheme()
    const _matchDownMd = useMediaQuery(theme.breakpoints.down('lg'))

    // Handle left drawer
    const leftDrawerOpened = useSelector((state) => state.customization.opened)
    const dispatch = useDispatch()
    const handleLeftDrawerToggle = () => {
        dispatch({ type: SET_MENU, opened: !leftDrawerOpened })
    }

    // LIFTED STATE: selectedMenu for header/sidebar coordination
    const [selectedMenu, setSelectedMenu] = useState('CRAFT')

    useEffect(() => {
        // Start with collapsed sidebar by default
        setTimeout(() => dispatch({ type: SET_MENU, opened: false }), 0)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            {/* header */}
            <AppBar
                enableColorOnDark
                position='fixed'
                color='inherit'
                elevation={0}
                sx={{
                    bgcolor: '#3949ab',
                    transition: leftDrawerOpened ? theme.transitions.create('width') : 'none'
                }}
            >
                <Toolbar sx={{ height: `${headerHeight}px`, borderBottom: '1px solid', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Header handleLeftDrawerToggle={handleLeftDrawerToggle} selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />
                </Toolbar>
            </AppBar>

            {/* drawer */}
            <Sidebar drawerOpen={leftDrawerOpened} drawerToggle={handleLeftDrawerToggle} selectedMenu={selectedMenu} />

            {/* main content */}
            <Main theme={theme} open={leftDrawerOpened}>
                <Outlet />
            </Main>
        </Box>
    )
}

export default MainLayout
