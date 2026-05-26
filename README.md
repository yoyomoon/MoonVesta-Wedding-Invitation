# Moon ♡ Vesta · 電子喜帖

2026 年 6 月 13 日 · 桃園川門子時尚餐廳

Wedding invitation site — built as a static React (Babel standalone) page.

## 線上預覽

部署到 GitHub Pages 後，公開網址為：
`https://yoyomoon.github.io/MoonVesta-Wedding-Invitation/`

## 本機開發

```bash
# 簡單 HTTP（電腦看沒問題、手機 compass 不會 work）
python3 _serve.py 8080

# HTTPS（首次會自動產 self-signed cert，手機 compass 可運作）
python3 _serve.py --https
```

## 檔案結構

```
.
├── index.html             # 入口 + App 組裝
├── styles.css             # 所有樣式
├── components/
│   ├── data.jsx           # 婚禮資料 / 故事 / 卦象 / 籤詩
│   ├── hero.jsx           # Hero + Countdown + Details
│   ├── story.jsx          # OUR STORY 四章 + Gallery
│   ├── interactive.jsx    # Schedule / Pets / FAQ / Footer
│   ├── oracle.jsx         # 婚禮宇宙占卜台（梅花易數 + 六爻）
│   └── polaroid.jsx       # Love Letter（含 0228 暗門）
└── assets/                # 圖片資源
```

## License

私人用途 · 所有照片版權屬本人所有。
