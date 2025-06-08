if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service worker.js')
        .then((registration) => {
            console.log('[SW] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.error('[SW] Service Worker registration failed:', error);
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

// Play button event handler with detailed logging
document.getElementById('playButton').addEventListener('click', function() {
    console.log('[UI] Play button pressed by user');
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('[Audio] AudioContext created');
    } else {
        console.log('[Audio] AudioContext already exists');
    }

    // Play or pause audio
    if (audioElement) {
        if (audioElement.paused) {
            audioElement.play().then(() => {
                console.log('[Audio] Audio playback started at', audioElement.currentTime, 'seconds');
            }).catch(error => {
                console.error('[Audio] Error playing audio:', error);
            });

            if (mediaRecorder) {
                if (mediaRecorder.state === 'inactive') {
                    mediaRecorder.start();
                    console.log('[Recorder] MediaRecorder started');
                } else {
                    console.log('[Recorder] MediaRecorder already recording');
                }
            } else {
                console.warn('[Recorder] MediaRecorder not initialized');
            }
        } else {
            audioElement.pause();
            console.log('[Audio] Audio playback paused at', audioElement.currentTime, 'seconds');
        }
    } else {
        console.warn('[UI] Play button pressed, but no audio file loaded.');
    }
});

// Audio file input event handler with detailed logging
document.getElementById('audioFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    console.log('[UI] Audio file input changed:', file);

    if (file) {
        if (audioElement) {
            audioElement.pause();
            console.log('[Audio] Previous audio paused at', audioElement.currentTime, 'seconds');
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                console.log('[Recorder] MediaRecorder stopped (new file selected)');
            }
        }

        // Initialize AudioContext if needed
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[Audio] AudioContext created for new file');
        }

        const url = URL.createObjectURL(file);
        console.log('[File] Created object URL for file:', url);

        playAudio(url);
        document.getElementById('playButton').style.display = 'block';
    } else {
        console.warn('[UI] No audio file selected.');
    }
});

function playAudio(url) {
    console.log('[Audio] Setting up audio playback for URL:', url);
    audioElement = new Audio(url);

    const source = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    canvas = document.getElementById('visualization');
    ctx = canvas.getContext('2d');

    // Set up MediaRecorder
    const stream = canvas.captureStream(30); // 30 FPS
    try {
        mediaRecorder = new MediaRecorder(stream);
        console.log('[Recorder] MediaRecorder initialized');
    } catch (e) {
        console.error('[Recorder] Failed to initialize MediaRecorder:', e);
    }

    // MediaRecorder error handling
    if (mediaRecorder) {
        mediaRecorder.onerror = function(event) {
            console.error('[Recorder] MediaRecorder error:', event.error);
        };

        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log('[Recorder] Data available from MediaRecorder:', event.data.size, 'bytes');
            }
        };

        mediaRecorder.onstop = function() {
            console.log('[Recorder] MediaRecorder stopped');
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const videoURL = URL.createObjectURL(blob);
            const downloadLink = document.getElementById('downloadVideo');
            downloadLink.href = videoURL;
            downloadLink.download = 'visualization.webm';
            downloadLink.style.display = 'block';
            downloadLink.innerText = 'Download Video';
            console.log('[Recorder] Download link set up:', videoURL, 'size:', blob.size, 'bytes');
            recordedChunks = [];
        };
    }

    audioElement.onended = function() {
        console.log('[Audio] Audio playback ended at', audioElement.currentTime, 'seconds');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            console.log('[Recorder] MediaRecorder stopped due to audio end');
        }
    };

    audioElement.onplay = function() {
        console.log('[Audio] Audio element play event at', audioElement.currentTime, 'seconds');
    };

    audioElement.onpause = function() {
        console.log('[Audio] Audio element pause event at', audioElement.currentTime, 'seconds');
    };

    visualize();
}

function visualize() {
    requestAnimationFrame(visualize);
    if (!analyser || !dataArray || !ctx || !canvas) {
        // If not initialized yet, skip this frame
        return;
    }
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
    // Comment out or adjust this log if too verbose
    // console.log('[Visualizer] Frame drawn');
}
