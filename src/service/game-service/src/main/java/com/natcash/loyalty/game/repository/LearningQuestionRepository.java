package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.game.entity.LearningQuestionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningQuestionRepository extends JpaRepository<LearningQuestionEntity, Long> {

    List<LearningQuestionEntity> findByTenantIdAndCourseIdAndStatusOrderByDisplayOrderAscIdAsc(
            String tenantId, Long courseId, CommonStatus status);

    List<LearningQuestionEntity> findByTenantIdOrderByCourseIdAscDisplayOrderAsc(String tenantId);
}
