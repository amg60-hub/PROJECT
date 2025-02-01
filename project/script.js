document.getElementById("uploadForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const fileInput = document.getElementById("audioUpload");
    if (fileInput.files.length > 0) {
        analyzePronunciation(fileInput.files[0]);
    } else {
        alert("Please upload an audio file.");
    }
});

document.getElementById("recordButton").addEventListener("click", startRecording);
document.getElementById("stopButton").addEventListener("click", stopRecording);

let mediaRecorder;
let audioChunks = [];
let audioContext;
let analyser;
let dataArray;
let canvas, canvasCtx;
let animationFrameId;

function setupVisualizer(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    source.connect(analyser);

    canvas = document.getElementById("waveform");
    canvasCtx = canvas.getContext("2d");

    function draw() {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "#007bff";
        canvasCtx.beginPath();

        let sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            let v = dataArray[i] / 128.0;
            let y = v * (canvas.height / 2);

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

        animationFrameId = requestAnimationFrame(draw);
    }

    draw();
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        setupVisualizer(stream); // Start waveform visualization

        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorder.start();
        document.getElementById("recordButton").disabled = true;
        document.getElementById("stopButton").disabled = false;
        audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });
    }).catch(error => {
        alert("Microphone access denied.");
        console.error("Error accessing microphone:", error);
    });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        mediaRecorder.addEventListener("stop", () => {
            cancelAnimationFrame(animationFrameId); // Stop waveform visualization
            audioContext.close(); // Stop audio context

            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioElement = document.getElementById("audioPlayback");
            audioElement.src = audioUrl;
            audioElement.controls = true;
            audioElement.play(); // Play the recorded audio

            document.getElementById("recordButton").disabled = false;
            document.getElementById("stopButton").disabled = true;

            analyzePronunciation(audioBlob);
        });
    }
}

function analyzePronunciation(audio) {
    // Simulated pronunciation analysis logic
    let accuracy = Math.floor(Math.random() * 100) + 1; // Random percentage for now
    document.getElementById("accuracy").innerText = accuracy;
    document.getElementById("status").style.color = accuracy > 70 ? "green" : "red";
    document.getElementById("status").innerText = `Pronunciation Accuracy: ${accuracy}%`;
}
