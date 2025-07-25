function t(t, i, e, s) {
    return new(e || (e = Promise))((function(o, r) {
        function n(t) {
            try {
                d(s.next(t))
            } catch (t) {
                r(t)
            }
        }

        function a(t) {
            try {
                d(s.throw(t))
            } catch (t) {
                r(t)
            }
        }

        function d(t) {
            var i;
            t.done ? o(t.value) : (i = t.value, i instanceof e ? i : new e((function(t) {
                t(i)
            }))).then(n, a)
        }
        d((s = s.apply(t, i || [])).next())
    }))
}
"function" == typeof SuppressedError && SuppressedError;
class i {
    constructor() {
        this.listeners = {}
    }
    on(t, i, e) {
        if (this.listeners[t] || (this.listeners[t] = new Set), this.listeners[t].add(i), null == e ? void 0 : e.once) {
            const e = () => {
                this.un(t, e), this.un(t, i)
            };
            return this.on(t, e), e
        }
        return () => this.un(t, i)
    }
    un(t, i) {
        var e;
        null === (e = this.listeners[t]) || void 0 === e || e.delete(i)
    }
    once(t, i) {
        return this.on(t, i, {
            once: !0
        })
    }
    unAll() {
        this.listeners = {}
    }
    emit(t, ...i) {
        this.listeners[t] && this.listeners[t].forEach((t => t(...i)))
    }
}
class e extends i {
    constructor(t) {
        super(), this.subscriptions = [], this.options = t
    }
    onInit() {}
    _init(t) {
        this.wavesurfer = t, this.onInit()
    }
    destroy() {
        this.emit("destroy"), this.subscriptions.forEach((t => t()))
    }
}
class s extends i {
    constructor() {
        super(...arguments), this.unsubscribe = () => {}
    }
    start() {
        this.unsubscribe = this.on("tick", (() => {
            requestAnimationFrame((() => {
                this.emit("tick")
            }))
        })), this.emit("tick")
    }
    stop() {
        this.unsubscribe()
    }
    destroy() {
        this.unsubscribe()
    }
}
const o = ["audio/webm", "audio/wav", "audio/mpeg", "audio/mp4", "audio/mp3"];
class r extends e {
    constructor(t) {
        var i, e, o, r, n, a;
        super(Object.assign(Object.assign({}, t), {
            audioBitsPerSecond: null !== (i = t.audioBitsPerSecond) && void 0 !== i ? i : 128e3,
            scrollingWaveform: null !== (e = t.scrollingWaveform) && void 0 !== e && e,
            scrollingWaveformWindow: null !== (o = t.scrollingWaveformWindow) && void 0 !== o ? o : 5,
            continuousWaveform: null !== (r = t.continuousWaveform) && void 0 !== r && r,
            renderRecordedAudio: null === (n = t.renderRecordedAudio) || void 0 === n || n,
            mediaRecorderTimeslice: null !== (a = t.mediaRecorderTimeslice) && void 0 !== a ? a : void 0
        })), this.stream = null, this.mediaRecorder = null, this.dataWindow = null, this.isWaveformPaused = !1, this.lastStartTime = 0, this.lastDuration = 0, this.duration = 0, this.timer = new s, this.subscriptions.push(this.timer.on("tick", (() => {
            const t = performance.now() - this.lastStartTime;
            this.duration = this.isPaused() ? this.duration : this.lastDuration + t, this.emit("record-progress", this.duration)
        })))
    }
    static create(t) {
        return new r(t || {})
    }
    renderMicStream(t) {
        var i;
        const e = new AudioContext,
            s = e.createMediaStreamSource(t),
            o = e.createAnalyser();
        s.connect(o), this.options.continuousWaveform && (o.fftSize = 32);
        const r = o.frequencyBinCount,
            n = new Float32Array(r);
        let a = 0;
        this.wavesurfer && (null !== (i = this.originalOptions) && void 0 !== i || (this.originalOptions = Object.assign({}, this.wavesurfer.options)), this.wavesurfer.options.interact = !1, this.options.scrollingWaveform && (this.wavesurfer.options.cursorWidth = 0));
        const d = setInterval((() => {
            var t, i, s, d;
            if (!this.isWaveformPaused) {
                if (o.getFloatTimeDomainData(n), this.options.scrollingWaveform) {
                    const t = Math.floor((this.options.scrollingWaveformWindow || 0) * e.sampleRate),
                        i = Math.min(t, this.dataWindow ? this.dataWindow.length + r : r),
                        s = new Float32Array(t);
                    if (this.dataWindow) {
                        const e = Math.max(0, t - this.dataWindow.length);
                        s.set(this.dataWindow.slice(-i + r), e)
                    }
                    s.set(n, t - r), this.dataWindow = s
                } else if (this.options.continuousWaveform) {
                    if (!this.dataWindow) {
                        const e = this.options.continuousWaveformDuration ? Math.round(100 * this.options.continuousWaveformDuration) : (null !== (i = null === (t = this.wavesurfer) || void 0 === t ? void 0 : t.getWidth()) && void 0 !== i ? i : 0) * window.devicePixelRatio;
                        this.dataWindow = new Float32Array(e)
                    }
                    let e = 0;
                    for (let t = 0; t < r; t++) {
                        const i = Math.abs(n[t]);
                        i > e && (e = i)
                    }
                    if (a + 1 > this.dataWindow.length) {
                        const t = new Float32Array(2 * this.dataWindow.length);
                        t.set(this.dataWindow, 0), this.dataWindow = t
                    }
                    this.dataWindow[a] = e, a++
                } else this.dataWindow = n;
                if (this.wavesurfer) {
                    const t = (null !== (d = null === (s = this.dataWindow) || void 0 === s ? void 0 : s.length) && void 0 !== d ? d : 0) / 100;
                    this.wavesurfer.load("", [this.dataWindow], this.options.scrollingWaveform ? this.options.scrollingWaveformWindow : t).then((() => {
                        this.wavesurfer && this.options.continuousWaveform && (this.wavesurfer.setTime(this.getDuration() / 1e3), this.wavesurfer.options.minPxPerSec || this.wavesurfer.setOptions({
                            minPxPerSec: this.wavesurfer.getWidth() / this.wavesurfer.getDuration()
                        }))
                    })).catch((t => {
                        console.error("Error rendering real-time recording data:", t)
                    }))
                }
            }
        }), 10);
        return {
            onDestroy: () => {
                clearInterval(d), null == s || s.disconnect(), null == e || e.close()
            },
            onEnd: () => {
                this.isWaveformPaused = !0, clearInterval(d), this.stopMic()
            }
        }
    }
    startMic(i) {
        return t(this, void 0, void 0, (function*() {
            let t;
            try {
                t = yield navigator.mediaDevices.getUserMedia({
                    audio: {
                        autoGainControl: false,
                        echoCancellation: false,
                        noiseSuppression: false
                    }
                })
            } catch (t) {
                throw new Error("Error accessing the microphone: " + t.message)
            }
            const {
                onDestroy: e,
                onEnd: s
            } = this.renderMicStream(t);
            return this.subscriptions.push(this.once("destroy", e)), this.subscriptions.push(this.once("record-end", s)), this.stream = t, t
        }))
    }
    stopMic() {
        this.stream && (this.stream.getTracks().forEach((t => t.stop())), this.stream = null, this.mediaRecorder = null)
    }
    startRecording(i) {
        return t(this, void 0, void 0, (function*() {
            const t = this.stream || (yield this.startMic(i));
            this.dataWindow = null;
            const e = this.mediaRecorder || new MediaRecorder(t, {
                mimeType: this.options.mimeType || o.find((t => MediaRecorder.isTypeSupported(t))),
                audioBitsPerSecond: this.options.audioBitsPerSecond
            });
            this.mediaRecorder = e, this.stopRecording();
            const s = [];
            e.ondataavailable = t => {
                t.data.size > 0 && s.push(t.data), this.emit("record-data-available", t.data)
            };
            const r = t => {
                var i;
                const o = new Blob(s, {
                    type: e.mimeType
                });
                this.emit(t, o), this.options.renderRecordedAudio && (this.applyOriginalOptionsIfNeeded(), null === (i = this.wavesurfer) || void 0 === i || i.load(URL.createObjectURL(o)))
            };
            e.onpause = () => r("record-pause"), e.onstop = () => r("record-end"), e.start(this.options.mediaRecorderTimeslice), this.lastStartTime = performance.now(), this.lastDuration = 0, this.duration = 0, this.isWaveformPaused = !1, this.timer.start(), this.emit("record-start")
        }))
    }
    getDuration() {
        return this.duration
    }
    isRecording() {
        var t;
        return "recording" === (null === (t = this.mediaRecorder) || void 0 === t ? void 0 : t.state)
    }
    isPaused() {
        var t;
        return "paused" === (null === (t = this.mediaRecorder) || void 0 === t ? void 0 : t.state)
    }
    isActive() {
        var t;
        return "inactive" !== (null === (t = this.mediaRecorder) || void 0 === t ? void 0 : t.state)
    }
    stopRecording() {
        var t;
        this.isActive() && (null === (t = this.mediaRecorder) || void 0 === t || t.stop(), this.timer.stop())
    }
    pauseRecording() {
        var t, i;
        this.isRecording() && (this.isWaveformPaused = !0, null === (t = this.mediaRecorder) || void 0 === t || t.requestData(), null === (i = this.mediaRecorder) || void 0 === i || i.pause(), this.timer.stop(), this.lastDuration = this.duration)
    }
    resumeRecording() {
        var t;
        this.isPaused() && (this.isWaveformPaused = !1, null === (t = this.mediaRecorder) || void 0 === t || t.resume(), this.timer.start(), this.lastStartTime = performance.now(), this.emit("record-resume"))
    }
    static getAvailableAudioDevices() {
        return t(this, void 0, void 0, (function*() {
            return navigator.mediaDevices.enumerateDevices().then((t => t.filter((t => "audioinput" === t.kind))))
        }))
    }
    destroy() {
        this.applyOriginalOptionsIfNeeded(), super.destroy(), this.stopRecording(), this.stopMic()
    }
    applyOriginalOptionsIfNeeded() {
        this.wavesurfer && this.originalOptions && (this.wavesurfer.setOptions(this.originalOptions), delete this.originalOptions)
    }
}
export {
    r as
        default
};