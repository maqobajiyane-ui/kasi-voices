import {
  MAX_RECORDING_MS,
  MAX_RECORDING_BYTES,
  chooseSupportedMimeType,
  formatDuration,
  recordingFilename,
} from '../lib/audio.js';

function microphoneErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Microphone access was blocked. Allow microphone permission in your browser settings, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone was found on this device.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Your microphone is busy or unavailable. Close other apps using it and try again.';
    case 'OverconstrainedError':
      return 'This microphone could not use the requested settings. Try another device or browser.';
    default:
      return 'The recording could not start. Check your microphone and try again.';
  }
}

export function mountAudioRecorder(root) {
  if (!root) throw new Error('KasiVoices recorder root is missing.');

  const element = (name) => {
    const node = root.querySelector('[data-' + name + ']');
    if (!node) throw new Error('Recorder element missing: ' + name);
    return node;
  };

  const startButton = element('start');
  const stopButton = element('stop');
  const resetButton = element('reset');
  const playbackPanel = element('playback');
  const player = element('player');
  const downloadLink = element('download');
  const timerDisplay = element('timer');
  const recordingLabel = element('recording-label');
  const hint = element('hint');
  const feedback = element('feedback');

  let state = 'idle';
  let recorder = null;
  let stream = null;
  let chunks = [];
  let collectedBytes = 0;
  let startedAt = 0;
  let timerId = null;
  let previewUrl = null;
  let stopReason = 'manual';
  let captureError = false;
  let mounted = true;

  function feedbackMessage(message, isError = false) {
    feedback.textContent = message;
    feedback.dataset.error = String(isError);
  }

  function render(nextState) {
    state = nextState;
    root.dataset.state = state;
    startButton.hidden = state !== 'idle';
    startButton.disabled = state !== 'idle';
    stopButton.hidden = state !== 'recording';
    stopButton.disabled = state !== 'recording';
    playbackPanel.hidden = state !== 'ready';
    recordingLabel.textContent = {
      idle: 'Ready to record',
      requesting: 'Requesting microphone',
      recording: 'Recording now',
      stopping: 'Finishing recording',
      ready: 'Recording complete',
    }[state];
    hint.textContent = {
      idle: 'Tap Start to capture your voice.',
      requesting: 'Your browser may ask to use the microphone.',
      recording: 'Speak clearly. Tap Stop when you are done.',
      stopping: 'Preparing your audio preview…',
      ready: 'Listen back, save a copy, or record again.',
    }[state];
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function releaseStream() {
    if (!stream) return;
    for (const track of stream.getTracks()) track.stop();
    stream = null;
  }

  function removePreview() {
    player.pause();
    player.removeAttribute('src');
    player.load();
    downloadLink.removeAttribute('href');
    downloadLink.removeAttribute('download');
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function resetRecorder() {
    if (state !== 'ready') return;
    if (!window.confirm('Discard this recording? It has not been saved automatically.')) return;
    removePreview();
    timerDisplay.textContent = '00:00';
    startButton.textContent = 'Start recording';
    feedbackMessage('Ready. Your next recording will stay on this device unless you choose to download it.');
    render('idle');
    startButton.focus();
  }

  function fail(message) {
    stopTimer();
    releaseStream();
    recorder = null;
    chunks = [];
    collectedBytes = 0;
    if (!mounted) return;
    render('idle');
    startButton.textContent = 'Try again';
    feedbackMessage(message, true);
    startButton.focus();
  }

  function finishRecording() {
    stopTimer();
    releaseStream();
    recorder = null;

    if (!mounted) {
      chunks = [];
      return;
    }
    if (captureError) {
      fail('The microphone stopped unexpectedly. Please try again.');
      return;
    }

    const mimeType = chunks.find((chunk) => chunk.type)?.type || '';
    const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
    chunks = [];
    collectedBytes = 0;
    if (audioBlob.size === 0) {
      fail('No sound was captured. Check your microphone and try again.');
      return;
    }

    previewUrl = URL.createObjectURL(audioBlob);
    player.src = previewUrl;
    downloadLink.href = previewUrl;
    downloadLink.download = recordingFilename(new Date(), audioBlob.type);
    render('ready');

    if (stopReason === 'time-limit') {
      feedbackMessage('Three-minute limit reached. Your recording is ready to play or download.');
    } else if (stopReason === 'size-limit') {
      feedbackMessage('Recording stopped to protect device memory. Play it or download a copy.');
    } else if (stopReason === 'interrupted') {
      feedbackMessage('Your microphone connection ended. Your captured audio is ready.');
    } else {
      feedbackMessage('Finished. This recording has not been uploaded or saved automatically.');
    }
  }

  function stopRecording(reason = 'manual') {
    if (state !== 'recording' || !recorder) return;
    stopReason = reason;
    stopTimer();
    timerDisplay.textContent = formatDuration(Math.min(Date.now() - startedAt, MAX_RECORDING_MS));
    render('stopping');
    try {
      if (recorder.state === 'inactive') {
        finishRecording();
      } else {
        recorder.stop();
      }
    } catch {
      fail('The recorder could not finish. Please try again.');
    }
  }

  function updateElapsed() {
    if (state !== 'recording') return;
    const elapsed = Date.now() - startedAt;
    timerDisplay.textContent = formatDuration(Math.min(elapsed, MAX_RECORDING_MS));
    if (elapsed >= MAX_RECORDING_MS) stopRecording('time-limit');
  }

  async function startRecording() {
    if (state !== 'idle') return;
    if (!window.isSecureContext) {
      feedbackMessage('Microphone recording requires HTTPS or localhost. Open the app in a secure browser context.', true);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      feedbackMessage('This browser does not support microphone recording. Try an updated Chrome, Firefox, or Safari.', true);
      return;
    }

    render('requesting');
    feedbackMessage('Waiting for microphone permission…');

    try {
      const acquiredStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });

      // A navigation or teardown may occur while permission is pending.
      if (!mounted) {
        for (const track of acquiredStream.getTracks()) track.stop();
        return;
      }

      stream = acquiredStream;
      let activeRecorder;
      const mimeType = chooseSupportedMimeType(window.MediaRecorder);
      try {
        const options = mimeType
          ? { mimeType, audioBitsPerSecond: 48000 }
          : { audioBitsPerSecond: 48000 };
        activeRecorder = new window.MediaRecorder(stream, options);
      } catch {
        // Browser support for bitrates and containers varies.
        activeRecorder = new window.MediaRecorder(stream);
      }
      recorder = activeRecorder;
      chunks = [];
      collectedBytes = 0;
      captureError = false;
      stopReason = 'manual';

      activeRecorder.addEventListener('dataavailable', (event) => {
        if (!event.data || event.data.size === 0) return;
        chunks.push(event.data);
        collectedBytes += event.data.size;
        if (collectedBytes >= MAX_RECORDING_BYTES && state === 'recording') {
          stopRecording('size-limit');
        }
      });
      activeRecorder.addEventListener('error', () => {
        captureError = true;
        if (state === 'recording') {
          stopRecording('interrupted');
        } else if (state === 'requesting') {
          fail('Recording failed to initialize. Please try again.');
        }
      });
      activeRecorder.addEventListener('stop', finishRecording, { once: true });
      stream.getAudioTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (state === 'recording') stopRecording('interrupted');
        }, { once: true });
      });

      activeRecorder.start(1000);
      startedAt = Date.now();
      timerDisplay.textContent = '00:00';
      render('recording');
      feedbackMessage('Recording locally. Nothing is being sent to a server.');
      timerId = setInterval(updateElapsed, 250);
    } catch (error) {
      fail(microphoneErrorMessage(error));
    }
  }

  function cleanup() {
    mounted = false;
    stopTimer();
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch { /* Ignore teardown errors. */ }
    }
    releaseStream();
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  startButton.addEventListener('click', startRecording);
  stopButton.addEventListener('click', () => stopRecording());
  resetButton.addEventListener('click', resetRecorder);
  window.addEventListener('pagehide', cleanup, { once: true });

  render('idle');
  return cleanup;
}
