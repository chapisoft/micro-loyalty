package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.LearningUserProgressEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningUserProgressRepository extends JpaRepository<LearningUserProgressEntity, Long> {

    List<LearningUserProgressEntity> findByTenantIdAndExternalUserIdAndCourseId(
            String tenantId, String externalUserId, Long courseId);

    long countByTenantIdAndExternalUserIdAndCourseId(String tenantId, String externalUserId, Long courseId);
}
