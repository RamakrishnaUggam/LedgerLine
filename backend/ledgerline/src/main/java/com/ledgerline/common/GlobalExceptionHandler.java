
package com.ledgerline.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException exception) {

        Map<String, Object> body = Map.of(
            "timestamp", Instant.now().toString(),
            "status", 409,
            "error", "Conflict",
            "message", exception.getMessage()
        );

        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(body);
    }
}
