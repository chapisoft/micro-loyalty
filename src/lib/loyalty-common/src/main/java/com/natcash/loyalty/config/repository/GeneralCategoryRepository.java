package com.natcash.loyalty.config.repository;

import com.natcash.loyalty.config.entity.GeneralCategoryEntity;
import com.natcash.loyalty.config.entity.GeneralCategoryId;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneralCategoryRepository extends JpaRepository<GeneralCategoryEntity, GeneralCategoryId> {

    List<GeneralCategoryEntity> findByTenantIdAndCategoryTypeOrderByDisplayOrderAscNameAsc(
            String tenantId, String categoryType);

    List<GeneralCategoryEntity> findByTenantIdOrderByCategoryTypeAscDisplayOrderAscNameAsc(String tenantId);

    Optional<GeneralCategoryEntity> findByTenantIdAndCategoryTypeAndCode(
            String tenantId, String categoryType, String code);

    boolean existsByTenantIdAndCategoryTypeAndCode(
            String tenantId, String categoryType, String code);

    @Modifying
    @Query("DELETE FROM GeneralCategoryEntity c WHERE c.tenantId = :tenantId AND c.categoryType = :categoryType AND c.code = :code")
    void deleteByTenantIdAndCategoryTypeAndCode(
            @Param("tenantId") String tenantId,
            @Param("categoryType") String categoryType,
            @Param("code") String code);

    @Modifying
    @Query("DELETE FROM GeneralCategoryEntity c WHERE c.tenantId = :tenantId AND c.categoryType = :categoryType")
    void deleteByTenantIdAndCategoryType(
            @Param("tenantId") String tenantId,
            @Param("categoryType") String categoryType);
}
