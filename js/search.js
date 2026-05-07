// themes/uscxi/source/js/search.js

/**
 * 本地搜索功能
 */

(function() {
  'use strict';

  const LocalSearch = {
    // 配置
    config: {
      path: '/search.xml',
      contentLength: 150,
      emptyResult: '没有找到相关文章'
    },

    // 元素
    elements: {
      mask: null,
      modal: null,
      input: null,
      clear: null,
      close: null,
      results: null,
      stats: null
    },

    // 搜索数据
    searchData: null,
    
    // 数据加载状态
    isLoading: false,
    isLoaded: false,
    
    // 当前选中索引
    currentIndex: -1,

    // 初始化
    init: function() {
      this.cacheElements();
      if (!this.elements.modal) return;
      
      this.bindEvents();
      // 预加载搜索数据（静默）
      // 延迟预加载搜索数据（页面加载完成后 2 秒）
      // 避免影响首屏渲染
      setTimeout(() => {
        this.preloadSearchData();
      }, 2000);
    },

    // 缓存元素
    cacheElements: function() {
      this.elements.mask = document.getElementById('search-mask');
      this.elements.modal = document.getElementById('search-modal');
      this.elements.input = document.getElementById('search-input');
      this.elements.clear = document.getElementById('search-clear');
      this.elements.close = document.getElementById('search-close');
      this.elements.results = document.getElementById('search-results');
      this.elements.stats = document.getElementById('search-stats');
    },

    // 绑定事件
    bindEvents: function() {
      const self = this;
      
      // 搜索按钮
      const searchBtn = document.getElementById('search-btn');
      const searchBtnMobile = document.getElementById('search-btn-mobile');
      
      if (searchBtn) {
        searchBtn.addEventListener('click', function() {
          self.openSearch();
        });
      }
      
      if (searchBtnMobile) {
        searchBtnMobile.addEventListener('click', function() {
          self.openSearch();
        });
      }

      // 关闭按钮
      if (this.elements.close) {
        this.elements.close.addEventListener('click', function() {
          self.closeSearch();
        });
      }

      // 遮罩层点击关闭
      if (this.elements.mask) {
        this.elements.mask.addEventListener('click', function() {
          self.closeSearch();
        });
      }

      // 清空按钮
      if (this.elements.clear) {
        this.elements.clear.addEventListener('click', function() {
          self.clearInput();
        });
      }

      // 输入事件
      if (this.elements.input) {
        let debounceTimer;
        this.elements.input.addEventListener('input', function() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(function() {
            self.doSearch(self.elements.input.value);
          }, 200);
        });
      }

      // 键盘事件
      document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K 打开搜索
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          if (self.isOpen()) {
            self.closeSearch();
          } else {
            self.openSearch();
          }
        }
        
        // ESC 关闭
        if (e.key === 'Escape' && self.isOpen()) {
          self.closeSearch();
        }
        
        // 搜索框内的键盘导航
        if (self.isOpen()) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            self.navigateResults(1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            self.navigateResults(-1);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            self.selectResult();
          }
        }
      });
    },

    // 预加载搜索数据（静默加载，不显示状态）
    preloadSearchData: function() {
      const self = this;
      
      if (this.searchData || this.isLoading) return;
      
      this.isLoading = true;
      
      fetch(this.config.path)
        .then(function(response) {
          if (!response.ok) throw new Error('加载失败');
          return response.text();
        })
        .then(function(data) {
          self.searchData = self.parseXML(data);
          self.isLoaded = true;
          self.isLoading = false;
          //console.log('Search data loaded:', self.searchData.length, 'posts');
          
          // 如果搜索框已打开且有输入内容，立即执行搜索
          if (self.isOpen() && self.elements.input && self.elements.input.value.trim()) {
            self.doSearch(self.elements.input.value);
          }
        })
        .catch(function(error) {
          console.error('Search data load error:', error);
          self.isLoading = false;
        });
    },

    // 解析 XML
    parseXML: function(xmlString) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'application/xml');
      const entries = doc.querySelectorAll('entry');
      const data = [];
      const self = this;
      
      entries.forEach(function(entry) {
        const title = entry.querySelector('title');
        const url = entry.querySelector('url');
        const content = entry.querySelector('content');
        
        if (title && url) {
          data.push({
            title: title.textContent.trim(),
            url: url.textContent.trim(),
            content: content ? self.stripHtml(content.textContent) : ''
          });
        }
      });
      
      return data;
    },

    // 去除 HTML 标签
    stripHtml: function(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return (tmp.textContent || tmp.innerText || '').trim();
    },

    // 打开搜索
    openSearch: function() {
      if (this.elements.mask) this.elements.mask.classList.add('active');
      if (this.elements.modal) this.elements.modal.classList.add('active');
      
      document.body.style.overflow = 'hidden';
      
      // 显示初始状态
      this.showInit();
      
      // 聚焦输入框
      if (this.elements.input) {
        setTimeout(function() {
          this.elements.input.focus();
        }.bind(this), 100);
      }
      
      // 如果数据未加载，开始加载
      if (!this.isLoaded && !this.isLoading) {
        this.preloadSearchData();
      }
    },

    // 关闭搜索
    closeSearch: function() {
      if (this.elements.mask) this.elements.mask.classList.remove('active');
      if (this.elements.modal) this.elements.modal.classList.remove('active');
      document.body.style.overflow = '';
    },

    // 清空输入
    clearInput: function() {
      if (this.elements.input) {
        this.elements.input.value = '';
        this.elements.input.focus();
      }
      this.showInit();
      this.currentIndex = -1;
    },

    // 是否打开状态
    isOpen: function() {
      return this.elements.modal && this.elements.modal.classList.contains('active');
    },

    // 显示初始状态
    showInit: function() {
      if (this.elements.results) {
        this.elements.results.innerHTML = `
          <div class="search-init">
            <i class="fas fa-search"></i>
            <p>输入关键词开始搜索</p>
          </div>
        `;
      }
      if (this.elements.stats) {
        this.elements.stats.textContent = '';
      }
    },

    // 显示加载状态
    showLoading: function() {
      if (this.elements.results) {
        this.elements.results.innerHTML = `
          <div class="search-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>加载中...</p>
          </div>
        `;
      }
    },

    // 显示错误
    showError: function() {
      if (this.elements.results) {
        this.elements.results.innerHTML = `
          <div class="search-error">
            <i class="fas fa-exclamation-circle"></i>
            <p>搜索数据加载失败，请刷新重试</p>
          </div>
        `;
      }
    },

    // 执行搜索
    doSearch: function(keyword) {
      keyword = keyword.trim().toLowerCase();
      
      // 空输入显示初始状态
      if (!keyword) {
        this.showInit();
        return;
      }
      
      // 数据正在加载中
      if (this.isLoading) {
        this.showLoading();
        return;
      }
      
      // 数据加载失败
      if (!this.searchData) {
        this.showError();
        return;
      }
      
      const keywords = keyword.split(/\s+/).filter(Boolean);
      const results = [];
      const self = this;
      
      this.searchData.forEach(function(item) {
        const titleLower = item.title.toLowerCase();
        const contentLower = item.content.toLowerCase();
        
        let matchAll = true;
        let titleMatch = false;
        let firstIndex = -1;
        
        for (let i = 0; i < keywords.length; i++) {
          const kw = keywords[i];
          const ti = titleLower.indexOf(kw);
          const ci = contentLower.indexOf(kw);
          
          if (ti === -1 && ci === -1) {
            matchAll = false;
            break;
          }
          
          if (ti !== -1) titleMatch = true;
          if (ci !== -1 && (firstIndex === -1 || ci < firstIndex)) {
            firstIndex = ci;
          }
        }
        
        if (matchAll) {
          results.push({
            title: item.title,
            url: item.url,
            content: item.content,
            titleMatch: titleMatch,
            firstIndex: firstIndex
          });
        }
      });
      
      // 标题匹配优先
      results.sort(function(a, b) {
        if (a.titleMatch && !b.titleMatch) return -1;
        if (!a.titleMatch && b.titleMatch) return 1;
        return 0;
      });
      
      this.renderResults(results, keywords);
    },

    // 渲染结果
    renderResults: function(results, keywords) {
      const self = this;
      this.currentIndex = -1;
      
      if (results.length === 0) {
        this.elements.results.innerHTML = `
          <div class="search-empty">
            <i class="fas fa-box-open"></i>
            <p>${this.config.emptyResult}</p>
          </div>
        `;
        this.elements.stats.textContent = '';
        return;
      }
      
      let html = '<ul class="search-list">';
      
      results.forEach(function(item, index) {
        const title = self.highlight(item.title, keywords);
        
        let preview = '';
        if (item.firstIndex !== -1) {
          const start = Math.max(0, item.firstIndex - 20);
          const end = Math.min(item.content.length, item.firstIndex + self.config.contentLength);
          preview = (start > 0 ? '...' : '') + 
                    item.content.substring(start, end) + 
                    (end < item.content.length ? '...' : '');
          preview = self.highlight(preview, keywords);
        } else {
          preview = item.content.substring(0, self.config.contentLength);
          if (item.content.length > self.config.contentLength) preview += '...';
        }
        
        html += `
          <li class="search-item" data-index="${index}">
            <a href="${item.url}" class="search-link">
              <div class="search-title">
                <i class="fas fa-file-alt"></i>
                <span>${title}</span>
              </div>
              <p class="search-preview">${preview}</p>
            </a>
          </li>
        `;
      });
      
      html += '</ul>';
      
      this.elements.results.innerHTML = html;
      this.elements.stats.innerHTML = `找到 <strong>${results.length}</strong> 个结果`;
      
      // 鼠标悬浮选中
      const items = this.elements.results.querySelectorAll('.search-item');
      items.forEach(function(item, index) {
        item.addEventListener('mouseenter', function() {
          self.setActive(index);
        });
      });
    },

    // 高亮关键词
    highlight: function(text, keywords) {
      let result = text;
      keywords.forEach(function(kw) {
        const regex = new RegExp('(' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        result = result.replace(regex, '<mark>$1</mark>');
      });
      return result;
    },

    // 导航结果
    navigateResults: function(direction) {
      const items = this.elements.results.querySelectorAll('.search-item');
      if (items.length === 0) return;
      
      let newIndex = this.currentIndex + direction;
      if (newIndex < 0) newIndex = items.length - 1;
      if (newIndex >= items.length) newIndex = 0;
      
      this.setActive(newIndex);
      items[newIndex].scrollIntoView({ block: 'nearest' });
    },

    // 设置激活项
    setActive: function(index) {
      const items = this.elements.results.querySelectorAll('.search-item');
      items.forEach(function(item, i) {
        item.classList.toggle('active', i === index);
      });
      this.currentIndex = index;
    },

    // 选择结果
    selectResult: function() {
      const items = this.elements.results.querySelectorAll('.search-item');
      if (this.currentIndex >= 0 && this.currentIndex < items.length) {
        const link = items[this.currentIndex].querySelector('a');
        if (link) window.location.href = link.href;
      }
    }
  };

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      LocalSearch.init();
    });
  } else {
    LocalSearch.init();
  }

  window.LocalSearch = LocalSearch;
})();