package com.natcash.loyalty.auth.repository;

import com.natcash.loyalty.auth.entity.SystemPermissionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemPermissionRepository extends JpaRepository<SystemPermissionEntity, Long> {

    List<SystemPermissionEntity> findAllByOrderByIdAsc();

    Optional<SystemPermissionEntity> findByCodeIgnoreCase(String code);
}
