const color1 = [213, 205, 226];
const color2 = [212, 195, 226];

// euclidean distance
const distance = Math.sqrt((color1[0] - color2[0]) ** 2 + (color1[1] - color2[1]) ** 2 + (color1[2] - color2[2]) ** 2);
console.log(distance);