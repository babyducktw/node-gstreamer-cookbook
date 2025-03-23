---
sidebar_position: 2
---

# GObject 與 Node-Gtk

## GObject

GStreamer 雖然是用 C 語言寫的，但是 GStreamer 提供了 GObject API。

簡單的說 你可以用任何語言透過 GObject API 調用 GSteramer 的程式碼。

也因為實際上調用的是 C 的程式碼，所以了解 GObject 是如何運作的是必要的

例如你會需要在某些地方自己管理記憶體 (`GObject.unref()`)。儘管你的程式碼是用 JavaScript 寫的。

GObject 官方教學文檔: [https://docs.gtk.org/gobject/tutorial.html](https://docs.gtk.org/gobject/tutorial.html)。

## Node-Gtk

JavaScript 調用 GObject API 有兩個主要的庫：[GJS](https://gitlab.gnome.org/GNOME/gjs) 和 [node-gtk](https://github.com/romgrk/node-gtk)。

這兩個庫分別對應了兩個不同的 JavaScript 執行環境

GJS 是 GNOME 的 JavaScript 執行環境, 常用於 GNOME 桌面環境的應用程式開發。

node-gtk 則是對應常見的 Node.js 環境。我們這裡只討論 node-gtk。

## GObject Introspection Repository (GIR)

GIR 是用來橋接原生 C 語言函式庫的中介層。

GIR 會將原生 C 語言函式庫的 API 轉換成一個 XML 文件 (.gir) 或二進制文件 (.typelib)。
類似於 TypeScript 的 .d.ts 文件。

[ts-for-gir](https://github.com/gjsify/ts-for-gir) 這個庫可以將 GIR 文件轉換成 TypeScript 類型定義文件。
讓 TypeScript 環境下調用 GObject API 就變得更加容易。

ts-for-gir 也有分為 GJS 和 Node-Gtk 兩個版本。而目前最新的 ts-for-gir 4.x 只支援 GJS 版本的 GIR 文件。
所以我們會用 [gir-to-ts 3.x](https://github.com/gjsify/ts-for-gir/tree/3.x)。
