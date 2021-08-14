const MarkerTracking = class {
    constructor(settings) {
        this.stream = null;
        this.video = settings.videoRef || document.createElement("video");

        this.settings = {
            captureIntervalTime: settings.captureIntervalTime || 100,
            markerBoxColor: settings.markerBoxColor || "#ff0000",
            frameWidth: settings.frameWidth || 400,
            frameHeight: settings.frameHeight || 300,
            sensitivity: settings.sensitivity || 35,
            color: settings.color || '#9dad4b',
            minSurfaceArea: settings.minSurfaceArea || 20
        };
        this.binaryMatrix = [];

        const {frameWidth, frameHeight} = this.settings;

        this.captureCanvas = settings.captureCanvasRef || document.createElement("canvas");
        const {captureCanvas} = this;

        captureCanvas.width = frameWidth;
        captureCanvas.height = frameHeight;

        this.captureContext = this.captureCanvas.getContext("2d");
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

    async #getMedia(mediaSettings) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(mediaSettings);
        } catch (err) {
            console.log(err);
        }
    }

    #startCapture() {
        const {captureIntervalTime} = this.settings;
        setInterval(() => {
            this.#capture();
        }, captureIntervalTime);
    }

    #capture() {
        const {video} = this;
        const {frameWidth, frameHeight} = this.settings;
        const {captureContext} = this;

        captureContext.drawImage(video, 0, 0, frameWidth, frameHeight);
        const captureImageData = captureContext.getImageData(0, 0, frameWidth, frameHeight);

        this.#detectMarker(captureImageData);
    }

    #hexToRgb(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    #detectMarker(imageData) {
        const {sensitivity, frameWidth, color} = this.settings;
        const {binaryMatrix: imageArray} = this;
        let rgba = imageData.data;

        let targetRGB = this.#hexToRgb(color);
        let targetRed = targetRGB.r;
        let targetGreen = targetRGB.g;
        let targetBlue = targetRGB.b;

        for (let i = 0; i < rgba.length; i += 4) {
            let x = (i / 4) % frameWidth;
            let y = Math.floor((i / 4) / frameWidth);

            let red = rgba[i];
            let green = rgba[i + 1];
            let blue = rgba[i + 2];

            if (!imageArray[x]) {
                imageArray[x] = [];
            }

            const eukDistance = Math.sqrt((red - targetRed) ** 2 + (green - targetGreen) ** 2 + (blue - targetBlue) ** 2);

            if (eukDistance < sensitivity) {
                imageArray[x][y] = 0;
            } else {
                imageArray[x][y] = 1;
            }
        }

        let result = this.#getRectangleCoordinates(imageArray);

        if (result.length > 0) {
            for (let i = 0; i < result.length; i += 1) {
                this.#drawMarkerCaptureCanvas(result[i]);
            }
        }
    }

    #getRectangleCoordinates(a) {
        function findend(i, j, a, output, index) {
            let x = a.length;
            let y = a[0].length;

            //flag to check column edge case,
            //initializing with 0
            let flagc = 0

            //flag to check row edge case,
            //initializing with 0
            let flagr = 0
            let o, p;

            for (let m = i; m < x; m += 1) {
                p = m;

                //loop breaks where first 1 encounters
                if (a[m][j] == 1) {
                    flagr = 1 //set the flag
                    break
                }
                //pass because already processed
                if (a[m][j] == 5) {
                }
                for (let n = j; n < y; n += 1) {
                    o = n;
                    //loop breaks where first 1 encounters
                    if (a[m][n] == 1) {
                        flagc = 1 //set the flag
                        break
                    }
                    //fill rectangle elements with any
                    //number so that we can exclude
                    //next time
                    a[m][n] = 5
                }
            }
            if (flagr == 1)
                output[index].push(p - 1)
            else
                //when end point touch the boundary
                output[index].push(p)

            if (flagc == 1)
                output[index].push(o - 1)
            else
                //when end point touch the boundary
                output[index].push(o)
        }

        //retrieving the column size of array
        let size_of_array = a.length;

        //output array where we are going
        //to store our output
        let output = []

        //It will be used for storing start
        //and end location in the same index
        let index = -1

        for (let i = 0; i < size_of_array; i += 1) {
            for (let j = 0; j < a[0].length; j += 1) {
                if (a[i][j] == 0) {
                    //storing initial position
                    //of rectangle
                    output.push([i, j]);

                    //will be used for the
                    //last position
                    index = index + 1;
                    findend(i, j, a, output, index);
                    //if rectangle doesnt fit the requirements --> delete from output array                     
                    if (!this.#checkRenderNecessity(output[index], output)) {
                        output.splice(index, 1);
                        index = output.length - 1;
                    }
                }
            }
        }
        return output;
    }

    #checkRenderNecessity(input, output) {
        const {minSurfaceArea} = this.settings;
        let x1 = input[0];
        let x2 = input[2];
        let y1 = input[1];
        let y2 = input[3];
        if ((x2 - x1) * (y2 - y1) < minSurfaceArea) {
            return false
        }
        if (output.length == 1) {
            return true
        }
        let render = true;
        for (let i = 0; i < output.length - 2; i += 1) {
            const xMin = output[i][0];
            const yMin = output[i][1];
            const xMax = output[i][2];
            const yMax = output[i][3];
            // Check if rectangle a contains rectangle b
            // Each object (a and b) should have 2 properties to represent the
            // top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
            function contains(a, b) {
                return !(
                    b.xMin < a.x1 ||
                    b.yMin < a.y1 ||
                    b.xMax > a.x2 ||
                    b.yMax > a.y2
                );
            }

            // Check if rectangle a overlaps rectangle b
            // Each object (a and b) should have 2 properties to represent the
            // top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
            function overlaps(a, b) {
                if (a.x1 >= b.xMax || a.y1 >= b.yMax || a.x2 <= b.xMin || a.y2 <= b.yMin) {
                    return false
                } else {
                    return true
                }
            }

            // Check if rectangle a touches rectangle b
            // Each object (a and b) should have 2 properties to represent the
            // top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
            function touches(a, b) {
                // has horizontal gap
                if (a.x1 > b.xMax || b.xMin > a.x2) return false;

                // has vertical gap
                if (a.y1 > b.yMax || b.yMin > a.y2) return false;

                return true;
            }

            function rectanglesIntersect(
                minAx, minAy, maxAx, maxAy,
                minBx, minBy, maxBx, maxBy
            ) {
                let aLeftOfB = maxAx < minBx;
                let aRightOfB = minAx > maxBx;
                let aAboveB = minAy > maxBy;
                let aBelowB = maxAy < minBy;

                return !(aLeftOfB || aRightOfB || aAboveB || aBelowB);
            }

            let touche = touches({x1, y1, x2, y2}, {xMin, yMin, xMax, yMax});
            let overlap = overlaps({x1, y1, x2, y2}, {xMin, yMin, xMax, yMax});
            let contain = contains({x1, y1, x2, y2}, {xMin, yMin, xMax, yMax});
            let inter = rectanglesIntersect(x1, y1, x2, y2, xMin, yMin, xMax, yMax);
            if (touche || overlap || contain || inter) {
                if ((x2 - x1) * (y2 - y1) > (xMax - xMin) * (yMax - yMin)) {
                    if (render) {
                        output[i][0] = x1;
                        output[i][1] = y1;
                        output[i][2] = x2;
                        output[i][3] = y2;
                    } else {
                        output.splice(i, 1);
                    }
                }
                render = false;
            }
        }
        if (!render) {
            return false
        }
        return true
    }

    #drawMarkerCaptureCanvas(corners) {
        const {captureContext} = this;
        const {markerBoxColor} = this.settings;
        const xMin = corners[0];
        const yMin = corners[1];
        const xMax = corners[2];
        const yMax = corners[3];
        let centerX = xMin + (Math.floor((xMax - xMin) / 2));
        let centerY = yMin + (Math.floor((yMax - yMin) / 2));
        captureContext.fillStyle = markerBoxColor;
        captureContext.beginPath();
        captureContext.arc(centerX, centerY, 2, 0, 2 * Math.PI);
        captureContext.lineWidth = 1;
        captureContext.strokeStyle = markerBoxColor;
        captureContext.fill();
        captureContext.stroke();
    }

    #drawMotionBoxMotionCanvas(corners) {
        // drawing the motionbox in the corresponding context
        const {captureContext} = this;
        const {markerBoxColor} = this.settings;
        const xMin = corners[0];
        const yMin = corners[1];
        const xMax = corners[2];
        const yMax = corners[3];
        captureContext.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
        captureContext.strokeStyle = markerBoxColor;
    }
}