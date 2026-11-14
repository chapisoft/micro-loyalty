package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.game.entity.LearningCourseEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningCourseRepository extends JpaRepository<LearningCourseEntity, Long> {

    List<LearningCourseEntity> findByTenantIdAndStatusOrderByIdAsc(String tenantId, CommonStatus status);

    Optional<LearningCourseEntity> findByIdAndTenantId(Long id, String tenantId);
}
