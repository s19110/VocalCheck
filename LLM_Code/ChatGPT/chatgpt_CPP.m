[x, fs] = audioread('voice.wav');
x = x(:,1);  % Use mono channel if stereo

 preemph = filter([1 -0.97], 1, x);

frame_size = round(0.04 * fs);  % 40 ms
frame = preemph(1:frame_size) .* hamming(frame_size);

spectrum = abs(fft(frame));
log_spectrum = log(spectrum + eps);
cepstrum = real(ifft(log_spectrum));

qmin = round(fs / 300);  % max pitch
qmax = round(fs / 60);   % min pitch

[peak_val, peak_idx] = max(cepstrum(qmin:qmax));
true_peak_idx = peak_idx + qmin - 1;

% Fit linear regression to cepstrum values excluding the peak
x_axis = (1:length(cepstrum))';
baseline_range = setdiff(qmin:qmax, true_peak_idx);  % exclude the peak
p = polyfit(x_axis(baseline_range), cepstrum(baseline_range), 1);
baseline_val = polyval(p, true_peak_idx);

CPP = peak_val - baseline_val;

disp(['Cepstral Peak Prominence (CPP): ', num2str(CPP)]);
