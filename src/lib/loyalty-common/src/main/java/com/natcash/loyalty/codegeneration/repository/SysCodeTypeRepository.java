package com.natcash.loyalty.codegeneration.repository;

import com.natcash.loyalty.codegeneration.entity.SysCodeTypeEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysCodeTypeRepository extends JpaRepository<SysCodeTypeEntity, Long> {

    Optional<SysCodeTypeEntity> findByCodeTypeIgnoreCase(String codeType);

    List<SysCodeTypeEntity> findAllByOrderByCodeTypeAsc();
}
