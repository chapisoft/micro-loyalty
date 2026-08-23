package com.lib.ims.word.service.impl;

import com.lib.ims.word.model.ContentControlInfo;
import com.lib.ims.word.utils.DocxSdtUtils;
import jakarta.xml.bind.JAXBElement;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import lombok.Generated;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.docx4j.wml.CTSdtRow;
import org.docx4j.wml.ContentAccessor;
import org.docx4j.wml.P;
import org.docx4j.wml.SdtBlock;
import org.docx4j.wml.SdtElement;
import org.docx4j.wml.SdtPr;
import org.docx4j.wml.Tbl;
import org.docx4j.wml.Tc;
import org.docx4j.wml.Tr;
import org.jvnet.jaxb2_commons.ppp.Child;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;


@Component
@SuppressWarnings({"unchecked", "rawtypes"})
public class ContentControlProcessor {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(ContentControlProcessor.class);

   public List<ContentControlInfo> processDocument(WordprocessingMLPackage wordMLPackage) {
      ArrayList contentControls = new ArrayList();

      try {
         MainDocumentPart mainPart = wordMLPackage.getMainDocumentPart();
         if (mainPart != null) {
            this.processDocumentPart(mainPart.getContent(), contentControls, (String)null, (String)null, -1, (String)null);
         }
      } catch (Exception var4) {
         log.error("Error processing document: ", var4);
      }

      return contentControls;
   }

   private void processDocumentPart(List<Object> content, List<ContentControlInfo> contentControls, String currentTableName, String parentBlockTag, int rowIndex, String path) {
      if (content != null) {
         Iterator var7 = content.iterator();

         while(var7.hasNext()) {
            Object obj = var7.next();
            this.processObject(obj, contentControls, currentTableName, parentBlockTag, rowIndex, path);
         }

      }
   }

   private void processObject(Object obj, List<ContentControlInfo> contentControls, String currentTableName, String parentBlockTag, int rowIndex, String path) {
      try {
         if (obj instanceof JAXBElement) {
            obj = ((JAXBElement)obj).getValue();
         }

         if (obj instanceof SdtElement) {
            this.processSdt((SdtElement)obj, contentControls, currentTableName, parentBlockTag, rowIndex, path);
         } else if (obj instanceof Tbl) {
            this.processTable((Tbl)obj, contentControls, currentTableName, parentBlockTag, path);
         } else if (obj instanceof Tr) {
            this.processTableRow((Tr)obj, contentControls, currentTableName, parentBlockTag, rowIndex, path);
         } else if (obj instanceof Tc) {
            this.processTableCell((Tc)obj, contentControls, currentTableName, parentBlockTag, rowIndex, path);
         } else if (obj instanceof P) {
            this.processParagraph((P)obj, contentControls, currentTableName, parentBlockTag, rowIndex, path);
         } else if (obj instanceof ContentAccessor) {
            List<Object> children = ((ContentAccessor)obj).getContent();
            this.processDocumentPart(children, contentControls, currentTableName, parentBlockTag, rowIndex, path);
         }
      } catch (Exception var8) {
         log.error("Error processing object: ", var8);
      }

   }

   public void processSdt(SdtElement sdt, List<ContentControlInfo> contentControls, String currentTableName, String parentBlockTag, int rowIndex, String path) {
      try {
         String tag = DocxSdtUtils.getTag(sdt);
         String alias = DocxSdtUtils.getAlias(sdt);
         String value = DocxSdtUtils.getSdtValue(sdt);
         String thisTag;
         if (DocxSdtUtils.isRepeatingSection(sdt)) {
            thisTag = tag != null ? tag : alias;
            if (currentTableName != null) {
               String newPath = path != null && !path.isEmpty() ? path + "/" + thisTag : thisTag;
               this.processRepeatingSection(sdt, contentControls, currentTableName, parentBlockTag, newPath);
            } else {
               this.processRepeatingSection(sdt, contentControls, thisTag, parentBlockTag, path);
            }
         } else if (sdt instanceof SdtBlock) {
            thisTag = tag != null ? tag : alias;
            boolean containsTable = sdt.getSdtContent().getContent().stream().anyMatch((child) -> {
               return child instanceof Tbl || child instanceof JAXBElement && ((JAXBElement)child).getValue() instanceof Tbl;
            });
            String nextTableName = containsTable ? (tag != null ? tag : alias) : currentTableName;
            this.processSdtBlock((SdtBlock)sdt, contentControls, nextTableName, thisTag, rowIndex, path);
         } else {
            ContentControlInfo info = ContentControlInfo.builder().tag(tag != null ? tag : alias).sdtElement(sdt).currentValue(value).tableName(currentTableName).parentBlockTag(parentBlockTag).rowIndex(rowIndex).isInTable(currentTableName != null).hasNestedTable(false).path(path).build();
            if (info.getTag() != null) {
               contentControls.add(info);
            }

            if (sdt.getSdtContent() != null && sdt.getSdtContent().getContent() != null) {
               this.processDocumentPart(sdt.getSdtContent().getContent(), contentControls, currentTableName, parentBlockTag, rowIndex, path);
            }
         }
      } catch (Exception var13) {
         log.error("Error processing SDT: ", var13);
      }

   }

   private void processSdtBlock(SdtBlock sdtBlock, List<ContentControlInfo> contentControls, String currentTableName, String blockTag, int rowIndex, String path) {
      try {
         if (sdtBlock.getSdtContent() != null && sdtBlock.getSdtContent().getContent() != null) {
            this.processDocumentPart(sdtBlock.getSdtContent().getContent(), contentControls, currentTableName, blockTag, rowIndex, path);
         }
      } catch (Exception var8) {
         log.error("Error processing SDT Block: ", var8);
      }

   }

   private void processRepeatingSection(SdtElement sdt, List<ContentControlInfo> contentControls, String tableName, String parentBlockTag, String parentPath) {
      try {
         int rowIndex = 0;
         List<Object> items = sdt.getSdtContent() != null ? sdt.getSdtContent().getContent() : Collections.emptyList();
         Iterator var8 = items.iterator();

         while(true) {
            while(var8.hasNext()) {
               Object item = var8.next();
               Object value = DocxSdtUtils.unwrap(item);
               if (value instanceof SdtElement) {
                  SdtElement nestedSdt = (SdtElement)value;
                  if (DocxSdtUtils.isRepeatingSection(nestedSdt)) {
                     this.processRepeatingSection(nestedSdt, contentControls, tableName, parentBlockTag, parentPath);
                     continue;
                  }
               }

               List<Object> rowContent = this.getSdtContentList(value);
               if (rowContent != null) {
                  ++rowIndex;
                  String currentPath = parentPath != null && !parentPath.isEmpty() ? parentPath + "/" + rowIndex : String.valueOf(rowIndex);
                  this.processDocumentPart(rowContent, contentControls, tableName, parentBlockTag, rowIndex, currentPath);
               } else if (!(value instanceof Tr)) {
                  this.processObject(value, contentControls, tableName, parentBlockTag, rowIndex, parentPath);
               } else {
                  Tr tr = (Tr)value;
                  ++rowIndex;
                  String currentPath = parentPath != null && !parentPath.isEmpty() ? parentPath + "/" + rowIndex : String.valueOf(rowIndex);
                  this.processTableRow(tr, contentControls, tableName, parentBlockTag, rowIndex, currentPath);
               }
            }

            return;
         }
      } catch (Exception var14) {
         log.error("Error processing repeating section: ", var14);
      }
   }

   private String extractTagFromSdtPr(SdtPr sdtPr) {
      return sdtPr != null && sdtPr.getTag() != null ? sdtPr.getTag().getVal() : null;
   }

   private Object getParentObject(Object child) {
      if (child == null) {
         return null;
      } else {
         try {
            if (child instanceof Child) {
               return ((Child)child).getParent();
            } else {
               if (child instanceof JAXBElement) {
                  JAXBElement<?> jaxbElement = (JAXBElement)child;
                  Object value = jaxbElement.getValue();
                  if (value != null && value != child) {
                     if (value instanceof Child) {
                        return ((Child)value).getParent();
                     }

                     return value;
                  }
               }

               if (child instanceof List) {
                  return null;
               } else {
                  log.debug("Cannot determine parent for object of type: {}", child.getClass().getName());
                  return null;
               }
            }
         } catch (Exception var4) {
            log.warn("Error getting parent object for type {}: {}", child.getClass().getSimpleName(), var4.getMessage());
            return null;
         }
      }
   }

   private String extractTagFromAnySdt(Object obj) {
      if (obj == null) {
         return null;
      } else {
         Object value = DocxSdtUtils.unwrap(obj);

         try {
            if (value instanceof SdtElement) {
               SdtElement sdt = (SdtElement)value;
               return this.extractTagFromSdtPr(sdt.getSdtPr());
            }

            try {
               Method method = value.getClass().getMethod("getSdtPr");
               Object sdtPrObj = method.invoke(value);
               if (sdtPrObj instanceof SdtPr) {
                  SdtPr sdtPr = (SdtPr)sdtPrObj;
                  return this.extractTagFromSdtPr(sdtPr);
               }
            } catch (NoSuchMethodException var6) {
            }
         } catch (Exception var7) {
            log.debug("extractTagFromAnySdt failed for {}: {}", value.getClass().getName(), var7.getMessage());
         }

         return null;
      }
   }

   private List<Object> getSdtContentList(Object obj) {
      if (obj == null) {
         return null;
      } else {
         Object value = DocxSdtUtils.unwrap(obj);

         try {
            if (value instanceof SdtElement) {
               SdtElement sdt = (SdtElement)value;
               if (sdt.getSdtContent() != null) {
                  return sdt.getSdtContent().getContent();
               }
            }

            try {
               Method method = value.getClass().getMethod("getSdtContent");
               Object contentObj = method.invoke(value);
               if (contentObj instanceof ContentAccessor) {
                  ContentAccessor accessor = (ContentAccessor)contentObj;
                  return accessor.getContent();
               }
            } catch (NoSuchMethodException var6) {
            }
         } catch (Exception var7) {
            log.debug("getSdtContentList failed for {}: {}", value.getClass().getName(), var7.getMessage());
         }

         return null;
      }
   }

   private void processTable(Tbl table, List<ContentControlInfo> contentControls, String currentTableName, String parentBlockTag, String path) {
      try {
         String tagFromSdt = null;
         Object parent = this.getParentObject(table);

         for(int i = 0; i < 3 && tagFromSdt == null && parent != null; ++i) {
            tagFromSdt = this.extractTagFromAnySdt(parent);
            if (tagFromSdt == null) {
               parent = this.getParentObject(parent);
            }
         }

         String tableName = (String)Objects.requireNonNullElseGet(tagFromSdt, () -> {
            return (String)Objects.requireNonNullElseGet(currentTableName, () -> {
               return "table_" + System.identityHashCode(table);
            });
         });
         int rowIdx = 0;

         for(Iterator var10 = table.getContent().iterator(); var10.hasNext(); ++rowIdx) {
            Object obj = var10.next();
            Object value = DocxSdtUtils.unwrap(obj);
            this.handleRowObject(value, contentControls, tableName, parentBlockTag, rowIdx, path);
         }
      } catch (Exception var13) {
         log.error("Error processing table: ", var13);
      }

   }

   private void handleRowObject(Object value, List<ContentControlInfo> contentControls, String currentTableName, String parentBlockTag, int rowIdx, String path) {
      if (value instanceof Tr) {
         Tr row = (Tr)value;
         this.processTableRow(row, contentControls, currentTableName, parentBlockTag, rowIdx, path);
      } else if (value instanceof CTSdtRow) {
         CTSdtRow row = (CTSdtRow)value;
         String tag = this.extractTagFromAnySdt(row);
         this.processRepeatingSection(row, contentControls, tag, parentBlockTag, path);
      } else {
         List<Object> sdtLikeContent = this.getSdtContentList(value);
         if (sdtLikeContent != null) {
            Iterator var8 = sdtLikeContent.iterator();

            while(var8.hasNext()) {
               Object inner = var8.next();
               Object innerVal = DocxSdtUtils.unwrap(inner);
               this.handleRowObject(innerVal, contentControls, currentTableName, parentBlockTag, rowIdx, path);
            }
         }

      }
   }

   private void processTableRow(Tr row, List<ContentControlInfo> contentControls, String currentTableName, String parentBlockTag, int rowIndex, String path) {
      try {
         Iterator var7 = row.getContent().iterator();

         while(var7.hasNext()) {
            Object obj = var7.next();
            if (obj instanceof JAXBElement) {
               obj = ((JAXBElement)obj).getValue();
            }

            if (obj instanceof Tc) {
               this.processTableCell((Tc)obj, contentControls, currentTableName, parentBlockTag, rowIndex, path);
            }
         }
      } catch (Exception var9) {
         log.error("Error processing table row: ", var9);
      }

   }

   private void processTableCell(Tc cell, List<ContentControlInfo> contentControls, String currentTableName, String parentBlockTag, int rowIndex, String path) {
      try {
         this.processDocumentPart(cell.getContent(), contentControls, currentTableName, parentBlockTag, rowIndex, path);
      } catch (Exception var8) {
         log.error("Error processing table cell: ", var8);
      }

   }

   private void processParagraph(P paragraph, List<ContentControlInfo> contentControls, String currentTableName, String parentBlockTag, int rowIndex, String path) {
      try {
         Iterator var7 = paragraph.getContent().iterator();

         while(var7.hasNext()) {
            Object obj = var7.next();
            Object var10000;
            if (obj instanceof JAXBElement) {
               JAXBElement<?> jaxb = (JAXBElement)obj;
               var10000 = jaxb.getValue();
            } else {
               var10000 = obj;
            }

            Object value = var10000;
            if (value instanceof SdtElement) {
               SdtElement sdt = (SdtElement)value;
               this.processSdt(sdt, contentControls, currentTableName, parentBlockTag, rowIndex, path);
            } else if (value instanceof P) {
               P p = (P)value;
               this.processParagraph(p, contentControls, currentTableName, parentBlockTag, rowIndex, path);
            } else {
               this.processDocumentPart(Collections.singletonList(value), contentControls, currentTableName, parentBlockTag, rowIndex, path);
            }
         }
      } catch (Exception var12) {
         log.error("Error processing paragraph: ", var12);
      }

   }
}
