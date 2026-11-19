package com.natcash.loyalty.cms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Response returned after storing an uploaded image file on the server.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaUploadResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String url;
    private String filename;
    private String folder;
    private String contentType;
    private long size;
}
