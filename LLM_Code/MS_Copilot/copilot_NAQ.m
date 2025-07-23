% Load your glottal flow waveform data from a .wav file
[glottal_flow, fs] = audioread('voice.wav');

% Calculate the peak-to-peak amplitude
peak_to_peak_amplitude = max(glottal_flow) - min(glottal_flow);

% Calculate the derivative of the glottal flow waveform
glottal_flow_derivative = diff(glottal_flow);

% Find the maximum declination rate (most negative value in the derivative)
max_declination_rate = min(glottal_flow_derivative);

% Calculate the Normalized Amplitude Quotient (NAQ)
NAQ = max_declination_rate / peak_to_peak_amplitude;

% Display the result
disp(['Normalized Amplitude Quotient (NAQ): ', num2str(NAQ)]);
