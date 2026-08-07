<?php
declare(strict_types=1);

$aboutCssFile = __DIR__ . '/about.css';
?>
<link rel="stylesheet" href="../../view/about_us/about/about.css?v=<?= is_file($aboutCssFile) ? filemtime($aboutCssFile) : time() ?>">

<main class="about-main" id="main-content">
  <section class="about-hero" aria-labelledby="about-title">
    <div class="about-hero__copy">
      <p class="about-eyebrow"><span aria-hidden="true"></span> About PromoFlow</p>
      <h1 id="about-title">Big brand moments.<br><em>Less busywork.</em></h1>
      <p class="about-hero__lead">We make it easier to turn a good idea into promotional products people actually want to keep. One clear process, thoughtful products, and real support from start to finish.</p>

      <div class="about-hero__actions">
        <a class="about-button about-button--primary" href="../../view/product/index.php">
          Explore products
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </a>
        <a class="about-button about-button--text" href="#values">What matters to us <span aria-hidden="true">↓</span></a>
      </div>
    </div>

    <div class="about-hero__visual" aria-label="PromoFlow turns ideas into memorable branded products">
      <span class="about-hero__orb about-hero__orb--one" aria-hidden="true"></span>
      <span class="about-hero__orb about-hero__orb--two" aria-hidden="true"></span>

      <div class="about-brand-card">
        <span class="about-brand-card__mark"><i>.</i>63</span>
        <p>Ideas in.</p>
        <strong>Brand moments out.</strong>
        <span class="about-brand-card__line" aria-hidden="true"></span>
      </div>

      <div class="about-float-card about-float-card--top">
        <span aria-hidden="true">✦</span>
        <div><small>Our promise</small><strong>Clear at every step</strong></div>
      </div>

      <div class="about-float-card about-float-card--bottom">
        <span class="about-float-card__check" aria-hidden="true">✓</span>
        <div><small>From first idea</small><strong>To final delivery</strong></div>
      </div>
    </div>
  </section>

  <section class="about-principles" aria-label="How PromoFlow works">
    <article>
      <span>01</span>
      <div><h2>Curated, not crowded</h2><p>Useful products selected to make choosing feel simple.</p></div>
    </article>
    <article>
      <span>02</span>
      <div><h2>Clarity built in</h2><p>Straight answers and a process you can follow.</p></div>
    </article>
    <article>
      <span>03</span>
      <div><h2>Human support</h2><p>Real help when you need it, without the runaround.</p></div>
    </article>
  </section>

  <section class="about-values" id="values" aria-labelledby="values-title">
    <div class="about-section-heading">
      <div>
        <p class="about-eyebrow about-eyebrow--dark"><span aria-hidden="true"></span> What guides us</p>
        <h2 id="values-title">Simple is a standard,<br>not a shortcut.</h2>
      </div>
      <p>Every choice we make should remove friction, build confidence, and help your brand show up at its best.</p>
    </div>

    <div class="about-values__grid">
      <article class="about-value-card about-value-card--orange">
        <span class="about-value-card__icon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="M16 3 4 9v7c0 7.5 5 11.5 12 13 7-1.5 12-5.5 12-13V9L16 3Z"/><path d="m10.5 16 3.5 3.5 7.5-8"/></svg>
        </span>
        <span class="about-value-card__number">01</span>
        <h3>Quality you can feel</h3>
        <p>We favor products that are useful, well made, and worthy of carrying your name.</p>
      </article>

      <article class="about-value-card about-value-card--blue">
        <span class="about-value-card__icon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="M5 16h22M16 5v22"/><circle cx="16" cy="16" r="12"/></svg>
        </span>
        <span class="about-value-card__number">02</span>
        <h3>Progress without pressure</h3>
        <p>Good decisions come from clear options, honest guidance, and room to get the details right.</p>
      </article>

      <article class="about-value-card about-value-card--mint">
        <span class="about-value-card__icon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="M8 18c0-7 5-12 16-13 0 11-5 16-12 16"/><path d="M6 27c2-8 7-13 16-17"/></svg>
        </span>
        <span class="about-value-card__number">03</span>
        <h3>Impact that lasts</h3>
        <p>We look for smarter choices and lasting usefulness, not things that are quickly forgotten.</p>
      </article>
    </div>
  </section>

  <section class="about-story" aria-labelledby="story-title">
    <div class="about-story__copy">
      <p class="about-eyebrow"><span aria-hidden="true"></span> Why PromoFlow</p>
      <h2 id="story-title">The best promotional work should feel effortless.</h2>
      <p>PromoFlow brings product discovery, customization, and order details into one more thoughtful experience. You stay focused on the idea; we keep the process moving.</p>
      <a href="../../view/product/index.php">Find your next product <span aria-hidden="true">↗</span></a>
    </div>

    <ol class="about-process">
      <li>
        <span>1</span>
        <div><strong>Start with what you need</strong><p>Browse practical options for events, teams, clients, and campaigns.</p></div>
      </li>
      <li>
        <span>2</span>
        <div><strong>Shape the details</strong><p>Choose the product, quantity, and customization that fit your idea.</p></div>
      </li>
      <li>
        <span>3</span>
        <div><strong>Move forward confidently</strong><p>Keep the important information clear from selection through delivery.</p></div>
      </li>
    </ol>
  </section>

  <section class="about-cta" aria-labelledby="about-cta-title">
    <div>
      <p class="about-eyebrow"><span aria-hidden="true"></span> Your next idea starts here</p>
      <h2 id="about-cta-title">Make something<br>worth remembering.</h2>
    </div>
    <a class="about-button about-button--light" href="../../view/product/index.php">Browse products <span aria-hidden="true">→</span></a>
  </section>
</main>

<footer class="about-footer">
  <a href="../../view/main/index.php" class="about-footer__brand"><span>.</span>63 <small>PromoFlow</small></a>
  <p>Promotional products, made refreshingly simple.</p>
  <p>&copy; <?= date('Y') ?> PromoFlow</p>
</footer>
