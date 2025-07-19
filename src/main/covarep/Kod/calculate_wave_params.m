function [naqs, pss, cpps, min_l] = calculate_wave_params()
pkg load signal
%config
warning off
no_files = 22;
no_samples =6;
no_student_files = 10;

naqs = zeros(no_files+no_student_files, no_samples*2);
pss = zeros(no_files+no_student_files, no_samples*2);
cpps = zeros(no_files+no_student_files, no_samples*2);
ls = zeros(no_files+no_student_files, no_samples*2);
min_l = 100000;

##      display(['processing ',num2str(i),' person with sample: ',num2str(s)])
##      istr = num2str(i,'%d');
##      sstr = num2str(s,'%d');

      [naq_single, ps_single, cpp_single, l] = process_single_wave(strcat('../Nagrania/voice.wav'));
##      naqs(1,1) = naq_single;
##      pss(1,1) = ps_single;
##      cpps(1,1) = cpp_single;
##      ls(1,1) = l;
##      display(['naq: '])
##      display([naq_single])
##      display(['ps: ', ps_single])
##      display([ps_single])
##      display(['cpp: '])
##      display([cpp_single])
##      display(['l:'])
##      display([l])
##      [naq_single, ps_single, cpp_single, l] = process_single_wave(strcat('../Nagrania/',istr,'/',istr,' po', 32, sstr,'.wav'));
##      naqs(i,s+6) = naq_single;
##      pss(i,s+6) = ps_single;
##      cpps(i,s+6) = cpp_single;
##      ls(i,s+6) = l;

##for j = 1:no_student_files
##    for s = 1:no_samples
##        display(['processing s',num2str(j),' person with sample: ',num2str(s)])
##        jstr = num2str(j,'%d');
##        sstr = num2str(s,'%d');
##
##        [naq_single, ps_single, cpp_single, l] = process_single_wave(strcat('../Nagrania/s',jstr,'/s',jstr,' przed', 32, sstr,'.wav'));
##        naqs(i+j,s) = naq_single;
##        pss(i+j,s) = ps_single;
##        cpps(i+j,s) = cpp_single;
##        ls(i+j,s) = l;
##
##        [naq_single, ps_single, cpp_single, l] = process_single_wave(strcat('../Nagrania/s',jstr,'/s',jstr,' po', 32, sstr,'.wav'));
##        naqs(i+j,s+6) = naq_single;
##        pss(i+j,s+6) = ps_single;
##        cpps(i+j,s+6) = cpp_single;
##        ls(i+j,s+6) = l;
##    end
##end

end

function [NAQ, PS, CPP, l] = process_single_wave(name)

% Settings
F0min = 80; % Minimum F0 set to 80 Hz
F0max = 500; % Maximum F0 set to 80 Hz
frame_shift = 10; % Frame shift in ms

% Load soundfile
target_fq = 16000;
[x,fs] = audioread(name);
% resample
x = resample(x(:,1), target_fq, fs);
fs = target_fq;
l = length(x);

% take only middle part of the vowel
portion_of_wave = 0.8;
start_idx = round(l*((1-portion_of_wave)/2));
end_idx = round(l*(1+portion_of_wave)/2);
x = x(start_idx: end_idx);
% Check the speech signal polarity
polarity = polarity_reskew(x,fs);
x=polarity*x;

% Extract the pitch and voicing information
[srh_f0,srh_vuv,srh_vuvc,srh_time] = pitch_srh(x,fs,F0min,F0max,frame_shift);
% Creaky probability estimation
try
    [creak_pp,creak_bin] = detect_creaky_voice(x,fs); % Detect creaky voice
    creak=interp1(creak_bin(:,2),creak_bin(:,1),1:length(x));
    creak(creak<0.5)=0; creak(creak>=0.5)=1;
catch
    disp('Version or toolboxes do not support neural network object used in creaky voice detection. Creaky detection skipped.')
    creak=zeros(length(x),1);
end

% GCI estimation
se_gci = se_vq(x,fs,median(srh_f0),creak);           % SE-VQ

[gf_iaif,gfd_iaif] = iaif_ola(x,fs);    % Glottal flow (and derivative) by the IAIF method

[NAQ,QOQ,H1H2,HRF,PSP] = get_vq_params(gf_iaif,gfd_iaif,fs,se_gci); % Estimate conventional glottal parameters

%PEAK SLOPE
PS = peakslope(x,fs);   % peakSlope extraction

%CPP
cpps = cpp( x, fs, 1, 'line', 1);

%take only the single value
PS = mean(PS(:,2));
NAQ = mean(NAQ(:,2));
CPP = mean(cpps(:,1));
printf("PS=%d\n", PS)
printf("NAQ=%d\n", NAQ)
printf("CPP=%d\n", CPP)
end
