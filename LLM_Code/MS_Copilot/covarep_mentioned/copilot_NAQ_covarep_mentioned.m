function calculate_naq(filename)
  % Load your glottal flow waveform data from a .wav file
  [glottal_flow, fs] = audioread(filename);

  % Design a high-pass filter
  fc = 70; % Cutoff frequency in Hz
  [b, a] = butter(2, fc / (fs / 2), 'high');

  % Apply the high-pass filter to the signal
  glottal_flow = filtfilt(b, a, glottal_flow);

  % Detect Glottal Closure Instants (GCIs) using SEDREAMS
  GCI = estimate_GCIs(glottal_flow, fs);

  % Perform IAIF to get the glottal flow waveform
  [g_iaif, gd_iaif] = iaif(glottal_flow, fs);

  % Calculate the peak-to-peak amplitude of the glottal flow waveform
  peak_to_peak_amplitude = max(g_iaif) - min(g_iaif);

  % Calculate the derivative of the glottal flow waveform
  glottal_flow_derivative = diff(g_iaif);

  % Find the maximum declination rate (most negative value in the derivative)
  max_declination_rate = min(glottal_flow_derivative);

  % Calculate the Normalized Amplitude Quotient (NAQ)
  NAQ = max_declination_rate / peak_to_peak_amplitude;

  % Display the result
  disp(['Normalized Amplitude Quotient (NAQ): ', num2str(NAQ)]);
end

function GCIs = estimate_GCIs(signal, fs)
  % Estimate Glottal Closure Instants (GCIs) using an extension of SEDREAMS algorithm
  % signal: input speech signal
  % fs: sampling frequency

  % Preprocessing: High-pass filtering to remove low-frequency noise
  [b, a] = butter(4, 70 / (fs / 2), 'high');
  filtered_signal = filtfilt(b, a, signal);

  % Compute the Hilbert envelope of the signal
  hilbert_env = abs(hilbert(filtered_signal));

  % Apply a low-pass filter to smooth the envelope
  [b, a] = butter(4, 400 / (fs / 2), 'low');
  smoothed_env = filtfilt(b, a, hilbert_env);

  % Detect peaks in the smoothed envelope
  [peaks, locs] = findpeaks(smoothed_env, 'MinPeakHeight', 0.01, 'MinPeakDistance', round(0.002 * fs), 'DoubleSided');

  % Refine GCI locations using the original signal
  GCIs = refine_GCIs(signal, locs, fs);

end

function refined_GCIs = refine_GCIs(signal, locs, fs)
  % Refine GCI locations using the original signal
  % signal: input speech signal
  % locs: initial GCI locations
  % fs: sampling frequency

  refined_GCIs = zeros(size(locs));
  for i = 1:length(locs)
    window_start = max(1, locs(i) - round(0.001 * fs));
    window_end = min(length(signal), locs(i) + round(0.001 * fs));
    [~, local_max] = max(signal(window_start:window_end));
    refined_GCIs(i) = window_start + local_max - 1;
  end
end

function [g, dg] = iaif(speech_frame, fs)
  % IAIF - Iterative Adaptive Inverse Filtering
  % Inputs:
  %   speech_frame - a frame of the speech signal
  %   fs - sampling frequency
  % Outputs:
  %   g - glottal volume velocity waveform
  %   dg - glottal volume velocity derivative waveform

  % Step 1: Pre-emphasis
  pre_emphasis = [1 -0.97];
  speech_frame = filter(pre_emphasis, 1, speech_frame);

  % Step 2: Estimate the vocal tract filter using LPC
  p_vt = 10; % Order of LPC for vocal tract
  a_vt = lpc(speech_frame, p_vt);
  vt_filter = filter(a_vt, 1, speech_frame);

  % Step 3: Estimate the glottal flow using LPC
  p_gl = 4; % Order of LPC for glottal flow
  a_gl = lpc(vt_filter, p_gl);
  gl_filter = filter(a_gl, 1, vt_filter);

  % Step 4: De-emphasis
  g = filter(1, pre_emphasis, gl_filter);

  % Step 5: Compute the derivative of the glottal flow
  dg = diff(g);

  % Ensure dg has the same length as g
  dg = [dg; dg(end)];

end
