[x, fs] = audioread('voice.wav');
x = filter([1 -0.97], 1, x);  % Pre-emphasis
frame_len = round(0.025 * fs);
frame = x(1:frame_len) .* hamming(frame_len);


lpc_order = 12;            % LPC order
NFFT = 1024;               % FFT length
freq_min = 1000;           % Min freq for regression (Hz)
freq_max = 5000;           % Max freq for regression (Hz)

% Compute FFT spectrum
spectrum = abs(fft(frame, NFFT));
spectrum = spectrum(1:NFFT/2);
freqs = linspace(0, fs/2, NFFT/2);

% LPC envelope
a = lpc(frame, lpc_order);
[h, w] = freqz(1, a, NFFT, fs);
envelope = abs(h(1:NFFT/2));

% Residual spectrum
residual = spectrum ./ (envelope + eps);

% Limit to defined frequency range
range_mask = (freqs >= freq_min) & (freqs <= freq_max);
residual_crop = residual(range_mask);
freq_crop = freqs(range_mask);

% Find peaks in residual spectrum
[pks, locs] = findpeaks(residual_crop);
if length(pks) < 2
  peak_slope = NaN;  % Not enough peaks for regression
end

% Frequency and amplitude of peaks
peak_freqs = freq_crop(locs);
peak_amps = pks;

% Linear regression (least squares fit)
coeffs = polyfit(peak_freqs, peak_amps, 1);
peak_slope = coeffs(1);  % Slope (change in amp per Hz)

disp(['Peak Slope (PS): ', num2str(peak_slope)]);
