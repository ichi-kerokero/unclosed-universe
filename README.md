# 閉じない宇宙

Hat（13角形の非周期モノタイル）を、H/T/P/Fメタタイル置換が定める正規位置だけへ置いて探索するCanvas 2Dアプリです。

## 起動

Windowsでは、プロジェクト直下の `閉じない宇宙を起動.cmd` をダブルクリックすると、ローカルサーバーを起動してブラウザーを開けます。

`index.html` を直接ダブルクリックして `file:///.../index.html` として開くことはできません。Viteアプリは必ず `http://127.0.0.1:4173/` のようなローカルHTTP URLから開いてください。

ターミナルから起動する場合：

```powershell
pnpm install
pnpm dev
```

ChromeまたはEdgeでViteが表示したローカルURLを開きます。

## 操作

- Hat内部をドラッグ: 移動
- Hat外周からドラッグ: 連続回転
- ダブルクリック／ダブルタップ: 鏡像反転
- Shift+ドラッグ、右ドラッグ、中ドラッグ: カメラパン
- ホイール: カーソル中心ズーム
- 7秒間の有効操作後: 最寄りの正規候補を一つだけ表示

進行、Undo（直近10件）、カメラ、音量はIndexedDBへ自動保存されます。

## 数学とライセンス

数学コアはSmith–Myers–Kaplan–Goodman-StraussのH/T/P/F構成と、Craig S. Kaplanの公式参照実装 `isohedral/hatviz` を参照しています。翻案部分のBSD 3-Clause表示は [NOTICE.md](./NOTICE.md) と `public/licenses/hatviz-BSD-3-Clause.txt` にあります。
