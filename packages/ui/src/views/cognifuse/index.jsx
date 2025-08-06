import { useEffect, useState, useRef, useCallback } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useTheme } from '@mui/material/styles'
import PropTypes from 'prop-types'

// material-ui
import {
    Box,
    Stack,
    Typography,
    TextField,
    InputAdornment,
    Fade,
    Skeleton,
    Container,
    Paper,
    alpha,
    Button,
    Grid,
    Card,
    CardContent
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'

// icons
import { IconSearch, IconFilter } from '@tabler/icons-react'
// Replace IconChartLine with IconChartHistogram
import { IconChartHistogram } from '@tabler/icons-react'

// Remove ChartDataLabels import and registration
// import ChartDataLabels from 'chartjs-plugin-datalabels';
// ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, ChartDataLabels)
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

const createGradient = (ctx, color) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
    gradient.addColorStop(0, color + '99')
    gradient.addColorStop(1, color + '00')
    return gradient
}

const getEnhancedChartOptions = (label, theme, unit = '', xLabel = 'Time', yLabel = label) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 1000,
        easing: 'easeInOutQuad'
    },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: theme.palette.background.paper,
            titleColor: theme.palette.text.primary,
            bodyColor: theme.palette.text.secondary,
            cornerRadius: 6,
            callbacks: {
                label: (context) => `${label}: ${unit}${context.raw.toFixed(4)}`
            }
        }
        // Remove datalabels config
    },
    layout: {
        padding: {
            left: 1,
            right: 1,
            top: 1,
            bottom: 1
        }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: xLabel,
                color: theme.palette.text.primary,
                font: { size: 13, weight: '400' },
                padding: { top: 4, bottom: 0 }
            },
            ticks: {
                color: theme.palette.text.secondary,
                font: { size: 11 },
                callback: function (value) {
                    // Limit decimal places to 4 for x-axis
                    return Number(value).toFixed(4)
                }
            },
            grid: { color: theme.palette.divider }
        },
        y: {
            title: {
                display: true,
                text: yLabel,
                color: theme.palette.text.primary,
                font: { size: 13, weight: '500' },
                padding: { top: 0, bottom: 3 }
            },
            ticks: {
                color: theme.palette.text.secondary,
                font: { size: 11 },
                callback: function (value) {
                    // Limit decimal places to 4 for y-axis
                    return unit + Number(value).toFixed(4)
                }
            },
            grid: { color: theme.palette.divider }
        }
    },
    elements: {
        point: {
            radius: 4,
            hoverRadius: 6,
            backgroundColor: theme.palette.common.white,
            borderWidth: 2
        },
        line: {
            borderWidth: 2,
            tension: 0.4,
            borderCapStyle: 'round'
        }
    }
})

const StatCard = ({ title, value, icon }) => {
    const theme = useTheme()
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 2.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.grey[500], 0.15)}`
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack direction='row' alignItems='center' spacing={2}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                        }}
                    >
                        {icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5, fontWeight: 500 }}>
                            {title}
                        </Typography>
                        <Typography
                            variant='h4'
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.primary.main
                            }}
                        >
                            {value}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    )
}

const Badge = ({ text, bg, textColor }) => (
    <span
        style={{
            backgroundColor: bg,
            color: textColor,
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '999px',
            marginRight: '6px'
        }}
    >
        {text}
    </span>
)

const CognifuseDashboard = () => {
    const theme = useTheme()
    const [traces, setTraces] = useState([])
    const [_projectTabs, setProjectTabs] = useState([])
    const [activeProject, setActiveProject] = useState('')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedTrace, setSelectedTrace] = useState(null)

    const chartRef = useRef(null)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const pageSize = 20 // Show 50 traces per page

    const [fromTimestamp, setFromTimestamp] = useState('')
    const [toTimestamp, setToTimestamp] = useState('')

    // Add state for aggregated cost data
    const [totalCost, setTotalCost] = useState(0)
    const [totalLatency, setTotalLatency] = useState(0)

    const username = 'pk-lf-3efa16d2-1f43-4903-9cd9-3ad5287a1b7a'
    const password = 'sk-lf-ca916005-248c-44cf-83e6-11f11fac8d34'
    const baseUrl = 'http://10.10.20.156:3000/api/public/traces'

    // Helper to convert datetime-local to ISO string with seconds and Z
    const toIsoString = (val) => {
        if (!val) return ''
        // If already has seconds, just add Z if missing
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
            return val.endsWith('Z') ? val : val + 'Z'
        }
        // If only YYYY-MM-DDTHH:mm, add :00Z
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
            return val + ':00Z'
        }
        return val
    }

    // Fetch aggregated data for all traces
    const fetchAggregatedData = useCallback(async (from, to) => {
        try {
            let url = `${baseUrl}/aggregated`
            const fromIso = toIsoString(from)
            const toIso = toIsoString(to)
            if (fromIso) url += `?fromTimestamp=${encodeURIComponent(fromIso)}`
            if (toIso) url += `${fromIso ? '&' : '?'}toTimestamp=${encodeURIComponent(toIso)}`

            const res = await fetch(url, {
                headers: {
                    Authorization: 'Basic ' + btoa(username + ':' + password),
                    'Content-Type': 'application/json'
                }
            })

            if (res.ok) {
                const data = await res.json()
                setTotalCost(data.totalCost || 0)
                setTotalLatency(data.totalLatency || 0)
            } else {
                // Fallback: calculate from all pages if aggregated endpoint doesn't exist
                await calculateTotalFromAllPages(from, to)
            }
        } catch (err) {
            // Fallback: calculate from all pages
            await calculateTotalFromAllPages(from, to)
        }
    }, [])

    // Fallback method to calculate total from all pages
    const calculateTotalFromAllPages = useCallback(async (from, to) => {
        try {
            let allTraces = []
            let currentPage = 1
            let hasMorePages = true

            while (hasMorePages) {
                let url = `${baseUrl}?limit=100&page=${currentPage}`
                const fromIso = toIsoString(from)
                const toIso = toIsoString(to)
                if (fromIso) url += `&fromTimestamp=${encodeURIComponent(fromIso)}`
                if (toIso) url += `&toTimestamp=${encodeURIComponent(toIso)}`

                const res = await fetch(url, {
                    headers: {
                        Authorization: 'Basic ' + btoa(username + ':' + password),
                        'Content-Type': 'application/json'
                    }
                })

                const data = await res.json()
                const traceData = data.data || []

                if (traceData.length === 0) {
                    hasMorePages = false
                } else {
                    allTraces = allTraces.concat(traceData)
                    currentPage++

                    // Safety check to prevent infinite loop
                    if (currentPage > 100) {
                        hasMorePages = false
                    }
                }
            }

            // Calculate total cost from all traces
            const totalCostValue = allTraces.reduce((sum, trace) => sum + (trace.totalCost || 0), 0)
            const totalLatencyValue = allTraces.reduce((sum, trace) => sum + (trace.latency || 0), 0)

            setTotalCost(totalCostValue)
            setTotalLatency(totalLatencyValue)
        } catch (err) {
            console.error('Error calculating total from all pages:', err)
            setTotalCost(0)
            setTotalLatency(0)
        }
    }, [])

    // Update fetchData to accept filters
    const fetchData = useCallback(
        async (page, pageSize, from, to) => {
            setLoading(true)
            try {
                let url = `${baseUrl}?limit=${pageSize}&page=${page}`
                const fromIso = toIsoString(from)
                const toIso = toIsoString(to)
                if (fromIso) url += `&fromTimestamp=${encodeURIComponent(fromIso)}`
                if (toIso) url += `&toTimestamp=${encodeURIComponent(toIso)}`
                const res = await fetch(url, {
                    headers: {
                        Authorization: 'Basic ' + btoa(username + ':' + password),
                        'Content-Type': 'application/json'
                    }
                })
                const data = await res.json()
                const traceData = data.data || []
                setTraces(traceData)
                if (data.meta) {
                    setTotal(data.meta.totalItems || traceData.length)
                    setTotalPages(data.meta.totalPages || 1)
                } else {
                    setTotal(traceData.length)
                    setTotalPages(1)
                }
                const projects = [...new Set(traceData.map((t) => t.project?.name || 'Unknown'))]
                setProjectTabs(projects)
                setActiveProject(projects[0] || '')

                // Fetch aggregated data for total cost calculation
                await fetchAggregatedData(from, to)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        },
        [fetchAggregatedData]
    )

    useEffect(() => {
        fetchData(page, pageSize, fromTimestamp, toTimestamp)
    }, [page, fetchData, fromTimestamp, toTimestamp])

    const filteredTraces = traces.filter(
        (t) => (t.name?.toLowerCase() || '').includes(search.toLowerCase()) && (t.project?.name || 'Unknown') === activeProject
    )

    // Calculate total cost including nested metrics
    const calculateTotalCost = (trace) => {
        let totalCost = parseFloat(trace.totalCost || 0)

        // Add costs from nested metrics if they exist
        if (trace.metrics && Array.isArray(trace.metrics)) {
            trace.metrics.forEach((metric) => {
                if (metric.nested_metrics && Array.isArray(metric.nested_metrics)) {
                    metric.nested_metrics.forEach((nestedMetric) => {
                        if (nestedMetric.totalCost) {
                            // Extract numeric value from formatted cost string (e.g., "$ 0.001" -> 0.001)
                            const costValue = parseFloat(nestedMetric.totalCost.replace(/[^\d.-]/g, '')) || 0
                            totalCost += costValue
                        }
                    })
                }
            })
        }

        return totalCost
    }

    const avgLatency = filteredTraces.length > 0 ? filteredTraces.reduce((sum, t) => sum + (t.latency || 0), 0) / filteredTraces.length : 0

    const labels = filteredTraces.map((t) =>
        new Date(t.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
    )

    const getChartData = (label, dataPoints, color) => {
        const ctx = chartRef.current?.ctx
        const gradient = ctx ? createGradient(ctx, color) : color
        return {
            labels,
            datasets: [
                {
                    label,
                    data: dataPoints,
                    fill: true,
                    backgroundColor: gradient,
                    borderColor: color,
                    pointBackgroundColor: theme.palette.common.white,
                    pointBorderColor: color,
                    pointHoverRadius: 7,
                    borderWidth: 3,
                    tension: 0.45
                }
            ]
        }
    }

    const traceChartData = getChartData(
        'Traces',
        filteredTraces.map(() => 1),
        theme.palette.primary.main
    )
    const costChartData = getChartData(
        'Cost',
        filteredTraces.map((t) => calculateTotalCost(t)),
        theme.palette.primary.main
    )

    const applyFilters = () => {
        setPage(1)
        fetchData(1, pageSize, fromTimestamp, toTimestamp)
    }

    const clearFilters = () => {
        setFromTimestamp('')
        setToTimestamp('')
        setPage(1)
        fetchData(1, pageSize, '', '')
    }

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
                    {/* Single Combined Background Box */}
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
                                    <IconChartHistogram size={28} color={theme.palette.primary.main} />
                                    <Typography
                                        variant='h3'
                                        sx={{
                                            fontWeight: 700,
                                            color: theme.palette.text.primary
                                        }}
                                    >
                                        Dashboard
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
                                    Monitor your traces, costs, and latency in real time
                                </Typography>
                            </Box>

                            {/* Stats Cards */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <StatCard title='Total Traces' value={total} icon={<IconChartHistogram size={24} />} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <StatCard
                                        title='Total Cost'
                                        value={`$${totalCost.toFixed(6)}`}
                                        icon={<IconChartHistogram size={24} />}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <StatCard
                                        title='Avg. Latency'
                                        value={`${(totalLatency / Math.max(total, 1)).toFixed(2)}s`}
                                        icon={<IconChartHistogram size={24} />}
                                    />
                                </Grid>
                            </Grid>

                            {/* Filter UI */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    mb: 3,
                                    borderRadius: 3,
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
                                        theme.palette.background.default,
                                        0.6
                                    )} 100%)`,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <Stack spacing={3}>
                                    <Grid container spacing={3} alignItems='center'>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Stack spacing={1}>
                                                <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                                    From:
                                                </Typography>
                                                <TextField
                                                    type='datetime-local'
                                                    value={fromTimestamp}
                                                    onChange={(e) => setFromTimestamp(e.target.value)}
                                                    size='small'
                                                    fullWidth
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            backgroundColor: theme.palette.background.paper,
                                                            fontSize: '0.95rem',
                                                            border: 'none',
                                                            boxShadow: `0 2px 8px ${alpha(theme.palette.grey[500], 0.1)}`,
                                                            transition: 'all 0.3s ease-in-out',
                                                            minHeight: '48px',
                                                            '&:hover': {
                                                                transform: 'translateY(-1px)',
                                                                boxShadow: `0 4px 16px ${alpha(theme.palette.grey[500], 0.15)}`
                                                            },
                                                            '&.Mui-focused': {
                                                                boxShadow: `0 0 0 3px ${alpha(
                                                                    theme.palette.primary.main,
                                                                    0.1
                                                                )}, 0 4px 16px ${alpha(theme.palette.grey[500], 0.15)}`
                                                            },
                                                            '& fieldset': {
                                                                border: 'none'
                                                            }
                                                        },
                                                        '& input[type="datetime-local"]': {
                                                            fontSize: '0.875rem',
                                                            padding: '12px 14px',
                                                            '&::-webkit-calendar-picker-indicator': {
                                                                filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Stack spacing={1}>
                                                <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                                    To:
                                                </Typography>
                                                <TextField
                                                    type='datetime-local'
                                                    value={toTimestamp}
                                                    onChange={(e) => setToTimestamp(e.target.value)}
                                                    size='small'
                                                    fullWidth
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            backgroundColor: theme.palette.background.paper,
                                                            fontSize: '0.95rem',
                                                            border: 'none',
                                                            boxShadow: `0 2px 8px ${alpha(theme.palette.grey[500], 0.1)}`,
                                                            transition: 'all 0.3s ease-in-out',
                                                            minHeight: '48px',
                                                            '&:hover': {
                                                                transform: 'translateY(-1px)',
                                                                boxShadow: `0 4px 16px ${alpha(theme.palette.grey[500], 0.15)}`
                                                            },
                                                            '&.Mui-focused': {
                                                                boxShadow: `0 0 0 3px ${alpha(
                                                                    theme.palette.primary.main,
                                                                    0.1
                                                                )}, 0 4px 16px ${alpha(theme.palette.grey[500], 0.15)}`
                                                            },
                                                            '& fieldset': {
                                                                border: 'none'
                                                            }
                                                        },
                                                        '& input[type="datetime-local"]': {
                                                            fontSize: '0.875rem',
                                                            padding: '12px 14px',
                                                            '&::-webkit-calendar-picker-indicator': {
                                                                filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Button
                                                variant='contained'
                                                onClick={applyFilters}
                                                startIcon={<IconFilter />}
                                                fullWidth
                                                sx={{
                                                    borderRadius: 2,
                                                    py: 1.5,
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                                    '&:hover': {
                                                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                                                    },
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    minHeight: '48px'
                                                }}
                                            >
                                                Apply Filters
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Button
                                                variant='outlined'
                                                onClick={clearFilters}
                                                fullWidth
                                                sx={{
                                                    borderRadius: 2,
                                                    py: 1.5,
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    borderColor: theme.palette.divider,
                                                    color: theme.palette.text.secondary,
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.grey[500], 0.05),
                                                        borderColor: theme.palette.grey[500],
                                                        transform: 'translateY(-1px)'
                                                    },
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    minHeight: '48px'
                                                }}
                                            >
                                                Clear
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Stack>
                            </Paper>

                            {/* Charts Section */}
                            <Box sx={{ mt: 4 }}>
                                <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
                                    Analytics Overview
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ height: 340, p: 2 }}>
                                            <Line
                                                ref={chartRef}
                                                data={traceChartData}
                                                options={getEnhancedChartOptions('Traces', theme, '', 'Time', 'Traces')}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ height: 340, p: 2 }}>
                                            <Line
                                                data={costChartData}
                                                options={getEnhancedChartOptions('Cost', theme, '$', 'Time', 'Cost ($)')}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Table Section */}
                            {loading ? (
                                <Box sx={{ mt: 4 }}>
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
                                </Box>
                            ) : error ? (
                                <Box
                                    sx={{
                                        mt: 4,
                                        p: 4,
                                        textAlign: 'center',
                                        backgroundColor: alpha(theme.palette.error.main, 0.02),
                                        borderRadius: 3,
                                        border: `2px solid ${alpha(theme.palette.error.main, 0.1)}`,
                                        color: theme.palette.error.main
                                    }}
                                >
                                    <Typography variant='h6' color='error'>
                                        {error}
                                    </Typography>
                                </Box>
                            ) : (
                                <Fade in timeout={600}>
                                    <Box sx={{ mt: 4 }}>
                                        <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 3 }}>
                                            <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                                Trace Data
                                            </Typography>
                                            <TextField
                                                placeholder='Search by name'
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                size='small'
                                                sx={{
                                                    maxWidth: { xs: '100%', sm: 300 },
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        backgroundColor: theme.palette.background.paper,
                                                        fontSize: '0.875rem',
                                                        border: 'none',
                                                        boxShadow: `0 2px 8px ${alpha(theme.palette.grey[500], 0.1)}`,
                                                        transition: 'all 0.3s ease-in-out',
                                                        '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: `0 4px 16px ${alpha(theme.palette.grey[500], 0.15)}`
                                                        },
                                                        '&.Mui-focused': {
                                                            boxShadow: `0 0 0 3px ${alpha(
                                                                theme.palette.primary.main,
                                                                0.1
                                                            )}, 0 4px 16px ${alpha(theme.palette.grey[500], 0.15)}`
                                                        },
                                                        '& fieldset': {
                                                            border: 'none'
                                                        }
                                                    }
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position='start'>
                                                            <IconSearch size={18} color={theme.palette.text.secondary} />
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Stack>

                                        <Box sx={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                                <thead>
                                                    <tr
                                                        style={{
                                                            backgroundColor: theme.palette.grey[100],
                                                            borderBottom: `2px solid ${theme.palette.divider}`
                                                        }}
                                                    >
                                                        <th
                                                            style={{
                                                                padding: '16px 12px',
                                                                textAlign: 'left',
                                                                fontWeight: '600',
                                                                color: theme.palette.text.primary,
                                                                borderBottom: 'none'
                                                            }}
                                                        >
                                                            ID
                                                        </th>
                                                        <th
                                                            style={{
                                                                padding: '16px 12px',
                                                                textAlign: 'left',
                                                                fontWeight: '600',
                                                                color: theme.palette.text.primary,
                                                                borderBottom: 'none'
                                                            }}
                                                        >
                                                            Name
                                                        </th>
                                                        <th
                                                            style={{
                                                                padding: '16px 12px',
                                                                textAlign: 'left',
                                                                fontWeight: '600',
                                                                color: theme.palette.text.primary,
                                                                borderBottom: 'none'
                                                            }}
                                                        >
                                                            Latency
                                                        </th>
                                                        <th
                                                            style={{
                                                                padding: '16px 12px',
                                                                textAlign: 'left',
                                                                fontWeight: '600',
                                                                color: theme.palette.text.primary,
                                                                borderBottom: 'none'
                                                            }}
                                                        >
                                                            Cost
                                                        </th>
                                                        <th
                                                            style={{
                                                                padding: '16px 12px',
                                                                textAlign: 'left',
                                                                fontWeight: '600',
                                                                color: theme.palette.text.primary,
                                                                borderBottom: 'none'
                                                            }}
                                                        >
                                                            Environment
                                                        </th>
                                                        <th
                                                            style={{
                                                                padding: '16px 12px',
                                                                textAlign: 'left',
                                                                fontWeight: '600',
                                                                color: theme.palette.text.primary,
                                                                borderBottom: 'none'
                                                            }}
                                                        >
                                                            Created
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredTraces.map((trace) => (
                                                        <tr
                                                            key={trace.id}
                                                            onClick={() => setSelectedTrace(trace)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                backgroundColor: theme.palette.background.paper,
                                                                borderRadius: '8px',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                transition: 'all 0.2s ease',
                                                                marginBottom: '8px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-2px)'
                                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)'
                                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding: '16px 12px',
                                                                    borderBottom: 'none',
                                                                    borderTopLeftRadius: '8px',
                                                                    borderBottomLeftRadius: '8px'
                                                                }}
                                                            >
                                                                {trace.id.slice(0, 8)}...
                                                            </td>
                                                            <td style={{ padding: '16px 12px', borderBottom: 'none' }}>{trace.name}</td>
                                                            <td style={{ padding: '16px 12px', borderBottom: 'none' }}>
                                                                {trace.latency?.toFixed(2)}s
                                                            </td>
                                                            <td style={{ padding: '16px 12px', borderBottom: 'none' }}>
                                                                ${calculateTotalCost(trace).toFixed(4)}
                                                            </td>
                                                            <td style={{ padding: '16px 12px', borderBottom: 'none' }}>
                                                                <Badge
                                                                    text={trace.environment || 'default'}
                                                                    bg={theme.palette.secondary.light}
                                                                    textColor={theme?.customization?.isDarkMode ? 'white' : 'black'}
                                                                />
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding: '16px 12px',
                                                                    borderBottom: 'none',
                                                                    borderTopRightRadius: '8px',
                                                                    borderBottomRightRadius: '8px'
                                                                }}
                                                            >
                                                                {new Date(trace.createdAt).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Box>

                                        {/* Pagination Controls - Moved to bottom */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mt: 4,
                                                pt: 3,
                                                borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                            }}
                                        >
                                            <Typography variant='body2' color='text.secondary'>
                                                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} entries
                                            </Typography>

                                            <Stack direction='row' spacing={2} alignItems='center'>
                                                <Button
                                                    variant='outlined'
                                                    onClick={() => setPage(page - 1)}
                                                    disabled={page === 1}
                                                    startIcon={
                                                        <Box component='span' sx={{ fontSize: '1.2rem' }}>
                                                            ‹
                                                        </Box>
                                                    }
                                                    sx={{
                                                        borderRadius: 2,
                                                        px: 3,
                                                        py: 1,
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        textTransform: 'none',
                                                        borderColor: theme.palette.divider,
                                                        color: page === 1 ? theme.palette.text.disabled : theme.palette.primary.main,
                                                        backgroundColor: page === 1 ? alpha(theme.palette.grey[500], 0.05) : 'transparent',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                page === 1
                                                                    ? alpha(theme.palette.grey[500], 0.05)
                                                                    : alpha(theme.palette.primary.main, 0.05),
                                                            borderColor: page === 1 ? theme.palette.divider : theme.palette.primary.main,
                                                            transform: page === 1 ? 'none' : 'translateY(-1px)',
                                                            boxShadow:
                                                                page === 1
                                                                    ? 'none'
                                                                    : `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                                                        },
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }}
                                                >
                                                    Previous
                                                </Button>

                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        px: 3,
                                                        py: 1.5,
                                                        borderRadius: 2,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                                    }}
                                                >
                                                    <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                                        Page {page} of {totalPages}
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    variant='outlined'
                                                    onClick={() => setPage(page + 1)}
                                                    disabled={page === totalPages}
                                                    endIcon={
                                                        <Box component='span' sx={{ fontSize: '1.2rem' }}>
                                                            ›
                                                        </Box>
                                                    }
                                                    sx={{
                                                        borderRadius: 2,
                                                        px: 3,
                                                        py: 1,
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        textTransform: 'none',
                                                        borderColor: theme.palette.divider,
                                                        color:
                                                            page === totalPages ? theme.palette.text.disabled : theme.palette.primary.main,
                                                        backgroundColor:
                                                            page === totalPages ? alpha(theme.palette.grey[500], 0.05) : 'transparent',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                page === totalPages
                                                                    ? alpha(theme.palette.grey[500], 0.05)
                                                                    : alpha(theme.palette.primary.main, 0.05),
                                                            borderColor:
                                                                page === totalPages ? theme.palette.divider : theme.palette.primary.main,
                                                            transform: page === totalPages ? 'none' : 'translateY(-1px)',
                                                            boxShadow:
                                                                page === totalPages
                                                                    ? 'none'
                                                                    : `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                                                        },
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }}
                                                >
                                                    Next
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Fade>
                            )}
                        </Stack>
                    </Paper>

                    {selectedTrace && (
                        <div
                            role='button'
                            tabIndex={0}
                            onClick={() => setSelectedTrace(null)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') setSelectedTrace(null)
                            }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                height: '100vh',
                                width: '100vw',
                                background: '#000000aa',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 999,
                                padding: '20px'
                            }}
                        >
                            <div
                                role='dialog'
                                aria-modal='true'
                                // Removed onClick handler from dialog itself to fix accessibility error
                                style={{
                                    background: theme.palette.background.paper,
                                    padding: '30px',
                                    borderRadius: '16px',
                                    width: '700px',
                                    maxWidth: '90vw',
                                    maxHeight: '80vh',
                                    overflowY: 'auto',
                                    position: 'relative',
                                    top: '45%',
                                    left: '30%',
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <h2 style={{ marginBottom: 18 }}>{selectedTrace.name}</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 18 }}>
                                    <div
                                        style={{
                                            background: theme.palette.mode === 'dark' ? '#23272f' : '#f6f8fa',
                                            color: theme.palette.text.primary,
                                            fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                            fontSize: '14px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${theme.palette.divider}`,
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>ID:</span>{' '}
                                        <span style={{ wordBreak: 'break-all' }}>{selectedTrace.id}</span>
                                    </div>
                                    <div
                                        style={{
                                            background: theme.palette.mode === 'dark' ? '#23272f' : '#f6f8fa',
                                            color: theme.palette.text.primary,
                                            fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                            fontSize: '14px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${theme.palette.divider}`,
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>Environment:</span> <span>{selectedTrace.environment}</span>
                                    </div>
                                    <div
                                        style={{
                                            background: theme.palette.mode === 'dark' ? '#23272f' : '#f6f8fa',
                                            color: theme.palette.text.primary,
                                            fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                            fontSize: '14px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${theme.palette.divider}`,
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>Session:</span>{' '}
                                        <span style={{ wordBreak: 'break-all' }}>{selectedTrace.sessionId}</span>
                                    </div>
                                    <div
                                        style={{
                                            background: theme.palette.mode === 'dark' ? '#23272f' : '#f6f8fa',
                                            color: theme.palette.text.primary,
                                            fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                            fontSize: '14px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${theme.palette.divider}`,
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>Latency:</span> <span>{selectedTrace.latency}s</span>
                                    </div>
                                    <div
                                        style={{
                                            background: theme.palette.mode === 'dark' ? '#23272f' : '#f6f8fa',
                                            color: theme.palette.text.primary,
                                            fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                            fontSize: '14px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${theme.palette.divider}`,
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>Cost:</span>{' '}
                                        <span>${calculateTotalCost(selectedTrace).toFixed(6)}</span>
                                    </div>
                                    <div
                                        style={{
                                            background: theme.palette.mode === 'dark' ? '#23272f' : '#f6f8fa',
                                            color: theme.palette.text.primary,
                                            fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                            fontSize: '14px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${theme.palette.divider}`,
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>Created At:</span>{' '}
                                        <span>{new Date(selectedTrace.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <hr style={{ margin: '18px 0' }} />
                                <div style={{ marginBottom: 10, fontWeight: 600 }}>Input:</div>
                                <pre
                                    style={{
                                        background: theme.palette.mode === 'dark' ? '#23272f' : '#f6f8fa',
                                        color: theme.palette.text.primary,
                                        fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                        fontSize: '14px',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        maxHeight: '120px',
                                        overflow: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        marginBottom: '22px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    {JSON.stringify(selectedTrace.input, null, 2)}
                                </pre>
                                <div style={{ marginBottom: 10, fontWeight: 600 }}>Output:</div>
                                <pre
                                    style={{
                                        background: theme.palette.mode === 'dark' ? '#23272f' : '#f6f8fa',
                                        color: theme.palette.text.primary,
                                        fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                        fontSize: '14px',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        maxHeight: '220px',
                                        overflow: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        marginBottom: '8px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    {typeof selectedTrace.output === 'string'
                                        ? selectedTrace.output
                                        : JSON.stringify(selectedTrace.output, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </Stack>
            </MainCard>
        </Container>
    )
}

StatCard.propTypes = {
    title: PropTypes.string,
    value: PropTypes.any,
    icon: PropTypes.element
}

Badge.propTypes = {
    text: PropTypes.string,
    bg: PropTypes.string,
    textColor: PropTypes.string
}

export default CognifuseDashboard
