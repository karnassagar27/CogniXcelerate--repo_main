import PropTypes from 'prop-types'
import { Handle, Position, useUpdateNodeInternals } from 'reactflow'
import { useEffect, useRef, useState, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { cloneDeep } from 'lodash'
import showdown from 'showdown'

// material-ui
import { useTheme, styled } from '@mui/material/styles'
import {
    Popper,
    Box,
    Typography,
    Tooltip,
    IconButton,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip
} from '@mui/material'
import { useGridApiContext } from '@mui/x-data-grid'
import IconAutoFixHigh from '@mui/icons-material/AutoFixHigh'
import { tooltipClasses } from '@mui/material/Tooltip'
import { IconWand, IconVariable, IconArrowsMaximize, IconEdit, IconAlertTriangle, IconBulb, IconRefresh, IconX } from '@tabler/icons-react'
import { Tabs } from '@mui/base/Tabs'
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete'

// project import
import { Dropdown } from '@/ui-component/dropdown/Dropdown'
import { MultiDropdown } from '@/ui-component/dropdown/MultiDropdown'
import { AsyncDropdown } from '@/ui-component/dropdown/AsyncDropdown'
import { Input } from '@/ui-component/input/Input'
import { RichInput } from '@/ui-component/input/RichInput'
import { DataGrid } from '@/ui-component/grid/DataGrid'
import { File } from '@/ui-component/file/File'
import { SwitchInput } from '@/ui-component/switch/Switch'
import { flowContext } from '@/store/context/ReactFlowContext'
import { JsonEditorInput } from '@/ui-component/json/JsonEditor'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import { CodeEditor } from '@/ui-component/editor/CodeEditor'
import { TabPanel } from '@/ui-component/tabs/TabPanel'
import { TabsList } from '@/ui-component/tabs/TabsList'
import { ArrayRenderer } from '@/ui-component/array/ArrayRenderer'
import { Tab } from '@/ui-component/tabs/Tab'
import { ConfigInput } from '@/views/agentflowsv2/ConfigInput'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'
import DocStoreInputHandler from '@/views/docstore/DocStoreInputHandler'

import ToolDialog from '@/views/tools/ToolDialog'
import AssistantDialog from '@/views/assistants/openai/AssistantDialog'
import FormatPromptValuesDialog from '@/ui-component/dialog/FormatPromptValuesDialog'
import ExpandTextDialog from '@/ui-component/dialog/ExpandTextDialog'
import ExpandRichInputDialog from '@/ui-component/dialog/ExpandRichInputDialog'
import ConditionDialog from '@/ui-component/dialog/ConditionDialog'
import PromptLangsmithHubDialog from '@/ui-component/dialog/PromptLangsmithHubDialog'
import ManageScrapedLinksDialog from '@/ui-component/dialog/ManageScrapedLinksDialog'
import CredentialInputHandler from './CredentialInputHandler'
import InputHintDialog from '@/ui-component/dialog/InputHintDialog'
import NvidiaNIMDialog from '@/ui-component/dialog/NvidiaNIMDialog'
import PromptGeneratorDialog from '@/ui-component/dialog/PromptGeneratorDialog'
import PromptVersionSelectionDialog from '@/ui-component/dialog/PromptVersionSelectionDialog'

// API
import assistantsApi from '@/api/assistants'
import documentstoreApi from '@/api/documentstore'
import promptApi from '@/api/prompt'

// utils
import {
    initNode,
    getInputVariables,
    getCustomConditionOutputs,
    isValidConnection,
    getAvailableNodesForVariable
} from '@/utils/genericHelper'
import useNotifier from '@/utils/useNotifier'

// const
import { baseURL, FLOWISE_CREDENTIAL_ID } from '@/store/constant'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'

const EDITABLE_OPTIONS = ['selectedTool', 'selectedAssistant']

const CustomWidthTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)({
    [`& .${tooltipClasses.tooltip}`]: {
        maxWidth: 500
    }
})

const StyledPopper = styled(Popper)({
    boxShadow: '0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)',
    borderRadius: '10px',
    [`& .${autocompleteClasses.listbox}`]: {
        boxSizing: 'border-box',
        '& ul': {
            padding: 10,
            margin: 10
        }
    }
})

const markdownConverter = new showdown.Converter({
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true
})

// Utility to extract variables from a prompt template string
function extractPromptVariables(template) {
    const regex = /{([a-zA-Z0-9_]+)}/g
    const vars = new Set()
    let match
    while ((match = regex.exec(template)) !== null) {
        vars.add(match[1])
    }
    return Array.from(vars)
}

// ===========================|| NodeInputHandler ||=========================== //

const NodeInputHandler = ({
    inputAnchor,
    inputParam,
    data,
    disabled = false,
    isAdditionalParams = false,
    disablePadding = false,
    parentParamForArray = null,
    arrayIndex = null,
    onHideNodeInfoDialog,
    onCustomDataChange
}) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const ref = useRef(null)
    const { reactFlowInstance, deleteEdge, onNodeDataChange } = useContext(flowContext)
    const updateNodeInternals = useUpdateNodeInternals()

    useNotifier()
    const dispatch = useDispatch()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [position, setPosition] = useState(0)
    const [showExpandDialog, setShowExpandDialog] = useState(false)
    const [expandDialogProps, setExpandDialogProps] = useState({})
    const [showExpandRichDialog, setShowExpandRichDialog] = useState(false)
    const [expandRichDialogProps, setExpandRichDialogProps] = useState({})
    const [showAsyncOptionDialog, setAsyncOptionEditDialog] = useState('')
    const [asyncOptionEditDialogProps, setAsyncOptionEditDialogProps] = useState({})
    const [reloadTimestamp, setReloadTimestamp] = useState(Date.now().toString())
    const [showFormatPromptValuesDialog, setShowFormatPromptValuesDialog] = useState(false)
    const [formatPromptValuesDialogProps, setFormatPromptValuesDialogProps] = useState({})
    const [showPromptHubDialog, setShowPromptHubDialog] = useState(false)
    const [showManageScrapedLinksDialog, setShowManageScrapedLinksDialog] = useState(false)
    const [manageScrapedLinksDialogProps, setManageScrapedLinksDialogProps] = useState({})
    const [showInputHintDialog, setShowInputHintDialog] = useState(false)
    const [inputHintDialogProps, setInputHintDialogProps] = useState({})
    const [showConditionDialog, setShowConditionDialog] = useState(false)
    const [conditionDialogProps, setConditionDialogProps] = useState({})
    const [isNvidiaNIMDialogOpen, setIsNvidiaNIMDialogOpen] = useState(false)
    const [tabValue, setTabValue] = useState(0)

    const [modelSelectionDialogOpen, setModelSelectionDialogOpen] = useState(false)
    const [availableChatModels, setAvailableChatModels] = useState([])
    const [availableChatModelsOptions, setAvailableChatModelsOptions] = useState([])
    const [selectedTempChatModel, setSelectedTempChatModel] = useState({})
    const [modelSelectionCallback, setModelSelectionCallback] = useState(null)

    const [promptGeneratorDialogOpen, setPromptGeneratorDialogOpen] = useState(false)
    const [promptGeneratorDialogProps, setPromptGeneratorDialogProps] = useState({})

    // Langfuse prompt state
    const [showLangfusePromptDialog, setShowLangfusePromptDialog] = useState(false)
    const [langfusePrompts, setLangfusePrompts] = useState([])
    const [langfusePromptLoading, setLangfusePromptLoading] = useState(false)
    const [langfusePromptError, setLangfusePromptError] = useState('')

    // Version selection dialog state
    const [showVersionSelectionDialog, setShowVersionSelectionDialog] = useState(false)
    const [selectedPromptForVersion, setSelectedPromptForVersion] = useState(null)
    const [promptVersions, setPromptVersions] = useState([])

    // Loading states
    const [docStoreLoading, setDocStoreLoading] = useState(false)



    const handleDataChange = ({ inputParam, newValue }) => {
        data.inputs[inputParam.name] = newValue
        const allowedShowHideInputTypes = ['boolean', 'asyncOptions', 'asyncMultiOptions', 'options', 'multiOptions']
        if (allowedShowHideInputTypes.includes(inputParam.type)) {
            if (onCustomDataChange) {
                onCustomDataChange({ nodeId: data.id, inputParam, newValue })
            } else {
                onNodeDataChange({ nodeId: data.id, inputParam, newValue })
            }
        }
    }

    const onInputHintDialogClicked = (hint) => {
        const dialogProps = {
            ...hint
        }
        setInputHintDialogProps(dialogProps)
        setShowInputHintDialog(true)
    }

    const onExpandDialogClicked = (value, inputParam, languageType) => {
        const dialogProps = {
            value,
            inputParam,
            disabled,
            languageType,
            nodes: reactFlowInstance?.getNodes() || [],
            edges: reactFlowInstance?.getEdges() || [],
            nodeId: data.id,
            confirmButtonName: 'Save',
            cancelButtonName: 'Cancel'
        }
        if (inputParam.acceptVariable) {
            setExpandRichDialogProps(dialogProps)
            setShowExpandRichDialog(true)
        } else {
            setExpandDialogProps(dialogProps)
            setShowExpandDialog(true)
        }
    }

    const onConditionDialogClicked = (inputParam) => {
        const dialogProps = {
            data,
            inputParam,
            disabled,
            confirmButtonName: 'Save',
            cancelButtonName: 'Cancel'
        }
        setConditionDialogProps(dialogProps)
        setShowConditionDialog(true)
        onHideNodeInfoDialog(true)
    }

    const onShowPromptHubButtonClicked = () => {
        setShowPromptHubDialog(true)
    }

    const onShowPromptHubButtonSubmit = (templates) => {
        setShowPromptHubDialog(false)
        for (const t of templates) {
            if (Object.prototype.hasOwnProperty.call(data.inputs, t.type)) {
                data.inputs[t.type] = t.template
            }
        }
    }

    const onManageLinksDialogClicked = (url, selectedLinks, relativeLinksMethod, limit) => {
        const dialogProps = {
            url,
            relativeLinksMethod,
            limit,
            selectedLinks,
            confirmButtonName: 'Save',
            cancelButtonName: 'Cancel'
        }
        setManageScrapedLinksDialogProps(dialogProps)
        setShowManageScrapedLinksDialog(true)
    }

    const onManageLinksDialogSave = (url, links) => {
        setShowManageScrapedLinksDialog(false)
        data.inputs.url = url
        data.inputs.selectedLinks = links
    }

    const getJSONValue = (templateValue) => {
        if (!templateValue) return ''
        const obj = {}
        const inputVariables = getInputVariables(templateValue)
        for (const inputVariable of inputVariables) {
            obj[inputVariable] = ''
        }
        if (Object.keys(obj).length) return JSON.stringify(obj)
        return ''
    }

    const getDataGridColDef = (columns, inputParam) => {
        const colDef = []
        for (const column of columns) {
            const stateNode = reactFlowInstance ? reactFlowInstance.getNodes().find((node) => node.data.name === 'seqState') : null
            if (column.type === 'asyncSingleSelect' && column.loadMethod && column.loadMethod.includes('loadStateKeys')) {
                if (stateNode) {
                    const tabParam = stateNode.data.inputParams.find((param) => param.tabIdentifier)
                    if (tabParam && tabParam.tabs.length > 0) {
                        const selectedTabIdentifier = tabParam.tabIdentifier

                        const selectedTab =
                            stateNode.data.inputs[`${selectedTabIdentifier}_${stateNode.data.id}`] ||
                            tabParam.default ||
                            tabParam.tabs[0].name

                        const datagridValues = stateNode.data.inputs[selectedTab]
                        if (datagridValues) {
                            try {
                                const parsedDatagridValues = JSON.parse(datagridValues)
                                const keys = Array.isArray(parsedDatagridValues)
                                    ? parsedDatagridValues.map((item) => item.key)
                                    : Object.keys(parsedDatagridValues)
                                colDef.push({
                                    ...column,
                                    field: column.field,
                                    headerName: column.headerName,
                                    type: 'singleSelect',
                                    editable: true,
                                    valueOptions: keys
                                })
                            } catch (error) {
                                console.error('Error parsing stateMemory', error)
                            }
                        }
                    }
                } else {
                    colDef.push({
                        ...column,
                        field: column.field,
                        headerName: column.headerName,
                        type: 'singleSelect',
                        editable: true,
                        valueOptions: []
                    })
                }
            } else if (column.type === 'freeSolo') {
                const preLoadOptions = []
                if (column.loadMethod && column.loadMethod.includes('getPreviousMessages')) {
                    const nodes = getAvailableNodesForVariable(
                        reactFlowInstance?.getNodes() || [],
                        reactFlowInstance?.getEdges() || [],
                        data.id,
                        inputParam.id
                    )
                    for (const node of nodes) {
                        preLoadOptions.push({
                            value: `$${node.id}`,
                            label: `Output from ${node.data.id}`
                        })
                    }
                }
                if (column.loadMethod && column.loadMethod.includes('loadStateKeys')) {
                    if (stateNode) {
                        const tabParam = stateNode.data.inputParams.find((param) => param.tabIdentifier)
                        if (tabParam && tabParam.tabs.length > 0) {
                            const selectedTabIdentifier = tabParam.tabIdentifier

                            const selectedTab =
                                stateNode.data.inputs[`${selectedTabIdentifier}_${stateNode.data.id}`] ||
                                tabParam.default ||
                                tabParam.tabs[0].name

                            const datagridValues = stateNode.data.inputs[selectedTab]
                            if (datagridValues) {
                                try {
                                    const parsedDatagridValues = JSON.parse(datagridValues)
                                    const keys = Array.isArray(parsedDatagridValues)
                                        ? parsedDatagridValues.map((item) => item.key)
                                        : Object.keys(parsedDatagridValues)
                                    for (const key of keys) {
                                        preLoadOptions.push({
                                            value: `$flow.state.${key}`,
                                            label: `Value from ${key}`
                                        })
                                    }
                                } catch (error) {
                                    console.error('Error parsing stateMemory', error)
                                }
                            }
                        }
                    }
                }
                colDef.push({
                    ...column,
                    field: column.field,
                    headerName: column.headerName,
                    renderEditCell: ({ id, field, value }) => {
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        const apiRef = useGridApiContext()
                        return (
                            <Autocomplete
                                id={column.field}
                                freeSolo
                                fullWidth
                                options={[...preLoadOptions, ...column.valueOptions]}
                                value={value}
                                PopperComponent={StyledPopper}
                                renderInput={(params) => <TextField {...params} />}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <div>
                                            <strong>{option.value}</strong>
                                            <br />
                                            <small>{option.label}</small>
                                        </div>
                                    </li>
                                )}
                                getOptionLabel={(option) => {
                                    return typeof option === 'string' ? option : option.value
                                }}
                                onInputChange={(event, newValue) => {
                                    apiRef.current.setEditCellValue({ id, field, value: newValue })
                                }}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        height: '50px' // Adjust this value as needed
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        border: 'none'
                                    },
                                    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                                        border: 'none'
                                    }
                                }}
                            />
                        )
                    }
                })
            } else {
                colDef.push(column)
            }
        }
        return colDef
    }

    const getDropdownOptions = (inputParam) => {
        const preLoadOptions = []
        if (inputParam.loadPreviousNodes) {
            const nodes = getAvailableNodesForVariable(
                reactFlowInstance?.getNodes() || [],
                reactFlowInstance?.getEdges() || [],
                data.id,
                inputParam.id
            )
            for (const node of nodes) {
                preLoadOptions.push({
                    name: `{{ ${node.data.id} }}`,
                    label: `{{ ${node.data.id} }}`,
                    description: `Output from ${node.data.id}`
                })
            }
        }
        return [...preLoadOptions, ...inputParam.options]
    }

    const getTabValue = (inputParam) => {
        return inputParam.tabs.findIndex((item) => item.name === data.inputs[`${inputParam.tabIdentifier}_${data.id}`]) >= 0
            ? inputParam.tabs.findIndex((item) => item.name === data.inputs[`${inputParam.tabIdentifier}_${data.id}`])
            : tabValue
    }

    const onEditJSONClicked = (value, inputParam) => {
        // Preset values if the field is format prompt values
        let inputValue = value
        if (inputParam.name === 'promptValues' && !value) {
            const templateValue =
                (data.inputs['template'] ?? '') +
                (data.inputs['systemMessagePrompt'] ?? '') +
                (data.inputs['humanMessagePrompt'] ?? '') +
                (data.inputs['workerPrompt'] ?? '')
            inputValue = getJSONValue(templateValue)
        }
        const dialogProp = {
            value: inputValue,
            inputParam,
            nodes: reactFlowInstance?.getNodes() || [],
            edges: reactFlowInstance?.getEdges() || [],
            nodeId: data.id,
            data
        }
        setFormatPromptValuesDialogProps(dialogProp)
        setShowFormatPromptValuesDialog(true)
    }

    const onExpandDialogSave = (newValue, inputParamName) => {
        data.inputs[inputParamName] = newValue
        setShowExpandDialog(false)
    }

    const onExpandRichDialogSave = (newValue, inputParamName) => {
        data.inputs[inputParamName] = newValue
        setShowExpandRichDialog(false)
    }

    const onConditionDialogSave = (newData, inputParam, tabValue) => {
        data.inputs[`${inputParam.tabIdentifier}_${data.id}`] = inputParam.tabs[tabValue].name

        const existingEdges = reactFlowInstance?.getEdges().filter((edge) => edge.source === data.id) || []
        const { outputAnchors, toBeRemovedEdgeIds } = getCustomConditionOutputs(
            newData.inputs[inputParam.tabs[tabValue].name],
            data.id,
            existingEdges,
            inputParam.tabs[tabValue].type === 'datagrid'
        )
        if (!outputAnchors) return
        data.outputAnchors = outputAnchors
        for (const edgeId of toBeRemovedEdgeIds) {
            deleteEdge(edgeId)
        }
        setShowConditionDialog(false)
        onHideNodeInfoDialog(false)
    }

    const editAsyncOption = (inputParamName, inputValue) => {
        if (inputParamName === 'selectedTool') {
            setAsyncOptionEditDialogProps({
                title: 'Edit Tool',
                type: 'EDIT',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Save',
                toolId: inputValue
            })
        } else if (inputParamName === 'selectedAssistant') {
            setAsyncOptionEditDialogProps({
                title: 'Edit Assistant',
                type: 'EDIT',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Save',
                assistantId: inputValue
            })
        }
        setAsyncOptionEditDialog(inputParamName)
    }

    const addAsyncOption = (inputParamName) => {
        if (inputParamName === 'selectedTool') {
            setAsyncOptionEditDialogProps({
                title: 'Add New Tool',
                type: 'ADD',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Add'
            })
        } else if (inputParamName === 'selectedAssistant') {
            setAsyncOptionEditDialogProps({
                title: 'Add New Assistant',
                type: 'ADD',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Add'
            })
        }
        setAsyncOptionEditDialog(inputParamName)
    }

    const onConfirmAsyncOption = (selectedOptionId = '') => {
        if (!selectedOptionId) {
            data.inputs[showAsyncOptionDialog] = ''
            handleDataChange({ inputParam: { name: showAsyncOptionDialog }, newValue: '' })
        } else {
            data.inputs[showAsyncOptionDialog] = selectedOptionId
            handleDataChange({ inputParam: { name: showAsyncOptionDialog }, newValue: selectedOptionId })
            setReloadTimestamp(Date.now().toString())
        }
        setAsyncOptionEditDialogProps({})
        setAsyncOptionEditDialog('')
    }

    const handleNvidiaNIMDialogComplete = (containerData) => {
        if (containerData) {
            data.inputs['basePath'] = containerData.baseUrl
            data.inputs['modelName'] = containerData.image
        }
    }

    const loadChatModels = async () => {
        try {
            const resp = await assistantsApi.getChatModels()
            if (resp.data) {
                const chatModels = resp.data ?? []
                const chatModelsOptions = chatModels.map((model) => ({
                    name: model.name,
                    label: model.label,
                    description: model.description,
                    imageSrc: `${baseURL}/api/v1/node-icon/${model.name}`
                }))
                setAvailableChatModels(chatModels)
                setAvailableChatModelsOptions(chatModelsOptions)
            }
        } catch (error) {
            console.error('Error loading chat models:', error)
        }
    }

    const checkInputParamsMandatory = () => {
        let canSubmit = true

        if (selectedTempChatModel && Object.keys(selectedTempChatModel).length > 0) {
            const inputParams = (selectedTempChatModel.inputParams ?? []).filter((inputParam) => !inputParam.hidden)
            for (const inputParam of inputParams) {
                if (!inputParam.optional && (!selectedTempChatModel.inputs[inputParam.name] || !selectedTempChatModel.credential)) {
                    if (inputParam.type === 'credential' && !selectedTempChatModel.credential) {
                        canSubmit = false
                        break
                    } else if (inputParam.type !== 'credential' && !selectedTempChatModel.inputs[inputParam.name]) {
                        canSubmit = false
                        break
                    }
                }
            }
        }

        return canSubmit
    }

    const displayWarning = () => {
        enqueueSnackbar({
            message: 'Please fill in all mandatory fields.',
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'warning',
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        })
    }

    const generateDocStoreToolDesc = async (storeId) => {
        if (!storeId) {
            enqueueSnackbar({
                message: 'Please select a knowledge base',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            return
        }
        storeId = storeId.split(':')[0]
        const isValid = checkInputParamsMandatory()
        if (!isValid) {
            displayWarning()
            return
        }

        // Check if model is already selected in the node
        const currentNode = reactFlowInstance?.getNodes().find((node) => node.id === data.id)
        const currentNodeInputs = currentNode?.data?.inputs

        const existingModel = currentNodeInputs?.llmModel || currentNodeInputs?.agentModel || currentNodeInputs?.humanInputModel
        if (existingModel) {
            try {
                setDocStoreLoading(true)
                const selectedChatModelObj = {
                    name: existingModel,
                    inputs:
                        currentNodeInputs?.llmModelConfig || currentNodeInputs?.agentModelConfig || currentNodeInputs?.humanInputModelConfig
                }
                const resp = await documentstoreApi.generateDocStoreToolDesc(storeId, { selectedChatModel: selectedChatModelObj })
                if (resp.data) {
                    setDocStoreLoading(false)
                    const content = resp.data?.content || resp.data.kwargs?.content
                    // Update the input value directly
                    data.inputs[inputParam.name] = content
                    enqueueSnackbar({
                        message: 'Document Store Tool Description generated successfully',
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
            } catch (error) {
                console.error('Error generating doc store tool desc', error)
                setDocStoreLoading(false)
                enqueueSnackbar({
                    message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
            return
        }

        // If no model selected, load chat models and open model selection dialog
        await loadChatModels()
        setModelSelectionCallback(() => async (selectedModel) => {
            try {
                setDocStoreLoading(true)
                const selectedChatModelObj = {
                    name: selectedModel.name,
                    inputs: selectedModel.inputs
                }
                const resp = await documentstoreApi.generateDocStoreToolDesc(storeId, { selectedChatModel: selectedChatModelObj })
                if (resp.data) {
                    setDocStoreLoading(false)
                    const content = resp.data?.content || resp.data.kwargs?.content
                    // Update the input value directly
                    data.inputs[inputParam.name] = content
                    enqueueSnackbar({
                        message: 'Document Store Tool Description generated successfully',
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
            } catch (error) {
                console.error('Error generating doc store tool desc', error)
                setDocStoreLoading(false)
                enqueueSnackbar({
                    message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        })
        setModelSelectionDialogOpen(true)
    }

    const generateInstruction = async () => {
        const isValid = checkInputParamsMandatory()
        if (!isValid) {
            displayWarning()
            return
        }

        const currentNode = reactFlowInstance?.getNodes().find((node) => node.id === data.id)
        const currentNodeInputs = currentNode?.data?.inputs

        // Check if model is already selected in the node
        const existingModel = currentNodeInputs?.llmModel || currentNodeInputs?.agentModel || currentNodeInputs?.humanInputModel
        if (existingModel) {
            // Open prompt generator dialog directly with existing model
            setPromptGeneratorDialogProps({
                title: 'Generate Instructions',
                description: 'You can generate a prompt template by sharing basic details about your task.',
                data: {
                    selectedChatModel: {
                        name: existingModel,
                        inputs:
                            currentNodeInputs?.llmModelConfig ||
                            currentNodeInputs?.agentModelConfig ||
                            currentNodeInputs?.humanInputModelConfig
                    }
                }
            })
            setPromptGeneratorDialogOpen(true)
            return
        }

        // If no model selected, load chat models and open model selection dialog
        await loadChatModels()
        setModelSelectionCallback(() => async (selectedModel) => {
            // After model selection, open prompt generator dialog
            setPromptGeneratorDialogProps({
                title: 'Generate Instructions',
                description: 'You can generate a prompt template by sharing basic details about your task.',
                data: { selectedChatModel: selectedModel }
            })
            setPromptGeneratorDialogOpen(true)
        })
        setModelSelectionDialogOpen(true)
    }

    // Handler to open Langfuse prompt dialog
    const onAddLangfusePromptClicked = async () => {
        setLangfusePromptLoading(true)
        setLangfusePromptError('')
        setShowLangfusePromptDialog(true)
        try {
            const resp = await promptApi.getLangfusePrompts()
            let allPrompts = []
            
            // Handle new Langfuse API response structure
            if (resp.data && resp.data.data && Array.isArray(resp.data.data)) {
                allPrompts = resp.data.data
            } else if (resp.data && Array.isArray(resp.data)) {
                allPrompts = resp.data
            } else if (resp.data && Array.isArray(resp.data.prompts)) {
                allPrompts = resp.data.prompts
            }
            
            // Filter to show only production prompts and exclude deleted prompts
            const productionPrompts = allPrompts.filter(prompt => {
                // Check if prompt has labels
                if (prompt.labels && Array.isArray(prompt.labels)) {
                    // Must have production label AND must NOT have deleted label
                    return prompt.labels.includes('production') && !prompt.labels.includes('deleted')
                }
                return false
            })
            
            console.log(' All prompts:', allPrompts.length)
            console.log('Production prompts:', productionPrompts.length)
            console.log('Production prompts:', productionPrompts)
            
            setLangfusePrompts(productionPrompts)
            
            if (productionPrompts.length === 0) {
                setLangfusePromptError('No production prompts found. Please set a prompt as production first.')
            }
        } catch (err) {
            setLangfusePrompts([])
            setLangfusePromptError('Failed to fetch prompts from Langfuse.')
        } finally {
            setLangfusePromptLoading(false)
        }
    }

    // Handler for selecting a Langfuse prompt
    const onSelectLangfusePrompt = async (prompt) => {
        try {
            console.log('Selected prompt:', prompt)
            console.log('Prompt versions:', prompt.versions)
            
            // Check if the prompt has multiple versions
            if (prompt.versions && Array.isArray(prompt.versions) && prompt.versions.length > 1) {
                console.log(' Multiple versions detected, filtering for production versions')
                console.log('Versions array:', prompt.versions)
                console.log('First version type:', typeof prompt.versions[0], 'Value:', prompt.versions[0])
                
                // Filter versions to show only production versions
                const productionVersions = prompt.versions.filter(version => {
                    // Handle both string versions and object versions
                    if (typeof version === 'string') {
                        // For string versions, we need to check if this version has production label
                        // Since we're already filtering for production prompts in the main list,
                        // we can assume the current version is production
                        return true
                    } else {
                        // For object versions, check if it has production label
                        return version.labels && Array.isArray(version.labels) && version.labels.includes('production')
                    }
                })
                
                console.log('📋 Production versions:', productionVersions)
                
                if (productionVersions.length === 0) {
                    console.log('No production versions found, proceeding with original logic')
                    await selectPromptVersion(prompt)
                    return
                }
                
                // If only one production version, use it directly
                if (productionVersions.length === 1) {
                    console.log(' Single production version found, using it directly')
                    await selectPromptVersion(prompt, productionVersions[0])
                    return
                }
                
                // Show version selection dialog with only production versions
                setSelectedPromptForVersion(prompt)
                setPromptVersions(productionVersions)
                setShowVersionSelectionDialog(true)
                setShowLangfusePromptDialog(false)
                return
            }

            console.log('Single version or no versions, proceeding directly')
            // If only one version or no versions, proceed with the original logic
            await selectPromptVersion(prompt)
            
        } catch (err) {
            console.error('Failed to handle prompt selection:', err)
            setLangfusePromptError('Failed to load prompt')
        }
    }

    // Handler for selecting a specific prompt version
    const selectPromptVersion = async (prompt, version = null) => {
        try {
            console.log(' selectPromptVersion called with:')
            console.log('Prompt:', prompt)
            console.log('Version:', version)
            
            // Try to fetch the actual prompt content
            const promptContent = await promptApi.getLangfusePromptContent(prompt.name, version)
            
            console.log(' Prompt content response:', promptContent)
            
            // Extract the prompt text from the content response with more comprehensive logic
            let promptText = ''
            
            // Check various possible locations for the prompt content
            if (promptContent.data) {
                // First, check if this is a version-specific response
                if (promptContent.data.prompt) {
                    promptText = promptContent.data.prompt
                } else if (promptContent.data.config && promptContent.data.config.prompt) {
                    promptText = promptContent.data.config.prompt
                } else if (promptContent.data.template) {
                    promptText = promptContent.data.template
                } else if (promptContent.data.content) {
                    promptText = promptContent.data.content
                } else if (promptContent.data.text) {
                    promptText = promptContent.data.text
                } else if (promptContent.data.message) {
                    promptText = promptContent.data.message
                } else if (promptContent.data.body) {
                    promptText = promptContent.data.body
                } else if (promptContent.data.description) {
                    promptText = promptContent.data.description
                } else if (typeof promptContent.data === 'string') {
                    promptText = promptContent.data
                }
                
                // If no content found in the main data, check if there are versions
                if (!promptText && promptContent.data.versions && Array.isArray(promptContent.data.versions)) {
                    // Find the latest version or the specified version
                    let targetVersion = null
                    if (version) {
                        targetVersion = promptContent.data.versions.find(v => 
                            v.version === version || 
                            v.versionNumber === version || 
                            v.id === version
                        )
                    } else {
                        // Get the latest version (usually the first one or the one with highest version number)
                        targetVersion = promptContent.data.versions[0]
                    }
                    
                    if (targetVersion) {
                        console.log(`📋 Found version data:`, targetVersion)
                        // Extract content from the version
                        if (targetVersion.prompt) {
                            promptText = targetVersion.prompt
                        } else if (targetVersion.content) {
                            promptText = targetVersion.content
                        } else if (targetVersion.template) {
                            promptText = targetVersion.template
                        } else if (targetVersion.text) {
                            promptText = targetVersion.text
                        } else if (targetVersion.message) {
                            promptText = targetVersion.message
                        } else if (targetVersion.body) {
                            promptText = targetVersion.body
                        } else if (targetVersion.description) {
                            promptText = targetVersion.description
                        }
                    }
                }
            } else if (promptContent.prompt) {
                promptText = promptContent.prompt
            } else if (promptContent.template) {
                promptText = promptContent.template
            } else if (promptContent.content) {
                promptText = promptContent.content
            } else if (promptContent.text) {
                promptText = promptContent.text
            } else if (promptContent.message) {
                promptText = promptContent.message
            } else if (promptContent.body) {
                promptText = promptContent.body
            } else if (promptContent.description) {
                promptText = promptContent.description
            } else if (typeof promptContent === 'string') {
                promptText = promptContent
            }
            
            // If still no content found, try to extract from nested objects
            if (!promptText && promptContent.data) {
                // Recursively search for string content in the response
                const findStringContent = (obj) => {
                    if (typeof obj === 'string' && obj.length > 10) {
                        return obj
                    }
                    if (typeof obj === 'object' && obj !== null) {
                        for (const key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                const result = findStringContent(obj[key])
                                if (result) return result
                            }
                        }
                    }
                    return null
                }
                
                promptText = findStringContent(promptContent.data)
            }
            
            if (!promptText) {
                // Try to construct a meaningful prompt from available data
                if (promptContent.data) {
                    const data = promptContent.data
                    if (data.name) {
                        promptText = `Prompt: ${data.name}`
                        if (data.description) {
                            promptText += `\n\nDescription: ${data.description}`
                        }
                        if (data.labels && data.labels.length > 0) {
                            promptText += `\n\nLabels: ${data.labels.join(', ')}`
                        }
                        console.log('Constructed prompt from available data')
                    } else {
                        // Final fallback to prompt name
                        promptText = `[Langfuse Prompt: ${prompt.name}]`
                        console.log(' No prompt content found in response, using fallback')
                        console.log(' Full response structure:', JSON.stringify(promptContent, null, 2))
                    }
                } else {
                    // Fallback to prompt name if no content found
                    promptText = `[Langfuse Prompt: ${prompt.name}]`
                    console.log('No prompt content found in response, using fallback')
                    console.log('Full response structure:', JSON.stringify(promptContent, null, 2))
                }
            } else {
                console.log('Successfully extracted prompt content:', promptText.substring(0, 100) + '...')
            }
            
            data.inputs['langfusePrompt'] = promptText
            data.inputs['systemMessagePrompt'] = promptText // Reflect in system message box
            data.inputs['promptSource'] = 'langfuse'
            setShowLangfusePromptDialog(false)
            setShowVersionSelectionDialog(false)
            
            // Clear any previous errors
            setLangfusePromptError('')
            
        } catch (err) {
            console.error('Failed to fetch prompt content:', err)
            
            // Check if this was a version-specific error
            if (version) {
                console.log(` Version ${version} not found or failed to fetch`)
                setLangfusePromptError(`Version ${version} not found for prompt "${prompt.name}"`)
                
                // Show user-friendly error message
                enqueueSnackbar({
                    message: `Version ${version} not found for prompt "${prompt.name}". Please select a different version.`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: false,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                
                // Keep the version selection dialog open so user can try again
                setShowLangfusePromptDialog(false)
                setShowVersionSelectionDialog(true)
                return
            }
            
            // Use fallback if content fetching fails
            const promptText = `[Langfuse Prompt: ${prompt.name}]`
            data.inputs['langfusePrompt'] = promptText
            data.inputs['systemMessagePrompt'] = promptText
            data.inputs['promptSource'] = 'langfuse'
            setShowLangfusePromptDialog(false)
            setShowVersionSelectionDialog(false)
            setLangfusePromptError(`Failed to load prompt content: ${err.message}`)
            
            // Show user-friendly error message
            enqueueSnackbar({
                message: `Failed to load prompt content for "${prompt.name}". Please check the console for details.`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: false,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    // Handler for version selection dialog
    const onVersionSelected = async (selectedVersion) => {
        if (selectedPromptForVersion) {
            console.log('🎯 Version selection triggered')
            console.log('🎯 Selected version object:', selectedVersion)
            console.log('🎯 Prompt for version:', selectedPromptForVersion)
            
            // Extract the version identifier from the selected version object
            let versionId = null
            console.log('Extracting version ID from:', selectedVersion, 'Type:', typeof selectedVersion)
            
            // Simple direct assignment for now
            versionId = selectedVersion
            
            console.log('Direct assignment versionId:', versionId)
            
            console.log(`🎯 Extracted version ID:`, versionId)
            console.log(`🎯 Calling selectPromptVersion with prompt:`, selectedPromptForVersion.name, `version:`, versionId)
            
            // Ensure versionId is a number if it's a string number
            if (versionId && !isNaN(versionId)) {
                versionId = parseInt(versionId, 10)
            }
            
            console.log(`🎯 Final version ID (parsed):`, versionId)
            
            // If versionId is still null, try to use the selectedVersion directly
            if (!versionId && selectedVersion) {
                console.log('Version ID is null, trying to use selectedVersion directly')
                versionId = selectedVersion
            }
            
            console.log(`🎯 Final version ID after fallback:`, versionId)
            await selectPromptVersion(selectedPromptForVersion, versionId)
        }
    }

    // Handler for variable input change


    // Handler for switching prompt source
    const onPromptSourceChange = (source) => {
        data.inputs['promptSource'] = source
    }

    useEffect(() => {
        if (ref.current && ref.current.offsetTop && ref.current.clientHeight) {
            setPosition(ref.current.offsetTop + ref.current.clientHeight / 2)
            updateNodeInternals(data.id)
        }
    }, [data.id, ref, updateNodeInternals])

    useEffect(() => {
        updateNodeInternals(data.id)
    }, [data.id, position, updateNodeInternals])

    return (
        <div ref={ref}>
            {inputAnchor && (
                <>
                    <CustomWidthTooltip placement='left' title={inputAnchor.type}>
                        <Handle
                            type='target'
                            position={Position.Left}
                            key={inputAnchor.id}
                            id={inputAnchor.id}
                            isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                            style={{
                                height: 10,
                                width: 10,
                                backgroundColor: data.selected ? theme.palette.primary.main : theme.palette.text.secondary,
                                top: position
                            }}
                        />
                    </CustomWidthTooltip>
                    <Box sx={{ p: 2 }}>
                        <Typography>
                            {inputAnchor.label}
                            {!inputAnchor.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                            {inputAnchor.description && <TooltipWithParser style={{ marginLeft: 10 }} title={inputAnchor.description} />}
                        </Typography>
                    </Box>
                </>
            )}

            {((inputParam && !inputParam.additionalParams) || isAdditionalParams) && (
                <>
                    {/* Add Prompt Source Switcher for ConversationChain additionalParams */}
                    {data.name === 'conversationChain' && inputParam.name === 'systemMessagePrompt' && isAdditionalParams && (
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 2, gap: 2 }}>
                            <Typography variant='subtitle2'>Prompt Source:</Typography>
                            <Dropdown
                                name='promptSource'
                                options={[
                                    { name: 'system', label: 'System Message' },
                                    { name: 'langfuse', label: 'Add Prompt (Langfuse)' }
                                ]}
                                value={data.inputs['promptSource'] || 'system'}
                                onSelect={onPromptSourceChange}
                            />
                            {data.inputs['promptSource'] === 'langfuse' && (
                                <Button
                                    variant='outlined'
                                    color='primary'
                                    onClick={onAddLangfusePromptClicked}
                                    disabled={langfusePromptLoading}
                                >
                                    {langfusePromptLoading ? 'Loading...' : 'Select'}
                                </Button>
                            )}
                        </Box>
                    )}
                    {/* Show error if Langfuse prompt fetch fails */}
                    {showLangfusePromptDialog && (
                        <Dialog open={showLangfusePromptDialog} onClose={() => setShowLangfusePromptDialog(false)} maxWidth='sm' fullWidth>
                            <DialogTitle>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>Select a Production Prompt from Langfuse</Typography>
                                    <Button
                                        size="small"
                                        onClick={onAddLangfusePromptClicked}
                                        disabled={langfusePromptLoading}
                                        startIcon={<IconRefresh />}
                                    >
                                        Refresh
                                    </Button>
                                </Box>
                            </DialogTitle>
                            <DialogContent>
                                {langfusePromptError && (
                                    <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                                        <Typography color='error' variant='body2'>
                                            {langfusePromptError}
                                        </Typography>
                                    </Box>
                                )}
                                {langfusePromptLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                        <Typography>Loading prompts...</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ mt: 2 }}>
                                        {langfusePrompts.length === 0 ? (
                                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                                <Typography color="text.secondary">No production prompts found.</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    Only prompts with "production" label are shown. Please set a prompt as production first.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box>
                                                {langfusePrompts.map((prompt, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{ 
                                                            mb: 1, 
                                                            p: 1, 
                                                            border: '1px solid #eee', 
                                                            borderRadius: 1, 
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                                bgcolor: 'action.hover'
                                                            }
                                                        }}
                                                        onClick={() => onSelectLangfusePrompt(prompt)}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                            <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                                                                {prompt.name || prompt.label || 'Unnamed Prompt'}
                                                            </Typography>
                                                            <Chip 
                                                                label="Production" 
                                                                size="small" 
                                                                color="success" 
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                        <Typography variant='body2' sx={{ color: 'gray', fontSize: '0.8rem' }}>
                                                            Labels: {prompt.labels?.join(', ') || 'No labels'}
                                                        </Typography>
                                                        <Typography variant='body2' sx={{ color: 'gray', fontSize: '0.8rem' }}>
                                                            Updated: {new Date(prompt.lastUpdatedAt).toLocaleDateString()}
                                                        </Typography>
                                                        <Typography variant='body2' sx={{ color: 'gray', fontSize: '0.8rem' }}>
                                                            Versions: {prompt.versions?.join(', ') || 'No versions'}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setShowLangfusePromptDialog(false)}>Cancel</Button>
                            </DialogActions>
                        </Dialog>
                    )}
                    {/* Only show the input for the selected prompt source */}
                    {data.name === 'conversationChain' && inputParam.name === 'systemMessagePrompt' && isAdditionalParams ? (
                        data.inputs['promptSource'] === 'langfuse' ? (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant='subtitle2'>Selected Langfuse Prompt:</Typography>
                                <Box sx={{ p: 1, border: '1px solid #eee', borderRadius: 1, background: '#fafafa' }}>
                                    <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                                        {data.inputs['langfusePrompt'] || 'No prompt selected.'}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            // Default system message input
                            <Box>
                                {/* Render the default input for systemMessagePrompt below, but only if promptSource is not langfuse */}
                                {/* The rest of the input rendering logic will continue as normal */}
                            </Box>
                        )
                    ) : null}
                    {inputParam.acceptVariable && !isAdditionalParams && (
                        <CustomWidthTooltip placement='left' title={inputParam.type}>
                            <Handle
                                type='target'
                                position={Position.Left}
                                key={inputParam.id}
                                id={inputParam.id}
                                isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                                style={{
                                    height: 10,
                                    width: 10,
                                    backgroundColor: data.selected ? theme.palette.primary.main : theme.palette.text.secondary,
                                    top: position
                                }}
                            />
                        </CustomWidthTooltip>
                    )}
                    <Box sx={{ p: disablePadding ? 0 : 2 }}>
                        {(data.name === 'promptTemplate' || data.name === 'chatPromptTemplate') &&
                            (inputParam.name === 'template' || inputParam.name === 'systemMessagePrompt') && (
                                <>
                                    <Button
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            width: '100%'
                                        }}
                                        disabled={disabled}
                                        sx={{ borderRadius: 25, width: '100%', mb: 2, mt: 0 }}
                                        variant='outlined'
                                        onClick={() => onShowPromptHubButtonClicked()}
                                        endIcon={<IconAutoFixHigh />}
                                    >
                                        Langchain Hub
                                    </Button>
                                    <PromptLangsmithHubDialog
                                        promptType={inputParam.name}
                                        show={showPromptHubDialog}
                                        onCancel={() => setShowPromptHubDialog(false)}
                                        onSubmit={onShowPromptHubButtonSubmit}
                                    ></PromptLangsmithHubDialog>
                                </>
                            )}
                        {data.name === 'chatNvidiaNIM' && inputParam.name === 'modelName' && (
                            <>
                                <Button
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        width: '100%'
                                    }}
                                    sx={{ borderRadius: '12px', width: '100%', mb: 2, mt: -1 }}
                                    variant='outlined'
                                    onClick={() => setIsNvidiaNIMDialogOpen(true)}
                                >
                                    Setup NIM Locally
                                </Button>
                            </>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <Typography>
                                {inputParam.label}
                                {!inputParam.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                                {inputParam.description && <TooltipWithParser style={{ marginLeft: 10 }} title={inputParam.description} />}
                            </Typography>
                            <div style={{ flexGrow: 1 }}></div>
                            {inputParam.hint && !isAdditionalParams && (
                                <IconButton
                                    size='small'
                                    sx={{
                                        height: 25,
                                        width: 25
                                    }}
                                    title={inputParam.hint.label}
                                    color='secondary'
                                    onClick={() => onInputHintDialogClicked(inputParam.hint)}
                                >
                                    <IconBulb />
                                </IconButton>
                            )}
                            {inputParam.hint && isAdditionalParams && (
                                <Button
                                    sx={{ p: 0, px: 2 }}
                                    color='secondary'
                                    variant='text'
                                    onClick={() => {
                                        onInputHintDialogClicked(inputParam.hint)
                                    }}
                                    startIcon={<IconBulb size={17} />}
                                >
                                    {inputParam.hint.label}
                                </Button>
                            )}
                            {inputParam.acceptVariable && inputParam.type === 'string' && (
                                <Tooltip title='Type {{ to select variables'>
                                    <IconVariable size={20} style={{ color: 'teal' }} />
                                </Tooltip>
                            )}
                            {inputParam.generateDocStoreDescription && (
                                <IconButton
                                    title='Generate knowledge base description'
                                    sx={{
                                        height: 25,
                                        width: 25
                                    }}
                                    size='small'
                                    color='secondary'
                                    onClick={() => generateDocStoreToolDesc(data.inputs['documentStore'])}
                                >
                                    <IconWand />
                                </IconButton>
                            )}
                            {inputParam.generateInstruction && (
                                <IconButton
                                    title='Generate instructions'
                                    sx={{
                                        height: 25,
                                        width: 25,
                                        ml: 0.5
                                    }}
                                    size='small'
                                    color='secondary'
                                    onClick={() => generateInstruction()}
                                >
                                    <IconWand />
                                </IconButton>
                            )}
                            {((inputParam.type === 'string' && inputParam.rows) || inputParam.type === 'code') && (
                                <IconButton
                                    size='small'
                                    sx={{
                                        height: 25,
                                        width: 25,
                                        ml: 0.5
                                    }}
                                    title='Expand'
                                    color='primary'
                                    onClick={() =>
                                        onExpandDialogClicked(data.inputs[inputParam.name] ?? inputParam.default ?? '', inputParam)
                                    }
                                >
                                    <IconArrowsMaximize />
                                </IconButton>
                            )}
                        </div>
                        {inputParam.warning && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 10,
                                    background: 'rgb(254,252,191)',
                                    padding: 10,
                                    marginTop: 10,
                                    marginBottom: 10
                                }}
                            >
                                <IconAlertTriangle size={30} color='orange' />
                                <span style={{ color: 'rgb(116,66,16)', marginLeft: 10 }}>{inputParam.warning}</span>
                            </div>
                        )}
                        {inputParam.type === 'credential' && (
                            <CredentialInputHandler
                                disabled={disabled}
                                data={data}
                                inputParam={inputParam}
                                onSelect={(newValue) => {
                                    data.credential = newValue
                                    data.inputs[FLOWISE_CREDENTIAL_ID] = newValue // in case data.credential is not updated
                                }}
                            />
                        )}
                        {inputParam.type === 'tabs' && (
                            <>
                                <Tabs
                                    value={getTabValue(inputParam)}
                                    onChange={(event, val) => {
                                        setTabValue(val)
                                        data.inputs[`${inputParam.tabIdentifier}_${data.id}`] = inputParam.tabs[val].name
                                    }}
                                    aria-label='tabs'
                                    variant='fullWidth'
                                    defaultValue={getTabValue(inputParam)}
                                >
                                    <TabsList>
                                        {inputParam.tabs.map((inputChildParam, index) => (
                                            <Tab key={index}>{inputChildParam.label}</Tab>
                                        ))}
                                    </TabsList>
                                </Tabs>
                                {inputParam.tabs
                                    .filter((inputParam) => inputParam.display !== false)
                                    .map((inputChildParam, index) => (
                                        <TabPanel key={index} value={getTabValue(inputParam)} index={index}>
                                            <NodeInputHandler
                                                disabled={inputChildParam.disabled}
                                                inputParam={inputChildParam}
                                                data={data}
                                                isAdditionalParams={true}
                                                disablePadding={true}
                                            />
                                        </TabPanel>
                                    ))}
                            </>
                        )}
                        {inputParam.type === 'file' && (
                            <File
                                disabled={disabled}
                                fileType={inputParam.fileType || '*'}
                                onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                value={data.inputs[inputParam.name] ?? inputParam.default ?? 'Choose a file to upload'}
                            />
                        )}
                        {inputParam.type === 'boolean' && (
                            <SwitchInput
                                disabled={disabled}
                                onChange={(newValue) => handleDataChange({ inputParam, newValue })}
                                value={data.inputs[inputParam.name] ?? inputParam.default ?? false}
                            />
                        )}
                        {inputParam.type === 'datagrid' && (
                            <DataGrid
                                disabled={disabled}
                                columns={getDataGridColDef(inputParam.datagrid, inputParam)}
                                hideFooter={true}
                                rows={data.inputs[inputParam.name] ?? JSON.stringify(inputParam.default) ?? []}
                                onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                            />
                        )}
                        {inputParam.type === 'code' && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
                                    {inputParam.codeExample && (
                                        <Button
                                            variant='outlined'
                                            onClick={() => {
                                                data.inputs[inputParam.name] = inputParam.codeExample
                                                setReloadTimestamp(Date.now().toString())
                                            }}
                                        >
                                            See Example
                                        </Button>
                                    )}
                                </div>
                                <div
                                    key={`${reloadTimestamp}_${data.id}}`}
                                    style={{
                                        marginTop: '10px',
                                        border: '1px solid',
                                        borderColor: theme.palette.grey[900] + 25,
                                        borderRadius: '6px',
                                        height: inputParam.rows ? '100px' : '200px'
                                    }}
                                >
                                    <CodeEditor
                                        disabled={disabled}
                                        value={data.inputs[inputParam.name] ?? inputParam.default ?? ''}
                                        height={inputParam.rows ? '100px' : '200px'}
                                        theme={customization.isDarkMode ? 'dark' : 'light'}
                                        lang={'js'}
                                        placeholder={inputParam.placeholder}
                                        onValueChange={(code) => (data.inputs[inputParam.name] = code)}
                                        basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
                                    />
                                </div>
                            </>
                        )}

                        {(inputParam.type === 'string' || inputParam.type === 'password' || inputParam.type === 'number') &&
                            (inputParam?.acceptVariable &&
                            (window.location.href.includes('v2/agentcanvas') || window.location.href.includes('v2/marketplace')) ? (
                                <RichInput
                                    key={data.inputs[inputParam.name]}
                                    placeholder={inputParam.placeholder}
                                    disabled={disabled}
                                    inputParam={inputParam}
                                    onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                    value={data.inputs[inputParam.name] ?? inputParam.default ?? ''}
                                    nodes={reactFlowInstance ? reactFlowInstance.getNodes() : []}
                                    edges={reactFlowInstance ? reactFlowInstance.getEdges() : []}
                                    nodeId={data.id}
                                />
                            ) : (
                                <Input
                                    key={data.inputs[inputParam.name]}
                                    placeholder={inputParam.placeholder}
                                    disabled={disabled}
                                    inputParam={inputParam}
                                    onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                    value={data.inputs[inputParam.name] ?? inputParam.default ?? ''}
                                    nodes={[]}
                                    edges={[]}
                                    nodeId={data.id}
                                />
                            ))}
                        {inputParam.type === 'json' && (
                            <>
                                {!inputParam?.acceptVariable && (
                                    <JsonEditorInput
                                        disabled={disabled}
                                        onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                        value={
                                            data.inputs[inputParam.name] ||
                                            inputParam.default ||
                                            getJSONValue(data.inputs['workerPrompt']) ||
                                            ''
                                        }
                                        isSequentialAgent={data.category === 'Sequential Agents'}
                                        isDarkMode={customization.isDarkMode}
                                    />
                                )}
                                {inputParam?.acceptVariable && (
                                    <>
                                        <Button
                                            sx={{
                                                borderRadius: 25,
                                                width: '100%',
                                                mb: 0,
                                                mt: 2
                                            }}
                                            variant='outlined'
                                            disabled={disabled}
                                            onClick={() => onEditJSONClicked(data.inputs[inputParam.name] ?? '', inputParam)}
                                        >
                                            {inputParam.label}
                                        </Button>
                                        <FormatPromptValuesDialog
                                            show={showFormatPromptValuesDialog}
                                            dialogProps={formatPromptValuesDialogProps}
                                            onCancel={() => setShowFormatPromptValuesDialog(false)}
                                            onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                        ></FormatPromptValuesDialog>
                                    </>
                                )}
                            </>
                        )}
                        {inputParam.type === 'options' && (
                            <div key={`${data.id}_${JSON.stringify(data.inputs[inputParam.name])}`}>
                                <Dropdown
                                    disabled={disabled}
                                    name={inputParam.name}
                                    options={getDropdownOptions(inputParam)}
                                    freeSolo={inputParam.freeSolo}
                                    onSelect={(newValue) => handleDataChange({ inputParam, newValue })}
                                    value={data.inputs[inputParam.name] ?? inputParam.default ?? 'choose an option'}
                                />
                            </div>
                        )}
                        {inputParam.type === 'multiOptions' && (
                            <div key={`${data.id}_${JSON.stringify(data.inputs[inputParam.name])}`}>
                                <MultiDropdown
                                    disabled={disabled}
                                    name={inputParam.name}
                                    options={getDropdownOptions(inputParam)}
                                    onSelect={(newValue) => handleDataChange({ inputParam, newValue })}
                                    value={data.inputs[inputParam.name] ?? inputParam.default ?? 'choose an option'}
                                />
                            </div>
                        )}
                        {(inputParam.type === 'asyncOptions' || inputParam.type === 'asyncMultiOptions') && (
                            <>
                                {data.inputParams.length === 1 && <div style={{ marginTop: 10 }} />}
                                <div
                                    key={`${reloadTimestamp}_${data.id}_${JSON.stringify(data.inputs[inputParam.name])}`}
                                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}
                                >
                                    <AsyncDropdown
                                        disabled={disabled}
                                        name={inputParam.name}
                                        nodeData={data}
                                        value={data.inputs[inputParam.name] ?? inputParam.default ?? 'choose an option'}
                                        freeSolo={inputParam.freeSolo}
                                        multiple={inputParam.type === 'asyncMultiOptions'}
                                        isCreateNewOption={EDITABLE_OPTIONS.includes(inputParam.name)}
                                        onSelect={(newValue) => {
                                            if (inputParam.loadConfig) setReloadTimestamp(Date.now().toString())
                                            handleDataChange({ inputParam, newValue })
                                        }}
                                        onCreateNew={() => addAsyncOption(inputParam.name)}
                                    />
                                    {EDITABLE_OPTIONS.includes(inputParam.name) && data.inputs[inputParam.name] && (
                                        <IconButton
                                            title='Edit'
                                            color='primary'
                                            size='small'
                                            onClick={() => editAsyncOption(inputParam.name, data.inputs[inputParam.name])}
                                        >
                                            <IconEdit />
                                        </IconButton>
                                    )}
                                    {inputParam.refresh && (
                                        <IconButton
                                            title='Refresh'
                                            color='primary'
                                            size='small'
                                            onClick={() => setReloadTimestamp(Date.now().toString())}
                                        >
                                            <IconRefresh />
                                        </IconButton>
                                    )}
                                </div>
                            </>
                        )}
                        {inputParam.type === 'array' && <ArrayRenderer inputParam={inputParam} data={data} disabled={disabled} />}
                        {/* CUSTOM INPUT LOGIC */}
                        {inputParam.type.includes('conditionFunction') && (
                            <>
                                <Button
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        width: '100%'
                                    }}
                                    sx={{ borderRadius: '12px', width: '100%', mt: 1 }}
                                    variant='outlined'
                                    onClick={() => onConditionDialogClicked(inputParam)}
                                >
                                    {inputParam.label}
                                </Button>
                            </>
                        )}
                        {(data.name === 'cheerioWebScraper' ||
                            data.name === 'puppeteerWebScraper' ||
                            data.name === 'playwrightWebScraper') &&
                            inputParam.name === 'url' && (
                                <>
                                    <Button
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            width: '100%'
                                        }}
                                        disabled={disabled}
                                        sx={{ borderRadius: '12px', width: '100%', mt: 1 }}
                                        variant='outlined'
                                        onClick={() =>
                                            onManageLinksDialogClicked(
                                                data.inputs[inputParam.name] ?? inputParam.default ?? '',
                                                data.inputs.selectedLinks,
                                                data.inputs['relativeLinksMethod'] ?? 'webCrawl',
                                                parseInt(data.inputs['limit']) ?? 0
                                            )
                                        }
                                    >
                                        Manage Links
                                    </Button>
                                    <ManageScrapedLinksDialog
                                        show={showManageScrapedLinksDialog}
                                        dialogProps={manageScrapedLinksDialogProps}
                                        onCancel={() => setShowManageScrapedLinksDialog(false)}
                                        onSave={onManageLinksDialogSave}
                                    />
                                </>
                            )}
                        {inputParam.loadConfig && data && data.inputs && data.inputs[inputParam.name] && (
                            <>
                                <ConfigInput
                                    key={`${data.id}_${JSON.stringify(data.inputs[inputParam.name])}_${arrayIndex}_${
                                        parentParamForArray?.name
                                    }`}
                                    data={data}
                                    inputParam={inputParam}
                                    disabled={disabled}
                                    arrayIndex={arrayIndex}
                                    parentParamForArray={parentParamForArray}
                                />
                            </>
                        )}
                    </Box>
                </>
            )}
            <ToolDialog
                show={showAsyncOptionDialog === 'selectedTool'}
                dialogProps={asyncOptionEditDialogProps}
                onCancel={() => setAsyncOptionEditDialog('')}
                onConfirm={onConfirmAsyncOption}
            ></ToolDialog>
            <AssistantDialog
                show={showAsyncOptionDialog === 'selectedAssistant'}
                dialogProps={asyncOptionEditDialogProps}
                onCancel={() => setAsyncOptionEditDialog('')}
                onConfirm={onConfirmAsyncOption}
            ></AssistantDialog>
            <ExpandTextDialog
                show={showExpandDialog}
                dialogProps={expandDialogProps}
                onCancel={() => setShowExpandDialog(false)}
                onConfirm={(newValue, inputParamName) => onExpandDialogSave(newValue, inputParamName)}
                onInputHintDialogClicked={onInputHintDialogClicked}
            ></ExpandTextDialog>
            <ExpandRichInputDialog
                show={showExpandRichDialog}
                dialogProps={expandRichDialogProps}
                onCancel={() => setShowExpandRichDialog(false)}
                onConfirm={(newValue, inputParamName) => onExpandRichDialogSave(newValue, inputParamName)}
                onInputHintDialogClicked={onInputHintDialogClicked}
            ></ExpandRichInputDialog>
            <ConditionDialog
                show={showConditionDialog}
                dialogProps={conditionDialogProps}
                onCancel={() => {
                    setShowConditionDialog(false)
                    onHideNodeInfoDialog(false)
                }}
                onConfirm={(newData, inputParam, tabValue) => onConditionDialogSave(newData, inputParam, tabValue)}
            ></ConditionDialog>
            <InputHintDialog
                show={showInputHintDialog}
                dialogProps={inputHintDialogProps}
                onCancel={() => setShowInputHintDialog(false)}
            ></InputHintDialog>
            <NvidiaNIMDialog
                open={isNvidiaNIMDialogOpen}
                onClose={() => setIsNvidiaNIMDialogOpen(false)}
                onComplete={handleNvidiaNIMDialogComplete}
            ></NvidiaNIMDialog>
            <Dialog
                open={modelSelectionDialogOpen}
                onClose={() => {
                    setModelSelectionDialogOpen(false)
                    setSelectedTempChatModel({})
                }}
                aria-labelledby='model-selection-dialog-title'
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle id='model-selection-dialog-title'>Select Model</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ px: 2 }}>
                            <Dropdown
                                name={'chatModel'}
                                options={availableChatModelsOptions ?? []}
                                onSelect={(newValue) => {
                                    if (!newValue) {
                                        setSelectedTempChatModel({})
                                    } else {
                                        const foundChatComponent = availableChatModels.find((chatModel) => chatModel.name === newValue)
                                        if (foundChatComponent) {
                                            const chatModelId = `${foundChatComponent.name}_0`
                                            const clonedComponent = cloneDeep(foundChatComponent)
                                            const initChatModelData = initNode(clonedComponent, chatModelId)
                                            setSelectedTempChatModel(initChatModelData)
                                        }
                                    }
                                }}
                                value={selectedTempChatModel?.name ?? 'choose an option'}
                            />
                        </Box>
                        {selectedTempChatModel && Object.keys(selectedTempChatModel).length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                {(selectedTempChatModel.inputParams ?? [])
                                    .filter((inputParam) => !inputParam.hidden)
                                    .map((inputParam, index) => (
                                        <DocStoreInputHandler key={index} inputParam={inputParam} data={selectedTempChatModel} />
                                    ))}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setModelSelectionDialogOpen(false)
                            setSelectedTempChatModel({})
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!selectedTempChatModel || Object.keys(selectedTempChatModel).length === 0}
                        onClick={async () => {
                            setModelSelectionDialogOpen(false)
                            if (modelSelectionCallback) {
                                await modelSelectionCallback(selectedTempChatModel)
                            }
                            setSelectedTempChatModel({})
                        }}
                        variant='contained'
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
            <PromptGeneratorDialog
                show={promptGeneratorDialogOpen}
                dialogProps={promptGeneratorDialogProps}
                onCancel={() => setPromptGeneratorDialogOpen(false)}
                onConfirm={(generatedInstruction) => {
                    try {
                        if (inputParam?.acceptVariable && window.location.href.includes('v2/agentcanvas')) {
                            const htmlContent = markdownConverter.makeHtml(generatedInstruction)
                            data.inputs[inputParam.name] = htmlContent
                        } else {
                            data.inputs[inputParam.name] = generatedInstruction
                        }
                        setPromptGeneratorDialogOpen(false)
                    } catch (error) {
                        enqueueSnackbar({
                            message: 'Error setting generated instruction',
                            options: {
                                key: new Date().getTime() + Math.random(),
                                variant: 'error',
                                persist: true,
                                action: (key) => (
                                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                        <IconX />
                                    </Button>
                                )
                            }
                        })
                    }
                }}
            />
            <PromptVersionSelectionDialog
                show={showVersionSelectionDialog}
                onCancel={() => setShowVersionSelectionDialog(false)}
                onConfirm={onVersionSelected}
                prompt={selectedPromptForVersion}
                versions={promptVersions}
            />
            {(langfusePromptLoading || docStoreLoading) && <BackdropLoader open={langfusePromptLoading || docStoreLoading} />}
        </div>
    )
}

NodeInputHandler.propTypes = {
    inputAnchor: PropTypes.object,
    inputParam: PropTypes.object,
    data: PropTypes.object,
    disabled: PropTypes.bool,
    isAdditionalParams: PropTypes.bool,
    disablePadding: PropTypes.bool,
    parentParamForArray: PropTypes.object,
    arrayIndex: PropTypes.number,
    onCustomDataChange: PropTypes.func,
    onHideNodeInfoDialog: PropTypes.func
}

export default NodeInputHandler
