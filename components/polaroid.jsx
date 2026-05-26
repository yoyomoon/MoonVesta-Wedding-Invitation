// Love Letter · 給賓客的一封信（表層）+ 給她的暗門（裡層 · 0228 解鎖）
function LoveLetter() {
  const [opened, setOpened] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(null); // null | 'prompt' | 'open'
  const [code, setCode] = React.useState('');
  const [wrong, setWrong] = React.useState(false);
  const SECRET_KEY = '0228';

  const submitCode = () => {
    if (code === SECRET_KEY) {
      setShowSecret('open');
      setWrong(false);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 800);
    }
  };
  const handleKey = (e) => {
    if (e.key === 'Enter') submitCode();
    if (e.key === 'Escape') closeSecret();
  };
  const closeSecret = () => { setShowSecret(null); setCode(''); setWrong(false); };

  return (
    <section className="letter" data-screen-label="10 Letter">
      <div className="sec-head light">
        <span className="sec-kicker">A LOVE NOTE</span>
        <h2 className="sec-title">給你的一封信</h2>
        <p className="sec-sub">點開信封，裡面有話對你說。</p>
      </div>
      <div className="envelope-stage">
        <div className={`envelope ${opened?'open':''}`} onClick={() => setOpened(!opened)}>
          <div className="env-back"></div>
          <div className="env-flap"></div>
          <div className="env-front"></div>
          <div className="env-letter">
            <div className="el-inner">
              <div className="el-head">
                <span>親愛的你</span>
                <span className="el-date">2026 · 06 · 13</span>
              </div>
              <p>謝謝你願意打開這封信。</p>
              <p>我們等這一天，<br/>等了很久。</p>
              <p>能在這裡看見你，<br/>是這一天最重要的事。</p>
              <div className="el-sign">
                <span>—</span>
                <span className="el-name">Moon &amp; Vesta</span>
              </div>
            </div>
          </div>
          <div className="env-seal">♡</div>
        </div>
        <div className="env-hint">{opened ? '再點一次收起信件' : '點擊信封 · tap to open'}</div>
        {opened && (
          <button
            className="letter-secret-trigger"
            onClick={(e) => { e.stopPropagation(); setShowSecret('prompt'); }}
            aria-label="一扇只為一個人開的門"
            title=" "
          >✦</button>
        )}
      </div>

      {showSecret === 'prompt' && (
        <div className="secret-overlay" onClick={closeSecret}>
          <div className="secret-prompt" onClick={e => e.stopPropagation()}>
            <div className="sp-deco">· · ·</div>
            <div className="sp-title">這扇門，是為一個人開的</div>
            <div className="sp-sub">如果妳是那個人——<br/>輸入妳會懂的那四個數字。</div>
            <input
              className={`sp-input ${wrong ? 'shake' : ''}`}
              autoFocus
              type="tel"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKey}
              placeholder="· · · ·"
            />
            <div className="sp-hint-wrong">{wrong ? '再想想——妳一輸入就會懂。' : ''}</div>
            <button className="sp-submit" onClick={submitCode}>打 開</button>
            <button className="sp-close" onClick={closeSecret}>不是現在</button>
          </div>
        </div>
      )}

      {showSecret === 'open' && (
        <div className="secret-overlay" onClick={closeSecret}>
          <div className="secret-letter" onClick={e => e.stopPropagation()}>
            <button className="sl-close" onClick={closeSecret} aria-label="收起">✕</button>
            <div className="sl-head">
              <span className="sl-to">給 慧汶</span>
              <span className="sl-date">2026 · 06 · 13</span>
            </div>
            <p>那一段 9 分鐘，我當時沒接住。<br/><br/>那段錄音留在我手機裡留了三年。<br/>想點開、又把手指收回來；<br/>想刪掉、又下不了手。<br/>直到很後來——<br/>我才有勇氣把它聽完。<br/><br/>妳最後那兩個字「謝謝」，<br/>比我這幾年講過的所有對不起，<br/>都還要重。</p>
            <p>2024，我最爛的那一年。<br/><br/>妳每天送我出門前、<br/>門關上之前，<br/>都先替我擠出一個笑。<br/><br/>那個笑我當下沒敢說——<br/>其實，比妳以為的還要痛。<br/>可妳還是擠了。<br/>擠了快一整年。</p>
            <p>妳的愛，我過了十六年才看見。<br/><br/>不是我笨。<br/>是我以前以為，<br/>愛要很響、很大、很轟轟烈烈才算數。<br/><br/>後來才懂——<br/>妳把自己壓低低的、還在替我笑的那個樣子，<br/>本來就是了。</p>
            <p className="sl-emph">這次，換我。<br/>換我長成妳能靠的形狀。<br/><br/>妳不用再為我，<br/>把自己折一遍又一遍。</p>
            <p className="sl-emph">6/13 不是巧合，是我選的。<br/><br/>2023 年那一天，<br/>是我那年笑得最開心的一天。<br/>我想把那一天——<br/>變成這輩子的永久版本。<br/><br/>往後每一個 6/13，<br/>換我替妳，擠一個真的笑。</p>
            <div className="sl-sign">
              <span>——</span>
              <span className="sl-name">妳的 文揚</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

Object.assign(window, { LoveLetter });
