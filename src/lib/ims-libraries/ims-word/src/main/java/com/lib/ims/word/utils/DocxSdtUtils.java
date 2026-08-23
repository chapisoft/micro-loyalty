package com.lib.ims.word.utils;

import jakarta.xml.bind.JAXBElement;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import lombok.Generated;
import org.docx4j.w15.CTSdtRepeatedSection;
import org.docx4j.wml.ContentAccessor;
import org.docx4j.wml.SdtElement;
import org.docx4j.wml.SdtPr;
import org.docx4j.wml.Text;
import org.docx4j.wml.SdtPr.Alias;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@SuppressWarnings({"unchecked", "rawtypes", "null"})
public final class DocxSdtUtils {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(DocxSdtUtils.class);

   private DocxSdtUtils() {
   }

   public static Object unwrap(Object obj) {
      return obj instanceof JAXBElement ? ((JAXBElement)obj).getValue() : obj;
   }

   public static boolean isRepeatingSection(SdtElement sdt) {
      try {
         SdtPr pr = sdt.getSdtPr();
         if (pr != null) {
            Iterator var2 = pr.getRPrOrAliasOrLock().iterator();

            while(var2.hasNext()) {
               Object obj = var2.next();
               if (obj instanceof JAXBElement) {
                  JAXBElement<?> j2 = (JAXBElement)obj;
                  if (j2.getDeclaredType().equals(CTSdtRepeatedSection.class)) {
                     return true;
                  }
               }
            }

            String tag = getTag(sdt);
            return tag != null && tag.toLowerCase().contains("repeat");
         }
      } catch (Exception var5) {
      }

      return false;
   }

   public static String getTag(SdtElement sdt) {
      try {
         if (sdt.getSdtPr() != null && sdt.getSdtPr().getTag() != null) {
            return sdt.getSdtPr().getTag().getVal();
         }
      } catch (Exception var2) {
      }

      return null;
   }

   public static String getAlias(SdtElement sdt) {
      try {
         SdtPr pr = sdt.getSdtPr();
         if (pr != null) {
            Iterator var2 = pr.getRPrOrAliasOrLock().iterator();

            while(var2.hasNext()) {
               Object o = var2.next();
               if (o instanceof Alias) {
                  Alias a = (Alias)o;
                  if (a.getVal() != null && !a.getVal().isBlank()) {
                     return a.getVal().trim();
                  }
               }
            }
         }
      } catch (Exception var5) {
      }

      return null;
   }

   public static String getSdtValue(SdtElement sdt) {
      try {
         if (sdt.getSdtContent() != null) {
            return getContentControlValue(sdt);
         }
      } catch (Exception var2) {
         log.error("Error getting SDT value: ", var2);
      }

      return "";
   }

   private static String getContentControlValue(SdtElement sdt) {
      StringBuilder value = new StringBuilder();
      ContentAccessor sdtContent = sdt.getSdtContent();
      if (sdtContent != null) {
         Iterator var3 = sdtContent.getContent().iterator();

         while(var3.hasNext()) {
            Object item = var3.next();
            extractTextFromElement(item, value);
         }
      }

      return value.toString().trim();
   }

   private static void extractTextFromElement(Object element, StringBuilder text) {
      if (element instanceof JAXBElement) {
         element = ((JAXBElement)element).getValue();
      }

      if (element instanceof Text) {
         text.append(((Text)element).getValue());
      } else if (element instanceof ContentAccessor) {
         List<?> children = ((ContentAccessor)element).getContent();
         Iterator var3 = children.iterator();

         while(var3.hasNext()) {
            Object child = var3.next();
            extractTextFromElement(child, text);
         }
      }

   }

   public static Map<String, String> flattenData(Map<String, Object> data) {
      Map<String, String> flat = new ConcurrentHashMap();
      data.entrySet().parallelStream().forEach((entry) -> {
         Object value = entry.getValue();
         if (value instanceof Map) {
            Map<?, ?> nested = (Map)value;
            flattenObject((String)entry.getKey(), nested, flat);
         } else if (value != null && !(value instanceof List)) {
            flat.put((String)entry.getKey(), String.valueOf(value));
         }

      });
      return flat;
   }

   public static Map<String, List<Map<String, Object>>> extractTablesData(Map<String, Object> data) {
      return (Map)data.entrySet().stream().filter((entry) -> {
         return entry.getValue() instanceof List;
      }).filter((entry) -> {
         List<?> list = (List)entry.getValue();
         return !list.isEmpty() && list.get(0) instanceof Map;
      }).collect(Collectors.toConcurrentMap(Entry::getKey, (entry) -> {
         return (List)entry.getValue();
      }));
   }

   public static Map<String, DocxSdtUtils.TableNode> extractNestedTables(Map<String, Object> data) {
      Map<String, DocxSdtUtils.TableNode> tables = new ConcurrentHashMap();
      scanObject(data, "", (DocxSdtUtils.TableNode)null, tables);
      return tables;
   }

   private static void scanObject(Object obj, String currentPath, DocxSdtUtils.TableNode parentNode, Map<String, DocxSdtUtils.TableNode> tables) {
      if (obj instanceof Map) {
         Map<String, Object> map = (Map)obj;
         map.forEach((key, value) -> {
            String newPath = currentPath.isEmpty() ? key : currentPath + "." + key;
            scanObject(value, newPath, parentNode, tables);
         });
      } else if (obj instanceof List) {
         List<?> list = (List)obj;
         if (!list.isEmpty() && list.get(0) instanceof Map) {
            List<Map<String, Object>> rows = (List<Map<String, Object>>) list;
            DocxSdtUtils.TableNode node = new DocxSdtUtils.TableNode(currentPath,(List<Map<String, Object>>) list);
            tables.put(currentPath, node);
            if (parentNode != null) {
               parentNode.getChildren().add(node);
            }

            for(int i = 0; i < rows.size(); ++i) {
               String rowPath = currentPath + "[" + i + "]";
               scanObject(rows.get(i), rowPath, node, tables);
            }
         }
      }

   }

   private static void flattenObject(String prefix, Map<?, ?> obj, Map<String, String> out) {
      obj.entrySet().parallelStream().forEach((entry) -> {
         if (entry.getKey() != null) {
            String key = prefix + "." + String.valueOf(entry.getKey());
            Object val = entry.getValue();
            if (val instanceof Map) {
               Map<?, ?> nested = (Map)val;
               flattenObject(key, nested, out);
            } else if (val != null) {
               out.put(key, String.valueOf(val));
            }
         }

      });
   }

   public static class TableNode {
      private String path;
      private List<Map<String, Object>> rows;
      private final List<DocxSdtUtils.TableNode> children = new ArrayList();

      @Generated
      public String getPath() {
         return this.path;
      }

      @Generated
      public List<Map<String, Object>> getRows() {
         return this.rows;
      }

      @Generated
      public List<DocxSdtUtils.TableNode> getChildren() {
         return this.children;
      }

      @Generated
      public void setPath(String path) {
         this.path = path;
      }

      @Generated
      public void setRows(List<Map<String, Object>> rows) {
         this.rows = rows;
      }

      @Generated
      public boolean equals(Object o) {
         if (o == this) {
            return true;
         } else if (!(o instanceof DocxSdtUtils.TableNode)) {
            return false;
         } else {
            DocxSdtUtils.TableNode other = (DocxSdtUtils.TableNode)o;
            if (!other.canEqual(this)) {
               return false;
            } else {
               label47: {
                  Object this$path = this.getPath();
                  Object other$path = other.getPath();
                  if (this$path == null) {
                     if (other$path == null) {
                        break label47;
                     }
                  } else if (this$path.equals(other$path)) {
                     break label47;
                  }

                  return false;
               }

               Object this$rows = this.getRows();
               Object other$rows = other.getRows();
               if (this$rows == null) {
                  if (other$rows != null) {
                     return false;
                  }
               } else if (!this$rows.equals(other$rows)) {
                  return false;
               }

               Object this$children = this.getChildren();
               Object other$children = other.getChildren();
               if (this$children == null) {
                  if (other$children != null) {
                     return false;
                  }
               } else if (!this$children.equals(other$children)) {
                  return false;
               }

               return true;
            }
         }
      }

      @Generated
      protected boolean canEqual(Object other) {
         return other instanceof DocxSdtUtils.TableNode;
      }

      @Generated
      public int hashCode() {
         int result = 1;
         Object $path = this.getPath();
         result = result * 59 + ($path == null ? 43 : $path.hashCode());
         Object $rows = this.getRows();
         result = result * 59 + ($rows == null ? 43 : $rows.hashCode());
         Object $children = this.getChildren();
         result = result * 59 + ($children == null ? 43 : $children.hashCode());
         return result;
      }

      @Generated
      public String toString() {
         String var10000 = this.getPath();
         return "DocxSdtUtils.TableNode(path=" + var10000 + ", rows=" + String.valueOf(this.getRows()) + ", children=" + String.valueOf(this.getChildren()) + ")";
      }

      @Generated
      public TableNode(String path, List<Map<String, Object>> rows) {
         this.path = path;
         this.rows = rows;
      }
   }
}
