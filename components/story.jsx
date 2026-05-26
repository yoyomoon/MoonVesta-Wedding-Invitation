// Story + Gallery + Schedule + Pets

function Story() {
  const [idx, setIdx] = React.useState(0);
  return (
    <section className="story" data-screen-label="04 Story">
      <div className="sec-head light">
        <span className="sec-kicker">OUR STORY</span>
        <h2 className="sec-title">繞了一圈<br /><span className="cursive">還是妳</span></h2>
      </div>
      <div className="story-wrap">
        <div className="story-nav">
          {STORY.map((s, i) =>
          <button key={i} className={`story-year ${i === idx ? 'on' : ''}`} onClick={() => setIdx(i)}>
              <span className="ya">{s.year}</span>
              <span className="yb">{s.title}</span>
            </button>
          )}
        </div>
        <div className={`story-body ${STORY[idx].img ? 'has-img' : ''}`}>
          <div className="sb-year">{STORY[idx].year}</div>
          <div className="sb-title">{STORY[idx].title}</div>
          {STORY[idx].img && (
            <figure className="sb-figure">
              <div className="sb-photo">
                <img src={STORY[idx].img} alt={STORY[idx].imgCaption || STORY[idx].title} loading="lazy"/>
              </div>
              {STORY[idx].imgCaption && <figcaption className="sb-photo-cap">{STORY[idx].imgCaption}</figcaption>}
            </figure>
          )}
          <div className="sb-text">{STORY[idx].text}</div>
          <div className="sb-ctrl">
            <button onClick={() => setIdx((idx - 1 + STORY.length) % STORY.length)}>← 上一章</button>
            <span>{idx + 1} / {STORY.length}</span>
            <button onClick={() => setIdx((idx + 1) % STORY.length)}>下一章 →</button>
          </div>
        </div>
      </div>
    </section>);

}

function Gallery() {
  const imgs = ['wedding_01', 'wedding_02', 'wedding_03', 'wedding_04', 'wedding_05', 'wedding_06', 'wedding_08'];
  const captions = ['正式一點', '調皮一點', '牽起手', '回頭一笑', '捧花', '靜靜的', '在一起'];
  return (
    <section className="gallery" data-screen-label="05 Gallery">
      <div className="sec-head">
        <span className="sec-kicker">MOMENTS</span>
        <h2 className="sec-title">我們的小宇宙<br /><span className="cursive">Our little universe</span></h2>
      </div>
      <div className="gal-scroll">
        {imgs.map((n, i) =>
        <figure key={n} className="gal-card">
            <img src={`assets/${n}.jpg`} alt={captions[i]} loading="lazy" />
            <figcaption>
              <span className="gc-n">{String(i + 1).padStart(2, '0')}</span>
              <span>{captions[i]}</span>
            </figcaption>
          </figure>
        )}
      </div>
      <div className="gal-hint">← 左右滑動 ·  swipe →</div>
    </section>);

}

function Schedule() {
  return (
    <section className="schedule" data-screen-label="06 Schedule">
      <div className="sec-head">
        <span className="sec-kicker">RUN OF SHOW</span>
        <h2 className="sec-title">當天的流程</h2>
      </div>
      <div className="timeline">
        {SCHEDULE.map((s, i) =>
        <div key={i} className="tl-row">
            <div className="tl-time">{s.time}</div>
            <div className="tl-dot" />
            <div className="tl-body">
              <div className="tl-label">{s.label}</div>
              <div className="tl-hint">{s.hint}</div>
            </div>
          </div>
        )}
      </div>
    </section>);

}

function Pets() {
  const [quoteIdx, setQuoteIdx] = React.useState([0, 0]);
  const [hearts, setHearts] = React.useState([]);
  const hid = React.useRef(0);

  const nextQuote = (i) => {
    setQuoteIdx((prev) => {
      const next = [...prev];
      next[i] = (next[i] + 1) % PETS[i].quotes.length;
      return next;
    });
  };
  const pop = (e, color) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const burst = Array.from({ length: 5 }).map(() => {
      hid.current++;
      return {
        id: hid.current,
        x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 40,
        y: rect.top + rect.height / 2 + (Math.random() - 0.5) * 20,
        dx: (Math.random() - 0.5) * 80,
        dy: -60 - Math.random() * 40,
        color
      };
    });
    setHearts((h) => [...h, ...burst]);
    setTimeout(() => {
      setHearts((h) => h.filter((x) => !burst.find((b) => b.id === x.id)));
    }, 1200);
  };

  return (
    <section className="pets" data-screen-label="07 Pets">
      <div className="sec-head light">
        <span className="sec-kicker">THE PAWS CREW · 2 MEMBERS</span>
        <h2 className="sec-title">毛孩家族 歡迎列席</h2>
        <p className="sec-sub">因為場地限制，他們無法親自出席 🐾 但靈魂早已到場 👻<br /><span className="dim-i">點點他們的臉 🐱🐶 聽聽他們今天想說什麼 ✨</span></p>
      </div>

      <div className="pets-duo">
        {PETS.map((p, i) =>
        <div key={i} className={`pet-hero pet-hero-${i}`} style={{ '--acc': p.accent }}>
            <div className="ph-stack">
              <div className="ph-bg-shape" />
              <button
              className="ph-portrait"
              onClick={(e) => {nextQuote(i);pop(e, p.accent);}}
              aria-label={`與 ${p.name} 互動`}>
              
                <img src={p.img} alt={p.name} />
                <span className="ph-pin" />
                <span className="ph-tag">{p.title}</span>
              </button>
              <div className={`ph-bubble ph-bubble-${i}`} key={quoteIdx[i]}>
                <span>{p.quotes[quoteIdx[i]]}</span>
              </div>
            </div>
            <div className="ph-info">
              <div className="ph-name-row">
                <span className="ph-name">{p.name}</span>
                <span className="ph-role">{p.role}</span>
              </div>
              <div className="ph-tags">
                {p.tags.map((t, j) => <span key={j} className="ph-chip">{t}</span>)}
              </div>
              <p className="ph-desc">{p.desc}</p>
              <button className="ph-heart-btn" onClick={(e) => pop(e, p.accent)}>
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 6.5 4c2 0 3.5 1.2 5.5 3.5C14 5.2 15.5 4 17.5 4 21 4 23.5 8 21.5 12 19 16.5 12 21 12 21z" fill="currentColor" /></svg>
                <span>送一顆愛心給 {p.name}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="ph-footnote">
        <span>✦</span>
        <span>嚕咪和多多沒辦法親自到場，但會在家幫大家加油（順便把沙發弄亂）。</span>
        <span>✦</span>
      </div>

      <div className="ph-hearts-layer">
        {hearts.map((h) =>
        <span key={h.id} className="ph-fly-heart" style={{
          left: h.x + 'px', top: h.y + 'px',
          '--dx': h.dx + 'px', '--dy': h.dy + 'px',
          color: h.color
        }}>
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 6.5 4c2 0 3.5 1.2 5.5 3.5C14 5.2 15.5 4 17.5 4 21 4 23.5 8 21.5 12 19 16.5 12 21 12 21z" fill="currentColor" /></svg>
          </span>
        )}
      </div>
    </section>);

}

Object.assign(window, { Story, Gallery, Schedule, Pets });