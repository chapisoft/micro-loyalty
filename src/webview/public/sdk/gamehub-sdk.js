/**
 * GameHub JavaScript SDK - Version 1.0.0
 * Thư viện tích hợp Game HTML5 dành cho Nhà phát triển Trò chơi Bên Thứ Ba
 * Bản quyền (c) 2026 Chapisoft / Natcash Standalone Loyalty Platform
 */
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    global.GameHub = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var _config = {
    apiBase: '',
    tenantId: 'TENANT_NATCASH',
    gameCode: '',
    sessionToken: '',
    externalUserId: '',
    locale: 'vi',
    debug: false,
  };

  var _listeners = {};

  function _log(message, data) {
    if (_config.debug) {
      console.log('[GameHub SDK] ' + message, data || '');
    }
  }

  function _getQueryParam(param) {
    if (typeof window === 'undefined' || !window.location) return '';
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || '';
  }

  function _emit(event, data) {
    if (_listeners[event]) {
      _listeners[event].forEach(function (handler) {
        try {
          handler(data);
        } catch (e) {
          console.error('[GameHub SDK Event Error] ' + event, e);
        }
      });
    }
  }

  var GameHub = {
    version: '1.0.0',

    /**
     * Khởi tạo GameHub SDK
     * Tự động trích xuất sessionToken, tenantId, gameCode từ URL query parameters
     */
    init: function (customConfig) {
      customConfig = customConfig || {};

      var autoSession = _getQueryParam('sessionToken');
      var autoTenant = _getQueryParam('tenantId') || 'TENANT_NATCASH';
      var autoGame = _getQueryParam('gameCode');
      var autoUser = _getQueryParam('externalUserId');
      var autoLocale = _getQueryParam('locale') || 'vi';

      // Auto-detect API Base from current host if empty
      var defaultApiBase = '';
      if (typeof window !== 'undefined' && window.location) {
        defaultApiBase = window.location.origin;
      }

      _config = {
        apiBase: customConfig.apiBase || defaultApiBase,
        tenantId: customConfig.tenantId || autoTenant,
        gameCode: customConfig.gameCode || autoGame,
        sessionToken: customConfig.sessionToken || autoSession,
        externalUserId: customConfig.externalUserId || autoUser,
        locale: customConfig.locale || autoLocale,
        debug: customConfig.debug || false,
      };

      _log('SDK Initialized successfully', _config);
      return {
        sessionToken: _config.sessionToken,
        tenantId: _config.tenantId,
        gameCode: _config.gameCode,
        locale: _config.locale,
      };
    },

    /**
     * Lấy thông tin cấu hình và phiên hiện tại
     */
    getConfig: function () {
      return Object.assign({}, _config);
    },

    /**
     * Gửi kết quả ván chơi lên máy chủ Loyalty Core
     * @param {number} score Điểm số đạt được trong ván chơi
     * @param {object|string} details Thông tin chi tiết ván chơi (cấp độ, thời gian, combo)
     * @returns {Promise<object>}
     */
    submitScore: function (score, details) {
      if (!_config.gameCode) {
        return Promise.reject(new Error('GameCode không được để trống. Hãy gọi GameHub.init({ gameCode: "..." }) trước.'));
      }

      var detailStr = typeof details === 'object' ? JSON.stringify(details) : details || '';
      var payload = {
        externalUserId: _config.externalUserId || 'GUEST_USER',
        gameCode: _config.gameCode,
        sessionToken: _config.sessionToken,
        score: Number(score) || 0,
        details: detailStr,
      };

      _log('Submitting score...', payload);

      var url = _config.apiBase + '/gamehub/v1/games/submit-result';
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': _config.tenantId,
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (err) {
              throw new Error(err.message || 'Lỗi gửi kết quả chơi game (HTTP ' + res.status + ')');
            });
          }
          return res.json();
        })
        .then(function (result) {
          _log('Submit score success:', result);
          _emit('scoreSubmitted', result);
          return result;
        });
    },

    /**
     * Mua thêm lượt chơi trong game (bằng Điểm hoặc qua Ví Tiền mặt)
     * @param {number} turns Số lượt mua thêm
     * @param {number} paymentAmount Số tiền hoặc điểm thanh toán
     * @param {string} paymentMethod 'POINTS' hoặc 'WALLET'
     */
    buyTurns: function (turns, paymentAmount, paymentMethod) {
      paymentMethod = paymentMethod || 'POINTS';
      turns = turns || 1;
      paymentAmount = paymentAmount || 10;

      // Ưu tiên gọi LoyaltyJSBridge nếu đang chạy trong App Webview
      if (typeof window !== 'undefined' && window.LoyaltyJSBridge && paymentMethod === 'WALLET') {
        window.LoyaltyJSBridge.requestPayment(paymentAmount, 'Mua ' + turns + ' lượt chơi game ' + _config.gameCode);
        return Promise.resolve({ status: 'REQUESTED_VIA_BRIDGE' });
      }

      var payload = {
        externalUserId: _config.externalUserId || 'GUEST_USER',
        gameCode: _config.gameCode,
        sessionToken: _config.sessionToken,
        turnsToBuy: turns,
        paymentAmount: paymentAmount,
        paymentMethod: paymentMethod,
      };

      _log('Purchasing turns...', payload);

      var url = _config.apiBase + '/gamehub/v1/billing/in-game-checkout';
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': _config.tenantId,
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (err) {
              throw new Error(err.message || 'Lỗi mua lượt chơi (HTTP ' + res.status + ')');
            });
          }
          return res.json();
        })
        .then(function (result) {
          _log('Purchase turns success:', result);
          _emit('paymentCompleted', result);
          return result;
        });
    },

    /**
     * Đóng Webview và quay trở lại màn hình chính của ứng dụng
     */
    closeGame: function () {
      if (typeof window !== 'undefined' && window.LoyaltyJSBridge) {
        window.LoyaltyJSBridge.closeWebview();
      } else if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
        window.history.back();
      } else {
        _log('Close game requested, but no bridge or history found');
      }
    },

    /**
     * Đăng ký lắng nghe sự kiện
     * @param {string} event Tên sự kiện: 'scoreSubmitted', 'paymentCompleted', 'sessionExpired'
     * @param {function} handler Hàm xử lý
     */
    on: function (event, handler) {
      if (typeof handler !== 'function') return;
      if (!_listeners[event]) {
        _listeners[event] = [];
      }
      _listeners[event].push(handler);
    },

    /**
     * Hủy đăng ký lắng nghe sự kiện
     */
    off: function (event, handler) {
      if (!_listeners[event]) return;
      _listeners[event] = _listeners[event].filter(function (h) {
        return h !== handler;
      });
    },
  };

  return GameHub;
});
