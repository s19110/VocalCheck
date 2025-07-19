package org.pjwstk.vocalCheck.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@AllArgsConstructor
@Getter
public class VoiceTestResult {
    String ps;
    String naq;
    String cpp;
    LocalDateTime date;

    public long getPSLong(){
        double tmp = Double.parseDouble(ps);
        return Math.round(tmp * 100);
    }

    public long getNAQLong(){
        double tmp = Double.parseDouble(naq);
        return Math.round(tmp * 100);
    }

    public long getCPPLong(){
        double tmp = Double.parseDouble(cpp);
        return Math.round(tmp * 100);
    }

    public String getPs() {
        double tmp = Double.parseDouble(ps);
        return String.format("%.2f", tmp);
    }

    public String getNaq() {
        double tmp = Double.parseDouble(naq);
        return String.format("%.2f", tmp);
    }

    public String getCpp() {
        double tmp = Double.parseDouble(cpp);
        return String.format("%.2f", tmp);
    }

    public String getDate() {
        return date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String toString() {
        return String.join(",", ps, naq, cpp, date.toString());
    }
}
