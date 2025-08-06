import { useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import moment from 'moment'
import { styled } from '@mui/material/styles'
import {
    Box,
    Chip,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Tooltip,
    Typography,
    useTheme,
    alpha
} from '@mui/material'
import { tableCellClasses } from '@mui/material/TableCell'
import FlowListMenu from '../button/FlowListMenu'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import MoreItemsTooltip from '../tooltip/MoreItemsTooltip'

// Enhanced styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
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
        backdropFilter: 'blur(8px)',
        '& .MuiTableSortLabel-root': {
            color: 'inherit',
            fontWeight: 600,
            '&:hover': {
                color: theme.palette.primary.main
            },
            '&.Mui-active': {
                color: theme.palette.primary.main,
                '& .MuiTableSortLabel-icon': {
                    color: theme.palette.primary.main
                }
            }
        }
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

const StyledChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    borderRadius: 12,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.15),
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
    }
}))

// Animated underline link styling - restored
const StyledLink = styled(Link)(({ theme }) => ({
    color: theme.palette.primary.main,
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    position: 'relative',

    '&:hover': {
        color: theme.palette.primary.dark
    },

    '&::after': {
        content: '""',
        position: 'absolute',
        width: '0%',
        height: '2px',
        bottom: '-2px',
        left: '0',
        backgroundColor: theme.palette.primary.main,
        transition: 'width 0.3s ease'
    },

    '&:hover::after': {
        width: '100%'
    }
}))

const NodeImageContainer = styled(Box)(({ theme }) => ({
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.grey[100], 0.8),
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',

    '&:hover': {
        transform: 'scale(1.1)',
        borderColor: theme.palette.primary.main,
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
    },

    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
            theme.palette.secondary.main,
            0.1
        )} 100%)`,
        opacity: 0,
        transition: 'opacity 0.2s ease'
    },

    '&:hover::before': {
        opacity: 1
    }
}))

const LoadingSkeleton = styled(Skeleton)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[700], 0.3) : alpha(theme.palette.grey[300], 0.3),
    borderRadius: 8,
    '&::after': {
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.1)}, transparent)`
    }
}))

const getLocalStorageKeyName = (name, isAgentCanvas) => {
    return (isAgentCanvas ? 'agentcanvas' : 'chatflowcanvas') + '_' + name
}

export const FlowListTable = ({
    data,
    images = {},
    icons = {},
    isLoading,
    filterFunction,
    updateFlowsApi,
    setError,
    isAgentCanvas,
    isAgentflowV2
}) => {
    const { hasPermission } = useAuth()
    const isActionsAvailable = isAgentCanvas
        ? hasPermission('agentflows:update,agentflows:delete,agentflows:config,agentflows:domains,templates:flowexport,agentflows:export')
        : hasPermission('chatflows:update,chatflows:delete,chatflows:config,chatflows:domains,templates:flowexport,chatflows:export')

    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const localStorageKeyOrder = getLocalStorageKeyName('order', isAgentCanvas)
    const localStorageKeyOrderBy = getLocalStorageKeyName('orderBy', isAgentCanvas)

    const [order, setOrder] = useState(localStorage.getItem(localStorageKeyOrder) || 'desc')
    const [orderBy, setOrderBy] = useState(localStorage.getItem(localStorageKeyOrderBy) || 'updatedDate')

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc'
        const newOrder = isAsc ? 'desc' : 'asc'
        setOrder(newOrder)
        setOrderBy(property)
        localStorage.setItem(localStorageKeyOrder, newOrder)
        localStorage.setItem(localStorageKeyOrderBy, property)
    }

    const onFlowClick = (row) => {
        if (!isAgentCanvas) {
            return `/canvas/${row.id}`
        } else {
            return `/agentcanvas/${row.id}`
        }
    }

    const sortedData = data
        ? [...data].sort((a, b) => {
              if (orderBy === 'name') {
                  return order === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '')
              } else if (orderBy === 'updatedDate') {
                  return order === 'asc'
                      ? new Date(a.updatedDate) - new Date(b.updatedDate)
                      : new Date(b.updatedDate) - new Date(a.updatedDate)
              }
              return 0
          })
        : []

    const renderLoadingRow = () => (
        <StyledTableRow>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={24} />
            </StyledTableCell>
            <StyledTableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <LoadingSkeleton variant='rounded' width={60} height={24} />
                    <LoadingSkeleton variant='rounded' width={80} height={24} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <LoadingSkeleton variant='circular' width={36} height={36} />
                    <LoadingSkeleton variant='circular' width={36} height={36} />
                    <LoadingSkeleton variant='circular' width={36} height={36} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='90%' height={20} />
            </StyledTableCell>
            {isActionsAvailable && (
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={32} height={32} />
                </StyledTableCell>
            )}
        </StyledTableRow>
    )

    return (
        <StyledTableContainer component={Paper}>
            <StyledTable size='medium' aria-label='flows table'>
                <TableHead>
                    <TableRow>
                        <StyledTableCell component='th' scope='row' style={{ width: '20%' }}>
                            <TableSortLabel active={orderBy === 'name'} direction={order} onClick={() => handleRequestSort('name')}>
                                Flow Name
                            </TableSortLabel>
                        </StyledTableCell>
                        <StyledTableCell style={{ width: '25%' }}>Categories</StyledTableCell>
                        <StyledTableCell style={{ width: '30%' }}>Nodes</StyledTableCell>
                        <StyledTableCell style={{ width: '15%' }}>
                            <TableSortLabel
                                active={orderBy === 'updatedDate'}
                                direction={order}
                                onClick={() => handleRequestSort('updatedDate')}
                            >
                                Last Modified
                            </TableSortLabel>
                        </StyledTableCell>
                        {isActionsAvailable && <StyledTableCell style={{ width: '10%' }}>Actions</StyledTableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading ? (
                        <>
                            {[...Array(5)].map((_, index) => (
                                <Box key={index}>{renderLoadingRow()}</Box>
                            ))}
                        </>
                    ) : (
                        sortedData.filter(filterFunction).map((row, index) => (
                            <StyledTableRow key={`${row.id}-${index}`}>
                                <StyledTableCell>
                                    <Tooltip title={row.templateName || row.name} placement='top'>
                                        <Typography
                                            sx={{
                                                display: '-webkit-box',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                lineHeight: 1.4
                                            }}
                                        >
                                            <StyledLink to={onFlowClick(row)}>{row.templateName || row.name}</StyledLink>
                                        </Typography>
                                    </Tooltip>
                                </StyledTableCell>

                                <StyledTableCell>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            gap: 1,
                                            alignItems: 'center'
                                        }}
                                    >
                                        {row.category ? (
                                            row.category
                                                .split(';')
                                                .filter((tag) => tag.trim())
                                                .map((tag, index) => (
                                                    <StyledChip key={index} label={tag.trim()} size='small' variant='outlined' />
                                                ))
                                        ) : (
                                            <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                                                No categories
                                            </Typography>
                                        )}
                                    </Box>
                                </StyledTableCell>

                                <StyledTableCell>
                                    {images[row.id] || icons[row.id] ? (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                gap: 1.5,
                                                flexWrap: 'wrap'
                                            }}
                                        >
                                            {[
                                                ...(images[row.id] || []).map((img) => ({
                                                    type: 'image',
                                                    src: img.imageSrc,
                                                    label: img.label
                                                })),
                                                ...(icons[row.id] || []).map((ic) => ({
                                                    type: 'icon',
                                                    icon: ic.icon,
                                                    color: ic.color,
                                                    title: ic.name
                                                }))
                                            ]
                                                .slice(0, 5)
                                                .map((item, index) => (
                                                    <Tooltip key={item.src || index} title={item.label || item.title} placement='top' arrow>
                                                        <NodeImageContainer>
                                                            {item.type === 'image' ? (
                                                                <img
                                                                    style={{
                                                                        width: '70%',
                                                                        height: '70%',
                                                                        objectFit: 'contain',
                                                                        zIndex: 1
                                                                    }}
                                                                    alt={item.label || 'Node'}
                                                                    src={item.src}
                                                                />
                                                            ) : (
                                                                <item.icon
                                                                    size={20}
                                                                    color={item.color || theme.palette.primary.main}
                                                                    style={{ zIndex: 1 }}
                                                                />
                                                            )}
                                                        </NodeImageContainer>
                                                    </Tooltip>
                                                ))}

                                            {(images[row.id]?.length || 0) + (icons[row.id]?.length || 0) > 5 && (
                                                <MoreItemsTooltip
                                                    images={[
                                                        ...(images[row.id]?.slice(5) || []),
                                                        ...(icons[row.id]?.slice(Math.max(0, 5 - (images[row.id]?.length || 0))) || []).map(
                                                            (ic) => ({ label: ic.name })
                                                        )
                                                    ]}
                                                >
                                                    <Typography
                                                        sx={{
                                                            alignItems: 'center',
                                                            display: 'flex',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                            color: theme.palette.primary.main,
                                                            cursor: 'pointer',
                                                            padding: '4px 8px',
                                                            borderRadius: 1,
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                                                transform: 'translateY(-1px)'
                                                            }
                                                        }}
                                                    >
                                                        +{(images[row.id]?.length || 0) + (icons[row.id]?.length || 0) - 5} more
                                                    </Typography>
                                                </MoreItemsTooltip>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                                            No nodes
                                        </Typography>
                                    )}
                                </StyledTableCell>

                                <StyledTableCell>
                                    <Typography
                                        variant='body2'
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            fontSize: '0.8rem',
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {moment(row.updatedDate).format('MMM DD, YYYY')}
                                        <br />
                                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{moment(row.updatedDate).format('HH:mm')}</span>
                                    </Typography>
                                </StyledTableCell>

                                {isActionsAvailable && (
                                    <StyledTableCell>
                                        <Stack direction='row' spacing={1} justifyContent='center' alignItems='center'>
                                            <FlowListMenu
                                                isAgentCanvas={isAgentCanvas}
                                                isAgentflowV2={isAgentflowV2}
                                                chatflow={row}
                                                setError={setError}
                                                updateFlowsApi={updateFlowsApi}
                                            />
                                        </Stack>
                                    </StyledTableCell>
                                )}
                            </StyledTableRow>
                        ))
                    )}
                </TableBody>
            </StyledTable>
        </StyledTableContainer>
    )
}

FlowListTable.propTypes = {
    data: PropTypes.array,
    images: PropTypes.object,
    icons: PropTypes.object,
    isLoading: PropTypes.bool,
    filterFunction: PropTypes.func,
    updateFlowsApi: PropTypes.object,
    setError: PropTypes.func,
    isAgentCanvas: PropTypes.bool,
    isAgentflowV2: PropTypes.bool
}
