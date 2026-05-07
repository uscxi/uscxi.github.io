// themes/uscxi/source/js/rightside.js

/**
 * 右下角按钮控制脚本 - Butterfly 风格
 * 功能：目录切换、隐藏侧边栏、主题切换、返回顶部
 */

(function() {
  'use strict';

  const Rightside = {
    // 配置
    config: {
      scrollShowHeight: 300,
      mobileBreakpoint: 768  // 移动端断点
    },

    // 元素
    elements: {
      rightside: null,
      topArea: null,
      toggleBtn: null,
      menuContainer: null,
      tocBtn: null,
      hideSidebarBtn: null,
      themeToggleBtn: null,
      goTopBtn: null,
      scrollPercent: null
    },

    // 状态
    state: {
      menuOpen: false,
      sidebarHidden: false
    },

    // 初始化
    init: function() {
      this.cacheElements();
      this.bindEvents();
      this.initScrollProgress();
      this.initThemeButton();
      this.restoreSidebarState();
      //console.log('Rightside Initialized');
    },

    // 缓存元素
    cacheElements: function() {
      this.elements.rightside = document.getElementById('rightside');
      this.elements.topArea = document.getElementById('rightside-top-area');
      this.elements.toggleBtn = document.getElementById('rightside-toggle');
      this.elements.menuContainer = document.getElementById('rightside-menus');
      this.elements.tocBtn = document.getElementById('toc-toggle');
      this.elements.hideSidebarBtn = document.getElementById('hide-sidebar-btn');
      this.elements.themeToggleBtn = document.getElementById('theme-toggle-btn');
      this.elements.goTopBtn = document.getElementById('go-top');
      
      if (this.elements.goTopBtn) {
        this.elements.scrollPercent = this.elements.goTopBtn.querySelector('.scroll-percent');
      }
    },

    // 绑定事件
    bindEvents: function() {
      const self = this;

      // 功能菜单切换
      if (this.elements.toggleBtn) {
        this.elements.toggleBtn.addEventListener('click', function() {
          self.toggleMenu();
        });
      }

      // 隐藏/显示侧边栏
      if (this.elements.hideSidebarBtn) {
        this.elements.hideSidebarBtn.addEventListener('click', function() {
          self.toggleSidebar();
        });
      }

      // 主题切换
      if (this.elements.themeToggleBtn) {
        this.elements.themeToggleBtn.addEventListener('click', function() {
          self.toggleTheme();
        });
      }

      // 返回顶部
      if (this.elements.goTopBtn) {
        this.elements.goTopBtn.addEventListener('click', function() {
          self.scrollToTop();
        });
      }

      // 滚动事件
      let ticking = false;
      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            self.handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },

    // 切换功能菜单
    toggleMenu: function() {
      this.state.menuOpen = !this.state.menuOpen;
      
      if (this.elements.menuContainer) {
        this.elements.menuContainer.classList.toggle('show', this.state.menuOpen);
      }
      
      if (this.elements.toggleBtn) {
        this.elements.toggleBtn.classList.toggle('open', this.state.menuOpen);
        const icon = this.elements.toggleBtn.querySelector('i');
        if (icon) {
          icon.className = this.state.menuOpen ? 'fas fa-times' : 'fas fa-cog';
        }
        this.elements.toggleBtn.title = this.state.menuOpen ? '收起' : '更多功能';
      }
    },

    // 判断是否为移动端
    isMobile: function() {
      return window.innerWidth <= this.config.mobileBreakpoint;
    },

    // 切换侧边栏显示
    toggleSidebar: function() {
      // 移动端：打开/关闭侧边栏弹窗
      if (this.isMobile()) {
        this.toggleMobileSidebar();
        return;
      }
      
      // 桌面端：隐藏/显示侧边栏
      this.state.sidebarHidden = !this.state.sidebarHidden;
      document.body.classList.toggle('hide-sidebar', this.state.sidebarHidden);
      
      if (this.elements.hideSidebarBtn) {
        this.elements.hideSidebarBtn.classList.toggle('active', this.state.sidebarHidden);
        const icon = this.elements.hideSidebarBtn.querySelector('i');
        if (icon) {
          icon.className = this.state.sidebarHidden ? 'fas fa-indent' : 'fas fa-arrows-alt-h';
        }
        this.elements.hideSidebarBtn.title = this.state.sidebarHidden ? '显示侧边栏' : '隐藏侧边栏';
      }

      // ========== 关键新增：通知 Sidebar 状态变化 ========== //
      if (window.SidebarManager) {
        if (this.state.sidebarHidden) {
          // 侧边栏被隐藏 → 通知 Sidebar 重置状态
          if (typeof window.SidebarManager.onSidebarHidden === 'function') {
            window.SidebarManager.onSidebarHidden();
          }
        } else {
          // 侧边栏被显示 → 通知 Sidebar 更新按钮
          if (typeof window.SidebarManager.onSidebarShown === 'function') {
            window.SidebarManager.onSidebarShown();
          }
        }
      }

      // 保存状态
      localStorage.setItem('sidebar-hidden', this.state.sidebarHidden);
    },

    // 移动端切换侧边栏
    toggleMobileSidebar: function() {
      // 使用 SidebarManager（如果存在）
      if (window.SidebarManager) {
        const sidebar = document.getElementById('sidebar');
        const isActive = sidebar && sidebar.classList.contains('active');
        
        if (isActive) {
          window.SidebarManager.closeMobileSidebar();
        } else {
          // 确保显示信息卡片
          window.SidebarManager.showInfo();
          window.SidebarManager.currentMode = 'info';
          window.SidebarManager.openMobileSidebar();
        }
      } else {
        // 备用方案：直接操作 DOM
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar) {
          const isActive = sidebar.classList.contains('active');
          sidebar.classList.toggle('active', !isActive);
          
          if (overlay) {
            overlay.classList.toggle('active', !isActive);
          }
          
          document.body.style.overflow = isActive ? '' : 'hidden';
        }
      }
      
      // 更新按钮状态
      this.updateMobileSidebarButton();
    },

    // 更新移动端侧边栏按钮状态
    updateMobileSidebarButton: function() {
      if (!this.elements.hideSidebarBtn) return;
      
      const sidebar = document.getElementById('sidebar');
      const isActive = sidebar && sidebar.classList.contains('active');
      
      this.elements.hideSidebarBtn.classList.toggle('active', isActive);
      const icon = this.elements.hideSidebarBtn.querySelector('i');
      if (icon) {
        icon.className = isActive ? 'fas fa-arrows-alt-h' : 'fas fa-indent';
      }
      this.elements.hideSidebarBtn.title = isActive ? '关闭侧边栏' : '显示侧边栏';
    },

    // 切换主题
    toggleTheme: function() {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // 添加过渡类
      html.classList.add('theme-transition');
      
      // 设置新主题
      html.setAttribute('data-theme', newTheme);
      
      // 保存偏好
      localStorage.setItem('theme', newTheme);
      
      // 更新按钮状态
      this.updateThemeButton(newTheme);
      
      // 更新 theme-color meta
      const metaThemeColor = document.getElementById('theme-color-meta');
      if (metaThemeColor) {
        metaThemeColor.content = newTheme === 'dark' ? '#161b22' : '#49b1f5';
      }
      
      // 移除过渡类
      setTimeout(function() {
        html.classList.remove('theme-transition');
      }, 300);
    },

    // 更新主题按钮图标
    updateThemeButton: function(theme) {
      if (this.elements.themeToggleBtn) {
        const icon = this.elements.themeToggleBtn.querySelector('i');
        if (icon) {
          icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        this.elements.themeToggleBtn.title = theme === 'dark' ? '浅色模式' : '深色模式';
      }
    },

    // 返回顶部
    scrollToTop: function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },

    // 处理滚动
    handleScroll: function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      
      // 更新进度显示
      if (this.elements.scrollPercent) {
        this.elements.scrollPercent.textContent = scrollPercent;
      }
      
      // 显示/隐藏返回顶部按钮
      if (this.elements.goTopBtn) {
        const shouldShow = scrollTop > this.config.scrollShowHeight;
        this.elements.goTopBtn.classList.toggle('show', shouldShow);
      }
    },

    // 初始化滚动进度
    initScrollProgress: function() {
      this.handleScroll();
    },

    // 初始化主题按钮状态
    initThemeButton: function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      this.updateThemeButton(currentTheme);
    },

    // 恢复侧边栏状态（仅桌面端）
    restoreSidebarState: function() {
      // 移动端不恢复隐藏状态
      if (this.isMobile()) {
        this.updateMobileSidebarButtonIcon();
        return;
      }
      
      const sidebarHidden = localStorage.getItem('sidebar-hidden') === 'true';
      if (sidebarHidden) {
        this.state.sidebarHidden = true;
        document.body.classList.add('hide-sidebar');
        if (this.elements.hideSidebarBtn) {
          this.elements.hideSidebarBtn.classList.add('active');
          const icon = this.elements.hideSidebarBtn.querySelector('i');
          if (icon) {
            icon.className = 'fas fa-indent';
          }
          this.elements.hideSidebarBtn.title = '显示侧边栏';
        }
      }
    },

    // 更新移动端侧边栏按钮图标（初始化时）
    updateMobileSidebarButtonIcon: function() {
      if (!this.elements.hideSidebarBtn) return;
      
      const icon = this.elements.hideSidebarBtn.querySelector('i');
      if (icon) {
        icon.className = 'fas fa-indent';
      }
      this.elements.hideSidebarBtn.title = '显示侧边栏';
    }
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      Rightside.init();
    });
  } else {
    Rightside.init();
  }

  // 暴露到全局
  window.RightsideManager = Rightside;
})();