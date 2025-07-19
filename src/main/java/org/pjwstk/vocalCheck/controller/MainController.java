package org.pjwstk.vocalCheck.controller;

import com.google.auth.Credentials;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.IdTokenCredentials;
import com.google.common.collect.Lists;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.pjwstk.vocalCheck.model.VoiceTestResult;
import org.pjwstk.vocalCheck.service.GoogleDriveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Controller
@RequestMapping("/")
@SessionAttributes("gender")
public class MainController {
    Logger logger = LoggerFactory.getLogger(MainController.class);
    @Value("${octave.path}")
    private String OCTAVE_PATH;

    @ModelAttribute("gender")
    public String gender(){
        return null;
    }

    private final OAuth2AuthorizedClientService clientService;

    private static final int PS_MIN=-35, PS_MAX=-19,
            CPP_MIN=1164, CPP_MAX=1167,
            NAQ_MIN_M=12, NAQ_MAX_M=25,
            NAQ_MIN_F=14, NAQ_MAX_F=20;
    private static final double MIN_OK = 1, MAX_OK=2;

    @Autowired
    GoogleDriveService googleDriveService;

    @Autowired
    public MainController(OAuth2AuthorizedClientService clientService) {
        this.clientService = clientService;
    }


    private static final Path OCTAVE_FILE = Paths.get("src/main/covarep/Kod/main.m").toAbsolutePath();
    private static final Pattern COVAREP_PARAMS_PATTERN = Pattern.compile(".*PS=(-?\\d+\\.\\d+)\\n.*NAQ=(-?\\d+\\.\\d+)\\n.*CPP=(-?\\d+\\.\\d+)\\n.*");

    @GetMapping
    public String main(Authentication authentication, @ModelAttribute("gender") String gender, Model model) {
        gender = googleDriveService.getGender(getCredentials(authentication));
        model.addAttribute("gender", gender);
        if(gender == null)
            return "redirect:/gender";
        return "main";
    }

    @PostMapping("/upload")
    public String uploadVoiceFile(Authentication authentication, Model model, @ModelAttribute("gender") String gender, @RequestParam("file") MultipartFile file) {
        try {
            Files.copy(file.getInputStream(), Paths.get("src/main/covarep/Nagrania/voice.wav").toAbsolutePath(), StandardCopyOption.REPLACE_EXISTING);
//            Process process = Runtime.getRuntime().exec(String.format(OCTAVE_PATH + " --no-gui --verbose --eval \"run C:/Users/huber/Downloads/Sterczewski_kod/Kod/main.m\""));
            logger.info(String.format(OCTAVE_PATH + " --no-gui --verbose --eval \"run " + OCTAVE_FILE + "\""));
            Process process = Runtime.getRuntime().exec(String.format("\"" + OCTAVE_PATH + "\" --no-gui --verbose --eval \"run " + OCTAVE_FILE + "\""));
            BufferedReader in =
                    new BufferedReader(new InputStreamReader(process.getInputStream()));
            String inputLine;
            String result = "";
            while ((inputLine = in.readLine()) != null) {
                result += inputLine + "\n";
            }
            in.close();
            logger.info(result);
            Matcher matcher = COVAREP_PARAMS_PATTERN.matcher(result);
            if (matcher.find()) {
                VoiceTestResult testResult = new VoiceTestResult(matcher.group(1), matcher.group(2), matcher.group(3), LocalDateTime.now());
                googleDriveService.updateHistory(getCredentials(authentication), testResult);
                model.addAttribute("PS", testResult.getPs());
                model.addAttribute("NAQ", testResult.getNaq());
                model.addAttribute("CPP", testResult.getCpp());
                addVerdicts(testResult, model, gender);
                wizualizuj(model, testResult.getPSLong(), testResult.getNAQLong(), testResult.getCPPLong(), gender);

            }
            logger.info("Done");
        } catch (IOException exception) {
            return "main";
        }
        logger.info("Sending Ok");
        return "results";
    }

    @PostMapping("/gender")
    public String setGender(Authentication authentication, @RequestParam("gender") String gender, Model model) {
        googleDriveService.setGender(getCredentials(authentication), gender);
        System.out.println("Po ustawieniu płci: " + googleDriveService.getGender(getCredentials(authentication)));
        model.addAttribute("gender", gender);
        return "redirect:/";
    }

    @GetMapping("/gender")
    public String genderSettingPage(Authentication authentication, @ModelAttribute("gender") String gender, Model model) {
        String currentGender = gender == null || gender.isEmpty() ? "sex-u" : gender.equals("man") ? "sex-m" : "sex-f";
        model.addAttribute("currentGender", currentGender);
        return "gender";
    }

    @GetMapping("/result")
    public String getResults(Authentication authentication, Model model, @ModelAttribute("gender") String gender, @RequestParam String ps, @RequestParam String naq, @RequestParam String cpp) {
//        VoiceTestResult testResult = new VoiceTestResult("-0.438848", "0.354761", "11.67601", LocalDateTime.now());
        try {
            VoiceTestResult testResult = new VoiceTestResult(ps, naq, cpp, LocalDateTime.now());
            model.addAttribute("PS", testResult.getPs());
            model.addAttribute("NAQ", testResult.getNaq());
            model.addAttribute("CPP", testResult.getCpp());
            addVerdicts(testResult, model, gender);
            wizualizuj(model, testResult.getPSLong(), testResult.getNAQLong(), testResult.getCPPLong(), gender);
            return "results";
        }catch (NumberFormatException ex){
            return "main";
        }
    }

    @GetMapping("/history")
    public String getHistory(Authentication authentication, Model model,  @ModelAttribute("gender") String gender) {
        try {
            List<VoiceTestResult> vocalTestResults = new ArrayList<>();
            String historyAsString = googleDriveService.getConfigFileString(getCredentials(authentication));
            if (historyAsString != null) {
                CSVParser parser = new CSVParser(new StringReader(historyAsString), CSVFormat.DEFAULT.builder().setDelimiter(',').setHeader("PS", "NAQ", "CPP", "Date").setSkipHeaderRecord(true).build());
                for (CSVRecord record : parser) {
                    vocalTestResults.add(new VoiceTestResult(record.get("PS"), record.get("NAQ"), record.get("CPP"), LocalDateTime.parse(record.get("Date"), DateTimeFormatter.ISO_DATE_TIME)));
                }
                final int NAQ_MAX = gender.equals("woman") ? NAQ_MAX_F : NAQ_MAX_M;
                final int NAQ_MIN = gender.equals("woman") ? NAQ_MIN_F : NAQ_MIN_M;
                model.addAttribute("vocalTestResults", Lists.reverse(vocalTestResults));
                model.addAttribute("cppMin", (CPP_MIN / 100.0));
                model.addAttribute("psMax", (PS_MAX / 100.0));
                model.addAttribute("psMin", (PS_MIN / 100.0));
                model.addAttribute("naqMax", (NAQ_MAX / 100.0));
                model.addAttribute("naqMin", (NAQ_MIN / 100.0));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "history";
    }

    @GetMapping("/login")
    public String login() {
        return "custom_login";
    }

    private void wizualizuj(Model model, long ps, long naq, long cpp, String gender){
        final int NAQ_MAX = gender.equals("woman") ? NAQ_MAX_F : NAQ_MAX_M;
        final int NAQ_MIN = gender.equals("woman") ? NAQ_MIN_F : NAQ_MIN_M;
        int ps_diff = PS_MAX - PS_MIN;
        double ps_factor = (double) (ps - PS_MIN) / ps_diff;
        double x = (MIN_OK - MAX_OK) * ps_factor + MAX_OK;
        if(x > 3){
            x = 3;
        }
        if(x < 0){
            x = 0;
        }
        model.addAttribute("x", x);



        int naq_diff = NAQ_MAX - NAQ_MIN;
        double naq_factor = (double) (naq - NAQ_MIN) / naq_diff;
        double z =  (MAX_OK - MIN_OK) * naq_factor + MIN_OK;
        if(z > 3){
            z = 3;
        }
        if(z < 0){
            z = 0;
        }
        model.addAttribute("z", z);
        /*
        *  Dla dysfonii - przekroczenie dolnej granicy wymaga dużo większej precyzji na wykresie.
        *  Dlatego tu jest ternary. Np. CPP = 11.68 to już dysfonia, ale jeśli chcemy traktować 11.66 jako 75%,
        *  to licząc w ten sposób dostaniemi ok 75.12%. Nie będzie to widoczne na wykresie.
        * */
        double y = -25 * (cpp - CPP_MAX) / 100.0;
        if(y > 3){
            y = 3;
        }
        if(y < -3){
            y = -3;
        }
        model.addAttribute("y", y);
    }

    private void addVerdicts(VoiceTestResult testResult, Model model, String gender){
        int breathinessFactor = 0, tenseFactor = 0;
        final int NAQ_MAX = gender.equals("woman") ? NAQ_MAX_F : NAQ_MAX_M;
        final int NAQ_MIN = gender.equals("woman") ? NAQ_MIN_F : NAQ_MIN_M;
        String psColor = "#c5edd2", naqColor = "#c5edd2";
        if(testResult.getPSLong() > PS_MAX){
            breathinessFactor++;
            psColor = "#bdd1ff";
        }
        if(testResult.getNAQLong() > NAQ_MAX){
            breathinessFactor++;
            naqColor = "#bdd1ff";
        }
        if(testResult.getPSLong() < PS_MIN){
            tenseFactor++;
            psColor = "#f3c1be";
        }
        if(testResult.getNAQLong() < NAQ_MIN){
            tenseFactor++;
            naqColor = "#f3c1be";
        }
        String verdict = "Coś poszło nie tak";
        String color = "#ffffff";
        if(breathinessFactor > 0 && tenseFactor > 0) {
            verdict = "verdict-grey";
        }
        else if(breathinessFactor > 0){
            verdict = "verdict-blue-light";
            color = "#bdd1ff";
            if(breathinessFactor > 1){
                verdict = "verdict-blue-strong";
                color = "#8db4ff";
            }
        }
        else if(tenseFactor > 0){
            verdict = "verdict-red-light";
            color = "#f3c1be";
            if(tenseFactor > 1){
                verdict = "verdict-red-strong";
                color = "#ed9590";
            }
        } else {
            verdict = "verdict-green";
            color = "#c5edd2";
        }
        String disphonia = testResult.getCPPLong() < CPP_MIN ? "disphonia-no" : "disphonia-yes";
        String disphoniaColor = testResult.getCPPLong() < CPP_MIN ? "#c5edd2" : "#f3c1be";

        model.addAttribute("verdict", verdict);
        model.addAttribute("vedictColor", color);
        model.addAttribute("disphonia", disphonia);
        model.addAttribute("disphoniaColor", disphoniaColor);
        model.addAttribute("psColor", psColor);
        model.addAttribute("naqColor", naqColor);
        model.addAttribute("cppColor", disphoniaColor);
    }

    private Credentials getCredentials(Authentication authentication) {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;

        OAuth2AuthorizedClient client =
                clientService.loadAuthorizedClient(
                        oauthToken.getAuthorizedClientRegistrationId(),
                        oauthToken.getName());

        String accessToken = client.getAccessToken().getTokenValue();

        return IdTokenCredentials.create(AccessToken.newBuilder().setTokenValue(accessToken).build());
    }
}
