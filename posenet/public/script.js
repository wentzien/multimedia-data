// declaration of global variables
let video;
let poseNet;
let pose;
let skeleton;

function setup() {
    // creation of a drawing area and determination of the size
    createCanvas(640, 480);
    // access to the camera
    video = createCapture(VIDEO);
    // hide video, because this should be rendered in the draw function
    video.hide();
    // initialization of posenet
    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on("pose", gotPoses);
}

function gotPoses(poses) {
    // console.log(poses);

    // only if a pose is present
    if (poses.length > 0) {
        // set pose data in global variable
        pose = poses[0].pose;
        // set connection points in global variable
        skeleton = poses[0].skeleton;
    }
}

function modelLoaded() {
    // message when the model has been loaded
    console.log("model loaded");
}

function draw() {
    // draws current frame of video stream onto the drawing area
    image(video, 0, 0);

    // if a pose was detected
    if (pose && skeleton) {
        // iterate through all detected points
        for (const point of pose.keypoints) {
            const {x, y} = point.position;
            // drawing a circle at this point
            fill("#00ff00");
            circle(x, y, 10);
        }

        // iterate through the connection points
        for (const connectionPoints of skeleton) {
            const {x: aX, y: aY} = connectionPoints[0].position;
            const {x: bX, y: bY} = connectionPoints[1].position;

            // drawing a line at related points
            strokeWeight(3);
            stroke("#00ff00");
            line(aX, aY, bX, bY);
        }

        // saveCanvas("posenet", "jpg");
    }
}