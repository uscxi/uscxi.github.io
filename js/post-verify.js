// themes/uscxi/source/js/post-verify.js

/**
 * 文章阅读验证功能（安全增强版）
 */

(function() {
  'use strict';

  const ReadVerify = {
    // 配置
    config: {
      storagePrefix: 'uscxi_verify_',
      salt: window.ENCRYPT_SALT || 'uscxi-theme-2026-xxiao'
    },

    // 元素
    elements: {
      wrapper: null,
      mask: null,
      showBtn: null,
      overlay: null,
      modal: null,
      closeBtn: null,
      input: null,
      submitBtn: null,
      error: null,
      postBody: null,
      previewContent: null
    },

    // 状态
    codeHash: '',
    expireDays: -1,
    isEncrypted: false,
    encryptedContent: '',

    // 初始化
    init: function() {
      this.cacheElements();
      
      if (!this.elements.wrapper || !this.elements.wrapper.classList.contains('need-verify')) {
        return;
      }
      
      this.codeHash = this.elements.wrapper.dataset.codeHash || '';
      
      var rawExpire = this.elements.wrapper.dataset.expire;
      this.expireDays = parseInt(rawExpire);
      if (isNaN(this.expireDays)) {
        this.expireDays = -1;
      }
      
      this.isEncrypted = this.elements.wrapper.dataset.encrypted === 'true';
      
      if (this.isEncrypted && this.elements.postBody) {
        this.encryptedContent = this.elements.postBody.dataset.content || '';
      }
      
      if (!this.codeHash) {
        this.unlock();
        return;
      }
      
      // 检查是否已验证
      if (this.expireDays >= 0) {
        const savedCode = this.getSavedCode();
        if (savedCode && this.verifyCode(savedCode)) {
          this.unlockWithDecrypt(savedCode);
          return;
        }
      }
      
      this.bindEvents();
      
      setTimeout(() => {
        this.showModal();
      }, 500);
    },

    // 缓存元素
    cacheElements: function() {
      this.elements.wrapper = document.getElementById('post-body-wrap');
      this.elements.mask = document.getElementById('read-verify-mask');
      this.elements.showBtn = document.getElementById('verify-show-btn');
      this.elements.overlay = document.getElementById('verify-modal-overlay');
      this.elements.modal = document.getElementById('verify-modal');
      this.elements.closeBtn = document.getElementById('verify-modal-close');
      this.elements.input = document.getElementById('verify-code-input');
      this.elements.submitBtn = document.getElementById('verify-submit-btn');
      this.elements.error = document.getElementById('verify-error');
      this.elements.postBody = document.getElementById('post-body');
      this.elements.previewContent = document.getElementById('preview-content');
    },

    // 绑定事件
    bindEvents: function() {
      const self = this;
      
      if (this.elements.showBtn) {
        this.elements.showBtn.addEventListener('click', function() {
          self.showModal();
        });
      }
      
      if (this.elements.closeBtn) {
        this.elements.closeBtn.addEventListener('click', function() {
          self.hideModal();
        });
      }
      
      if (this.elements.overlay) {
        this.elements.overlay.addEventListener('click', function(e) {
          if (e.target === self.elements.overlay) {
            self.hideModal();
          }
        });
      }
      
      if (this.elements.submitBtn) {
        this.elements.submitBtn.addEventListener('click', function() {
          self.verify();
        });
      }
      
      if (this.elements.input) {
        this.elements.input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            self.verify();
          }
        });
        
        this.elements.input.addEventListener('input', function() {
          self.clearError();
        });
      }
      
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isModalOpen()) {
          self.hideModal();
        }
      });
    },

    // 显示/隐藏弹窗
    showModal: function() {
      if (this.elements.overlay) {
        this.elements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
          if (this.elements.input) {
            this.elements.input.focus();
          }
        }, 300);
      }
    },

    hideModal: function() {
      if (this.elements.overlay) {
        this.elements.overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
      this.clearError();
    },

    isModalOpen: function() {
      return this.elements.overlay && 
             this.elements.overlay.classList.contains('active');
    },

    // ========== 安全验证 ==========
    
    generateCodeHash: function(code) {
      if (typeof CryptoJS === 'undefined') {
        console.error('CryptoJS not loaded');
        return '';
      }
      return CryptoJS.SHA256(code + this.config.salt).toString();
    },

    generateEncryptKey: function(code) {
      if (typeof CryptoJS === 'undefined') {
        console.error('CryptoJS not loaded');
        return '';
      }
      const key = CryptoJS.PBKDF2(code, this.config.salt, {
        keySize: 256 / 32,
        iterations: 1000
      });
      return key.toString();
    },

    verifyCode: function(code) {
      const inputHash = this.generateCodeHash(code);
      return inputHash === this.codeHash;
    },

    // 验证
    verify: function() {
      var inputCode = this.elements.input ? String(this.elements.input.value).trim() : '';
      
      if (!inputCode) {
        this.showError('请输入验证码');
        this.shakeInput();
        return;
      }
      
      if (!this.verifyCode(inputCode)) {
        this.showError('验证码错误，请重新输入');
        this.shakeInput();
        this.elements.input.value = '';
        this.elements.input.focus();
        return;
      }
      
      this.onVerifySuccess(inputCode);
    },

    onVerifySuccess: function(code) {
      if (this.expireDays >= 0) {
        this.saveCode(code);
      }
      
      this.showSuccessAnimation();
      
      setTimeout(() => {
        this.hideModal();
        this.removeSuccessAnimation();
        this.unlockWithDecrypt(code);
        
        const postPage = document.getElementById('post-page');
        if (postPage) {
          postPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1200);
    },

    // 成功动画
    showSuccessAnimation: function() {
      const animation = document.createElement('div');
      animation.className = 'verify-success-animation';
      animation.id = 'verify-success-animation';
      animation.innerHTML = `
        <div class="verify-success-icon">
          <i class="fas fa-check"></i>
        </div>
      `;
      document.body.appendChild(animation);
    },

    removeSuccessAnimation: function() {
      const animation = document.getElementById('verify-success-animation');
      if (animation) {
        animation.remove();
      }
    },

    // 解锁文章
    unlockWithDecrypt: function(code) {
      if (this.isEncrypted) {
        this.decryptContent(code);
      }
      this.unlock();
    },

    decryptContent: function(code) {
      if (!this.encryptedContent) {
        console.error('ReadVerify: Missing encrypted content');
        return;
      }
      
      try {
        if (typeof CryptoJS === 'undefined') {
          console.error('ReadVerify: CryptoJS not loaded');
          this.showDecryptError();
          return;
        }
        
        const encryptKey = this.generateEncryptKey(code);
        const decryptedBytes = CryptoJS.AES.decrypt(this.encryptedContent, encryptKey);
        const decryptedContent = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedContent) {
          console.error('ReadVerify: Decryption failed - empty result');
          this.showDecryptError();
          return;
        }
        
        if (this.elements.postBody) {
          this.elements.postBody.innerHTML = decryptedContent;
          this.elements.postBody.style.display = 'block';
        }
        
        if (this.elements.previewContent) {
          this.elements.previewContent.style.display = 'none';
        }
        
        this.rebuildTocHtml();
        this.reinitFeatures();
        
      } catch (error) {
        console.error('ReadVerify: Decryption error', error);
        this.showDecryptError();
      }
    },

    showDecryptError: function() {
      if (this.elements.postBody) {
        this.elements.postBody.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #e74c3c;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
            <p style="font-size: 1.1rem;">内容解密失败</p>
            <p style="font-size: 0.9rem; margin-top: 10px; color: #999;">请刷新页面重试</p>
          </div>
        `;
        this.elements.postBody.style.display = 'block';
      }
      
      if (this.elements.previewContent) {
        this.elements.previewContent.style.display = 'none';
      }
    },

    rebuildTocHtml: function() {
      const tocContent = document.getElementById('toc-content');
      if (!tocContent) return;

      const postBody = this.elements.postBody;
      if (!postBody) return;

      const headings = postBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length === 0) return;

      let tocHtml = '<ol class="toc">';
      let currentLevel = 0;

      headings.forEach(function(heading, index) {
        const level = parseInt(heading.tagName.substring(1));
        const text = heading.textContent.trim();
        let id = heading.id;

        if (!id) {
          id = 'heading-' + index;
          heading.id = id;
        }

        if (level > currentLevel) {
          for (let i = currentLevel; i < level; i++) {
            tocHtml += '<ol class="toc-child">';
          }
        } else if (level < currentLevel) {
          for (let i = level; i < currentLevel; i++) {
            tocHtml += '</ol></li>';
          }
        } else if (currentLevel > 0) {
          tocHtml += '</li>';
        }

        tocHtml += '<li class="toc-item toc-level-' + level + '">';
        tocHtml += '<a class="toc-link" href="#' + encodeURIComponent(id) + '">';
        tocHtml += '<span class="toc-text">' + text + '</span>';
        tocHtml += '</a>';

        currentLevel = level;
      });

      for (let i = 0; i < currentLevel; i++) {
        tocHtml += '</li></ol>';
      }

      tocHtml += '</ol>';
      tocContent.innerHTML = tocHtml;
    },

    reinitFeatures: function() {
      setTimeout(function() {
        if (window.TOCManager && typeof window.TOCManager.init === 'function') {
          setTimeout(() => {
            window.TOCManager.init();
          }, 100);
        }

        if (typeof Prism !== 'undefined') {
          Prism.highlightAll();
        } else if (typeof hljs !== 'undefined') {
          document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
          });
        }
      }, 200);
    },

    unlock: function() {
      if (this.elements.wrapper) {
        this.elements.wrapper.classList.add('verified');
      }
      
      if (this.elements.overlay) {
        this.elements.overlay.remove();
      }
    },

    // 错误提示
    showError: function(msg) {
      if (this.elements.error) {
        this.elements.error.textContent = msg;
      }
    },

    clearError: function() {
      if (this.elements.error) {
        this.elements.error.textContent = '';
      }
    },

    shakeInput: function() {
      if (this.elements.input) {
        this.elements.input.classList.add('shake');
        setTimeout(() => {
          this.elements.input.classList.remove('shake');
        }, 500);
      }
    },

    // ========== 存储相关（修复：只保留一个 getSavedCode）==========
    
    /**
     * 获取存储的验证码（解码）
     */
    getSavedCode: function() {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      try {
        const data = JSON.parse(stored);
        
        // 检查是否过期
        if (this.expireDays > 0 && data.timestamp) {
          const now = Date.now();
          const expireTime = data.timestamp + (this.expireDays * 24 * 60 * 60 * 1000);
          
          if (now > expireTime) {
            localStorage.removeItem(key);
            return null;
          }
        }
        
        // 解码验证码
        if (data.code) {
          try {
            return decodeURIComponent(atob(data.code));
          } catch (e) {
            return null;
          }
        }
        
        return null;
      } catch (e) {
        return null;
      }
    },

    /**
     * 保存验证码（加密存储）
     */
    saveCode: function(code) {
      const key = this.getStorageKey();
      
      // 简单加密存储
      const encodedCode = btoa(encodeURIComponent(code));
      
      const data = {
        code: encodedCode,
        timestamp: Date.now(),
        expireDays: this.expireDays
      };
      
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error('ReadVerify: Error saving code', e);
      }
    },

    /**
     * 获取存储 key
     */
    getStorageKey: function() {
      const path = window.location.pathname;
      return this.config.storagePrefix + btoa(encodeURIComponent(path));
    }
  };

  // 添加抖动动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes verifyShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-10px); }
      40% { transform: translateX(10px); }
      60% { transform: translateX(-10px); }
      80% { transform: translateX(10px); }
    }
    .verify-input.shake {
      animation: verifyShake 0.5s ease;
      border-color: var(--verify-danger) !important;
    }
  `;
  document.head.appendChild(style);

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ReadVerify.init();
    });
  } else {
    ReadVerify.init();
  }

  window.ReadVerify = ReadVerify;
})();