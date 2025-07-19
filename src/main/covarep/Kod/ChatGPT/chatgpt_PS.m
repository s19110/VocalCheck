[x, fs] = audioread('voice.wav');

x = x / max(abs(x));
x = filter([1 -0.97], 1, x);  % Pre-emphasis

frame_length = round(0.025 * fs);
hop_length = round(0.010 * fs);

frame = x(1:frame_length) .* hamming(frame_length);  % Apply window
NFFT = 2^nextpow2(frame_length);
spectrum = abs(fft(frame, NFFT));
spectrum = spectrum(1:NFFT/2);  % One-sided
frequencies = linspace(0, fs/2, NFFT/2);

log_spectrum = 20 * log10(spectrum + eps);

peaks = [];
for k = 2:length(log_spectrum)-1
  if log_spectrum(k) > log_spectrum(k-1) && log_spectrum(k) > log_spectrum(k+1)
    peaks(end+1,:) = [frequencies(k), log_spectrum(k)];
  end
end


f = peaks(:,1);   % Frequencies of peaks
m = peaks(:,2);   % Magnitudes in dB
p = polyfit(f, m, 1);  % Linear fit: m = p(1)*f + p(2)

peak_slope = p(1);  % This is the Peak Slope (dB/Hz)

disp(['Peak Slope (PS): ', num2str(peak_slope)]);
