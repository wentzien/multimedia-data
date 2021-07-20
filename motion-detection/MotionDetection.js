const MotionDetection = class {
    constructor(settings) {
        this.stream = null;
        this.video = settings.video;

        this.settings = {};
        this.settings.frameWidth = 400;
        this.settings.frameHeight = 300;

    }

    async start() {
        const {video} = this;

        await this.#getMedia({
            audio: false,
            video: {
                width: this.settings.frameWidth,
                height: this.settings.frameHeight
            }
        });

        video.addEventListener("loadedmetadata", () => {
            video.play();
        });

        video.srcObject = this.stream;
    }

    async #getMedia(mediaSettings) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(mediaSettings);
        } catch (err) {
            console.log(err);
        }
    }
}