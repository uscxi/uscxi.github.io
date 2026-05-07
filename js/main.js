// themes/uscxi/source/js/main.js

/**
 * uscxi 主题主脚本
 */

(function() {
  'use strict';

  const USCXI = {
    // 配置
    config: {
      // 加载超时时间（毫秒）
      // GitHub Pages 中国大陆访问较慢，建议 6-8 秒
      loadingTimeout: 8000,
      // 最小显示时间，避免闪烁
      minLoadingTime: 100
    },
    // 初始化
    init: function() {
      this.initPreloader();
      this.initMobileMenu();
      this.initScrollHeader();
      // console.log('USCXI Theme Initialized');
    },

    // 页面加载动画
    initPreloader: function() {
      const loadingScreen = document.getElementById('loading-screen');
      
      if (!loadingScreen) {
        document.body.classList.add('page-loaded');
        return;
      }

      const startTime = Date.now();
      const self = this;
      
      const hideLoading = function() {
        // 确保最少显示一段时间
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, self.config.minLoadingTime - elapsed);
        
        setTimeout(function() {
          loadingScreen.classList.add('loaded');
          document.body.classList.add('page-loaded');
          
          setTimeout(function() {
            if (loadingScreen && loadingScreen.parentNode) {
              loadingScreen.remove();
            }
          }, 600);
        }, delay);
      };
      
      // 页面完全加载
      if (document.readyState === 'complete') {
        hideLoading();
      } else {
        window.addEventListener('load', hideLoading);
      }
      
      // 超时保护
      setTimeout(function() {
        if (!loadingScreen.classList.contains('loaded')) {
          console.log('Loading timeout, forcing display...');
          hideLoading();
        }
      }, this.config.loadingTimeout);
    },

    // 移动端菜单
    initMobileMenu: function() {
      const menuBtn = document.getElementById('mobile-menu-btn');
      const mobileNav = document.getElementById('mobile-nav');
      
      if (!menuBtn || !mobileNav) return;
      
      menuBtn.addEventListener('click', function() {
        mobileNav.classList.toggle('active');
        const icon = menuBtn.querySelector('i');
        if (mobileNav.classList.contains('active')) {
          icon.className = 'fas fa-times';
        } else {
          icon.className = 'fas fa-bars';
        }
      });
      
      // 点击菜单项后关闭菜单
      const menuLinks = mobileNav.querySelectorAll('.mobile-nav-link');
      menuLinks.forEach(function(link) {
        link.addEventListener('click', function() {
          mobileNav.classList.remove('active');
          menuBtn.querySelector('i').className = 'fas fa-bars';
        });
      });
    },

    // 滚动时头部效果
    initScrollHeader: function() {
      const header = document.getElementById('header');
      if (!header) return;
      
      let lastScrollTop = 0;
      
      window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 添加阴影效果
        if (scrollTop > 10) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
      }, { passive: true });
    }
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      USCXI.init();
    });
  } else {
    USCXI.init();
  }

  // 暴露到全局
  window.USCXI = USCXI;
})();