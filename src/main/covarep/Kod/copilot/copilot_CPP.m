[y, fs] = audioread('voice.wav');

if size(y, 2) == 2
    y = mean(y, 2);
end
y = y / max(abs(y));

N = length(y);
Y = fft(y);
log_spectrum = log(abs(Y) + eps);
cepstrum = ifft(log_spectrum);
power_cepstrum = abs(cepstrum).^2;

quefrency = (0:N-1) / fs;
[peak_value, peak_index] = max(power_cepstrum);
peak_quefrency = quefrency(peak_index);

baseline = mean(power_cepstrum);
cpp = peak_value - baseline;

disp(['Cepstral Peak Prominence (CPP): ', num2str(cpp)]);
