const MotionDetector = class {
    constructor(settings) {
        this.stream = null;
        this.video = settings.videoRef || document.createElement("video");

        this.settings = {
            captureIntervalTime: settings.captureIntervalTime || 100,
            motionBoxColor: settings.motionBoxColor || "#ff0000",
            frameWidth: settings.frameWidth || 400,
            frameHeight: settings.frameHeight || 300,
            sensitivity: settings.sensitivity || 15,
            color: settings.color || '#9dad4b',
            minSurfaceArea: settings.minSurfaceArea || 200,
            minDistance: settings.minDistance || 10,
        };

        const {frameWidth, frameHeight} = this.settings;

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
                width: { ideal: 4096 },
                height: { ideal: 2160 } 
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
        const {video, score} = this;
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
        const {sensitivity, frameWidth, color, minSurfaceArea, minDistance} = this.settings;
        const {imageArray} = this; 
        let rgba = imageData.data;

        let targetRGB = this.#hexToRgb(color);
        let targetRed = targetRGB.r;
        let targetGreen = targetRGB.g;   
        let targetBlue = targetRGB.b;          
                    
        for (let i = 0; i < rgba.length; i += 4) {                 
            let x = (i/4)%frameWidth;
            let y = Math.floor((i/4)/frameWidth);            

            let red = rgba[i];
            let green = rgba[i+1];
            let blue = rgba[i+2];

            let reddiff = (Math.abs(targetRed - red))/targetRed;
            let greendiff =  (Math.abs(targetGreen - green))/targetGreen;
            let bluediff =  (Math.abs(targetBlue - blue))/targetBlue;
            if(!imageArray[x]){
                imageArray[x] = [];
            } 

            const distance = Math.sqrt((red - targetRed) ** 2 + (green - targetGreen) ** 2 + (blue - targetBlue) ** 2);

            if(distance < sensitivity){                
                imageArray[x][y] = 0;
            }else{
                imageArray[x][y] = 1;
            }         
        }        
        function findRectangles(m)    {
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
                    if (m[y1][x2] == 1 && m[y2][x1] == 1 && m[y2][x2] == 1 && (x2-x1)*(y2-y1)>minSurfaceArea){
                        if(!checkRenderNecessity(x1,x2,y1,y2)){
                            result.push([[y1,x1],[y2,x2]]);
                        }                        
                    }                        
            return result;

            function checkRenderNecessity(xMin,xMax,yMin,yMax){
                for (let i = 0; i < result.length; i += 1) {                 
                    if(result[i][0][0] == xMin || Math.abs(result[i][0][0]-xMin) < minDistance){
                        return true;                        
                    }else if(result[i][0][1] == xMax || Math.abs(result[i][0][1]-xMax) < minDistance){
                        return true; 
                    }else if(result[i][1][0] == yMin || yMin && Math.abs(result[i][1][0]-yMin) < minDistance){
                        return true; 
                    }else if(result[i][1][1] == yMax || yMax && Math.abs(result[i][1][1]-yMax) < minDistance){
                        return true; 
                    }
                }
                return false
            }
        }

        function findend(i,j,a,output,index){
            let x = a.length;
            let y = a[0].length;
        
            //flag to check column edge case,
            //initializing with 0
            let flagc = 0
        
            //flag to check row edge case,
            //initializing with 0
            let flagr = 0
            let o,p;
        
            for (let m = i; m < x; m+= 1) {
                p = m;          
        
                //loop breaks where first 1 encounters
                if(a[m][j] == 1){
                    flagr = 1 //set the flag
                    break
                }
                //pass because already processed
                if(a[m][j] == 5){                    
                }
                for (let n = j; n < y; n+= 1) { 
                    o = n;
                    //loop breaks where first 1 encounters
                    if(a[m][n] == 1){
                        flagc = 1 //set the flag
                        break
                    }
                    //fill rectangle elements with any
                    //number so that we can exclude
                    //next time
                    a[m][n] = 5
                }
            }
            if(flagr == 1)
                output[index].push(p-1)            
            else
                //when end point touch the boundary
                output[index].push(p)
        
            if(flagc == 1)
                output[index].push(o-1)
            else
                //when end point touch the boundary
                output[index].push(o)
        }
 
 
        function get_rectangle_coordinates(a){
        
            //retrieving the column size of array
            let size_of_array = a.length;
        
            //output array where we are going
            //to store our output
            let output = []
        
            //It will be used for storing start
            //and end location in the same index
            let index = -1
        
            for (let i = 0; i < size_of_array; i+= 1) { 
                for (let j = 0; j < a[0].length ; j+= 1) { 
                    if(a[i][j] == 0){
                        if(!checkRenderNecessity(output,i,j)){
                            //storing initial position
                            //of rectangle
                            output.push([i, j])
            
                            //will be used for the
                            //last position
                            index = index + 1       
                            findend(i, j, a, output, index)
                        }
                    }
                }
            }
            function checkRenderNecessity(output,x,y){
                if(output.length == 0)
                    return false  
                for (let i = 0; i < output.length; i += 1) {   
                    const xMin = output[0];
                    const yMin = output[1];
                    const xMax = output[2];
                    const yMax = output[3];              
                    if(x == xMin || Math.abs(x-xMin) < minDistance){
                        return true;                        
                    }else if(x == xMax || Math.abs(x-xMax) < minDistance){
                        return true; 
                    }else if(y == yMin || yMin && Math.abs(y-yMin) < minDistance){
                        return true; 
                    }else if(y == yMax || yMax && Math.abs(y-yMax) < minDistance){
                        return true; 
                    }
                }
                return false
            }
            return output;
        }
 
        let result = get_rectangle_coordinates(imageArray);

        if (result.length > 0) {
            for (let i = 0; i < result.length; i += 1) {                 
                this.#drawMotionBoxMotionCanvas(result[i]);
            }
        }
    }

    #drawMarkerCaptureCanvas(corners) {
        const {captureContext} = this;
        const {motionBoxColor} = this.settings;
        const xMin = corners[0];
        const yMin = corners[1];
        const xMax = corners[2];
        const yMax = corners[3];
        let centerX = xMin + (Math.floor((xMax - xMin)/2));
        let centerY = yMin + (Math.floor((yMax - yMin)/2));
        captureContext.fillStyle = motionBoxColor;
        captureContext.beginPath();
        captureContext.arc(centerX,centerY, 3, 0, 2 * Math.PI);
        captureContext.lineWidth = 1;        
        captureContext.strokeStyle = motionBoxColor;      
        captureContext.fill();  
        captureContext.stroke();
    }   
    
    #drawMotionBoxMotionCanvas(corners) {
        // drawing the motionbox in the corresponding context
        const {captureContext} = this;
        const {motionBoxColor} = this.settings;
        const xMin = corners[0];
        const yMin = corners[1];
        const xMax = corners[2];
        const yMax = corners[3];
        captureContext.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
        captureContext.strokeStyle = motionBoxColor;

        // console.log("xMin: ", xMin, "yMin: s", yMin, "xMax: ", xMax, "yMax: ", yMax);
    }
}