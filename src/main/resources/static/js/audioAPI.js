// index.js ---------------
import {MediaRecorder, register} from 'https://jspm.dev/extendable-media-recorder';
import {connect} from 'https://jspm.dev/extendable-media-recorder-wav-encoder';
import WaveSurfer from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/wavesurfer.esm.js'
import RecordPlugin from './record.esm.js'
import {disableFileDrop, enableFileDrop} from './enabler.js'
//Model
let wavesurfer = WaveSurfer.create({
    container: '.waveform',
    waveColor: 'rgb(90, 24, 112)',
    progressColor: 'rgb(90, 24, 112)',
})

let record;
//View
var microphoneButton = document.getElementsByClassName("start-recording-button")[0];
var recordingControlButtonsContainer = document.getElementsByClassName("recording-control-buttons-container")[0];
var stopRecordingButton = document.getElementsByClassName("stop-recording-button")[0];
var cancelRecordingButton = document.getElementsByClassName("cancel-recording-button")[0];
var elapsedTimeTag = document.getElementsByClassName("elapsed-time")[0];
var closeBrowserNotSupportedBoxButton = document.getElementsByClassName("close-browser-not-supported-box")[0];
var overlay = document.getElementsByClassName("overlay")[0];
var audioElement = document.getElementsByClassName("audio-element")[0];
var audioElementSource = document.getElementsByClassName("audio-element")[0]
    .getElementsByTagName("source")[0];
var textIndicatorOfAudiPlaying = document.getElementsByClassName("text-indication-of-audio-playing")[0];

//Listeners

//Listen to start recording button
microphoneButton.onclick = startAudioRecording;

//Listen to stop recording button
stopRecordingButton.onclick = stopAudioRecording;

//Listen to cancel recording button
cancelRecordingButton.onclick = cancelAudioRecording;


//Listen to when the audio being played ends
audioElement.onended = hideTextIndicatorOfAudioPlaying;

/** Custom Errors */
function MicrophoneClippingError() {

}

MicrophoneClippingError.prototype = Error.prototype;

function PowerTooLowError(p = 0){
    this.p = p;
}

PowerTooLowError.prototype = Error.prototype

/** Displays recording control buttons */
function handleDisplayingRecordingControlButtons() {
    //Hide the microphone button that starts audio recording
    microphoneButton.style.display = "none";

    //Display the recording control buttons
    recordingControlButtonsContainer.classList.remove("hide");

    //Handle the displaying of the elapsed recording time
    handleElapsedRecordingTime();
}

/** Hide the displayed recording control buttons */
function handleHidingRecordingControlButtons() {
    //Display the microphone button that starts audio recording
    microphoneButton.style.display = "block";

    //Hide the recording control buttons
    recordingControlButtonsContainer.classList.add("hide");

    //stop interval that handles both time elapsed and the red dot
    clearInterval(elapsedTimeTimer);
}

/** Displays browser not supported info box for the user*/
function displayBrowserNotSupportedOverlay() {
    overlay.classList.remove("hide");
}


/** Creates a source element for the the audio element in the HTML document*/
function createSourceForAudioElement() {
    let sourceElement = document.createElement("source");
    audioElement.appendChild(sourceElement);

    audioElementSource = sourceElement;
}

/** Display the text indicator of the audio being playing in the background */
function displayTextIndicatorOfAudioPlaying() {
    textIndicatorOfAudiPlaying.classList.remove("hide");
}

/** Hide the text indicator of the audio being playing in the background */
function hideTextIndicatorOfAudioPlaying() {
    textIndicatorOfAudiPlaying.classList.add("hide");
}

//Controller

/** Stores the actual start time when an audio recording begins to take place to ensure elapsed time start time is accurate*/
var audioRecordStartTime;

/** Stores the maximum recording time in hours to stop recording once maximum recording hour has been reached */
var maximumRecordingTimeInHours = 1;

/** Stores the reference of the setInterval function that controls the timer in audio recording*/
var elapsedTimeTimer;

/** Starts the audio recording*/
function startAudioRecording() {
    disableFileDrop();
    console.log("Recording Audio...");

    //If a previous audio recording is playing, pause it
    let recorderAudioIsPlaying = !audioElement.paused; // the paused property tells whether the media element is paused or not
    console.log("paused?", !recorderAudioIsPlaying);
    if (recorderAudioIsPlaying) {
        audioElement.pause();
        //also hide the audio playing indicator displayed on the screen
        hideTextIndicatorOfAudioPlaying();
    }

    //start recording using the audio recording API
    audioRecorder.start()
        .then(() => { //on success

            //store the recording start time to display the elapsed time according to it
            audioRecordStartTime = new Date();

            //display control buttons to offer the functionality of stop and cancel
            handleDisplayingRecordingControlButtons();
        })
        .catch(error => { //on error
            //No Browser Support Error
            if (error.message.includes("mediaDevices API or getUserMedia method is not supported in this browser.")) {
                console.log("To record audio, use browsers like Chrome and Firefox.");
                displayBrowserNotSupportedOverlay();
            }
            const errorMessages = {
                "en": {
                    "AbortError": "Microphone access has been disabled.",
                    "NotAllowedError": "Microphone access has been denied. Change site permissions in your browser.",
                    "NotFoundError": "No microphone detected. Make sure your device is connected.",
                    "NotReadableError": "Microphone signal is not readable.",
                    "SecurityError": "Security error has occurred.",
                    "InvalidStateError": "Microphone data stream could not be read.",
                    "DefaultError": "Unknown error. Check your microphone and refresh the page."
                },
                "pl": {
                    "AbortError": "Dostęp do mikrofonu został zablokowany.",
                    "NotAllowedError": "Dostęp do mikrofonu został zablokowany. Zmień uprawnienia strony w ustawieniach przeglądarki.",
                    "NotFoundError": "Mikrofon nie został wykryty, sprawdź podpięte urządzenia.",
                    "NotReadableError": "Nastąpił błąd przy odczycie sygnału z mikrofonu.",
                    "SecurityError": "Nastąpił błąd bezpieczeństwa.",
                    "InvalidStateError": "Nie udało się pobrać strumienia danych z mikrofonu.",
                    "DefaultError": "Nieznany błąd, sprawdź stan mikrofonu i odśwież stronę."
                }
            }
            //Error handling structure
            showErrorMessage(errorMessages[currentLocale][error.name] || errorMessages[currentLocale]["DefaultError"]);
            enableFileDrop();
            console.log(error);
        });
}

function showErrorMessage(message) {
    let errorCard = document.getElementById('error-card');
    document.getElementById('error-card-text').innerHTML = message;
    errorCard.classList.toggle('fade');
    setTimeout(function () {
            errorCard.classList.toggle('fade');
        }
        , 2000);

}


/** Cancel the currently started audio recording */
function cancelAudioRecording() {
    console.log("Canceling audio...");
    enableFileDrop();
    if (wavesurfer) {
        wavesurfer.destroy()
    }
    wavesurfer = WaveSurfer.create({
        container: '.waveform',
        waveColor: 'rgb(90, 24, 112)',
        progressColor: 'rgb(90, 24, 112)',
    })

    //cancel the recording using the audio recording API
    audioRecorder.cancel();

    //hide recording control button & return record icon
    handleHidingRecordingControlButtons();
}

/** Stop the currently started audio recording & sends it
 */
function stopAudioRecording() {

    console.log("Stopping Audio Recording...");
    record.on('record-end', (blob) => {
        const recordedUrl = URL.createObjectURL(blob)
        wavesurfer.destroy();
        // Create wavesurfer from the recorded audio
        wavesurfer = WaveSurfer.create({
            container: '.waveform',
            waveColor: 'rgb(90, 24, 112)',
            progressColor: 'rgb(90, 24, 112)',
            url: recordedUrl,
        })
    })
    record.stopRecording()
    //stop the recording using the audio recording API
    audioRecorder.stop()
        .then(audioAsblob => {
            audioAsblob = audioAsblob.slice(0, audioAsblob.size, "audio/wav");
            audioAsblob.lastModfiedDate = new Date();
            audioAsblob.name = "voice.wav";


            //Hide the recording control buttons
            recordingControlButtonsContainer.classList.add("hide");

            //stop interval that handles both time elapsed and the red dot
            clearInterval(elapsedTimeTimer);
            if(audioRecorder.isMicClipping){
                cancelAudioRecording();
                showErrorMessage("Wykryto przestery mikrofonu. Zmień ustawienia mikrofonu i spróbuj ponownie.");
                return;
            }
            document.getElementById("loading-card").classList.remove("hide");
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(new File([audioAsblob], "voice.wav"));
            const fileInput = document.querySelector('input[type="file"]');
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', {bubbles: true}));
            document.getElementById('record-container').style.pointerEvents = 'auto';
            document.getElementById('record-container').style.filter = null;
            // playAudio(audioAsblob);
            //
            // //hide recording control button & return record icon
            // handleHidingRecordingControlButtons();
        })
    // .catch(error => {
    //     //Error handling structure
    //     switch (error.name) {
    //         case 'InvalidStateError': //error from the MediaRecorder.stop
    //             console.log("An InvalidStateError has occured.");
    //             break;
    //         default:
    //             console.log("An error occured with the error name " + error.name);
    //     };
    // });
}

/** Plays recorded audio using the audio element in the HTML document
 * @param {Blob} recorderAudioAsBlob - recorded audio as a Blob Object
 */
function playAudio(recorderAudioAsBlob) {

    //read content of files (Blobs) asynchronously
    let reader = new FileReader();

    //once content has been read
    reader.onload = (e) => {
        //store the base64 URL that represents the URL of the recording audio
        let base64URL = e.target.result;

        //If this is the first audio playing, create a source element
        //as pre populating the HTML with a source of empty src causes error
        if (!audioElementSource) //if its not defined create it (happens first time only)
            createSourceForAudioElement();

        //set the audio element's source using the base64 URL
        audioElementSource.src = base64URL;

        //set the type of the audio element based on the recorded audio's Blob type
        let BlobType = recorderAudioAsBlob.type.includes(";") ?
            recorderAudioAsBlob.type.substr(0, recorderAudioAsBlob.type.indexOf(';')) : recorderAudioAsBlob.type;
        audioElementSource.type = BlobType

        //call the load method as it is used to update the audio element after changing the source or other settings
        audioElement.load();

        //play the audio after successfully setting new src and type that corresponds to the recorded audio
        console.log("Playing audio...");
        audioElement.play();

        //Display text indicator of having the audio play in the background
        displayTextIndicatorOfAudioPlaying();
    };

    //read content and convert it to a URL (base64)
    reader.readAsDataURL(recorderAudioAsBlob);
}

/** Computes the elapsed recording time since the moment the function is called in the format h:m:s*/
function handleElapsedRecordingTime() {
    //display inital time when recording begins
    displayElapsedTimeDuringAudioRecording("00:05");

    //create an interval that compute & displays elapsed time, as well as, animate red dot - every second
    elapsedTimeTimer = setInterval(() => {
        //compute the elapsed time every second
        let elapsedTime = tickDownTime();
        //display the elapsed time
        displayElapsedTimeDuringAudioRecording(elapsedTime);
    }, 1000); //every second
}

/** Display elapsed time during audio recording
 * @param {String} elapsedTime - elapsed time in the format mm:ss or hh:mm:ss
 */
function displayElapsedTimeDuringAudioRecording(elapsedTime) {
    //1. display the passed elapsed time as the elapsed time in the elapsedTime HTML element
    elapsedTimeTag.innerHTML = elapsedTime;

    //2. Stop the recording when the max number of hours is reached
    if (elapsedTimeReachedMaximumNumberOfHours(elapsedTime)) {
        stopAudioRecording();
    }
}

/**
 * @param {String} elapsedTime - elapsed time in the format mm:ss or hh:mm:ss
 * @returns {Boolean} whether the elapsed time reached the maximum number of hours or not
 */
function elapsedTimeReachedMaximumNumberOfHours(elapsedTime) {
    //Split the elapsed time by the symbo :
    let elapsedTimeSplitted = elapsedTime.split(":");

    //Turn the maximum recording time in hours to a string and pad it with zero if less than 10
    let maximumRecordingTimeInHoursAsString = maximumRecordingTimeInHours < 10 ? "0" + maximumRecordingTimeInHours : maximumRecordingTimeInHours.toString();

    //if it the elapsed time reach hours and also reach the maximum recording time in hours return true
    if (elapsedTimeSplitted.length === 3 && elapsedTimeSplitted[0] === maximumRecordingTimeInHoursAsString)
        return true;
    else //otherwise, return false
        return false;
}

/** Computes the elapsedTime since the moment the function is called in the format mm:ss or hh:mm:ss
 * @param {String} startTime - start time to compute the elapsed time since
 * @returns {String} elapsed time in mm:ss format or hh:mm:ss format, if elapsed hours are 0.
 */
function tickDownTime() {
    let currentTime = parseInt(elapsedTimeTag.innerHTML.at(-1), 10);
    currentTime--;
    if (currentTime === 0) {
        stopAudioRecording();
    }
    return "00:0" + currentTime;
}

// audio-recording.js ---------------
//API to handle audio recording
var audioRecorder = {
    /** Stores the recorded audio as Blob objects of audio data as the recording continues*/
    audioBlobs: [],/*of type Blob[]*/
    /** Stores the reference of the MediaRecorder instance that handles the MediaStream when recording starts*/
    mediaRecorder: null, /*of type MediaRecorder*/
    /** Stores the reference to the stream currently capturing the audio*/
    streamBeingCaptured: null, /*of type MediaStream*/
    needsRegistering: true,
    /** Interval used for obtaining the audio samples in a given window **/
    getAudioWindow: null,
    /** Total power for the current recording */
    totalP: 0,
    /** Flag to indicate that microphone clipping occured */
    isMicClipping: false,

    /** Constant representing minimal acceptable signal power */
    minPower: -20,

    /** Start recording the audio
     * @returns {Promise} - returns a promise that resolves if audio recording successfully started
     */

    // const min_
    start: async function () {
        //Feature Detection
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
            //Feature is not supported in browser
            //return a custom error
            return Promise.reject(new Error('mediaDevices API or getUserMedia method is not supported in this browser.'));
        } else {
            //Feature is supported in browser

            //create an audio stream
            if (this.needsRegistering) {
                await register(await connect());
                this.needsRegistering = false;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    autoGainControl: false,
                    echoCancellation: false,
                    noiseSuppression: false
                }
            });

            // Create an analyzer node
            const sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate;
            const audioCtx = new AudioContext({ sampleRate });
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            // fftSize musi być potęgą liczby 2
            let power = 1;
            let sampleNum = sampleRate * 0.12; // Liczba próbek odpowiadających 120 milisekundom
            while (power < sampleNum) {
                power *= 2;
            }
            analyser.fftSize = power;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);
            // Reset data from previous recording
            this.totalP = 0;
            this.isMicClipping = false;
            if (this.getAudioWindow == null){
                this.getAudioWindow = window.setInterval(function(){
                    analyser.getFloatTimeDomainData(dataArray);
                    let maxForFrame = Math.max.apply(null, dataArray);
                    let minForFrame  =  Math.min.apply(null, dataArray);
                    let p = dataArray.reduce((x, y) => x + Math.pow(y, 2), 0) / dataArray.length;
                    if(Math.abs(maxForFrame) === 1 || Math.abs(minForFrame) === 1){
                        audioRecorder.isMicClipping = true;
                    }
                    audioRecorder.totalP += p;
                }, 120);
            }
            //save the reference of the stream to be able to stop it when necessary
            audioRecorder.streamBeingCaptured = stream;
            //create a media recorder instance by passing that stream into the MediaRecorder constructor
            if (audioRecorder.mediaRecorder === null) {
                audioRecorder.mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/wav'}); // the MediaRecorder interface of the MediaStream Recording
            }
            //clear previously saved audio Blobs, if any
            audioRecorder.audioBlobs = [];
            // Create an instance of WaveSurfer
            if (wavesurfer) {
                wavesurfer.destroy()
            }
            wavesurfer = WaveSurfer.create({
                container: '.waveform',
                waveColor: 'rgb(90, 24, 112)',
                progressColor: 'rgb(90, 24, 112)',
                interact: 'false'
            })
            let scrollingWaveform = true
            record = wavesurfer.registerPlugin(RecordPlugin.create({scrollingWaveform, renderRecordedAudio: false}))
            let deviceId = ""
            record.startRecording({deviceId})
            //add a dataavailable event listener in order to store the audio data Blobs when recording
            audioRecorder.mediaRecorder.addEventListener("dataavailable", event => {
                //store audio Blob object
                audioRecorder.audioBlobs.push(event.data);

            });

            //start the recording by calling the start method on the media recorder
            audioRecorder.mediaRecorder.start();

            /* errors are not handled in the API because if its handled and the promise is chained, the .then after the catch will be executed*/
        }
    },
    /** Stop the started audio recording
     */
    stop: function () {
        //return a promise that would return the blob or URL of the recording
        clearInterval(this.getAudioWindow);
        this.getAudioWindow = null;
        let totalP = Math.log10(this.totalP)*10
        console.log("TotalP 2:" + totalP);
        const micErrors = {
            "en": {
                "too-low": "Sound level is too low. Change your microphone settings and try again.",
                "too-high": "Microphone clipping detected. Change your microphone settings and try again.",
            },
            "pl": {
                "too-low": "Poziom dźwięku jest za niski. Zmień ustawienia mikrofonu i spróbuj ponownie.",
                "too-high": "Wykryto przestery mikrofonu. Zmień ustawienia mikrofonu i spróbuj ponownie.",
            }
        }
        if (totalP < this.minPower){
            cancelAudioRecording();
            showErrorMessage(micErrors[currentLocale]["too-low"]);
            return;
        }
        if(this.isMicClipping){
            cancelAudioRecording();
            showErrorMessage(micErrors[currentLocale]["too-high"]);
            return;
        }
        return new Promise(resolve => {
            //save audio type to pass to set the Blob type
            let mimeType = audioRecorder.mediaRecorder.mimeType;

            //listen to the stop event in order to create & return a single Blob object
            audioRecorder.mediaRecorder.addEventListener("stop", () => {
                //create a single blob object, as we might have gathered a few Blob objects that needs to be joined as one
                let audioBlob = new Blob(audioRecorder.audioBlobs, {type: 'audio/wav; codecs=0'});

                //resolve promise with the single audio blob representing the recorded audio
                resolve(audioBlob);
            });
            audioRecorder.cancel();
        });
    },
    /** Cancel audio recording*/
    cancel: function () {
        //stop the recording feature
        audioRecorder.mediaRecorder.stop();

        //stop all the tracks on the active stream in order to stop the stream
        audioRecorder.stopStream();

        //reset API properties for next recording
        audioRecorder.resetRecordingProperties();
        clearInterval(this.getAudioWindow);
        console.log("TotalP 1:" +  Math.log10(audioRecorder.totalP)*10);
        this.getAudioWindow = null;
    },
    /** Stop all the tracks on the active stream in order to stop the stream and remove
     * the red flashing dot showing in the tab
     */
    stopStream: function () {
        //stopping the capturing request by stopping all the tracks on the active stream
        audioRecorder.streamBeingCaptured.getTracks() //get all tracks from the stream
            .forEach(track /*of type MediaStreamTrack*/ => track.stop()); //stop each one
    },
    /** Reset all the recording properties including the media recorder and stream being captured*/
    resetRecordingProperties: function () {
        audioRecorder.mediaRecorder = null;
        audioRecorder.streamBeingCaptured = null;

        /*No need to remove event listeners attached to mediaRecorder as
        If a DOM element which is removed is reference-free (no references pointing to it), the element itself is picked
        up by the garbage collector as well as any event handlers/listeners associated with it.
        getEventListeners(audioRecorder.mediaRecorder) will return an empty array of events.*/
    }
}