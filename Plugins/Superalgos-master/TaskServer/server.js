/* Callbacks default responses. */

global.DEFAULT_OK_RESPONSE = {
    result: "Ok",
    message: "Operation Succeeded"
};

global.DEFAULT_FAIL_RESPONSE = {
    result: "Fail",
    message: "Operation Failed"
};

global.DEFAULT_RETRY_RESPONSE = {
    result: "Retry",
    message: "Retry Later"
};

global.CUSTOM_OK_RESPONSE = {
    result: "Ok, but check Message",
    message: "Custom Message"
};

global.CUSTOM_FAIL_RESPONSE = {
    result: "Fail Because",
    message: "Custom Message"
};

const ONE_DAY_IN_MILISECONDS = 24 * 60 * 60 * 1000;
global.LOGGER_MAP = new Map()
global.SESSION_MAP = new Map()

process.on('uncaughtException', function (err) {
    console.log('[ERROR] Task Server -> server -> uncaughtException -> err.message = ' + err.message)
    console.log('[ERROR] Task Server -> server -> uncaughtException -> err.stack = ' + err.stack)
    global.EXIT_NODE_PROCESS()
})

process.on('unhandledRejection', (reason, p) => {
    console.log('[ERROR] Task Server -> server -> unhandledRejection -> reason = ' + JSON.stringify(reason))
    console.log('[ERROR] Task Server -> server -> unhandledRejection -> p = ' + JSON.stringify(p))
    global.EXIT_NODE_PROCESS()
})

function finalizeLoggers() {
    global.LOGGER_MAP.forEach(forEachLogger)

    function forEachLogger(logger) {
        logger.finalize()
    }
}

function finalizeSessions() {
    global.SESSION_MAP.forEach(forEachSession)

    function forEachSession(session) {
        global.EVENT_SERVER_CLIENT.raiseEvent(session, 'Stopped')
    }
}

process.on('exit', function (code) {

    if (global.TASK_NODE !== undefined) {
        /* We send an event signaling that the Task is being terminated. */
        let key = global.TASK_NODE.name + '-' + global.TASK_NODE.type + '-' + global.TASK_NODE.id

        global.EVENT_SERVER_CLIENT.raiseEvent(key, 'Stopped') // Meaning Task Stopped
        global.EVENT_SERVER_CLIENT.finalize()
        global.EVENT_SERVER_CLIENT = undefined
    }

    //console.log('[INFO] Task Server -> server -> process.on.exit -> About to exit -> code = ' + code)
})

/* Here we listen for the message to stop this Task / Process comming from the Task Manager, which is the paret of this node js process. */
process.on('message', message => {
    if (message === 'Stop this Task') {

        global.STOP_TASK_GRACEFULLY = true;

        /*
        There are some process that might no be able to end grafully, for example the ones schedulle to process information in a future day or month.
        In order to be sure that the process will be terminated, we schedulle one forced exit in 2 minutes from now.
        */
        let key = global.TASK_NODE.name + '-' + global.TASK_NODE.type + '-' + global.TASK_NODE.id
        console.log('[INFO] Task Server -> server -> process.on -> Stopping Task ' + key + '. Nodejs process will be exited in less than 1 minute.')
        setTimeout(global.EXIT_NODE_PROCESS, 60000);
    } 
});


let shuttingDownProcess = false
global.EXIT_NODE_PROCESS = function exitProcess() {

    if (shuttingDownProcess === true) { return }
    shuttingDownProcess = true

    /* Signal that all sessions are stopping. */
    finalizeSessions()

    /* Cleaning Before Exiting. */
    clearInterval(global.HEARTBEAT_INTERVAL_HANDLER)

    for (let i = 0; i < global.TASK_NODE.bot.processes.length; i++) {
        let code = global.TASK_NODE.bot.processes[i].code
        let process = global.TASK_NODE.bot.processes[i]

        key = process.name + '-' + process.type + '-' + process.id
        global.EVENT_SERVER_CLIENT.raiseEvent(key, 'Stopped') // Meaning Process Stopped
    }

    finalizeLoggers()
    //console.log("[INFO] Task Server -> " + global.TASK_NODE.name + " -> EXIT_NODE_PROCESS -> Task Server will stop in 10 seconds.");

    setTimeout(process.exit, 10000) // We will give 10 seconds to logs be written on file
}

require('dotenv').config();

global.WRITE_LOGS_TO_FILES = process.env.WRITE_LOGS_TO_FILES

/*
We need to count how many process instances we deployd and how many of them have already finished their job, either
because they just finished or because there was a request to stop the proceses. In this way, once we reach the
amount of instances started, we can safelly destroy the rest of the objects running and let this nodejs process die.
*/

global.ENDED_PROCESSES_COUNTER = 0
global.TOTAL_PROCESS_INSTANCES_CREATED = 0

/*

We read the first string sent as an argument when the process was created by the Task Manager. There we will find the information of the identity
of this Task and know exactly what to run within this server instance. 

*/
let taskId = process.argv[2] // reading what comes as an argument of the nodejs process.

/* Setting up the global Event Handler */

let EVENT_SERVER_CLIENT = require('./EventServerClient.js');
 
global.EVENT_SERVER_CLIENT = EVENT_SERVER_CLIENT.newEventsServerClient()
global.EVENT_SERVER_CLIENT.initialize(preLoader)
global.STOP_TASK_GRACEFULLY = false;

function preLoader() {
    if (taskId !== undefined) {
        /* The Task Manager sent the info via a process argument. In this case we listen to an event with the Task Info that should be emitted at the UI */
        try {
            //console.log('[INFO] Task Server -> server -> preLoader -> Listening to starting event -> key = ' + 'Task Server - ' + taskId)
            global.EVENT_SERVER_CLIENT.listenToEvent('Task Server - ' + taskId, 'Run Task', undefined, 'Task Server - ' + taskId, undefined, eventReceived)
            global.EVENT_SERVER_CLIENT.raiseEvent('Task Manager - ' + taskId, 'Nodejs Process Ready for Task')
            function eventReceived(message) {
                global.TASK_NODE = message
                global.TASK_NODE = JSON.parse(message.event.taskDefinition)
                global.TASK_NETWORK = JSON.parse(message.event.networkDefinition)
                bootLoader()
            }
        } catch (err) {
            console.log('[ERROR] Task Server -> server -> preLoader -> global.TASK_NODE -> ' + err.stack)
            console.log('[ERROR] Task Server -> server -> preLoader -> global.TASK_NODE = ' + JSON.stringify(global.TASK_NODE).substring(0, 1000))
        }
    }
    else {  /* This process was started not by the Task Manager, but independently (most likely for debugging purposes). In this case we listen to an event with the Task Info that should be emitted at the UI */
        try { 
            //console.log('[INFO] Task Server -> server -> preLoader -> Waiting for event to start debugging...')
            global.EVENT_SERVER_CLIENT.listenToEvent('Task Server', 'Debug Task Started', undefined, 'Task Server', undefined, startDebugging)
            function startDebugging(message) {
                global.TASK_NODE = message
                global.TASK_NODE = JSON.parse(message.event.taskDefinition)
                global.TASK_NETWORK = JSON.parse(message.event.networkDefinition)
                bootLoader()
            }
        } catch (err) {
            console.log('[ERROR] Task Server -> server -> preLoader -> global.TASK_NODE -> ' + err.stack)
            console.log('[ERROR] Task Server -> server -> preLoader -> global.TASK_NODE = ' + JSON.stringify(global.TASK_NODE).substring(0, 1000))
        }
    }
}

function bootLoader() {

    /* Heartbeat sent to the UI */

    let key = global.TASK_NODE.name + '-' + global.TASK_NODE.type + '-' + global.TASK_NODE.id

    global.EVENT_SERVER_CLIENT.createEventHandler(key)
    global.EVENT_SERVER_CLIENT.raiseEvent(key, 'Running') // Meaning Task Running
    global.HEARTBEAT_INTERVAL_HANDLER = setInterval(taskHearBeat, 1000)

    function taskHearBeat() {

        /* The heartbeat event is raised at the event handler of the instance of this task, created at the UI. */        
        let event = {
            seconds: (new Date()).getSeconds()
        }
         global.EVENT_SERVER_CLIENT.raiseEvent(key, 'Heartbeat', event)
    }

    for (let processIndex = 0; processIndex < global.TASK_NODE.bot.processes.length; processIndex++) {
        let code = global.TASK_NODE.bot.processes[processIndex].code

        /* Validate that the minimun amount of input required are defined. */

        if (global.TASK_NODE.bot.processes[processIndex].marketReference === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Process Instance without a Market Reference. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex]));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Market Reference without a Reference Parent. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].marketReference) + ", bot = " + global.TASK_NODE.bot.name);
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.parentNode === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Market without a Parent. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.parentNode.parentNode === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Exchange Markets without a Parent. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.parentNode));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.baseAsset === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Market without a Base Asset. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.quotedAsset === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Market without a Quoted Asset. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.baseAsset.referenceParent === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Base Asset without a Reference Parent. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.baseAsset));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.quotedAsset.referenceParent === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Quoted Asset without a Reference Parent. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].marketReference.referenceParent.quotedAsset));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].referenceParent === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Process Instance without a Reference Parent. This process will not be executed. -> Process Instance = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex]));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Process Definition without parent Bot Definition. -> Process Definition = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].referenceParent));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode.parentNode === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Bot Definition without parent Data Mine. -> Bot Definition = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].referenceParent.code.codeName === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Process Definition without a codeName defined. -> Process Definition = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].referenceParent));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode.code.codeName === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Bot Definition without a codeName defined. -> Bot Definition = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode));
            continue
        }

        if (global.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode.parentNode.code.codeName === undefined) {
            console.log("[WARN] Task Server -> server -> bootLoader -> Data Mine without a codeName defined. -> Data Mine Definition = " + JSON.stringify(global.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode.parentNode));
            continue
        }

        startRoot(processIndex);
    }
}

function startRoot(processIndex) {

   // console.log('[INFO] Task Server -> server -> startRoot -> Entering function. ')

    const ROOT_MODULE = require('./Root')
    let root = ROOT_MODULE.newRoot()

    root.initialize(onInitialized)

    function onInitialized() {
        //console.log('[INFO] Task Server -> server -> startRoot -> onInitialized -> Entering function. ')
        root.start(processIndex)
    }
}

global.getPercentage = function (fromDate, currentDate, lastDate) {
    let fromDays = Math.trunc(fromDate.valueOf() / ONE_DAY_IN_MILISECONDS)
    let currentDays = Math.trunc(currentDate.valueOf() / ONE_DAY_IN_MILISECONDS)
    let lastDays = Math.trunc(lastDate.valueOf() / ONE_DAY_IN_MILISECONDS)
    let percentage = (currentDays - fromDays) * 100 / (lastDays - fromDays)
    if ((lastDays - fromDays) === 0) {
        percentage = 100
    }
    return percentage 
}

global.areEqualDates = function (date1, date2) {
    let day1Days = Math.trunc(date1.valueOf() / ONE_DAY_IN_MILISECONDS)
    let day2Days = Math.trunc(date2.valueOf() / ONE_DAY_IN_MILISECONDS)
 
    if (day1Days === day2Days) {
        return true
    } else {
        return false
    }
}

