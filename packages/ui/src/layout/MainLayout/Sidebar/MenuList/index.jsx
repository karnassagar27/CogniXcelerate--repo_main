// material-ui
import { Box, Typography } from '@mui/material'
import PropTypes from 'prop-types'

// project imports
import NavGroup from './NavGroup'
import dashboard from '@/menu-items/dashboard'

// ==============================|| SIDEBAR MENU LIST ||============================== //

const MenuList = ({ selectedMenu, drawerOpen }) => {
    // Filtering logic based on selectedMenu
    let filteredDashboard = { ...dashboard }
    if (selectedMenu === 'AI Studio') {
        filteredDashboard.children = [
            {
                ...dashboard.children[0],
                children: dashboard.children[0].children.filter((item) =>
                    ['chatflows', 'agentflows', 'document-stores', 'ai-studio-knowledge-base', 'tools'].includes(item.id)
                )
            }
        ]
    } else if (selectedMenu === 'INSIGHTS') {
        // Show Dashboard first, then Trace Logs
        filteredDashboard.children = [
            {
                ...dashboard.children[0],
                children: dashboard.children[0].children
                    .filter((item) => ['cognifuse', 'executions'].includes(item.id))
                    .sort((a, b) => {
                        // Ensure 'cognifuse' (Dashboard) comes first
                        if (a.id === 'cognifuse') return -1
                        if (b.id === 'cognifuse') return 1
                        return 0
                    })
                    .map((item) => ({ ...item, permission: undefined, display: undefined }))
            }
        ]
    } else if (selectedMenu === 'Prompt Management') {
        filteredDashboard.children = [
            {
                ...dashboard.children[0],
                children: dashboard.children[0].children.filter((item) => ['prompt-management'].includes(item.id))
            }
        ]
    } else if (selectedMenu === 'ADMINISTRATION') {
        filteredDashboard.children = [
            {
                ...dashboard.children[0],
                children: dashboard.children[0].children.filter((item) => ['credentials', 'variables', 'apikey'].includes(item.id))
            }
        ]
    } else if (selectedMenu === 'SOLUTIONS') {
        filteredDashboard.children = [
            {
                ...dashboard.children[0],
                children: [
                    {
                        id: 'solutions',
                        title: 'Solutions',
                        type: 'item',
                        url: '/solutions',
                        icon: dashboard.children[0].children[0].icon, // Use any icon from dashboard for consistency
                        breadcrumbs: true
                    }
                ]
            }
        ]
    } else {
        // Default: show all
        filteredDashboard = dashboard
    }
    const navItems = [filteredDashboard].map((item) => {
        switch (item.type) {
            case 'group':
                return <NavGroup key={item.id} item={item} drawerOpen={drawerOpen} />
            default:
                return (
                    <Typography key={item.id} variant='h6' color='error' align='center'>
                        Menu Items Error
                    </Typography>
                )
        }
    })
    return <Box>{navItems}</Box>
}
MenuList.propTypes = {
    selectedMenu: PropTypes.string,
    drawerOpen: PropTypes.bool
}

export default MenuList
