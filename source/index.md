---
title: 凌云 · 独立开发者
date: 2026-06-01 12:00:00
layout: false
description: 凌云的个人作品集——Web 应用、数据可视化与工具链。
top_img: false
aside: false
comment: false
---
<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>凌云 · 独立开发者</title>
<meta name="description" content="凌云的个人作品集——Web 应用、数据可视化与工具链。">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/home.css">
</head>
<body>
<a href="#main" class="skip">跳到主内容</a>

<!-- 右侧竖排边栏 -->
<aside class="rail" aria-label="侧边导航">
  <span class="b">Contact · 联系</span>
  <span class="ico" id="themeBtn" role="button" tabindex="0" aria-label="切换明暗主题" title="切换主题">◐</span>
  <a class="ico" href="https://github.com/LingyunAce" aria-label="GitHub">⌬</a>
  <span class="b b2">GitHub · About</span>
</aside>

<header class="nav"><div class="wrap">
  <a href="/" class="brand" aria-label="凌云 首页">凌云<span class="bars" aria-hidden="true"><i></i><i></i></span></a>
  <button class="burger" id="menuBtn" aria-label="打开菜单" aria-expanded="false"><i></i><i></i></button>
</div></header>

<!-- 全屏菜单 -->
<nav class="menu" id="menu" aria-label="主菜单">
  <a href="/projects/">作品 <small>Projects</small></a>
  <a href="/archives/">文字 <small>Writing</small></a>
  <a href="/about/">关于 <small>About</small></a>
  <a href="https://github.com/LingyunAce">GitHub <small>External</small></a>
  <a href="mailto:543491395@qq.com">联系 <small>Email</small></a>
</nav>

<main id="main">
  <!-- HERO -->
  <section class="hero"><div class="wrap hero-grid">
    <div class="hero-l">
      <div class="hero-img-l" aria-hidden="true">
        <span class="cap">REF — <b>01</b> · 凌云</span>
        <div class="obj"><span class="glyph">凌<b>云</b></span></div>
      </div>
    </div>
    <div class="hero-r">
      <div class="hero-img-r" aria-hidden="true">
        <div class="obj"><span class="glyph">独立开发者<small>since 2020</small></span></div>
      </div>
      <h1>
        <span class="ln">把复杂的问题，</span>
        <span class="ln">做成简单的</span>
        <span class="ln">产品与文字。</span>
      </h1>
      <p class="lead">Web 应用、数据可视化、工具链——远程工作，用现代技术栈解决真实问题，并把思考留在这里。</p>
      <a class="cta-link" href="/projects/">查看作品</a>
    </div>
  </div></section>

  <!-- 作品 -->
  <section class="sec" id="works"><div class="wrap">
    <div class="sec-head"><h2>精选作品</h2><a href="/projects/">查看全部 →</a></div>
    <div class="grid">
      <a class="card" href="https://github.com/LingyunAce/ecommerce-refactor">
        <div class="shot"><span class="lbl">电商重构</span></div>
        <div class="meta"><h3>电商前端重构</h3><span class="cat">2025</span></div>
        <p class="desc">React + TypeScript 重构，加载速度提升 30%。</p>
        <div class="tags"><span>React</span><span>TypeScript</span><span>Vite</span></div>
      </a>
      <a class="card" href="https://github.com/LingyunAce/data-dashboard">
        <div class="shot"><span class="lbl">数据看板</span></div>
        <div class="meta"><h3>自动化数据看板</h3><span class="cat">2025</span></div>
        <p class="desc">Python + ECharts 实时可视化，多数据源接入。</p>
        <div class="tags"><span>Python</span><span>ECharts</span><span>FastAPI</span></div>
      </a>
      <a class="card" href="https://github.com/LingyunAce/expense-tracker">
        <div class="shot"><span class="lbl">记账 App</span></div>
        <div class="meta"><h3>移动端记账 App</h3><span class="cat">2024</span></div>
        <p class="desc">React Native 跨平台，离线记账与云同步。</p>
        <div class="tags"><span>React Native</span><span>SQLite</span></div>
      </a>
      <a class="card" href="https://github.com/LingyunAce/go-cli-toolkit">
        <div class="shot"><span class="lbl">CLI 工具箱</span></div>
        <div class="meta"><h3>开源 CLI 工具箱</h3><span class="cat">2024</span></div>
        <p class="desc">Go 编写，批量处理文件与环境配置。</p>
        <div class="tags"><span>Go</span><span>CLI</span></div>
      </a>
    </div>
  </div></section>

  <!-- 写作 -->
  <section class="sec" id="writing"><div class="wrap">
    <div class="sec-head"><h2>近期文字</h2><a href="/archives/">全部文章 →</a></div>
    <div class="posts">
      <a class="post" href="/archives/">
        <span class="d">06.18</span>
        <div><h3>用数据看板治好了我的焦虑</h3><p>把分散的指标收拢到一个面板后，决策反而变慢了。</p></div>
        <span class="r">随笔 →</span>
      </a>
      <a class="post" href="/archives/">
        <span class="d">05.30</span>
        <div><h3>React 重构里那些没人告诉你的坑</h3><p>加载速度提升 30% 的背后，是七个被低估的渲染细节。</p></div>
        <span class="r">工程 →</span>
      </a>
      <a class="post" href="/archives/">
        <span class="d">05.12</span>
        <div><h3>我如何远程工作而不被时区吞掉</h3><p>一套属于自己的节奏管理，比任何效率工具都重要。</p></div>
        <span class="r">生活 →</span>
      </a>
    </div>
  </div></section>

  <!-- 关于 -->
  <section class="about" id="about"><div class="wrap about">
    <div class="ph" aria-hidden="true">凌</div>
    <div>
      <h2>关于我</h2>
      <p>我是凌云，一名独立开发者。比起"全栈"这个被用滥的词，我更愿意说自己是个"把问题想清楚再动手"的人——无论是产品、系统，还是一篇能让人读下去的文章。</p>
      <p>如果你有项目想合作，或者只是想聊聊技术，随时联系。</p>
      <a class="cta-link" href="mailto:543491395@qq.com">联系我</a>
    </div>
  </div></section>
</main>

<footer class="footer"><div class="wrap">
  <span class="copy">© 2026 凌云 · 以 Inter Tight & Noto Sans SC 排印</span>
  <nav class="soc" aria-label="社交链接">
    <a href="https://github.com/LingyunAce">GitHub</a>
    <a href="mailto:543491395@qq.com">邮箱</a>
    <a href="/archives/">归档</a>
  </nav>
</div></footer>

<script>
(function(){
  var r=document.documentElement;
  var saved=localStorage.getItem('ly-theme');
  if(!saved){saved=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  if(saved)r.setAttribute('data-theme',saved);
  var tb=document.getElementById('themeBtn');
  if(tb){
    tb.textContent=saved==='dark'?'◑':'◐';
    var toggle=function(){var n=r.getAttribute('data-theme')==='dark'?'light':'dark';r.setAttribute('data-theme',n);localStorage.setItem('ly-theme',n);tb.textContent=n==='dark'?'◑':'◐';};
    tb.addEventListener('click',toggle);
    tb.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
  }
  var mb=document.getElementById('menuBtn'),menu=document.getElementById('menu');
  if(mb&&menu){
    mb.addEventListener('click',function(){
      var open=menu.classList.toggle('is-open');
      mb.classList.toggle('is-open',open);
      mb.setAttribute('aria-expanded',open?'true':'false');
    });
    menu.addEventListener('click',function(e){if(e.target.tagName==='A'){menu.classList.remove('is-open');mb.classList.remove('is-open');mb.setAttribute('aria-expanded','false');}});
  }
})();
</script>
</body>
</html>
