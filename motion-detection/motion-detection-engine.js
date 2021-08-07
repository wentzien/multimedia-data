const MotionDetectionEngine = (function () {
    let stream;
    let video;
    let captureInterval;

    let motionCanvas;
    let captureCanvas;
    let diffCanvas;

    let captureContext;
    let motionContext;
    let diffContext;

    function init() {
        video = document.createElement("video");
        video.autoplay = true;

        motionCanvas = document.createElement("canvas");

        captureCanvas = document.createElement("canvas");
        captureCanvas.width = 400;
        captureCanvas.height = 300;
        captureContext = captureCanvas.getContext("2d");

        diffCanvas = document.createElement("canvas");
        diffCanvas.width = 400;
        diffCanvas.height = 300;
        diffCanvas.getContext("2d");

        const streamSettings = {
            audio: false,
            video: {
                width: 400,
                height: 300
            }
        }
        getMedia(streamSettings);
    }

    async function getMedia(constraints) {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            console.log(err);
        }
    }

    function start() {
        video.addEventListener("canplay", startCapture);
    }

    function startCapture() {
        captureInterval = setInterval(capture, 100);
    }

    function startCapture() {

    }

    return {
        init: init
    }
})();