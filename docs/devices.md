


----------------------------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| iPhone Modell(e)											| Typische max-width Media Query		| Typische max-height Media Query		| Bemerkung / Release								|
----------------------------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| iPhone 17 Pro Max, iPhone 16 Pro Max						| @media (max-width: 440px)				| @media (max-height: 956px)			| Größtes Modell 2024/2025							|
| iPhone 16 Plus / 15 Plus / 15 Pro Max / 14 Pro Max		| @media (max-width: 430px)				| @media (max-height: 932px)			| Große Plus/Pro Max 2022–2024						|
| iPhone 17 Air												| @media (max-width: 420px)				| @media (max-height: 912px)			| 2025 Neuheit (dünnes Modell)						|
| iPhone 17 / 17 Pro / 16 Pro								| @media (max-width: 402px)				| @media (max-height: 874px)			| 2025 Basis/Pro-Modelle							|
| iPhone 15 / 15 Pro / 14 / 13 Pro / 13 / 12 Pro etc.		| @media (max-width: 414px) oder 393px	| @media (max-height: 852px)			| Sehr verbreitet 2021–2023 (Standard 6.1")			|
| iPhone 16 / 16e / iPhone SE (4. Gen) / viele 14/15/13/12	| @media (max-width: 390px)				| @media (max-height: 844px)			| Standard 6.1" 2024–2025 (inkl. SE 2025)			|
| iPhone 13 mini / 12 mini / iPhone 11 Pro / XS				| @media (max-width: 375px) oder 360px	| @media (max-height: 812px)			| Kleinere Modelle 2019–2021 (5.4–5.8")				|
| iPhone SE (3. Gen), iPhone 8/7/6s / iPhone 11 / XR		| @media (max-width: 375px)				| @media (max-height: 812px) oder 667px	| Ältere / kleine Modelle (4.7–6.1" Home-Button)	|
| iPhone SE (1./2. Gen) / iPhone 5/4						| @media (max-width: 320px)				| @media (max-height: 568px)			| Sehr alte Modelle									|
----------------------------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------- |

Hinweis: Stand März 2026 – logische CSS-Pixel (device-width / dpr).
Viele Modelle teilen dieselben Breakpoints (z. B. 390 px für fast alle 6.1"-Geräte seit iPhone 12).
iPhone SE (4. Gen) 2025 nutzt 390 × 844 px wie iPhone 16 / 16e.

| ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------- | --------------------------------------------- |
| Samsung Galaxy Modell(e)								| Typische max-width Media Query					| Typische max-height Media Query		| Bemerkung / Release							|
| ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------- | --------------------------------------------- |
| Galaxy S25 Ultra / S24 Ultra / S23 Ultra				| @media (max-width: 412px)							| @media (max-height: 891px)			| Ultra-Modelle 2023–2025 (QHD+, ~3.5x DPR)		|
| Galaxy S25+ / S24+ / S23+								| @media (max-width: 412px)							| @media (max-height: 891px)			| Plus-Modelle 2023–2025 (breit, oft 412 px)	|
| Galaxy Z Flip6 / Z Flip5								| @media (max-width: 393px)							| @media (max-height: 960px)			| Cover-Screen Foldable 2024–2025				|
| Galaxy Z Fold6 (Cover) / Fold5 Cover					| @media (max-width: 323px) oder 393px				| @media (max-height: 792px)			| Foldable Cover-Display (kleiner)				|
| Galaxy Z Fold6 (Main unfolded) / Fold5 unfolded		| @media (min-width: 600px) und (max-width: 640px)	| @media (max-height: 720px)			| Unfolded Haupt-Display (tablet-ähnlich)		|
| Galaxy S25 / S24 / S23 / S22							| @media (max-width: 360px)							| @media (max-height: 780px)			| Basis-Flagships 2023–2025 (FHD+, ~3x DPR)		|
| Galaxy A56 / A55 / A54 / viele Mid-Range 2024–2026	| @media (max-width: 360px) oder 393px				| @media (max-height: 780px) oder 854px	| Sehr verbreitete A-Serie Mid-Range			|
| Galaxy S22 Ultra / S21 Ultra / Note 20 Ultra			| @media (max-width: 384px) oder 412px				| @media (max-height: 824px) oder 869px	| Ältere Ultra-Modelle 2020–2022				|
| Galaxy A35 / A34 / A54 / A14 / Budget 2022–2025		| @media (max-width: 360px) oder 412px				| @media (max-height: 800px) oder 915px	| Günstige A-Serie Modelle						|
| Galaxy S20 / S10 / Note 10 / ältere Flagships			| @media (max-width: 360px) oder 412px				| @media (max-height: 740px) oder 800px	| Ältere Modelle 2019–2021						|
| Galaxy A10 / A20 / sehr günstige / alte Modelle		| @media (max-width: 360px) oder 320px				| @media (max-height: 720px) oder 640px	| Sehr alte / kleine Modelle					|
| ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------- | --------------------------------------------- |

Hinweis: Stand März 2026 – logische CSS-Pixel (Viewport = physische Auflösung / DPR).
Die meisten Samsung-Geräte nutzen 360 px oder 412 px.
Höhen sind indikativ (Browser-UI, Punch-Hole, Nav-Bar variieren stark).
Foldables brauchen oft extra Queries für Cover vs. Main.

***

Gängigste / empfohlene Breakpoints für moderne responsive CSS-Entwicklung
(Stand 2026, basierend auf aktuellen Best Practices, Statcounter-Daten,
Tailwind/Bootstrap-Trends und content-driven Ansätzen)

------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- | --------------------------------------------- |
| Breakpoint / Gerätetyp								| Typische max-width Media Query			| Typische max-height Media Query		| Bemerkung / Release (2025/2026 Best Practice)			|
------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- | --------------------------------------------- |
| Sehr kleine Phones (alte SE, günstige Android)		| @media (max-width: 360px)					| @media (max-height: 640px) oder 720px	| Häufigster Android-Basiswert (~10% global)			|
| Standard-Smartphones (iPhone 14–17, viele Android)	| @media (max-width: 390px) oder 414px		| @media (max-height: 844px) oder 852px	| Meistgenutzt: 390×844 & 393×852 px (iPhone + Pixel)	|
| Größere Phones / Phablets (Plus/Pro Max, Ultra)		| @media (max-width: 430px) oder 440px		| @media (max-height: 932px) oder 956px	| Große Modelle 2023–2026 (iPhone Pro Max, Galaxy Ultra)|
| Kleines Tablet / Landscape Phone						| @media (max-width: 768px)					| @media (max-height: 1024px)			| iPad Portrait, viele Tablets 2024+					|
| Standard-Tablet / kleines Desktop						| @media (max-width: 1024px)				| @media (max-height: 1366px)			| iPad Landscape, kleine Laptops						|
| Großer Desktop / Full-HD								| @media (max-width: 1280px)				| @media (max-height: 1440px)			| Standard-Laptops & Monitore							|
| Extra groß / 4K-Monitore								| @media (max-width: 1536px) oder 1920px	| @media (max-height: 2160px)			| Große Bildschirme, optional für sehr breite Layouts	|
------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- | --------------------------------------------- |

Hinweis: Stand März 2026 – das sind **keine** device-spezifischen Werte mehr,
sondern **inhaltsgetriebene / statistisch häufige Breakpoints**.
Mobile-first mit **min-width** ist State-of-the-Art (nicht max-width von groß nach klein).
Die meisten Projekte brauchen nur 3–4 davon.

***

| Meine Geräte |

| ----------------------------- | ----------------------------------------------------------------
| 					  	   	  	| Display		Viewport	Edge	Chrome	Opera	Safari	Firefox	
| ----------------------------- | ----------------------------------------------------------------
| Lenovo Yoga 2-8				| 1920x1200
| Samsung Galaxy A34 5G			| 1080x2340
| Xiaomi Redmi Note 8 (2021)	| 1080x2340	
| Xiaomi Redmi 13				| 1080x2460
| i-Phone 7						| 750x1334	
| ----------------------------- | ----------------------------------------------------------------

***

| Frontend Debug Devices (2026) |

| Smartphones |

| ------------------------ | ------- | ----------------- | -------- | --- | --------------------- |
| Device                   | Browser | Screen Resolution | Viewport | DPR | Notes                 |
| ------------------------ | ------- | ----------------- | -------- | --- | --------------------- |
| iPhone SE (2nd gen)      | Safari  | 750×1334          | 375×667  | 2   | Small-screen baseline |
| iPhone 13 / 14           | Safari  | 1170×2532         | 390×844  | 3   | Common iOS reference  |
| iPhone 15 Pro            | Safari  | 1179×2556         | 393×852  | 3   | Dynamic Island        |
| Pixel 7                  | Chrome  | 1080×2400         | 412×915  | 2.6 | Android baseline      |
| Pixel 8 Pro              | Chrome  | 1344×2992         | 448×998  | 3   | Large Android         |
| Samsung Galaxy S23       | Chrome  | 1080×2340         | 360×780  | 3   | Narrow Android        |
| Samsung Galaxy S23 Ultra | Chrome  | 1440×3088         | 412×915  | 3.5 | Tall viewport         |
| ------------------------ | ------- | ----------------- | -------- | --- | --------------------- |


| Tablets |

| --------------------- | ------- | --------- | --------- | --- | ------------------- |
| Device                | Browser | Screen    | Viewport  | DPR | Notes               |
| --------------------- | ------- | --------- | --------- | --- | ------------------- |
| iPad (10th gen)       | Safari  | 1640×2360 | 820×1180  | 2   | Tablet baseline     |
| iPad Air              | Safari  | 1640×2360 | 820×1180  | 2   | Same layout as iPad |
| iPad Pro 11"          | Safari  | 1668×2388 | 834×1194  | 2   | Large tablet        |
| iPad Pro 12.9"        | Safari  | 2048×2732 | 1024×1366 | 2   | Desktop-like layout |
| Samsung Galaxy Tab S9 | Chrome  | 1600×2560 | 800×1280  | 2   | Android tablet      |
| --------------------- | ------- | --------- | --------- | --- | ------------------- |

| Laptops |

| -------------------- | ------- | --------- | ---------- | --- | ------------------------ |
| Device               | Browser | Screen    | Viewport   | DPR | Notes                    |
| -------------------- | ------- | --------- | ---------- | --- | ------------------------ |
| MacBook Air 13"      | Safari  | 2560×1664 | ~1280×800  | 2   | Retina scaling           |
| MacBook Pro 14"      | Safari  | 3024×1964 | ~1512×982  | 2   | Common dev machine       |
| Windows Laptop 1080p | Chrome  | 1920×1080 | ~1920×969  | 1   | Scrollbar reduces height |
| Windows Laptop 1440p | Chrome  | 2560×1440 | ~2560×1329 | 1   | Large laptop             |
| -------------------- | ------- | --------- | ---------- | --- | ------------------------ |

| Desktop Monitors |

| -------------- | ----------------- | ---------------- | --- | ------------------- |
| Monitor        | Screen Resolution | Typical Viewport | DPR | Notes               |
| -------------- | ----------------- | ---------------- | --- | ------------------- |
| Standard 1080p | 1920×1080         | ~1920×969        | 1   | Most common desktop |
| 1440p Monitor  | 2560×1440         | ~2560×1329       | 1   | Developer setups    |
| 4K Monitor     | 3840×2160         | ~3840×2060       | 1–2 | HiDPI scaling       |
| Ultrawide      | 3440×1440         | ~3440×1320       | 1   | Marketing sites     |
| -------------- | ----------------- | ---------------- | --- | ------------------- |

| Responsive Breakpoints |

| ------------- | ------ |
| Name          | Width  |
| ------------- | ------ |
| Small mobile  | 360px  |
| Mobile        | 390px  |
| Large mobile  | 414px  |
| Tablet        | 768px  |
| Laptop        | 1024px |
| Desktop       | 1280px |
| Large desktop | 1536px |
| ------------- | ------ |
