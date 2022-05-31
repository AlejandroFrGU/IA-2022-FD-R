const video = document.getElementById('video');
const mask = document.getElementById('mask');
const toggleDetect = document.getElementById('detect');
const toggleMask = document.getElementById('toggmask');

detecting = false;
masked = false;
var intervalo = null;
var intervalo2 = null;
const labels = ['Alejandro']
const imageUrl = 'https://i.ibb.co/fCVgG7J/rd2.png';

Promise.all([
    faceapi.loadFaceLandmarkModel('/models'),
    faceapi.loadFaceRecognitionModel('/models'),
    faceapi.loadTinyFaceDetectorModel('/models'),
    faceapi.loadSsdMobilenetv1Model('/models')


]).then(() => {
    startCamara()
    training()
}
);
function startCamara() {
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
};
var labeledFaceDescriptors = null;
async function training() {
    labeledFaceDescriptors = await Promise.all(
        labels.map(async label => {
            const img = await faceapi.fetchImage(imageUrl);
            const fullFaceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
            if (!fullFaceDescription) {
                throw new Error(`no faces detected for ${label}`)
            }
            const faceDescriptors = [fullFaceDescription.descriptor]
            return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
        })
    )
}
toggleMask.addEventListener('click', () => {
    toggleMaskMethod()
});
toggleDetect.addEventListener('click', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    context = canvas.getContext('2d');
    toggleDetectMethod();
    if (detecting) {
        document.body.append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);
        intervalo = setInterval(async () => {
            let detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
            const maxDescriptorDistance = 0.6;
            const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance);
            const results = detections.map(fd => faceMatcher.findBestMatch(fd.descriptor));
            results.forEach((bestMatch, i) => {
                const box = detections[i].detection.box;
                const text = bestMatch.toString();
                const drawBox = new faceapi.draw.DrawBox(box, { label: text });
                if(text.includes("Alejandro")){
                    if (masked) {
                        base_image = new Image();
                        base_image.src = '/images/overlay-red-monster2.png';
                        base_image.onload = function(){
                            context.drawImage(base_image, drawBox.box._x, drawBox.box._y,drawBox.box.width,drawBox.box.height/1.2);
                       }
                    } else {
                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                    }
                }else{
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                }
                drawBox.draw(canvas)
                intervalo2 = setTimeout(function () {
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                }, 30);
            })
        }, 100);
    } else {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        clearInterval(intervalo);
        clearInterval(intervalo2);
    }
});
function toggleDetectMethod() {
    detecting = !detecting;
    if (detecting) {
        toggleDetect.innerText = 'Stop';
    } else {
        toggleDetect.innerText = 'Detect';
    }
}
function toggleMaskMethod() {
    masked = !masked;
    if (masked) {
        toggleMask.innerText = 'Unmask';
    } else {
        toggleMask.innerText = 'Mask';
    }
}