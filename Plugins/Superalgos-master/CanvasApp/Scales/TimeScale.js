function newTimeScale () {
  const MODULE_NAME = 'Time Scale'

  let thisObject = {
    container: undefined,
    date: undefined,
    fitFunction: undefined,
    payload: undefined,
    isVisible: true,
    fromDate: undefined,
    toDate: undefined,
    onMouseOverSomeTimeMachineContainer: onMouseOverSomeTimeMachineContainer,
    physics: physics,
    draw: draw,
    drawBackground: drawBackground,
    drawForeground: drawForeground,
    getContainer: getContainer,
    initialize: initialize,
    finalize: finalize
  }

  thisObject.container = newContainer()
  thisObject.container.initialize(MODULE_NAME)

  thisObject.container.isDraggeable = false
  thisObject.container.isClickeable = false
  thisObject.container.isWheelable = true
  thisObject.container.detectMouseOver = true

  thisObject.container.frame.width = UI_PANEL.WIDTH.NORMAL
  thisObject.container.frame.height = 40

  let visible = true
  let autoScaleButton
  let isMouseOver

  let onMouseWheelEventSubscriptionId
  let onMouseOverEventSubscriptionId
  let onMouseNotOverEventSubscriptionId
  let onScaleChangedEventSubscriptionId

  let coordinateSystem
  let limitingContainer

  let wheelDeltaDirection
  let wheelDeltaCounter = 0

  return thisObject

  function finalize () {
    thisObject.container.eventHandler.stopListening(onMouseWheelEventSubscriptionId)
    thisObject.container.eventHandler.stopListening(onMouseOverEventSubscriptionId)
    thisObject.container.eventHandler.stopListening(onMouseNotOverEventSubscriptionId)
    coordinateSystem.eventHandler.stopListening(onScaleChangedEventSubscriptionId)

    thisObject.container.finalize()
    thisObject.container = undefined
    thisObject.fitFunction = undefined
    thisObject.payload = undefined

    coordinateSystem = undefined
    limitingContainer = undefined

    autoScaleButton.finalize()
    autoScaleButton = undefined
  }

  function initialize (pCoordinateSystem, pLimitingContainer) {
    coordinateSystem = pCoordinateSystem
    limitingContainer = pLimitingContainer

    onMouseWheelEventSubscriptionId = thisObject.container.eventHandler.listenToEvent('onMouseWheel', onMouseWheel)
    onMouseOverEventSubscriptionId = thisObject.container.eventHandler.listenToEvent('onMouseOver', onMouseOver)
    onMouseNotOverEventSubscriptionId = thisObject.container.eventHandler.listenToEvent('onMouseNotOver', onMouseNotOver)
    onScaleChangedEventSubscriptionId = coordinateSystem.eventHandler.listenToEvent('Scale Changed', onScaleChanged)

    autoScaleButton = newAutoScaleButton()
    autoScaleButton.container.connectToParent(thisObject.container)
    autoScaleButton.initialize('X', coordinateSystem)

    readObjectState()
  }

  function onMouseOverSomeTimeMachineContainer (event) {
    if (event.containerId === undefined) {
      /* This happens when the mouse over was not at the instance of a certain scale, but anywhere else. */
      visible = true
    } else {
      if (event.containerId === thisObject.container.id) {
        visible = true
      } else {
        visible = false
        turnOnCounter = 0
      }
    }
  }

  function onMouseOver (event) {
    isMouseOver = true
    event.containerId = thisObject.container.id
    thisObject.container.eventHandler.raiseEvent('onMouseOverScale', event)
  }

  function onMouseNotOver () {
    isMouseOver = false
  }

  function onMouseWheel (event) {
    if (IS_MAC) {
      let sensitivity
      if (event.wheelDelta < 0) {
        if (event.shiftKey === true) {
          sensitivity = 20
        } else {
          sensitivity = 5
        }
        if (wheelDeltaDirection === -1) {
          wheelDeltaCounter++
          if (wheelDeltaCounter < sensitivity) {
            return
          } else {
            wheelDeltaCounter = 0
          }
        } else {
          wheelDeltaCounter = 0
          wheelDeltaDirection = -1
          return
        }
      } else {
        if (wheelDeltaDirection === 1) {
          wheelDeltaCounter++
          if (wheelDeltaCounter < sensitivity) {
            return
          } else {
            wheelDeltaCounter = 0
          }
        } else {
          wheelDeltaCounter = 0
          wheelDeltaDirection = 1
          return
        }
      }
    }

    if (event.shiftKey === true) {
      autoScaleButton.container.eventHandler.raiseEvent('onMouseWheel', event)
      return
    }
    let factor
    let morePower = 10
    if (event.buttons === 4) { morePower = 1 } // Mouse wheel pressed.

    let delta = event.wheelDelta
    if (delta < 0) {
      factor = -0.01 * morePower
    } else {
      factor = 0.01 * morePower
    }

    coordinateSystem.zoomX(factor, event, limitingContainer, MODULE_NAME)
  }

  function onScaleChanged () {
    saveObjectState()
  }

  function getContainer (point, purpose) {
    if (thisObject.container.frame.isThisPointHere(point, true) === true) {
      return thisObject.container
    }
  }

  function saveObjectState () {
    try {
      let code = JSON.parse(thisObject.payload.node.code)
      code.fromDate = (new Date(coordinateSystem.min.x)).toISOString()
      code.toDate = (new Date(coordinateSystem.max.x)).toISOString()
      code.autoMinScale = coordinateSystem.autoMinXScale
      code.autoMaxScale = coordinateSystem.autoMaxXScale
      thisObject.payload.node.code = JSON.stringify(code, null, 4)
    } catch (err) {
       // we ignore errors here since most likely they will be parsing errors.
    }
  }

  function readObjectState () {
    try {
      let code = JSON.parse(thisObject.payload.node.code)

      if (
      (isNaN(Date.parse(code.fromDate)) || code.fromDate === null || code.fromDate === undefined) ||
      (isNaN(Date.parse(code.toDate)) || code.toDate === null || code.toDate === undefined)
        ) {
        // not using this value
      } else {
        if (thisObject.fromDate !== Date.parse(code.fromDate) || thisObject.toDate !== Date.parse(code.toDate)) {
          thisObject.fromDate = Date.parse(code.fromDate)
          thisObject.toDate = Date.parse(code.toDate)
          coordinateSystem.min.x = thisObject.fromDate
          coordinateSystem.max.x = thisObject.toDate

          if (code.autoMinScale !== undefined && (code.autoMinScale === true || code.autoMinScale === false) && code.autoMaxScale !== undefined && (code.autoMaxScale === true || code.autoMaxScale === false)) {
            coordinateSystem.autoMinXScale = code.autoMinScale
            coordinateSystem.autoMaxXScale = code.autoMaxScale
            autoScaleButton.setStatus(code.autoMinScale, code.autoMaxScale)
          }
          coordinateSystem.recalculateScale()
        }
      }
      saveObjectState() // this overrides any invalid value at the config.
    } catch (err) {
       // we ignore errors here since most likely they will be parsing errors.
    }
  }

  function physics () {
    readObjectState()
    positioningPhysics()
  }

  function positioningPhysics () {
    /* Container Limits */

    let upCorner = {
      x: 0,
      y: 0
    }

    let bottonCorner = {
      x: limitingContainer.frame.width,
      y: limitingContainer.frame.height
    }

    upCorner = transformThisPoint(upCorner, limitingContainer)
    bottonCorner = transformThisPoint(bottonCorner, limitingContainer)

    upCorner = limitingContainer.fitFunction(upCorner, true)
    bottonCorner = limitingContainer.fitFunction(bottonCorner, true)

    /* Mouse Position Date Calculation */
    let timePoint = {
      x: canvas.mouse.position.x,
      y: 0
    }

    let mouseDate = getDateFromPointAtBrowserCanvas(timePoint, limitingContainer, coordinateSystem)

    thisObject.date = new Date(mouseDate)

    /* timeScale Positioning */
    timePoint = {
      x: 0,
      y: 0
    }

    timePoint = transformThisPoint(timePoint, limitingContainer.frame.container)
    timePoint.x = canvas.mouse.position.x - thisObject.container.frame.width / 2

    /* Checking against the container limits. */
    if (timePoint.x < upCorner.x) { timePoint.x = upCorner.x }
    if (timePoint.x + thisObject.container.frame.width > bottonCorner.x) { timePoint.x = bottonCorner.x - thisObject.container.frame.width }
    if (timePoint.y < upCorner.y) { timePoint.y = upCorner.y }
    if (timePoint.y + thisObject.container.frame.height > bottonCorner.y) { timePoint.y = bottonCorner.y - thisObject.container.frame.height }

    thisObject.container.frame.position.x = timePoint.x
    thisObject.container.frame.position.y = timePoint.y

    thisObject.isVisible = true
    if (thisObject.container.frame.position.y + thisObject.container.frame.height * 4 > bottonCorner.y ||
        thisObject.container.frame.position.y < upCorner.y ||
      thisObject.container.frame.position.x < upCorner.x) {
      thisObject.isVisible = false
    }

    if (canvas.chartingSpace.viewport.zoomTargetLevel < ZOOM_OUT_THRESHOLD_FOR_DISPLAYING_SCALES) {
      thisObject.isVisible = false
    }
  }

  function drawBackground () {
    drawScale()
  }

  function drawScale () {
    const SEPARATION = 150
    const NUMBER_OF_LABELS = Math.trunc(canvas.chartingSpace.viewport.width / SEPARATION)
    const FONT_SIZE = 15

    for (let i = 0; i <= NUMBER_OF_LABELS; i++) {
      let timePoint = {
        x: SEPARATION * (i + 1),
        y: 0
      }

      let time = getDateFromPointAtBrowserCanvas(timePoint, limitingContainer, coordinateSystem)
      let labels = scaleLabels(time, true)
      let labelDisplace = labels[1].length * FONT_SIZE * FONT_ASPECT_RATIO

      let timePoint1 = {
        x: SEPARATION * (i + 1) - labelDisplace,
        y: 0
      }
      let timePoint2 = {
        x: SEPARATION * (i + 1) + labelDisplace,
        y: 0
      }

      let fitPoint1 = thisObject.fitFunction(timePoint1)
      let fitPoint2 = thisObject.fitFunction(timePoint2)

      if (fitPoint1.x === timePoint1.x && fitPoint2.x === timePoint2.x) {
        drawLabel(labels[1], 1 / 2, 0, 18, 17, FONT_SIZE, thisObject.container, UI_COLOR.GREY, timePoint1.x, undefined)
        drawLabel(labels[2], 1 / 2, 0, 18, 30, 12, thisObject.container, UI_COLOR.GREY, timePoint1.x, undefined)
      }
    }
  }

  function draw () {
    drawScaleBox()
    autoScaleButton.draw()
    if (visible === false) {
      drawScaleDisplayCover(thisObject.container)
    }
  }

  function drawForeground () {
    if (isMouseOver === true) {
      drawScaleBox()
      autoScaleButton.draw()
    }
  }

  function drawScaleBox () {
    if (thisObject.date === undefined) { return }

    let icon1 = canvas.designSpace.iconByUiObjectType.get(thisObject.payload.node.payload.parentNode.type)
    let icon2 = canvas.designSpace.iconByUiObjectType.get(thisObject.payload.node.type)

    let backgroundColor = UI_COLOR.BLACK
    let labels = scaleLabels(thisObject.date)

    drawScaleDisplay(labels[0], labels[1], labels[2], 0, 0, 0, icon1, icon2, thisObject.container, backgroundColor)
  }

  function scaleLabels (date, excludeYear) {
    let label = date.toUTCString()
    let labelArray = label.split(' ')
    let label1 = thisObject.payload.node.payload.parentNode.name
    let label2 = labelArray[1] + ' ' + labelArray[2] + ' ' + labelArray[3]
    let label3 = labelArray[4]

    if (excludeYear === true) {
      label2 = labelArray[1] + ' ' + labelArray[2]
    }

    return [label1, label2, label3]
  }
}

