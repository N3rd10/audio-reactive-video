let audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Create AudioContext once
let analyser;
let dataArray;
let canvas;
let ctx;
let mediaRecorder;
let recordedChunks = [];
let audioElement;

// Constants for configuration
const FFT_SIZE = 2048;
const FRAME_RATE = 30; // FPS for canvas capture
const BAR_WIDTH_MULTIPLIER = 2.5; // Multiplier for bar width

// Add event listener for the 'change' event on the file input
document.getElementById('audioFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        playAudio(url);
        document.getElementById('playButton').style.display = 'block'; // Show play button
    }
});

// Add event listener for the 'click' event on the play button
document.getElementById('playButton').addEventListener('click', function() {
    if (audioElement && audioElement.paused) { // Check if audio is paused
        audioElement.play().catch(error => {
            console.error('Error playing audio:', error);
        });
        mediaRecorder.start(); // Start recording when play button is clicked
    }
});

function playAudio(url) {
    audioElement = new Audio(url);
    const source = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = FFT_SIZE; // Set FFT size
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    canvas = document.getElementById('visualization');
    ctx = canvas.getContext('2d');
    
    // Set up MediaRecorder after canvas is defined
    const stream = canvas.captureStream(FRAME_RATE); // 30 FPS
    mediaRecorder = new MediaRecorder(stream);

    // Set up MediaRecorder error handling
    mediaRecorder.onerror = function(event) {
        console.error('MediaRecorder error:', event.error);
    };

    mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function() {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const downloadLink = document.getElementById('downloadVideo');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'visualization.webm';
        downloadLink.style.display = 'block'; // Show the download link
        downloadLink.innerText = 'Download Video';
        recordedChunks = []; // Reset recorded chunks after download
    };

    audioElement.onended = function() {
        mediaRecorder.stop(); // Stop recording when audio ends
    };

    visualize();
}

function visualize() {
    requestAnimationFrame(visualize);
    analyser.getByteFrequencyData(dataArray); // Get frequency data
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / dataArray.length) * BAR_WIDTH_MULTIPLIER; // Calculate bar width
    let barHeight;
    let x = 0;

    // Update the loop to avoid potential infinite loop
    for (let i = 0; i < dataArray.length && x < canvas.width; i++) {
        barHeight = dataArray[i];
        ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1; // Increment x position for the next bar
    }
}
