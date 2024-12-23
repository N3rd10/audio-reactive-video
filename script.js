if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service worker.js')
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
}

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
    console.log('Play button clicked');
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext created');
    }
    
    // Now you can play audio
    if (audioElement) {
        if (audioElement.paused) {
            audioElement.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            if (mediaRecorder && mediaRecorder.state === 'inactive') {
                mediaRecorder.start(); // Start recording when play button is clicked
                console.log('MediaRecorder started');
            }
        }
    }
});

document.getElementById('audioFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    console.log('Audio file selected:', file);
    if (file) {
        if (audioElement) {
            audioElement.pause(); // Pause the previous audio if it exists
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop(); // Stop recording if it's currently recording
                console.log('MediaRecorder stopped');
            }
        }
        
        // Initialize AudioContext here if it hasn't been initialized yet
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext created');
        }

        const url = URL.createObjectURL(file);
        playAudio(url);
        document.getElementById('playButton').style.display = 'block'; // Show play button
    }
});

function playAudio(url) {
    console.log('Playing audio from URL:', url);
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
    console.log('MediaRecorder initialized');

    // Set up MediaRecorder error handling
    mediaRecorder.onerror = function(event) {
        console.error('MediaRecorder error:', event.error);
    };

    mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
            console.log('Data available from MediaRecorder:', event.data.size);
        }
    };

    mediaRecorder.onstop = function() {
        console.log('MediaRecorder stopped');
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoURL = URL.createObjectURL(blob);
        const downloadLink = document.getElementById('downloadVideo');
        downloadLink.href = videoURL; // Set the download link
        downloadLink.download = 'visualization.webm'; // Set the filename
        downloadLink.style.display = 'block'; // Show the download link
        downloadLink.innerText = 'Download Video';
        recordedChunks = []; // Reset recorded chunks after download
        console.log('Download link set up:', downloadLink.href);
    };

    audioElement.onended = function() {
        console.log('Audio playback ended');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); // Stop recording when audio ends
            console.log('MediaRecorder stopped due to audio end');
        }
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
    console.log('Visualization updated');
}
