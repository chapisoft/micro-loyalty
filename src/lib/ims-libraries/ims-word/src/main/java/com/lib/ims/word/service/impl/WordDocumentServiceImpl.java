package com.lib.ims.word.service.impl;

import com.lib.ims.word.model.ContentControlInfo;
import com.lib.ims.word.model.WordTemplateException;
import com.lib.ims.word.service.WordDocumentService;
import com.lib.ims.word.utils.DocxSdtUtils;
import jakarta.xml.bind.JAXBElement;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import lombok.Generated;
import org.docx4j.XmlUtils;
import org.docx4j.jaxb.Context;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.wml.ContentAccessor;
import org.docx4j.wml.ObjectFactory;
import org.docx4j.wml.P;
import org.docx4j.wml.R;
import org.docx4j.wml.RPr;
import org.docx4j.wml.SdtContent;
import org.docx4j.wml.SdtElement;
import org.docx4j.wml.Text;
import org.docx4j.wml.Tr;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;


@Service
@SuppressWarnings({"unchecked", "rawtypes"})
public class WordDocumentServiceImpl implements WordDocumentService {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(WordDocumentServiceImpl.class);
   private final ContentControlProcessor contentControlProcessor;
   private final ObjectMapper objectMapper;

   public Map<String, Object> getContentControlValues(InputStream inputStream) {
      if (inputStream == null) {
         throw new WordTemplateException("Input stream cannot be null");
      } else {
         try {
            WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(inputStream);
            Map<String, Object> result = this.processContentControls(wordMLPackage);
            return (Map)this.convertMapToLists(result);
         } catch (Exception var4) {
            log.error("Error loading Word document from input stream", var4);
            throw new WordTemplateException("Failed to load Word document");
         }
      }
   }

   public byte[] fillTemplate(InputStream templateInput, String jsonData) {
      if (jsonData != null && !jsonData.isBlank()) {
         try {
            Map<String, Object> data =
                    objectMapper.readValue(
                            jsonData,
                            new TypeReference<Map<String, Object>>() {}
                    );

            return fillTemplate(templateInput, data);
         } catch (Exception e) {
            log.error("Error parsing JSON data", e);
            throw new WordTemplateException("Failed to parse JSON data");
         }
      }

      return fillTemplate(templateInput, Collections.emptyMap());
   }


   public byte[] fillTemplate(InputStream templateInput, Map<String, Object> data) {
      if (templateInput == null) {
         throw new WordTemplateException("Template input stream cannot be null");
      } else {
         if (data == null) {
            data = Collections.emptyMap();
         }

         try {
            WordprocessingMLPackage pkg = WordprocessingMLPackage.load(templateInput);
            Map<String, String> flatData = DocxSdtUtils.flattenData(data);
            this.fillScalarsInDocument(pkg.getMainDocumentPart().getContent(), flatData);
            this.fillTablesInDocument(pkg.getMainDocumentPart().getContent(), data);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            byte[] var6;
            try {
               pkg.save(baos);
               var6 = baos.toByteArray();
            } catch (Throwable var9) {
               try {
                  baos.close();
               } catch (Throwable var8) {
                  var9.addSuppressed(var8);
               }

               throw var9;
            }

            baos.close();
            return var6;
         } catch (Exception var10) {
            log.error("Error filling template", var10);
            throw new WordTemplateException("Failed to fill template");
         }
      }
   }

   private void fillTablesInDocument(List<Object> content, Map<String, Object> contextData) {
      if (content != null && contextData != null && !contextData.isEmpty()) {
         Iterator var3 = content.iterator();

         while(true) {
            while(true) {
               while(var3.hasNext()) {
                  Object o = var3.next();
                  Object v = DocxSdtUtils.unwrap(o);
                  if (v instanceof SdtElement) {
                     SdtElement sdt = (SdtElement)v;
                     if (DocxSdtUtils.isRepeatingSection(sdt)) {
                        String tagName = (String)Optional.ofNullable(DocxSdtUtils.getTag(sdt)).orElse(DocxSdtUtils.getAlias(sdt));
                        log.info("tag name: {}", tagName);
                        if (tagName != null && contextData.containsKey(tagName)) {
                           Object val = contextData.get(tagName);
                           if (val instanceof List) {
                              this.fillRepeatingSectionRows(sdt, (List)val);
                              continue;
                           }
                        }
                     }

                     if (sdt.getSdtContent() != null) {
                        this.fillTablesInDocument(sdt.getSdtContent().getContent(), contextData);
                     }
                  } else if (v instanceof ContentAccessor) {
                     ContentAccessor ca = (ContentAccessor)v;
                     this.fillTablesInDocument(ca.getContent(), contextData);
                  }
               }

               return;
            }
         }
      }
   }

   private void fillRepeatingSectionRows(SdtElement repeatingSection, List<Map<String, Object>> rowDataList) {
      if (repeatingSection.getSdtContent() != null) {
         List<Object> content = repeatingSection.getSdtContent().getContent();
         if (!content.isEmpty()) {
            Object prototype = null;
            Iterator var5 = content.iterator();

            Object copy;
            while(var5.hasNext()) {
               Object item = var5.next();
               copy = DocxSdtUtils.unwrap(item);
               if (copy instanceof SdtElement || copy instanceof Tr) {
                  prototype = item;
                  break;
               }
            }

            if (prototype == null) {
               prototype = content.get(0);
            }

            content.clear();
            var5 = rowDataList.iterator();

            while(var5.hasNext()) {
               Map<String, Object> rowData = (Map)var5.next();
               copy = XmlUtils.deepCopy(prototype);
               List<Object> copyAsList = Collections.singletonList(copy);
               Map<String, String> flatRowData = DocxSdtUtils.flattenData(rowData);
               this.fillScalarsInDocument(copyAsList, flatRowData);
               this.fillTablesInDocument(copyAsList, rowData);
               content.add(copy);
            }

         }
      }
   }

   private void fillScalarsInDocument(List<Object> content, Map<String, String> values) {
      if (content != null && !values.isEmpty()) {
         Iterator var3 = content.iterator();

         while(var3.hasNext()) {
            Object o = var3.next();
            Object v = DocxSdtUtils.unwrap(o);
            if (v instanceof SdtElement) {
               SdtElement sdt = (SdtElement)v;
               String tag = DocxSdtUtils.getTag(sdt);
               if (tag != null) {
                  String val = (String)values.get(tag);
                  if (val == null) {
                     val = (String)values.getOrDefault(tag.trim(), null);
                  }

                  if (val != null) {
                     this.setSdtTextValue(sdt, val);
                  }
               }

               if (sdt.getSdtContent() != null) {
                  this.fillScalarsInDocument(sdt.getSdtContent().getContent(), values);
               }
            } else if (v instanceof ContentAccessor) {
               ContentAccessor ca = (ContentAccessor)v;
               this.fillScalarsInDocument(ca.getContent(), values);
            }
         }

      }
   }

   private void setSdtTextValue(SdtElement sdt, String value) {
      try {
         SdtContent content = sdt.getSdtContent();
         if (content == null) {
            return;
         }

         List<Text> texts = new ArrayList();
         this.collectTextNodes(content.getContent(), texts);
         RPr runStyle = null;
         if (!texts.isEmpty()) {
            Object parent = XmlUtils.unwrap(((Text)texts.get(0)).getParent());
            if (parent instanceof R) {
               R r = (R)parent;
               if (r.getRPr() != null) {
                  runStyle = (RPr)XmlUtils.deepCopy(r.getRPr());
               }
            }
         }

         content.getContent().clear();
         if (value == null) {
            value = "";
         }

         String[] lines = value.split("\n", -1);
         ObjectFactory factory = Context.getWmlObjectFactory();
         R newRun = factory.createR();
         if (runStyle != null) {
            newRun.setRPr(runStyle);
         }

         for(int i = 0; i < lines.length; ++i) {
            if (i > 0) {
               newRun.getContent().add(factory.createBr());
            }

            Text t = factory.createText();
            t.setValue(lines[i]);
            if (lines[i].startsWith(" ") || lines[i].endsWith(" ")) {
               t.setSpace("preserve");
            }

            newRun.getContent().add(t);
         }

         if (sdt.getParent() instanceof P) {
            content.getContent().add(newRun);
         } else {
            P p = factory.createP();
            p.getContent().add(newRun);
            content.getContent().add(p);
         }
      } catch (Exception var11) {
         log.error("Failed to set SDT value: {}", var11.getMessage(), var11);
      }

   }

   private void collectTextNodes(List<Object> content, List<Text> texts) {
      Iterator var3 = content.iterator();

      while(var3.hasNext()) {
         Object o = var3.next();
         Object unwrapped = o instanceof JAXBElement ? ((JAXBElement)o).getValue() : o;
         if (unwrapped instanceof Text) {
            Text t = (Text)unwrapped;
            texts.add(t);
         } else if (unwrapped instanceof ContentAccessor) {
            ContentAccessor ca = (ContentAccessor)unwrapped;
            this.collectTextNodes(ca.getContent(), texts);
         }
      }

   }

   private Map<String, Object> processContentControls(WordprocessingMLPackage wordMLPackage) {
      try {
         List<ContentControlInfo> contentControls = this.contentControlProcessor.processDocument(wordMLPackage);
         Map<String, List<ContentControlInfo>> groupedControls = (Map)contentControls.parallelStream().collect(Collectors.groupingByConcurrent(this::determineGroupKey));
         Map<String, Object> result = new ConcurrentHashMap();
         groupedControls.entrySet().parallelStream().forEach((entry) -> {
            String key = (String)entry.getKey();
            List<ContentControlInfo> controls = (List)entry.getValue();
            String var5 = key.split(":")[0];
            byte var6 = -1;
            switch(var5.hashCode()) {
            case 3506402:
               if (var5.equals("root")) {
                  var6 = 0;
               }
               break;
            case 93832333:
               if (var5.equals("block")) {
                  var6 = 1;
               }
               break;
            case 110115790:
               if (var5.equals("table")) {
                  var6 = 2;
               }
            }

            String tableName;
            switch(var6) {
            case 0:
               this.processRootControls(controls, result);
               break;
            case 1:
               tableName = key.substring(6);
               result.put(tableName, this.processBlockControls(controls));
               break;
            case 2:
               tableName = key.substring(6);
               result.put(tableName, this.processTableControls(controls));
            }

         });
         return result;
      } catch (Exception var5) {
         log.error("Error processing content controls", var5);
         throw new WordTemplateException("Failed to process content controls");
      }
   }

   private String determineGroupKey(ContentControlInfo control) {
      if (control.getTableName() != null) {
         return "table:" + control.getTableName();
      } else {
         return control.getParentBlockTag() != null ? "block:" + control.getParentBlockTag() : "root";
      }
   }

   private void processRootControls(List<ContentControlInfo> controls, Map<String, Object> result) {
      Iterator var3 = controls.iterator();

      while(true) {
         while(true) {
            ContentControlInfo control;
            do {
               if (!var3.hasNext()) {
                  return;
               }

               control = (ContentControlInfo)var3.next();
            } while(control.getTag() == null);

            String[] parts = control.getTag().split("\\.");
            if (parts.length > 1) {
               Map<String, Object> current = result;

               for(int i = 0; i < parts.length - 1; ++i) {
                  current = (Map)current.computeIfAbsent(parts[i], (k) -> {
                     return new HashMap();
                  });
               }

               current.put(parts[parts.length - 1], control.getCurrentValue());
            } else {
               result.put(control.getTag(), control.getCurrentValue());
            }
         }
      }
   }

   private Map<String, Object> processBlockControls(List<ContentControlInfo> controls) {
      Map<String, Object> blockData = new HashMap();
      Iterator var3 = controls.iterator();

      while(var3.hasNext()) {
         ContentControlInfo control = (ContentControlInfo)var3.next();
         if (control.getTag() != null) {
            blockData.put(control.getTag(), control.getCurrentValue());
         }
      }

      return blockData;
   }

   private Map<String, Object> processTableControls(List<ContentControlInfo> controls) {
      Map<String, Object> tableData = new LinkedHashMap();
      Iterator var3 = controls.iterator();

      while(true) {
         ContentControlInfo control;
         String path;
         do {
            do {
               if (!var3.hasNext()) {
                  return tableData;
               }

               control = (ContentControlInfo)var3.next();
            } while(control.getTag() == null);

            path = control.getPath();
            if (path == null && control.getRowIndex() != null) {
               path = String.valueOf(control.getRowIndex());
            }
         } while(path == null);

         String[] parts = path.split("/");
         Map<String, Object> current = tableData;
         String[] var8 = parts;
         int var9 = parts.length;

         for(int var10 = 0; var10 < var9; ++var10) {
            String part = var8[var10];
            Object node = ((Map)current).computeIfAbsent(part, (k) -> {
               return new LinkedHashMap();
            });
            if (node instanceof Map) {
               current = (Map)node;
            } else {
               log.warn("Collision detected in table data structure at path part: {}", part);
               Map<String, Object> newNode = new LinkedHashMap();
               ((Map)current).put(part, newNode);
               current = newNode;
            }
         }

         ((Map)current).put(control.getTag(), control.getCurrentValue());
      }
   }

   private Object convertMapToLists(Object obj) {
      if (obj instanceof Map) {
         Map<String, Object> map = (Map)obj;
         if (map.isEmpty()) {
            return map;
         } else {
            boolean allKeysAreInts = true;
            List<Integer> intKeys = new ArrayList();
            Iterator var13 = map.keySet().iterator();

            while(var13.hasNext()) {
               String key = (String)var13.next();

               try {
                  intKeys.add(Integer.parseInt(key));
               } catch (NumberFormatException var9) {
                  allKeysAreInts = false;
                  break;
               }
            }

            Iterator var16;
            if (allKeysAreInts) {
               Collections.sort(intKeys);
               List<Object> list = new ArrayList();
               var16 = intKeys.iterator();

               while(var16.hasNext()) {
                  Integer key = (Integer)var16.next();
                  Object value = map.get(String.valueOf(key));
                  list.add(this.convertMapToLists(value));
               }

               return list;
            } else {
               Map<String, Object> newMap = new LinkedHashMap();
               var16 = map.entrySet().iterator();

               while(var16.hasNext()) {
                  Entry<String, Object> entry = (Entry)var16.next();
                  newMap.put((String)entry.getKey(), this.convertMapToLists(entry.getValue()));
               }

               return newMap;
            }
         }
      } else if (!(obj instanceof List)) {
         return obj;
      } else {
         List<Object> list = (List)obj;
         List<Object> newList = new ArrayList();
         Iterator var4 = list.iterator();

         while(var4.hasNext()) {
            Object item = var4.next();
            newList.add(this.convertMapToLists(item));
         }

         return newList;
      }
   }

   @Generated
   public WordDocumentServiceImpl(ContentControlProcessor contentControlProcessor, ObjectMapper objectMapper) {
      this.contentControlProcessor = contentControlProcessor;
      this.objectMapper = objectMapper;
   }
}
