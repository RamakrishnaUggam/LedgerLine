
package com.ledgerline.auth.service;

import com.ledgerline.auth.dto.AuthResponse;
import com.ledgerline.auth.dto.RegisterRequest;
import com.ledgerline.user.entity.Role;
import com.ledgerline.user.entity.User;
import com.ledgerline.user.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String normalizedEmail =
            request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException(
                "An account with this email already exists"
            );
        }

        String passwordHash =
            passwordEncoder.encode(request.password());

        // Public registration always creates an ACCOUNT_HOLDER.
        User user = new User(
            normalizedEmail,
            passwordHash,
            Role.ACCOUNT_HOLDER
        );

        User savedUser = userRepository.save(user);

        return new AuthResponse(
            savedUser.getId(),
            savedUser.getEmail(),
            savedUser.getRole().name()
        );
    }
}
