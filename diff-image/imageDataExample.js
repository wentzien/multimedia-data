const frameWidth = 400; // width of frame
const frameHeight = 300; // height of frame
const canvas = document.getElementById('canvas'); // reference
const ctx = canvas.getContext('2d'); // creating 2d context
ctx.drawImage(video, 0, 0); // draw video stream in 2d context
// get image data
const imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);

// iterating through all pixels and their RGBA values
for (let i = 0; i < imageData.data.length; i += 4) {
    const xPos = (i / 4) % frameWidth;
    const yPos = Math.floor(i / 4 / frameWidth);

    const red = imageData.data[i + 0]; // R value
    const green = imageData.data[i + 1]; // G value
    const blue = imageData.data[i + 2]; // B value
    const alpha = imageData.data[i + 3]; // A value
    // output in console
    console.log(`pixel info: (${xPos + "/" + yPos}):`, red, green, blue, alpha);
}