package com.natcash.loyalty.codegeneration.port;

import com.natcash.loyalty.codegeneration.domain.CodeType;

import java.util.Map;

/**
 * Giao diện UseCase sinh mã nghiệp vụ có cấu trúc tập trung.
 */
public interface GenerateCodeUseCase {

    String generateCode(CodeType type);

    String generateCode(CodeType type, Map<String, String> params);
}
