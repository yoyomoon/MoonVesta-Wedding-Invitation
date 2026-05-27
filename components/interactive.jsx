// Fortune (抽籤) + HeartCatch game + RSVP + FAQ + Footer

function Fortune() {
  const [state, setState] = React.useState('idle'); // idle | shaking | drawn
  const [f, setF] = React.useState(null);
  const [shakes, setShakes] = React.useState(0);
  const draw = () => {
    setState('shaking');
    let c = 0;
    const it = setInterval(() => {
      c++; setShakes(c);
      if (c >= 6) { clearInterval(it); setF(drawFortune()); setState('drawn'); }
    }, 180);
  };
  const reset = () => { setState('idle'); setF(null); setShakes(0); };
  const tierColor = {
    '大吉': '#a63f2a', '中吉': '#8b6f4e', '吉': '#6d4e35', '平': '#5b3a22', '小兇': '#4a3728',
  };
  return (
    <section className="fortune" id="fortune" data-screen-label="08 Fortune">
      <div className="sec-head light">
        <span className="sec-kicker">WEDDING UNIVERSE ORACLE</span>
        <h2 className="sec-title">婚禮宇宙抽籤機</h2>
        <p className="sec-sub">搖一搖，抽一支今夜限定的婚禮籤詩。<br/>24 支籤，寫的都是好話（有時候有點小兇，但其實也是好話）。</p>
      </div>

      <div className="fortune-stage">
        {state !== 'drawn' && (
          <div className={`fortune-box ${state==='shaking'?'shake':''}`} onClick={state==='idle'?draw:undefined}>
            <div className="fb-face">
              <div className="fb-top">婚禮宇宙</div>
              <div className="fb-mid">抽 籤</div>
              <div className="fb-bot">SHAKE ME</div>
              <div className="fb-stars">✦ ✧ ✦</div>
            </div>
            <div className="fb-hint">{state==='idle'?'點我搖籤筒':'搖啊搖…'+('·'.repeat(shakes))}</div>
          </div>
        )}

        {state === 'drawn' && f && (
          <div className="fortune-card" style={{'--tier-c': tierColor[f.tier]}}>
            <div className="fc-tier">{f.tier}</div>
            <div className="fc-title">{f.title}</div>
            <div className="fc-poem">
              {f.poem.map((l,i) => <div key={i}>{l}</div>)}
            </div>
            <div className="fc-divider">· 解 籤 ·</div>
            <div className="fc-read">{f.read}</div>
            <div className="fc-foot">Moon ♡ Vesta · Wedding Universe</div>
            <div className="fc-ctrl">
              <button onClick={reset}>再抽一支</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function _HeartGame_removed() {
  const [playing, setPlaying] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(5);
  const [hearts, setHearts] = React.useState([]);
  const [best, setBest] = React.useState(() => Number(localStorage.getItem('heart-best') || 0));
  const hid = React.useRef(0);

  React.useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setTimeLeft(t => t - 0.1), 100);
    const spawn = setInterval(() => {
      hid.current++;
      const h = { id: hid.current, x: Math.random()*85+5, delay: Math.random()*0.3 };
      setHearts(arr => [...arr, h]);
      setTimeout(() => setHearts(arr => arr.filter(x => x.id !== h.id)), 2500);
    }, 320);
    return () => { clearInterval(timer); clearInterval(spawn); };
  }, [playing]);

  React.useEffect(() => {
    if (playing && timeLeft <= 0) {
      setPlaying(false);
      setHearts([]);
      if (score > best) { setBest(score); localStorage.setItem('heart-best', score); }
    }
  }, [timeLeft, playing]);

  const start = () => { setScore(0); setTimeLeft(5); setHearts([]); setPlaying(true); };
  const catchHeart = (id) => {
    setHearts(arr => arr.filter(h => h.id !== id));
    setScore(s => s + 1);
  };

  return (
    <section className="game" data-screen-label="09 Game">
      <div className="sec-head">
        <span className="sec-kicker">MINI GAME · 5 SECONDS</span>
        <h2 className="sec-title">五秒愛心快接</h2>
        <p className="sec-sub">五秒內接到越多愛心，代表祝福越多。<br/>超過 15 顆可以向新娘討一杯梅酒（誤）。</p>
      </div>
      <div className="game-arena">
        <div className="game-ui">
          <div className="gu-box"><span className="gu-k">SCORE</span><span className="gu-v">{score}</span></div>
          <div className="gu-box"><span className="gu-k">TIME</span><span className="gu-v">{Math.max(0, timeLeft).toFixed(1)}</span></div>
          <div className="gu-box"><span className="gu-k">BEST</span><span className="gu-v">{best}</span></div>
        </div>
        <div className="game-field">
          {!playing && timeLeft > 0 && score === 0 && (
            <button className="game-start" onClick={start}>點擊開始 ▶</button>
          )}
          {!playing && timeLeft <= 0 && (
            <div className="game-over">
              <div className="go-title">時間到！</div>
              <div className="go-score">你接到了 <strong>{score}</strong> 顆愛心</div>
              <div className="go-msg">
                {score >= 15 ? '你可以向新娘索取一杯梅酒 🍶'
                : score >= 8 ? '不錯喔，恭喜你拿到一份祝福 ✨'
                : score >= 3 ? '有心最重要，一顆也是祝福 💌'
                : '⋯再來一次吧！先別放棄 🫶'}
              </div>
              <button className="game-start" onClick={start}>再玩一次</button>
            </div>
          )}
          {hearts.map(h => (
            <button key={h.id} className="flying-heart" style={{left:`${h.x}%`, animationDelay:`${h.delay}s`}} onClick={() => catchHeart(h.id)}>
              <svg viewBox="0 0 24 24" width="36" height="36"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 6.5 4c2 0 3.5 1.2 5.5 3.5C14 5.2 15.5 4 17.5 4 21 4 23.5 8 21.5 12 19 16.5 12 21 12 21z" fill="#a63f2a"/></svg>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function _RSVP_removed() {
  const [form, setForm] = React.useState({ name:'', attend:'yes', count:1, side:'新郎', meal:'無限制', msg:'' });
  const [sent, setSent] = React.useState(false);
  const upd = (k,v) => setForm(f => ({...f, [k]:v}));
  const submit = (e) => { e.preventDefault(); setSent(true); };
  return (
    <section className="rsvp" id="rsvp" data-screen-label="10 RSVP">
      <div className="sec-head light">
        <span className="sec-kicker">R · S · V · P</span>
        <h2 className="sec-title">回覆出席</h2>
        <p className="sec-sub">請於 2026 · 05 · 13 前告訴我們。<br/>人數確認後，我們會貼心幫你安排座位與餐點。</p>
      </div>

      {!sent ? (
        <form className="rsvp-form" onSubmit={submit}>
          <label className="rf-row">
            <span className="rf-k">您的大名 Name</span>
            <input required value={form.name} onChange={e=>upd('name',e.target.value)} placeholder="例：黃小明"/>
          </label>

          <div className="rf-row">
            <span className="rf-k">能來嗎？</span>
            <div className="rf-radio">
              {[['yes','一定到 ✿'],['maybe','還在喬 ⋯'],['no','沒辦法 😢']].map(([v,l]) => (
                <button key={v} type="button" className={form.attend===v?'on':''} onClick={()=>upd('attend',v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="rf-row">
            <span className="rf-k">新郎 / 新娘方</span>
            <div className="rf-radio">
              {['新郎','新娘','兩邊都熟'].map(v => (
                <button key={v} type="button" className={form.side===v?'on':''} onClick={()=>upd('side',v)}>{v}</button>
              ))}
            </div>
          </div>

          <label className="rf-row">
            <span className="rf-k">同行人數（含自己）</span>
            <div className="rf-stepper">
              <button type="button" onClick={()=>upd('count',Math.max(1,form.count-1))}>−</button>
              <span>{form.count} 人</span>
              <button type="button" onClick={()=>upd('count',form.count+1)}>+</button>
            </div>
          </label>

          <div className="rf-row">
            <span className="rf-k">飲食需求</span>
            <div className="rf-radio">
              {['無限制','素食','無牛','過敏（另述）'].map(v => (
                <button key={v} type="button" className={form.meal===v?'on':''} onClick={()=>upd('meal',v)}>{v}</button>
              ))}
            </div>
          </div>

          <label className="rf-row">
            <span className="rf-k">給新人的悄悄話</span>
            <textarea rows="3" value={form.msg} onChange={e=>upd('msg',e.target.value)} placeholder="想祝福／要點歌／過敏備註⋯"/>
          </label>

          <button type="submit" className="btn btn-primary btn-full">送出祝福 →</button>
        </form>
      ) : (
        <div className="rsvp-done">
          <div className="rd-icon">✿</div>
          <div className="rd-title">收到了，謝謝 {form.name}！</div>
          <div className="rd-sub">6 月 13 日，我們川門子見。<br/>記得穿上你最好看的棕色。</div>
        </div>
      )}
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = React.useState(-1);
  return (
    <section className="faq" data-screen-label="11 FAQ">
      <div className="sec-head">
        <span className="sec-kicker">BEFORE YOU ASK</span>
        <h2 className="sec-title">常見問題</h2>
      </div>
      <div className="faq-list">
        {FAQ.map((f,i) => (
          <div key={i} className={`faq-item ${open===i?'on':''}`}>
            <button className="faq-q" onClick={() => setOpen(open===i?-1:i)}>
              <span>Q. {f.q}</span>
              <span className="faq-mark">{open===i?'×':'+'}</span>
            </button>
            {open===i && <div className="faq-a">A. {f.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot" data-screen-label="12 Footer">
      <div className="foot-center">
        <div className="foot-illus illus-art">
          <img src="assets/wedding_illus.png" alt="Moon Vesta"/>
        </div>
        <div className="foot-big">HAPPY WIFE<br/>HAPPY LIFE</div>
        <div className="foot-sub">一貓兩人三餐四季　平淡是真</div>
        <div className="foot-line">Moon ♡ Vesta · Umeshu Est. 2026</div>
        <div className="foot-meta">
          <span>made with 🤎</span>
          <span>·</span>
          <span>桃園蘆竹</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Fortune, FAQSection, Footer });
