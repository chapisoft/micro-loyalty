package com.natcash.loyalty.domain.enums;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

/**
 * Validated upload folder categories for server-side media storage.
 */
@Getter
public enum MediaFolder {

    VOUCHERS("vouchers"),
    MISSIONS("missions"),
    BANNERS("banners"),
    GAMES("games"),
    PARTNERS("partners"),
    GENERAL("general");

    private final String code;

    MediaFolder(String code) {
        this.code = code;
    }

    /**
     * Resolves a folder parameter against the allowlist, defaulting to {@link #GENERAL} when blank.
     *
     * @param raw caller-supplied folder name
     * @return matching {@link MediaFolder}
     * @throws LoyaltyException if a non-blank value is outside the allowed folders
     */
    public static MediaFolder fromCodeOrDefault(String raw) {
        if (raw == null || raw.isBlank()) {
            return GENERAL;
        }
        String normalized = raw.trim().toLowerCase();
        for (MediaFolder folder : values()) {
            if (folder.code.equals(normalized)) {
                return folder;
            }
        }
        throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("media.folder.invalid", raw));
    }
}
