
function newUiObjectConstructor () {
  const MODULE_NAME = 'UI Object Constructor'
  const ERROR_LOG = true
  const logger = newWebDebugLog()
  logger.fileName = MODULE_NAME

  let thisObject = {
    createUiObject: createUiObject,
    destroyUiObject: destroyUiObject,
    initialize: initialize,
    finalize: finalize
  }

  let floatingLayer

  return thisObject

  function finalize () {
    floatingLayer = undefined
  }

  function initialize (pFloatingLayer) {
    floatingLayer = pFloatingLayer
  }

  function createUiObject (userAddingNew, payload) {
    let floatingObject = newFloatingObject()
    floatingObject.fitFunction = canvas.floatingSpace.fitIntoVisibleArea
    floatingObject.container.connectToParent(canvas.floatingSpace.container, false, false, false, false, false, false, false, false)
    floatingObject.initialize('UI Object', payload)
    payload.floatingObject = floatingObject

    /*
    When this object is created based on a backup, share or clone, we will have a savedPayload that we will use to set the initial properties.
    If it is a new object being created out of the user interface, we jusst continue with the construction process.
    */
    if (userAddingNew === false && payload.node.type !== 'Workspace') {
      let position = {
        x: 0,
        y: 0
      }

      position = {
        x: payload.node.savedPayload.position.x,
        y: payload.node.savedPayload.position.y
      }

      floatingObject.setPosition(position)
      payload.node.savedPayload.position = undefined
      if (payload.node.savedPayload.floatingObject.isPinned === true) {
        floatingObject.pinToggle()
      }
      if (payload.node.savedPayload.floatingObject.isFrozen === true) {
        floatingObject.freezeToggle()
      }
      if (payload.node.savedPayload.floatingObject.isCollapsed === true) {
        floatingObject.collapseToggle()
      }
      if (payload.node.savedPayload.floatingObject.angleToParent !== undefined) {
        floatingObject.angleToParent = payload.node.savedPayload.floatingObject.angleToParent
      }
      if (payload.node.savedPayload.floatingObject.distanceToParent !== undefined) {
        floatingObject.distanceToParent = payload.node.savedPayload.floatingObject.distanceToParent
      }
      if (payload.node.savedPayload.floatingObject.arrangementStyle !== undefined) {
        floatingObject.arrangementStyle = payload.node.savedPayload.floatingObject.arrangementStyle
      }
    }

    /*
    For brand new objects being created directly by the user, we will make them inherit some properties
    from their closest siblings, and if they don't have, from their parents.
    */

    if (userAddingNew === true) {
      let definition = APP_SCHEMA_MAP.get(payload.parentNode.type)
      if (definition.properties !== undefined) {
        for (let i = 0; i < definition.properties.length; i++) {
          let property = definition.properties[i]
          if (property.childType === payload.node.type) {
            if (property.type === 'array') {
              let parentNode = payload.parentNode
              let parentNodeArray = parentNode[property.name]
              if (parentNodeArray.length > 1) { // the new node was already added
                let closestSibling = parentNodeArray[parentNodeArray.length - 2]
                if (closestSibling !== undefined) {
                  floatingObject.angleToParent = closestSibling.payload.floatingObject.angleToParent
                  floatingObject.distanceToParent = closestSibling.payload.floatingObject.distanceToParent
                  floatingObject.arrangementStyle = closestSibling.payload.floatingObject.arrangementStyle
                  break
                }
              }
            }
            if (floatingObject.angleToParent === undefined) {
              for (let j = i - 1; j >= 0; j--) {
                let siblingProperty = definition.properties[j]
                let parentNode = payload.parentNode
                let parentNodeProperty = parentNode[siblingProperty.name]
                if (parentNodeProperty !== undefined) {
                  if (siblingProperty.type === 'array') {
                    if (parentNodeProperty.length > 0) {
                      let closestSibling = parentNodeProperty[parentNodeProperty.length - 1]
                      if (closestSibling !== undefined) {
                        floatingObject.angleToParent = closestSibling.payload.floatingObject.angleToParent
                        floatingObject.distanceToParent = closestSibling.payload.floatingObject.distanceToParent
                        floatingObject.arrangementStyle = closestSibling.payload.floatingObject.arrangementStyle
                        break
                      }
                    }
                  } else {
                    let closestSibling = parentNodeProperty
                    if (closestSibling !== undefined) {
                      floatingObject.angleToParent = closestSibling.payload.floatingObject.angleToParent
                      floatingObject.distanceToParent = closestSibling.payload.floatingObject.distanceToParent
                      floatingObject.arrangementStyle = closestSibling.payload.floatingObject.arrangementStyle
                      break
                    }
                  }
                }
              }
              for (let j = i + 1; j < definition.properties.length; j++) {
                let siblingProperty = definition.properties[j]
                let parentNode = payload.parentNode
                let parentNodeProperty = parentNode[siblingProperty.name]
                if (parentNodeProperty !== undefined) {
                  if (siblingProperty.type === 'array') {
                    if (parentNodeProperty.length > 0) {
                      let closestSibling = parentNodeProperty[parentNodeProperty.length - 1]
                      if (closestSibling !== undefined) {
                        floatingObject.angleToParent = closestSibling.payload.floatingObject.angleToParent
                        floatingObject.distanceToParent = closestSibling.payload.floatingObject.distanceToParent
                        floatingObject.arrangementStyle = closestSibling.payload.floatingObject.arrangementStyle
                        break
                      }
                    }
                  } else {
                    let closestSibling = parentNodeProperty
                    if (closestSibling !== undefined) {
                      floatingObject.angleToParent = closestSibling.payload.floatingObject.angleToParent
                      floatingObject.distanceToParent = closestSibling.payload.floatingObject.distanceToParent
                      floatingObject.arrangementStyle = closestSibling.payload.floatingObject.arrangementStyle
                      break
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (floatingObject.angleToParent === undefined) {
        floatingObject.angleToParent = payload.parentNode.payload.floatingObject.angleToParent
        floatingObject.distanceToParent = payload.parentNode.payload.floatingObject.distanceToParent
        floatingObject.arrangementStyle = payload.parentNode.payload.floatingObject.arrangementStyle
      }
    }

    /* Default Values in case there was no way to set a value previous to this. */
    if (floatingObject.angleToParent === undefined) {
      floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_360
    }
    if (floatingObject.distanceToParent === undefined) {
      floatingObject.distanceToParent = DISTANCE_TO_PARENT.PARENT_100X
    }
    if (floatingObject.arrangementStyle === undefined) {
      floatingObject.arrangementStyle = ARRANGEMENT_STYLE.CONCAVE
    }

    let uiObject = newUiObject()
    payload.uiObject = uiObject
    uiObject.fitFunction = canvas.floatingSpace.fitIntoVisibleArea
    uiObject.isVisibleFunction = canvas.floatingSpace.isThisPointVisible
    let menuItemsInitialValues = getMenuItemsInitialValues(uiObject, floatingObject, payload)

    for (let i = 0; i < APP_SCHEMA_ARRAY.length; i++) {
      let schemaNode = APP_SCHEMA_ARRAY[i]
      if (schemaNode.type === payload.node.type) {
        let menuItems = schemaNode.menuItems
        for (let j = 0; j < menuItems.length; j++) {
          let item = menuItems[j]
          item.angle = undefined
          if (item.action.indexOf('Add Missing Children') >= 0) {
            item.action = 'Add Missing Children'
          }
          if (item.action.indexOf('Delete ') >= 0) {
            // item.action = 'Delete UI Object'
          }
          if (item.action.indexOf('Configure ') >= 0) {
            if (schemaNode.editors.config === true) {
              // item.actionFunction = 'uiObject.configEditor.activate'
            }
          }
          if (item.action.indexOf('Edit ') >= 0) {
            if (schemaNode.editors.code === true) {
              // item.actionFunction = 'uiObject.codeEditor.activate'
            }
          }
          if (item.actionFunction === undefined) {
            // item.actionFunction = 'payload.onMenuItemClick'
          }
        }
      }
    }

    uiObject.initialize(payload, menuItemsInitialValues)
    uiObject.container.connectToParent(floatingObject.container, false, false, true, true, false, false, true, true, true, true, true)

    setFloatingObjectBasicProperties(floatingObject, payload)

    if (payload.node.savedPayload !== undefined) {
      if (payload.node.savedPayload.uiObject !== undefined) {
        payload.uiObject.shortcutKey = payload.node.savedPayload.uiObject.shortcutKey
      }
    }

    floatingLayer.addFloatingObject(floatingObject)

    return
  }

  function addLeftIcons (menuItemsInitialValues, floatingObject, isPersonalData) {
    menuItemsInitialValues.push(
      {
        action: 'Pin / Unpin',
        actionFunction: floatingObject.pinToggle,
        actionStatus: floatingObject.getPinStatus,
        currentStatus: false,
        label: undefined,
        visible: true,
        iconPathOn: 'menu-fix-pinned',
        iconPathOff: 'menu-fix-unpinned',
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 1
      }
      )
    menuItemsInitialValues.push(
      {
        action: 'Change Tension Level',
        actionFunction: floatingObject.angleToParentToggle,
        actionStatus: floatingObject.getAngleToParent,
        currentStatus: true,
        label: undefined,
        visible: true,
        icons: ['angle-to-parent-000', 'angle-to-parent-360', 'angle-to-parent-180', 'angle-to-parent-090', 'angle-to-parent-045'],
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 1
      }
      )
    menuItemsInitialValues.push(
      {
        action: 'Change Distance to Paarent',
        actionFunction: floatingObject.distanceToParentToggle,
        actionStatus: floatingObject.getDistanceToParent,
        currentStatus: true,
        label: undefined,
        visible: true,
        icons: ['distance-to-parent-000', 'distance-to-parent-025', 'distance-to-parent-050', 'distance-to-parent-100', 'distance-to-parent-150', 'distance-to-parent-200'],
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 1
      }
        )
    menuItemsInitialValues.push(
      {
        action: 'Change Arrangement Style',
        actionFunction: floatingObject.arrangementStyleToggle,
        actionStatus: floatingObject.getArrangementStyle,
        currentStatus: true,
        label: undefined,
        visible: true,
        icons: ['arrangement-concave', 'arrangement-convex', 'arrangement-vertical-right', 'arrangement-vertical-left', 'arrangement-horizontal-bottom', 'arrangement-horizontal-top'],
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 1
      }
            )
    menuItemsInitialValues.push(
      {
        action: 'Freeze / Unfreeze',
        actionFunction: floatingObject.freezeToggle,
        actionStatus: floatingObject.getFreezeStatus,
        currentStatus: true,
        label: undefined,
        visible: true,
        iconPathOn: 'menu-mobility-unfreeze',
        iconPathOff: 'menu-mobility-freeze',
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 1
      }
      )
    menuItemsInitialValues.push(
      {
        action: 'Collapse / Uncollapse',
        actionFunction: floatingObject.collapseToggle,
        actionStatus: floatingObject.getCollapseStatus,
        currentStatus: false,
        label: undefined,
        visible: true,
        iconPathOn: 'menu-tree-plus',
        iconPathOff: 'menu-tree-minus',
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 1
      }
      )
    menuItemsInitialValues.push(
      {
        action: 'Backup',
        actionFunction: floatingObject.payload.onMenuItemClick,
        label: undefined,
        visible: true,
        iconPathOn: 'menu-backup',
        iconPathOff: 'menu-backup',
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 2
      }
      )
    menuItemsInitialValues.push(
      {
        action: 'Clone',
        actionFunction: floatingObject.payload.onMenuItemClick,
        label: undefined,
        visible: true,
        iconPathOn: 'clone',
        iconPathOff: 'clone',
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 2
      }
        )
    if (isPersonalData !== true) {
      menuItemsInitialValues.push(
        {
          action: 'Share',
          actionFunction: floatingObject.payload.onMenuItemClick,
          label: undefined,
          visible: true,
          iconPathOn: 'menu-share',
          iconPathOff: 'menu-share',
          rawRadius: 12,
          targetRadius: 0,
          currentRadius: 0,
          ring: 2
        }
      )
    }
    menuItemsInitialValues.push(
      {
        action: 'Remove Parent',
        actionFunction: floatingObject.payload.onMenuItemClick,
        label: undefined,
        visible: true,
        iconPathOn: 'detach',
        iconPathOff: 'detach',
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 3
      }
        )
    menuItemsInitialValues.push(
      {
        action: 'Remove Reference',
        actionFunction: floatingObject.payload.onMenuItemClick,
        label: undefined,
        visible: true,
        iconPathOn: 'delink',
        iconPathOff: 'delink',
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 3
      }
            )

    menuItemsInitialValues.push(
      {
        action: 'Open Documentation',
        actionFunction: floatingObject.payload.onMenuItemClick,
        label: undefined,
        visible: true,
        iconPathOn: 'help',
        iconPathOff: 'help',
        rawRadius: 12,
        targetRadius: 0,
        currentRadius: 0,
        ring: 4
      }
    )
  }

  function getMenuItemsInitialValues (uiObject, floatingObject, payload) {
    let menuItemsInitialValues = []

    let nodeDefinition = APP_SCHEMA_MAP.get(payload.node.type)
    if (nodeDefinition !== undefined) {
      if (nodeDefinition.editors !== undefined) {
        if (nodeDefinition.editors.config === true) {
          uiObject.configEditor = newConfigEditor()
          uiObject.configEditor.isVisibleFunction = uiObject.isVisibleFunction
          uiObject.configEditor.container.connectToParent(uiObject.container, false, false, true, true, false, false, false, false)
          uiObject.configEditor.initialize()
        }
        if (nodeDefinition.editors.code === true) {
          uiObject.codeEditor = newCodeEditor()
          uiObject.codeEditor.isVisibleFunction = uiObject.isVisibleFunction
          uiObject.codeEditor.container.connectToParent(uiObject.container, false, false, true, true, false, false, false, false)
          uiObject.codeEditor.initialize()
        }
        if (nodeDefinition.editors.formula === true) {
          uiObject.formulaEditor = newFormulaEditor()
          uiObject.formulaEditor.isVisibleFunction = uiObject.isVisibleFunction
          uiObject.formulaEditor.container.connectToParent(uiObject.container, false, false, true, true, false, false, false, false)
          uiObject.formulaEditor.initialize()
        }
        if (nodeDefinition.editors.condition === true) {
          uiObject.conditionEditor = newConditionEditor()
          uiObject.conditionEditor.isVisibleFunction = uiObject.isVisibleFunction
          uiObject.conditionEditor.container.connectToParent(uiObject.container, false, false, false, true, false, false, false, false)
          uiObject.conditionEditor.initialize()
        }
      }
      if (nodeDefinition.addLeftIcons === true) {
        addLeftIcons(menuItemsInitialValues, floatingObject, nodeDefinition.isPersonalData)
      }
      if (nodeDefinition.isPinned === true) {
        floatingObject.isPinned = true
      }
      if (nodeDefinition.positionLocked === true) {
        floatingObject.positionLocked = true
      }

      for (let i = 0; i < nodeDefinition.menuItems.length; i++) {
        let menutItemDefinition = nodeDefinition.menuItems[i]
        let newMenuItem = JSON.parse(JSON.stringify(menutItemDefinition))

        /* We need to reference the real function based on its name */
        if (menutItemDefinition.actionFunction !== undefined) {
          newMenuItem.actionFunction = eval(menutItemDefinition.actionFunction)
        }

        /* Adding default values */
        if (newMenuItem.visible === undefined) {
          newMenuItem.visible = true
        }

        if (newMenuItem.rawRadius === undefined) {
          newMenuItem.rawRadius = 12
        }

        if (newMenuItem.targetRadius === undefined) {
          newMenuItem.targetRadius = 0
        }

        if (newMenuItem.currentRadius === undefined) {
          newMenuItem.currentRadius = 0
        }

        menuItemsInitialValues.push(newMenuItem)
      }
    } else {
      if (ERROR_LOG === true) { logger.write('[ERROR] getMenuItemsInitialValues -> UI Object Type not Recognized -> type = ' + payload.node.type) }
    }

    return menuItemsInitialValues
  }

  function setFloatingObjectBasicProperties (floatingObject, payload) {
    const FRICTION = 0.95
    const INITIAL_FRICTION = 0.97
    const INITIAL_FONT_SIZE = 12 * 1.5
    const INITIAL_RADIOUS = 45 * 1.5
    const INITIAL_IMAGE_SIZE = 80 * 1.2
    const INITIAL_HIERARCHY_RING = 20

    switch (payload.node.type) {
      case 'Workspace': {
        level_0()
        floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_360
        break
      }

      default: {
        let nodeDefinition = APP_SCHEMA_MAP.get(payload.node.type)
        if (nodeDefinition !== undefined) {
          switch (nodeDefinition.level) {
            case 0: {
              level_0()
              break
            }
            case 1: {
              level_1()
              break
            }
            case 2: {
              level_2()
              break
            }
            case 3: {
              level_3()
              break
            }
            case 4: {
              level_4()
              break
            }
            case 5: {
              level_5()
              break
            }
          }
        }
      }
    }

    function level_0 () {
      floatingObject.targetFriction = 0.93
      floatingObject.friction = INITIAL_FRICTION

      floatingObject.initializeMass(500)
      floatingObject.initializeRadius(INITIAL_RADIOUS)
      floatingObject.initializeHierarchyRing(INITIAL_HIERARCHY_RING)
      floatingObject.initializeImageSize(INITIAL_IMAGE_SIZE)
      floatingObject.initializeFontSize(INITIAL_FONT_SIZE)

      floatingObject.fillStyle = 'rgba(' + UI_COLOR.WHITE + ', 1)'
    }
    function level_1 () {
      floatingObject.targetFriction = 0.94
      floatingObject.friction = INITIAL_FRICTION

      floatingObject.initializeMass(600)
      floatingObject.initializeRadius(INITIAL_RADIOUS)
      floatingObject.initializeHierarchyRing(INITIAL_HIERARCHY_RING)
      floatingObject.initializeImageSize(INITIAL_IMAGE_SIZE)
      floatingObject.initializeFontSize(INITIAL_FONT_SIZE)

      floatingObject.fillStyle = 'rgba(' + UI_COLOR.WHITE + ', 1)'

      if (payload.node.savedPayload === undefined) {
        // floatingObject.angleToParentToggle()
      }
    }
    function level_2 () {
      floatingObject.targetFriction = FRICTION
      floatingObject.friction = INITIAL_FRICTION

      floatingObject.initializeMass(300)
      floatingObject.initializeRadius(INITIAL_RADIOUS - 5)
      floatingObject.initializeHierarchyRing(INITIAL_HIERARCHY_RING)
      floatingObject.initializeImageSize(INITIAL_IMAGE_SIZE - 10)
      floatingObject.initializeFontSize(INITIAL_FONT_SIZE)

      floatingObject.fillStyle = 'rgba(' + UI_COLOR.GREEN + ', 1)'

      if (payload.node.savedPayload === undefined) {
        // floatingObject.angleToParentToggle()
      }
    }
    function level_3 () {
      floatingObject.targetFriction = FRICTION
      floatingObject.friction = INITIAL_FRICTION

      floatingObject.initializeMass(150)
      floatingObject.initializeRadius(INITIAL_RADIOUS - 10)
      floatingObject.initializeHierarchyRing(INITIAL_HIERARCHY_RING)
      floatingObject.initializeImageSize(INITIAL_IMAGE_SIZE - 20)
      floatingObject.initializeFontSize(INITIAL_FONT_SIZE)

      floatingObject.fillStyle = 'rgba(' + UI_COLOR.RUSTED_RED + ', 1)'

      if (payload.node.savedPayload === undefined) {
        // floatingObject.angleToParentToggle()
      }
    }
    function level_4 () {
      floatingObject.targetFriction = FRICTION
      floatingObject.friction = INITIAL_FRICTION

      floatingObject.initializeMass(75)
      floatingObject.initializeRadius(INITIAL_RADIOUS - 15)
      floatingObject.initializeHierarchyRing(INITIAL_HIERARCHY_RING)
      floatingObject.initializeImageSize(INITIAL_IMAGE_SIZE - 30)
      floatingObject.initializeFontSize(INITIAL_FONT_SIZE)

      floatingObject.fillStyle = 'rgba(' + UI_COLOR.TITANIUM_YELLOW + ', 1)'

      if (payload.node.savedPayload === undefined) {
        // floatingObject.angleToParentToggle()
      }
    }
    function level_5 () {
      floatingObject.targetFriction = FRICTION
      floatingObject.friction = INITIAL_FRICTION

      floatingObject.initializeMass(50)
      floatingObject.initializeRadius(INITIAL_RADIOUS - 20)
      floatingObject.initializeHierarchyRing(INITIAL_HIERARCHY_RING)
      floatingObject.initializeImageSize(INITIAL_IMAGE_SIZE - 40)
      floatingObject.initializeFontSize(INITIAL_FONT_SIZE)

      floatingObject.fillStyle = 'rgba(' + UI_COLOR.RED + ', 1)'
    }
    function level_6 () {
      floatingObject.targetFriction = FRICTION
      floatingObject.friction = INITIAL_FRICTION

      floatingObject.initializeMass(25)
      floatingObject.initializeRadius(INITIAL_RADIOUS - 25)
      floatingObject.initializeHierarchyRing(INITIAL_HIERARCHY_RING)
      floatingObject.initializeImageSize(INITIAL_IMAGE_SIZE - 50)
      floatingObject.initializeFontSize(INITIAL_FONT_SIZE)

      floatingObject.fillStyle = 'rgba(' + UI_COLOR.RED + ', 1)'
    }

    floatingObject.labelStrokeStyle = 'rgba(' + UI_COLOR.WHITE + ', 1)'
  }

  function destroyUiObject (payload) {
    if (payload === undefined) { return }
    floatingLayer.removeFloatingObject(payload.floatingObject.handle)

    payload.floatingObject.finalize()
    payload.floatingObject = undefined

    payload.uiObject.finalize()
    payload.uiObject = undefined

    payload.referenceParent = undefined
    payload.parent = undefined
    payload.chainParent = undefined
    payload.node.savedPayload = undefined
  }
}
