package com.natcash.loyalty.game.controller;

import com.natcash.loyalty.game.entity.GameMonthlyLeaderboardEntity;
import com.natcash.loyalty.game.entity.LearningCourseEntity;
import com.natcash.loyalty.game.entity.LearningQuestionEntity;
import com.natcash.loyalty.game.service.GameLeaderboardService;
import com.natcash.loyalty.game.service.LearningQuizService;
import com.natcash.loyalty.game.service.LearningQuizService.QuestionPublicDto;
import com.natcash.loyalty.game.service.LearningQuizService.QuizSubmitResponse;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Learning Quiz & Leaderboard API", description = "Ngân hàng câu hỏi học tập EdTech, Bảng xếp hạng & Thống kê Game (GM-02, GM-07, GM-09)")
public class LearningQuizController {

    private final LearningQuizService learningQuizService;
    private final GameLeaderboardService gameLeaderboardService;

    @GetMapping("/gamehub/v1/learning/courses")
    @Operation(summary = "Danh sách khóa học EdTech")
    public ResponseEntity<List<LearningCourseEntity>> listCourses(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(learningQuizService.listActiveCourses(resolveTenantId(headerTenantId)));
    }

    @GetMapping("/gamehub/v1/learning/courses/{id}/questions")
    @Operation(summary = "Danh sách câu hỏi của khóa học (không trả đáp án đúng)")
    public ResponseEntity<List<QuestionPublicDto>> getQuestions(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(learningQuizService.getCourseQuestions(resolveTenantId(headerTenantId), id));
    }

    @PostMapping("/gamehub/v1/learning/courses/{id}/submit")
    @Operation(summary = "Nộp bài trắc nghiệm, chấm điểm phía Server và thưởng điểm theo mốc")
    public ResponseEntity<QuizSubmitResponse> submitQuiz(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id,
            @RequestBody QuizSubmitPayload payload) {
        return ResponseEntity.ok(learningQuizService.submitQuiz(
                resolveTenantId(headerTenantId), id, payload.getExternalUserId(), payload.getAnswers()));
    }

    @GetMapping("/gamehub/v1/leaderboard")
    @Operation(summary = "Bảng xếp hạng game và học tập theo tháng (ALL / LEARNING / MINI_GAMES)")
    public ResponseEntity<List<GameMonthlyLeaderboardEntity>> getLeaderboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "month", required = false) String month,
            @RequestParam(value = "board", required = false, defaultValue = "ALL") String board) {
        return ResponseEntity.ok(gameLeaderboardService.getLeaderboard(resolveTenantId(headerTenantId), month, board));
    }

    @GetMapping("/loyalty/v1/admin/learning/questions")
    @Operation(summary = "Admin CMS - Danh sách câu hỏi học tập")
    public ResponseEntity<List<LearningQuestionEntity>> listAdminQuestions(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "courseId", required = false) Long courseId) {
        return ResponseEntity.ok(learningQuizService.listAdminQuestions(resolveTenantId(headerTenantId), courseId));
    }

    @PostMapping("/loyalty/v1/admin/learning/questions")
    @Operation(summary = "Admin CMS - Tạo hoặc cập nhật câu hỏi học tập")
    public ResponseEntity<LearningQuestionEntity> saveAdminQuestion(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody LearningQuestionEntity question) {
        return ResponseEntity.ok(learningQuizService.saveAdminQuestion(resolveTenantId(headerTenantId), question));
    }

    @DeleteMapping("/loyalty/v1/admin/learning/questions/{id}")
    @Operation(summary = "Admin CMS - Xóa câu hỏi học tập")
    public ResponseEntity<Void> deleteAdminQuestion(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        learningQuizService.deleteAdminQuestion(resolveTenantId(headerTenantId), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/loyalty/v1/admin/learning/questions/import")
    @Operation(summary = "Admin CMS - Nhập hàng loạt câu hỏi học tập")
    public ResponseEntity<List<LearningQuestionEntity>> importQuestions(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody List<LearningQuestionEntity> questions) {
        return ResponseEntity.ok(learningQuizService.importQuestions(resolveTenantId(headerTenantId), questions));
    }

    @GetMapping("/loyalty/v1/admin/games/statistics")
    @Operation(summary = "Admin CMS - Thống kê tổng quan Cổng Game & Learning")
    public ResponseEntity<Map<String, Object>> getGameStatistics(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(learningQuizService.getAdminGameStatistics(resolveTenantId(headerTenantId)));
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizSubmitPayload {
        @NotBlank
        private String externalUserId;
        private Map<Long, Integer> answers;
    }
}
