% Load the audio file
[audio, fs] = audioread('voice.wav');

% Downsample the audio
audio = resample(audio, 1, 2);
fs = fs / 2;

% Parameters for spectrogram
window = hamming(512);
noverlap = 256;
nfft = 512;

% Process audio in segments
segment_length = 1 * fs;  % 1-second segments
num_segments = floor(length(audio) / segment_length);
peak_slopes = [];

for i = 1:num_segments
    segment = audio((i-1)*segment_length + 1:i*segment_length);
    [S, F, T] = specgram(segment, nfft, fs, window, noverlap);
    [pks, locs] = findpeaks(abs(S(:)));

    % Ensure locs are within bounds of F
    valid_locs = locs(locs <= length(F));
    valid_pks = pks(locs <= length(F));

    % Ensure valid_locs and valid_pks have the same length
    if length(valid_locs) > 1 && length(valid_locs) == length(valid_pks)
        slopes = diff(valid_pks) ./ diff(F(valid_locs));
        slopes = slopes(:);  % Ensure slopes is a column vector
        peak_slopes = [peak_slopes; max(slopes)];
    end
end

peak_slope = max(peak_slopes);
disp(['Peak Slope: ', num2str(peak_slope)]);
