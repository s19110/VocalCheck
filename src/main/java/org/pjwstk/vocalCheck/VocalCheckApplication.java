package org.pjwstk.vocalCheck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;

@SpringBootApplication
@EnableWebSecurity
public class VocalCheckApplication implements WebMvcConfigurer {
    private final LocaleChangeInterceptor localeChangeInterceptor;
    public VocalCheckApplication(LocaleChangeInterceptor localeChangeInterceptor){
        this.localeChangeInterceptor = localeChangeInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry interceptorRegistry){
        interceptorRegistry.addInterceptor(localeChangeInterceptor);
    }
    public static void main(String[] args) {
        SpringApplication.run(VocalCheckApplication.class, args);
    }

}
