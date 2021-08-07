const MotionDetection = class {
    constructor(settings) {
        console.log(settings);

        this.stream = null;

        // settings
        this.settings = {};
        this.settings.captureIntervalTime = settings.captureIntervalTime || 100;
        this.settings.frameWidth = settings.frameWidth || 400;
        this.settings.frameHeight = settings.frameHeight || 300;
        this.settings.pixelDiffThreshold = settings.pixelDiffThreshold || 32;
        this.scoreThreshold = this.settings.scoreThreshold || 16;
        this.settings.showMotionBox = settings.showMotionBox || false;
        this.settings.showMotionPixels = settings.showMotionPixels || false;

        this.oldCapturedImage = false;

        this.video = this.settings.video || document.createElement("video");
        this.video.autoplay = true;

        const {frameWidth, frameHeight} = this.settings;

        this.motionCanvas = document.createElement("canvas");
        this.motionCanvas.width = frameWidth;
        this.motionCanvas.height = frameHeight;
        this.motionContext = this.motionCanvas.getContext("2d");

        this.captureCanvas = document.createElement("canvas");
        this.captureCanvas.width = frameWidth;
        this.captureCanvas.height = frameHeight;
        this.captureContext = this.captureCanvas.getContext("2d");

        this.diffCanvas = document.createElement("canvas");
        this.diffCanvas.width = frameWidth;
        this.diffCanvas.height = frameHeight;
        this.diffContext = this.diffCanvas.getContext("2d");
    }

    async start() {
        await this.#getMedia({
            audio: false,
            video: {
                width: this.settings.frameWidth,
                height: this.settings.frameHeight
            }
        });

        console.log("process started")
        this.video.addEventListener("canplay", () => {
            this.#startCapture();
        });
        this.video.addEventListener("loadedmetadata", () => {
            console.log("video loaded");
            this.video.play();
        });
        this.video.srcObject = this.stream;
    }

    stop() {

    }

    async #getMedia(mediaSettings) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(mediaSettings);
        } catch (err) {
            console.log(err);
        }
    }

    #startCapture() {
        console.log("capture started");
        console.log(this)
        this.captureInterval = setInterval(() => {
            this.#capture();
        }, 100);
    }

    #capture() {
        const {frameWidth, frameHeight} = this.settings;
        this.captureContext.drawImage(this.video, 0, 0, frameWidth, frameHeight);
        const captureImageData = this.captureContext.getImageData(0, 0, frameWidth, frameHeight);

        this.diffContext.globalCompositeOperation = "difference";
        this.diffContext.drawImage(this.video, 0, 0, frameWidth, frameHeight);
        const diffImageData = this.diffContext.getImageData(0, 0, frameWidth, frameHeight);

        if (this.oldCapturedImage) {
            const diff = this.#getDifference(diffImageData);

            this.motionContext.putImageData(diffImageData, 0, 0);

            // if (diff.motionBox) {
            //     this.motionContext.strokeStyle = "#a80707";
            //     this.motionContext.strokeRect(
            //         diff.motionBox.x.min + 0.5,
            //         diff.motionBox.y.min + 0.5,
            //         diff.motionBox.x.max - diff.motionBox.x.min,
            //         diff.motionBox.y.max - diff.motionBox.y.min
            //     );
            // }
        }

        this.diffContext.globalCompositeOperation = "source-over";
        this.diffContext.drawImage(this.video, 0, 0, frameWidth, frameHeight);
        this.oldCapturedImage = true;
    }

    #getDifference(diffImageData) {
        const {showMotionBox, showMotionPixels, pixelDiffThreshold} = this.settings;
        let rgba = diffImageData.data;

        let score = 0;
        let motionPixels = showMotionPixels ? [] : null;
        let motionBox = null;

        for (let i = 0; i < rgba.length; i += 4) {
            const pixelDiff = rgba[i] * 0.3 + rgba[i + 1] * 0.6 + rgba[i + 2] * 0.1;
            const normalized = Math.min(255, pixelDiff * (255 / pixelDiffThreshold));
            rgba[i] = 0;
            rgba[i + 1] = normalized;
            rgba[i + 2] = 0;

            if (pixelDiff >= pixelDiffThreshold) {
                score++;
                const coords = this.#calculateCoordinates(i / 4);

                if (showMotionBox) {
                    motionBox = this.#calculateMotionBox(motionBox, coords.x, coords.y);
                }

                if (showMotionPixels) {
                    motionPixels = this.#calculateMotionPixels(motionPixels, coords.x, coords.y, pixelDiff);
                }
            }
        }
    }

    #calculateMotionBox(currentMotionBox, x, y) {
        const motionBox = currentMotionBox || {
            x: {min: coords.x, max: x},
            y: {min: coords.y, max: y}
        };

        motionBox.x.min = Math.min(motionBox.x.min, x);
        motionBox.x.max = Math.max(motionBox.x.max, x);
        motionBox.y.min = Math.min(motionBox.y.min, y);
        motionBox.y.max = Math.max(motionBox.y.max, y);

        return motionBox;
    }

    #calculateMotionPixels(motionPixels, x, y, pixelDiff) {
        motionPixels[x] = motionPixels[x] || [];
        motionPixels[x][y] = true;

        return motionPixels;
    }

    #calculateCoordinates(pixelIndex) {
        const {frameWidth} = this.settings;
        return {
            x: pixelIndex % frameWidth,
            y: Math.floor(pixelIndex / frameWidth)
        };
    }


}