package org.pjwstk.vocalCheck.service;

import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.auth.Credentials;
import com.google.auth.http.HttpCredentialsAdapter;
import org.pjwstk.vocalCheck.model.VoiceTestResult;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Nullable;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Component
public class GoogleDriveService {
    /**
     * Application name.
     */
    private static final String APPLICATION_NAME = "VocalHealth";
    /**
     * Global instance of the JSON factory.
     */
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();


    public Drive getInstance(Credentials credentials) throws GeneralSecurityException, IOException {
        // Build a new authorized API client service.
        HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(
                credentials);

        return new Drive.Builder(new NetHttpTransport(),
                JSON_FACTORY,
                requestInitializer)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    public String getConfigFileString(Credentials credentials) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            Drive service = getInstance(credentials);
            String historyId = getConfigFile(service).getId();
            if (historyId != null) {
                service.files().get(historyId).executeMediaAndDownloadTo(outputStream);
                InputStream in = new ByteArrayInputStream(outputStream.toByteArray());
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            // Stack trace błędu do debugowania
//            e.printStackTrace();
        }
        return null;
    }

    private File getConfigFile(Drive service) throws IOException {
        FileList files = service.files().list()
                .setSpaces("appDataFolder")
                .setQ("name='history.csv'")
                .setFields("nextPageToken, files(id, name)")
                .setPageSize(1)
                .execute();
        if (!files.getFiles().isEmpty())
            return files.getFiles().get(0);
        else return null;
    }

    private File getGenderFile(Drive service) throws IOException {
        FileList files = service.files().list()
                .setSpaces("appDataFolder")
                .setQ("name='gender.csv'")
                .setFields("nextPageToken, files(id, name)")
                .setPageSize(1)
                .execute();
        if (!files.getFiles().isEmpty())
            return files.getFiles().get(0);
        else return null;
    }


    private String createHistoryFile(Credentials credentials, @Nullable VoiceTestResult firstResult) {
        try {
            StringBuilder builder = new StringBuilder("PS,NAQ,CPP,Date");
            if (firstResult != null) {
                builder.append('\n').append(firstResult);
            }

            File fileMetadata = new File();
            fileMetadata.setParents(Collections.singletonList("appDataFolder"));
            fileMetadata.setName("history.csv");
            MultipartFile multipartFile = new MockMultipartFile("file",
                    "history.csv", "text/plain", builder.toString().getBytes());
            File file = getInstance(credentials).files().create(fileMetadata,
                            new InputStreamContent(
                                    multipartFile.getContentType(),
                                    new ByteArrayInputStream(multipartFile.getBytes()))
                    )
                    .setFields("id")
                    .execute();
            return file.getId();
        } catch (Exception e) {
            System.out.printf("Error: " + e);
        }
        return null;
    }


    private String createGenderFile(Credentials credentials, String gender) {
        try {
            File fileMetadata = new File();
            fileMetadata.setParents(Collections.singletonList("appDataFolder"));
            fileMetadata.setName("gender.csv");
            MultipartFile multipartFile = new MockMultipartFile("file",
                    "gender.csv", "text/plain", gender.getBytes());
            File file = getInstance(credentials).files().create(fileMetadata,
                            new InputStreamContent(
                                    multipartFile.getContentType(),
                                    new ByteArrayInputStream(multipartFile.getBytes()))
                    )
                    .setFields("id")
                    .execute();
            return file.getId();
        } catch (Exception e) {
            System.out.printf("Error: " + e);
        }
        return null;
    }

    public void updateHistory(Credentials credentials, VoiceTestResult result) {
        try {
            Drive service = getInstance(credentials);
            File configFile = getConfigFile(service);
            if (configFile == null) {
                createHistoryFile(credentials, result);
                return;
            }
            String fileId = configFile.getId();
            String history = getConfigFileString(credentials);
            if (history != null) {
                File fileMetadata = new File();
                fileMetadata.setName("history.csv");
                ByteArrayContent contentStream = ByteArrayContent.fromString("text/plain", history + '\n' + result.toString());
                System.out.println(service.files().update(fileId, fileMetadata, contentStream).execute());
            }
        } catch (Exception e) {
            System.out.printf("Error: " + e);
        }
    }

    public void setGender(Credentials credentials, String gender) {
        try {
            Drive service = getInstance(credentials);
            File genderFile = getGenderFile(service);
            if (genderFile == null) {
                createGenderFile(credentials, gender);
                return;
            }
            String fileId = genderFile.getId();
            File fileMetadata = new File();
            fileMetadata.setName("gender.csv");
            ByteArrayContent contentStream = ByteArrayContent.fromString("text/plain", gender);
            System.out.println(service.files().update(fileId, fileMetadata, contentStream).execute());
        } catch (Exception e) {
            System.out.printf("Error: " + e);
        }
    }

    public String getGender(Credentials credentials) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            Drive service = getInstance(credentials);
            String genderId = getGenderFile(service).getId();
            if (genderId != null) {
                service.files().get(genderId).executeMediaAndDownloadTo(outputStream);
                InputStream in = new ByteArrayInputStream(outputStream.toByteArray());
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            // Stack trace błędu do debugowania
            //   e.printStackTrace();
        }
        return null;
    }


}