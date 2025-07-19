[x, fs] = audioread("voice.wav");

x = x / max(abs(x));  % Normalize
[b, a] = butter(2, [50 5000]/(fs/2), 'bandpass');
x = filter(b, a, x);

frame = x(1:round(0.03*fs));  % 30ms frame
[r, lags] = xcorr(frame);
r = r(length(frame):end);
[~, peakIdx] = max(r(10:end));  % Avoid 0-lag
T0 = (10 + peakIdx - 1) / fs;
F0 = 1 / T0;

order = round(2 + fs/1000);  % LPC order (e.g., 16 for 8kHz)
a = lpc(frame, order);
g = filter(a, 1, frame);  % Rough glottal flow estimate

ac_amplitude = max(g) - min(g);

dg = diff(g) * fs;  % Derivative
dUdt_max = abs(min(dg));  % Max negative slope

NAQ = ac_amplitude / (T0 * dUdt_max);

disp(['Normalized Amplitude Quotient: ', num2str(NAQ)]);
