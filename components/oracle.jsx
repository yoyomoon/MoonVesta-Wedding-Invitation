// Oracle · 東西合璧占卜器
// Combines: 時辰 + 日干支 + 梅花易數起卦 + 方位 + 塔羅 + 數秘 + 幸運色 + 原始籤詩

const PRESETS = [
  { ic: '✦', q: '我今晚會帶走什麼？' },
  { ic: '❀', q: '這段感情的走向？' },
  { ic: '☯', q: '我近期的事業運？' },
  { ic: '✿', q: '下一步該往哪走？' },
  { ic: '♡', q: '我該不該開口？' },
  { ic: '◐', q: '我與家人的緣分？' },
  { ic: '✧', q: '心裡那個結，能否化開？' },
  { ic: '※', q: '心中那件事會成嗎？' },
];

// 朝向 → 8 點方位 index (0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW)
function headingToDirIdx(deg) {
  const n = ((deg % 360) + 360) % 360;
  return Math.round(n / 45) % 8;
}

function Oracle() {
  const [step, setStep] = React.useState('setup'); // setup | casting | result
  const [now, setNow] = React.useState(new Date());
  const [dirIdx, setDirIdx] = React.useState(null);
  const [question, setQuestion] = React.useState('');
  const [glossOpen, setGlossOpen] = React.useState(false);
  const sectionRef = React.useRef(null);
  const sensorRef = React.useRef(null);
  const [result, setResult] = React.useState(null);
  const [heading, setHeading] = React.useState(null); // live compass reading, 0-360
  const [compassMode, setCompassMode] = React.useState('manual'); // manual | asking | live | denied | unsupported
  const handlerRef = React.useRef(null);

  // 每日 3 卦上限 + 2nd→3rd 需間隔 60 分鐘
  const STORAGE_KEY = 'oracle_casts';
  const DAILY_LIMIT = 3;
  const GATE_BETWEEN_2_3_MS = 60 * 60 * 1000; // 1 hour

  const [castHistory, setCastHistory] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map(t => new Date(t)).filter(d => !Number.isNaN(d.getTime()));
    } catch (e) { return []; }
  });

  // 只算今天（local time 的 yyyy-mm-dd 相同）
  const todayCasts = castHistory.filter(d =>
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth() &&
    d.getDate()     === now.getDate()
  );
  const remainingToday = Math.max(0, DAILY_LIMIT - todayCasts.length);
  const lastTodayCast = todayCasts.length > 0 ? todayCasts[todayCasts.length - 1] : null;
  // 第 2 次卜完，第 3 次要等一小時
  const gateOpenAt = (todayCasts.length === 2 && lastTodayCast)
    ? new Date(lastTodayCast.getTime() + GATE_BETWEEN_2_3_MS)
    : null;
  const msUntilGateOpens = gateOpenAt ? gateOpenAt.getTime() - now.getTime() : 0;
  const isGated = gateOpenAt !== null && msUntilGateOpens > 0;
  const canCast = remainingToday > 0 && !isGated;

  const fmtCountdown = (ms) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m} 分 ${String(s).padStart(2, '0')} 秒`;
  };

  // live clock in setup（同時驅動 gate 倒數刷新）
  React.useEffect(() => {
    if (step !== 'setup') return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [step]);

  // cleanup orientation listener / sensor on unmount
  React.useEffect(() => {
    return () => {
      if (handlerRef.current) {
        window.removeEventListener('deviceorientation', handlerRef.current);
        window.removeEventListener('deviceorientationabsolute', handlerRef.current);
        handlerRef.current = null;
      }
      if (sensorRef.current) {
        try { sensorRef.current.stop(); } catch (e) {}
        sensorRef.current = null;
      }
    };
  }, []);

  // quaternion → compass heading (0=N, 90=E, 180=S, 270=W)
  // q = [x, y, z, w] from AbsoluteOrientationSensor (Earth/NED-like reference)
  const quatToHeading = (q) => {
    const [x, y, z, w] = q;
    // yaw (z-axis rotation), Tait-Bryan ZYX convention
    const yaw = Math.atan2(2*(w*z + x*y), 1 - 2*(y*y + z*z));
    // yaw is CCW from East in radians → compass CW from North in degrees
    let heading = ((90 - yaw * 180 / Math.PI) % 360 + 360) % 360;
    return heading;
  };

  // Try Generic Sensor API first (modern Android Chrome)
  const tryGenericSensor = async () => {
    if (typeof window.AbsoluteOrientationSensor === 'undefined') return false;
    try {
      // ask for permissions if Permissions API exists
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const [acc, mag] = await Promise.all([
            navigator.permissions.query({ name: 'accelerometer' }).catch(() => ({ state: 'granted' })),
            navigator.permissions.query({ name: 'magnetometer' }).catch(() => ({ state: 'granted' })),
          ]);
          if (acc.state === 'denied' || mag.state === 'denied') return false;
        } catch (e) {
          // some browsers throw for unsupported names — proceed anyway
        }
      }
      const sensor = new window.AbsoluteOrientationSensor({ frequency: 10, referenceFrame: 'device' });
      sensor.addEventListener('reading', () => {
        const q = sensor.quaternion;
        if (!q) return;
        const h = quatToHeading(q);
        if (!Number.isNaN(h)) {
          setHeading(h);
          setDirIdx(headingToDirIdx(h));
          setCompassMode('live');
        }
      });
      sensor.addEventListener('error', (e) => {
        // SecurityError (no permission) or NotReadableError → fall through, caller may try fallback
        sensorRef.current = null;
      });
      sensor.start();
      sensorRef.current = sensor;
      return true;
    } catch (e) {
      sensorRef.current = null;
      return false;
    }
  };

  // Legacy DeviceOrientationEvent path (iOS + most Androids)
  const tryDeviceOrientation = async () => {
    if (typeof DeviceOrientationEvent === 'undefined') return false;

    // iOS 13+ permission gate (must be inside user gesture)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') { setCompassMode('denied'); return true; /* handled */ }
      } catch (e) {
        setCompassMode('denied');
        return true;
      }
    }

    const onOrient = (e) => {
      let h = null;
      if (typeof e.webkitCompassHeading === 'number') {
        // iOS Safari: true-north heading 0-360, most reliable
        h = e.webkitCompassHeading;
      } else if (e.absolute && typeof e.alpha === 'number') {
        // Android with absolute frame: alpha is magnetic-north reference
        h = (360 - e.alpha) % 360;
      } else if (typeof e.alpha === 'number') {
        // Relative alpha — may drift but better than nothing
        h = (360 - e.alpha) % 360;
      }
      if (h !== null && !Number.isNaN(h)) {
        setHeading(h);
        setDirIdx(headingToDirIdx(h));
        setCompassMode('live');
      }
    };
    handlerRef.current = onOrient;
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
    return true;
  };

  const startCompass = async () => {
    // 1. Secure context check — HTTPS or localhost only
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setCompassMode('insecure');
      return;
    }
    if (typeof DeviceOrientationEvent === 'undefined' &&
        typeof window.AbsoluteOrientationSensor === 'undefined') {
      setCompassMode('unsupported');
      return;
    }

    setCompassMode('asking');

    // 2. Try Generic Sensor API (Android Chrome modern path)
    const sensorOk = await tryGenericSensor();

    // 3. Always also wire DeviceOrientation as fallback / co-source
    //    (iOS handles permission here; result may set 'denied' which short-circuits)
    if (!sensorOk) {
      const orientOk = await tryDeviceOrientation();
      if (!orientOk) {
        setCompassMode('unsupported');
        return;
      }
    }

    // 4. Wait up to 5s for sensor warm-up (iOS may take 3-4s after permission grant)
    setTimeout(() => {
      setCompassMode(m => (m === 'asking' ? 'unsupported' : m));
    }, 5000);
  };

  const stopCompass = () => {
    if (handlerRef.current) {
      window.removeEventListener('deviceorientation', handlerRef.current);
      window.removeEventListener('deviceorientationabsolute', handlerRef.current);
      handlerRef.current = null;
    }
    if (sensorRef.current) {
      try { sensorRef.current.stop(); } catch (e) {}
      sensorRef.current = null;
    }
    setCompassMode('manual');
    setHeading(null);
  };

  const shichen = window.getShichen(now.getHours());
  const dayGZ = window.getDayGanZhi(now);
  const yueZ = window.getYueZhi(now);

  const cast = () => {
    if (dirIdx === null) return;
    if (!canCast) return; // 額度用盡 / gated by 60-min rule
    // 記錄這次起卦時戳到 localStorage（先記，避免使用者中途離開繞過上限）
    const castedAt = new Date();
    const newHistory = [...castHistory, castedAt];
    setCastHistory(newHistory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.map(d => d.toISOString())));
    } catch (e) {}
    // snapshot heading at cast time so it persists to result
    const snapHeading = heading;
    const snapMode = compassMode;
    // stop listener to save battery
    if (handlerRef.current) {
      window.removeEventListener('deviceorientation', handlerRef.current);
      window.removeEventListener('deviceorientationabsolute', handlerRef.current);
      handlerRef.current = null;
    }
    setStep('casting');
    // 把畫面對齊到占卜台，避免起卦後因為內容高度變化而跳到下一節
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    setTimeout(() => {
      const date = new Date();
      const dir = window.DIRS[dirIdx];
      const mh = window.meihua(date, dirIdx);
      const upperT = window.TRIGRAMS[mh.upper];
      const lowerT = window.TRIGRAMS[mh.lower];
      const hexKey = upperT.name + lowerT.name;
      const hex = window.HEXAGRAM_READ[hexKey] || {
        n: upperT.name + '上 ' + lowerT.name + '下',
        c: '平',
        say: '上卦為' + upperT.attr + '，下卦為' + lowerT.attr + '。今夜宜順其自然，所遇之人事皆有深意。',
      };
      const qHash = window.hashStr(question || '');
      // 問題進入種子：同人同時同方位、不同提問也會得到不同的牌與籤
      const seed = (date.getTime() % 100000) / 100000 + dirIdx * 0.013 + (qHash % 10000) / 100000;
      const tarot = window.drawTarot(seed);
      const num = window.numerology(date, dirIdx);
      const dGan = window.GAN[dayGZ.gan];
      const wuxing = window.GAN_WUXING[dayGZ.gan];
      const luckyColor = window.WUXING_COLOR[wuxing];
      const poolByTier = window.FORTUNES.filter(f => f.tier === hex.c);
      const pool = poolByTier.length ? poolByTier : window.FORTUNES;
      const poemIdx = (Math.floor(seed * pool.length * 7) + qHash) % pool.length;
      const poem = pool[poemIdx];
      const yiji = window.genYiJi(hex, tarot, qHash);

      // 六爻起卦：用問題雜湊 + 時間（毫秒）作種子，與梅花易數的時空之卦並列
      const lySeed = ((qHash >>> 0) ^ (date.getTime() & 0xffffffff)) >>> 0;
      const ly = window.liuyao(lySeed);
      const lyBenName = window.TRIGRAMS[ly.benUpper].name + window.TRIGRAMS[ly.benLower].name;
      const lyZhiName = window.TRIGRAMS[ly.zhiUpper].name + window.TRIGRAMS[ly.zhiLower].name;
      const lyBenHex = window.HEXAGRAM_READ[lyBenName];
      const lyZhiHex = ly.hasChange ? window.HEXAGRAM_READ[lyZhiName] : null;

      setResult({
        date, dir, mh, upperT, lowerT, hex, tarot, num, poem, yiji,
        shichen, shichenRange: window.SHICHEN_RANGE[shichen],
        dayGZ: dayGZ.label,
        yueZ, wuxing, luckyColor, question,
        heading: snapHeading, compassUsed: snapMode === 'live',
        liuyao: ly, lyBenHex, lyZhiHex,
      });
      setStep('result');
      // 結果出來時再對齊一次到占卜台頂部 — 等下一個 render cycle 結束、layout 穩定後再 scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }, 2600);
  };

  const reset = () => {
    setStep('setup');
    setResult(null);
    setDirIdx(null);
    setQuestion('');
  };

  const dateStr = now.toLocaleDateString('zh-TW', { year:'numeric', month:'long', day:'numeric', weekday:'long' });
  const timeStr = now.toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit', hour12:false });

  return (
    <section className="oracle" id="fortune" data-screen-label="08 Oracle" ref={sectionRef}>
      <div className="oracle-bg">
        <div className="ob-stars" />
        <div className="ob-grain" />
      </div>

      <div className="sec-head light">
        <span className="sec-kicker">WEDDING UNIVERSE · ORACLE OF THE MOMENT</span>
        <h2 className="sec-title">婚禮宇宙占卜台</h2>
        <p className="sec-sub">此刻的時辰、你所面向的方位、心中暗自默念的那件事，<br/>都會被這台占卜機收進去，給你一份屬於今夜的指引。</p>
      </div>

      {step === 'setup' && (
        <div className="oracle-setup">
          <div className="os-clock">
            <div className="osc-row">
              <span className="osc-k">當前時刻</span>
              <span className="osc-v">{dateStr} {timeStr}</span>
            </div>
            <div className="osc-row">
              <span className="osc-k">時辰</span>
              <span className="osc-v">{window.SHICHEN[shichen]} <em>· {window.SHICHEN_RANGE[shichen]}</em></span>
            </div>
            <div className="osc-row">
              <span className="osc-k">日干支</span>
              <span className="osc-v">{dayGZ.label} 日 <em>· {yueZ} 月</em></span>
            </div>
          </div>

          <div className="os-step">
            <div className="os-label"><span className="os-num">01</span>面朝何方</div>
            <div className="os-sub">此刻你所面對的方位將決定本卦的氣場。</div>

            <div className="compass-ctrl">
              {compassMode === 'manual' && (
                <button type="button" className="cmpc-btn" onClick={startCompass}>
                  <span className="cmpc-ic">⌖</span>
                  <span>讓羅盤為你指引 · 使用手機方位</span>
                </button>
              )}
              {compassMode === 'asking' && (
                <div className="cmpc-status">請允許方位存取…</div>
              )}
              {compassMode === 'live' && (
                <div className="cmpc-live">
                  <span className="cmpc-dot" />
                  <span>羅盤已啟動 · 當前{heading !== null ? Math.round(heading) + '°' : '--'}</span>
                  <button type="button" className="cmpc-stop" onClick={stopCompass}>關閉</button>
                </div>
              )}
              {compassMode === 'denied' && (
                <div className="cmpc-status cmpc-warn">方位權限未開啟 · 請手動點選方位</div>
              )}
              {compassMode === 'insecure' && (
                <div className="cmpc-status cmpc-warn">此頁面需透過 HTTPS 才能讀取方位 · 請手動點選</div>
              )}
              {compassMode === 'unsupported' && (
                <div className="cmpc-status cmpc-warn">此裝置不支援羅盤感應 · 請手動點選</div>
              )}
            </div>

            <div className="compass">
              <div className="compass-ring">
                <span className="compass-dot" />
                {heading !== null && (
                  <div
                    className="compass-needle"
                    style={{ transform: `translate(-50%, -100%) rotate(${heading}deg)` }}
                  >
                    <svg viewBox="0 0 20 160" width="20" height="160">
                      <path d="M10 4 L16 80 L10 74 L4 80 Z" fill="#a63f2a" stroke="#faf3e1" strokeWidth="0.8"/>
                      <path d="M10 156 L16 80 L10 86 L4 80 Z" fill="#5b3a22" opacity="0.5"/>
                    </svg>
                  </div>
                )}
                {window.DIRS.map((d, i) => {
                  const angle = i * 45 - 90;
                  const r = 55; // 按鈕中心放在圓環邊緣外少許，避免下方元素被擠壓
                  const x = 50 + Math.cos(angle * Math.PI/180) * r;
                  const y = 50 + Math.sin(angle * Math.PI/180) * r;
                  return (
                    <button
                      key={i}
                      className={`compass-pt ${dirIdx === i ? 'on' : ''}`}
                      style={{ left: x+'%', top: y+'%', '--c': d.color }}
                      onClick={() => setDirIdx(i)}
                      aria-label={`選擇 ${d.k} 方`}
                    >
                      <span className="cp-en">{d.en}</span>
                      <span className="cp-cn">{d.k}</span>
                    </button>
                  );
                })}
                <div className="compass-center">
                  {dirIdx !== null ? (
                    <>
                      <span className="cc-dir">{window.DIRS[dirIdx].k}</span>
                      <span className="cc-tri">{window.TRIGRAMS[window.DIRS[dirIdx].tri].sym}</span>
                      <span className="cc-mood">
                        {compassMode === 'live' && heading !== null
                          ? Math.round(heading) + '°'
                          : window.TRIGRAMS[window.DIRS[dirIdx].tri].mood}
                      </span>
                    </>
                  ) : (
                    <span className="cc-hint">點選方位</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="os-step">
            <div className="os-label"><span className="os-num">02</span>心中所問 · 選填</div>
            <div className="os-sub">不必打字也行；靜靜想著一件事，也能入卦。<br/>或從下方常見問卜中，挑一張讓你心動的。</div>
            <input
              className="os-input"
              value={question}
              onChange={e => setQuestion(e.target.value.slice(0, 60))}
              placeholder="自己打一句話　或點選下方卡片"
            />
            <div className="preset-q">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pq-card ${question === p.q ? 'on' : ''}`}
                  onClick={() => setQuestion(p.q)}
                >
                  <span className="pq-icon">{p.ic}</span>
                  <span className="pq-label">{p.q}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className={`os-cast ${(dirIdx === null || !canCast) ? 'disabled' : ''}`}
            onClick={cast}
            disabled={dirIdx === null || !canCast}
          >
            <span className="osc-t">起 卦</span>
            <span className="osc-s">CAST THE ORACLE</span>
          </button>
          <div className="os-quota">
            {remainingToday === 0 && '今日三卦已盡 · 明日請早'}
            {remainingToday > 0 && isGated && (
              <>下一卦 · <span className="osq-num">{fmtCountdown(msUntilGateOpens)}</span> 後再來</>
            )}
            {remainingToday > 0 && !isGated && remainingToday < DAILY_LIMIT && (
              <>今日剩餘 <span className="osq-num">{remainingToday}</span> 次</>
            )}
            {remainingToday === DAILY_LIMIT && '每人每日限 3 卦 · 用心一問'}
          </div>
        </div>
      )}

      {step === 'casting' && (
        <div className="oracle-casting">
          <div className="oc-glow" />
          <div className="oc-beam" />
          <div className="oc-ring oc-ring-1" />
          <div className="oc-ring oc-ring-2" />
          <div className="oc-ring oc-ring-3" />
          <div className="oc-particles">
            {Array.from({length: 12}).map((_, i) => (
              <span key={i} className="oc-particle" style={{'--i': i, '--angle': (i * 30) + 'deg'}} />
            ))}
          </div>
          <div className="oc-coins">
            <div className="oc-coin" style={{'--d':'0s'}}>☰</div>
            <div className="oc-coin" style={{'--d':'0.2s'}}>☷</div>
            <div className="oc-coin" style={{'--d':'0.4s'}}>☲</div>
          </div>
          <div className="oc-phase">
            <span className="ocp ocp-1">天 樞 轉 動</span>
            <span className="ocp ocp-2">地 軸 對 時</span>
            <span className="ocp ocp-3">卦 氣 凝 聚</span>
            <span className="ocp ocp-4">六 爻 成 象</span>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="oracle-result">
          {/* 此卜因緣 */}
          <div className="or-provenance">
            <div className="orp-row">
              <span className="orp-k">時</span>
              <span className="orp-v">{result.shichen !== undefined ? window.SHICHEN[result.shichen] : ''} · {result.shichenRange}</span>
            </div>
            <div className="orp-row">
              <span className="orp-k">日</span>
              <span className="orp-v">{result.dayGZ} · {result.yueZ}月 · 日主五行屬{result.wuxing}</span>
            </div>
            <div className="orp-row">
              <span className="orp-k">位</span>
              <span className="orp-v">面朝{result.dir.k}方 · 卦氣{window.TRIGRAMS[result.dir.tri].mood}{result.compassUsed && result.heading !== null ? ` · 羅盤 ${Math.round(result.heading)}°` : ''}</span>
            </div>
            {result.question && (
              <div className="orp-row orp-q">
                <span className="orp-k">問</span>
                <span className="orp-v">「{result.question}」</span>
              </div>
            )}
          </div>

          {/* 看不懂?  小百科 */}
          <div className={`or-gloss ${glossOpen ? 'open' : ''}`}>
            <button className="or-gloss-trigger" onClick={() => setGlossOpen(!glossOpen)}>
              <span>{glossOpen ? '收起說明' : '✦ 第一次玩 · 怎麼看這份占卜'}</span>
              <span className="orgl-arrow">{glossOpen ? '−' : '+'}</span>
            </button>
            {glossOpen && (
              <div className="or-gloss-body">
                <div className="orgl-row">
                  <span className="orgl-k">本卦</span>
                  <span className="orgl-v">由你提問當下的<b>時辰</b>跟<b>方位</b>推算——可以想成是「<b>此刻天地的氣場</b>」。</span>
                </div>
                <div className="orgl-row">
                  <span className="orgl-k">六爻</span>
                  <span className="orgl-v">用你的<b>問題</b>當種子，模擬擲銅錢六次得到的卦——「<b>你心裡這道題的答案</b>」。出現「動爻」表示這件事正在變化中。</span>
                </div>
                <div className="orgl-row">
                  <span className="orgl-k">幸運色 · 五行</span>
                  <span className="orgl-v">今夜的能量配方，看當作小護身符就好。</span>
                </div>
                <div className="orgl-row">
                  <span className="orgl-k">籤詩</span>
                  <span className="orgl-v">四句古體小詩，配合卦象從詩集裡抽出。<b>看意境就好，不用逐字解。</b></span>
                </div>
                <div className="orgl-foot">看不懂沒關係——挑你<b>心裡有感覺</b>的那一句，就是今夜的答案。</div>
              </div>
            )}
          </div>

          {/* 本卦 */}
          <div className="or-hex">
            <div className="or-sec-k">本卦</div>
            <div className="or-hex-stage">
              <div className="orhs-tri orhs-upper">
                <div className="orhst-sym">{result.upperT.sym}</div>
                <div className="orhst-info">
                  <span>上卦 · {result.upperT.name}</span>
                  <em>{result.upperT.attr} · {result.upperT.elem}</em>
                </div>
              </div>
              <div className="orhs-name">
                <span className="orhsn-cn">{result.hex.n}</span>
                <span className={`orhsn-tier tier-${result.hex.c}`}>{result.hex.c}</span>
              </div>
              <div className="orhs-tri orhs-lower">
                <div className="orhst-sym">{result.lowerT.sym}</div>
                <div className="orhst-info">
                  <span>下卦 · {result.lowerT.name}</span>
                  <em>{result.lowerT.attr} · {result.lowerT.elem}</em>
                </div>
              </div>
            </div>
            <p className="or-hex-read">{result.hex.say}</p>
            <div className="or-yao">梅花易數 · 動爻在第 {result.mh.movingYao} 爻 · 變化之機藏於此處</div>
          </div>

          {/* 六爻親卜 */}
          {result.liuyao && (
            <div className="or-liuyao">
              <div className="or-sec-k">六爻 · 親卜</div>
              <div className="orly-stack">
                {result.liuyao.yaos.slice().reverse().map((v, i) => {
                  const yaoIdx = 6 - i; // top is yao 6
                  const isYang = (v === 7 || v === 9);
                  const isMoving = (v === 6 || v === 9);
                  const label = v === 6 ? '老陰' : v === 7 ? '少陽' : v === 8 ? '少陰' : '老陽';
                  return (
                    <div key={i} className={`orly-row ${isMoving ? 'on' : ''}`}>
                      <span className="orly-n">{['初','二','三','四','五','上'][yaoIdx-1]}</span>
                      <div className="orly-bar">
                        {isYang ? (
                          <span className="orly-yang" />
                        ) : (
                          <><span className="orly-yin" /><span className="orly-yin" /></>
                        )}
                      </div>
                      <span className="orly-lbl">{label}</span>
                      {isMoving && <span className="orly-mark">動 →</span>}
                    </div>
                  );
                })}
              </div>
              <div className="orly-name">
                <div className="orlyn-pair">
                  <div className="orlyn-side">
                    <div className="orlyn-side-k">本卦</div>
                    <div className="orlyn-side-v">{result.lyBenHex ? result.lyBenHex.n : ''}</div>
                    {result.lyBenHex && <div className={`orlyn-tier tier-${result.lyBenHex.c}`}>{result.lyBenHex.c}</div>}
                  </div>
                  {result.liuyao.hasChange && (
                    <>
                      <div className="orlyn-arrow">變</div>
                      <div className="orlyn-side">
                        <div className="orlyn-side-k">之卦</div>
                        <div className="orlyn-side-v">{result.lyZhiHex ? result.lyZhiHex.n : ''}</div>
                        {result.lyZhiHex && <div className={`orlyn-tier tier-${result.lyZhiHex.c}`}>{result.lyZhiHex.c}</div>}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {result.lyBenHex && (
                <p className="or-liuyao-read">{result.lyBenHex.say}</p>
              )}
              {result.liuyao.hasChange && result.lyZhiHex && (
                <p className="or-liuyao-read or-liuyao-zhi">
                  變至「{result.lyZhiHex.n}」——{result.lyZhiHex.say}
                </p>
              )}
              {!result.liuyao.hasChange && (
                <p className="or-liuyao-read or-liuyao-static">無動爻——此刻氣場安靜，所卜之事如卦象所示，不需變動。</p>
              )}
            </div>
          )}

          {/* 幸運色 · 五行 */}
          <div className="or-bonus">
            <div className="orb-cell">
              <div className="orb-k">幸運色</div>
              <div className="orb-v orb-color" style={{background: result.luckyColor.hex}} />
              <div className="orb-hint">{result.luckyColor.name}</div>
            </div>
            <div className="orb-cell">
              <div className="orb-k">五行</div>
              <div className="orb-v orb-wuxing">{result.wuxing}</div>
              <div className="orb-hint">今日日主氣場</div>
            </div>
          </div>

          {/* 籤詩 */}
          <div className="or-poem">
            <div className="or-sec-k">籤詩 · {result.poem.title}</div>
            <div className="orp-scroll">
              {result.poem.poem.map((l,i) => <div key={i}>{l}</div>)}
            </div>
            <p className="or-poem-read">{result.poem.read}</p>
          </div>

          {/* 合參 */}
          <div className="or-summary">
            <div className="ors-deco">· 合 參 ·</div>
            <p>
              {buildSummary(result)}
            </p>
            <div className="ors-sign">Moon ♡ Vesta · Wedding Oracle · {result.date.toLocaleString('zh-TW', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false})}</div>
          </div>

          <button className="or-again" onClick={reset}>再卜一卦 ✦</button>
        </div>
      )}
    </section>
  );
}

function buildSummary(r) {
  const parts = [];
  parts.push(`此刻${window.SHICHEN[r.shichen]}已至，你朝${r.dir.k}而立，卦得「${r.hex.n}」。`);
  parts.push(`${r.hex.say.replace(/。$/, '')}；`);
  if (r.liuyao) {
    if (r.liuyao.hasChange && r.lyZhiHex) {
      parts.push(`六爻所得「${r.lyBenHex ? r.lyBenHex.n : ''}」，動爻 ${r.liuyao.moving.length} 位，將轉「${r.lyZhiHex.n}」——心中所問，正在變動之中。`);
    } else if (r.lyBenHex) {
      parts.push(`六爻所得「${r.lyBenHex.n}」，無動爻——此刻氣場已定，所問之事如卦象所示。`);
    }
  }
  parts.push(`配今日${r.wuxing}氣，宜衣${r.luckyColor.name}為飾。`);
  if (r.question) parts.push(`所問「${r.question}」，答案已留在你今夜的步履之間。`);
  return parts.join('');
}

// 極簡塔羅符號（每張不同）
function TarotGlyph({ name }) {
  const map = {
    '愚者': <svg viewBox="0 0 60 60"><circle cx="30" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M20 42 Q30 30 40 42 L44 52 L16 52 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="30" cy="20" r="2" fill="currentColor"/></svg>,
    '魔術師': <svg viewBox="0 0 60 60"><path d="M30 10 L30 50 M15 25 L45 25 M15 40 L45 40" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="30" cy="10" r="3" fill="currentColor"/></svg>,
    '女祭司': <svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="16" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M30 14 L30 46 M14 30 L46 30" stroke="currentColor" strokeWidth="1"/></svg>,
    '女皇': <svg viewBox="0 0 60 60"><path d="M20 20 Q30 5 40 20 L38 45 L22 45 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="30" cy="15" r="2" fill="currentColor"/></svg>,
    '皇帝': <svg viewBox="0 0 60 60"><rect x="18" y="18" width="24" height="30" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M15 18 L45 18 L42 12 L18 12 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    '教皇': <svg viewBox="0 0 60 60"><path d="M30 10 L30 50 M22 20 L38 20 M22 32 L38 32" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="30" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    '戀人': <svg viewBox="0 0 60 60"><path d="M30 48 C20 38 12 30 12 22 C12 16 16 12 22 12 C26 12 28 14 30 18 C32 14 34 12 38 12 C44 12 48 16 48 22 C48 30 40 38 30 48 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    '戰車': <svg viewBox="0 0 60 60"><rect x="14" y="22" width="32" height="18" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="20" cy="46" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="40" cy="46" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    '力量': <svg viewBox="0 0 60 60"><path d="M15 40 Q30 20 45 40" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="30" cy="25" r="3" fill="currentColor"/><path d="M26 30 Q30 35 34 30" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>,
    '隱者': <svg viewBox="0 0 60 60"><path d="M30 12 L18 48 L42 48 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="42" cy="26" r="3" fill="currentColor"/></svg>,
    '命運之輪': <svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="18" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M30 12 L30 48 M12 30 L48 30 M17 17 L43 43 M17 43 L43 17" stroke="currentColor" strokeWidth="1"/></svg>,
    '正義': <svg viewBox="0 0 60 60"><path d="M30 10 L30 50 M15 20 L45 20" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="18" cy="32" r="5" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="42" cy="32" r="5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>,
    '吊人': <svg viewBox="0 0 60 60"><path d="M15 15 L45 15 M30 15 L30 35" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="30" cy="40" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M30 45 L26 52 M30 45 L34 52" stroke="currentColor" strokeWidth="1.5"/></svg>,
    '死神': <svg viewBox="0 0 60 60"><circle cx="30" cy="25" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="26" cy="24" r="1.5" fill="currentColor"/><circle cx="34" cy="24" r="1.5" fill="currentColor"/><path d="M26 30 L34 30 M20 40 L40 40 L40 50 L20 50 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    '節制': <svg viewBox="0 0 60 60"><path d="M22 18 L22 32 L18 42 L42 42 L38 32 L38 18 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M30 18 Q26 28 30 36 Q34 28 30 18" stroke="currentColor" strokeWidth="1" fill="none"/></svg>,
    '惡魔': <svg viewBox="0 0 60 60"><path d="M20 20 L16 10 M40 20 L44 10" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="30" cy="28" r="12" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="26" cy="26" r="1.5" fill="currentColor"/><circle cx="34" cy="26" r="1.5" fill="currentColor"/><path d="M25 34 Q30 38 35 34" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>,
    '塔': <svg viewBox="0 0 60 60"><rect x="22" y="18" width="16" height="32" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M22 18 L30 8 L38 18" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M15 15 L20 20 M45 15 L40 20" stroke="currentColor" strokeWidth="1"/></svg>,
    '星星': <svg viewBox="0 0 60 60"><path d="M30 10 L34 24 L48 26 L36 34 L40 48 L30 40 L20 48 L24 34 L12 26 L26 24 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    '月亮': <svg viewBox="0 0 60 60"><path d="M40 30 C40 20 32 12 22 14 C30 18 34 24 34 32 C34 40 30 46 22 50 C32 52 40 44 40 30 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    '太陽': <svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><g stroke="currentColor" strokeWidth="1.5"><path d="M30 10 L30 16 M30 44 L30 50 M10 30 L16 30 M44 30 L50 30 M16 16 L20 20 M40 40 L44 44 M44 16 L40 20 M16 44 L20 40"/></g></svg>,
    '審判': <svg viewBox="0 0 60 60"><path d="M18 20 L42 20 L50 12 L50 28 L10 28 L10 12 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M30 28 L30 48 M22 48 L38 48" stroke="currentColor" strokeWidth="1.5"/></svg>,
    '世界': <svg viewBox="0 0 60 60"><ellipse cx="30" cy="30" rx="18" ry="22" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M12 30 L48 30 M30 10 L30 50" stroke="currentColor" strokeWidth="1"/></svg>,
  };
  return map[name] || <svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>;
}

Object.assign(window, { Oracle });
