const MotionDetection = class {
    constructor(settings) {
        console.log(settings)

        this.stream = null;
        this.video = settings.videoRef;
        this.oldCapturedImage = false;

        this.settings = {};
        this.settings.captureIntervalTime = 100;
        this.settings.frameWidth = 400;
        this.settings.frameHeight = 300;
        this.settings.pixelDiffThreshold = 100;

        const {frameWidth, frameHeight} = this.settings;

        this.score = settings.scoreRef;

        this.motionCanvas = settings.motionCanvasRef //|| document.createElement("canvas");
        this.captureCanvas = settings.captureCanvasRef //|| document.createElement("canvas");
        this.diffCanvas = settings.diffCanvasRef //|| document.createElement("canvas");
        const {motionCanvas, captureCanvas, diffCanvas} = this;

        motionCanvas.width = frameWidth;
        motionCanvas.height = frameHeight;
        this.motionContext = this.motionCanvas.getContext("2d");

        captureCanvas.width = frameWidth;
        captureCanvas.height = frameHeight;
        this.captureContext = this.captureCanvas.getContext("2d");

        diffCanvas.width = frameWidth;
        diffCanvas.height = frameHeight;
        this.diffContext = this.diffCanvas.getContext("2d");

    }

    async start() {
        const {video} = this;
        const {frameWidth, frameHeight} = this.settings;

        await this.#getMedia({
            audio: false,
            video: {
                width: frameWidth,
                height: frameHeight
            }
        });

        video.addEventListener("loadedmetadata", () => {
            video.play();
            this.#startCapture();
        });

        video.srcObject = this.stream;
    }

    #startCapture() {
        const {captureIntervalTime} = this.settings;
        setInterval(() => {
            this.#capture();
        }, captureIntervalTime);
    }

    #capture() {
        const {video, score} = this;
        let {oldCapturedImage} = this;
        const {frameWidth, frameHeight} = this.settings;
        const {captureContext, diffContext, motionContext} = this;

        captureContext.drawImage(video, 0, 0, frameWidth, frameHeight);
        const captureImageData = captureContext.getImageData(0, 0, frameWidth, frameHeight);

        // compositing operation to apply when drawing new shapes
        // (difference: Subtracts the bottom layer from the top layer or the other way round to
        // always get a positive value)
        diffContext.globalCompositeOperation = "difference";
        diffContext.drawImage(video, 0, 0, frameWidth, frameHeight);
        const diffImageData = diffContext.getImageData(0, 0, frameWidth, frameHeight);

        if (oldCapturedImage) {
            const diff = this.#getDifference(diffImageData);
            console.log(diff);
            score.innerHTML = diff.score;

            motionContext.putImageData(diffImageData, 0, 0);
        }

        // set compositing operation to default
        // (source over: draws new shapes on top of the existing canvas content)
        diffContext.globalCompositeOperation = "source-over";
        diffContext.drawImage(this.video, 0, 0, frameWidth, frameHeight);
        this.oldCapturedImage = true;
    }

    #getDifference(diffImageData) {
        const {pixelDiffThreshold} = this.settings;
        let rgba = diffImageData.data;

        let score = 0;

        for (let i = 0; i < rgba.length; i += 4) {
            const pixelDiff = rgba[i] * 0.3 + rgba[i + 1] * 0.6 + rgba[i + 2] * 0.1;
            const normalized = Math.min(255, pixelDiff * (255 / pixelDiffThreshold));
            rgba[i] = 0;
            rgba[i + 1] = normalized;
            rgba[i + 2] = 0;

            if (pixelDiff >= pixelDiffThreshold) {
                score++;
            }
        }

        return {score};
    }

    async #getMedia(mediaSettings) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(mediaSettings);
        } catch (err) {
            console.log(err);
        }
    }
}