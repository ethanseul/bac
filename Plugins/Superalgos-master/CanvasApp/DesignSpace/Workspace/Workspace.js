
function newWorkspace () {
  const MODULE_NAME = 'Workspace'
  const ERROR_LOG = true
  const logger = newWebDebugLog()
  logger.fileName = MODULE_NAME

  let thisObject = {
    workspaceNode: undefined,
    container: undefined,
    enabled: false,
    nodeChildren: undefined,
    eventsServerClients: new Map(),
    replaceWorkspaceByLoadingOne: replaceWorkspaceByLoadingOne,
    save: saveWorkspace,
    getHierarchyHeads: getHierarchyHeads,
    getNodeThatIsOnFocus: getNodeThatIsOnFocus,
    getNodeByShortcutKey: getNodeByShortcutKey,
    stopAllRunningTasks: stopAllRunningTasks,
    onMenuItemClick: onMenuItemClick,
    physics: physics,
    draw: draw,
    spawn: spawn,
    chainDetachNode: chainDetachNode,
    chainAttachNode: chainAttachNode,
    referenceDetachNode: referenceDetachNode,
    referenceAttachNode: referenceAttachNode,
    initialize: initialize,
    finalize: finalize
  }

  thisObject.container = newContainer()
  thisObject.container.initialize(MODULE_NAME)
  thisObject.container.isClickeable = false
  thisObject.container.isDraggeable = false
  thisObject.container.isWheelable = false
  thisObject.container.detectMouseOver = false
  thisObject.container.frame.radius = 0
  thisObject.container.frame.position.x = 0
  thisObject.container.frame.position.y = 0
  thisObject.container.frame.width = 0
  thisObject.container.frame.height = 0

  spawnPosition = {
    x: canvas.floatingSpace.container.frame.width / 2,
    y: canvas.floatingSpace.container.frame.height / 2
  }

  thisObject.workspaceNode = {}
  thisObject.workspaceNode.rootNodes = []

  let functionLibraryReferenceAttachDetach = newReferenceAttachDetach()
  let functionLibraryChainAttachDetach = newChainAttachDetach()
  let functionLibraryNodeDeleter = newNodeDeleter()
  let functionLibraryUiObjectsFromNodes = newUiObjectsFromNodes()
  let functionLibraryProtocolNode = newProtocolNode()
  let functionLibraryNodeCloning = newNodeCloning()
  let functionLibraryTaskFunctions = newTaskFunctions()
  let functionLibrarySessionFunctions = newSessionFunctions()
  let functionLibraryShortcutKeys = newShortcutKeys()
  let functionLibraryOnFocus = newOnFocus()
  let functionLibrarySuperScripts = newSuperScriptsFunctions()
  let functionLibraryCCXTFunctions = newCCXTFunctions()
  let functionLibraryWebhookFunctions = newWebhookFunctions()
  let functionLibraryDependenciesFilter = newDependenciesFilter()

  thisObject.nodeChildren = newNodeChildren()

  let workingAtTask = 0
  let circularProgressBar = newBusyProgressBar()
  circularProgressBar.fitFunction = canvas.floatingSpace.fitIntoVisibleArea
  let loadedWorkspaceNode
  let sessionTimestamp = (new Date()).valueOf()
  window.localStorage.setItem('Session Timestamp', sessionTimestamp)

  return thisObject

  function finalize () {
    thisObject.definition = undefined
    thisObject.container.finalize()
    thisObject.container = undefined
    thisObject.workspaceNode = undefined
    circularProgressBar.finalize()
    circularProgressBar = undefined
  }

  function initialize () {
    try {
      let lastUsedWorkspace = window.localStorage.getItem('Last Used Workspace')

      if (lastUsedWorkspace !== 'undefined' && lastUsedWorkspace !== null && lastUsedWorkspace !== undefined) {
        let blobService = newFileStorage()
        blobService.getFileFromHost('LoadWorkspace' + '/' + lastUsedWorkspace, onFileReceived, true)
        function onFileReceived (err, text, response) {
          if (err && err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
            canvas.cockpitSpace.setStatus('Could not load the last Workspace used, called "' + lastUsedWorkspace + '". Will switch to the default Workspace instead.', 500, canvas.cockpitSpace.statusTypes.WARNING)
            thisObject.workspaceNode = getWorkspace() // This is the default workspace that comes with the system.
            recreateWorkspace()
            return
          }
          thisObject.workspaceNode = JSON.parse(text)
          recreateWorkspace()
        }
      } else {
        thisObject.workspaceNode = getWorkspace() // This is the default workspace that comes with the system.
        recreateWorkspace()
      }

      function recreateWorkspace () {
        functionLibraryUiObjectsFromNodes.recreateWorkspace(thisObject.workspaceNode, finishInitialization)
      }

      function finishInitialization () {
        setupEventsServerClients()
        runTasksAndSessions(false)
        thisObject.enabled = true
        canvas.cockpitSpace.initializePosition()
        canvas.splashScreen.initialize()
        setInterval(saveWorkspace, 60000)
      }
    } catch (err) {
      if (ERROR_LOG === true) { logger.write('[ERROR] initialize -> err = ' + err.stack) }
    }
  }

  function runTasksAndSessions (replacingCurrentWorkspace) {
    if (replacingCurrentWorkspace === true) {
   // We need to wait all tasks that were potentially running to stop
      setTimeout(functionLibraryUiObjectsFromNodes.runTasks, 70000)
   // We give a few seconds for the tasks to start
      setTimeout(functionLibraryUiObjectsFromNodes.runSessions, 80000)
    } else {
      functionLibraryUiObjectsFromNodes.runTasks()
   // We give a few seconds for the tasks to start
      setTimeout(functionLibraryUiObjectsFromNodes.runSessions, 10000)
    }
  }

  function setupEventsServerClients () {
    for (let i = 0; i < thisObject.workspaceNode.rootNodes.length; i++) {
      let rootNode = thisObject.workspaceNode.rootNodes[i]

      if (rootNode.type === 'Network') {
        for (let j = 0; j < rootNode.networkNodes.length; j++) {
          let networkNode = rootNode.networkNodes[j]

          let host
          let webSocketsPort
          /* At this point the node does not have the payload property yet, that is why we have to do this manually */
          try {
            let code = JSON.parse(networkNode.code)
            host = code.host
            webSocketsPort = code.webSocketsPort
          } catch (err) {
            console.log('[ERROR] networkNode ' + networkNode.name + ' has an invalid configuration. Cannot know the host name and webSocketsPort.')
            return
          }

          if (host === undefined) { host = 'localhost' }
          if (webSocketsPort === undefined) { webSocketsPort = '8080' }

          let eventsServerClient = newEventsServerClient(host, webSocketsPort, networkNode.name)
          eventsServerClient.initialize()

          thisObject.eventsServerClients.set(networkNode.id, eventsServerClient)
        }
      }
    }
  }

  function chainDetachNode (node) {
    functionLibraryChainAttachDetach.chainDetachNode(node, thisObject.workspaceNode.rootNodes)
  }

  function chainAttachNode (node, attachToNode) {
    functionLibraryChainAttachDetach.chainAttachNode(node, attachToNode, thisObject.workspaceNode.rootNodes)
  }

  function referenceDetachNode (node) {
    functionLibraryReferenceAttachDetach.referenceDetachNode(node)
  }

  function referenceAttachNode (node, attachToNode) {
    functionLibraryReferenceAttachDetach.referenceAttachNode(node, attachToNode, thisObject.workspaceNode.rootNodes)
  }

  function saveWorkspace () {
    /*  When there is an exception while loading the app, the rootNodes of the workspace get into null value. To avoid saving a corrupt staate we are going to verufy we are not in that situation before saving. */
    let workspace = canvas.designSpace.workspace.workspaceNode

    for (let i = 0; i < workspace.rootNodes.length; i++) {
      let rootNode = workspace.rootNodes[i]
      if (rootNode === null) {
        canvas.cockpitSpace.setStatus('Could not save the Workspace. The state of the workspace in memory is corrupt, please reload the App.', 150, canvas.cockpitSpace.statusTypes.WARNING)
        return
      }
    }

    let savedSessionTimestamp = window.localStorage.getItem('Session Timestamp')
    if (Number(savedSessionTimestamp) !== sessionTimestamp) {
      canvas.cockpitSpace.setStatus('Could not save the Workspace. You have more that one instance of the Superlagos User Interface open at the same time. Plese close this instance as it is older than the others.', 150, canvas.cockpitSpace.statusTypes.WARNING)
    } else {
      let textToSave = stringifyWorkspace()
      window.localStorage.setItem(CANVAS_APP_NAME + '.' + 'Workspace', textToSave)
      window.localStorage.setItem('Session Timestamp', sessionTimestamp)

      if (workspace.name !== undefined) {
        let url = 'SaveWorkspace/' + workspace.name
        callServer(textToSave, url, onResponse)
      }

      function onResponse (err) {
        if (err.result === GLOBAL.DEFAULT_OK_RESPONSE.result) {
          window.localStorage.setItem('Last Used Workspace', workspace.name)
          window.localStorage.setItem('Session Timestamp', sessionTimestamp)
          if (ARE_WE_RECORDING_A_MARKET_PANORAMA === false) {
            canvas.cockpitSpace.setStatus(workspace.name + ' Saved.', 50, canvas.cockpitSpace.statusTypes.ALL_GOOD)
          }
        } else {
          canvas.cockpitSpace.setStatus('Could not save the Workspace at the Backend. Please check the Backend Console for more information.', 150, canvas.cockpitSpace.statusTypes.WARNING)
        }
      }
      return true
    }
  }

  function physics () {
    eventsServerClientsPhysics()
    replacingWorkspacePhysics()
  }

  function eventsServerClientsPhysics () {
    thisObject.eventsServerClients.forEach(applyPhysics)

    function applyPhysics (eventServerClient) {
      eventServerClient.physics()
    }
  }

  function replacingWorkspacePhysics () {
    if (thisObject.enabled !== true) { return }

    if (workingAtTask > 0) {
      circularProgressBar.physics()

      switch (workingAtTask) {
        case 1:
          stopAllRunningTasks()
          workingAtTask++
          break
        case 2:
          functionLibraryNodeDeleter.deleteWorkspace(thisObject.workspaceNode, thisObject.workspaceNode.rootNodes)
          workingAtTask++
          break
        case 3:
          thisObject.workspaceNode = loadedWorkspaceNode
          loadedWorkspaceNode = undefined
          workingAtTask++
          break
        case 4:
          functionLibraryUiObjectsFromNodes.recreateWorkspace(thisObject.workspaceNode)
          setupEventsServerClients()
          runTasksAndSessions(true)
          workingAtTask++
          break
        case 5:
          canvas.chartingSpace.reset()
          workingAtTask++
          break
        case 6:
          workingAtTask = 0
          circularProgressBar.visible = false
          break
      }
    }
  }

  function draw () {
    if (circularProgressBar !== undefined) {
      circularProgressBar.draw()
    }
  }

  function stringifyWorkspace (removePersonalData) {
    let stringifyReadyNodes = []
    for (let i = 0; i < thisObject.workspaceNode.rootNodes.length; i++) {
      let rootNode = thisObject.workspaceNode.rootNodes[i]

      if (rootNode.isIncluded !== true) {
        let node = functionLibraryProtocolNode.getProtocolNode(rootNode, removePersonalData, false, true, true, true)
        stringifyReadyNodes.push(node)
      }
    }
    let workspace = {
      type: 'Workspace',
      name: thisObject.workspaceNode.name,
      rootNodes: stringifyReadyNodes
    }

    return JSON.stringify(workspace)
  }

  function stopAllRunningTasks () {
    for (let i = 0; i < thisObject.workspaceNode.rootNodes.length; i++) {
      let rootNode = thisObject.workspaceNode.rootNodes[i]
      if (rootNode.type === 'Network') {
        if (rootNode.networkNodes !== undefined) {
          for (let j = 0; j < rootNode.networkNodes.length; j++) {
            let networkNode = rootNode.networkNodes[j]
            if (networkNode.dataMining !== undefined && networkNode.dataMining.payload !== undefined) {
              networkNode.dataMining.payload.uiObject.menu.internalClick('Stop All Exchange Tasks')
              networkNode.dataMining.payload.uiObject.menu.internalClick('Stop All Exchange Tasks')
            }
            if (networkNode.testingEnvironment !== undefined && networkNode.testingEnvironment.payload !== undefined) {
              networkNode.testingEnvironment.payload.uiObject.menu.internalClick('Stop All Exchange Tasks')
              networkNode.testingEnvironment.payload.uiObject.menu.internalClick('Stop All Exchange Tasks')
            }
            if (networkNode.productionEnvironment !== undefined && networkNode.productionEnvironment.payload !== undefined) {
              networkNode.productionEnvironment.payload.uiObject.menu.internalClick('Stop All Exchange Tasks')
              networkNode.productionEnvironment.payload.uiObject.menu.internalClick('Stop All Exchange Tasks')
            }
          }
        }
      }
    }
  }

  function getNodeByShortcutKey (searchingKey) {
    for (let i = 0; i < thisObject.workspaceNode.rootNodes.length; i++) {
      let rootNode = thisObject.workspaceNode.rootNodes[i]
      let node = functionLibraryShortcutKeys.getNodeByShortcutKey(rootNode, searchingKey)
      if (node !== undefined) { return node }
    }
  }

  function getNodeThatIsOnFocus () {
    for (let i = 0; i < thisObject.workspaceNode.rootNodes.length; i++) {
      let rootNode = thisObject.workspaceNode.rootNodes[i]
      let node = functionLibraryOnFocus.getNodeThatIsOnFocus(rootNode)
      if (node !== undefined) { return node }
    }
  }

  function getHierarchyHeads () {
    let nodes = []
    for (let i = 0; i < thisObject.workspaceNode.rootNodes.length; i++) {
      let rootNode = thisObject.workspaceNode.rootNodes[i]
      let nodeDefinition = APP_SCHEMA_MAP.get(rootNode.type)
      if (nodeDefinition !== undefined) {
        if (nodeDefinition.isHierarchyHead === true) {
          nodes.push(rootNode)
        }
      }
    }
    return nodes
  }

  function replaceWorkspaceByLoadingOne (name) {
    let blobService = newFileStorage()
    blobService.getFileFromHost('LoadWorkspace' + '/' + name, onFileReceived, true)
    function onFileReceived (err, text, response) {
      if (err && err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
        canvas.cockpitSpace.setStatus('Could not load the Workspace called "' + name + '". ', 500, canvas.cockpitSpace.statusTypes.WARNING)
        return
      }

      loadedWorkspaceNode = JSON.parse(text)
      saveWorkspace()
      canvas.cockpitSpace.toTop()

      let position = {
        x: browserCanvas.width / 2,
        y: browserCanvas.height / 2
      }

      circularProgressBar.initialize(position)
      circularProgressBar.visible = true
      workingAtTask = 1
    }
  }

  function spawn (nodeText, mousePointer) {
    try {
      let point = {
        x: mousePointer.x,
        y: mousePointer.y
      }
      point = canvas.floatingSpace.container.frame.unframeThisPoint(point)
      spawnPosition.x = point.x
      spawnPosition.y = point.y

      let droppedNode = JSON.parse(nodeText)

      if (droppedNode.type === 'Workspace') {
        loadedWorkspaceNode = droppedNode
        circularProgressBar.initialize(mousePointer)
        circularProgressBar.visible = true
        workingAtTask = 1
        return
      }

      /* It does not exist, so we recreeate it respecting the inner state of each object. */
      let positionOffset = {
        x: spawnPosition.x - droppedNode.savedPayload.position.x,
        y: spawnPosition.y - droppedNode.savedPayload.position.y
      }

      thisObject.workspaceNode.rootNodes.push(droppedNode)
      functionLibraryUiObjectsFromNodes.createUiObjectFromNode(droppedNode, undefined, undefined, positionOffset)
      functionLibraryUiObjectsFromNodes.tryToConnectChildrenWithReferenceParents()

      droppedNode = undefined
    } catch (err) {
      if (ERROR_LOG === true) { logger.write('[ERROR] spawn -> err = ' + err.stack) }
    }
  }

  async function onMenuItemClick (payload, action, relatedUiObject, callBackFunction) {
    switch (action) {
      case 'Add UI Object':
        {
          functionLibraryUiObjectsFromNodes.addUIObject(payload.node, relatedUiObject)
        }
        break
      case 'Add Missing Children':
        {
          functionLibraryUiObjectsFromNodes.addMissingChildren(payload.node)
        }
        break
      case 'Delete UI Object':
        {
          functionLibraryNodeDeleter.deleteUIObject(payload.node, thisObject.workspaceNode.rootNodes)
        }
        break
      case 'Share Workspace':
        {
          let text = stringifyWorkspace(true)
          let fileName = 'Share - ' + payload.node.type + ' - ' + payload.node.name + '.json'
          downloadText(fileName, text)
        }
        break
      case 'Backup Workspace':
        {
          let text = stringifyWorkspace(false)
          let fileName = 'Backup - ' + payload.node.type + ' - ' + payload.node.name + '.json'
          downloadText(fileName, text)
        }
        break
      case 'Edit Code':

        break
      case 'Share':
        {
          let text = JSON.stringify(functionLibraryProtocolNode.getProtocolNode(payload.node, true, false, true, true, true))

          let nodeName = payload.node.name
          if (nodeName === undefined) {
            nodeName = ''
          } else {
            nodeName = '.' + nodeName
          }
          let fileName = 'Share - ' + payload.node.type + ' - ' + nodeName + '.json'
          downloadText(fileName, text)
        }

        break
      case 'Backup':
        {
          let text = JSON.stringify(functionLibraryProtocolNode.getProtocolNode(payload.node, false, false, true, true, true))

          let nodeName = payload.node.name
          if (nodeName === undefined) {
            nodeName = ''
          } else {
            nodeName = ' ' + nodeName
          }
          let fileName = 'Backup - ' + payload.node.type + ' - ' + nodeName + '.json'
          downloadText(fileName, text)
        }

        break
      case 'Clone':
        {
          let text = JSON.stringify(functionLibraryNodeCloning.getNodeClone(payload.node))

          let nodeName = payload.node.name
          if (nodeName === undefined) {
            nodeName = ''
          } else {
            nodeName = ' ' + nodeName
          }
          let fileName = 'Clone - ' + payload.node.type + ' - ' + nodeName + '.json'
          downloadText(fileName, text)
        }

        break
      case 'Debug Task':
        {
          functionLibraryTaskFunctions.runTask(payload.node, functionLibraryProtocolNode, true, callBackFunction)
        }
        break
      case 'Run Task':
        {
          functionLibraryTaskFunctions.runTask(payload.node, functionLibraryProtocolNode, false, callBackFunction)
        }
        break
      case 'Stop Task':
        {
          functionLibraryTaskFunctions.stopTask(payload.node, functionLibraryProtocolNode, callBackFunction)
        }
        break
      case 'Run All Tasks':
        {
          functionLibraryTaskFunctions.runAllTasks(payload.node, functionLibraryProtocolNode)
        }
        break
      case 'Stop All Tasks':
        {
          functionLibraryTaskFunctions.stopAllTasks(payload.node, functionLibraryProtocolNode)
        }
        break
      case 'Run All Task Managers':
        {
          functionLibraryTaskFunctions.runAllTaskManagers(payload.node, functionLibraryProtocolNode)
        }
        break
      case 'Stop All Task Managers':
        {
          functionLibraryTaskFunctions.stopAllTaskManagers(payload.node, functionLibraryProtocolNode)
        }
        break
      case 'Run All Exchange Tasks':
        {
          functionLibraryTaskFunctions.runAllExchangeTasks(payload.node, functionLibraryProtocolNode)
        }
        break
      case 'Stop All Exchange Tasks':
        {
          functionLibraryTaskFunctions.stopAllExchangeTasks(payload.node, functionLibraryProtocolNode)
        }
        break
      case 'Add Missing Crypto Exchanges':
        {
          functionLibraryCCXTFunctions.addMissingExchanges(payload.node, functionLibraryUiObjectsFromNodes)
        }
        break
      case 'Add Missing Assets':
        {
          functionLibraryCCXTFunctions.addMissingAssets(payload.node, functionLibraryUiObjectsFromNodes)
        }
        break
      case 'Add Missing Markets':
        {
          functionLibraryCCXTFunctions.addMissingMarkets(payload.node, functionLibraryUiObjectsFromNodes, functionLibraryNodeCloning)
        }
        break
      case 'Send Webhook Test Message':
        {
          functionLibraryWebhookFunctions.sendTestMessage(payload.node, callBackFunction)
        }
        break
      case 'Run Session':
        {
          functionLibrarySessionFunctions.runSession(payload.node, functionLibraryProtocolNode, functionLibraryDependenciesFilter, callBackFunction)
        }
        break
      case 'Stop Session':
        {
          functionLibrarySessionFunctions.stopSession(payload.node, functionLibraryProtocolNode, callBackFunction)
        }
        break
      case 'Run Super Action':
        {
          functionLibrarySuperScripts.runSuperScript(payload.node, thisObject.workspaceNode.rootNodes, functionLibraryNodeCloning, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter)
        }
        break
      case 'Remove Parent':
        {
          chainDetachNode(payload.node)
        }
        break
      case 'Remove Reference':
        {
          referenceDetachNode(payload.node)
        }
        break
      case 'Push Code to Javascript Code':
        {
          payload.node.javascriptCode.code = payload.node.code
        }
        break
      case 'Fetch Code to Javascript Code':
        {
          payload.node.code = payload.node.javascriptCode.code
        }
        break
      case 'Open Documentation':
        {
          let definition = APP_SCHEMA_MAP.get(payload.node.type)
          if (definition !== undefined) {
            if (definition.docURL !== undefined) {
              let newTab = window.open(definition.docURL, '_blank')
              newTab.focus()
            }
          }
        }
        break
    }
  }
}
