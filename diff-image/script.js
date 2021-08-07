// declaration and initialization of required global variables
const frameWidth = 400;
const frameHeight = 300;
let stream;
const video = document.getElementById("webcam") || document.createElement("video");
video.width = frameWidth;
video.height = frameHeight;

// reference and context of the old image captured
let oldImage = document.getElementById("oldImage")
oldImage.width = frameWidth;
oldImage.height = frameHeight;
let oldImageContext = oldImage.getContext("2d");

// reference and context of the latest image captured
let newImage = document.getElementById("newImage");
newImage.width = frameWidth;
newImage.height = frameHeight;
let newImageContext = newImage.getContext("2d");

// reference and context of the difference image to be calculated
let diffImage = document.getElementById("diffImage");
diffImage.width = frameWidth;
diffImage.height = frameHeight;
let diffImageContext = diffImage.getContext("2d");

// calling the function that performs the "difference" operation
diff();

async function diff() {
    // settings for the tapped image from the webcam
    const mediaSettings = {
        video: {
            width: frameWidth,
            height: frameHeight
        },
        audio: false
    }
    // access to the stream from the webcam
    stream = await getMedia(mediaSettings);
    video.addEventListener("loadedmetadata", () => {
        video.play();

        // call the function that calculates the difference
        getDiff();
    });

    // inserting the stream into the referenced video object
    video.srcObject = stream;
}

function getDiff() {

    // setting an interval in which the difference image is continuously calculated
    setInterval(() => {
        // insert the most recent image into the old context
        // to be able to perform the new calculation
        oldImageContext.drawImage(newImage, 0, 0);
        // grab the latest image from the video stream
        newImageContext.drawImage(video, 0, 0);

        // access to the imagedata objects containing the rgba values of each pixel
        const oldImageData = oldImageContext.getImageData(0, 0, frameWidth, frameHeight);
        const newImageData = newImageContext.getImageData(0, 0, frameWidth, frameHeight);
        // creation of a new imagedata object for the difference image
        const diffImageData = diffImageContext.createImageData(frameWidth, frameHeight);

        const oldRGBA = oldImageData.data;
        const newRGBA = newImageData.data;
        const diffRGBA = diffImageData.data;

        // iteration through every single pixel
        for (let i = 0; i < diffRGBA.length; i += 4) {
            // calculation of the R-value for the difference image
            diffRGBA[i] = Math.abs(oldRGBA[i] - newRGBA[i]);
            // calculation of the G-value for the difference image
            diffRGBA[i + 1] = Math.abs(oldRGBA[i + 1] - newRGBA[i + 1]);
            // calculation of the B-value for the difference image
            diffRGBA[i + 2] = Math.abs(oldRGBA[i + 2] - newRGBA[i + 2]);
            // set the alpha value to 255 (corresponds to 100%, no transparency)
            diffRGBA[i + 3] = 255;
        }
        // console.log(oldRGBA, newRGBA, diffRGBA);

        // put the calculated imagedata object into the difference image to be displayed
        diffImageContext.putImageData(diffImageData, 0, 0);
    }, 100);

}

// function for accessing the webcam
async function getMedia(mediaSettings) {
    try {
        return await navigator.mediaDevices.getUserMedia(mediaSettings);
    } catch (err) {
        console.log(err);
    }
}
