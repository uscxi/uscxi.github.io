// themes/uscxi/source/js/sidebar.js

/**
 * 侧边栏控制脚本
 */

(function() {
  'use strict';

  const Sidebar = {
    // 元素
    elements: {
      sidebar: null,
      sidebarInfo: null,
      sidebarToc: null,
      tocToggle: null,
      overlay: null
    },

    // 当前模式: 'info' 或 'toc'
    currentMode: 'info',
    
    // 隐藏前的模式（用于恢复）
    modeBeforeHide: 'info',

    // 初始化
    init: function() {
      this.cacheElements();
      this.createOverlay();
      this.bindEvents();
      this.initState();
    },

    // 缓存 DOM 元素
    cacheElements: function() {
      this.elements.sidebar = document.getElementById('sidebar');
      this.elements.sidebarInfo = document.getElementById('sidebar-info');
      this.elements.sidebarToc = document.getElementById('sidebar-toc');
      this.elements.tocToggle = document.getElementById('toc-toggle');
    },

    // 创建遮罩层 (移动端用)
    createOverlay: function() {
      if (document.getElementById('sidebar-overlay')) {
        this.elements.overlay = document.getElementById('sidebar-overlay');
        return;
      }
      
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.id = 'sidebar-overlay';
      document.body.appendChild(overlay);
      this.elements.overlay = overlay;
    },

    // 绑定事件
    bindEvents: function() {
      const self = this;
      
      // 目录切换按钮
      if (this.elements.tocToggle) {
        this.elements.tocToggle.addEventListener('click', function() {
          self.handleTocClick();
        });
      }
      
      // 遮罩层点击关闭（移动端）
      if (this.elements.overlay) {
        this.elements.overlay.addEventListener('click', function() {
          self.closeMobileSidebar();
        });
      }
    },

    // 初始化状态
    initState: function() {
      const isMobile = this.isMobile();
      const hasToc = !!this.elements.sidebarToc;
      
      if (isMobile) {
        // 移动端：如果有目录则默认目录，否则信息
        this.currentMode = hasToc ? 'toc' : 'info';
      } else {
        // 桌面端：默认信息模式
        this.currentMode = 'info';
      }
      
      this.modeBeforeHide = this.currentMode;
      this.applyCurrentMode();
      this.updateTocButton();
    },

    // 应用当前模式（确保正确显示）
    applyCurrentMode: function() {
      if (this.currentMode === 'toc' && this.elements.sidebarToc) {
        this.showToc();
      } else {
        // 默认或回退到信息模式
        this.currentMode = 'info';
        this.showInfo();
      }
    },

    // 判断是否为移动端
    isMobile: function() {
      return window.innerWidth <= 768;
    },

    // 判断桌面端侧边栏是否被隐藏
    isSidebarHidden: function() {
      return document.body.classList.contains('hide-sidebar');
    },

    // 判断移动端侧边栏是否打开
    isMobileSidebarOpen: function() {
      return this.elements.sidebar && this.elements.sidebar.classList.contains('active');
    },

    // ========== 处理目录按钮点击 ========== //
    handleTocClick: function() {
      const isMobile = this.isMobile();
      
      if (isMobile) {
        this.handleMobileTocClick();
      } else {
        this.handleDesktopTocClick();
      }
    },

    // 移动端目录按钮点击
    handleMobileTocClick: function() {
      const sidebarIsOpen = this.isMobileSidebarOpen();
      
      if (!sidebarIsOpen) {
        // 侧边栏关闭 → 打开并显示目录（如果有）
        if (this.elements.sidebarToc) {
          this.currentMode = 'toc';
          this.showToc();
        } else {
          this.currentMode = 'info';
          this.showInfo();
        }
        this.openMobileSidebar();
      } else {
        // 侧边栏已打开 → 切换内容
        this.switchContent();
      }
    },

    // 桌面端目录按钮点击
    handleDesktopTocClick: function() {
      const sidebarIsHidden = this.isSidebarHidden();
      
      if (sidebarIsHidden) {
        // 侧边栏被隐藏 → 显示侧边栏，恢复之前的模式
        this.currentMode = this.modeBeforeHide;
        this.applyCurrentMode();
        this.showSidebar();
        this.updateTocButton();
      } else {
        // 侧边栏显示中 → 切换内容
        this.switchContent();
      }
    },

    // 切换侧边栏内容
    switchContent: function() {
      const hasToc = !!this.elements.sidebarToc;
      
      if (this.currentMode === 'info' && hasToc) {
        // 当前是信息 → 切换到目录（仅当目录存在时）
        this.currentMode = 'toc';
        this.showToc();
      } else {
        // 当前是目录 或 没有目录 → 切换到信息
        this.currentMode = 'info';
        this.showInfo();
      }
      this.updateTocButton();
    },

    // 显示信息卡片
    showInfo: function() {
      if (this.elements.sidebarInfo) {
        this.elements.sidebarInfo.classList.add('active');
      }
      if (this.elements.sidebarToc) {
        this.elements.sidebarToc.classList.remove('active');
      }
    },

    // 显示目录卡片
    showToc: function() {
      // 如果目录元素不存在（非文章页），回退到信息模式
      if (!this.elements.sidebarToc) {
        this.currentMode = 'info';
        this.showInfo();
        return;
      }
      
      if (this.elements.sidebarInfo) {
        this.elements.sidebarInfo.classList.remove('active');
      }
      if (this.elements.sidebarToc) {
        this.elements.sidebarToc.classList.add('active');
      }
    },

    // 桌面端：显示侧边栏
    showSidebar: function() {
      if (window.RightsideManager && typeof window.RightsideManager.toggleSidebar === 'function') {
        if (this.isSidebarHidden()) {
          window.RightsideManager.toggleSidebar();
        }
      } else {
        document.body.classList.remove('hide-sidebar');
      }
    },

    // 移动端：打开侧边栏
    openMobileSidebar: function() {
      if (this.elements.sidebar) {
        this.elements.sidebar.classList.add('active');
      }
      if (this.elements.overlay) {
        this.elements.overlay.classList.add('active');
      }
      document.body.style.overflow = 'hidden';
      
      this.updateTocButton();
      this.syncRightsideButton();
    },

    // 移动端：关闭侧边栏
    closeMobileSidebar: function() {
      if (this.elements.sidebar) {
        this.elements.sidebar.classList.remove('active');
      }
      if (this.elements.overlay) {
        this.elements.overlay.classList.remove('active');
      }
      document.body.style.overflow = '';
      
      // 关闭时重置为目录模式（如果有目录）
      if (this.elements.sidebarToc) {
        this.currentMode = 'toc';
        this.showToc();
      } else {
        this.currentMode = 'info';
        this.showInfo();
      }
      
      this.updateTocButton();
      this.syncRightsideButton();
    },

    // ========== 桌面端：侧边栏被隐藏时的回调 ========== //
    onSidebarHidden: function() {
      const isMobile = this.isMobile();
      if (isMobile) return;
      
      // 记住当前模式，以便恢复
      this.modeBeforeHide = this.currentMode;
      this.updateTocButton();
    },

    // ========== 桌面端：侧边栏被显示时的回调 ========== //
    onSidebarShown: function() {
      const isMobile = this.isMobile();
      if (isMobile) return;
      
      // 恢复之前的模式
      this.currentMode = this.modeBeforeHide;
      this.applyCurrentMode();
      this.updateTocButton();
    },

    // 更新目录按钮图标和提示
    updateTocButton: function() {
      if (!this.elements.tocToggle) return;
      
      const icon = document.getElementById('toc-toggle-icon');
      const isMobile = this.isMobile();
      const hasToc = !!this.elements.sidebarToc;
      
      if (isMobile) {
        // ========== 移动端逻辑 ========== //
        const sidebarIsOpen = this.isMobileSidebarOpen();
        
        if (!sidebarIsOpen) {
          // 侧边栏关闭 → 显示目录/信息图标
          if (icon) icon.className = hasToc ? 'fas fa-list-ul' : 'fas fa-user';
          this.elements.tocToggle.setAttribute('title', hasToc ? '目录' : '信息');
        } else {
          // 侧边栏打开 → 根据当前模式显示切换图标
          if (this.currentMode === 'toc') {
            if (icon) icon.className = 'fas fa-user';
            this.elements.tocToggle.setAttribute('title', '用户信息');
          } else {
            if (icon) icon.className = hasToc ? 'fas fa-list-ul' : 'fas fa-times';
            this.elements.tocToggle.setAttribute('title', hasToc ? '目录' : '关闭');
          }
        }
      } else {
        // ========== 桌面端逻辑 ========== //
        const sidebarIsHidden = this.isSidebarHidden();
        
        if (sidebarIsHidden) {
          // 侧边栏被隐藏 → 根据记住的模式显示图标
          if (this.modeBeforeHide === 'toc' && hasToc) {
            if (icon) icon.className = 'fas fa-list-ul';
            this.elements.tocToggle.setAttribute('title', '显示目录');
          } else {
            if (icon) icon.className = 'fas fa-user';
            this.elements.tocToggle.setAttribute('title', '显示信息');
          }
        } else {
          // 侧边栏显示中 → 根据当前模式显示切换图标
          if (this.currentMode === 'toc') {
            if (icon) icon.className = 'fas fa-user';
            this.elements.tocToggle.setAttribute('title', '用户信息');
          } else {
            if (icon) icon.className = hasToc ? 'fas fa-list-ul' : 'fas fa-user';
            this.elements.tocToggle.setAttribute('title', hasToc ? '目录' : '用户信息');
          }
        }
      }
    },

    // 同步右下角侧边栏按钮状态
    syncRightsideButton: function() {
      if (window.RightsideManager && typeof window.RightsideManager.updateMobileSidebarButton === 'function') {
        window.RightsideManager.updateMobileSidebarButton();
      }
    }
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      Sidebar.init();
    });
  } else {
    Sidebar.init();
  }

  // 暴露到全局
  window.SidebarManager = Sidebar;
})();