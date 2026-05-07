// themes/uscxi/source/js/toc.js

/**
 * 文章目录脚本 - 增强版
 * - 修复中文标题、特殊字符跳转问题
 * - 自动高亮当前阅读位置
 * - 目录自动滚动跟随
 * - 滚动进度显示
 */

(function() {
  'use strict';

  const TOC = {
    // 配置
    config: {
      headerOffset: 80,
      highlightOffset: 100
    },

    // 元素
    elements: {
      toc: null,
      tocContent: null,
      tocLinks: [],
      headings: [],
      progress: null,
      postBody: null
    },

    // 标题映射表
    headingMap: new Map(),

    // 重置 TOC（新增）
    reset: function() {
      //console.log('TOC: Resetting...');

      // 清空元素缓存
      this.elements.tocLinks = [];
      this.elements.headings = [];

      // 清空映射表
      this.headingMap.clear();

      // 清除所有事件监听（避免重复绑定）
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler);
        this.scrollHandler = null;
      }
    },

    // 初始化
    init: function() {
      // 如果已经初始化过，先重置
      if (this.elements.headings.length > 0) {
        this.reset();
      }
      
      this.cacheElements();
      if (this.elements.headings.length === 0) {
        //console.log('TOC: No headings found');
        return;
      }
      
      this.buildHeadingMap();
      this.fixHeadingIds();
      this.bindEvents();
      this.updateActiveLink();
      //console.log('TOC Initialized with', this.elements.headings.length, 'headings');
    },

    // 缓存元素
    cacheElements: function() {
      this.elements.toc = document.querySelector('.toc');
      this.elements.tocContent = document.getElementById('toc-content');
      this.elements.tocLinks = document.querySelectorAll('.toc-link');
      this.elements.progress = document.getElementById('toc-progress');
      this.elements.postBody = document.querySelector('.post-body');
      
      if (this.elements.postBody) {
        this.elements.headings = this.elements.postBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
      }
    },

    // 构建标题映射表
    buildHeadingMap: function() {
      this.headingMap.clear();
      
      this.elements.headings.forEach(function(heading, index) {
        const text = heading.textContent.trim().replace(/\s+/g, ' ');
        this.headingMap.set(heading.id, heading);
        this.headingMap.set(text, heading);
        this.headingMap.set(this.normalizeId(text), heading);
        this.headingMap.set('heading-' + index, heading);
        
        if (!heading.id) {
          heading.id = 'heading-' + index;
        }
      }.bind(this));
    },

    // 修复标题 ID
    fixHeadingIds: function() {
      const usedIds = new Set();
      
      this.elements.headings.forEach(function(heading, index) {
        let id = heading.id;
        
        if (!id || id.trim() === '') {
          id = this.generateId(heading.textContent, index);
          heading.id = id;
        }
        
        if (usedIds.has(id)) {
          id = id + '-' + index;
          heading.id = id;
        }
        
        usedIds.add(id);
      }.bind(this));
    },

    // 生成 ID
    generateId: function(text, index) {
      let id = text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      if (!id) {
        id = 'heading-' + index;
      }
      
      return id;
    },

    // 标准化 ID
    normalizeId: function(str) {
      return str
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[、，。；：""''【】（）]/g, '')
        .replace(/[.,;:'"()\[\]{}]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    },

    // 绑定事件
    bindEvents: function() {
      const self = this;
      
      // 滚动事件（节流）
      let ticking = false;
      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            self.updateActiveLink();
            self.updateProgress();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
      
      // 点击目录链接
      this.elements.tocLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          self.scrollToHeading(this);
        });
      });
    },

    // 滚动到标题
    scrollToHeading: function(link) {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      
      const target = this.findHeading(href);
      
      if (target) {
        const top = target.offsetTop - this.config.headerOffset;
        
        window.scrollTo({
          top: Math.max(0, top),
          behavior: 'smooth'
        });
        
        if (history.pushState) {
          history.pushState(null, null, href);
        }
        
        this.highlightHeading(target);
      } else {
        console.warn('TOC: Cannot find heading for', href);
      }
    },

    // 查找标题元素
    findHeading: function(href) {
      if (!href) return null;
      
      let id = href.replace(/^#/, '');
      
      // 策略1: 直接通过 id 查找
      let target = document.getElementById(id);
      if (target) return target;
      
      // 策略2: URL 解码后查找
      try {
        const decodedId = decodeURIComponent(id);
        target = document.getElementById(decodedId);
        if (target) return target;
      } catch (e) {}
      
      // 策略3: 在映射表中查找
      if (this.headingMap.has(id)) {
        return this.headingMap.get(id);
      }
      
      // 策略4: 标准化 ID 后查找
      const normalizedId = this.normalizeId(id);
      for (const [key, heading] of this.headingMap) {
        if (this.normalizeId(key) === normalizedId) {
          return heading;
        }
      }
      
      // 策略5: 模糊匹配
      const fuzzyId = id.replace(/[-_]/g, '').toLowerCase();
      for (let i = 0; i < this.elements.headings.length; i++) {
        const heading = this.elements.headings[i];
        const headingId = (heading.id || '').replace(/[-_]/g, '').toLowerCase();
        const headingText = heading.textContent.replace(/[-_\s]/g, '').toLowerCase();
        
        if (headingId === fuzzyId || headingText.includes(fuzzyId) || fuzzyId.includes(headingText)) {
          return heading;
        }
      }
      
      return null;
    },

    // 高亮标题
    highlightHeading: function(heading) {
      heading.classList.add('toc-heading-highlight');
      setTimeout(function() {
        heading.classList.remove('toc-heading-highlight');
      }, 2000);
    },

    // 更新当前激活的链接
    updateActiveLink: function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      let currentHeading = null;
      let currentId = '';
      
      // 找到当前可见的标题
      for (let i = 0; i < this.elements.headings.length; i++) {
        const heading = this.elements.headings[i];
        const headingTop = this.getOffsetTop(heading) - this.config.highlightOffset;
        
        if (scrollTop >= headingTop) {
          currentHeading = heading;
          currentId = heading.id;
        } else {
          break;
        }
      }
      
      // 更新高亮状态
      let activeLink = null;
      this.elements.tocLinks.forEach(function(link) {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if (href && currentId) {
          const linkId = href.replace(/^#/, '');
          
          if (this.isIdMatch(linkId, currentId)) {
            link.classList.add('active');
            activeLink = link;
          }
        }
      }.bind(this));
      
      // 滚动目录使激活项可见
      if (activeLink) {
        this.scrollTocToActive(activeLink);
      }
    },

    // 检查 ID 是否匹配
    isIdMatch: function(linkId, headingId) {
      if (!linkId || !headingId) return false;
      
      if (linkId === headingId) return true;
      
      try {
        if (decodeURIComponent(linkId) === headingId) return true;
        if (linkId === decodeURIComponent(headingId)) return true;
      } catch (e) {}
      
      if (this.normalizeId(linkId) === this.normalizeId(headingId)) return true;
      
      return false;
    },

    // 获取元素距离文档顶部的距离
    getOffsetTop: function(element) {
      let top = 0;
      while (element) {
        top += element.offsetTop;
        element = element.offsetParent;
      }
      return top;
    },

    // 滚动目录使激活项可见（关键修复）
    scrollTocToActive: function(activeLink) {
      const tocContent = this.elements.tocContent;
      if (!tocContent || !activeLink) return;
      
      const tocRect = tocContent.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      
      // 计算链接相对于目录容器的位置
      const linkTop = linkRect.top - tocRect.top;
      const linkBottom = linkRect.bottom - tocRect.top;
      const containerHeight = tocContent.clientHeight;
      
      // 如果链接在目录可视区域外，滚动目录
      if (linkTop < 0) {
        // 链接在上方，向上滚动
        tocContent.scrollTop += linkTop - 20;
      } else if (linkBottom > containerHeight) {
        // 链接在下方，向下滚动
        tocContent.scrollTop += linkBottom - containerHeight + 20;
      }
    },

    // 更新阅读进度
    updateProgress: function() {
      if (!this.elements.progress) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (docHeight <= 0) {
        this.elements.progress.textContent = '100%';
        return;
      }
      
      const progress = Math.min(Math.round((scrollTop / docHeight) * 100), 100);
      this.elements.progress.textContent = progress + '%';
    }
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      TOC.init();
    });
  } else {
    TOC.init();
  }

  // 暴露到全局
  window.TOCManager = TOC;
})();