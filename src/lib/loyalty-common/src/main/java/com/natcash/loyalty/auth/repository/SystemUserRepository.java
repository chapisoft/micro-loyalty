package com.natcash.loyalty.auth.repository;

import com.natcash.loyalty.auth.entity.SystemUserEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemUserRepository extends JpaRepository<SystemUserEntity, Long> {

    Optional<SystemUserEntity> findByUsernameIgnoreCase(String username);

    Optional<SystemUserEntity> findByEmailIgnoreCase(String email);

    List<SystemUserEntity> findByTenantIdOrderByIdAsc(String tenantId);

    List<SystemUserEntity> findByTenantIdInOrderByIdAsc(List<String> tenantIds);

    Optional<SystemUserEntity> findByIdAndTenantId(Long id, String tenantId);

    Optional<SystemUserEntity> findByIdAndTenantIdIn(Long id, List<String> tenantIds);

    @Query("SELECT COUNT(u) FROM SystemUserEntity u JOIN u.roles r WHERE r.id = :roleId")
    long countByRoleId(@Param("roleId") Long roleId);
}
