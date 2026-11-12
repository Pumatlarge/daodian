(function (root, factory) {
  const themes = factory();
  if (typeof module === 'object' && module.exports) module.exports = themes;
  else root.THEMES = themes;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return [
    {
      id: 'cream',
      name: '奶油手账',
      layout: 'bar',
      desc: '纸感暖色，白天久看不累',
      accent: '#d18957',
      radius: 16,
      swatch: ['#fbf4e6', '#d18957', '#3f6b52'],
      mood: 'light'
    },
    {
      id: 'neon',
      name: '赛博霓虹',
      layout: 'bar',
      desc: '深色桌面的科技感，夜班气质',
      accent: '#00e5ff',
      radius: 8,
      swatch: ['#05070e', '#00e5ff', '#ff2fd0'],
      mood: 'dark'
    },
    {
      id: 'pixel',
      name: '像素打工人',
      layout: 'bar',
      mascot: 'pixel',
      desc: '8-bit 游戏味，小人陪你上班',
      accent: '#6ee787',
      radius: 0,
      swatch: ['#11151c', '#6ee787', '#4d9fff'],
      mood: 'dark'
    },
    {
      id: 'jar',
      name: '玻璃存钱罐',
      layout: 'jar',
      desc: '金币看得见地涨，最有存钱感',
      accent: '#e0a53c',
      radius: 20,
      swatch: ['#fffaf0', '#f6c65c', '#8a5a1f'],
      mood: 'light'
    },
    {
      id: 'receipt',
      name: '复古工资条',
      layout: 'receipt',
      desc: '把工资单做成梗，细节最多',
      accent: '#b94335',
      radius: 4,
      swatch: ['#fcfaf3', '#4b4438', '#b94335'],
      mood: 'light'
    },
    {
      id: 'cat',
      name: '猫咪陪伴',
      layout: 'bar',
      mascot: 'cat',
      desc: '软萌治愈，猫替你熬着',
      accent: '#b9a3ff',
      radius: 22,
      swatch: ['#fff8fb', '#ffb3c8', '#8f74b8'],
      mood: 'light'
    }
  ];
});
