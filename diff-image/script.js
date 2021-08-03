const frameWidth = 400;
const frameHeight = 300;
let stream;
const video = document.getElementById("webcam") || document.createElement("video");
video.width = frameWidth;
video.height = frameHeight;
// let oldImage = document.createElement("canvas").getContext("2d");
// let newImage = document.createElement("canvas").getContext("2d");

let oldImage = document.getElementById("oldImage")
oldImage.width = frameWidth;
oldImage.height = frameHeight;
let oldImageContext = oldImage.getContext("2d");

let newImage = document.getElementById("newImage");
newImage.width = frameWidth;
newImage.height = frameHeight;
let newImageContext = newImage.getContext("2d");

let diffImage = document.getElementById("diffImage");
diffImage.width = frameWidth;
diffImage.height = frameHeight;
let diffImageContext = diffImage.getContext("2d");

diff();

async function diff() {
    const mediaSettings = {
        video: {
            width: frameWidth,
            height: frameHeight
        },
        audio: false
    }
    stream = await getMedia(mediaSettings);
    video.addEventListener("loadedmetadata", () => {
        video.play();
        getDiff();
    });
    video.srcObject = stream;
}

function getDiff() {

    setInterval(() => {
        oldImageContext.drawImage(newImage, 0, 0);
        newImageContext.drawImage(video, 0, 0);

        const oldImageData = oldImageContext.getImageData(0, 0, frameWidth, frameHeight);
        const newImageData = newImageContext.getImageData(0, 0, frameWidth, frameHeight);
        const diffImageData = diffImageContext.createImageData(frameWidth, frameHeight);

        const oldRGBA = oldImageData.data;
        const newRGBA = newImageData.data;
        const diffRGBA = diffImageData.data;


        for (let i = 0; i < diffRGBA.length; i += 4) {
            diffRGBA[i] = Math.abs(oldRGBA[i] - newRGBA[i]);
            diffRGBA[i + 1] = Math.abs(oldRGBA[i + 1] - newRGBA[i + 1]);
            diffRGBA[i + 2] = Math.abs(oldRGBA[i + 2] - newRGBA[i + 2]);
            diffRGBA[i + 3] = 255;

            // console.log(oldRGBA[i], newRGBA[i], diffRGBA[i], diffImageData.data[i]);
        }
        // console.log(oldRGBA, newRGBA, diffRGBA);

        diffImageContext.putImageData(diffImageData, 0, 0);
    }, 100);

}


async function getMedia(mediaSettings) {
    try {
        return await navigator.mediaDevices.getUserMedia(mediaSettings);
    } catch (err) {
        console.log(err);
    }
}