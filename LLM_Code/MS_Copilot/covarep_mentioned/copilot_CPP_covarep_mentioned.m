function calculate_cpp(filename)
    % Load the audio file
    [x, fs] = audioread(filename);

    % High-pass filter settings
    HPfilt_b = [1 -0.97];
    x = filter(HPfilt_b, 1, x);

    % Frame settings
    frameLength = round(0.04 * fs);
    frameShift = round(0.01 * fs);
    halfLen = round(frameLength / 2);
    xLen = length(x);
    frameLen = halfLen * 2 + 1;
    NFFT = 2 ^ nextpow2(frameLen);
    quef = linspace(0, frameLen / 1000, NFFT);
    F0lim = [500, 50];
    quefLim = round(fs ./ F0lim);
    quefSeq = (quefLim(1):quefLim(2))';

    % Frame matrix
    time_samples = frameLength+1:frameShift:xLen-frameLength;
    N = length(time_samples);
    frameStart = time_samples - halfLen;
    frameStop = time_samples + halfLen;
    frameMat = zeros(NFFT, N);
    for n = 1:N
        frameMat(1:frameLen, n) = x(frameStart(n):frameStop(n));
    end

    % Apply Hann window
    win = hanning(frameLen);
    winMat = repmat(win, 1, N);
    frameMat = frameMat(1:frameLen, :) .* winMat;

    % Compute magnitude spectrum
    SpecMat = abs(fft(frameMat));
    SpecdB = 10 * log10(SpecMat.^2);

    % Compute log cepstrum
    Ceps = log(abs(fft(SpecdB)).^2);

    % Take quefrency range and compute max
    CepsLim = Ceps(quefSeq, :);
    [CepsMax, maxIdx] = max(CepsLim, [], 1);

    % Normalization
    CepsNorm = mean(CepsLim, 1);

    CPP = CepsMax - CepsNorm;
    CPP = [CPP(:) time_samples(:)];

    % Display the result
    disp(['Cepstral Peak Prominence (CPP): ', num2str(mean(CPP(:, 1)))]);
end
