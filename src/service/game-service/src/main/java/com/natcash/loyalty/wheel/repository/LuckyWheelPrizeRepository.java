package com.natcash.loyalty.wheel.repository;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.wheel.entity.LuckyWheelPrizeEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LuckyWheelPrizeRepository extends JpaRepository<LuckyWheelPrizeEntity, Long> {

    List<LuckyWheelPrizeEntity> findByWheel_IdAndStatusOrderByDisplayOrderAsc(Long wheelId, CommonStatus status);

    List<LuckyWheelPrizeEntity> findByWheel_IdOrderByDisplayOrderAsc(Long wheelId);
}
