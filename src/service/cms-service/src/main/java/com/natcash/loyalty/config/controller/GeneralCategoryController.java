package com.natcash.loyalty.config.controller;

import com.natcash.loyalty.config.service.GeneralCategoryService;
import com.natcash.loyalty.config.service.GeneralCategoryService.GeneralCategoryDto;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = {
        "/api/v1/admin/categories",
        "/loyalty/v1/admin/categories",
        "/api/v1/general-categories",
        "/loyalty/v1/general-categories",
        "/admin/categories",
        "/categories",
        "/api/categories"
})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "General Categories Master Data API", description = "DIP Standard Master Data General Categories Management")
public class GeneralCategoryController {

    private final GeneralCategoryService categoryService;

    @GetMapping("/groups")
    @Operation(summary = "Get category groups list (CATEGORY_GROUP)", description = "Query all master data category group definitions")
    public ResponseEntity<List<GeneralCategoryDto>> getCategoryGroups() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(categoryService.getCategoryGroups(tenantId));
    }

    @GetMapping
    @Operation(summary = "Get categories by category type", description = "Query category items by categoryType parameter")
    public ResponseEntity<List<GeneralCategoryDto>> getCategoriesByType(
            @RequestParam(value = "categoryType", required = false) String categoryType) {
        String tenantId = TenantContext.getTenantId();
        if (categoryType == null || categoryType.isBlank()) {
            return ResponseEntity.ok(categoryService.getCategoryGroups(tenantId));
        }
        return ResponseEntity.ok(categoryService.getCategoriesByType(tenantId, categoryType));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all categories", description = "Query all category items for current tenant with fallback")
    public ResponseEntity<List<GeneralCategoryDto>> getAllCategories() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(categoryService.getAllCategories(tenantId));
    }

    @GetMapping("/{categoryType}/{code}")
    @Operation(summary = "Get category details", description = "Query single category item by categoryType and code")
    public ResponseEntity<GeneralCategoryDto> getCategoryDetail(
            @PathVariable("categoryType") String categoryType,
            @PathVariable("code") String code) {
        String tenantId = TenantContext.getTenantId();
        return categoryService.getCategory(tenantId, categoryType, code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create category", description = "Create a new category group or item")
    public ResponseEntity<GeneralCategoryDto> createCategory(@RequestBody GeneralCategoryDto dto) {
        String tenantId = TenantContext.getTenantId();
        GeneralCategoryDto saved = categoryService.createCategory(tenantId, dto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{categoryType}/{code}")
    @Operation(summary = "Update category", description = "Update category name, display order, status or metadata")
    public ResponseEntity<GeneralCategoryDto> updateCategory(
            @PathVariable("categoryType") String categoryType,
            @PathVariable("code") String code,
            @RequestBody GeneralCategoryDto dto) {
        String tenantId = TenantContext.getTenantId();
        GeneralCategoryDto updated = categoryService.updateCategory(tenantId, categoryType, code, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{categoryType}/{code}")
    @Operation(summary = "Delete category", description = "Remove category item or group from system")
    public ResponseEntity<Map<String, Object>> deleteCategory(
            @PathVariable("categoryType") String categoryType,
            @PathVariable("code") String code) {
        String tenantId = TenantContext.getTenantId();
        categoryService.deleteCategory(tenantId, categoryType, code);
        return ResponseEntity.ok(Map.of("success", true, "code", code, "categoryType", categoryType));
    }

    @PostMapping("/cache/evict")
    @Operation(summary = "Evict category cache", description = "Clear all in-memory cached category data")
    public ResponseEntity<Map<String, Object>> evictCache() {
        categoryService.clearAllCache();
        return ResponseEntity.ok(Map.of("success", true, "message", "Category cache evicted successfully"));
    }
}
