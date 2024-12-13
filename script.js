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
        console.log('File selected:', file.name);
        const url = URL.createObjectURL(file);
        playAudio(url);
        document.getElementById('playButton').style.display = 'block';
        document.getElementById('progressBar').style.display = 'block';
    } else {
        console.log('No file selected');
    }
});

document.getElementById('playButton').addEventListener('click', function() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioElement) {
        if (audioElement.paused) {
            audioElement.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            if (mediaRecorder) {
                mediaRecorder.start();
            }
            updateProgressBar();
        }
    }
});

function playAudio(url) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    audioElement = new Audio(url);
    audioElement.onplay = function() {
        console.log('Audio is playing');
    };
    audioElement.onended = function() {
        console.log('Audio has ended');
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
    };

    const source = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    canvas = document.getElementById('visualization');
    ctx = canvas.getContext('2d');
    
    const stream = canvas.captureStream(30);
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
        recordedChunks = [];
    };

    visualize();
    audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

function visualize() {
    requestAnimationFrame(visualize);
    analyser.getByteFrequencyData(dataArray);
    
    // Set the canvas background to black
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // Change to black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const bar Width = (canvas.width / analyser.frequencyBinCount) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < analyser.frequencyBinCount; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
        x += barWidth + 1;
    }
}

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const update = () => {
        if (audioElement) {
            const percentage = (audioElement.currentTime / audioElement.duration) * 100;
            progressBar.value = percentage || 0;
            if (!audioElement.paused) {
                requestAnimationFrame(update);
            }
        }
    };
    update();
}
