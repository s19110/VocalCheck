% === Load and Normalize Signal ===
[x, fs] = audioread("voice.wav");
x = x / max(abs(x));  % Normalize amplitude

% === Estimate GCIs using se_vq ===
F0mean = 100;  % Approximate pitch (adjust per speaker)
creak = [];    % No creaky voice indicator
GCI_sec = se_vq(x, fs, F0mean);  % Returns GCI in seconds
GCI_samples = round(GCI_sec * fs);

% === Estimate Glottal Flow using IAIF ===
g = iaif_ola(x, fs);  % Must be implemented/ported from COVAREP

% === Compute NAQ per Glottal Cycle ===
NAQ_values = [];
for i = 1:length(GCI_samples)-1
    start_idx = GCI_samples(i);
    end_idx = GCI_samples(i+1) - 1;

    if start_idx < 1 || end_idx > length(g) || end_idx <= start_idx
        continue;
    end

    cycle = g(start_idx:end_idx);
    T0 = (end_idx - start_idx + 1) / fs;

    if length(cycle) < 5
        continue;
    end

    % Compute AC Flow Amplitude (peak-to-peak)
    ac_amplitude = max(cycle) - min(cycle);

    % Compute dU/dt (first derivative of glottal flow)
    dg = diff(cycle) * fs;
    dUdt_max = abs(min(dg));

    % Compute NAQ
    NAQ = ac_amplitude / (T0 * dUdt_max);
    NAQ_values(end+1) = NAQ;
end
% === Step 4: Output ===
NAQ = mean(NAQ_values);
disp(['Normalized Amplitude Quotient (NAQ): ', num2str(NAQ)]);
% fprintf("Mean NAQ: %.4f\n", mean(NAQ_values));
% plot(NAQ_values);
% title("NAQ per Glottal Cycle");
% xlabel("Cycle Index"); ylabel("NAQ");

