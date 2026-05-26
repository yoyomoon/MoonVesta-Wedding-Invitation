// Hero + Countdown + Details

function Hero({ heroStyle = 'photo' }) {
  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="hero-bg"></div>
      <div className="hero-inner">
        <div className="hero-tag">
          <span className="dot" />
          <span>A WEDDING INVITATION · 2026</span>
          <span className="dot" />
        </div>
        <div className="hero-title">
          <div className="hero-word">Moon</div>
          <div className="hero-heart">
            <svg viewBox="0 0 24 24" width="44" height="44"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 6.5 4c2 0 3.5 1.2 5.5 3.5C14 5.2 15.5 4 17.5 4 21 4 23.5 8 21.5 12 19 16.5 12 21 12 21z" fill="#a63f2a"/></svg>
          </div>
          <div className="hero-word">Vesta</div>
        </div>
        <div className="hero-sub">we're getting married</div>
        <div className="hero-cn">小倆口要結婚了！</div>

        {heroStyle === 'illustrated' ? (
          <img src="assets/logo_plum.png" className="hero-illus" alt="Moon Vesta 主視覺" />
        ) : (
          <div className="hero-photo">
            <div className="hp-frame">
              <img src="assets/wedding_05.jpg" alt="Moon &amp; Vesta 婚紗" />
              <div className="hp-tape hp-tape-tl"></div>
              <div className="hp-tape hp-tape-br"></div>
              <div className="hp-stamp">EST · 2026</div>
            </div>
            <div className="hp-caption">
              <span className="hp-caption-en">you, my favorite view.</span>
              <span className="hp-caption-cn">妳笑起來的樣子，是我這輩子最想收藏的風景。</span>
            </div>
          </div>
        )}

        <div className="hero-meta">
          <div className="meta-col">
            <div className="meta-k">DATE</div>
            <div className="meta-v">06 · 13 · 2026</div>
          </div>
          <div className="meta-div" />
          <div className="meta-col">
            <div className="meta-k">TIME</div>
            <div className="meta-v">12:00 開席</div>
          </div>
          <div className="meta-div" />
          <div className="meta-col">
            <div className="meta-k">VENUE</div>
            <div className="meta-v">川門子時尚餐廳</div>
          </div>
        </div>

        <div className="scroll-hint">
          <span>往下捲　慢慢看我們的故事</span>
          <svg width="14" height="22" viewBox="0 0 14 22"><rect x="1" y="1" width="12" height="20" rx="6" stroke="#5b3a22" strokeWidth="1.3" fill="none"/><circle cx="7" cy="7" r="1.6" fill="#5b3a22"><animate attributeName="cy" values="7;13;7" dur="1.8s" repeatCount="indefinite"/></circle></svg>
        </div>
      </div>
    </section>
  );
}

function Countdown() {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const diff = Math.max(0, WEDDING.targetDate.getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000) % 24;
  const m = Math.floor(diff / 60000) % 60;
  const s = Math.floor(diff / 1000) % 60;
  const cell = (n, l) => (
    <div className="cd-cell">
      <div className="cd-num">{String(n).padStart(2,'0')}</div>
      <div className="cd-lab">{l}</div>
    </div>
  );
  return (
    <section className="countdown" data-screen-label="02 Countdown">
      <div className="sec-head">
        <span className="sec-kicker">SAVE THE DATE</span>
        <h2 className="sec-title">距離開席，<span className="hl">倒數中</span></h2>
      </div>
      <div className="cd-grid">
        {cell(d,'DAYS')}{cell(h,'HRS')}{cell(m,'MIN')}{cell(s,'SEC')}
      </div>
      <div className="cd-foot">
        2026 · 06 · 13 &nbsp;·&nbsp; SAT &nbsp;·&nbsp; 12:00 開席
      </div>
    </section>
  );
}

function Details() {
  return (
    <section className="details" data-screen-label="03 Details">
      <div className="details-card">
        <div className="ornament top">
          <svg viewBox="0 0 120 20" width="120" height="20"><path d="M2 10 Q30 2 60 10 T118 10" stroke="#8b6f4e" strokeWidth="1" fill="none"/><circle cx="60" cy="10" r="3" fill="#a63f2a"/></svg>
        </div>
        <div className="chip">WEDDING DAY</div>
        <div className="big-date">
          <span className="bd-y">2026</span>
          <div className="bd-main">
            <span className="bd-d">13</span>
            <div className="bd-mw">
              <span>JUN</span>
              <span>SAT</span>
            </div>
          </div>
          <span className="bd-time">12:00 開席 · 11:30 入場</span>
        </div>

        <div className="detail-rows">
          <div className="drow">
            <div className="drow-k">地點 Venue</div>
            <div className="drow-v">
              <strong>川門子時尚餐廳</strong>
              <span>Chuan Men Tz Trendy Restaurant</span>
              <span className="dim">桃園市蘆竹區南竹路二段 156-2 號</span>
              <span className="dim">03-2124999 · 場地備有大型停車場</span>
            </div>
          </div>
          <div className="drow">
            <div className="drow-k">餐點 Menu</div>
            <div className="drow-v menu-v">
              <strong>一桌子的小心機 🤫</strong>
              <div className="menu-hints">
                <span className="mh">✦ 有一鍋湯白得像牛奶，喝起來卻不是牛奶，暖胃那種「欸？這裡面到底加了什麼」。</span>
                <span className="mh">✦ 有一道主菜名字霸氣到不行，吃下去反而很溫柔，完全反差萌。</span>
                <span className="mh">✦ 有一塊肉泡在紅酒裡待了整個下午，軟到阿嬤不用換牙。</span>
                <span className="mh">✦ 有一盤壓軸海味，中間坐著一位穿紅西裝的貴賓，全場目光都在牠身上。</span>
                <span className="mh">✦ 有一圈圓滾滾的朋友坐成一桌，你會想每一顆都試一下。</span>
                <span className="mh">✦ 最後的收尾，有冰、有甜、有拍照會發到限時動態的那種。</span>
              </div>
              <span className="dim">其他菜不爆雷，肚子空著來就對了 😋</span>
            </div>
          </div>

            <div className="drow">
            <div className="drow-k">酒水 Open Bar</div>
            <div className="drow-v">
              <strong>全場酒水暢飲 · 請盡情乾杯 🥂</strong>
              <span className="dim">若當天喝得夠醉又沒吐在桌上，歡迎找新郎報銷酒後代駕的帳。</span>
              <span className="dim note">※ 吐了的話，這條但書視為自動失效 😇</span>
            </div>
          </div>
        </div>

        <div className="actions">
          <a className="btn btn-primary" href="https://www.google.com/maps/search/?api=1&query=%E5%B7%9D%E9%96%80%E5%AD%90%E6%99%82%E5%B0%9A%E9%A4%90%E5%BB%B3%E6%A1%83%E5%9C%92%E8%98%86%E7%AB%B9" target="_blank" rel="noopener noreferrer" onClick={(e) => {
            e.preventDefault();
            const url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('川門子時尚餐廳 桃園市蘆竹區南竹路二段156-2號');
            const w = window.open(url, '_blank', 'noopener,noreferrer');
            if (!w) { try { window.top.location.href = url; } catch (err) { window.location.href = url; } }
          }}>打開地圖 →</a>
          <a className="btn btn-ghost" href="#fortune">抽一支婚禮籤 ✦</a>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, Countdown, Details });
