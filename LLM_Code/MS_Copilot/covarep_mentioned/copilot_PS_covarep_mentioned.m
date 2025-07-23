% Load the audio file
[audio, fs] = audioread('voice.wav');

% Pre-emphasis filter
pre_emphasis = 0.97;
audio = filter([1 -pre_emphasis], 1, audio);

% Parameters for framing
frame_size = 0.025;  % 25 ms
frame_stride = 0.01; % 10 ms
frame_length = round(frame_size * fs);
frame_step = round(frame_stride * fs);
signal_length = length(audio);
num_frames = floor((signal_length - frame_length) / frame_step) + 1;

% Framing
indices = repmat(1:frame_length, num_frames, 1) + repmat((0:num_frames-1)' * frame_step, 1, frame_length);
frames = audio(indices);

% Windowing
frames = frames .* hamming(frame_length)';

% FFT and magnitude spectrum
NFFT = 512;
mag_frames = abs(fft(frames, NFFT, 2));

% Frequency vector
freqs = (0:(NFFT/2)) * fs / NFFT;

% Peak Slope calculation
peak_slopes = [];
for i = 1:size(mag_frames, 1)
    spectrum = mag_frames(i, 1:NFFT/2+1);
    [pks, locs] = findpeaks(spectrum);

    if length(locs) > 1
        slopes = diff(pks) ./ diff(freqs(locs));
        peak_slopes = [peak_slopes; max(slopes)];
    end
end

peak_slope = max(peak_slopes);
disp(['Peak Slope: ', num2str(peak_slope)]);
