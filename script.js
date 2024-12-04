let audioContext;
let analyser;
let dataArray;
let canvas;
let ctx;
let mediaRecorder;
let recordedChunks = [];
let audioElement;

document.getElementById('audioFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        playAudio(url);
        document.getElementById('playButton').style.display = 'block'; // Show play button
    }
});

document.getElementById('playButton').addEventListener('click', function() {
    if (audioElement) {
        if (audioElement.paused) { // Check if audio is paused
            audioElement.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            mediaRecorder.start(); // Start recording when play button is clicked
        }
    }
});

function playAudio(url) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioElement = new Audio(url);
    const source = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    canvas = document.getElementById('visualization');
    ctx = canvas.getContext('2d');
    
    // Set up MediaRecorder after canvas is defined
    const stream = canvas.captureStream(30); // 30 FPS
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function() {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.getElementById('downloadVideo');
        downloadLink.href = url;
        downloadLink.download = 'visualization.webm';
        downloadLink.style.display = 'block';
        downloadLink.innerText = 'Download Video';
    };

    audioElement.onended = function() {
        mediaRecorder.stop(); // Stop recording when audio ends
    };

    visualize();
}

function visualize() {
    requestAnimationFrame(visualize);
    analyser.getByteFrequencyData(dataArray); // Corrected method name
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i];
        ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
    }
}
