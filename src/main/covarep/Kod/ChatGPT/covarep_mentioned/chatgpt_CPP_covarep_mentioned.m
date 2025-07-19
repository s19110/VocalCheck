pkg load signal

% Load the voice signal
[x, fs] = audioread('voice.wav');
x = x(:,1);  % Ensure mono channel

% Apply pre-emphasis filter
x = filter([1 -0.97], 1, x);

% Define frame parameters
frame_length = round(0.04 * fs);  % 40 ms
frame_shift = round(0.01 * fs);   % 10 ms
NFFT = 2^nextpow2(frame_length);
num_frames = floor((length(x) - frame_length) / frame_shift) + 1;

% Initialize CPP array
CPP = zeros(num_frames, 1);

% Define quefrency range corresponding to 50-500 Hz
F0_min = 50;
F0_max = 500;
quef_min = round(fs / F0_max);
quef_max = round(fs / F0_min);

% Process each frame
for i = 1:num_frames
    start_idx = (i - 1) * frame_shift + 1;
    frame = x(start_idx : start_idx + frame_length - 1);

    % Apply Hann window
    windowed_frame = frame .* hann(frame_length);

    % Compute magnitude spectrum and convert to dB
    spectrum = abs(fft(windowed_frame, NFFT));
    spectrum_db = 10 * log10(spectrum + eps);

    % Compute real cepstrum
    cepstrum = real(ifft(spectrum_db));

    % Extract relevant quefrency range
    cepstrum_range = cepstrum(quef_min:quef_max);

    % Identify peak in cepstrum
    [peak_val, peak_idx] = max(cepstrum_range);
    true_peak_idx = peak_idx + quef_min - 1;

    % Estimate baseline using linear regression
    quef_seq = (quef_min:quef_max)';
    p = polyfit(quef_seq, cepstrum_range, 1);
    baseline_val = polyval(p, true_peak_idx);

    % Calculate CPP
    CPP(i) = peak_val - baseline_val;
end

% Optional: Plot CPP over time
% time_axis = ((0:num_frames - 1) * frame_shift + frame_length / 2) / fs;
% plot(time_axis, CPP);
% xlabel('Time (s)');
% ylabel('CPP (dB)');
% title('Cepstral Peak Prominence Over Time');

% Wyświetlenie ostatecznej tak jak przy użyciu COVAREP
CPP_FINAL = mean(CPP(:,1));
disp(['Cepstral Peak Prominence (CPP): ', num2str(CPP_FINAL)]);
