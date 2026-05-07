// themes/uscxi/source/js/post-actions.js

/**
 * 文章分享和打赏功能
 */

(function() {
  'use strict';

  const PostActions = {
    init: function() {
      this.initWechatQrcode();
      this.initCopyLink();
      // console.log('PostActions Initialized');
    },

    // 微信分享二维码
    initWechatQrcode: function() {
      const wechatItem = document.querySelector('.share-item.wechat');
      const qrcodeContainer = document.getElementById('share-wechat-qrcode');
      
      if (!wechatItem || !qrcodeContainer) return;
      
      let generated = false;
      
      wechatItem.addEventListener('mouseenter', function() {
        if (generated) return;
        generated = true;
        
        const url = window.location.href;
        
        if (typeof QRCode !== 'undefined') {
          new QRCode(qrcodeContainer, {
            text: url,
            width: 100,
            height: 100,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
        } else {
          const img = document.createElement('img');
          img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(url);
          img.alt = 'QR Code';
          qrcodeContainer.appendChild(img);
        }
      });
    },

    // 复制链接
    initCopyLink: function() {
      const copyBtn = document.getElementById('share-copy-btn');
      if (!copyBtn) return;
      
      copyBtn.addEventListener('click', function() {
        const url = window.location.href;
        PostActions.copyToClipboard(url);
      });
    },

    // 复制到剪贴板
    copyToClipboard: function(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => this.showToast('链接复制成功'))
          .catch(() => this.fallbackCopy(text));
      } else {
        this.fallbackCopy(text);
      }
    },

    // 降级复制
    fallbackCopy: function(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        this.showToast('链接复制成功');
      } catch (e) {
        this.showToast('复制失败');
      }
      
      document.body.removeChild(textarea);
    },

    // 显示提示
    showToast: function(msg) {
      const old = document.querySelector('.copy-toast');
      if (old) old.remove();
      
      const toast = document.createElement('div');
      toast.className = 'copy-toast';
      toast.innerHTML = '<i class="fas fa-check-circle"></i><span>' + msg + '</span>';
      document.body.appendChild(toast);
      
      requestAnimationFrame(() => toast.classList.add('show'));
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PostActions.init());
  } else {
    PostActions.init();
  }

  window.PostActions = PostActions;
})();