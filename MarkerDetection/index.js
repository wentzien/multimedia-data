const MotionDetector = class {
    constructor(settings) {
        this.stream = null;
        this.video = settings.videoRef || document.createElement("video");
        this.downloadTimer = 5;
        this.downloadCounter = 0;

        this.settings = {
            captureIntervalTime: settings.captureIntervalTime || 100,
            showMotionBox: settings.showMotionBox || true,
            motionBoxColor: settings.motionBoxColor || "#ff0000",
            frameWidth: settings.frameWidth || 400,
            frameHeight: settings.frameHeight || 300,
            sensitivity: settings.sensitivity || 25,
            color: settings.color || '#9f670f'
        };

        const {frameWidth, frameHeight} = this.settings;

        this.motionBox = {
            x: {
                min: frameWidth,
                max: frameWidth
            },
            y: {
                min: 0,
                max: 0
            }
        };
        this.imageArray = [];         

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

    #startCapture() {
        const {captureIntervalTime} = this.settings;
        setInterval(() => {
            this.#capture();
        }, captureIntervalTime);
    }

    #capture() {
        const {video, score} = this;
        const {frameWidth, frameHeight} = this.settings;
        const {captureContext} = this;

        captureContext.drawImage(video, 0, 0, frameWidth, frameHeight);
        const captureImageData = captureContext.getImageData(0, 0, frameWidth, frameHeight);

        this.#detectMarker(captureImageData);

        motionContext.putImageData(captureImageData, 0, 0);
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
        const {sensitivity, frameWidth, showMotionBox,color} = this.settings;
        const {imageArray} = this;  
        let targetRGB = this.#hexToRgb(color);
        let targetRed = targetRGB.r;
        let targetGreen = targetRGB.g;   
        let targetBlue = targetRGB.b;  

        let rgba = imageData.data;
                    
        for (let i = 0; i < rgba.length; i += 4) {                 
            let x = (i/4)%frameWidth;
            let y = Math.floor((i/4)/frameWidth);
            

            let red = rgba[i];
            let green = rgba[i+1];
            let blue = rgba[i+2];
            let alpha = rgba[i+3];    

            let reddiff = (Math.abs(targetRed - red))/targetRed;
            let greendiff =  (Math.abs(targetGreen - green))/targetGreen;
            let bluediff =  (Math.abs(targetBlue - blue))/targetBlue;
            let rgbDiffSum = reddiff + bluediff +greendiff;
            if(!imageArray[x]){
                imageArray[x] = [];
            }            
            
            if(reddiff <= (sensitivity/100) && greendiff <= (sensitivity/100) && bluediff <= (sensitivity/100)){                
                imageArray[x][y] = 1;
            }else{
                imageArray[x][y] = 0;
            }         
        }        
        function isRectangle(m)    {
            // finding row and column size
            let result = [];
            let rows = m.length;
            if (rows == 0)
                return false;
            let columns = m[0].length;
    
            // scanning the matrix
            for (let y1 = 0; y1 < rows; y1++)
            for (let x1 = 0; x1 < columns; x1++)
                // if any index found 1 then try
                // for all rectangles
                if (m[y1][x1] == 1)
                for (let y2 = y1 + 1; y2 < rows; y2++)
                    for (let x2 = x1 + 1; x2 < columns; x2++)
                    if (m[y1][x2] == 1 && m[y2][x1] == 1 && m[y2][x2] == 1 && (x2-x1)>1){
                        if(!checkIfExist(x1,x2,y1,y2)){
                            result.push([[y1,x1],[y2,x2]]);
                        }                        
                    }                        
            return result;

            function checkIfExist(xMin,xMax,yMin,yMax){
                for (let i = 0; i < result.length; i += 1) {                 
                    if(result[i][0][0] == xMin || result[i][0][1] == xMax || 
                        result[i][1][0] == yMin ||result[i][1][1] == yMax){
                        return true                        
                    }
                }
                return false
            }
        }

        let result = isRectangle(imageArray);
        if (result != false) {
            for (let i = 0; i < result.length; i += 1) {                 
                this.#drawMotionBoxCaptureCanvas(result[i]);
            }
        }
    }

    #drawMotionBoxCaptureCanvas(corners) {
        const {captureContext} = this;
        const {motionBoxColor} = this.settings;
        const xMin = corners[0][0];
        const yMin = corners[0][1];
        const xMax = corners[1][0];
        const yMax = corners[1][1];
        let centerX = xMin + (Math.floor((xMax - xMin)/2));
        let centerY = yMin + (Math.floor((yMax - yMin)/2));
        captureContext.fillStyle = motionBoxColor;
        captureContext.beginPath();
        captureContext.arc(centerX,centerY, 3, 0, 2 * Math.PI);
        captureContext.lineWidth = 1;        
        captureContext.strokeStyle = motionBoxColor;      
        captureContext.fill();  
        captureContext.stroke();
        // console.log("xMin: ", xMin, "yMin: s", yMin, "xMax: ", xMax, "yMax: ", yMax);
    }

    async #getMedia(mediaSettings) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(mediaSettings);
        } catch (err) {
            console.log(err);
        }
    }

    #downloadCaptureCanvas() {
        const {captureCanvas} = this;
        const link = document.createElement("a");
        link.href = captureCanvas.toDataURL();
        link.download = "captureCanvas.png";
        link.click();
    }

    #downloadMotionCanvas() {
        const {motionCanvas} = this;
        const link = document.createElement("a");
        link.href = motionCanvas.toDataURL();
        link.download = "motionCanvas.png";
        link.click();
    }

    #calcMotionBoxPixels(index) {
        const {frameWidth} = this.settings;
        const x = index % frameWidth;
        const y = Math.floor(index / frameWidth);

        this.motionBox.x.min = Math.min(this.motionBox.x.min, x);
        this.motionBox.y.min = Math.min(this.motionBox.y.min, y);
        this.motionBox.x.max = Math.max(this.motionBox.x.max, x);
        this.motionBox.y.max = Math.max(this.motionBox.y.max, y);
    }

    

    #drawMotionBoxMotionCanvas() {
        const {diffContext} = this;
        const {min: xMin, max: xMax} = this.motionBox.x;
        const {min: yMin, max: yMax} = this.motionBox.y;
        diffContext.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
        diffContext.strokeStyle = "#fff";

        // console.log("xMin: ", xMin, "yMin: s", yMin, "xMax: ", xMax, "yMax: ", yMax);
    }
    
}