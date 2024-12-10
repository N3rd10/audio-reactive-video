let audioContext;
let analyser;
let dataArray;
let canvas;
let ctx;
let mediaRecorder;
let recordedChunks = [];
let audioElement;

// Create or resume the AudioContext on a user gesture
document.getElementById('playButton').addEventListener('click', function() {
    // Initialize AudioContext if it hasn't been created yet
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Now you can play audio
    if (audioElement) {
        if (audioElement.paused) {
            audioElement.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            // Ensure mediaRecorder is initialized here
            if (mediaRecorder) {
                mediaRecorder.start(); // Start recording when play button is clicked
            }
            updateProgressBar(); // Start updating the progress bar
        }
    }
});

document.getElementById('audioFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        playAudio(url);
        document.getElementById('playButton').style.display = 'block'; // Show play button
        document.getElementById('progressBar').style.display = 'block'; // Show progress bar
    }
});

function playAudio(url) {
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
    mediaRecorder = new MediaRecorder(stream); // Initialize mediaRecorder here

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
        const url = URL.createObjectURL(blob);
        const downloadLink = document.getElementById('downloadVideo');
        downloadLink.href = url;
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
    analyser.getByteFrequencyData(dataArray);
    
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

// Function to update the progress bar
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const duration = audioElement.duration;

    if (duration) {
        const currentTime = audioElement.currentTime;
        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;

        // Update the progress bar every second
        setTimeout(updateProgressBar, 1000);
    }
}
