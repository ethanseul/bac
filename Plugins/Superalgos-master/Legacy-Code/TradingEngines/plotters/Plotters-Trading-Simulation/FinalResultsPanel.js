﻿
function newAAMastersPlottersTradingSimulationTradingSimulationFinalResultsPanel() {

    let thisObject = {
        fitFunction: undefined,
        onEventRaised: onEventRaised,
        container: undefined,
        draw: draw,
        getContainer: getContainer,
        initialize: initialize,
        finalize: finalize
    };

    let container = newContainer();
    container.initialize();
    thisObject.container = container;

    container.displacement.containerName = "Final Results";
    container.frame.containerName = "Final Results";

    let currentRecord;
    let lastRecord;
    let panelTabButton


    return thisObject;

    function initialize() {

        thisObject.container.frame.width = UI_PANEL.WIDTH.NORMAL * 2;
        thisObject.container.frame.height = UI_PANEL.HEIGHT.NORMAL * 2.5;

        thisObject.container.frame.position.x = viewPort.visibleArea.topLeft.x + thisObject.container.frame.width * 1;
        thisObject.container.frame.position.y = viewPort.visibleArea.topRight.y;

        panelTabButton = newPanelTabButton()
        panelTabButton.parentContainer = thisObject.container
        panelTabButton.container.frame.parentFrame = thisObject.container.frame
        panelTabButton.fitFunction = thisObject.fitFunction
        panelTabButton.initialize()

    }

    function finalize() {

    }

    function getContainer(point) {

        let container;

        container = panelTabButton.getContainer(point)
        if (container !== undefined) { return container }

        if (thisObject.container.frame.isThisPointHere(point, true) === true) {

            let checkPoint = {
                x: point.x,
                y: point.y
            }

            checkPoint = thisObject.fitFunction(checkPoint)

            if (point.x === checkPoint.x && point.y === checkPoint.y) {
                return thisObject.container;
            }
        }
    }


    function onEventRaised(records) {

        currentRecord = records.currentRecord;
        lastRecord = records.lastRecord

    }


    function draw() {

        thisObject.container.frame.draw(false, false, true, thisObject.fitFunction);

        plotCurrentRecordInfo();

        panelTabButton.draw()
    }


    function plotCurrentRecordInfo() {

        if (currentRecord === undefined) { return; }
        if (lastRecord === undefined) { return; }

        const frameBodyHeight = thisObject.container.frame.getBodyHeight();
        const frameTitleHeight = thisObject.container.frame.height - frameBodyHeight;

        const X_AXIS = thisObject.container.frame.width / 2;
        const Y_AXIS = frameTitleHeight + frameBodyHeight / 2;


        /* put the labels with the records values */

        browserCanvasContext.beginPath();

        let y = 0;
        let increment = 0.024;

        y = y + increment;
        y = y + increment;
        printLabel('Current Position', X_AXIS, frameTitleHeight + frameBodyHeight * y, '1', 14);

        y = y + increment;
        printLabel('Size', X_AXIS, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.positionSize, X_AXIS, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Rate', X_AXIS, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.sellRate, X_AXIS, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Stop', X_AXIS, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.stopLoss, X_AXIS, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Take Profit', X_AXIS, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.takeProfit, X_AXIS, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Periods', X_AXIS, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((currentRecord.positionPeriods), X_AXIS, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Days', X_AXIS, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((currentRecord.positionDays).toFixed(2), X_AXIS, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        y = y + increment;
        printLabel('Latest Position', X_AXIS, frameTitleHeight + frameBodyHeight * y, '1', 14);

        y = y + increment;
        printLabel('Profit / Loss', X_AXIS, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((currentRecord.lastTradeProfitLoss), X_AXIS, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('ROI', X_AXIS, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((currentRecord.lastTradeROI).toFixed(2) + ' % ', X_AXIS, frameTitleHeight + frameBodyHeight * y, '1.00', 14);



        let bifurcationLevel = y
        y = y + increment;
        y = y + increment;
        printLabel('Partial Results', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1', 14);

        y = y + increment;
        printLabel('Profit / Loss', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.profit, X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Trades', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.roundtrips, X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Hits', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.hits, X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Fails', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.fails, X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Hit Ratio', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((currentRecord.hitRatio * 100).toFixed(2) + ' %', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('ROI', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((currentRecord.ROI * 100).toFixed(2) + ' %', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Periods', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.periods, X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Days', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(currentRecord.days, X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Anualized Rate of Return', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((currentRecord.anualizedRateOfReturn * 100).toFixed(2) + ' %', X_AXIS - thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);


        y = bifurcationLevel

        y = y + increment;
        y = y + increment;
        printLabel('Final Results', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1', 14);

        y = y + increment;
        printLabel('Profit / Loss', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(lastRecord.profit, X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Trades', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(lastRecord.roundtrips, X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Hits', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(lastRecord.hits, X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Fails', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(lastRecord.fails, X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Hit Ratio', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((lastRecord.hitRatio * 100).toFixed(2) + ' %', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('ROI', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((lastRecord.ROI * 100).toFixed(2) + ' %', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Periods', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(lastRecord.periods, X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Days', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel(lastRecord.days, X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);

        y = y + increment;
        printLabel('Anualized Rate of Return', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '0.60');
        y = y + increment;
        printLabel((lastRecord.anualizedRateOfReturn * 100).toFixed(2) + ' %', X_AXIS + thisObject.container.frame.width / 4, frameTitleHeight + frameBodyHeight * y, '1.00', 14);



        function printLabel(labelToPrint, x, y, opacity, fontSize) {

            let labelPoint;
            if (fontSize === undefined) { fontSize = 10 };

            browserCanvasContext.font = fontSize + 'px ' + UI_FONT.PRIMARY;

            let label = '' + labelToPrint;
            if (isNaN(label) === false) {
                label = Number(label).toLocaleString();
                if ((label === "-0" || label === "0") && (labelToPrint !== 0) && (labelToPrint !== "0.00")) {
                    label = Number(labelToPrint).toFixed(6);
                }
            }
            let xOffset = label.length / 2 * fontSize * FONT_ASPECT_RATIO;

            labelPoint = {
                x: x - xOffset,
                y: y
            };

            labelPoint = thisObject.container.frame.frameThisPoint(labelPoint);
            labelPoint = thisObject.fitFunction(labelPoint)

            browserCanvasContext.fillStyle = 'rgba(' + UI_COLOR.DARK + ', ' + opacity + ')';
            browserCanvasContext.fillText(label, labelPoint.x, labelPoint.y);

        }

        browserCanvasContext.closePath();
        browserCanvasContext.fill();

        /* Parameters */
        let params
        let paramsArray = []
        let positionTaken = false

        if (currentRecord.positionSize > 0) {
            positionTaken = true
        }

        params = {}
        params.VALUE = currentRecord.balanceA;
        params.INIT_VALUE = currentRecord.initialBalanceA
        params.MIN_VALUE = currentRecord.minimunBalanceA
        params.MAX_VALUE = currentRecord.maximunBalanceA
        params.ASSET_LABEL = 'Asset A'
        params.ASSET_NAME = DEFAULT_MARKET.assetB
        params.LEFT_OFFSET = 100
        params.POSITION_TAKEN = positionTaken
        params.BASE_ASSET = currentRecord.baseAsset
        params.DECIMALS = 4

        paramsArray.push(params)

        params = {}
        params.VALUE = currentRecord.balanceB;
        params.MIN_VALUE = currentRecord.minimunBalanceB
        params.INIT_VALUE = currentRecord.initialBalanceB
        params.MAX_VALUE = currentRecord.maximunBalanceB
        params.ASSET_LABEL = 'Asset B'
        params.ASSET_NAME = DEFAULT_MARKET.assetA
        params.LEFT_OFFSET = 220
        params.POSITION_TAKEN = positionTaken
        params.BASE_ASSET = currentRecord.baseAsset
        params.DECIMALS = 2

        paramsArray.push(params)

        canvas.cockpitSpace.assetBalances.setParamsArray(paramsArray)
    }
}



























