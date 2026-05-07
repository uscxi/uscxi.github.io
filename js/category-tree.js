// themes/uscxi/source/js/category-tree.js

/**
 * 分类树展开/收起功能
 */

(function() {
  'use strict';

  const CategoryTree = {
    init: function() {
      const toggleButtons = document.querySelectorAll('.category-toggle');
      
      if (toggleButtons.length === 0) return;
      
      toggleButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const item = this.closest('.category-tree-item');
          if (!item) return;
          
          CategoryTree.toggleItem(item);
        });
      });
      
      // console.log('CategoryTree Initialized');
    },

    toggleItem: function(item) {
      const isExpanded = item.classList.contains('expanded');
      
      if (isExpanded) {
        // 收起
        item.classList.remove('expanded');
        const children = item.querySelector('.category-children');
        if (children) {
          this.slideUp(children);
        }
      } else {
        // 展开
        item.classList.add('expanded');
        const children = item.querySelector('.category-children');
        if (children) {
          this.slideDown(children);
        }
      }
    },

    slideDown: function(element) {
      element.style.display = 'block';
      const height = element.scrollHeight;
      element.style.height = '0';
      element.style.overflow = 'hidden';
      element.style.transition = 'height 0.3s ease';
      
      requestAnimationFrame(function() {
        element.style.height = height + 'px';
      });
      
      setTimeout(function() {
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
      }, 300);
    },

    slideUp: function(element) {
      const height = element.scrollHeight;
      element.style.height = height + 'px';
      element.style.overflow = 'hidden';
      element.style.transition = 'height 0.3s ease';
      
      requestAnimationFrame(function() {
        element.style.height = '0';
      });
      
      setTimeout(function() {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
      }, 300);
    }
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      CategoryTree.init();
    });
  } else {
    CategoryTree.init();
  }

  window.CategoryTree = CategoryTree;
})();