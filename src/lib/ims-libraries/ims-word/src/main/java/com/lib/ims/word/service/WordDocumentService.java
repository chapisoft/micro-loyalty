package com.lib.ims.word.service;

import java.io.InputStream;
import java.util.Map;

public interface WordDocumentService {
   Map<String, Object> getContentControlValues(InputStream var1);

   byte[] fillTemplate(InputStream var1, String var2);

   byte[] fillTemplate(InputStream var1, Map<String, Object> var2);
}
